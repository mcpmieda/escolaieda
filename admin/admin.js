import { PublicClientApplication } from "https://esm.sh/@azure/msal-browser@5.11.0";

const CONFIG = {
  clientId: "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",
  tenantId: "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",
  redirectUri: "https://escolaieda.com/",
  postLoginPath: "/admin/",
  siteId: "eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17",
  documentosAtivosListId: "7adea611-e627-4593-a0b0-cecf58744c16",
  publicacoesListName: "PUBLICACOES_SITE",
  enquetesListName: "ENQUETES_SITE",
  configuracoesListName: "CONFIGURACOES_PORTAL",
  midiasLibraryName: "MIDIAS_SITE"
};

const loginRequest = {
  scopes: ["User.Read", "Sites.ReadWrite.All"],
  prompt: "select_account"
};

const tokenRequest = {
  scopes: ["User.Read", "Sites.ReadWrite.All"]
};

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: CONFIG.clientId,
    authority: `https://login.microsoftonline.com/${CONFIG.tenantId}`,
    redirectUri: CONFIG.redirectUri
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  }
});

const estado = {
  account: null,
  token: "",
  publicacoesListId: "",
  configListId: "",
  publicacoes: []
};

const el = {
  loginView: document.getElementById("loginView"),
  restrictedView: document.getElementById("restrictedView"),
  dashboard: document.getElementById("dashboard"),
  loginStatus: document.getElementById("loginStatus"),
  btnEntrar: document.getElementById("btnEntrar"),
  btnTrocarConta: document.getElementById("btnTrocarConta"),
  btnSair: document.getElementById("btnSair"),
  usuarioAtual: document.getElementById("usuarioAtual"),
  statusSistema: document.getElementById("statusSistema"),
  tituloView: document.getElementById("tituloView"),
  btnAtualizar: document.getElementById("btnAtualizar"),
  btnProvisionar: document.getElementById("btnProvisionar"),
  logProvisionamento: document.getElementById("logProvisionamento"),
  listaPublicacoes: document.getElementById("listaPublicacoes"),
  contadorPublicacoes: document.getElementById("contadorPublicacoes"),
  formPublicacao: document.getElementById("formPublicacao"),
  btnExcluir: document.getElementById("btnExcluir"),
  btnLimpar: document.getElementById("btnLimpar"),
  btnRascunho: document.getElementById("btnRascunho"),
  campoFontePublica: document.getElementById("campoFontePublica"),
  btnSalvarFontePublica: document.getElementById("btnSalvarFontePublica")
};

await msalInstance.initialize();
inicializarEventos();
await inicializarSessao();

function inicializarEventos() {
  el.btnEntrar?.addEventListener("click", entrar);
  el.btnTrocarConta?.addEventListener("click", entrar);
  el.btnSair?.addEventListener("click", sair);
  el.btnAtualizar?.addEventListener("click", carregarDados);
  el.btnProvisionar?.addEventListener("click", provisionarSharePoint);
  el.formPublicacao?.addEventListener("submit", salvarPublicacao);
  el.btnRascunho?.addEventListener("click", salvarRascunho);
  el.btnExcluir?.addEventListener("click", excluirPublicacao);
  el.btnLimpar?.addEventListener("click", limparFormulario);
  el.btnSalvarFontePublica?.addEventListener("click", salvarFontePublica);

  document.querySelectorAll("[data-view]").forEach((botao) => {
    botao.addEventListener("click", () => abrirView(botao.dataset.view));
  });

  document.querySelectorAll("[data-view-target]").forEach((botao) => {
    botao.addEventListener("click", () => abrirView(botao.dataset.viewTarget));
  });
}

async function inicializarSessao() {
  try {
    const response = await msalInstance.handleRedirectPromise();
    if (response?.account) msalInstance.setActiveAccount(response.account);
    estado.account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0] || null;

    if (!estado.account) {
      mostrarSomente("login");
      return;
    }

    msalInstance.setActiveAccount(estado.account);
    await autenticarEValidar();
  } catch (erro) {
    console.error(erro);
    atualizarLoginStatus("Não foi possível concluir o login Microsoft. Tente novamente.");
    mostrarSomente("login");
  }
}

async function entrar() {
  sessionStorage.setItem("escolaIedaDestinoLogin", CONFIG.postLoginPath);
  await msalInstance.loginRedirect(loginRequest);
}

