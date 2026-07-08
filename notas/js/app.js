import { demoData } from "./demo-data.js";
import {
  calcularResumoGeral,
  formatarMedia,
  listarEstudantesComResumo,
  normalizarTexto,
  resumirEtapas,
  resumirTurmas
} from "./domain.js";

const componentes = [
  { source: "P", codigo: "P", nome: "Língua Portuguesa" },
  { source: "M", codigo: "M", nome: "Matemática" },
  { source: "C", codigo: "C", nome: "Ciências" },
  { source: "G", codigo: "G", nome: "Geografia" },
  { source: "H", codigo: "H", nome: "História" },
  { source: "A", codigo: "A", nome: "Artes" },
  { source: "ER", codigo: "RL", nome: "Ensino Religioso" },
  { source: "EF", codigo: "F", nome: "Educação Física" },
  { source: "I", codigo: "I", nome: "Inglês" },
  { source: "R", codigo: "RD", nome: "Redação" },
  { source: "PV", codigo: "ET", nome: "Ética e Cidadania" },
  { source: "EO", codigo: "CPT", nome: "Computação" }
];

const movimentoReferencia = {
  totalAlunos: 20,
  acima: 13,
  abaixo: 7,
  mediaGeral: "22,6",
  atualizado: "07/07/2026 às 10:45",
  componentes: [
    { codigo: "P", nome: "Português", acima: 20, abaixo: 0, icon: "book" },
    { codigo: "M", nome: "Matemática", acima: 20, abaixo: 0, icon: "sigma" },
    { codigo: "C", nome: "Ciências", acima: 20, abaixo: 0, icon: "flask" },
    { codigo: "G", nome: "Geografia", acima: 19, abaixo: 1, icon: "globe" },
    { codigo: "H", nome: "História", acima: 17, abaixo: 3, icon: "columns" },
    { codigo: "A", nome: "Artes", acima: 20, abaixo: 0, icon: "palette" },
    { codigo: "EF", nome: "Ed. Física", acima: 20, abaixo: 0, icon: "runner" },
    { codigo: "I", nome: "Inglês", acima: 20, abaixo: 0, icon: "letters" },
    { codigo: "RD", nome: "Redação", acima: 20, abaixo: 0, icon: "pencil" },
    { codigo: "ET", nome: "Ética", acima: 20, abaixo: 0, icon: "scales" },
    { codigo: "CPT", nome: "Computação", acima: 20, abaixo: 0, icon: "monitor" }
  ],
  ranking: [
    { nome: "CARLOS EDUARDO VIANA MOREIRA", media: "25,6" },
    { nome: "ISABELLY FERNANDA DO VALE FERREIRA", media: "25,6" },
    { nome: "AYALA DE OLIVEIRA RAPOSA", media: "25,3" }
  ]
};

const periodos = {
  T1: { rotulo: "I trimestre", curto: "I TRI.", campo: "notaT1", maximo: 30, minimo: 18 },
  T2: { rotulo: "II trimestre", curto: "II TRI.", campo: "notaT2", maximo: 30, minimo: 18 },
  T3: { rotulo: "III trimestre", curto: "III TRI.", campo: "notaT3", maximo: 40, minimo: 24 },
  geral: { rotulo: "Visão geral", curto: "GERAL", campo: "notaFinal", maximo: 100, minimo: 60 },
  recuperacao: { rotulo: "Recuperação", curto: "REC.", campo: "totalRec", maximo: 100, minimo: 60 }
};

const statusOperacionais = {
  regular: { rotulo: "Regular", classe: "ok" },
  transferido: { rotulo: "Transferido", classe: "warn" },
  desistente: { rotulo: "Desistente", classe: "error" },
  especial: { rotulo: "Especial", classe: "info" },
  foi_para: { rotulo: "Foi para...", classe: "violet" },
  estava_no: { rotulo: "Estava no...", classe: "mutedChip" }
};

const viewCopy = {
  movimento: [
    "Estatísticas",
    "Movimento estatístico escolar por turma e período."
  ],
  notas: [
    "Notas",
    "Banco de notas compacto por turma, com filtros de situação e perfil do aluno."
  ],
  boletim: [
    "Boletim",
    "Configuração de impressão com quatro boletins por A4, recados, data e situações."
  ]
};

const viewAliases = {
  dashboard: "movimento",
  turma: "movimento",
  banco: "notas",
  boletins: "boletim"
};

const estudantesResumo = listarEstudantesComResumo(demoData);

const state = {
  view: viewFromHash() || "movimento",
  theme: localStorage.getItem("notas-theme") || "aurora",
  search: "",
  movimento: {
    turma: "turma-demo-8c",
    periodo: "T1",
    rankingExpandido: false
  },
  notas: {
    turma: "turma-demo-8c",
    periodo: "T1",
    situacoes: new Set(Object.keys(statusOperacionais))
  },
  boletim: {
    turma: "turma-demo-8c",
    busca: "",
    modo: "colorido",
    titulo: "BOLETIM ESCOLAR 2026",
    data: dataInputHoje(),
    recado: "Procure a secretaria em caso de dúvida sobre o resultado.",
    rodape: "Escola Municipal Profª Iêda Alves de Oliveira - Medeiros Neto - BA",
    situacoes: new Set(["APROVADO DIRETO", "APROVADO PELA RECUPERAÇÃO", "EM ACOMPANHAMENTO"])
  }
};

