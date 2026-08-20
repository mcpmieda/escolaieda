const livroNav = document.getElementById("navLivroPonto");
const livroView = document.getElementById("view-livro");
const livroFrame = document.getElementById("livroPontoFrame");
const sidebar = document.getElementById("sidebar");
const tituloView = document.getElementById("tituloView");
const viewEyebrow = document.getElementById("viewEyebrow");
const topbar = document.querySelector(".topbar");
const topbarActions = topbar?.querySelector(".topbarActions");
const mobileMenu = document.getElementById("btnMenu");
const publicacoesView = document.getElementById("view-publicacoes");

let editorSiteFrame = null;

inicializarShellAdministrativo();
inicializarLivroPontoEmbutido();

function inicializarShellAdministrativo() {
  prepararHubConteudoSite();
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

function prepararHubConteudoSite() {
  document.querySelectorAll(".sideNav .navLink[href='./editor/'], #view-inicio a[href='./editor/']")
    .forEach((link) => link.remove());

  if (!publicacoesView) return;

  const cabecalho = publicacoesView.querySelector(".pageLead");
  const layoutPublicacoes = publicacoesView.querySelector(".publicationLayout");
  if (!cabecalho || !layoutPublicacoes || document.getElementById("conteudoSiteTabs")) return;

  const titulo = cabecalho.querySelector("h2");
  const descricao = cabecalho.querySelector("p");
  if (titulo) titulo.textContent = "Conteúdo do site.";
  if (descricao) descricao.textContent = "Publique avisos ou edite a página inicial sem sair do Centro de Administração.";

  const tabs = document.createElement("div");
  tabs.id = "conteudoSiteTabs";
  tabs.className = "contentHubTabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Conteúdo do site");
  tabs.innerHTML = `
    <button class="contentHubTab active" type="button" role="tab" aria-selected="true" data-content-mode="publicacoes">Publicações</button>
    <button class="contentHubTab" type="button" role="tab" aria-selected="false" data-content-mode="editor">Editar página</button>
  `;

  cabecalho.insertAdjacentElement("afterend", tabs);

  layoutPublicacoes.id = "conteudoPublicacoesPanel";
  layoutPublicacoes.classList.add("contentHubPanel", "active");

  const editorPanel = document.createElement("div");
  editorPanel.id = "conteudoEditorPanel";
  editorPanel.className = "contentHubPanel siteEditorPanel";
  editorPanel.innerHTML = `
    <iframe
      id="siteEditorFrame"
      class="siteEditorFrame"
      title="Editor visual da página inicial"
      data-src="./editor/?embed=1"
      loading="lazy"
    ></iframe>
  `;
  layoutPublicacoes.insertAdjacentElement("afterend", editorPanel);

  editorSiteFrame = document.getElementById("siteEditorFrame");
  editorSiteFrame?.addEventListener("load", prepararFrameEditorSite);

  tabs.querySelectorAll("[data-content-mode]").forEach((botao) => {
    botao.addEventListener("click", () => abrirModoConteudo(botao.dataset.contentMode || "publicacoes"));
  });
}

function abrirModoConteudo(modo) {
  const editorAtivo = modo === "editor";
  const painelPublicacoes = document.getElementById("conteudoPublicacoesPanel");
  const painelEditor = document.getElementById("conteudoEditorPanel");

  painelPublicacoes?.classList.toggle("active", !editorAtivo);
  painelEditor?.classList.toggle("active", editorAtivo);
  publicacoesView?.classList.toggle("editorMode", editorAtivo);

  document.querySelectorAll("#conteudoSiteTabs [data-content-mode]").forEach((botao) => {
    const ativo = botao.dataset.contentMode === modo;
    botao.classList.toggle("active", ativo);
    botao.setAttribute("aria-selected", String(ativo));
  });

  const btnConectar = document.getElementById("btnConectarGithub");
  const btnNova = document.getElementById("btnNovaPublicacao");
  if (btnConectar) btnConectar.hidden = editorAtivo;
  if (btnNova) btnNova.hidden = editorAtivo;

  if (editorAtivo && editorSiteFrame && !editorSiteFrame.getAttribute("src")) {
    editorSiteFrame.setAttribute("src", editorSiteFrame.dataset.src || "./editor/?embed=1");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function prepararFrameEditorSite() {
  try {
    const documento = editorSiteFrame?.contentDocument;
    if (!documento) return;

    if (!documento.getElementById("adminEmbeddedEditorStyle")) {
      const estilo = documento.createElement("style");
      estilo.id = "adminEmbeddedEditorStyle";
      estilo.textContent = `
        .editorBrand{display:none!important}
        .editorTopbar{grid-template-columns:auto auto minmax(260px,1fr)!important;padding:8px 12px!important;gap:10px!important}
        .editorTopbar .hideSmall{display:none!important}
        .topbarActions{justify-content:flex-end!important}
        .editorShell{height:100vh!important;min-height:0!important}
        @media(max-width:900px){.editorTopbar{grid-template-columns:auto minmax(220px,1fr)!important}.deviceSwitch{display:none!important}}
        @media(max-width:640px){.editorTopbar{grid-template-columns:minmax(0,1fr)!important}.editorHistory{display:none!important}.topbarActions{justify-content:flex-end!important}}
      `;
      documento.head.appendChild(estilo);
    }
  } catch (erro) {
    console.warn("Editor visual carregado sem ajuste de modo incorporado.", erro);
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
