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
  "notas/js/app.js",
  "notas/js/config.js",
  "notas/js/demo-data.js",
  "notas/js/domain.js",
  "notas/js/graph-client.js"
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
conferir(!/id=["']view-movimento["']/.test(html), "view-movimento deve permanecer removida; Estatisticas foi integrada em Notas.");
conferir(/id=["']view-notas["']/.test(html), "view-notas nao encontrada.");
conferir(/id=["']view-boletim["']/.test(html), "view-boletim nao encontrada.");
conferir(!/class=["'][^"']*pageView active/i.test(html), "Views nao devem carregar com active fixo antes do roteamento JS.");
conferir(!/id=["']view-conselho["']/.test(html), "view-conselho deveria estar fora desta fase visual.");
conferir(!/id=["']view-relatorios["']/.test(html), "view-relatorios deveria estar fora desta fase visual.");
conferir(!/id=["']view-importacoes["']/.test(html), "view-importacoes deveria estar fora desta fase visual.");
conferir((html.match(/data-view=/g) || []).length === 2, "A navegacao deve conter somente Notas e Boletim nesta fase.");
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
conferir(/id=["']boletimA4Preview["']/.test(html), "boletimA4Preview nao encontrado.");
conferir(/id=["']studentProfilePanel["']/.test(html), "studentProfilePanel nao encontrado.");

const appTexto = ler("notas/js/app.js");
const cssBase = ler("notas/css/base.css");
const cssTokens = ler("notas/css/tokens.css");
const cssLayouts = ler("notas/css/layouts.css");
const cssComponentes = ler("notas/css/componentes.css");
conferir(appTexto.includes("renderMovimento"), "Painel analitico integrado de Notas nao encontrado em app.js.");
conferir(appTexto.includes('estatisticas: "notas"') && appTexto.includes('movimento: "notas"'), "Hashes legados #estatisticas/#movimento devem abrir a aba Notas.");
conferir(!appTexto.includes('movimento: "estatisticas"'), "A URL canonica nao deve voltar a publicar #estatisticas como view separada.");
conferir(appTexto.includes("sincronizarAnaliseComNotas"), "Seletores de Notas devem sincronizar tabela, insights e painel analitico.");
conferir(appTexto.includes("criarRecorteMovimento"), "Painel analitico de Notas deve calcular metricas pelo recorte selecionado.");
conferir(appTexto.includes("disciplinaSelecionada") && appTexto.includes("sincronizarGraficoMovimento"), "Grafico integrado deve selecionar disciplina sem recriar as barras.");
conferir(appTexto.includes(".slice(0, 10)") && appTexto.includes("rankingExtra") && appTexto.includes("sincronizarRankingMovimento"), "Ranking integrado deve manter top 10 no DOM e alternar por estado visual.");
conferir(appTexto.includes("movementClassPanelTitle"), "Painel analitico deve atualizar o detalhamento por disciplina/turma.");
conferir(appTexto.includes("enhanceStatsSelects"), "Notas deve substituir o select nativo por seletor customizado sincronizado.");
conferir(appTexto.includes("openStatsSelect") && appTexto.includes("chooseStatsSelectOption"), "Seletor customizado de Notas deve abrir e sincronizar opcoes.");
conferir(appTexto.includes("statsSelectOptionMeta"), "Seletor customizado deve esconder codigos tecnicos como T1/T2/GERAL na descricao visual.");
conferir(appTexto.includes("statsSelectIconName") && appTexto.includes("calendar"), "Seletores de Notas devem renderizar icones de turma e periodo.");
conferir(appTexto.includes("renderGlobalSearchResults") && appTexto.includes("closeGlobalSearchResults"), "Busca global deve usar painel proprio e fechar ao clicar fora.");
conferir(appTexto.includes("somaPeriodoEstudante") && appTexto.includes("formatarSomaPontuacao"), "Painel analitico deve ranquear e exibir pontuacao por soma.");
conferir(appTexto.includes("MÉDIA DA TURMA") && appTexto.includes("mediaTurma") && appTexto.includes("NOTAS AZUIS") && appTexto.includes("NOTAS VERMELHAS"), "Painel analitico deve usar notas azuis/vermelhas e media real da turma.");
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
conferir(appTexto.includes("criarMiniBoletim"), "criarMiniBoletim nao encontrado em app.js.");
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
conferir(cssComponentes.includes(".studentPeekPhoto") && cssComponentes.includes("width: 108px") && cssComponentes.includes("height: 126px"), "Hover do aluno deve exibir apenas foto maior e legivel.");
conferir(cssComponentes.includes("white-space: nowrap") && cssComponentes.includes("border-spacing: 0 2px"), "Tabela de Notas deve manter status em linha unica e densidade compacta.");
conferir(cssComponentes.includes("width: min(306px") && cssComponentes.includes("grid-template-columns: repeat(2, minmax(0, 1fr))") && cssComponentes.includes("min-height: 30px") && cssComponentes.includes("z-index: 430"), "Filtro compacto de Notas deve ficar menor e acima da tabela.");
conferir(cssComponentes.includes('body[data-theme="claro"][data-view="notas"]') && cssComponentes.includes('body[data-theme="mono"][data-view="notas"]'), "Temas claro e mono devem ter acabamento especifico na aba Notas.");
conferir(!/body\[data-view="notas"\]\s+\.notesTable\s+tbody\s+tr\s*\{\s*animation-delay/m.test(cssComponentes), "Tabela de Notas nao deve atrasar linhas com animation-delay progressivo.");
conferir(!/body\[data-view="notas"\]\s+\.scorePill\s*\{[\s\S]*?animation:\s*scoreBreath/m.test(cssComponentes), "Tabela de Notas nao deve animar todos os chips de nota durante a rolagem.");
conferir(cssComponentes.includes("grid-auto-rows: 42px") && cssComponentes.includes("height: 42px"), "Ranking do painel analitico deve manter mesma altura de itens no top 3 e top 10.");
conferir(cssComponentes.includes("padding-top: 34px") && cssComponentes.includes("height: 221px"), "Grafico do painel analitico deve reservar respiro superior para rotulos das barras.");
conferir(cssComponentes.includes("conic-gradient(from -126deg, rgba(255, 255, 255, 0.18)") && cssComponentes.includes("0 11px 0 rgba(4, 17, 37, 0.58)"), "Donut do painel analitico deve manter relevo 3D sutil.");
conferir(cssComponentes.includes(".a4Sheet"), "Estilo da folha A4 nao encontrado.");
conferir(cssComponentes.includes(".miniBoletim"), "Estilo do mini boletim nao encontrado.");
conferir(cssComponentes.includes("grid-template-rows: repeat(4, 1fr)"), "Boletim deve usar quatro faixas horizontais na folha A4.");
conferir(cssComponentes.includes(".studentPeek"), "Estilo da previa de aluno nao encontrado.");
conferir(cssLayouts.includes(".appRail"), "Menu lateral compacto nao encontrado no layout.");
conferir(cssLayouts.includes('body[data-view="notas"] .notesGrid') && cssLayouts.includes("minmax(282px, 0.34fr)"), "Insights de Notas devem ficar em coluna lateral mais estreita no desktop.");
conferir(cssLayouts.includes(".studentProfilePanel") && cssLayouts.includes("z-index: 900") && cssLayouts.includes("rgba(8, 28, 58, 0.992"), "Painel lateral do aluno deve ser mais opaco e ficar acima da pagina.");
conferir(!cssLayouts.includes('body[data-print-view="movimento"]'), "Impressao separada da antiga Estatisticas deve permanecer removida.");
conferir(!/body\[data-view=["']movimento["']\]\s+\.appRail[\s\S]{0,120}display\s*:\s*none/i.test(cssLayouts), "Hash legado de Estatisticas nao deve esconder o menu lateral compacto.");
conferir(!/body\[data-view=["']movimento["']\]\s+\.systemBar[\s\S]{0,120}display\s*:\s*none/i.test(cssLayouts), "Hash legado de Estatisticas deve manter o cabecalho superior do sistema.");

const demoTexto = ler("notas/js/demo-data.js");
const termosProibidos = ["ALICE", "AMANDA", "ROSE MARCIA", "CPF", "INEP"];
for (const termo of termosProibidos) {
  conferir(!demoTexto.toUpperCase().includes(termo), `Fixture de notas contem termo proibido: ${termo}`);
}

conferir(classificarMedia(75) === "regular", "Media 75 deveria ser regular.");
conferir(classificarMedia(65) === "atencao", "Media 65 deveria ser atencao.");
conferir(classificarMedia(45) === "critico", "Media 45 deveria ser critico.");

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