const ui = {
  viewTitle: document.getElementById("viewTitle"),
  viewSubtitle: document.getElementById("viewSubtitle"),
  globalSearch: document.getElementById("globalSearch"),
  profileButton: document.getElementById("btnProfile"),
  profileMenu: document.getElementById("profileMenu"),
  logout: document.getElementById("btnLogout"),
  movimentoTurma: document.getElementById("movimentoTurma"),
  movimentoPeriodo: document.getElementById("movimentoPeriodo"),
  movementClassLabel: document.getElementById("movementClassLabel"),
  movementStats: document.getElementById("movementStats"),
  movementChart: document.getElementById("movementChart"),
  movementDonut: document.getElementById("movementDonut"),
  movementRanking: document.getElementById("movementRanking"),
  movementClassPanel: document.getElementById("movementClassPanel"),
  movementClassCards: document.getElementById("movementClassCards"),
  movementDisciplineHint: document.getElementById("movementDisciplineHint"),
  notasTurma: document.getElementById("notasTurma"),
  notasPeriodo: document.getElementById("notasPeriodo"),
  notasStatusFilters: document.getElementById("notasStatusFilters"),
  notasTitulo: document.getElementById("notasTitulo"),
  notesClassLabel: document.getElementById("notesClassLabel"),
  notesTableTitle: document.getElementById("notesTableTitle"),
  notesSummary: document.getElementById("notesSummary"),
  notasCabecalho: document.getElementById("notasCabecalho"),
  notasTabela: document.getElementById("notasTabela"),
  notesMetricStrip: document.getElementById("notesMetricStrip"),
  notasInsights: document.getElementById("notasInsights"),
  notasRecovery: document.getElementById("notasRecovery"),
  boletimTurma: document.getElementById("boletimTurma"),
  boletimBuscaAluno: document.getElementById("boletimBuscaAluno"),
  boletimTituloInput: document.getElementById("boletimTituloInput"),
  boletimDataInput: document.getElementById("boletimDataInput"),
  boletimModoCor: document.getElementById("boletimModoCor"),
  boletimRecadoInput: document.getElementById("boletimRecadoInput"),
  boletimRodapeInput: document.getElementById("boletimRodapeInput"),
  boletimSituacaoDireto: document.getElementById("boletimSituacaoDireto"),
  boletimSituacaoRec: document.getElementById("boletimSituacaoRec"),
  boletimSituacaoAcomp: document.getElementById("boletimSituacaoAcomp"),
  boletimCount: document.getElementById("boletimCount"),
  boletimA4Preview: document.getElementById("boletimA4Preview"),
  studentProfilePanel: document.getElementById("studentProfilePanel"),
  studentProfileTitle: document.getElementById("studentProfileTitle"),
  studentProfileContent: document.getElementById("studentProfileContent"),
  studentProfileClose: document.getElementById("studentProfileClose")
};

initialize();

function initialize() {
  preencherSelects();
  aplicarTema(state.theme);
  bindEvents();
  abrirView(state.view, false);
  ui.boletimDataInput.value = state.boletim.data;
  renderAll();
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => abrirView(button.dataset.view));
  });

  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.addEventListener("click", () => aplicarTema(button.dataset.theme));
  });

  ui.globalSearch.addEventListener("input", () => {
    state.search = ui.globalSearch.value;
    renderAll();
  });

  ui.profileButton.addEventListener("click", () => {
    const expanded = ui.profileButton.getAttribute("aria-expanded") === "true";
    ui.profileButton.setAttribute("aria-expanded", String(!expanded));
    ui.profileMenu.hidden = expanded;
  });

  ui.logout.addEventListener("click", () => {
    ui.profileMenu.hidden = true;
    ui.profileButton.setAttribute("aria-expanded", "false");
  });

  ui.movimentoTurma.addEventListener("change", () => {
    state.movimento.turma = ui.movimentoTurma.value;
    renderMovimento();
  });
  ui.movimentoPeriodo.addEventListener("change", () => {
    state.movimento.periodo = ui.movimentoPeriodo.value;
    renderMovimento();
  });

  ui.notasTurma.addEventListener("change", () => {
    state.notas.turma = ui.notasTurma.value;
    renderNotas();
  });
  ui.notasPeriodo.addEventListener("change", () => {
    state.notas.periodo = ui.notasPeriodo.value;
    renderNotas();
  });
  ui.notasStatusFilters.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.addEventListener("change", () => {
      state.notas.situacoes = new Set([...ui.notasStatusFilters.querySelectorAll("input:checked")].map((item) => item.value));
      renderNotas();
    });
  });

  ui.boletimTurma.addEventListener("change", () => {
    state.boletim.turma = ui.boletimTurma.value;
    renderBoletim();
  });
  ui.boletimBuscaAluno.addEventListener("input", () => {
    state.boletim.busca = ui.boletimBuscaAluno.value;
    renderBoletim();
  });
  ui.boletimTituloInput.addEventListener("input", () => {
    state.boletim.titulo = ui.boletimTituloInput.value;
    renderBoletim();
  });
  ui.boletimDataInput.addEventListener("change", () => {
    state.boletim.data = ui.boletimDataInput.value;
    renderBoletim();
  });
  ui.boletimModoCor.addEventListener("change", () => {
    state.boletim.modo = ui.boletimModoCor.value;
    renderBoletim();
  });
  ui.boletimRecadoInput.addEventListener("input", () => {
    state.boletim.recado = ui.boletimRecadoInput.value;
    renderBoletim();
  });
  ui.boletimRodapeInput.addEventListener("input", () => {
    state.boletim.rodape = ui.boletimRodapeInput.value;
    renderBoletim();
  });
  [ui.boletimSituacaoDireto, ui.boletimSituacaoRec, ui.boletimSituacaoAcomp].forEach((input) => {
    input.addEventListener("change", () => {
      state.boletim.situacoes = new Set([
        ui.boletimSituacaoDireto.checked ? "APROVADO DIRETO" : "",
        ui.boletimSituacaoRec.checked ? "APROVADO PELA RECUPERAÇÃO" : "",
        ui.boletimSituacaoAcomp.checked ? "EM ACOMPANHAMENTO" : ""
      ].filter(Boolean));
      renderBoletim();
    });
  });

  document.getElementById("movementPrint").addEventListener("click", () => window.print());
  document.getElementById("boletimPrint").addEventListener("click", () => window.print());
  ui.studentProfileClose.addEventListener("click", fecharPerfilAluno);

  window.addEventListener("hashchange", () => {
    const view = viewFromHash();
    if (view) abrirView(view, false);
  });
}

