import { PublicClientApplication } from "https://esm.sh/@azure/msal-browser@5.11.0";

const CONFIG = Object.freeze({
  clientId: "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",
  tenantId: "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",
  siteId: "eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17",
  libraryName: "MIDIAS_SITE",
  cmsRoot: "CMS_SITE",
  dataPath: "CMS_SITE/site-data.json",
  indexPath: "CMS_SITE/index.html",
  imageRoot: "CMS_SITE/imagens"
});

const SCOPES = ["User.Read", "Sites.ReadWrite.All"];
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const msal = new PublicClientApplication({
  auth: {
    clientId: CONFIG.clientId,
    authority: `https://login.microsoftonline.com/${CONFIG.tenantId}`,
    redirectUri: `${window.location.origin}/`
  },
  cache: { cacheLocation: "sessionStorage", storeAuthStateInCookie: false }
});

let graphToken = "";
let cmsDriveId = "";
let siteData = null;
let busca = "";
let operacao = false;
let toastTimer = null;

instalarIntercepcaoCms();
await msal.initialize();
inicializarCmsQuandoAutenticado();

function instalarIntercepcaoCms() {
  document.addEventListener("submit", (event) => {
    if (event.target?.id !== "formPublicacao") return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    salvarPublicacaoSharePoint();
  }, true);

  document.addEventListener("input", (event) => {
    if (event.target?.id !== "buscaPublicacoes") return;
    event.stopPropagation();
    event.stopImmediatePropagation();
    busca = event.target.value.trim().toLocaleLowerCase("pt-BR");
    renderizarPublicacoesSharePoint();
  }, true);

  document.addEventListener("click", (event) => {
    const alvo = event.target instanceof Element ? event.target : null;
    if (!alvo) return;

    const botao = alvo.closest("[data-sp-cms-action]");
    if (!botao) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const id = botao.dataset.id || "";
    if (botao.dataset.spCmsAction === "editar") editarPublicacaoSharePoint(id);
    if (botao.dataset.spCmsAction === "excluir") excluirPublicacaoSharePoint(id);
  }, true);
}

async function inicializarCmsQuandoAutenticado() {
  prepararInterfaceSharePoint();
  mostrarListaCarregando();

  const account = await aguardarContaMicrosoft();
  if (!account) return;

  try {
    msal.setActiveAccount(account);
    const resposta = await msal.acquireTokenSilent({ scopes: SCOPES, account });
    graphToken = resposta.accessToken;
    cmsDriveId = await localizarDriveCms();
    await garantirEstruturaCms();
    siteData = await carregarOuCriarSiteData();
    await garantirSnapshotIndex();
    atualizarEstadoConexao(true);
    renderizarPublicacoesSharePoint();
  } catch (erro) {
    console.error("Falha ao iniciar CMS SharePoint", erro);
    atualizarEstadoConexao(false);
    definirStatusPublicacao("Não foi possível abrir o CMS do SharePoint agora. Atualize a página e tente novamente.", "error");
  }
}

