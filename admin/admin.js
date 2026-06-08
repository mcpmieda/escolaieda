import { PublicClientApplication } from "https://esm.sh/@azure/msal-browser@5.11.0";

const CONFIG = {
  clientId: "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",
  tenantId: "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",
  redirectUri: `${window.location.origin}/admin/`,
  postLoginPath: "/admin/",
  siteId: "eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17",
  documentosAtivosListId: "7adea611-e627-4593-a0b0-cecf58744c16",
  publicacoesListName: "PUBLICACOES_SITE",
  avisosListName: "AVISOS_SITE",
  bannersListName: "BANNERS_SITE",
  destaquesListName: "DESTAQUES_SITE",
  enquetesListName: "ENQUETES_SITE",
  configuracoesListName: "CONFIGURACOES_PORTAL",
  preferenciasListName: "PREFERENCIAS_USUARIO",
  servicosListName: "SERVICOS_PAINEL",
  logsListName: "LOGS_PORTAL",
  midiasLibraryName: "MIDIAS_SITE"
};

const FONTE_PUBLICA_PADRAO = "/site-data/publicacoes-publicas.json";
const CAMINHO_FONTE_PUBLICA = "site-data/publicacoes-publicas.json";
const STORAGE_GITHUB_REPO = "escolaIedaGithubRepo";
const STORAGE_GITHUB_BRANCH = "escolaIedaGithubBranch";
const STORAGE_GITHUB_TOKEN = "escolaIedaGithubToken";
const STORAGE_ULTIMA_ABA = "escolaIedaUltimaAba";
const STORAGE_FILTROS = "escolaIedaFiltrosPublicacoes";
const STORAGE_MIDIAS = "escolaIedaMidias";
const CMS_VERSAO = 1;

const HOME_PADRAO = {
  titulo: "Escola Municipal Professora Iêda Alves de Oliveira MCPM",
  subtitulo: "Educação, compromisso e formação cidadã em Medeiros Neto - Bahia.",
  missao: "Nossa missão é contribuir para uma educação de qualidade, fortalecendo valores, conhecimento e responsabilidade social em cada etapa da formação do estudante.",
  infoTexto: "Um espaço institucional pensado para centralizar conteúdos relevantes da escola.",
  corDestaque: "#003366",
  mostrarSobre: true,
  mostrarNumeros: true,
  mostrarInformacoes: true,
  mostrarContato: true,
  mostrarBanners: true,
  mostrarAvisos: true
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
  logsListId: "",
  publicacoes: [],
  filtros: carregarJsonLocal(STORAGE_FILTROS, {
    busca: "",
    status: "todos",
    local: "todos",
    ordenacao: "atualizado"
  }),
  home: { ...HOME_PADRAO },
  midias: carregarJsonLocal(STORAGE_MIDIAS, []),
  sincronizando: false
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
  resumoFiltros: document.getElementById("resumoFiltros"),
  formPublicacao: document.getElementById("formPublicacao"),
  tituloEditorPublicacao: document.getElementById("tituloEditorPublicacao"),
  statusEditorPublicacao: document.getElementById("statusEditorPublicacao"),
  previaPublicacao: document.getElementById("previaPublicacao"),
  btnNovaPublicacao: document.getElementById("btnNovaPublicacao"),
  btnSincronizarPublicacoes: document.getElementById("btnSincronizarPublicacoes"),
  btnExcluir: document.getElementById("btnExcluir"),
  btnLimpar: document.getElementById("btnLimpar"),
  btnRascunho: document.getElementById("btnRascunho"),
  btnDespublicar: document.getElementById("btnDespublicar"),
  filtroBusca: document.getElementById("filtroBusca"),
  filtroStatus: document.getElementById("filtroStatus"),
  filtroLocal: document.getElementById("filtroLocal"),
  filtroOrdenacao: document.getElementById("filtroOrdenacao"),
  formHome: document.getElementById("formHome"),
  btnPreviaHome: document.getElementById("btnPreviaHome"),
  midiaUrl: document.getElementById("midiaUrl"),
  midiaAlt: document.getElementById("midiaAlt"),
  btnUsarMidia: document.getElementById("btnUsarMidia"),
  listaMidias: document.getElementById("listaMidias"),
  campoFontePublica: document.getElementById("campoFontePublica"),
  campoGithubToken: document.getElementById("campoGithubToken"),
  campoGithubRepo: document.getElementById("campoGithubRepo"),
  campoGithubBranch: document.getElementById("campoGithubBranch"),
  btnSalvarFontePublica: document.getElementById("btnSalvarFontePublica"),
  btnSincronizarFontePublica: document.getElementById("btnSincronizarFontePublica"),
  statusFontePublica: document.getElementById("statusFontePublica")
};

await msalInstance.initialize();
carregarConfiguracaoGithubLocal();
carregarFiltrosNaTela();
inicializarEventos();
renderizarMidias();
atualizarPreviaPublicacao();
await inicializarSessao();