function preencherSelects() {
  const opcoesTurma = [
    ["todas", "Todas as turmas"],
    ...demoData.turmas.map((turma) => [turma.id, turma.codigo])
  ];
  const opcoesMovimento = demoData.turmas.map((turma) => [turma.id, turmaTituloAcademico(turma).toUpperCase()]);
  preencherSelect(ui.movimentoTurma, opcoesMovimento);
  preencherSelect(ui.notasTurma, opcoesTurma);
  preencherSelect(ui.boletimTurma, opcoesTurma);
  ui.movimentoTurma.value = state.movimento.turma;
  ui.movimentoPeriodo.value = state.movimento.periodo;
  ui.notasTurma.value = state.notas.turma;
  ui.notasPeriodo.value = state.notas.periodo;
  ui.boletimTurma.value = state.boletim.turma;
}

function aplicarTema(theme) {
  state.theme = theme || "aurora";
  document.body.dataset.theme = state.theme;
  localStorage.setItem("notas-theme", state.theme);
  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === state.theme);
  });
}

function abrirView(view, updateHash = true) {
  const destino = viewAliases[view] || view;
  if (!viewCopy[destino]) return;
  state.view = destino;
  document.body.dataset.view = destino;
  document.querySelectorAll(".pageView").forEach((section) => {
    section.classList.toggle("active", section.id === `view-${destino}`);
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === destino);
  });
  const [title, subtitle] = viewCopy[destino];
  document.title = `${title} | Escola Iêda MCPM`;
  ui.viewTitle.textContent = "Escola Municipal";
  ui.viewSubtitle.textContent = "Sistema Acadêmico";
  if (updateHash) history.replaceState(null, "", `#${destino}`);
}

function renderAll() {
  renderMovimento();
  renderNotas();
  renderBoletim();
}

function renderMovimento() {
  ui.movementClassLabel.textContent = "Acompanhe o desempenho geral da turma por disciplina no período selecionado.";
  renderMovementStats();
  renderMovementChart();
  renderMovementDonut();
  renderMovementRanking();
  renderClassResults();
}

function renderMovementStats() {
  const percentualAcima = Math.round((movimentoReferencia.acima / movimentoReferencia.totalAlunos) * 100);
  const percentualAbaixo = Math.round((movimentoReferencia.abaixo / movimentoReferencia.totalAlunos) * 100);
  replaceChildren(ui.movementStats, [
    movementStatCard("trendUp", "ACIMA OU IGUAL À MÉDIA", movimentoReferencia.acima, `${percentualAcima}%`, "ok"),
    movementStatCard("trendDown", "ABAIXO DA MÉDIA", movimentoReferencia.abaixo, `${percentualAbaixo}%`, "error"),
    movementStatCard("users", "ALUNOS NA TURMA", movimentoReferencia.totalAlunos, "100%", "info"),
    movementStatCard("star", "MÉDIA GERAL DA TURMA", movimentoReferencia.mediaGeral, "Bom", "ok")
  ]);
}

function movementStatCard(iconName, label, value, badge, type) {
  const card = element("article", `movementStatCard ${type}`);
  card.append(movementIcon(iconName));
  const body = element("div", "movementStatBody");
  appendText(body, "span", label);
  const line = element("div", "movementStatValue");
  appendText(line, "strong", String(value));
  appendText(line, "small", badge, `movementStatBadge ${type}`);
  body.append(line);
  card.append(body);
  return card;
}

function renderMovementChart() {
  const maxAltura = 25;
  const chart = element("div", "movementBars");

  movimentoReferencia.componentes.forEach((componente) => {
    const button = element("button", "movementBar");
    button.type = "button";
    button.dataset.codigo = componente.codigo;
    button.dataset.nome = componente.nome;

    const bars = element("span", "barPair");
    const blue = element("i", "barBlue");
    blue.style.setProperty("--bar-height", `${Math.max(6, (componente.acima / maxAltura) * 100)}%`);
    blue.dataset.value = String(componente.acima);
    const red = element("i", "barRed");
    red.style.setProperty("--bar-height", `${componente.abaixo ? Math.max(6, (componente.abaixo / maxAltura) * 100) : 0}%`);
    red.dataset.value = String(componente.abaixo);
    red.classList.toggle("isZero", componente.abaixo === 0);
    bars.append(blue, red);

    const label = element("span", "barLabel");
    label.append(movementIcon(componente.icon));
    appendText(label, "strong", componente.codigo);
    appendText(label, "small", componente.nome);
    button.append(bars, label);
    button.addEventListener("click", () => {
      ui.movementDisciplineHint.textContent = `${componente.nome}: ${componente.abaixo} aluno(s) abaixo da média.`;
    });
    chart.append(button);
  });

  const yAxis = element("div", "statsYAxis");
  [25, 20, 15, 10, 5, 0].forEach((valor) => appendText(yAxis, "span", String(valor)));
  const canvas = element("div", "statsChartCanvas");
  canvas.append(yAxis, chart);
  replaceChildren(ui.movementChart, [canvas]);
}