async function sair() {
  sessionStorage.removeItem("escolaIedaDestinoLogin");
  await msalInstance.logoutRedirect({ postLogoutRedirectUri: "https://escolaieda.com/" });
}

async function autenticarEValidar() {
  atualizarLoginStatus("Verificando autorização da Secretaria...");
  estado.token = await obterToken();
  const permitido = await verificarAcessoSecretaria();

  if (!permitido) {
    mostrarSomente("restrito");
    return;
  }

  mostrarSomente("dashboard");
  el.usuarioAtual.textContent = estado.account?.name || estado.account?.username || "Usuário autorizado";
  await carregarDados();
}

async function obterToken() {
  try {
    const resposta = await msalInstance.acquireTokenSilent({ ...tokenRequest, account: estado.account });
    return resposta.accessToken;
  } catch {
    const resposta = await msalInstance.acquireTokenRedirect(tokenRequest);
    return resposta.accessToken;
  }
}

async function verificarAcessoSecretaria() {
  const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/items?$top=1`;
  const resposta = await graph(url);
  return resposta.ok;
}

async function carregarDados() {
  if (!estado.token) return;
  el.statusSistema.textContent = "Carregando estrutura institucional...";

  try {
    const listas = await obterListas();
    const publicacoes = listas.find((lista) => lista.displayName === CONFIG.publicacoesListName);
    const configuracoes = listas.find((lista) => lista.displayName === CONFIG.configuracoesListName);
    estado.publicacoesListId = publicacoes?.id || "";
    estado.configListId = configuracoes?.id || "";

    if (estado.publicacoesListId) {
      await carregarPublicacoes();
    } else {
      estado.publicacoes = [];
      renderizarPublicacoes();
    }

    if (estado.configListId) await carregarFontePublica();

    el.statusSistema.textContent = estado.publicacoesListId
      ? "Painel pronto para uso."
      : "Execute Preparar SharePoint em Configurações para criar as listas institucionais.";
  } catch (erro) {
    console.error(erro);
    el.statusSistema.textContent = "Não foi possível carregar os dados institucionais.";
  }
}

async function obterListas() {
  const resposta = await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists?$select=id,displayName,webUrl,list`);
  if (!resposta.ok) throw new Error("Falha ao listar estruturas do SharePoint.");
  const dados = await resposta.json();
  return dados.value || [];
}

