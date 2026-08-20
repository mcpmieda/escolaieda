const GITHUB = Object.freeze({
  repo: "mcpmieda/escolaieda",
  branch: "main",
  indexPath: "index.html",
  dataPath: "site-data/publicacoes-publicas.json",
  imageRoot: "imagens/editor"
});

const STORAGE_TOKEN = "escolaIedaGithubToken";
const SESSION_TOKEN = "escolaIedaGithubTokenSessao";

const state = {
  editor: null,
  originalHtml: "",
  baseInlineCss: "",
  preservedScripts: [],
  busy: false,
  pendingSave: false,
  toastTimer: null
};

const $ = (id) => document.getElementById(id);
const el = {
  loading: $("editorLoading"),
  btnSalvar: $("btnSalvar"),
  btnPreview: $("btnPreview"),
  btnUndo: $("btnUndo"),
  btnRedo: $("btnRedo"),
  statusToast: $("statusToast"),
  githubDialog: $("githubDialog"),
  githubForm: $("githubForm"),
  githubToken: $("githubToken"),
  githubRemember: $("githubRemember"),
  githubDialogStatus: $("githubDialogStatus"),
  btnCancelarGithub: $("btnCancelarGithub"),
  previewDialog: $("previewDialog"),
  previewFrame: $("previewFrame"),
  btnFecharPreview: $("btnFecharPreview"),
  propertyHelp: $("propertyHelp")
};

inicializarEventos();
await inicializarEditor();

function inicializarEventos() {
  el.btnSalvar?.addEventListener("click", salvarPagina);
  el.btnPreview?.addEventListener("click", abrirPreview);
  el.btnUndo?.addEventListener("click", () => state.editor?.UndoManager.undo());
  el.btnRedo?.addEventListener("click", () => state.editor?.UndoManager.redo());
  el.btnCancelarGithub?.addEventListener("click", () => {
    state.pendingSave = false;
    el.githubDialog?.close();
  });
  el.githubForm?.addEventListener("submit", conectarGithub);
  el.btnFecharPreview?.addEventListener("click", fecharPreview);
  el.previewDialog?.addEventListener("click", (event) => {
    if (event.target === el.previewDialog) fecharPreview();
  });

  document.querySelectorAll("[data-device]").forEach((botao) => {
    botao.addEventListener("click", () => {
      state.editor?.setDevice(botao.dataset.device);
      document.querySelectorAll("[data-device]").forEach((item) => item.classList.toggle("active", item === botao));
    });
  });

  document.querySelectorAll("[data-panel]").forEach((botao) => {
    botao.addEventListener("click", () => abrirPainelPropriedades(botao.dataset.panel));
  });

  document.addEventListener("keydown", (event) => {
    const salvar = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
    if (!salvar) return;
    event.preventDefault();
    salvarPagina();
  });
}

async function inicializarEditor() {
  if (!window.grapesjs) {
    mostrarErroRuntime();
    return;
  }

  try {
    const resposta = await fetch(`../../index.html?v=${Date.now()}`, { cache: "no-store" });
    if (!resposta.ok) throw new Error("Não foi possível carregar a página inicial.");
    state.originalHtml = await resposta.text();

    const preparado = prepararDocumento(state.originalHtml);
    state.baseInlineCss = preparado.inlineCss;
    state.preservedScripts = preparado.scripts;

    state.editor = window.grapesjs.init({
      container: "#gjs",
      height: "100%",
      width: "auto",
      fromElement: false,
      storageManager: false,
      noticeOnUnload: false,
      showOffsets: true,
      showDevices: false,
      panels: { defaults: [] },
      blockManager: { appendTo: "#blocks" },
      layerManager: { appendTo: "#layers" },
      traitManager: { appendTo: "#traits" },
      styleManager: {
        appendTo: "#styles",
        sectors: criarSetoresAparencia()
      },
      deviceManager: {
        devices: [
          { name: "Desktop", width: "" },
          { name: "Tablet", width: "820px", widthMedia: "992px" },
          { name: "Celular", width: "390px", widthMedia: "640px" }
        ]
      },
      assetManager: {
        upload: false,
        uploadFile: enviarArquivoAssetManager
      },
      canvas: { styles: preparado.stylesheets },
      components: preparado.bodyHtml
    });

    registrarBlocos(state.editor);
    configurarProtecoes(state.editor);
    configurarEventosEditor(state.editor);
    requestAnimationFrame(() => prepararCanvas(state.editor));
    el.loading?.setAttribute("hidden", "");
  } catch (erro) {
    console.error(erro);
    mostrarEstadoFatal("Não foi possível abrir o editor.", "A página pública permanece intacta. Tente novamente mais tarde.");
  }
}

