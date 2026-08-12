import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, "..");

const arquivos = {
  html: path.join(raiz, "arquivo-digital", "index.html"),
  css: path.join(raiz, "arquivo-digital", "arquivo-digital.css"),
  js: path.join(raiz, "arquivo-digital", "arquivo-digital.js"),
  utils: path.join(raiz, "arquivo-digital", "arquivo-digital-utils.js"),
  regressao: path.join(raiz, "scripts", "testes-regressao-arquivo-digital.mjs"),
  testesUtils: path.join(raiz, "scripts", "testes-utils-arquivo-digital.mjs")
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
const coletarUrlsExternas = (...fontes) => {
  const urls = new Set();
  const regex = /https?:\/\/[^\s"'<>),;]+/g;

  for (const fonte of fontes) {
    for (const match of fonte.matchAll(regex)) {
      urls.add(match[0]);
    }
  }

  return [...urls].sort();
};
const urlsExternas = coletarUrlsExternas(html, css, js);
const dominiosExternos = [...new Set(urlsExternas.map(url => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}).filter(Boolean))].sort();
const importsExternosJs = [...js.matchAll(/\bimport\s*(?:\(|[^;]*?\bfrom\s*)["'](https?:\/\/[^"']+)["']/g)]
  .map(match => match[1])
  .sort();
const scriptsExternosHtml = [...html.matchAll(/<script\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["'][^>]*>/gi)]
  .map(match => match[1])
  .sort();
const linksExternosHtml = [...html.matchAll(/<link\b[^>]*\bhref=["'](https?:\/\/[^"']+)["'][^>]*>/gi)]
  .map(match => match[1])
  .sort();
const totalMetaCsp = (html.match(/http-equiv=["']Content-Security-Policy["']/gi) || []).length;
const totalStyleAttributes = (html.match(/\bstyle\s*=/gi) || []).length;
const usaMsalExterno = importsExternosJs.some(url => /msal-browser/i.test(url));
const usaPdfLibExterno = importsExternosJs.some(url => /pdf-lib/i.test(url));
const matchScopesLogin = js.match(/scopes\s*:\s*\[([^\]]*)\]/);
const scopesLogin = matchScopesLogin
  ? [...matchScopesLogin[1].matchAll(/["']([^"']+)["']/g)].map(match => match[1]).sort()
  : [];
const chavesConfigObrigatorias = [
  "clientId",
  "tenantId",
  "redirectUri",
  "siteId",
  "documentosAtivosListId",
  "historicoAcessosListId",
  "anotacoesArquivosListId",
  "documentosAtivosRootPath"
];
const chavesConfigPresentes = chavesConfigObrigatorias.filter(chave =>
  new RegExp(`\\b${chave}\\s*:\\s*["']`).test(js)
);
const alertasSistemaListIdPresente = /9abdb5fc-c009-4a59-9f91-03677b001b56|alertasSistemaListId/.test(js);
const chamadasGraphAproximadas = (js.match(/https:\/\/graph\.microsoft\.com\/v1\.0/g) || []).length;
const usaGraphListas = /\/sites\/\$\{CONFIG\.siteId\}\/lists\//.test(js);
const usaGraphDrives = /\/drives\/\$\{[^}]+\}\/items\//.test(js) || /\/drives\/\$\{[^}]+\}\/root/.test(js);
const usaGraphVersoes = /\/versions\b/.test(js);
const usaGraphUpload = /createUploadSession|\/content`/.test(js);
const timeoutGraphPresente = /const TEMPO_LIMITE_GRAPH_MS\s*=\s*30000/.test(js) &&
  /AbortController/.test(js) &&
  /Tempo limite ao chamar o Microsoft Graph/.test(js);
const limiteMesclagemPresente = /const LIMITE_MESCLAGEM_LOCAL_BYTES\s*=\s*50\s*\*\s*1024\s*\*\s*1024/.test(js) &&
  /mesclagemLocalExcedeLimite\(documentoSelecionado,\s*arquivo\)/.test(js);
const tokenPainelPresente = /let painelDocumentoTokenAtual\s*=\s*0/.test(js) &&
  /function painelAindaMostraDocumento\b/.test(js);
const textoAcessoRestritoAlinhado = /usu[aá]rios autorizados no SharePoint da Secretaria/i.test(html) &&
  /grupo da Secretaria respons[aá]vel pelo Arquivo Digital/i.test(html);
const moduloUtilsExiste = existsSync(arquivos.utils);
const scriptRegressaoExiste = existsSync(arquivos.regressao);
const scriptTestesUtilsExiste = existsSync(arquivos.testesUtils);
const historicoSobDemanda =
  /const TAMANHO_PAGINA_HISTORICO_GERAL\s*=\s*100/.test(js) &&
  /async function carregarPaginaHistoricoGeral\b/.test(js) &&
  /@odata\.nextLink/.test(js) &&
  /window\.verMaisHistoricoGeral\s*=\s*async function/.test(js) &&
  /async function carregarHistoricoPorArquivoId\b/.test(js) &&
  !/historicoApoioCarregado/.test(js);
conferir(historicoSobDemanda, "Historico deve permanecer preservado e usar carregamento paginado/sob demanda.");
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
console.log(`- Diagnostico CSP/CDN/SRI gradual: imports externos JS=${importsExternosJs.length}; scripts externos HTML=${scriptsExternosHtml.length}; links externos HTML=${linksExternosHtml.length}; dominios externos=${dominiosExternos.join(", ") || "nenhum"}; meta CSP=${totalMetaCsp}; style attributes=${totalStyleAttributes}; MSAL externo=${usaMsalExterno ? "sim" : "nao"}; pdf-lib externo=${usaPdfLibExterno ? "sim" : "nao"}.`);
console.log(`- Diagnostico SharePoint/permissoes gradual: scopes=${scopesLogin.join(", ") || "nao encontrados"}; CONFIG obrigatorio=${chavesConfigPresentes.length}/${chavesConfigObrigatorias.length}; ALERTAS_SISTEMA id=${alertasSistemaListIdPresente ? "sim" : "nao"}; Graph chamadas aproximadas=${chamadasGraphAproximadas}; listas=${usaGraphListas ? "sim" : "nao"}; drives=${usaGraphDrives ? "sim" : "nao"}; versoes=${usaGraphVersoes ? "sim" : "nao"}; upload/conteudo=${usaGraphUpload ? "sim" : "nao"}.`);
console.log(`- Diagnostico V2.12: texto acesso restrito=${textoAcessoRestritoAlinhado ? "alinhado" : "revisar"}; token painel=${tokenPainelPresente ? "sim" : "nao"}; timeout Graph=${timeoutGraphPresente ? "sim" : "nao"}; limite mesclagem local=${limiteMesclagemPresente ? "sim" : "nao"}.`);
console.log(`- Diagnostico testes gradual: script de regressao=${scriptRegressaoExiste ? "sim" : "nao"}; modulo utils=${moduloUtilsExiste ? "sim" : "nao"}; testes utils=${scriptTestesUtilsExiste ? "sim" : "nao"}; comandos recomendados=node scripts/testes-regressao-arquivo-digital.mjs | node scripts/testes-utils-arquivo-digital.mjs.`);
console.log("- Historico: preservado, sem rotina de retencao, com paginacao sob demanda diagnosticada.");
