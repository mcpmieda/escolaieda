from pathlib import Path
import re

RAIZ = Path(__file__).resolve().parents[1]
JS_PATH = RAIZ / "arquivo-digital" / "arquivo-digital.js"
README_PATH = RAIZ / "README.md"
AGENTS_PATH = RAIZ / "AGENTS.md"
VALIDADOR_PATH = RAIZ / "scripts" / "validar-arquivo-digital.mjs"
TESTES_PATH = RAIZ / "scripts" / "testes-regressao-arquivo-digital.mjs"


def replace_once(texto, antigo, novo, rotulo):
    total = texto.count(antigo)
    if total != 1:
        raise RuntimeError(f"{rotulo}: esperado 1 trecho exato, encontrado {total}")
    return texto.replace(antigo, novo, 1)


def sub_once(texto, padrao, novo, rotulo):
    resultado, total = re.subn(padrao, lambda _m: novo, texto, count=1, flags=re.S)
    if total != 1:
        raise RuntimeError(f"{rotulo}: esperado 1 bloco, encontrado {total}")
    return resultado


def sub_with_match_once(texto, padrao, funcao, rotulo):
    resultado, total = re.subn(padrao, funcao, texto, count=1, flags=re.S)
    if total != 1:
        raise RuntimeError(f"{rotulo}: esperado 1 bloco, encontrado {total}")
    return resultado


js = JS_PATH.read_text(encoding="utf-8")

js = replace_once(
    js,
    "    let dadosApoioCarregando = false;\n    let dadosApoioCarregados = false;\n    let historicoApoioCarregado = false;\n    let duplicidadesCarregando = false;",
    "    let dadosApoioCarregando = false;\n    let dadosApoioCarregados = false;\n    let historicoGeralCarregando = false;\n    let historicoGeralInicializado = false;\n    let proximaPaginaHistoricoGeral = \"\";\n    let duplicidadesCarregando = false;",
    "estado do historico"
)

js = replace_once(
    js,
    "    const LIMITE_MESCLAGEM_LOCAL_BYTES = 50 * 1024 * 1024;",
    "    const LIMITE_MESCLAGEM_LOCAL_BYTES = 50 * 1024 * 1024;\n    const TAMANHO_PAGINA_HISTORICO_GERAL = 100;",
    "tamanho da pagina do historico"
)

js = js.replace(
    'let cacheDocumentosRecentes = { versaoHistorico: -1, versaoDocumentos: -1, limitado: false, limite: 0, ordem: "desc", itens: [] };',
    'let cacheDocumentosRecentes = { versaoDocumentos: -1, limitado: false, limite: 0, ordem: "desc", itens: [] };'
)

js = sub_once(
    js,
    r"    function invalidarCacheHistorico\(\) \{.*?\n    \}",
    """    function invalidarCacheHistorico() {
      versaoHistorico += 1;
      cacheHistoricoOrdenado = { versao: -1, ordem: \"\", itens: [] };
    }""",
    "invalidação do cache do histórico"
)

js = js.replace("atualizarCacheHistoricoDocumento", "mesclarHistoricoNoCache")

js = sub_once(
    js,
    r"    function acaoHistoricoRelevanteRecentes\(acao\) \{.*?\n    \}\n\n    function montarDocumentosRecentesComHistorico\(opcoes = \{\}\) \{.*?\n    \}",
    """    function montarDocumentosRecentes(opcoes = {}) {
      const limitado = Boolean(opcoes.limitado);
      const limite = Math.max(1, Number(preferenciasSistema.limiteRecentes) || 20);
      const ordem = preferenciasSistema.ordemRecentes === \"asc\" ? \"asc\" : \"desc\";
      if (
        cacheDocumentosRecentes.versaoDocumentos === versaoDocumentos &&
        cacheDocumentosRecentes.limitado === limitado &&
        cacheDocumentosRecentes.limite === limite &&
        cacheDocumentosRecentes.ordem === ordem
      ) {
        return cacheDocumentosRecentes.itens;
      }

      const todos = [...documentosAtivos, ...documentosLixeira]
        .map(documento => ({
          ...documento,
          dataRecente: documento.modificado || documento.dataModificacao || \"\"
        }));
      const recentes = ordenarPorModificacao(todos, ordem);
      const itens = limitado ? recentes.slice(0, limite) : recentes;
      cacheDocumentosRecentes = {
        versaoDocumentos,
        limitado,
        limite,
        ordem,
        itens
      };
      return itens;
    }""",
    "Recentes independente do histórico global"
)