function prepararDocumento(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const scripts = [...doc.body.querySelectorAll("script")].map((script) => script.outerHTML);
  doc.body.querySelectorAll("script").forEach((script) => script.remove());

  const stylesheets = [...doc.head.querySelectorAll('link[rel="stylesheet"][href]')]
    .map((link) => new URL(link.getAttribute("href"), new URL("../../index.html", window.location.href)).href);
  const inlineCss = [...doc.head.querySelectorAll("style")].map((style) => style.textContent || "").join("\n");

  return { bodyHtml: doc.body.innerHTML, scripts, stylesheets, inlineCss };
}

function prepararCanvas(editor) {
  const doc = editor.Canvas.getDocument();
  if (!doc?.head) return;

  if (!doc.head.querySelector("base[data-ieda-editor]")) {
    const base = doc.createElement("base");
    base.href = new URL("../../", window.location.href).href;
    base.dataset.iedaEditor = "";
    doc.head.prepend(base);
  }

  const style = doc.createElement("style");
  style.dataset.iedaBaseCss = "";
  style.textContent = `${state.baseInlineCss}\n.reveal{opacity:1!important;transform:none!important}.secao-vazia[hidden]{display:none!important}`;
  doc.head.appendChild(style);
}

function configurarEventosEditor(editor) {
  editor.on("load", () => prepararCanvas(editor));
  editor.on("canvas:frame:load", () => prepararCanvas(editor));
  editor.on("component:selected", () => el.propertyHelp?.classList.add("hidden"));
  editor.on("component:deselected", () => {
    if (!editor.getSelected()) el.propertyHelp?.classList.remove("hidden");
  });
  editor.on("update", atualizarEstadoHistorico);
  editor.on("undo redo", atualizarEstadoHistorico);
  atualizarEstadoHistorico();
}

function atualizarEstadoHistorico() {
  if (!state.editor) return;
  if (el.btnUndo) el.btnUndo.disabled = !state.editor.UndoManager.hasUndo();
  if (el.btnRedo) el.btnRedo.disabled = !state.editor.UndoManager.hasRedo();
}

function configurarProtecoes(editor) {
  const wrapper = editor.getWrapper();
  const proteger = (componente) => {
    const attrs = componente.getAttributes?.() || {};
    const tag = String(componente.get("tagName") || "").toLowerCase();
    if (attrs.id === "topbar" || tag === "footer") {
      componente.set({ removable: false, copyable: false, draggable: false });
    }
    componente.components?.().forEach(proteger);
  };
  wrapper.components().forEach(proteger);
}

function criarSetoresAparencia() {
  return [
    {
      name: "Texto",
      open: true,
      buildProps: ["font-family", "font-size", "font-weight", "color", "line-height", "text-align", "text-decoration"]
    },
    {
      name: "Espaçamento",
      open: false,
      buildProps: ["margin", "padding"]
    },
    {
      name: "Fundo e borda",
      open: false,
      buildProps: ["background-color", "border", "border-radius", "box-shadow"]
    },
    {
      name: "Tamanho",
      open: false,
      buildProps: ["width", "max-width", "min-height"]
    }
  ];
}

function registrarBlocos(editor) {
  const blocos = [
    ["ieda-titulo", "Título", "T", '<section class="container reveal"><div class="titulo-secao"><h2>Novo título</h2><p>Escreva aqui uma frase de apoio.</p></div></section>'],
    ["ieda-texto", "Texto", "¶", '<section class="container reveal"><div class="card"><h3>Novo conteúdo</h3><p>Digite aqui o texto que deseja publicar na página.</p></div></section>'],
    ["ieda-cartoes", "Cartões", "▦", '<section class="container reveal"><div class="grid"><div class="card"><h3>Primeiro cartão</h3><p>Texto do cartão.</p></div><div class="card"><h3>Segundo cartão</h3><p>Texto do cartão.</p></div><div class="card"><h3>Terceiro cartão</h3><p>Texto do cartão.</p></div></div></section>'],
    ["ieda-destaque", "Destaque", "✦", '<section class="container reveal"><div class="faixa"><h2>Mensagem em destaque</h2><p>Use este bloco para uma informação que merece mais atenção.</p></div></section>'],
    ["ieda-botao", "Botão", "↗", '<div class="container reveal" style="text-align:center"><a class="botao botao-login" href="#">Abrir informação</a></div>'],
    ["ieda-imagem", "Imagem", "▧", '<section class="container reveal"><div class="card" style="padding:12px"><img src="imagens/favicon.png" alt="Descreva a imagem" style="display:block;width:100%;max-height:520px;object-fit:cover;border-radius:16px"></div></section>']
  ];

  blocos.forEach(([id, label, icon, content]) => {
    editor.BlockManager.add(id, {
      label,
      category: "Escola Iêda",
      media: `<span aria-hidden="true">${icon}</span>`,
      content
    });
  });
}

