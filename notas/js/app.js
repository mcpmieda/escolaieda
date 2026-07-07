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
  dashboard: ["Movimento estatístico trimestral", "Desempenho da turma por componente, ranking e síntese do I trimestre."],
  banco: ["Banco de notas", "Quadro trimestral compacto com todas as notas visíveis na tela."],
  estudantes: ["Alunos", "Consulta operacional por turma, média, situação e resultado final."],
  boletins: ["Boletim", "Configuração de impressão e prévia fiel ao boletim atual do banco de notas."],
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
  abrirView(initialView || state.currentView);
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
  document.body.dataset.view = view;
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
  const turmaAtiva = obterTurmaAtiva(estudantesResumo);
  const estudantesDaTurma = estudantesResumo.filter((estudante) => estudante.turmaId === turmaAtiva?.id);
  const contextoEstudantes = estudantesDaTurma.length ? estudantesDaTurma : estudantesResumo;
  const lancamentosFiltrados = estudantesResumo.flatMap((estudante) => estudante.lancamentos);
  const lancamentosTurma = contextoEstudantes.flatMap((estudante) => estudante.lancamentos);
  const resumoTurma = calcularResumoGeral({
    ...state.data,
    estudantes: contextoEstudantes.map(({ turma, lancamentos, ...estudante }) => estudante),
    lancamentos: lancamentosTurma
  });

  renderContextoClasse(estudantesResumo, turmasResumo);
  renderHero(resumoTurma, [turmaAtiva].filter(Boolean));
  renderMetrics(resumoTurma);
  renderDashboardDisciplinas(contextoEstudantes);
  renderRanking(contextoEstudantes);
  renderDonut(resumoTurma);
  renderTrimestres(lancamentosTurma);
  renderMapaAproveitamento(turmasResumo);
  renderQuadroAproveitamento(contextoEstudantes);
  renderBancoNotas(contextoEstudantes);
  renderPainelAproveitamento(contextoEstudantes);
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
    ["Acima ou igual à média", resumo.regular + resumo.atencao, `${Math.round(((resumo.regular + resumo.atencao) / total) * 100)}%`, "accentMint"],
    ["Abaixo da média", resumo.critico, `${Math.round((resumo.critico / total) * 100)}%`, "accentCoral"],
    ["Alunos na turma", resumo.totalEstudantes, "100%", "accentBlue"],
    ["Média geral da turma", formatarMedia(resumo.mediaGeral), "Bom", "accentAmber"]
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
  const componentes = ordenarComponentesResumo(resumirComponentes(state.data, estudantesResumo));
  const total = Math.max(1, estudantesResumo.length);
  const chart = element("div", "disciplineChart");
  const plot = element("div", "disciplineChartPlot");
  componentes.forEach((componente) => {
    const acima = Math.max(0, componente.regular + componente.atencao);
    const abaixo = Math.max(0, componente.critico);
    const column = element("article", "disciplineColumn");
    const bars = element("div", "disciplineColumnBars");
    const aboveBar = element("span", "aboveBar");
    aboveBar.style.setProperty("--height", `${Math.max(8, (acima / total) * 100)}%`);
    aboveBar.dataset.value = String(acima);
    const belowBar = element("span", "belowBar");
    belowBar.style.setProperty("--height", `${Math.max(abaixo ? 8 : 0, (abaixo / total) * 100)}%`);
    belowBar.dataset.value = String(abaixo);
    bars.append(aboveBar, belowBar);
    const label = element("footer");
    appendText(label, "strong", codigoPlanilha(componente));
    appendText(label, "span", componente.nome);
    column.append(bars, label);
    plot.append(column);
  });

  const legend = element("div", "disciplineLegend");
  legend.append(chip("Acima ou igual à média", "info"), chip("Abaixo da média", "error"));
  const foot = element("div", "disciplineChartFoot");
  appendText(foot, "span", "I trimestre: mínimo de 18 pontos para alcançar a média. Máximo de 30 pontos.", "muted");
  chart.append(legend, plot, foot);
  replaceChildren(ui.dashboardDisciplinas, [chart]);
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
  if (!ui.matrizBancoNotas) return;
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
  if (!ui.painelAproveitamento) return;
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
  if (!ui.boletimPreview) return;
  if (!estudante) {
    replaceChildren(ui.boletimPreview, [emptyState("Nenhum aluno encontrado para os filtros atuais.")]);
    if (ui.fichaAlunoResumo) replaceChildren(ui.fichaAlunoResumo, []);
    if (ui.listaBoletins) replaceChildren(ui.listaBoletins, []);
    return;
  }

  const controls = element("div", "boletimControls");
  controls.append(
    controlGroup("Impressão", [
      controlButton("Imprimir", "primaryButton compactButton"),
      controlToggle("Preto e branco", false),
      controlToggle("Colorido", true),
      controlToggle("Ocultar IIº tri", false),
      controlToggle("Ocultar IIIº tri", false)
    ]),
    controlGroup("Geração", [
      controlButton("Gerar", "primaryButton compactButton"),
      controlButton("Gerar com foto", "secondaryButton compactButton"),
      controlButton("Aplicar foto", "secondaryButton compactButton dangerText")
    ]),
    controlGroup("Situações", [
      controlToggle("Em curso", true),
      controlToggle("Aprovado direto", true),
      controlToggle("Aprovado pelo conselho", false),
      controlToggle("Aprovado pela recuperação", false),
      controlToggle("Reprovado", false),
      controlToggle("Transferido", false)
    ])
  );

  const info = element("div", "boletimInfoPanel");
  const infoTitle = element("div", "boletimInfoTitle");
  appendText(infoTitle, "p", "Informações e recados", "sectionKicker");
  appendText(infoTitle, "h2", "Textos do boletim");
  const fields = element("div", "boletimFieldGrid");
  fields.append(
    fieldControl("Título do boletim", "Aproveitamento Escolar 2026"),
    fieldControl("Data de impressão", "07/07/2026"),
    fieldControl("Recado", "ATENÇÃO: O período de férias escolares será de 20/07/2026 a 31/07/2026. Retorno em 03/08/2026"),
    fieldControl("Rodapé", "I TRIMESTRE: mínimo de 18 pontos necessários para alcançar a média e máximo de 30 pontos.")
  );
  info.append(infoTitle, fields);

  const previewPanel = element("section", "reportPreviewPanel");
  const previewHeader = element("div", "previewHeader");
  const previewTitle = element("div");
  appendText(previewTitle, "p", "Prévia do relatório", "sectionKicker");
  appendText(previewTitle, "h2", "Boletim no padrão atual do Excel");
  const previewActions = element("div", "previewActions");
  ["−", "100%", "+", "Tela cheia", "Download PDF"].forEach((label) => {
    const button = element("button", label === "100%" ? "secondaryButton compactButton scaleButton" : "secondaryButton compactButton");
    button.type = "button";
    button.textContent = label;
    previewActions.append(button);
  });
  previewHeader.append(previewTitle, previewActions);

  const page = element("article", "boletimPrintExact");
  const topBand = element("header", "boletimExactTop");
  appendText(topBand, "strong", "ESCOLA MUN. PROFª IÊDA ALVES DE OLIVEIRA MCPM ★ ★ ★ ★ ★");
  const blueBand = element("div", "boletimExactBlue");

  const content = element("div", "boletimExactContent");
  const left = element("aside", "boletimExactPercent");
  [
    ["I TRIMESTRE", "0%"],
    ["II TRIMESTRE", "0%"],
    ["III TRIMESTRE", "0%"]
  ].forEach(([label, value]) => {
    const card = element("article");
    appendText(card, "span", label);
    appendText(card, "strong", value);
    left.append(card);
  });
  appendText(left, "b", "-", "boletimPercentDash");

  const tableWrap = element("div", "boletimExactTableWrap");
  const table = document.createElement("table");
  table.className = "boletimExactTable";
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  appendText(headerRow, "th", "APROVEITAMENTO ESCOLAR 2026", "boletimExactTitleCell");
  appendText(headerRow, "th", "", "boletimSmallHeader");
  componentesBoletim().forEach((componente) => {
    appendText(headerRow, "th", rotuloComponenteBoletim(componente), "boletimExactVertical");
  });
  appendText(headerRow, "th", "", "boletimBlankHeader");
  thead.append(headerRow);
  const body = document.createElement("tbody");
  [
    ["I TRIMESTRE", "NOTA"],
    ["", "REC"],
    ["II TRIMESTRE", "NOTA"],
    ["", "REC"],
    ["III TRIMESTRE", "NOTA"],
    ["", "REC"],
    ["NOTA NECESSÁRIA", ""]
  ].forEach(([periodo, tipo]) => {
    const row = document.createElement("tr");
    appendText(row, "td", periodo, periodo === "NOTA NECESSÁRIA" ? "boletimNeedCell" : "boletimPeriodCell");
    appendText(row, "td", tipo, "boletimTypeCell");
    componentesBoletim().forEach(() => appendText(row, "td", "-", "boletimDashCell"));
    appendText(row, "td", "", "boletimBlankCell");
    body.append(row);
  });
  table.append(thead, body);
  tableWrap.append(table);

  const verticalDate = element("div", "boletimExactDate");
  verticalDate.textContent = "DOCUMENTO IMPRESSO EM 07/07/2026";
  const pageNumber = element("div", "boletimExactNumber");
  pageNumber.textContent = "Nº 01";
  content.append(left, tableWrap, verticalDate, pageNumber);

  const notice = element("div", "boletimNotice");
  notice.textContent = "ATENÇÃO: O PERÍODO DE FÉRIAS ESCOLARES SERÁ DE 20/07/2026 A 31/07/2026. RETORNO EM 03/08/2026";
  const foot = element("footer", "boletimExactFoot");
  foot.textContent = "I TRIMESTRE: MÍNIMO DE 18 PONTOS NECESSÁRIOS PARA ALCANÇAR A MÉDIA E MÁXIMO DE 30 PONTOS";
  page.append(topBand, blueBand, content, notice, foot);
  previewPanel.append(previewHeader, page);

  replaceChildren(ui.boletimPreview, [controls, info, previewPanel]);
  renderFichaResumo(estudante);
  renderFilaBoletins(estudantesResumo);
}