js = js.replace("montarDocumentosRecentesComHistorico", "montarDocumentosRecentes")

js = sub_once(
    js,
    r"\n      if \(modoListaAtual === \"recentes\" && !historicoApoioCarregado\) \{.*?\n        return;\n      \}\n",
    "\n",
    "remoção do bloqueio de Recentes pela carga do histórico"
)

js = replace_once(
    js,
    "        historicoApoioCarregado,",
    "        historicoGeralInicializado,\n        historicoGeralCarregando,\n        historicoGeralTemMaisPaginas: Boolean(proximaPaginaHistoricoGeral),",
    "diagnóstico do estado do histórico"
)

padrao_anotacao = r"(    async function carregarAnotacaoPorArquivoId\(arquivoId, token\) \{.*?\n    \})\n\n    async function carregarDadosDeApoio"

def inserir_paginacao(match):
    bloco = match.group(1)
    helper = r'''

    function montarUrlPaginaInicialHistoricoGeral() {
      return `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.historicoAcessosListId}/items?$expand=fields($select=Title,USUARIO_EMAIL,ACAO,USUARIO_NOME,DATA_HORA,ARQUIVO_ID,OBSERVACAO)&$top=${TAMANHO_PAGINA_HISTORICO_GERAL}`;
    }

    async function carregarPaginaHistoricoGeral(opcoes = {}) {
      if (historicoGeralCarregando) return false;
      const reiniciar = opcoes.reiniciar === true;
      if (!reiniciar && historicoGeralInicializado && !proximaPaginaHistoricoGeral) return false;

      historicoGeralCarregando = true;
      renderizarHistoricoGeral();
      try {
        const token = await obterToken();
        const url = reiniciar || !historicoGeralInicializado
          ? montarUrlPaginaInicialHistoricoGeral()
          : proximaPaginaHistoricoGeral;
        if (!url) return false;

        const resposta = await fetchGraphComRetry(url, { headers: { Authorization: `Bearer ${token}` } }, { tentativas: 3, baseMs: 450 });
        if (!resposta.ok) throw new Error(await lerErroGraph(resposta));
        const dados = await resposta.json();
        const itens = (dados.value || []).map(mapearItemHistorico);
        mesclarHistoricoNoCache(itens);
        proximaPaginaHistoricoGeral = dados["@odata.nextLink"] || "";
        historicoGeralInicializado = true;
        return true;
      } finally {
        historicoGeralCarregando = false;
        renderizarHistoricoGeral();
      }
    }
'''
    return bloco + helper + "\n    async function carregarDadosDeApoio"

js = sub_with_match_once(js, padrao_anotacao, inserir_paginacao, "inserção da paginação do histórico")

js = sub_once(
    js,
    r"    async function carregarDadosDeApoio\(tokenInformado = \"\", opcoes = \{\}\) \{.*?\n    \}\n\n    window\.recarregarDashboard",
    """    async function carregarDadosDeApoio(tokenInformado = \"\", opcoes = {}) {
      if (dadosApoioCarregando || (dadosApoioCarregados && !opcoes.forcar)) return;
      dadosApoioCarregando = true;
      try {
        const token = tokenInformado || await obterToken();
        const urlAnotacoes = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.anotacoesArquivosListId}/items?$expand=fields($select=Title,ARQUIVO_ID,ANOTACAO,DATA_ATUALIZACAO,USUARIO_EMAIL)&$top=999`;
        const itensAnotacoes = await buscarTodosItens(urlAnotacoes, token);
        anotacoesCarregadas = itensAnotacoes.map(mapearItemAnotacao);
        dadosApoioCarregados = true;
        invalidarCacheAnotacoes();
        if (documentoSelecionado) carregarAnotacaoDocumento(documentoSelecionado, painelDocumentoTokenAtual);
      } catch (erro) {
        logger.warn(\"Falha ao carregar dados de apoio.\", erro);
      } finally {
        dadosApoioCarregando = false;
      }
    }

    window.recarregarDashboard""",
    "dados de apoio sem carga global do histórico"
)

