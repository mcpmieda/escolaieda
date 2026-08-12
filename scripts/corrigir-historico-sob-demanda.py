from pathlib import Path
import re
import subprocess

RAIZ = Path(__file__).resolve().parents[1]
JS_PATH = RAIZ / "arquivo-digital" / "arquivo-digital.js"
TESTES_PATH = RAIZ / "scripts" / "testes-regressao-arquivo-digital.mjs"
VALIDADOR_PATH = RAIZ / "scripts" / "validar-arquivo-digital.mjs"


def exigir_unico(texto, antigo, novo, rotulo):
    total = texto.count(antigo)
    if total != 1:
        raise RuntimeError(f"{rotulo}: esperado 1 trecho, encontrado {total}")
    return texto.replace(antigo, novo, 1)


def substituir_regex(texto, padrao, novo, rotulo):
    resultado, total = re.subn(padrao, lambda _m: novo, texto, count=1, flags=re.S)
    if total != 1:
        raise RuntimeError(f"{rotulo}: esperado 1 bloco, encontrado {total}")
    return resultado


js = JS_PATH.read_text(encoding="utf-8")
baseline = subprocess.check_output(
    ["git", "show", "origin/main:arquivo-digital/arquivo-digital.js"],
    text=True,
    encoding="utf-8"
)

# 1. Restaurar os nomes reais e a invalidação completa dos caches.
js = substituir_regex(
    js,
    r"    function invalidarCacheDocumentos\(\) \{.*?\n    \}\n\n    function invalidarCacheHistorico\(\) \{.*?\n    \}",
    """    function invalidarCacheDocumentos() {
      versaoDocumentosCache++;
      cacheDocumentosPorArquivoId = { versao: -1, mapa: new Map() };
      cacheMapaNomesVisuaisTodosDocumentos = { versao: -1, mapa: new Map() };
      cacheDocumentosRecentes = { versaoDocumentos: -1, limitado: false, limite: 0, ordem: \"desc\", itens: [] };
    }

    function invalidarCacheHistorico() {
      versaoHistoricoCache++;
      cacheHistoricoPorArquivoId = { versao: -1, mapa: new Map() };
      cacheHistoricoOrdenado = { versao: -1, direcao: \"\", itens: [] };
      cacheUltimasMovimentacoes = { versao: -1, limite: 0, mapa: new Map() };
    }""",
    "invalidação de caches"
)

js = exigir_unico(
    js,
    "cacheDocumentosRecentes.versaoDocumentos === versaoDocumentos &&",
    "cacheDocumentosRecentes.versaoDocumentos === versaoDocumentosCache &&",
    "comparação da versão de documentos"
)
js = exigir_unico(
    js,
    "        versaoDocumentos,\n        limitado,",
    "        versaoDocumentos: versaoDocumentosCache,\n        limitado,",
    "armazenamento da versão de documentos"
)

# 2. Restaurar a carga de anotações exatamente no formato anterior, retirando somente o histórico global.
js = substituir_regex(
    js,
    r"    async function carregarDadosDeApoio\(tokenInformado = \"\", opcoes = \{\}\) \{.*?\n    \}\n\n    window\.recarregarDashboard",
    """    async function carregarDadosDeApoio(tokenInformado = \"\", opcoes = {}) {
      if (dadosApoioCarregando || (dadosApoioCarregados && !opcoes.forcar)) return;
      dadosApoioCarregando = true;
      try {
        const token = tokenInformado || await obterToken();
        const urlAnotacoes = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.anotacoesArquivosListId}/items?$expand=fields($select=Title,ARQUIVO_ID,ANOTACAO,ATUALIZADO_POR,DATA_ATUALIZACAO)&$top=999`;
        const itensAnotacoes = await buscarTodosItens(urlAnotacoes, token);
        anotacoesCarregadas = itensAnotacoes.map(mapearItemAnotacao);
        invalidarCacheAnotacoes();
        dadosApoioCarregados = true;
        atualizarDashboard();
        filtrarDocumentos();
      } finally {
        dadosApoioCarregando = false;
      }
    }

    window.recarregarDashboard""",
    "carga de dados de apoio"
)

