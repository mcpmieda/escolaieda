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
conferir(/id=["']view-movimento["']/.test(html), "view-movimento nao encontrada.");
conferir(/id=["']view-notas["']/.test(html), "view-notas nao encontrada.");
conferir(/id=["']view-boletim["']/.test(html), "view-boletim nao encontrada.");
conferir(!/id=["']view-conselho["']/.test(html), "view-conselho deveria estar fora desta fase visual.");
conferir(!/id=["']view-relatorios["']/.test(html), "view-relatorios deveria estar fora desta fase visual.");
conferir(!/id=["']view-importacoes["']/.test(html), "view-importacoes deveria estar fora desta fase visual.");
conferir((html.match(/data-view=/g) || []).length === 3, "A navegacao deve conter somente 3 guias nesta fase.");
conferir(/id=["']movementChart["']/.test(html), "movementChart nao encontrado.");
conferir(/id=["']notasTabela["']/.test(html), "notasTabela nao encontrada.");
conferir(/id=["']notesMetricStrip["']/.test(html), "notesMetricStrip nao encontrado.");
conferir(/id=["']boletimA4Preview["']/.test(html), "boletimA4Preview nao encontrado.");
conferir(/id=["']studentProfilePanel["']/.test(html), "studentProfilePanel nao encontrado.");

const appTexto = ler("notas/js/app.js");
const cssLayouts = ler("notas/css/layouts.css");
const cssComponentes = ler("notas/css/componentes.css");
conferir(appTexto.includes("renderMovimento"), "renderMovimento nao encontrado em app.js.");
conferir(appTexto.includes('estatisticas: "movimento"'), "Hash #estatisticas deve abrir a aba Estatisticas.");
conferir(appTexto.includes('movimento: "estatisticas"'), "A aba Estatisticas deve publicar URL canonica #estatisticas.");
conferir(appTexto.includes("renderNotesTable"), "renderNotesTable nao encontrado em app.js.");
conferir(appTexto.includes("renderNotesMetricStrip"), "renderNotesMetricStrip nao encontrado em app.js.");
conferir(appTexto.includes("criarMiniBoletim"), "criarMiniBoletim nao encontrado em app.js.");
conferir(appTexto.includes("studentPeek"), "Previa compacta do aluno nao encontrada em app.js.");
conferir(appTexto.includes("RL") && appTexto.includes("RD") && appTexto.includes("CPT"), "Mapeamento de componentes pedido nao encontrado.");
conferir(cssComponentes.includes(".movementBars"), "Estilo do movimento estatistico nao encontrado.");
conferir(cssComponentes.includes(".notesTable"), "Estilo da tabela de notas nao encontrado.");
conferir(cssComponentes.includes(".a4Sheet"), "Estilo da folha A4 nao encontrado.");
conferir(cssComponentes.includes(".miniBoletim"), "Estilo do mini boletim nao encontrado.");
conferir(cssComponentes.includes("grid-template-rows: repeat(4, 1fr)"), "Boletim deve usar quatro faixas horizontais na folha A4.");
conferir(cssComponentes.includes(".studentPeek"), "Estilo da previa de aluno nao encontrado.");
conferir(cssLayouts.includes(".appRail"), "Menu lateral compacto nao encontrado no layout.");
conferir(!/body\[data-view=["']movimento["']\]\s+\.appRail[\s\S]{0,120}display\s*:\s*none/i.test(cssLayouts), "A aba Estatisticas nao deve esconder o menu lateral compacto.");
conferir(!/body\[data-view=["']movimento["']\]\s+\.systemBar[\s\S]{0,120}display\s*:\s*none/i.test(cssLayouts), "A aba Estatisticas deve manter o cabecalho superior do sistema.");

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
  busca: "estudante 6a",
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
conferir(["APROVADO DIRETO", "APROVADO PELA RECUPERAÇÃO", "EM ACOMPANHAMENTO"].includes(calcularResultadoEstudante(estudantes[0])), "Resultado demonstrativo inesperado.");

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