js = sub_once(
    js,
    r"    window\.abrirHistoricoGeral = function\(\) \{.*?\n    \};\n\n    window\.verMaisHistoricoGeral",
    """    window.abrirHistoricoGeral = function() {
      const painel = document.getElementById(\"painelDashboard\");
      const titulo = document.getElementById(\"tituloDashboard\");
      const caixa = document.getElementById(\"conteudoDashboard\");
      if (!painel || !titulo || !caixa) return;
      filtroHistoricoGeral = \"todos\";
      termoBuscaHistoricoGeral = \"\";
      periodoHistoricoGeral = \"todos\";
      ordemHistoricoGeral = \"desc\";
      limiteHistoricoGeralAtual = Math.max(1, Number(preferenciasSistema.limiteRelatorios) || 100);
      titulo.textContent = \"Histórico de atividades\";
      caixa.innerHTML = htmlInternoConfiavel(`
        <div class=\"historicoGeralControles\">
          <div class=\"filtroHistoricoGeral\">
            <button type=\"button\" class=\"ativo\" data-filtro-historico=\"todos\">Todos</button>
            <button type=\"button\" data-filtro-historico=\"visualizou\">Visualizou</button>
            <button type=\"button\" data-filtro-historico=\"anotacao\">Anotação</button>
            <button type=\"button\" data-filtro-historico=\"alteracao\">Alterações</button>
          </div>
          <div class=\"filtrosHistoricoSecundarios\">
            <label>Período
              <select id=\"filtroPeriodoHistorico\" aria-label=\"Filtrar histórico por período\">
                <option value=\"todos\">Todo o período carregado</option>
                <option value=\"7\">Últimos 7 dias</option>
                <option value=\"30\">Últimos 30 dias</option>
                <option value=\"90\">Últimos 90 dias</option>
                <option value=\"365\">Último ano</option>
              </select>
            </label>
            <label>Ordem
              <select id=\"ordemHistoricoGeral\" aria-label=\"Ordenar histórico\">
                <option value=\"desc\">Mais recentes primeiro</option>
                <option value=\"asc\">Mais antigos primeiro</option>
              </select>
            </label>
          </div>
          <input id=\"buscaHistoricoGeral\" type=\"search\" autocomplete=\"off\" placeholder=\"Buscar nos registros carregados\" aria-label=\"Buscar no histórico carregado\">
          <p id=\"resumoHistoricoGeral\" class=\"textoSecundario\">O histórico é preservado e carregado em páginas somente quando necessário.</p>
        </div>
        <div id=\"listaHistoricoGeral\"></div>
      `);
      painel.classList.add(\"aberto\");
      painel.setAttribute(\"aria-hidden\", \"false\");
      document.body.classList.add(\"painelAberto\");
      renderizarHistoricoGeral();
      sincronizarControlesHistoricoGeral();
      if (!historicoGeralInicializado && !historicoGeralCarregando) {
        agendarTarefaSegundoPlano(() => carregarPaginaHistoricoGeral({ reiniciar: true }).catch(erro => {
          logger.warn(\"Falha ao carregar a primeira página do histórico.\", erro);
          mostrarMensagem(\"Não foi possível carregar o histórico agora. Tente novamente.\", \"erro\");
        }));
      }
    };

    window.verMaisHistoricoGeral""",
    "abertura do histórico geral sob demanda"
)