function renderMovementDonut() {
  const percentual = Math.round((movimentoReferencia.acima / movimentoReferencia.totalAlunos) * 100);
  const percentualAbaixo = 100 - percentual;
  const panel = document.createDocumentFragment();
  const header = element("div", "statsPanelHeader compact");
  const title = element("div", "statsPanelTitle");
  appendText(title, "h3", "DESEMPENHO GERAL DA TURMA  ⓘ");
  header.append(title);

  const body = element("div", "statsDonutBody");
  const left = element("div", "statsDonutLegend left");
  appendText(left, "span", `${movimentoReferencia.abaixo} alunos`);
  appendText(left, "strong", `${percentualAbaixo}%`);
  appendText(left, "small", "Abaixo da média");
  left.prepend(dot("red"));

  const donut = element("div", "donutMeter");
  donut.style.setProperty("--percent", `${percentual}%`);
  appendText(donut, "strong", `${percentual}%`);
  appendText(donut, "span", "ACIMA OU IGUAL À MÉDIA");

  const right = element("div", "statsDonutLegend right");
  appendText(right, "span", `${movimentoReferencia.acima} alunos`);
  appendText(right, "strong", `${percentual}%`);
  appendText(right, "small", "Acima ou igual à média");
  right.prepend(dot("blue"));
  body.append(left, donut, right);

  const note = element("div", "statsDonutNote");
  note.append(movementIcon("users"));
  appendText(note, "span", `Dos ${movimentoReferencia.totalAlunos} alunos, ${movimentoReferencia.acima} ficaram com nota igual ou acima da média em todas as disciplinas.`);

  panel.append(header, body, note);
  replaceChildren(ui.movementDonut, [panel]);
}

function renderMovementRanking() {
  const header = element("div", "statsRankingHeader");
  header.append(movementIcon("trophy"));
  appendText(header, "h3", "DESTAQUES DA TURMA");
  const list = element("div", "rankingList");
  movimentoReferencia.ranking.forEach((estudante, index) => {
    const item = element("article", "rankingItem");
    appendText(item, "span", String(index + 1), `rankBadge rank${Math.min(index + 1, 3)}`);
    const text = element("div");
    appendText(text, "strong", estudante.nome);
    appendText(item, "b", estudante.media);
    item.insertBefore(text, item.lastChild);
    list.append(item);
  });
  const button = element("button", "statsRankingLink");
  button.type = "button";
  button.innerHTML = "<span>VER RANKING COMPLETO</span><b aria-hidden=\"true\">›</b>";
  button.addEventListener("click", () => {
    state.movimento.rankingExpandido = !state.movimento.rankingExpandido;
  });
  replaceChildren(ui.movementRanking, [header, list, button]);
}

function renderClassResults() {
  ui.movementClassPanel.hidden = true;
  replaceChildren(ui.movementClassCards, []);
}

function dot(type) {
  return element("i", `legendDot ${type}`);
}

function movementIcon(name) {
  const paths = {
    trendUp: '<path d="m4 16 5-5 4 4 7-8"></path><path d="M15 7h5v5"></path>',
    trendDown: '<path d="m4 8 5 5 4-4 7 8"></path><path d="M15 17h5v-5"></path>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
    star: '<path d="m12 3 2.9 5.88 6.5.95-4.7 4.58 1.1 6.47L12 17.82l-5.8 3.06 1.1-6.47-4.7-4.58 6.5-.95z"></path>',
    trophy: '<path d="M8 21h8"></path><path d="M12 17v4"></path><path d="M7 4h10v5a5 5 0 0 1-10 0z"></path><path d="M5 5H3v2a4 4 0 0 0 4 4"></path><path d="M19 5h2v2a4 4 0 0 1-4 4"></path>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H11V5H6.5A2.5 2.5 0 0 0 4 7.5z"></path><path d="M20 19.5A2.5 2.5 0 0 0 17.5 17H13V5h4.5A2.5 2.5 0 0 1 20 7.5z"></path><path d="M11 5v12"></path><path d="M13 5v12"></path>',
    sigma: '<path d="M18 5H7l6 7-6 7h11"></path>',
    flask: '<path d="M9 3h6"></path><path d="M10 3v5l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V3"></path><path d="M8 15h8"></path>',
    globe: '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3a14 14 0 0 1 0 18"></path><path d="M12 3a14 14 0 0 0 0 18"></path>',
    columns: '<path d="M4 21h16"></path><path d="M6 18V9"></path><path d="M10 18V9"></path><path d="M14 18V9"></path><path d="M18 18V9"></path><path d="M3 8l9-5 9 5z"></path>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 1.4-3.4l-.5-.5A2 2 0 0 1 15.8 14H17a4 4 0 0 0 0-8z"></path><circle cx="7.5" cy="10" r="1"></circle><circle cx="10.5" cy="7.5" r="1"></circle><circle cx="14.5" cy="8" r="1"></circle>',
    runner: '<circle cx="13" cy="4" r="2"></circle><path d="m6 21 3-6"></path><path d="m9 15 3-5 4 2 3-2"></path><path d="m12 10-3-2-3 3"></path><path d="m14 15 4 6"></path>',
    letters: '<path d="M4 18 9 6l5 12"></path><path d="M6 14h6"></path><path d="M16 18V9"></path><path d="M16 9h4"></path><path d="M16 13h3"></path>',
    pencil: '<path d="m4 20 4-1 11-11-3-3L5 16z"></path><path d="m14 6 3 3"></path>',
    scales: '<path d="M12 3v18"></path><path d="M5 6h14"></path><path d="m6 6-3 7h6z"></path><path d="m18 6-3 7h6z"></path>',
    monitor: '<rect x="3" y="4" width="18" height="13" rx="2"></rect><path d="M8 21h8"></path><path d="M12 17v4"></path>'
  };
  const icon = element("span", `movementIcon ${name}`);
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = `<svg viewBox="0 0 24 24" focusable="false">${paths[name] || paths.star}</svg>`;
  return icon;
}

