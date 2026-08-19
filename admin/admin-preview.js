const HOME_URL = "/";
const FONTE_PUBLICA_URL = "/site-data/publicacoes-publicas.json";
const SCRIPT_RENDERIZADOR_PUBLICO = "/site-data/publicacoes-site.js";
const FONTE_PREVIEW_PATH = "/__admin-preview-data__.json";

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
  el.frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
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
      : "Prévia local da página com as alterações atuais do editor. Nada foi salvo.");
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
  const marcaPrevia = Date.now();
  let publicacoes = Array.isArray(base.publicacoes)
    ? base.publicacoes.map((item, indice) => normalizarItemPrevia(item, indice, marcaPrevia))
    : Array.isArray(fontePublica) ? fontePublica.map((item, indice) => normalizarItemPrevia(item, indice, marcaPrevia)) : [];

  const rascunho = incluirRascunhoPublicacao ? lerRascunhoPublicacao() : null;
  if (rascunho) {
    publicacoes = publicacoes.filter((item) => String(item.idOriginal || item.id || "") !== String(rascunho.id || ""));
    publicacoes.push(rascunho.local === "modal"
      ? { ...rascunho, id: `preview-modal-rascunho-${marcaPrevia}` }
      : rascunho);
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

function normalizarItemPrevia(item, indice, marcaPrevia) {
  const copia = { ...item };
  if (copia.local === "modal") {
    copia.idOriginal = copia.id;
    copia.id = `preview-modal-${copia.id || indice}-${marcaPrevia}`;
  }
  return copia;
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

  aplicarHomeDiretamente(documento, dadosPrevia.home || {});

  const dadosVirtuais = documento.createElement("script");
  dadosVirtuais.textContent = criarScriptFonteVirtual(dadosPrevia);
  renderizador.parentNode.insertBefore(dadosVirtuais, renderizador);
  renderizador.dataset.fonte = FONTE_PREVIEW_PATH;
  return documento;
}

function aplicarHomeDiretamente(documento, home) {
  definirTextoDocumento(documento, "[data-home-titulo]", home.titulo);
  definirTextoDocumento(documento, "[data-home-subtitulo]", home.subtitulo);
  definirTextoDocumento(documento, "[data-home-missao]", home.missao);
  definirTextoDocumento(documento, "[data-home-info-texto]", home.infoTexto);

  if (home.corDestaque) {
    documento.documentElement.style.setProperty("--azul", home.corDestaque);
  }

  const secoes = Array.isArray(home.secoes) ? home.secoes : [];
  secoes.forEach((secao) => aplicarSecaoDiretamente(documento, secao));

  const banner = documento.querySelector('[data-publicacoes-local="banner"]');
  if (banner) banner.classList.toggle("hidden-by-cms", home.mostrarBanners === false);
}

function aplicarSecaoDiretamente(documento, secao) {
  const id = normalizarId(secao.id || secao.titulo);
  let bloco = documento.querySelector(`[data-home-section="${id}"]`);
  if (!bloco) bloco = criarSecaoDinamicaPrevia(documento, { ...secao, id });
  if (!bloco) return;

  bloco.classList.toggle("hidden-by-cms", secao.visivel === false);
  definirTextoDocumento(bloco, `[data-section-title="${id}"]`, secao.titulo);
  definirTextoDocumento(bloco, `[data-section-text="${id}"]`, secao.texto);

  const apresentacao = bloco.querySelector("[data-section-presentation]") || bloco.querySelector(".faixa, .titulo-secao");
  if (apresentacao) {
    apresentacao.dataset.sectionPresentation = "";
    const destaque = secao.tipo === "destaque-indicadores" || id === "numeros";
    apresentacao.classList.toggle("faixa", destaque);
    apresentacao.classList.toggle("titulo-secao", !destaque);

    let indicadores = apresentacao.querySelector("[data-section-indicators]");
    if (!indicadores) {
      indicadores = documento.createElement("div");
      indicadores.className = "numeros";
      indicadores.dataset.sectionIndicators = "";
      apresentacao.appendChild(indicadores);
    }

    const itens = normalizarIndicadores(secao.indicadores);
    indicadores.hidden = !destaque || !itens.length;
    indicadores.replaceChildren(...itens.map((item) => criarIndicadorPrevia(documento, item)));
  }

  const lista = bloco.querySelector(`[data-publicacoes-local="${id}"]`);
  if (lista) {
    const layoutLista = secao.layout === "lista";
    lista.dataset.layout = layoutLista ? "lista" : "blocos";
    lista.classList.toggle("layout-lista", layoutLista);
    lista.classList.toggle("layout-blocos", !layoutLista);
  }
}

function criarSecaoDinamicaPrevia(documento, secao) {
  const main = documento.querySelector("main");
  if (!main) return null;

  const bloco = documento.createElement("section");
  bloco.className = "container reveal ativo secao-vazia";
  bloco.id = secao.id;
  bloco.dataset.homeSection = secao.id;
  bloco.dataset.publicacoesSection = "";

  const apresentacao = documento.createElement("div");
  apresentacao.className = "titulo-secao";
  apresentacao.dataset.sectionPresentation = "";

  const titulo = documento.createElement("h2");
  titulo.dataset.sectionTitle = secao.id;
  apresentacao.appendChild(titulo);

  const texto = documento.createElement("p");
  texto.dataset.sectionText = secao.id;
  apresentacao.appendChild(texto);

  const indicadores = documento.createElement("div");
  indicadores.className = "numeros";
  indicadores.dataset.sectionIndicators = "";
  indicadores.hidden = true;
  apresentacao.appendChild(indicadores);

  const publicacoes = documento.createElement("div");
  publicacoes.className = "publicacoes-grid";
  publicacoes.dataset.publicacoesLocal = secao.id;

  bloco.append(apresentacao, publicacoes);
  const contato = documento.querySelector('[data-home-section="contato"]');
  main.insertBefore(bloco, contato || null);
  return bloco;
}

function criarIndicadorPrevia(documento, item) {
  const bloco = documento.createElement("div");
  bloco.className = "numero";
  const valor = documento.createElement("strong");
  valor.textContent = item.valor;
  const rotulo = documento.createElement("span");
  rotulo.textContent = item.rotulo;
  bloco.append(valor, rotulo);
  return bloco;
}

function definirTextoDocumento(raiz, seletor, valor) {
  const elemento = raiz.querySelector(seletor);
  if (elemento && valor !== undefined && valor !== null) elemento.textContent = String(valor);
}

function normalizarIndicadores(indicadores) {
  return (Array.isArray(indicadores) ? indicadores : [])
    .map((item) => ({
      valor: String(item?.valor || "").trim(),
      rotulo: String(item?.rotulo || "").trim()
    }))
    .filter((item) => item.valor || item.rotulo)
    .slice(0, 12);
}

function criarScriptFonteVirtual(dadosPrevia) {
  const base64 = textoParaBase64(JSON.stringify(dadosPrevia));
  return `(() => {
    const bytes = Uint8Array.from(atob(${JSON.stringify(base64)}), (caractere) => caractere.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const fetchOriginal = window.fetch.bind(window);
    window.fetch = (entrada, opcoes) => {
      const destino = typeof entrada === "string" ? entrada : entrada?.url || "";
      const url = new URL(destino, window.location.href);
      if (url.pathname === ${JSON.stringify(FONTE_PREVIEW_PATH)}) {
        return Promise.resolve(new Response(json, {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        }));
      }
      return fetchOriginal(entrada, opcoes);
    };
  })();`;
}

function textoParaBase64(texto) {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  bytes.forEach((byte) => {
    binario += String.fromCharCode(byte);
  });
  return btoa(binario);
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
