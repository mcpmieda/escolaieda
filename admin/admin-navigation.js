const LIVRO_SUBGUIAS = new Set(["folha", "funcionarios", "recessos", "termos", "conferencia", "backup"]);
const NOTAS_SUBGUIAS = new Set(["notas", "boletim"]);

let restaurandoRota = false;
let livroSubguiaPendente = "folha";
let notasSubguiaPendente = "notas";

inicializarNavegacaoPersistente();

function inicializarNavegacaoPersistente() {
  document.addEventListener("click", registrarNavegacao);
  window.addEventListener("popstate", restaurarRotaAtual);

  requestAnimationFrame(prepararFramesPersistentes);

  if (document.readyState === "complete") {
    requestAnimationFrame(() => {
      prepararFramesPersistentes();
      restaurarRotaAtual();
    });
  } else {
    window.addEventListener("load", () => {
      prepararFramesPersistentes();
      restaurarRotaAtual();
    }, { once: true });
  }
}

function registrarNavegacao(event) {
  if (restaurandoRota) return;
  const alvo = event.target instanceof Element ? event.target : null;
  if (!alvo) return;

  const modoConteudo = alvo.closest("[data-content-mode]");
  if (modoConteudo) {
    const modo = modoConteudo.dataset.contentMode === "editor" ? "editor" : "publicacoes";
    definirRota(modo === "editor" ? "publicacoes/editor" : "publicacoes");
    return;
  }

  const livro = alvo.closest("[data-open-livro-ponto]");
  if (livro) {
    livroSubguiaPendente = "folha";
    definirRota("livro");
    requestAnimationFrame(() => {
      prepararFramesPersistentes();
      aplicarSubguiaLivro("folha");
    });
    return;
  }

  const notas = alvo.closest("[data-open-notas], [data-dashboard-notas]");
  if (notas) {
    notasSubguiaPendente = "notas";
    definirRota("notas");
    requestAnimationFrame(() => {
      prepararFramesPersistentes();
      aplicarSubguiaNotas("notas");
    });
    return;
  }

  const controleView = alvo.closest("[data-view], [data-view-target]");
  if (!controleView) return;

  const nome = controleView.dataset.view || controleView.dataset.viewTarget || "inicio";
  if (!["inicio", "publicacoes", "sistemas"].includes(nome)) return;

  definirRota(nome);
  if (nome === "publicacoes") {
    requestAnimationFrame(() => {
      if (!restaurandoRota) document.querySelector('[data-content-mode="publicacoes"]')?.click();
    });
  }
}

function definirRota(rota) {
  const hash = `#${rota}`;
  if (window.location.hash === hash) return;
  const url = new URL(window.location.href);
  url.hash = hash;
  history.pushState({ adminRoute: rota }, "", url);
}