function renderNotas() {
  const periodoCodigo = state.notas.periodo;
  const periodo = periodos[periodoCodigo];
  let estudantes = filtrarBusca(filtrarPorTurma(estudantesResumo, state.notas.turma));
  if (periodoCodigo === "recuperacao") estudantes = estudantes.filter(estudanteFezRecuperacao);
  estudantes = estudantes.filter((estudante) => state.notas.situacoes.has(statusOperacional(estudante).status));

  const turma = obterTurma(state.notas.turma);
  ui.notasTitulo.textContent = turma ? turmaTituloAcademico(turma) : "Todas as turmas";
  ui.notesClassLabel.textContent = turma ? `${turma.etapa} · Turma ${turma.codigo} · ${estudantes.length} alunos · ${periodo.rotulo}` : `${estudantes.length} alunos · ${periodo.rotulo}`;
  ui.notesTableTitle.textContent = periodo.rotulo;

  renderNotesMetricStrip(estudantes, periodoCodigo);
  renderNotesSummary(estudantes, periodoCodigo);
  renderNotesTable(estudantes, periodoCodigo);
  renderNotesInsights(estudantes, periodoCodigo);
  renderNotesRecovery(estudantes);
}

function renderNotesMetricStrip(estudantes, periodoCodigo) {
  const total = estudantes.length;
  const abaixo = estudantes.filter((estudante) => estudanteTemVermelha(estudante, periodoCodigo)).length;
  const novatos = estudantes.filter((estudante) => statusOperacional(estudante).status === "especial").length;
  const transferidos = estudantes.filter((estudante) => statusOperacional(estudante).status === "transferido" || statusOperacional(estudante).status === "foi_para").length;
  const mediaAtual = media(estudantes.map((estudante) => mediaPeriodoEstudante(estudante, periodoCodigo)));
  renderStats(ui.notesMetricStrip, [
    ["Total de alunos", total, "alunos"],
    ["Alunos abaixo da média", abaixo, `${Math.round((abaixo / Math.max(1, total)) * 100)}%`],
    ["Novatos", novatos, "marcados"],
    ["Transferidos / outra turma", transferidos, "movimento"],
    ["Média geral da turma", formatarMedia(mediaAtual), mediaAtual >= periodos[periodoCodigo].minimo ? "Regular" : "Atenção"]
  ]);
}

function renderNotesSummary(estudantes, periodoCodigo) {
  const abaixo = estudantes.filter((estudante) => estudanteTemVermelha(estudante, periodoCodigo)).length;
  const mediaAtual = media(estudantes.map((estudante) => mediaPeriodoEstudante(estudante, periodoCodigo)));
  replaceChildren(ui.notesSummary, [
    chip(`${estudantes.length} alunos`, "info"),
    chip(`média ${formatarMedia(mediaAtual)}`, "ok"),
    chip(`${abaixo} atenção`, abaixo ? "error" : "ok")
  ]);
}

function renderNotesTable(estudantes, periodoCodigo) {
  const headRow = document.createElement("tr");
  ["Nº", "Aluno", "Sit."].forEach((label) => appendText(headRow, "th", label));
  componentes.forEach((componente) => appendText(headRow, "th", componente.codigo));
  appendText(headRow, "th", "Res.");
  replaceChildren(ui.notasCabecalho, [headRow]);

  const rows = estudantes.map((estudante, index) => {
    const row = document.createElement("tr");
    row.dataset.estudanteId = estudante.id;
    appendText(row, "td", String(index + 1).padStart(2, "0"), "notesIndex");

    const nameCell = element("td", "notesNameCell");
    const nameButton = element("button", "studentNameButton");
    nameButton.type = "button";
    nameButton.textContent = estudante.nome;
    nameButton.addEventListener("click", () => abrirPerfilAluno(estudante.id));
    const peek = criarStudentPeek(estudante, periodoCodigo);
    nameCell.append(nameButton, peek);
    row.append(nameCell);

    const status = statusOperacional(estudante);
    const statusCell = appendText(row, "td", status.rotuloCurto, `statusCell ${status.classe}`);
    statusCell.title = status.rotulo;

    componentes.forEach((componente) => {
      const nota = obterLancamento(estudante, componente);
      const valor = nota ? valorPeriodo(nota, periodoCodigo) : 0;
      const cell = appendText(row, "td", formatarMedia(valor), "scoreCell");
      if (notaAbaixo(nota, periodoCodigo)) cell.classList.add("scoreLow");
    });
    const resultado = estudante.resultadoFinal;
    const resultCell = appendText(row, "td", resultado.replace("APROVADO ", "").replace("EM ", ""), "resultCell");
    if (resultado === "EM ACOMPANHAMENTO") resultCell.classList.add("scoreLow");
    return row;
  });

  if (!rows.length) {
    const row = document.createElement("tr");
    const cell = appendText(row, "td", "Nenhum aluno encontrado para os filtros atuais.", "emptyTableCell");
    cell.colSpan = componentes.length + 4;
    rows.push(row);
  }
  replaceChildren(ui.notasTabela, rows);
}

