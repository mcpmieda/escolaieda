const livroNav = document.getElementById("navLivroPonto");
const livroView = document.getElementById("view-livro");
const livroFrame = document.getElementById("livroPontoFrame");
const sidebar = document.getElementById("sidebar");
const tituloView = document.getElementById("tituloView");
const viewEyebrow = document.getElementById("viewEyebrow");
const topbar = document.querySelector(".topbar");
const topbarActions = topbar?.querySelector(".topbarActions");
const mobileMenu = document.getElementById("btnMenu");
const loginView = document.getElementById("loginView");
const restrictedView = document.getElementById("restrictedView");
const dashboard = document.getElementById("dashboard");

inicializarShellUnificado();
inicializarLivroPontoEmbutido();

function inicializarShellUnificado() {
  prepararAutenticacaoSemFlash();
  reorganizarNavegacao();
  prepararCabecalhosContextuais();
  observarTrocaDeView();
}

function prepararAutenticacaoSemFlash() {
  if (!loginView) return;

  const possuiCacheMicrosoft = Object.keys(sessionStorage).some((chave) => {
    const normalizada = chave.toLowerCase();
    return normalizada.includes("msal") || normalizada.includes("bc2ecead-5f2e-48b8-9d48-9d01f2848cfa");
  });

  const revelarLoginSeNecessario = () => {
    const dashboardVisivel = dashboard && !dashboard.classList.contains("hidden");
    const restritoVisivel = restrictedView && !restrictedView.classList.contains("hidden");
    const loginSolicitado = !loginView.classList.contains("hidden");

    if (dashboardVisivel || restritoVisivel) {
      loginView.classList.remove("authReady");
      return true;
    }

    if (loginSolicitado) loginView.classList.add("authReady");
    return false;
  };

  if (!possuiCacheMicrosoft) {
    requestAnimationFrame(() => loginView.classList.add("authReady"));
    return;
  }

  const observer = new MutationObserver(() => {
    if (revelarLoginSeNecessario()) observer.disconnect();
  });

  [loginView, restrictedView, dashboard].filter(Boolean).forEach((elemento) => {
    observer.observe(elemento, { attributes: true, attributeFilter: ["class"] });
  });

  if (revelarLoginSeNecessario()) observer.disconnect();
  setTimeout(() => {
    revelarLoginSeNecessario();
    observer.disconnect();
  }, 2600);
}

function reorganizarNavegacao() {
  const linkEditorSidebar = [...document.querySelectorAll(".sideNav .navLink")]
    .find((link) => link.getAttribute("href") === "./editor/");
  linkEditorSidebar?.remove();

  const heroEditor = document.querySelector("#view-inicio .heroActions a[href='./editor/']");
  heroEditor?.remove();

  const cardEditor = document.querySelector("#view-inicio .actionCard[href='./editor/']");
  cardEditor?.remove();

  const acoesPublicacoes = document.querySelector("#view-publicacoes .leadActions");
  if (acoesPublicacoes && !document.getElementById("btnEditarSitePublicacoes")) {
    const editarSite = document.createElement("a");
    editarSite.id = "btnEditarSitePublicacoes";
    editarSite.className = "button buttonSecondary";
    editarSite.href = "./editor/";
    editarSite.innerHTML = "<span aria-hidden=\"true\">◫</span> Editar site";
    acoesPublicacoes.prepend(editarSite);
  }
}

function prepararCabecalhosContextuais() {
  if (!topbarActions) return;

  const livroLead = livroView?.querySelector(".pageLead");
  if (livroLead) {
    livroLead.querySelector(".eyebrow")?.replaceChildren("Secretaria");
    livroLead.querySelector("h2")?.replaceChildren("Livro de Ponto");
    livroLead.querySelector("p")?.remove();
  }

  topbar?.classList.add("legacyTopbar");
  posicionarAcoesNaViewAtiva();
}

