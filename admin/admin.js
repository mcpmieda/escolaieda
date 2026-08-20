import { PublicClientApplication } from "https://esm.sh/@azure/msal-browser@5.11.0";

const CONFIG = {
  clientId: "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",
  tenantId: "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",
  redirectUri: `${window.location.origin}/`,
  postLoginPath: "/admin/",
  siteId: "eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17",
  documentosAtivosListId: "7adea611-e627-4593-a0b0-cecf58744c16"
};

const GITHUB = {
  repo: "mcpmieda/escolaieda",
  branch: "main",
  dataPath: "site-data/publicacoes-publicas.json",
  imageRoot: "imagens/publicacoes"
};

const STORAGE_GITHUB_TOKEN = "escolaIedaGithubToken";
const SESSION_GITHUB_TOKEN = "escolaIedaGithubTokenSessao";

const loginRequest = {
  scopes: ["User.Read", "Sites.ReadWrite.All"],
  prompt: "select_account"
};
const tokenRequest = { scopes: ["User.Read", "Sites.ReadWrite.All"] };

const msal = new PublicClientApplication({
  auth: {
    clientId: CONFIG.clientId,
    authority: `https://login.microsoftonline.com/${CONFIG.tenantId}`,
    redirectUri: CONFIG.redirectUri
  },
  cache: { cacheLocation: "sessionStorage", storeAuthStateInCookie: false }
});

const estado = {
  account: null,
  graphToken: "",
  siteData: criarSiteDataVazio(),
  busca: "",
  operacao: false,
  toastTimer: null
};

const $ = (id) => document.getElementById(id);
const el = {
  loginView: $("loginView"),
  restrictedView: $("restrictedView"),
  dashboard: $("dashboard"),
  loginStatus: $("loginStatus"),
  btnEntrar: $("btnEntrar"),
  btnTrocarConta: $("btnTrocarConta"),
  btnSair: $("btnSair"),
  btnMenu: $("btnMenu"),
  sidebar: $("sidebar"),
  tituloView: $("tituloView"),
  viewEyebrow: $("viewEyebrow"),
  usuarioAtual: $("usuarioAtual"),
  userAvatar: $("userAvatar"),
  statusSistema: $("statusSistema"),
  saudacaoTitulo: $("saudacaoTitulo"),
  githubMiniStatus: $("githubMiniStatus"),
  githubStatusBadge: $("githubStatusBadge"),
  githubDialog: $("githubDialog"),
  githubForm: $("githubForm"),
  githubTokenInput: $("githubTokenInput"),
  githubRemember: $("githubRemember"),
  githubDialogStatus: $("githubDialogStatus"),
  btnCancelarGithub: $("btnCancelarGithub"),
  btnConectarGithub: $("btnConectarGithub"),
  btnConfigurarGithubInicio: $("btnConfigurarGithubInicio"),
  btnConfigurarGithubSistemas: $("btnConfigurarGithubSistemas"),
  formPublicacao: $("formPublicacao"),
  btnNovaPublicacao: $("btnNovaPublicacao"),
  btnCancelarEdicao: $("btnCancelarEdicao"),
  tituloEditorPublicacao: $("tituloEditorPublicacao"),
  statusEditorPublicacao: $("statusEditorPublicacao"),
  statusPublicacao: $("statusPublicacao"),
  pubId: $("pubId"),
  pubTitulo: $("pubTitulo"),
  pubResumo: $("pubResumo"),
  pubConteudo: $("pubConteudo"),
  pubLocal: $("pubLocal"),
  pubEstilo: $("pubEstilo"),
  pubDataInicial: $("pubDataInicial"),
  pubDataFinal: $("pubDataFinal"),
  pubImagemArquivo: $("pubImagemArquivo"),
  pubImagemNome: $("pubImagemNome"),
  pubImagemAtual: $("pubImagemAtual"),
  pubLink: $("pubLink"),
  pubBotao: $("pubBotao"),
  pubPublicado: $("pubPublicado"),
  buscaPublicacoes: $("buscaPublicacoes"),
  listaPublicacoes: $("listaPublicacoes"),
  contadorPublicacoes: $("contadorPublicacoes"),
  toast: $("toast")
};

const VIEW_INFO = {
  inicio: ["Visão geral", "Centro de Administração"],
  publicacoes: ["Publicações", "Conteúdo do site"],
  sistemas: ["Sistemas", "Ferramentas da escola"]
};

await msal.initialize();
inicializarEventos();
atualizarEstadoGithub();
await inicializarSessao();

