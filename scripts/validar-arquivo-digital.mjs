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
  "filtrarDocumentosDebounced",
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

const totalInnerHtml = (js.match(/\binnerHTML\s*=/g) || []).length;
const totalHtmlInternoConfiavel = (js.match(/\bhtmlInternoConfiavel\b/g) || []).length;
const obterSeletoresCss = (fonte) => {
  const seletores = [];
  const regex = /([^{}@][^{}]*)\{/g;
  let match;

  while ((match = regex.exec(fonte))) {
    const bloco = match[1].trim();
    if (!bloco || bloco.includes("from ") || bloco.includes("to ")) continue;

    const linha = fonte.slice(0, match.index).split(/\r?\n/).length;
    bloco
      .split(",")
      .map(seletor => seletor.trim())
      .filter(Boolean)
      .forEach(seletor => seletores.push({ seletor, linha }));
  }

  return seletores;
};
const seletoresCss = obterSeletoresCss(css);
const ocorrenciasSeletoresCss = new Map();
for (const item of seletoresCss) {
  if (!ocorrenciasSeletoresCss.has(item.seletor)) ocorrenciasSeletoresCss.set(item.seletor, []);
  ocorrenciasSeletoresCss.get(item.seletor).push(item.linha);
}
const seletoresDuplicadosCss = [...ocorrenciasSeletoresCss.entries()].filter(([, linhas]) => linhas.length > 1);
const regrasDashboardGenericas = seletoresCss.filter(item =>
  item.seletor === ".dashboard" ||
  /^\.dashboard\s*[,{>]/.test(item.seletor)
);
const regrasDashboardProtegidas = seletoresCss.filter(item =>
  item.seletor.includes(".dashboard:not(.dashboardAcoes):not(.dashboardContadores)") ||
  item.seletor.includes(".dashboard.dashboardContadores") ||
  item.seletor.includes(".dashboard.dashboardAcoes")
);
const contarHandlersInline = (fonte) => ({
  onclick: (fonte.match(/\bonclick\s*=/g) || []).length,
  onchange: (fonte.match(/\bonchange\s*=/g) || []).length,
  oninput: (fonte.match(/\boninput\s*=/g) || []).length,
  onkeydown: (fonte.match(/\bonkeydown\s*=/g) || []).length,
  onkeyup: (fonte.match(/\bonkeyup\s*=/g) || []).length,
  onsubmit: (fonte.match(/\bonsubmit\s*=/g) || []).length
});
const handlersHtml = contarHandlersInline(html);
const handlersJs = contarHandlersInline(js);
const totalHandlersInline = Object.values(handlersHtml).reduce((total, valor) => total + valor, 0) +
  Object.values(handlersJs).reduce((total, valor) => total + valor, 0);
const formatarHandlersInline = (handlers) =>
  Object.entries(handlers)
    .map(([nome, total]) => `${nome}=${total}`)
    .join(", ");
const elementoPorId = (id) => {
  const regex = new RegExp(`<[^>]+\\bid=["']${id}["'][^>]*>`, "i");
  return html.match(regex)?.[0] || "";
};
const temAtributo = (elemento, atributo) => new RegExp(`\\b${atributo}\\s*=`, "i").test(elemento);
const paineisA11y = [
  "painelLateral",
  "painelCentralDuplicidades",
  "painelDashboard",
  "centralUpload",
  "centralConfiguracoes"
];
const paineisSemAria = paineisA11y.filter(id => {
  const elemento = elementoPorId(id);
  return !elemento || !temAtributo(elemento, "role") || !temAtributo(elemento, "aria-labelledby") || !temAtributo(elemento, "aria-hidden");
});
const botoesFechar = html.match(/<button\b[^>]*class=["'][^"']*\bbtnFechar\b[^"']*["'][^>]*>/gi) || [];
const botoesFecharSemLabel = botoesFechar.filter(botao => !temAtributo(botao, "aria-label")).length;
const camposA11y = [
  "campoBusca",
  "gavetaUpload",
  "motivoUpload",
  "configLimiteRecentes",
  "configOrdemRecentes",
  "configOrdemLixeira",
  "configGuiaInicial",
  "configModoVisual",
  "configDetalhesCards",
  "configDuplicidadesAuto",
  "configLimiteRelatorios",
  "novaGavetaConfiguracao",
  "campoAnotacao",
  "novoNomeArquivo",
  "arquivoSubstituto",
  "motivoArquivar",
  "motivoRestaurar",
  "novaGavetaDocumento",
  "motivoAlterarGaveta",
  "arquivoLocalMesclar",
  "motivoMesclar"
];
const campoTemLabelVisual = (id) => new RegExp(`<label\\b[^>]*>[\\s\\S]*\\bid=["']${id}["'][\\s\\S]*?<\\/label>`, "i").test(html) ||
  new RegExp(`<label\\b[^>]*\\bfor=["']${id}["'][^>]*>`, "i").test(html);
const camposSemNomeAcessivel = camposA11y.filter(id => {
  const elemento = elementoPorId(id);
  return !elemento || (!temAtributo(elemento, "aria-label") && !temAtributo(elemento, "aria-labelledby") && !campoTemLabelVisual(id));
});

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
console.log(`- Diagnostico XSS gradual: ${totalInnerHtml} atribuicao(oes) innerHTML; ${totalHtmlInternoConfiavel} referencia(s) a htmlInternoConfiavel.`);
console.log(`- Diagnostico handlers inline gradual: ${totalHandlersInline} total; HTML ${formatarHandlersInline(handlersHtml)}; JS ${formatarHandlersInline(handlersJs)}.`);
if (totalHandlersInline === 0) {
  console.log("- Nenhum handler inline encontrado.");
}
console.log(`- Diagnostico acessibilidade gradual: paineis sem ARIA esperada=${paineisSemAria.length}; botoes X sem aria-label=${botoesFecharSemLabel}; campos prioritarios sem nome acessivel=${camposSemNomeAcessivel.length}.`);
if (!paineisSemAria.length && !botoesFecharSemLabel && !camposSemNomeAcessivel.length) {
  console.log("- Painéis principais, botões de fechar e campos prioritários com nomes acessíveis diagnosticados.");
}
console.log(`- Diagnostico CSS gradual: seletores=${seletoresCss.length}; seletores duplicados=${seletoresDuplicadosCss.length}; regras .dashboard genericas=${regrasDashboardGenericas.length}; regras dashboard protegidas=${regrasDashboardProtegidas.length}.`);