function renderNotesInsights(estudantes, periodoCodigo) {
  const header = panelTitle("Leitura rápida", "Insights");
  const list = element("div", "insightList");
  const porDisciplina = componentes.map((componente) => {
    const abaixo = estudantes.filter((estudante) => notaAbaixo(obterLancamento(estudante, componente), periodoCodigo)).length;
    return { ...componente, abaixo };
  }).sort((a, b) => b.abaixo - a.abaixo);

  porDisciplina.slice(0, 5).forEach((item) => {
    const row = element("article", "insightItem");
    appendText(row, "strong", `${item.codigo} · ${item.nome}`);
    appendText(row, "span", `${item.abaixo} aluno(s) em vermelho`, item.abaixo ? "dangerText" : "muted");
    row.append(progressTrack(item.abaixo / Math.max(1, estudantes.length) * 100, item.abaixo ? "error" : "ok"));
    list.append(row);
  });
  replaceChildren(ui.notasInsights, [header, list]);
}

function renderNotesRecovery(estudantes) {
  const header = panelTitle("Recuperação", "Lista filtrável");
  const elegiveis = estudantes.filter(estudanteFezRecuperacao).slice(0, 6);
  const list = element("div", "recoveryList");
  elegiveis.forEach((estudante) => {
    const item = element("article", "recoveryItem");
    appendText(item, "strong", estudante.nome);
    appendText(item, "span", `${estudante.turma?.codigo || ""} · final ${formatarMedia(estudante.mediaFinal)}`);
    item.append(chip("ver perfil", "info"));
    item.addEventListener("click", () => abrirPerfilAluno(estudante.id));
    list.append(item);
  });
  if (!elegiveis.length) list.append(emptyState("Nenhum aluno em recuperação no recorte atual."));
  replaceChildren(ui.notasRecovery, [header, list]);
}

function renderBoletim() {
  let estudantes = filtrarBusca(filtrarPorTurma(estudantesResumo, state.boletim.turma));
  const buscaAluno = normalizarTexto(state.boletim.busca);
  if (buscaAluno) {
    estudantes = estudantes.filter((estudante) => normalizarTexto(`${estudante.nome} ${estudante.codigo}`).includes(buscaAluno));
  }
  if (state.boletim.situacoes.size) {
    estudantes = estudantes.filter((estudante) => state.boletim.situacoes.has(estudante.resultadoFinal));
  }

  ui.boletimCount.textContent = `${estudantes.length} resultado(s) · exibindo ${Math.min(4, estudantes.length)} por A4`;
  const folha = element("div", `a4Sheet ${state.boletim.modo === "preto" ? "blackPrint" : ""}`.trim());
  const cards = Array.from({ length: 4 }, (_, index) => criarMiniBoletim(estudantes[index], index + 1));
  folha.append(...cards);
  replaceChildren(ui.boletimA4Preview, [folha]);
}

