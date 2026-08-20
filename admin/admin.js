import { PublicClientApplication } from "https://esm.sh/@azure/msal-browser@5.11.0";

const CONFIG = Object.freeze({
  clientId: "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",
  tenantId: "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",
  redirectUri: `${window.location.origin}/`,
  postLoginPath: "/admin/",
  siteId: "eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17",
  documentosAtivosListId: "7adea611-e627-4593-a0b0-cecf58744c16"
});

const SCOPES = ["User.Read", "Sites.ReadWrite.All"];
const VIEW_INFO = Object.freeze({
  inicio: ["Visão geral", "Centro de Administração"],
  publicacoes: ["Publicações", "Conteúdo do site"],
  sistemas: ["Sistemas", "Ferramentas da escola"]
});

const msal = new PublicClientApplication({
  auth: {
    clientId: CONFIG.clientId,
    authority: `https://login.microsoftonline.com/${CONFIG.tenantId}`,
    redirectUri: CONFIG.redirectUri
  },
  cache: { cacheLocation: "sessionStorage", storeAuthStateInCookie: false }
});

let account = null;
let graphToken = "";

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
  saudacaoTitulo: $("saudacaoTitulo")
};

limparCredenciaisGithubLegadas();
await msal.initialize();
inicializarEventos();
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

  document.addEventListener("click", (event) => {
    if (window.innerWidth > 820 || !el.sidebar?.classList.contains("open")) return;
    const alvo = event.target instanceof Node ? event.target : null;
    const clicouNoMenu = alvo && (el.sidebar.contains(alvo) || el.btnMenu?.contains(alvo));
    if (!clicouNoMenu) el.sidebar.classList.remove("open");
  });
}

async function inicializarSessao() {
  try {
    const resposta = await msal.handleRedirectPromise();
    if (resposta?.account) msal.setActiveAccount(resposta.account);
    account = msal.getActiveAccount() || msal.getAllAccounts()[0] || null;

    if (!account) {
      mostrarSomente("login");
      return;
    }

    msal.setActiveAccount(account);
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
  await msal.loginRedirect({ scopes: SCOPES, prompt: "select_account" });
}

async function sair() {
  sessionStorage.removeItem("escolaIedaDestinoLogin");
  await msal.logoutRedirect({ postLogoutRedirectUri: "https://escolaieda.com/" });
}

async function autenticarEValidar() {
  definirLoginStatus("Verificando autorização da Secretaria...");
  graphToken = await obterGraphToken();
  const permitido = await verificarAcessoSecretaria();

  if (!permitido) {
    mostrarSomente("restrito");
    return;
  }

  mostrarSomente("dashboard");
  preencherUsuario();
  if (el.statusSistema) el.statusSistema.textContent = "Painel pronto. Conectando conteúdo ao SharePoint...";
}

async function obterGraphToken() {
  try {
    const resposta = await msal.acquireTokenSilent({ scopes: SCOPES, account });
    return resposta.accessToken;
  } catch {
    await msal.acquireTokenRedirect({ scopes: SCOPES, account });
    throw new Error("Redirecionando para concluir a autorização Microsoft.");
  }
}

async function verificarAcessoSecretaria() {
  const resposta = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/items?$top=1`,
    { headers: { Authorization: `Bearer ${graphToken}` } }
  );
  return resposta.ok;
}

function preencherUsuario() {
  const nome = account?.name || account?.username || "Usuário autorizado";
  if (el.usuarioAtual) el.usuarioAtual.textContent = nome;
  if (el.userAvatar) el.userAvatar.textContent = nome.trim().charAt(0).toUpperCase() || "A";
  const primeiroNome = nome.trim().split(/\s+/)[0] || "Secretaria";
  if (el.saudacaoTitulo) el.saudacaoTitulo.textContent = `Olá, ${primeiroNome}.`;
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
  if (!nome) return;
  const destino = $(`view-${nome}`);
  if (!destino) return;

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelectorAll("[data-view]").forEach((botao) => {
    botao.classList.toggle("active", botao.dataset.view === nome);
  });
  destino.classList.add("active");

  const info = VIEW_INFO[nome];
  if (info) {
    if (el.tituloView) el.tituloView.textContent = info[0];
    if (el.viewEyebrow) el.viewEyebrow.textContent = info[1];
  }

  el.sidebar?.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function limparCredenciaisGithubLegadas() {
  ["escolaIedaGithubToken", "escolaIedaGithubRepo", "escolaIedaGithubBranch"].forEach((chave) => localStorage.removeItem(chave));
  ["escolaIedaGithubTokenSessao", "escolaIedaGithubToken"].forEach((chave) => sessionStorage.removeItem(chave));
}
