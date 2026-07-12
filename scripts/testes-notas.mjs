import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  calcularResultadoEstudante,
  calcularResumoGeral,
  classificarMedia,
  filtrarEstudantes,
  listarEstudantesComResumo,
  resumirComponentes,
  resumirEtapas,
  resumirTurmas
} from "../notas/js/domain.js";
import { demoData } from "../notas/js/demo-data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, "..");
const erros = [];

const arquivos = [
  "notas/index.html",
  "notas/css/tokens.css",
  "notas/css/base.css",
  "notas/css/layouts.css",
  "notas/css/componentes.css",
  "notas/css/boletim.css",
  "notas/js/app.js",
  "notas/js/boletim.js",
  "notas/js/config.js",
  "notas/js/demo-data.js",
  "notas/js/domain.js",
  "notas/js/graph-client.js",
  "scripts/auditoria-visual-boletim.mjs"
];

function conferir(condicao, mensagem) {
  if (!condicao) erros.push(mensagem);
}

function ler(relativo) {
  const caminho = path.join(raiz, relativo);
  conferir(existsSync(caminho), `Arquivo nao encontrado: ${relativo}`);
  return existsSync(caminho) ? readFileSync(caminho, "utf8") : "";
}

for (const arquivo of arquivos) {
  ler(arquivo);
}

for (const arquivo of arquivos.filter((nome) => nome.endsWith(".js"))) {
  const sintaxe = spawnSync(process.execPath, ["--check", path.join(raiz, arquivo)], {
    encoding: "utf8"
  });
  conferir(sintaxe.status === 0, `${arquivo} falhou no node --check.\n${sintaxe.stderr || sintaxe.stdout}`);
}