# 3. Corrigir o cache de anotação no histórico individual.
js = exigir_unico(
    js,
    "        if (anotacaoDireta) mesclarAnotacaoNoCache(anotacaoDireta);",
    "        atualizarCacheAnotacaoDocumento(anotacaoDireta, arquivoId);",
    "cache da anotação do documento"
)

# 4. Restaurar toda a interface/filtros originais da Central e mudar somente a fonte dos dados.
marcador_inicio = "    window.abrirHistoricoGeral"
marcador_fim = "    /* JS_FILTRO_DATAS_HISTORICO_GERAL_FIM */"
inicio_atual = js.index(marcador_inicio)
fim_atual = js.index(marcador_fim, inicio_atual) + len(marcador_fim)
inicio_base = baseline.index(marcador_inicio)
fim_base = baseline.index(marcador_fim, inicio_base) + len(marcador_fim)
regiao = baseline[inicio_base:fim_base]

bloco_carga_antigo = """      if (!historicoApoioCarregado && !dadosApoioCarregando) {
        agendarTarefaSegundoPlano(async () => {
          await carregarDadosDeApoio();
          renderizarHistoricoGeral();
        }, 80);
      }"""
bloco_carga_novo = """      if (!historicoGeralInicializado && !historicoGeralCarregando) {
        agendarTarefaSegundoPlano(async () => {
          try {
            await carregarPaginaHistoricoGeral({ reiniciar: true });
          } catch (erro) {
            logger.warn(\"Falha ao carregar a primeira pagina do historico.\", erro);
            mostrarMensagem(\"Nao foi possivel carregar o historico agora. Tente novamente.\", \"erro\");
          }
        }, 80);
      }"""
regiao = exigir_unico(regiao, bloco_carga_antigo, bloco_carga_novo, "abertura sob demanda da Central")

regiao = substituir_regex(
    regiao,
    r"window\.verMaisHistoricoGeral = function \(event\) \{.*?\n    \};\n    /\* JS_FILTRO_DATAS_HISTORICO_GERAL_INICIO \*/",
    """window.verMaisHistoricoGeral = async function (event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      const conteudoPainel = document.querySelector(\"#painelDashboard .painelConteudo\");
      const posicaoRolagem = conteudoPainel ? conteudoPainel.scrollTop : 0;
      limiteHistoricoGeralAtual += preferenciasSistema.limiteRelatorios || 30;

      const ordenadosCarregados = obterHistoricoOrdenado(obterOrdemHistoricoGeralAtual());
      const filtradosCarregados = ordenadosCarregados
        .filter(itemDentroFiltroHistoricoGeral)
        .filter(itemDentroBuscaHistoricoGeral);
      const precisaBuscarOutraPagina = Boolean(proximaPaginaHistoricoGeral) && filtradosCarregados.length < limiteHistoricoGeralAtual;

      if (precisaBuscarOutraPagina && !historicoGeralCarregando) {
        try {
          await carregarPaginaHistoricoGeral();
        } catch (erro) {
          logger.warn(\"Falha ao carregar mais registros do historico.\", erro);
          mostrarMensagem(\"Nao foi possivel carregar mais registros agora.\", \"erro\");
        }
      }

      renderizarHistoricoGeral();
      requestAnimationFrame(() => {
        const conteudoAtualizado = document.querySelector(\"#painelDashboard .painelConteudo\");
        if (conteudoAtualizado) conteudoAtualizado.scrollTop = posicaoRolagem;
      });
    };
    /* JS_FILTRO_DATAS_HISTORICO_GERAL_INICIO */""",
    "paginação acionada pelo usuário"
)