async function aguardarContaMicrosoft() {
  for (let tentativa = 0; tentativa < 40; tentativa += 1) {
    const account = msal.getActiveAccount() || msal.getAllAccounts()[0] || null;
    if (account) return account;
    await esperar(250);
  }
  return null;
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function localizarDriveCms() {
  const resposta = await graph(`/sites/${CONFIG.siteId}/drives?$select=id,name,webUrl`);
  const drive = (resposta.value || []).find((item) => item.name === CONFIG.libraryName);
  if (!drive?.id) throw new Error("MIDIAS_SITE_NAO_ENCONTRADA");
  return drive.id;
}

async function garantirEstruturaCms() {
  await garantirPasta(CONFIG.cmsRoot, "");
  await garantirPasta("imagens", CONFIG.cmsRoot);
}

async function garantirPasta(nome, parentPath) {
  const caminho = parentPath ? `${parentPath}/${nome}` : nome;
  const existe = await graphResponse(`/drives/${cmsDriveId}/root:/${codificarCaminho(caminho)}`);
  if (existe.ok) return;
  if (existe.status !== 404) throw new Error(`FALHA_CONFERIR_PASTA_${nome}`);

  const endpoint = parentPath
    ? `/drives/${cmsDriveId}/root:/${codificarCaminho(parentPath)}:/children`
    : `/drives/${cmsDriveId}/root/children`;

  const criada = await graphResponse(endpoint, {
    method: "POST",
    body: JSON.stringify({
      name: nome,
      folder: {},
      "@microsoft.graph.conflictBehavior": "fail"
    })
  });
  if (!criada.ok && criada.status !== 409) throw new Error(`FALHA_CRIAR_PASTA_${nome}`);
}

async function carregarOuCriarSiteData() {
  const resposta = await graphResponse(`/drives/${cmsDriveId}/root:/${codificarCaminho(CONFIG.dataPath)}:/content`, { cache: "no-store" });
  if (resposta.ok) return normalizarSiteData(await resposta.json());
  if (resposta.status !== 404) throw new Error("FALHA_LER_SITE_DATA_SHAREPOINT");

  const publico = await fetch(`../site-data/publicacoes-publicas.json?v=${Date.now()}`, { cache: "no-store" });
  const dados = publico.ok ? normalizarSiteData(await publico.json()) : criarSiteDataVazio();
  dados.origem = "SHAREPOINT_CMS";
  dados.cache = "fonte administrativa privada no SharePoint";
  await gravarArquivoTexto(CONFIG.dataPath, JSON.stringify(dados, null, 2) + "\n", "application/json");
  return dados;
}

async function garantirSnapshotIndex() {
  const resposta = await graphResponse(`/drives/${cmsDriveId}/root:/${codificarCaminho(CONFIG.indexPath)}`);
  if (resposta.ok) return;
  if (resposta.status !== 404) throw new Error("FALHA_CONFERIR_INDEX_SHAREPOINT");

  const atual = await fetch(`../index.html?v=${Date.now()}`, { cache: "no-store" });
  if (!atual.ok) throw new Error("INDEX_PUBLICO_INDISPONIVEL");
  await gravarArquivoTexto(CONFIG.indexPath, await atual.text(), "text/html");
}

async function salvarPublicacaoSharePoint() {
  if (operacao) return;
  if (!siteData || !graphToken || !cmsDriveId) {
    definirStatusPublicacao("A conexão com o SharePoint ainda está sendo preparada.", "error");
    return;
  }

  const titulo = valor("pubTitulo").trim();
  if (!titulo) return;

  operacao = true;
  const form = document.getElementById("formPublicacao");
  const botao = form?.querySelector("button[type='submit']");
  alternarBotao(botao, true, "Salvando...");
  definirStatusPublicacao("Salvando no SharePoint...");

  try {
    const remoto = await recarregarSiteDataSharePoint();
    const id = valor("pubId") || gerarId();
    const anterior = remoto.publicacoes.find((item) => item.id === id) || {};
    let imagem = valor("pubImagemAtual") || anterior.imagem || "";
    const arquivo = document.getElementById("pubImagemArquivo")?.files?.[0] || null;

    if (arquivo) {
      validarImagem(arquivo);
      const nome = nomeArquivoSeguro(arquivo.name);
      await enviarImagemSharePoint(arquivo, nome);
      imagem = `/imagens/publicacoes/${nome}`;
    }

    const item = {
      ...anterior,
      id,
      titulo,
      resumo: valor("pubResumo").trim(),
      conteudo: valor("pubConteudo").trim(),
      local: valor("pubLocal") || "avisos",
      estilo: valor("pubEstilo") || "padrao",
      imagem,
      imagemAlt: titulo,
      link: valor("pubLink").trim(),
      botao: valor("pubBotao").trim(),
      dataInicial: valor("pubDataInicial"),
      dataFinal: valor("pubDataFinal"),
      ordem: Number(anterior.ordem || 0),
      publicado: Boolean(document.getElementById("pubPublicado")?.checked),
      destaque: valor("pubLocal") === "destaques",
      atualizadoEm: new Date().toISOString()
    };

    const indice = remoto.publicacoes.findIndex((publicacao) => publicacao.id === id);
    if (indice >= 0) remoto.publicacoes[indice] = item;
    else remoto.publicacoes.unshift(item);

    remoto.atualizadoEm = new Date().toISOString();
    remoto.origem = "SHAREPOINT_CMS";
    remoto.cache = "fonte administrativa privada no SharePoint";
    await gravarSiteData(remoto);

    siteData = remoto;
    renderizarPublicacoesSharePoint();
    limparFormulario();
    definirStatusPublicacao(
      arquivo
        ? "Publicação e imagem salvas no SharePoint. O site público será sincronizado automaticamente."
        : "Publicação salva no SharePoint. O site público será sincronizado automaticamente.",
      "success"
    );
    mostrarToast("Alteração salva no SharePoint.", "success");
  } catch (erro) {
    console.error(erro);
    definirStatusPublicacao(mensagemErro(erro), "error");
    mostrarToast("Não foi possível salvar a publicação.", "error");
  } finally {
    operacao = false;
    alternarBotao(botao, false, "Salvar publicação");
  }
}

async function excluirPublicacaoSharePoint(id) {
  if (!siteData || operacao) return;
  const item = siteData.publicacoes.find((publicacao) => publicacao.id === id);
  if (!item || !confirm(`Excluir “${item.titulo || "esta publicação"}”?`)) return;

  operacao = true;
  try {
    const remoto = await recarregarSiteDataSharePoint();
    remoto.publicacoes = remoto.publicacoes.filter((publicacao) => publicacao.id !== id);
    remoto.atualizadoEm = new Date().toISOString();
    await gravarSiteData(remoto);
    siteData = remoto;
    renderizarPublicacoesSharePoint();
    if (valor("pubId") === id) limparFormulario();
    mostrarToast("Publicação excluída no SharePoint.", "success");
  } catch (erro) {
    console.error(erro);
    mostrarToast(mensagemErro(erro), "error");
  } finally {
    operacao = false;
  }
}

function editarPublicacaoSharePoint(id) {
  const item = siteData?.publicacoes.find((publicacao) => publicacao.id === id);
  if (!item) return;

  definirValor("pubId", item.id || "");
  definirValor("pubTitulo", item.titulo || "");
  definirValor("pubResumo", item.resumo || "");
  definirValor("pubConteudo", item.conteudo || "");
  definirValor("pubLocal", item.local || "avisos");
  definirValor("pubEstilo", item.estilo || "padrao");
  definirValor("pubDataInicial", normalizarData(item.dataInicial));
  definirValor("pubDataFinal", normalizarData(item.dataFinal));
  definirValor("pubImagemAtual", item.imagem || "");
  definirValor("pubLink", item.link || "");
  definirValor("pubBotao", item.botao || "");
  const publicado = document.getElementById("pubPublicado");
  if (publicado) publicado.checked = item.publicado === true;
  const nomeImagem = document.getElementById("pubImagemNome");
  if (nomeImagem) nomeImagem.textContent = item.imagem ? `Imagem atual: ${item.imagem}` : "Nenhuma imagem selecionada";
  const titulo = document.getElementById("tituloEditorPublicacao");
  if (titulo) titulo.textContent = "Editar publicação";
  const status = document.getElementById("statusEditorPublicacao");
  if (status) status.textContent = item.publicado === true ? "Publicada" : "Rascunho";
  definirStatusPublicacao("");
  document.getElementById("formPublicacao")?.dispatchEvent(new Event("input", { bubbles: true }));
  document.getElementById("formPublicacao")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderizarPublicacoesSharePoint() {
  const lista = document.getElementById("listaPublicacoes");
  const contador = document.getElementById("contadorPublicacoes");
  if (!lista || !siteData) return;

  const itens = [...siteData.publicacoes]
    .sort((a, b) => String(b.atualizadoEm || "").localeCompare(String(a.atualizadoEm || "")))
    .filter((item) => {
      if (!busca) return true;
      return [item.titulo, item.resumo, item.conteudo, item.local]
        .some((texto) => String(texto || "").toLocaleLowerCase("pt-BR").includes(busca));
    });

  if (contador) contador.textContent = String(siteData.publicacoes.length);
  lista.replaceChildren();

  if (!itens.length) {
    const vazio = document.createElement("div");
    vazio.className = "emptyList";
    vazio.textContent = busca ? "Nenhuma publicação encontrada." : "Ainda não há publicações.";
    lista.appendChild(vazio);
    return;
  }

  itens.forEach((item) => lista.appendChild(criarCard(item)));
}

function criarCard(item) {
  const card = document.createElement("article");
  card.className = "publicationCard";

  const topo = document.createElement("div");
  topo.className = "publicationTop";
  const titulo = document.createElement("h4");
  titulo.textContent = item.titulo || "Publicação sem título";
  topo.appendChild(titulo);
  card.appendChild(topo);

  const meta = document.createElement("div");
  meta.className = "publicationMeta";
  meta.append(criarPill(item.publicado === true ? "Publicado" : "Rascunho", item.publicado === true ? "live" : "draft"));
  meta.append(criarPill(rotuloLocal(item.local)));
  card.appendChild(meta);

  if (item.resumo || item.conteudo) {
    const resumo = document.createElement("p");
    resumo.textContent = item.resumo || item.conteudo;
    card.appendChild(resumo);
  }

  const acoes = document.createElement("div");
  acoes.className = "cardActions";
  acoes.append(
    criarAcao("Editar", "editar", item.id, "miniButton"),
    criarAcao("Excluir", "excluir", item.id, "miniButton danger")
  );
  card.appendChild(acoes);
  return card;
}

function criarPill(texto, classe = "") {
  const pill = document.createElement("span");
  pill.className = `metaPill ${classe}`.trim();
  pill.textContent = texto;
  return pill;
}

function criarAcao(texto, acao, id, classe) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = classe;
  botao.dataset.spCmsAction = acao;
  botao.dataset.id = id;
  botao.textContent = texto;
  return botao;
}

async function recarregarSiteDataSharePoint() {
  const resposta = await graphResponse(`/drives/${cmsDriveId}/root:/${codificarCaminho(CONFIG.dataPath)}:/content`, { cache: "no-store" });
  if (!resposta.ok) throw new Error("FALHA_RECARREGAR_CMS");
  return normalizarSiteData(await resposta.json());
}

async function gravarSiteData(dados) {
  await gravarArquivoTexto(CONFIG.dataPath, JSON.stringify(normalizarSiteData(dados), null, 2) + "\n", "application/json");
}

async function gravarArquivoTexto(caminho, texto, mime) {
  const resposta = await graphResponse(`/drives/${cmsDriveId}/root:/${codificarCaminho(caminho)}:/content`, {
    method: "PUT",
    headers: { "Content-Type": mime },
    body: texto
  });
  if (!resposta.ok) throw new Error(`FALHA_GRAVAR_${caminho}`);
  return resposta;
}

async function enviarImagemSharePoint(arquivo, nome) {
  const caminho = `${CONFIG.imageRoot}/${nome}`;
  const resposta = await graphResponse(`/drives/${cmsDriveId}/root:/${codificarCaminho(caminho)}:/content`, {
    method: "PUT",
    headers: { "Content-Type": arquivo.type || "application/octet-stream" },
    body: arquivo
  });
  if (!resposta.ok) throw new Error("FALHA_UPLOAD_IMAGEM_SHAREPOINT");
}

function validarImagem(arquivo) {
  if (!IMAGE_TYPES.has(arquivo.type)) throw new Error("TIPO_IMAGEM_INVALIDO");
  if (arquivo.size <= 0 || arquivo.size > IMAGE_MAX_BYTES) throw new Error("TAMANHO_IMAGEM_INVALIDO");
}

function nomeArquivoSeguro(original) {
  const extensao = (original.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const base = slugificar(original.replace(/\.[^.]+$/, "")) || "imagem";
  return `${Date.now()}-${base}.${extensao}`;
}

function slugificar(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function normalizarSiteData(dados) {
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

function criarSiteDataVazio() {
  return {
    atualizadoEm: "",
    origem: "SHAREPOINT_CMS",
    cache: "fonte administrativa privada no SharePoint",
    home: {},
    publicacoes: [],
    banners: [],
    avisos: [],
    destaques: []
  };
}

function prepararInterfaceSharePoint() {
  document.getElementById("githubDialog")?.remove();
  ["btnConectarGithub", "btnConfigurarGithubInicio", "btnConfigurarGithubSistemas"].forEach((id) => document.getElementById(id)?.remove());

  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll(".compactSettings").forEach((painel) => {
      const h3 = painel.querySelector("h3");
      if (h3?.textContent?.trim() !== "GitHub") return;
      h3.textContent = "SharePoint";
      const p = painel.querySelector("p");
      if (p) p.textContent = "Conteúdo administrativo centralizado na conta Microsoft da escola e sincronizado automaticamente com o site.";
      const badge = painel.querySelector(".connectionBadge");
      if (badge) badge.textContent = "Conectando...";
    });

    document.querySelectorAll(".infoStrip p, .dashboardConnectionStrip p").forEach((p) => {
      if (/GitHub/i.test(p.textContent || "")) {
        p.textContent = "O SharePoint guarda as alterações administrativas; o GitHub publica o site automaticamente, sem token no navegador.";
      }
    });
  }));
}

function atualizarEstadoConexao(conectado) {
  const mini = document.getElementById("githubMiniStatus");
  if (mini) {
    mini.classList.toggle("connected", conectado);
    const texto = mini.querySelector("span:last-child");
    if (texto) texto.textContent = conectado ? "SharePoint conectado" : "SharePoint indisponível";
  }
  document.querySelectorAll(".connectionBadge").forEach((badge) => {
    if (badge.id === "githubStatusBadge" || /Conectando|Configurado|Não configurado|SharePoint/i.test(badge.textContent || "")) {
      badge.textContent = conectado ? "Conectado" : "Indisponível";
      badge.classList.toggle("connected", conectado);
    }
  });
  const statusSistema = document.getElementById("statusSistema");
  if (statusSistema) statusSistema.textContent = conectado
    ? "Painel conectado ao SharePoint. Publicação automática ativa após a sincronização do GitHub Actions."
    : "Não foi possível conectar ao SharePoint.";
}

function mostrarListaCarregando() {
  const lista = document.getElementById("listaPublicacoes");
  if (!lista) return;
  const aviso = document.createElement("div");
  aviso.className = "emptyList";
  aviso.textContent = "Carregando publicações do SharePoint...";
  lista.replaceChildren(aviso);
}

function limparFormulario() {
  const form = document.getElementById("formPublicacao");
  form?.reset();
  definirValor("pubId", "");
  definirValor("pubImagemAtual", "");
  definirValor("pubLocal", "avisos");
  definirValor("pubEstilo", "padrao");
  const publicado = document.getElementById("pubPublicado");
  if (publicado) publicado.checked = true;
  const imagem = document.getElementById("pubImagemNome");
  if (imagem) imagem.textContent = "Nenhuma imagem selecionada";
  const titulo = document.getElementById("tituloEditorPublicacao");
  if (titulo) titulo.textContent = "Publicação";
  const status = document.getElementById("statusEditorPublicacao");
  if (status) status.textContent = "Nova";
  form?.dispatchEvent(new Event("input", { bubbles: true }));
}

function definirStatusPublicacao(texto, tipo = "") {
  const status = document.getElementById("statusPublicacao");
  if (!status) return;
  status.textContent = texto;
  status.className = `inlineStatus ${tipo}`.trim();
}

function alternarBotao(botao, ocupado, texto) {
  if (!botao) return;
  botao.disabled = ocupado;
  botao.setAttribute("aria-busy", ocupado ? "true" : "false");
  botao.textContent = texto;
}

function mostrarToast(texto, tipo = "") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = texto;
  toast.className = `toast show ${tipo}`.trim();
  toastTimer = setTimeout(() => { toast.className = "toast"; }, 3300);
}

