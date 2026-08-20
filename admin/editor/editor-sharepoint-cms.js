import { PublicClientApplication } from "https://esm.sh/@azure/msal-browser@5.11.0";

const CONFIG = Object.freeze({
  clientId: "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",
  tenantId: "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",
  siteId: "eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17",
  libraryName: "MIDIAS_SITE",
  cmsRoot: "CMS_SITE",
  dataPath: "CMS_SITE/site-data.json",
  indexPath: "CMS_SITE/index.html"
});

const SCOPES = ["User.Read", "Sites.ReadWrite.All"];
const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const INLINE_TAGS = new Set(["a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "em", "i", "img", "label", "mark", "small", "span", "strong", "sub", "sup", "time"]);

const msal = new PublicClientApplication({
  auth: {
    clientId: CONFIG.clientId,
    authority: `https://login.microsoftonline.com/${CONFIG.tenantId}`,
    redirectUri: `${window.location.origin}/`
  },
  cache: { cacheLocation: "sessionStorage", storeAuthStateInCookie: false }
});

let graphToken = "";
let driveId = "";
let busy = false;
let toastTimer = null;

instalarIntercepcaoEditor();
removerInterfaceGithub();
await msal.initialize();
prepararConexaoSilenciosa();

function instalarIntercepcaoEditor() {
  document.addEventListener("click", (event) => {
    const alvo = event.target instanceof Element ? event.target : null;
    if (!alvo?.closest("#btnSalvar")) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    salvarPaginaSharePoint();
  }, true);

  document.addEventListener("keydown", (event) => {
    const salvar = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
    if (!salvar) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    salvarPaginaSharePoint();
  }, true);
}

function removerInterfaceGithub() {
  document.getElementById("githubDialog")?.remove();
  document.querySelectorAll("[data-test-mode]").forEach((item) => item.remove());
}

async function prepararConexaoSilenciosa() {
  try {
    const account = await aguardarContaMicrosoft();
    if (!account) return;
    msal.setActiveAccount(account);
    const resposta = await msal.acquireTokenSilent({ scopes: SCOPES, account });
    graphToken = resposta.accessToken;
    driveId = await localizarDriveCms();
  } catch (erro) {
    console.warn("Editor aguardando sessão SharePoint.", erro);
  }
}

async function salvarPaginaSharePoint() {
  if (busy) return;
  const editor = obterEditor();
  if (!editor) {
    mostrarToast("O editor visual ainda não terminou de carregar.", "error");
    return;
  }

  busy = true;
  alternarSalvando(true);

  try {
    await garantirConexao();
    await garantirPastaCms();
    const snapshot = await carregarSnapshotSharePoint();
    const editorHtml = editor.getHtml() || "";
    const editorCss = editor.getCss() || "";
    const htmlSeguro = construirHtmlSeguro(snapshot.html, editorHtml, editorCss);
    const dados = prepararDadosPublicos(snapshot.dados, editorHtml);

    await gravarArquivoTexto(CONFIG.indexPath, htmlSeguro, "text/html");
    await gravarArquivoTexto(CONFIG.dataPath, JSON.stringify(dados, null, 2) + "\n", "application/json");
    mostrarToast("Página salva no SharePoint. O site público será sincronizado automaticamente.", "success");
  } catch (erro) {
    console.error(erro);
    mostrarToast(mensagemErro(erro), "error");
  } finally {
    busy = false;
    alternarSalvando(false);
  }
}

function obterEditor() {
  const editores = window.grapesjs?.editors;
  if (Array.isArray(editores) && editores.length) return editores[0];
  if (editores && typeof editores.length === "number" && editores.length) return editores[0];
  return null;
}

async function garantirConexao() {
  if (graphToken && driveId) return;
  const account = await aguardarContaMicrosoft();
  if (!account) throw new Error("SESSAO_MICROSOFT_AUSENTE");
  msal.setActiveAccount(account);
  const resposta = await msal.acquireTokenSilent({ scopes: SCOPES, account });
  graphToken = resposta.accessToken;
  driveId = await localizarDriveCms();
}

async function aguardarContaMicrosoft() {
  for (let tentativa = 0; tentativa < 40; tentativa += 1) {
    const account = msal.getActiveAccount() || msal.getAllAccounts()[0] || null;
    if (account) return account;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
}

async function localizarDriveCms() {
  const resposta = await graph(`/sites/${CONFIG.siteId}/drives?$select=id,name,webUrl`);
  const drive = (resposta.value || []).find((item) => item.name === CONFIG.libraryName);
  if (!drive?.id) throw new Error("MIDIAS_SITE_NAO_ENCONTRADA");
  return drive.id;
}

async function garantirPastaCms() {
  const existe = await graphResponse(`/drives/${driveId}/root:/${codificarCaminho(CONFIG.cmsRoot)}`);
  if (existe.ok) return;
  if (existe.status !== 404) throw new Error("FALHA_CONFERIR_CMS_SITE");
  const criada = await graphResponse(`/drives/${driveId}/root/children`, {
    method: "POST",
    body: JSON.stringify({ name: CONFIG.cmsRoot, folder: {}, "@microsoft.graph.conflictBehavior": "fail" })
  });
  if (!criada.ok && criada.status !== 409) throw new Error("FALHA_CRIAR_CMS_SITE");
}

async function carregarSnapshotSharePoint() {
  const [html, dados] = await Promise.all([
    carregarOuSemearTexto(CONFIG.indexPath, "../../index.html", "text/html"),
    carregarOuSemearJson(CONFIG.dataPath, "../../site-data/publicacoes-publicas.json")
  ]);
  return { html, dados };
}

async function carregarOuSemearTexto(caminho, fonte, mime) {
  const resposta = await graphResponse(`/drives/${driveId}/root:/${codificarCaminho(caminho)}:/content`, { cache: "no-store" });
  if (resposta.ok) return resposta.text();
  if (resposta.status !== 404) throw new Error(`FALHA_LER_${caminho}`);
  const publico = await fetch(`${fonte}?v=${Date.now()}`, { cache: "no-store" });
  if (!publico.ok) throw new Error(`FALHA_SEMEAR_${caminho}`);
  const texto = await publico.text();
  await gravarArquivoTexto(caminho, texto, mime);
  return texto;
}

async function carregarOuSemearJson(caminho, fonte) {
  const resposta = await graphResponse(`/drives/${driveId}/root:/${codificarCaminho(caminho)}:/content`, { cache: "no-store" });
  if (resposta.ok) return normalizarDadosPublicos(await resposta.json());
  if (resposta.status !== 404) throw new Error(`FALHA_LER_${caminho}`);
  const publico = await fetch(`${fonte}?v=${Date.now()}`, { cache: "no-store" });
  const dados = publico.ok ? normalizarDadosPublicos(await publico.json()) : normalizarDadosPublicos({});
  await gravarArquivoTexto(caminho, JSON.stringify(dados, null, 2) + "\n", "application/json");
  return dados;
}

function construirHtmlSeguro(canonicalHtml, finalEditorHtml, adminCss) {
  const finalDoc = parseEditorBody(finalEditorHtml);
  let result = canonicalHtml;

  const finalMain = finalDoc.querySelector("main");
  if (!finalMain) throw new Error("AREA_PRINCIPAL_INVALIDA");
  result = substituirElementoUnico(result, "main", formatarElemento(finalMain));

  const hero = finalDoc.getElementById("inicio");
  if (hero) result = substituirElementoPorId(result, hero.tagName.toLowerCase(), "inicio", formatarElemento(hero));

  result = aplicarCssAdmin(result, adminCss);
  return garantirNovaLinhaFinal(result);
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
    origem: "SHAREPOINT_CMS",
    cache: "fonte administrativa privada no SharePoint",
    home
  };
}

function normalizarDadosPublicos(dados) {
  const base = dados && typeof dados === "object" && !Array.isArray(dados) ? dados : {};
  return {
    ...base,
    home: base.home && typeof base.home === "object" ? base.home : {},
    publicacoes: Array.isArray(base.publicacoes) ? base.publicacoes : [],
    banners: Array.isArray(base.banners) ? base.banners : [],
    avisos: Array.isArray(base.avisos) ? base.avisos : [],
    destaques: Array.isArray(base.destaques) ? base.destaques : []
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

function parseEditorBody(html) {
  return new DOMParser().parseFromString(`<!DOCTYPE html><html><body>${html}</body></html>`, "text/html");
}

function substituirElementoPorId(source, tag, id, replacement) {
  const range = localizarElementoPorId(source, tag, id);
  if (!range) throw new Error(`REGIAO_${id}_NAO_ENCONTRADA`);
  return source.slice(0, range.start) + aplicarIndentacao(replacement, range.indent) + source.slice(range.end);
}

function substituirElementoUnico(source, tag, replacement) {
  const range = localizarElementoUnico(source, tag);
  if (!range) throw new Error(`ELEMENTO_${tag}_NAO_ENCONTRADO`);
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
  return { start: useLineStart ? lineStart : start, end, indent: useLineStart ? leading : "" };
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
    .filter((attr) => !attr.name.startsWith("data-gjs-"))
    .map((attr) => `${attr.name}="${escaparAtributoHtml(attr.value)}"`)
    .join(" ");
  const opening = `<${tag}${attrs ? ` ${attrs}` : ""}>`;
  if (VOID_TAGS.has(tag)) return `${indent}${opening}`;
  const children = [...node.childNodes]
    .filter((child) => child.nodeType !== Node.TEXT_NODE || child.textContent?.trim());
  const hasBlockChild = children.some((child) => child.nodeType === Node.ELEMENT_NODE && !INLINE_TAGS.has(child.tagName.toLowerCase()));
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

function aplicarCssAdmin(source, css) {
  const range = localizarElementoPorId(source, "style", "admin-editor-estilos");
  const limpo = String(css || "").trim();
  if (!limpo) {
    if (!range) return source;
    return source.slice(0, range.start) + source.slice(range.end);
  }
  const bloco = `<style id="admin-editor-estilos">\n${limpo}\n</style>`;
  if (range) return source.slice(0, range.start) + aplicarIndentacao(bloco, range.indent) + source.slice(range.end);
  const insercao = `  ${bloco.replace(/\n/g, "\n  ")}\n`;
  return source.replace(/<\/head>/i, `${insercao}</head>`);
}

function garantirNovaLinhaFinal(texto) {
  return String(texto || "").replace(/\s+$/g, "") + "\n";
}

async function gravarArquivoTexto(caminho, texto, mime) {
  const resposta = await graphResponse(`/drives/${driveId}/root:/${codificarCaminho(caminho)}:/content`, {
    method: "PUT",
    headers: { "Content-Type": mime },
    body: texto
  });
  if (!resposta.ok) throw new Error(`FALHA_GRAVAR_${caminho}`);
}

async function graph(path) {
  const resposta = await graphResponse(path);
  if (!resposta.ok) {
    const erro = new Error(`GRAPH_${resposta.status}`);
    erro.status = resposta.status;
    throw erro;
  }
  return resposta.json();
}

function graphResponse(path, opcoes = {}) {
  return fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...opcoes,
    headers: {
      Authorization: `Bearer ${graphToken}`,
      ...(opcoes.headers || {})
    }
  });
}

function codificarCaminho(caminho) {
  return String(caminho || "").split("/").map(encodeURIComponent).join("/");
}

function alternarSalvando(salvando) {
  const botao = document.getElementById("btnSalvar");
  if (!botao) return;
  botao.disabled = salvando;
  botao.textContent = salvando ? "Salvando..." : "Salvar alterações";
}

function mostrarToast(mensagem, tipo = "") {
  const toast = document.getElementById("statusToast");
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = mensagem;
  toast.className = `statusToast show ${tipo}`.trim();
  toastTimer = window.setTimeout(() => { toast.className = "statusToast"; }, 4400);
}

function mensagemErro(erro) {
  if (erro?.message === "SESSAO_MICROSOFT_AUSENTE") return "A sessão Microsoft não está disponível no editor. Volte ao painel e entre novamente.";
  if (erro?.status === 401 || erro?.status === 403) return "Sua conta Microsoft não tem permissão para salvar no SharePoint.";
  return "Não foi possível salvar no SharePoint agora. Nenhuma alteração local foi descartada.";
}

function cssEscape(valor) {
  if (window.CSS?.escape) return window.CSS.escape(valor);
  return String(valor).replace(/[^a-zA-Z0-9_-]/g, "");
}

function escaparTextoHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escaparAtributoHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
