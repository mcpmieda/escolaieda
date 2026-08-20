const PUBLICACOES_STYLE_HREF = new URL("./admin-publicacoes-v2.css", import.meta.url).href;
const TOKEN_LOCAL = "escolaIedaGithubToken";
const TOKEN_SESSAO = "escolaIedaGithubTokenSessao";
const REPO = "mcpmieda/escolaieda";
const BRANCH = "main";
const IMAGE_ROOT = "imagens/publicacoes";
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

let previewFrame = null;
let previewHtmlBase = "";
let previewHome = {};
let previewLocalAtual = "";
let previewObjectUrl = "";
let uploadPendente = null;
let previewTimer = null;

carregarEstiloPublicacoes();
requestAnimationFrame(() => requestAnimationFrame(inicializarPublicacoesV2));

function carregarEstiloPublicacoes() {
  if (document.querySelector('link[data-admin-publicacoes-v2="1"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = PUBLICACOES_STYLE_HREF;
  link.dataset.adminPublicacoesV2 = "1";
  document.head.appendChild(link);
}

function inicializarPublicacoesV2() {
  const view = document.getElementById("view-publicacoes");
  const layout = view?.querySelector(".publicationLayout");
  const form = document.getElementById("formPublicacao");
  const listPanel = layout?.querySelector(".listPanel");
  if (!view || !layout || !form || !listPanel || view.dataset.publicacoesV2 === "1") return;
  view.dataset.publicacoesV2 = "1";

  document.getElementById("btnNovaPublicacao")?.remove();
  ajustarAtalhosDashboard();
  ajustarConexaoGithub();
  prepararStatusImagem();
  prepararPreview(layout, form, listPanel);
  vincularFormulario(form);
  testarConexaoGithubExistente();
}

function ajustarAtalhosDashboard() {
  requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll("#view-inicio .heroActions button").forEach((botao) => {
      if (/nova publicação/i.test(botao.textContent || "")) botao.textContent = "Publicações";
    });
  })));
}

function ajustarConexaoGithub() {
  const dialog = document.getElementById("githubDialog");
  const texto = dialog?.querySelector("p");
  if (texto) {
    texto.innerHTML = "Conecte este dispositivo uma única vez ao repositório <strong>mcpmieda/escolaieda</strong>. A credencial fica somente neste navegador e nunca é publicada no código do site.";
  }

  document.addEventListener("click", (event) => {
    const alvo = event.target instanceof Element ? event.target : null;
    if (!alvo?.closest("#btnConectarGithub, #btnConfigurarGithubInicio, #btnConfigurarGithubSistemas")) return;
    requestAnimationFrame(() => {
      const checkbox = document.getElementById("githubRemember");
      if (!checkbox) return;
      const persistente = Boolean(localStorage.getItem(TOKEN_LOCAL));
      const somenteSessao = Boolean(sessionStorage.getItem(TOKEN_SESSAO));
      checkbox.checked = persistente || somenteSessao || !obterTokenGithub();
    });
  });
}

async function testarConexaoGithubExistente() {
  const token = obterTokenGithub();
  if (!token) {
    atualizarRotulosGithub(false);
    return;
  }

  try {
    const resposta = await fetch(`https://api.github.com/repos/${REPO}/contents/site-data/publicacoes-publicas.json?ref=${encodeURIComponent(BRANCH)}`, {
      headers: cabecalhosGithub(token),
      cache: "no-store"
    });
    atualizarRotulosGithub(resposta.ok);
  } catch {
    atualizarRotulosGithub(false);
  }
}

function atualizarRotulosGithub(conectado) {
  const botao = document.getElementById("btnConectarGithub");
  if (botao) botao.textContent = conectado ? "GitHub conectado" : "Conectar GitHub";

  const mini = document.getElementById("githubMiniStatus");
  if (mini) {
    mini.classList.toggle("connected", conectado);
    const texto = mini.querySelector("span:last-child");
    if (texto) texto.textContent = conectado ? "GitHub conectado ao site" : "GitHub não conectado";
  }
}

function prepararStatusImagem() {
  const upload = document.querySelector("#formPublicacao .uploadPanel");
  if (!upload || document.getElementById("publicationImageRepoStatus")) return;
  const status = document.createElement("p");
  status.id = "publicationImageRepoStatus";
  status.className = "publicationImageRepoStatus";
  status.setAttribute("role", "status");
  status.textContent = "Ao salvar uma nova imagem, o painel confirmará o arquivo diretamente no repositório.";
  upload.appendChild(status);
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
        <small>HTML e estilos atuais da Home, sem Analytics no quadro de edição</small>
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
  carregarFontePreview();
}