function mensagemErro(erro) {
  if (erro?.message === "TIPO_IMAGEM_INVALIDO") return "Use uma imagem JPG, PNG ou WebP.";
  if (erro?.message === "TAMANHO_IMAGEM_INVALIDO") return "A imagem deve ter até 10 MB.";
  if (/401|403/.test(String(erro?.message || ""))) return "Sua sessão Microsoft não possui permissão para gravar no SharePoint.";
  return "Não foi possível salvar no SharePoint agora.";
}

function valor(id) {
  return document.getElementById(id)?.value || "";
}

function definirValor(id, valorNovo) {
  const campo = document.getElementById(id);
  if (campo) campo.value = valorNovo;
}

function normalizarData(valorData) {
  return valorData ? String(valorData).slice(0, 10) : "";
}

function gerarId() {
  return globalThis.crypto?.randomUUID?.() || `pub-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function rotuloLocal(local) {
  return {
    avisos: "Avisos",
    destaques: "Destaques",
    banner: "Banner",
    informacoes: "Informações",
    documentos: "Documentos",
    sobre: "Nossa Escola",
    contato: "Contato",
    modal: "Aviso em destaque"
  }[local] || "Site";
}

function codificarCaminho(caminho) {
  return String(caminho || "").split("/").map(encodeURIComponent).join("/");
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
      ...(opcoes.body && !(opcoes.body instanceof Blob) && !(opcoes.body instanceof File) && typeof opcoes.body === "string" && opcoes.headers?.["Content-Type"] === undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(opcoes.headers || {})
    }
  });
}
