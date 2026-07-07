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
conferir(/id=["']view-dashboard["']/.test(html), "view-dashboard nao encontrada.");
conferir(/id=["']view-banco["']/.test(html), "view-banco nao encontrada.");
conferir(/id=["']view-estudantes["']/.test(html), "view-estudantes nao encontrada.");
conferir(/id=["']view-boletins["']/.test(html), "view-boletins nao encontrada.");
conferir(/id=["']view-conselho["']/.test(html), "view-conselho nao encontrada.");
conferir(/id=["']view-relatorios["']/.test(html), "view-relatorios nao encontrada.");
conferir(/id=["']view-importacoes["']/.test(html), "view-importacoes nao encontrada.");
conferir(/id=["']dashboardDisciplinas["']/.test(html), "dashboardDisciplinas nao encontrada.");
conferir(/id=["']quadroAproveitamento["']/.test(html), "quadroAproveitamento nao encontrado.");
conferir(/id=["']conselhoAlunoFoco["']/.test(html), "conselhoAlunoFoco nao encontrada.");

const appTexto = ler("notas/js/app.js");
const cssComponentes = ler("notas/css/componentes.css");
conferir(appTexto.includes("renderQuadroAproveitamento"), "renderQuadroAproveitamento nao encontrado em app.js.");
conferir(appTexto.includes("boletimExcelPage"), "boletimExcelPage nao encontrado em app.js.");
conferir(appTexto.includes("conselhoReportPage"), "conselhoReportPage nao encontrado em app.js.");
conferir(cssComponentes.includes(".excelDocument"), "Estilo do quadro de aproveitamento nao encontrado.");
conferir(cssComponentes.includes(".fichaPrintMini"), "Estilo da ficha individual nao encontrado.");
conferir(cssComponentes.includes(".conselhoReportPage"), "Estilo do relatorio de conselho nao encontrado.");

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
