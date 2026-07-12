import { demoData } from "./demo-data.js";
import { formatarMedia, listarEstudantesComResumo, normalizarTexto } from "./domain.js";

const componentesBoletim = ["P", "M", "C", "G", "H", "A", "RL", "F", "I", "RD", "ET", "CPT"];
const estudantes = listarEstudantesComResumo(demoData);
const trimestres = {
  T1: { rotulo: "I TRIMESTRE", campo: "notaT1", recuperacao: "recT1", minimo: 18, maximo: 30 },
  T2: { rotulo: "II TRIMESTRE", campo: "notaT2", recuperacao: "recT2", minimo: 18, maximo: 30 },
  T3: { rotulo: "III TRIMESTRE", campo: "notaT3", recuperacao: "recT3", minimo: 24, maximo: 40 }
};

const estado = {
  turma: "turma-demo-8c",
  busca: "",
  resultados: new Set(),
  trimestres: new Set(Object.keys(trimestres)),
  cor: "color",
  zoom: 1,
  inicializado: false
};

const ui = {};
let renderPendente = 0;
let pageSizeObserver = null;

function inicializarBoletim() {
  if (estado.inicializado) return;
  Object.assign(ui, {
    turma: document.getElementById("bulletinClass"),
    busca: document.getElementById("bulletinStudentSearch"),
    trimestres: document.querySelector(".bulletinTerms"),
    situacoes: [...document.querySelectorAll("[data-bulletin-result]")],
    limpar: document.getElementById("bulletinClearFilters"),
    cores: [...document.querySelectorAll("[data-bulletin-color]")],
    imprimir: document.getElementById("bulletinPrint"),
    baixar: document.getElementById("bulletinDownload"),
    zoom: document.getElementById("bulletinZoom"),
    telaCheia: document.getElementById("bulletinFullscreen"),
    viewport: document.getElementById("bulletinPreviewViewport"),
    paginas: document.getElementById("bulletinPages"),
    contador: document.getElementById("bulletinPreviewCount")
  });

  preencherTurmas();
  vincularEventos();
  estado.inicializado = true;
}

function preencherTurmas() {
  const fragment = document.createDocumentFragment();
  for (const turma of demoData.turmas) {
    const option = document.createElement("option");
    option.value = turma.id;
    option.textContent = turma.codigo;
    fragment.append(option);
  }
  ui.turma.replaceChildren(fragment);
  ui.turma.value = estado.turma;
}

function vincularEventos() {
  ui.turma.addEventListener("change", () => {
    estado.turma = ui.turma.value;
    agendarRender();
  });

  ui.busca.addEventListener("input", () => {
    estado.busca = ui.busca.value;
    agendarRender();
  });

  ui.trimestres.addEventListener("change", (event) => {
    const input = event.target.closest("input[type='checkbox']");
    if (!input) return;
    if (input.checked) estado.trimestres.add(input.value);
    else estado.trimestres.delete(input.value);
    if (!estado.trimestres.size) {
      input.checked = true;
      estado.trimestres.add(input.value);
    }
    agendarRender();
  });

  for (const button of ui.situacoes) {
    button.addEventListener("click", () => {
      const resultado = button.dataset.bulletinResult;
      if (estado.resultados.has(resultado)) estado.resultados.delete(resultado);
      else estado.resultados.add(resultado);
      sincronizarBotoesSituacao();
      agendarRender();
    });
  }

  ui.limpar.addEventListener("click", limparFiltros);

  for (const button of ui.cores) {
    button.addEventListener("click", () => {
      estado.cor = button.dataset.bulletinColor;
      sincronizarModoCor();
      agendarRender();
    });
  }

  ui.zoom.addEventListener("change", () => {
    estado.zoom = Number(ui.zoom.value) || 1;
    aplicarZoom();
  });

  ui.telaCheia.addEventListener("click", alternarTelaCheia);
  document.addEventListener("fullscreenchange", sincronizarTelaCheia);
  ui.imprimir.addEventListener("click", () => abrirImpressao(false));
  ui.baixar.addEventListener("click", () => abrirImpressao(true));
}

function limparFiltros() {
  estado.busca = "";
  estado.resultados.clear();
  estado.trimestres = new Set(Object.keys(trimestres));
  ui.busca.value = "";
  ui.trimestres.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = true;
  });
  sincronizarBotoesSituacao();
  agendarRender();
  ui.busca.focus();
}