function abrirPainelPropriedades(nome) {
  document.querySelectorAll("[data-panel]").forEach((botao) => botao.classList.toggle("active", botao.dataset.panel === nome));
  $("stylesPane")?.classList.toggle("active", nome === "styles");
  $("layersPane")?.classList.toggle("active", nome === "layers");
}

async function salvarPagina() {
  if (!state.editor || state.busy) return;
  const token = obterTokenGithub();
  if (!token) {
    state.pendingSave = true;
    abrirGithubDialog();
    return;
  }

  state.busy = true;
  alternarSalvando(true);
  try {
    const html = montarHtmlCompleto();
    const dados = await prepararDadosPublicos(html);
    await commitAtomicoGithub(token, [
      { path: GITHUB.indexPath, content: html },
      { path: GITHUB.dataPath, content: `${JSON.stringify(dados, null, 2)}\n` }
    ], "Atualiza página inicial pelo editor visual");

    state.originalHtml = html;
    state.editor.clearDirtyCount?.();
    mostrarToast("Página salva. O GitHub recebeu a Home e os dados compatíveis no mesmo commit.", "success");
  } catch (erro) {
    console.error(erro);
    if (erro.status === 401 || erro.status === 403) limparTokenGithub();
    mostrarToast(mensagemErroGithub(erro), "error");
  } finally {
    state.busy = false;
    alternarSalvando(false);
  }
}

function montarHtmlCompleto({ preview = false } = {}) {
  const doc = new DOMParser().parseFromString(state.originalHtml, "text/html");
  const estiloAnterior = doc.head.querySelector("#admin-editor-estilos");
  const css = state.editor.getCss() || "";
  if (css.trim()) {
    const style = estiloAnterior || doc.createElement("style");
    style.id = "admin-editor-estilos";
    style.textContent = css;
    if (!estiloAnterior) doc.head.appendChild(style);
  } else {
    estiloAnterior?.remove();
  }

  doc.body.innerHTML = state.editor.getHtml();
  if (!preview) {
    state.preservedScripts.forEach((htmlScript) => {
      const fragmento = doc.createRange().createContextualFragment(htmlScript);
      doc.body.appendChild(fragmento);
    });
  }

  if (preview) {
    const base = doc.createElement("base");
    base.href = new URL("../../", window.location.href).href;
    doc.head.prepend(base);
    const helper = doc.createElement("style");
    helper.textContent = ".reveal{opacity:1!important;transform:none!important}";
    doc.head.appendChild(helper);
  }

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}

async function prepararDadosPublicos(html) {
  const resposta = await fetch(`../../site-data/publicacoes-publicas.json?v=${Date.now()}`, { cache: "no-store" });
  if (!resposta.ok) throw new Error("Não foi possível sincronizar os textos da Home com as publicações.");
  const dados = await resposta.json();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const homeAtual = dados.home && typeof dados.home === "object" ? dados.home : {};
  const secoesAtuais = Array.isArray(homeAtual.secoes) ? homeAtual.secoes : [];

  const home = {
    ...homeAtual,
    titulo: textoSeletor(doc, "[data-home-titulo]", homeAtual.titulo),
    subtitulo: textoSeletor(doc, "[data-home-subtitulo]", homeAtual.subtitulo),
    missao: textoSeletor(doc, "[data-home-missao]", homeAtual.missao),
    infoTexto: textoSeletor(doc, "[data-home-info-texto]", homeAtual.infoTexto),
    secoes: secoesAtuais.map((secao) => sincronizarSecaoHome(doc, secao))
  };

  return {
    ...dados,
    atualizadoEm: new Date().toISOString(),
    origem: "GITHUB",
    cache: "fonte direta do repositório",
    home
  };
}