js = sub_once(
    js,
    r"    window\.verMaisHistoricoGeral = function\(event\) \{.*?\n    \};",
    """    window.verMaisHistoricoGeral = async function(event) {
      const scroller = document.getElementById(\"conteudoDashboard\");
      const posicaoAnterior = scroller ? scroller.scrollTop : 0;
      limiteHistoricoGeralAtual += Math.max(1, Number(preferenciasSistema.limiteRelatorios) || 100);
      if (proximaPaginaHistoricoGeral) {
        try {
          await carregarPaginaHistoricoGeral();
        } catch (erro) {
          logger.warn(\"Falha ao carregar mais registros do histórico.\", erro);
          mostrarMensagem(\"Não foi possível carregar mais registros agora.\", \"erro\");
        }
      }
      renderizarHistoricoGeral();
      if (scroller) scroller.scrollTop = posicaoAnterior;
      event?.currentTarget?.blur?.();
    };""",
    "botão de paginação do histórico"
)

js = sub_once(
    js,
    r"    function montarResumoFiltroHistoricoGeral\(totalFiltrado, totalGeral, totalAposData\) \{.*?\n    \}",
    """    function montarResumoFiltroHistoricoGeral(totalFiltrado, totalCarregado, totalAposData) {
      const periodo = periodoHistoricoGeral === \"todos\" ? 0 : Number(periodoHistoricoGeral || 0);
      const nomeFiltro = filtroHistoricoGeral === \"todos\" ? \"todas as ações\" : filtroHistoricoGeral;
      const termo = String(termoBuscaHistoricoGeral || \"\").trim();
      let resumo = periodo > 0
        ? `${totalAposData} registro(s) do período selecionado entre ${totalCarregado} carregado(s).`
        : `${totalCarregado} registro(s) carregado(s) nesta sessão.`;
      if (filtroHistoricoGeral !== \"todos\") resumo += ` Filtro: ${nomeFiltro}.`;
      if (termo) resumo += ` Busca: ${totalFiltrado} resultado(s) nos registros carregados.`;
      if (proximaPaginaHistoricoGeral) resumo += \" Há mais registros no SharePoint; use Carregar mais registros para continuar a consulta.\";
      else if (historicoGeralInicializado) resumo += \" Todos os registros disponíveis nesta navegação já foram carregados.\";
      return resumo;
    }""",
    "resumo do histórico carregado"
)

js = sub_once(
    js,
    r"    function renderizarHistoricoGeral\(\) \{.*?\n    \}\n\n    function sincronizarControlesHistoricoGeral",
    """    function renderizarHistoricoGeral() {
      const caixa = document.getElementById(\"listaHistoricoGeral\");
      const resumo = document.getElementById(\"resumoHistoricoGeral\");
      if (!caixa) return;

      if (!historicoGeralInicializado && historicoGeralCarregando && !historicoCarregado.length) {
        caixa.innerHTML = '<p class=\"textoSecundario\">Carregando a primeira página do histórico...</p>';
        if (resumo) resumo.textContent = \"O histórico não é carregado na abertura do site; esta consulta começou somente agora.\";
        return;
      }

      const totalCarregado = historicoCarregado.length;
      const inicio = obterDataInicialHistoricoGeral();
      const historicoPeriodo = obterHistoricoOrdenado(ordemHistoricoGeral).filter(item => {
        if (!inicio) return true;
        const data = obterDataHistorico(item);
        return data && data >= inicio;
      });
      const filtrados = historicoPeriodo.filter(item => historicoCorrespondeFiltro(item) && historicoCorrespondeBusca(item));
      const limite = Math.max(1, Number(limiteHistoricoGeralAtual) || Number(preferenciasSistema.limiteRelatorios) || 100);
      const exibidos = filtrados.slice(0, limite);
      const temMaisNoCache = filtrados.length > exibidos.length;
      const temMaisSharePoint = Boolean(proximaPaginaHistoricoGeral);

      if (resumo) resumo.textContent = montarResumoFiltroHistoricoGeral(filtrados.length, totalCarregado, historicoPeriodo.length);

      if (!exibidos.length) {
        const botaoContinuar = temMaisSharePoint
          ? `<div class=\"acoesHistoricoGeral\"><button type=\"button\" id=\"btnVerMaisHistoricoGeral\" class=\"botaoSecundario\"${historicoGeralCarregando ? \" disabled\" : \"\"}>${historicoGeralCarregando ? \"Carregando...\" : \"Carregar mais registros\"}</button></div>`
          : \"\";
        caixa.innerHTML = htmlInternoConfiavel(`<p class=\"textoSecundario\">Nenhum registro carregado corresponde aos filtros atuais.</p>${botaoContinuar}`);
        ligarCliquePorId(\"btnVerMaisHistoricoGeral\", window.verMaisHistoricoGeral);
        return;
      }

      const linhas = exibidos.map(montarHistoricoFormatado).filter(Boolean);
      const botaoMais = temMaisNoCache || temMaisSharePoint
        ? `<div class=\"acoesHistoricoGeral\"><button type=\"button\" id=\"btnVerMaisHistoricoGeral\" class=\"botaoSecundario\"${historicoGeralCarregando ? \" disabled\" : \"\"}>${historicoGeralCarregando ? \"Carregando...\" : temMaisSharePoint ? \"Carregar mais registros\" : \"Ver mais registros carregados\"}</button></div>`
        : \"\";
      caixa.innerHTML = htmlInternoConfiavel(`${linhas.join(\"\")}${botaoMais}`);
      ligarCliquePorId(\"btnVerMaisHistoricoGeral\", window.verMaisHistoricoGeral);
    }

    function sincronizarControlesHistoricoGeral""",
    "renderização paginada do histórico geral"
)

