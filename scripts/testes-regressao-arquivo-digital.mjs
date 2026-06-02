import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, "..");

const caminhos = {
  html: path.join(raiz, "arquivo-digital", "index.html"),
  css: path.join(raiz, "arquivo-digital", "arquivo-digital.css"),
  js: path.join(raiz, "arquivo-digital", "arquivo-digital.js"),
  validador: path.join(raiz, "scripts", "validar-arquivo-digital.mjs")
};

function ler(caminho) {
  assert.ok(existsSync(caminho), `Arquivo esperado nao encontrado: ${path.relative(raiz, caminho)}`);
  return readFileSync(caminho, "utf8");
}

const html = ler(caminhos.html);
const css = ler(caminhos.css);
const js = ler(caminhos.js);
const validador = ler(caminhos.validador);

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function elementoPorId(id) {
  const regex = new RegExp(`<[^>]+\\bid=["']${escaparRegex(id)}["'][^>]*>`, "i");
  return html.match(regex)?.[0] || "";
}

function possuiAtributo(elemento, atributo) {
  return new RegExp(`\\b${escaparRegex(atributo)}\\s*=`, "i").test(elemento);
}

function temLabelAssociado(id) {
  const idRegex = escaparRegex(id);
  return new RegExp(`<label\\b[^>]*\\bfor=["']${idRegex}["'][^>]*>`, "i").test(html) ||
    new RegExp(`<label\\b[^>]*>[\\s\\S]*\\bid=["']${idRegex}["'][\\s\\S]*?<\\/label>`, "i").test(html);
}

function blocoFuncao(nome) {
  const indice = js.search(new RegExp(`(?:function\\s+${escaparRegex(nome)}\\b|window\\.${escaparRegex(nome)}\\s*=\\s*(?:async\\s*)?function\\b)`));
  assert.notEqual(indice, -1, `Funcao critica nao encontrada: ${nome}`);
  let inicioBloco = -1;
  let parenteses = 0;
  for (let i = indice; i < js.length; i++) {
    if (js[i] === "(") parenteses++;
    if (js[i] === ")") parenteses = Math.max(0, parenteses - 1);
    if (js[i] === "{" && parenteses === 0) {
      inicioBloco = i;
      break;
    }
  }
  assert.notEqual(inicioBloco, -1, `Nao foi possivel localizar bloco da funcao: ${nome}`);

  let profundidade = 0;
  for (let i = inicioBloco; i < js.length; i++) {
    if (js[i] === "{") profundidade++;
    if (js[i] === "}") profundidade--;
    if (profundidade === 0) {
      return js.slice(indice, i + 1);
    }
  }

  throw new Error(`Bloco da funcao nao foi fechado: ${nome}`);
}

function testar(nome, funcao) {
  try {
    funcao();
    console.log(`OK - ${nome}`);
  } catch (erro) {
    console.error(`FALHOU - ${nome}`);
    throw erro;
  }
}

