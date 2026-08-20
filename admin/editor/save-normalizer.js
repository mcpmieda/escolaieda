(() => {
  const API_PREFIX = "https://api.github.com/repos/mcpmieda/escolaieda";
  const INDEX_PATH = "index.html";
  const REGION_IDS = ["topbar", "inicio", "sobre", "numeros", "informacoes", "avisos", "destaques", "documentos", "contato"];
  const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  const INLINE_TAGS = new Set(["a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "em", "i", "img", "label", "mark", "small", "span", "strong", "sub", "sup", "time"]);

  const state = {
    baselineHtml: "",
    baselineCss: "",
    baselineCaptured: false
  };

  const grapes = window.grapesjs;
  if (!grapes?.init) return;

  const originalInit = grapes.init.bind(grapes);
  grapes.init = function initWithSafeBaseline(config = {}) {
    const editor = originalInit(config);
    const capture = () => {
      if (state.baselineCaptured) return;
      state.baselineHtml = editor.getHtml?.() || "";
      state.baselineCss = editor.getCss?.() || "";
      state.baselineCaptured = Boolean(state.baselineHtml);
    };
    editor.on?.("load", () => queueMicrotask(capture));
    window.setTimeout(capture, 0);
    return editor;
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function safeEditorSaveFetch(input, init = {}) {
    const url = typeof input === "string" || input instanceof URL ? String(input) : input?.url;
    const method = String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();

    if (url?.startsWith(API_PREFIX) && url.endsWith("/git/blobs") && method === "POST") {
      const body = parseJsonBody(init.body);
      if (body?.encoding === "utf-8" && looksLikeHomeHtml(body.content)) {
        const normalized = await buildSafeHomeHtml(body.content, init.headers);
        const nextInit = { ...init, body: JSON.stringify({ ...body, content: normalized }) };
        return originalFetch(input, nextInit);
      }
    }

    return originalFetch(input, init);
  };

  async function buildSafeHomeHtml(generatedHtml, requestHeaders) {
    if (!state.baselineCaptured || !state.baselineHtml) {
      throw new Error("EDITOR_BASELINE_AUSENTE");
    }

    const branch = window.__IEDA_GITHUB_TARGET__?.branch || "main";
    const canonical = await fetchCanonicalHome(branch, requestHeaders);
    const baselineDoc = parseBodyFragment(state.baselineHtml);
    const finalDoc = new DOMParser().parseFromString(generatedHtml, "text/html");
    let result = canonical;

    const baselineMain = baselineDoc.querySelector("main");
    const finalMain = finalDoc.querySelector("main");
    const mainTopologyChanged = topologySignature(baselineMain) !== topologySignature(finalMain);

    if (mainTopologyChanged && finalMain) {
      result = replaceSingleElement(result, "main", formatElement(finalMain));
    } else {
      for (const id of REGION_IDS) {
        if (["topbar", "inicio"].includes(id)) continue;
        const before = baselineDoc.getElementById(id);
        const after = finalDoc.getElementById(id);
        if (!before && !after) continue;
        if (!after) {
          result = removeElementById(result, before?.tagName?.toLowerCase() || "section", id);
          continue;
        }
        if (!before || before.outerHTML !== after.outerHTML) {
          result = replaceElementById(result, after.tagName.toLowerCase(), id, formatElement(after));
        }
      }
    }

    for (const id of ["topbar", "inicio"]) {
      const before = baselineDoc.getElementById(id);
      const after = finalDoc.getElementById(id);
      if (before && after && before.outerHTML !== after.outerHTML) {
        result = replaceElementById(result, after.tagName.toLowerCase(), id, formatElement(after));
      }
    }

    const baselineFooter = baselineDoc.querySelector("footer");
    const finalFooter = finalDoc.querySelector("footer");
    if (baselineFooter && finalFooter && baselineFooter.outerHTML !== finalFooter.outerHTML) {
      result = replaceSingleElement(result, "footer", formatElement(finalFooter));
    }

    result = applyEditorCss(result, generatedHtml);
    return ensureTrailingNewline(result);
  }

  async function fetchCanonicalHome(branch, requestHeaders) {
    const headers = normalizeHeaders(requestHeaders);
    const response = await originalFetch(`${API_PREFIX}/contents/${INDEX_PATH}?ref=${encodeURIComponent(branch)}`, {
      method: "GET",
      headers
    });
    if (!response.ok) throw new Error(`EDITOR_CANONICAL_${response.status}`);
    const file = await response.json();
    return decodeBase64Utf8(file.content || "");
  }

  function applyEditorCss(canonicalHtml, generatedHtml) {
    const finalDoc = new DOMParser().parseFromString(generatedHtml, "text/html");
    const currentCss = finalDoc.head.querySelector("#admin-editor-estilos")?.textContent || "";
    const deltaCss = diffCss(state.baselineCss, currentCss);
    const existing = findElementRange(canonicalHtml, "style", "admin-editor-estilos");

    if (!deltaCss.trim()) {
      return existing ? canonicalHtml.slice(0, existing.start) + canonicalHtml.slice(existing.end) : canonicalHtml;
    }

    const styleBlock = `<style id="admin-editor-estilos">\n${deltaCss.trim()}\n</style>`;
    if (existing) return canonicalHtml.slice(0, existing.start) + styleBlock + canonicalHtml.slice(existing.end);
    return canonicalHtml.replace(/<\/head>/i, `  ${styleBlock.replace(/\n/g, "\n  ")}\n</head>`);
  }

  function diffCss(baselineCss, currentCss) {
    const baseline = cssRuleMap(baselineCss);
    const current = cssRuleMap(currentCss);
    const changed = [];
    current.forEach((text, key) => {
      if (baseline.get(key) !== text) changed.push(text);
    });
    return changed.join("\n");
  }

  function cssRuleMap(css) {
    const map = new Map();
    if (!String(css || "").trim()) return map;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    try {
      [...(style.sheet?.cssRules || [])].forEach((rule, index) => {
        const key = rule.selectorText || `${rule.type}:${rule.conditionText || index}`;
        map.set(String(key), rule.cssText);
      });
    } finally {
      style.remove();
    }
    return map;
  }

  function topologySignature(main) {
    if (!main) return "";
    return [...main.children]
      .map((node) => `${node.tagName.toLowerCase()}#${node.id || ""}`)
      .join("|");
  }

  function parseBodyFragment(html) {
    return new DOMParser().parseFromString(`<!DOCTYPE html><html><body>${html}</body></html>`, "text/html");
  }

  function looksLikeHomeHtml(content) {
    const text = String(content || "");
    return text.includes("<!DOCTYPE html>") && text.includes("data-home-titulo") && text.includes("site-data/publicacoes-site.js");
  }

  function parseJsonBody(body) {
    if (typeof body !== "string") return null;
    try { return JSON.parse(body); } catch { return null; }
  }

  function normalizeHeaders(headers) {
    const output = new Headers(headers || {});
    output.set("Accept", "application/vnd.github+json");
    output.set("X-GitHub-Api-Version", "2022-11-28");
    return output;
  }

  function decodeBase64Utf8(base64) {
    const binary = atob(String(base64).replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function replaceElementById(source, tag, id, replacement) {
    const range = findElementRange(source, tag, id);
    if (!range) throw new Error(`EDITOR_REGIAO_NAO_ENCONTRADA_${id}`);
    const indent = range.indent;
    const formatted = indentMultiline(replacement, indent);
    return source.slice(0, range.start) + formatted + source.slice(range.end);
  }

  function removeElementById(source, tag, id) {
    const range = findElementRange(source, tag, id);
    if (!range) return source;
    return source.slice(0, range.start) + source.slice(range.end);
  }

  function replaceSingleElement(source, tag, replacement) {
    const range = findSingleElementRange(source, tag);
    if (!range) throw new Error(`EDITOR_TAG_NAO_ENCONTRADA_${tag}`);
    const formatted = indentMultiline(replacement, range.indent);
    return source.slice(0, range.start) + formatted + source.slice(range.end);
  }

  function findElementRange(source, tag, id) {
    const escapedId = escapeRegExp(id);
    const open = new RegExp(`<${tag}\\b[^>]*\\bid=["']${escapedId}["'][^>]*>`, "i");
    const match = open.exec(source);
    if (!match) return null;
    return expandBalancedRange(source, tag, match.index, match[0].length);
  }

  function findSingleElementRange(source, tag) {
    const open = new RegExp(`<${tag}\\b[^>]*>`, "i");
    const match = open.exec(source);
    if (!match) return null;
    return expandBalancedRange(source, tag, match.index, match[0].length);
  }

  function expandBalancedRange(source, tag, start, openingLength) {
    const token = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
    token.lastIndex = start + openingLength;
    let depth = 1;
    let end = start + openingLength;
    let match;
    while ((match = token.exec(source))) {
      const closing = /^<\//.test(match[0]);
      if (closing) depth -= 1;
      else if (!/\/>$/.test(match[0])) depth += 1;
      if (depth === 0) {
        end = match.index + match[0].length;
        break;
      }
    }
    if (depth !== 0) return null;

    const lineStart = source.lastIndexOf("\n", start - 1) + 1;
    const leading = source.slice(lineStart, start);
    const useLineStart = /^[\t ]*$/.test(leading);
    return {
      start: useLineStart ? lineStart : start,
      end,
      indent: useLineStart ? leading : ""
    };
  }

  function indentMultiline(text, indent) {
    const clean = String(text).trim();
    if (!indent) return clean;
    return clean.split("\n").map((line) => indent + line).join("\n");
  }

  function formatElement(element) {
    return serializeNode(element, "").trim();
  }

  function serializeNode(node, indent) {
    if (node.nodeType === Node.COMMENT_NODE) return `${indent}<!--${node.data}-->`;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      return text ? `${indent}${escapeText(text)}` : "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const tag = node.tagName.toLowerCase();
    const attrs = [...node.attributes]
      .map((attr) => `${attr.name}="${escapeAttribute(attr.value)}"`)
      .join(" ");
    const opening = `<${tag}${attrs ? ` ${attrs}` : ""}>`;
    if (VOID_TAGS.has(tag)) return `${indent}${opening}`;

    const children = [...node.childNodes].filter((child) => child.nodeType !== Node.TEXT_NODE || child.textContent?.trim());
    const hasBlockChild = children.some((child) => child.nodeType === Node.ELEMENT_NODE && !INLINE_TAGS.has(child.tagName.toLowerCase()));
    if (!hasBlockChild && node.innerHTML.length <= 260 && !node.innerHTML.includes("\n")) {
      return `${indent}${opening}${node.innerHTML}</${tag}>`;
    }

    const lines = [`${indent}${opening}`];
    children.forEach((child) => {
      const serialized = serializeNode(child, `${indent}  `);
      if (serialized) lines.push(serialized);
    });
    lines.push(`${indent}</${tag}>`);
    return lines.join("\n");
  }

  function escapeText(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeAttribute(text) {
    return String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function ensureTrailingNewline(text) {
    return String(text).replace(/\s*$/, "") + "\n";
  }
})();