function inicializarEventos() {
  el.btnEntrar?.addEventListener("click", entrar);
  el.btnTrocarConta?.addEventListener("click", entrar);
  el.btnSair?.addEventListener("click", sair);
  el.btnAtualizar?.addEventListener("click", carregarDados);
  el.btnProvisionar?.addEventListener("click", provisionarSharePoint);
  el.formPublicacao?.addEventListener("submit", salvarPublicacao);
  el.btnNovaPublicacao?.addEventListener("click", limparFormulario);
  el.btnSincronizarPublicacoes?.addEventListener("click", () => sincronizarFontePublica());
  el.btnRascunho?.addEventListener("click", salvarRascunho);
  el.btnDespublicar?.addEventListener("click", despublicarPublicacao);
  el.btnExcluir?.addEventListener("click", excluirPublicacao);
  el.btnLimpar?.addEventListener("click", limparFormulario);
  el.btnSalvarFontePublica?.addEventListener("click", salvarFontePublica);
  el.btnSincronizarFontePublica?.addEventListener("click", () => sincronizarFontePublica());
  el.formHome?.addEventListener("submit", salvarHome);
  el.btnPreviaHome?.addEventListener("click", () => aplicarHomeNaTela(lerHomeDoFormulario()));
  el.btnUsarMidia?.addEventListener("click", usarMidiaNoEditor);
  el.campoGithubToken?.addEventListener("input", salvarConfiguracaoGithubLocal);
  el.campoGithubRepo?.addEventListener("input", salvarConfiguracaoGithubLocal);
  el.campoGithubBranch?.addEventListener("input", salvarConfiguracaoGithubLocal);

  ["filtroBusca", "filtroStatus", "filtroLocal", "filtroOrdenacao"].forEach((id) => {
    el[id]?.addEventListener("input", atualizarFiltros);
    el[id]?.addEventListener("change", atualizarFiltros);
  });

  [
    "campoTitulo",
    "campoResumo",
    "campoConteudo",
    "campoCategoria",
    "campoTipo",
    "campoLocal",
    "campoImagem",
    "campoImagemAlt",
    "campoIcone",
    "campoLink",
    "campoBotao",
    "campoDataInicial",
    "campoDataFinal",
    "campoOrdem",
    "campoEstilo",
    "campoPublicado",
    "campoDestaque",
    "campoFixado"
  ].forEach((id) => campo(id)?.addEventListener("input", atualizarPreviaPublicacao));

  document.querySelectorAll("[data-view]").forEach((botao) => {
    botao.addEventListener("click", () => abrirView(botao.dataset.view));
  });

  document.querySelectorAll("[data-view-target]").forEach((botao) => {
    botao.addEventListener("click", () => abrirView(botao.dataset.viewTarget));
  });

  document.querySelectorAll("[data-cms-tab]").forEach((botao) => {
    botao.addEventListener("click", () => abrirAbaCms(botao.dataset.cmsTab));
  });

  const ultimaAba = localStorage.getItem(STORAGE_ULTIMA_ABA);
  if (ultimaAba) abrirAbaCms(ultimaAba);
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
  atualizarLoginStatus("Abrindo login Microsoft...");
  await msalInstance.loginRedirect(loginRequest);
}

async function sair() {
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
    await msalInstance.acquireTokenRedirect(tokenRequest);
    throw new Error("Redirecionando para concluir autorização Microsoft.");
  }
}

