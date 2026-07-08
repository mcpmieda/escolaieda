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
  estatisticas: "movimento",
  dashboard: "movimento",
  turma: "movimento",
  banco: "notas",
  boletins: "boletim"
};

const viewHashes = {
  movimento: "estatisticas",
  notas: "notas",
  boletim: "boletim"
};

const estudantesResumo = listarEstudantesComResumo(demoData);
let activeStatsSelect = null;

const state = {
  view: viewFromHash() || "movimento",
  theme: localStorage.getItem("notas-theme") || "aurora",
  search: "",
  movimento: {
    turma: "turma-demo-8c",
    periodo: "T1",
    rankingExpandido: false,
    disciplinaSelecionada: ""
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
  movementClassPanelKicker: document.getElementById("movementClassPanelKicker"),
  movementClassPanelTitle: document.getElementById("movementClassPanelTitle"),
  movementClassPanelHint: document.getElementById("movementClassPanelHint"),
  movementFooterPeriod: document.getElementById("movementFooterPeriod"),
  movementFooterUpdated: document.getElementById("movementFooterUpdated"),
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
  enhanceStatsSelects();
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
    state.movimento.disciplinaSelecionada = "";
    renderMovimento();
  });
  ui.movimentoPeriodo.addEventListener("change", () => {
    state.movimento.periodo = ui.movimentoPeriodo.value;
    state.movimento.disciplinaSelecionada = "";
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

  document.getElementById("movementPrint").addEventListener("click", imprimirRelatorioMovimento);
  document.getElementById("boletimPrint").addEventListener("click", () => window.print());
  ui.studentProfileClose.addEventListener("click", fecharPerfilAluno);

  window.addEventListener("afterprint", () => {
    delete document.body.dataset.printView;
  });

  window.addEventListener("hashchange", () => {
    const view = viewFromHash();
    if (view) abrirView(view, false);
  });
}

function enhanceStatsSelects() {
  document.querySelectorAll(".statsSelectCard select").forEach((select) => {
    if (select.dataset.enhancedStatsSelect === "true") {
      syncStatsSelect(select);
      return;
    }
    const host = select.closest(".statsSelectCard");
    const label = host?.dataset.statsSelectLabel || select.getAttribute("aria-label") || "Selecionar";
    const controlId = `${select.id}Control`;
    const menuId = `${select.id}Menu`;

    select.dataset.enhancedStatsSelect = "true";
    select.classList.add("statsSelectNative");

    const button = element("button", "statsSelectButton");
    button.type = "button";
    button.id = controlId;
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", menuId);
    appendText(button, "strong", "", "statsSelectValue");
    appendText(button, "span", label, "statsSelectCaption");
    const chevron = element("i", "statsSelectChevron");
    chevron.setAttribute("aria-hidden", "true");
    const glow = element("i", "statsSelectGlow");
    glow.setAttribute("aria-hidden", "true");
    button.append(chevron, glow);

    const menu = element("div", "statsSelectMenu");
    menu.id = menuId;
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-labelledby", controlId);
    menu.hidden = true;

    host.append(button, menu);
    renderStatsSelectOptions(select);
    syncStatsSelect(select);

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (host.classList.contains("is-open")) {
        closeStatsSelect(select);
      } else {
        openStatsSelect(select);
      }
    });
    button.addEventListener("keydown", (event) => handleStatsSelectButtonKeydown(event, select));
    select.addEventListener("change", () => syncStatsSelect(select));
  });

  if (!enhanceStatsSelects.boundDocumentClick) {
    document.addEventListener("click", () => closeStatsSelects());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeStatsSelects(true);
    });
    enhanceStatsSelects.boundDocumentClick = true;
  }
}

