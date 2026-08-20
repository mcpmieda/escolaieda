(() => {
  const GITHUB = {
    repo: "mcpmieda/escolaieda",
    branch: "main",
    pageRoot: "paginas",
    imageRoot: "imagens/editor"
  };
  const STORAGE_TOKEN = "escolaIedaGithubToken";
  const SESSION_TOKEN = "escolaIedaGithubTokenSessao";

  const state = {
    path: "index.html",
    title: "Página inicial",
    url: "../../index.html",
    pages: [],
    busy: false,
    toastTimer: null
  };

  window.addEventListener("load", () => setTimeout(inicializar, 80));

  function inicializar() {
    if (!window.Vvveb?.Builder) return;
    document.documentElement.lang = "pt-BR";
    document.title = "Editor visual | Escola Iêda MCPM";
    prepararSaveOriginal();
    criarBarraEscola();
    criarDialogNovaPagina();
    criarDialogToken();
    criarMenuPaginas();
    criarToast();
    configurarAtalhos();
    traduzirInterfaceBasica();
    atualizarPreviewUrl();
    carregarListaPaginas();
  }

  function prepararSaveOriginal() {
    document.querySelectorAll(".save-btn").forEach((botao, indice) => {
      if (indice > 0) {
        botao.style.display = "none";
        return;
      }
      botao.disabled = false;
      botao.removeAttribute("data-vvveb-action");
      botao.removeAttribute("data-vvveb-url");
      botao.dataset.iedaSave = "true";
      const texto = botao.querySelector(".button-text span");
      if (texto) texto.textContent = "Salvar";
      botao.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        salvarPagina();
      }, true);
    });
  }

  function criarBarraEscola() {
    const barra = document.createElement("div");
    barra.className = "ieda-editor-bar";
    barra.innerHTML = `
      <a href="../" title="Voltar ao Centro de Administração">← <span class="ieda-hide-medium">Painel</span></a>
      <button type="button" id="iedaPagesButton" title="Escolher página"><span class="ieda-page-name" id="iedaPageName">Página inicial</span> ▾</button>
      <button type="button" id="iedaNewPage" class="ieda-hide-small">+ Nova página</button>
      <button type="button" id="iedaUploadImage" class="ieda-hide-small">Imagem</button>
      <button type="button" id="iedaSave" class="ieda-primary">Salvar</button>
      <input id="iedaImageFile" type="file" accept="image/jpeg,image/png,image/webp" hidden>
    `;
    document.body.appendChild(barra);
    document.getElementById("iedaPagesButton")?.addEventListener("click", alternarMenuPaginas);
    document.getElementById("iedaNewPage")?.addEventListener("click", abrirNovaPagina);
    document.getElementById("iedaUploadImage")?.addEventListener("click", iniciarUploadImagem);
    document.getElementById("iedaImageFile")?.addEventListener("change", enviarImagemSelecionada);
    document.getElementById("iedaSave")?.addEventListener("click", salvarPagina);
  }

  function criarDialogNovaPagina() {
    const dialog = document.createElement("dialog");
    dialog.className = "ieda-dialog";
    dialog.id = "iedaNewPageDialog";
    dialog.innerHTML = `
      <form class="ieda-dialog-card" id="iedaNewPageForm">
        <h2>Criar nova página</h2>
        <p>Comece com um modelo limpo da Escola Iêda. Depois você poderá montar a página visualmente.</p>
        <label>Nome da página
          <input id="iedaNewPageTitle" type="text" maxlength="80" required placeholder="Ex.: Projeto de Leitura">
        </label>
        <label>Endereço
          <input id="iedaNewPageSlug" type="text" maxlength="70" required placeholder="projeto-de-leitura">
        </label>
        <div class="ieda-dialog-actions">
          <button type="button" data-close-dialog>Cancelar</button>
          <button type="submit" class="ieda-primary">Criar página</button>
        </div>
      </form>`;
    document.body.appendChild(dialog);
    const titulo = dialog.querySelector("#iedaNewPageTitle");
    const slug = dialog.querySelector("#iedaNewPageSlug");
    titulo?.addEventListener("input", () => {
      if (!slug.dataset.manual) slug.value = slugificar(titulo.value);
    });
    slug?.addEventListener("input", () => {
      slug.dataset.manual = "true";
      slug.value = slugificar(slug.value);
    });
    dialog.querySelector("[data-close-dialog]")?.addEventListener("click", () => dialog.close());
    dialog.querySelector("#iedaNewPageForm")?.addEventListener("submit", criarNovaPagina);
  }

  function criarDialogToken() {
    const dialog = document.createElement("dialog");
    dialog.className = "ieda-dialog";
    dialog.id = "iedaTokenDialog";
    dialog.innerHTML = `
      <form class="ieda-dialog-card" id="iedaTokenForm">
        <h2>Conectar ao GitHub</h2>
        <p>Use o mesmo token restrito ao repositório que você usa no painel administrativo.</p>
        <label>Token GitHub
          <input id="iedaTokenInput" type="password" autocomplete="off" required placeholder="github_pat_...">
        </label>
        <label style="display:flex;grid-template-columns:auto 1fr;align-items:center;gap:8px">
          <input id="iedaRememberToken" type="checkbox" style="width:auto"> Lembrar neste dispositivo
        </label>
        <div class="ieda-dialog-actions">
          <button type="button" data-close-dialog>Cancelar</button>
          <button type="submit" class="ieda-primary">Conectar</button>
        </div>
      </form>`;
    document.body.appendChild(dialog);
    dialog.querySelector("[data-close-dialog]")?.addEventListener("click", () => dialog.close());
    dialog.querySelector("#iedaTokenForm")?.addEventListener("submit", salvarToken);
  }

  function criarMenuPaginas() {
    const menu = document.createElement("div");
    menu.id = "iedaPageMenu";
    menu.className = "ieda-page-menu";
    menu.hidden = true;
    document.body.appendChild(menu);
    document.addEventListener("click", (event) => {
      const botao = document.getElementById("iedaPagesButton");
      if (!menu.contains(event.target) && !botao?.contains(event.target)) menu.hidden = true;
    });
    renderizarMenuPaginas();
  }

  function criarToast() {
    const toast = document.createElement("div");
    toast.id = "iedaEditorStatus";
    toast.className = "ieda-status";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  function configurarAtalhos() {
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        event.stopImmediatePropagation();
        salvarPagina();
      }
    }, true);
  }

  function traduzirInterfaceBasica() {
    const trocas = new Map([
      ["Components", "Elementos"],
      ["Style", "Aparência"],
      ["Properties", "Propriedades"],
      ["Preview", "Prévia"],
      ["Mobile view", "Celular"],
      ["Tablet view", "Tablet"],
      ["Laptop view", "Notebook"],
      ["Desktop view", "Computador"]
    ]);
    document.querySelectorAll("[title]").forEach((elemento) => {
      if (trocas.has(elemento.title)) elemento.title = trocas.get(elemento.title);
    });
    document.querySelectorAll("#elements-tabs .title").forEach((elemento) => {
      if (trocas.has(elemento.textContent.trim())) elemento.textContent = trocas.get(elemento.textContent.trim());
    });
  }

  function atualizarPreviewUrl() {
    const link = document.querySelector(".btn-preview-url");
    if (link) link.href = state.url;
  }

  async function carregarListaPaginas() {
    state.pages = [{ title: "Página inicial", path: "index.html", url: "../../index.html" }];
    if (!obterToken()) {
      renderizarMenuPaginas();
      return;
    }
    try {
      const itens = await github(`/contents/${GITHUB.pageRoot}?ref=${encodeURIComponent(GITHUB.branch)}`);
      if (Array.isArray(itens)) {
        itens.filter((item) => item.type === "dir").forEach((item) => {
          state.pages.push({
            title: humanizarSlug(item.name),
            path: `${GITHUB.pageRoot}/${item.name}/index.html`,
            url: `../../${GITHUB.pageRoot}/${item.name}/index.html`
          });
        });
      }
    } catch (erro) {
      if (erro.status !== 404) console.warn("Não foi possível listar páginas.", erro);
    }
    renderizarMenuPaginas();
  }

  function renderizarMenuPaginas() {
    const menu = document.getElementById("iedaPageMenu");
    if (!menu) return;
    menu.replaceChildren();
    state.pages.forEach((pagina) => {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.textContent = pagina.title;
      botao.addEventListener("click", () => carregarPagina(pagina));
      menu.appendChild(botao);
    });
  }

  function alternarMenuPaginas() {
    const menu = document.getElementById("iedaPageMenu");
    if (!menu) return;
    menu.hidden = !menu.hidden;
  }

  function carregarPagina(pagina) {
    if (!pagina?.url || state.busy) return;
    state.path = pagina.path;
    state.title = pagina.title;
    state.url = pagina.url;
    document.getElementById("iedaPageMenu").hidden = true;
    atualizarNomePagina();
    atualizarPreviewUrl();
    mostrarStatus(`Abrindo ${pagina.title}...`);
    Vvveb.Builder.init(pagina.url, () => mostrarStatus(`${pagina.title} pronta para editar.`, "success"));
  }

  function abrirNovaPagina() {
    if (!obterToken()) {
      abrirToken();
      return;
    }
    const dialog = document.getElementById("iedaNewPageDialog");
    const form = document.getElementById("iedaNewPageForm");
    form?.reset();
    document.getElementById("iedaNewPageSlug")?.removeAttribute("data-manual");
    dialog?.showModal();
    setTimeout(() => document.getElementById("iedaNewPageTitle")?.focus(), 50);
  }

  function criarNovaPagina(event) {
    event.preventDefault();
    const titulo = document.getElementById("iedaNewPageTitle").value.trim();
    const slug = slugificar(document.getElementById("iedaNewPageSlug").value || titulo);
    if (!titulo || !slug) return;
    const pagina = {
      title: titulo,
      path: `${GITHUB.pageRoot}/${slug}/index.html`,
      url: "modelos/pagina-basica.html"
    };
    document.getElementById("iedaNewPageDialog")?.close();
    state.path = pagina.path;
    state.title = titulo;
    state.url = pagina.url;
    atualizarNomePagina();
    atualizarPreviewUrl();
    Vvveb.Builder.init(pagina.url, () => {
      const doc = window.FrameDocument;
      const h1 = doc?.querySelector("h1");
      const title = doc?.querySelector("title");
      if (h1) h1.textContent = titulo;
      if (title) title.textContent = `${titulo} | Escola Iêda MCPM`;
      mostrarStatus("Página criada no editor. Clique em Salvar para publicá-la.", "success");
    });
  }

  function atualizarNomePagina() {
    const nome = document.getElementById("iedaPageName");
    if (nome) nome.textContent = state.title;
  }

  async function salvarPagina() {
    if (state.busy) return;
    if (!obterToken()) {
      abrirToken();
      return;
    }
    state.busy = true;
    setBotoesBusy(true);
    mostrarStatus("Salvando página no GitHub...");
    try {
      const html = Vvveb.Builder.getHtml();
      const atual = await obterArquivoSeExiste(state.path);
      await github(`/contents/${state.path}`, {
        method: "PUT",
        body: {
          message: `site: editar ${state.title}`,
          content: codificarUtf8(html.endsWith("\n") ? html : `${html}\n`),
          ...(atual?.sha ? { sha: atual.sha } : {}),
          branch: GITHUB.branch
        }
      });
      if (state.path.startsWith(`${GITHUB.pageRoot}/`)) {
        const slug = state.path.split("/")[1];
        state.url = `../../${GITHUB.pageRoot}/${slug}/index.html`;
        if (!state.pages.some((pagina) => pagina.path === state.path)) {
          state.pages.push({ title: state.title, path: state.path, url: state.url });
          renderizarMenuPaginas();
        }
        atualizarPreviewUrl();
      }
      mostrarStatus("Alterações salvas com sucesso.", "success");
    } catch (erro) {
      console.error(erro);
      mostrarStatus(mensagemErro(erro), "error");
    } finally {
      state.busy = false;
      setBotoesBusy(false);
    }
  }

  function setBotoesBusy(busy) {
    document.querySelectorAll("#iedaSave,.save-btn[data-ieda-save]").forEach((botao) => {
      botao.disabled = busy;
      const texto = botao.querySelector(".button-text span");
      if (texto) texto.textContent = busy ? "Salvando..." : "Salvar";
      else if (botao.id === "iedaSave") botao.textContent = busy ? "Salvando..." : "Salvar";
    });
  }

  function iniciarUploadImagem() {
    if (!obterToken()) {
      abrirToken();
      return;
    }
    document.getElementById("iedaImageFile")?.click();
  }

  async function enviarImagemSelecionada(event) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    if (!/^image\/(jpeg|png|webp)$/.test(arquivo.type)) {
      mostrarStatus("Use uma imagem JPG, PNG ou WebP.", "error");
      return;
    }
    mostrarStatus("Enviando imagem...");
    try {
      const extensao = (arquivo.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const nome = slugificar(arquivo.name.replace(/\.[^.]+$/, "")) || "imagem";
      const path = `${GITHUB.imageRoot}/${Date.now()}-${nome}.${extensao}`;
      await github(`/contents/${path}`, {
        method: "PUT",
        body: {
          message: `site: adicionar imagem ${arquivo.name}`,
          content: await arquivoBase64(arquivo),
          branch: GITHUB.branch
        }
      });
      const url = `/${path}`;
      aplicarImagemSelecionada(url);
      mostrarStatus("Imagem enviada e aplicada ao elemento selecionado.", "success");
    } catch (erro) {
      console.error(erro);
      mostrarStatus(mensagemErro(erro), "error");
    } finally {
      event.target.value = "";
    }
  }

  function aplicarImagemSelecionada(url) {
    let elemento = Vvveb.Builder.selectedEl;
    if (!elemento) {
      mostrarStatus(`Imagem enviada: ${url}`, "success");
      return;
    }
    if (elemento.tagName !== "IMG") elemento = elemento.querySelector?.("img");
    if (!elemento) {
      mostrarStatus(`Imagem enviada: ${url}. Selecione uma imagem para aplicá-la.`, "success");
      return;
    }
    elemento.setAttribute("src", url);
    try { Vvveb.Builder.selectNode(elemento); } catch {}
  }

  function abrirToken() {
    const dialog = document.getElementById("iedaTokenDialog");
    const input = document.getElementById("iedaTokenInput");
    input.value = "";
    document.getElementById("iedaRememberToken").checked = Boolean(localStorage.getItem(STORAGE_TOKEN));
    dialog?.showModal();
    setTimeout(() => input?.focus(), 50);
  }

  async function salvarToken(event) {
    event.preventDefault();
    const token = document.getElementById("iedaTokenInput").value.trim();
    const lembrar = document.getElementById("iedaRememberToken").checked;
    if (!token) return;
    try {
      await github("/contents/index.html?ref=main", { token });
      if (lembrar) {
        localStorage.setItem(STORAGE_TOKEN, token);
        sessionStorage.removeItem(SESSION_TOKEN);
      } else {
        sessionStorage.setItem(SESSION_TOKEN, token);
        localStorage.removeItem(STORAGE_TOKEN);
      }
      document.getElementById("iedaTokenDialog")?.close();
      mostrarStatus("GitHub conectado.", "success");
      await carregarListaPaginas();
    } catch (erro) {
      console.error(erro);
      mostrarStatus("Não foi possível conectar com esse token.", "error");
    }
  }

  function obterToken() {
    return sessionStorage.getItem(SESSION_TOKEN) || localStorage.getItem(STORAGE_TOKEN) || "";
  }

  async function obterArquivoSeExiste(path) {
    try {
      return await github(`/contents/${path}?ref=${encodeURIComponent(GITHUB.branch)}`);
    } catch (erro) {
      if (erro.status === 404) return null;
      throw erro;
    }
  }

  async function github(path, { method = "GET", body = null, token = obterToken() } = {}) {
    if (!token) {
      const erro = new Error("TOKEN_AUSENTE");
      erro.status = 401;
      throw erro;
    }
    const resposta = await fetch(`https://api.github.com/repos/${GITHUB.repo}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!resposta.ok) {
      const erro = new Error(`GITHUB_${resposta.status}`);
      erro.status = resposta.status;
      erro.detail = await resposta.text();
      throw erro;
    }
    if (resposta.status === 204) return null;
    return resposta.json();
  }

  function mostrarStatus(texto, tipo = "") {
    const toast = document.getElementById("iedaEditorStatus");
    if (!toast) return;
    clearTimeout(state.toastTimer);
    toast.textContent = texto;
    toast.className = `ieda-status show ${tipo}`.trim();
    state.toastTimer = setTimeout(() => { toast.className = "ieda-status"; }, 3400);
  }

  function mensagemErro(erro) {
    if (erro?.status === 401 || erro?.status === 403) return "A conexão GitHub não tem permissão para salvar.";
    if (erro?.status === 409) return "A página mudou em outro lugar. Recarregue antes de tentar novamente.";
    if (erro?.status === 422) return "O GitHub recusou esta alteração. Revise os dados e tente novamente.";
    return "Não foi possível concluir a alteração agora.";
  }

  function codificarUtf8(texto) {
    const bytes = new TextEncoder().encode(texto);
    let binario = "";
    const bloco = 0x8000;
    for (let i = 0; i < bytes.length; i += bloco) binario += String.fromCharCode(...bytes.subarray(i, i + bloco));
    return btoa(binario);
  }

  function arquivoBase64(arquivo) {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(String(leitor.result).split(",")[1] || "");
      leitor.onerror = () => reject(new Error("FALHA_LEITURA_ARQUIVO"));
      leitor.readAsDataURL(arquivo);
    });
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

  function humanizarSlug(slug) {
    return String(slug || "")
      .split(/[-_]+/)
      .filter(Boolean)
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(" ") || "Página";
  }
})();