function sincronizarBotoesSituacao() {
  for (const button of ui.situacoes) {
    const ativo = estado.resultados.has(button.dataset.bulletinResult);
    button.classList.toggle("active", ativo);
    button.setAttribute("aria-pressed", String(ativo));
  }
}

function sincronizarModoCor() {
  for (const button of ui.cores) {
    const ativo = button.dataset.bulletinColor === estado.cor;
    button.classList.toggle("active", ativo);
    button.setAttribute("aria-pressed", String(ativo));
  }
}

function agendarRender() {
  cancelAnimationFrame(renderPendente);
  renderPendente = requestAnimationFrame(renderBoletim);
}

function renderBoletim() {
  if (!estado.inicializado) inicializarBoletim();
  const selecionados = filtrarEstudantes();
  const paginas = agrupar(selecionados, 4);
  const fragment = document.createDocumentFragment();

  paginas.forEach((grupo, paginaIndex) => {
    const pagina = elemento("section", "bulletinPage");
    pagina.setAttribute("aria-label", `Página ${paginaIndex + 1} de ${paginas.length}`);
    grupo.forEach((estudante, indice) => {
      pagina.append(criarBoletim(estudante, paginaIndex * 4 + indice + 1));
    });
    fragment.append(pagina);
  });

  if (!selecionados.length) {
    const vazio = elemento("section", "bulletinEmptyState");
    adicionarTexto(vazio, "strong", "Nenhum boletim encontrado");
    adicionarTexto(vazio, "span", "Revise a turma, o nome do aluno ou os filtros de situação.");
    fragment.append(vazio);
  }

  ui.paginas.replaceChildren(fragment);
  ui.paginas.dataset.colorMode = estado.cor;
  ui.contador.textContent = `${selecionados.length} boletim(ns) · ${paginas.length} página(s)`;
  observarEscalaDasPaginas();
  aplicarZoom();
}

function observarEscalaDasPaginas() {
  pageSizeObserver?.disconnect();
  if (!("ResizeObserver" in window)) return;
  pageSizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const largura = entry.target.getBoundingClientRect().width;
      const escala = Math.max(0.55, Math.min(1.25, largura / 1505));
      entry.target.style.setProperty("--bulletin-content-scale", escala.toFixed(4));
    }
  });
  ui.paginas.querySelectorAll(".bulletinPage").forEach((pagina) => pageSizeObserver.observe(pagina));
}

function filtrarEstudantes() {
  const busca = normalizarTexto(estado.busca);
  return estudantes.filter((estudante) => {
    if (estudante.turmaId !== estado.turma) return false;
    if (busca && !normalizarTexto(`${estudante.nome} ${estudante.codigo}`).includes(busca)) return false;
    if (!estado.resultados.size) return true;
    return estado.resultados.has(resultadoParaFiltro(estudante.resultadoFinal));
  });
}

function resultadoParaFiltro(resultado) {
  if (resultado === "REPROVADO PELO CONSELHO") return "REPROVADO";
  return resultado;
}

function criarBoletim(estudante, numero) {
  const documento = elemento("article", "bulletinDocument");
  documento.dataset.result = classeResultado(estudante.resultadoFinal);

  const cabecalho = elemento("header", "bulletinDocumentHeader");
  const logo = document.createElement("img");
  logo.src = "../logo_escola.png";
  logo.alt = "";
  logo.className = "bulletinSchoolLogo";
  cabecalho.append(logo);
  adicionarTexto(cabecalho, "strong", "ESCOLA MUN. PROFª IÊDA ALVES DE OLIVEIRA MCPM", "bulletinSchoolName");
  const estrelas = elemento("span", "bulletinStars");
  estrelas.setAttribute("aria-hidden", "true");
  for (let indice = 0; indice < 5; indice += 1) adicionarTexto(estrelas, "i", "★");
  cabecalho.append(estrelas);

  const corpo = elemento("div", "bulletinDocumentBody");
  corpo.append(criarIdentidade(estudante), criarTabelaNotas(estudante));

  const rodape = elemento("footer", "bulletinDocumentFooter");
  const alerta = elemento("span", "bulletinPrivacyWarning");
  const alertaIcone = elemento("b", "bulletinWarningIcon");
  alertaIcone.textContent = "!";
  alerta.append(alertaIcone, document.createTextNode("ATENÇÃO: NÃO JOGUE ESTE DOCUMENTO EM VIAS PÚBLICAS"));
  rodape.append(alerta);
  adicionarTexto(rodape, "span", `Nº ${String(numero).padStart(2, "0")}`, "bulletinNumber");

  documento.append(cabecalho, corpo, rodape);
  return documento;
}