function renderStatsSelectOptions(select) {
  const host = select.closest(".statsSelectCard");
  const menu = host?.querySelector(".statsSelectMenu");
  if (!menu) return;
  replaceChildren(menu, [...select.options].map((option, index) => {
    const item = element("button", "statsSelectOption");
    item.type = "button";
    item.id = `${select.id}Option${index}`;
    item.dataset.value = option.value;
    item.style.setProperty("--option-index", index);
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", "false");
    appendText(item, "strong", option.textContent);
    appendText(item, "span", option.value === "todas" ? "recorte completo" : option.value);
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      chooseStatsSelectOption(select, option.value);
    });
    item.addEventListener("keydown", (event) => handleStatsSelectOptionKeydown(event, select, index));
    return item;
  }));
}

function syncStatsSelect(select) {
  const host = select.closest(".statsSelectCard");
  const current = select.selectedOptions[0];
  if (!host || !current) return;
  const value = host.querySelector(".statsSelectValue");
  if (value) value.textContent = current.textContent;
  host.querySelectorAll(".statsSelectOption").forEach((item) => {
    const active = item.dataset.value === select.value;
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", String(active));
  });
}

function openStatsSelect(select) {
  const host = select.closest(".statsSelectCard");
  const menu = host?.querySelector(".statsSelectMenu");
  const button = host?.querySelector(".statsSelectButton");
  if (!host || !menu || !button) return;
  closeStatsSelects();
  activeStatsSelect = select;
  host.classList.add("is-open");
  menu.hidden = false;
  button.setAttribute("aria-expanded", "true");
  const selected = menu.querySelector(".statsSelectOption.active") || menu.querySelector(".statsSelectOption");
  if (selected) requestAnimationFrame(() => selected.focus({ preventScroll: true }));
}

function closeStatsSelect(select, restoreFocus = false) {
  const host = select?.closest(".statsSelectCard");
  const menu = host?.querySelector(".statsSelectMenu");
  const button = host?.querySelector(".statsSelectButton");
  if (!host || !menu || !button) return;
  host.classList.remove("is-open");
  menu.hidden = true;
  button.setAttribute("aria-expanded", "false");
  if (activeStatsSelect === select) activeStatsSelect = null;
  if (restoreFocus) button.focus({ preventScroll: true });
}

function closeStatsSelects(restoreFocus = false) {
  document.querySelectorAll(".statsSelectCard.is-open select").forEach((select) => closeStatsSelect(select, restoreFocus));
}

function chooseStatsSelectOption(select, value) {
  if (select.value !== value) {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
  closeStatsSelect(select, true);
}

function handleStatsSelectButtonKeydown(event, select) {
  if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    openStatsSelect(select);
  }
}