function inicializarEventos() {
  el.btnEntrar?.addEventListener("click", entrar);
  el.btnTrocarConta?.addEventListener("click", entrar);
  el.btnSair?.addEventListener("click", sair);
  el.btnMenu?.addEventListener("click", () => el.sidebar?.classList.toggle("open"));

  document.querySelectorAll("[data-view]").forEach((botao) => {
    botao.addEventListener("click", () => abrirView(botao.dataset.view));
  });
  document.querySelectorAll("[data-view-target]").forEach((botao) => {
    botao.addEventListener("click", () => abrirView(botao.dataset.viewTarget));
  });
  document.querySelectorAll(".navLink").forEach((link) => {
    link.addEventListener("click", () => el.sidebar?.classList.remove("open"));
  });

  [el.btnConectarGithub, el.btnConfigurarGithubInicio, el.btnConfigurarGithubSistemas]
    .filter(Boolean)
    .forEach((botao) => botao.addEventListener("click", abrirGithubDialog));

  el.btnCancelarGithub?.addEventListener("click", fecharGithubDialog);
  el.githubForm?.addEventListener("submit", salvarConfiguracaoGithub);
  el.formPublicacao?.addEventListener("submit", salvarPublicacao);
  el.btnNovaPublicacao?.addEventListener("click", () => {
    limparFormularioPublicacao();
    el.pubTitulo?.focus();
  });
  el.btnCancelarEdicao?.addEventListener("click", limparFormularioPublicacao);
  el.pubImagemArquivo?.addEventListener("change", atualizarNomeImagem);
  el.buscaPublicacoes?.addEventListener("input", () => {
    estado.busca = el.buscaPublicacoes.value.trim().toLocaleLowerCase("pt-BR");
    renderizarPublicacoes();
  });

  document.addEventListener("click", (event) => {
    if (window.innerWidth <= 820 && el.sidebar?.classList.contains("open")) {
      const clicouNoMenu = el.sidebar.contains(event.target) || el.btnMenu?.contains(event.target);
      if (!clicouNoMenu) el.sidebar.classList.remove("open");
    }
  });
}

async function inicializarSessao() {
  try {
    const resposta = await msal.handleRedirectPromise();
    if (resposta?.account) msal.setActiveAccount(resposta.account);
    estado.account = msal.getActiveAccount() || msal.getAllAccounts()[0] || null;

    if (!estado.account) {
      mostrarSomente("login");
      return;
    }

    msal.setActiveAccount(estado.account);
    await autenticarEValidar();
  } catch (erro) {
    console.error(erro);
    definirLoginStatus("Não foi possível concluir o login. Tente novamente.");
    mostrarSomente("login");
  }
}

async function entrar() {
  definirLoginStatus("Abrindo o login Microsoft...");
  sessionStorage.setItem("escolaIedaDestinoLogin", CONFIG.postLoginPath);
  await msal.loginRedirect(loginRequest);
}

async function sair() {
  sessionStorage.removeItem("escolaIedaDestinoLogin");
  await msal.logoutRedirect({ postLogoutRedirectUri: "https://escolaieda.com/" });
}

async function autenticarEValidar() {
  definirLoginStatus("Verificando autorização da Secretaria...");
  estado.graphToken = await obterGraphToken();
  const permitido = await verificarAcessoSecretaria();

  if (!permitido) {
    mostrarSomente("restrito");
    return;
  }

  mostrarSomente("dashboard");
  preencherUsuario();
  await carregarDadosPublicos();
}

async function obterGraphToken() {
  try {
    const resposta = await msal.acquireTokenSilent({ ...tokenRequest, account: estado.account });
    return resposta.accessToken;
  } catch {
    await msal.acquireTokenRedirect(tokenRequest);
    throw new Error("Redirecionando para concluir a autorização Microsoft.");
  }
}