function lerRotaAtual() {
  const valor = decodeURIComponent(window.location.hash.replace(/^#\/?/, "")).trim().toLowerCase();
  if (!valor) return { area: "inicio", subguia: "", explicita: false };

  const [areaBruta, subguiaBruta = ""] = valor.split("/");
  const area = ["inicio", "publicacoes", "sistemas", "livro", "notas"].includes(areaBruta)
    ? areaBruta
    : "inicio";

  return { area, subguia: subguiaBruta, explicita: true };
}

function restaurarRotaAtual() {
  const rota = lerRotaAtual();
  if (!rota.explicita && rota.area === "inicio") return;

  restaurandoRota = true;
  try {
    if (rota.area === "livro") {
      livroSubguiaPendente = LIVRO_SUBGUIAS.has(rota.subguia) ? rota.subguia : "folha";
      document.querySelector("[data-open-livro-ponto]")?.click();
      requestAnimationFrame(() => {
        prepararFramesPersistentes();
        aplicarSubguiaLivro(livroSubguiaPendente);
      });
      return;
    }

    if (rota.area === "notas") {
      notasSubguiaPendente = NOTAS_SUBGUIAS.has(rota.subguia) ? rota.subguia : "notas";
      document.querySelector("[data-open-notas]")?.click();
      requestAnimationFrame(() => {
        prepararFramesPersistentes();
        aplicarSubguiaNotas(notasSubguiaPendente);
      });
      return;
    }

    document.querySelector(`[data-view="${rota.area}"]`)?.click();

    if (rota.area === "publicacoes") {
      const modo = rota.subguia === "editor" ? "editor" : "publicacoes";
      document.querySelector(`[data-content-mode="${modo}"]`)?.click();
    }
  } finally {
    restaurandoRota = false;
  }
}

function prepararFramesPersistentes() {
  prepararFrameLivro();
  prepararFrameNotas();
}

function prepararFrameLivro() {
  const frame = document.getElementById("livroPontoFrame");
  if (!frame || frame.dataset.adminNavigationBound === "1") return;
  frame.dataset.adminNavigationBound = "1";
  frame.addEventListener("load", configurarNavegacaoLivro);
}

function configurarNavegacaoLivro() {
  const frame = document.getElementById("livroPontoFrame");
  const documento = frame?.contentDocument;
  if (!documento) return;

  documento.querySelectorAll(".tab[data-tab]").forEach((tab) => {
    if (tab.dataset.adminRouteBound === "1") return;
    tab.dataset.adminRouteBound = "1";
    tab.addEventListener("click", () => {
      if (restaurandoRota) return;
      const subguia = LIVRO_SUBGUIAS.has(tab.dataset.tab) ? tab.dataset.tab : "folha";
      livroSubguiaPendente = subguia;
      definirRota(subguia === "folha" ? "livro" : `livro/${subguia}`);
    });
  });

  const rota = lerRotaAtual();
  if (rota.area === "livro") aplicarSubguiaLivro(livroSubguiaPendente);
}

function aplicarSubguiaLivro(subguia) {
  const frame = document.getElementById("livroPontoFrame");
  const documento = frame?.contentDocument;
  if (!documento || !LIVRO_SUBGUIAS.has(subguia)) return;
  const tab = documento.querySelector(`.tab[data-tab="${subguia}"]`);
  if (tab && !tab.classList.contains("on")) tab.click();
}

function prepararFrameNotas() {
  const frame = document.getElementById("notasFrame");
  if (!frame || frame.dataset.adminNavigationBound === "1") return;
  frame.dataset.adminNavigationBound = "1";
  frame.addEventListener("load", configurarNavegacaoNotas);
}

function configurarNavegacaoNotas() {
  const frame = document.getElementById("notasFrame");
  const documento = frame?.contentDocument;
  const janela = frame?.contentWindow;
  if (!documento || !janela) return;

  documento.querySelectorAll(".railNav [data-view]").forEach((botao) => {
    if (botao.dataset.adminRouteBound === "1") return;
    botao.dataset.adminRouteBound = "1";
    botao.addEventListener("click", () => {
      if (restaurandoRota) return;
      const subguia = NOTAS_SUBGUIAS.has(botao.dataset.view) ? botao.dataset.view : "notas";
      notasSubguiaPendente = subguia;
      definirRota(subguia === "notas" ? "notas" : `notas/${subguia}`);
    });
  });

  if (frame.__adminNavigationWindow !== janela) {
    janela.addEventListener("hashchange", sincronizarHashNotas);
    frame.__adminNavigationWindow = janela;
  }

  const rota = lerRotaAtual();
  if (rota.area === "notas") aplicarSubguiaNotas(notasSubguiaPendente);
}

function sincronizarHashNotas() {
  if (restaurandoRota) return;
  const frame = document.getElementById("notasFrame");
  let subguia = "notas";
  try {
    const hash = frame?.contentWindow?.location.hash.replace(/^#/, "") || "";
    if (NOTAS_SUBGUIAS.has(hash)) subguia = hash;
  } catch {
    return;
  }
  notasSubguiaPendente = subguia;
  definirRota(subguia === "notas" ? "notas" : `notas/${subguia}`);
}

function aplicarSubguiaNotas(subguia) {
  const frame = document.getElementById("notasFrame");
  if (!frame || !NOTAS_SUBGUIAS.has(subguia)) return;

  const hash = `#${subguia}`;
  try {
    const janela = frame.contentWindow;
    if (janela && janela.location.pathname.includes("/notas/")) {
      if (janela.location.hash !== hash) janela.location.hash = hash;
      return;
    }
  } catch {
    // O fallback pelo atributo src abaixo cobre carregamentos ainda em andamento.
  }

  const base = (frame.dataset.src || "../notas/?embed=1").split("#")[0];
  const destino = `${base}${hash}`;
  if (frame.getAttribute("src") !== destino) frame.setAttribute("src", destino);
}
