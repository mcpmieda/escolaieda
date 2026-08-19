const HOME_URL = "/";
const FONTE_PUBLICA_URL = "/site-data/publicacoes-publicas.json";
const SCRIPT_RENDERIZADOR_PUBLICO = "/site-data/publicacoes-site.js";

const el = {
  btnPreviaPagina: document.getElementById("btnPreviaPagina"),
  overlay: document.getElementById("sitePreviewOverlay"),
  frame: document.getElementById("sitePreviewFrame"),
  viewport: document.getElementById("sitePreviewViewport"),
  status: document.getElementById("sitePreviewStatus"),
  btnDesktop: document.getElementById("btnPreviewDesktop"),
  btnMobile: document.getElementById("btnPreviewMobile"),
  btnFechar: document.getElementById("btnFecharPreview")
};

inicializarPrevia();

function inicializarPrevia() {
  el.btnPreviaPagina?.addEventListener("click", () => {
    const publicacoesAtivas = document.getElementById("cmsTab-conteudo")?.classList.contains("active") === true;
    abrirPrevia({ incluirRascunhoPublicacao: publicacoesAtivas });
  });
  el.btnDesktop?.addEventListener("click", () => definirDispositivo("desktop"));
  el.btnMobile?.addEventListener("click", () => definirDispositivo("mobile"));
  el.btnFechar?.addEventListener("click", fecharPrevia);
  el.overlay?.addEventListener("click", (event) => {
    if (event.target === el.overlay) fecharPrevia();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.overlay?.classList.contains("hidden")) fecharPrevia();
  });
}

async function abrirPrevia({ incluirRascunhoPublicacao }) {
  if (!el.overlay || !el.frame || !el.viewport) return;

  mostrarOverlay();
  definirDispositivo("desktop");
  definirStatus("Montando prévia da página...");
  el.frame.removeAttribute("src");
  el.frame.srcdoc = "";

  try {
    const [html, fontePublica] = await Promise.all([
      carregarTexto(HOME_URL),
      carregarJsonOpcional(FONTE_PUBLICA_URL)
    ]);

    const dadosPrevia = montarDadosPrevia(fontePublica, incluirRascunhoPublicacao);
    const documento = prepararDocumento(html, dadosPrevia);
    el.frame.srcdoc = `<!DOCTYPE html>\n${documento.documentElement.outerHTML}`;

    definirStatus(incluirRascunhoPublicacao && lerRascunhoPublicacao()
      ? "Prévia local com a publicação em edição. Nada foi salvo."
      : "Prévia local da página. Nada foi salvo.");
  } catch (erro) {
    console.error("Falha ao montar prévia completa:", erro);
    definirStatus("Não foi possível montar a prévia completa. Recarregue o painel e tente novamente.", true);
  }
}

function mostrarOverlay() {
  el.overlay.classList.remove("hidden");
  el.overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("previewOpen");
  requestAnimationFrame(() => el.btnFechar?.focus());
}

function fecharPrevia() {
  if (!el.overlay) return;
  el.overlay.classList.add("hidden");
  el.overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("previewOpen");
  if (el.frame) el.frame.srcdoc = "";
  el.btnPreviaPagina?.focus();
}

function definirDispositivo(dispositivo) {
  if (!el.viewport) return;
  const mobile = dispositivo === "mobile";
  el.viewport.dataset.device = mobile ? "mobile" : "desktop";
  el.btnDesktop?.classList.toggle("active", !mobile);
  el.btnMobile?.classList.toggle("active", mobile);
  el.btnDesktop?.setAttribute("aria-pressed", String(!mobile));
  el.btnMobile?.setAttribute("aria-pressed", String(mobile));
}

function definirStatus(texto, erro = false) {
  if (!el.status) return;
  el.status.textContent = texto;
  el.status.classList.toggle("error", erro);
}

async function carregarTexto(url) {
  const resposta = await fetch(`${url}${url.includes("?") ? "&" : "?"}preview=${Date.now()}`, { cache: "no-store" });
  if (!resposta.ok) throw new Error(`Falha ao carregar ${url}.`);
  return resposta.text();
}

async function carregarJsonOpcional(url) {
  try {
    const resposta = await fetch(`${url}?preview=${Date.now()}`, { cache: "no-store" });
    if (!resposta.ok) return {};
    return await resposta.json();
  } catch (erro) {
    console.warn("Fonte pública indisponível durante a prévia.", erro);
    return {};
  }
}

function montarDadosPrevia(fontePublica, incluirRascunhoPublicacao) {
  const base = fontePublica && typeof fontePublica === "object" && !Array.isArray(fontePublica) ? fontePublica : {};
  let publicacoes = Array.isArray(base.publicacoes)
    ? base.publicacoes.map((item) => ({ ...item }))
    : Array.isArray(fontePublica) ? fontePublica.map((item) => ({ ...item })) : [];

  const rascunho = incluirRascunhoPublicacao ? lerRascunhoPublicacao() : null;
  if (rascunho) {
    publicacoes = publicacoes.filter((item) => String(item.id || "") !== String(rascunho.id || ""));
    publicacoes.push(rascunho);
  }

  const home = lerHomeDoFormulario(base.home || {});
  return {
    ...base,
    atualizadoEm: new Date().toISOString(),
    origem: "PREVIA_LOCAL_ADMIN",
    cache: "somente memoria",
    home,
    publicacoes,
    banners: publicacoes.filter((item) => item.local === "banner"),
    avisos: publicacoes.filter((item) => item.local === "avisos" || item.tipo === "aviso"),
    destaques: publicacoes.filter((item) => item.destaque === true || item.local === "destaques")
  };
}

