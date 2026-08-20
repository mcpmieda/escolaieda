const GITHUB = Object.freeze({
  repo: "mcpmieda/escolaieda",
  branch: "main",
  indexPath: "index.html",
  dataPath: "site-data/publicacoes-publicas.json",
  imageRoot: "imagens/editor"
});

const STORAGE_TOKEN = "escolaIedaGithubToken";
const SESSION_TOKEN = "escolaIedaGithubTokenSessao";

const REGION_IDS = ["sobre", "numeros", "informacoes", "avisos", "destaques", "documentos", "contato"];
const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const INLINE_TAGS = new Set(["a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "em", "i", "img", "label", "mark", "small", "span", "strong", "sub", "sup", "time"]);

const state = {
  editor: null,
  previewSourceHtml: "",
  baseInlineCss: "",
  baselineEditorHtml: "",
  baselineEditorCss: "",
  baselineAdminCss: "",
  busy: false,
  pendingSave: false,
  toastTimer: null
};

const $ = (id) => document.getElementById(id);
const el = {
  loading: $("editorLoading"),
  btnSalvar: $("btnSalvar"),
  btnPreview: $("btnPreview"),
  btnUndo: $("btnUndo"),
  btnRedo: $("btnRedo"),
  statusToast: $("statusToast"),
  githubDialog: $("githubDialog"),
  githubForm: $("githubForm"),
  githubToken: $("githubToken"),
  githubRemember: $("githubRemember"),
  githubDialogStatus: $("githubDialogStatus"),
  btnCancelarGithub: $("btnCancelarGithub"),
  previewDialog: $("previewDialog"),
  previewFrame: $("previewFrame"),
  btnFecharPreview: $("btnFecharPreview"),
  propertyHelp: $("propertyHelp")
};

inicializarEventos();
await inicializarEditor();

function inicializarEventos() {
  el.btnSalvar?.addEventListener("click", salvarPagina);
  el.btnPreview?.addEventListener("click", abrirPreview);
  el.btnUndo?.addEventListener("click", () => state.editor?.UndoManager.undo());
  el.btnRedo?.addEventListener("click", () => state.editor?.UndoManager.redo());
  el.btnCancelarGithub?.addEventListener("click", () => {
    state.pendingSave = false;
    el.githubDialog?.close();
  });
  el.githubForm?.addEventListener("submit", conectarGithub);
  el.btnFecharPreview?.addEventListener("click", fecharPreview);
  el.previewDialog?.addEventListener("click", (event) => {
    if (event.target === el.previewDialog) fecharPreview();
  });

  document.querySelectorAll("[data-device]").forEach((botao) => {
    botao.addEventListener("click", () => {
      state.editor?.setDevice(botao.dataset.device);
      document.querySelectorAll("[data-device]").forEach((item) => item.classList.toggle("active", item === botao));
    });
  });

  document.querySelectorAll("[data-panel]").forEach((botao) => {
    botao.addEventListener("click", () => abrirPainelPropriedades(botao.dataset.panel));
  });

  document.addEventListener("keydown", (event) => {
    const salvar = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
    if (!salvar) return;
    event.preventDefault();
    salvarPagina();
  });
}

async function inicializarEditor() {
  if (!window.grapesjs) {
    mostrarErroRuntime();
    return;
  }

  try {
    const [respostaHtml, respostaDados] = await Promise.all([
      fetch(`../../index.html?v=${Date.now()}`, { cache: "no-store" }),
      fetch(`../../site-data/publicacoes-publicas.json?v=${Date.now()}`, { cache: "no-store" })
    ]);

    if (!respostaHtml.ok) throw new Error("Não foi possível carregar a página inicial.");

    const htmlRecebido = await respostaHtml.text();
    let dadosPublicos = null;
    if (respostaDados.ok) {
      try { dadosPublicos = await respostaDados.json(); } catch { dadosPublicos = null; }
    }

    state.previewSourceHtml = hidratarHomeNoHtml(htmlRecebido, dadosPublicos?.home);
    const preparado = prepararDocumento(state.previewSourceHtml);
    state.baseInlineCss = preparado.inlineCss;
    state.baselineAdminCss = preparado.editorCss;

    state.editor = window.grapesjs.init({
      container: "#gjs",
      height: "100%",
      width: "auto",
      fromElement: false,
      storageManager: false,
      noticeOnUnload: false,
      showOffsets: true,
      showDevices: false,
      panels: { defaults: [] },
      blockManager: { appendTo: "#blocks" },
      layerManager: { appendTo: "#layers" },
      traitManager: { appendTo: "#traits" },
      styleManager: {
        appendTo: "#styles",
        sectors: criarSetoresAparencia()
      },
      deviceManager: {
        devices: [
          { name: "Desktop", width: "" },
          { name: "Tablet", width: "820px", widthMedia: "992px" },
          { name: "Celular", width: "390px", widthMedia: "640px" }
        ]
      },
      assetManager: {
        upload: false,
        uploadFile: enviarArquivoAssetManager
      },
      canvas: { styles: preparado.stylesheets },
      components: preparado.bodyHtml,
      style: preparado.editorCss
    });

    registrarBlocos(state.editor);
    configurarProtecoes(state.editor);
    configurarEventosEditor(state.editor);
    capturarBaseline();
    requestAnimationFrame(() => prepararCanvas(state.editor));
    el.loading?.setAttribute("hidden", "");
  } catch (erro) {
    console.error(erro);
    mostrarEstadoFatal("Não foi possível abrir o editor.", "A página pública permanece intacta. Tente novamente mais tarde.");
  }
}

function hidratarHomeNoHtml(html, home) {
  if (!home || typeof home !== "object") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  definirTexto(doc.querySelector("[data-home-titulo]"), home.titulo);
  definirTexto(doc.querySelector("[data-home-subtitulo]"), home.subtitulo);
  definirTexto(doc.querySelector("[data-home-missao]"), home.missao);
  definirTexto(doc.querySelector("[data-home-info-texto]"), home.infoTexto);

  const secoes = Array.isArray(home.secoes) ? home.secoes : [];
  secoes.forEach((secao) => {
    const id = String(secao?.id || "").trim();
    if (!id) return;
    const bloco = doc.querySelector(`[data-home-section="${cssEscape(id)}"]`);
    if (!bloco) return;

    definirTexto(bloco.querySelector(`[data-section-title="${cssEscape(id)}"]`), secao.titulo);
    definirTexto(bloco.querySelector(`[data-section-text="${cssEscape(id)}"]`), secao.texto);

    if (Array.isArray(secao.indicadores)) {
      const itens = [...bloco.querySelectorAll("[data-section-indicators] .numero")];
      secao.indicadores.forEach((indicador, indice) => {
        const item = itens[indice];
        if (!item) return;
        definirTexto(item.querySelector("strong"), indicador?.valor);
        definirTexto(item.querySelector("span"), indicador?.rotulo);
      });
    }
  });

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}

function definirTexto(elemento, valor) {
  if (!elemento || valor === undefined || valor === null) return;
  elemento.textContent = String(valor);
}

function prepararDocumento(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body.querySelectorAll("script").forEach((script) => script.remove());

  const stylesheets = [...doc.head.querySelectorAll('link[rel="stylesheet"][href]')]
    .map((link) => new URL(link.getAttribute("href"), new URL("../../index.html", window.location.href)).href);

  const editorStyle = doc.head.querySelector("#admin-editor-estilos");
  const editorCss = editorStyle?.textContent || "";
  const inlineCss = [...doc.head.querySelectorAll("style")]
    .filter((style) => style !== editorStyle)
    .map((style) => style.textContent || "")
    .join("\n");

  return { bodyHtml: doc.body.innerHTML, stylesheets, inlineCss, editorCss };
}

function prepararCanvas(editor) {
  const doc = editor.Canvas.getDocument();
  if (!doc?.head) return;

  if (!doc.head.querySelector("base[data-ieda-editor]")) {
    const base = doc.createElement("base");
    base.href = new URL("../../", window.location.href).href;
    base.dataset.iedaEditor = "";
    doc.head.prepend(base);
  }

  let style = doc.head.querySelector("style[data-ieda-base-css]");
  if (!style) {
    style = doc.createElement("style");
    style.dataset.iedaBaseCss = "";
    doc.head.appendChild(style);
  }
  style.textContent = `${state.baseInlineCss}\n.reveal{opacity:1!important;transform:none!important}.secao-vazia[hidden]{display:none!important}`;
}

function configurarEventosEditor(editor) {
  editor.on("load", () => {
    prepararCanvas(editor);
    capturarBaseline();
  });
  editor.on("canvas:frame:load", () => prepararCanvas(editor));
  editor.on("component:selected", () => el.propertyHelp?.classList.add("hidden"));
  editor.on("component:deselected", () => {
    if (!editor.getSelected()) el.propertyHelp?.classList.remove("hidden");
  });
  editor.on("update", atualizarEstadoHistorico);
  editor.on("undo redo", atualizarEstadoHistorico);
  atualizarEstadoHistorico();
}

function capturarBaseline() {
  if (!state.editor) return;
  if (!state.baselineEditorHtml) state.baselineEditorHtml = state.editor.getHtml() || "";
  if (!state.baselineEditorCss) state.baselineEditorCss = state.editor.getCss() || "";
}

function atualizarBaselineAposSalvar(adminCss) {
  state.baselineEditorHtml = state.editor?.getHtml() || "";
  state.baselineEditorCss = state.editor?.getCss() || "";
  state.baselineAdminCss = adminCss || "";
  state.editor?.clearDirtyCount?.();
}

function atualizarEstadoHistorico() {
  if (!state.editor) return;
  if (el.btnUndo) el.btnUndo.disabled = !state.editor.UndoManager.hasUndo();
  if (el.btnRedo) el.btnRedo.disabled = !state.editor.UndoManager.hasRedo();
}

function configurarProtecoes(editor) {
  const wrapper = editor.getWrapper();
  const proteger = (componente) => {
    const attrs = componente.getAttributes?.() || {};
    const tag = String(componente.get("tagName") || "").toLowerCase();
    if (attrs.id === "topbar" || tag === "footer") {
      componente.set({ removable: false, copyable: false, draggable: false });
    }
    componente.components?.().forEach(proteger);
  };
  wrapper.components().forEach(proteger);
}

function criarSetoresAparencia() {
  return [
    {
      name: "Texto",
      open: true,
      buildProps: ["font-family", "font-size", "font-weight", "color", "line-height", "text-align", "text-decoration"]
    },
    {
      name: "Espaçamento",
      open: false,
      buildProps: ["margin", "padding"]
    },
    {
      name: "Fundo e borda",
      open: false,
      buildProps: ["background-color", "border", "border-radius", "box-shadow"]
    },
    {
      name: "Tamanho",
      open: false,
      buildProps: ["width", "max-width", "min-height"]
    }
  ];
}

function registrarBlocos(editor) {
  const blocos = [
    ["ieda-titulo", "Título", "T", '<section class="container reveal" data-editor-block="titulo"><div class="titulo-secao"><h2>Novo título</h2><p>Escreva aqui uma frase de apoio.</p></div></section>'],
    ["ieda-texto", "Texto", "¶", '<section class="container reveal" data-editor-block="texto"><div class="card"><h3>Novo conteúdo</h3><p>Digite aqui o texto que deseja publicar na página.</p></div></section>'],
    ["ieda-cartoes", "Cartões", "▦", '<section class="container reveal" data-editor-block="cartoes"><div class="grid"><div class="card"><h3>Primeiro cartão</h3><p>Texto do cartão.</p></div><div class="card"><h3>Segundo cartão</h3><p>Texto do cartão.</p></div><div class="card"><h3>Terceiro cartão</h3><p>Texto do cartão.</p></div></div></section>'],
    ["ieda-destaque", "Destaque", "✦", '<section class="container reveal" data-editor-block="destaque"><div class="faixa"><h2>Mensagem em destaque</h2><p>Use este bloco para uma informação que merece mais atenção.</p></div></section>'],
    ["ieda-botao", "Botão", "↗", '<div class="container reveal" data-editor-block="botao" style="text-align:center"><a class="botao botao-login" href="#">Abrir informação</a></div>'],
    ["ieda-imagem", "Imagem", "▧", '<section class="container reveal" data-editor-block="imagem"><div class="card" style="padding:12px"><img src="imagens/favicon.png" alt="Descreva a imagem" style="display:block;width:100%;max-height:520px;object-fit:cover;border-radius:16px"></div></section>']
  ];

  blocos.forEach(([id, label, icon, content]) => {
    editor.BlockManager.add(id, {
      label,
      category: "Escola Iêda",
      media: `<span aria-hidden="true">${icon}</span>`,
      content
    });
  });
}

function abrirPainelPropriedades(nome) {
  document.querySelectorAll("[data-panel]").forEach((botao) => botao.classList.toggle("active", botao.dataset.panel === nome));
  $("stylesPane")?.classList.toggle("active", nome === "styles");
  $("layersPane")?.classList.toggle("active", nome === "layers");
}

async function salvarPagina() {
  if (!state.editor || state.busy) return;
  const token = obterTokenGithub();
  if (!token) {
    state.pendingSave = true;
    abrirGithubDialog();
    return;
  }

  state.busy = true;
  alternarSalvando(true);

  try {
    const remoto = await carregarSnapshotGithub(token);
    const editorHtml = state.editor.getHtml() || "";
    const editorCss = state.editor.getCss() || "";
    const proximoAdminCss = reconciliarCssDoEditor(state.baselineEditorCss, editorCss, state.baselineAdminCss);
    const htmlSeguro = construirHtmlSeguro(remoto.html, editorHtml, proximoAdminCss);
    const dados = prepararDadosPublicos(remoto.dados, editorHtml);

    await commitAtomicoGithub(
      token,
      [
        { path: GITHUB.indexPath, content: htmlSeguro },
        { path: GITHUB.dataPath, content: `${JSON.stringify(dados, null, 2)}\n` }
      ],
      "Atualiza página inicial pelo editor visual",
      remoto.headSha
    );

    state.previewSourceHtml = hidratarHomeNoHtml(htmlSeguro, dados.home);
    atualizarBaselineAposSalvar(proximoAdminCss);
    mostrarToast("Página salva na branch segura. HTML e dados foram enviados no mesmo commit.", "success");
  } catch (erro) {
    console.error(erro);
    if (erro.status === 401 || erro.status === 403) limparTokenGithub();
    mostrarToast(mensagemErroGithub(erro), "error");
  } finally {
    state.busy = false;
    alternarSalvando(false);
  }
}

async function carregarSnapshotGithub(token) {
  const branch = branchAtual();
  const ref = await github(`/git/ref/heads/${encodeURIComponent(branch)}`, { token });
  const headSha = ref.object?.sha;
  if (!headSha) throw new Error("Não foi possível localizar a versão atual da branch.");

  const [arquivoHtml, arquivoDados] = await Promise.all([
    github(`/contents/${GITHUB.indexPath}?ref=${encodeURIComponent(headSha)}`, { token }),
    github(`/contents/${GITHUB.dataPath}?ref=${encodeURIComponent(headSha)}`, { token })
  ]);

  const html = decodificarBase64Utf8(arquivoHtml.content || "");
  const dados = JSON.parse(decodificarBase64Utf8(arquivoDados.content || ""));

  return { headSha, html, dados };
}

function construirHtmlSeguro(canonicalHtml, finalEditorHtml, adminCss) {
  if (!state.baselineEditorHtml) throw new Error("A base segura do editor não foi inicializada.");

  const baselineDoc = parseEditorBody(state.baselineEditorHtml);
  const finalDoc = parseEditorBody(finalEditorHtml);
  let result = canonicalHtml;

  result = aplicarTextosConhecidos(result, baselineDoc, finalDoc);

  const baselineMain = baselineDoc.querySelector("main");
  const finalMain = finalDoc.querySelector("main");
  const topologiaMudou = assinaturaTopologia(baselineMain) !== assinaturaTopologia(finalMain);

  if (topologiaMudou) {
    if (!finalMain) throw new Error("A estrutura principal da página ficou inválida.");
    result = substituirElementoUnico(result, "main", formatarElemento(finalMain));
  } else {
    for (const id of REGION_IDS) {
      const antes = baselineDoc.getElementById(id);
      const depois = finalDoc.getElementById(id);

      if (!antes && !depois) continue;
      if (!depois) {
        result = removerElementoPorId(result, antes?.tagName?.toLowerCase() || "section", id);
        continue;
      }
      if (!antes || antes.outerHTML !== depois.outerHTML) {
        result = substituirElementoPorId(result, depois.tagName.toLowerCase(), id, formatarElemento(depois));
      }
    }
  }

  for (const id of ["topbar", "inicio"]) {
    const antes = baselineDoc.getElementById(id);
    const depois = finalDoc.getElementById(id);
    if (antes && depois && antes.outerHTML !== depois.outerHTML) {
      result = substituirElementoPorId(result, depois.tagName.toLowerCase(), id, formatarElemento(depois));
    }
  }

  const footerAntes = baselineDoc.querySelector("footer");
  const footerDepois = finalDoc.querySelector("footer");
  if (footerAntes && footerDepois && footerAntes.outerHTML !== footerDepois.outerHTML) {
    result = substituirElementoUnico(result, "footer", formatarElemento(footerDepois));
  }

  result = aplicarCssAdmin(result, adminCss);
  return garantirNovaLinhaFinal(result);
}

function aplicarTextosConhecidos(source, baselineDoc, finalDoc) {
  let result = source;
  const specs = [
    { selector: "[data-home-titulo]", attr: "data-home-titulo" },
    { selector: "[data-home-subtitulo]", attr: "data-home-subtitulo" },
    { selector: "[data-home-missao]", attr: "data-home-missao" },
    { selector: "[data-home-info-texto]", attr: "data-home-info-texto" }
  ];

  specs.forEach((spec) => {
    const antes = baselineDoc.querySelector(spec.selector);
    const depois = finalDoc.querySelector(spec.selector);
    if (!antes || !depois || antes.textContent === depois.textContent) return;
    result = substituirTextoPorAtributo(result, spec.attr, null, depois.textContent || "");
    antes.textContent = depois.textContent || "";
  });

  ["data-section-title", "data-section-text"].forEach((attr) => {
    finalDoc.querySelectorAll(`[${attr}]`).forEach((depois) => {
      const value = depois.getAttribute(attr);
      if (!value) return;
      const seletor = `[${attr}="${cssEscape(value)}"]`;
      const antes = baselineDoc.querySelector(seletor);
      if (!antes || antes.textContent === depois.textContent) return;
      result = substituirTextoPorAtributo(result, attr, value, depois.textContent || "");
      antes.textContent = depois.textContent || "";
    });
  });

  return result;
}

function substituirTextoPorAtributo(source, attr, value, text) {
  const nome = escapeRegExp(attr);
  const valor = value === null
    ? `(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?`
    : `\\s*=\\s*(?:"${escapeRegExp(value)}"|'${escapeRegExp(value)}')`;
  const open = new RegExp(`<([a-zA-Z][\\w:-]*)\\b(?=[^>]*\\b${nome}${valor})[^>]*>`, "i");
  const match = open.exec(source);
  if (!match) throw new Error(`Não foi possível localizar o campo ${attr} no HTML atual.`);

  const tag = match[1];
  const contentStart = match.index + match[0].length;
  const close = new RegExp(`</${escapeRegExp(tag)}\\s*>`, "i");
  const closeMatch = close.exec(source.slice(contentStart));
  if (!closeMatch) throw new Error(`Não foi possível localizar o fechamento de ${attr}.`);

  const contentEnd = contentStart + closeMatch.index;
  return source.slice(0, contentStart) + escaparTextoHtml(String(text).trim()) + source.slice(contentEnd);
}

function assinaturaTopologia(main) {
  if (!main) return "";
  return [...main.children]
    .map((node) => `${node.tagName.toLowerCase()}#${node.id || ""}:${node.getAttribute("data-editor-block") || ""}`)
    .join("|");
}

function reconciliarCssDoEditor(baselineCss, currentCss, baselineAdminCss) {
  const antes = mapaCss(baselineCss);
  const agora = mapaCss(currentCss);
  const admin = mapaCss(baselineAdminCss);
  const chaves = new Set([...antes.keys(), ...agora.keys()]);

  chaves.forEach((chave) => {
    const anterior = antes.get(chave);
    const atual = agora.get(chave);
    if (anterior === atual) return;
    if (atual === undefined) admin.delete(chave);
    else admin.set(chave, atual);
  });

  return [...admin.values()].join("\n");
}

function mapaCss(css) {
  const map = new Map();
  if (!String(css || "").trim()) return map;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  try {
    [...(style.sheet?.cssRules || [])].forEach((rule, index) => {
      const chave = rule.selectorText
        ? `style:${rule.selectorText}`
        : `${rule.type}:${rule.conditionText || index}`;
      map.set(chave, rule.cssText);
    });
  } finally {
    style.remove();
  }

  return map;
}

function aplicarCssAdmin(source, css) {
  const range = localizarElementoPorId(source, "style", "admin-editor-estilos");
  const limpo = String(css || "").trim();

  if (!limpo) {
    if (!range) return source;
    return source.slice(0, range.start) + source.slice(range.end);
  }

  const bloco = `<style id="admin-editor-estilos">\n${limpo}\n</style>`;
  if (range) {
    return source.slice(0, range.start) + aplicarIndentacao(bloco, range.indent) + source.slice(range.end);
  }

  const insercao = `  ${bloco.replace(/\n/g, "\n  ")}\n`;
  return source.replace(/<\/head>/i, `${insercao}</head>`);
}

function parseEditorBody(html) {
  return new DOMParser().parseFromString(`<!DOCTYPE html><html><body>${html}</body></html>`, "text/html");
}

function substituirElementoPorId(source, tag, id, replacement) {
  const range = localizarElementoPorId(source, tag, id);
  if (!range) throw new Error(`Não foi possível localizar a região ${id} no HTML atual.`);
  return source.slice(0, range.start) + aplicarIndentacao(replacement, range.indent) + source.slice(range.end);
}

function removerElementoPorId(source, tag, id) {
  const range = localizarElementoPorId(source, tag, id);
  if (!range) return source;
  return source.slice(0, range.start) + source.slice(range.end);
}

function substituirElementoUnico(source, tag, replacement) {
  const range = localizarElementoUnico(source, tag);
  if (!range) throw new Error(`Não foi possível localizar <${tag}> no HTML atual.`);
  return source.slice(0, range.start) + aplicarIndentacao(replacement, range.indent) + source.slice(range.end);
}

function localizarElementoPorId(source, tag, id) {
  const open = new RegExp(`<${tag}\\b[^>]*\\bid=["']${escapeRegExp(id)}["'][^>]*>`, "i");
  const match = open.exec(source);
  if (!match) return null;
  return expandirFaixaBalanceada(source, tag, match.index, match[0].length);
}

function localizarElementoUnico(source, tag) {
  const open = new RegExp(`<${tag}\\b[^>]*>`, "i");
  const match = open.exec(source);
  if (!match) return null;
  return expandirFaixaBalanceada(source, tag, match.index, match[0].length);
}

function expandirFaixaBalanceada(source, tag, start, openingLength) {
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

function aplicarIndentacao(text, indent) {
  const clean = String(text).trim();
  if (!indent) return clean;
  return clean.split("\n").map((line) => indent + line).join("\n");
}

function formatarElemento(element) {
  return serializarNo(element, "").trim();
}

function serializarNo(node, indent) {
  if (node.nodeType === Node.COMMENT_NODE) return `${indent}<!--${node.data}-->`;
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    return text ? `${indent}${escaparTextoHtml(text)}` : "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const tag = node.tagName.toLowerCase();
  const attrs = [...node.attributes]
    .map((attr) => `${attr.name}="${escaparAtributoHtml(attr.value)}"`)
    .join(" ");
  const opening = `<${tag}${attrs ? ` ${attrs}` : ""}>`;

  if (VOID_TAGS.has(tag)) return `${indent}${opening}`;

  const children = [...node.childNodes]
    .filter((child) => child.nodeType !== Node.TEXT_NODE || child.textContent?.trim());
  const hasBlockChild = children.some(
    (child) => child.nodeType === Node.ELEMENT_NODE && !INLINE_TAGS.has(child.tagName.toLowerCase())
  );

  if (!hasBlockChild && node.innerHTML.length <= 260 && !node.innerHTML.includes("\n")) {
    return `${indent}${opening}${node.innerHTML}</${tag}>`;
  }

  const lines = [`${indent}${opening}`];
  children.forEach((child) => {
    const serialized = serializarNo(child, `${indent}  `);
    if (serialized) lines.push(serialized);
  });
  lines.push(`${indent}</${tag}>`);
  return lines.join("\n");
}

function montarHtmlPreview() {
  const doc = new DOMParser().parseFromString(state.previewSourceHtml, "text/html");
  doc.body.querySelectorAll("script").forEach((script) => script.remove());
  doc.body.innerHTML = state.editor.getHtml();

  const css = state.editor.getCss() || "";
  let style = doc.head.querySelector("#admin-editor-preview-estilos");
  if (!style) {
    style = doc.createElement("style");
    style.id = "admin-editor-preview-estilos";
    doc.head.appendChild(style);
  }
  style.textContent = `${css}\n.reveal{opacity:1!important;transform:none!important}`;

  const base = doc.createElement("base");
  base.href = new URL("../../", window.location.href).href;
  doc.head.prepend(base);

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}

function prepararDadosPublicos(dadosOriginais, editorHtml) {
  const dados = normalizarDadosPublicos(dadosOriginais);
  const doc = parseEditorBody(editorHtml);
  const homeAtual = dados.home;
  const secoesAtuais = Array.isArray(homeAtual.secoes) ? homeAtual.secoes : [];

  const home = {
    ...homeAtual,
    titulo: textoSeletor(doc, "[data-home-titulo]", homeAtual.titulo),
    subtitulo: textoSeletor(doc, "[data-home-subtitulo]", homeAtual.subtitulo),
    missao: textoSeletor(doc, "[data-home-missao]", homeAtual.missao),
    infoTexto: textoSeletor(doc, "[data-home-info-texto]", homeAtual.infoTexto),
    secoes: secoesAtuais.map((secao) => sincronizarSecaoHome(doc, secao))
  };

  return {
    ...dados,
    atualizadoEm: new Date().toISOString(),
    origem: "GITHUB",
    cache: "fonte direta do repositório",
    home
  };
}

function normalizarDadosPublicos(dados) {
  const base = dados && typeof dados === "object" && !Array.isArray(dados) ? dados : {};
  return {
    ...base,
    home: base.home && typeof base.home === "object" ? base.home : {},
    publicacoes: Array.isArray(base.publicacoes) ? base.publicacoes : []
  };
}

function sincronizarSecaoHome(doc, secao) {
  const id = String(secao?.id || "").trim();
  const bloco = id ? doc.querySelector(`[data-home-section="${cssEscape(id)}"]`) : null;
  if (!bloco) return secao;

  const proxima = {
    ...secao,
    titulo: bloco.querySelector(`[data-section-title="${cssEscape(id)}"]`)?.textContent?.trim() || secao.titulo || "",
    texto: bloco.querySelector(`[data-section-text="${cssEscape(id)}"]`)?.textContent?.trim() ?? secao.texto ?? ""
  };

  const indicadores = [...bloco.querySelectorAll("[data-section-indicators] .numero")]
    .map((item) => ({
      valor: item.querySelector("strong")?.textContent?.trim() || "",
      rotulo: item.querySelector("span")?.textContent?.trim() || ""
    }))
    .filter((item) => item.valor || item.rotulo);

  if (indicadores.length) proxima.indicadores = indicadores;
  return proxima;
}

function textoSeletor(doc, seletor, fallback = "") {
  return doc.querySelector(seletor)?.textContent?.trim() || fallback || "";
}

function cssEscape(valor) {
  if (window.CSS?.escape) return window.CSS.escape(valor);
  return String(valor).replace(/[^a-zA-Z0-9_-]/g, "");
}

function branchAtual() {
  return window.__IEDA_GITHUB_TARGET__?.branch || GITHUB.branch;
}

async function commitAtomicoGithub(token, arquivos, mensagem, expectedParentSha) {
  const branch = branchAtual();
  const ref = await github(`/git/ref/heads/${encodeURIComponent(branch)}`, { token });
  const parentSha = ref.object?.sha;
  if (!parentSha) throw new Error("Não foi possível localizar a versão atual do site.");

  if (expectedParentSha && parentSha !== expectedParentSha) {
    const erro = new Error("O site foi alterado em outro lugar. Recarregue o editor antes de salvar novamente.");
    erro.status = 409;
    throw erro;
  }

  const commitAtual = await github(`/git/commits/${parentSha}`, { token });
  const baseTree = commitAtual.tree?.sha;
  if (!baseTree) throw new Error("Não foi possível preparar a atualização do site.");

  const tree = [];
  for (const arquivo of arquivos) {
    const blob = await github("/git/blobs", {
      method: "POST",
      token,
      body: { content: arquivo.content, encoding: "utf-8" }
    });
    tree.push({ path: arquivo.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const novaTree = await github("/git/trees", {
    method: "POST",
    token,
    body: { base_tree: baseTree, tree }
  });

  const novoCommit = await github("/git/commits", {
    method: "POST",
    token,
    body: { message: mensagem, tree: novaTree.sha, parents: [parentSha] }
  });

  await github(`/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: "PATCH",
    token,
    body: { sha: novoCommit.sha, force: false }
  });

  return novoCommit.sha;
}

async function enviarArquivoAssetManager(event) {
  try {
    const arquivos = [...(event?.dataTransfer?.files || event?.target?.files || [])];
    if (!arquivos.length) return;

    const token = obterTokenGithub();
    if (!token) {
      abrirGithubDialog("Conecte ao GitHub antes de enviar uma imagem.");
      return;
    }

    for (const arquivo of arquivos.slice(0, 8)) {
      if (!/^image\/(jpeg|png|webp|gif|svg\+xml)$/i.test(arquivo.type)) {
        mostrarToast(`O arquivo ${arquivo.name} não é uma imagem compatível.`, "error");
        continue;
      }
      if (arquivo.size > 8 * 1024 * 1024) {
        mostrarToast(`A imagem ${arquivo.name} ultrapassa 8 MB.`, "error");
        continue;
      }

      const caminho = `${GITHUB.imageRoot}/${Date.now()}-${slugArquivo(arquivo.name)}`;
      await criarArquivoGithub(token, caminho, await arquivoParaBase64(arquivo), `Adiciona imagem pelo editor visual: ${arquivo.name}`);
      const url = `/${caminho}`;
      state.editor.AssetManager.add({ src: url, name: arquivo.name });
      mostrarToast(`Imagem ${arquivo.name} enviada.`, "success");
    }
  } catch (erro) {
    console.error(erro);
    mostrarToast(mensagemErroGithub(erro), "error");
  }
}

async function criarArquivoGithub(token, path, contentBase64, message) {
  return github(`/contents/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "PUT",
    token,
    body: { message, content: contentBase64, branch: branchAtual() }
  });
}

function abrirPreview() {
  if (!state.editor || !el.previewDialog || !el.previewFrame) return;
  el.previewFrame.srcdoc = montarHtmlPreview();
  el.previewDialog.showModal();
}

function fecharPreview() {
  el.previewDialog?.close();
  if (el.previewFrame) el.previewFrame.srcdoc = "";
}

function abrirGithubDialog(mensagem = "") {
  if (!el.githubDialog) return;
  el.githubDialogStatus.textContent = mensagem;
  el.githubToken.value = obterTokenGithub() || "";
  el.githubRemember.checked = Boolean(localStorage.getItem(STORAGE_TOKEN));
  if (!el.githubDialog.open) el.githubDialog.showModal();
  requestAnimationFrame(() => el.githubToken?.focus());
}

async function conectarGithub(event) {
  event.preventDefault();
  const token = el.githubToken?.value.trim();
  if (!token) return;

  el.githubDialogStatus.textContent = "Verificando acesso...";
  try {
    await github("", { token });
    sessionStorage.setItem(SESSION_TOKEN, token);
    if (el.githubRemember.checked) localStorage.setItem(STORAGE_TOKEN, token);
    else localStorage.removeItem(STORAGE_TOKEN);

    el.githubDialog.close();
    el.githubDialogStatus.textContent = "";
    mostrarToast("GitHub conectado.", "success");

    if (state.pendingSave) {
      state.pendingSave = false;
      await salvarPagina();
    }
  } catch (erro) {
    console.error(erro);
    el.githubDialogStatus.textContent = "Token inválido ou sem permissão para este repositório.";
  }
}

function obterTokenGithub() {
  return sessionStorage.getItem(SESSION_TOKEN) || localStorage.getItem(STORAGE_TOKEN) || "";
}

function limparTokenGithub() {
  sessionStorage.removeItem(SESSION_TOKEN);
  localStorage.removeItem(STORAGE_TOKEN);
}

async function github(path, { method = "GET", token, body } = {}) {
  const resposta = await fetch(`https://api.github.com/repos/${GITHUB.repo}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const texto = await resposta.text();
  let dados = {};
  try { dados = texto ? JSON.parse(texto) : {}; } catch { dados = {}; }

  if (!resposta.ok) {
    const erro = new Error(dados.message || `GitHub respondeu ${resposta.status}.`);
    erro.status = resposta.status;
    erro.details = dados;
    throw erro;
  }
  return dados;
}

function decodificarBase64Utf8(base64) {
  const binario = atob(String(base64).replace(/\s/g, ""));
  const bytes = Uint8Array.from(binario, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function alternarSalvando(salvando) {
  if (!el.btnSalvar) return;
  el.btnSalvar.disabled = salvando;
  el.btnSalvar.textContent = salvando ? "Salvando..." : "Salvar alterações";
}

function mostrarToast(mensagem, tipo = "") {
  if (!el.statusToast) return;
  window.clearTimeout(state.toastTimer);
  el.statusToast.textContent = mensagem;
  el.statusToast.className = `statusToast show ${tipo}`.trim();
  state.toastTimer = window.setTimeout(() => {
    el.statusToast.className = "statusToast";
  }, 4400);
}

function mostrarErroRuntime() {
  if (el.btnSalvar) el.btnSalvar.disabled = true;
  if (el.btnPreview) el.btnPreview.disabled = true;
  mostrarEstadoFatal(
    "O motor visual não carregou.",
    "Nenhuma alteração foi feita no site. Recarregue a página e tente novamente."
  );
}

function mostrarEstadoFatal(titulo, detalhe) {
  if (!el.loading) return;
  el.loading.removeAttribute("hidden");
  el.loading.replaceChildren();

  const forte = document.createElement("strong");
  forte.textContent = titulo;
  const pequeno = document.createElement("small");
  pequeno.textContent = detalhe;
  el.loading.append(forte, pequeno);
}

function mensagemErroGithub(erro) {
  if (erro?.status === 401) return "A conexão com o GitHub expirou. Conecte novamente.";
  if (erro?.status === 403) return "O token não tem permissão suficiente para salvar este site.";
  if (erro?.status === 409 || erro?.status === 422) return "O site foi alterado em outro lugar. Recarregue o editor antes de salvar novamente.";
  return erro?.message || "Não foi possível salvar agora. Nenhuma alteração local foi descartada.";
}

function slugArquivo(nome) {
  const partes = String(nome || "imagem").split(".");
  const extensao = partes.length > 1 ? partes.pop().toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = partes.join(".")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "imagem";

  return extensao ? `${base}.${extensao}` : base;
}

function arquivoParaBase64(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.readAsDataURL(arquivo);
  });
}

function escaparTextoHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escaparAtributoHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function garantirNovaLinhaFinal(text) {
  return String(text).replace(/\s*$/, "") + "\n";
}