async function verificarAcessoSecretaria() {
  const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/items?$top=1`;
  const resposta = await graph(url);
  return resposta.ok;
}

async function carregarDados() {
  if (!estado.token) return;
  el.statusSistema.textContent = "Carregando painel...";

  try {
    const listas = await obterListas();
    const publicacoes = listas.find((lista) => lista.displayName === CONFIG.publicacoesListName);
    const configuracoes = listas.find((lista) => lista.displayName === CONFIG.configuracoesListName);
    const logs = listas.find((lista) => lista.displayName === CONFIG.logsListName);
    estado.publicacoesListId = publicacoes?.id || "";
    estado.configListId = configuracoes?.id || "";
    estado.logsListId = logs?.id || "";

    if (estado.configListId) await carregarConfiguracoes();

    if (estado.publicacoesListId) {
      await carregarPublicacoes();
    } else {
      estado.publicacoes = [];
      renderizarPublicacoes();
    }

    el.statusSistema.textContent = estado.publicacoesListId
      ? "Painel pronto para publicar no site."
      : "Estrutura de publicações não encontrada. Abra Configurações para manutenção.";
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
  renderizarMidias();
}

function normalizarPublicacao(item) {
  const fields = item.fields || {};
  const conteudo = extrairConteudo(fields.Conteudo || "");
  return {
    id: item.id,
    titulo: fields.Title || "",
    resumo: fields.Resumo || "",
    conteudo: conteudo.texto,
    brutoConteudo: fields.Conteudo || "",
    imagem: fields.Imagem || "",
    categoria: fields.Categoria || "Aviso",
    dataInicial: somenteData(fields.DataInicial),
    dataFinal: somenteData(fields.DataFinal),
    publicado: Boolean(fields.Publicado),
    destaque: Boolean(fields.Destaque),
    autor: fields.Autor || "",
    criadoEm: fields.DataCriacao || fields.Created || "",
    atualizadoEm: fields.DataAtualizacao || fields.Modified || "",
    meta: conteudo.meta
  };
}

function extrairConteudo(valor) {
  const texto = String(valor || "");
  try {
    const json = JSON.parse(texto);
    if (json && json.cmsVersao && typeof json.texto === "string") {
      return { texto: json.texto, meta: normalizarMeta(json.meta || {}) };
    }
  } catch {
    return { texto, meta: normalizarMeta({}) };
  }
  return { texto, meta: normalizarMeta({}) };
}

function normalizarMeta(meta) {
  return {
    tipo: meta.tipo || "card",
    local: meta.local || "informacoes",
    imagemAlt: meta.imagemAlt || "",
    link: meta.link || "",
    botao: meta.botao || "",
    fixado: Boolean(meta.fixado),
    ordem: Number.isFinite(Number(meta.ordem)) ? Number(meta.ordem) : 0,
    estilo: meta.estilo || "padrao",
    icone: meta.icone || ""
  };
}

function montarConteudoEstruturado(texto, meta) {
  return JSON.stringify({
    cmsVersao: CMS_VERSAO,
    texto,
    meta: normalizarMeta(meta)
  });
}

function ordenarPublicacoes(a, b) {
  const ordemA = Number(a.meta?.ordem || 0);
  const ordemB = Number(b.meta?.ordem || 0);
  if (a.meta?.fixado !== b.meta?.fixado) return a.meta?.fixado ? -1 : 1;
  if (ordemA !== ordemB) return ordemA - ordemB;
  return String(b.atualizadoEm || b.criadoEm).localeCompare(String(a.atualizadoEm || a.criadoEm));
}

function obterStatusPublicacao(publicacao, agora = new Date()) {
  if (!publicacao.publicado) return "rascunho";
  const inicial = publicacao.dataInicial ? new Date(`${publicacao.dataInicial}T00:00:00`) : null;
  const final = publicacao.dataFinal ? new Date(`${publicacao.dataFinal}T23:59:59`) : null;
  if (inicial && inicial > agora) return "agendado";
  if (final && final < agora) return "expirado";
  return "publicado";
}

function publicacaoVisivel(publicacao, agora = new Date()) {
  return obterStatusPublicacao(publicacao, agora) === "publicado";
}

function renderizarPublicacoes() {
  const lista = filtrarPublicacoes();
  el.contadorPublicacoes.textContent = `${estado.publicacoes.length} item${estado.publicacoes.length === 1 ? "" : "s"}`;
  el.resumoFiltros.textContent = `${lista.length} exibido${lista.length === 1 ? "" : "s"}`;
  el.listaPublicacoes.innerHTML = "";

  if (!lista.length) {
    el.listaPublicacoes.innerHTML = '<div class="publicationItem"><p>Nenhuma publicação encontrada com estes filtros.</p></div>';
    return;
  }

  lista.forEach((publicacao) => {
    const item = document.createElement("article");
    const status = obterStatusPublicacao(publicacao);
    item.className = "publicationItem";
    item.innerHTML = `
      <div class="publicationTop">
        <strong>${escaparHtml(publicacao.titulo || "Sem título")}</strong>
        <div class="publicationMeta">
          <span class="badge ${classeStatus(status)}">${rotuloStatus(status)}</span>
          ${publicacao.destaque ? '<span class="badge featured">Destaque</span>' : ""}
        </div>
      </div>
      <p>${escaparHtml(publicacao.resumo || publicacao.categoria || "Sem resumo")}</p>
      <div class="publicationMeta">
        <small>${escaparHtml(publicacao.categoria)}</small>
        <small>${escaparHtml(rotuloLocal(publicacao.meta.local))}</small>
        <small>${publicacao.meta.fixado ? "Fixado" : "Ordem " + Number(publicacao.meta.ordem || 0)}</small>
      </div>
      <div class="itemActions">
        <button type="button" data-acao="editar" data-id="${publicacao.id}">Editar</button>
        <button type="button" data-acao="duplicar" data-id="${publicacao.id}">Duplicar</button>
        <button type="button" data-acao="visualizar" data-id="${publicacao.id}">Visualizar</button>
        <button type="button" data-acao="despublicar" data-id="${publicacao.id}">Despublicar</button>
        <button class="dangerMini" type="button" data-acao="excluir" data-id="${publicacao.id}">Excluir</button>
      </div>
    `;
    item.addEventListener("click", tratarAcaoPublicacao);
    el.listaPublicacoes.appendChild(item);
  });
}

function filtrarPublicacoes() {
  const termo = normalizarTexto(estado.filtros.busca);
  const lista = estado.publicacoes.filter((publicacao) => {
    const texto = normalizarTexto(`${publicacao.titulo} ${publicacao.resumo} ${publicacao.conteudo}`);
    const status = obterStatusPublicacao(publicacao);
    const local = publicacao.meta?.local || "informacoes";
    return (!termo || texto.includes(termo))
      && (estado.filtros.status === "todos" || estado.filtros.status === status)
      && (estado.filtros.local === "todos" || estado.filtros.local === local);
  });

  return lista.sort((a, b) => {
    if (estado.filtros.ordenacao === "status") {
      return obterStatusPublicacao(a).localeCompare(obterStatusPublicacao(b)) || ordenarPublicacoes(a, b);
    }
    if (estado.filtros.ordenacao === "destaque") {
      if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
    }
    if (estado.filtros.ordenacao === "ordem") {
      return Number(a.meta?.ordem || 0) - Number(b.meta?.ordem || 0) || ordenarPublicacoes(a, b);
    }
    return ordenarPublicacoes(a, b);
  });
}

async function tratarAcaoPublicacao(event) {
  const botao = event.target.closest("button[data-acao]");
  if (!botao) return;
  const publicacao = estado.publicacoes.find((item) => item.id === botao.dataset.id);
  if (!publicacao) return;

  const acoes = {
    editar: () => preencherFormulario(publicacao),
    duplicar: () => duplicarPublicacao(publicacao),
    visualizar: () => abrirPrevia(publicacao),
    despublicar: () => despublicarPublicacao(publicacao.id),
    excluir: () => excluirPublicacao(publicacao.id)
  };
  await acoes[botao.dataset.acao]?.();
}

function preencherFormulario(publicacao) {
  campo("itemId").value = publicacao.id;
  campo("campoTitulo").value = publicacao.titulo;
  campo("campoResumo").value = publicacao.resumo;
  campo("campoConteudo").value = publicacao.conteudo;
  campo("campoCategoria").value = publicacao.categoria;
  campo("campoTipo").value = publicacao.meta.tipo;
  campo("campoLocal").value = publicacao.meta.local;
  campo("campoImagem").value = publicacao.imagem;
  campo("campoImagemAlt").value = publicacao.meta.imagemAlt;
  campo("campoIcone").value = publicacao.meta.icone;
  campo("campoLink").value = publicacao.meta.link;
  campo("campoBotao").value = publicacao.meta.botao;
  campo("campoDataInicial").value = publicacao.dataInicial;
  campo("campoDataFinal").value = publicacao.dataFinal;
  campo("campoOrdem").value = publicacao.meta.ordem || "";
  campo("campoEstilo").value = publicacao.meta.estilo;
  campo("campoPublicado").checked = publicacao.publicado;
  campo("campoDestaque").checked = publicacao.destaque;
  campo("campoFixado").checked = publicacao.meta.fixado;
  el.btnExcluir.disabled = false;
  el.btnDespublicar.disabled = false;
  el.tituloEditorPublicacao.textContent = "Editar publicação";
  el.statusEditorPublicacao.textContent = rotuloStatus(obterStatusPublicacao(publicacao));
  atualizarPreviaPublicacao();
}

function limparFormulario() {
  el.formPublicacao.reset();
  campo("itemId").value = "";
  campo("campoLocal").value = "informacoes";
  campo("campoTipo").value = "card";
  campo("campoEstilo").value = "padrao";
  campo("campoCategoria").value = "Aviso";
  el.btnExcluir.disabled = true;
  el.btnDespublicar.disabled = true;
  el.tituloEditorPublicacao.textContent = "Nova publicação";
  el.statusEditorPublicacao.textContent = "Rascunho";
  atualizarPreviaPublicacao();
}

async function salvarPublicacao(event) {
  event.preventDefault();
  await persistirPublicacao(true);
}

async function salvarRascunho() {
  await persistirPublicacao(false);
}

async function persistirPublicacao(publicado) {
  if (!estado.publicacoesListId) {
    el.statusSistema.textContent = "A lista de publicações não foi encontrada.";
    return;
  }

  const id = campo("itemId").value;
  const agora = new Date().toISOString();
  const meta = lerMetaFormulario();
  const fields = {
    Title: campo("campoTitulo").value.trim(),
    Resumo: campo("campoResumo").value.trim(),
    Conteudo: montarConteudoEstruturado(campo("campoConteudo").value.trim(), meta),
    Imagem: campo("campoImagem").value.trim(),
    Categoria: campo("campoCategoria").value,
    DataInicial: dataOuNull(campo("campoDataInicial").value),
    DataFinal: dataOuNull(campo("campoDataFinal").value),
    Publicado: Boolean(publicado),
    Destaque: campo("campoDestaque").checked,
    Autor: estado.account?.name || estado.account?.username || "",
    DataAtualizacao: agora
  };

  if (!fields.Title) {
    el.statusSistema.textContent = "Informe um título antes de salvar.";
    return;
  }

  const resposta = id
    ? await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.publicacoesListId}/items/${id}/fields`, { method: "PATCH", body: JSON.stringify(fields) })
    : await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.publicacoesListId}/items`, { method: "POST", body: JSON.stringify({ fields: { ...fields, DataCriacao: agora } }) });

  if (!resposta.ok) {
    el.statusSistema.textContent = "Não foi possível salvar a publicação.";
    return;
  }

  await registrarLogPortal(id ? "editou publicação" : "criou publicação", fields.Title);
  limparFormulario();
  await carregarPublicacoes();
  const sincronizado = await sincronizarFontePublica({ silencioso: true });
  el.statusSistema.textContent = sincronizado
    ? (publicado ? "Publicação salva e enviada para o site." : "Rascunho salvo e removido da fonte pública.")
    : "Publicação salva no SharePoint. Sincronize a fonte pública quando o token estiver configurado.";
}

function lerMetaFormulario() {
  return normalizarMeta({
    tipo: campo("campoTipo").value,
    local: campo("campoLocal").value,
    imagemAlt: campo("campoImagemAlt").value.trim(),
    link: campo("campoLink").value.trim(),
    botao: campo("campoBotao").value.trim(),
    fixado: campo("campoFixado").checked,
    ordem: campo("campoOrdem").value,
    estilo: campo("campoEstilo").value,
    icone: campo("campoIcone").value.trim()
  });
}

async function duplicarPublicacao(publicacao) {
  preencherFormulario(publicacao);
  campo("itemId").value = "";
  campo("campoTitulo").value = `${publicacao.titulo} - cópia`;
  campo("campoPublicado").checked = false;
  el.tituloEditorPublicacao.textContent = "Duplicar publicação";
  el.statusEditorPublicacao.textContent = "Rascunho";
  el.btnExcluir.disabled = true;
  el.btnDespublicar.disabled = true;
  atualizarPreviaPublicacao();
}

async function despublicarPublicacao(idInformado) {
  const id = typeof idInformado === "string" ? idInformado : campo("itemId").value;
  if (!id) return;
  const publicacao = estado.publicacoes.find((item) => item.id === id);
  const resposta = await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.publicacoesListId}/items/${id}/fields`, {
    method: "PATCH",
    body: JSON.stringify({ Publicado: false, DataAtualizacao: new Date().toISOString() })
  });
  if (!resposta.ok) {
    el.statusSistema.textContent = "Não foi possível despublicar.";
    return;
  }
  await registrarLogPortal("despublicou publicação", publicacao?.titulo || id);
  limparFormulario();
  await carregarPublicacoes();
  const sincronizado = await sincronizarFontePublica({ silencioso: true });
  el.statusSistema.textContent = sincronizado
    ? "Publicação despublicada e removida do site."
    : "Publicação despublicada no SharePoint. Sincronize a fonte pública quando possível.";
}