async function carregarFontePreview() {
  try {
    const [pagina, dados] = await Promise.all([
      fetch(`../?admin-preview-source=${Date.now()}`, { cache: "no-store" }),
      fetch(`../site-data/publicacoes-publicas.json?v=${Date.now()}`, { cache: "no-store" })
    ]);
    if (!pagina.ok) throw new Error("HOME_INDISPONIVEL");

    const html = await pagina.text();
    previewHtmlBase = prepararHtmlSeguro(html);
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
  if (/<head[^>]*>/i.test(semScripts)) {
    return semScripts.replace(/<head([^>]*)>/i, '<head$1><base href="/">');
  }
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
      definirStatusImagem("Ao salvar uma nova imagem, o painel confirmará o arquivo diretamente no repositório.");
      atualizarPreview();
    }, 0);
  });

  form.addEventListener("submit", (event) => {
    const arquivo = imageInput?.files?.[0] || null;
    if (arquivo && !validarImagem(arquivo, true)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    uploadPendente = arquivo ? {
      nome: arquivo.name,
      tamanho: arquivo.size,
      inicio: Date.now() - 1500,
      sufixo: sufixoImagemEsperado(arquivo)
    } : null;

    if (uploadPendente) definirStatusImagem("Salvando e conferindo a imagem no GitHub...", "checking");
  }, true);

  document.addEventListener("click", (event) => {
    const alvo = event.target instanceof Element ? event.target : null;
    if (!alvo) return;
    const editar = alvo.closest(".publicationCard .miniButton");
    if (editar && editar.textContent?.trim() === "Editar") {
      requestAnimationFrame(() => requestAnimationFrame(atualizarPreview));
    }
    if (alvo.closest("#btnCancelarEdicao")) {
      requestAnimationFrame(() => requestAnimationFrame(atualizarPreview));
    }
  });

  const statusPublicacao = document.getElementById("statusPublicacao");
  if (statusPublicacao) {
    new MutationObserver(() => {
      const texto = statusPublicacao.textContent || "";
      const sucesso = statusPublicacao.classList.contains("success") && /salva com sucesso/i.test(texto);
      const erro = statusPublicacao.classList.contains("error");

      if (sucesso && uploadPendente) {
        const esperado = uploadPendente;
        uploadPendente = null;
        verificarUploadNoRepositorio(esperado);
      } else if (erro) {
        uploadPendente = null;
      }

      requestAnimationFrame(atualizarPreview);
    }).observe(statusPublicacao, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }
}

function agendarPreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(atualizarPreview, 120);
}

function prepararImagemLocal(input) {
  const arquivo = input?.files?.[0];
  limparImagemLocal();
  if (!arquivo) return;
  if (!validarImagem(arquivo, false)) {
    input.value = "";
    return;
  }
  previewObjectUrl = URL.createObjectURL(arquivo);
}

function limparImagemLocal() {
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = "";
}

function validarImagem(arquivo, focar) {
  if (!IMAGE_TYPES.has(arquivo.type)) {
    definirStatusImagem("Use uma imagem JPG, PNG ou WebP.", "error");
    if (focar) document.getElementById("pubImagemArquivo")?.focus();
    return false;
  }
  if (arquivo.size <= 0 || arquivo.size > IMAGE_MAX_BYTES) {
    definirStatusImagem("A imagem deve ter até 10 MB.", "error");
    if (focar) document.getElementById("pubImagemArquivo")?.focus();
    return false;
  }
  definirStatusImagem(`Imagem pronta: ${arquivo.name} • ${formatarBytes(arquivo.size)}`);
  return true;
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
    id: document.getElementById("pubId")?.value || "admin-live-preview",
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
    renderizarModalPreview(doc, item);
    return;
  }

  const alvo = doc.querySelector(`[data-publicacoes-local="${cssEscape(item.local)}"]`);
  if (!alvo) return;

  const secao = alvo.closest("[data-publicacoes-section]");
  aplicarLayoutDoSite(alvo, item.local);
  if (secao) {
    secao.hidden = false;
    secao.classList.remove("secao-vazia", "hidden-by-cms");
    secao.classList.add("ativo");
  }

  alvo.replaceChildren(item.local === "banner" ? criarBannerReal(doc, item) : criarCardReal(doc, item));

  requestAnimationFrame(() => {
    if (item.local === "banner") win.scrollTo({ top: 0, behavior: "auto" });
    else secao?.scrollIntoView({ block: "start", behavior: "auto" });
  });
}

