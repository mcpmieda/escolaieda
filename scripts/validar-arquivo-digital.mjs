import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, "..");

const arquivos = {
  html: path.join(raiz, "arquivo-digital", "index.html"),
  css: path.join(raiz, "arquivo-digital", "arquivo-digital.css"),
  js: path.join(raiz, "arquivo-digital", "arquivo-digital.js")
};

const erros = [];

function falhar(mensagem) {
  erros.push(mensagem);
}

function conferir(condicao, mensagem) {
  if (!condicao) falhar(mensagem);
}

function lerArquivo(nome, caminho) {
  if (!existsSync(caminho)) {
    falhar(`${nome} nao encontrado: ${path.relative(raiz, caminho)}`);
    return "";
  }

  return readFileSync(caminho, "utf8");
}

const html = lerArquivo("index.html", arquivos.html);
const css = lerArquivo("arquivo-digital.css", arquivos.css);
const js = lerArquivo("arquivo-digital.js", arquivos.js);

conferir(/<link\b[^>]*href=["']arquivo-digital\.css["'][^>]*>/i.test(html), "index.html nao referencia arquivo-digital.css.");
conferir(
  /<script\b[^>]*type=["']module["'][^>]*src=["']arquivo-digital\.js["'][^>]*>\s*<\/script>/i.test(html),
  "index.html nao referencia arquivo-digital.js com type=\"module\"."
);

conferir(/<style\b[^>]*id=["']css-prelogin-critico["'][^>]*>/i.test(html), "CSS critico inline de pre-login nao encontrado.");
conferir(/estadoPreLogin/.test(html), "Classe/estado de pre-login nao encontrado no index.html.");

for (const tag of ["style", "script"]) {
  const regex = new RegExp(`<\\/?${tag}\\b`, "i");
  conferir(!regex.test(css), `arquivo-digital.css contem tag <${tag}> ou </${tag}>.`);
}

conferir(!/<\/?script\b/i.test(js), "arquivo-digital.js contem tag <script> ou </script>.");

if (js) {
  const sintaxe = spawnSync(process.execPath, ["--input-type=module", "--check"], {
    input: js,
    encoding: "utf8"
  });

  conferir(
    sintaxe.status === 0,
    `arquivo-digital.js falhou na validacao de sintaxe do Node.\n${sintaxe.stderr || sintaxe.stdout}`
  );
}

const globaisObrigatorios = [
  "entrar",
  "sair",
  "tentarNovamenteAcessoArquivoDigital",
  "alternarCentralUploadHero",
  "receberArquivosCentralUpload",
  "confirmarUploadCentral",
  "alternarCentralConfiguracoes",
  "cadastrarNovaGaveta",
  "alternarCentralDuplicidades",
  "fecharPainelCentralDuplicidades",
  "abrirHistoricoGeral",
  "fecharPainelDashboard",
  "mostrarDocumentosRecentes",
  "mostrarDocumentosAtivos",
  "mostrarDocumentosLixeira",
  "filtrarDocumentos",
  "selecionarDocumento",
  "fecharPainel",
  "abrirPdfSelecionado",
  "prepararSubstituir",
  "confirmarSubstituir",
  "prepararMesclar",
  "confirmarMesclar",
  "salvarAnotacaoManual"
];

for (const nome of globaisObrigatorios) {
  const regex = new RegExp(`window\\.${nome}\\s*=|window\\.${nome}\\b`);
  conferir(regex.test(js), `Funcao/global esperado nao encontrado em window.${nome}.`);
}

const idsObrigatorios = [
  "areaSistema",
  "centralUpload",
  "centralConfiguracoes",
  "listaArquivosUpload",
  "listaDocumentos",
  "painelLateral",
  "painelCentralDuplicidades",
  "painelDashboard",
  "centralDuplicidades",
  "campoAnotacao",
  "arquivoLocalMesclar"
];

for (const id of idsObrigatorios) {
  const regex = new RegExp(`\\bid=["']${id}["']`);
  conferir(regex.test(html), `ID principal nao encontrado no HTML: ${id}.`);
}

const handlersInline = [
  "entrar()",
  "sair()",
  "receberArquivosCentralUpload(this)",
  "confirmarUploadCentral()",
  "filtrarDocumentos()",
  "confirmarMesclar()",
  "salvarAnotacaoManual()"
];

for (const chamada of handlersInline) {
  conferir(html.includes(chamada), `Handler inline esperado nao encontrado: ${chamada}.`);
}

if (erros.length) {
  console.error("Validacao do Arquivo Digital falhou:");
  for (const erro of erros) {
    console.error(`- ${erro}`);
  }
  process.exit(1);
}

console.log("Validacao do Arquivo Digital concluida com sucesso.");
console.log("- Estrutura HTML/CSS/JS separada OK.");
console.log("- CSS critico de pre-login preservado.");
console.log("- JavaScript sem tags <script> e com sintaxe valida.");
console.log("- Globais e IDs principais encontrados.");