async function excluirPublicacao(idInformado) {
  const id = typeof idInformado === "string" ? idInformado : campo("itemId").value;
  if (!id || !confirm("Excluir esta publicação? Ela sairá do site na próxima sincronização.")) return;
  const publicacao = estado.publicacoes.find((item) => item.id === id);
  const resposta = await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.publicacoesListId}/items/${id}`, { method: "DELETE" });

  if (!resposta.ok) {
    el.statusSistema.textContent = "Não foi possível excluir a publicação.";
    return;
  }

  await registrarLogPortal("excluiu publicação", publicacao?.titulo || id);
  limparFormulario();
  await carregarPublicacoes();
  const sincronizado = await sincronizarFontePublica({ silencioso: true });
  el.statusSistema.textContent = sincronizado
    ? "Publicação excluída e removida do site."
    : "Publicação excluída no SharePoint. Sincronize a fonte pública quando possível.";
}

function abrirPrevia(publicacao) {
  preencherFormulario(publicacao);
  el.previaPublicacao.scrollIntoView({ behavior: "smooth", block: "center" });
}

function atualizarPreviaPublicacao() {
  if (!el.previaPublicacao) return;
  const titulo = campo("campoTitulo")?.value || "Título da publicação";
  const resumo = campo("campoResumo")?.value || "Resumo curto da publicação.";
  const imagem = campo("campoImagem")?.value || "";
  const meta = lerMetaFormularioSeguro();
  el.previaPublicacao.innerHTML = criarHtmlCardPublico({
    titulo,
    resumo,
    conteudo: campo("campoConteudo")?.value || "",
    imagem,
    categoria: campo("campoCategoria")?.value || "Aviso",
    meta
  });
}

function lerMetaFormularioSeguro() {
  if (!campo("campoTipo")) return normalizarMeta({});
  return lerMetaFormulario();
}

async function carregarConfiguracoes() {
  const resposta = await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.configListId}/items?expand=fields&$top=200`);
  if (!resposta.ok) return;
  const dados = await resposta.json();
  const mapa = new Map((dados.value || []).map((item) => [item.fields?.Chave, item.fields?.Valor]));
  el.campoFontePublica.value = mapa.get("fontePublicaPublicacoes") || FONTE_PUBLICA_PADRAO;
  estado.home = { ...HOME_PADRAO, ...carregarJsonDeTexto(mapa.get("homeConfig"), {}) };
  preencherHomeFormulario();
}

