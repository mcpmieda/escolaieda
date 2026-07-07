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
  classeTitulo: document.getElementById("classeTitulo"),
  classeSubtitulo: document.getElementById("classeSubtitulo"),
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
  dashboardDisciplinas: document.getElementById("dashboardDisciplinas"),
  rankingDestaques: document.getElementById("rankingDestaques"),
  donutDesempenho: document.getElementById("donutDesempenho"),
  painelTrimestres: document.getElementById("painelTrimestres"),
  mapaAproveitamento: document.getElementById("mapaAproveitamento"),
  quadroAproveitamento: document.getElementById("quadroAproveitamento"),
  matrizBancoNotas: document.getElementById("matrizBancoNotas"),
  painelAproveitamento: document.getElementById("painelAproveitamento"),
  tabelaEstudantes: document.getElementById("tabelaEstudantes"),
  boletimPreview: document.getElementById("boletimPreview"),
  fichaAlunoResumo: document.getElementById("fichaAlunoResumo"),
  listaBoletins: document.getElementById("listaBoletins"),
  conselhoAlunoFoco: document.getElementById("conselhoAlunoFoco"),
  conselhoResumo: document.getElementById("conselhoResumo"),
  conselhoVotos: document.getElementById("conselhoVotos"),
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
  dashboard: ["Movimento estatístico escolar", "Turma, período, ranking, componentes e desempenho em visão executiva."],
  banco: ["Banco de notas", "Matriz consolidada por componente, trimestre, recuperação e resultado."],
  estudantes: ["Alunos", "Consulta operacional por turma, média, situação e resultado final."],
  boletins: ["Boletim e ficha", "Prévia de ficha individual com regime, aproveitamento anual, recuperação e frequência."],
  conselho: ["Conselho de classe", "Aluno em foco, deliberação, matriz de notas e resumo para decisão pedagógica."],
  relatorios: ["Relatórios", "Aproveitamento, conselho de classe e síntese para ata de resultados."],
  importacoes: ["Sincronização", "Fila técnica, alertas e falhas que precisam ser reprocessáveis."],
  poc: ["Estrutura", "Estado real da POC online e das listas planejadas no SharePoint."]
};

await initialize();

async function initialize() {
  bindEvents();
  preencherFiltros();
  await inicializarSessaoMicrosoft();
  renderAll();
  const initialView = viewFromHash();
  if (initialView) abrirView(initialView);
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
  window.addEventListener("hashchange", () => {
    const view = viewFromHash();
    if (view) abrirView(view);
  });
}