function observarTrocaDeView() {
  document.querySelectorAll("[data-view], [data-view-target]").forEach((controle) => {
    controle.addEventListener("click", () => requestAnimationFrame(posicionarAcoesNaViewAtiva));
  });

  document.querySelectorAll("[data-open-livro-ponto]").forEach((controle) => {
    controle.addEventListener("click", () => requestAnimationFrame(posicionarAcoesNaViewAtiva));
  });

  const workspace = document.querySelector(".workspace");
  if (!workspace) return;
  new MutationObserver(posicionarAcoesNaViewAtiva).observe(workspace, {
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
  });
}

function posicionarAcoesNaViewAtiva() {
  if (!topbarActions) return;
  const ativa = document.querySelector(".view.active");
  if (!ativa) return;

  let destino = ativa.querySelector(":scope > .pageLead");

  if (!destino) {
    destino = ativa.querySelector(":scope > .contextHeader");
    if (!destino) {
      destino = document.createElement("div");
      destino.className = "contextHeader";
      ativa.prepend(destino);
    }
  }

  let direita = destino.querySelector(":scope > .contextHeaderRight");
  if (!direita) {
    direita = document.createElement("div");
    direita.className = "contextHeaderRight";
    const leadActions = destino.querySelector(":scope > .leadActions");
    if (leadActions) direita.appendChild(leadActions);
    destino.appendChild(direita);
  }

  if (!direita.contains(topbarActions)) direita.prepend(topbarActions);

  if (mobileMenu && !topbarActions.contains(mobileMenu)) {
    topbarActions.prepend(mobileMenu);
  }
}

function inicializarLivroPontoEmbutido() {
  document.querySelectorAll("[data-open-livro-ponto]").forEach((controle) => {
    controle.addEventListener("click", abrirLivroPonto);
  });

  document.addEventListener("click", (event) => {
    const outraNavegacao = event.target.closest("[data-view], [data-view-target], .navLink");
    if (outraNavegacao && !event.target.closest("[data-open-livro-ponto]")) {
      livroNav?.classList.remove("active");
    }
  });

  livroFrame?.addEventListener("load", prepararFrameLivroPonto);
}

function abrirLivroPonto(event) {
  event?.preventDefault();

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelectorAll("[data-view]").forEach((controle) => controle.classList.remove("active"));

  livroView?.classList.add("active");
  livroNav?.classList.add("active");
  sidebar?.classList.remove("open");

  if (tituloView) tituloView.textContent = "Livro de Ponto";
  if (viewEyebrow) viewEyebrow.textContent = "Secretaria";

  if (livroFrame && !livroFrame.getAttribute("src")) {
    livroFrame.setAttribute("src", livroFrame.dataset.src || "./livro-ponto/");
  }

  requestAnimationFrame(posicionarAcoesNaViewAtiva);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function prepararFrameLivroPonto() {
  try {
    const documento = livroFrame?.contentDocument;
    if (!documento) return;

    const cabecalhoInterno = documento.querySelector(".top");
    const app = documento.querySelector(".app");
    const main = documento.querySelector(".main");
    const side = documento.querySelector(".side");

    if (cabecalhoInterno) cabecalhoInterno.style.display = "none";
    if (app) app.style.minHeight = "100vh";
    if (main) main.style.height = "100vh";
    side?.querySelector("small")?.remove();

    if (!documento.getElementById("adminEmbedLayout")) {
      const estilo = documento.createElement("style");
      estilo.id = "adminEmbedLayout";
      estilo.textContent = `
        .main{display:flex!important;flex-direction:column!important;height:100vh!important;min-height:0!important}
        .side{display:flex!important;align-items:center!important;gap:8px!important;padding:12px 14px!important;overflow-x:auto!important;overflow-y:hidden!important;background:#111827!important;flex:0 0 auto!important}
        .side .tab{width:auto!important;min-width:max-content!important;margin:0!important;white-space:nowrap!important;padding:10px 14px!important}
        .content{flex:1 1 auto!important;min-height:0!important;padding:14px 16px!important;overflow:auto!important}
        @media(max-width:900px){.side{display:flex!important;flex-wrap:nowrap!important}.tab{min-width:max-content!important}.main{height:100vh!important}}
      `;
      documento.head.appendChild(estilo);
    }
  } catch (erro) {
    console.warn("Livro de Ponto carregado sem ajuste visual embutido.", erro);
  }
}
