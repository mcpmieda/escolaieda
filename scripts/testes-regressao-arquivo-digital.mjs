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

async function testarAsync(nome, funcao) {
  try {
    await funcao();
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
    /<script\b[^>]*type=["']module["'][^>]*src=["']arquivo-digital\.js(?:\?v=[^"']+)?["'][^>]*>\s*<\/script>/i,
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

testar("Abertura progressiva de PDF nao navega pelo site do SharePoint", () => {
  const contexto = blocoFuncao("obterContextoDownloadPdf");
  const baixarPdf = blocoFuncao("baixarPdfDocumentoComoBlob");
  const respostaComProgresso = blocoFuncao("respostaPdfParaBlobComProgresso");
  const preview = blocoFuncao("obterUrlPreVisualizacaoPdf");
  const abrirPdf = blocoFuncao("abrirPdfSelecionado");
  const configurarAba = blocoFuncao("configurarAbaVisualizacaoPdf");
  const abrirPainel = blocoFuncao("abrirDocumentoNoPainel");

  assert.match(contexto, /@microsoft\.graph\.downloadUrl/, "Metadados do Drive devem pedir a URL temporaria oficial para download direto.");
  assert.match(contexto, /urlValidada\.protocol\s*===\s*["']https:["']/, "URL temporaria deve aceitar somente HTTPS.");
  assert.match(baixarPdf, /contexto\.urlDownload/, "Download deve preferir a rota temporaria direta quando disponivel.");
  assert.match(baixarPdf, /drives\/\$\{contexto\.driveId\}\/items\/\$\{contexto\.driveItemId\}\/content/, "Download deve manter a rota autenticada do Graph como compatibilidade.");
  assert.match(baixarPdf, /Authorization:\s*`Bearer \$\{contexto\.token\}`/, "Rota de compatibilidade deve usar token do Microsoft Graph.");
  assert.match(respostaComProgresso, /getReader/, "Rota de compatibilidade deve ler o corpo em fluxo para medir progresso.");
  assert.match(respostaComProgresso, /value\.byteLength/, "Progresso deve contabilizar os bytes efetivamente recebidos.");
  assert.match(preview, /\/preview`/, "Visualizacao rapida deve usar a API preview do Drive.");
  assert.match(preview, /method:\s*["']POST["']/, "API preview deve ser chamada pelo metodo POST oficial.");
  assert.match(configurarAba, /role["'],\s*["']progressbar/, "A nova aba deve apresentar barra de progresso acessivel.");
  assert.match(configurarAba, /btnBaixar\.addEventListener/, "PDF completo deve poder ser baixado pela mesma copia em memoria.");
  assert.match(configurarAba, /aba\.location\.replace\(urlPdf\)/, "Abertura completa deve substituir a aba temporaria sem inserir SharePoint no historico.");
  assert.match(abrirPainel, /agendarPreparoPdfPainel\(documentoDoPainel,\s*tokenCarregamentoPainel\)/, "Selecao do documento deve antecipar a preparacao do PDF.");
  assert.match(abrirPdf, /obterOuIniciarPreparoPdf\(documentoAberto\)/, "Clique deve reutilizar a preparacao ja iniciada no painel.");
  assert.match(abrirPdf, /configurarAbaVisualizacaoPdf\(aba,\s*documentoAberto,\s*estado\)/, "Clique deve abrir imediatamente o visualizador progressivo.");
  assert.doesNotMatch(abrirPdf, /window\.location\.href/, "Falha de pop-up nao deve retirar o usuario do Arquivo Digital.");
  assert.doesNotMatch(abrirPdf, /documentoAberto\.link/, "Abertura nao deve usar a pagina web do documento no SharePoint.");
  assert.match(abrirPdf, /Permita pop-ups para abrir o PDF sem sair do Arquivo Digital/, "Bloqueio de nova aba deve ter orientacao segura.");
  assert.match(html, /id=["']statusPreparoPdfPainel["']/, "Painel deve expor o progresso iniciado na selecao do documento.");
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

testar("Carregamento progressivo preserva resultados completos e contagens exatas", () => {
  const statusSincronizacao = elementoPorId("statusSincronizacaoArquivo");
  assert.ok(statusSincronizacao, "Status de sincronizacao deve existir.");
  assert.match(statusSincronizacao, /\bhidden\b/i, "Status de sincronizacao deve iniciar oculto.");
  assert.match(html, /id=["']btnTentarSincronizarArquivo["']/, "Sincronizacao deve oferecer nova tentativa em caso de falha.");
  assert.match(html, /rel=["']modulepreload["'][^>]+vendor\/msal-browser-5\.11\.0\.min\.js/, "MSAL local deve ser pre-carregado.");
  assert.match(js, /from\s+["']\.\/vendor\/msal-browser-5\.11\.0\.min\.js["']/, "Aplicacao deve usar o bundle local do MSAL.");
  assert.match(js, /function carregarDocumentosRecentesIniciais\b/, "Consulta inicial de Recentes deve existir.");
  assert.match(js, /function iniciarSincronizacaoCompletaDocumentos\b/, "Sincronizacao completa em segundo plano deve existir.");
  assert.match(js, /documentosEstaoOrdenadosPorModificacaoDesc/, "Recentes rapidos devem validar a ordenacao recebida.");
  assert.match(js, /sincronizacaoDocumentosCompleta[\s\S]*?Calculando…/, "Contadores nao devem exibir totais parciais.");
  assert.match(js, /Calculando quantidades exatas das gavetas/, "Gavetas devem explicar o carregamento das quantidades.");
  assert.match(js, /window\.obterMetricasCarregamentoArquivoDigital\s*=/, "Metricas reais de abertura devem ficar disponiveis para auditoria.");

  const status = blocoFuncao("atualizarStatusSincronizacao");
  assert.match(status, /const deveExibir\s*=\s*estado\s*===\s*["']erro["']/, "Faixa de sincronizacao deve aparecer somente em erro.");

  const atualizarTela = blocoFuncao("atualizarTela");
  const indicePermissao = atualizarTela.indexOf("await verificarPermissaoArquivoDigital(token)");
  const indiceSistemaVisivel = atualizarTela.indexOf('document.getElementById("areaSistema").style.display = "block"');
  const indiceRecentes = atualizarTela.indexOf("await carregarDocumentosRecentesIniciais(token)");
  assert.ok(indicePermissao >= 0 && indiceSistemaVisivel > indicePermissao, "Sistema deve abrir somente depois da verificacao curta de permissao.");
  assert.ok(indiceRecentes > indiceSistemaVisivel, "Recentes nao devem prolongar a tela Verificando acesso.");
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
  assert.match(js, /function painelLateralJaAbertoNoMesmoDocumento\b/, "Guarda contra reabertura do mesmo documento deve existir.");

  const abrirPainel = blocoFuncao("abrirDocumentoNoPainel");
  assert.match(abrirPainel, /painelLateralJaAbertoNoMesmoDocumento\(documento\)[\s\S]*?return;/, "Abrir o mesmo documento ja exibido nao deve reiniciar painel/carregamentos.");
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

testar("Upload em massa diferencia aviso de erro real", () => {
  assert.match(js, /const STATUS_UPLOAD_AVISO\s*=\s*["']Enviado — não reenviar["']/, "Status de aviso deve existir para arquivo criado com pendencia.");
  assert.match(js, /const STATUS_UPLOAD_NAO_ENVIADO\s*=\s*["']Não enviado["']/, "Status Nao enviado deve existir para erro real.");
  assert.match(css, /\.statusUploadAviso\b/, "CSS deve destacar aviso sem vermelho.");
  assert.match(css, /\.statusUploadErroReal\b/, "CSS deve reservar vermelho para Nao enviado.");
});

testar("Upload faz conferencia leve de tamanho sem baixar PDF", () => {
  const conferir = blocoFuncao("conferirTamanhoUpload");
  const obterMetadado = blocoFuncao("obterMetadadoRemotoDriveItem");
  const enviar = blocoFuncao("enviarArquivoPdfComMetadados");
  assert.match(conferir, /arquivo\?\.size/, "Conferencia deve usar arquivo.size como tamanho local.");
  assert.match(conferir, /itemRemoto\?\.size|itemRemoto\.size/, "Conferencia deve usar driveItem.size como tamanho remoto.");
  assert.match(conferir, /obterMetadadoRemotoDriveItem/, "Ausencia de size deve disparar consulta leve de metadado.");
  assert.match(obterMetadado, /\?\$select=id,name,size,parentReference/, "Consulta deve pedir somente metadados pequenos.");
  assert.doesNotMatch(obterMetadado, /\/content/, "Conferencia nao deve baixar o conteudo.");
  assert.doesNotMatch(conferir, /pdf-lib|PDFDocument|p[aá]gina/i, "Conferencia nao deve contar paginas.");
  assert.match(conferir, /tamanhoLocalBytes === tamanhoRemotoBytes/, "Tamanhos iguais devem confirmar o envio.");
  assert.match(conferir, /conferencia-tamanho/, "Falha ou divergencia deve gerar pendencia.");
  assert.match(enviar, /conferenciaTamanho\.ok \? STATUS_UPLOAD_ENVIADO : STATUS_UPLOAD_AVISO/, "Falha de conferencia deve virar atencao e bloquear reenvio.");
  assert.match(enviar, /Conferência automática: tamanho confirmado/, "Historico deve registrar conferencia confirmada.");
  assert.match(enviar, /tamanho não confirmado\. Não reenviar sem revisar/, "Historico deve orientar contra reenvio cego.");
  assert.match(blocoFuncao("montarHistoricoFormatado"), /"Conferência automática"/, "Historico visual deve exibir a conferencia automatica.");
  assert.match(blocoFuncao("montarHistoricoFormatado"), /Confer\[eê\]ncia autom\[aá\]tica/, "Historico visual deve extrair o resultado da conferencia.");
  assert.match(blocoFuncao("formatarResultadoFinalUpload"), /conferência automática não confirmou o tamanho\. Não reenviar sem revisar/, "Mensagem final deve explicar a falha de conferencia.");
  assert.doesNotMatch(js, /Confira se o arquivo chegou com todas as páginas/, "Texto de conferencia manual de paginas deve ser removido.");
  assert.match(js, /Arquivo grande — conferência automática de envio será feita ao final/, "Arquivo grande deve informar conferencia automatica.");
});

await testarAsync("Conferencia de tamanho cobre sucesso, divergencia e falha real", async () => {
  const origem = blocoFuncao("conferirTamanhoUpload").replace(/^function\s+/, "async function ");
  const avisos = [];
  let metadadoRemoto = { id: "item-1", size: 2048 };
  let falharMetadado = false;
  const obterMetadado = async () => {
    if (falharMetadado) throw new Error("falha controlada");
    return metadadoRemoto;
  };
  const loggerTeste = { warn: (...args) => avisos.push(args) };
  const criarFuncao = new Function(
    "obterMetadadoRemotoDriveItem",
    "logger",
    `${origem}; return conferirTamanhoUpload;`
  );
  const conferir = criarFuncao(obterMetadado, loggerTeste);

  const sucesso = await conferir({ size: 1024 }, { id: "item-1", size: 1024 }, { driveId: "drive-1", token: "token" });
  assert.equal(sucesso.ok, true);
  assert.equal(sucesso.tamanhoLocalBytes, 1024);
  assert.equal(sucesso.tamanhoRemotoBytes, 1024);
  assert.equal(sucesso.pendencia, "");

  const divergencia = await conferir({ size: 1024 }, { id: "item-1", size: 2048 }, { driveId: "drive-1", token: "token" });
  assert.equal(divergencia.ok, false);
  assert.equal(divergencia.pendencia, "conferencia-tamanho");

  const fallback = await conferir({ size: 2048 }, { id: "item-1" }, { driveId: "drive-1", token: "token" });
  assert.equal(fallback.ok, true);
  assert.equal(fallback.tamanhoRemotoBytes, 2048);

  falharMetadado = true;
  const falha = await conferir({ size: 2048 }, { id: "item-1" }, { driveId: "drive-1", token: "token" });
  assert.equal(falha.ok, false);
  assert.equal(falha.tamanhoRemotoBytes, null);
  assert.equal(falha.pendencia, "conferencia-tamanho");
  assert.equal(avisos.length, 1);
});

testar("Sessao local protege lote interrompido somente com metadados", () => {
  const criar = blocoFuncao("criarSessaoUploadLocal");
  const salvar = blocoFuncao("salvarSessaoUploadLocal");
  const confirmar = blocoFuncao("confirmarUploadCentral");
  const verificar = blocoFuncao("verificarSessaoUploadInterrompida");
  const reenvio = blocoFuncao("receberArquivosReenvioSessaoUpload");
  const ignorar = blocoFuncao("ignorarSessaoUploadInterrompida");
  assert.match(js, /arquivoDigitalUploadSessaoAtual/, "Chave local da sessao deve existir.");
  assert.match(criar, /nomeOriginal[\s\S]*nomeFinalPrevisto[\s\S]*tamanhoLocalBytes[\s\S]*status/, "Manifesto deve guardar metadados por item.");
  assert.doesNotMatch(criar, /\b(file|blob|base64|conteudo)\b/i, "Manifesto nao deve guardar arquivo, blob, base64 ou conteudo.");
  assert.doesNotMatch(salvar, /FileReader|arrayBuffer|readAsDataURL/, "Persistencia nao deve ler o PDF.");
  assert.ok(confirmar.indexOf("criarSessaoUploadLocal") < confirmar.indexOf("enviarArquivoPdfComMetadados"), "Sessao deve ser criada antes do primeiro envio.");
  assert.match(confirmar, /atualizarItemSessaoUpload\(indice/, "Sessao deve ser atualizada a cada item.");
  assert.match(verificar, /new Map\(documentosAtivos\.map/, "Verificacao deve indexar documentos para evitar busca quadratica.");
  assert.match(verificar, /driveItemId[\s\S]*listItemId[\s\S]*nomeFinalReal \|\| item\.nomeFinalPrevisto/, "Verificacao deve preferir IDs e depois nome final.");
  assert.match(verificar, /tamanhoRemoto === Number\(item\.tamanhoLocalBytes\)/, "Verificacao deve comparar tamanho local e remoto.");
  assert.match(verificar, /apagarSessaoUploadLocal\(sessao\.idLote\)/, "Sessao resolvida deve ser apagada automaticamente.");
  assert.match(reenvio, /item\.status !== "nao-encontrado" && item\.status !== "nao-enviado"/, "Reenvio deve aceitar somente nao encontrados.");
  assert.match(reenvio, /new Map\(\)/, "Reenvio deve usar indice eficiente.");
  assert.match(reenvio, /normalizarTexto\(arquivo\.name\).*Number\(arquivo\.size/, "Selecao manual deve comparar nome e tamanho.");
  assert.match(ignorar, /confirm\(/, "Ignorar aviso deve pedir confirmacao.");
  assert.match(ignorar, /apagarSessaoUploadLocal/, "Confirmacao para ignorar deve limpar a sessao.");
  assert.match(html, /id="avisoSessaoUploadInterrompida"[^>]*hidden/, "Card deve iniciar oculto e aparecer apenas com sessao pendente.");
  assert.match(html, /inputReenvioSessaoUpload[^>]*type="file"/, "Reenvio deve exigir nova selecao manual.");
});

testar("Card de sessao interrompida ignora o upload ativo da aba atual", () => {
  const criar = blocoFuncao("criarSessaoUploadLocal");
  const ativa = blocoFuncao("sessaoUploadAtivaNestaExecucao");
  const deveMostrar = blocoFuncao("deveMostrarAvisoSessaoUpload");
  const renderizar = blocoFuncao("renderizarAvisoSessaoUploadInterrompida");
  const reenvio = blocoFuncao("receberArquivosReenvioSessaoUpload");
  assert.match(js, /const idExecucaoUploadAtual\s*=\s*criarIdExecucaoUpload\(\)/, "A aba deve ter identidade de execucao somente em memoria.");
  assert.match(criar, /idExecucaoAtual:\s*idExecucaoUploadAtual/, "Novo lote deve registrar a execucao da aba.");
  assert.match(criar, /statusLote:\s*"enviando"/, "Novo lote deve iniciar como enviando.");
  assert.match(ativa, /sessao\.idExecucaoAtual === idExecucaoUploadAtual/, "Sessao ativa deve ser reconhecida pela identidade da execucao.");
  assert.match(deveMostrar, /sessaoUploadTemPendencia\(sessao\)/, "Aviso ainda deve exigir sessao pendente.");
  assert.match(deveMostrar, /!uploadEmAndamento/, "Upload em andamento deve bloquear o card.");
  assert.match(deveMostrar, /!sessaoUploadAtivaNestaExecucao\(sessao\)/, "Sessao ativa da mesma aba deve bloquear o card.");
  assert.match(renderizar, /deveMostrarAvisoSessaoUpload\(sessao\)/, "Renderizacao deve usar a regra central do card.");
  assert.match(renderizar, /aviso\.hidden = !deveMostrar/, "Card deve ficar oculto quando a regra nao autorizar.");
  assert.match(reenvio, /sessao\.idExecucaoAtual = idExecucaoUploadAtual/, "Reenvio manual deve vincular a sessao recuperada a execucao atual.");
  assert.match(blocoFuncao("apagarSessaoUploadLocal"), /localStorage\.removeItem\(CHAVE_SESSAO_UPLOAD_LOCAL\)/, "Sessao concluida deve continuar sendo apagada.");
  assert.match(blocoFuncao("lerSessaoUploadLocal"), /JSON\.parse[\s\S]*catch/, "localStorage corrompido deve continuar protegido.");
});

testar("Aviso de sessao interrompida aparece sem abrir a Central", () => {
  const indiceHero = html.indexOf('id="btnNovoDocumentoHero"');
  const indiceAviso = html.indexOf('id="avisoSessaoUploadInterrompida"');
  const indiceCentral = html.indexOf('id="centralUpload"');
  const verificar = blocoFuncao("verificarSessaoUploadInterrompida");
  assert.ok(indiceHero > -1 && indiceAviso > indiceHero && indiceAviso < indiceCentral, "Card deve ficar na tela principal antes da Central de Upload.");
  assert.match(css, /body\.estadoPreLogin #avisoSessaoUploadInterrompida/, "Card global deve permanecer oculto antes do login.");
  assert.match(css, /\.avisoSessaoUploadGlobal\b/, "Card global deve ter estilo proprio e visivel.");
  assert.match(verificar, /abrirCentralUpload\(\)/, "Verificar agora deve abrir a Central automaticamente.");
  assert.ok(
    verificar.indexOf("abrirCentralUpload()") < verificar.indexOf("await listarDocumentos()"),
    "Central deve abrir antes da consulta da sessao interrompida."
  );
});

testar("Upload parcial e reparo pos-upload nao contam como erro simples", () => {
  const enviar = blocoFuncao("enviarArquivoPdfComMetadados");
  assert.match(enviar, /erroParcial\.uploadParcial\s*=\s*true/, "Erro parcial deve ser marcado.");
  assert.match(enviar, /erroParcial\.arquivoCriado\s*=\s*arquivoCriado/, "Erro parcial deve informar arquivo criado.");
  assert.match(enviar, /erroParcial\.nomeFinal\s*=\s*nomeFinal/, "Erro parcial deve preservar nomeFinal.");
  assert.match(enviar, /erroParcial\.driveItemId\s*=\s*driveItemId/, "Erro parcial deve preservar driveItemId.");
  assert.match(enviar, /erroParcial\.listItemId\s*=\s*listItemId/, "Erro parcial deve preservar listItemId.");
  assert.match(enviar, /Arquivo enviado\. Não reenviar/, "Mensagem ao usuario deve evitar reenvio.");

  const confirmar = blocoFuncao("confirmarUploadCentral");
  assert.match(confirmar, /erroArquivo\.uploadParcial\s*\|\|\s*erroArquivo\.arquivoCriado/, "Upload parcial deve seguir fluxo de reparo.");
  assert.match(confirmar, /repararUploadParcial\s*\(/, "Confirmacao deve chamar reparo parcial.");
  assert.doesNotMatch(confirmar, /erros\.push/, "Upload parcial nao deve voltar a ser contado como erro simples.");
});

testar("Upload em massa reconcilia lista e evita reenvio duplicado", () => {
  assert.match(js, /async function repararUploadParcial\b/, "repararUploadParcial deve existir.");
  assert.match(js, /function reconciliarStatusUploadComDocumentosAtivos\b/, "reconciliarStatusUploadComDocumentosAtivos deve existir.");
  const reconciliar = blocoFuncao("reconciliarStatusUploadComDocumentosAtivos");
  assert.match(blocoFuncao("confirmarUploadCentral"), /reconciliarStatusUploadComDocumentosAtivos\s*\(\)/, "confirmarUploadCentral deve reconciliar apos atualizar a lista.");
  assert.match(blocoFuncao("confirmarUploadCentral"), /STATUS_UPLOAD_REPROCESSAVEIS\.has\(item\.status\)/, "Novo clique deve processar apenas pendentes ou nao enviados.");
  assert.match(js, /STATUS_UPLOAD_NAO_REENVIAR\s*=\s*new Set\(\[STATUS_UPLOAD_ENVIADO,\s*STATUS_UPLOAD_AVISO/, "Estados enviados devem ser tratados como nao reenviar.");
  assert.match(js, /Os arquivos já enviados não serão reenviados para evitar duplicidade/, "Mensagem deve orientar usuario leigo a nao reenviar.");
  assert.match(reconciliar, /temEvidenciaArquivoCriado/, "Reconciliacao deve reconhecer evidencias de arquivo criado.");
  assert.match(reconciliar, /resultado\.arquivoExiste\s*\|\|\s*resultado\.documento\s*\|\|\s*resultado\.driveItemId\s*\|\|\s*resultado\.listItemId/, "Reconciliacao deve considerar arquivoExiste, documento, driveItemId e listItemId.");
  assert.match(reconciliar, /statusArquivosUpload\[indice\]\s*=\s*STATUS_UPLOAD_AVISO/, "Upload com evidencia de criacao nao deve ser liberado para reenvio por atraso da lista.");
  assert.match(reconciliar, /confirmar-listagem-sharepoint/, "Pendencia deve orientar conferencia quando a lista ainda nao refletiu o upload.");
});

testar("Upload usa analise congelada para aviso de possivel duplicidade", () => {
  assert.match(js, /let analiseNomesCentralUpload\s*=\s*\[\]/, "Estado congelado da analise de nomes do upload deve existir.");
  assert.match(js, /function calcularAnaliseNomesCentralUpload\b/, "Calculo dedicado da analise de nomes do upload deve existir.");

  const calcular = blocoFuncao("calcularAnaliseNomesCentralUpload");
  assert.match(calcular, /const ocupadosAntesEnvio\s*=\s*criarConjuntoNomesUploadOcupados\s*\(\)/, "Analise deve capturar os nomes ocupados antes do envio.");
  assert.match(calcular, /nomeJaExistiaAntes/, "Analise deve marcar nome que ja existia antes do envio.");
  assert.match(calcular, /repetidoNaSelecao/, "Analise deve marcar repeticao dentro da selecao.");
  assert.match(calcular, /nomeFinalPrevisto/, "Analise deve calcular nome final previsto.");
  assert.match(calcular, /nomeFoiAjustado/, "Analise deve marcar quando o nome final sera ajustado.");
  assert.match(calcular, /STATUS_UPLOAD_NAO_REENVIAR\.has\(statusAtual\)/, "Arquivos ja enviados nao devem virar falso aviso ao recalcular.");

  const renderizar = blocoFuncao("renderizarListaCentralUpload");
  assert.match(renderizar, /analiseNomesCentralUpload/, "Renderizacao deve usar a analise congelada.");
  assert.doesNotMatch(renderizar, /analisarNomesSelecionadosUpload\s*\(/, "Renderizacao nao deve recalcular aviso diretamente pela lista atualizada.");
  assert.doesNotMatch(renderizar, /criarConjuntoNomesUploadOcupados\s*\(/, "Renderizacao nao deve depender diretamente de documentosAtivos atualizado.");

  const receber = blocoFuncao("receberArquivosCentralUpload");
  const enviarNovo = blocoFuncao("enviarNovoDocumento");
  const confirmar = blocoFuncao("confirmarUploadCentral");
  assert.match(receber, /calcularAnaliseNomesCentralUpload\s*\(\)/, "Receber arquivos deve atualizar a analise pelo estado atual pre-envio.");
  assert.match(enviarNovo, /calcularAnaliseNomesCentralUpload\s*\(\)/, "Selecao via enviarNovoDocumento deve atualizar a analise pelo estado atual pre-envio.");
  assert.match(confirmar, /calcularAnaliseNomesCentralUpload\s*\(\)/, "Confirmacao deve recalcular uma ultima vez antes de enviar.");
  assert.ok(
    confirmar.indexOf("calcularAnaliseNomesCentralUpload()") < confirmar.indexOf("await listarDocumentos()"),
    "Analise deve ser congelada antes do listarDocumentos pos-upload."
  );

  assert.doesNotMatch(js, /Nome já existe — será enviado com duplicidade/, "Texto antigo de duplicidade nao deve existir.");
  assert.match(js, /Possível duplicidade/, "Novo aviso deve falar em Possivel duplicidade.");
  assert.match(js, /será salvo como \$\{nomeFinal\} para evitar substituição/, "Aviso de nome existente deve informar nome final previsto.");
  assert.match(js, /Possível duplicidade na seleção/, "Aviso de repeticao na selecao deve existir.");
});

testar("Resumo final do upload nao mostra contagens zeradas", () => {
  const formatarResultado = blocoFuncao("formatarResultadoFinalUpload");
  const formatarResumo = blocoFuncao("formatarResumoFinalUpload");
  const confirmar = blocoFuncao("confirmarUploadCentral");

  assert.match(formatarResultado, /enviado\(s\) com sucesso/, "Resumo simples deve confirmar sucesso quando todos foram enviados.");
  assert.match(formatarResultado, /precisam de atenção e não devem ser reenviados/, "Resumo com avisos deve orientar nao reenviar.");
  assert.match(formatarResultado, /não foram enviados/, "Resumo com falhas deve informar arquivos nao enviados.");
  assert.match(formatarResultado, /Nenhum arquivo foi enviado/, "Resumo deve cobrir caso em que nada foi enviado.");
  assert.doesNotMatch(formatarResultado, /0 enviado\(s\) — não reenviar/, "Resumo nao deve exibir zero enviado com aviso.");
  assert.doesNotMatch(formatarResultado, /0 não enviado\(s\)/, "Resumo nao deve exibir zero nao enviado.");
  assert.doesNotMatch(formatarResultado, /0 precisam de atenção/, "Resumo nao deve exibir zero precisam de atencao.");
  assert.doesNotMatch(formatarResultado, /0 não foram enviados/, "Resumo nao deve exibir zero nao foram enviados.");
  assert.match(formatarResumo, /formatarResultadoFinalUpload\(resumo\)\.mensagem/, "formatarResumoFinalUpload deve usar a regra simplificada central.");
  assert.match(confirmar, /formatarResultadoFinalUpload\(resumo,\s*\{\s*temFalhaConferencia\s*\}\)/, "Titulo e mensagem final devem partir do mesmo resumo simplificado.");
  assert.match(confirmar, /resultadoFinal\.titulo/, "Barra de progresso deve usar o titulo simplificado.");
  assert.match(confirmar, /resultadoFinal\.mensagem/, "Mensagem global deve usar a mensagem simplificada.");
});

testar("Historico preservado carrega sob demanda e Recentes independe da lista completa", () => {
  const aplicar = blocoFuncao("aplicarListaAtual");
  const filtrar = blocoFuncao("filtrarDocumentos");
  const montarRecentes = blocoFuncao("montarDocumentosRecentes");
  const atualizar = blocoFuncao("atualizarTela");
  const carregarApoio = blocoFuncao("carregarDadosDeApoio");
  const carregarPagina = blocoFuncao("carregarPaginaHistoricoGeral");
  const abrirHistorico = blocoFuncao("abrirHistoricoGeral");
  const verMais = blocoFuncao("verMaisHistoricoGeral");
  const historicoDocumento = blocoFuncao("carregarHistoricoDocumento");

  assert.match(aplicar, /modoListaAtual === "recentes"\s*\?\s*montarDocumentosRecentes\(\{\s*limitado:\s*!termoBuscaAtual\s*\}\)/, "Recentes deve usar a lista baseada em modificacao.");
  assert.match(filtrar, /modoListaAtual === "recentes"\s*\?\s*montarDocumentosRecentes\(\{\s*limitado:\s*!termo\s*\}\)/, "Filtro de Recentes deve usar a lista baseada em modificacao.");
  assert.doesNotMatch(filtrar, /historicoApoioCarregado/, "Recentes nao deve aguardar carga global do historico.");
  assert.match(montarRecentes, /\[\.\.\.documentosAtivos, \.\.\.documentosLixeira\]/, "Recentes deve partir dos documentos conhecidos.");
  assert.match(montarRecentes, /ordenarPorModificacao/, "Recentes deve ordenar pela modificacao dos documentos.");
  assert.doesNotMatch(montarRecentes, /obterHistoricoOrdenado|historicoCarregado/, "Recentes nao deve depender do historico.");

  assert.doesNotMatch(carregarApoio, /historicoAcessosListId/, "Dados de apoio nao devem baixar o historico global.");
  assert.doesNotMatch(atualizar, /carregarPaginaHistoricoGeral/, "Inicializacao nao deve abrir a carga do historico geral.");
  assert.match(abrirHistorico, /carregarPaginaHistoricoGeral\(\{ reiniciar: true \}\)/, "Central deve iniciar a consulta somente quando for aberta.");
  assert.match(js, /const TAMANHO_PAGINA_HISTORICO_GERAL\s*=\s*100/, "Consulta geral deve declarar pagina limitada a 100 registros.");
  assert.match(carregarPagina, /@odata\.nextLink/, "Consulta geral deve guardar a proxima pagina do Graph.");
  assert.doesNotMatch(carregarPagina, /buscarTodosItens/, "Consulta geral nao deve percorrer todas as paginas automaticamente.");
  assert.match(verMais, /carregarPaginaHistoricoGeral\(\)/, "Mais registros devem ser carregados somente por acao do usuario.");

  assert.match(historicoDocumento, /carregarHistoricoPorArquivoId\(arquivoId, token\)/, "Painel deve consultar somente o historico do documento aberto.");
  assert.doesNotMatch(historicoDocumento, /carregarDadosDeApoio/, "Falha da consulta direta nao deve disparar carga global como fallback.");
  assert.doesNotMatch(js, /historicoApoioCarregado/, "Estado antigo de carga global deve ter sido removido.");
  assert.match(js, /versaoHistoricoCache\+\+/, "Invalidação do histórico deve usar o contador real de cache.");
  assert.doesNotMatch(js, /\bversaoHistorico\s*\+=/, "Não pode existir contador de histórico inexistente.");
  assert.match(montarRecentes, /versaoDocumentosCache/, "Recentes deve usar o contador real de documentos.");
  assert.doesNotMatch(js, /===\s*versaoDocumentos\b/, "Não pode existir contador de documentos inexistente.");
  assert.doesNotMatch(js, /mesclarAnotacaoNoCache/, "Histórico individual deve usar o cache de anotação existente.");
  assert.doesNotMatch(js, /sincronizarControlesHistoricoGeral/, "Central não deve depender de controles inventados.");
  assert.match(abrirHistorico, /abrirPainelDashboard\("Central de histórico"/, "Central deve preservar a interface existente.");
  assert.match(abrirHistorico, /sincronizarCamposFiltroHistoricoGeral/, "Central deve preservar os filtros existentes.");
  assert.match(js, /data-acao-historico="ver-mais"/, "Paginação deve preservar o manipulador de evento já existente.");
  assert.match(js, /Enviados recentemente \(histórico carregado\)/, "Relatório deve identificar contagem de envios como parcial quando o histórico global não está pré-carregado.");
  assert.doesNotMatch(js, /retencao-historico|historico-frio/i, "Codigo de producao nao deve referenciar a politica de retencao removida.");
});

testar("Duplicidades usam estrategia indexada e cache estavel", () => {
  const gerar = blocoFuncao("gerarParesDuplicidades");
  const atualizar = blocoFuncao("atualizarCentralDuplicidades");
  const renderizar = blocoFuncao("renderizarDocumentos");

  assert.match(gerar, /todos\.length\s*<=\s*LIMITE_ANALISE_DUPLICIDADES_EXAUSTIVA\s*\?\s*gerarParesDuplicidadesExaustivo\(todos\)\s*:\s*gerarParesDuplicidadesIndexado\(todos\)/, "Duplicidades acima do limite devem usar estrategia indexada.");
  assert.match(gerar, /cacheParesDuplicidades\.assinatura\s*===\s*assinatura/, "Cache de pares deve ser reaproveitado por assinatura.");
  assert.match(atualizar, /tokenAnaliseCentralDuplicidades/, "Central deve descartar analise obsoleta por token.");
  assert.doesNotMatch(renderizar, /limparCacheDuplicidades\s*\(/, "Renderizacao/listagem nao deve limpar cache de duplicidades.");
  assert.match(js, /obterMapaNomesVisuaisRepetidosCacheado/, "Mapa de nomes repetidos deve ser cacheado para carga massiva.");
});

testar("Paineis abrem visualmente antes de tarefas pesadas", () => {
  const abrir = blocoFuncao("abrirDocumentoNoPainel");
  const atualizarCentral = blocoFuncao("atualizarCentralDuplicidades");

  const indiceAbertura = abrir.indexOf('painel?.classList.add("aberto")');
  const indiceHistorico = abrir.indexOf("carregarHistoricoDocumento");
  const indiceAnotacao = abrir.indexOf("carregarAnotacaoDocumento");
  const indiceVersoes = abrir.indexOf("carregarVersoesSharePointDocumento");
  assert.ok(indiceAbertura > -1, "Painel lateral deve abrir visualmente de forma explicita.");
  assert.ok(indiceHistorico > indiceAbertura, "Historico deve carregar depois da abertura visual.");
  assert.ok(indiceAnotacao > indiceAbertura, "Anotacao deve carregar depois da abertura visual.");
  assert.ok(indiceVersoes > indiceAbertura, "Versoes devem carregar depois da abertura visual.");
  assert.match(abrir, /requestAnimationFrame/, "Painel lateral deve respirar antes de tarefas pesadas.");
  assert.match(atualizarCentral, /requestAnimationFrame/, "Central deve permitir abertura visual antes da renderizacao pesada.");
});

testar("CSS dos paineis usa transform e evita animar left/right", () => {
  assert.match(css, /PERFORMANCE_PAINEIS_CARGA_REAL_V4_20260607/, "Bloco de performance dos paineis deve existir.");
  assert.match(css, /\.painelLateral,[\s\S]*?\.painelDashboard\s*\{[\s\S]*transform:\s*translate3d\(104%,\s*0,\s*0\)/, "Painel lateral/dashboard devem entrar por transform.");
  assert.match(css, /\.painelCentralDuplicidades\s*\{[\s\S]*transform:\s*translate3d\(-104%,\s*0,\s*0\)/, "Central de Duplicidades deve entrar por transform.");
  assert.match(css, /transition:\s*transform\s+\.20s\s+ease,\s*opacity\s+\.20s\s+ease,\s*box-shadow\s+\.20s\s+ease\s*!important/, "Transicao dos paineis deve evitar transition all/left/right.");
});

testar("Botao Enviar da Central usa listener fixo", () => {
  const eventos = blocoFuncao("inicializarEventosFixos");
  assert.match(eventos, /aoClicar\(["']btnConfirmarUploadCentral["'],\s*window\.confirmarUploadCentral\)/, "Botao Enviar deve ser ligado pelo inicializador fixo.");
  assert.match(eventos, /inputNovoDocumento[^;]+addEventListener\(["']change["']/, "Selecao de arquivos deve seguir listener do inicializador.");
  assert.match(eventos, /gavetaUpload[^;]+addEventListener\(["']change["'],\s*atualizarAcoesCentralUpload\)/, "Troca de gaveta deve atualizar acoes.");
  assert.match(eventos, /motivoUpload[^;]+addEventListener\(["']input["'],\s*atualizarAcoesCentralUpload\)/, "Preenchimento de motivo deve atualizar acoes.");
  assert.doesNotMatch(html, /\bonclick\s*=\s*["'][^"']*confirmarUploadCentral/i, "Nao deve haver handler inline novo para Enviar.");
});

testar("Selecao nova limpa estado antigo de upload", () => {
  const reset = blocoFuncao("resetarEstadoAoSelecionarArquivosUpload");
  assert.match(reset, /uploadConcluidoComSucesso\s*=\s*false/, "Selecao nova deve limpar sucesso anterior.");
  assert.match(reset, /uploadTeveErro\s*=\s*false/, "Selecao nova deve limpar erro anterior.");
  assert.match(reset, /uploadEmAndamento\s*=\s*false/, "Selecao nova deve liberar estado travado quando nao houver envio real.");
  assert.match(blocoFuncao("receberArquivosCentralUpload"), /resetarEstadoAoSelecionarArquivosUpload\s*\(\)/, "Receber arquivos deve resetar estado antigo.");
});

// CABECALHO_ESTAVEL_AUTH_20260812_TESTE
testar("Cabecalho permanece estavel durante autenticacao e sem camadas CSS antigas", () => {
  const inicioMarcador = "/* INICIO_CABECALHO_ESTAVEL_AUTH_20260812 */";
  const fimMarcador = "/* FIM_CABECALHO_ESTAVEL_AUTH_20260812 */";
  const inicio = css.indexOf(inicioMarcador);
  const fim = css.indexOf(fimMarcador);
  assert.ok(inicio >= 0 && fim > inicio, "Bloco oficial do cabecalho deve existir uma unica vez.");
  assert.equal(css.indexOf(inicioMarcador, inicio + 1), -1, "Nao pode existir segundo bloco oficial do cabecalho.");

  const bloco = css.slice(inicio, fim + fimMarcador.length);
  const foraDoBloco = (css.slice(0, inicio) + css.slice(fim + fimMarcador.length))
    .replace(/\/\*[\s\S]*?\*\//g, "");

  assert.doesNotMatch(
    foraDoBloco,
    /\.(?:cabecalhoSistema|cabecalhoMarca|logoSistema|cabecalhoAcoes|btnCabecalhoEntrar|btnCabecalhoSair|subtituloSistema)\b/,
    "Seletores dedicados ao cabecalho devem existir somente no bloco oficial."
  );
  assert.match(bloco, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+360px/, "Desktop deve reservar largura estavel para as acoes.");
  assert.match(bloco, /min-height:\s*92px/, "Cabecalho desktop deve reservar altura estavel durante autenticacao.");
  assert.match(bloco, /\.cabecalhoAcoes\s*\{[\s\S]*?grid-template-rows:\s*18px 36px/, "Area de autenticacao deve reservar linhas fixas no desktop.");
  assert.doesNotMatch(bloco, /modoCompacto/, "Preferencia de modo compacto nao deve mover o cabecalho apos o JavaScript iniciar.");

  const entrar = elementoPorId("btnEntrar");
  const configuracoes = elementoPorId("btnAbrirConfiguracoesTopo");
  const sair = elementoPorId("btnSair");
  assert.doesNotMatch(entrar, /\shidden(?:\s|>)/i, "Entrar deve continuar disponivel no pre-login.");
  assert.match(configuracoes, /\shidden(?:\s|>)/i, "Configuracoes deve iniciar oculto sem style inline.");
  assert.match(sair, /\shidden(?:\s|>)/i, "Sair deve iniciar oculto sem style inline.");
  assert.doesNotMatch(configuracoes + sair, /\sstyle=/i, "Botoes do cabecalho nao devem disputar display com estilo inline.");

  const atualizar = blocoFuncao("atualizarTela");
  const blindar = blocoFuncao("aplicarBlindagemVisualPreLogin");
  assert.match(js, /function definirVisibilidadeBotaoCabecalho\(/, "Visibilidade do cabecalho deve ter helper unico.");
  assert.match(atualizar, /definirVisibilidadeBotaoCabecalho\("btnEntrar", !usuario\)/, "Estado inicial deve usar o helper do cabecalho.");
  assert.match(atualizar, /definirVisibilidadeBotaoCabecalho\("btnSair", true\)/, "Sair so deve ser liberado apos acesso confirmado.");
  assert.doesNotMatch(atualizar + blindar, /getElementById\(\"(?:btnEntrar|btnSair|btnAbrirConfiguracoesTopo)\"\)[^;]*style\.(?:display|setProperty)/, "Botoes do cabecalho nao devem controlar geometria com style inline.");
});

console.log("Testes de regressao do Arquivo Digital concluidos com sucesso.");