js = sub_once(
    js,
    r"    function historicoEquivalenteJaRegistrado\(documento, acao, observacao\) \{.*?\n    \}",
    """    async function historicoEquivalenteJaRegistrado(documento, acao, observacao, tokenInformado = \"\") {
      const arquivoId = obterIdArquivoDocumento(documento);
      const acaoNormalizada = normalizarTexto(acao || \"\");
      const observacaoNormalizada = normalizarTexto(observacao || \"\");
      const existeEquivalente = lista => lista.some(item =>
        String(item.ARQUIVO_ID || \"\") === arquivoId &&
        normalizarTexto(item.ACAO || \"\") === acaoNormalizada &&
        normalizarTexto(item.OBSERVACAO || \"\") === observacaoNormalizada
      );

      if (existeEquivalente(historicoCarregado)) return true;
      if (!arquivoId) return false;

      try {
        const token = tokenInformado || await obterToken();
        const itens = await carregarHistoricoPorArquivoId(arquivoId, token);
        mesclarHistoricoNoCache(itens);
        return existeEquivalente(itens);
      } catch (erro) {
        logger.warn(\"Falha ao conferir histórico equivalente diretamente no SharePoint.\", erro);
        return false;
      }
    }""",
    "conferência sob demanda de histórico equivalente"
)

js = replace_once(
    js,
    '      if (contexto.observacaoEnvio && !historicoEquivalenteJaRegistrado(documento, "ENVIOU", contexto.observacaoEnvio)) {',
    '      if (contexto.observacaoEnvio && !(await historicoEquivalenteJaRegistrado(documento, "ENVIOU", contexto.observacaoEnvio, token))) {',
    "uso assíncrono da conferência de histórico"
)

js = sub_once(
    js,
    r"      const arquivoId = obterIdArquivoDocumento\(documento\);\n      if \(arquivoId\) \{.*?\n    \}\n    async function carregarAnotacaoDocumento",
    """      const arquivoId = obterIdArquivoDocumento(documento);
      if (!arquivoId) {
        caixa.innerHTML = '<p class=\"textoErro\">Não foi possível identificar este documento para consultar o histórico.</p>';
        return;
      }

      try {
        const token = await obterToken();
        const [historicoDocumento, anotacaoDireta] = await Promise.all([
          carregarHistoricoPorArquivoId(arquivoId, token),
          carregarAnotacaoPorArquivoId(arquivoId, token)
        ]);
        if (!painelAindaMostraDocumento(documento, tokenPainel)) return;
        mesclarHistoricoNoCache(historicoDocumento);
        if (anotacaoDireta) mesclarAnotacaoNoCache(anotacaoDireta);
        renderizarHistoricoDoCache();
      } catch (erroConsultaDireta) {
        logger.warn(\"Consulta direta do histórico do documento falhou.\", erroConsultaDireta);
        if (painelAindaMostraDocumento(documento, tokenPainel)) {
          caixa.innerHTML = '<p class=\"textoErro\">Não foi possível carregar o histórico deste documento agora.</p>';
        }
      }
    }
    async function carregarAnotacaoDocumento""",
    "histórico do documento sem fallback global"
)