function sincronizarSecaoHome(doc, secao) {
  const id = String(secao?.id || "").trim();
  const bloco = id ? doc.querySelector(`[data-home-section="${cssEscape(id)}"]`) : null;
  if (!bloco) return secao;

  const proxima = {
    ...secao,
    titulo: bloco.querySelector(`[data-section-title="${cssEscape(id)}"]`)?.textContent?.trim() || secao.titulo || "",
    texto: bloco.querySelector(`[data-section-text="${cssEscape(id)}"]`)?.textContent?.trim() ?? secao.texto ?? ""
  };

  const indicadores = [...bloco.querySelectorAll("[data-section-indicators] .numero")]
    .map((item) => ({
      valor: item.querySelector("strong")?.textContent?.trim() || "",
      rotulo: item.querySelector("span")?.textContent?.trim() || ""
    }))
    .filter((item) => item.valor || item.rotulo);
  if (indicadores.length) proxima.indicadores = indicadores;
  return proxima;
}

function textoSeletor(doc, seletor, fallback = "") {
  return doc.querySelector(seletor)?.textContent?.trim() || fallback || "";
}

function cssEscape(valor) {
  if (window.CSS?.escape) return window.CSS.escape(valor);
  return String(valor).replace(/[^a-zA-Z0-9_-]/g, "");
}

