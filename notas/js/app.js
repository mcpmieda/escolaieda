import { demoData } from "./demo-data.js";
import {
  calcularResumoGeral,
  filtrarEstudantes,
  filtrarTurmasPorEstudantes,
  formatarMedia,
  listarEstudantesComResumo,
  resumirComponentes,
  resumirEtapas,
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
  heroMedia: document.getElementById("heroMedia"),
  heroAtencao: document.getElementById("heroAtencao"),
  heroSync: document.getElementById("heroSync"),
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
  mapaAproveitamento: document.getElementById("mapaAproveitamento"),
  timelineImportacoes: document.getElementById("timelineImportacoes"),
  painelTrimestres: document.getElementById("painelTrimestres"),
  listaTurmasResumo: document.getElementById("listaTurmasResumo"),
  matrizBancoNotas: document.getElementById("matrizBancoNotas"),
  painelAproveitamento: document.getElementById("painelAproveitamento"),
  tabelaEstudantes: document.getElementById("tabelaEstudantes"),
  boletimPreview: document.getElementById("boletimPreview"),
  fichaAlunoResumo: document.getElementById("fichaAlunoResumo"),
  listaBoletins: document.getElementById("listaBoletins"),
  relatorioAproveitamento: document.getElementById("relatorioAproveitamento"),
  relatorioConselho: document.getElementById("relatorioConselho"),
  relatorioAta: document.getElementById("relatorioAta"),
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
  dashboard: ["Gestão de notas", "Acompanhamento anual por turma, componente, aluno, boletim e resultado."],
  banco: ["Banco de notas", "Matriz consolidada por componente, trimestre, recuperação e resultado."],
  estudantes: ["Alunos", "Consulta operacional por turma, média, situação e resultado final."],
  boletins: ["Boletins", "Prévia individual com a organização do banco atual, em formato de sistema."],
  relatorios: ["Relatórios", "Aproveitamento, conselho de classe e síntese para ata de resultados."],
  importacoes: ["Importações", "Fila técnica, alertas e falhas que precisam ser reprocessáveis."],
  poc: ["Estrutura", "Estado real da POC online e das listas planejadas no SharePoint."]
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
      setSidebarStatus("Sessão Microsoft detectada", "warn");
    }
  } catch (error) {
    console.warn(error);
    setBanner("Login Microsoft", "Não foi possível concluir a sessão Microsoft. A demonstração continua disponível.", "warn");
  }
}