function aplicarLayoutDoSite(alvo, local) {
  const secoes = Array.isArray(previewHome?.secoes) ? previewHome.secoes : [];
  const secao = secoes.find((item) => String(item?.id || "") === local);
  const layout = secao?.layout === "lista" ? "lista" : "blocos";
  alvo.dataset.layout = layout;
  alvo.classList.toggle("layout-lista", layout === "lista");
  alvo.classList.toggle("layout-blocos", layout !== "lista");
}

function limparModal(doc) {
  const modal = doc.querySelector("[data-publicacoes-local='modal']");
  if (!modal) return;
  modal.replaceChildren();
  modal.hidden = true;
  delete modal.dataset.adminPreviewModal;
  doc.body.classList.remove("modal-open");
}

function criarCardReal(doc, item) {
  const card = doc.createElement("article");
  card.className = `card publicacao-dinamica estilo-${normalizarClasse(item.estilo || "padrao")}`;
  card.dataset.adminPublicationPreview = "1";

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

function criarBannerReal(doc, item) {
  const banner = doc.createElement("div");
  banner.className = "public-banner";
  banner.dataset.adminPublicationPreview = "1";

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

function renderizarModalPreview(doc, item) {
  const alvo = doc.querySelector("[data-publicacoes-local='modal']");
  if (!alvo) return;

  alvo.dataset.adminPreviewModal = "1";
  alvo.hidden = false;
  doc.body.classList.add("modal-open");

  const modal = doc.createElement("div");
  modal.className = "public-modal-content";
  modal.dataset.adminPublicationPreview = "1";
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
  body.appendChild(criarCardReal(doc, item));
  modal.append(header, body);
  alvo.appendChild(modal);
}

async function verificarUploadNoRepositorio(esperado) {
  const token = obterTokenGithub();
  if (!token) {
    definirStatusImagem("A publicação foi salva, mas não foi possível confirmar a imagem sem a conexão GitHub ativa.", "error");
    return;
  }

  definirStatusImagem("Confirmando o arquivo no repositório...", "checking");

  try {
    const resposta = await fetch(`https://api.github.com/repos/${REPO}/contents/${IMAGE_ROOT}?ref=${encodeURIComponent(BRANCH)}&v=${Date.now()}`, {
      headers: cabecalhosGithub(token),
      cache: "no-store"
    });
    if (!resposta.ok) throw new Error(`HTTP_${resposta.status}`);
    const arquivos = await resposta.json();
    const encontrado = Array.isArray(arquivos)
      ? arquivos
        .filter((item) => typeof item?.name === "string" && item.name.endsWith(esperado.sufixo))
        .map((item) => ({ ...item, timestamp: Number(String(item.name).split("-")[0]) || 0 }))
        .filter((item) => item.timestamp >= esperado.inicio)
        .sort((a, b) => b.timestamp - a.timestamp)[0]
      : null;

    if (!encontrado) throw new Error("ARQUIVO_NAO_ENCONTRADO");
    if (Number(encontrado.size) !== Number(esperado.tamanho)) {
      definirStatusImagem(`Imagem encontrada no GitHub, mas o tamanho divergiu (${formatarBytes(encontrado.size)} no repositório).`, "error");
      return;
    }

    definirStatusImagem(`Imagem confirmada no GitHub: ${encontrado.name} • ${formatarBytes(encontrado.size)}`, "success");
  } catch (erro) {
    console.warn("Não foi possível confirmar o upload da imagem.", erro);
    definirStatusImagem("A publicação foi salva, mas não consegui confirmar automaticamente a imagem no repositório. Atualize e confira antes de publicar novamente.", "error");
  }
}

function definirStatusImagem(texto, tipo = "") {
  const status = document.getElementById("publicationImageRepoStatus");
  if (!status) return;
  status.textContent = texto;
  status.className = `publicationImageRepoStatus ${tipo}`.trim();
}

function obterTokenGithub() {
  return sessionStorage.getItem(TOKEN_SESSAO) || localStorage.getItem(TOKEN_LOCAL) || "";
}

function cabecalhosGithub(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

function sufixoImagemEsperado(arquivo) {
  const extensao = (arquivo.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const base = slugificar(arquivo.name.replace(/\.[^.]+$/, "")) || "imagem";
  return `-${base}.${extensao}`;
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

function normalizarClasse(valor) {
  return String(valor || "padrao").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

function cssEscape(valor) {
  if (globalThis.CSS?.escape) return CSS.escape(String(valor));
  return String(valor).replace(/["\\]/g, "\\$&");
}

function formatarBytes(bytes) {
  const valor = Number(bytes) || 0;
  if (valor < 1024) return `${valor} B`;
  if (valor < 1024 * 1024) return `${(valor / 1024).toFixed(1)} KB`;
  return `${(valor / (1024 * 1024)).toFixed(1)} MB`;
}