regiao = regiao.replace(
    "resumoPeriodo = `Histórico completo: ${totalBase} registro(s).`;",
    "resumoPeriodo = `Registros carregados: ${totalBase} registro(s).`;"
)
regiao = regiao.replace(
    "resumoPeriodo = `Hoje: ${totalBase} de ${totalGeral} registro(s).`;",
    "resumoPeriodo = `Hoje: ${totalBase} de ${totalGeral} registro(s) carregado(s).`;"
)
regiao = regiao.replace(
    "resumoPeriodo = `Últimos 7 dias: ${totalBase} de ${totalGeral} registro(s).`;",
    "resumoPeriodo = `Últimos 7 dias: ${totalBase} de ${totalGeral} registro(s) carregado(s).`;"
)
regiao = regiao.replace(
    "resumoPeriodo = `Últimos 30 dias: ${totalBase} de ${totalGeral} registro(s).`;",
    "resumoPeriodo = `Últimos 30 dias: ${totalBase} de ${totalGeral} registro(s) carregado(s).`;"
)
regiao = regiao.replace(
    "resumoPeriodo = `Período ${partes.join(\" \")}: ${totalBase} de ${totalGeral} registro(s).`;",
    "resumoPeriodo = `Período ${partes.join(\" \")}: ${totalBase} de ${totalGeral} registro(s) carregado(s).`;"
)
regiao = exigir_unico(
    regiao,
    "      if (termo) {\n        return `${resumoPeriodo} Busca: ${totalFiltrado} resultado(s), ${textoOrdem}.`;\n      }",
    "      if (proximaPaginaHistoricoGeral) resumoPeriodo += \" Há mais registros disponíveis no SharePoint.\";\n\n      if (termo) {\n        return `${resumoPeriodo} Busca: ${totalFiltrado} resultado(s), ${textoOrdem}.`;\n      }",
    "resumo da paginação"
)

regiao = exigir_unico(
    regiao,
    """      if (!historicoCarregado.length) {
        caixa.innerHTML = \"<p>Central de histórico ainda não carregada. Aguarde alguns segundos e tente novamente.</p>\";
        return;
      }""",
    """      if (!historicoCarregado.length) {
        if (historicoGeralCarregando) {
          caixa.innerHTML = \"<p>Carregando a primeira página do histórico...</p>\";
        } else if (historicoGeralInicializado) {
          caixa.innerHTML = \"<p>Nenhum registro de histórico disponível.</p>\";
        } else {
          caixa.innerHTML = \"<p>O histórico será consultado somente quando necessário.</p>\";
        }
        return;
      }""",
    "estado vazio da Central"
)

regiao = substituir_regex(
    regiao,
    r"      const botaoMais = filtrados\.length > exibidos\.length \? `\n        <button class=\"secundario ignorarHoverGlobal hoverSecundarioNeutro btnVerMaisHistoricoGeral\" type=\"button\" data-acao-historico=\"ver-mais\">Ver mais</button>\n      ` : \"\";",
    """      const temMaisCarregados = filtrados.length > exibidos.length;
      const temMaisNoSharePoint = Boolean(proximaPaginaHistoricoGeral);
      const botaoMais = temMaisCarregados || temMaisNoSharePoint ? `
        <button class=\"secundario ignorarHoverGlobal hoverSecundarioNeutro btnVerMaisHistoricoGeral\" type=\"button\" data-acao-historico=\"ver-mais\"${historicoGeralCarregando ? \" disabled\" : \"\"}>${historicoGeralCarregando ? \"Carregando...\" : temMaisNoSharePoint ? \"Carregar mais registros\" : \"Ver mais\"}</button>
      ` : \"\";""",
    "botão de carregar mais"
)

js = js[:inicio_atual] + regiao + js[fim_atual:]

# 5. Proteções explícitas contra os erros de runtime encontrados na revisão.
proibidos = [
    "versaoHistorico +=",
    "=== versaoDocumentos &&",
    "        versaoDocumentos,\n",
    "mesclarAnotacaoNoCache",
    "sincronizarControlesHistoricoGeral",
    "filtroHistoricoGeral = \"todos\"",
    "periodoHistoricoGeral = \"todos\"",
]
for termo in proibidos:
    if termo in js:
        raise RuntimeError(f"Referência inválida ainda presente: {termo}")