async function verificarAcessoSecretaria() {
  const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/items?$top=1`;
  const resposta = await fetch(url, {
    headers: { Authorization: `Bearer ${estado.graphToken}` }
  });
  return resposta.ok;
}

function preencherUsuario() {
  const nome = estado.account?.name || estado.account?.username || "Usuário autorizado";
  el.usuarioAtual.textContent = nome;
  el.userAvatar.textContent = nome.trim().charAt(0).toUpperCase() || "A";
  const primeiroNome = nome.trim().split(/\s+/)[0] || "Secretaria";
  el.saudacaoTitulo.textContent = `Olá, ${primeiroNome}.`;
}

function mostrarSomente(tipo) {
  el.loginView?.classList.toggle("hidden", tipo !== "login");
  el.restrictedView?.classList.toggle("hidden", tipo !== "restrito");
  el.dashboard?.classList.toggle("hidden", tipo !== "dashboard");
}

function definirLoginStatus(texto) {
  if (el.loginStatus) el.loginStatus.textContent = texto;
}

function abrirView(nome) {
  if (!VIEW_INFO[nome]) nome = "inicio";
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelectorAll("[data-view]").forEach((botao) => botao.classList.toggle("active", botao.dataset.view === nome));
  $(`view-${nome}`)?.classList.add("active");
  el.tituloView.textContent = VIEW_INFO[nome][0];
  el.viewEyebrow.textContent = VIEW_INFO[nome][1];
  el.sidebar?.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function carregarDadosPublicos() {
  el.statusSistema.textContent = "Carregando conteúdo do site...";
  try {
    const resposta = await fetch(`../site-data/publicacoes-publicas.json?v=${Date.now()}`, { cache: "no-store" });
    if (!resposta.ok) throw new Error("Fonte pública indisponível.");
    estado.siteData = normalizarSiteData(await resposta.json());
    renderizarPublicacoes();
    el.statusSistema.textContent = "Painel pronto.";
  } catch (erro) {
    console.error(erro);
    estado.siteData = criarSiteDataVazio();
    renderizarPublicacoes();
    el.statusSistema.textContent = "Não foi possível carregar as publicações agora.";
  }
}

function criarSiteDataVazio() {
  return { atualizadoEm: "", origem: "GITHUB", cache: "fonte direta do repositório", home: {}, publicacoes: [] };
}

function normalizarSiteData(dados) {
  const base = dados && typeof dados === "object" && !Array.isArray(dados) ? dados : {};
  return {
    ...base,
    home: base.home && typeof base.home === "object" ? base.home : {},
    publicacoes: Array.isArray(base.publicacoes) ? base.publicacoes : []
  };
}

function renderizarPublicacoes() {
  if (!el.listaPublicacoes) return;
  const publicacoes = [...estado.siteData.publicacoes]
    .sort((a, b) => String(b.atualizadoEm || "").localeCompare(String(a.atualizadoEm || "")))
    .filter((item) => {
      if (!estado.busca) return true;
      return [item.titulo, item.resumo, item.conteudo, item.local]
        .some((valor) => String(valor || "").toLocaleLowerCase("pt-BR").includes(estado.busca));
    });

  el.listaPublicacoes.replaceChildren();
  el.contadorPublicacoes.textContent = String(estado.siteData.publicacoes.length);

  if (!publicacoes.length) {
    const vazio = document.createElement("div");
    vazio.className = "emptyList";
    vazio.textContent = estado.busca ? "Nenhuma publicação encontrada." : "Ainda não há publicações. Crie a primeira quando precisar.";
    el.listaPublicacoes.appendChild(vazio);
    return;
  }

  publicacoes.forEach((item) => el.listaPublicacoes.appendChild(criarCardPublicacao(item)));
}

function criarCardPublicacao(item) {
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
  meta.append(
    criarPill(item.publicado === true ? "Publicado" : "Rascunho", item.publicado === true ? "live" : "draft"),
    criarPill(rotuloLocal(item.local))
  );
  card.appendChild(meta);

  if (item.resumo || item.conteudo) {
    const resumo = document.createElement("p");
    resumo.textContent = item.resumo || item.conteudo;
    card.appendChild(resumo);
  }

  const acoes = document.createElement("div");
  acoes.className = "cardActions";
  const editar = document.createElement("button");
  editar.type = "button";
  editar.className = "miniButton";
  editar.textContent = "Editar";
  editar.addEventListener("click", () => editarPublicacao(item.id));
  const excluir = document.createElement("button");
  excluir.type = "button";
  excluir.className = "miniButton danger";
  excluir.textContent = "Excluir";
  excluir.addEventListener("click", () => excluirPublicacao(item.id));
  acoes.append(editar, excluir);
  card.appendChild(acoes);

  return card;
}

function criarPill(texto, classe = "") {
  const pill = document.createElement("span");
  pill.className = `metaPill ${classe}`.trim();
  pill.textContent = texto;
  return pill;
}

function rotuloLocal(local) {
  const locais = {
    avisos: "Avisos",
    destaques: "Destaques",
    banner: "Banner",
    informacoes: "Informações",
    documentos: "Documentos",
    sobre: "Nossa Escola",
    contato: "Contato",
    modal: "Aviso em destaque"
  };
  return locais[local] || "Site";
}

function editarPublicacao(id) {
  const item = estado.siteData.publicacoes.find((publicacao) => publicacao.id === id);
  if (!item) return;
  abrirView("publicacoes");
  el.pubId.value = item.id || "";
  el.pubTitulo.value = item.titulo || "";
  el.pubResumo.value = item.resumo || "";
  el.pubConteudo.value = item.conteudo || "";
  el.pubLocal.value = item.local || "avisos";
  el.pubEstilo.value = item.estilo || "padrao";
  el.pubDataInicial.value = normalizarDataInput(item.dataInicial);
  el.pubDataFinal.value = normalizarDataInput(item.dataFinal);
  el.pubImagemAtual.value = item.imagem || "";
  el.pubImagemNome.textContent = item.imagem ? `Imagem atual: ${item.imagem}` : "Nenhuma imagem selecionada";
  el.pubLink.value = item.link || "";
  el.pubBotao.value = item.botao || "";
  el.pubPublicado.checked = item.publicado === true;
  el.tituloEditorPublicacao.textContent = "Editar publicação";
  el.statusEditorPublicacao.textContent = item.publicado === true ? "Publicada" : "Rascunho";
  definirStatusPublicacao("");
  el.formPublicacao.scrollIntoView({ behavior: "smooth", block: "start" });
}

function limparFormularioPublicacao() {
  el.formPublicacao?.reset();
  el.pubId.value = "";
  el.pubImagemAtual.value = "";
  el.pubImagemNome.textContent = "Nenhuma imagem selecionada";
  el.pubPublicado.checked = true;
  el.pubLocal.value = "avisos";
  el.pubEstilo.value = "padrao";
  el.tituloEditorPublicacao.textContent = "Nova publicação";
  el.statusEditorPublicacao.textContent = "Nova";
  definirStatusPublicacao("");
}

function atualizarNomeImagem() {
  const arquivo = el.pubImagemArquivo.files?.[0];
  el.pubImagemNome.textContent = arquivo ? arquivo.name : (el.pubImagemAtual.value ? `Imagem atual: ${el.pubImagemAtual.value}` : "Nenhuma imagem selecionada");
}

async function salvarPublicacao(event) {
  event.preventDefault();
  if (estado.operacao) return;
  if (!obterGithubToken()) {
    definirStatusPublicacao("Configure a conexão GitHub antes de salvar.", "error");
    abrirGithubDialog();
    return;
  }

  const titulo = el.pubTitulo.value.trim();
  if (!titulo) return;

  estado.operacao = true;
  definirStatusPublicacao("Salvando no site...");
  const botao = el.formPublicacao.querySelector("button[type='submit']");
  alternarBotao(botao, true, "Salvando...");

  try {
    const remoto = await obterSiteDataGithub();
    const id = el.pubId.value || gerarId();
    const anterior = remoto.dados.publicacoes.find((item) => item.id === id) || {};
    let imagem = el.pubImagemAtual.value || anterior.imagem || "";
    const arquivoImagem = el.pubImagemArquivo.files?.[0];
    if (arquivoImagem) imagem = await enviarImagemGithub(arquivoImagem);

    const item = {
      ...anterior,
      id,
      titulo,
      resumo: el.pubResumo.value.trim(),
      conteudo: el.pubConteudo.value.trim(),
      local: el.pubLocal.value,
      estilo: el.pubEstilo.value,
      imagem,
      imagemAlt: titulo,
      link: el.pubLink.value.trim(),
      botao: el.pubBotao.value.trim(),
      dataInicial: el.pubDataInicial.value || "",
      dataFinal: el.pubDataFinal.value || "",
      ordem: Number(anterior.ordem || 0),
      publicado: el.pubPublicado.checked,
      destaque: el.pubLocal.value === "destaques",
      atualizadoEm: new Date().toISOString()
    };

    const indice = remoto.dados.publicacoes.findIndex((publicacao) => publicacao.id === id);
    if (indice >= 0) remoto.dados.publicacoes[indice] = item;
    else remoto.dados.publicacoes.unshift(item);

    remoto.dados.atualizadoEm = new Date().toISOString();
    remoto.dados.origem = "GITHUB_ADMIN";
    remoto.dados.cache = "fonte direta do repositório";
    await gravarSiteDataGithub(remoto.dados, remoto.sha, `site: ${indice >= 0 ? "atualizar" : "criar"} publicação ${titulo}`);

    estado.siteData = remoto.dados;
    renderizarPublicacoes();
    limparFormularioPublicacao();
    definirStatusPublicacao("Publicação salva com sucesso.", "success");
    mostrarToast("Publicação salva no site.", "success");
  } catch (erro) {
    console.error(erro);
    definirStatusPublicacao(mensagemAmigavelGithub(erro), "error");
    mostrarToast("Não foi possível salvar a publicação.", "error");
  } finally {
    estado.operacao = false;
    alternarBotao(botao, false, "Salvar publicação");
  }
}

async function excluirPublicacao(id) {
  const item = estado.siteData.publicacoes.find((publicacao) => publicacao.id === id);
  if (!item) return;
  if (!confirm(`Excluir “${item.titulo || "esta publicação"}”?`)) return;
  if (!obterGithubToken()) {
    abrirGithubDialog();
    return;
  }

  try {
    const remoto = await obterSiteDataGithub();
    remoto.dados.publicacoes = remoto.dados.publicacoes.filter((publicacao) => publicacao.id !== id);
    remoto.dados.atualizadoEm = new Date().toISOString();
    remoto.dados.origem = "GITHUB_ADMIN";
    remoto.dados.cache = "fonte direta do repositório";
    await gravarSiteDataGithub(remoto.dados, remoto.sha, `site: excluir publicação ${item.titulo || id}`);
    estado.siteData = remoto.dados;
    renderizarPublicacoes();
    if (el.pubId.value === id) limparFormularioPublicacao();
    mostrarToast("Publicação excluída.", "success");
  } catch (erro) {
    console.error(erro);
    mostrarToast(mensagemAmigavelGithub(erro), "error");
  }
}

function normalizarDataInput(valor) {
  return valor ? String(valor).slice(0, 10) : "";
}

function gerarId() {
  return globalThis.crypto?.randomUUID?.() || `pub-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function definirStatusPublicacao(texto, tipo = "") {
  el.statusPublicacao.textContent = texto;
  el.statusPublicacao.className = `inlineStatus ${tipo}`.trim();
}

function alternarBotao(botao, ocupado, texto) {
  if (!botao) return;
  botao.disabled = ocupado;
  botao.setAttribute("aria-busy", ocupado ? "true" : "false");
  botao.textContent = texto;
}

function obterGithubToken() {
  return sessionStorage.getItem(SESSION_GITHUB_TOKEN) || localStorage.getItem(STORAGE_GITHUB_TOKEN) || "";
}

function abrirGithubDialog() {
  el.githubTokenInput.value = "";
  el.githubRemember.checked = Boolean(localStorage.getItem(STORAGE_GITHUB_TOKEN));
  definirStatusGithubDialog(obterGithubToken() ? "Já existe uma conexão neste dispositivo. Você pode testar novamente ou trocar o token." : "");
  if (typeof el.githubDialog.showModal === "function") el.githubDialog.showModal();
  else el.githubDialog.setAttribute("open", "");
  setTimeout(() => el.githubTokenInput.focus(), 50);
}

function fecharGithubDialog() {
  if (typeof el.githubDialog.close === "function") el.githubDialog.close();
  else el.githubDialog.removeAttribute("open");
}

async function salvarConfiguracaoGithub(event) {
  event.preventDefault();
  const digitado = el.githubTokenInput.value.trim();
  const token = digitado || obterGithubToken();
  if (!token) {
    definirStatusGithubDialog("Informe um token GitHub.", "error");
    return;
  }

  const botao = el.githubForm.querySelector("button[type='submit']");
  alternarBotao(botao, true, "Testando...");
  definirStatusGithubDialog("Testando acesso ao repositório...");

  try {
    await githubRequest(`/contents/${GITHUB.dataPath}?ref=${encodeURIComponent(GITHUB.branch)}`, { token });
    if (el.githubRemember.checked) {
      localStorage.setItem(STORAGE_GITHUB_TOKEN, token);
      sessionStorage.removeItem(SESSION_GITHUB_TOKEN);
    } else {
      sessionStorage.setItem(SESSION_GITHUB_TOKEN, token);
      localStorage.removeItem(STORAGE_GITHUB_TOKEN);
    }
    atualizarEstadoGithub(true);
    definirStatusGithubDialog("Conexão confirmada.", "success");
    mostrarToast("GitHub conectado.", "success");
    setTimeout(fecharGithubDialog, 450);
  } catch (erro) {
    console.error(erro);
    definirStatusGithubDialog("Não foi possível acessar o repositório com esse token.", "error");
  } finally {
    alternarBotao(botao, false, "Testar e salvar");
  }
}

function definirStatusGithubDialog(texto, tipo = "") {
  el.githubDialogStatus.textContent = texto;
  el.githubDialogStatus.className = `inlineStatus ${tipo}`.trim();
}

function atualizarEstadoGithub(forcarConectado = false) {
  const conectado = forcarConectado || Boolean(obterGithubToken());
  if (el.githubMiniStatus) {
    el.githubMiniStatus.classList.toggle("connected", conectado);
    const texto = el.githubMiniStatus.querySelector("span:last-child");
    if (texto) texto.textContent = conectado ? "GitHub configurado" : "GitHub não configurado";
  }
  if (el.githubStatusBadge) {
    el.githubStatusBadge.textContent = conectado ? "Configurado" : "Não configurado";
    el.githubStatusBadge.classList.toggle("connected", conectado);
  }
}

async function obterSiteDataGithub() {
  const arquivo = await githubRequest(`/contents/${GITHUB.dataPath}?ref=${encodeURIComponent(GITHUB.branch)}`);
  const texto = decodificarBase64Utf8(arquivo.content || "");
  return { sha: arquivo.sha, dados: normalizarSiteData(JSON.parse(texto)) };
}

async function gravarSiteDataGithub(dados, sha, mensagem) {
  return githubRequest(`/contents/${GITHUB.dataPath}`, {
    method: "PUT",
    body: {
      message: mensagem,
      content: codificarBase64Utf8(JSON.stringify(dados, null, 2) + "\n"),
      sha,
      branch: GITHUB.branch
    }
  });
}

async function enviarImagemGithub(arquivo) {
  const extensao = (arquivo.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const base = slugificar(arquivo.name.replace(/\.[^.]+$/, "")) || "imagem";
  const caminho = `${GITHUB.imageRoot}/${Date.now()}-${base}.${extensao}`;
  const conteudo = await arquivoParaBase64(arquivo);
  await githubRequest(`/contents/${caminho}`, {
    method: "PUT",
    body: {
      message: `site: adicionar imagem ${arquivo.name}`,
      content: conteudo,
      branch: GITHUB.branch
    }
  });
  return `/${caminho}`;
}

async function githubRequest(path, { method = "GET", body = null, token = obterGithubToken() } = {}) {
  if (!token) throw new Error("GITHUB_TOKEN_AUSENTE");
  const resposta = await fetch(`https://api.github.com/repos/${GITHUB.repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    const erro = new Error(`GITHUB_${resposta.status}`);
    erro.status = resposta.status;
    erro.detalhe = detalhe;
    throw erro;
  }
  if (resposta.status === 204) return null;
  return resposta.json();
}

function codificarBase64Utf8(texto) {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  const bloco = 0x8000;
  for (let i = 0; i < bytes.length; i += bloco) {
    binario += String.fromCharCode(...bytes.subarray(i, i + bloco));
  }
  return btoa(binario);
}

function decodificarBase64Utf8(base64) {
  const limpo = String(base64).replace(/\s/g, "");
  const binario = atob(limpo);
  const bytes = Uint8Array.from(binario, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function arquivoParaBase64(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result).split(",")[1] || "");
    leitor.onerror = () => reject(new Error("FALHA_LEITURA_ARQUIVO"));
    leitor.readAsDataURL(arquivo);
  });
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

function mensagemAmigavelGithub(erro) {
  if (erro?.message === "GITHUB_TOKEN_AUSENTE") return "Configure a conexão GitHub antes de salvar.";
  if (erro?.status === 401 || erro?.status === 403) return "A conexão GitHub não tem permissão para salvar. Revise o token.";
  if (erro?.status === 409) return "O site foi alterado em outro lugar. Atualize a página e tente novamente.";
  if (erro?.status === 422) return "O GitHub recusou esta alteração. Confira os dados e tente novamente.";
  return "Não foi possível salvar no GitHub agora.";
}

function mostrarToast(texto, tipo = "") {
  if (!el.toast) return;
  clearTimeout(estado.toastTimer);
  el.toast.textContent = texto;
  el.toast.className = `toast show ${tipo}`.trim();
  estado.toastTimer = setTimeout(() => {
    el.toast.className = "toast";
  }, 3300);
}