js = replace_once(
    js,
    "          carregarDadosDeApoio(token).catch(erro => logger.warn(\"Falha nos dados de apoio.\", erro));\n          await listarDocumentos();\n          agendarTarefaSegundoPlano(() => carregarDadosDeApoio());\n          agendarTarefaSegundoPlano(() => carregarOpcoesGaveta());",
    "          await listarDocumentos();\n          agendarTarefaSegundoPlano(() => carregarDadosDeApoio(token));\n          agendarTarefaSegundoPlano(() => carregarOpcoesGaveta());",
    "inicialização sem histórico global"
)

js = js.replace("<strong>Histórico por usuário</strong>", "<strong>Histórico carregado por usuário</strong>")

if "historicoApoioCarregado" in js:
    raise RuntimeError("Ainda existe referência a historicoApoioCarregado")
if "montarDocumentosRecentesComHistorico" in js:
    raise RuntimeError("Função antiga de Recentes ainda existe")

JS_PATH.write_text(js, encoding="utf-8")

readme = README_PATH.read_text(encoding="utf-8")
readme = sub_once(
    readme,
    r"O crescimento do historico operacional e tratado por rotina segura de retencao.*?USO-RETENCAO-HISTORICO-ARQUIVO-DIGITAL-V1\.md`\.",
    "`HISTORICO_ACESSOS` e preservado integralmente. Nao existe exclusao, arquivamento por idade nem rotina de retencao automatica. O navegador consulta somente o necessario: a guia Recentes usa a data de modificacao dos documentos, o historico de um documento e consultado diretamente por `ARQUIVO_ID` quando o painel e aberto, e a Central de historico carrega uma pagina por vez, buscando paginas adicionais apenas quando o usuario pedir. O historico completo nunca deve ser baixado na inicializacao do aplicativo.",
    "política do histórico no README"
)
README_PATH.write_text(readme, encoding="utf-8")

agents = AGENTS_PATH.read_text(encoding="utf-8")
for linha in [
    "scripts/retencao-historico-arquivo-digital-v1.ps1\n",
    "scripts/consultar-historico-frio-arquivo-digital-v1.ps1\n",
    "scripts/USO-RETENCAO-HISTORICO-ARQUIVO-DIGITAL-V1.md\n",
]:
    agents = agents.replace(linha, "")
agents = agents.replace(
    "Busca em Recentes com termo deve usar todos os recentes do histórico, sem cortar pelo limite visual.\nRecentes sem busca deve respeitar limite de recentes.\nRecentes deve liberar a tela assim que o histórico carregar; anotações não devem bloquear essa guia.",
    "Busca em Recentes deve usar a data de modificação dos documentos e não depender de `HISTORICO_ACESSOS`.\nRecentes sem busca deve respeitar limite de recentes.\nO histórico global não deve ser carregado na inicialização; a Central de histórico carrega uma página por vez e busca páginas adicionais apenas por ação explícita do usuário.\nO histórico de um documento deve ser consultado diretamente por `ARQUIVO_ID` somente quando o painel desse documento for aberto."
)
agents = sub_once(
    agents,
    r"## 8\. Retenção do histórico.*?(?=\n---\n\n## 9\.)",
    """## 8. Histórico preservado e carregamento sob demanda

Política permanente:

```text
HISTORICO_ACESSOS é preservado integralmente.
Não excluir nem arquivar registros por idade.
Não manter rotina automática de retenção ou expurgo.
Não carregar a lista inteira ao iniciar o aplicativo.
Recentes usa a data de modificação dos documentos, sem depender da carga global do histórico.
Ao abrir um documento, consultar somente o histórico desse ARQUIVO_ID.
A Central de histórico carrega uma página por vez.
Páginas adicionais só são buscadas quando o usuário pedir para carregar mais registros.
Filtros e busca deixam claro que atuam sobre os registros já carregados na sessão.
```

A antiga estratégia de histórico frio, manifesto de retenção e envio programado de registros para a Lixeira foi removida. Se um dia houver necessidade institucional de retenção, ela deve ser redesenhada como uma decisão explícita e separada, nunca reintroduzida como exclusão automática silenciosa.
""",
    "seção de política do histórico em AGENTS"
)
AGENTS_PATH.write_text(agents, encoding="utf-8")