JS_PATH.write_text(js, encoding="utf-8")

# 6. Fortalecer a regressão para capturar nomes inexistentes e preservar a UI anterior.
testes = TESTES_PATH.read_text(encoding="utf-8")
marcador = '  assert.doesNotMatch(js, /historicoApoioCarregado/, "Estado antigo de carga global deve ter sido removido.");\n'
adicional = '''  assert.match(js, /versaoHistoricoCache\\+\\+/, "Invalidação do histórico deve usar o contador real de cache.");
  assert.doesNotMatch(js, /\\bversaoHistorico\\s*\\+=/, "Não pode existir contador de histórico inexistente.");
  assert.match(montarRecentes, /versaoDocumentosCache/, "Recentes deve usar o contador real de documentos.");
  assert.doesNotMatch(js, /===\\s*versaoDocumentos\\b/, "Não pode existir contador de documentos inexistente.");
  assert.doesNotMatch(js, /mesclarAnotacaoNoCache/, "Histórico individual deve usar o cache de anotação existente.");
  assert.doesNotMatch(js, /sincronizarControlesHistoricoGeral/, "Central não deve depender de controles inventados.");
  assert.match(abrirHistorico, /abrirPainelDashboard\\(\"Central de histórico\"/, "Central deve preservar a interface existente.");
  assert.match(abrirHistorico, /sincronizarCamposFiltroHistoricoGeral/, "Central deve preservar os filtros existentes.");
  assert.match(js, /data-acao-historico=\"ver-mais\"/, "Paginação deve preservar o manipulador de evento já existente.");
'''
if marcador not in testes:
    raise RuntimeError("Marcador do teste de histórico não encontrado")
testes = testes.replace(marcador, marcador + adicional, 1)
TESTES_PATH.write_text(testes, encoding="utf-8")

# 7. Reforçar o validador oficial com as mesmas garantias de runtime.
validador = VALIDADOR_PATH.read_text(encoding="utf-8")
antigo = '''const historicoSobDemanda =
  /const TAMANHO_PAGINA_HISTORICO_GERAL\\s*=\\s*100/.test(js) &&
  /async function carregarPaginaHistoricoGeral\\b/.test(js) &&
  /@odata\\.nextLink/.test(js) &&
  /window\\.verMaisHistoricoGeral\\s*=\\s*async function/.test(js) &&
  /async function carregarHistoricoPorArquivoId\\b/.test(js) &&
  !/historicoApoioCarregado/.test(js);'''
novo = '''const historicoSobDemanda =
  /const TAMANHO_PAGINA_HISTORICO_GERAL\\s*=\\s*100/.test(js) &&
  /async function carregarPaginaHistoricoGeral\\b/.test(js) &&
  /@odata\\.nextLink/.test(js) &&
  /window\\.verMaisHistoricoGeral\\s*=\\s*async function/.test(js) &&
  /async function carregarHistoricoPorArquivoId\\b/.test(js) &&
  /versaoHistoricoCache\\+\\+/.test(js) &&
  /abrirPainelDashboard\\(\"Central de histórico\"/.test(js) &&
  /sincronizarCamposFiltroHistoricoGeral/.test(js) &&
  !/historicoApoioCarregado/.test(js) &&
  !/\\bversaoHistorico\\s*\\+=/.test(js) &&
  !/===\\s*versaoDocumentos\\b/.test(js) &&
  !/mesclarAnotacaoNoCache/.test(js) &&
  !/sincronizarControlesHistoricoGeral/.test(js);'''
validador = exigir_unico(validador, antigo, novo, "proteção do validador")
VALIDADOR_PATH.write_text(validador, encoding="utf-8")

print("Correções de runtime e preservação da interface aplicadas.")