testar("HTML mantem estrutura principal e script modular", () => {
  const idsPrincipais = [
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

  for (const id of idsPrincipais) {
    assert.ok(elementoPorId(id), `ID principal ausente no HTML: ${id}`);
  }

  assert.match(
    html,
    /<script\b[^>]*type=["']module["'][^>]*src=["']arquivo-digital\.js["'][^>]*>\s*<\/script>/i,
    "index.html deve carregar arquivo-digital.js como script type=module."
  );
});

testar("Handlers inline continuam zerados", () => {
  const handlers = ["onclick", "onchange", "oninput", "onkeydown", "onkeyup", "onsubmit"];
  for (const handler of handlers) {
    const regex = new RegExp(`\\b${handler}\\s*=`, "i");
    assert.ok(!regex.test(html), `Handler inline reintroduzido no HTML: ${handler}=`);
    assert.ok(!regex.test(js), `Handler inline reintroduzido no JS: ${handler}=`);
  }
});

testar("Acessibilidade dos paineis e controles principais foi preservada", () => {
  const paineis = [
    "painelLateral",
    "painelCentralDuplicidades",
    "painelDashboard",
    "centralUpload",
    "centralConfiguracoes"
  ];

  for (const id of paineis) {
    const elemento = elementoPorId(id);
    assert.ok(elemento, `Painel principal ausente: ${id}`);
    assert.ok(possuiAtributo(elemento, "role"), `Painel sem role: ${id}`);
    assert.ok(possuiAtributo(elemento, "aria-labelledby"), `Painel sem aria-labelledby: ${id}`);
    assert.ok(possuiAtributo(elemento, "aria-hidden"), `Painel sem aria-hidden: ${id}`);
  }

  const botoesFechar = html.match(/<button\b[^>]*class=["'][^"']*\bbtnFechar\b[^"']*["'][^>]*>/gi) || [];
  assert.ok(botoesFechar.length > 0, "Nenhum botao de fechar com classe btnFechar foi encontrado.");
  for (const botao of botoesFechar) {
    assert.ok(possuiAtributo(botao, "aria-label"), "Botao de fechar sem aria-label.");
  }

  const campos = [
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

  for (const id of campos) {
    const elemento = elementoPorId(id);
    assert.ok(elemento, `Campo prioritario ausente: ${id}`);
    assert.ok(
      possuiAtributo(elemento, "aria-label") || possuiAtributo(elemento, "aria-labelledby") || temLabelAssociado(id),
      `Campo prioritario sem nome acessivel: ${id}`
    );
  }
});

testar("Marcadores de seguranca de PDF e CDN continuam diagnosticaveis", () => {
  assert.match(html, /<meta\b[^>]*name=["']referrer["'][^>]*content=["']strict-origin-when-cross-origin["'][^>]*>/i, "Meta referrer esperada nao encontrada.");
  assert.ok(!/http-equiv=["']Content-Security-Policy["']/i.test(html), "Meta CSP bloqueante foi adicionada; esta fase nao deve implantar CSP.");
  assert.match(js, /msal-browser/i, "Import externo do MSAL deixou de ser diagnosticavel.");
  assert.match(js, /pdf-lib/i, "Import externo do pdf-lib deixou de ser diagnosticavel.");
  assert.match(js, /async function validarArquivoPdfBasico\b/, "validarArquivoPdfBasico deve existir.");
  assert.match(js, /cabecalho\s*!==\s*["']%PDF["']/, "validarArquivoPdfBasico deve conferir assinatura %PDF.");

  const usosPdf = (js.match(/validarArquivoPdfBasico\s*\(/g) || []).length;
  assert.ok(usosPdf >= 4, "validarArquivoPdfBasico deve ser usado nos fluxos de upload, substituir e mesclar.");
  assert.match(blocoFuncao("confirmarSubstituir"), /validarArquivoPdfBasico\s*\(arquivo\)/, "Substituir deve validar PDF antes de enviar.");
  assert.match(blocoFuncao("selecionarArquivoLocalMesclar"), /validarArquivoPdfBasico\s*\(arquivo\)/, "Mesclar deve validar PDF local.");
  assert.match(blocoFuncao("enviarArquivoPdfComMetadados"), /validarArquivoPdfBasico\s*\(arquivo\)/, "Upload deve validar PDF antes do envio.");
});

testar("Identidade por ARQUIVO_ID segue como base de historico e anotacao", () => {
  assert.match(js, /function obterIdArquivoDocumento\b/, "obterIdArquivoDocumento deve existir.");
  assert.match(js, /function historicoPertenceAoDocumento\b/, "historicoPertenceAoDocumento deve existir.");
  assert.match(js, /function anotacaoPertenceAoDocumento\b/, "anotacaoPertenceAoDocumento deve existir.");

  const blocoHistorico = blocoFuncao("historicoPertenceAoDocumento");
  const blocoAnotacao = blocoFuncao("anotacaoPertenceAoDocumento");
  assert.match(blocoHistorico, /ARQUIVO_ID/, "historicoPertenceAoDocumento deve comparar ARQUIVO_ID.");
  assert.match(blocoHistorico, /obterIdArquivoDocumento\s*\(/, "historicoPertenceAoDocumento deve usar ID tecnico do documento.");
  assert.match(blocoAnotacao, /ARQUIVO_ID/, "anotacaoPertenceAoDocumento deve comparar ARQUIVO_ID.");
  assert.match(blocoAnotacao, /obterIdArquivoDocumento\s*\(/, "anotacaoPertenceAoDocumento deve usar ID tecnico do documento.");
  assert.doesNotMatch(blocoHistorico, /\.Title|\.ARQUIVO\s*===|\.nome\s*===/, "Historico nao deve voltar a comparar por nome/titulo.");
  assert.doesNotMatch(blocoAnotacao, /\.Title|\.ARQUIVO\s*===|\.nome\s*===/, "Anotacao nao deve voltar a comparar por nome/titulo.");
});

testar("Operacoes criticas preservam ID confiavel e travas contra repeticao", () => {
  const registrar = blocoFuncao("registrarHistorico");
  assert.match(registrar, /const arquivoId\s*=\s*obterIdArquivoDocumento\s*\(documento\)/, "registrarHistorico deve obter ARQUIVO_ID confiavel.");
  assert.match(registrar, /ARQUIVO_ID\s*:\s*arquivoId/, "registrarHistorico deve gravar ARQUIVO_ID.");

  const abrirPdf = blocoFuncao("abrirPdfSelecionado");
  assert.match(abrirPdf, /iniciarOperacaoCritica\s*\(\s*["']abrir-pdf["']/, "abrirPdfSelecionado deve usar trava abrir-pdf.");
  assert.match(abrirPdf, /finalizarOperacaoCritica\s*\(operacao\)/, "abrirPdfSelecionado deve finalizar trava.");

  const salvarAnotacao = blocoFuncao("salvarAnotacaoManual");
  assert.match(salvarAnotacao, /iniciarOperacaoCritica\s*\(\s*["']salvar-anotacao["']/, "salvarAnotacaoManual deve usar trava salvar-anotacao.");
  assert.match(salvarAnotacao, /finalizarOperacaoCritica\s*\(operacao\)/, "salvarAnotacaoManual deve finalizar trava.");

  assert.match(js, /async function prepararPdfSubstitutoComTituloArquivo\b/, "prepararPdfSubstitutoComTituloArquivo deve existir.");
});

testar("CSS do dashboard mantem separacao entre contadores e acoes", () => {
  assert.match(html, /class=["'][^"']*\bdashboard\b[^"']*\bdashboardContadores\b[^"']*["']/i, "HTML deve manter dashboard dashboardContadores.");
  assert.match(html, /class=["'][^"']*\bdashboard\b[^"']*\bdashboardAcoes\b[^"']*["']/i, "HTML deve manter dashboard dashboardAcoes.");
  assert.match(css, /\.dashboard\.dashboardContadores\b/, "CSS deve ter regra especifica .dashboard.dashboardContadores.");
  assert.match(css, /\.dashboard\.dashboardAcoes\b/, "CSS deve ter regra especifica .dashboard.dashboardAcoes.");
  assert.match(css, /\.dashboard:not\(\.dashboardAcoes\):not\(\.dashboardContadores\)/, "CSS deve proteger dashboard generico contra contadores/acoes.");
  assert.doesNotMatch(css, /\.dashboard\s*\{[^}]*grid-template-columns\s*:\s*repeat\(\s*5\s*,/i, "Regra generica perigosa de 5 cards no .dashboard foi reintroduzida.");
});

testar("Performance mantem cache limitado e diagnostico publico", () => {
  assert.match(js, /const LIMITE_CACHE_NORMALIZAR_TEXTO\s*=/, "Limite do cache de normalizarTexto deve existir.");
  assert.match(js, /const cacheNormalizarTexto\s*=\s*new Map\(\)/, "Cache de normalizarTexto deve existir.");
  assert.match(blocoFuncao("normalizarTexto"), /cacheNormalizarTexto\.size\s*>=\s*LIMITE_CACHE_NORMALIZAR_TEXTO/, "normalizarTexto deve limitar tamanho do cache.");
  assert.match(js, /window\.gerarDiagnosticoPerformanceArquivoDigital\s*=\s*function\b/, "Diagnostico de performance deve existir.");
});

testar("Validador oficial continua presente e cobre handlers inline", () => {
  assert.match(validador, /contarHandlersInline/, "Validador deve manter diagnostico de handlers inline.");
  assert.match(validador, /Diagnostico handlers inline gradual/, "Validador deve imprimir diagnostico de handlers inline.");
});

testar("V2.12 mantem acesso restrito alinhado a permissao SharePoint", () => {
  assert.match(html, /usu[aá]rios autorizados no SharePoint da Secretaria/i, "Tela restrita deve falar em usuarios autorizados no SharePoint.");
  assert.match(html, /grupo da Secretaria respons[aá]vel pelo Arquivo Digital/i, "Tela restrita deve orientar inclusao no grupo responsavel.");
  assert.doesNotMatch(html, /exclusivo para o grupo GRUPO DA SECRETARIA - ARQUIVO DIGITAL/i, "Tela restrita nao deve prometer validacao direta de grupo.");

  const permissao = blocoFuncao("verificarPermissaoArquivoDigital");
  assert.match(permissao, /lists\/\$\{CONFIG\.documentosAtivosListId\}\/items\?\$top=1/, "Permissao deve continuar baseada em leitura real no SharePoint.");
});

testar("V2.12 controla respostas obsoletas do painel lateral", () => {
  assert.match(js, /let painelDocumentoTokenAtual\s*=\s*0/, "Token central do painel deve existir.");
  assert.match(js, /function painelAindaMostraDocumento\b/, "Guarda central do painel deve existir.");

  const abrirPainel = blocoFuncao("abrirDocumentoNoPainel");
  assert.match(abrirPainel, /\+\+painelDocumentoTokenAtual/, "Abrir painel deve gerar novo token.");
  assert.match(abrirPainel, /painelLocalAindaMostraDocumento/, "Carregamentos do painel devem conferir token local.");
  assert.match(abrirPainel, /carregarHistoricoDocumento\(documentoDoPainel,\s*tokenCarregamentoPainel\)/, "Historico deve receber token do painel.");
  assert.match(abrirPainel, /carregarAnotacaoDocumento\(documentoDoPainel,\s*tokenCarregamentoPainel\)/, "Anotacao deve receber token do painel.");
  assert.match(abrirPainel, /carregarVersoesSharePointDocumento\(documentoDoPainel,\s*tokenCarregamentoPainel\)/, "Versoes devem receber token do painel.");
});

testar("V2.12 mantem timeout Graph e limite de mesclagem local", () => {
  assert.match(js, /const TEMPO_LIMITE_GRAPH_MS\s*=\s*30000/, "Timeout Graph de 30s deve existir.");
  assert.match(blocoFuncao("fetchGraphComRetry"), /AbortController/, "fetchGraphComRetry deve usar AbortController quando disponivel.");
  assert.match(blocoFuncao("fetchGraphComRetry"), /Tempo limite ao chamar o Microsoft Graph/, "Timeout Graph deve ter mensagem amigavel.");

  assert.match(js, /const LIMITE_MESCLAGEM_LOCAL_BYTES\s*=\s*50\s*\*\s*1024\s*\*\s*1024/, "Limite defensivo de mesclagem local deve existir.");
  assert.match(blocoFuncao("confirmarMesclar"), /mesclagemLocalExcedeLimite\(documentoSelecionado,\s*arquivo\)/, "confirmarMesclar deve bloquear PDFs grandes antes da mesclagem.");
});

console.log("Testes de regressao do Arquivo Digital concluidos com sucesso.");
