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
    "Movimento estatístico trimestral",
    "Síntese por turma, período, componentes, ranking e aproveitamento."
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
  notesClassLabel: document.getElementById("notesClassLabel"),
  notesTableTitle: document.getElementById("notesTableTitle"),
  notesSummary: document.getElementById("notesSummary"),
  notasCabecalho: document.getElementById("notasCabecalho"),
  notasTabela: document.getElementById("notasTabela"),
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
  preencherSelect(ui.movimentoTurma, opcoesTurma);
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
  ui.viewTitle.textContent = title;
  ui.viewSubtitle.textContent = subtitle;
  if (updateHash) history.replaceState(null, "", `#${destino}`);
}

function renderAll() {
  renderMovimento();
  renderNotas();
  renderBoletim();
}

function renderMovimento() {
  const estudantes = filtrarBusca(filtrarPorTurma(estudantesResumo, state.movimento.turma));
  const turma = obterTurma(state.movimento.turma);
  const periodo = periodos[state.movimento.periodo];
  ui.movementClassLabel.textContent = `${turma?.nome || "Todas as turmas"} · ${periodo.rotulo}`;

  const medias = estudantes.map((estudante) => mediaPeriodoEstudante(estudante, state.movimento.periodo));
  const mediaGeral = media(medias);
  const abaixo = estudantes.filter((estudante) => estudanteTemVermelha(estudante, state.movimento.periodo)).length;
  const resumoGeral = calcularResumoGeral(demoData);
  const etapas = resumirEtapas(estudantes.flatMap((estudante) => estudante.lancamentos));

  renderStats(ui.movementStats, [
    ["Alunos no recorte", estudantes.length, "matrículas fictícias"],
    ["Média do período", formatarMedia(mediaGeral), periodo.maximo === 100 ? "escala 60-100" : `mínimo ${periodo.minimo}/${periodo.maximo}`],
    ["Abaixo da média", abaixo, "qualquer disciplina em vermelho"],
    ["Componentes", componentes.length, `${resumoGeral.totalTurmas} turmas de demo`]
  ]);

  renderMovementChart(estudantes, state.movimento.periodo);
  renderMovementDonut(estudantes, state.movimento.periodo, etapas);
  renderMovementRanking(estudantes, state.movimento.periodo);
  renderClassResults(state.movimento.periodo);
}

function renderMovementChart(estudantes, periodoCodigo) {
  const periodo = periodos[periodoCodigo];
  const total = Math.max(1, estudantes.length);
  const maxAltura = Math.max(1, estudantes.length);
  const chart = element("div", "movementBars");

  componentes.forEach((componente) => {
    const acima = estudantes.filter((estudante) => {
      const nota = obterLancamento(estudante, componente);
      return nota && valorPeriodo(nota, periodoCodigo) >= periodo.minimo;
    }).length;
    const abaixo = Math.max(0, total - acima);
    const button = element("button", "movementBar");
    button.type = "button";
    button.dataset.codigo = componente.codigo;
    button.dataset.nome = componente.nome;

    const bars = element("span", "barPair");
    const blue = element("i", "barBlue");
    blue.style.setProperty("--bar-height", `${Math.max(6, (acima / maxAltura) * 100)}%`);
    blue.dataset.value = String(acima);
    const red = element("i", "barRed");
    red.style.setProperty("--bar-height", `${Math.max(abaixo ? 6 : 0, (abaixo / maxAltura) * 100)}%`);
    red.dataset.value = String(abaixo);
    bars.append(blue, red);

    const label = element("span", "barLabel");
    appendText(label, "strong", componente.codigo);
    appendText(label, "small", componente.nome);
    button.append(bars, label);
    button.addEventListener("click", () => {
      ui.movementDisciplineHint.textContent = `${componente.nome}: ${abaixo} aluno(s) com nota abaixo de ${periodo.minimo}. Função preparada para abrir lista detalhada na fase de dados reais.`;
    });
    chart.append(button);
  });

  replaceChildren(ui.movementChart, [chart]);
}

function renderMovementDonut(estudantes, periodoCodigo, etapas) {
  const total = Math.max(1, estudantes.length);
  const aprovados = estudantes.filter((estudante) => !estudanteTemVermelha(estudante, periodoCodigo)).length;
  const percentual = Math.round((aprovados / total) * 100);
  const panel = document.createDocumentFragment();
  panel.append(panelTitle("Aprovação no recorte", "Síntese"));
  const donut = element("div", "donutMeter");
  donut.style.setProperty("--percent", `${percentual}%`);
  appendText(donut, "strong", `${percentual}%`);
  appendText(donut, "span", "sem nota vermelha");
  const chips = element("div", "chipRow");
  chips.append(chip(`${aprovados} em azul`, "ok"), chip(`${total - aprovados} em vermelho`, "error"));
  const stages = element("div", "miniStageList");
  etapas.slice(0, 4).forEach((etapa) => {
    const item = element("article");
    appendText(item, "span", etapa.rotulo);
    appendText(item, "strong", formatarMedia(etapa.media));
    stages.append(item);
  });
  panel.append(donut, chips, stages);
  replaceChildren(ui.movementDonut, [panel]);
}

