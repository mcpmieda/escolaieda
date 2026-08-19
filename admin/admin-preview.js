const HOME_URL = "/";
const FONTE_PUBLICA_URL = "/site-data/publicacoes-publicas.json";
const INDICADORES_PADRAO = [
  { valor: "1990", rotulo: "Fundação" },
  { valor: "6º ao 9º", rotulo: "Ensino Fundamental Anos Finais" },
  { valor: "21", rotulo: "Professores" },
  { valor: "41", rotulo: "Funcionários" }
];

const el = {
  btnPreviaPagina: document.getElementById("btnPreviaPagina"),
  btnPreviaHome: document.getElementById("btnPreviaHome"),
  overlay: document.getElementById("sitePreviewOverlay"),
  dialog: document.querySelector(".sitePreviewDialog"),
  frame: document.getElementById("sitePreviewFrame"),
  viewport: document.getElementById("sitePreviewViewport"),
  status: document.getElementById("sitePreviewStatus"),
  btnDesktop: document.getElementById("btnPreviewDesktop"),
  btnMobile: document.getElementById("btnPreviewMobile"),
  btnFechar: document.getElementById("btnFecharPreview")
};

inicializarPrevia();

function inicializarPrevia() {
  el.btnPreviaPagina?.addEventListener("click", () => abrirPrevia({ incluirRascunhoPublicacao: true }));
  el.btnPreviaHome?.addEventListener("click", () => abrirPrevia({ incluirRascunhoPublicacao: false }));
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

    const documento = prepararDocumento(html);
    const home = lerHomeDoFormulario();
    aplicarHome(documento, home);

    const publicacoes = prepararPublicacoes(fontePublica, incluirRascunhoPublicacao);
    renderizarPublicacoes(documento, publicacoes);

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

function prepararDocumento(html) {
  const documento = new DOMParser().parseFromString(html, "text/html");
  documento.querySelectorAll("script").forEach((script) => script.remove());

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
  return documento;
}

function lerHomeDoFormulario() {
  const secoes = [...document.querySelectorAll("#listaSecoesHome .homeSectionItem")]
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

  return {
    titulo: document.getElementById("homeTitulo")?.value.trim() || "Escola Municipal Professora Iêda Alves de Oliveira MCPM",
    subtitulo: document.getElementById("homeSubtitulo")?.value.trim() || "Educação, compromisso e formação cidadã em Medeiros Neto - Bahia.",
    corDestaque: document.getElementById("homeCorDestaque")?.value || "#003366",
    secoes,
    mostrarBanners: true,
    mostrarModal: true
  };
}

function aplicarHome(documento, home) {
  definirTexto(documento, "[data-home-titulo]", home.titulo);
  definirTexto(documento, "[data-home-subtitulo]", home.subtitulo);
  if (home.corDestaque) documento.documentElement.style.setProperty("--azul", home.corDestaque);

  home.secoes.forEach((secao) => aplicarSecao(documento, secao));
  const banner = documento.querySelector('[data-publicacoes-local="banner"]');
  banner?.classList.toggle("hidden-by-cms", home.mostrarBanners === false);
}

function aplicarSecao(documento, secao) {
  const bloco = documento.querySelector(`[data-home-section="${seletorSeguro(secao.id)}"]`) || criarSecaoDinamica(documento, secao);
  if (!bloco) return;

  bloco.classList.toggle("hidden-by-cms", secao.visivel === false);
  definirTexto(bloco, `[data-section-title="${seletorSeguro(secao.id)}"]`, secao.titulo);
  definirTexto(bloco, `[data-section-text="${seletorSeguro(secao.id)}"]`, secao.texto);
  aplicarApresentacaoSecao(documento, bloco, secao);

  const lista = bloco.querySelector(`[data-publicacoes-local="${seletorSeguro(secao.id)}"]`);
  if (lista) {
    lista.dataset.layout = secao.layout;
    lista.classList.toggle("layout-lista", secao.layout === "lista");
    lista.classList.toggle("layout-blocos", secao.layout !== "lista");
  }
}

function criarSecaoDinamica(documento, secao) {
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

function aplicarApresentacaoSecao(documento, bloco, secao) {
  const apresentacao = bloco.querySelector("[data-section-presentation]") || bloco.querySelector(".faixa, .titulo-secao");
  if (!apresentacao) return;

  apresentacao.dataset.sectionPresentation = "";
  const destaque = secao.tipo === "destaque-indicadores";
  apresentacao.classList.toggle("faixa", destaque);
  apresentacao.classList.toggle("titulo-secao", !destaque);

  let indicadores = apresentacao.querySelector("[data-section-indicators]");
  if (!indicadores) {
    indicadores = documento.createElement("div");
    indicadores.className = "numeros";
    indicadores.dataset.sectionIndicators = "";
    apresentacao.appendChild(indicadores);
  }

  const listaIndicadores = normalizarIndicadores(secao.indicadores, secao.id === "numeros" ? INDICADORES_PADRAO : []);
  indicadores.hidden = !destaque || !listaIndicadores.length;
  indicadores.replaceChildren(...listaIndicadores.map((item) => criarIndicador(documento, item)));
}

function criarIndicador(documento, item) {
  const bloco = documento.createElement("div");
  bloco.className = "numero";
  const valor = documento.createElement("strong");
  valor.textContent = item.valor;
  const rotulo = documento.createElement("span");
  rotulo.textContent = item.rotulo;
  bloco.append(valor, rotulo);
  return bloco;
}

function prepararPublicacoes(fontePublica, incluirRascunhoPublicacao) {
  const agora = new Date();
  let publicacoes = Array.isArray(fontePublica)
    ? fontePublica
    : Array.isArray(fontePublica?.publicacoes) ? fontePublica.publicacoes : [];

  publicacoes = publicacoes.filter((item) => publicacaoVisivel(item, agora)).map((item) => ({ ...item }));

  if (incluirRascunhoPublicacao) {
    const rascunho = lerRascunhoPublicacao();
    if (rascunho) {
      publicacoes = publicacoes.filter((item) => String(item.id || "") !== String(rascunho.id || ""));
      publicacoes.push(rascunho);
    }
  }

  return publicacoes.sort(ordenarPublicacoes);
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
    publicado: true,
    atualizadoEm: new Date().toISOString()
  };
}

function publicacaoVisivel(item, agora) {
  if (!item || item.publicado !== true) return false;
  const inicial = item.dataInicial ? new Date(`${String(item.dataInicial).slice(0, 10)}T00:00:00`) : null;
  const final = item.dataFinal ? new Date(`${String(item.dataFinal).slice(0, 10)}T23:59:59`) : null;
  if (inicial && inicial > agora) return false;
  if (final && final < agora) return false;
  return true;
}

function ordenarPublicacoes(a, b) {
  const ordemA = Number(a.ordem || 0);
  const ordemB = Number(b.ordem || 0);
  if (ordemA !== ordemB) return ordemA - ordemB;
  return String(b.atualizadoEm || "").localeCompare(String(a.atualizadoEm || ""));
}

function renderizarPublicacoes(documento, publicacoes) {
  const grupos = publicacoes.reduce((mapa, item) => {
    const local = normalizarId(item.local || (item.destaque ? "destaques" : "informacoes"));
    mapa[local] = mapa[local] || [];
    mapa[local].push(item);
    return mapa;
  }, {});

  renderizarLocal(documento, "banner", grupos.banner || []);
  Object.keys(grupos).forEach((local) => {
    if (local !== "banner" && local !== "modal") renderizarLocal(documento, local, grupos[local].slice(0, 12));
  });
  renderizarLocal(documento, "modal", (grupos.modal || []).slice(0, 1));
}

function renderizarLocal(documento, local, itens) {
  if (!itens.length) return;
  const alvo = documento.querySelector(`[data-publicacoes-local="${seletorSeguro(local)}"]`);
  if (!alvo) return;

  if (local === "modal") {
    alvo.replaceChildren(criarModal(documento, itens));
    alvo.removeAttribute("hidden");
    documento.body.classList.add("modal-open");
    return;
  }

  const criador = local === "banner" ? criarBanner : criarCard;
  alvo.replaceChildren(...itens.map((item) => criador(documento, item)));
  const secao = alvo.closest("[data-publicacoes-section]");
  secao?.classList.remove("secao-vazia");
  secao?.removeAttribute("hidden");
}

function criarCard(documento, item) {
  const card = documento.createElement("article");
  card.className = `card publicacao-dinamica estilo-${normalizarClasse(item.estilo || "padrao")}`;

  if (item.imagem) {
    const imagem = documento.createElement("img");
    imagem.className = "public-media";
    imagem.src = item.imagem;
    imagem.alt = item.imagemAlt || item.titulo || "";
    card.appendChild(imagem);
  }

  const titulo = documento.createElement("h3");
  titulo.textContent = item.titulo || item.categoria || "Publicação";
  card.appendChild(titulo);

  if (item.resumo) {
    const resumo = documento.createElement("p");
    resumo.className = "public-resumo";
    resumo.textContent = item.resumo;
    card.appendChild(resumo);
  }

  if (item.conteudo) {
    const conteudo = documento.createElement("p");
    conteudo.className = "public-conteudo";
    conteudo.textContent = item.conteudo;
    card.appendChild(conteudo);
  }

  if (item.link) {
    const link = documento.createElement("a");
    link.className = "publicacao-botao";
    link.href = item.link;
    link.textContent = item.botao || "Abrir";
    card.appendChild(link);
  }

  return card;
}

function criarBanner(documento, item) {
  const banner = documento.createElement("div");
  banner.className = "public-banner";

  const titulo = documento.createElement("strong");
  titulo.textContent = item.titulo || "Aviso";
  banner.appendChild(titulo);

  if (item.resumo) {
    const resumo = documento.createElement("span");
    resumo.textContent = item.resumo;
    banner.appendChild(resumo);
  }
  if (item.conteudo) {
    const conteudo = documento.createElement("p");
    conteudo.className = "public-conteudo";
    conteudo.textContent = item.conteudo;
    banner.appendChild(conteudo);
  }
  if (item.link) {
    const link = documento.createElement("a");
    link.className = "publicacao-botao";
    link.href = item.link;
    link.textContent = item.botao || "Abrir";
    banner.appendChild(link);
  }
  return banner;
}

function criarModal(documento, itens) {
  const modal = documento.createElement("div");
  modal.className = "public-modal-content";

  const cabecalho = documento.createElement("div");
  cabecalho.className = "public-modal-header";
  const titulo = documento.createElement("strong");
  titulo.textContent = "Aviso importante";
  const fechar = documento.createElement("button");
  fechar.type = "button";
  fechar.className = "public-modal-close";
  fechar.textContent = "Fechar";
  cabecalho.append(titulo, fechar);

  const corpo = documento.createElement("div");
  corpo.className = "public-modal-body";
  corpo.append(...itens.map((item) => criarCard(documento, item)));
  modal.append(cabecalho, corpo);
  return modal;
}

function definirTexto(raiz, seletor, valor) {
  const elemento = raiz.querySelector(seletor);
  if (elemento && valor !== undefined && valor !== null) elemento.textContent = valor;
}

function lerIndicadores(texto) {
  return normalizarIndicadores(String(texto || "").split(/\r?\n/).map((linha) => {
    const [valor, ...rotulo] = linha.split("|");
    return { valor, rotulo: rotulo.join("|") };
  }), []);
}

function normalizarIndicadores(indicadores, padrao = []) {
  const normalizados = (Array.isArray(indicadores) ? indicadores : [])
    .map((item) => ({
      valor: String(item?.valor || "").trim(),
      rotulo: String(item?.rotulo || "").trim()
    }))
    .filter((item) => item.valor || item.rotulo)
    .slice(0, 12);
  return normalizados.length ? normalizados : padrao.map((item) => ({ ...item }));
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

function normalizarClasse(valor) {
  return String(valor || "padrao").toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

function seletorSeguro(valor) {
  return String(valor || "").replace(/[^a-z0-9_-]/gi, "");
}