function lerHomeDoFormulario(fallback = {}) {
  const secoesFormulario = [...document.querySelectorAll("#listaSecoesHome .homeSectionItem")]
    .map((item) => {
      const campoId = item.querySelector("[data-section-field='id']");
      const campoTitulo = item.querySelector("[data-section-field='titulo']");
      const campoTexto = item.querySelector("[data-section-field='texto']");
      const campoVisivel = item.querySelector("[data-section-field='visivel']");
      const campoLayout = item.querySelector("[data-section-field='layout']");
      const campoTipo = item.querySelector("[data-section-field='tipo']");
      const campoIndicadores = item.querySelector("[data-section-field='indicadores']");
      return {
        id: normalizarId(campoId?.value || campoTitulo?.value),
        titulo: campoTitulo?.value.trim() || "",
        texto: campoTexto?.value.trim() || "",
        visivel: campoVisivel?.checked !== false,
        layout: campoLayout?.value === "lista" ? "lista" : "blocos",
        tipo: campoTipo?.value === "destaque-indicadores" ? "destaque-indicadores" : "padrao",
        indicadores: lerIndicadores(campoIndicadores?.value || ""),
        fixa: item.dataset.fixa === "true"
      };
    })
    .filter((secao) => secao.id && secao.titulo);

  const secoes = secoesFormulario.length ? secoesFormulario : Array.isArray(fallback.secoes) ? fallback.secoes : [];
  return {
    ...fallback,
    titulo: document.getElementById("homeTitulo")?.value.trim() || fallback.titulo || "Escola Municipal Professora Iêda Alves de Oliveira MCPM",
    subtitulo: document.getElementById("homeSubtitulo")?.value.trim() || fallback.subtitulo || "Educação, compromisso e formação cidadã em Medeiros Neto - Bahia.",
    corDestaque: document.getElementById("homeCorDestaque")?.value || fallback.corDestaque || "#003366",
    secoes,
    mostrarBanners: fallback.mostrarBanners !== false,
    mostrarModal: fallback.mostrarModal !== false
  };
}

function lerRascunhoPublicacao() {
  const titulo = document.getElementById("campoTitulo")?.value.trim() || "";
  if (!titulo) return null;

  const local = normalizarId(document.getElementById("campoLocal")?.value || "informacoes");
  return {
    id: document.getElementById("itemId")?.value || "preview-local",
    titulo,
    resumo: document.getElementById("campoResumo")?.value.trim() || "",
    conteudo: document.getElementById("campoConteudo")?.value.trim() || "",
    imagem: document.getElementById("campoImagem")?.value.trim() || "",
    imagemAlt: document.getElementById("campoImagemAlt")?.value.trim() || "",
    link: document.getElementById("campoLink")?.value.trim() || "",
    botao: document.getElementById("campoBotao")?.value.trim() || "",
    ordem: Number(document.getElementById("campoOrdem")?.value || 0),
    estilo: document.getElementById("campoEstilo")?.value || "padrao",
    local,
    tipo: local === "banner" ? "banner" : local === "avisos" || local === "modal" ? "aviso" : "card",
    categoria: local === "destaques" ? "Destaque" : local === "banner" ? "Banner" : "Aviso",
    destaque: local === "destaques",
    publicado: true,
    dataInicial: null,
    dataFinal: null,
    atualizadoEm: new Date().toISOString()
  };
}

function prepararDocumento(html, dadosPrevia) {
  const documento = new DOMParser().parseFromString(html, "text/html");
  const scripts = [...documento.querySelectorAll("script")];
  const renderizador = scripts.find((script) => (script.getAttribute("src") || "").includes(SCRIPT_RENDERIZADOR_PUBLICO));
  if (!renderizador) throw new Error("Renderizador público da home não foi encontrado.");

  scripts.forEach((script) => {
    if (script !== renderizador) script.remove();
  });

  const base = documento.createElement("base");
  base.href = `${window.location.origin}/`;
  documento.head.prepend(base);

  const estiloPrevia = documento.createElement("style");
  estiloPrevia.textContent = `
    .reveal{opacity:1!important;transform:none!important}
    .topbar{display:none!important}
    a,button{pointer-events:none!important}
    html{scroll-behavior:auto!important}
  `;
  documento.head.appendChild(estiloPrevia);

  renderizador.dataset.fonte = criarDataUrlJson(dadosPrevia);
  return documento;
}

function criarDataUrlJson(valor) {
  return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(valor))}`;
}

function lerIndicadores(texto) {
  return String(texto || "").split(/\r?\n/)
    .map((linha) => {
      const [valor, ...rotulo] = linha.split("|");
      return {
        valor: String(valor || "").trim(),
        rotulo: rotulo.join("|").trim()
      };
    })
    .filter((item) => item.valor || item.rotulo)
    .slice(0, 12);
}

function normalizarId(valor) {
  return String(valor || "informacoes")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "informacoes";
}