function criarIdentidade(estudante) {
  const identidade = elemento("section", "bulletinStudentIdentity");
  const topo = elemento("div", "bulletinStudentTop");
  const foto = document.createElement("img");
  foto.src = "assets/estudante-ficticio-boletim-web.jpg";
  foto.alt = `Retrato fictício de ${estudante.nome}`;
  foto.className = "bulletinStudentPhoto";

  const dados = elemento("div", "bulletinStudentData");
  adicionarTexto(dados, "strong", estudante.nome.toLocaleUpperCase("pt-BR"));
  adicionarTexto(dados, "span", estudante.turma?.codigo || "—");
  topo.append(foto, dados);

  const progresso = elemento("div", "bulletinTermProgress");
  for (const [codigo, trimestre] of Object.entries(trimestres)) {
    if (!estado.trimestres.has(codigo)) continue;
    const valores = estudante.lancamentos.map((nota) => Number(nota[trimestre.campo])).filter(Number.isFinite);
    const media = valores.length ? valores.reduce((total, valor) => total + valor, 0) / valores.length : 0;
    const percentual = Math.max(0, Math.min(100, Math.round((media / trimestre.maximo) * 100)));
    const item = elemento("div", "bulletinProgressItem");
    adicionarTexto(item, "span", trimestre.rotulo);
    const circulo = elemento("strong", "bulletinProgressRing");
    circulo.style.setProperty("--bulletin-progress", `${percentual * 3.6}deg`);
    circulo.classList.toggle("is-low", percentual < 60);
    circulo.textContent = `${percentual}%`;
    item.append(circulo);
    progresso.append(item);
  }

  const situacao = elemento("div", `bulletinStudentResult ${classeResultado(estudante.resultadoFinal)}`);
  const icone = elemento("span", "bulletinResultIcon");
  icone.setAttribute("aria-hidden", "true");
  icone.textContent = iconeResultado(estudante.resultadoFinal);
  adicionarTexto(situacao, "strong", estudante.resultadoFinal);
  situacao.prepend(icone);

  topo.append(progresso);
  identidade.append(topo, situacao);
  return identidade;
}

function criarTabelaNotas(estudante) {
  const regiao = elemento("div", "bulletinGradeRegion");
  regiao.setAttribute("role", "region");
  regiao.setAttribute("aria-label", `Notas de ${estudante.nome}`);
  const tabela = elemento("table", "bulletinGradeTable");
  tabela.append(criarColunasTabela(), criarCabecalhoTabela(), criarCorpoTabela(estudante));
  regiao.append(tabela);
  return regiao;
}

function criarColunasTabela() {
  const colgroup = document.createElement("colgroup");
  colgroup.append(elemento("col", "bulletinPeriodColumn"), elemento("col", "bulletinKindColumn"));
  componentesBoletim.forEach(() => colgroup.append(elemento("col", "bulletinDisciplineColumn")));
  return colgroup;
}

function criarCabecalhoTabela() {
  const thead = document.createElement("thead");
  const row = document.createElement("tr");
  const titulo = document.createElement("th");
  titulo.colSpan = 2;
  titulo.scope = "colgroup";
  titulo.textContent = "APROVEITAMENTO ESCOLAR 2026";
  row.append(titulo);
  for (const codigo of componentesBoletim) {
    const componente = demoData.componentes.find((item) => item.codigo === codigo);
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = componente?.nome.toLocaleUpperCase("pt-BR") || codigo;
    row.append(th);
  }
  thead.append(row);
  return thead;
}

function criarCorpoTabela(estudante) {
  const tbody = document.createElement("tbody");
  for (const [codigo, trimestre] of Object.entries(trimestres)) {
    if (!estado.trimestres.has(codigo)) continue;
    tbody.append(
      criarLinhaTrimestre(estudante, trimestre, "NOTA", trimestre.campo),
      criarLinhaTrimestre(estudante, trimestre, "REC", trimestre.recuperacao, true)
    );
  }
  tbody.append(criarLinhaFinal(estudante));
  return tbody;
}