validador = VALIDADOR_PATH.read_text(encoding="utf-8")
validador = validador.replace(
    '  testesUtils: path.join(raiz, "scripts", "testes-utils-arquivo-digital.mjs"),\n  retencaoHistorico: path.join(raiz, "scripts", "retencao-historico-arquivo-digital-v1.ps1"),\n  consultaHistoricoFrio: path.join(raiz, "scripts", "consultar-historico-frio-arquivo-digital-v1.ps1"),\n  usoRetencaoHistorico: path.join(raiz, "scripts", "USO-RETENCAO-HISTORICO-ARQUIVO-DIGITAL-V1.md")',
    '  testesUtils: path.join(raiz, "scripts", "testes-utils-arquivo-digital.mjs")'
)
validador = sub_once(
    validador,
    r"const scriptRetencaoHistoricoExiste = existsSync\(arquivos\.retencaoHistorico\);.*?conferir\(consultaHistoricoFrioSegura, \"Script de consulta do historico frio sem travas de leitura esperadas\.\"\);",
    """const arquivosRetencaoAntiga = [
  path.join(raiz, \"scripts\", \"retencao-historico-arquivo-digital-v1.ps1\"),
  path.join(raiz, \"scripts\", \"consultar-historico-frio-arquivo-digital-v1.ps1\"),
  path.join(raiz, \"scripts\", \"USO-RETENCAO-HISTORICO-ARQUIVO-DIGITAL-V1.md\")
];
const arquivosRetencaoAntigaPresentes = arquivosRetencaoAntiga.filter(existsSync);
const historicoSobDemanda =
  /const TAMANHO_PAGINA_HISTORICO_GERAL\\s*=\\s*100/.test(js) &&
  /async function carregarPaginaHistoricoGeral\\b/.test(js) &&
  /@odata\\.nextLink/.test(js) &&
  /window\\.verMaisHistoricoGeral\\s*=\\s*async function/.test(js) &&
  /async function carregarHistoricoPorArquivoId\\b/.test(js) &&
  !/historicoApoioCarregado/.test(js);
conferir(arquivosRetencaoAntigaPresentes.length === 0, `Arquivos da antiga retencao ainda presentes: ${arquivosRetencaoAntigaPresentes.map(caminho => path.relative(raiz, caminho)).join(\", \")}`);
conferir(historicoSobDemanda, \"Historico deve permanecer preservado e usar carregamento paginado/sob demanda.\");""",
    "validação da nova política do histórico"
)
validador = sub_once(
    validador,
    r"console\.log\(`- Diagnostico retencao historico:.*?\);",
    'console.log("- Historico: preservado, sem rotina de retencao, com paginacao sob demanda diagnosticada.");',
    "log do validador"
)
VALIDADOR_PATH.write_text(validador, encoding="utf-8")