async function inicializarSessaoMicrosoft() {
  try {
    state.account = await graphClient.initialize();
    if (state.account) {
      ui.btnSair.hidden = false;
      ui.btnEntrar.textContent = "Verificar";
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

function viewFromHash() {
  const view = window.location.hash.replace("#", "").trim();
  return viewCopy[view] ? view : "";
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

  renderContextoClasse(estudantesResumo, turmasResumo);
  renderHero(resumo, turmasResumo);
  renderMetrics(resumo);
  renderDashboardDisciplinas(estudantesResumo);
  renderRanking(estudantesResumo);
  renderDonut(resumo);
  renderTrimestres(lancamentosFiltrados);
  renderMapaAproveitamento(turmasResumo);
  renderQuadroAproveitamento(estudantesResumo);
  renderBancoNotas(estudantesResumo);
  renderPainelAproveitamento(estudantesResumo);
  renderTabelaEstudantes(estudantesResumo);
  renderBoletim(estudantesResumo);
  renderConselho(estudantesResumo);
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

function renderContextoClasse(estudantesResumo, turmasResumo) {
  const turma = turmasResumo[0] || state.data.turmas[0];
  const total = estudantesResumo.filter((estudante) => !turma || estudante.turmaId === turma.id).length || estudantesResumo.length;
  ui.classeTitulo.textContent = turma?.nome || "Turma sem seleção";
  ui.classeSubtitulo.textContent = `${turma?.etapa || "Ensino Fundamental Anos Finais"} · ${total} aluno(s) fictícios · ${turma?.turno || "Turno"}`;
}

function renderHero(resumo, turmasResumo) {
  ui.heroMedia.textContent = formatarMedia(resumo.mediaGeral);
  ui.heroAtencao.textContent = String(resumo.atencao + resumo.critico);
  const datas = turmasResumo.map((turma) => new Date(turma.ultimaSincronizacao).getTime()).filter(Number.isFinite);
  ui.heroSync.textContent = datas.length ? formatarDataCurta(new Date(Math.max(...datas)).toISOString()) : "--";
}

function renderMetrics(resumo) {
  const total = Math.max(1, resumo.totalEstudantes);
  const metrics = [
    ["Acima ou igual a 60", resumo.regular + resumo.atencao, `${Math.round(((resumo.regular + resumo.atencao) / total) * 100)}% da amostra`, "accentMint"],
    ["Abaixo de 60", resumo.critico, `${Math.round((resumo.critico / total) * 100)}% em risco`, "accentCoral"],
    ["Componentes", resumo.totalComponentes, "matriz anual", "accentBlue"],
    ["Pendências", resumo.importacoesComProblema + resumo.inconsistencias, "sync e alertas", "accentAmber"]
  ];
  replaceChildren(ui.metricGrid, metrics.map(([label, value, hint, accent]) => {
    const card = element("article", `metricCard ${accent}`.trim());
    appendText(card, "span", label);
    appendText(card, "strong", String(value));
    appendText(card, "small", hint);
    return card;
  }));
}

function renderDashboardDisciplinas(estudantesResumo) {
  const componentes = resumirComponentes(state.data, estudantesResumo);
  replaceChildren(ui.dashboardDisciplinas, componentes.map((componente) => {
    const item = element("article", "disciplineBar");
    const header = element("header");
    appendText(header, "strong", componente.codigo);
    appendText(header, "span", componente.nome);
    const body = element("div", "barStack");
    const acima = Math.max(0, componente.regular + componente.atencao);
    const total = Math.max(1, componente.lancamentos);
    const percentual = Math.round((acima / total) * 100);
    body.append(progressTrack(percentual, percentual >= 70 ? "ok" : percentual >= 55 ? "warn" : "error"));
    appendText(body, "small", `${percentual}% com nota final igual/acima de 60`, "muted");
    item.append(header, body);
    return item;
  }));
}

function renderRanking(estudantesResumo) {
  const ranking = [...estudantesResumo].sort((a, b) => b.mediaFinal - a.mediaFinal).slice(0, 3);
  const header = element("div", "panelHeader");
  const title = element("div");
  appendText(title, "p", "Destaques", "sectionKicker");
  appendText(title, "h2", "Ranking da turma");
  header.append(title);

  const list = element("div", "rankingList");
  ranking.forEach((estudante, index) => {
    const item = element("article", "rankingItem");
    appendText(item, "span", String(index + 1).padStart(2, "0"), `rankBadge rank${index + 1}`);
    const body = element("div");
    appendText(body, "strong", estudante.nome);
    appendText(body, "small", `${estudante.turma?.codigo || ""} · ${estudante.resultadoFinal}`, "muted");
    appendText(item, "b", formatarMedia(estudante.mediaFinal));
    item.insertBefore(body, item.lastChild);
    list.append(item);
  });
  replaceChildren(ui.rankingDestaques, [header, list]);
}

function renderDonut(resumo) {
  const total = Math.max(1, resumo.totalEstudantes);
  const ok = Math.round(((resumo.regular + resumo.atencao) / total) * 100);
  const donut = element("div", "donutCard");
  const header = element("div", "panelHeader");
  const title = element("div");
  appendText(title, "p", "Desempenho geral", "sectionKicker");
  appendText(title, "h2", "Síntese da turma");
  header.append(title);
  const graph = element("div", "donutGraph");
  graph.style.setProperty("--ok", `${ok}%`);
  appendText(graph, "strong", `${ok}%`);
  appendText(graph, "span", "igual/acima de 60");
  const legend = element("div", "donutLegend");
  legend.append(chip(`${resumo.regular + resumo.atencao} acima`, "ok"), chip(`${resumo.critico} abaixo`, "error"));
  donut.append(header, graph, legend);
  replaceChildren(ui.donutDesempenho, [donut]);
}

function renderTrimestres(lancamentos) {
  replaceChildren(ui.painelTrimestres, resumirEtapas(lancamentos).map((etapa) => {
    const card = element("article", "stageCard");
    appendText(card, "span", etapa.rotulo, "muted");
    appendText(card, "strong", formatarMedia(etapa.media));
    appendText(card, "small", `máx. ${etapa.maximo}`, "muted");
    card.append(progressTrack((etapa.media / etapa.maximo) * 100, barraPorMedia((etapa.media / etapa.maximo) * 100)));
    return card;
  }));
}

function renderMapaAproveitamento(turmasResumo) {
  replaceChildren(ui.mapaAproveitamento, turmasResumo.map((turma) => {
    const row = element("article", "heatRow");
    const meta = element("div", "heatMeta");
    appendText(meta, "strong", turma.nome);
    appendText(meta, "p", `${turma.totalEstudantes} alunos · ${turma.turno}`, "muted");
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

function renderQuadroAproveitamento(estudantesResumo) {
  if (!ui.quadroAproveitamento) return;

  const turma = obterTurmaAtiva(estudantesResumo);
  const estudantesTurma = estudantesResumo.filter((estudante) => estudante.turmaId === turma?.id);
  const linhas = Array.from({ length: Math.max(24, estudantesTurma.length) }, (_, index) => estudantesTurma[index] || null);

  const documento = element("div", "excelDocument");
  const topo = element("div", "excelDocTop");
  const titulo = element("div");
  appendText(titulo, "span", "APROVEITAMENTO ESCOLAR ANUAL", "excelOverline");
  appendText(titulo, "strong", turma?.nome || "Turma demonstrativa");
  appendText(titulo, "small", "I TRIMESTRE · lançamento por componente · valores fictícios", "muted");
  const periodo = element("div", "excelPeriodSeal");
  appendText(periodo, "span", "2026");
  appendText(periodo, "strong", "I TRI.");
  topo.append(titulo, periodo);

  const grid = element("div", "excelGridWrap");
  appendText(grid, "div", "APROVEITAMENTO ESCOLAR ANUAL", "excelVerticalBand");
  const tableWrap = element("div", "responsiveTable excelTableWrap");
  const table = document.createElement("table");
  table.className = "excelTable";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  appendText(headerRow, "th", "Nº", "excelNumberCol");
  appendText(headerRow, "th", "ALUNO", "excelNameCol");
  componentesPlanilha().forEach((componente) => {
    const header = element("th", "excelCodeCol");
    appendText(header, "span", codigoPlanilha(componente), "excelCode");
    appendText(header, "small", componente.nome, "excelCodeName");
    headerRow.append(header);
  });
  appendText(headerRow, "th", "AP ANTERIOR", "excelApCol");
  thead.append(headerRow);

  const tbody = document.createElement("tbody");
  replaceChildren(tbody, linhas.map((estudante, index) => {
    const row = document.createElement("tr");
    appendText(row, "td", String(index + 1), "excelNumberCell");
    appendText(row, "td", estudante?.nome || "", "excelNameCell");
    componentesPlanilha().forEach((componente) => {
      const nota = estudante?.lancamentos.find((item) => item.componenteId === componente.id);
      const cell = appendText(row, "td", nota ? formatarMedia(nota.notaT1) : "", "excelScoreCell");
      if (nota && Number(nota.notaT1) < 18) cell.classList.add("scoreLow");
    });
    const media = estudante ? formatarMedia(estudante.mediaFinal) : "";
    appendText(row, "td", media, "excelApCell");
    return row;
  }));

  table.append(thead, tbody);
  tableWrap.append(table);
  grid.append(tableWrap);
  documento.append(topo, grid);
  replaceChildren(ui.quadroAproveitamento, [documento]);
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
    statusCell.append(chip(`${componente.atencao + componente.critico} atenção`, componente.critico ? "error" : componente.atencao ? "warn" : "ok"));
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
    button.textContent = "Abrir";
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

  const hub = element("div", "printHub");
  const hubTitle = element("div");
  appendText(hubTitle, "p", "Relatórios e impressão", "sectionKicker");
  appendText(hubTitle, "h2", "Boletim escolar");
  appendText(hubTitle, "span", "Prévia demonstrativa baseada no modelo real do banco de notas.", "muted");
  const hubActions = element("div", "printActions");
  ["Boletim", "Ficha", "Ata", "PDF"].forEach((label, index) => {
    const button = element("button", index === 0 ? "periodChip active" : "periodChip");
    button.type = "button";
    button.textContent = label;
    hubActions.append(button);
  });
  hub.append(hubTitle, hubActions);

  const page = element("article", "boletimExcelPage");
  const top = element("div", "boletimExcelTop");
  appendText(top, "strong", "ESCOLA MUN. PROFª IÊDA ALVES DE OLIVEIRA MCPM");
  appendText(top, "span", "RUA CLIDENOR DE OLIVEIRA, S/N · CENTRO · MEDEIROS NETO - BAHIA");
  appendText(top, "small", "secretaria@escolaieda.com · (73) 99871-0105");

  const titleBand = element("div", "boletimExcelBand");
  appendText(titleBand, "strong", "APROVEITAMENTO ESCOLAR 2026");
  appendText(titleBand, "span", estudante.turma?.nome || "Turma demonstrativa");

  const alunoBox = element("div", "boletimStudentBand");
  [
    ["ALUNO", estudante.nome],
    ["CÓDIGO", estudante.codigo],
    ["TURMA", estudante.turma?.codigo || ""],
    ["RESULTADO", estudante.resultadoFinal]
  ].forEach(([label, value]) => {
    const field = element("article");
    appendText(field, "span", label);
    appendText(field, "strong", value);
    alunoBox.append(field);
  });

  const body = element("div", "boletimExcelBody");
  const left = element("aside", "boletimTriColumn");
  [
    ["I TRIMESTRE", "18/30", mediaLocal(estudante.lancamentos.map((nota) => nota.notaT1))],
    ["II TRIMESTRE", "18/30", mediaLocal(estudante.lancamentos.map((nota) => nota.notaT2))],
    ["III TRIMESTRE", "24/40", mediaLocal(estudante.lancamentos.map((nota) => nota.notaT3))]
  ].forEach(([label, regra, media]) => {
    const card = element("article", "boletimTriCard");
    appendText(card, "span", label);
    appendText(card, "strong", formatarMedia(media));
    appendText(card, "small", `mín. ${regra}`);
    left.append(card);
  });

  const tableWrap = element("div", "responsiveTable boletimMatrixWrap");
  const table = document.createElement("table");
  table.className = "boletimMatrix";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  appendText(headerRow, "th", "LINHA", "boletimAxis");
  componentesPlanilha().forEach((componente) => {
    const header = appendText(headerRow, "th", codigoPlanilha(componente), "boletimComponentHeader");
    header.title = componente.nome;
  });
  thead.append(headerRow);

  const notaPorComponente = new Map(estudante.lancamentos.map((nota) => [nota.componenteId, nota]));
  const rows = [
    ["I TRIMESTRE · NOTA", (nota) => nota.notaT1],
    ["I TRIMESTRE · REC", (nota) => nota.recT1],
    ["II TRIMESTRE · NOTA", (nota) => nota.notaT2],
    ["II TRIMESTRE · REC", (nota) => nota.recT2],
    ["III TRIMESTRE · NOTA", (nota) => nota.notaT3],
    ["III TRIMESTRE · REC", (nota) => nota.recT3],
    ["TOTAL", (nota) => nota.total],
    ["NOTA NECESSÁRIA", (nota) => Math.max(0, 60 - Number(nota.total || 0))],
    ["FALTAS", (nota) => nota.faltas]
  ];
  const tbody = document.createElement("tbody");
  replaceChildren(tbody, rows.map(([label, getter]) => {
    const row = document.createElement("tr");
    appendText(row, "td", label, "boletimRowLabel");
    componentesPlanilha().forEach((componente) => {
      const nota = notaPorComponente.get(componente.id);
      const valor = nota ? getter(nota) : "";
      const cell = appendText(row, "td", typeof valor === "number" ? formatarMedia(valor) : String(valor), "boletimScoreCell");
      if (nota && Number(valor) > 0 && Number(valor) < 18 && !String(label).includes("FALTAS")) cell.classList.add("scoreLow");
    });
    return row;
  }));
  table.append(thead, tbody);
  tableWrap.append(table);

  const printedAt = element("div", "verticalDate");
  printedAt.textContent = "Emitido em 07/07/2026";
  body.append(left, tableWrap, printedAt);

  const footer = element("div", "boletimExcelFooter");
  appendText(footer, "strong", `Média final demonstrativa: ${formatarMedia(estudante.mediaFinal)}`);
  appendText(footer, "span", "Dados fictícios para validação visual. Não corresponde a boletim real.", "muted");

  page.append(top, titleBand, alunoBox, body, footer);
  replaceChildren(ui.boletimPreview, [hub, page]);
  renderFichaResumo(estudante);
  renderFilaBoletins(estudantesResumo);
}

function renderFichaResumo(estudante) {
  const criticos = estudante.lancamentos.filter((nota) => nota.notaFinal < 60).length;
  const page = element("article", "fichaPrintMini");
  const top = element("div", "fichaTop");
  const logo = element("img", "fichaLogo");
  logo.src = "../logo_escola.png";
  logo.alt = "";
  const topText = element("div");
  appendText(topText, "strong", "ESCOLA MUNICIPAL PROFª IÊDA ALVES DE OLIVEIRA");
  appendText(topText, "span", "Sistema CPM · Medeiros Neto - BA");
  appendText(topText, "small", "FICHA INDIVIDUAL DO ALUNO · 2026");
  top.append(logo, topText);

  const dados = element("div", "fichaFieldGrid");
  [
    ["ALUNO", estudante.nome],
    ["TURMA", estudante.turma?.nome || ""],
    ["CÓDIGO", estudante.codigo],
    ["MATRÍCULA", estudante.situacaoMatricula],
    ["RESULTADO", estudante.resultadoFinal],
    ["COMPONENTES ABAIXO DE 60", String(criticos)]
  ].forEach(([label, value]) => {
    const field = element("article");
    appendText(field, "span", label);
    appendText(field, "strong", value);
    dados.append(field);
  });

  const aproveitamento = element("div", "fichaSection");
  appendText(aproveitamento, "h3", "APROVEITAMENTO ANUAL");
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const head = document.createElement("tr");
  ["Comp.", "Total", "Rec.", "Final"].forEach((label) => appendText(head, "th", label));
  thead.append(head);
  const tbody = document.createElement("tbody");
  replaceChildren(tbody, estudante.lancamentos.map((nota) => {
    const row = document.createElement("tr");
    appendText(row, "td", codigoPlanilha(nota.componente));
    appendText(row, "td", formatarMedia(nota.total));
    appendText(row, "td", formatarMedia(nota.totalRec));
    const finalCell = appendText(row, "td", formatarMedia(nota.notaFinal));
    if (Number(nota.notaFinal) < 60) finalCell.classList.add("scoreLow");
    return row;
  }));
  table.append(thead, tbody);
  aproveitamento.append(table);

  const regime = element("div", "fichaRegime");
  [
    ["I TRI", "18/30"],
    ["II TRI", "18/30"],
    ["III TRI", "24/40"],
    ["TOTAL", "60/100"],
    ["DIAS LETIVOS", "200"],
    ["FALTAS", String(somar(estudante.lancamentos.map((nota) => nota.faltas)))]
  ].forEach(([label, value]) => {
    const item = element("article");
    appendText(item, "span", label);
    appendText(item, "strong", value);
    regime.append(item);
  });

  const footer = element("footer", "fichaFooter");
  footer.textContent = "MEDEIROS NETO - BA, 07/07/2026";
  page.append(top, dados, aproveitamento, regime, footer);
  replaceChildren(ui.fichaAlunoResumo, [page]);
}

function renderFilaBoletins(estudantesResumo) {
  replaceChildren(ui.listaBoletins, estudantesResumo.slice(0, 7).map((estudante) => {
    const item = element("article", "queueItem");
    appendText(item, "strong", estudante.nome);
    appendText(item, "p", `${estudante.turma?.codigo || ""} · média ${formatarMedia(estudante.mediaFinal)}`, "muted");
    item.append(chip(estudante.resultadoFinal, chipPorResultado(estudante.resultadoFinal)));
    return item;
  }));
}

function renderConselho(estudantesResumo) {
  const turma = obterTurmaAtiva(estudantesResumo);
  const estudantesTurma = estudantesResumo.filter((estudante) => estudante.turmaId === turma?.id);
  const candidatos = estudantesTurma.length ? estudantesTurma : estudantesResumo;
  const candidato = [...candidatos].sort((a, b) => a.mediaFinal - b.mediaFinal)[0];
  if (!candidato) {
    replaceChildren(ui.conselhoAlunoFoco, [emptyState("Nenhum aluno encontrado para conselho.")]);
    replaceChildren(ui.conselhoResumo, []);
    replaceChildren(ui.conselhoVotos, []);
    return;
  }

  const classSelector = element("div", "conselhoClassSelector");
  state.data.turmas.forEach((item) => {
    const chipButton = element("button", item.id === turma?.id ? "periodChip active" : "periodChip");
    chipButton.type = "button";
    chipButton.textContent = item.codigo;
    classSelector.append(chipButton);
  });

  const focus = element("div", "conselhoFocusStrip");
  appendText(focus, "span", "01", "caseNumber");
  const title = element("div");
  appendText(title, "p", "Aluno em foco", "sectionKicker");
  appendText(title, "h2", candidato.nome);
  appendText(title, "span", `${candidato.turma?.codigo || ""} · média ${formatarMedia(candidato.mediaFinal)} · ${candidato.resultadoFinal}`, "muted");
  focus.append(title, chip("Em deliberação", "warn"));

  const actions = element("div", "decisionGrid");
  [["Aprovar pelo conselho", "ok"], ["Reprovar pelo conselho", "error"], ["Manter em análise", "info"]].forEach(([label, type]) => {
    const button = element("button", `decisionButton ${type}`);
    button.type = "button";
    button.textContent = label;
    actions.append(button);
  });

  const paper = element("article", "conselhoReportPage");
  const paperTop = element("div", "conselhoReportTop");
  const logo = element("img", "conselhoLogo");
  logo.src = "../logo_escola.png";
  logo.alt = "";
  const stripes = element("div", "schoolStripes");
  ["", "", ""].forEach(() => stripes.append(element("span")));
  const school = element("div");
  appendText(school, "strong", "ESCOLA MUNICIPAL PROFª IÊDA ALVES DE OLIVEIRA - SCPM");
  appendText(school, "span", "RUA CLIDENOR DE OLIVEIRA, S/N · MEDEIROS NETO - BAHIA");
  appendText(school, "small", "(73) 99871-0105 · secretaria@escolaieda.com");
  paperTop.append(logo, stripes, school);

  const reportTitle = element("div", "conselhoReportTitle");
  appendText(reportTitle, "strong", "RELATÓRIO DE RESULTADO FINAL");
  appendText(reportTitle, "span", "2026", "conselhoYear");

  const reportTableWrap = element("div", "responsiveTable conselhoReportTable");
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const rowHead = document.createElement("tr");
  ["SITUAÇÃO", "ORDEM", turma?.nome || "TURMA", "APROVADO DIRETO", "AP CONSELHO ANO ANTERIOR", "APROVADO PELO CONSELHO EM 2026", "APROVADO PELA RECUPERAÇÃO", "NÃO COMPARECEU", "REPROVADO"].forEach((label, index) => {
    appendText(rowHead, "th", label, index > 2 ? "verticalTh" : "");
  });
  thead.append(rowHead);

  const linhas = Array.from({ length: Math.max(24, estudantesTurma.length) }, (_, index) => estudantesTurma[index] || null);
  const tbody = document.createElement("tbody");
  replaceChildren(tbody, linhas.map((estudante, index) => {
    const row = document.createElement("tr");
    const resultado = estudante?.resultadoFinal || "";
    appendText(row, "td", estudante ? rotuloSituacao(estudante.situacao) : "", "conselhoSituationCell");
    appendText(row, "td", String(index + 1), "conselhoOrderCell");
    appendText(row, "td", estudante?.nome || "", "conselhoNameCell");
    appendText(row, "td", resultado === "APROVADO DIRETO" ? "Sim" : "", "conselhoMarkCell");
    appendText(row, "td", "", "conselhoMarkCell");
    appendText(row, "td", estudante && estudante.mediaFinal >= 55 && estudante.mediaFinal < 60 ? "Sim" : "", "conselhoMarkCell");
    appendText(row, "td", resultado === "APROVADO PELA RECUPERAÇÃO" ? "Sim" : "", "conselhoMarkCell");
    appendText(row, "td", estudante && estudante.situacaoMatricula !== "ativo" ? "Sim" : "", "conselhoMarkCell");
    appendText(row, "td", estudante && estudante.mediaFinal < 50 ? "Sim" : "", "conselhoMarkCell");
    return row;
  }));
  table.append(thead, tbody);
  reportTableWrap.append(table);
  paper.append(paperTop, reportTitle, reportTableWrap);
  replaceChildren(ui.conselhoAlunoFoco, [classSelector, focus, actions, paper]);

  const abaixo = candidato.lancamentos.filter((nota) => nota.notaFinal < 60);
  const resumo = element("div", "summaryStack");
  [
    ["Média global", formatarMedia(candidato.mediaFinal), "info"],
    ["Disciplinas abaixo de 60", String(abaixo.length), abaixo.length ? "warn" : "ok"],
    ["Faltas", String(somar(candidato.lancamentos.map((nota) => nota.faltas))), "info"],
    ["Observação pedagógica", abaixo.length ? abaixo.map((nota) => nota.componente?.nome).slice(0, 3).join(", ") : "Sem alerta crítico", abaixo.length ? "warn" : "ok"]
  ].forEach(([label, value, type]) => {
    const card = element("article", "summaryItem");
    card.append(chip(label, type));
    appendText(card, "strong", value);
    resumo.append(card);
  });
  const resumoHeader = panelTitle("Resumo para decisão", "Conselho");
  replaceChildren(ui.conselhoResumo, [resumoHeader, resumo]);

  const votosHeader = panelTitle("Votos do conselho", "Simulação");
  const votos = element("div", "voteStack");
  [["Aprovar", 4, "ok"], ["Reprovar", 2, "error"], ["Abstenções", 1, "warn"]].forEach(([label, value, type]) => {
    const item = element("article", "voteItem");
    appendText(item, "span", label);
    item.append(progressTrack(value * 18, type));
    appendText(item, "strong", String(value));
    votos.append(item);
  });
  replaceChildren(ui.conselhoVotos, [votosHeader, votos]);
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
    appendText(item, "p", `${estudante.turma?.codigo || ""} · média ${formatarMedia(estudante.mediaFinal)}`, "muted");
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
    appendText(box, "p", `${item.professor} · início ${formatarData(item.inicio)}`, "muted");
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
  appendText(header, "p", `${estudante.turma?.nome || "Turma"} · ${estudante.resultadoFinal}`, "muted");
  header.append(chip(rotuloSituacao(estudante.situacao), estudante.situacao === "regular" ? "ok" : estudante.situacao === "atencao" ? "warn" : "error"));

  const cards = estudante.lancamentos.map((lancamento) => {
    const card = element("article", "studentMiniCard");
    appendText(card, "strong", lancamento.componente?.nome || lancamento.componenteId);
    appendText(card, "p", `T1 ${formatarMedia(lancamento.notaT1)} · T2 ${formatarMedia(lancamento.notaT2)} · T3 ${formatarMedia(lancamento.notaT3)}`, "muted");
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
  ui.systemBanner.style.borderColor = type === "error" ? "#513148" : type === "ok" ? "#285c4e" : "#604f2a";
  ui.systemBanner.style.background = type === "error" ? "#211526" : type === "ok" ? "#112a29" : "#211d14";
}

function preencherSelect(select, options) {
  replaceChildren(select, options.map(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  }));
}

function panelTitle(title, kicker) {
  const header = element("div", "panelHeader");
  const text = element("div");
  appendText(text, "p", kicker, "sectionKicker");
  appendText(text, "h2", title);
  header.append(text);
  return header;
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

function obterTurmaAtiva(estudantesResumo) {
  if (state.filters.turma !== "todas") {
    return state.data.turmas.find((turma) => turma.id === state.filters.turma) || estudantesResumo[0]?.turma || state.data.turmas[0];
  }
  return estudantesResumo[0]?.turma || state.data.turmas[0];
}

function componentesPlanilha() {
  const ordem = ["P", "M", "C", "G", "H", "A", "R", "EF", "I", "ER", "PV", "EO"];
  const posicao = new Map(ordem.map((codigo, index) => [codigo, index]));
  return [...state.data.componentes].sort((a, b) => (posicao.get(a.codigo) ?? 99) - (posicao.get(b.codigo) ?? 99));
}

function codigoPlanilha(componente = {}) {
  return {
    P: "P",
    M: "M",
    C: "C",
    G: "G",
    H: "H",
    A: "A",
    R: "RL",
    EF: "F",
    I: "I",
    ER: "RD",
    PV: "ET",
    EO: "CPT"
  }[componente?.codigo] || componente?.codigo || "";
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

function somar(lista) {
  return lista.reduce((total, valor) => total + Number(valor || 0), 0);
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
