import { demoData } from "./demo-data.js";
import {
  calcularResumoGeral,
  filtrarEstudantes,
  filtrarTurmasPorEstudantes,
  formatarMedia,
  listarEstudantesComResumo,
  resumirTurmas,
  rotuloSituacao
} from "./domain.js";
import { NotasGraphClient } from "./graph-client.js";

const graphClient = new NotasGraphClient();

const state = {
  data: demoData,
  account: null,
  mode: "demo",
  structure: null,
  filters: {
    busca: "",
    turma: "todas",
    componente: "todos",
    situacao: "todas"
  },
  currentView: "dashboard"
};

const ui = {
  viewTitle: document.getElementById("viewTitle"),
  viewSubtitle: document.getElementById("viewSubtitle"),
  sidebarStatus: document.getElementById("sidebarStatus"),
  systemBanner: document.getElementById("systemBanner"),
  bannerTitle: document.getElementById("bannerTitle"),
  bannerText: document.getElementById("bannerText"),
  btnEntrar: document.getElementById("btnEntrar"),
  btnDemo: document.getElementById("btnDemo"),
  btnSair: document.getElementById("btnSair"),
  btnVerificarEstrutura: document.getElementById("btnVerificarEstrutura"),
  filtroBusca: document.getElementById("filtroBusca"),
  filtroTurma: document.getElementById("filtroTurma"),
  filtroComponente: document.getElementById("filtroComponente"),
  filtroSituacao: document.getElementById("filtroSituacao"),
  metricGrid: document.getElementById("metricGrid"),
  listaTurmasResumo: document.getElementById("listaTurmasResumo"),
  timelineImportacoes: document.getElementById("timelineImportacoes"),
  tabelaTurmas: document.getElementById("tabelaTurmas"),
  tabelaEstudantes: document.getElementById("tabelaEstudantes"),
  listaImportacoes: document.getElementById("listaImportacoes"),
  listaInconsistencias: document.getElementById("listaInconsistencias"),
  listaStatusPoc: document.getElementById("listaStatusPoc"),
  listaEstrutura: document.getElementById("listaEstrutura"),
  detailPanel: document.getElementById("detailPanel"),
  detailTitle: document.getElementById("detailTitle"),
  detailContent: document.getElementById("detailContent"),
  btnFecharDetalhe: document.getElementById("btnFecharDetalhe")
};

const viewCopy = {
  dashboard: ["Visao geral de notas", "Painel funcional com dados ficticios ate o provisionamento das listas NOTAS_*."],
  turmas: ["Turmas", "Comparativo de turmas, medias e risco academico."],
  estudantes: ["Estudantes", "Consulta operacional com filtros e detalhe individual."],
  importacoes: ["Importacoes", "Acompanhamento da fila tecnica e inconsistencias."],
  poc: ["POC e estrutura", "Estado real da prova online e das estruturas planejadas."]
};

await initialize();

async function initialize() {
  bindEvents();
  preencherFiltros();
  await inicializarSessaoMicrosoft();
  renderAll();
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => abrirView(button.dataset.view));
  });

  ui.btnEntrar.addEventListener("click", () => graphClient.login());
  ui.btnDemo.addEventListener("click", usarDemonstracao);
  ui.btnSair.addEventListener("click", () => graphClient.logout());
  ui.btnVerificarEstrutura.addEventListener("click", verificarEstrutura);
  ui.btnFecharDetalhe.addEventListener("click", fecharDetalhe);

  ui.filtroBusca.addEventListener("input", atualizarFiltros);
  ui.filtroTurma.addEventListener("change", atualizarFiltros);
  ui.filtroComponente.addEventListener("change", atualizarFiltros);
  ui.filtroSituacao.addEventListener("change", atualizarFiltros);
}