function renderFichaResumo(estudante) {
  if (!ui.fichaAlunoResumo) return;
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
  if (!ui.listaBoletins) return;
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

function componentesBoletim() {
  const ordem = ["P", "M", "C", "G", "H", "A", "ER", "EF", "I", "R", "PV", "EO"];
  const posicao = new Map(ordem.map((codigo, index) => [codigo, index]));
  return [...state.data.componentes].sort((a, b) => (posicao.get(a.codigo) ?? 99) - (posicao.get(b.codigo) ?? 99));
}

function ordenarComponentesResumo(componentes) {
  const ordem = ["P", "M", "C", "G", "H", "A", "R", "EF", "I", "ER", "PV", "EO"];
  const posicao = new Map(ordem.map((codigo, index) => [codigo, index]));
  return [...componentes].sort((a, b) => (posicao.get(a.codigo) ?? 99) - (posicao.get(b.codigo) ?? 99));
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

function rotuloComponenteBoletim(componente = {}) {
  return {
    P: "LÍNGUA PORTUGUESA",
    M: "MATEMÁTICA",
    C: "CIÊNCIAS",
    G: "GEOGRAFIA",
    H: "HISTÓRIA",
    A: "ARTES",
    EF: "EDUCAÇÃO FÍSICA",
    I: "INGLÊS",
    ER: "RELIGIÃO",
    R: "REDAÇÃO",
    PV: "ÉTICA",
    EO: "COMPUTAÇÃO"
  }[componente?.codigo] || componente?.nome || "";
}

function controlGroup(title, controls) {
  const group = element("section", "controlGroup");
  appendText(group, "h2", title);
  const body = element("div", "controlGroupBody");
  body.append(...controls);
  group.append(body);
  return group;
}

function controlButton(label, className) {
  const button = element("button", className);
  button.type = "button";
  button.textContent = label;
  return button;
}

function controlToggle(label, checked) {
  const wrapper = element("label", "controlToggle");
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  wrapper.append(input, textNode(label));
  return wrapper;
}

function fieldControl(label, value) {
  const wrapper = element("label", "fieldControl");
  appendText(wrapper, "span", label);
  const input = document.createElement("input");
  input.value = value;
  wrapper.append(input);
  return wrapper;
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
