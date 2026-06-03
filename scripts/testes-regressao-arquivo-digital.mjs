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

testar("Upload em massa diferencia aviso de erro real", () => {
  assert.match(js, /const STATUS_UPLOAD_AVISO\s*=\s*["']Enviado — não reenviar["']/, "Status de aviso deve existir para arquivo criado com pendencia.");
  assert.match(js, /const STATUS_UPLOAD_NAO_ENVIADO\s*=\s*["']Não enviado["']/, "Status Nao enviado deve existir para erro real.");
  assert.match(css, /\.statusUploadAviso\b/, "CSS deve destacar aviso sem vermelho.");
  assert.match(css, /\.statusUploadErroReal\b/, "CSS deve reservar vermelho para Nao enviado.");
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
  assert.match(confirmar, /formatarResultadoFinalUpload\(resumo\)/, "Titulo e mensagem final devem partir do mesmo resumo simplificado.");
  assert.match(confirmar, /resultadoFinal\.titulo/, "Barra de progresso deve usar o titulo simplificado.");
  assert.match(confirmar, /resultadoFinal\.mensagem/, "Mensagem global deve usar a mensagem simplificada.");
});

testar("Busca em Recentes usa documentos ativos quando ha termo", () => {
  const aplicar = blocoFuncao("aplicarListaAtual");
  const filtrar = blocoFuncao("filtrarDocumentos");
  const renderizar = blocoFuncao("renderizarDocumentos");

  assert.match(aplicar, /modoListaAtual === "recentes" && termoBusca\s*\?\s*documentosAtivos/, "Recentes com busca deve usar documentosAtivos como base.");
  assert.match(aplicar, /modoListaAtual === "recentes"\s*\?\s*montarDocumentosRecentesComHistorico\(\)/, "Recentes sem busca deve manter lista de recentes.");
  assert.match(aplicar, /modoListaAtual === "na Lixeira"\s*\?\s*documentosLixeira/, "Lixeira deve manter documentosLixeira como base.");

  assert.match(filtrar, /modoListaAtual === "recentes" && termo\s*\?\s*documentosAtivos/, "Filtro de Recentes com termo deve pesquisar todos os ativos.");
  assert.match(filtrar, /modoListaAtual === "recentes"\s*\?\s*montarDocumentosRecentesComHistorico\(\)/, "Filtro de Recentes sem termo deve usar recentes.");
  assert.match(filtrar, /modoListaAtual === "na Lixeira"\s*\?\s*documentosLixeira/, "Filtro da Lixeira deve pesquisar somente a Lixeira.");
  assert.match(renderizar, /modoListaAtual === "recentes" && !termoBusca[\s\S]*\.slice\(0,\s*preferenciasSistema\.limiteRecentes\)/, "Limite de recentes deve ser aplicado apenas quando nao ha busca.");
  const inicioRamoRecentesComBusca = renderizar.indexOf(': modoListaAtual === "recentes"');
  const fimRamoRecentesComBusca = renderizar.indexOf(': modoListaAtual === "na Lixeira"', inicioRamoRecentesComBusca);
  assert.ok(inicioRamoRecentesComBusca > -1 && fimRamoRecentesComBusca > inicioRamoRecentesComBusca, "Ramo de Recentes com busca deve estar separado.");
  const ramoRecentesComBusca = renderizar.slice(inicioRamoRecentesComBusca, fimRamoRecentesComBusca);
  assert.doesNotMatch(ramoRecentesComBusca, /limiteRecentes/, "Recentes com busca nao deve limitar pelo limite de recentes.");
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

console.log("Testes de regressao do Arquivo Digital concluidos com sucesso.");