async function inicializarSessaoMicrosoft() {
  try {
    state.account = await graphClient.initialize();
    if (state.account) {
      ui.btnSair.hidden = false;
      ui.btnEntrar.textContent = "Verificar Microsoft";
      setSidebarStatus("Sessao Microsoft detectada", "warn");
    }
  } catch (error) {
    console.warn(error);
    setBanner("Login Microsoft", "Nao foi possivel concluir a sessao Microsoft. A demonstracao local continua disponivel.", "warn");
  }
}

function usarDemonstracao() {
  state.mode = "demo";
  state.structure = null;
  setSidebarStatus("Modo demonstracao", "warn");
  setBanner("Ambiente de demonstracao", "Dados ficticios carregados. Nenhuma lista NOTAS_* foi consultada ou alterada.", "warn");
  renderAll();
}

async function verificarEstrutura() {
  if (!state.account) {
    await graphClient.login();
    return;
  }

  setBanner("Verificando estrutura", "Consultando apenas metadados de listas no site ARQUIVODIGITAL.", "warn");
  ui.btnVerificarEstrutura.disabled = true;
  try {
    await graphClient.ensureToken();
    const result = await graphClient.checkNotasStructure();
    state.structure = result;
    if (result.ok) {
      state.mode = "online-ready";
      setSidebarStatus("Estrutura NOTAS_* encontrada", "ok");
      setBanner("Estrutura localizada", "As listas obrigatorias existem. A proxima etapa e trocar o modo demo por consultas Graph reais.", "ok");
    } else {
      state.mode = "demo";
      setSidebarStatus("Estrutura nao criada", "warn");
      setBanner("Estrutura nao provisionada", `${result.missing.length} lista(s) NOTAS_* ainda nao existem. O painel permanece em demonstracao.`, "warn");
    }
  } catch (error) {
    console.error(error);
    setSidebarStatus("Falha na verificacao", "error");
    setBanner("Falha ao verificar", "Nao foi possivel consultar as listas do SharePoint. O modo demonstracao foi preservado.", "error");
  } finally {
    ui.btnVerificarEstrutura.disabled = false;
    renderPoc();
  }
}

function atualizarFiltros() {
  state.filters = {
    busca: ui.filtroBusca.value,
    turma: ui.filtroTurma.value,
    componente: ui.filtroComponente.value,
    situacao: ui.filtroSituacao.value
  };
  renderAll();
}