function criarLinhaTrimestre(estudante, trimestre, tipo, campo, recuperacao = false) {
  const row = document.createElement("tr");
  if (tipo === "NOTA") {
    const periodo = document.createElement("th");
    periodo.rowSpan = 2;
    periodo.scope = "rowgroup";
    periodo.textContent = trimestre.rotulo;
    row.append(periodo);
  }
  const tipoCelula = document.createElement("th");
  tipoCelula.scope = "row";
  tipoCelula.textContent = tipo;
  row.append(tipoCelula);

  for (const codigo of componentesBoletim) {
    const nota = lancamentoPorCodigo(estudante, codigo);
    const valor = Number(nota?.[campo]);
    const base = Number(nota?.[trimestre.campo]);
    const semRecuperacao = recuperacao && (!Number.isFinite(valor) || valor === base);
    row.append(criarCelulaNota(semRecuperacao ? null : valor, trimestre.minimo, recuperacao));
  }
  return row;
}

function criarLinhaFinal(estudante) {
  const row = elemento("tr", "bulletinFinalRow");
  const titulo = document.createElement("th");
  titulo.colSpan = 2;
  titulo.scope = "row";
  titulo.textContent = "NOTA FINAL";
  row.append(titulo);
  for (const codigo of componentesBoletim) {
    const nota = lancamentoPorCodigo(estudante, codigo);
    row.append(criarCelulaNota(Number(nota?.notaFinal), 60, false, true));
  }
  return row;
}

function criarCelulaNota(valor, minimo, recuperacao = false, final = false) {
  const td = document.createElement("td");
  if (!Number.isFinite(valor)) {
    td.textContent = "-";
    td.className = recuperacao ? "is-recovery-empty" : "is-missing";
    return td;
  }
  td.textContent = formatarMedia(valor);
  td.className = valor < minimo ? "is-low" : "is-pass";
  if (final) td.classList.add("is-final-score");
  return td;
}

function lancamentoPorCodigo(estudante, codigo) {
  return estudante.lancamentos.find((nota) => nota.componente?.codigo === codigo);
}

function classeResultado(resultado) {
  if (resultado.includes("CONSELHO") && resultado.startsWith("APROVADO")) return "is-council";
  if (resultado.includes("RECUPERAÇÃO")) return "is-recovery";
  if (resultado.startsWith("APROVADO")) return "is-approved";
  if (resultado === "EM CURSO") return "is-course";
  return "is-failed";
}

function iconeResultado(resultado) {
  if (resultado.startsWith("APROVADO")) return "✓";
  if (resultado === "EM CURSO") return "◷";
  return "×";
}

function aplicarZoom() {
  if (!ui.paginas) return;
  ui.paginas.style.setProperty("--bulletin-preview-zoom", String(estado.zoom));
}

async function alternarTelaCheia() {
  if (document.fullscreenElement === ui.viewport) {
    await document.exitFullscreen();
    return;
  }
  if (ui.viewport.requestFullscreen) await ui.viewport.requestFullscreen();
}

function sincronizarTelaCheia() {
  const ativo = document.fullscreenElement === ui.viewport;
  ui.telaCheia.classList.toggle("active", ativo);
  ui.telaCheia.setAttribute("aria-pressed", String(ativo));
  ui.telaCheia.querySelector("span").textContent = ativo ? "Sair da tela cheia" : "Tela cheia";
}

function abrirImpressao(baixarPdf) {
  document.body.dataset.printView = "boletim";
  const tituloAnterior = document.title;
  document.title = `Boletins-${ui.turma.selectedOptions[0]?.textContent || "turma"}-2026`;
  if (baixarPdf) ui.contador.textContent = "Na janela de impressão, escolha “Salvar como PDF”.";
  const restaurar = () => {
    document.title = tituloAnterior;
    renderBoletim();
    window.removeEventListener("afterprint", restaurar);
  };
  window.addEventListener("afterprint", restaurar);
  window.print();
}

function agrupar(lista, tamanho) {
  const grupos = [];
  for (let indice = 0; indice < lista.length; indice += tamanho) grupos.push(lista.slice(indice, indice + tamanho));
  return grupos;
}

function adicionarTexto(parent, tag, texto, className = "") {
  const child = elemento(tag, className);
  child.textContent = texto;
  parent.append(child);
  return child;
}

function elemento(tag, className = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

export { inicializarBoletim, renderBoletim };