function handleStatsSelectOptionKeydown(event, select, index) {
  const host = select.closest(".statsSelectCard");
  const options = [...(host?.querySelectorAll(".statsSelectOption") || [])];
  const focusOption = (nextIndex) => options[Math.max(0, Math.min(options.length - 1, nextIndex))]?.focus({ preventScroll: true });
  if (event.key === "ArrowDown") {
    event.preventDefault();
    focusOption(index + 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    focusOption(index - 1);
  } else if (event.key === "Home") {
    event.preventDefault();
    focusOption(0);
  } else if (event.key === "End") {
    event.preventDefault();
    focusOption(options.length - 1);
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    chooseStatsSelectOption(select, options[index].dataset.value);
  } else if (event.key === "Escape") {
    event.preventDefault();
    closeStatsSelect(select, true);
  } else if (event.key === "Tab") {
    closeStatsSelect(select);
  }
}

function preencherSelects() {
  const opcoesTurma = [
    ["todas", "Todas as turmas"],
    ...demoData.turmas.map((turma) => [turma.id, turma.codigo])
  ];
  const opcoesMovimento = [
    ["todas", "TODAS AS TURMAS"],
    ...demoData.turmas.map((turma) => [turma.id, turmaTituloAcademico(turma).toUpperCase()])
  ];
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
  ui.viewTitle.textContent = title;
  ui.viewSubtitle.textContent = subtitle;
  if (updateHash) history.replaceState(null, "", `#${viewHashes[destino] || destino}`);
  if (destino === "movimento" && ui.movimentoTurma.value) renderMovimento();
}

function renderAll() {
  renderMovimento();
  renderNotas();
  renderBoletim();
}

function renderMovimento() {
  const recorte = criarRecorteMovimento();
  ui.movementClassLabel.textContent = `${recorte.turmaRotulo} · ${recorte.periodo.rotulo} · ${recorte.estudantes.length} aluno(s) no recorte.`;
  ui.viewTitle.textContent = "Movimento estatístico escolar";
  ui.viewSubtitle.textContent = ui.movementClassLabel.textContent;
  ui.movementFooterPeriod.textContent = `Dados referentes a ${recorte.periodo.rotulo.toUpperCase()}`;
  ui.movementFooterUpdated.textContent = `Atualizado em ${recorte.atualizado}`;
  renderMovementStats(recorte);
  renderMovementChart(recorte);
  renderMovementDonut(recorte);
  renderMovementRanking(recorte);
  renderClassResults(recorte);
}

function criarRecorteMovimento() {
  const estudantes = filtrarBusca(filtrarPorTurma(estudantesResumo, state.movimento.turma));
  const turma = obterTurma(state.movimento.turma);
  const periodo = periodos[state.movimento.periodo] || periodos.T1;
  const totalAlunos = estudantes.length;
  const componentesResumo = componentes.map((componente) => {
    const abaixo = estudantes.filter((estudante) => notaAbaixo(obterLancamento(estudante, componente), state.movimento.periodo)).length;
    return {
      ...componente,
      nomeCurto: nomeComponenteCurto(componente),
      icon: iconeComponente(componente.codigo),
      acima: Math.max(0, totalAlunos - abaixo),
      abaixo
    };
  });
  const aprovados = estudantes.filter((estudante) => !estudanteTemVermelha(estudante, state.movimento.periodo)).length;
  const abaixo = Math.max(0, totalAlunos - aprovados);
  const somaRecorte = estudantes.reduce((total, estudante) => total + somaPeriodoEstudante(estudante, state.movimento.periodo), 0);
  const atualizado = formatarDataHoraMovimento(new Date());
  return {
    estudantes,
    turma,
    turmaRotulo: turma ? turmaTituloAcademico(turma) : "Todas as turmas",
    periodo,
    totalAlunos,
    componentes: componentesResumo,
    aprovados,
    abaixo,
    somaRecorte,
    atualizado,
    maxEixo: Math.max(25, Math.ceil(Math.max(1, totalAlunos) / 5) * 5)
  };
}

function renderMovementStats(recorte) {
  const total = Math.max(1, recorte.totalAlunos);
  const percentualAcima = Math.round((recorte.aprovados / total) * 100);
  const percentualAbaixo = Math.round((recorte.abaixo / total) * 100);
  replaceChildren(ui.movementStats, [
    movementStatCard("trendUp", "ACIMA OU IGUAL AO MÍNIMO", recorte.aprovados, `${percentualAcima}%`, "ok"),
    movementStatCard("trendDown", "ABAIXO DO MÍNIMO", recorte.abaixo, `${percentualAbaixo}%`, "error"),
    movementStatCard("users", recorte.turma ? "ALUNOS NA TURMA" : "ALUNOS NO RECORTE", recorte.totalAlunos, "100%", "info"),
    movementStatCard("star", "SOMA DO RECORTE", formatarSomaPontuacao(recorte.somaRecorte), "pontos", "info")
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

function renderMovementChart(recorte) {
  const maxAltura = recorte.maxEixo;
  const chart = element("div", "movementBars");

  recorte.componentes.forEach((componente, index) => {
    const button = element("button", `movementBar ${state.movimento.disciplinaSelecionada === componente.codigo ? "active" : ""}`.trim());
    button.type = "button";
    button.dataset.codigo = componente.codigo;
    button.dataset.nome = componente.nome;
    button.style.setProperty("--bar-index", index);

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
    appendText(label, "small", componente.nomeCurto);
    button.append(bars, label);
    button.addEventListener("click", () => {
      state.movimento.disciplinaSelecionada = state.movimento.disciplinaSelecionada === componente.codigo ? "" : componente.codigo;
      ui.movementDisciplineHint.textContent = `${componente.nome}: ${componente.abaixo} aluno(s) abaixo do mínimo.`;
      renderMovementChart(recorte);
      renderClassResults(recorte);
    });
    chart.append(button);
  });

  const yAxis = element("div", "statsYAxis");
  criarEscalaEixo(recorte.maxEixo).forEach((valor) => appendText(yAxis, "span", String(valor)));
  const canvas = element("div", "statsChartCanvas");
  canvas.append(yAxis, chart);
  replaceChildren(ui.movementChart, [canvas]);
}

function renderMovementDonut(recorte) {
  const total = Math.max(1, recorte.totalAlunos);
  const percentual = Math.round((recorte.aprovados / total) * 100);
  const percentualAbaixo = 100 - percentual;
  const panel = document.createDocumentFragment();
  const header = element("div", "statsPanelHeader compact");
  const title = element("div", "statsPanelTitle");
  appendText(title, "h3", "DESEMPENHO GERAL DA TURMA  ⓘ");
  header.append(title);

  const body = element("div", "statsDonutBody");
  const left = element("div", "statsDonutLegend left");
  appendText(left, "span", `${recorte.abaixo} aluno(s)`);
  appendText(left, "strong", `${percentualAbaixo}%`);
  appendText(left, "small", "Abaixo do mínimo");
  left.prepend(dot("red"));

  const donut = element("div", "donutMeter");
  donut.style.setProperty("--percent", `${percentual}%`);
  appendText(donut, "strong", `${percentual}%`);
  appendText(donut, "span", "ACIMA OU IGUAL AO MÍNIMO");

  const right = element("div", "statsDonutLegend right");
  appendText(right, "span", `${recorte.aprovados} aluno(s)`);
  appendText(right, "strong", `${percentual}%`);
  appendText(right, "small", "Acima ou igual ao mínimo");
  right.prepend(dot("blue"));
  body.append(left, donut, right);

  const note = element("div", "statsDonutNote");
  note.append(movementIcon("users"));
  appendText(note, "span", `Dos ${recorte.totalAlunos} aluno(s), ${recorte.aprovados} ficaram sem nota abaixo do mínimo no recorte selecionado.`);

  panel.append(header, body, note);
  replaceChildren(ui.movementDonut, [panel]);
}

function renderMovementRanking(recorte) {
  const header = element("div", "statsRankingHeader");
  header.append(movementIcon("trophy"));
  appendText(header, "h3", "DESTAQUES DA TURMA");
  const list = element("div", "rankingList");
  const limite = state.movimento.rankingExpandido ? 10 : 3;
  const ranking = [...recorte.estudantes]
    .sort((a, b) => somaPeriodoEstudante(b, state.movimento.periodo) - somaPeriodoEstudante(a, state.movimento.periodo))
    .slice(0, limite);
  ranking.forEach((estudante, index) => {
    const item = element("article", "rankingItem");
    item.style.setProperty("--rank-index", index);
    appendText(item, "span", String(index + 1), `rankBadge rank${Math.min(index + 1, 3)}`);
    const text = element("div");
    const name = appendText(text, "strong", estudante.nome);
    const emAtencao = estudanteTemVermelha(estudante, state.movimento.periodo);
    if (emAtencao) name.classList.add("studentAlertName");
    appendText(text, "small", emAtencao ? `${estudante.turma?.codigo || ""} · recuperação em componente` : estudante.turma?.codigo || "");
    appendText(item, "b", formatarSomaPontuacao(somaPeriodoEstudante(estudante, state.movimento.periodo)));
    item.insertBefore(text, item.lastChild);
    list.append(item);
  });
  const button = element("button", "statsRankingLink");
  button.type = "button";
  button.innerHTML = state.movimento.rankingExpandido ? "<span>RECOLHER PARA TOP 3</span><b aria-hidden=\"true\">↑</b>" : "<span>VER TOP 10 POR SOMA</span><b aria-hidden=\"true\">↓</b>";
  button.addEventListener("click", () => {
    state.movimento.rankingExpandido = !state.movimento.rankingExpandido;
    renderMovementRanking(recorte);
  });
  replaceChildren(ui.movementRanking, [header, ranking.length ? list : emptyState("Nenhum aluno encontrado no recorte atual."), button]);
}

function renderClassResults(recorte) {
  const mostrarTurmas = state.movimento.turma === "todas" || state.movimento.periodo === "geral";
  ui.movementClassPanel.hidden = !mostrarTurmas;
  if (!mostrarTurmas) {
    replaceChildren(ui.movementClassCards, []);
    return;
  }

  ui.movementClassPanelKicker.textContent = "Resultado quantitativo";
  ui.movementClassPanelTitle.textContent = state.movimento.turma === "todas" ? "Todas as turmas" : recorte.turmaRotulo;
  ui.movementClassPanelHint.textContent = "Resumo por turma do período selecionado.";
  const cards = demoData.turmas.map((turma) => {
    const estudantesTurma = filtrarBusca(filtrarPorTurma(estudantesResumo, turma.id));
    const aprovados = estudantesTurma.filter((estudante) => !estudanteTemVermelha(estudante, state.movimento.periodo)).length;
    const percentual = Math.round((aprovados / Math.max(1, estudantesTurma.length)) * 100);
    const card = element("article", "classResultCard");
    const mini = element("div", "smallDonut");
    mini.style.setProperty("--percent", `${percentual}%`);
    appendText(mini, "strong", `${percentual}%`);
    const body = element("div");
    appendText(body, "strong", turmaTituloAcademico(turma));
    appendText(body, "span", `${aprovados} no mínimo · ${estudantesTurma.length - aprovados} em atenção`);
    card.append(mini, body);
    return card;
  });
  replaceChildren(ui.movementClassCards, cards);
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
    ["Alunos abaixo do mínimo", abaixo, `${Math.round((abaixo / Math.max(1, total)) * 100)}%`],
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

function imprimirRelatorioMovimento() {
  closeStatsSelects();
  document.body.dataset.printView = "movimento";
  requestAnimationFrame(() => window.print());
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

function nomeComponenteCurto(componente) {
  return {
    "P": "Português",
    "M": "Matemática",
    "C": "Ciências",
    "G": "Geografia",
    "H": "História",
    "A": "Artes",
    "RL": "Ensino Religioso",
    "F": "Ed. Física",
    "I": "Inglês",
    "RD": "Redação",
    "ET": "Ética",
    "CPT": "Computação"
  }[componente.codigo] || componente.nome;
}

function iconeComponente(codigo) {
  return {
    P: "book",
    M: "sigma",
    C: "flask",
    G: "globe",
    H: "columns",
    A: "palette",
    F: "runner",
    I: "letters",
    RD: "pencil",
    RL: "book",
    ET: "scales",
    CPT: "monitor"
  }[codigo] || "star";
}

function criarEscalaEixo(maximo) {
  const base = Math.max(5, Number(maximo) || 25);
  const passo = base / 5;
  return Array.from({ length: 6 }, (_, index) => Math.round(base - passo * index));
}

function formatarDataHoraMovimento(value) {
  if (!value) return formatarDataHoraMovimento(new Date());
  if (String(value).includes("/")) return value;
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return formatarDataHoraMovimento(new Date());
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).replace(",", " às");
}

function formatarSomaPontuacao(value) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1
  }).format(Number(value) || 0);
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

function somaPeriodoEstudante(estudante, periodoCodigo) {
  return componentes.reduce((total, componente) => {
    const nota = obterLancamento(estudante, componente);
    return total + (nota ? valorPeriodo(nota, periodoCodigo) : 0);
  }, 0);
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