function criarMiniBoletim(estudante, numero) {
  const card = element("article", "miniBoletim");
  if (!estudante) {
    card.classList.add("emptyBoletim");
    appendText(card, "strong", "Sem resultado");
    appendText(card, "span", "Ajuste turma, aluno ou situações.");
    return card;
  }

  const header = element("header", "miniBoletimHeader");
  const logo = element("img", "miniLogo");
  logo.src = "../logo_escola.png";
  logo.alt = "";
  const title = element("div");
  appendText(title, "strong", "ESCOLA MUN. PROFª IÊDA ALVES DE OLIVEIRA MCPM");
  appendText(title, "span", "★ ★ ★ ★ ★");
  header.append(logo, title);

  const blueBand = element("div", "miniBoletimBand");
  appendText(blueBand, "strong", estudante.nome);
  appendText(blueBand, "span", `${estudante.turma?.codigo || ""} · ${state.boletim.titulo || "BOLETIM ESCOLAR 2026"}`);

  const main = element("div", "miniBoletimMain");
  const student = element("section", "miniStudentBlock");
  const photo = element("div", "photo3x4");
  photo.textContent = iniciais(estudante.nome);
  const meta = element("div");
  appendText(meta, "span", "Aluno");
  appendText(meta, "strong", estudante.nome);
  appendText(meta, "small", `${estudante.turma?.codigo || ""} · ${estudante.codigo}`);
  student.append(photo, meta);

  const rings = element("section", "trimesterRings");
  ["T1", "T2", "T3"].forEach((periodoCodigo) => {
    const ring = element("article", "ring");
    const pct = percentualPeriodo(estudante, periodoCodigo);
    ring.style.setProperty("--percent", `${pct}%`);
    appendText(ring, "strong", `${Math.round(pct)}%`);
    appendText(ring, "span", periodos[periodoCodigo].curto);
    rings.append(ring);
  });

  const resultPill = element("div", "resultPill");
  appendText(resultPill, "strong", estudante.resultadoFinal);

  const tableWrap = element("section", "miniBoletimTableWrap");
  const table = document.createElement("table");
  table.className = "miniBoletimTable";
  const thead = document.createElement("thead");
  const tr = document.createElement("tr");
  ["Comp.", "I", "II", "III", "Final"].forEach((label) => appendText(tr, "th", label));
  thead.append(tr);
  const tbody = document.createElement("tbody");
  componentes.forEach((componente) => {
    const row = document.createElement("tr");
    const nota = obterLancamento(estudante, componente);
    appendText(row, "td", componente.codigo, "componentCode");
    ["T1", "T2", "T3", "geral"].forEach((periodoCodigo) => {
      const cell = appendText(row, "td", nota ? formatarMedia(valorPeriodo(nota, periodoCodigo)) : "", "boletimScoreCell");
      if (notaAbaixo(nota, periodoCodigo)) cell.classList.add("scoreLow");
    });
    tbody.append(row);
  });
  table.append(thead, tbody);
  tableWrap.append(table);

  const date = element("aside", "miniDate");
  date.textContent = formatarDataBoletim(state.boletim.data);

  const left = element("section", "miniBoletimLeft");
  left.append(student, rings, resultPill);
  main.append(left, tableWrap, date);
  const notice = element("div", "miniNotice");
  notice.textContent = state.boletim.recado;
  const footer = element("footer", "miniBoletimFooter");
  appendText(footer, "span", state.boletim.rodape);
  appendText(footer, "strong", String(numero).padStart(2, "0"));

  card.append(header, blueBand, main, notice, footer);
  return card;
}

function criarStudentPeek(estudante, periodoCodigo) {
  const peek = element("aside", "studentPeek");
  const top = element("div", "peekTop");
  const photo = element("span", "photo3x4 smallPhoto");
  photo.textContent = iniciais(estudante.nome);
  const text = element("div");
  appendText(text, "strong", estudante.nome);
  appendText(text, "small", `${estudante.turma?.codigo || ""} · média ${formatarMedia(mediaPeriodoEstudante(estudante, periodoCodigo))}`);
  top.append(photo, text);

  const notes = element("div", "peekNotes");
  componentes.slice(0, 6).forEach((componente) => {
    const nota = obterLancamento(estudante, componente);
    const item = element("span");
    item.textContent = `${componente.codigo} ${nota ? formatarMedia(valorPeriodo(nota, periodoCodigo)) : "--"}`;
    if (notaAbaixo(nota, periodoCodigo)) item.classList.add("dangerText");
    notes.append(item);
  });
  peek.append(top, notes);
  return peek;
}

function abrirPerfilAluno(estudanteId) {
  const estudante = estudantesResumo.find((item) => item.id === estudanteId);
  if (!estudante) return;
  ui.studentProfileTitle.textContent = estudante.nome;

  const header = element("section", "studentProfileCard");
  const photo = element("div", "photo3x4 profilePhoto");
  photo.textContent = iniciais(estudante.nome);
  const meta = element("div");
  appendText(meta, "strong", estudante.nome);
  appendText(meta, "span", `${estudante.turma?.nome || ""} · ${estudante.codigo}`);
  meta.append(chip(estudante.resultadoFinal, estudante.resultadoFinal === "APROVADO DIRETO" ? "ok" : estudante.resultadoFinal === "APROVADO PELA RECUPERAÇÃO" ? "warn" : "error"));
  header.append(photo, meta);

  const table = document.createElement("table");
  table.className = "profileNotesTable";
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Comp.", "I", "II", "III", "Total", "Rec.", "Final"].forEach((label) => appendText(headRow, "th", label));
  head.append(headRow);
  const body = document.createElement("tbody");
  componentes.forEach((componente) => {
    const nota = obterLancamento(estudante, componente);
    const row = document.createElement("tr");
    appendText(row, "td", componente.codigo);
    ["T1", "T2", "T3"].forEach((periodoCodigo) => {
      const cell = appendText(row, "td", nota ? formatarMedia(valorPeriodo(nota, periodoCodigo)) : "--");
      if (notaAbaixo(nota, periodoCodigo)) cell.classList.add("scoreLow");
    });
    appendText(row, "td", nota ? formatarMedia(nota.total) : "--");
    appendText(row, "td", nota ? formatarMedia(nota.totalRec) : "--");
    const finalCell = appendText(row, "td", nota ? formatarMedia(nota.notaFinal) : "--");
    if (notaAbaixo(nota, "geral")) finalCell.classList.add("scoreLow");
    body.append(row);
  });
  table.append(head, body);

  replaceChildren(ui.studentProfileContent, [header, table]);
  ui.studentProfilePanel.classList.add("open");
  ui.studentProfilePanel.setAttribute("aria-hidden", "false");
}

function fecharPerfilAluno() {
  ui.studentProfilePanel.classList.remove("open");
  ui.studentProfilePanel.setAttribute("aria-hidden", "true");
}