function preencherHomeFormulario() {
  campo("homeTitulo").value = estado.home.titulo;
  campo("homeSubtitulo").value = estado.home.subtitulo;
  campo("homeMissao").value = estado.home.missao;
  campo("homeInfoTexto").value = estado.home.infoTexto;
  campo("homeCorDestaque").value = estado.home.corDestaque || HOME_PADRAO.corDestaque;
  campo("homeMostrarSobre").checked = estado.home.mostrarSobre !== false;
  campo("homeMostrarNumeros").checked = estado.home.mostrarNumeros !== false;
  campo("homeMostrarInformacoes").checked = estado.home.mostrarInformacoes !== false;
  campo("homeMostrarContato").checked = estado.home.mostrarContato !== false;
  campo("homeMostrarBanners").checked = estado.home.mostrarBanners !== false;
  campo("homeMostrarAvisos").checked = estado.home.mostrarAvisos !== false;
}

function lerHomeDoFormulario() {
  return {
    titulo: campo("homeTitulo").value.trim() || HOME_PADRAO.titulo,
    subtitulo: campo("homeSubtitulo").value.trim() || HOME_PADRAO.subtitulo,
    missao: campo("homeMissao").value.trim() || HOME_PADRAO.missao,
    infoTexto: campo("homeInfoTexto").value.trim() || HOME_PADRAO.infoTexto,
    corDestaque: campo("homeCorDestaque").value || HOME_PADRAO.corDestaque,
    mostrarSobre: campo("homeMostrarSobre").checked,
    mostrarNumeros: campo("homeMostrarNumeros").checked,
    mostrarInformacoes: campo("homeMostrarInformacoes").checked,
    mostrarContato: campo("homeMostrarContato").checked,
    mostrarBanners: campo("homeMostrarBanners").checked,
    mostrarAvisos: campo("homeMostrarAvisos").checked
  };
}

