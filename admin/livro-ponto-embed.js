const livroNav = document.getElementById("navLivroPonto");
const livroView = document.getElementById("view-livro");
const livroFrame = document.getElementById("livroPontoFrame");
const sidebar = document.getElementById("sidebar");
const tituloView = document.getElementById("tituloView");
const viewEyebrow = document.getElementById("viewEyebrow");
const topbar = document.querySelector(".topbar");
const topbarActions = topbar?.querySelector(".topbarActions");
const mobileMenu = document.getElementById("btnMenu");

inicializarShellAdministrativo();
inicializarLivroPontoEmbutido();

function inicializarShellAdministrativo() {
  removerAtalhosDuplicadosDoEditor();
  prepararCabecalhosDasViews();

  if (topbarActions && mobileMenu && !topbarActions.contains(mobileMenu)) {
    topbarActions.prepend(mobileMenu);
  }

  document.querySelectorAll("[data-view]").forEach((controle) => {
    controle.addEventListener("click", () => {
      const nome = controle.dataset.view || "inicio";
      requestAnimationFrame(() => posicionarAcoesDaConta(nome));
    });
  });

  document.querySelectorAll("[data-view-target]").forEach((controle) => {
    controle.addEventListener("click", () => {
      const nome = controle.dataset.viewTarget || "inicio";
      requestAnimationFrame(() => posicionarAcoesDaConta(nome));
    });
  });

  requestAnimationFrame(() => posicionarAcoesDaConta("inicio"));
}

function removerAtalhosDuplicadosDoEditor() {
  document.querySelectorAll(".sideNav .navLink[href='./editor/'], #view-inicio a[href='./editor/']")
    .forEach((link) => link.remove());

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

function prepararCabecalhosDasViews() {
  const livroTitulo = livroView?.querySelector(".pageLead h2");
  const livroDescricao = livroView?.querySelector(".pageLead p");
  if (livroTitulo) livroTitulo.textContent = "Livro de Ponto";
  livroDescricao?.remove();

  const sistemasLead = document.querySelector("#view-sistemas .pageLead");
  if (sistemasLead && !sistemasLead.querySelector(":scope > .leadActions")) {
    const acoes = document.createElement("div");
    acoes.className = "leadActions";
    sistemasLead.appendChild(acoes);
  }

  const inicio = document.getElementById("view-inicio");
  if (inicio && !inicio.querySelector(":scope > .viewUtilityRow")) {
    const utilitarios = document.createElement("div");
    utilitarios.className = "viewUtilityRow";
    inicio.prepend(utilitarios);
  }
}

function posicionarAcoesDaConta(nome) {
  if (!topbarActions) return;

  let destino = null;
  if (nome === "inicio") {
    destino = document.querySelector("#view-inicio > .viewUtilityRow");
  } else {
    destino = document.querySelector(`#view-${nome} > .pageLead > .leadActions`);
  }

  if (destino && !destino.contains(topbarActions)) {
    destino.prepend(topbarActions);
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

  posicionarAcoesDaConta("livro");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function prepararFrameLivroPonto() {
  try {
    const documento = livroFrame?.contentDocument;
    if (!documento) return;

    const cabecalhoInterno = documento.querySelector(".top");
    if (cabecalhoInterno) cabecalhoInterno.style.display = "none";

    if (!documento.getElementById("adminEmbedTabsStyle")) {
      const estilo = documento.createElement("style");
      estilo.id = "adminEmbedTabsStyle";
      estilo.textContent = `
        .app{min-height:100vh!important}
        .main{display:flex!important;flex-direction:column!important;height:100vh!important;min-height:0!important}
        .side{display:flex!important;align-items:center!important;gap:8px!important;padding:10px 14px!important;overflow-x:auto!important;overflow-y:hidden!important;background:#111827!important;flex:0 0 auto!important}
        .side small{display:none!important}
        .side .tab{width:auto!important;min-width:max-content!important;margin:0!important;white-space:nowrap!important;padding:9px 14px!important}
        .content{flex:1 1 auto!important;min-height:0!important;padding:14px 16px!important;overflow:auto!important}
        @media(max-width:900px){.side{flex-wrap:nowrap!important}.side .tab{min-width:max-content!important}}
      `;
      documento.head.appendChild(estilo);
    }
  } catch (erro) {
    console.warn("Livro de Ponto carregado sem ajuste visual embutido.", erro);
  }
}