const html = ler("notas/index.html");
conferir(/<script\b[^>]*type=["']module["'][^>]*src=["']js\/app\.js["']/i.test(html), "notas/index.html nao carrega js/app.js como modulo.");
conferir(/href=["']css\/tokens\.css["']/.test(html), "notas/index.html nao referencia css/tokens.css.");
conferir(/href=["']css\/boletim\.css["']/.test(html), "notas/index.html nao referencia css/boletim.css.");
conferir(!/id=["']view-movimento["']/.test(html), "view-movimento deve permanecer removida; Estatisticas foi integrada em Notas.");
conferir(/id=["']view-notas["']/.test(html), "view-notas nao encontrada.");
conferir(/id=["']view-boletim["']/.test(html), "A nova view Boletim nao foi encontrada.");
conferir(!/class=["'][^"']*pageView active/i.test(html), "Views nao devem carregar com active fixo antes do roteamento JS.");
conferir(!/id=["']view-conselho["']/.test(html), "view-conselho deveria estar fora desta fase visual.");
conferir(!/id=["']view-relatorios["']/.test(html), "view-relatorios deveria estar fora desta fase visual.");
conferir(!/id=["']view-importacoes["']/.test(html), "view-importacoes deveria estar fora desta fase visual.");
conferir((html.match(/data-view=/g) || []).length === 2, "A navegacao deve conter somente as guias Notas e Boletim nesta fase.");
conferir(html.includes('data-view="notas"') && html.includes('data-view="boletim"'), "Menu lateral deve oferecer Notas e Boletim.");
conferir(!html.includes('data-view="movimento"') && !html.includes('aria-label="Estatísticas"'), "A aba Estatisticas nao deve aparecer como guia separada.");
conferir(/class=["'][^"']*notesStatsSection/.test(html) && /id=["']movementChart["']/.test(html) && /id=["']movementStats["']/.test(html) && /id=["']movementDonut["']/.test(html) && /id=["']movementRanking["']/.test(html), "Notas deve incorporar cards, ranking, grafico e donut de Estatisticas.");
conferir(/<option value=["']geral["']>VISÃO GERAL<\/option>/.test(html), "Notas deve oferecer a opcao VISÃO GERAL no periodo.");
conferir(/<option value=["']recT1["']>REC\. I TRIMESTRE<\/option>/.test(html) && /<option value=["']recT2["']>REC\. II TRIMESTRE<\/option>/.test(html) && /<option value=["']recT3["']>REC\. III TRIMESTRE<\/option>/.test(html) && /<option value=["']recuperacao["']>RECUPERAÇÃO ANUAL<\/option>/.test(html), "Notas deve oferecer recuperacao por trimestre e recuperacao anual.");
conferir(html.includes('data-stats-select-label="Turma"') && html.includes('data-stats-select-label="Período"'), "Notas deve usar hosts para seletores customizados.");
conferir(html.includes("globalSearchResults"), "Busca global deve renderizar painel proprio de resultados.");
conferir(html.includes("profileThemePanel"), "Temas visuais devem ficar dentro do menu de perfil.");
conferir(!html.includes("statsMoreButton") && !html.includes("statsDots") && !html.includes("Exibir valores"), "Estatisticas nao deve manter botoes sem uso no topo/grafico.");
conferir(!html.includes("ⓘ"), "Estatisticas nao deve manter indicadores visuais sem funcao.");
conferir(!html.includes("07/07/2026"), "Estatisticas nao deve carregar data demonstrativa fixa no rodape.");
conferir(/id=["']notasTabela["']/.test(html), "notasTabela nao encontrada.");
conferir(html.includes("notesSelectCard statsSelectCard"), "Aba Notas deve usar seletores customizados no padrao visual aprovado.");
conferir(/id=["']notasPrint["']/.test(html) && /id=["']notasFilterButton["']/.test(html), "Aba Notas deve ter impressao propria e filtro compacto na tabela.");
conferir(!html.includes("notesSummary"), "Aba Notas nao deve manter resumo de cards no cabecalho da ficha.");
conferir(html.includes("notesTableAnnotations") && html.includes('id="notesClassLabel" class="srOnly"'), "Aba Notas deve manter anotacoes compactas na tabela e contexto acessivel sem repetir cabecalho.");
conferir(!html.includes("Regra demonstrativa") && !/<p class=["']sectionKicker["']>Ficha de notas<\/p>/i.test(html), "Aba Notas nao deve repetir o titulo nem exibir a regra demonstrativa na ficha.");
conferir(!/Lista filtr[aá]vel/i.test(html), "Aba Notas nao deve manter texto de lista filtravel.");
conferir(/id=["']studentProfilePanel["']/.test(html), "studentProfilePanel nao encontrado.");
conferir(html.includes('role="dialog"') && html.includes('aria-modal="true"') && html.includes("studentProfileBackdrop"), "Painel do aluno deve usar dialogo modal com backdrop.");
conferir(/<caption class=["']srOnly["']>/.test(html) && html.includes('aria-describedby="notesClassLabel"'), "Tabela de Notas deve ter caption e contexto acessivel.");
conferir(html.includes('role="combobox"') && html.includes('aria-autocomplete="list"'), "Busca global deve expor semantica de combobox.");
conferir(html.includes("bulletinControlGrid") && html.includes("bulletinPreviewPanel") && html.includes("bulletinPages"), "Boletim deve conter controles e previa continua proprios.");
conferir(html.includes("bulletinClass") && html.includes("bulletinStudentSearch") && html.includes("bulletinSituationGrid"), "Boletim deve oferecer filtros de turma, aluno e situacao.");
conferir(html.includes("bulletinClassSelect statsSelectCard") && html.includes('data-stats-select-label="Turma"'), "Turma do Boletim deve usar seletor customizado no padrao de Notas.");
conferir(html.includes("bulletinPrint") && html.includes("bulletinDownload") && html.includes("bulletinFullscreen"), "Boletim deve oferecer impressao, PDF e tela cheia.");
conferir(!html.includes("bulletinPreviousPage") && !html.includes("bulletinPageStatus") && !html.includes("bulletinNextPage"), "Boletim continuo nao deve exigir cliques de paginacao.");

const appTexto = ler("notas/js/app.js");
const cssBase = ler("notas/css/base.css");
const cssTokens = ler("notas/css/tokens.css");
const cssLayouts = ler("notas/css/layouts.css");
const cssComponentes = ler("notas/css/componentes.css");
const boletimTexto = ler("notas/js/boletim.js");
const cssBoletim = ler("notas/css/boletim.css");
conferir(appTexto.includes("renderMovimento"), "Painel analitico integrado de Notas nao encontrado em app.js.");
conferir(appTexto.includes('estatisticas: "notas"') && appTexto.includes('movimento: "notas"'), "Hashes legados #estatisticas/#movimento devem abrir a aba Notas.");
conferir(!appTexto.includes('movimento: "estatisticas"'), "A URL canonica nao deve voltar a publicar #estatisticas como view separada.");
conferir(appTexto.includes("sincronizarAnaliseComNotas"), "Seletores de Notas devem sincronizar tabela, insights e painel analitico.");
conferir(appTexto.includes("criarRecorteMovimento"), "Painel analitico de Notas deve calcular metricas pelo recorte selecionado.");
conferir(appTexto.includes("disciplinaSelecionada") && appTexto.includes("sincronizarGraficoMovimento"), "Grafico integrado deve selecionar disciplina sem recriar as barras.");
conferir(appTexto.includes(".slice(0, 10)") && appTexto.includes("rankingExtra") && appTexto.includes("sincronizarRankingMovimento"), "Ranking integrado deve manter top 10 no DOM e alternar por estado visual.");
conferir(appTexto.includes("movementClassPanelTitle"), "Painel analitico deve atualizar o detalhamento por disciplina/turma.");
conferir(appTexto.includes("enhanceStatsSelects"), "Notas deve substituir o select nativo por seletor customizado sincronizado.");
conferir(appTexto.indexOf("inicializarBoletim();") < appTexto.indexOf("enhanceStatsSelects();"), "Boletim deve preencher as turmas antes de criar o seletor customizado.");
conferir(appTexto.includes("openStatsSelect") && appTexto.includes("chooseStatsSelectOption"), "Seletor customizado de Notas deve abrir e sincronizar opcoes.");
conferir(appTexto.includes("statsSelectOptionMeta"), "Seletor customizado deve esconder codigos tecnicos como T1/T2/GERAL na descricao visual.");
conferir(appTexto.includes("statsSelectIconName") && appTexto.includes("calendar"), "Seletores de Notas devem renderizar icones de turma e periodo.");
conferir(appTexto.includes("renderGlobalSearchResults") && appTexto.includes("closeGlobalSearchResults"), "Busca global deve usar painel proprio e fechar ao clicar fora.");
conferir(appTexto.includes("somaPeriodoEstudante") && appTexto.includes("formatarSomaPontuacao"), "Painel analitico deve ranquear e exibir pontuacao por soma.");
conferir(appTexto.includes("MÉDIA DA TURMA") && appTexto.includes("mediaTurma") && appTexto.includes("ALUNOS SEM NOTA VERMELHA") && appTexto.includes("ALUNOS EM ATENÇÃO"), "Painel analitico deve rotular como alunos as metricas calculadas por aluno.");
conferir(appTexto.includes("alunosVermelhos") && appTexto.includes("Relatório da disciplina"), "Clique em disciplina deve abrir relatorio de notas vermelhas.");
conferir(appTexto.includes("calcularMaxEixoMovimento"), "Grafico integrado deve escalar o eixo pelo maior valor real do recorte.");
conferir(!appTexto.includes("VER TOP 10 POR SOMA") && !appTexto.includes("SOMA DO RECORTE") && !appTexto.includes("ⓘ"), "Estatisticas nao deve manter textos antigos sem funcao.");
conferir(!appTexto.includes("imprimirRelatorioMovimento") && !appTexto.includes('printView = "movimento"'), "A antiga impressao separada de Estatisticas deve permanecer removida.");
conferir(!appTexto.includes("movimentoAtualizacaoPadrao"), "Rodape de Estatisticas nao deve depender de data demonstrativa fixa.");
conferir(!/abaixo da m[eé]dia/i.test(appTexto), "Estatisticas nao deve usar linguagem de abaixo da media.");
conferir(!appTexto.includes("movimentoReferencia"), "Estatisticas nao deve depender do objeto estatico antigo movimentoReferencia.");
conferir(appTexto.includes("renderNotesTable"), "renderNotesTable nao encontrado em app.js.");
conferir(appTexto.includes("highlightNotesColumn") && appTexto.includes("toggleNotasFilterMenu") && appTexto.includes("closeNotasFilterMenu"), "Aba Notas deve destacar coluna e usar filtro compacto.");
conferir(appTexto.includes("firstScoreColumn = 3") && appTexto.includes("lastScoreColumn"), "Destaque de coluna em Notas deve ficar restrito as colunas de notas.");
conferir(appTexto.includes("resultadoPill") && appTexto.includes("statusPill") && appTexto.includes('state.view === "notas"'), "Aba Notas deve renderizar pílulas de status/resultado e preservar o cabecalho superior ativo.");
conferir(!appTexto.includes("renderNotesSummary") && !appTexto.includes("notesSummary"), "Aba Notas nao deve recriar resumo/dashboard de cards na ficha.");
conferir(appTexto.includes("notesInsightsTitle") && appTexto.includes("Alunos em atenção (abaixo do mínimo)"), "Insights de Notas devem seguir painel lateral limpo no estilo do anexo 10.");
conferir(!appTexto.includes('appendText(row, "b", formatarMedia(menorNotaVermelha'), "Insights de Notas nao devem voltar a mostrar nota numerica ao lado do aluno.");
conferir(appTexto.includes("periodoNotasInfo") && appTexto.includes("recuperacao"), "Aba Notas deve tratar Recuperacao sem quebrar calculos de periodo.");
conferir(appTexto.includes("recT1") && appTexto.includes("recT2") && appTexto.includes("recT3") && appTexto.includes('base: "T1"'), "Aba Notas deve tratar recuperacoes por trimestre.");
conferir(appTexto.includes("notesTableNotice") && appTexto.includes("notesInsightEmptyBlock"), "Quando Todas as turmas estiver selecionado, Notas deve esconder grade geral e valores laterais.");
conferir(appTexto.includes("nomeAluno(estudante)") && appTexto.includes('toLocaleUpperCase("pt-BR")'), "Nomes de alunos devem ser renderizados em caixa alta.");
conferir(appTexto.includes('!event.target.closest("#studentProfilePanel")') && appTexto.includes("fecharPerfilAluno();"), "Painel lateral do aluno deve fechar ao clicar fora.");
conferir(appTexto.includes("imprimirRelatorioNotas") && appTexto.includes('printView = "notas"'), "Botao de impressao de Notas deve imprimir a propria ficha.");
conferir(appTexto.includes("APROVADO APÓS RECUPERAÇÃO") && appTexto.includes("APROVADO PELO CONSELHO") && appTexto.includes("REPROVADO PELO CONSELHO"), "Aba Notas deve contemplar os resultados finais demonstrativos aprovados.");
conferir(appTexto.includes('from "./boletim.js"') && appTexto.includes('boletim: [') && appTexto.includes('boletins: "boletim"'), "App deve registrar a nova guia Boletim como modulo independente.");
conferir(appTexto.includes("scoreMissing") && appTexto.includes("formatarNota") && !appTexto.includes("if (!nota) return 0"), "Nota ausente deve ser diferente de zero.");
conferir(appTexto.includes("trapStudentPanelFocus") && appTexto.includes("studentPanelTrigger"), "Painel do aluno deve conter foco e devolve-lo ao acionador.");
conferir(appTexto.includes('row = element("button", "attentionStudent")'), "Alunos em atencao devem ser acionaveis por teclado.");
conferir(appTexto.includes('aria-pressed') && appTexto.includes('aria-current'), "Controles ativos devem comunicar estado acessivel.");
conferir(appTexto.includes("studentPeek"), "Previa compacta do aluno nao encontrada em app.js.");
conferir(appTexto.includes("RL") && appTexto.includes("RD") && appTexto.includes("CPT"), "Mapeamento de componentes pedido nao encontrado.");
conferir(cssComponentes.includes(".notesStatsSection") && cssComponentes.includes(".movementBars"), "Estilo do painel analitico integrado em Notas nao encontrado.");
conferir(cssComponentes.includes(".movementBar.active"), "Painel analitico deve destacar disciplina selecionada no grafico.");
conferir(cssComponentes.includes(".classResultsPanel"), "Painel analitico deve estilizar o detalhamento quantitativo.");
conferir(cssTokens.includes("--motion-standard") && cssTokens.includes("--motion-emphasis"), "Tokens de movimento devem existir para o modulo.");
conferir(cssBase.includes("@media (prefers-reduced-motion: reduce)"), "Modulo deve respeitar prefers-reduced-motion.");
conferir(cssComponentes.includes(".statsSelectMenu") && cssComponentes.includes(".statsSelectOption"), "Seletor customizado de Notas deve ter menu proprio.");
conferir(cssComponentes.includes(".searchResultsPanel") && cssComponentes.includes("@keyframes searchResultsEnter"), "Busca global deve ter painel animado de resultados.");
conferir(cssComponentes.includes("@keyframes profileMenuEnter"), "Menu de perfil deve ter entrada visual normalizada.");
conferir(cssComponentes.includes(".statsSelectButton .movementIcon"), "Seletores de Notas devem exibir icones no proprio controle.");
conferir(cssComponentes.includes(".studentPhotoAvatar") && cssComponentes.includes(".rankingList.is-expanded"), "Ranking deve usar fotos ficticias e expansao interna.");
conferir(cssComponentes.includes("scrollbar-gutter: stable"), "Ranking expandido deve reservar gutter para evitar deslocamento ao mostrar rolagem.");
conferir(cssComponentes.includes("@keyframes statsBarGrow") && cssComponentes.includes("@keyframes donutBreathe"), "Graficos do painel analitico devem ter animacoes de entrada e movimento leve.");
conferir(cssComponentes.includes("@keyframes blueBarFlow") && cssComponentes.includes("@keyframes redBarFlow"), "Barras do painel analitico devem ter transicao lenta de cor.");
conferir(cssComponentes.includes("@keyframes donutToneFlow"), "Donut do painel analitico deve alternar tons no anel sem girar o percentual.");
conferir(!/@keyframes donutBreathe[\s\S]*?rotate\s*:/m.test(cssComponentes), "Percentual do donut do painel analitico nao deve girar.");
conferir(cssComponentes.includes('body[data-theme="claro"][data-view="notas"] .notesStatsSection') && cssComponentes.includes('body[data-theme="mono"][data-view="notas"] .notesStatsSection'), "Temas claro e mono devem ter acabamento especifico no painel analitico integrado.");
conferir(cssComponentes.includes(".notesTable"), "Estilo da tabela de notas nao encontrado.");
conferir(cssComponentes.includes('body[data-view="notas"] .notesPrintButton') && cssComponentes.includes('body[data-view="notas"] .notesSelectCard'), "Aba Notas deve ter acabamento visual proprio para seletores e impressao.");
conferir(/body\[data-view="notas"\]\s+\.statsSelectButton\s*\{[\s\S]*?min-height:\s*82px;[\s\S]*?padding:\s*17px 56px 14px 20px;[\s\S]*?grid-template-columns:\s*34px minmax\(0, 1fr\)/m.test(cssComponentes), "Seletores de Notas devem manter as mesmas dimensoes dos seletores de Estatisticas.");
conferir(cssComponentes.includes("--notes-select-menu") && cssComponentes.includes("rgba(23, 64, 112, 0.985)") && /body\[data-view="notas"\]\s+\.statsSelectMenu\s*\{[\s\S]*?background:\s*var\(--notes-select-menu\);[\s\S]*?box-shadow:\s*var\(--notes-select-menu-shadow\);/m.test(cssComponentes), "Menus dos seletores de Notas devem ser opacos e padronizados com Estatisticas.");
conferir(cssComponentes.includes("grid-template-columns: minmax(0, 1fr) minmax(86px, auto)") && cssComponentes.includes("justify-self: end"), "Opcoes de periodo devem manter o texto de recuperacao na mesma linha do rótulo.");
conferir(cssComponentes.includes('body[data-view="notas"] .notesTableWrap') && cssComponentes.includes("notesRiseIn"), "Aba Notas deve manter tabela responsiva e movimento apenas em superficies de maior nivel.");
conferir(cssComponentes.includes(".notesFilterPopover") && cssComponentes.includes(".statusPill") && cssComponentes.includes(".notesResultPill"), "Aba Notas deve ter filtro compacto e pílulas de status/resultado.");
conferir(!cssComponentes.includes(".notesSummary") && cssComponentes.includes(".notesTableAnnotations"), "CSS de Notas deve remover dashboard antigo e estilizar anotacoes da tabela.");
conferir(cssComponentes.includes(".notesNameCell:hover") && cssComponentes.includes("--notes-peek-bg: #031126") && cssComponentes.includes("z-index: 520"), "Hover do aluno deve ser opaco e ficar acima da tabela.");
conferir(/body\[data-view="notas"\]\s+\.studentPeek\s*\{[\s\S]*?display:\s*none;[\s\S]*?pointer-events:\s*none;/m.test(cssComponentes), "Previa do aluno em Notas deve ficar escondida por padrao para nao sobrepor nomes.");
conferir(/body\[data-view="notas"\]\s+\.notesNameCell:hover\s+\.studentPeek,\s*body\[data-view="notas"\]\s+\.studentNameButton:focus\s+\+\s+\.studentPeek\s*\{[\s\S]*?display:\s*grid;/m.test(cssComponentes), "Previa do aluno em Notas deve aparecer somente no hover/foco.");
conferir(cssComponentes.includes(".studentPeekPhoto") && cssComponentes.includes("width: 108px") && cssComponentes.includes("height: 126px"), "Hover do aluno deve exibir apenas foto maior e legivel.");
conferir(cssComponentes.includes("white-space: nowrap") && cssComponentes.includes("border-spacing: 0 2px"), "Tabela de Notas deve manter status em linha unica e densidade compacta.");
conferir(cssComponentes.includes("width: min(306px") && cssComponentes.includes("grid-template-columns: repeat(2, minmax(0, 1fr))") && cssComponentes.includes("min-height: 30px") && cssComponentes.includes("z-index: 430"), "Filtro compacto de Notas deve ficar menor e acima da tabela.");
conferir(cssComponentes.includes('body[data-theme="claro"][data-view="notas"]') && cssComponentes.includes('body[data-theme="mono"][data-view="notas"]'), "Temas claro e mono devem ter acabamento especifico na aba Notas.");
conferir(!/body\[data-view="notas"\]\s+\.notesTable\s+tbody\s+tr\s*\{\s*animation-delay/m.test(cssComponentes), "Tabela de Notas nao deve atrasar linhas com animation-delay progressivo.");
conferir(!/body\[data-view="notas"\]\s+\.scorePill\s*\{[\s\S]*?animation:\s*scoreBreath/m.test(cssComponentes), "Tabela de Notas nao deve animar todos os chips de nota durante a rolagem.");
conferir(cssComponentes.includes("grid-auto-rows: 42px") && cssComponentes.includes("height: 42px"), "Ranking do painel analitico deve manter mesma altura de itens no top 3 e top 10.");
conferir(cssComponentes.includes("padding-top: 34px") && cssComponentes.includes("height: 221px"), "Grafico do painel analitico deve reservar respiro superior para rotulos das barras.");
conferir(cssComponentes.includes("conic-gradient(from -126deg, rgba(255, 255, 255, 0.18)") && cssComponentes.includes("0 11px 0 rgba(4, 17, 37, 0.58)"), "Donut do painel analitico deve manter relevo 3D sutil.");
conferir(!cssComponentes.includes(".a4Sheet") && !cssComponentes.includes(".miniBoletim"), "CSS legado do antigo Boletim nao deve voltar ao arquivo geral de componentes.");
conferir(cssComponentes.includes(".scorePill.scoreMissing"), "Nota ausente deve ter estilo neutro proprio.");
conferir(cssLayouts.includes(".studentProfileBackdrop") && cssLayouts.includes('MODELO VISUAL — DADOS FICTÍCIOS — SEM VALIDADE'), "Painel modal e impressao visual devem ter protecoes proprias.");
conferir(cssComponentes.includes(".studentPeek"), "Estilo da previa de aluno nao encontrado.");
conferir(cssLayouts.includes(".appRail"), "Menu lateral compacto nao encontrado no layout.");
conferir(cssLayouts.includes('body[data-view="notas"] .notesGrid') && cssLayouts.includes("minmax(282px, 0.34fr)"), "Insights de Notas devem ficar em coluna lateral mais estreita no desktop.");
conferir(cssLayouts.includes(".studentProfilePanel") && cssLayouts.includes("z-index: 900") && cssLayouts.includes("rgba(8, 28, 58, 0.992"), "Painel lateral do aluno deve ser mais opaco e ficar acima da pagina.");
conferir(!cssLayouts.includes('body[data-print-view="movimento"]'), "Impressao separada da antiga Estatisticas deve permanecer removida.");
conferir(!/body\[data-view=["']movimento["']\]\s+\.appRail[\s\S]{0,120}display\s*:\s*none/i.test(cssLayouts), "Hash legado de Estatisticas nao deve esconder o menu lateral compacto.");
conferir(!/body\[data-view=["']movimento["']\]\s+\.systemBar[\s\S]{0,120}display\s*:\s*none/i.test(cssLayouts), "Hash legado de Estatisticas deve manter o cabecalho superior do sistema.");

conferir(!boletimTexto.includes("innerHTML"), "Boletim nao deve montar dados ficticios com innerHTML.");
conferir(boletimTexto.includes("agrupar(selecionados, 4)") && cssBoletim.includes("grid-template-rows: repeat(4, minmax(0, 1fr))"), "Boletim deve paginar quatro alunos verticalmente por folha.");
conferir(boletimTexto.includes("agendarPreenchimentoProgressivo") && boletimTexto.includes("requestIdleCallback") && boletimTexto.includes("IntersectionObserver"), "Previa continua deve preencher folhas progressivamente e priorizar as proximas da rolagem.");
conferir(boletimTexto.includes("renderBoletim({ todasPaginas: true })") && boletimTexto.includes('addEventListener("beforeprint"'), "Impressao/PDF deve remontar todas as folhas somente quando necessario.");
conferir(boletimTexto.includes("ResizeObserver") && boletimTexto.includes("--bulletin-shared-scale") && boletimTexto.includes("largura / 1505"), "Boletim deve recalcular uma escala compartilhada quando a largura da previa mudar.");
conferir(boletimTexto.includes("topo.append(progresso)") && cssBoletim.includes("grid-row: 1 / 3"), "Circulos dos trimestres devem ficar ao lado da foto, conforme a referencia.");
conferir(boletimTexto.includes("estado.turma") && boletimTexto.includes("estudante.turmaId !== estado.turma"), "Selecao de turma deve gerar todos os boletins daquela turma.");
conferir(boletimTexto.includes("resultadoParaFiltro") && boletimTexto.includes("normalizarTexto(estado.busca)"), "Filtros de situacao e aluno devem atuar sobre a previa.");
conferir(boletimTexto.includes("bulletinStudentPhoto") && existsSync(path.join(raiz, "notas/assets/estudante-ficticio-boletim-web.jpg")), "Boletim deve usar retrato ficticio otimizado e versionado no projeto.");
conferir(boletimTexto.includes('dataset.printView = "boletim"'), "Acao Imprimir deve preparar a impressao exclusiva do Boletim.");
conferir(boletimTexto.includes("async function baixarPdf()") && boletimTexto.includes("PDFDocument.create()") && boletimTexto.includes("html2canvas") && boletimTexto.includes("link.download = nome"), "Baixar PDF deve gerar e baixar um arquivo real sem abrir a impressao.");
conferir(!/function baixarPdf[\s\S]*?window\.print\(\)/m.test(boletimTexto), "Baixar PDF nao pode abrir a janela de impressao.");
conferir(cssBoletim.includes("table-layout: fixed") && cssBoletim.includes(".bulletinDisciplineColumn") && cssBoletim.includes("width: 7.0583%"), "As 12 colunas de disciplinas do Boletim devem ter a mesma largura, inclusive Computacao.");
conferir(cssBoletim.includes("var(--bulletin-content-scale)") && cssBoletim.includes("@media (max-width: 1320px)"), "Conteudo e controles do Boletim devem reduzir proporcionalmente sem invadir margens.");
conferir(cssBoletim.includes("--bulletin-score-blue") && /\.bulletinGradeTable td\.is-pass[\s\S]*?var\(--bulletin-score-blue\)/m.test(cssBoletim) && /\.bulletinFinalRow td\.is-pass[\s\S]*?var\(--bulletin-score-blue\)/m.test(cssBoletim), "Notas azuis e nota final devem usar exatamente a mesma cor base.");
conferir(cssBoletim.includes("@page bulletin") && cssBoletim.includes("size: A4 portrait") && cssBoletim.includes("page: bulletin"), "Impressao do Boletim deve usar A4 vertical.");
conferir(cssBoletim.includes('[data-print-view="boletim"]') && cssBoletim.includes('[data-view="boletim"]') && cssBoletim.includes("break-after: page"), "Impressao deve isolar o Boletim ativo e separar as folhas.");
conferir(cssBoletim.includes("content-visibility: auto") && cssBoletim.includes("contain-intrinsic-size") && !cssBoletim.includes(".bulletinPagination"), "Folhas continuas fora da tela devem evitar custo de pintura sem recriar paginacao.");
conferir(cssBoletim.includes(".bulletinClassSelect .statsSelectMenu") && cssBoletim.includes(".bulletinClassSelect .statsSelectOption.active"), "Seletor de turma do Boletim deve ter menu e estado ativo proprios.");
conferir(cssBoletim.includes(".bulletinPages.is-direct-pdf") && cssBoletim.includes("aspect-ratio: 210 / 297") && boletimTexto.includes('classList.add("is-direct-pdf")'), "Download direto deve encaixar quatro boletins em uma folha A4 sem margens extras.");
conferir(cssBoletim.includes(".bulletinGradeRegion::after") && cssBoletim.includes(".bulletinGradeTable tbody tr:hover td") && cssBoletim.includes(".bulletinFinalRow td.is-pass"), "Tabela do Boletim deve manter acabamento UI moderno, interacao e destaque da nota final.");
conferir(cssBoletim.includes(".bulletinSituationButton.is-course.active") && !cssBoletim.includes(".bulletinSituationButton.is-course {"), "Situacoes do Boletim devem receber cor somente quando selecionadas.");
conferir(/@media print[\s\S]*?\.bulletinProgressRing[\s\S]*?background:\s*#fff !important;/m.test(cssBoletim) && /@media print[\s\S]*?\.bulletinStudentPhoto[\s\S]*?box-shadow:\s*none !important;/m.test(cssBoletim), "PDF deve remover rasterizacoes decorativas pesadas sem alterar a previa.");
conferir(cssBoletim.includes("@media (max-width: 560px)") && cssBoletim.includes("min-width: calc(1210px"), "Boletim deve preservar o documento fiel dentro de viewport rolavel no mobile.");

const auditoriaVisualTexto = ler("scripts/auditoria-visual-boletim.mjs");
for (const viewport of ["1672, height: 941", "1550, height: 741", "1420, height: 941", "1280, height: 720", "390, height: 844"]) {
  conferir(auditoriaVisualTexto.includes(viewport), `Auditoria visual deve cobrir o viewport ${viewport}.`);
}
conferir(auditoriaVisualTexto.includes("columnSpread") && auditoriaVisualTexto.includes("bodyOverflow") && auditoriaVisualTexto.includes("documentsValid"), "Auditoria visual deve verificar colunas, overflow e geometria interna.");

const demoTexto = ler("notas/js/demo-data.js");
const termosProibidos = ["ALICE", "AMANDA", "ROSE MARCIA", "CPF", "INEP"];
for (const termo of termosProibidos) {
  conferir(!demoTexto.toUpperCase().includes(termo), `Fixture de notas contem termo proibido: ${termo}`);
}

conferir(classificarMedia(75) === "regular", "Media 75 deveria ser regular.");
conferir(classificarMedia(65) === "atencao", "Media 65 deveria ser atencao.");
conferir(classificarMedia(45) === "critico", "Media 45 deveria ser critico.");
conferir(calcularResultadoEstudante({ decisaoConselho: "aprovado", lancamentos: [{ total: 70, totalRec: 70 }] }) === "APROVADO PELO CONSELHO", "Decisao de aprovacao do Conselho deve prevalecer sobre a nota calculada.");
conferir(calcularResultadoEstudante({ decisaoConselho: "reprovado", lancamentos: [{ total: 70, totalRec: 70 }] }) === "REPROVADO PELO CONSELHO", "Decisao de reprovacao do Conselho deve prevalecer sobre a nota calculada.");
conferir(calcularResultadoEstudante({ lancamentos: [] }) === "EM CURSO", "Aluno sem lancamentos nao deve ser reprovado automaticamente.");
conferir(calcularResultadoEstudante({ lancamentos: [{ total: "", totalRec: "" }] }) === "EM CURSO", "Nota ainda nao lancada deve manter resultado EM CURSO.");

const estudantes = listarEstudantesComResumo(demoData);
const turmas = resumirTurmas(demoData);
const resumo = calcularResumoGeral(demoData);
const componentes = resumirComponentes(demoData, estudantes);
const etapas = resumirEtapas(demoData.lancamentos);
const filtrados = filtrarEstudantes(estudantes, {
  busca: "beatriz",
  turma: "todas",
  componente: "todos",
  situacao: "todas"
});

conferir(estudantes.length === demoData.estudantes.length, "Resumo de estudantes perdeu registros.");
conferir(turmas.length === demoData.turmas.length, "Resumo de turmas perdeu registros.");
conferir(componentes.length === demoData.componentes.length, "Resumo de componentes perdeu registros.");
conferir(etapas.length === 5, "Resumo de etapas deveria conter trimestres, total e recuperacao.");
conferir(resumo.totalEstudantes === demoData.estudantes.length, "Resumo geral com total de estudantes incorreto.");
conferir(filtrados.length > 0, "Filtro de busca nao encontrou estudantes ficticios esperados.");
conferir(demoData.lancamentos.every((item) => item.origem === "fixture-demo"), "Lancamentos de demo devem estar marcados como fixture-demo.");
conferir(demoData.componentes.length >= 12, "Fixture deve representar a matriz anual de componentes.");
conferir(demoData.componentes.map((item) => item.codigo).join("|") === "P|M|C|H|G|A|F|I|RL|RD|ET|CPT", "Fixture deve usar apenas codigos canonicos dos componentes.");
conferir(demoData.estudantes.length === demoData.turmas.length * 35, "Fixture deve manter 35 alunos ficticios por turma.");
const resultadosDemo = new Set(estudantes.map((estudante) => estudante.resultadoFinal));
for (const resultado of ["APROVADO DIRETO", "APROVADO APÓS RECUPERAÇÃO", "APROVADO PELO CONSELHO", "REPROVADO PELO CONSELHO", "REPROVADO"]) {
  conferir(resultadosDemo.has(resultado), `Fixture deve conter resultado demonstrativo: ${resultado}`);
}
conferir(resultadosDemo.has(calcularResultadoEstudante(estudantes[0])), "Resultado demonstrativo inesperado.");

if (erros.length) {
  console.error("Testes do modulo de notas falharam:");
  for (const erro of erros) console.error(`- ${erro}`);
  process.exit(1);
}

console.log("Testes do modulo de notas concluidos com sucesso.");
console.log(`- Arquivos verificados: ${arquivos.length}.`);
console.log(`- Estudantes ficticios: ${demoData.estudantes.length}.`);
console.log(`- Turmas ficticias: ${demoData.turmas.length}.`);
console.log(`- Lancamentos ficticios: ${demoData.lancamentos.length}.`);