function renderMovementRanking(estudantes, periodoCodigo) {
  const limite = state.movimento.rankingExpandido ? 10 : 3;
  const ranking = [...estudantes]
    .sort((a, b) => mediaPeriodoEstudante(b, periodoCodigo) - mediaPeriodoEstudante(a, periodoCodigo))
    .slice(0, limite);
  const header = panelTitle("Ranking da turma", "Top desempenho");
  const list = element("div", "rankingList");
  ranking.forEach((estudante, index) => {
    const item = element("article", "rankingItem");
    appendText(item, "span", String(index + 1).padStart(2, "0"), `rankBadge rank${Math.min(index + 1, 3)}`);
    const text = element("div");
    const nome = appendText(text, "strong", estudante.nome);
    if (estudanteTemVermelha(estudante, periodoCodigo)) nome.classList.add("studentAlertName");
    appendText(text, "small", `${estudante.turma?.codigo || ""} · ${statusOperacionais[statusOperacional(estudante).status].rotulo}`);
    appendText(item, "b", formatarMedia(mediaPeriodoEstudante(estudante, periodoCodigo)));
    item.insertBefore(text, item.lastChild);
    list.append(item);
  });
  const button = element("button", "textButton");
  button.type = "button";
  button.textContent = state.movimento.rankingExpandido ? "Ver top 3" : "Expandir top 10";
  button.addEventListener("click", () => {
    state.movimento.rankingExpandido = !state.movimento.rankingExpandido;
    renderMovementRanking(estudantes, periodoCodigo);
  });
  replaceChildren(ui.movementRanking, [header, list, button]);
}

function renderClassResults(periodoCodigo) {
  const mostrar = state.movimento.turma === "todas" || periodoCodigo === "geral";
  ui.movementClassPanel.hidden = !mostrar;
  if (!mostrar) return;

  const cards = resumirTurmas(demoData).map((turma) => {
    const estudantes = filtrarPorTurma(estudantesResumo, turma.id);
    const aprovados = estudantes.filter((estudante) => !estudanteTemVermelha(estudante, "geral")).length;
    const percentual = Math.round((aprovados / Math.max(1, estudantes.length)) * 100);
    const card = element("article", "classResultCard");
    const mini = element("div", "smallDonut");
    mini.style.setProperty("--percent", `${percentual}%`);
    appendText(mini, "strong", `${percentual}%`);
    const body = element("div");
    appendText(body, "strong", turma.codigo);
    appendText(body, "span", `${aprovados} aprovados · ${estudantes.length - aprovados} em atenção`);
    card.append(mini, body);
    return card;
  });
  replaceChildren(ui.movementClassCards, cards);
}

function renderNotas() {
  const periodoCodigo = state.notas.periodo;
  const periodo = periodos[periodoCodigo];
  let estudantes = filtrarBusca(filtrarPorTurma(estudantesResumo, state.notas.turma));
  if (periodoCodigo === "recuperacao") estudantes = estudantes.filter(estudanteFezRecuperacao);
  estudantes = estudantes.filter((estudante) => state.notas.situacoes.has(statusOperacional(estudante).status));

  const turma = obterTurma(state.notas.turma);
  ui.notesClassLabel.textContent = `${turma?.nome || "Todas as turmas"} · ${periodo.rotulo}`;
  ui.notesTableTitle.textContent = periodo.rotulo;

  renderNotesSummary(estudantes, periodoCodigo);
  renderNotesTable(estudantes, periodoCodigo);
  renderNotesInsights(estudantes, periodoCodigo);
  renderNotesRecovery(estudantes);
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
  appendText(header, "strong", state.boletim.titulo || "BOLETIM ESCOLAR 2026");
  appendText(header, "span", "ESCOLA MUNICIPAL PROFª IÊDA ALVES DE OLIVEIRA");

  const blueBand = element("div", "miniBoletimBand");
  appendText(blueBand, "strong", estudante.nome);
  appendText(blueBand, "span", `${estudante.turma?.nome || ""} · Nº ${String(numero).padStart(2, "0")}`);

  const main = element("div", "miniBoletimMain");
  const student = element("section", "miniStudentBlock");
  const photo = element("div", "photo3x4");
  photo.textContent = iniciais(estudante.nome);
  const meta = element("div");
  appendText(meta, "span", "Aluno");
  appendText(meta, "strong", estudante.nome);
  appendText(meta, "small", `${estudante.codigo} · ${estudante.resultadoFinal}`);
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

  main.append(student, rings, tableWrap, date);
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
