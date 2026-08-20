const STYLE_HREF = new URL("./admin-publicacoes-v2.css", import.meta.url).href;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

let previewFrame = null;
let previewHtmlBase = "";
let previewHome = {};
let previewLocalAtual = "";
let previewObjectUrl = "";
let previewTimer = null;

carregarEstilo();
requestAnimationFrame(() => requestAnimationFrame(inicializarPreview));

function carregarEstilo() {
  if (document.querySelector('link[data-admin-publicacoes-preview="1"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = STYLE_HREF;
  link.dataset.adminPublicacoesPreview = "1";
  document.head.appendChild(link);
}

function inicializarPreview() {
  const view = document.getElementById("view-publicacoes");
  const layout = view?.querySelector(".publicationLayout");
  const form = document.getElementById("formPublicacao");
  const listPanel = layout?.querySelector(".listPanel");
  if (!view || !layout || !form || !listPanel || view.dataset.publicacoesPreview === "1") return;
  view.dataset.publicacoesPreview = "1";

  document.getElementById("btnNovaPublicacao")?.remove();
  prepararPreview(layout, form, listPanel);
  vincularFormulario(form);
  carregarFontePreview();
}

function prepararPreview(layout, form, listPanel) {
  const panel = document.createElement("section");
  panel.id = "publicationLivePreview";
  panel.className = "publicationLivePreview";
  panel.setAttribute("aria-label", "Prévia real da publicação no site");
  panel.innerHTML = `
    <div class="publicationPreviewHead">
      <div>
        <strong>Prévia real do site</strong>
        <small>HTML e estilos atuais da Home, sem executar scripts no quadro</small>
      </div>
      <span class="publicationPreviewBadge">Ao vivo</span>
    </div>
    <div class="publicationPreviewViewport">
      <iframe class="publicationPreviewFrame" id="publicationPreviewFrame" title="Prévia real da publicação no site" sandbox="allow-same-origin"></iframe>
    </div>
  `;

  layout.appendChild(panel);
  layout.insertBefore(form, panel);
  listPanel.classList.add("publicationArchivePanel");
  layout.insertAdjacentElement("afterend", listPanel);
  const heading = listPanel.querySelector(".stickyHeading h3");
  if (heading) heading.textContent = "Publicações salvas";

  previewFrame = document.getElementById("publicationPreviewFrame");
  previewFrame?.addEventListener("load", aplicarPreviewNoSite);
}

async function carregarFontePreview() {
  try {
    const [pagina, dados] = await Promise.all([
      fetch(`../?admin-preview-source=${Date.now()}`, { cache: "no-store" }),
      fetch(`../site-data/publicacoes-publicas.json?v=${Date.now()}`, { cache: "no-store" })
    ]);
    if (!pagina.ok) throw new Error("HOME_INDISPONIVEL");

    previewHtmlBase = prepararHtmlSeguro(await pagina.text());
    if (dados.ok) {
      const siteData = await dados.json();
      previewHome = siteData?.home && typeof siteData.home === "object" ? siteData.home : {};
    }

    previewLocalAtual = obterPublicacaoDoFormulario().local;
    if (previewFrame) previewFrame.srcdoc = previewHtmlBase;
  } catch (erro) {
    console.warn("Não foi possível carregar a Home para a prévia.", erro);
    const viewport = document.querySelector(".publicationPreviewViewport");
    if (viewport) viewport.innerHTML = '<div style="padding:28px;color:#5e6d7c">Não foi possível carregar a prévia real agora.</div>';
  }
}

function prepararHtmlSeguro(html) {
  const semScripts = String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
  if (/<head[^>]*>/i.test(semScripts)) return semScripts.replace(/<head([^>]*)>/i, '<head$1><base href="/">');
  return `<base href="/">${semScripts}`;
}

function vincularFormulario(form) {
  const imageInput = document.getElementById("pubImagemArquivo");
  form.addEventListener("input", agendarPreview);
  form.addEventListener("change", (event) => {
    if (event.target === imageInput) prepararImagemLocal(imageInput);
    agendarPreview();
  });
  form.addEventListener("reset", () => {
    setTimeout(() => {
      limparImagemLocal();
      atualizarPreview();
    }, 0);
  });
}

function prepararImagemLocal(input) {
  const arquivo = input?.files?.[0];
  limparImagemLocal();
  if (!arquivo) return;
  if (!IMAGE_TYPES.has(arquivo.type) || arquivo.size <= 0 || arquivo.size > IMAGE_MAX_BYTES) {
    input.value = "";
    return;
  }
  previewObjectUrl = URL.createObjectURL(arquivo);
}

function limparImagemLocal() {
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = "";
}

function agendarPreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(atualizarPreview, 100);
}

function atualizarPreview() {
  if (!previewFrame || !previewHtmlBase) return;
  const item = obterPublicacaoDoFormulario();
  if (previewLocalAtual && item.local !== previewLocalAtual) {
    previewLocalAtual = item.local;
    previewFrame.srcdoc = previewHtmlBase;
    return;
  }
  previewLocalAtual = item.local;
  aplicarPreviewNoSite();
}

function obterPublicacaoDoFormulario() {
  const titulo = document.getElementById("pubTitulo")?.value.trim() || "Título da publicação";
  return {
    titulo,
    resumo: document.getElementById("pubResumo")?.value.trim() || "",
    conteudo: document.getElementById("pubConteudo")?.value.trim() || "",
    local: document.getElementById("pubLocal")?.value || "avisos",
    estilo: document.getElementById("pubEstilo")?.value || "padrao",
    imagem: previewObjectUrl || document.getElementById("pubImagemAtual")?.value || "",
    imagemAlt: titulo,
    link: document.getElementById("pubLink")?.value.trim() || "",
    botao: document.getElementById("pubBotao")?.value.trim() || ""
  };
}

function aplicarPreviewNoSite() {
  const doc = previewFrame?.contentDocument;
  const win = previewFrame?.contentWindow;
  if (!doc || !win) return;

  const item = obterPublicacaoDoFormulario();
  limparModal(doc);
  if (item.local === "modal") {
    renderizarModal(doc, item);
    return;
  }

  const alvo = doc.querySelector(`[data-publicacoes-local="${cssEscape(item.local)}"]`);
  if (!alvo) return;
  aplicarLayout(alvo, item.local);
  const secao = alvo.closest("[data-publicacoes-section]");
  if (secao) {
    secao.hidden = false;
    secao.classList.remove("secao-vazia", "hidden-by-cms");
    secao.classList.add("ativo");
  }

  alvo.replaceChildren(item.local === "banner" ? criarBanner(doc, item) : criarCard(doc, item));
  requestAnimationFrame(() => {
    if (item.local === "banner") win.scrollTo({ top: 0, behavior: "auto" });
    else secao?.scrollIntoView({ block: "start", behavior: "auto" });
  });
}

function aplicarLayout(alvo, local) {
  const secoes = Array.isArray(previewHome?.secoes) ? previewHome.secoes : [];
  const secao = secoes.find((item) => String(item?.id || "") === local);
  const layout = secao?.layout === "lista" ? "lista" : "blocos";
  alvo.dataset.layout = layout;
  alvo.classList.toggle("layout-lista", layout === "lista");
  alvo.classList.toggle("layout-blocos", layout !== "lista");
}

function criarCard(doc, item) {
  const card = doc.createElement("article");
  card.className = `card publicacao-dinamica estilo-${normalizarClasse(item.estilo || "padrao")}`;
  if (item.imagem) {
    const imagem = doc.createElement("img");
    imagem.className = "public-media";
    imagem.src = item.imagem;
    imagem.alt = item.imagemAlt || item.titulo || "";
    card.appendChild(imagem);
  }
  const titulo = doc.createElement("h3");
  titulo.textContent = item.titulo || "Publicação";
  card.appendChild(titulo);
  if (item.resumo) {
    const resumo = doc.createElement("p");
    resumo.className = "public-resumo";
    resumo.textContent = item.resumo;
    card.appendChild(resumo);
  }
  if (item.conteudo) {
    const conteudo = doc.createElement("p");
    conteudo.className = "public-conteudo";
    conteudo.textContent = item.conteudo;
    card.appendChild(conteudo);
  }
  if (item.link) {
    const link = doc.createElement("a");
    link.className = "publicacao-botao";
    link.href = item.link;
    link.textContent = item.botao || "Abrir";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    card.appendChild(link);
  }
  return card;
}

function criarBanner(doc, item) {
  const banner = doc.createElement("div");
  banner.className = "public-banner";
  const titulo = doc.createElement("strong");
  titulo.textContent = item.titulo || "Aviso";
  banner.appendChild(titulo);
  if (item.resumo) {
    const resumo = doc.createElement("span");
    resumo.textContent = item.resumo;
    banner.appendChild(resumo);
  }
  if (item.conteudo) {
    const conteudo = doc.createElement("p");
    conteudo.className = "public-conteudo";
    conteudo.textContent = item.conteudo;
    banner.appendChild(conteudo);
  }
  if (item.link) {
    const link = doc.createElement("a");
    link.className = "publicacao-botao";
    link.href = item.link;
    link.textContent = item.botao || "Abrir";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    banner.appendChild(link);
  }
  return banner;
}

function renderizarModal(doc, item) {
  const alvo = doc.querySelector("[data-publicacoes-local='modal']");
  if (!alvo) return;
  alvo.hidden = false;
  doc.body.classList.add("modal-open");
  const modal = doc.createElement("div");
  modal.className = "public-modal-content";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  const header = doc.createElement("div");
  header.className = "public-modal-header";
  const titulo = doc.createElement("strong");
  titulo.textContent = "Aviso importante";
  const fechar = doc.createElement("button");
  fechar.type = "button";
  fechar.className = "public-modal-close";
  fechar.textContent = "Fechar";
  fechar.addEventListener("click", () => {
    alvo.hidden = true;
    doc.body.classList.remove("modal-open");
  });
  header.append(titulo, fechar);
  const body = doc.createElement("div");
  body.className = "public-modal-body";
  body.appendChild(criarCard(doc, item));
  modal.append(header, body);
  alvo.replaceChildren(modal);
}

function limparModal(doc) {
  const modal = doc.querySelector("[data-publicacoes-local='modal']");
  if (!modal) return;
  modal.replaceChildren();
  modal.hidden = true;
  doc.body.classList.remove("modal-open");
}

function normalizarClasse(valor) {
  return String(valor || "padrao").toLowerCase().replace(/[^a-z0-9_-]+/g, "-") || "padrao";
}

function cssEscape(valor) {
  return window.CSS?.escape ? window.CSS.escape(valor) : String(valor).replace(/["\\]/g, "\\$&");
}