async function salvarHome(event) {
  event.preventDefault();
  if (!estado.configListId) {
    el.statusSistema.textContent = "Lista de configurações não encontrada.";
    return;
  }
  estado.home = lerHomeDoFormulario();
  const salvo = await salvarConfiguracaoValor("homeConfig", JSON.stringify(estado.home));
  await registrarLogPortal("editou página inicial", "Configuração da home");
  const sincronizado = await sincronizarFontePublica({ silencioso: true });
  el.statusSistema.textContent = salvo && sincronizado
    ? "Editor da home salvo e enviado para o site."
    : "Editor da home salvo. Sincronize a fonte pública quando possível.";
}

function aplicarHomeNaTela(home) {
  el.statusSistema.textContent = `Prévia local: ${home.titulo}`;
}

async function salvarFontePublica() {
  if (!estado.configListId) {
    el.statusSistema.textContent = "Lista de configurações não encontrada.";
    return;
  }

  const valor = el.campoFontePublica.value.trim() || FONTE_PUBLICA_PADRAO;
  const resposta = await salvarConfiguracaoValor("fontePublicaPublicacoes", valor);
  el.statusSistema.textContent = resposta ? "Fonte pública salva." : "Não foi possível salvar a fonte pública.";
}

async function salvarConfiguracaoValor(chave, valor) {
  if (!estado.configListId) return false;

  const respostaLista = await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.configListId}/items?expand=fields&$top=200`);
  const dados = respostaLista.ok ? await respostaLista.json() : { value: [] };
  const item = (dados.value || []).find((i) => i.fields?.Chave === chave);
  const body = { Chave: chave, Valor: valor };

  const resposta = item
    ? await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.configListId}/items/${item.id}/fields`, { method: "PATCH", body: JSON.stringify(body) })
    : await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.configListId}/items`, { method: "POST", body: JSON.stringify({ fields: body }) });

  return resposta.ok;
}

async function sincronizarFontePublica(opcoes = {}) {
  if (estado.sincronizando || !estado.publicacoesListId) return false;
  const token = el.campoGithubToken?.value.trim();
  const repo = el.campoGithubRepo?.value.trim() || "mcpmieda/escolaieda";
  const branch = el.campoGithubBranch?.value.trim() || "main";

  if (!token) {
    definirStatusFontePublica("Token GitHub não configurado. O conteúdo foi salvo no SharePoint, mas o site público não foi atualizado.", opcoes.silencioso);
    return false;
  }

  estado.sincronizando = true;
  el.btnSincronizarPublicacoes.disabled = true;
  el.btnSincronizarFontePublica.disabled = true;
  definirStatusFontePublica("Sincronizando fonte pública...", opcoes.silencioso);
  try {
    await carregarPublicacoes();
    const fonte = gerarFontePublica();
    const conteudo = `${JSON.stringify(fonte, null, 2)}\n`;
    await publicarArquivoGithub({ token, repo, branch, conteudo });
    await registrarLogPortal("sincronizou fonte pública", CAMINHO_FONTE_PUBLICA);
    definirStatusFontePublica(`Sincronização concluída. ${fonte.publicacoes.length} publicação(ões) visível(eis) no JSON público.`, false);
    return true;
  } catch (erro) {
    console.error(erro);
    definirStatusFontePublica(`Erro ao atualizar GitHub: ${erro.message || "confira o token e tente novamente."}`, opcoes.silencioso);
    return false;
  } finally {
    estado.sincronizando = false;
    el.btnSincronizarPublicacoes.disabled = false;
    el.btnSincronizarFontePublica.disabled = false;
  }
}

function gerarFontePublica() {
  const agora = new Date();
  const publicacoes = estado.publicacoes
    .filter((publicacao) => publicacaoVisivel(publicacao, agora))
    .sort(ordenarPublicacoes)
    .map((publicacao) => ({
      id: publicacao.id,
      titulo: publicacao.titulo,
      resumo: publicacao.resumo,
      conteudo: publicacao.conteudo,
      imagem: publicacao.imagem,
      categoria: publicacao.categoria,
      publicado: true,
      destaque: publicacao.destaque === true,
      dataInicial: publicacao.dataInicial || null,
      dataFinal: publicacao.dataFinal || null,
      atualizadoEm: publicacao.atualizadoEm || publicacao.criadoEm || null,
      tipo: publicacao.meta.tipo,
      local: publicacao.meta.local,
      imagemAlt: publicacao.meta.imagemAlt,
      link: publicacao.meta.link,
      botao: publicacao.meta.botao,
      fixado: publicacao.meta.fixado,
      ordem: publicacao.meta.ordem,
      estilo: publicacao.meta.estilo,
      icone: publicacao.meta.icone
    }));

  return {
    atualizadoEm: agora.toISOString(),
    origem: "PUBLICACOES_SITE",
    cache: "derivado do SharePoint",
    home: estado.home,
    publicacoes,
    banners: publicacoes.filter((item) => item.local === "banner"),
    avisos: publicacoes.filter((item) => item.local === "avisos" || item.tipo === "aviso"),
    destaques: publicacoes.filter((item) => item.destaque || item.local === "destaques")
  };
}

async function publicarArquivoGithub({ token, repo, branch, conteudo }) {
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error("Repositório GitHub inválido.");

  const apiBase = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/contents/${CAMINHO_FONTE_PUBLICA}`;
  const consulta = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}&t=${Date.now()}`, { headers: cabecalhosGithub(token) });

  let sha = "";
  if (consulta.ok) {
    const atual = await consulta.json();
    sha = atual.sha || "";
  } else if (consulta.status !== 404) {
    throw new Error(await mensagemErroGithub(consulta, "Falha ao consultar arquivo público no GitHub."));
  }

  const resposta = await fetch(apiBase, {
    method: "PUT",
    headers: cabecalhosGithub(token),
    body: JSON.stringify({
      message: "Atualizar publicações públicas",
      content: textoParaBase64(conteudo),
      branch,
      ...(sha ? { sha } : {})
    })
  });

  if (!resposta.ok) throw new Error(await mensagemErroGithub(resposta, "Falha ao publicar fonte pública no GitHub."));

  const validacao = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}&t=${Date.now()}`, { headers: cabecalhosGithub(token) });
  if (!validacao.ok) throw new Error(await mensagemErroGithub(validacao, "Arquivo publicado, mas não foi possível validar no GitHub."));
  const publicado = await validacao.json();
  if (!publicado.sha) throw new Error("GitHub não retornou confirmação do arquivo público.");
}