async function commitAtomicoGithub(token, arquivos, mensagem) {
  const ref = await github(`/git/ref/heads/${encodeURIComponent(GITHUB.branch)}`, { token });
  const parentSha = ref.object?.sha;
  if (!parentSha) throw new Error("Não foi possível localizar a versão atual do site.");

  const commitAtual = await github(`/git/commits/${parentSha}`, { token });
  const baseTree = commitAtual.tree?.sha;
  if (!baseTree) throw new Error("Não foi possível preparar a atualização do site.");

  const tree = [];
  for (const arquivo of arquivos) {
    const blob = await github("/git/blobs", {
      method: "POST",
      token,
      body: { content: arquivo.content, encoding: "utf-8" }
    });
    tree.push({ path: arquivo.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const novaTree = await github("/git/trees", {
    method: "POST",
    token,
    body: { base_tree: baseTree, tree }
  });
  const novoCommit = await github("/git/commits", {
    method: "POST",
    token,
    body: { message: mensagem, tree: novaTree.sha, parents: [parentSha] }
  });
  await github(`/git/refs/heads/${encodeURIComponent(GITHUB.branch)}`, {
    method: "PATCH",
    token,
    body: { sha: novoCommit.sha, force: false }
  });
  return novoCommit.sha;
}

async function enviarArquivoAssetManager(event) {
  try {
    const arquivos = [...(event?.dataTransfer?.files || event?.target?.files || [])];
    if (!arquivos.length) return;
    const token = obterTokenGithub();
    if (!token) {
      abrirGithubDialog("Conecte ao GitHub antes de enviar uma imagem.");
      return;
    }

    for (const arquivo of arquivos.slice(0, 8)) {
      if (!/^image\/(jpeg|png|webp|gif|svg\+xml)$/i.test(arquivo.type)) {
        mostrarToast(`O arquivo ${arquivo.name} não é uma imagem compatível.`, "error");
        continue;
      }
      if (arquivo.size > 8 * 1024 * 1024) {
        mostrarToast(`A imagem ${arquivo.name} ultrapassa 8 MB.`, "error");
        continue;
      }
      const caminho = `${GITHUB.imageRoot}/${Date.now()}-${slugArquivo(arquivo.name)}`;
      await criarArquivoGithub(token, caminho, await arquivoParaBase64(arquivo), `Adiciona imagem pelo editor visual: ${arquivo.name}`);
      const url = `/${caminho}`;
      state.editor.AssetManager.add({ src: url, name: arquivo.name });
      mostrarToast(`Imagem ${arquivo.name} enviada.`, "success");
    }
  } catch (erro) {
    console.error(erro);
    mostrarToast(mensagemErroGithub(erro), "error");
  }
}

async function criarArquivoGithub(token, path, contentBase64, message) {
  return github(`/contents/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "PUT",
    token,
    body: { message, content: contentBase64, branch: GITHUB.branch }
  });
}

function abrirPreview() {
  if (!state.editor || !el.previewDialog || !el.previewFrame) return;
  el.previewFrame.srcdoc = montarHtmlCompleto({ preview: true });
  el.previewDialog.showModal();
}

function fecharPreview() {
  el.previewDialog?.close();
  if (el.previewFrame) el.previewFrame.srcdoc = "";
}

function abrirGithubDialog(mensagem = "") {
  if (!el.githubDialog) return;
  el.githubDialogStatus.textContent = mensagem;
  el.githubToken.value = obterTokenGithub() || "";
  el.githubRemember.checked = Boolean(localStorage.getItem(STORAGE_TOKEN));
  if (!el.githubDialog.open) el.githubDialog.showModal();
  requestAnimationFrame(() => el.githubToken?.focus());
}

async function conectarGithub(event) {
  event.preventDefault();
  const token = el.githubToken?.value.trim();
  if (!token) return;
  el.githubDialogStatus.textContent = "Verificando acesso...";
  try {
    await github("", { token });
    sessionStorage.setItem(SESSION_TOKEN, token);
    if (el.githubRemember.checked) localStorage.setItem(STORAGE_TOKEN, token);
    else localStorage.removeItem(STORAGE_TOKEN);
    el.githubDialog.close();
    el.githubDialogStatus.textContent = "";
    mostrarToast("GitHub conectado.", "success");
    if (state.pendingSave) {
      state.pendingSave = false;
      await salvarPagina();
    }
  } catch (erro) {
    console.error(erro);
    el.githubDialogStatus.textContent = "Token inválido ou sem permissão para este repositório.";
  }
}

function obterTokenGithub() {
  return sessionStorage.getItem(SESSION_TOKEN) || localStorage.getItem(STORAGE_TOKEN) || "";
}

function limparTokenGithub() {
  sessionStorage.removeItem(SESSION_TOKEN);
  localStorage.removeItem(STORAGE_TOKEN);
}

async function github(path, { method = "GET", token, body } = {}) {
  const resposta = await fetch(`https://api.github.com/repos/${GITHUB.repo}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const texto = await resposta.text();
  let dados = {};
  try { dados = texto ? JSON.parse(texto) : {}; } catch { dados = {}; }
  if (!resposta.ok) {
    const erro = new Error(dados.message || `GitHub respondeu ${resposta.status}.`);
    erro.status = resposta.status;
    erro.details = dados;
    throw erro;
  }
  return dados;
}

function alternarSalvando(salvando) {
  if (!el.btnSalvar) return;
  el.btnSalvar.disabled = salvando;
  el.btnSalvar.textContent = salvando ? "Salvando..." : "Salvar alterações";
}

function mostrarToast(mensagem, tipo = "") {
  if (!el.statusToast) return;
  window.clearTimeout(state.toastTimer);
  el.statusToast.textContent = mensagem;
  el.statusToast.className = `statusToast show ${tipo}`.trim();
  state.toastTimer = window.setTimeout(() => {
    el.statusToast.className = "statusToast";
  }, 4400);
}

function mostrarErroRuntime() {
  if (el.btnSalvar) el.btnSalvar.disabled = true;
  if (el.btnPreview) el.btnPreview.disabled = true;
  mostrarEstadoFatal(
    "O motor visual ainda não foi incorporado à branch.",
    "Nenhuma alteração foi feita no site. O runtime local do GrapesJS precisa ser vendorizado antes dos testes."
  );
}

function mostrarEstadoFatal(titulo, detalhe) {
  if (!el.loading) return;
  el.loading.removeAttribute("hidden");
  el.loading.replaceChildren();
  const forte = document.createElement("strong");
  forte.textContent = titulo;
  const pequeno = document.createElement("small");
  pequeno.textContent = detalhe;
  el.loading.append(forte, pequeno);
}

function mensagemErroGithub(erro) {
  if (erro?.status === 401) return "A conexão com o GitHub expirou. Conecte novamente.";
  if (erro?.status === 403) return "O token não tem permissão suficiente para salvar este site.";
  if (erro?.status === 409 || erro?.status === 422) return "O site foi alterado em outro lugar. Recarregue o editor antes de salvar novamente.";
  return erro?.message || "Não foi possível salvar agora. Nenhuma alteração local foi descartada.";
}

function slugArquivo(nome) {
  const partes = String(nome || "imagem").split(".");
  const extensao = partes.length > 1 ? partes.pop().toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = partes.join(".").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "imagem";
  return extensao ? `${base}.${extensao}` : base;
}

function arquivoParaBase64(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.readAsDataURL(arquivo);
  });
}