testes = TESTES_PATH.read_text(encoding="utf-8")
testes = sub_once(
    testes,
    r"testar\(\"Recentes usa o historico em carga, acoes e busca\", \(\) => \{.*?\n\}\);\n\ntestar\(\"Duplicidades usam estrategia indexada e cache estavel\"",
    """testar(\"Historico preservado carrega sob demanda e Recentes independe da lista completa\", () => {
  const aplicar = blocoFuncao(\"aplicarListaAtual\");
  const filtrar = blocoFuncao(\"filtrarDocumentos\");
  const montarRecentes = blocoFuncao(\"montarDocumentosRecentes\");
  const atualizar = blocoFuncao(\"atualizarTela\");
  const carregarApoio = blocoFuncao(\"carregarDadosDeApoio\");
  const carregarPagina = blocoFuncao(\"carregarPaginaHistoricoGeral\");
  const abrirHistorico = blocoFuncao(\"abrirHistoricoGeral\");
  const verMais = blocoFuncao(\"verMaisHistoricoGeral\");
  const historicoDocumento = blocoFuncao(\"carregarHistoricoDocumento\");

  assert.match(aplicar, /modoListaAtual === \"recentes\"\\s*\\?\\s*montarDocumentosRecentes\\(\\{\\s*limitado:\\s*!termoBuscaAtual\\s*\\}\\)/, \"Recentes deve usar a lista baseada em modificacao.\");
  assert.match(filtrar, /modoListaAtual === \"recentes\"\\s*\\?\\s*montarDocumentosRecentes\\(\\{\\s*limitado:\\s*!termo\\s*\\}\\)/, \"Filtro de Recentes deve usar a lista baseada em modificacao.\");
  assert.doesNotMatch(filtrar, /historicoApoioCarregado/, \"Recentes nao deve aguardar carga global do historico.\");
  assert.match(montarRecentes, /\\[\.\.\.documentosAtivos, \.\.\.documentosLixeira\\]/, \"Recentes deve partir dos documentos conhecidos.\");
  assert.match(montarRecentes, /ordenarPorModificacao/, \"Recentes deve ordenar pela modificacao dos documentos.\");
  assert.doesNotMatch(montarRecentes, /obterHistoricoOrdenado|historicoCarregado/, \"Recentes nao deve depender do historico.\");

  assert.doesNotMatch(carregarApoio, /historicoAcessosListId/, \"Dados de apoio nao devem baixar o historico global.\");
  assert.doesNotMatch(atualizar, /carregarPaginaHistoricoGeral/, \"Inicializacao nao deve abrir a carga do historico geral.\");
  assert.match(abrirHistorico, /carregarPaginaHistoricoGeral\\(\\{ reiniciar: true \\}\\)/, \"Central deve iniciar a consulta somente quando for aberta.\");
  assert.match(carregarPagina, /TAMANHO_PAGINA_HISTORICO_GERAL/, \"Consulta geral deve ter pagina limitada.\");
  assert.match(carregarPagina, /@odata\\.nextLink/, \"Consulta geral deve guardar a proxima pagina do Graph.\");
  assert.doesNotMatch(carregarPagina, /buscarTodosItens/, \"Consulta geral nao deve percorrer todas as paginas automaticamente.\");
  assert.match(verMais, /carregarPaginaHistoricoGeral\\(\\)/, \"Mais registros devem ser carregados somente por acao do usuario.\");

  assert.match(historicoDocumento, /carregarHistoricoPorArquivoId\\(arquivoId, token\\)/, \"Painel deve consultar somente o historico do documento aberto.\");
  assert.doesNotMatch(historicoDocumento, /carregarDadosDeApoio/, \"Falha da consulta direta nao deve disparar carga global como fallback.\");
  assert.doesNotMatch(js, /historicoApoioCarregado/, \"Estado antigo de carga global deve ter sido removido.\");
  assert.doesNotMatch(js, /retencao-historico|historico-frio/i, \"Codigo de producao nao deve referenciar a politica de retencao removida.\");
});

testar(\"Duplicidades usam estrategia indexada e cache estavel\"""",
    "teste de regressão da nova política"
)
TESTES_PATH.write_text(testes, encoding="utf-8")

for relativo in [
    "scripts/retencao-historico-arquivo-digital-v1.ps1",
    "scripts/consultar-historico-frio-arquivo-digital-v1.ps1",
    "scripts/USO-RETENCAO-HISTORICO-ARQUIVO-DIGITAL-V1.md",
]:
    caminho = RAIZ / relativo
    if caminho.exists():
        caminho.unlink()

print("Migração para histórico preservado e carregamento sob demanda aplicada.")