function usarDemonstracao() {
  state.mode = "demo";
  state.structure = null;
  setSidebarStatus("Modo demonstração", "warn");
  setBanner("Ambiente de demonstração", "Dados fictícios carregados. Nenhuma lista NOTAS_* foi consultada ou alterada.", "warn");
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
      setBanner("Estrutura localizada", "As listas obrigatórias existem. A próxima etapa é trocar a demonstração por consultas Graph reais.", "ok");
    } else {
      state.mode = "demo";
      setSidebarStatus("Estrutura não criada", "warn");
      setBanner("Estrutura não provisionada", `${result.missing.length} lista(s) NOTAS_* ainda não existem. O painel permanece em demonstração.`, "warn");
    }
  } catch (error) {
    console.error(error);
    setSidebarStatus("Falha na verificação", "error");
    setBanner("Falha ao verificar", "Não foi possível consultar as listas do SharePoint. O modo demonstração foi preservado.", "error");
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
  document.querySelectorAll(".view").forEach((elemento) => {
    elemento.classList.toggle("active", elemento.id === `view-${view}`);
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  const [title, subtitle] = viewCopy[view] || viewCopy.dashboard;
  ui.viewTitle.textContent = title;
  ui.viewSubtitle.textContent = subtitle;
}

function renderAll() {
  const estudantesResumoBase = listarEstudantesComResumo(state.data);
  const estudantesResumo = filtrarEstudantes(estudantesResumoBase, state.filters);
  const turmasResumo = filtrarTurmasPorEstudantes(resumirTurmas(state.data), estudantesResumo);
  const lancamentosFiltrados = estudantesResumo.flatMap((estudante) => estudante.lancamentos);
  const resumo = calcularResumoGeral({
    ...state.data,
    estudantes: estudantesResumo.map(({ turma, lancamentos, ...estudante }) => estudante),
    lancamentos: lancamentosFiltrados
  });

  renderHero(resumo, turmasResumo);
  renderMetrics(resumo);
  renderMapaAproveitamento(turmasResumo);
  renderTimeline();
  renderTrimestres(lancamentosFiltrados);
  renderTurmasResumo(turmasResumo);
  renderBancoNotas(estudantesResumo);
  renderPainelAproveitamento(estudantesResumo);
  renderTabelaEstudantes(estudantesResumo);
  renderBoletim(estudantesResumo);
  renderRelatorios(estudantesResumo, turmasResumo);
  renderImportacoes();
  renderInconsistencias();
  renderPoc();
}

function preencherFiltros() {
  preencherSelect(ui.filtroTurma, [
    ["todas", "Todas as turmas"],
    ...state.data.turmas.map((turma) => [turma.id, turma.codigo])
  ]);
  preencherSelect(ui.filtroComponente, [
    ["todos", "Todos os componentes"],
    ...state.data.componentes.map((componente) => [componente.id, componente.nome])
  ]);
}

function renderHero(resumo, turmasResumo) {
  ui.heroMedia.textContent = formatarMedia(resumo.mediaGeral);
  ui.heroAtencao.textContent = String(resumo.atencao + resumo.critico);
  const datas = turmasResumo.map((turma) => new Date(turma.ultimaSincronizacao).getTime()).filter(Number.isFinite);
  ui.heroSync.textContent = datas.length ? formatarDataCurta(new Date(Math.max(...datas)).toISOString()) : "--";
}

function renderMetrics(resumo) {
  const metrics = [
    ["Turmas", resumo.totalTurmas, "em acompanhamento", ""],
    ["Alunos", resumo.totalEstudantes, "registros fictícios", "accentBlue"],
    ["Componentes", resumo.totalComponentes, "matriz anual", "accentAmber"],
    ["Pendências", resumo.importacoesComProblema + resumo.inconsistencias, "importações e alertas", "accentCoral"]
  ];
  replaceChildren(ui.metricGrid, metrics.map(([label, value, hint, accent]) => {
    const card = element("article", `metricCard ${accent}`.trim());
    appendText(card, "span", label);
    appendText(card, "strong", String(value));
    appendText(card, "small", hint);
    return card;
  }));
}

function renderMapaAproveitamento(turmasResumo) {
  replaceChildren(ui.mapaAproveitamento, turmasResumo.map((turma) => {
    const row = element("article", "heatRow");
    const meta = element("div", "heatMeta");
    appendText(meta, "strong", turma.nome);
    appendText(meta, "p", `${turma.totalEstudantes} alunos - ${turma.turno}`, "muted");
    const track = progressTrack(turma.mediaFinal, barraPorMedia(turma.mediaFinal));
    const chips = element("div", "chipRow");
    chips.append(
      chip(`${turma.regular} regular`, "ok"),
      chip(`${turma.atencao} atenção`, "warn"),
      chip(`${turma.critico} crítico`, "error")
    );
    row.append(meta, track, chips);
    return row;
  }));
}

function renderTimeline() {
  replaceChildren(ui.timelineImportacoes, state.data.importacoes.slice(0, 4).map((item) => {
    const box = element("article", "timelineItem");
    appendText(box, "strong", item.arquivo);
    appendText(box, "p", `${rotuloStatusImportacao(item.status)} - ${item.linhas} linha(s)`, "muted");
    const row = element("div", "chipRow");
    row.append(chip(rotuloStatusImportacao(item.status), classeChipStatus(item.status)));
    row.append(chip(item.professor, "violet"));
    box.append(row);
    return box;
  }));
}

function renderTrimestres(lancamentos) {
  replaceChildren(ui.painelTrimestres, resumirEtapas(lancamentos).map((etapa) => {
    const card = element("article", "stageCard");
    appendText(card, "span", etapa.rotulo, "muted");
    appendText(card, "strong", formatarMedia(etapa.media));
    card.append(progressTrack((etapa.media / etapa.maximo) * 100, barraPorMedia((etapa.media / etapa.maximo) * 100)));
    return card;
  }));
}

function renderTurmasResumo(turmasResumo) {
  replaceChildren(ui.listaTurmasResumo, turmasResumo.map((turma) => {
    const card = element("article", "turmaCard");
    appendText(card, "strong", turma.codigo);
    appendText(card, "p", `${formatarMedia(turma.mediaFinal)} de média - ${formatarData(turma.ultimaSincronizacao)}`, "muted");
    const chips = element("div", "chipRow");
    chips.append(chip(`${turma.resultados["APROVADO DIRETO"]} direto`, "ok"));
    chips.append(chip(`${turma.resultados["APROVADO PELA RECUPERAÇÃO"]} rec.`, "warn"));
    chips.append(chip(`${turma.resultados["EM ACOMPANHAMENTO"]} acomp.`, "info"));
    card.append(chips);
    return card;
  }));
}

function renderBancoNotas(estudantesResumo) {
  const componentes = resumirComponentes(state.data, estudantesResumo);
  replaceChildren(ui.matrizBancoNotas, componentes.map((componente) => {
    const row = document.createElement("tr");
    appendText(row, "td", `${componente.codigo} - ${componente.nome}`);
    appendText(row, "td", formatarMedia(componente.mediaT1));
    appendText(row, "td", formatarMedia(componente.mediaT2));
    appendText(row, "td", formatarMedia(componente.mediaT3));
    appendText(row, "td", formatarMedia(componente.mediaTotal));
    appendText(row, "td", formatarMedia(componente.mediaFinal));
    const statusCell = document.createElement("td");
    statusCell.append(chip(`${componente.atencao + componente.critico} em atenção`, componente.critico ? "error" : componente.atencao ? "warn" : "ok"));
    row.append(statusCell);
    return row;
  }));
}

function renderPainelAproveitamento(estudantesResumo) {
  const componentes = resumirComponentes(state.data, estudantesResumo);
  const areas = new Map();
  for (const componente of componentes) {
    const atual = areas.get(componente.area) || [];
    atual.push(componente);
    areas.set(componente.area, atual);
  }
  const cards = [...areas.entries()].map(([area, lista]) => {
    const mediaArea = mediaLocal(lista.map((item) => item.mediaFinal));
    const card = element("article", "areaCard");
    const header = element("header");
    appendText(header, "strong", area);
    appendText(header, "span", formatarMedia(mediaArea), "muted");
    card.append(header, progressTrack(mediaArea, barraPorMedia(mediaArea)));
    appendText(card, "small", `${lista.length} componente(s) acompanhados`, "muted");
    return card;
  });
  replaceChildren(ui.painelAproveitamento, cards);
}

function renderTabelaEstudantes(estudantesResumo) {
  replaceChildren(ui.tabelaEstudantes, estudantesResumo.map((estudante) => {
    const row = document.createElement("tr");
    appendText(row, "td", estudante.nome);
    appendText(row, "td", estudante.turma?.codigo || "");
    appendText(row, "td", String(estudante.componentes));
    appendText(row, "td", formatarMedia(estudante.mediaFinal));
    const statusCell = document.createElement("td");
    statusCell.append(chip(estudante.resultadoFinal, chipPorResultado(estudante.resultadoFinal)));
    row.append(statusCell);
    const actionCell = document.createElement("td");
    const button = element("button", "rowButton");
    button.type = "button";
    button.textContent = "Abrir ficha";
    button.addEventListener("click", () => abrirDetalhe(estudante));
    actionCell.append(button);
    row.append(actionCell);
    return row;
  }));
}

function renderBoletim(estudantesResumo) {
  const estudante = estudantesResumo[0];
  if (!estudante) {
    replaceChildren(ui.boletimPreview, [emptyState("Nenhum aluno encontrado para os filtros atuais.")]);
    replaceChildren(ui.fichaAlunoResumo, []);
    replaceChildren(ui.listaBoletins, []);
    return;
  }

  const top = element("div", "boletimTop");
  const info = element("div");
  appendText(info, "p", "Boletim anual demonstrativo", "sectionKicker");
  appendText(info, "h2", estudante.nome);
  appendText(info, "p", `${estudante.turma?.nome || ""} - ${estudante.codigo}`, "muted");
  const seal = element("div", "boletimSeal");
  seal.append(textNode(estudante.resultadoFinal));
  top.append(info, seal);

  const tableWrap = element("div", "responsiveTable boletimTable");
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Componente", "I tri.", "II tri.", "III tri.", "Total", "Rec.", "Final"].forEach((label) => appendText(headerRow, "th", label));
  thead.append(headerRow);
  const tbody = document.createElement("tbody");
  replaceChildren(tbody, estudante.lancamentos.map((nota) => {
    const row = document.createElement("tr");
    appendText(row, "td", nota.componente?.nome || nota.componenteId);
    appendText(row, "td", formatarMedia(nota.notaT1));
    appendText(row, "td", formatarMedia(nota.notaT2));
    appendText(row, "td", formatarMedia(nota.notaT3));
    appendText(row, "td", formatarMedia(nota.total));
    appendText(row, "td", formatarMedia(nota.totalRec));
    appendText(row, "td", formatarMedia(nota.notaFinal));
    return row;
  }));
  table.append(thead, tbody);
  tableWrap.append(table);
  replaceChildren(ui.boletimPreview, [top, tableWrap]);

  renderFichaResumo(estudante);
  renderFilaBoletins(estudantesResumo);
}

function renderFichaResumo(estudante) {
  const criticos = estudante.lancamentos.filter((nota) => nota.notaFinal < 60).length;
  const cards = [
    ["Média anual", formatarMedia(estudante.mediaFinal), rotuloSituacao(estudante.situacao)],
    ["Componentes", estudante.componentes, `${criticos} abaixo de 60`],
    ["Matrícula", estudante.situacaoMatricula, estudante.turma?.turno || ""]
  ].map(([label, value, hint]) => {
    const card = element("article", "snapshotCard");
    appendText(card, "span", label, "muted");
    appendText(card, "strong", String(value));
    appendText(card, "small", hint, "muted");
    return card;
  });
  replaceChildren(ui.fichaAlunoResumo, cards);
}

function renderFilaBoletins(estudantesResumo) {
  replaceChildren(ui.listaBoletins, estudantesResumo.slice(0, 7).map((estudante) => {
    const item = element("article", "queueItem");
    appendText(item, "strong", estudante.nome);
    appendText(item, "p", `${estudante.turma?.codigo || ""} - média ${formatarMedia(estudante.mediaFinal)}`, "muted");
    item.append(chip(estudante.resultadoFinal, chipPorResultado(estudante.resultadoFinal)));
    return item;
  }));
}

function renderRelatorios(estudantesResumo, turmasResumo) {
  const componentes = resumirComponentes(state.data, estudantesResumo).sort((a, b) => a.mediaFinal - b.mediaFinal);
  replaceChildren(ui.relatorioAproveitamento, componentes.slice(0, 8).map((componente) => {
    const row = element("article", "chartRow");
    const header = element("header");
    appendText(header, "strong", componente.nome);
    appendText(header, "span", formatarMedia(componente.mediaFinal), "muted");
    row.append(header, progressTrack(componente.mediaFinal, barraPorMedia(componente.mediaFinal)));
    return row;
  }));

  const conselho = estudantesResumo
    .filter((estudante) => estudante.situacao !== "regular")
    .sort((a, b) => a.mediaFinal - b.mediaFinal)
    .slice(0, 8);
  replaceChildren(ui.relatorioConselho, conselho.map((estudante) => {
    const item = element("article", "issueItem");
    appendText(item, "strong", estudante.nome);
    appendText(item, "p", `${estudante.turma?.codigo || ""} - média ${formatarMedia(estudante.mediaFinal)}`, "muted");
    item.append(chip(rotuloSituacao(estudante.situacao), estudante.situacao === "atencao" ? "warn" : "error"));
    return item;
  }));

  replaceChildren(ui.relatorioAta, turmasResumo.map((turma) => {
    const item = element("article", "ataCard");
    const header = element("header");
    appendText(header, "strong", turma.codigo);
    appendText(header, "span", `${turma.totalEstudantes} alunos`, "muted");
    const chips = element("div", "chipRow");
    chips.append(chip(`${turma.resultados["APROVADO DIRETO"]} direto`, "ok"));
    chips.append(chip(`${turma.resultados["APROVADO PELA RECUPERAÇÃO"]} recuperação`, "warn"));
    chips.append(chip(`${turma.resultados["EM ACOMPANHAMENTO"]} acompanhamento`, "info"));
    item.append(header, chips);
    return item;
  }));
}

function renderImportacoes() {
  replaceChildren(ui.listaImportacoes, state.data.importacoes.map((item) => {
    const box = element("article", "importItem");
    appendText(box, "strong", item.arquivo);
    appendText(box, "p", `${item.professor} - início ${formatarData(item.inicio)}`, "muted");
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
  const header = element("article", "studentMiniCard");
  appendText(header, "strong", estudante.codigo);
  appendText(header, "p", `${estudante.turma?.nome || "Turma"} - ${estudante.resultadoFinal}`, "muted");
  header.append(chip(rotuloSituacao(estudante.situacao), estudante.situacao === "regular" ? "ok" : estudante.situacao === "atencao" ? "warn" : "error"));

  const cards = estudante.lancamentos.map((lancamento) => {
    const card = element("article", "studentMiniCard");
    appendText(card, "strong", lancamento.componente?.nome || lancamento.componenteId);
    appendText(card, "p", `T1 ${formatarMedia(lancamento.notaT1)} - T2 ${formatarMedia(lancamento.notaT2)} - T3 ${formatarMedia(lancamento.notaT3)}`, "muted");
    const row = element("div", "chipRow");
    row.append(chip(`Final ${formatarMedia(lancamento.notaFinal)}`, classePorMedia(lancamento.notaFinal)));
    row.append(chip(`${lancamento.faltas} falta(s)`, "info"));
    card.append(row);
    return card;
  });
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
  ui.systemBanner.style.borderColor = type === "error" ? "#efb2a9" : type === "ok" ? "#b9d8c9" : "#ead8aa";
  ui.systemBanner.style.background = type === "error" ? "#fff2ef" : type === "ok" ? "#ecf8f1" : "#fff9ed";
}

function preencherSelect(select, options) {
  replaceChildren(select, options.map(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  }));
}

function progressTrack(percentual, type = "ok") {
  const track = element("div", "progressTrack");
  const bar = element("div", `progressBar ${type === "ok" ? "" : type}`.trim());
  bar.style.setProperty("--progress", `${Math.min(100, Math.max(0, percentual))}%`);
  track.append(bar);
  return track;
}

function chip(text, type) {
  const className = {
    ok: "chip",
    warn: "chip warn",
    error: "chip error",
    info: "chip info",
    violet: "chip violet"
  }[type] || "chip";
  const item = element("span", className);
  item.textContent = text;
  return item;
}

function emptyState(text) {
  const item = element("article", "issueItem");
  appendText(item, "strong", "Sem registros");
  appendText(item, "p", text, "muted");
  return item;
}

function rotuloStatusImportacao(status) {
  return {
    concluido: "Concluído",
    concluido_com_alertas: "Concluído com alertas",
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

function chipPorResultado(resultado) {
  return resultado === "APROVADO DIRETO" ? "ok" : resultado === "APROVADO PELA RECUPERAÇÃO" ? "warn" : "info";
}

function classePorMedia(media) {
  return media >= 70 ? "ok" : media >= 60 ? "warn" : "error";
}

function barraPorMedia(media) {
  return media >= 70 ? "ok" : media >= 60 ? "warn" : "error";
}

function formatarData(value) {
  if (!value) return "não iniciado";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatarDataCurta(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function mediaLocal(lista) {
  const numeros = lista.filter(Number.isFinite);
  if (!numeros.length) return 0;
  return numeros.reduce((total, valor) => total + valor, 0) / numeros.length;
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