async function carregarPublicacoes() {
  const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.publicacoesListId}/items?expand=fields&$top=200`;
  const resposta = await graph(url);
  if (!resposta.ok) throw new Error("Falha ao carregar publicações.");
  const dados = await resposta.json();
  estado.publicacoes = (dados.value || []).map(normalizarPublicacao).sort(ordenarPublicacoes);
  renderizarPublicacoes();
}

function normalizarPublicacao(item) {
  const fields = item.fields || {};
  return {
    id: item.id,
    titulo: fields.Title || "",
    resumo: fields.Resumo || "",
    conteudo: fields.Conteudo || "",
    imagem: fields.Imagem || "",
    categoria: fields.Categoria || "Aviso",
    dataInicial: somenteData(fields.DataInicial),
    dataFinal: somenteData(fields.DataFinal),
    publicado: Boolean(fields.Publicado),
    destaque: Boolean(fields.Destaque),
    autor: fields.Autor || "",
    criadoEm: fields.DataCriacao || fields.Created || "",
    atualizadoEm: fields.DataAtualizacao || fields.Modified || ""
  };
}

function ordenarPublicacoes(a, b) {
  return String(b.atualizadoEm || b.criadoEm).localeCompare(String(a.atualizadoEm || a.criadoEm));
}

function renderizarPublicacoes() {
  el.contadorPublicacoes.textContent = `${estado.publicacoes.length} item${estado.publicacoes.length === 1 ? "" : "s"}`;
  el.listaPublicacoes.innerHTML = "";

  if (!estado.publicacoes.length) {
    el.listaPublicacoes.innerHTML = '<div class="publicationItem"><p>Nenhuma publicação encontrada.</p></div>';
    return;
  }

  estado.publicacoes.forEach((publicacao) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "publicationItem";
    item.innerHTML = `
      <div class="publicationTop">
        <strong>${escaparHtml(publicacao.titulo || "Sem título")}</strong>
        <span class="badge ${publicacao.publicado ? "" : "draft"}">${publicacao.publicado ? "Publicado" : "Rascunho"}</span>
      </div>
      <p>${escaparHtml(publicacao.resumo || publicacao.categoria)}</p>
    `;
    item.addEventListener("click", () => preencherFormulario(publicacao));
    el.listaPublicacoes.appendChild(item);
  });
}

function preencherFormulario(publicacao) {
  campo("itemId").value = publicacao.id;
  campo("campoTitulo").value = publicacao.titulo;
  campo("campoResumo").value = publicacao.resumo;
  campo("campoConteudo").value = publicacao.conteudo;
  campo("campoCategoria").value = publicacao.categoria;
  campo("campoImagem").value = publicacao.imagem;
  campo("campoDataInicial").value = publicacao.dataInicial;
  campo("campoDataFinal").value = publicacao.dataFinal;
  campo("campoPublicado").checked = publicacao.publicado;
  campo("campoDestaque").checked = publicacao.destaque;
  el.btnExcluir.disabled = false;
}

async function salvarPublicacao(event) {
  event.preventDefault();
  await persistirPublicacao(campo("campoPublicado").checked);
}

async function salvarRascunho() {
  await persistirPublicacao(false);
}

async function persistirPublicacao(publicado) {
  if (!estado.publicacoesListId) {
    el.statusSistema.textContent = "Crie a estrutura SharePoint antes de salvar publicações.";
    return;
  }

  const id = campo("itemId").value;
  const agora = new Date().toISOString();
  const fields = {
    Title: campo("campoTitulo").value.trim(),
    Resumo: campo("campoResumo").value.trim(),
    Conteudo: campo("campoConteudo").value.trim(),
    Imagem: campo("campoImagem").value.trim(),
    Categoria: campo("campoCategoria").value,
    DataInicial: dataOuNull(campo("campoDataInicial").value),
    DataFinal: dataOuNull(campo("campoDataFinal").value),
    Publicado: Boolean(publicado),
    Destaque: campo("campoDestaque").checked,
    Autor: estado.account?.name || estado.account?.username || "",
    DataAtualizacao: agora
  };

  let resposta;
  if (id) {
    resposta = await graph(
      `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.publicacoesListId}/items/${id}/fields`,
      { method: "PATCH", body: JSON.stringify(fields) }
    );
  } else {
    fields.DataCriacao = agora;
    resposta = await graph(
      `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.publicacoesListId}/items`,
      { method: "POST", body: JSON.stringify({ fields }) }
    );
  }

  if (!resposta.ok) {
    el.statusSistema.textContent = "Não foi possível salvar a publicação.";
    return;
  }

  limparFormulario();
  await carregarPublicacoes();
  el.statusSistema.textContent = publicado ? "Publicação salva e publicada." : "Rascunho salvo.";
}

async function excluirPublicacao() {
  const id = campo("itemId").value;
  if (!id || !confirm("Excluir esta publicação?")) return;

  const resposta = await graph(
    `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.publicacoesListId}/items/${id}`,
    { method: "DELETE" }
  );

  if (!resposta.ok) {
    el.statusSistema.textContent = "Não foi possível excluir a publicação.";
    return;
  }

  limparFormulario();
  await carregarPublicacoes();
  el.statusSistema.textContent = "Publicação excluída.";
}

function limparFormulario() {
  el.formPublicacao.reset();
  campo("itemId").value = "";
  el.btnExcluir.disabled = true;
}

async function provisionarSharePoint() {
  el.logProvisionamento.textContent = "Iniciando provisionamento...\n";
  const listas = await obterListas();

  await garantirLista(listas, CONFIG.publicacoesListName, "genericList", [
    colunaTexto("Resumo"),
    colunaTextoMultilinha("Conteudo"),
    colunaTexto("Imagem"),
    colunaTexto("Categoria"),
    colunaData("DataInicial"),
    colunaData("DataFinal"),
    colunaBoolean("Publicado"),
    colunaBoolean("Destaque"),
    colunaTexto("Autor"),
    colunaDataHora("DataCriacao"),
    colunaDataHora("DataAtualizacao")
  ]);

  await garantirLista(listas, CONFIG.enquetesListName, "genericList", [
    colunaTexto("Pergunta"),
    colunaTextoMultilinha("Opcoes"),
    colunaBoolean("Publicado"),
    colunaData("DataInicial"),
    colunaData("DataFinal")
  ]);

  await garantirLista(listas, CONFIG.configuracoesListName, "genericList", [
    colunaTexto("Chave"),
    colunaTextoMultilinha("Valor")
  ]);

  await garantirLista(listas, CONFIG.midiasLibraryName, "documentLibrary", []);
  await carregarDados();
  registrarLog("Provisionamento concluído.");
}

async function garantirLista(listas, nome, template, columns) {
  if (listas.some((lista) => lista.displayName === nome)) {
    registrarLog(`${nome}: já existe.`);
    return;
  }

  const resposta = await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists`, {
    method: "POST",
    body: JSON.stringify({
      displayName: nome,
      list: { template },
      columns
    })
  });

  registrarLog(`${nome}: ${resposta.ok ? "criada" : "falha ao criar"}.`);
  if (!resposta.ok) registrarLog(await resposta.text());
}