function filtrarBusca(estudantes) {
  const busca = normalizarTexto(state.search);
  if (!busca) return estudantes;
  return estudantes.filter((estudante) => {
    const texto = normalizarTexto(`${estudante.nome} ${estudante.codigo} ${estudante.turma?.nome || ""} ${estudante.turma?.codigo || ""}`);
    return texto.includes(busca);
  });
}

function filtrarPorTurma(estudantes, turmaId) {
  if (turmaId === "todas") return estudantes;
  return estudantes.filter((estudante) => estudante.turmaId === turmaId);
}

function obterTurma(turmaId) {
  if (turmaId === "todas") return null;
  return demoData.turmas.find((turma) => turma.id === turmaId) || null;
}

function turmaTituloAcademico(turma) {
  const match = String(turma.codigo || "").match(/^(\d)([A-Z])$/i);
  if (!match) return turma.codigo || turma.nome || "Turma";
  return `${match[1]}º ANO ${match[2].toUpperCase()}`;
}

function obterLancamento(estudante, componente) {
  return estudante.lancamentos.find((nota) => nota.componente?.codigo === componente.source) || null;
}

function valorPeriodo(nota, periodoCodigo) {
  if (!nota) return 0;
  return Number(nota[periodos[periodoCodigo].campo] || 0);
}

function notaAbaixo(nota, periodoCodigo) {
  if (!nota) return false;
  return valorPeriodo(nota, periodoCodigo) < periodos[periodoCodigo].minimo;
}

function estudanteTemVermelha(estudante, periodoCodigo) {
  return componentes.some((componente) => notaAbaixo(obterLancamento(estudante, componente), periodoCodigo));
}

function mediaPeriodoEstudante(estudante, periodoCodigo) {
  return media(componentes.map((componente) => {
    const nota = obterLancamento(estudante, componente);
    return nota ? valorPeriodo(nota, periodoCodigo) : 0;
  }));
}

function percentualPeriodo(estudante, periodoCodigo) {
  const valor = mediaPeriodoEstudante(estudante, periodoCodigo);
  return Math.max(0, Math.min(100, (valor / periodos[periodoCodigo].maximo) * 100));
}

function estudanteFezRecuperacao(estudante) {
  return estudante.lancamentos.some((nota) => Number(nota.total) < 60 || Number(nota.totalRec) > Number(nota.total));
}

function statusOperacional(estudante) {
  if (estudante.situacaoMatricula !== "ativo") return { status: "transferido", rotulo: "Transferido", rotuloCurto: "TR", classe: "warn" };
  if (estudante.linhaOrigem % 8 === 0) return { status: "desistente", rotulo: "Desistente", rotuloCurto: "DE", classe: "error" };
  if (estudante.linhaOrigem % 7 === 0) return { status: "especial", rotulo: "Especial", rotuloCurto: "ES", classe: "info" };
  if (estudante.linhaOrigem % 6 === 0) return { status: "foi_para", rotulo: "Foi para...", rotuloCurto: "FP", classe: "violet" };
  if (estudante.linhaOrigem % 5 === 0) return { status: "estava_no", rotulo: "Estava no...", rotuloCurto: "EN", classe: "mutedChip" };
  return { status: "regular", rotulo: "Regular", rotuloCurto: "OK", classe: "ok" };
}

function preencherSelect(select, options) {
  replaceChildren(select, options.map(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  }));
}

function renderStats(parent, stats) {
  replaceChildren(parent, stats.map(([label, value, hint]) => {
    const card = element("article", "statCard");
    appendText(card, "span", label);
    appendText(card, "strong", String(value));
    appendText(card, "small", hint);
    return card;
  }));
}

function panelTitle(title, kicker) {
  const header = element("div", "panelHeader");
  const text = element("div");
  appendText(text, "p", kicker, "sectionKicker");
  appendText(text, "h3", title);
  header.append(text);
  return header;
}

function progressTrack(percentual, type = "ok") {
  const track = element("div", "progressTrack");
  const bar = element("span", type);
  bar.style.setProperty("--progress", `${Math.max(0, Math.min(100, percentual))}%`);
  track.append(bar);
  return track;
}

function chip(text, type = "info") {
  const item = element("span", `chip ${type}`.trim());
  item.textContent = text;
  return item;
}

function emptyState(text) {
  const item = element("article", "emptyState");
  appendText(item, "strong", "Sem registros");
  appendText(item, "span", text);
  return item;
}

function media(valores) {
  const validos = valores.filter(Number.isFinite);
  if (!validos.length) return 0;
  return validos.reduce((total, valor) => total + valor, 0) / validos.length;
}

function iniciais(nome) {
  return String(nome || "AL")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() || "")
    .join("");
}

function formatarDataBoletim(value) {
  if (!value) return "";
  const [ano, mes, dia] = value.split("-");
  return `${dia}/${mes}/${ano}`;
}

function dataInputHoje() {
  const hoje = new Date();
  const offset = hoje.getTimezoneOffset() * 60000;
  return new Date(hoje.getTime() - offset).toISOString().slice(0, 10);
}

function viewFromHash() {
  const raw = window.location.hash.replace("#", "").trim();
  return viewAliases[raw] || (viewCopy[raw] ? raw : "");
}

function appendText(parent, tag, text, className = "") {
  const child = element(tag, className);
  child.textContent = text;
  parent.append(child);
  return child;
}

function element(tag, className = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function replaceChildren(parent, children) {
  parent.replaceChildren(...children);
}