async function mensagemErroGithub(resposta, fallback) {
  try {
    const dados = await resposta.json();
    if (resposta.status === 401 || resposta.status === 403) return "token GitHub inválido ou sem permissão para gravar no repositório.";
    return dados.message || fallback;
  } catch {
    return fallback;
  }
}

function cabecalhosGithub(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

async function registrarLogPortal(evento, detalhes) {
  if (!estado.logsListId) return;
  try {
    await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${estado.logsListId}/items`, {
      method: "POST",
      body: JSON.stringify({
        fields: {
          Evento: evento,
          Usuario: estado.account?.name || estado.account?.username || "",
          Detalhes: detalhes || "",
          DataHora: new Date().toISOString()
        }
      })
    });
  } catch (erro) {
    console.warn("Log do portal indisponível.", erro);
  }
}

async function provisionarSharePoint() {
  el.logProvisionamento.textContent = "Iniciando verificação...\n";
  const listas = await obterListas();

  await garantirLista(listas, CONFIG.publicacoesListName, "genericList", colunasPublicacaoBase());
  await garantirLista(listas, CONFIG.avisosListName, "genericList", colunasPublicacaoBase());
  await garantirLista(listas, CONFIG.bannersListName, "genericList", colunasPublicacaoBase());
  await garantirLista(listas, CONFIG.destaquesListName, "genericList", colunasPublicacaoBase());
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
  await garantirLista(listas, CONFIG.preferenciasListName, "genericList", [
    colunaTexto("Usuario"),
    colunaTexto("Chave"),
    colunaTextoMultilinha("Valor"),
    colunaDataHora("DataAtualizacao")
  ]);
  await garantirLista(listas, CONFIG.servicosListName, "genericList", [
    colunaTexto("Nome"),
    colunaTexto("Status"),
    colunaTexto("Url"),
    colunaTextoMultilinha("Descricao"),
    colunaDataHora("DataAtualizacao")
  ]);
  await garantirLista(listas, CONFIG.logsListName, "genericList", [
    colunaTexto("Evento"),
    colunaTexto("Usuario"),
    colunaTextoMultilinha("Detalhes"),
    colunaDataHora("DataHora")
  ]);
  await garantirLista(listas, CONFIG.midiasLibraryName, "documentLibrary", []);
  await atualizarIdsEstruturas();
  await salvarConfiguracaoValor("fontePublicaPublicacoes", FONTE_PUBLICA_PADRAO);
  await carregarDados();
  registrarLog("Verificação concluída.");
}

async function atualizarIdsEstruturas() {
  const listasAtualizadas = await obterListas();
  estado.publicacoesListId = listasAtualizadas.find((lista) => lista.displayName === CONFIG.publicacoesListName)?.id || "";
  estado.configListId = listasAtualizadas.find((lista) => lista.displayName === CONFIG.configuracoesListName)?.id || "";
  estado.logsListId = listasAtualizadas.find((lista) => lista.displayName === CONFIG.logsListName)?.id || "";
}

async function garantirLista(listas, nome, template, columns) {
  if (listas.some((lista) => lista.displayName === nome)) {
    registrarLog(`${nome}: já existe.`);
    return;
  }

  const resposta = await graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists`, {
    method: "POST",
    body: JSON.stringify({ displayName: nome, list: { template }, columns })
  });

  registrarLog(`${nome}: ${resposta.ok ? "criada" : "falha ao criar"}.`);
  if (!resposta.ok) registrarLog(await resposta.text());
}

function atualizarFiltros() {
  estado.filtros = {
    busca: el.filtroBusca.value,
    status: el.filtroStatus.value,
    local: el.filtroLocal.value,
    ordenacao: el.filtroOrdenacao.value
  };
  localStorage.setItem(STORAGE_FILTROS, JSON.stringify(estado.filtros));
  renderizarPublicacoes();
}

function carregarFiltrosNaTela() {
  if (el.filtroBusca) el.filtroBusca.value = estado.filtros.busca;
  if (el.filtroStatus) el.filtroStatus.value = estado.filtros.status;
  if (el.filtroLocal) el.filtroLocal.value = estado.filtros.local;
  if (el.filtroOrdenacao) el.filtroOrdenacao.value = estado.filtros.ordenacao;
}

function usarMidiaNoEditor() {
  const url = el.midiaUrl.value.trim();
  if (!url) return;
  campo("campoImagem").value = url;
  campo("campoImagemAlt").value = el.midiaAlt.value.trim();
  const midias = [{ url, alt: el.midiaAlt.value.trim() }, ...estado.midias.filter((item) => item.url !== url)].slice(0, 20);
  estado.midias = midias;
  localStorage.setItem(STORAGE_MIDIAS, JSON.stringify(midias));
  renderizarMidias();
  atualizarPreviaPublicacao();
}

function renderizarMidias() {
  const dePublicacoes = estado.publicacoes
    .filter((item) => item.imagem)
    .map((item) => ({ url: item.imagem, alt: item.meta?.imagemAlt || item.titulo }));
  const midias = [...estado.midias, ...dePublicacoes].filter((item, index, lista) => item.url && lista.findIndex((x) => x.url === item.url) === index).slice(0, 20);
  if (!el.listaMidias) return;
  el.listaMidias.innerHTML = midias.length
    ? midias.map((item) => `
      <button class="mediaItem" type="button" data-url="${escaparHtml(item.url)}" data-alt="${escaparHtml(item.alt || "")}">
        <img src="${escaparHtml(item.url)}" alt="">
        <span>${escaparHtml(item.alt || item.url)}</span>
      </button>
    `).join("")
    : '<p class="hintText">Nenhuma mídia cadastrada ainda.</p>';
  el.listaMidias.querySelectorAll(".mediaItem").forEach((botao) => {
    botao.addEventListener("click", () => {
      campo("campoImagem").value = botao.dataset.url;
      campo("campoImagemAlt").value = botao.dataset.alt || "";
      abrirAbaCms("conteudo");
      atualizarPreviaPublicacao();
    });
  });
}

function abrirAbaCms(nome) {
  document.querySelectorAll(".cmsTab").forEach((tab) => tab.classList.toggle("active", tab.dataset.cmsTab === nome));
  document.querySelectorAll(".cmsTabPanel").forEach((panel) => panel.classList.toggle("active", panel.id === `cmsTab-${nome}`));
  localStorage.setItem(STORAGE_ULTIMA_ABA, nome);
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
  if (el.logProvisionamento) el.logProvisionamento.textContent += `${texto}\n`;
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

function colunasPublicacaoBase() {
  return [
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
  ];
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

function criarHtmlCardPublico(item) {
  const meta = normalizarMeta(item.meta || item);
  const titulo = escaparHtml(item.titulo || item.categoria || "Publicação");
  const resumo = escaparHtml(item.resumo || "");
  const imagem = item.imagem ? `<img class="publicMedia" src="${escaparHtml(item.imagem)}" alt="${escaparHtml(meta.imagemAlt || item.titulo || "")}">` : "";
  const icone = meta.icone ? `<span class="badge">${escaparHtml(meta.icone)}</span>` : "";
  const link = meta.link ? `<a class="publicacao-botao" href="${escaparHtml(meta.link)}">${escaparHtml(meta.botao || "Abrir")}</a>` : "";
  return `
    <article class="previewCard publicacao-dinamica estilo-${escaparHtml(meta.estilo)}">
      ${imagem}
      ${icone}
      <h3>${titulo}</h3>
      ${resumo ? `<p>${resumo}</p>` : ""}
      ${link}
    </article>
  `;
}

function classeStatus(status) {
  return {
    publicado: "",
    rascunho: "draft",
    agendado: "scheduled",
    expirado: "expired"
  }[status] || "draft";
}

function rotuloStatus(status) {
  return {
    publicado: "Publicado",
    rascunho: "Rascunho",
    agendado: "Agendado",
    expirado: "Expirado"
  }[status] || "Rascunho";
}

function rotuloLocal(local) {
  return {
    informacoes: "Informações",
    avisos: "Avisos",
    destaques: "Destaques",
    banner: "Banner/topo",
    documentos: "Documentos",
    calendario: "Calendário",
    rodape: "Rodapé",
    modal: "Modal"
  }[local] || "Informações";
}

function textoParaBase64(texto) {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  bytes.forEach((byte) => {
    binario += String.fromCharCode(byte);
  });
  return btoa(binario);
}

function carregarConfiguracaoGithubLocal() {
  if (el.campoGithubRepo) el.campoGithubRepo.value = localStorage.getItem(STORAGE_GITHUB_REPO) || el.campoGithubRepo.value || "mcpmieda/escolaieda";
  if (el.campoGithubBranch) el.campoGithubBranch.value = localStorage.getItem(STORAGE_GITHUB_BRANCH) || el.campoGithubBranch.value || "main";
  if (el.campoGithubToken) el.campoGithubToken.value = sessionStorage.getItem(STORAGE_GITHUB_TOKEN) || "";
}

function salvarConfiguracaoGithubLocal() {
  if (el.campoGithubRepo) localStorage.setItem(STORAGE_GITHUB_REPO, el.campoGithubRepo.value.trim());
  if (el.campoGithubBranch) localStorage.setItem(STORAGE_GITHUB_BRANCH, el.campoGithubBranch.value.trim());
  if (el.campoGithubToken) sessionStorage.setItem(STORAGE_GITHUB_TOKEN, el.campoGithubToken.value.trim());
}

function definirStatusFontePublica(texto, silencioso) {
  if (!silencioso && el.statusFontePublica) el.statusFontePublica.textContent = texto;
}

function carregarJsonLocal(chave, padrao) {
  try {
    return JSON.parse(localStorage.getItem(chave)) || padrao;
  } catch {
    return padrao;
  }
}

function carregarJsonDeTexto(texto, padrao) {
  try {
    return JSON.parse(texto || "") || padrao;
  } catch {
    return padrao;
  }
}

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escaparHtml(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