async function carregarFontePublica() {
  const resposta = await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.configListId}/items?expand=fields&$top=200`);
  if (!resposta.ok) return;
  const dados = await resposta.json();
  const item = (dados.value || []).map((i) => ({ id: i.id, fields: i.fields || {} }))
    .find((i) => i.fields.Chave === "fontePublicaPublicacoes");
  el.campoFontePublica.value = item?.fields?.Valor || "";
}

async function salvarFontePublica() {
  if (!estado.configListId) {
    el.statusSistema.textContent = "Crie a lista de configurações antes de salvar.";
    return;
  }

  const chave = "fontePublicaPublicacoes";
  const valor = el.campoFontePublica.value.trim();
  const respostaLista = await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.configListId}/items?expand=fields&$top=200`);
  const dados = respostaLista.ok ? await respostaLista.json() : { value: [] };
  const item = (dados.value || []).find((i) => i.fields?.Chave === chave);
  const body = { Chave: chave, Valor: valor };

  const resposta = item
    ? await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.configListId}/items/${item.id}/fields`, { method: "PATCH", body: JSON.stringify(body) })
    : await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.configListId}/items`, { method: "POST", body: JSON.stringify({ fields: body }) });

  el.statusSistema.textContent = resposta.ok ? "Fonte pública salva." : "Não foi possível salvar a fonte pública.";
}

function abrirView(nome) {
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.getElementById(`view-${nome}`)?.classList.add("active");
  document.querySelectorAll(".navItem").forEach((botao) => botao.classList.toggle("active", botao.dataset.view === nome));

  const titulos = {
    inicio: "Painel Administrativo",
    publicacoes: "Publicações do Site",
    ponto: "Livro de Ponto",
    configuracoes: "Configurações Internas"
  };
  el.tituloView.textContent = titulos[nome] || "Painel Administrativo";
}

async function graph(url, opcoes = {}) {
  return fetch(url, {
    ...opcoes,
    headers: {
      Authorization: `Bearer ${estado.token}`,
      "Content-Type": "application/json",
      ...(opcoes.headers || {})
    }
  });
}

function mostrarSomente(area) {
  el.loginView.classList.toggle("hidden", area !== "login");
  el.restrictedView.classList.toggle("hidden", area !== "restrito");
  el.dashboard.classList.toggle("hidden", area !== "dashboard");
}

function atualizarLoginStatus(texto) {
  if (el.loginStatus) el.loginStatus.textContent = texto;
}

function registrarLog(texto) {
  el.logProvisionamento.textContent += `${texto}\n`;
}

function campo(id) {
  return document.getElementById(id);
}

function dataOuNull(valor) {
  return valor ? `${valor}T00:00:00Z` : null;
}

function somenteData(valor) {
  return valor ? String(valor).slice(0, 10) : "";
}

function colunaTexto(name) {
  return { name, text: {} };
}

function colunaTextoMultilinha(name) {
  return { name, text: { allowMultipleLines: true } };
}

function colunaBoolean(name) {
  return { name, boolean: {} };
}

function colunaData(name) {
  return { name, dateTime: { displayAs: "default" } };
}

function colunaDataHora(name) {
  return { name, dateTime: { displayAs: "default" } };
}

function escaparHtml(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