function abrirView(view) {
  state.currentView = view;
  document.querySelectorAll(".view").forEach((element) => {
    element.classList.toggle("active", element.id === `view-${view}`);
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  const [title, subtitle] = viewCopy[view] || viewCopy.dashboard;
  ui.viewTitle.textContent = title;
  ui.viewSubtitle.textContent = subtitle;
}

function renderAll() {
  const estudantesResumo = filtrarEstudantes(listarEstudantesComResumo(state.data), state.filters);
  const turmasResumo = filtrarTurmasPorEstudantes(resumirTurmas(state.data), estudantesResumo);
  renderMetrics();
  renderTurmasResumo(turmasResumo);
  renderTimeline();
  renderTabelaTurmas(turmasResumo);
  renderTabelaEstudantes(estudantesResumo);
  renderImportacoes();
  renderInconsistencias();
  renderPoc();
}

function preencherFiltros() {
  preencherSelect(ui.filtroTurma, [
    ["todas", "Todas"],
    ...state.data.turmas.map((turma) => [turma.id, turma.codigo])
  ]);
  preencherSelect(ui.filtroComponente, [
    ["todos", "Todos"],
    ...state.data.componentes.map((componente) => [componente.id, componente.nome])
  ]);
}

function renderMetrics() {
  const resumo = calcularResumoGeral(state.data);
  const metrics = [
    ["Turmas", resumo.totalTurmas, "em acompanhamento"],
    ["Estudantes", resumo.totalEstudantes, "registros ficticios"],
    ["Media geral", formatarMedia(resumo.mediaGeral), `${resumo.critico} em risco critico`],
    ["Pendencias", resumo.importacoesComProblema + resumo.inconsistencias, "importacoes e alertas"]
  ];
  replaceChildren(ui.metricGrid, metrics.map(([label, value, hint]) => {
    const card = element("article", "metricCard");
    appendText(card, "span", label);
    appendText(card, "strong", String(value));
    appendText(card, "small", hint);
    return card;
  }));
}

function renderTurmasResumo(turmasResumo) {
  replaceChildren(ui.listaTurmasResumo, turmasResumo.map((turma) => {
    const card = element("article", "turmaCard");
    const body = element("div");
    appendText(body, "strong", turma.nome);
    appendText(body, "p", `${turma.totalEstudantes} estudantes - media ${formatarMedia(turma.mediaFinal)}`, "muted");
    const chips = element("div", "chipRow");
    chips.append(
      chip(`${turma.regular} regular`, "ok"),
      chip(`${turma.atencao} atencao`, "warn"),
      chip(`${turma.critico} critico`, "error")
    );
    body.append(chips);
    const progress = element("div", "progressTrack");
    const bar = element("div", "progressBar");
    bar.style.setProperty("--progress", `${Math.min(100, Math.max(0, turma.mediaFinal))}%`);
    progress.append(bar);
    card.append(body, progress);
    return card;
  }));
}

function renderTimeline() {
  replaceChildren(ui.timelineImportacoes, state.data.importacoes.map((item) => {
    const box = element("article", "timelineItem");
    appendText(box, "strong", item.arquivo);
    appendText(box, "p", `${rotuloStatusImportacao(item.status)} - ${item.linhas} linha(s)`, "muted");
    box.append(chip(rotuloStatusImportacao(item.status), classeChipStatus(item.status)));
    return box;
  }));
}

function renderTabelaTurmas(turmasResumo) {
  replaceChildren(ui.tabelaTurmas, turmasResumo.map((turma) => {
    const row = document.createElement("tr");
    [
      turma.nome,
      turma.totalEstudantes,
      formatarMedia(turma.mediaFinal),
      turma.regular,
      turma.atencao,
      turma.critico,
      formatarData(turma.ultimaSincronizacao)
    ].forEach((value) => appendText(row, "td", String(value)));
    return row;
  }));
}

function renderTabelaEstudantes(estudantesResumo) {
  replaceChildren(ui.tabelaEstudantes, estudantesResumo.map((estudante) => {
    const row = document.createElement("tr");
    appendText(row, "td", estudante.nome);
    appendText(row, "td", estudante.turma?.codigo || "");
    appendText(row, "td", String(estudante.componentes));
    appendText(row, "td", formatarMedia(estudante.mediaFinal));
    const statusCell = document.createElement("td");
    statusCell.append(chip(rotuloSituacao(estudante.situacao), estudante.situacao === "regular" ? "ok" : estudante.situacao === "atencao" ? "warn" : "error"));
    row.append(statusCell);
    const actionCell = document.createElement("td");
    const button = element("button", "rowButton");
    button.type = "button";
    button.textContent = "Detalhes";
    button.addEventListener("click", () => abrirDetalhe(estudante));
    actionCell.append(button);
    row.append(actionCell);
    return row;
  }));
}

function renderImportacoes() {
  replaceChildren(ui.listaImportacoes, state.data.importacoes.map((item) => {
    const box = element("article", "importItem");
    appendText(box, "strong", item.arquivo);
    appendText(box, "p", `${rotuloStatusImportacao(item.status)} - inicio ${formatarData(item.inicio)}`, "muted");
    const row = element("div", "chipRow");
    row.append(chip(`${item.linhas} linhas`, "info"));
    row.append(chip(`${item.alertas} alertas`, item.alertas ? "warn" : "ok"));
    row.append(chip(rotuloStatusImportacao(item.status), classeChipStatus(item.status)));
    box.append(row);
    return box;
  }));
}

function renderInconsistencias() {
  replaceChildren(ui.listaInconsistencias, state.data.inconsistencias.map((item) => {
    const box = element("article", "issueItem");
    appendText(box, "strong", `${item.turmaCodigo} - ${item.componenteCodigo}`);
    appendText(box, "p", item.mensagem, "muted");
    box.append(chip(item.tipo, item.severidade === "erro" ? "error" : "warn"));
    return box;
  }));
}

function renderPoc() {
  replaceChildren(ui.listaStatusPoc, state.data.statusPoc.map((item) => {
    const row = element("div");
    appendText(row, "dt", item.rotulo);
    appendText(row, "dd", item.valor);
    return row;
  }));

  const missing = new Set(state.structure?.missing || state.data.estrutura);
  replaceChildren(ui.listaEstrutura, state.data.estrutura.map((name) => {
    const item = element("article", "structureItem");
    appendText(item, "strong", name);
    const exists = state.structure ? !missing.has(name) : false;
    item.append(chip(exists ? "encontrada" : "pendente", exists ? "ok" : "warn"));
    return item;
  }));
}

function abrirDetalhe(estudante) {
  ui.detailTitle.textContent = estudante.nome;
  const cards = estudante.lancamentos.map((lancamento) => {
    const card = element("article", "studentMiniCard");
    appendText(card, "strong", lancamento.componente?.nome || lancamento.componenteId);
    appendText(card, "p", `Nota final ${formatarMedia(lancamento.notaFinal)} - total recuperado ${formatarMedia(lancamento.totalRec)}`, "muted");
    card.append(chip(rotuloSituacao(lancamento.notaFinal >= 70 ? "regular" : lancamento.notaFinal >= 60 ? "atencao" : "critico"), lancamento.notaFinal >= 70 ? "ok" : lancamento.notaFinal >= 60 ? "warn" : "error"));
    return card;
  });
  const header = element("article", "studentMiniCard");
  appendText(header, "strong", estudante.codigo);
  appendText(header, "p", `${estudante.turma?.nome || "Turma"} - ${estudante.situacaoMatricula}`, "muted");
  replaceChildren(ui.detailContent, [header, ...cards]);
  ui.detailPanel.classList.add("open");
  ui.detailPanel.setAttribute("aria-hidden", "false");
}

function fecharDetalhe() {
  ui.detailPanel.classList.remove("open");
  ui.detailPanel.setAttribute("aria-hidden", "true");
}

function setSidebarStatus(text, type) {
  const dotClass = type === "error" ? "statusDot statusDotError" : type === "ok" ? "statusDot" : "statusDot statusDotWarn";
  replaceChildren(ui.sidebarStatus, [element("span", dotClass), textNode(text)]);
}

function setBanner(title, text, type) {
  ui.bannerTitle.textContent = title;
  ui.bannerText.textContent = text;
  ui.systemBanner.style.borderColor = type === "error" ? "#efb2a9" : type === "ok" ? "#b9d8c9" : "#e4d4aa";
  ui.systemBanner.style.background = type === "error" ? "#fff2ef" : type === "ok" ? "#ecf8f1" : "#fff8e6";
}

function preencherSelect(select, options) {
  replaceChildren(select, options.map(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  }));
}

function chip(text, type) {
  const className = {
    ok: "chip",
    warn: "chip warn",
    error: "chip error",
    info: "chip info"
  }[type] || "chip";
  const item = element("span", className);
  item.textContent = text;
  return item;
}

function rotuloStatusImportacao(status) {
  return {
    concluido: "Concluido",
    concluido_com_alertas: "Concluido com alertas",
    pendente: "Pendente",
    erro: "Erro"
  }[status] || "Pendente";
}

function classeChipStatus(status) {
  return {
    concluido: "ok",
    concluido_com_alertas: "warn",
    pendente: "info",
    erro: "error"
  }[status] || "info";
}

function formatarData(value) {
  if (!value) return "nao iniciado";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function appendText(parent, tag, text, className = "") {
  const child = element(tag, className);
  child.textContent = text;
  parent.append(child);
  return child;
}

function element(tag, className = "") {
  const item = document.createElement(tag);
  if (className) item.className = className;
  return item;
}

function textNode(text) {
  return document.createTextNode(text);
}

function replaceChildren(parent, children) {
  parent.replaceChildren(...children);
}
