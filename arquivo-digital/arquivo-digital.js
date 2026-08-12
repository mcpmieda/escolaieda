    import { PublicClientApplication } from "https://esm.sh/@azure/msal-browser@5.11.0";
    import {
      escaparHtml,
      limparNomeArquivoPdf,
      nomeArquivoSemExtensaoVisual,
      nomeArquivoVisualLimpo,
      sanitizarNomeArquivo
    } from "./arquivo-digital-utils.js";
    import {
      filtroCampoIgual,
      filtroCamposIguais,
      montarUrlItensLista
    } from "./arquivo-digital-graph-client.js";

    const CONFIG = {
      clientId: "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",
      tenantId: "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",
      redirectUri: "https://escolaieda.com/arquivo-digital/",
      siteId: "eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17",
      documentosAtivosListId: "7adea611-e627-4593-a0b0-cecf58744c16",
      historicoAcessosListId: "144b31da-83f8-4ba4-b573-61fd8e5ac09f",
      anotacoesArquivosListId: "2698ef54-73e9-4ea1-995a-5d552349f57e",
      documentosAtivosRootPath: "/sites/ARQUIVODIGITAL/DOCUMENTOS_ATIVOS"
    };

    let documentosAtivos = [];
    let documentosLixeira = [];
    let documentosCarregados = [];
    let modoListaAtual = "recentes";
    let historicoCarregado = [];
    let anotacoesCarregadas = [];
    let versaoHistoricoCache = 0;
    let versaoAnotacoesCache = 0;
    let versaoDocumentosCache = 0;
    let documentoSelecionado = null;
    let anotacaoAtualItemId = null;
    let anotacaoAtualEtag = "";
    let timerSalvarAnotacao = null;
    let timerMensagemPainel = null;
    let timerBuscaDocumentos = null;
    let anotacaoUltimoTextoSalvo = "";
    let arquivoLocalMesclar = null;
    let mesclagemEmAndamento = false;
    let painelDocumentoTokenAtual = 0;
    let pdfLibPromise = null;
    let dadosApoioCarregando = false;
    let dadosApoioCarregados = false;
    let historicoGeralCarregando = false;
    let historicoGeralInicializado = false;
    let proximaPaginaHistoricoGeral = "";
    let duplicidadesCarregando = false;
    let tokenAnaliseCentralDuplicidades = 0;
    let versoesSharePointCarregadas = [];
    let versoesSharePointExpandido = false;
    let opcoesGavetaSharePoint = [];
    let opcoesGavetaCarregadas = false;
    let erroOpcoesGavetaSharePoint = "";
    let acessoArquivoDigitalPermitido = false;
    let limiteHistoricoGeralAtual = 0;
    let filtroGavetaAtual = "";
    let filtrosAvancados = filtrosAvancadosPadrao();
    let preferenciasSistema = carregarPreferenciasSistema();
    let camadaHistoricoMobileAtiva = false;
    let eventosFixosInicializados = false;
    const focoAnteriorPorCamada = new Map();
    const operacoesCriticasEmAndamento = new Set();
    const LIMITE_CACHE_NORMALIZAR_TEXTO = 3000;
    const TEMPO_LIMITE_GRAPH_MS = 30000;
    const LIMITE_MESCLAGEM_LOCAL_BYTES = 50 * 1024 * 1024;
    const TAMANHO_PAGINA_HISTORICO_GERAL = 100;
    const cacheNormalizarTexto = new Map();
    let cacheMapaNomesVisuaisRepetidos = { assinatura: "", mapa: new Map() };
    let cacheMapaNomesVisuaisTodosDocumentos = { versao: -1, mapa: new Map() };
    let cacheDocumentosPorArquivoId = { versao: -1, mapa: new Map() };
    let cacheHistoricoPorArquivoId = { versao: -1, mapa: new Map() };
    let cacheAnotacaoPorArquivoId = { versao: -1, mapa: new Map() };
    let cacheHistoricoOrdenado = { versao: -1, direcao: "", itens: [] };
    let cacheUltimasMovimentacoes = { versao: -1, limite: 0, mapa: new Map() };
    let cacheDocumentosRecentes = { versaoDocumentos: -1, limitado: false, limite: 0, ordem: "desc", itens: [] };

    const msalConfig = {
      auth: {
        clientId: CONFIG.clientId,
        authority: `https://login.microsoftonline.com/${CONFIG.tenantId}`,
        redirectUri: CONFIG.redirectUri
      },
      cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false
      }
    };

    const msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();

    const loginRequest = {
      scopes: ["User.Read", "Sites.ReadWrite.All"]
    };

    const MODO_DIAGNOSTICO = false;
    const logger = {
      info(...args) {
        if (MODO_DIAGNOSTICO) console.info(...args);
      },
      warn(...args) {
        if (MODO_DIAGNOSTICO) {
          console.warn(...args);
          return;
        }
        console.warn(formatarResumoLog(args[0]));
      },
      error(...args) {
        if (MODO_DIAGNOSTICO) {
          console.error(...args);
          return;
        }
        console.error(formatarResumoLog(args[0]));
      }
    };

    function formatarResumoLog(valor) {
      if (typeof valor === "string") return valor;
      if (valor instanceof Error) return valor.message || valor.name || "Erro interno.";
      return "Evento interno registrado.";
    }

    function agoraPerformance() {
      return window.performance?.now ? window.performance.now() : Date.now();
    }

    function medirTempoPerformance(nome, funcao) {
      const inicio = agoraPerformance();
      const resultado = funcao();
      const duracao = agoraPerformance() - inicio;
      if (MODO_DIAGNOSTICO) logger.info(`[performance] ${nome}: ${duracao.toFixed(1)}ms`);
      return resultado;
    }

    async function medirTempoPerformanceAsync(nome, funcao) {
      const inicio = agoraPerformance();
      const resultado = await funcao();
      const duracao = agoraPerformance() - inicio;
      if (MODO_DIAGNOSTICO) logger.info(`[performance] ${nome}: ${duracao.toFixed(1)}ms`);
      return resultado;
    }

    function normalizarTexto(texto) {
      const chave = (texto || "").toString();

      if (cacheNormalizarTexto.has(chave)) {
        return cacheNormalizarTexto.get(chave);
      }

      const normalizado = chave
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

      if (cacheNormalizarTexto.size >= LIMITE_CACHE_NORMALIZAR_TEXTO) {
        cacheNormalizarTexto.delete(cacheNormalizarTexto.keys().next().value);
      }

      cacheNormalizarTexto.set(chave, normalizado);
      return normalizado;
    }

    function ordenarLixeiraMaisRecentes(lista) {
      const copia = [...(lista || [])];

      return copia.sort((a, b) => {
        const textoA = normalizarTexto(`${a.status || ""} ${a.caminho || ""}`);
        const textoB = normalizarTexto(`${b.status || ""} ${b.caminho || ""}`);

        const aArquivado = textoA.includes("arquiv");
        const bArquivado = textoB.includes("arquiv");

        if (aArquivado && bArquivado) {
          const dataA = new Date(a.modificado || a.dataModificacao || 0).getTime() || 0;
          const dataB = new Date(b.modificado || b.dataModificacao || 0).getTime() || 0;

          if (dataA !== dataB) {
            return dataB - dataA;
          }

          return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
        }

        return 0;
      });
    }

    function ordenarPorModificacaoMaisRecente(lista) {
      return [...(lista || [])].sort((a, b) => {
        const dataA = new Date(a.dataRecente || a.modificado || a.dataModificacao || 0).getTime() || 0;
        const dataB = new Date(b.dataRecente || b.modificado || b.dataModificacao || 0).getTime() || 0;

        if (dataA !== dataB) {
          return dataB - dataA;
        }

        return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
      });
    }

    function ordenarPorModificacao(lista, direcao = "desc") {
      const ordenada = ordenarPorModificacaoMaisRecente(lista);
      return direcao === "asc" ? ordenada.reverse() : ordenada;
    }

    function atualizarIndiceBuscaDocumento(doc) {
      if (!doc) return doc;

      const nome = (doc.nome || "").toString();
      if (doc.nomeBuscaOrigem !== nome) {
        doc.nomeBuscaOrigem = nome;
        doc.nomeBusca = normalizarTexto(nome);
      }

      return doc;
    }

    function preferenciasPadraoSistema() {
      return {
        limiteRecentes: 20,
        ordemRecentes: "desc",
        ordemLixeira: "desc",
        guiaInicial: "recentes",
        modoVisual: "confortavel",
        detalhesCards: "mais",
        analiseDuplicidadesAuto: "sim",
        limiteRelatorios: 30
      };
    }

    function carregarPreferenciasSistema() {
      const padrao = preferenciasPadraoSistema();
      try {
        const salvo = JSON.parse(localStorage.getItem("arquivoDigitalPreferencias") || "{}");
        return { ...padrao, ...salvo };
      } catch {
        return padrao;
      }
    }

    function salvarPreferenciasSistema() {
      localStorage.setItem("arquivoDigitalPreferencias", JSON.stringify(preferenciasSistema));
    }

    function aplicarPreferenciasVisuais() {
      document.body.classList.toggle("modoCompacto", preferenciasSistema.modoVisual === "compacto");
      document.body.classList.toggle("detalhesReduzidos", preferenciasSistema.detalhesCards === "menos");
    }

    function gavetaOuPadrao(valor) {
      const gaveta = (valor || "").toString().trim();
      return gaveta || "Gaveta nao informada";
    }

    function normalizarNomeGaveta(valor) {
      return (valor || "").toString().replace(/\s+/g, " ").trim();
    }

    function chaveComparacaoGaveta(valor) {
      return normalizarTexto(valor).replace(/\s+/g, "");
    }

    function normalizarNomeGavetaAdministrativa(valor) {
      let nome = normalizarNomeGaveta(valor);

      if (!nome) {
        throw new Error("Digite o nome da gaveta.");
      }

      if (nome.length > 40) {
        throw new Error("Use um nome de gaveta com ate 40 caracteres.");
      }

      if (/[\\/:*?"<>|{}[\]`$;]/.test(nome)) {
        throw new Error("O nome da gaveta tem caracteres que nao podem ser usados.");
      }

      const gavetaNumerada = nome.match(/^gaveta\s*(\d+)$/i);
      if (gavetaNumerada) {
        return `Gaveta ${Number(gavetaNumerada[1])}`;
      }

      nome = nome.replace(/^gaveta\b/i, "Gaveta");
      return nome;
    }

    function gavetaJaExiste(nome, ignorarNome = "") {
      const chaveNova = chaveComparacaoGaveta(nome);
      const chaveIgnorar = chaveComparacaoGaveta(ignorarNome);
      return obterOpcoesGavetas().some(gaveta => {
        const chaveAtual = chaveComparacaoGaveta(gaveta);
        return chaveAtual === chaveNova && chaveAtual !== chaveIgnorar;
      });
    }

    function documentosDaGaveta(nome) {
      const chave = chaveComparacaoGaveta(nome);
      return [...documentosAtivos, ...documentosLixeira].filter(doc => chaveComparacaoGaveta(doc.gaveta) === chave);
    }

    function chaveGaveta(valor) {
      return (valor || "").toString().trim() || "Gaveta nao informada";
    }

    function filtrosAvancadosPadrao() {
      return {
        semGaveta: false,
        comAnotacao: false,
        comDuplicidade: false,
        enviadosRecentemente: false,
        alteradosRecentemente: false
      };
    }

    function limparFiltrosAvancadosOcultos() {
      filtrosAvancados = filtrosAvancadosPadrao();
      document.getElementById("filtrosAvancados")?.classList.remove("aberto");
    }

    function opcoesGavetasPadrao() {
      const opcoes = [];
      for (let numero = 1; numero <= 34; numero++) {
        opcoes.push(`Gaveta ${numero}`);
      }
      return opcoes;
    }

    function obterOpcoesGavetas() {
      const mapa = new Map();
      const usandoSharePoint = opcoesGavetaCarregadas;
      const fontePrincipal = usandoSharePoint ? opcoesGavetaSharePoint : opcoesGavetasPadrao();

      fontePrincipal.forEach(gaveta => {
        const valor = normalizarNomeGavetaAdministrativa(gaveta);
        if (valor) mapa.set(normalizarTexto(valor), valor);
      });

      if (!usandoSharePoint) {
        [...documentosAtivos, ...documentosLixeira].forEach(doc => {
          const valor = normalizarNomeGaveta(doc.gaveta);
          if (valor) mapa.set(normalizarTexto(valor), valor);
        });
      }

      return [...mapa.values()].sort((a, b) => {
        const aNao = a === "Gaveta nao informada";
        const bNao = b === "Gaveta nao informada";
        if (aNao) return -1;
        if (bNao) return 1;
        return a.localeCompare(b, "pt-BR", { numeric: true });
      });
    }

    function gavetasSharePointDisponiveis() {
      return opcoesGavetaCarregadas;
    }

    function ehViewportMobileParaHistorico() {
      return window.matchMedia?.("(max-width: 900px)")?.matches || window.innerWidth <= 900;
    }

    function existeCamadaAberta() {
      return Boolean(
        document.getElementById("painelLateral")?.classList.contains("aberto") ||
        document.getElementById("painelCentralDuplicidades")?.classList.contains("aberto") ||
        document.getElementById("painelDashboard")?.classList.contains("aberto") ||
        document.getElementById("centralConfiguracoes")?.classList.contains("aberta") ||
        document.getElementById("centralUpload")?.classList.contains("aberta")
      );
    }

    function elementoFocavelVisivel(elemento) {
      if (!elemento || typeof elemento.focus !== "function") return false;
      if (elemento.disabled || elemento.getAttribute("aria-hidden") === "true") return false;
      return Boolean(elemento.offsetParent || elemento.getClientRects().length);
    }

    function guardarFocoAnteriorCamada(idCamada) {
      const elementoAtivo = document.activeElement;
      if (elementoFocavelVisivel(elementoAtivo)) {
        focoAnteriorPorCamada.set(idCamada, elementoAtivo);
      }
    }

    function restaurarFocoAnteriorCamada(idCamada) {
      const elemento = focoAnteriorPorCamada.get(idCamada);
      focoAnteriorPorCamada.delete(idCamada);

      if (elementoFocavelVisivel(elemento) && document.contains(elemento)) {
        elemento.focus({ preventScroll: true });
      }
    }

    function focarElementoInicialCamada(idCamada, seletorPreferencial = "[tabindex='-1']") {
      const camada = document.getElementById(idCamada);
      if (!camada) return;

      const focoPreferencial = camada.querySelector(seletorPreferencial);
      const focoFallback = camada.querySelector("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])");
      const alvo = elementoFocavelVisivel(focoPreferencial) ? focoPreferencial : focoFallback;

      if (alvo) {
        setTimeout(() => alvo.focus({ preventScroll: true }), 0);
      }
    }

    function marcarCamadaAbertaAcessivel(idCamada, seletorFoco) {
      const camada = document.getElementById(idCamada);
      if (!camada) return;

      if (camada.getAttribute("aria-hidden") !== "false") {
        guardarFocoAnteriorCamada(idCamada);
      }
      camada.setAttribute("aria-hidden", "false");
      focarElementoInicialCamada(idCamada, seletorFoco);
    }

    function marcarCamadaFechadaAcessivel(idCamada, restaurarFoco = true) {
      if (restaurarFoco) {
        restaurarFocoAnteriorCamada(idCamada);
      }

      const camada = document.getElementById(idCamada);
      if (camada) {
        camada.setAttribute("aria-hidden", "true");
      }
    }

    function registrarCamadaHistoricoMobile() {
      if (!ehViewportMobileParaHistorico() || camadaHistoricoMobileAtiva || !existeCamadaAberta()) {
        return;
      }

      history.pushState({ arquivoDigitalCamada: true }, "", window.location.href);
      camadaHistoricoMobileAtiva = true;
    }

    function chaveNomeArquivoVisualLimpo(nome) {
      return normalizarTexto(nomeArquivoVisualLimpo(nome)).replace(/\s+/g, " ").trim();
    }

    function criarMapaNomesVisuaisRepetidos(lista) {
      const contagem = new Map();

      (lista || []).forEach(doc => {
        const chave = chaveNomeArquivoVisualLimpo(doc?.nome || "");
        if (!chave) return;
        contagem.set(chave, (contagem.get(chave) || 0) + 1);
      });

      return contagem;
    }

    function obterMapaNomesVisuaisRepetidosCacheado(lista) {
      const assinatura = (lista || [])
        .map(doc => `${doc?.id || ""}:${doc?.nome || ""}:${doc?.status || ""}`)
        .sort()
        .join("|");

      if (cacheMapaNomesVisuaisRepetidos.assinatura === assinatura) {
        return cacheMapaNomesVisuaisRepetidos.mapa;
      }

      const mapa = criarMapaNomesVisuaisRepetidos(lista);
      cacheMapaNomesVisuaisRepetidos = { assinatura, mapa };
      return mapa;
    }

    function obterMapaNomesVisuaisTodosDocumentos() {
      if (cacheMapaNomesVisuaisTodosDocumentos.versao === versaoDocumentosCache) {
        return cacheMapaNomesVisuaisTodosDocumentos.mapa;
      }

      const mapa = criarMapaNomesVisuaisRepetidos([...documentosAtivos, ...documentosLixeira]);
      cacheMapaNomesVisuaisTodosDocumentos = { versao: versaoDocumentosCache, mapa };
      return mapa;
    }

    function temNomeVisualRepetido(documento, lista) {
      const chave = chaveNomeArquivoVisualLimpo(documento?.nome || "");
      if (!chave) return false;
      return (criarMapaNomesVisuaisRepetidos(lista).get(chave) || 0) > 1;
    }

    function seloNomeRepetidoHtml(documento, lista) {
      return temNomeVisualRepetido(documento, lista)
        ? "<span class=\"seloNomeRepetido\">Nome igual</span>"
        : "";
    }

    function seloNomeRepetidoHtmlComMapa(documento, mapaNomes) {
      const chave = chaveNomeArquivoVisualLimpo(documento?.nome || "");
      return chave && (mapaNomes.get(chave) || 0) > 1
        ? "<span class=\"seloNomeRepetido\">Nome igual</span>"
        : "";
    }

    function mensagemGavetasSharePointIndisponiveis() {
      return "As gavetas reais do SharePoint não foram carregadas. Edição indisponível.";
    }

    function seloGavetaHtml(valor) {
      return `<span class="seloGaveta">${escaparHtml(gavetaOuPadrao(valor))}</span>`;
    }

    function formatarData(data) {
      if (!data) return "";
      try {
        return new Date(data).toLocaleString("pt-BR");
      } catch {
        return data;
      }
    }

    function limparObservacaoHistorico(texto) {
      let limpo = (texto || "").toString().trim();

      const padroes = [
        /^Arquivo restaurado da pasta _ARQUIVADOS para a lista principal\.\s*Motivo:\s*/i,
        /^Documento na Lixeira na pasta _ARQUIVADOS\.\s*Motivo:\s*/i,
        /^Arquivo substituído por uma nova versão\.\s*Motivo:\s*/i,
        /^Arquivo substituido por uma nova versao\.\s*Motivo:\s*/i
      ];

      padroes.forEach(padrao => {
        limpo = limpo.replace(padrao, "");
      });

      return limpo.trim();
    }
    function obterPalavrasNome(nome) {
      const ignorar = new Set(["pdf", "de", "da", "do", "das", "dos", "e", "a", "o", "conflito", "documento", "teste", "substituir", "substituido", "substituicao", "versao", "copia", "novo", "nova"]);

      return normalizarTexto(nome)
        .replace(/\.pdf$/i, "")
        .split(/[^a-z0-9]+/)
        .filter(palavra => palavra.length >= 3 && !ignorar.has(palavra));
    }

    function calcularDistanciaPalavras(a, b) {
      a = normalizarTexto(a || "");
      b = normalizarTexto(b || "");

      if (a === b) return 0;
      if (!a || !b) return 99;

      const diferencaTamanho = Math.abs(a.length - b.length);
      if (diferencaTamanho > 2) return 99;

      const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

      for (let i = 0; i <= a.length; i++) dp[i][0] = i;
      for (let j = 0; j <= b.length; j++) dp[0][j] = j;

      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const custo = a[i - 1] === b[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + custo
          );
        }
      }

      return dp[a.length][b.length];
    }

    function palavrasSaoParecidas(palavraA, palavraB) {
      if (!palavraA || !palavraB) return false;
      if (palavraA === palavraB) return true;

      if (palavraA.length < 3 || palavraB.length < 3) return false;

      const distancia = calcularDistanciaPalavras(palavraA, palavraB);

      if (palavraA.length <= 4 || palavraB.length <= 4) {
        return distancia <= 1;
      }

      return distancia <= 2;
    }

    function calcularPontuacaoNomes(nomeA, nomeB) {
      const normalA = normalizarTexto(nomeA).replace(/\.pdf$/i, "").trim();
      const normalB = normalizarTexto(nomeB).replace(/\.pdf$/i, "").trim();

      const compactoA = normalA.replace(/[^a-z0-9]+/g, "");
      const compactoB = normalB.replace(/[^a-z0-9]+/g, "");

      if (!compactoA || !compactoB) {
        return 0;
      }

      if (compactoA === compactoB) {
        return 10;
      }

      if (
        (compactoA.includes(compactoB) || compactoB.includes(compactoA)) &&
        Math.abs(compactoA.length - compactoB.length) <= 4
      ) {
        return 4;
      }

      if (calcularDistanciaPalavras(compactoA, compactoB) <= 2) {
        return 4;
      }

      const palavrasA = obterPalavrasNome(nomeA);
      const palavrasB = obterPalavrasNome(nomeB);

      if (!palavrasA.length || !palavrasB.length) {
        return 0;
      }

      if (
        palavrasA.length === palavrasB.length &&
        palavrasA.length >= 2 &&
        [...palavrasA].sort().join("|") === [...palavrasB].sort().join("|")
      ) {
        return 4;
      }

      let pontos = 0;
      const usadasB = new Set();

      palavrasA.forEach(palavraA => {
        const indiceIgual = palavrasB.findIndex((palavraB, indice) =>
          !usadasB.has(indice) && palavraB === palavraA
        );

        if (indiceIgual >= 0) {
          pontos += 1;
          usadasB.add(indiceIgual);
          return;
        }

        const indiceParecido = palavrasB.findIndex((palavraB, indice) =>
          !usadasB.has(indice) && palavrasSaoParecidas(palavraA, palavraB)
        );

        if (indiceParecido >= 0) {
          pontos += 1;
          usadasB.add(indiceParecido);
        }
      });

      if (normalA && normalB && (normalA.includes(normalB) || normalB.includes(normalA))) {
        pontos += 2;
      }

      return pontos;
    }

    function obterPrimeiraPalavraNome(nome) {
      const palavras = obterPalavrasNome(nome);
      return palavras.length ? palavras[0] : "";
    }

    function primeiroNomeIgualOuParecido(nomeA, nomeB) {
      const primeiroA = obterPrimeiraPalavraNome(nomeA);
      const primeiroB = obterPrimeiraPalavraNome(nomeB);

      if (!primeiroA || !primeiroB) return false;
      if (primeiroA === primeiroB) return true;

      if (typeof palavrasSaoParecidas === "function") {
        return palavrasSaoParecidas(primeiroA, primeiroB);
      }

      if (typeof calcularDistanciaPalavras === "function") {
        return calcularDistanciaPalavras(primeiroA, primeiroB) <= 1;
      }

      return false;
    }

    function nomeNormalSemPdf(nome) {
      return normalizarTexto(nome).replace(/\.pdf$/i, "").trim();
    }

    function palavraNomeNaPosicao(nome, posicao) {
      const palavras = obterPalavrasNome(nome);
      return palavras.length > posicao ? palavras[posicao] : "";
    }

    function palavrasIguaisOuParecidas(palavraA, palavraB) {
      if (!palavraA || !palavraB) return false;
      if (palavraA === palavraB) return true;

      if (typeof palavrasSaoParecidas === "function") {
        return palavrasSaoParecidas(palavraA, palavraB);
      }

      if (typeof calcularDistanciaPalavras === "function") {
        return calcularDistanciaPalavras(palavraA, palavraB) <= 1;
      }

      return false;
    }

    function primeiroESegundoNomeParecidos(nomeA, nomeB) {
      const primeiroA = palavraNomeNaPosicao(nomeA, 0);
      const primeiroB = palavraNomeNaPosicao(nomeB, 0);
      const segundoA = palavraNomeNaPosicao(nomeA, 1);
      const segundoB = palavraNomeNaPosicao(nomeB, 1);

      if (!primeiroA || !primeiroB || !segundoA || !segundoB) {
        return false;
      }

      if (primeiroA === primeiroB) {
        return palavrasIguaisOuParecidas(segundoA, segundoB);
      }

      return palavrasIguaisOuParecidas(primeiroA, primeiroB) && segundoA === segundoB;
    }
    function deveExibirNomeParecido(nomeA, nomeB, pontos) {
      const normalA = nomeNormalSemPdf(nomeA);
      const normalB = nomeNormalSemPdf(nomeB);

      if (!normalA || !normalB) return false;

      if (normalA === normalB) return true;

      const compactoA = normalA.replace(/[^a-z0-9]+/g, "");
      const compactoB = normalB.replace(/[^a-z0-9]+/g, "");

      if (compactoA && compactoB && compactoA === compactoB) return true;

      if (
        compactoA &&
        compactoB &&
        (compactoA.includes(compactoB) || compactoB.includes(compactoA)) &&
        Math.abs(compactoA.length - compactoB.length) <= 8
      ) {
        return true;
      }

      if (pontos >= 4) return true;

      if (pontos >= 3 && primeiroESegundoNomeParecidos(nomeA, nomeB)) {
        return true;
      }

      return false;
    }
    function buscarNomesParecidos(documento) {
      if (documento?.status === "ARQUIVADO") {
        return [];
      }

      const todos = [...documentosAtivos]
        .filter(doc => doc && doc.id !== documento.id);

      return todos
        .map(doc => ({
          doc,
          pontos: calcularPontuacaoNomes(documento.nome, doc.nome)
        }))
        .filter(item => deveExibirNomeParecido(documento.nome, item.doc.nome, item.pontos))
        .filter(item => {
          if (typeof chaveIgnorarDuplicidade !== "function" || !paresDuplicidadesIgnorados) {
            return true;
          }

          const chave = chaveIgnorarDuplicidade(documento.id, item.doc.id);
          return !paresDuplicidadesIgnorados.has(chave);
        })
        .sort((a, b) => b.pontos - a.pontos || a.doc.nome.localeCompare(b.doc.nome))
        .slice(0, 8);
    }

    function carregarNomesParecidos(documento, tokenPainel = painelDocumentoTokenAtual) {
      const caixa = document.getElementById("nomesParecidosArquivo");

      if (!caixa || !painelAindaMostraDocumento(documento, tokenPainel)) {
        return;
      }

      const parecidos = buscarNomesParecidos(documento);

      if (!painelAindaMostraDocumento(documento, tokenPainel)) return;

      if (!parecidos.length) {
        caixa.classList.remove("comNomesParecidos");
        caixa.innerHTML = "<p>Nenhum nome parecido encontrado.</p>";
        return;
      }

      const chaveDocumento = chaveNomeArquivoVisualLimpo(documento.nome || "");
      const temNomeParecidoReal = parecidos.some(item =>
        chaveNomeArquivoVisualLimpo(item.doc.nome || "") !== chaveDocumento
      );
      if (!painelAindaMostraDocumento(documento, tokenPainel)) return;
      caixa.classList.toggle("comNomesParecidos", temNomeParecidoReal);
      const mapaNomesAtivos = criarMapaNomesVisuaisRepetidos(documentosAtivos);
      caixa.innerHTML = parecidos.map(item => {
        const status = item.doc.status === "ARQUIVADO" ? "Lixeira" : "Ativo";
        const classe = item.doc.status === "ARQUIVADO" ? "tagArquivado" : "tagAtivo";

        return `
          <div class="nomeParecido">
            <strong>${escaparHtml(nomeArquivoVisualLimpo(item.doc.nome))}</strong>
            <div class="chipsArquivo">
              <span class="${classe}">${status}</span>
              ${seloNomeRepetidoHtmlComMapa(item.doc, mapaNomesAtivos)}
            </div>
            <small>Possível semelhança pelo nome. Confira antes de substituir, renomear ou mesclar.</small>
          </div>
        `;
      }).join("");
    }
    function dataLocalISO(data) {
      const d = data ? new Date(data) : new Date();
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, "0");
      const dia = String(d.getDate()).padStart(2, "0");
      return `${ano}-${mes}-${dia}`;
    }

    function ajustarAlturaAnotacao() {
      const campo = document.getElementById("campoAnotacao");

      if (!campo) {
        return;
      }

      campo.style.height = "auto";
      campo.style.height = Math.min(campo.scrollHeight, 260) + "px";
    }

    async function validarArquivoPdfBasico(arquivo) {
      if (!arquivo) {
        return { valido: false, mensagem: "Selecione um arquivo PDF." };
      }

      const nome = (arquivo.name || "").toString();
      if (!nome.toLowerCase().endsWith(".pdf")) {
        return { valido: false, mensagem: "Selecione somente arquivo PDF." };
      }

      if (arquivo.type && arquivo.type !== "application/pdf") {
        return { valido: false, mensagem: "O arquivo selecionado não parece ser um PDF." };
      }

      if (!arquivo.size || arquivo.size <= 0) {
        return { valido: false, mensagem: "O PDF selecionado está vazio." };
      }

      try {
        const cabecalho = await arquivo.slice(0, 4).text();
        if (cabecalho !== "%PDF") {
          return { valido: false, mensagem: "O arquivo selecionado não tem assinatura de PDF válida." };
        }
      } catch (erro) {
        logger.warn("Nao foi possivel validar a assinatura do PDF.", erro);
        return { valido: false, mensagem: "Não foi possível validar este PDF. Escolha outro arquivo." };
      }

      return { valido: true, mensagem: "" };
    }
    async function obterToken() {
      const conta = msalInstance.getAllAccounts()[0];

      if (!conta) {
        throw new Error("Usuário não conectado.");
      }

      try {
        const resposta = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: conta
        });

        return resposta.accessToken;
      } catch (erro) {
        await msalInstance.acquireTokenRedirect(loginRequest);
      }
    }

    async function buscarTodosItens(urlInicial, token) {
      let url = urlInicial;
      let todos = [];
      let seguranca = 0;

      while (url && seguranca < 50) {
        const resposta = await fetchGraphComRetry(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }, {
          tentativas: 3,
          atrasoBaseMs: 700
        });

        if (!resposta.ok) {
          throw new Error(await resposta.text());
        }

        const dados = await resposta.json();
        todos = todos.concat(dados.value || []);
        url = dados["@odata.nextLink"] || "";
        seguranca++;
      }

      return todos;
    }

    function respostaIndicaAcessoNegado(resposta, texto = "") {
      const conteudo = normalizarTexto(texto);
      return resposta.status === 401 ||
        resposta.status === 403 ||
        conteudo.includes("accessdenied") ||
        conteudo.includes("access denied") ||
        conteudo.includes("unauthorized") ||
        conteudo.includes("forbidden") ||
        conteudo.includes("nao autorizado") ||
        conteudo.includes("não autorizado");
    }

    async function verificarPermissaoArquivoDigital(token) {
      const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/items?$top=1`;
      const resposta = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (resposta.ok) {
        return true;
      }

      const texto = await resposta.text();
      if (respostaIndicaAcessoNegado(resposta, texto)) {
        return false;
      }

      throw new Error(texto || `Falha ao verificar permissao no SharePoint. HTTP ${resposta.status}`);
    }

    function painelAindaMostraDocumento(documento, tokenPainel) {
      if (!documento || !documentoSelecionado) return false;
      const mesmoToken = tokenPainel === undefined || tokenPainel === painelDocumentoTokenAtual;
      const mesmoDocumento = documentoSelecionado.id === documento.id;
      const arquivoAtual = obterIdArquivoDocumento(documentoSelecionado);
      const arquivoEsperado = obterIdArquivoDocumento(documento);
      const mesmoArquivo = !arquivoAtual || !arquivoEsperado || arquivoAtual === arquivoEsperado;
      return mesmoToken && mesmoDocumento && mesmoArquivo;
    }

    function painelLateralJaAbertoNoMesmoDocumento(documento) {
      return Boolean(
        document.getElementById("painelLateral")?.classList.contains("aberto") &&
        painelAindaMostraDocumento(documento)
      );
    }

    function mostrarTelaAcessoRestrito(mensagemExtra = "") {
      aplicarBlindagemVisualPreLogin();
      acessoArquivoDigitalPermitido = false;
      documentosAtivos = [];
      documentosLixeira = [];
      documentosCarregados = [];

      const areaSistema = document.getElementById("areaSistema");
      const telaRestrita = document.getElementById("telaAcessoRestrito");
      const statusRestrito = document.getElementById("statusAcessoRestrito");

      if (areaSistema) areaSistema.style.display = "none";
      if (telaRestrita) telaRestrita.style.display = "grid";
      if (statusRestrito) statusRestrito.textContent = mensagemExtra || "";

      document.getElementById("status").textContent = "Acesso restrito";
      definirVisibilidadeBotaoCabecalho("btnAbrirConfiguracoesTopo", false);
      fecharPainel();
    }

    function definirVisibilidadeBotaoCabecalho(id, visivel) {
      const botao = document.getElementById(id);
      if (botao) botao.hidden = !visivel;
    }

    function aplicarBlindagemVisualPreLogin() {
      document.body.classList.add("estadoPreLogin");
      document.getElementById("areaSistema")?.style.setProperty("display", "none");
      definirVisibilidadeBotaoCabecalho("btnAbrirConfiguracoesTopo", false);
      definirVisibilidadeBotaoCabecalho("btnSair", false);
      document.getElementById("centralConfiguracoes")?.classList.remove("aberta");
      document.getElementById("centralUpload")?.classList.remove("aberta");
      document.getElementById("painelCentralDuplicidades")?.classList.remove("aberto");
      document.getElementById("painelDashboard")?.classList.remove("aberto");
      document.getElementById("painelLateral")?.classList.remove("aberto");
      marcarCamadaFechadaAcessivel("centralConfiguracoes", false);
      marcarCamadaFechadaAcessivel("centralUpload", false);
      marcarCamadaFechadaAcessivel("painelCentralDuplicidades", false);
      marcarCamadaFechadaAcessivel("painelDashboard", false);
      marcarCamadaFechadaAcessivel("painelLateral", false);
    }

    function liberarBlindagemVisualPreLogin() {
      document.body.classList.remove("estadoPreLogin");
    }

    function ocultarTelaAcessoRestrito() {
      const telaRestrita = document.getElementById("telaAcessoRestrito");
      const statusRestrito = document.getElementById("statusAcessoRestrito");
      if (telaRestrita) telaRestrita.style.display = "none";
      if (statusRestrito) statusRestrito.textContent = "";
    }

    window.tentarNovamenteAcessoArquivoDigital = async function () {
      document.getElementById("status").textContent = "Verificando acesso...";
      await atualizarTela();
    };

    function mostrarMensagem(texto, tipo = "info") {
      const msg = document.getElementById("mensagemSistema");
      msg.textContent = texto;
      msg.className = tipo === "erro" ? "mensagem erroBox" : "mensagem";
      msg.style.display = "flex";

      setTimeout(() => {
        msg.style.display = "none";
      }, 4000);
    }

    function mostrarMensagemPainel(texto, tipo = "info") {
      const msg = document.getElementById("mensagemPainel");
      clearTimeout(timerMensagemPainel);
      if (msg) {
        msg.textContent = "";
        msg.className = "mensagemPainel";
        msg.style.visibility = "hidden";
        msg.style.opacity = "0";
        msg.style.pointerEvents = "none";
      }
      mostrarMensagem(texto, tipo);
    }
    function atualizarStatusAnotacao(texto) {
      document.getElementById("statusAnotacao").textContent = texto;
    }

    function iniciarOperacaoCritica(chave, botaoId, mensagem = "A operação já está em andamento. Aguarde terminar.") {
      if (operacoesCriticasEmAndamento.has(chave)) {
        mostrarMensagemPainel(mensagem, "erro");
        return null;
      }

      operacoesCriticasEmAndamento.add(chave);
      const botao = document.getElementById(botaoId);
      if (botao) botao.disabled = true;
      return { chave, botao };
    }

    function finalizarOperacaoCritica(operacao) {
      if (!operacao) return;
      operacoesCriticasEmAndamento.delete(operacao.chave);
      if (operacao.botao) operacao.botao.disabled = false;
    }

    function agendarTarefaSegundoPlano(tarefa, atraso = 80) {
      const executar = () => {
        try {
          const resultado = tarefa();
          if (resultado && typeof resultado.catch === "function") {
            resultado.catch(erro => logger.warn("Tarefa em segundo plano falhou.", erro));
          }
        } catch (erro) {
          logger.warn("Tarefa em segundo plano falhou.", erro);
        }
      };

      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(executar, { timeout: 2500 });
        return;
      }

      setTimeout(executar, atraso);
    }

/* INICIO_FETCHGRAPH_RETRY_FASE3B_20260527 */
    function aguardar(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function obterTempoRetryAfterMs(resposta) {
      const valor = resposta?.headers?.get?.("Retry-After");

      if (!valor) {
        return 0;
      }

      const segundos = Number(valor);
      if (Number.isFinite(segundos)) {
        return Math.max(0, segundos * 1000);
      }

      const data = new Date(valor).getTime();
      if (Number.isFinite(data)) {
        return Math.max(0, data - Date.now());
      }

      return 0;
    }

    async function fetchGraphComRetry(url, opcoes = {}, config = {}) {
      const metodo = (opcoes.method || "GET").toString().toUpperCase();
      const permitirRetryEscrita = config.permitirRetryEscrita === true;
      const podeRepetirMetodo = metodo === "GET" || permitirRetryEscrita;
      const totalTentativas = Math.max(1, Number(config.tentativas || 3));
      const atrasoBaseMs = Math.max(200, Number(config.atrasoBaseMs || 700));
      const timeoutMs = Math.max(1000, Number(config.timeoutMs || TEMPO_LIMITE_GRAPH_MS));
      const statusRepetiveis = new Set([429, 500, 502, 503, 504]);
      let ultimoErro = null;

      for (let tentativa = 1; tentativa <= totalTentativas; tentativa++) {
        let controladorTimeout = null;
        let timerTimeout = null;
        const opcoesFetch = { ...opcoes };

        if (!opcoesFetch.signal && typeof AbortController !== "undefined") {
          controladorTimeout = new AbortController();
          opcoesFetch.signal = controladorTimeout.signal;
          timerTimeout = setTimeout(() => controladorTimeout.abort(), timeoutMs);
        }

        try {
          const resposta = await fetch(url, opcoesFetch);

          if (resposta.ok) {
            return resposta;
          }

          const deveRepetir = podeRepetirMetodo &&
            statusRepetiveis.has(resposta.status) &&
            tentativa < totalTentativas;

          if (!deveRepetir) {
            return resposta;
          }

          const retryAfterMs = obterTempoRetryAfterMs(resposta);
          const atraso = retryAfterMs || Math.min(6000, atrasoBaseMs * Math.pow(2, tentativa - 1));

          logger.warn(`Graph retornou HTTP ${resposta.status}. Nova tentativa ${tentativa + 1}/${totalTentativas} em ${atraso}ms.`);
          await aguardar(atraso);

        } catch (erro) {
          ultimoErro = erro;

          const deveRepetir = podeRepetirMetodo && tentativa < totalTentativas;
          if (!deveRepetir) {
            if (erro?.name === "AbortError") {
              throw new Error("Tempo limite ao chamar o Microsoft Graph. Verifique sua conexão e tente novamente.");
            }
            throw erro;
          }

          const atraso = Math.min(6000, atrasoBaseMs * Math.pow(2, tentativa - 1));
          logger.warn(`Falha temporaria no Graph. Nova tentativa ${tentativa + 1}/${totalTentativas} em ${atraso}ms.`, erro);
          await aguardar(atraso);
        } finally {
          if (timerTimeout) clearTimeout(timerTimeout);
        }
      }

      throw ultimoErro || new Error("Falha ao chamar Microsoft Graph.");
    }
    /* FIM_FETCHGRAPH_RETRY_FASE3B_20260527 */

    function atualizarCardParesIgnorados() {
      const total = paresDuplicidadesIgnoradosDetalhes.length || paresDuplicidadesIgnorados.size || 0;
      const elemento = document.getElementById("dashParesIgnorados");
      if (elemento) elemento.textContent = total;
    }

    function atualizarDashboard() {
      document.getElementById("dashDocumentos").textContent = documentosAtivos ? documentosAtivos.length : documentosCarregados.length;
      document.getElementById("dashLixeira").textContent = documentosLixeira ? documentosLixeira.length : 0;

atualizarCardParesIgnorados();
    }

    function invalidarCacheDocumentos() {
      versaoDocumentosCache++;
      cacheDocumentosPorArquivoId = { versao: -1, mapa: new Map() };
      cacheMapaNomesVisuaisTodosDocumentos = { versao: -1, mapa: new Map() };
      cacheDocumentosRecentes = { versaoDocumentos: -1, limitado: false, limite: 0, ordem: "desc", itens: [] };
    }

    function invalidarCacheHistorico() {
      versaoHistoricoCache++;
      cacheHistoricoPorArquivoId = { versao: -1, mapa: new Map() };
      cacheHistoricoOrdenado = { versao: -1, direcao: "", itens: [] };
      cacheUltimasMovimentacoes = { versao: -1, limite: 0, mapa: new Map() };
    }

    function invalidarCacheAnotacoes() {
      versaoAnotacoesCache++;
      cacheAnotacaoPorArquivoId = { versao: -1, mapa: new Map() };
    }

    function normalizarIdArquivo(valor) {
      return (valor || "").toString().trim();
    }

    function obterIdArquivoDocumento(documento) {
      if (!documento) return "";
      return normalizarIdArquivo(
        documento.id ||
        documento.uniqueId ||
        documento.UniqueId ||
        documento.ARQUIVO_ID ||
        ""
      );
    }

    function historicoPertenceAoDocumento(itemHistorico, documento) {
      const idHistorico = normalizarIdArquivo(itemHistorico?.ARQUIVO_ID);
      const idDocumento = obterIdArquivoDocumento(documento);
      return Boolean(idHistorico && idDocumento && idHistorico === idDocumento);
    }

    function anotacaoPertenceAoDocumento(itemAnotacao, documento) {
      const idAnotacao = normalizarIdArquivo(itemAnotacao?.ARQUIVO_ID);
      const idDocumento = obterIdArquivoDocumento(documento);
      return Boolean(idAnotacao && idDocumento && idAnotacao === idDocumento);
    }

    function obterDocumentosPorArquivoId() {
      if (cacheDocumentosPorArquivoId.versao === versaoDocumentosCache) {
        return cacheDocumentosPorArquivoId.mapa;
      }

      const mapa = new Map();
      [...documentosAtivos, ...documentosLixeira].forEach(doc => {
        const id = obterIdArquivoDocumento(doc);
        if (id) mapa.set(id, doc);
      });

      cacheDocumentosPorArquivoId = { versao: versaoDocumentosCache, mapa };
      return mapa;
    }

    function obterHistoricoPorArquivoId() {
      if (cacheHistoricoPorArquivoId.versao === versaoHistoricoCache) {
        return cacheHistoricoPorArquivoId.mapa;
      }

      const mapa = new Map();
      historicoCarregado.forEach(item => {
        const id = normalizarIdArquivo(item?.ARQUIVO_ID);
        if (!id) return;
        if (!mapa.has(id)) mapa.set(id, []);
        mapa.get(id).push(item);
      });

      cacheHistoricoPorArquivoId = { versao: versaoHistoricoCache, mapa };
      return mapa;
    }

    function obterAnotacoesPorArquivoId() {
      if (cacheAnotacaoPorArquivoId.versao === versaoAnotacoesCache) {
        return cacheAnotacaoPorArquivoId.mapa;
      }

      const mapa = new Map();
      anotacoesCarregadas.forEach(item => {
        const id = normalizarIdArquivo(item?.ARQUIVO_ID);
        if (id) mapa.set(id, item);
      });

      cacheAnotacaoPorArquivoId = { versao: versaoAnotacoesCache, mapa };
      return mapa;
    }

    function obterHistoricoOrdenado(direcao = "desc") {
      const direcaoNormalizada = direcao === "asc" ? "asc" : "desc";
      if (
        cacheHistoricoOrdenado.versao === versaoHistoricoCache &&
        cacheHistoricoOrdenado.direcao === direcaoNormalizada
      ) {
        return cacheHistoricoOrdenado.itens;
      }

      const itens = historicoCarregado
        .filter(item => item && item.DATA_HORA)
        .sort((a, b) => {
          const dataA = new Date(a.DATA_HORA || 0).getTime() || 0;
          const dataB = new Date(b.DATA_HORA || 0).getTime() || 0;
          return direcaoNormalizada === "asc" ? dataA - dataB : dataB - dataA;
        });

      cacheHistoricoOrdenado = {
        versao: versaoHistoricoCache,
        direcao: direcaoNormalizada,
        itens
      };
      return itens;
    }

    function mesclarHistoricoNoCache(itensDocumento) {
      const idsNovos = new Set(itensDocumento.map(item => String(item.ID || "")));
      historicoCarregado = historicoCarregado.filter(item => !idsNovos.has(String(item.ID || "")));
      historicoCarregado.push(...itensDocumento);
      invalidarCacheHistorico();
    }

    function atualizarCacheAnotacaoDocumento(itemAnotacao, arquivoId) {
      anotacoesCarregadas = anotacoesCarregadas.filter(item =>
        normalizarIdArquivo(item.ARQUIVO_ID) !== normalizarIdArquivo(arquivoId)
      );
      if (itemAnotacao) anotacoesCarregadas.push(itemAnotacao);
      invalidarCacheAnotacoes();
    }

    function mapearItemHistorico(item) {
      return {
        ID: item.id,
        ARQUIVO: item.fields?.Title || "",
        USUARIO_EMAIL: item.fields?.USUARIO_EMAIL || "",
        ACAO: item.fields?.ACAO || "",
        USUARIO_NOME: item.fields?.USUARIO_NOME || "",
        DATA_HORA: item.fields?.DATA_HORA || "",
        ARQUIVO_ID: item.fields?.ARQUIVO_ID || "",
        OBSERVACAO: item.fields?.OBSERVACAO || ""
      };
    }

    function mapearItemAnotacao(item) {
      return {
        ID: item.id,
        ETAG: item["@odata.etag"] || item.eTag || "",
        ARQUIVO: item.fields?.Title || "",
        ARQUIVO_ID: item.fields?.ARQUIVO_ID || "",
        ANOTACAO: item.fields?.ANOTACAO || "",
        ATUALIZADO_POR: item.fields?.ATUALIZADO_POR || "",
        DATA_ATUALIZACAO: item.fields?.DATA_ATUALIZACAO || ""
      };
    }

    async function carregarHistoricoPorArquivoId(arquivoId, token) {
      const url = montarUrlItensLista(
        CONFIG.siteId,
        CONFIG.historicoAcessosListId,
        ["Title", "USUARIO_EMAIL", "ACAO", "USUARIO_NOME", "DATA_HORA", "ARQUIVO_ID", "OBSERVACAO"],
        { filtro: filtroCampoIgual("ARQUIVO_ID", arquivoId), top: 100 }
      );
      const itens = await buscarTodosItens(url, token);
      return itens.map(mapearItemHistorico);
    }

    async function carregarAnotacaoPorArquivoId(arquivoId, token) {
      const url = montarUrlItensLista(
        CONFIG.siteId,
        CONFIG.anotacoesArquivosListId,
        ["Title", "ARQUIVO_ID", "ANOTACAO", "ATUALIZADO_POR", "DATA_ATUALIZACAO"],
        { filtro: filtroCampoIgual("ARQUIVO_ID", arquivoId), top: 1 }
      );
      const itens = await buscarTodosItens(url, token);
      return itens.length ? mapearItemAnotacao(itens[0]) : null;
    }

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

    async function carregarDadosDeApoio(tokenInformado = "", opcoes = {}) {
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

    window.recarregarDashboard = async function () {
      try {
        mostrarMensagem("Atualizando dashboard...");
        await carregarDadosDeApoio("", { forcar: true });
        mostrarMensagem("Dashboard atualizado.");
      } catch (erro) {
        logger.error(erro);
        mostrarMensagem("Não foi possível atualizar o resumo agora.", "erro");
      }
    };

    function atualizarBotoesModoLista() {
      const btnRecentes = document.getElementById("btnVerRecentes");
      const btnAtivos = document.getElementById("btnVerAtivos");
      const btnLixeira = document.getElementById("btnVerLixeira");

      if (!btnRecentes || !btnAtivos || !btnLixeira) return;

      btnRecentes.classList.toggle("ativo", modoListaAtual === "recentes");
      btnAtivos.classList.toggle("ativo", modoListaAtual === "ativos");
      btnLixeira.classList.toggle("ativo", modoListaAtual === "na Lixeira");

      document.getElementById("tituloListaDocumentos").textContent = "Pesquise um Documento";

      document.getElementById("campoBusca").placeholder = modoListaAtual === "na Lixeira"
        ? "Digite para pesquisar nos documentos na Lixeira..."
        : "Digite o nome do aluno ou parte do nome...";
    }

    function atualizarControlesPreferencias() {
      const campos = {
        configLimiteRecentes: preferenciasSistema.limiteRecentes,
        configOrdemRecentes: preferenciasSistema.ordemRecentes,
        configOrdemLixeira: preferenciasSistema.ordemLixeira,
        configGuiaInicial: preferenciasSistema.guiaInicial,
        configModoVisual: preferenciasSistema.modoVisual,
        configDetalhesCards: preferenciasSistema.detalhesCards,
        configDuplicidadesAuto: preferenciasSistema.analiseDuplicidadesAuto,
        configLimiteRelatorios: preferenciasSistema.limiteRelatorios
      };

      Object.entries(campos).forEach(([id, valor]) => {
        const campo = document.getElementById(id);
        if (campo) campo.value = valor;
      });

      renderizarGavetasConfiguracao();
    }

    window.alternarCentralConfiguracoes = function () {
      const central = document.getElementById("centralConfiguracoes");
      if (!central) return;

      const vaiAbrir = !central.classList.contains("aberta");
      if (vaiAbrir) {
        central.classList.add("aberta");
        marcarCamadaAbertaAcessivel("centralConfiguracoes", "#centralConfiguracoesTitulo");
        central.scrollTop = 0;
        registrarCamadaHistoricoMobile();
      } else {
        central.classList.remove("aberta");
        marcarCamadaFechadaAcessivel("centralConfiguracoes");
      }

      atualizarControlesPreferencias();
    };

    window.salvarConfiguracoesSistema = function (mostrarAviso = true) {
      preferenciasSistema = {
        limiteRecentes: Number(document.getElementById("configLimiteRecentes")?.value || 20),
        ordemRecentes: document.getElementById("configOrdemRecentes")?.value || "desc",
        ordemLixeira: document.getElementById("configOrdemLixeira")?.value || "desc",
        guiaInicial: document.getElementById("configGuiaInicial")?.value || "recentes",
        modoVisual: document.getElementById("configModoVisual")?.value || "confortavel",
        detalhesCards: document.getElementById("configDetalhesCards")?.value || "mais",
        analiseDuplicidadesAuto: document.getElementById("configDuplicidadesAuto")?.value || "sim",
        limiteRelatorios: Number(document.getElementById("configLimiteRelatorios")?.value || 30)
      };

      salvarPreferenciasSistema();
      aplicarPreferenciasVisuais();
      limparCacheDuplicidades();
      aplicarListaAtual();

      if (preferenciasSistema.analiseDuplicidadesAuto === "sim") {
        atualizarCentralDuplicidadesSegundoPlano();
      } else {
        totalParesCentralDuplicidades = 0;
        aplicarEstadoVisualCentralDuplicidades(0);
        const resumo = document.getElementById("resumoCentralDuplicidades");
        if (resumo) resumo.textContent = "Analise automatica desativada. Abra a Central para analisar.";
      }

      if (mostrarAviso) {
        mostrarMensagem("Configurações salvas.");
      }
    };

    document.addEventListener("change", (evento) => {
      if (evento.target && evento.target.closest("#centralConfiguracoes") && evento.target.matches("select")) {
        window.salvarConfiguracoesSistema(false);
      }
    });

    function renderizarGavetasConfiguracao() {
      const lista = document.getElementById("listaGavetasConfiguracao");
      const status = document.getElementById("statusCadastroGaveta");
      if (!lista) return;

      const gavetasDisponiveis = gavetasSharePointDisponiveis();
      const avisoFallback = !gavetasDisponiveis
        ? `<div class="avisoGavetasFallback">${mensagemGavetasSharePointIndisponiveis()}</div>`
        : "";

      if (status && !gavetasDisponiveis) {
        status.textContent = erroOpcoesGavetaSharePoint || mensagemGavetasSharePointIndisponiveis();
      }

      const campoNovaGaveta = document.getElementById("novaGavetaConfiguracao");
      const botaoCadastrarGaveta = document.querySelector(".linhaCadastroGaveta button");
      if (campoNovaGaveta) campoNovaGaveta.disabled = !gavetasDisponiveis;
      if (botaoCadastrarGaveta) botaoCadastrarGaveta.disabled = !gavetasDisponiveis;

      lista.innerHTML = obterOpcoesGavetas()
        .filter(gaveta => gaveta !== "Gaveta nao informada")
        .map(gaveta => {
          const total = documentosDaGaveta(gaveta).length;
          const gavetaParam = escaparHtml(gaveta);
          return `
            <div class="itemGavetaConfiguracao">
              <div>
                <strong>${escaparHtml(gaveta)}</strong>
                <small>${total} documento(s) · Cadastrada</small>
              </div>
              <div class="acoesGavetaConfiguracao">
                <button class="secundario ignorarHoverGlobal" type="button" ${gavetasDisponiveis ? "" : "disabled"} data-acao-gaveta-config="editar" data-gaveta="${gavetaParam}">Editar</button>
                <button class="perigo ignorarHoverGlobal" type="button" ${gavetasDisponiveis ? "" : "disabled"} data-acao-gaveta-config="excluir" data-gaveta="${gavetaParam}">Excluir</button>
              </div>
            </div>
          `;
        })
        .join("");

      lista.innerHTML = avisoFallback + lista.innerHTML;
    }

    document.addEventListener("click", function (evento) {
      const botao = evento.target.closest("[data-acao-gaveta-config]");
      if (!botao || !botao.closest("#listaGavetasConfiguracao")) return;

      const gaveta = botao.dataset.gaveta || "";

      if (botao.dataset.acaoGavetaConfig === "editar") {
        window.editarGavetaConfiguracao(gaveta);
        return;
      }

      if (botao.dataset.acaoGavetaConfig === "excluir") {
        window.excluirGavetaConfiguracao(gaveta);
      }
    });

    async function obterColunaGavetaSharePoint(token) {
      const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/columns`;
      const resposta = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resposta.ok) {
        throw new Error(await resposta.text());
      }

      const dados = await resposta.json();
      return (dados.value || []).find(coluna =>
        coluna.name === "GAVETA" ||
        coluna.displayName === "GAVETA" ||
        coluna.name === "Gaveta" ||
        coluna.displayName === "Gaveta"
      );
    }

    async function atualizarOpcoesColunaGavetaSharePoint(token, escolhasNovas) {
      const coluna = await obterColunaGavetaSharePoint(token);

      if (!coluna || !coluna.id || !coluna.choice) {
        throw new Error("Coluna GAVETA Choice nao encontrada.");
      }

      const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/columns/${coluna.id}`;
      const resposta = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          choice: {
            ...coluna.choice,
            choices: escolhasNovas
          }
        })
      });

      if (!resposta.ok) {
        throw new Error(await resposta.text());
      }
    }

    async function carregarOpcoesGavetaSharePoint(tokenInformado = "") {
      try {
        const token = tokenInformado || await obterToken();
        const coluna = await obterColunaGavetaSharePoint(token);

        if (!coluna || !coluna.choice || !Array.isArray(coluna.choice.choices)) {
          throw new Error("Coluna GAVETA Choice nao encontrada.");
        }

        opcoesGavetaSharePoint = coluna.choice.choices
          .map(normalizarNomeGavetaAdministrativa)
          .filter(Boolean)
          .filter((valor, indice, lista) => lista.findIndex(item => normalizarTexto(item) === normalizarTexto(valor)) === indice);
        opcoesGavetaCarregadas = true;
        erroOpcoesGavetaSharePoint = "";
        renderizarGavetasConfiguracao();
        return opcoesGavetaSharePoint;
      } catch (erro) {
        logger.warn("Nao foi possivel carregar opcoes da coluna GAVETA no SharePoint. Usando fallback Gaveta 1 a Gaveta 34.", erro);
        opcoesGavetaSharePoint = [];
        opcoesGavetaCarregadas = false;
        erroOpcoesGavetaSharePoint = mensagemGavetasSharePointIndisponiveis();
        renderizarGavetasConfiguracao();
        return opcoesGavetasPadrao();
      }
    }

    function atualizarInterfacesGaveta() {
      renderizarGavetasConfiguracao();
      renderizarGavetasAtivos();

      const selectUpload = document.getElementById("gavetaUpload");
      if (selectUpload) {
        const valorAtual = selectUpload.value || "";
        selectUpload.innerHTML = opcoesGavetaHtml(valorAtual);
        if (valorAtual) selectUpload.value = valorAtual;
      }

      const selectPainel = document.getElementById("novaGavetaDocumento");
      if (selectPainel) {
        const valorAtual = selectPainel.value || documentoSelecionado?.gaveta || "";
        selectPainel.innerHTML = opcoesGavetaHtml(valorAtual);
        if (valorAtual) selectPainel.value = valorAtual;
      }
    }

    window.cadastrarNovaGaveta = async function () {
      const campo = document.getElementById("novaGavetaConfiguracao");
      const status = document.getElementById("statusCadastroGaveta");
      let novaGaveta = "";

      if (!gavetasSharePointDisponiveis()) {
        if (status) status.textContent = mensagemGavetasSharePointIndisponiveis();
        mostrarMensagem(mensagemGavetasSharePointIndisponiveis(), "erro");
        return;
      }

      try {
        novaGaveta = normalizarNomeGavetaAdministrativa(campo?.value || "");
      } catch (erro) {
        if (status) status.textContent = erro.message;
        return;
      }

      if (gavetaJaExiste(novaGaveta)) {
        if (status) status.textContent = "Essa gaveta ja existe.";
        return;
      }

      if (status) status.textContent = "Cadastrando gaveta no SharePoint...";

      try {
        const token = await obterToken();
        const coluna = await obterColunaGavetaSharePoint(token);

        if (!coluna || !coluna.id || !coluna.choice) {
          throw new Error("Coluna GAVETA Choice nao encontrada.");
        }

        const escolhasAtuais = coluna.choice.choices || [];
        const escolhasNovas = [...escolhasAtuais, novaGaveta]
          .filter(Boolean)
          .filter((valor, indice, lista) => lista.findIndex(item => chaveComparacaoGaveta(item) === chaveComparacaoGaveta(valor)) === indice);

        await atualizarOpcoesColunaGavetaSharePoint(token, escolhasNovas);

        if (campo) campo.value = "";
        await carregarOpcoesGavetaSharePoint(token);
        atualizarInterfacesGaveta();
        mostrarMensagem("Gaveta cadastrada.");
        if (status) status.textContent = "Gaveta cadastrada com sucesso.";
      } catch (erro) {
        logger.error(erro);
        if (status) status.textContent = "Não foi possível salvar a nova gaveta no SharePoint. Verifique as permissões.";
        mostrarMensagem("Não foi possível salvar a nova gaveta no SharePoint. Verifique as permissões.", "erro");
      }
    };

    async function registrarHistoricoGavetasEmLote(documentos, gavetaAnterior, novaGaveta, motivo) {
      for (const documento of documentos) {
        try {
          await registrarHistorico(documento, "ALTEROU_GAVETA", motivo(gavetaAnterior, novaGaveta));
        } catch (erro) {
          logger.warn("Nao foi possivel registrar historico da alteracao de gaveta.", documento?.nome, erro);
        }
      }
    }

    async function atualizarDocumentosDaGaveta(documentos, novaGaveta, token) {
      for (const documento of documentos) {
        if (!documento.listItemId) {
          throw new Error(`Documento sem identificador de lista: ${documento.nome || "sem nome"}`);
        }

        await atualizarGavetaItemSharePoint(documento.listItemId, novaGaveta, token);
      }
    }

    window.editarGavetaConfiguracao = async function (gavetaAtual) {
      const status = document.getElementById("statusCadastroGaveta");

      if (!gavetasSharePointDisponiveis()) {
        if (status) status.textContent = mensagemGavetasSharePointIndisponiveis();
        mostrarMensagem(mensagemGavetasSharePointIndisponiveis(), "erro");
        return;
      }

      const documentosAfetados = documentosDaGaveta(gavetaAtual);
      const novoNomeDigitado = prompt(`Nome atual: ${gavetaAtual}\nDocumentos usando esta gaveta: ${documentosAfetados.length}\n\nDigite o novo nome da gaveta:`, gavetaAtual);
      if (novoNomeDigitado === null) return;

      let novaGaveta = "";
      try {
        novaGaveta = normalizarNomeGavetaAdministrativa(novoNomeDigitado);
      } catch (erro) {
        if (status) status.textContent = erro.message;
        mostrarMensagem(erro.message, "erro");
        return;
      }

      if (chaveComparacaoGaveta(novaGaveta) === chaveComparacaoGaveta(gavetaAtual)) {
        if (status) status.textContent = "O novo nome é igual ao nome atual.";
        return;
      }

      if (gavetaJaExiste(novaGaveta, gavetaAtual)) {
        if (status) status.textContent = "Já existe uma gaveta com esse nome.";
        mostrarMensagem("Já existe uma gaveta com esse nome.", "erro");
        return;
      }

      const confirmar = confirm(
        `A gaveta '${gavetaAtual}' será renomeada para '${novaGaveta}'.\n\n` +
        `Os documentos vinculados serão atualizados.\n` +
        `Documentos afetados: ${documentosAfetados.length}\n\n` +
        `Nenhum PDF será apagado.\n\nDeseja continuar?`
      );

      if (!confirmar) return;

      if (status) status.textContent = "Renomeando gaveta no SharePoint...";

      try {
        const token = await obterToken();
        const coluna = await obterColunaGavetaSharePoint(token);

        if (!coluna || !coluna.choice || !Array.isArray(coluna.choice.choices)) {
          throw new Error("Coluna GAVETA Choice nao encontrada.");
        }

        const escolhasAtuais = coluna.choice.choices || [];
        const existeAtual = escolhasAtuais.some(opcao => chaveComparacaoGaveta(opcao) === chaveComparacaoGaveta(gavetaAtual));

        if (!existeAtual) {
          throw new Error("A gaveta atual não foi encontrada nas opções reais do SharePoint.");
        }

        await atualizarDocumentosDaGaveta(documentosAfetados, novaGaveta, token);

        const escolhasNovas = escolhasAtuais
          .map(opcao => chaveComparacaoGaveta(opcao) === chaveComparacaoGaveta(gavetaAtual) ? novaGaveta : opcao)
          .filter((valor, indice, lista) => lista.findIndex(item => chaveComparacaoGaveta(item) === chaveComparacaoGaveta(valor)) === indice);

        await atualizarOpcoesColunaGavetaSharePoint(token, escolhasNovas);

        await registrarHistoricoGavetasEmLote(
          documentosAfetados,
          gavetaAtual,
          novaGaveta,
          (anterior, nova) => `Gaveta renomeada na configuração do sistema. Gaveta anterior: ${anterior}. Nova gaveta: ${nova}.`
        );

        await carregarOpcoesGavetaSharePoint(token);
        await atualizarDadosMantendoPainel();
        atualizarInterfacesGaveta();
        if (status) status.textContent = "Gaveta renomeada com sucesso.";
        mostrarMensagem("Gaveta renomeada com sucesso.");
      } catch (erro) {
        logger.error(erro);
        if (status) status.textContent = "Não foi possível renomear a gaveta. Nenhuma etapa seguinte foi forçada.";
        mostrarMensagem("Não foi possível renomear a gaveta. Veja o console para detalhes técnicos.", "erro");
      }
    };

    window.excluirGavetaConfiguracao = async function (gavetaAtual) {
      const status = document.getElementById("statusCadastroGaveta");

      if (!gavetasSharePointDisponiveis()) {
        if (status) status.textContent = mensagemGavetasSharePointIndisponiveis();
        mostrarMensagem(mensagemGavetasSharePointIndisponiveis(), "erro");
        return;
      }

      const documentosAfetados = documentosDaGaveta(gavetaAtual);
      const primeiros = documentosAfetados.slice(0, 5).map(doc => `- ${doc.nome}`).join("\n");
      const detalhe = primeiros ? `\n\nPrimeiros documentos afetados:\n${primeiros}` : "";
      const digitado = prompt(
        `A gaveta '${gavetaAtual}' será removida da lista de gavetas.\n` +
        `Nenhum PDF será apagado.\n` +
        `${documentosAfetados.length} documento(s) serão marcados como 'Gaveta não informada'.${detalhe}\n\n` +
        `Para confirmar, digite o nome da gaveta:`
      );

      if (digitado === null) return;

      if (chaveComparacaoGaveta(digitado) !== chaveComparacaoGaveta(gavetaAtual)) {
        if (status) status.textContent = "Exclusão cancelada: o nome digitado não confere.";
        return;
      }

      const confirmar = confirm(`Confirmar exclusão da gaveta '${gavetaAtual}'?\n\nNenhum PDF será apagado.`);
      if (!confirmar) return;

      if (status) status.textContent = "Excluindo gaveta no SharePoint...";

      try {
        const token = await obterToken();
        const coluna = await obterColunaGavetaSharePoint(token);

        if (!coluna || !coluna.choice || !Array.isArray(coluna.choice.choices)) {
          throw new Error("Coluna GAVETA Choice nao encontrada.");
        }

        const escolhasAtuais = coluna.choice.choices || [];
        const existeAtual = escolhasAtuais.some(opcao => chaveComparacaoGaveta(opcao) === chaveComparacaoGaveta(gavetaAtual));

        if (!existeAtual) {
          throw new Error("A gaveta atual não foi encontrada nas opções reais do SharePoint.");
        }

        await atualizarDocumentosDaGaveta(documentosAfetados, "", token);

        const escolhasNovas = escolhasAtuais
          .filter(opcao => chaveComparacaoGaveta(opcao) !== chaveComparacaoGaveta(gavetaAtual))
          .filter(Boolean);

        await atualizarOpcoesColunaGavetaSharePoint(token, escolhasNovas);

        await registrarHistoricoGavetasEmLote(
          documentosAfetados,
          gavetaAtual,
          "Gaveta nao informada",
          anterior => `Gaveta removida por exclusão da gaveta '${anterior}'. Gaveta anterior: ${anterior}. Nova gaveta: Gaveta não informada.`
        );

        await carregarOpcoesGavetaSharePoint(token);
        await atualizarDadosMantendoPainel();
        atualizarInterfacesGaveta();
        if (status) status.textContent = "Gaveta excluída com sucesso.";
        mostrarMensagem("Gaveta excluída com sucesso.");
      } catch (erro) {
        logger.error(erro);
        if (status) status.textContent = "Não foi possível excluir a gaveta. Se documentos foram reclassificados, tente novamente para remover a opção.";
        mostrarMensagem("Não foi possível excluir a gaveta. Veja o console para detalhes técnicos.", "erro");
      }
    };

    function renderizarGavetasAtivos() {
      const area = document.getElementById("areaGavetas");
      const lista = document.getElementById("listaGavetasAtivos");
      if (!area || !lista) return;

      area.style.display = modoListaAtual === "ativos" ? "block" : "none";

      if (modoListaAtual !== "ativos") {
        filtroGavetaAtual = "";
        return;
      }

      const mapa = new Map();
      documentosAtivos.forEach(doc => {
        const gaveta = chaveGaveta(doc.gaveta);
        mapa.set(gaveta, (mapa.get(gaveta) || 0) + 1);
      });

      const entradas = [...mapa.entries()].sort((a, b) => {
        if (a[0] === "Gaveta nao informada") return -1;
        if (b[0] === "Gaveta nao informada") return 1;
        return a[0].localeCompare(b[0], "pt-BR", { numeric: true });
      });

      lista.innerHTML = entradas.map(([gaveta, total]) => {
        const rotuloGaveta = gaveta === "Gaveta nao informada" ? "Sem gaveta" : gaveta;

        return `
          <button class="gavetaCard ${filtroGavetaAtual === gaveta ? "ativo" : ""}" type="button" title="${escaparHtml(gaveta)}" aria-label="${escaparHtml(gaveta)}" data-gaveta="${escaparHtml(gaveta)}">
            <span>${escaparHtml(rotuloGaveta)}</span>
            <strong>${total}</strong>
          </button>
        `;
      }).join("");
    }

    window.filtrarPorGaveta = function (gaveta) {
      filtroGavetaAtual = filtroGavetaAtual === gaveta ? "" : (gaveta || "");
      limparFiltrosAvancadosOcultos();
      renderizarGavetasAtivos();
      filtrarDocumentos();
    };

    window.alternarFiltrosAvancados = function () {
      limparFiltrosAvancadosOcultos();
      atualizarBotoesFiltros();
    };

    window.aplicarFiltroRapido = function (nomeFiltro) {
      filtroGavetaAtual = "";
      limparFiltrosAvancadosOcultos();

      atualizarBotoesFiltros();
      renderizarGavetasAtivos();
      filtrarDocumentos();
    };

    function atualizarBotoesFiltros() {
      limparFiltrosAvancadosOcultos();
      const botaoFiltros = document.getElementById("btnFiltrosAvancados");
      const indicador = document.getElementById("indicadorFiltrosAtivos");

      if (botaoFiltros) botaoFiltros.classList.remove("ativo");
      if (indicador) {
        indicador.textContent = "";
        indicador.style.display = "none";
      }

      Object.entries(filtrosAvancados).forEach(([nome, ativo]) => {
      document.querySelector(`[data-filtro="${nome}"]`)?.classList.toggle("ativo", ativo);
      });
    }
    window.abrirHistoricoGeral = function () {
      limiteHistoricoGeralAtual = preferenciasSistema.limiteRelatorios || 30;

      if (!window.filtroHistoricoGeralAtual) {
        window.filtroHistoricoGeralAtual = { tipo: "todos", inicio: "", fim: "" };
      }

      if (typeof window.termoBuscaHistoricoGeralAtual !== "string") {
        window.termoBuscaHistoricoGeralAtual = "";
      }

      if (window.ordemHistoricoGeralAtual !== "asc" && window.ordemHistoricoGeralAtual !== "desc") {
        window.ordemHistoricoGeralAtual = "desc";
      }

      abrirPainelDashboard("Central de histórico", `
        <div class="filtroHistoricoGeral">
          <div class="topoFiltroHistoricoGeral">
            <strong>Filtrar alterações</strong>
            <small id="resumoFiltroHistoricoGeral">Mostrando histórico completo.</small>
          </div>

          <div class="linhaBotoesFiltroHistoricoGeral">
            <button class="botaoFiltroHistoricoGeral ativo" type="button" data-filtro-historico="todos">Tudo</button>
            <button class="botaoFiltroHistoricoGeral" type="button" data-filtro-historico="hoje">Hoje</button>
            <button class="botaoFiltroHistoricoGeral" type="button" data-filtro-historico="7dias">7 dias</button>
            <button class="botaoFiltroHistoricoGeral" type="button" data-filtro-historico="30dias">30 dias</button>
            <button class="botaoFiltroHistoricoGeral" type="button" data-filtro-historico="personalizado">Personalizado</button>
          </div>

          <div id="camposFiltroHistoricoPersonalizado" class="camposFiltroHistoricoPersonalizado">
            <label>De <input id="filtroHistoricoInicio" type="date"></label>
            <label>Até <input id="filtroHistoricoFim" type="date"></label>
            <button class="botaoAplicarFiltroHistorico" type="button" data-acao-historico="aplicar-personalizado">Aplicar</button>
          </div>

          <div class="linhaBuscaHistoricoGeral">
            <input id="buscaHistoricoGeral" class="buscaHistoricoGeral" type="search" placeholder="Buscar por arquivo, usuário, ação, gaveta ou motivo..." autocomplete="off">
            <div class="botoesOrdemHistoricoGeral" title="Ordenar histórico">
              <button class="botaoOrdemHistoricoGeral ativo" type="button" data-ordem-historico="desc" title="Mais recentes primeiro">↓</button>
              <button class="botaoOrdemHistoricoGeral" type="button" data-ordem-historico="asc" title="Mais antigos primeiro">↑</button>
            </div>
          </div>
        </div>

        <div id="listaHistoricoGeral" class="listaHistoricoGeral">
          <p>Carregando histórico geral...</p>
        </div>
      `, { htmlInternoConfiavel: true });

      sincronizarCamposFiltroHistoricoGeral();
      renderizarHistoricoGeral();
      if (!historicoGeralInicializado && !historicoGeralCarregando) {
        agendarTarefaSegundoPlano(async () => {
          try {
            await carregarPaginaHistoricoGeral({ reiniciar: true });
          } catch (erro) {
            logger.warn("Falha ao carregar a primeira pagina do historico.", erro);
            mostrarMensagem("Nao foi possivel carregar o historico agora. Tente novamente.", "erro");
          }
        }, 80);
      }
    };
window.verMaisHistoricoGeral = async function (event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      const conteudoPainel = document.querySelector("#painelDashboard .painelConteudo");
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
          logger.warn("Falha ao carregar mais registros do historico.", erro);
          mostrarMensagem("Nao foi possivel carregar mais registros agora.", "erro");
        }
      }

      renderizarHistoricoGeral();
      requestAnimationFrame(() => {
        const conteudoAtualizado = document.querySelector("#painelDashboard .painelConteudo");
        if (conteudoAtualizado) conteudoAtualizado.scrollTop = posicaoRolagem;
      });
    };
    /* JS_FILTRO_DATAS_HISTORICO_GERAL_INICIO */
    function obterFiltroHistoricoGeralAtual() {
      if (!window.filtroHistoricoGeralAtual) {
        window.filtroHistoricoGeralAtual = { tipo: "todos", inicio: "", fim: "" };
      }

      return window.filtroHistoricoGeralAtual;
    }

    function obterTermoBuscaHistoricoGeral() {
      return (window.termoBuscaHistoricoGeralAtual || "").toString().trim();
    }

    function obterOrdemHistoricoGeralAtual() {
      return window.ordemHistoricoGeralAtual === "asc" ? "asc" : "desc";
    }

    function normalizarBuscaHistoricoGeral(valor) {
      return normalizarTexto((valor || "").toString());
    }

    function formatarInputDataLocal(data) {
      const d = new Date(data);
      if (Number.isNaN(d.getTime())) return "";

      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, "0");
      const dia = String(d.getDate()).padStart(2, "0");

      return `${ano}-${mes}-${dia}`;
    }

    function dataInputParaInicio(valor) {
      if (!valor) return null;
      const partes = valor.split("-").map(Number);
      if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
      return new Date(partes[0], partes[1] - 1, partes[2], 0, 0, 0, 0);
    }

    function dataInputParaFim(valor) {
      if (!valor) return null;
      const partes = valor.split("-").map(Number);
      if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
      return new Date(partes[0], partes[1] - 1, partes[2], 23, 59, 59, 999);
    }

    function compararHistoricoGeralPorData(a, b) {
      const dataA = new Date(a?.DATA_HORA || 0).getTime() || 0;
      const dataB = new Date(b?.DATA_HORA || 0).getTime() || 0;

      return obterOrdemHistoricoGeralAtual() === "asc"
        ? dataA - dataB
        : dataB - dataA;
    }

    function definirFiltroHistoricoGeral(tipo, inicio = "", fim = "") {
      window.filtroHistoricoGeralAtual = { tipo, inicio, fim };
      limiteHistoricoGeralAtual = preferenciasSistema.limiteRelatorios || 30;
      sincronizarCamposFiltroHistoricoGeral();
      renderizarHistoricoGeral();
    }

    function sincronizarCamposFiltroHistoricoGeral() {
      const filtro = obterFiltroHistoricoGeralAtual();
      const ordem = obterOrdemHistoricoGeralAtual();

      document.querySelectorAll("[data-filtro-historico]").forEach(botao => {
        botao.classList.toggle("ativo", botao.dataset.filtroHistorico === filtro.tipo);
      });

      document.querySelectorAll("[data-ordem-historico]").forEach(botao => {
        botao.classList.toggle("ativo", botao.dataset.ordemHistorico === ordem);
      });

      const boxPersonalizado = document.getElementById("camposFiltroHistoricoPersonalizado");
      if (boxPersonalizado) {
        boxPersonalizado.classList.toggle("visivel", filtro.tipo === "personalizado");
      }

      const campoInicio = document.getElementById("filtroHistoricoInicio");
      const campoFim = document.getElementById("filtroHistoricoFim");
      const campoBusca = document.getElementById("buscaHistoricoGeral");

      if (campoInicio) campoInicio.value = filtro.inicio || "";
      if (campoFim) campoFim.value = filtro.fim || "";
      if (campoBusca && campoBusca.value !== obterTermoBuscaHistoricoGeral()) {
        campoBusca.value = obterTermoBuscaHistoricoGeral();
      }
    }

    function itemDentroFiltroHistoricoGeral(item) {
      const filtro = obterFiltroHistoricoGeralAtual();
      if (!item || !item.DATA_HORA) return false;
      if (!filtro || filtro.tipo === "todos") return true;

      const dataItem = new Date(item.DATA_HORA);
      if (Number.isNaN(dataItem.getTime())) return false;

      const inicio = dataInputParaInicio(filtro.inicio);
      const fim = dataInputParaFim(filtro.fim);

      if (inicio && dataItem < inicio) return false;
      if (fim && dataItem > fim) return false;

      return true;
    }

    function itemDentroBuscaHistoricoGeral(item) {
      const termo = normalizarBuscaHistoricoGeral(obterTermoBuscaHistoricoGeral());
      if (!termo) return true;

      const texto = [
        item.ARQUIVO,
        item.USUARIO_NOME,
        item.USUARIO_EMAIL,
        item.ACAO,
        formatarAcaoHistorico(item.ACAO || ""),
        item.OBSERVACAO,
        item.ARQUIVO_ID,
        item.DATA_HORA,
        formatarData(item.DATA_HORA)
      ].map(normalizarBuscaHistoricoGeral).join(" ");

      return texto.includes(termo);
    }

    function montarResumoFiltroHistoricoGeral(totalFiltrado, totalGeral, totalAposData) {
      const filtro = obterFiltroHistoricoGeralAtual();
      const termo = obterTermoBuscaHistoricoGeral();
      const ordem = obterOrdemHistoricoGeralAtual();
      const totalBase = typeof totalAposData === "number" ? totalAposData : totalFiltrado;
      const textoOrdem = ordem === "asc" ? "mais antigos primeiro" : "mais recentes primeiro";

      let resumoPeriodo = "";

      if (!totalGeral) {
        resumoPeriodo = "Nenhum histórico carregado.";
      } else if (!filtro || filtro.tipo === "todos") {
        resumoPeriodo = `Registros carregados: ${totalBase} registro(s).`;
      } else if (filtro.tipo === "hoje") {
        resumoPeriodo = `Hoje: ${totalBase} de ${totalGeral} registro(s) carregado(s).`;
      } else if (filtro.tipo === "7dias") {
        resumoPeriodo = `Últimos 7 dias: ${totalBase} de ${totalGeral} registro(s) carregado(s).`;
      } else if (filtro.tipo === "30dias") {
        resumoPeriodo = `Últimos 30 dias: ${totalBase} de ${totalGeral} registro(s) carregado(s).`;
      } else {
        const partes = [];
        if (filtro.inicio) partes.push(`de ${filtro.inicio.split("-").reverse().join("/")}`);
        if (filtro.fim) partes.push(`até ${filtro.fim.split("-").reverse().join("/")}`);
        resumoPeriodo = `Período ${partes.join(" ")}: ${totalBase} de ${totalGeral} registro(s) carregado(s).`;
      }

      if (proximaPaginaHistoricoGeral) resumoPeriodo += " Há mais registros disponíveis no SharePoint.";

      if (termo) {
        return `${resumoPeriodo} Busca: ${totalFiltrado} resultado(s), ${textoOrdem}.`;
      }

      return `${resumoPeriodo} Ordem: ${textoOrdem}.`;
    }

    window.filtrarHistoricoGeralPeriodo = function (tipo, event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      const hoje = new Date();
      const fim = formatarInputDataLocal(hoje);
      const inicio = new Date(hoje);

      if (tipo === "todos") {
        definirFiltroHistoricoGeral("todos", "", "");
        return;
      }

      if (tipo === "hoje") {
        definirFiltroHistoricoGeral("hoje", fim, fim);
        return;
      }

      if (tipo === "7dias") {
        inicio.setDate(inicio.getDate() - 6);
        definirFiltroHistoricoGeral("7dias", formatarInputDataLocal(inicio), fim);
        return;
      }

      if (tipo === "30dias") {
        inicio.setDate(inicio.getDate() - 29);
        definirFiltroHistoricoGeral("30dias", formatarInputDataLocal(inicio), fim);
        return;
      }

      if (tipo === "personalizado") {
        const atual = obterFiltroHistoricoGeralAtual();
        window.filtroHistoricoGeralAtual = {
          tipo: "personalizado",
          inicio: atual.inicio || "",
          fim: atual.fim || ""
        };
        sincronizarCamposFiltroHistoricoGeral();
      }
    };

    window.aplicarFiltroHistoricoGeralPersonalizado = function (event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      let inicio = document.getElementById("filtroHistoricoInicio")?.value || "";
      let fim = document.getElementById("filtroHistoricoFim")?.value || "";

      if (inicio && fim && dataInputParaInicio(inicio) > dataInputParaFim(fim)) {
        const temporario = inicio;
        inicio = fim;
        fim = temporario;
      }

      definirFiltroHistoricoGeral("personalizado", inicio, fim);
    };

    window.atualizarBuscaHistoricoGeral = function (event) {
      if (event) {
        event.stopPropagation();
      }

      window.termoBuscaHistoricoGeralAtual = event?.target?.value || "";
      limiteHistoricoGeralAtual = preferenciasSistema.limiteRelatorios || 30;
      renderizarHistoricoGeral();
    };

    window.alterarOrdemHistoricoGeral = function (ordem, event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      window.ordemHistoricoGeralAtual = ordem === "asc" ? "asc" : "desc";
      limiteHistoricoGeralAtual = preferenciasSistema.limiteRelatorios || 30;
      sincronizarCamposFiltroHistoricoGeral();
      renderizarHistoricoGeral();
    };

    function renderizarHistoricoGeral() {
      const caixa = document.getElementById("listaHistoricoGeral");
      if (!caixa) return;

      sincronizarCamposFiltroHistoricoGeral();

      if (!historicoCarregado.length) {
        if (historicoGeralCarregando) {
          caixa.innerHTML = "<p>Carregando a primeira página do histórico...</p>";
        } else if (historicoGeralInicializado) {
          caixa.innerHTML = "<p>Nenhum registro de histórico disponível.</p>";
        } else {
          caixa.innerHTML = "<p>O histórico será consultado somente quando necessário.</p>";
        }
        return;
      }

      const ordenados = obterHistoricoOrdenado(obterOrdemHistoricoGeralAtual());

      const filtradosPorData = ordenados.filter(itemDentroFiltroHistoricoGeral);
      const filtrados = filtradosPorData.filter(itemDentroBuscaHistoricoGeral);

      const limite = limiteHistoricoGeralAtual || preferenciasSistema.limiteRelatorios || 30;
      const exibidos = filtrados.slice(0, limite);

      const resumo = document.getElementById("resumoFiltroHistoricoGeral");
      if (resumo) {
        resumo.textContent = montarResumoFiltroHistoricoGeral(filtrados.length, ordenados.length, filtradosPorData.length);
      }

      if (!filtrados.length) {
        caixa.innerHTML = "<p class=\"historicoSemResultado\">Nenhuma alteração encontrada com esses filtros.</p>";
        return;
      }

      const itensHtml = exibidos.map(item => {
        const acao = item.ACAO || "MOVIMENTOU";
        const data = formatarData(item.DATA_HORA);
        const arquivo = item.ARQUIVO || "Arquivo nao informado";
        const usuario = item.USUARIO_NOME || item.USUARIO_EMAIL || "Usuário não informado";
        const observacao = item.OBSERVACAO || "";
        const detalhesHtml = montarHistoricoFormatado(acao, observacao, escaparHtml);

        return `
          <div class="itemHistoricoGeral historicoGeralCompacto historicoGeralSuperCompacto">
            <strong class="arquivoHistoricoGeralTitulo">${escaparHtml(arquivo)}</strong>
            <div class="linhaAcaoHistoricoGeral">
              <span class="acaoHistoricoGeralChip">${escaparHtml(formatarAcaoHistorico(acao))}</span>
              <span class="dataHistoricoGeralCard">${escaparHtml(data)}</span>
            </div>
            <div class="usuarioHistoricoGeralCard">${escaparHtml(usuario)}</div>
            ${detalhesHtml}
          </div>
        `;
      }).join("");

      const temMaisCarregados = filtrados.length > exibidos.length;
      const temMaisNoSharePoint = Boolean(proximaPaginaHistoricoGeral);
      const botaoMais = temMaisCarregados || temMaisNoSharePoint ? `
        <button class="secundario ignorarHoverGlobal hoverSecundarioNeutro btnVerMaisHistoricoGeral" type="button" data-acao-historico="ver-mais"${historicoGeralCarregando ? " disabled" : ""}>${historicoGeralCarregando ? "Carregando..." : temMaisNoSharePoint ? "Carregar mais registros" : "Ver mais"}</button>
      ` : "";

      caixa.innerHTML = itensHtml + botaoMais;
    }
    /* JS_FILTRO_DATAS_HISTORICO_GERAL_FIM */
function abrirPainelDashboard(titulo, conteudoHtml, opcoes = {}) {
      const painel = document.getElementById("painelDashboard");
      const tituloEl = document.getElementById("painelDashboardTitulo");
      const conteudo = document.getElementById("painelDashboardConteudo");
      if (!painel || !tituloEl || !conteudo) return;

      tituloEl.textContent = titulo || "Detalhes";
      if (opcoes.htmlInternoConfiavel === true) {
        // Segurança: usar apenas com HTML fixo/controlado pelo sistema; dados externos devem ser escapados antes.
        conteudo.innerHTML = conteudoHtml || "";
      } else {
        conteudo.textContent = conteudoHtml || "";
      }
      conteudo.scrollTop = 0;
      painel.classList.add("aberto");
      marcarCamadaAbertaAcessivel("painelDashboard", "#painelDashboardTitulo");
      registrarCamadaHistoricoMobile();
    }

    window.fecharPainelDashboard = function () {
      document.getElementById("painelDashboard")?.classList.remove("aberto");
      marcarCamadaFechadaAcessivel("painelDashboard");
    };

    window.abrirRelatoriosAdministrativos = function () {
      const secao = document.getElementById("centralRelatorios");
      if (!secao) return;
      secao.classList.toggle("aberta");
      if (secao.classList.contains("aberta")) {
        renderizarRelatoriosAdministrativos();
        if (!dadosApoioCarregados && !dadosApoioCarregando) {
          agendarTarefaSegundoPlano(async () => {
            await carregarDadosDeApoio();
            renderizarRelatoriosAdministrativos();
          }, 80);
        }
        secao.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    function renderizarRelatoriosAdministrativos() {
      const caixa = document.getElementById("listaRelatorios");
      if (!caixa) return;

      const porGaveta = new Map();
      documentosAtivos.forEach(doc => {
        const gaveta = chaveGaveta(doc.gaveta);
        porGaveta.set(gaveta, (porGaveta.get(gaveta) || 0) + 1);
      });

      const idsDuplicidade = obterIdsDuplicidadePendente();
      const historicoParcialDisponivel = historicoCarregado.length > 0;
      const recentesEnviados = historicoParcialDisponivel ? documentosAtivos.filter(documentoEnviadoRecentemente).length : null;
      const recentesAlterados = documentosAtivos.filter(documentoAlteradoRecentemente).length;
      const usuarios = new Map();
      historicoCarregado.forEach(item => {
        const usuario = item.USUARIO_NOME || item.USUARIO_EMAIL || "Usuário não informado";
        usuarios.set(usuario, (usuarios.get(usuario) || 0) + 1);
      });

      const linhasGaveta = [...porGaveta.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
        .map(([gaveta, total]) => `<li>${escaparHtml(gaveta)}: ${total}</li>`)
        .join("");

      const linhasUsuarios = [...usuarios.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([usuario, total]) => `<li>${escaparHtml(usuario)}: ${total}</li>`)
        .join("");

      caixa.innerHTML = `
        <div class="relatorioCard"><strong>Documentos por gaveta</strong><ul>${linhasGaveta || "<li>Sem dados carregados.</li>"}</ul></div>
        <div class="relatorioCard"><strong>Documentos sem gaveta</strong><span>${documentosAtivos.filter(doc => chaveGaveta(doc.gaveta) === "Gaveta nao informada").length}</span></div>
        <div class="relatorioCard"><strong>Arquivos na Lixeira</strong><span>${documentosLixeira.length}</span></div>
        <div class="relatorioCard"><strong>Duplicidades pendentes</strong><span>${idsDuplicidade.size}</span></div>
        <div class="relatorioCard"><strong>Pessoas diferentes</strong><span>${paresDuplicidadesIgnoradosDetalhes.length || paresDuplicidadesIgnorados.size}</span></div>
        <div class="relatorioCard"><strong>Arquivos com anotações</strong><span>${anotacoesCarregadas.filter(item => (item.ANOTACAO || "").trim()).length}</span></div>
        <div class="relatorioCard"><strong>Enviados recentemente (histórico carregado)</strong><span>${recentesEnviados ?? "—"}</span></div>
        <div class="relatorioCard"><strong>Alterados recentemente</strong><span>${recentesAlterados}</span></div>
        <div class="relatorioCard"><strong>Histórico carregado por usuário</strong><ul>${linhasUsuarios || "<li>Histórico ainda não carregado.</li>"}</ul></div>
      `;
    }

    window.copiarRelatorioAdministrativo = async function () {
      const texto = document.getElementById("listaRelatorios")?.innerText || "";
      if (!texto.trim()) {
        mostrarMensagem("Abra os relatórios antes de copiar.", "erro");
        return;
      }

      try {
        await navigator.clipboard.writeText(texto);
        mostrarMensagem("Relatório copiado.");
      } catch {
        mostrarMensagem("Não foi possível copiar o relatório automaticamente.", "erro");
      }
    };

    function aplicarListaAtual() {
      const termoBuscaAtual = normalizarTexto(document.getElementById("campoBusca")?.value || "");
      documentosCarregados = modoListaAtual === "na Lixeira"
        ? documentosLixeira
        : modoListaAtual === "recentes"
          ? montarDocumentosRecentes({ limitado: !termoBuscaAtual })
          : documentosAtivos;

      atualizarBotoesModoLista();
      renderizarGavetasAtivos();
      filtrarDocumentos();
      atualizarDashboard();
    }

    window.mostrarDocumentosRecentes = function () {
      modoListaAtual = "recentes";
      document.getElementById("campoBusca").value = "";
      fecharPainel();
      aplicarListaAtual();
    };

    window.mostrarDocumentosAtivos = function () {
      modoListaAtual = "ativos";
      document.getElementById("campoBusca").value = "";
      fecharPainel();
      aplicarListaAtual();
    };

    window.mostrarDocumentosLixeira = function () {
      modoListaAtual = "na Lixeira";
      document.getElementById("campoBusca").value = "";
      fecharPainel();
      aplicarListaAtual();
    };

    let paresDuplicidadesIgnorados = new Set();
    let paresDuplicidadesIgnoradosDetalhes = [];
    let carregouIgnoradosDuplicidade = false;
    let centralDuplicidadesAberta = false;
    let centralDuplicidadesAnalisada = false;
    let tarefaCentralDuplicidadesAgendada = false;
    let totalParesCentralDuplicidades = 0;
    let cacheParesDuplicidades = { assinatura: "", pares: [] };
    const LIMITE_ANALISE_DUPLICIDADES_EXAUSTIVA = 120;
    const LIMITE_GRUPO_DUPLICIDADE = 80;
    const LIMITE_GRUPO_DUPLICIDADE_EXATA = 120;
    const LIMITE_PARES_CANDIDATOS_DUPLICIDADE = 12000;
    const TAMANHO_PAGINA_DOCUMENTOS = 100;
    let quantidadeDocumentosVisiveis = TAMANHO_PAGINA_DOCUMENTOS;
    let documentosFiltradosAtuais = [];
    const termosComunsDuplicidade = new Set([
      "aluno", "aluna", "arquivo", "arquivos", "digital", "documento", "documentos",
      "escola", "escolar", "historico", "matricula", "declaracao", "comprovante",
      "certidao", "ficha", "relatorio", "prova", "atividade", "boletim"
    ]);

    function chaveIgnorarDuplicidade(idA, idB) {
      return [idA, idB].sort().join("|");
    }

    function limparCacheDuplicidades() {
      cacheParesDuplicidades = { assinatura: "", pares: [] };
      cacheMapaNomesVisuaisRepetidos = { assinatura: "", mapa: new Map() };
      cacheMapaNomesVisuaisTodosDocumentos = { versao: -1, mapa: new Map() };
      centralDuplicidadesAnalisada = false;
      tokenAnaliseCentralDuplicidades++;
    }

    async function carregarParesDuplicidadeIgnorados() {
      if (carregouIgnoradosDuplicidade) return;

      try {
        const token = await obterToken();
        const alertasSistemaListId = "9abdb5fc-c009-4a59-9f91-03677b001b56";
        const url = montarUrlItensLista(
          CONFIG.siteId,
          alertasSistemaListId,
          ["Title", "ARQUIVO_ID", "TIPO_ALERTA", "STATUS", "DATA_ALERTA", "OBSERVACAO"],
          { filtro: filtroCamposIguais({ STATUS: "IGNORADO", TIPO_ALERTA: "DUPLICADO" }), top: 200 }
        );

        const resposta = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!resposta.ok) {
          logger.warn("Não foi possível carregar pares ignorados.", await resposta.text());
          return;
        }

        const dados = await resposta.json();

        const ignorados = (dados.value || [])
          .map(item => ({
            itemId: item.id,
            fields: item.fields || {}
          }))
          .filter(item => item.fields.ARQUIVO_ID && item.fields.ARQUIVO_ID.includes("|"));

        paresDuplicidadesIgnorados = new Set(
          ignorados.map(item => item.fields.ARQUIVO_ID)
        );

        paresDuplicidadesIgnoradosDetalhes = ignorados
          .map(item => {
            const nomes = extrairNomesParIgnorado(item.fields);

            return {
              itemId: item.itemId,
              chave: item.fields.ARQUIVO_ID,
              nomeA: nomes[0],
              nomeB: nomes[1],
              data: item.fields.DATA_ALERTA || ""
            };
          })
          .sort((a, b) => (b.data || "").localeCompare(a.data || ""));

        carregouIgnoradosDuplicidade = true;
        renderizarParesIgnoradosDuplicidade();
      } catch (erro) {
        logger.warn("Erro ao carregar pares ignorados:", erro);
      }
    }

    function extrairNomesParIgnorado(fields) {
      const observacao = fields.OBSERVACAO || "";
      const titulo = fields.Title || "";
      const texto = observacao.includes(":")
        ? observacao.split(":").slice(1).join(":")
        : titulo.replace(/^PESSOAS DIFERENTES:\s*/i, "");

      const partes = texto
        .split(/\s+\|\s+|\s+\/\s+/)
        .map(parte => parte.trim())
        .filter(Boolean);

      return [
        partes[0] || "Arquivo não identificado",
        partes[1] || "Arquivo não identificado"
      ];
    }

    window.marcarPessoasDiferentesCentral = async function (idA, idB) {
      const todos = [...documentosAtivos, ...documentosLixeira];
      const a = todos.find(doc => doc.id === idA);
      const b = todos.find(doc => doc.id === idB);

      if (!a || !b) {
        mostrarMensagem("Não foi possível localizar os dois arquivos.", "erro");
        return;
      }

      const confirmar = confirm(`Confirmar que estes arquivos são de pessoas diferentes?\n\n${a.nome}\n${b.nome}\n\nDepois disso, este par deixará de aparecer na Central de Duplicidades.`);
      if (!confirmar) return;

      try {
        const token = await obterToken();
        const alertasSistemaListId = "9abdb5fc-c009-4a59-9f91-03677b001b56";
        const chave = chaveIgnorarDuplicidade(idA, idB);
        const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${alertasSistemaListId}/items`;

        const corpo = {
          fields: {
            Title: `PESSOAS DIFERENTES: ${a.nome} / ${b.nome}`,
            ARQUIVO_ID: chave,
            TIPO_ALERTA: "DUPLICADO",
            STATUS: "IGNORADO",
            DATA_ALERTA: new Date().toISOString(),
            OBSERVACAO: `Marcado como pessoas diferentes: ${a.nome} | ${b.nome}`
          }
        };

        const resposta = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(corpo)
        });

        if (!resposta.ok) {
          throw new Error(await resposta.text());
        }

        const itemCriado = await resposta.json().catch(() => ({}));
        paresDuplicidadesIgnorados.add(chave);
        paresDuplicidadesIgnoradosDetalhes = [
          {
            itemId: itemCriado.id || "",
            chave,
            nomeA: a.nome,
            nomeB: b.nome,
            data: corpo.fields.DATA_ALERTA
          },
          ...paresDuplicidadesIgnoradosDetalhes.filter(item => item.chave !== chave)
        ];
        carregouIgnoradosDuplicidade = true;
        renderizarParesIgnoradosDuplicidade();
        limparCacheDuplicidades();
        mostrarMensagem("Par marcado como pessoas diferentes.");

        if (typeof atualizarCentralDuplicidades === "function") {
          await atualizarCentralDuplicidades();
        }
      } catch (erro) {
        logger.error(erro);
        mostrarMensagem("Não foi possível salvar esta marcação. Tente novamente.", "erro");
      }
    };

    function renderizarParesIgnoradosDuplicidade() {
      const caixa = document.getElementById("listaParesIgnoradosDuplicidade");
      atualizarCardParesIgnorados();
      if (!caixa) return;

      if (!paresDuplicidadesIgnoradosDetalhes.length) {
        caixa.innerHTML = '<div class="duplicidadeIgnoradaVazia">Nenhum par marcado como pessoas diferentes.</div>';
        return;
      }

      caixa.innerHTML = `
        <div class="duplicidadeIgnoradaTopo">
          <span>${paresDuplicidadesIgnoradosDetalhes.length} par(es) ignorado(s)</span>
          <button type="button" data-acao-duplicidade="desfazer-todos">Desfazer todos</button>
        </div>
      ` + paresDuplicidadesIgnoradosDetalhes.map(item => `
        <div class="duplicidadeIgnorada">
          <div>
            <strong>${textoSeguroCentral(item.nomeA)}</strong>
            <span>${textoSeguroCentral(item.nomeB)}</span>
          </div>
          <button type="button" data-acao-duplicidade="desfazer-pessoas-diferentes" data-item-id="${atributoSeguroCentral(item.itemId)}" data-chave="${atributoSeguroCentral(item.chave)}">Desfazer</button>
        </div>
      `).join("");
    }

    async function desfazerParPessoasDiferentes(itemId) {
      const token = await obterToken();
      const alertasSistemaListId = "9abdb5fc-c009-4a59-9f91-03677b001b56";
      const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${alertasSistemaListId}/items/${itemId}/fields`;

      const resposta = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          STATUS: "ATIVO",
          OBSERVACAO: "Marcacao de pessoas diferentes desfeita."
        })
      });

      if (!resposta.ok) {
        throw new Error(await resposta.text());
      }
    }

    window.desfazerPessoasDiferentesCentral = async function (itemId, chave) {
      if (!itemId || !chave) {
        mostrarMensagem("Não foi possível identificar este par.", "erro");
        return;
      }

      const confirmar = confirm("Desfazer a marcação de pessoas diferentes?\n\nEste par poderá aparecer novamente na Central de Duplicidades se ainda for suspeito.");
      if (!confirmar) return;

      try {
        await desfazerParPessoasDiferentes(itemId);

        paresDuplicidadesIgnorados.delete(chave);
        paresDuplicidadesIgnoradosDetalhes = paresDuplicidadesIgnoradosDetalhes
          .filter(item => item.chave !== chave);
        carregouIgnoradosDuplicidade = false;
        limparCacheDuplicidades();

        mostrarMensagem("Marcação desfeita. A Central foi atualizada.");

        atualizarCentralDuplicidadesSegundoPlano();
      } catch (erro) {
        logger.error(erro);
        mostrarMensagem("Não foi possível desfazer a marcação. Tente novamente.", "erro");
      }
    };

    window.desfazerTodosParesPessoasDiferentesCentral = async function () {
      if (!paresDuplicidadesIgnoradosDetalhes.length) {
        mostrarMensagem("Nenhum par marcado como pessoas diferentes.");
        return;
      }

      const total = paresDuplicidadesIgnoradosDetalhes.length;
      const confirmar = confirm(`Desfazer todos os ${total} par(es) marcados como pessoas diferentes?\n\nEles poderão aparecer novamente na Central de Duplicidades se ainda forem suspeitos.`);
      if (!confirmar) return;

      try {
        mostrarMensagem("Desfazendo marcações. Aguarde...");

        const itens = [...paresDuplicidadesIgnoradosDetalhes];
        for (const item of itens) {
          await desfazerParPessoasDiferentes(item.itemId);
        }

        paresDuplicidadesIgnorados.clear();
        paresDuplicidadesIgnoradosDetalhes = [];
        carregouIgnoradosDuplicidade = false;
        limparCacheDuplicidades();

        mostrarMensagem("Todas as marcações foram desfeitas. A Central foi atualizada.");

        if (typeof atualizarCentralDuplicidades === "function") {
          await atualizarCentralDuplicidades();
        }
      } catch (erro) {
        logger.error(erro);
        carregouIgnoradosDuplicidade = false;
        mostrarMensagem("Não foi possível desfazer todas as marcações. Atualize a análise e confira os pares restantes.", "erro");

        if (typeof atualizarCentralDuplicidades === "function") {
          await atualizarCentralDuplicidades();
        }
      }
    };

    function pontuacaoDuplicidadeCentral(nomeA, nomeB) {
      if (typeof calcularPontuacaoNomes === "function") {
        return calcularPontuacaoNomes(nomeA, nomeB);
      }

      const limpar = nome => normalizarTexto(nome).replace(/\.pdf$/i, "").trim();
      const a = limpar(nomeA);
      const b = limpar(nomeB);

      if (!a || !b) return 0;
      if (a === b) return 10;
      if (a.includes(b) || b.includes(a)) return 5;

      const palavrasA = a.split(/[^a-z0-9]+/).filter(p => p.length >= 3);
      const palavrasB = b.split(/[^a-z0-9]+/).filter(p => p.length >= 3);
      return palavrasA.filter(p => palavrasB.includes(p)).length;
    }

    function textoSeguroCentral(valor) {
      const div = document.createElement("div");
      div.textContent = (valor || "").toString();
      return div.innerHTML;
    }

    function atributoSeguroCentral(valor) {
      return textoSeguroCentral(valor).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function assinaturaDuplicidades(todos) {
      const docs = todos
        .map(doc => `${doc.id}:${doc.nome}:${doc.status || ""}:${doc.modificado || ""}`)
        .sort()
        .join("||");
      const ignorados = [...paresDuplicidadesIgnorados].sort().join("|");
      return `${docs}::${ignorados}`;
    }

    function prepararDocumentoDuplicidade(doc, indice) {
      const normal = nomeNormalSemPdf(doc.nome);
      const compacto = normal.replace(/[^a-z0-9]+/g, "");
      const palavras = obterPalavrasNome(doc.nome);
      const palavrasChave = palavras
        .filter(palavra =>
          palavra &&
          palavra.length >= 3 &&
          !termosComunsDuplicidade.has(palavra) &&
          !/^\d+$/.test(palavra)
        );

      return {
        doc,
        indice,
        normal,
        compacto,
        palavras,
        palavrasChave: [...new Set(palavrasChave)]
      };
    }

    function adicionarGrupoDuplicidade(mapa, chave, item) {
      if (!chave) return;
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave).push(item);
    }

    function adicionarParCandidatoDuplicidade(mapa, a, b) {
      if (!a || !b || a.doc.id === b.doc.id) return;
      const chave = chaveIgnorarDuplicidade(a.doc.id, b.doc.id);
      if (paresDuplicidadesIgnorados.has(chave) || mapa.has(chave)) return;
      mapa.set(chave, [a.doc, b.doc]);
    }

    function avaliarParDuplicidade(a, b) {
      if (!a || !b || !a.id || !b.id || a.id === b.id) return null;

      const chave = chaveIgnorarDuplicidade(a.id, b.id);
      if (paresDuplicidadesIgnorados.has(chave)) return null;

      const pontos = pontuacaoDuplicidadeCentral(a.nome, b.nome);
      if (!deveExibirNomeParecido(a.nome, b.nome, pontos)) return null;

      const nomeA = nomeNormalSemPdf(a.nome);
      const nomeB = nomeNormalSemPdf(b.nome);
      const mesmoNome = nomeA === nomeB;

      return {
        a,
        b,
        pontos: mesmoNome ? pontos + 10 : pontos,
        mesmoNome
      };
    }

    function ordenarParesDuplicidades(pares) {
      return pares
        .sort((x, y) => y.pontos - x.pontos || x.a.nome.localeCompare(y.a.nome))
        .slice(0, 50);
    }

    function gerarParesDuplicidadesExaustivo(todos) {
      const pares = [];

      for (let i = 0; i < todos.length; i++) {
        for (let j = i + 1; j < todos.length; j++) {
          const par = avaliarParDuplicidade(todos[i], todos[j]);
          if (par) pares.push(par);
        }
      }

      return ordenarParesDuplicidades(pares);
    }

    function gerarParesDuplicidadesIndexado(todos) {
      const preparados = todos.map(prepararDocumentoDuplicidade);
      const grupos = new Map();
      const candidatos = new Map();

      preparados.forEach(item => {
        if (item.compacto) {
          adicionarGrupoDuplicidade(grupos, `compacto:${item.compacto}`, item);
        }

        item.palavrasChave.forEach(palavra => {
          adicionarGrupoDuplicidade(grupos, `palavra:${palavra}`, item);

          if (palavra.length >= 5) {
            adicionarGrupoDuplicidade(grupos, `prefixo:${palavra.slice(0, 4)}`, item);
          }
        });

        if (item.palavrasChave.length >= 2) {
          const chaveDupla = [item.palavrasChave[0], item.palavrasChave[1]].sort().join("|");
          adicionarGrupoDuplicidade(grupos, `dupla:${chaveDupla}`, item);
        }
      });

      for (const [chaveGrupo, grupoOriginal] of grupos.entries()) {
        const limiteGrupo = chaveGrupo.startsWith("compacto:")
          ? LIMITE_GRUPO_DUPLICIDADE_EXATA
          : LIMITE_GRUPO_DUPLICIDADE;
        const grupo = grupoOriginal.slice(0, limiteGrupo);

        if (grupo.length < 2 || (!chaveGrupo.startsWith("compacto:") && grupoOriginal.length > limiteGrupo)) {
          continue;
        }

        for (let i = 0; i < grupo.length; i++) {
          for (let j = i + 1; j < grupo.length; j++) {
            adicionarParCandidatoDuplicidade(candidatos, grupo[i], grupo[j]);
            if (candidatos.size >= LIMITE_PARES_CANDIDATOS_DUPLICIDADE) break;
          }
          if (candidatos.size >= LIMITE_PARES_CANDIDATOS_DUPLICIDADE) break;
        }

        if (candidatos.size >= LIMITE_PARES_CANDIDATOS_DUPLICIDADE) break;
      }

      const pares = [];
      candidatos.forEach(([a, b]) => {
        const par = avaliarParDuplicidade(a, b);
        if (par) pares.push(par);
      });

      return ordenarParesDuplicidades(pares);
    }

    function gerarParesDuplicidades() {
      const todos = [...documentosAtivos]
        .filter(doc => doc && doc.nome && doc.id);
      const assinatura = assinaturaDuplicidades(todos);

      if (cacheParesDuplicidades.assinatura === assinatura) {
        return cacheParesDuplicidades.pares;
      }

      const pares = todos.length <= LIMITE_ANALISE_DUPLICIDADES_EXAUSTIVA
        ? gerarParesDuplicidadesExaustivo(todos)
        : gerarParesDuplicidadesIndexado(todos);

      cacheParesDuplicidades = { assinatura, pares };
      centralDuplicidadesAnalisada = true;
      return pares;
    }

    function aplicarEstadoVisualCentralDuplicidades(quantidadePares) {
      const central = document.getElementById("centralDuplicidades");
      const caixa = document.getElementById("listaCentralDuplicidades");
      if (!central || !caixa) {
        return;
      }

      central.classList.toggle("discreta", quantidadePares === 0);
      central.classList.toggle("comAlerta", quantidadePares > 0);
      central.classList.toggle("centralFechada", quantidadePares > 0 && !centralDuplicidadesAberta);
      caixa.style.display = quantidadePares > 0 && centralDuplicidadesAberta ? "grid" : "none";
    }

    function atualizarCentralDuplicidadesSegundoPlano() {
      if (duplicidadesCarregando || tarefaCentralDuplicidadesAgendada) {
        return;
      }

      const resumo = document.getElementById("resumoCentralDuplicidades");
      if (resumo) {
        resumo.textContent = "Analisando duplicidades em segundo plano...";
      }

      tarefaCentralDuplicidadesAgendada = true;
      agendarTarefaSegundoPlano(async () => {
        try {
          if (typeof atualizarCentralDuplicidades === "function") {
            await atualizarCentralDuplicidades();
          }
        } finally {
          tarefaCentralDuplicidadesAgendada = false;
        }
      }, 500);
    }

    window.alternarCentralDuplicidades = function () {
      centralDuplicidadesAberta = true;
      aplicarEstadoVisualCentralDuplicidades(totalParesCentralDuplicidades);
      document.getElementById("painelCentralDuplicidades")?.classList.add("aberto");
      marcarCamadaAbertaAcessivel("painelCentralDuplicidades", "#painelCentralDuplicidadesTitulo");
      registrarCamadaHistoricoMobile();

      if (!centralDuplicidadesAnalisada && !duplicidadesCarregando) {
        atualizarCentralDuplicidadesSegundoPlano();
      }
    };

    window.fecharPainelCentralDuplicidades = function () {
      centralDuplicidadesAberta = false;
      aplicarEstadoVisualCentralDuplicidades(totalParesCentralDuplicidades);
      document.getElementById("painelCentralDuplicidades")?.classList.remove("aberto");
      marcarCamadaFechadaAcessivel("painelCentralDuplicidades");
    };

    window.abrirParesIgnoradosDashboard = function () {
      centralDuplicidadesAberta = true;
      aplicarEstadoVisualCentralDuplicidades(totalParesCentralDuplicidades);
      document.getElementById("painelCentralDuplicidades")?.classList.add("aberto");
      marcarCamadaAbertaAcessivel("painelCentralDuplicidades", "#painelCentralDuplicidadesTitulo");
      registrarCamadaHistoricoMobile();

      const detalhes = document.querySelector(".paresIgnoradosDuplicidade");
      if (detalhes) {
        detalhes.open = true;
        setTimeout(() => detalhes.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      }
    };

    window.atualizarCentralDuplicidades = async function () {
      const caixa = document.getElementById("listaCentralDuplicidades");
      const resumo = document.getElementById("resumoCentralDuplicidades");

      if (!caixa || !resumo) {
        return;
      }

      if (duplicidadesCarregando) return;
      duplicidadesCarregando = true;
      const tokenAnalise = ++tokenAnaliseCentralDuplicidades;
      resumo.textContent = "Analisando duplicidades em segundo plano...";

      try {
        await carregarParesDuplicidadeIgnorados();
        if (tokenAnalise !== tokenAnaliseCentralDuplicidades) {
          duplicidadesCarregando = false;
          atualizarCentralDuplicidadesSegundoPlano();
          return;
        }
        renderizarParesIgnoradosDuplicidade();
      } catch (erro) {
        logger.warn("Nao foi possivel atualizar a Central de Duplicidades.", erro);
        resumo.textContent = "Não foi possível atualizar a Central de Duplicidades agora.";
        duplicidadesCarregando = false;
        return;
      }

      await new Promise(resolve => requestAnimationFrame(resolve));
      if (tokenAnalise !== tokenAnaliseCentralDuplicidades) {
        duplicidadesCarregando = false;
        atualizarCentralDuplicidadesSegundoPlano();
        return;
      }

      const pares = gerarParesDuplicidades();
      totalParesCentralDuplicidades = pares.length;
      const mapaNomesCentral = obterMapaNomesVisuaisRepetidosCacheado([...documentosAtivos, ...documentosLixeira]);

      aplicarEstadoVisualCentralDuplicidades(pares.length);

      resumo.textContent = pares.length
        ? `${pares.length} caso(s) suspeito(s). Revise a Central de Duplicidades.`
        : "Nenhuma duplicidade suspeita no momento.";

      if (!pares.length) {
        caixa.innerHTML = "";
        duplicidadesCarregando = false;
        return;
      }

      caixa.innerHTML = pares.map((par, index) => {
        const statusA = par.a.status === "ARQUIVADO" ? "Lixeira" : "Ativo";
        const statusB = par.b.status === "ARQUIVADO" ? "Lixeira" : "Ativo";
        const tagA = par.a.status === "ARQUIVADO" ? "tagArquivado" : "tagAtivo";
        const tagB = par.b.status === "ARQUIVADO" ? "tagArquivado" : "tagAtivo";
        const alerta = par.mesmoNome ? "Mesmo nome" : "Nome parecido";
        const idA = atributoSeguroCentral(par.a.id);
        const idB = atributoSeguroCentral(par.b.id);
        const statusValorA = atributoSeguroCentral(par.a.status);
        const statusValorB = atributoSeguroCentral(par.b.status);

        return `
          <div class="cardDuplicidade">
            <div class="duplicidadeTopo">
              <strong>${alerta}</strong>
              <span>${par.pontos} ponto(s)</span>
            </div>

            <div class="duplicidadeColunas">
              <div class="duplicidadeArquivo">
                <span class="${tagA}">${statusA}</span>
                <strong>${textoSeguroCentral(nomeArquivoVisualLimpo(par.a.nome))}</strong>
                ${seloNomeRepetidoHtmlComMapa(par.a, mapaNomesCentral)}
                <button data-acao-duplicidade="abrir" data-id="${idA}" data-status="${statusValorA}">Abrir no painel</button>
              </div>

              <div class="duplicidadeArquivo">
                <span class="${tagB}">${statusB}</span>
                <strong>${textoSeguroCentral(nomeArquivoVisualLimpo(par.b.nome))}</strong>
                ${seloNomeRepetidoHtmlComMapa(par.b, mapaNomesCentral)}
                <button data-acao-duplicidade="abrir" data-id="${idB}" data-status="${statusValorB}">Abrir no painel</button>
              </div>
            </div>

            <div class="duplicidadeAcoes">
              <button class="btnPessoasDiferentes" data-acao-duplicidade="pessoas-diferentes" data-id-a="${idA}" data-id-b="${idB}">São pessoas diferentes</button>
            </div>
            <small>Revise os dois documentos antes de mover para a Lixeira, substituir ou mesclar.</small>
          </div>
        `;
      }).join("");
      duplicidadesCarregando = false;
    };

    window.abrirArquivoDaCentral = async function (id, status) {
      const todos = [...documentosAtivos, ...documentosLixeira];
      const documento = todos.find(doc => doc.id === id);

      if (!documento) {
        mostrarMensagem("Arquivo não encontrado na lista atual.", "erro");
        return;
      }

      await abrirDocumentoNoPainel(documento);
      document.getElementById("painelLateral")?.scrollTo?.(0, 0);
    };
    async function registrarHistorico(documento, acao, observacao = "") {
      const token = await obterToken();
      const conta = msalInstance.getAllAccounts()[0];
      const arquivoId = obterIdArquivoDocumento(documento);

      const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.historicoAcessosListId}/items`;

      const corpo = {
        fields: {
          Title: documento.nome,
          USUARIO_EMAIL: conta?.username || "",
          ACAO: acao,
          USUARIO_NOME: conta?.name || "",
          DATA_HORA: new Date().toISOString(),
          ARQUIVO_ID: arquivoId,
          OBSERVACAO: observacao
        }
      };

      const resposta = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(corpo)
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(erro);
      }

      const novoItem = await resposta.json();

      historicoCarregado.push({
        ID: novoItem.id,
        ARQUIVO: documento.nome,
        USUARIO_EMAIL: conta?.username || "",
        ACAO: acao,
        USUARIO_NOME: conta?.name || "",
        DATA_HORA: new Date().toISOString(),
        ARQUIVO_ID: arquivoId,
        OBSERVACAO: observacao
      });
      invalidarCacheHistorico();

      atualizarDashboard();
    }

    function limparMotivoHistoricoSeguro(texto) {
      let limpo = (texto || "").toString().trim();

      const padroes = [
        /^Arquivo restaurado da pasta _ARQUIVADOS para a lista principal\.\s*Motivo:\s*/i,
        /^Documento na Lixeira na pasta _ARQUIVADOS\.\s*Motivo:\s*/i,
        /^Arquivo substituído por uma nova versão\.\s*Motivo:\s*/i,
        /^Arquivo substituido por uma nova versao\.\s*Motivo:\s*/i,
        /^Documento aberto pelo botão ABRIR PDF no painel lateral\.\s*/i,
        /^Documento aberto pelo botão Abrir PDF no painel lateral\.\s*/i,
        /^Documento aberto pelo botão ABRIR ARQUIVO no painel lateral\.\s*/i,
        /^Documento aberto pelo sistema Arquivo Digital\.\s*/i,
        /^Motivo:\s*/i
      ];

      padroes.forEach(padrao => {
        limpo = limpo.replace(padrao, "");
      });

      return limpo.trim();
    }

    function limparTextoHistoricoCard(valor) {
      return (valor || "")
        .toString()
        .replace(/\s+/g, " ")
        .replace(/\s*\.\s*$/g, "")
        .trim();
    }

    function extrairCampoHistoricoCard(texto, regex) {
      const encontrado = regex.exec(texto || "");
      return encontrado ? limparTextoHistoricoCard(encontrado[1]) : "";
    }

    function adicionarDetalheHistoricoCard(lista, rotulo, valor) {
      const limpo = nomeArquivoVisualLimpo(limparTextoHistoricoCard(valor));
      if (limpo) {
        lista.push({ rotulo, valor: limpo });
      }
    }

    function montarBlocoDetalhesHistoricoCard(detalhes, esc) {
      if (!detalhes.length) return "";

      return `
        <div class="blocoHistoricoCard detalhesHistoricoCard">
          <span class="tituloBlocoHistorico">Detalhes da ação</span>
          <ul class="listaDetalhesHistorico">
            ${detalhes.map(item => `
              <li>
                <span class="rotuloDetalheHistorico">${esc(item.rotulo)}</span>
                <strong class="valorDetalheHistorico">${esc(item.valor)}</strong>
              </li>
            `).join("")}
          </ul>
        </div>
      `;
    }
    function montarBlocoMotivoHistoricoCard(motivo, esc) {
      const motivoLimpo = limparTextoHistoricoCard(motivo);
      if (!motivoLimpo) return "";

      return `
        <div class="blocoHistoricoCard motivoHistoricoCard">
          <span class="tituloBlocoHistorico">Motivo informado</span>
          <p>${esc(motivoLimpo)}</p>
        </div>
      `;
    }

    function montarHistoricoFormatado(acao, observacao, esc) {
      const acaoNormalizada = (acao || "").toString().trim().toUpperCase();
      const textoOriginal = (observacao || "").toString().trim();
      const textoLimpo = limparMotivoHistoricoSeguro(textoOriginal);
      const detalhes = [];
      let motivo = "";

      if (acaoNormalizada === "ALTEROU_GAVETA") {
        const antesDaGaveta = limparTextoHistoricoCard((textoOriginal.split(/Gaveta anterior:/i)[0] || "").trim());
        if (antesDaGaveta && !/^Motivo:?$/i.test(antesDaGaveta)) {
          adicionarDetalheHistoricoCard(detalhes, "Operação", antesDaGaveta);
        }

        adicionarDetalheHistoricoCard(
          detalhes,
          "Gaveta anterior",
          extrairCampoHistoricoCard(textoOriginal, /Gaveta anterior:\s*(.*?)(?:\.\s*Nova gaveta:|$)/i)
        );

        adicionarDetalheHistoricoCard(
          detalhes,
          "Nova gaveta",
          extrairCampoHistoricoCard(textoOriginal, /Nova gaveta:\s*(.*?)(?:\.\s*Motivo:|$)/i)
        );

        motivo = extrairCampoHistoricoCard(textoOriginal, /Motivo:\s*(.*)$/i);
      } else if (acaoNormalizada === "ENVIOU") {
        const indiceGaveta = textoOriginal.search(/\bGaveta\s*:/i);
        if (indiceGaveta > 0) {
          motivo = limparTextoHistoricoCard(textoOriginal.slice(0, indiceGaveta));
        } else {
          motivo = textoLimpo;
        }

        adicionarDetalheHistoricoCard(
          detalhes,
          "Gaveta",
          extrairCampoHistoricoCard(textoOriginal, /Gaveta:\s*(.*?)(?:\.\s*Nome original:|\.|$)/i)
        );

        adicionarDetalheHistoricoCard(
          detalhes,
          "Nome original",
          extrairCampoHistoricoCard(textoOriginal, /Nome original:\s*(.*?)(?:\.\s*Enviado automaticamente como:|\.|$)/i)
        );

        adicionarDetalheHistoricoCard(
          detalhes,
          "Enviado como",
          extrairCampoHistoricoCard(textoOriginal, /Enviado automaticamente como:\s*(.*?)(?:,\s*para evitar|\.|$)/i)
        );

        adicionarDetalheHistoricoCard(
          detalhes,
          "Conferência automática",
          extrairCampoHistoricoCard(textoOriginal, /Confer[eê]ncia autom[aá]tica:\s*(.*)$/i)
        );
      } else if (acaoNormalizada === "MESCLOU" || acaoNormalizada === "MESCLADO") {
        adicionarDetalheHistoricoCard(
          detalhes,
          "PDF anexado",
          extrairCampoHistoricoCard(textoOriginal, /arquivo local:\s*(.*?)(?:\.\s*Motivo:|$)/i)
        );

        motivo = extrairCampoHistoricoCard(textoOriginal, /Motivo:\s*(.*?)(?:\.\s*$|$)/i);
      } else if (acaoNormalizada === "SUBSTITUIU") {
        adicionarDetalheHistoricoCard(
          detalhes,
          "Arquivo enviado",
          extrairCampoHistoricoCard(textoOriginal, /nova versão enviada:\s*(.*?)(?:\.\s*Tamanho:|$)/i)
        );

        adicionarDetalheHistoricoCard(
          detalhes,
          "Tamanho",
          extrairCampoHistoricoCard(textoOriginal, /Tamanho:\s*(.*?)(?:\.|$)/i)
        );
      } else if (acaoNormalizada === "RENOMEOU") {
        const renomeou = /Arquivo renomeado de "(.+?)" para "(.+?)"/i.exec(textoOriginal || "");
        if (renomeou) {
          adicionarDetalheHistoricoCard(detalhes, "Nome anterior", renomeou[1]);
          adicionarDetalheHistoricoCard(detalhes, "Novo nome", renomeou[2]);
        }

        adicionarDetalheHistoricoCard(
          detalhes,
          "Nome solicitado",
          extrairCampoHistoricoCard(textoOriginal, /porque j[aá] existia "(.+?)"/i)
        );
      } else if (acaoNormalizada === "VISUALIZOU") {
        adicionarDetalheHistoricoCard(detalhes, "Registro", textoLimpo || "Documento aberto pelo botão Abrir PDF.");
      } else {
        motivo = textoLimpo;
      }

      if (!motivo && !detalhes.length && textoLimpo) {
        motivo = textoLimpo;
      }

      return `${montarBlocoDetalhesHistoricoCard(detalhes, esc)}${montarBlocoMotivoHistoricoCard(motivo, esc)}`;
    }

    function formatarAcaoHistorico(acao) {
      const texto = (acao || "").toString().trim();
      if (texto.toUpperCase() === "ARQUIVOU") return "FOI PARA LIXEIRA";
      if (texto.toUpperCase() === "ALTEROU_GAVETA") return "ALTEROU GAVETA";
      if (texto.toUpperCase() === "MESCLADO") return "MESCLADO";
      if (texto.toUpperCase() === "MESCLOU") return "MESCLOU";
      return texto;
    }

    function classeHistoricoPainel(acao) {
      const normalizada = normalizarTexto(formatarAcaoHistorico(acao || ""));
      if (normalizada.includes("visualizou") || normalizada.includes("abriu")) return "historicoAcaoVisualizou";
      if (normalizada.includes("enviou") || normalizada.includes("adicionou")) return "historicoAcaoEnviou";
      if (normalizada.includes("renomeou")) return "historicoAcaoRenomeou";
      if (normalizada.includes("substituiu")) return "historicoAcaoSubstituiu";
      if (normalizada.includes("mescl")) return "historicoAcaoMesclou";
      if (normalizada.includes("lixeira")) return "historicoAcaoLixeira";
      if (normalizada.includes("restaur")) return "historicoAcaoRestaurado";
      if (normalizada.includes("anotacao")) return "historicoAcaoAnotacao";
      return "historicoAcaoNeutra";
    }
    async function carregarHistoricoDocumento(documento, tokenPainel = painelDocumentoTokenAtual) {
      const caixa = document.getElementById("historicoArquivo");
      if (!caixa || !painelAindaMostraDocumento(documento, tokenPainel)) return;

      caixa.innerHTML = montarCarregamentoVisual("Carregando histórico", "Buscando os registros deste documento.", "🕘");

      const esc = (valor) => (valor || "")
        .toString()
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

      const chaveTexto = (valor) => normalizarTexto(valor || "").replace(/\s+/g, " ").trim();

      const renderizarHistoricoDoCache = () => {
        if (!painelAindaMostraDocumento(documento, tokenPainel)) return;
        const anotacoesJaMostradas = new Set();
        const arquivoId = obterIdArquivoDocumento(documento);

        const historicoDocumento = arquivoId
          ? obterHistoricoPorArquivoId().get(arquivoId) || []
          : (historicoCarregado || []).filter(item => historicoPertenceAoDocumento(item, documento));

        const entradasHistorico = historicoDocumento
          .map(item => ({
            tipo: "historico",
            acao: item.ACAO || "",
            data: item.DATA_HORA || "",
            usuario: item.USUARIO_NOME || "",
            email: item.USUARIO_EMAIL || "",
            observacao: item.OBSERVACAO || ""
          }))
          .filter(item => {
            if (item.acao !== "ANOTACAO") return true;

            const chave = chaveTexto(item.observacao);
            if (!chave) return false;

            if (anotacoesJaMostradas.has(chave)) {
              return false;
            }

            anotacoesJaMostradas.add(chave);
            return true;
          });

        const anotacaoDocumento = arquivoId
          ? obterAnotacoesPorArquivoId().get(arquivoId)
          : (anotacoesCarregadas || []).find(item => anotacaoPertenceAoDocumento(item, documento));

        const entradasAnotacao = (anotacaoDocumento ? [anotacaoDocumento] : [])
          .filter(item => (item.ANOTACAO || "").trim())
          .filter(item => {
            const chave = chaveTexto(item.ANOTACAO || "");
            return chave && !anotacoesJaMostradas.has(chave);
          })
          .map(item => ({
            tipo: "anotacaoAtual",
            acao: "ANOTAÇÃO ATUAL",
            data: item.DATA_ATUALIZACAO || "",
            usuario: item.ATUALIZADO_POR || "",
            email: "",
            observacao: item.ANOTACAO || ""
          }));

        const entradas = [...entradasHistorico, ...entradasAnotacao]
          .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

        if (!painelAindaMostraDocumento(documento, tokenPainel)) return;

        if (!entradas.length) {
          caixa.innerHTML = "<p>Nenhum histórico registrado para este arquivo.</p>";
          return;
        }

        caixa.innerHTML = entradas.map(item => {
          const dataFormatada = formatarData(item.data);
          const usuario = item.usuario ? esc(item.usuario) : "";
          const email = item.email ? ` - ${esc(item.email)}` : "";

          if (item.acao === "ANOTACAO" || item.tipo === "anotacaoAtual") {
            return `
              <div class="itemHistorico anotacaoEvento historicoAcaoAnotacao">
                <strong>${esc(item.tipo === "anotacaoAtual" ? "ANOTAÇÃO ATUAL" : "ANOTAÇÃO")}</strong><br>
                <span>${esc(dataFormatada)}</span><br>
                <span>${usuario}${email}</span>
                <div class="motivoHistorico anotacaoHistorico"><strong>Anotação:</strong> ${esc(item.observacao)}</div>
              </div>
            `;
          }

          const usuarioHistorico = usuario || email
            ? `${usuario}${email}`.replace(/^\s+-\s+/, "")
            : "Usuário não informado";
          const historicoFormatado = montarHistoricoFormatado(item.acao, item.observacao || "", esc);
          const classeAcao = classeHistoricoPainel(item.acao);

          return `
            <div class="itemHistorico ${classeAcao}">
              <div class="cabecalhoHistoricoCard">
                <strong class="acaoHistoricoCard">${esc(formatarAcaoHistorico(item.acao))}</strong>
                <span class="dataHistoricoCard">${esc(dataFormatada)}</span>
              </div>
              <div class="usuarioHistoricoCard">${usuarioHistorico}</div>
              ${historicoFormatado}
            </div>
          `;
        }).join("");
      };

      const arquivoId = obterIdArquivoDocumento(documento);
      if (!arquivoId) {
        caixa.innerHTML = '<p class="textoErro">Não foi possível identificar este documento para consultar o histórico.</p>';
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
        atualizarCacheAnotacaoDocumento(anotacaoDireta, arquivoId);
        renderizarHistoricoDoCache();
      } catch (erroConsultaDireta) {
        logger.warn("Consulta direta do histórico do documento falhou.", erroConsultaDireta);
        if (painelAindaMostraDocumento(documento, tokenPainel)) {
          caixa.innerHTML = '<p class="textoErro">Não foi possível carregar o histórico deste documento agora.</p>';
        }
      }
    }
    async function carregarAnotacaoDocumento(documento, tokenPainel = painelDocumentoTokenAtual) {
      const textarea = document.getElementById("campoAnotacao");
      if (!textarea || !painelAindaMostraDocumento(documento, tokenPainel)) return;
      textarea.value = "";
      anotacaoAtualItemId = null;
      anotacaoAtualEtag = "";
      atualizarStatusAnotacao("Carregando anotação...");

      try {
        const arquivoId = obterIdArquivoDocumento(documento);
        let item = null;

        if (arquivoId) {
          const token = await obterToken();
          item = await carregarAnotacaoPorArquivoId(arquivoId, token);
          atualizarCacheAnotacaoDocumento(item, arquivoId);
        } else {
          item = anotacoesCarregadas.find(x => anotacaoPertenceAoDocumento(x, documento));
        }

        if (!painelAindaMostraDocumento(documento, tokenPainel)) return;

        if (item) {
          anotacaoAtualItemId = item.ID;
          anotacaoAtualEtag = item.ETAG || "";
          textarea.value = item.ANOTACAO || "";
          const dataAtualizacao = formatarData(item.DATA_ATUALIZACAO);
          const usuarioAtualizacao = item.ATUALIZADO_POR || "";
          atualizarStatusAnotacao(`Última atualização: ${dataAtualizacao} - ${usuarioAtualizacao}`);
        } else {
          anotacaoUltimoTextoSalvo = "";
          atualizarStatusAnotacao("Nenhuma anotação salva ainda.");
        }

      } catch (erro) {
        logger.error(erro);
        if (painelAindaMostraDocumento(documento, tokenPainel)) {
          atualizarStatusAnotacao("Não foi possível carregar a anotação.");
        }
      }
    }

    async function salvarAnotacaoAgora() {
      if (!documentoSelecionado) {
        atualizarStatusAnotacao("Nenhum documento selecionado.");
        return;
      }

      const texto = document.getElementById("campoAnotacao").value || "";
      const token = await obterToken();
      const conta = msalInstance.getAllAccounts()[0];
      const agora = new Date().toISOString();
      const atualizadoPor = conta?.name || conta?.username || "";
      const textoTentado = texto;
      const arquivoId = obterIdArquivoDocumento(documentoSelecionado);

      const campos = {
        Title: documentoSelecionado.nome,
        ARQUIVO_ID: arquivoId,
        ANOTACAO: texto,
        ATUALIZADO_POR: atualizadoPor,
        DATA_ATUALIZACAO: agora
      };

      if (anotacaoAtualItemId) {
        const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.anotacoesArquivosListId}/items/${anotacaoAtualItemId}/fields`;

        const resposta = await fetch(url, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(anotacaoAtualEtag ? { "If-Match": anotacaoAtualEtag } : {})
          },
          body: JSON.stringify(campos)
        });

        if (!resposta.ok) {
          if (resposta.status === 412) {
            await carregarAnotacaoDocumento(documentoSelecionado);

            const campoAnotacao = document.getElementById("campoAnotacao");
            const textoAtualSharePoint = campoAnotacao?.value || "";
            if (campoAnotacao) {
              campoAnotacao.dataset.textoAtualSharePoint = textoAtualSharePoint;
              campoAnotacao.dataset.textoConflitoAnotacao = textoTentado;
              campoAnotacao.value = textoTentado;
              ajustarAlturaAnotacao();
            }

            atualizarStatusAnotacao("Conflito de edição: outra pessoa salvou uma versão mais recente. Seu texto foi mantido no campo; copie ou revise antes de salvar novamente.");
            const erroConflito = new Error("Conflito de edição na anotação. Outra pessoa salvou uma versão mais recente.");
            erroConflito.conflitoAnotacao = true;
            throw erroConflito;
          }
          throw new Error(await resposta.text());
        }

        const dadosAtualizados = await resposta.json().catch(() => ({}));
        const novoEtag = resposta.headers.get("ETag") || resposta.headers.get("etag") || dadosAtualizados["@odata.etag"] || "";
        const itemLocal = anotacoesCarregadas.find(x => String(x.ID) === String(anotacaoAtualItemId));
        if (itemLocal) {
          if (novoEtag) itemLocal.ETAG = novoEtag;
          itemLocal.ARQUIVO = documentoSelecionado.nome;
          itemLocal.ARQUIVO_ID = arquivoId;
          itemLocal.ANOTACAO = texto;
          itemLocal.ATUALIZADO_POR = atualizadoPor;
          itemLocal.DATA_ATUALIZACAO = agora;
        }
        if (novoEtag) anotacaoAtualEtag = novoEtag;

      } else {
        const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.anotacoesArquivosListId}/items`;

        const resposta = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ fields: campos })
        });

        if (!resposta.ok) {
          throw new Error(await resposta.text());
        }

        const novoItem = await resposta.json();
        anotacaoAtualItemId = novoItem.id;
        anotacaoAtualEtag = novoItem["@odata.etag"] || novoItem.eTag || "";

        anotacoesCarregadas.push({
          ID: novoItem.id,
          ETAG: anotacaoAtualEtag,
          ARQUIVO: documentoSelecionado.nome,
          ARQUIVO_ID: arquivoId,
          ANOTACAO: texto,
          ATUALIZADO_POR: atualizadoPor,
          DATA_ATUALIZACAO: agora
        });
      }

      invalidarCacheAnotacoes();
      atualizarDashboard();
            // Registrar historico de anotacao somente quando o texto mudou
      if (texto !== anotacaoUltimoTextoSalvo) {
        const textoHistorico = texto ? texto : "Anotação removida.";

        try {
          await registrarHistorico(documentoSelecionado, "ANOTACAO", textoHistorico);
          anotacaoUltimoTextoSalvo = texto;

        } catch (erroHistoricoAnotacao) {
          logger.warn("Anotação salva, mas não foi possível registrar no histórico.", erroHistoricoAnotacao);
          anotacaoUltimoTextoSalvo = texto;
        }
      } else {
        anotacaoUltimoTextoSalvo = texto;
      }

      atualizarStatusAnotacao(`Salvo em ${new Date().toLocaleString("pt-BR")}`);

      if (documentoSelecionado) {
        await carregarHistoricoDocumento(documentoSelecionado); // Atualiza histórico após salvar anotação
      }
    }

    window.agendarSalvarAnotacao = function () {
      clearTimeout(timerSalvarAnotacao);
      anotacaoUltimoTextoSalvo = "";
      atualizarStatusAnotacao("Alteração não salva. Clique em Salvar anotação.");
    };

    window.salvarAnotacaoManual = async function () {
      clearTimeout(timerSalvarAnotacao);
      anotacaoUltimoTextoSalvo = "";
      const operacao = iniciarOperacaoCritica("salvar-anotacao", "btnSalvarAnotacaoPainel", "O salvamento da anotação já está em andamento. Aguarde terminar.");
      if (!operacao) return;

      try {
        atualizarStatusAnotacao("Salvando...");
        await salvarAnotacaoAgora();
        mostrarMensagemPainel("Anotação salva.");
      } catch (erro) {
        logger.error(erro);
        if (erro.conflitoAnotacao) {
          mostrarMensagemPainel("Conflito de edição: revise o texto antes de salvar novamente.", "erro");
        } else {
          atualizarStatusAnotacao("Não foi possível salvar a anotação.");
          mostrarMensagemPainel("Não foi possível salvar a anotação. Tente novamente.", "erro");
        }
      } finally {
        finalizarOperacaoCritica(operacao);
      }
    };

    async function obterDriveItemDoDocumento(documento) {
      if (documento.driveItemId && documento.driveId) {
        return {
          id: documento.driveItemId,
          parentReference: { driveId: documento.driveId },
          webUrl: documento.link
        };
      }

      const token = await obterToken();

      const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/items/${documento.listItemId}/driveItem?$select=id,name,parentReference,webUrl`;

      const resposta = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!resposta.ok) {
        throw new Error(await resposta.text());
      }

      const driveItem = await resposta.json();

      documento.driveItemId = driveItem.id || "";
      documento.driveId = driveItem.parentReference?.driveId || "";
      documento.driveWebUrl = driveItem.webUrl || "";

      if (!documento.driveItemId || !documento.driveId) {
        throw new Error("Não foi possível obter o ID técnico do arquivo para renomear.");
      }

      return driveItem;
    }

    window.prepararRenomear = function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Nenhum documento selecionado.", "erro");
        return;
      }

      const nomeSemPdf = documentoSelecionado.nome.replace(/\.pdf$/i, "");
      document.getElementById("boxSubstituir").style.display = "none";
      document.getElementById("boxArquivar").style.display = "none";
      document.getElementById("boxRestaurar").style.display = "none";
      document.getElementById("boxAlterarGaveta").style.display = "none";
      document.getElementById("boxMesclar").style.display = "none";
      document.getElementById("novoNomeArquivo").value = nomeSemPdf;
      document.getElementById("boxRenomear").style.display = "block";
      mostrarMensagemPainel("Confira o novo nome antes de confirmar.");
    };

    window.cancelarRenomear = function () {
      document.getElementById("boxRenomear").style.display = "none";
      document.getElementById("novoNomeArquivo").value = "";
    };

    window.confirmarRenomear = async function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Nenhum documento selecionado.", "erro");
        return;
      }

      const antigoNome = documentoSelecionado.nome;
      const novoNome = sanitizarNomeArquivo(document.getElementById("novoNomeArquivo").value);

      if (!novoNome || novoNome.toLowerCase() === ".pdf") {
        mostrarMensagemPainel("Informe um nome válido para o arquivo.", "erro");
        return;
      }

      if (normalizarTexto(novoNome) === normalizarTexto(antigoNome)) {
        mostrarMensagemPainel("O novo nome é igual ao nome atual.", "erro");
        return;
      }

      const documentosMesmoLocal = documentoSelecionado.status === "ARQUIVADO"
        ? documentosLixeira
        : documentosAtivos;
      const nomesExistentesRenomear = new Set(
        documentosMesmoLocal
          .filter(doc => doc.id !== documentoSelecionado.id)
          .map(doc => normalizarTexto(doc.nome))
      );

      function criarNomeUnicoRenomear(nomeBase) {
        let nomeFinal = nomeBase;

        if (!nomesExistentesRenomear.has(normalizarTexto(nomeFinal))) {
          return nomeFinal;
        }

        const semPdf = nomeBase.replace(/\.pdf$/i, "").trim();
        let contador = 2;

        do {
          nomeFinal = `${semPdf} (${contador}).pdf`;
          contador++;
        } while (nomesExistentesRenomear.has(normalizarTexto(nomeFinal)));

        return nomeFinal;
      }

      const nomeFinalRenomear = criarNomeUnicoRenomear(novoNome);
      const houveAjusteNomeDuplicado = normalizarTexto(nomeFinalRenomear) !== normalizarTexto(novoNome);
      const operacao = iniciarOperacaoCritica("renomear", "btnConfirmarRenomear");
      if (!operacao) return;

      try {
        mostrarMensagemPainel(
          houveAjusteNomeDuplicado
            ? `Nome já existente. Renomeando como "${nomeFinalRenomear}"...`
            : "Renomeando arquivo..."
        );

        const token = await obterToken();
        const driveItem = await obterDriveItemDoDocumento(documentoSelecionado);
        const driveId = driveItem.parentReference?.driveId || documentoSelecionado.driveId;

        const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${driveItem.id}`;

        const resposta = await fetch(url, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: nomeFinalRenomear
          })
        });

        if (!resposta.ok) {
          throw new Error(await resposta.text());
        }

        documentoSelecionado.nome = nomeFinalRenomear;

        await registrarHistorico(
          documentoSelecionado,
          "RENOMEOU",
          houveAjusteNomeDuplicado
            ? `Arquivo renomeado de "${antigoNome}" para "${nomeFinalRenomear}" porque já existia "${novoNome}".`
            : `Arquivo renomeado de "${antigoNome}" para "${nomeFinalRenomear}".`
        );

        mostrarMensagemPainel(
          houveAjusteNomeDuplicado
            ? `Arquivo renomeado como "${nomeFinalRenomear}" para evitar conflito de nome.`
            : "Arquivo renomeado com sucesso."
        );
        document.getElementById("boxRenomear").style.display = "none";
        document.getElementById("novoNomeArquivo").value = "";

        await atualizarDadosMantendoPainel();

      } catch (erro) {
        logger.error(erro);
        mostrarMensagemPainel("Não foi possível renomear o arquivo. Tente novamente.", "erro");
      } finally {
        finalizarOperacaoCritica(operacao);
      }
    };

    window.prepararSubstituir = function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Nenhum documento selecionado.", "erro");
        return;
      }

      document.getElementById("boxRenomear").style.display = "none";
      document.getElementById("boxArquivar").style.display = "none";
      document.getElementById("boxRestaurar").style.display = "none";
      document.getElementById("boxAlterarGaveta").style.display = "none";
      document.getElementById("boxMesclar").style.display = "none";
      document.getElementById("boxSubstituir").style.display = "block";
      document.getElementById("arquivoSubstituto").value = "";
      mostrarMensagemPainel("Escolha o PDF que vai substituir o conteúdo atual deste documento.");
    };

    window.cancelarSubstituir = function () {
      document.getElementById("boxSubstituir").style.display = "none";
      document.getElementById("arquivoSubstituto").value = "";
    };

    window.confirmarSubstituir = async function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Nenhum documento selecionado.", "erro");
        return;
      }

      const input = document.getElementById("arquivoSubstituto");
      const arquivo = input.files && input.files[0];

      if (!arquivo) {
        mostrarMensagemPainel("Selecione um arquivo PDF para substituir.", "erro");
        return;
      }

      const validacaoPdf = await validarArquivoPdfBasico(arquivo);
      if (!validacaoPdf.valido) {
        mostrarMensagemPainel(validacaoPdf.mensagem, "erro");
        return;
      }

      const limite = 250 * 1024 * 1024;
      if (arquivo.size > limite) {
        mostrarMensagemPainel("Este PDF é maior que 250 MB. Nesta versão, envie arquivos menores.", "erro");
        return;
      }

      const confirmar = confirm(
        `Substituir o conteúdo de:\n\n${documentoSelecionado.nome}\n\npelo arquivo:\n${arquivo.name}\n\nO nome será mantido e as versões anteriores deverão continuar disponíveis. Deseja continuar?`
      );

      if (!confirmar) {
        return;
      }

      const operacao = iniciarOperacaoCritica("substituir", "btnConfirmarSubstituir");
      if (!operacao) return;

      try {
        mostrarMensagemPainel("Substituindo arquivo. Aguarde...");

        const token = await obterToken();
        const driveItem = await obterDriveItemDoDocumento(documentoSelecionado);
        const driveId = driveItem.parentReference?.driveId || documentoSelecionado.driveId;
        const conteudoSubstituto = await prepararPdfSubstitutoComTituloArquivo(arquivo, documentoSelecionado.nome);

        const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${driveItem.id}/content`;

        const resposta = await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/pdf"
          },
          body: conteudoSubstituto
        });

        if (!resposta.ok) {
          throw new Error(await resposta.text());
        }

        const driveItemAtualizado = await resposta.json().catch(() => ({}));
        if (driveItemAtualizado.name) {
          documentoSelecionado.nome = driveItemAtualizado.name;
        }
        if (driveItemAtualizado.webUrl) {
          documentoSelecionado.link = driveItemAtualizado.webUrl;
          documentoSelecionado.driveWebUrl = driveItemAtualizado.webUrl;
        }
        if (driveItemAtualizado.id) {
          documentoSelecionado.driveItemId = driveItemAtualizado.id;
        }
        if (driveItemAtualizado.parentReference?.driveId) {
          documentoSelecionado.driveId = driveItemAtualizado.parentReference.driveId;
        }

        await registrarHistorico(
          documentoSelecionado,
          "SUBSTITUIU",
          `Arquivo substituído por nova versão enviada: ${arquivo.name}. Tamanho: ${Math.round(arquivo.size / 1024)} KB.`
        );

        document.getElementById("boxSubstituir").style.display = "none";
        document.getElementById("arquivoSubstituto").value = "";

        await atualizarDadosMantendoPainel();
        mostrarMensagemPainel("Arquivo substituído com sucesso. O histórico foi atualizado.");

      } catch (erro) {
        logger.error(erro);
        mostrarMensagemPainel("Não foi possível substituir o arquivo. Tente novamente.", "erro");
      } finally {
        finalizarOperacaoCritica(operacao);
      }
    };

    window.prepararMesclar = function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Selecione um arquivo antes de mesclar.", "erro");
        return;
      }

      document.getElementById("boxRenomear").style.display = "none";
      document.getElementById("boxSubstituir").style.display = "none";
      document.getElementById("boxArquivar").style.display = "none";
      document.getElementById("boxRestaurar").style.display = "none";
      document.getElementById("boxAlterarGaveta").style.display = "none";
      document.getElementById("boxMesclar").style.display = "block";
      document.getElementById("motivoMesclar").value = "";
      arquivoLocalMesclar = null;
      document.getElementById("arquivoLocalMesclar").value = "";
      document.getElementById("arquivoSelecionadoMesclar").textContent = "Nenhum PDF selecionado.";
      document.getElementById("statusMesclar").textContent = "";
      mostrarMensagemPainel("Escolha no computador o PDF que sera adicionado ao final deste arquivo.");
      document.getElementById("arquivoLocalMesclar").click();
    };

    window.cancelarMesclar = function () {
      if (mesclagemEmAndamento) {
        mostrarMensagemPainel("A mesclagem está em andamento. Aguarde terminar.", "erro");
        return;
      }

      arquivoLocalMesclar = null;
      document.getElementById("boxMesclar").style.display = "none";
      document.getElementById("arquivoLocalMesclar").value = "";
      document.getElementById("arquivoSelecionadoMesclar").textContent = "Nenhum PDF selecionado.";
      document.getElementById("motivoMesclar").value = "";
      document.getElementById("statusMesclar").textContent = "";
    };

    window.selecionarArquivoLocalMesclar = async function (input) {
      const arquivo = input?.files && input.files[0];
      arquivoLocalMesclar = null;

      if (!arquivo) {
        document.getElementById("arquivoSelecionadoMesclar").textContent = "Nenhum PDF selecionado.";
        return;
      }

      const validacaoPdf = await validarArquivoPdfBasico(arquivo);
      if (!validacaoPdf.valido) {
        input.value = "";
        document.getElementById("arquivoSelecionadoMesclar").textContent = validacaoPdf.mensagem;
        mostrarMensagemPainel(validacaoPdf.mensagem, "erro");
        return;
      }

      arquivoLocalMesclar = arquivo;
      document.getElementById("arquivoSelecionadoMesclar").textContent = `${arquivo.name} (${Math.round(arquivo.size / 1024)} KB)`;
      document.getElementById("statusMesclar").textContent = "";
      mostrarMensagemPainel("Informe o motivo e confirme para juntar os PDFs.");
    };

    window.escolherArquivoLocalMesclar = function () {
      if (mesclagemEmAndamento) {
        mostrarMensagemPainel("A mesclagem está em andamento. Aguarde terminar.", "erro");
        return;
      }

      document.getElementById("arquivoLocalMesclar").click();
    };

    function fluxoMesclagemAtivo() {
      const boxMesclar = document.getElementById("boxMesclar");
      return mesclagemEmAndamento ||
        !!arquivoLocalMesclar ||
        boxMesclar?.style.display === "block";
    }

    function atualizarStatusMesclar(texto) {
      const status = document.getElementById("statusMesclar");
      if (status) status.textContent = texto || "";
      if (texto) mostrarMensagemPainel(texto);
    }

    async function baixarPdfAtualParaMesclar(documento, token) {
      const driveItem = await obterDriveItemDoDocumento(documento);
      const driveId = driveItem.parentReference?.driveId || documento.driveId;
      const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${driveItem.id}/content`;

      const resposta = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!resposta.ok) {
        throw new Error(await resposta.text());
      }

      return resposta.arrayBuffer();
    }

    async function carregarPdfLibSobDemanda() {
      if (!pdfLibPromise) {
        pdfLibPromise = import("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.esm.min.js")
          .catch(erro => {
            pdfLibPromise = null;
            throw erro;
          });
      }

      const modulo = await pdfLibPromise;
      if (!modulo?.PDFDocument) {
        pdfLibPromise = null;
        throw new Error("pdf-lib não carregou corretamente.");
      }

      return modulo.PDFDocument;
    }

    async function prepararPdfSubstitutoComTituloArquivo(arquivo, nomeArquivoReal) {
      const nomeTitulo = (nomeArquivoReal || arquivo?.name || "arquivo.pdf").toString().trim();

      if (!arquivo || !nomeTitulo) {
        return arquivo;
      }

      try {
        const PDFDocument = await carregarPdfLibSobDemanda();
        const bytesOriginais = await arquivo.arrayBuffer();
        const pdf = await PDFDocument.load(bytesOriginais, { ignoreEncryption: true });
        pdf.setTitle(nomeTitulo);
        const bytesAtualizados = await pdf.save();
        return new Blob([bytesAtualizados], { type: "application/pdf" });
      } catch (erro) {
        logger.warn("Nao foi possivel ajustar o titulo interno do PDF substituto. Enviando arquivo original.", erro);
        return arquivo;
      }
    }

    async function criarPdfMescladoComArquivoLocal(documentoAtual, arquivoLocal, token) {
      atualizarStatusMesclar("Carregando motor de PDF...");
      const PDFDocument = await carregarPdfLibSobDemanda();
      const pdfFinal = await PDFDocument.create();
      atualizarStatusMesclar("Lendo o arquivo atual...");
      const bytesAtual = await baixarPdfAtualParaMesclar(documentoAtual, token);
      const pdfAtual = await PDFDocument.load(bytesAtual, { ignoreEncryption: true });
      const paginasAtuais = await pdfFinal.copyPages(pdfAtual, pdfAtual.getPageIndices());
      paginasAtuais.forEach(pagina => pdfFinal.addPage(pagina));

      atualizarStatusMesclar("Lendo o PDF escolhido...");
      const bytesLocal = await arquivoLocal.arrayBuffer();
      const pdfLocal = await PDFDocument.load(bytesLocal, { ignoreEncryption: true });
      const paginasLocais = await pdfFinal.copyPages(pdfLocal, pdfLocal.getPageIndices());

      atualizarStatusMesclar("Juntando as paginas...");
      paginasLocais.forEach(pagina => pdfFinal.addPage(pagina));
      return pdfFinal.save();
    }

    function obterTamanhoDocumentoBytes(documento) {
      const candidatos = [
        documento?.size,
        documento?.tamanho,
        documento?.tamanhoBytes,
        documento?.fileSize,
        documento?.fileSizeBytes
      ];

      const tamanho = candidatos
        .map(valor => Number(valor))
        .find(valor => Number.isFinite(valor) && valor > 0);

      return tamanho || 0;
    }

    function mesclagemLocalExcedeLimite(documento, arquivoLocal) {
      const tamanhoAtual = obterTamanhoDocumentoBytes(documento);
      const tamanhoLocal = Number(arquivoLocal?.size || 0);
      const tamanhoTotalConhecido = tamanhoAtual + tamanhoLocal;
      return tamanhoTotalConhecido > LIMITE_MESCLAGEM_LOCAL_BYTES;
    }

    window.confirmarMesclar = async function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Nenhum documento selecionado.", "erro");
        return;
      }

      if (mesclagemEmAndamento) {
        mostrarMensagemPainel("A mesclagem já está em andamento.", "erro");
        return;
      }

      const arquivo = arquivoLocalMesclar;
      const motivo = (document.getElementById("motivoMesclar").value || "").trim();

      if (!arquivo) {
        mostrarMensagemPainel("Escolha um PDF do computador para continuar.", "erro");
        return;
      }

      if (!motivo) {
        mostrarMensagemPainel("Informe o motivo para continuar.", "erro");
        return;
      }

      if (mesclagemLocalExcedeLimite(documentoSelecionado, arquivo)) {
        mostrarMensagemPainel("Os PDFs somados são grandes demais para mesclar com segurança no navegador. Use um arquivo menor ou faça a mesclagem fora do sistema antes de enviar.", "erro");
        return;
      }

      const confirmar = confirm(
        `Arquivo atual:\n${documentoSelecionado.nome}\n\nPDF que será adicionado:\n${arquivo.name}\n\nResultado:\nAs páginas do PDF escolhido serão adicionadas ao final do arquivo atual.\nO arquivo ${documentoSelecionado.nome} continuará com o mesmo nome.\n\nDeseja continuar?`
      );

      if (!confirmar) {
        return;
      }

      try {
        mesclagemEmAndamento = true;
        const botao = document.getElementById("btnConfirmarMesclar");
        if (botao) botao.disabled = true;
        atualizarStatusMesclar("Preparando mesclagem...");

        const token = await obterToken();
        const principal = documentoSelecionado;
        const pdfMesclado = await criarPdfMescladoComArquivoLocal(principal, arquivo, token);
        const driveItemPrincipal = await obterDriveItemDoDocumento(principal);
        const driveIdPrincipal = driveItemPrincipal.parentReference?.driveId || principal.driveId;
        const url = `https://graph.microsoft.com/v1.0/drives/${driveIdPrincipal}/items/${driveItemPrincipal.id}/content`;

        atualizarStatusMesclar("Salvando o arquivo atualizado...");
        const resposta = await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/pdf"
          },
          body: new Blob([pdfMesclado], { type: "application/pdf" })
        });

        if (!resposta.ok) {
          throw new Error(await resposta.text());
        }

        atualizarStatusMesclar("Registrando no histórico...");
        await registrarHistorico(
          principal,
          "MESCLOU",
          `PDF mesclado com arquivo local: ${arquivo.name}. Motivo: ${motivo}.`
        );

        arquivoLocalMesclar = null;
        document.getElementById("boxMesclar").style.display = "none";
        document.getElementById("arquivoLocalMesclar").value = "";
        document.getElementById("arquivoSelecionadoMesclar").textContent = "Nenhum PDF selecionado.";
        document.getElementById("motivoMesclar").value = "";
        atualizarStatusMesclar("Concluído.");

        await atualizarDadosMantendoPainel();
        mostrarMensagemPainel("Mesclagem concluída. O arquivo foi atualizado mantendo o mesmo nome.");
      } catch (erro) {
        logger.error(erro);
        atualizarStatusMesclar("");
        mostrarMensagemPainel("Não foi possível concluir a mesclagem. Tente novamente.", "erro");
      } finally {
        mesclagemEmAndamento = false;
        const botao = document.getElementById("btnConfirmarMesclar");
        if (botao) botao.disabled = false;
      }
    };

    async function obterDriveDaBibliotecaAtivos() {
      const token = await obterToken();
      const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/drive?$select=id`;

      const resposta = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!resposta.ok) {
        throw new Error(await resposta.text());
      }

      return await resposta.json();
    }

    async function obterOuCriarPastaLixeira(driveId) {
      const token = await obterToken();
      const nomePasta = "_ARQUIVADOS";
      const urlBuscar = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURIComponent(nomePasta)}`;

      const tentativa = await fetch(urlBuscar, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (tentativa.ok) {
        return await tentativa.json();
      }

      const urlCriar = `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`;

      const respostaCriar = await fetch(urlCriar, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: nomePasta,
          folder: {},
          "@microsoft.graph.conflictBehavior": "fail"
        })
      });

      if (!respostaCriar.ok) {
        throw new Error(await respostaCriar.text());
      }

      return await respostaCriar.json();
    }

    window.prepararArquivar = function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Nenhum documento selecionado.", "erro");
        return;
      }

      document.getElementById("boxRenomear").style.display = "none";
      document.getElementById("boxSubstituir").style.display = "none";
      document.getElementById("boxRestaurar").style.display = "none";
      document.getElementById("boxAlterarGaveta").style.display = "none";
      document.getElementById("boxMesclar").style.display = "none";
      document.getElementById("boxArquivar").style.display = "block";
      document.getElementById("motivoArquivar").value = "";
      mostrarMensagemPainel("Informe o motivo antes de mover para a Lixeira.");
    };

    window.cancelarArquivar = function () {
      document.getElementById("boxArquivar").style.display = "none";
      document.getElementById("motivoArquivar").value = "";
      document.getElementById("boxRestaurar").style.display = "none";
      document.getElementById("motivoRestaurar").value = "";
      document.getElementById("boxAlterarGaveta").style.display = "none";
      document.getElementById("novaGavetaDocumento").value = "";
      document.getElementById("motivoAlterarGaveta").value = "";
    };

    window.confirmarArquivar = async function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Nenhum documento selecionado.", "erro");
        return;
      }

      const motivo = (document.getElementById("motivoArquivar").value || "").trim();

      if (!motivo) {
        mostrarMensagemPainel("Informe o motivo para continuar.", "erro");
        return;
      }

      const operacao = iniciarOperacaoCritica("arquivar", "btnConfirmarArquivar");
      if (!operacao) return;

      try {
        mostrarMensagemPainel("Movendo para a Lixeira...");

        const token = await obterToken();
        const driveItem = await obterDriveItemDoDocumento(documentoSelecionado);
        const drive = await obterDriveDaBibliotecaAtivos();
        const driveId = drive.id;
        const pastaLixeira = await obterOuCriarPastaLixeira(driveId);

        const urlMover = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${driveItem.id}`;

        const resposta = await fetch(urlMover, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            parentReference: {
              id: pastaLixeira.id
            }
          })
        });

        if (!resposta.ok) {
          throw new Error(await resposta.text());
        }

        await registrarHistorico(
          documentoSelecionado,
          "ARQUIVOU",
          motivo
        );

        document.getElementById("boxArquivar").style.display = "none";
        document.getElementById("motivoArquivar").value = "";

        fecharPainel();
        await atualizarDadosMantendoPainel();
        mostrarMensagem("Arquivo movido para a Lixeira. Ele não foi excluído.");

      } catch (erro) {
        logger.error(erro);
        mostrarMensagemPainel("Não foi possível mover o arquivo para a Lixeira. Tente novamente.", "erro");
      } finally {
        finalizarOperacaoCritica(operacao);
      }
    };

    async function obterPastaRaizAtivos(driveId) {
      const token = await obterToken();
      const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root?$select=id,name`;

      const resposta = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!resposta.ok) {
        throw new Error(await resposta.text());
      }

      return await resposta.json();
    }

    window.prepararRestaurar = function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Nenhum documento selecionado.", "erro");
        return;
      }

      document.getElementById("boxRenomear").style.display = "none";
      document.getElementById("boxSubstituir").style.display = "none";
      document.getElementById("boxArquivar").style.display = "none";
      document.getElementById("boxAlterarGaveta").style.display = "none";
      document.getElementById("boxMesclar").style.display = "none";
      document.getElementById("boxRestaurar").style.display = "block";
      document.getElementById("motivoRestaurar").value = "";
      mostrarMensagemPainel("Informe o motivo antes de restaurar o arquivo.");
    };

    window.cancelarRestaurar = function () {
      document.getElementById("boxRestaurar").style.display = "none";
      document.getElementById("motivoRestaurar").value = "";
    };

    window.confirmarRestaurar = async function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Nenhum documento selecionado.", "erro");
        return;
      }

      const motivo = (document.getElementById("motivoRestaurar").value || "").trim();

      if (!motivo) {
        mostrarMensagemPainel("Informe o motivo para continuar.", "erro");
        return;
      }

      const operacao = iniciarOperacaoCritica("restaurar", "btnConfirmarRestaurar");
      if (!operacao) return;

      try {
        mostrarMensagemPainel("Restaurando arquivo...");

        const token = await obterToken();
        const driveItem = await obterDriveItemDoDocumento(documentoSelecionado);
        const drive = await obterDriveDaBibliotecaAtivos();
        const driveId = drive.id;
        const pastaRaiz = await obterPastaRaizAtivos(driveId);

        const nomeDuplicadoAtivo = documentosAtivos.some(doc =>
          normalizarTexto(doc.nome) === normalizarTexto(documentoSelecionado.nome)
        );

        if (nomeDuplicadoAtivo) {
          mostrarMensagemPainel("Já existe um arquivo ativo com esse nome. Renomeie um dos arquivos antes de restaurar.", "erro");
          return;
        }

        const urlMover = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${driveItem.id}`;

        const resposta = await fetch(urlMover, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            parentReference: {
              id: pastaRaiz.id
            }
          })
        });

        if (!resposta.ok) {
          throw new Error(await resposta.text());
        }

        await registrarHistorico(
          documentoSelecionado,
          "RESTAUROU",
          motivo
        );

        document.getElementById("boxRestaurar").style.display = "none";
        document.getElementById("motivoRestaurar").value = "";

        modoListaAtual = "ativos";
        await atualizarDadosMantendoPainel("na Lixeira");
        mostrarMensagem("Arquivo restaurado para Documentos ativos.");

      } catch (erro) {
        logger.error(erro);
        mostrarMensagemPainel("Não foi possível restaurar o arquivo. Tente novamente.", "erro");
      } finally {
        finalizarOperacaoCritica(operacao);
      }
    };

    window.prepararAlterarGaveta = function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Nenhum documento selecionado.", "erro");
        return;
      }

      document.getElementById("boxRenomear").style.display = "none";
      document.getElementById("boxSubstituir").style.display = "none";
      document.getElementById("boxArquivar").style.display = "none";
      document.getElementById("boxRestaurar").style.display = "none";
      document.getElementById("boxMesclar").style.display = "none";
      document.getElementById("boxAlterarGaveta").style.display = "block";
      document.getElementById("novaGavetaDocumento").innerHTML = opcoesGavetaHtml(documentoSelecionado.gaveta || "");
      document.getElementById("motivoAlterarGaveta").value = "";
      mostrarMensagemPainel("Escolha a nova gaveta e informe o motivo.");
    };

    window.cancelarAlterarGaveta = function () {
      document.getElementById("boxAlterarGaveta").style.display = "none";
      document.getElementById("novaGavetaDocumento").value = "";
      document.getElementById("motivoAlterarGaveta").value = "";
    };

    window.confirmarAlterarGaveta = async function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Nenhum documento selecionado.", "erro");
        return;
      }

      const novaGaveta = (document.getElementById("novaGavetaDocumento").value || "").trim();
      const motivo = (document.getElementById("motivoAlterarGaveta").value || "").trim();
      const gavetaAnterior = gavetaOuPadrao(documentoSelecionado.gaveta);

      if (!novaGaveta) {
        mostrarMensagemPainel("Escolha a nova gaveta.", "erro");
        return;
      }

      if (!motivo) {
        mostrarMensagemPainel("Informe o motivo para continuar.", "erro");
        return;
      }

      const operacao = iniciarOperacaoCritica("alterar-gaveta", "btnConfirmarAlterarGaveta");
      if (!operacao) return;

      try {
        mostrarMensagemPainel("Salvando nova gaveta...");

        const token = await obterToken();
        await atualizarGavetaItemSharePoint(documentoSelecionado.listItemId, novaGaveta, token);

        documentoSelecionado.gaveta = novaGaveta;
        const painelGaveta = document.getElementById("painelGaveta");
        if (painelGaveta) painelGaveta.textContent = gavetaOuPadrao(novaGaveta);

        await registrarHistorico(
          documentoSelecionado,
          "ALTEROU_GAVETA",
          `Gaveta anterior: ${gavetaAnterior}. Nova gaveta: ${novaGaveta}. Motivo: ${motivo}`
        );

        document.getElementById("boxAlterarGaveta").style.display = "none";
        document.getElementById("motivoAlterarGaveta").value = "";

        await atualizarDadosMantendoPainel();
        mostrarMensagemPainel("Gaveta atualizada com sucesso.");
      } catch (erro) {
        logger.error(erro);
        mostrarMensagemPainel("Não foi possível alterar a gaveta. Tente novamente.", "erro");
      } finally {
        finalizarOperacaoCritica(operacao);
      }
    };

    function guardarPainelSelecionadoParaReabrir(modoDestino = "") {
      if (!documentoSelecionado || !documentoSelecionado.id) {
        return;
      }

      sessionStorage.setItem("arquivoDigitalReabrirDocumentoId", documentoSelecionado.id);
      sessionStorage.setItem("arquivoDigitalReabrirDocumentoNome", documentoSelecionado.nome || "");

      if (modoDestino) {
        sessionStorage.setItem("arquivoDigitalReabrirModo", modoDestino);
      } else if (typeof modoListaAtual !== "undefined") {
        sessionStorage.setItem("arquivoDigitalReabrirModo", modoListaAtual);
      }
    }

    async function reabrirPainelSelecionadoSePossivel() {
      const id = sessionStorage.getItem("arquivoDigitalReabrirDocumentoId") || "";
      const nome = sessionStorage.getItem("arquivoDigitalReabrirDocumentoNome") || "";
      const modo = sessionStorage.getItem("arquivoDigitalReabrirModo") || "";

      sessionStorage.removeItem("arquivoDigitalReabrirDocumentoId");
      sessionStorage.removeItem("arquivoDigitalReabrirDocumentoNome");
      sessionStorage.removeItem("arquivoDigitalReabrirModo");

      if (modo && typeof modoListaAtual !== "undefined") {
        modoListaAtual = modo;
      }

      if (typeof aplicarListaAtual === "function") {
        aplicarListaAtual();
      }

      let indice = documentosCarregados.findIndex(doc => obterIdArquivoDocumento(doc) === id);

      if (indice >= 0) {
        await selecionarDocumento(indice);
      }
    }

    async function atualizarDadosMantendoPainel(modoDestino = "") {
      guardarPainelSelecionadoParaReabrir(modoDestino);

      if (modoDestino && typeof modoListaAtual !== "undefined") {
        modoListaAtual = modoDestino;
      }

      await listarDocumentos();

      if (typeof carregarDadosDeApoio === "function") {
        await carregarDadosDeApoio();
      }

      await reabrirPainelSelecionadoSePossivel();
    }

        window.visualizarVersaoSharePoint = async function (versionId) {
      const info = window.versaoDownloadDocumentoAtual;

      if (!info || !info.driveId || !info.driveItemId) {
        mostrarMensagemPainel("Não foi possível identificar o arquivo para abrir esta versão.", "erro");
        return;
      }

      if (!versionId) {
        mostrarMensagemPainel("Esta versão não está disponível.", "erro");
        return;
      }

      try {
        mostrarMensagemPainel("Abrindo versão...");

        const token = await obterToken();

        const url = `https://graph.microsoft.com/v1.0/drives/${info.driveId}/items/${info.driveItemId}/versions/${versionId}/content`;

        const resposta = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!resposta.ok) {
          throw new Error(await resposta.text());
        }

        const blobOriginal = await resposta.blob();
        const blobPdf = new Blob([blobOriginal], { type: "application/pdf" });
        const urlPdf = URL.createObjectURL(blobPdf);

        const janela = window.open(urlPdf, "_blank");

        if (!janela) {
          const link = document.createElement("a");
          link.href = urlPdf;
          link.target = "_blank";
          link.rel = "noopener";
          document.body.appendChild(link);
          link.click();
          link.remove();
        }

        setTimeout(() => {
          URL.revokeObjectURL(urlPdf);
        }, 120000);

        mostrarMensagemPainel("Versao aberta em nova aba.");
      } catch (erro) {
        logger.error(erro);
        mostrarMensagemPainel("Não foi possível abrir esta versão. Tente novamente.", "erro");
      }
    };

    function renderizarVersoesSharePoint() {
      const caixa = document.getElementById("versoesSharePoint");
      if (!caixa) return;

      const versoes = versoesSharePointCarregadas || [];
      if (!versoes.length) {
      caixa.innerHTML = "<p>Nenhuma versão encontrada.</p>";
        return;
      }

      const visiveis = versoesSharePointExpandido ? versoes : versoes.slice(0, 2);

      caixa.innerHTML = visiveis.map((versao, indice) => {
        const indiceReal = versoes.indexOf(versao);
        const data = formatarData(versao.lastModifiedDateTime);
        const usuario = versao.lastModifiedBy?.user?.displayName || versao.lastModifiedBy?.user?.email || "";
        const tamanho = versao.size ? `${Math.round(versao.size / 1024)} KB` : "";
        const numero = versao.id || `${indiceReal + 1}`;
        const ehAtual = indiceReal === 0;

        const botao = ehAtual
          ? `<button class="btnVersaoSharePoint" type="button" data-acao-versao="abrir" data-url-versao="${escaparHtml(window.versaoDownloadDocumentoAtual?.linkAtual || "#")}">Visualizar versão atual</button>`
          : `<button class="btnVersaoSharePoint" type="button" data-acao-versao="abrir" data-version-id="${escaparHtml(numero)}">Visualizar versão</button>`;

        return `
          <div class="itemVersao">
            <strong>${ehAtual ? "Versao atual" : "Versao anterior"} ${escaparHtml(numero)}</strong>
            <span>${data}</span>
            <small>${escaparHtml(usuario)} ${tamanho ? " - " + escaparHtml(tamanho) : ""}</small>
            <div class="acoesVersaoSharePoint">
              ${botao}
            </div>
          </div>
        `;
      }).join("") + (versoes.length > 2 ? `
        <button class="btnAlternarVersoes" type="button" data-acao-versao="alternar-todas">
          ${versoesSharePointExpandido ? "Recolher" : "Ver todas"}
        </button>
      ` : "");
    }

    function abrirUrlVersaoSharePoint(url) {
      const urlVersao = typeof url === "string" ? url.trim() : "";
      if (!urlVersao || urlVersao === "#") {
        mostrarMensagemPainel("Esta versão não está disponível.", "erro");
        return;
      }

      window.open(urlVersao, "_blank", "noopener,noreferrer");
    }

    window.alternarTodasVersoesSharePoint = function (event) {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      versoesSharePointExpandido = !versoesSharePointExpandido;
      renderizarVersoesSharePoint();
    };
    async function carregarVersoesSharePointDocumento(documento, tokenPainel = painelDocumentoTokenAtual) {
      const caixa = document.getElementById("versoesSharePoint");

      if (!caixa || !painelAindaMostraDocumento(documento, tokenPainel)) return;

      window.versaoDownloadDocumentoAtual = null;
      versoesSharePointCarregadas = [];
      versoesSharePointExpandido = false;

      if (!documento || !documento.listItemId) {
        caixa.innerHTML = "<p>Selecione um arquivo para carregar as versões.</p>";
        return;
      }

      const documentoVersoesId = documento.id || "";
      const versoesAindaDoDocumentoAtual = () =>
        painelAindaMostraDocumento(documento, tokenPainel) &&
        (!documentoVersoesId || documentoSelecionado.id === documentoVersoesId);

      caixa.innerHTML = montarCarregamentoVisual("Carregando versões", "Consultando versões disponíveis para este arquivo.", "🧾");

      try {
        if (!versoesAindaDoDocumentoAtual()) return;

        const token = await obterToken();
        if (!versoesAindaDoDocumentoAtual()) return;

        const driveItem = await obterDriveItemDoDocumento(documento);
        if (!versoesAindaDoDocumentoAtual()) return;

        const driveId = driveItem.parentReference?.driveId || documento.driveId || "";
        const driveItemId = driveItem.id || documento.driveItemId || "";

        window.versaoDownloadDocumentoAtual = {
          driveId,
          driveItemId,
          nome: documento.nome || driveItem.name || "arquivo.pdf",
          linkAtual: documento.link || driveItem.webUrl || ""
        };

        const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/items/${documento.listItemId}/driveItem/versions?$top=20`;

        const resposta = await fetchGraphComRetry(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }, {
          tentativas: 3,
          atrasoBaseMs: 800
        });

        if (!versoesAindaDoDocumentoAtual()) return;

        if (!resposta.ok) {
          throw new Error(await resposta.text());
        }

        const dados = await resposta.json();

        if (!versoesAindaDoDocumentoAtual()) return;

        const versoes = dados.value || [];

        if (!versoes.length) {
          caixa.innerHTML = "<p>Nenhuma versão encontrada.</p>";
          return;
        }

        versoesSharePointCarregadas = versoes;
        renderizarVersoesSharePoint();

      } catch (erro) {
        logger.error(erro);

        if (versoesAindaDoDocumentoAtual()) {
          caixa.innerHTML = "<p class='textoErro'>Não foi possível carregar as versões do arquivo.</p>";
        }
      }
    }
    async function abrirDocumentoNoPainel(documento) {
      if (!documento) {
        mostrarMensagem("Documento não encontrado.", "erro");
        return;
      }

      if (painelLateralJaAbertoNoMesmoDocumento(documento)) {
        return;
      }

      documentoSelecionado = documento;
      const painel = document.getElementById("painelLateral");
      const tokenCarregamentoPainel = ++painelDocumentoTokenAtual;
      if (painel) {
        painel.dataset.carregamentoPainel = tokenCarregamentoPainel;
      }

      document.getElementById("painelTitulo").textContent = nomeArquivoVisualLimpo(documento.nome);
      const painelNome = document.getElementById("painelNome");
      painelNome.textContent = documento.nome || "";
      painelNome.parentElement?.querySelector(".seloNomeRepetido")?.remove();
      const painelId = document.getElementById("painelId");
      if (painelId) painelId.textContent = documento.id || "";
      const painelCaminho = document.getElementById("painelCaminho");
      if (painelCaminho) painelCaminho.textContent = documento.caminho || "";
      const painelGaveta = document.getElementById("painelGaveta");
      if (painelGaveta) painelGaveta.textContent = gavetaOuPadrao(documento.gaveta);
      const painelTituloChips = document.getElementById("painelTituloChips");
      if (painelTituloChips) {
        painelTituloChips.innerHTML = `
          <span class="${documento.status === "ARQUIVADO" ? "statusPainel statusPainelLixeira" : "statusPainel statusPainelAtivo"}">${documento.status === "ARQUIVADO" ? "Lixeira" : "Ativo"}</span>
          <span class="chipPainelGaveta">${escaparHtml(gavetaOuPadrao(documento.gaveta))}</span>
        `;
      }

      const estaArquivado = documento.status === "ARQUIVADO";
      document.getElementById("btnRenomear").style.display = "inline-block";
      document.getElementById("btnSubstituir").style.display = "inline-block";
      document.getElementById("btnArquivar").style.display = estaArquivado ? "none" : "inline-block";
      document.getElementById("btnRestaurar").style.display = estaArquivado ? "inline-block" : "none";
      document.getElementById("btnMesclar").style.display = "inline-block";

      painel?.classList.add("aberto");
      marcarCamadaAbertaAcessivel("painelLateral", "#painelTitulo");
      registrarCamadaHistoricoMobile();
      document.getElementById("boxRenomear").style.display = "none";
      document.getElementById("novoNomeArquivo").value = "";
      document.getElementById("boxSubstituir").style.display = "none";
      document.getElementById("arquivoSubstituto").value = "";
      document.getElementById("boxArquivar").style.display = "none";
      document.getElementById("motivoArquivar").value = "";
      document.getElementById("boxRestaurar").style.display = "none";
      document.getElementById("motivoRestaurar").value = "";
      document.getElementById("boxAlterarGaveta").style.display = "none";
      document.getElementById("novaGavetaDocumento").value = "";
      document.getElementById("motivoAlterarGaveta").value = "";
      document.getElementById("boxMesclar").style.display = "none";
      document.getElementById("arquivoLocalMesclar").value = "";
      document.getElementById("arquivoSelecionadoMesclar").textContent = "Nenhum PDF selecionado.";
      document.getElementById("motivoMesclar").value = "";
      document.getElementById("statusMesclar").textContent = "";
      arquivoLocalMesclar = null;

      /* INICIO_PAINEL_LATERAL_SEGUNDO_PLANO_20260527 */
      const documentoDoPainel = documento;

      const painelLocalAindaMostraDocumento = () =>
        painel &&
        Number(painel.dataset.carregamentoPainel) === tokenCarregamentoPainel &&
        painelAindaMostraDocumento(documentoDoPainel, tokenCarregamentoPainel);

      const carregarBlocoPainel = (nomeBloco, tarefa, atraso = 0) => {
        setTimeout(() => requestAnimationFrame(async () => {
          if (!painelLocalAindaMostraDocumento()) return;

          try {
            await tarefa();
          } catch (erro) {
            logger.error(`Falha ao carregar ${nomeBloco} do painel.`, erro);
          }
        }), atraso);
      };

      requestAnimationFrame(() => {
        if (!painelLocalAindaMostraDocumento() || !painelTituloChips) return;
        const mapaNomesPainel = obterMapaNomesVisuaisTodosDocumentos();
        painelTituloChips.innerHTML = `
          <span class="${documento.status === "ARQUIVADO" ? "statusPainel statusPainelLixeira" : "statusPainel statusPainelAtivo"}">${documento.status === "ARQUIVADO" ? "Lixeira" : "Ativo"}</span>
          ${seloNomeRepetidoHtmlComMapa(documento, mapaNomesPainel)}
          <span class="chipPainelGaveta">${escaparHtml(gavetaOuPadrao(documento.gaveta))}</span>
        `;
      });

      const nomesParecidosPainel = document.getElementById("nomesParecidosArquivo");
      if (nomesParecidosPainel) {
        nomesParecidosPainel.classList.remove("comNomesParecidos");
        nomesParecidosPainel.innerHTML = "<p>Procurando nomes parecidos...</p>";
      }

      const historicoPainel = document.getElementById("historicoArquivo");
      if (historicoPainel) historicoPainel.innerHTML = montarCarregamentoVisual("Carregando histórico", "Buscando movimentações e anotações do documento.", "🕘");

      const versoesPainel = document.getElementById("versoesSharePoint");
      if (versoesPainel) versoesPainel.innerHTML = montarCarregamentoVisual("Carregando versões", "Consultando versões disponíveis para este arquivo.", "🧾");

      const campoAnotacaoPainel = document.getElementById("campoAnotacao");
      if (campoAnotacaoPainel) campoAnotacaoPainel.value = "";
      anotacaoAtualItemId = null;
      anotacaoAtualEtag = "";
      anotacaoUltimoTextoSalvo = "";
      atualizarStatusAnotacao("Carregando anotacao...");

      carregarBlocoPainel("nomes parecidos", () => carregarNomesParecidos(documentoDoPainel, tokenCarregamentoPainel), 360);

      carregarBlocoPainel("historico", () => carregarHistoricoDocumento(documentoDoPainel, tokenCarregamentoPainel), 440);

      carregarBlocoPainel("anotacao", async () => {
        await carregarAnotacaoDocumento(documentoDoPainel, tokenCarregamentoPainel);
        if (!painelLocalAindaMostraDocumento()) return;
        ajustarAlturaAnotacao();
      }, 520);

      carregarBlocoPainel("versoes", () => carregarVersoesSharePointDocumento(documentoDoPainel, tokenCarregamentoPainel), 680);
      /* FIM_PAINEL_LATERAL_SEGUNDO_PLANO_20260527 */
    }

    window.selecionarDocumento = async function (indice) {
      const documento = documentosCarregados[indice];
      await abrirDocumentoNoPainel(documento);
    };

    window.fecharPainel = function (opcoes = {}) {
      if (!opcoes.forcar && fluxoMesclagemAtivo()) {
        if (mesclagemEmAndamento) {
          mostrarMensagemPainel("Conclua ou cancele a mesclagem antes de fechar.", "erro");
          return;
        }

        const confirmar = confirm("Há uma mesclagem em preparação. Fechar o painel vai cancelar esse fluxo. Deseja fechar mesmo assim?");
        if (!confirmar) {
          mostrarMensagemPainel("Mesclagem mantida. Continue ou cancele pelo botão do painel.");
          return;
        }
      }

      painelDocumentoTokenAtual++;
      document.getElementById("painelLateral").classList.remove("aberto");
      marcarCamadaFechadaAcessivel("painelLateral");
      document.getElementById("boxRenomear").style.display = "none";
      document.getElementById("novoNomeArquivo").value = "";
      document.getElementById("boxSubstituir").style.display = "none";
      document.getElementById("arquivoSubstituto").value = "";
      document.getElementById("boxArquivar").style.display = "none";
      document.getElementById("motivoArquivar").value = "";
      document.getElementById("boxRestaurar").style.display = "none";
      document.getElementById("motivoRestaurar").value = "";
      document.getElementById("boxAlterarGaveta").style.display = "none";
      document.getElementById("novaGavetaDocumento").value = "";
      document.getElementById("motivoAlterarGaveta").value = "";
      document.getElementById("boxMesclar").style.display = "none";
      document.getElementById("arquivoLocalMesclar").value = "";
      document.getElementById("arquivoSelecionadoMesclar").textContent = "Nenhum PDF selecionado.";
      document.getElementById("motivoMesclar").value = "";
      document.getElementById("statusMesclar").textContent = "";
      arquivoLocalMesclar = null;
      documentoSelecionado = null;
      anotacaoAtualItemId = null;
      anotacaoAtualEtag = "";
      clearTimeout(timerSalvarAnotacao);
      anotacaoUltimoTextoSalvo = "";
    };

/* INICIO_ABRIR_PDF_IMEDIATO_HISTORICO_BG_20260527 */
    window.abrirPdfSelecionado = async function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Nenhum documento selecionado.", "erro");
        return;
      }

      const documentoAberto = { ...documentoSelecionado };
      const linkPdf = documentoAberto.link || "";

      if (!linkPdf) {
        mostrarMensagemPainel("Não foi possível localizar o link deste arquivo.", "erro");
        return;
      }

      const operacao = iniciarOperacaoCritica("abrir-pdf", "btnAbrirArquivoPainel", "A abertura do arquivo já foi iniciada. Aguarde.");
      if (!operacao) return;

      const aba = window.open("", "_blank");

      if (aba) {
        aba.location.href = linkPdf;
      } else {
        window.location.href = linkPdf;
      }

      mostrarMensagemPainel("Arquivo aberto. Registrando acesso no histórico...");

      setTimeout(async () => {
        try {
          await registrarHistorico(
            documentoAberto,
            "VISUALIZOU",
            "Documento aberto pelo botão ABRIR ARQUIVO no painel lateral."
          );

          if (documentoSelecionado && documentoSelecionado.id === documentoAberto.id) {
            mostrarMensagemPainel("Acesso registrado no histórico.");
          }
        } catch (erro) {
          logger.error(erro);

          if (documentoSelecionado && documentoSelecionado.id === documentoAberto.id) {
            mostrarMensagemPainel("Arquivo aberto, mas não foi possível registrar no histórico agora.", "erro");
          }
        } finally {
          finalizarOperacaoCritica(operacao);
        }
      }, 0);
    };
/* FIM_ABRIR_PDF_IMEDIATO_HISTORICO_BG_20260527 */

        let driveDocumentosAtivosId = null;

    async function obterDriveDocumentosAtivos() {
      if (driveDocumentosAtivosId) {
        return driveDocumentosAtivosId;
      }

      const token = await obterToken();
      const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/drive`;

      const resposta = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!resposta.ok) {
        throw new Error(await resposta.text());
      }

      const dados = await resposta.json();
      driveDocumentosAtivosId = dados.id;
      return driveDocumentosAtivosId;
    }

    function separarNomePdf(nome) {
      const nomeLimpo = limparNomeArquivoPdf(nome);
      const semPdf = nomeLimpo.replace(/\.pdf$/i, "").trim();

      return {
        base: semPdf || "DOCUMENTO",
        extensao: ".pdf"
      };
    }

    function criarConjuntoNomesUploadOcupados() {
      return new Set(
        (documentosAtivos || [])
          .filter(doc => doc && doc.nome)
          .map(doc => normalizarTexto(doc.nome))
      );
    }

    function gerarNomeLivreUploadPdfComOcupados(nomeSolicitado, ocupados) {
      const partes = separarNomePdf(nomeSolicitado);
      let candidato = `${partes.base}${partes.extensao}`;

      if (!ocupados.has(normalizarTexto(candidato))) {
        return candidato;
      }

      for (let numero = 2; numero <= 9999; numero++) {
        candidato = `${partes.base} (${numero})${partes.extensao}`;

        if (!ocupados.has(normalizarTexto(candidato))) {
          return candidato;
        }
      }

      const sufixo = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
      return `${partes.base} (${sufixo})${partes.extensao}`;
    }

    function gerarNomeLivreUploadPdf(nomeSolicitado) {
      return gerarNomeLivreUploadPdfComOcupados(nomeSolicitado, criarConjuntoNomesUploadOcupados());
    }

    function opcoesGavetaHtml(valorAtual = "") {
      const opcoes = ['<option value="">Selecione a gaveta</option>'];
      obterOpcoesGavetas()
        .filter(valor => valor !== "Gaveta nao informada")
        .forEach(valor => {
        const selecionado = valor === valorAtual ? " selected" : "";
        const valorSeguro = escaparHtml(valor);
        opcoes.push(`<option value="${valorSeguro}"${selecionado}>${valorSeguro}</option>`);
      });
      return opcoes.join("");
    }

    let arquivosCentralUpload = [];
    let uploadEmAndamento = false;
    let uploadConcluidoComSucesso = false;
    let uploadTeveErro = false;
    let statusArquivosUpload = [];
    let resultadosArquivosUpload = [];
    let analiseNomesCentralUpload = [];
    let idSessaoUploadEmUso = "";
    let indicesSessaoUploadPorArquivo = [];
    let reenvioSessaoUploadAtivo = false;
    const idExecucaoUploadAtual = criarIdExecucaoUpload();
    const LIMITE_UPLOAD_SIMPLES_BYTES = 25 * 1024 * 1024;
    const TAMANHO_BLOCO_UPLOAD_SESSION_BYTES = 5 * 1024 * 1024;
    const MAX_TENTATIVAS_EXTRAS_BLOCO_UPLOAD = 2;
    const STATUS_UPLOAD_ENVIADO = "Enviado";
    const STATUS_UPLOAD_AVISO = "Enviado — não reenviar";
    const STATUS_UPLOAD_NAO_ENVIADO = "Não enviado";
    const STATUS_UPLOAD_REPROCESSAVEIS = new Set(["Pendente", STATUS_UPLOAD_NAO_ENVIADO]);
    const STATUS_UPLOAD_NAO_REENVIAR = new Set([STATUS_UPLOAD_ENVIADO, STATUS_UPLOAD_AVISO, "Conflito"]);
    const CHAVE_SESSAO_UPLOAD_LOCAL = "arquivoDigitalUploadSessaoAtual";
    const STATUS_SESSAO_UPLOAD_RESOLVIDOS = new Set(["enviado", "ignorado", "concluido"]);
    const LIMITE_ITENS_EXIBIDOS_SESSAO_UPLOAD = 20;

    function lerSessaoUploadLocal() {
      let texto = "";
      try {
        texto = localStorage.getItem(CHAVE_SESSAO_UPLOAD_LOCAL) || "";
        if (!texto) return null;
        const sessao = JSON.parse(texto);
        if (!sessao || typeof sessao !== "object" || !Array.isArray(sessao.itens) || !sessao.idLote) {
          localStorage.removeItem(CHAVE_SESSAO_UPLOAD_LOCAL);
          return null;
        }
        return sessao;
      } catch (erro) {
        logger.warn("Sessao local de upload invalida foi ignorada.", erro);
        if (texto) {
          try {
            localStorage.removeItem(CHAVE_SESSAO_UPLOAD_LOCAL);
          } catch (erroLimpeza) {
            logger.warn("Nao foi possivel limpar sessao local de upload invalida.", erroLimpeza);
          }
        }
        return null;
      }
    }

    function salvarSessaoUploadLocal(sessao) {
      if (!sessao || !Array.isArray(sessao.itens)) return false;
      try {
        sessao.atualizadoEm = new Date().toISOString();
        localStorage.setItem(CHAVE_SESSAO_UPLOAD_LOCAL, JSON.stringify(sessao));
        return true;
      } catch (erro) {
        logger.warn("Nao foi possivel salvar a sessao local de upload.", erro);
        return false;
      }
    }

    function apagarSessaoUploadLocal(idLote = "") {
      try {
        const sessao = lerSessaoUploadLocal();
        if (idLote && sessao?.idLote && sessao.idLote !== idLote) return false;
        localStorage.removeItem(CHAVE_SESSAO_UPLOAD_LOCAL);
        if (!idLote || idSessaoUploadEmUso === idLote) {
          idSessaoUploadEmUso = "";
          indicesSessaoUploadPorArquivo = [];
          reenvioSessaoUploadAtivo = false;
        }
        renderizarAvisoSessaoUploadInterrompida();
        return true;
      } catch (erro) {
        logger.warn("Nao foi possivel apagar a sessao local de upload.", erro);
        return false;
      }
    }

    function sessaoUploadTemPendencia(sessao) {
      if (!sessao || sessao.statusLote === "concluido") return false;
      return sessao.itens.some(item => !STATUS_SESSAO_UPLOAD_RESOLVIDOS.has(item.status));
    }

    function criarIdExecucaoUpload() {
      if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
      return `execucao-upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function sessaoUploadAtivaNestaExecucao(sessao) {
      return !!sessao?.idExecucaoAtual && sessao.idExecucaoAtual === idExecucaoUploadAtual;
    }

    function deveMostrarAvisoSessaoUpload(sessao) {
      return sessaoUploadTemPendencia(sessao)
        && !uploadEmAndamento
        && !sessaoUploadAtivaNestaExecucao(sessao);
    }

    function criarIdLoteUpload() {
      if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
      return `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function criarSessaoUploadLocal(gaveta, motivo, indicesParaEnviar) {
      const agora = new Date().toISOString();
      const idLote = criarIdLoteUpload();
      const itens = indicesParaEnviar.map(({ arquivo, indice }, posicao) => {
        const analise = analiseNomesCentralUpload[indice] || {};
        return {
          indice: posicao,
          nomeOriginal: arquivo.name || "",
          nomeFinalPrevisto: analise.nomeFinalPrevisto || limparNomeArquivoPdf(arquivo.name),
          nomeFinalReal: "",
          tamanhoLocalBytes: Number(arquivo.size || 0),
          status: "pendente",
          driveId: "",
          driveItemId: "",
          listItemId: "",
          arquivoExiste: false,
          tamanhoRemotoBytes: null,
          conferenciaTamanhoOk: false,
          pendencias: []
        };
      });
      const sessao = {
        idLote,
        idExecucaoAtual: idExecucaoUploadAtual,
        criadoEm: agora,
        atualizadoEm: agora,
        statusLote: "enviando",
        gaveta,
        motivo,
        totalArquivos: itens.length,
        itens
      };
      if (!salvarSessaoUploadLocal(sessao)) return null;
      idSessaoUploadEmUso = idLote;
      indicesSessaoUploadPorArquivo = [];
      indicesParaEnviar.forEach(({ indice }, posicao) => {
        indicesSessaoUploadPorArquivo[indice] = posicao;
      });
      renderizarAvisoSessaoUploadInterrompida();
      return sessao;
    }

    function atualizarItemSessaoUpload(indiceArquivo, alteracoes = {}) {
      const sessao = lerSessaoUploadLocal();
      if (!sessao || sessao.idLote !== idSessaoUploadEmUso) return null;
      const indiceItem = indicesSessaoUploadPorArquivo[indiceArquivo];
      if (!Number.isInteger(indiceItem) || !sessao.itens[indiceItem]) return sessao;
      sessao.itens[indiceItem] = {
        ...sessao.itens[indiceItem],
        ...alteracoes,
        pendencias: Array.isArray(alteracoes.pendencias)
          ? [...new Set(alteracoes.pendencias)]
          : sessao.itens[indiceItem].pendencias
      };
      sessao.statusLote = sessao.itens.every(item => STATUS_SESSAO_UPLOAD_RESOLVIDOS.has(item.status))
        ? "concluido"
        : "enviando";
      salvarSessaoUploadLocal(sessao);
      renderizarAvisoSessaoUploadInterrompida();
      return sessao;
    }

    function concluirOuManterSessaoUpload() {
      const sessao = lerSessaoUploadLocal();
      if (!sessao || sessao.idLote !== idSessaoUploadEmUso) return;
      const resolvida = sessao.itens.every(item => STATUS_SESSAO_UPLOAD_RESOLVIDOS.has(item.status));
      if (resolvida) {
        apagarSessaoUploadLocal(sessao.idLote);
        return;
      }
      sessao.statusLote = "interrompido";
      salvarSessaoUploadLocal(sessao);
      renderizarAvisoSessaoUploadInterrompida();
    }

    function formatarDataHoraSessaoUpload(valor) {
      const data = new Date(valor);
      return Number.isNaN(data.getTime()) ? "data não identificada" : data.toLocaleString("pt-BR");
    }

    function renderizarAvisoSessaoUploadInterrompida() {
      const aviso = document.getElementById("avisoSessaoUploadInterrompida");
      const detalhe = document.getElementById("detalheSessaoUploadInterrompida");
      const painel = document.getElementById("painelSessaoUploadInterrompida");
      if (!aviso || !detalhe) return;
      const sessao = lerSessaoUploadLocal();
      const deveMostrar = deveMostrarAvisoSessaoUpload(sessao);
      aviso.hidden = !deveMostrar;
      if (!deveMostrar) {
        if (painel) painel.hidden = true;
        return;
      }
      detalhe.textContent = `Encontramos um envio iniciado em ${formatarDataHoraSessaoUpload(sessao.criadoEm)} com ${sessao.totalArquivos || sessao.itens.length} arquivo(s). Antes de enviar novamente, verifique quais arquivos chegaram ao sistema.`;
    }

    function montarGrupoSessaoUpload(titulo, itens) {
      const exibidos = itens.slice(0, LIMITE_ITENS_EXIBIDOS_SESSAO_UPLOAD);
      const restantes = Math.max(0, itens.length - exibidos.length);
      return `
        <section class="grupoSessaoUpload">
          <strong>${escaparHtml(titulo)} (${itens.length})</strong>
          ${exibidos.length ? `<ul>${exibidos.map(item => `<li>${escaparHtml(item.nomeFinalReal || item.nomeFinalPrevisto || item.nomeOriginal)}</li>`).join("")}</ul>` : "<small>Nenhum arquivo.</small>"}
          ${restantes ? `<small>Mais ${restantes} item(ns) não exibido(s).</small>` : ""}
        </section>
      `;
    }

    function renderizarPainelSessaoUpload(sessao) {
      const painel = document.getElementById("painelSessaoUploadInterrompida");
      const resumo = document.getElementById("resumoSessaoUploadInterrompida");
      const grupos = document.getElementById("gruposSessaoUploadInterrompida");
      if (!painel || !resumo || !grupos || !sessao) return;
      const encontrados = sessao.itens.filter(item => item.status === "enviado");
      const atencao = sessao.itens.filter(item => item.status === "enviado-atencao");
      const naoEncontrados = sessao.itens.filter(item => item.status === "nao-encontrado" || item.status === "nao-enviado");
      resumo.textContent = `${sessao.itens.length} arquivo(s) no lote. ${encontrados.length} encontrado(s), ${atencao.length} precisa(m) de atenção e ${naoEncontrados.length} não encontrado(s).`;
      grupos.innerHTML = [
        montarGrupoSessaoUpload("Enviados encontrados", encontrados),
        montarGrupoSessaoUpload("Enviados com atenção", atencao),
        montarGrupoSessaoUpload("Não encontrados", naoEncontrados)
      ].join("");
      document.getElementById("btnSelecionarReenvioSessaoUpload")?.toggleAttribute("disabled", naoEncontrados.length === 0);
      painel.hidden = false;
    }

    function formatarTamanhoUpload(bytes) {
      const tamanho = Number(bytes) || 0;
      if (tamanho >= 1024 * 1024) {
        return `${(tamanho / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
      }
      return `${Math.max(1, Math.round(tamanho / 1024))} KB`;
    }

window.abrirSeletorNovoDocumento = function () {
      abrirCentralUpload();
    };

    window.abrirCentralUpload = function () {
      const central = document.getElementById("centralUpload");
      if (!central) return;
      central.classList.add("aberta");
      marcarCamadaAbertaAcessivel("centralUpload", "#centralUploadTitulo");
      registrarCamadaHistoricoMobile();
      document.getElementById("gavetaUpload").innerHTML = opcoesGavetaHtml();
      uploadConcluidoComSucesso = false;
      uploadTeveErro = false;
      atualizarProgressoUpload(0, "Aguardando arquivos", "Selecione os arquivos do aluno para enviar.", "");
      renderizarListaCentralUpload();
      renderizarAvisoSessaoUploadInterrompida();
    };

    function centralUploadTemRascunho() {
      const gaveta = (document.getElementById("gavetaUpload")?.value || "").trim();
      const motivo = (document.getElementById("motivoUpload")?.value || "").trim();
      return arquivosCentralUpload.length > 0 || !!gaveta || !!motivo;
    }

    function atualizarAcoesCentralUpload() {
      const btnConfirmar = document.getElementById("btnConfirmarUploadCentral");
      const btnConcluir = document.getElementById("btnConcluirUploadCentral");
      const btnEnviarMais = document.getElementById("btnEnviarMaisUploadCentral");
      const envioProcessado = uploadConcluidoComSucesso || uploadTeveErro;
      const temReprocessavel = arquivosCentralUpload.some((_, indice) =>
        STATUS_UPLOAD_REPROCESSAVEIS.has(textoStatusUpload(statusArquivosUpload[indice]))
      );
      const podeEnviar = arquivosCentralUpload.length > 0 && !uploadEmAndamento && temReprocessavel;

      if (btnConfirmar) {
        btnConfirmar.style.display = podeEnviar ? "inline-block" : "none";
        btnConfirmar.disabled = uploadEmAndamento || !podeEnviar;
      }

      if (btnConcluir) {
        btnConcluir.style.display = envioProcessado ? "inline-block" : "none";
      }

      if (btnEnviarMais) {
        btnEnviarMais.style.display = envioProcessado ? "inline-block" : "none";
      }
    }

    function descartarCentralUpload() {
      arquivosCentralUpload = [];
      statusArquivosUpload = [];
      resultadosArquivosUpload = [];
      analiseNomesCentralUpload = [];
      uploadConcluidoComSucesso = false;
      uploadTeveErro = false;
      document.getElementById("motivoUpload").value = "";
      document.getElementById("gavetaUpload").value = "";
      atualizarProgressoUpload(0, "Aguardando arquivos", "Selecione os arquivos do aluno para enviar.", "");
      renderizarListaCentralUpload();
      atualizarAcoesCentralUpload();
      document.getElementById("centralUpload")?.classList.remove("aberta");
      marcarCamadaFechadaAcessivel("centralUpload");
    }

    function prepararCentralUploadParaNovoEnvio() {
      arquivosCentralUpload = [];
      statusArquivosUpload = [];
      resultadosArquivosUpload = [];
      analiseNomesCentralUpload = [];
      uploadConcluidoComSucesso = false;
      uploadTeveErro = false;
      document.getElementById("motivoUpload").value = "";
      document.getElementById("gavetaUpload").value = "";
      document.getElementById("inputNovoDocumento").value = "";
      atualizarProgressoUpload(0, "Aguardando arquivos", "Selecione os arquivos do aluno para enviar.", "");
      renderizarListaCentralUpload();
      atualizarAcoesCentralUpload();
    }

    function ocultarConfirmacaoFecharUpload() {
      const caixa = document.getElementById("confirmacaoFecharUpload");
      if (caixa) caixa.style.display = "none";
    }

    function mostrarConfirmacaoFecharUpload() {
      const caixa = document.getElementById("confirmacaoFecharUpload");
      if (!caixa) {
        return confirm("Você selecionou arquivos que ainda não foram enviados. Deseja sair mesmo assim?");
      }

      caixa.style.display = "flex";
      document.getElementById("btnContinuarUpload")?.focus({ preventScroll: true });
      return false;
    }

    function solicitarFechamentoCentralUpload() {
      if (uploadEmAndamento) {
        mostrarMensagem("O envio está em andamento. Aguarde terminar para evitar falhas.", "erro");
        return false;
      }

      if (uploadTeveErro) {
        const confirmarErro = confirm("Alguns arquivos falharam ou ficaram pendentes. Deseja fechar a Central de Upload mesmo assim?");
        if (!confirmarErro) return false;
        descartarCentralUpload();
        return true;
      }

      if (uploadConcluidoComSucesso) {
        descartarCentralUpload();
        return true;
      }

      if (centralUploadTemRascunho()) {
        return mostrarConfirmacaoFecharUpload();
      }

      descartarCentralUpload();
      return true;
    }

    window.fecharCentralUpload = function () {
      solicitarFechamentoCentralUpload();
    };

    window.continuarCentralUpload = function () {
      ocultarConfirmacaoFecharUpload();
    };

    window.sairSemEnviarCentralUpload = function () {
      ocultarConfirmacaoFecharUpload();
      descartarCentralUpload();
    };

    window.concluirFecharCentralUpload = function () {
      if (uploadEmAndamento) {
        mostrarMensagem("O envio está em andamento. Aguarde terminar para evitar falhas.", "erro");
        return;
      }
      descartarCentralUpload();
    };

    window.prepararNovoEnvioCentralUpload = function () {
      if (uploadEmAndamento) {
        mostrarMensagem("O envio está em andamento. Aguarde terminar para iniciar outro.", "erro");
        return;
      }

      prepararCentralUploadParaNovoEnvio();
      escolherArquivosCentralUpload();
    };

/* INICIO_TOGGLE_UPLOAD_HERO_20260527 */
    window.alternarCentralUploadHero = function () {
      const central = document.getElementById("centralUpload");
      const centralAberta = central && central.classList.contains("aberta");

      if (centralAberta) {
        if (typeof fecharCentralUpload === "function") {
          fecharCentralUpload();
          return;
        }

        central.classList.remove("aberta");
        marcarCamadaFechadaAcessivel("centralUpload");
        return;
      }

      if (typeof abrirSeletorNovoDocumento === "function") {
        abrirSeletorNovoDocumento();
      }
    };
/* FIM_TOGGLE_UPLOAD_HERO_20260527 */
    window.escolherArquivosCentralUpload = function () {
      document.getElementById("inputNovoDocumento")?.click();
    };

    window.receberArquivosCentralUpload = function (input) {
      idSessaoUploadEmUso = "";
      indicesSessaoUploadPorArquivo = [];
      reenvioSessaoUploadAtivo = false;
      arquivosCentralUpload = Array.from(input?.files || []);
      statusArquivosUpload = arquivosCentralUpload.map(() => "Pendente");
      resultadosArquivosUpload = arquivosCentralUpload.map(() => null);
      resetarEstadoAoSelecionarArquivosUpload();
      calcularAnaliseNomesCentralUpload();
      ocultarConfirmacaoFecharUpload();
      input.value = "";
      abrirCentralUpload();
      renderizarListaCentralUpload();
      atualizarAcoesCentralUpload();
    };

    window.limparCentralUpload = function () {
      if (uploadEmAndamento) {
        mostrarMensagem("O envio está em andamento. Aguarde terminar para evitar falhas.", "erro");
        return;
      }

      arquivosCentralUpload = [];
      statusArquivosUpload = [];
      resultadosArquivosUpload = [];
      analiseNomesCentralUpload = [];
      uploadConcluidoComSucesso = false;
      uploadTeveErro = false;
      ocultarConfirmacaoFecharUpload();
      document.getElementById("motivoUpload").value = "";
      document.getElementById("gavetaUpload").value = "";
      atualizarProgressoUpload(0, "Aguardando arquivos", "Selecione os arquivos do aluno para enviar.", "");
      renderizarListaCentralUpload();
      atualizarAcoesCentralUpload();
    };

    function textoStatusUpload(status) {
      return status || "Pendente";
    }

    function resetarEstadoAoSelecionarArquivosUpload() {
      uploadConcluidoComSucesso = false;
      uploadTeveErro = false;
      const uploadRealEmAndamento = uploadEmAndamento && document.getElementById("btnFecharCentralUpload")?.classList.contains("desativado");
      if (!uploadRealEmAndamento) uploadEmAndamento = false;
    }

    function classeStatusUpload(status) {
      const texto = textoStatusUpload(status);
      if (texto === STATUS_UPLOAD_AVISO) return "Aviso";
      if (texto === STATUS_UPLOAD_NAO_ENVIADO) return "ErroReal";
      return escaparHtml(texto).replace(/\s+/g, "");
    }

    function calcularAnaliseNomesCentralUpload() {
      const ocupadosAntesEnvio = criarConjuntoNomesUploadOcupados();
      const ocupadosDuranteAnalise = new Set(ocupadosAntesEnvio);
      const vistosNaSelecao = new Set();

      analiseNomesCentralUpload = arquivosCentralUpload.map((arquivo, indice) => {
        const nomeSolicitado = limparNomeArquivoPdf(arquivo.name);
        const chave = normalizarTexto(nomeSolicitado);
        const statusAtual = textoStatusUpload(statusArquivosUpload[indice]);
        const resultado = resultadosArquivosUpload[indice];
        const jaEnviado = STATUS_UPLOAD_NAO_REENVIAR.has(statusAtual) && resultado?.nomeFinal;
        const nomeJaExistiaAntes = !jaEnviado && ocupadosAntesEnvio.has(chave);
        const repetidoNaSelecao = !jaEnviado && vistosNaSelecao.has(chave);
        const nomeFinalPrevisto = jaEnviado
          ? resultado.nomeFinal
          : gerarNomeLivreUploadPdfComOcupados(nomeSolicitado, ocupadosDuranteAnalise);
        const nomeFoiAjustado = normalizarTexto(nomeFinalPrevisto) !== chave;

        if (!jaEnviado) {
          ocupadosDuranteAnalise.add(normalizarTexto(nomeFinalPrevisto));
        }
        vistosNaSelecao.add(chave);

        return {
          nomeSolicitado,
          nomeJaExistiaAntes,
          repetidoNaSelecao,
          nomeFinalPrevisto,
          nomeFoiAjustado,
          nomeRepetido: nomeJaExistiaAntes || repetidoNaSelecao,
          arquivoGrande: (arquivo.size || 0) > LIMITE_UPLOAD_SIMPLES_BYTES
        };
      });

      return analiseNomesCentralUpload;
    }

    function obterAvisoNomeUpload(analise) {
      if (!analise?.nomeRepetido) return "";

      if (analise.nomeJaExistiaAntes) {
        const nomeFinal = analise.nomeFinalPrevisto || analise.nomeSolicitado;
        return `Possível duplicidade — será salvo como ${nomeFinal} para evitar substituição. Confira na Central após o envio.`;
      }

      if (analise.repetidoNaSelecao) {
        return "Possível duplicidade na seleção — um dos arquivos será salvo com numeração.";
      }

      return "";
    }

    function renderizarListaCentralUpload() {
      const lista = document.getElementById("listaArquivosUpload");
      const contador = document.getElementById("contadorArquivosUpload");
      if (!lista || !contador) return;

      contador.textContent = `${arquivosCentralUpload.length} arquivo(s) selecionado(s)`;

      if (!arquivosCentralUpload.length) {
        lista.innerHTML = "<li>Nenhum arquivo selecionado.</li>";
        atualizarAcoesCentralUpload();
        return;
      }

      const analiseNomes = analiseNomesCentralUpload.length === arquivosCentralUpload.length
        ? analiseNomesCentralUpload
        : calcularAnaliseNomesCentralUpload();

      lista.innerHTML = arquivosCentralUpload.map((arquivo, indice) => {
        const analise = analiseNomes[indice] || {};
        const avisoNome = obterAvisoNomeUpload(analise);
        const nomeRepetido = !!avisoNome;
        const arquivoGrande = analise.arquivoGrande;
        return `
        <li class="statusUpload${classeStatusUpload(statusArquivosUpload[indice])}${nomeRepetido ? " uploadNomeRepetido" : ""}${arquivoGrande ? " uploadNomeRepetido" : ""}">
          <strong>${escaparHtml(arquivo.name)}</strong>
          <span>${escaparHtml(formatarTamanhoUpload(arquivo.size))}</span>
          <small>${escaparHtml(textoStatusUpload(statusArquivosUpload[indice]))}</small>
          ${avisoNome ? `<small class="avisoNomeRepetido">${escaparHtml(avisoNome)}</small>` : ""}
          ${arquivoGrande ? "<small class=\"avisoNomeRepetido avisoArquivoGrande\">Arquivo grande — será enviado em blocos</small><small class=\"avisoNomeRepetido avisoArquivoGrande\">Arquivo grande — conferência automática de envio será feita ao final.</small>" : ""}
        </li>
      `;
      }).join("");
      atualizarAcoesCentralUpload();
    }

    function atualizarStatusArquivoUpload(indice, status) {
      statusArquivosUpload[indice] = status;
      renderizarListaCentralUpload();
    }

    function atualizarProgressoUpload(percentual, etapa, detalhe, arquivoAtual) {
      const barra = document.getElementById("barraProgressoUpload");
      const porcentagem = document.getElementById("percentualUpload");
      const etapaEl = document.getElementById("etapaUpload");
      const detalheEl = document.getElementById("detalheUpload");
      const arquivoEl = document.getElementById("arquivoAtualUpload");
      const valor = Math.max(0, Math.min(100, Math.round(percentual || 0)));

      if (barra) barra.style.width = `${valor}%`;
      if (porcentagem) porcentagem.textContent = `${valor}%`;
      if (etapaEl) etapaEl.textContent = etapa || "Aguardando";
      if (detalheEl) detalheEl.textContent = detalhe || "";
      if (arquivoEl) arquivoEl.textContent = arquivoAtual ? `Enviando: ${arquivoAtual}` : "";
    }

    async function obterListItemIdDoDriveItem(driveId, driveItemId, token) {
      const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${driveItemId}/listItem?$select=id`;
      const resposta = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resposta.ok) {
        throw new Error(await resposta.text());
      }

      const dados = await resposta.json();
      return dados.id;
    }

    async function obterMetadadoRemotoDriveItem(driveId, driveItemId, token) {
      if (!driveId || !driveItemId) throw new Error("Drive item não identificado para conferir o upload.");
      const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${driveItemId}?$select=id,name,size,parentReference`;
      const resposta = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resposta.ok) throw new Error(await resposta.text());
      return resposta.json();
    }

    async function obterMetadadoDriveItemPorListItem(listItemId, token) {
      if (!listItemId) return null;
      const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/items/${listItemId}/driveItem?$select=id,name,size,parentReference`;
      const resposta = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resposta.ok) throw new Error(await resposta.text());
      return resposta.json();
    }

    async function conferirTamanhoUpload(arquivo, driveItem, contexto = {}) {
      const tamanhoLocalBytes = Number(arquivo?.size);
      let itemRemoto = driveItem || null;
      let tamanhoRemotoBytes = itemRemoto?.size === undefined || itemRemoto?.size === null
        ? NaN
        : Number(itemRemoto.size);
      if (!Number.isFinite(tamanhoRemotoBytes)) {
        try {
          itemRemoto = await obterMetadadoRemotoDriveItem(
            contexto.driveId || itemRemoto?.parentReference?.driveId,
            contexto.driveItemId || itemRemoto?.id,
            contexto.token
          );
          tamanhoRemotoBytes = itemRemoto?.size === undefined || itemRemoto?.size === null
            ? NaN
            : Number(itemRemoto.size);
        } catch (erro) {
          logger.warn("Nao foi possivel confirmar o tamanho remoto do upload.", erro);
        }
      }
      const tamanhoConfirmado = Number.isFinite(tamanhoLocalBytes) && Number.isFinite(tamanhoRemotoBytes);
      const ok = tamanhoConfirmado && tamanhoLocalBytes === tamanhoRemotoBytes;
      return {
        ok,
        tamanhoLocalBytes,
        tamanhoRemotoBytes: Number.isFinite(tamanhoRemotoBytes) ? tamanhoRemotoBytes : null,
        pendencia: ok ? "" : "conferencia-tamanho",
        driveItem: itemRemoto
      };
    }

    async function atualizarGavetaItemSharePoint(listItemId, gaveta, token) {
      const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/items/${listItemId}/fields`;
      const resposta = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ GAVETA: gaveta })
      });

      if (!resposta.ok) {
        throw new Error(await resposta.text());
      }
    }

    async function carregarDocumentoPorListItemId(listItemId, token) {
      const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/items/${listItemId}?$expand=fields($select=FileLeafRef,FileRef,UniqueId,Modified,FileDirRef,FSObjType,GAVETA)`;
      const resposta = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resposta.ok) {
        throw new Error(await resposta.text());
      }

      const item = await resposta.json();
      const campos = item.fields || {};
      return {
        nome: campos.FileLeafRef || "",
        caminho: campos.FileRef || "",
        fileDirRef: campos.FileDirRef || "",
        status: campos.FileDirRef === `${CONFIG.documentosAtivosRootPath}/_ARQUIVADOS` ? "ARQUIVADO" : "ATIVO",
        id: campos.UniqueId || "",
        listItemId: item.id,
        driveItemId: "",
        driveId: "",
        link: campos.FileRef ? "https://eduieda.sharepoint.com" + campos.FileRef : "",
        modificado: campos.Modified || "",
        gaveta: campos.GAVETA || ""
      };
    }

    async function carregarDocumentoPorDriveItem(driveId, driveItemId, token) {
      if (!driveId || !driveItemId) return null;
      const listItemId = await obterListItemIdDoDriveItem(driveId, driveItemId, token);
      return carregarDocumentoPorListItemId(listItemId, token);
    }

    async function carregarDocumentoPorNomeFinal(driveId, nomeFinal, token) {
      if (!driveId || !nomeFinal) return null;
      const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURIComponent(nomeFinal)}:/listItem?$select=id`;
      const resposta = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resposta.ok) return null;
      const item = await resposta.json();
      if (!item?.id) return null;
      return carregarDocumentoPorListItemId(item.id, token);
    }

    async function localizarArquivoCriadoUpload(resultado, contexto = {}) {
      const token = contexto.token || await obterToken();
      const driveId = resultado?.driveId || contexto.driveId || await obterDriveDocumentosAtivos();

      if (resultado?.listItemId) {
        try {
          return await carregarDocumentoPorListItemId(resultado.listItemId, token);
        } catch (erro) {
          logger.warn("Nao foi possivel localizar upload parcial por listItemId.", erro);
        }
      }

      if (resultado?.driveItemId) {
        try {
          return await carregarDocumentoPorDriveItem(driveId, resultado.driveItemId, token);
        } catch (erro) {
          logger.warn("Nao foi possivel localizar upload parcial por driveItemId.", erro);
        }
      }

      if (resultado?.nomeFinal) {
        try {
          const documento = await carregarDocumentoPorNomeFinal(driveId, resultado.nomeFinal, token);
          if (documento) return documento;
        } catch (erro) {
          logger.warn("Nao foi possivel localizar upload parcial por nomeFinal.", erro);
        }

        const nomeNormalizado = normalizarTexto(resultado.nomeFinal);
        return documentosAtivos.find(doc => normalizarTexto(doc.nome) === nomeNormalizado) || null;
      }

      return null;
    }

    async function historicoEquivalenteJaRegistrado(documento, acao, observacao, tokenInformado = "") {
      const arquivoId = obterIdArquivoDocumento(documento);
      const acaoNormalizada = normalizarTexto(acao || "");
      const observacaoNormalizada = normalizarTexto(observacao || "");
      const existeEquivalente = lista => lista.some(item =>
        String(item.ARQUIVO_ID || "") === arquivoId &&
        normalizarTexto(item.ACAO || "") === acaoNormalizada &&
        normalizarTexto(item.OBSERVACAO || "") === observacaoNormalizada
      );

      if (existeEquivalente(historicoCarregado)) return true;
      if (!arquivoId) return false;

      try {
        const token = tokenInformado || await obterToken();
        const itens = await carregarHistoricoPorArquivoId(arquivoId, token);
        mesclarHistoricoNoCache(itens);
        return existeEquivalente(itens);
      } catch (erro) {
        logger.warn("Falha ao conferir histórico equivalente diretamente no SharePoint.", erro);
        return false;
      }
    }

    async function repararUploadParcial(resultado, contexto = {}) {
      const token = contexto.token || await obterToken();
      const driveId = resultado?.driveId || contexto.driveId || await obterDriveDocumentosAtivos();
      const documento = await localizarArquivoCriadoUpload(resultado, { ...contexto, token, driveId });

      if (!documento) {
        return {
          status: STATUS_UPLOAD_NAO_ENVIADO,
          arquivoExiste: false,
          documento: null,
          pendencias: ["arquivo-nao-localizado"]
        };
      }

      const pendencias = [...new Set((resultado?.pendencias || []).filter(item => item === "conferencia-tamanho"))];
      const gavetaEsperada = (contexto.gaveta || "").trim();
      if (gavetaEsperada && chaveComparacaoGaveta(documento.gaveta) !== chaveComparacaoGaveta(gavetaEsperada)) {
        let gavetaAtualizada = false;
        for (let tentativa = 0; tentativa < 2 && !gavetaAtualizada; tentativa++) {
          try {
            await atualizarGavetaItemSharePoint(documento.listItemId, gavetaEsperada, token);
            documento.gaveta = gavetaEsperada;
            gavetaAtualizada = true;
          } catch (erro) {
            logger.warn("Nao foi possivel reparar gaveta do upload parcial.", erro);
          }
        }
        if (!gavetaAtualizada) pendencias.push("gaveta");
      }

      if (contexto.observacaoEnvio && !(await historicoEquivalenteJaRegistrado(documento, "ENVIOU", contexto.observacaoEnvio, token))) {
        try {
          await registrarHistorico(documento, "ENVIOU", contexto.observacaoEnvio);
        } catch (erro) {
          logger.warn("Nao foi possivel reparar historico do upload parcial.", erro);
          pendencias.push("historico");
        }
      }

      return {
        status: pendencias.length ? STATUS_UPLOAD_AVISO : STATUS_UPLOAD_ENVIADO,
        arquivoExiste: true,
        documento,
        pendencias
      };
    }

    function aguardarUpload(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function obterEsperaRetryUpload(resposta, tentativa) {
      const retryAfter = resposta?.headers?.get?.("Retry-After");
      if (retryAfter) {
        const segundos = Number(retryAfter);
        if (Number.isFinite(segundos)) return Math.max(1000, segundos * 1000);

        const data = Date.parse(retryAfter);
        if (!Number.isNaN(data)) return Math.max(1000, data - Date.now());
      }

      return Math.min(1000 * Math.pow(2, tentativa), 8000);
    }

    function erroUploadSessionAmbiguo(nomeFinal, causa) {
      const erro = new Error(`Falha ambigua ao concluir upload grande de ${nomeFinal}. Verifique o SharePoint antes de reenviar.`);
      erro.uploadParcial = true;
      erro.causaOriginal = causa;
      return erro;
    }

    async function criarUploadSessionPdf(driveId, nomeFinal, token) {
      const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURIComponent(nomeFinal)}:/createUploadSession`;
      const resposta = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          item: {
            "@microsoft.graph.conflictBehavior": "fail",
            name: nomeFinal
          }
        })
      });

      if (!resposta.ok) {
        throw new Error(await resposta.text());
      }

      const dados = await resposta.json();
      if (!dados.uploadUrl) {
        throw new Error("Graph não retornou URL de sessão de upload.");
      }

      return dados.uploadUrl;
    }

    async function enviarBlocoUploadSession(uploadUrl, bloco, inicio, fim, total, ultimoBloco) {
      let tentativa = 0;
      while (true) {
        let resposta;
        try {
          resposta = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Range": `bytes ${inicio}-${fim - 1}/${total}`
            },
            body: bloco
          });
        } catch (erroRede) {
          if (ultimoBloco && tentativa >= MAX_TENTATIVAS_EXTRAS_BLOCO_UPLOAD) {
            throw erroRede;
          }
          if (tentativa >= MAX_TENTATIVAS_EXTRAS_BLOCO_UPLOAD) throw erroRede;
          await aguardarUpload(Math.min(1000 * Math.pow(2, tentativa), 8000));
          tentativa++;
          continue;
        }

        if (resposta.ok) return resposta;

        const podeTentar = resposta.status === 408 || resposta.status === 429 || resposta.status >= 500;
        if (!podeTentar || tentativa >= MAX_TENTATIVAS_EXTRAS_BLOCO_UPLOAD) {
          const detalhe = await resposta.text();
          const erro = new Error(detalhe || `Falha no bloco de upload. HTTP ${resposta.status}`);
          erro.status = resposta.status;
          throw erro;
        }

        await aguardarUpload(obterEsperaRetryUpload(resposta, tentativa));
        tentativa++;
      }
    }

    async function enviarArquivoPdfComUploadSession(arquivo, driveId, nomeFinal, token, onProgresso = () => {}) {
      const uploadUrl = await criarUploadSessionPdf(driveId, nomeFinal, token);
      const total = arquivo.size || 0;
      let enviados = 0;
      let driveItemFinal = null;
      const totalBlocos = Math.max(1, Math.ceil(total / TAMANHO_BLOCO_UPLOAD_SESSION_BYTES));

      for (let inicio = 0, indiceBloco = 1; inicio < total; inicio += TAMANHO_BLOCO_UPLOAD_SESSION_BYTES, indiceBloco++) {
        const fim = Math.min(inicio + TAMANHO_BLOCO_UPLOAD_SESSION_BYTES, total);
        const bloco = arquivo.slice(inicio, fim);
        const ultimoBloco = fim >= total;

        onProgresso({
          enviados,
          total,
          percentual: total ? (enviados / total) * 100 : 0,
          etapa: `Enviando bloco ${indiceBloco} de ${totalBlocos}`
        });

        let resposta;
        try {
          resposta = await enviarBlocoUploadSession(uploadUrl, bloco, inicio, fim, total, ultimoBloco);
        } catch (erroBloco) {
          if (ultimoBloco) throw erroUploadSessionAmbiguo(nomeFinal, erroBloco);
          throw erroBloco;
        }

        enviados = fim;
        onProgresso({
          enviados,
          total,
          percentual: total ? (enviados / total) * 100 : 100,
          etapa: `Enviando bloco ${indiceBloco} de ${totalBlocos}`
        });

        if (ultimoBloco) {
          try {
            driveItemFinal = await resposta.json();
          } catch (erroJson) {
            throw erroUploadSessionAmbiguo(nomeFinal, erroJson);
          }
        }
      }

      if (!driveItemFinal?.id) {
        throw erroUploadSessionAmbiguo(nomeFinal, new Error("Upload session terminou sem driveItem final."));
      }

      return driveItemFinal;
    }

    async function enviarArquivoPdfComMetadados(arquivo, gaveta, motivo, ocupados, onEtapa = () => {}, opcoes = {}) {
      const validacaoPdf = await validarArquivoPdfBasico(arquivo);
      if (!validacaoPdf.valido) {
        throw new Error(`Arquivo ignorado porque não é PDF real: ${arquivo.name}. ${validacaoPdf.mensagem}`);
      }

      onEtapa("Preparando envio");
      const token = await obterToken();
      const driveId = await obterDriveDocumentosAtivos();
      const nomeSolicitado = limparNomeArquivoPdf(arquivo.name);
      const nomeFinal = opcoes.nomeFinalPrevisto || gerarNomeLivreUploadPdfComOcupados(nomeSolicitado, ocupados);
      ocupados.add(normalizarTexto(nomeFinal));
      const nomeFoiAjustado = normalizarTexto(nomeFinal) !== normalizarTexto(nomeSolicitado);
      const usarUploadSession = (arquivo.size || 0) > LIMITE_UPLOAD_SIMPLES_BYTES;
      let driveItem;
      let arquivoCriado = false;
      let driveItemId = "";
      let listItemId = "";
      let caminho = "";
      let conferenciaTamanho = null;
      let observacaoEnvio = "";

      if (usarUploadSession) {
        onEtapa("Criando upload session");
        driveItem = await enviarArquivoPdfComUploadSession(arquivo, driveId, nomeFinal, token, progresso => {
          onEtapa(progresso.etapa || "Enviando arquivo grande", progresso);
        });
      } else {
        onEtapa("Enviando arquivo");
        const urlUpload = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURIComponent(nomeFinal)}:/content`;
        const respostaUpload = await fetch(urlUpload, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/pdf"
          },
          body: arquivo
        });

        if (!respostaUpload.ok) {
          throw new Error(await respostaUpload.text());
        }

        driveItem = await respostaUpload.json();
      }

      arquivoCriado = true;
      driveItemId = driveItem?.id || "";
      caminho = driveItem?.parentReference?.path ? `${driveItem.parentReference.path}/${nomeFinal}` : "";
      onEtapa("Conferindo tamanho", {
        driveId,
        driveItemId,
        nomeFinal,
        arquivoCriado: true
      });
      conferenciaTamanho = await conferirTamanhoUpload(arquivo, driveItem, { driveId, driveItemId, token });
      const textoConferencia = conferenciaTamanho.ok
        ? "Conferência automática: tamanho confirmado."
        : "Conferência automática: tamanho não confirmado. Não reenviar sem revisar.";
      observacaoEnvio = nomeFoiAjustado
        ? `${motivo} Gaveta: ${gaveta}. Nome original: ${nomeSolicitado}. Enviado automaticamente como: ${nomeFinal}, para evitar substituicao acidental. ${textoConferencia}`
        : `${motivo} Gaveta: ${gaveta}. ${textoConferencia}`;

      try {
        listItemId = await obterListItemIdDoDriveItem(driveId, driveItemId, token);
        onEtapa("Arquivo criado", {
          driveId,
          driveItemId,
          listItemId,
          nomeFinal,
          arquivoCriado: true,
          conferenciaTamanho
        });
        onEtapa("Salvando gaveta");
        await atualizarGavetaItemSharePoint(listItemId, gaveta, token);
        const documentoNovo = await carregarDocumentoPorListItemId(listItemId, token);

        onEtapa("Registrando no histórico");
        await registrarHistorico(documentoNovo, "ENVIOU", observacaoEnvio);
      } catch (erroConclusao) {
        const erroParcial = new Error(`Arquivo enviado como ${nomeFinal}, mas houve falha ao salvar gaveta ou histórico. Verifique o SharePoint antes de reenviar.`);
        erroParcial.uploadParcial = true;
        erroParcial.arquivoCriado = arquivoCriado;
        erroParcial.nomeFinal = nomeFinal;
        erroParcial.driveItemId = driveItemId;
        erroParcial.driveId = driveId;
        erroParcial.listItemId = listItemId;
        erroParcial.caminho = caminho;
        erroParcial.nomeSolicitado = nomeSolicitado;
        erroParcial.nomeFoiAjustado = nomeFoiAjustado;
        erroParcial.observacaoEnvio = observacaoEnvio;
        erroParcial.conferenciaTamanho = conferenciaTamanho;
        erroParcial.pendencias = conferenciaTamanho?.ok ? ["conclusao-pos-upload"] : ["conclusao-pos-upload", "conferencia-tamanho"];
        erroParcial.mensagemUsuario = "Arquivo enviado. Não reenviar. O sistema tentará concluir os ajustes internos.";
        erroParcial.causaOriginal = erroConclusao;
        throw erroParcial;
      }

      const pendencias = conferenciaTamanho.ok ? [] : ["conferencia-tamanho"];
      return {
        arquivoCriado,
        arquivoExiste: true,
        nomeSolicitado,
        nomeFinal,
        nomeFoiAjustado,
        driveId,
        driveItemId,
        listItemId,
        caminho,
        observacaoEnvio,
        tamanhoLocalBytes: conferenciaTamanho.tamanhoLocalBytes,
        tamanhoRemotoBytes: conferenciaTamanho.tamanhoRemotoBytes,
        conferenciaTamanhoOk: conferenciaTamanho.ok,
        pendencias,
        status: conferenciaTamanho.ok ? STATUS_UPLOAD_ENVIADO : STATUS_UPLOAD_AVISO
      };
    }

    function reconciliarStatusUploadComDocumentosAtivos() {
      const nomesAtivos = new Set((documentosAtivos || []).map(doc => normalizarTexto(doc.nome)));

      resultadosArquivosUpload = resultadosArquivosUpload.map((resultado, indice) => {
        if (!resultado) return resultado;
        const statusAtual = textoStatusUpload(statusArquivosUpload[indice]);
        const nomeFinal = resultado.nomeFinal || "";
        const existeNaLista = nomeFinal && nomesAtivos.has(normalizarTexto(nomeFinal));
        const temEvidenciaArquivoCriado = !!(resultado.arquivoExiste || resultado.documento || resultado.driveItemId || resultado.listItemId);

        if (existeNaLista && (statusAtual === STATUS_UPLOAD_NAO_ENVIADO || statusAtual === STATUS_UPLOAD_AVISO)) {
          const novoStatus = resultado.pendencias?.length ? STATUS_UPLOAD_AVISO : STATUS_UPLOAD_ENVIADO;
          statusArquivosUpload[indice] = novoStatus;
          return { ...resultado, status: novoStatus, arquivoExiste: true };
        }

        if (!existeNaLista && statusAtual === STATUS_UPLOAD_AVISO && temEvidenciaArquivoCriado) {
          statusArquivosUpload[indice] = STATUS_UPLOAD_AVISO;
          return {
            ...resultado,
            status: STATUS_UPLOAD_AVISO,
            arquivoExiste: true,
            pendencias: resultado.pendencias?.length ? resultado.pendencias : ["confirmar-listagem-sharepoint"]
          };
        }

        if (!existeNaLista && statusAtual === STATUS_UPLOAD_AVISO) {
          statusArquivosUpload[indice] = STATUS_UPLOAD_NAO_ENVIADO;
          return { ...resultado, status: STATUS_UPLOAD_NAO_ENVIADO, arquivoExiste: false };
        }

        return resultado;
      });

      renderizarListaCentralUpload();
    }

    function resumirStatusUpload() {
      return statusArquivosUpload.reduce((resumo, status) => {
        const texto = textoStatusUpload(status);
        resumo.processados++;
        if (texto === STATUS_UPLOAD_AVISO) resumo.avisos++;
        else if (texto === STATUS_UPLOAD_NAO_ENVIADO) resumo.naoEnviados++;
        else if (STATUS_UPLOAD_NAO_REENVIAR.has(texto)) resumo.enviados++;
        return resumo;
      }, { processados: 0, enviados: 0, avisos: 0, naoEnviados: 0 });
    }

    function formatarResultadoFinalUpload(resumo, opcoes = {}) {
      const enviadosTotal = resumo.enviados + resumo.avisos;

      if (resumo.naoEnviados > 0) {
        return {
          titulo: "Concluído com arquivos não enviados",
          mensagem: enviadosTotal > 0
            ? `${enviadosTotal} arquivo(s) enviado(s). ${resumo.naoEnviados} não foram enviados. Revise os itens em vermelho.`
            : "Nenhum arquivo foi enviado. Revise os itens em vermelho."
        };
      }

      if (resumo.avisos > 0) {
        return {
          titulo: "Concluído com atenção",
          mensagem: opcoes.temFalhaConferencia
            ? `${enviadosTotal} arquivo(s) enviado(s). Arquivo enviado, mas a conferência automática não confirmou o tamanho. Não reenviar sem revisar.`
            : `${enviadosTotal} arquivo(s) enviado(s). ${resumo.avisos} precisam de atenção e não devem ser reenviados.`
        };
      }

      return {
        titulo: "Concluído",
        mensagem: `${enviadosTotal} arquivo(s) enviado(s) com sucesso.`
      };
    }

    function formatarResumoFinalUpload(resumo) {
      return formatarResultadoFinalUpload(resumo).mensagem;
    }

    window.enviarNovoDocumento = async function (input) {
      idSessaoUploadEmUso = "";
      indicesSessaoUploadPorArquivo = [];
      reenvioSessaoUploadAtivo = false;
      arquivosCentralUpload = Array.from(input?.files || []);
      statusArquivosUpload = arquivosCentralUpload.map(() => "Pendente");
      resultadosArquivosUpload = arquivosCentralUpload.map(() => null);
      resetarEstadoAoSelecionarArquivosUpload();
      calcularAnaliseNomesCentralUpload();
      input.value = "";
      abrirCentralUpload();
      renderizarListaCentralUpload();
      atualizarAcoesCentralUpload();
    };

    window.confirmarUploadCentral = async function () {
      if (uploadEmAndamento) {
        mostrarMensagem("O envio ja esta em andamento. Aguarde terminar.", "erro");
        return;
      }

      const gaveta = (document.getElementById("gavetaUpload").value || "").trim();
      const motivo = (document.getElementById("motivoUpload").value || "").trim();

      if (!arquivosCentralUpload.length) {
        mostrarMensagem("Selecione pelo menos um arquivo do aluno.", "erro");
        return;
      }

      if (!gaveta) {
        mostrarMensagem("Escolha uma gaveta antes de enviar.", "erro");
        return;
      }

      if (!motivo) {
        mostrarMensagem("Informe o motivo para continuar.", "erro");
        return;
      }

      const indicesParaEnviar = arquivosCentralUpload
        .map((arquivo, indice) => ({ arquivo, indice, status: textoStatusUpload(statusArquivosUpload[indice]) }))
        .filter(item => STATUS_UPLOAD_REPROCESSAVEIS.has(item.status));

      if (!indicesParaEnviar.length) {
        mostrarMensagem("Os arquivos já enviados não serão reenviados para evitar duplicidade. Selecione novos arquivos ou limpe a seleção.", "erro");
        atualizarAcoesCentralUpload();
        return;
      }

      uploadEmAndamento = true;
      uploadConcluidoComSucesso = false;
      uploadTeveErro = false;
      calcularAnaliseNomesCentralUpload();
      atualizarAcoesCentralUpload();

      const invalidos = [];
      for (const { arquivo } of indicesParaEnviar) {
        const validacaoPdf = await validarArquivoPdfBasico(arquivo);
        if (!validacaoPdf.valido) {
          invalidos.push({ arquivo, validacaoPdf });
        }
      }

      if (invalidos.length) {
        uploadEmAndamento = false;
        atualizarAcoesCentralUpload();
        mostrarMensagem(`Remova os arquivos que nao sao PDF valido antes de enviar. Primeiro problema: ${invalidos[0].arquivo.name}`, "erro");
        return;
      }

      const sessaoExistente = lerSessaoUploadLocal();
      if (sessaoUploadTemPendencia(sessaoExistente) && sessaoExistente.idLote !== idSessaoUploadEmUso) {
        uploadEmAndamento = false;
        atualizarAcoesCentralUpload();
        renderizarAvisoSessaoUploadInterrompida();
        mostrarMensagem("Existe um envio anterior pendente. Verifique ou ignore esse aviso antes de iniciar outro lote.", "erro");
        return;
      }

      if (!idSessaoUploadEmUso) {
        const sessaoCriada = criarSessaoUploadLocal(gaveta, motivo, indicesParaEnviar);
        if (!sessaoCriada) {
          uploadEmAndamento = false;
          atualizarAcoesCentralUpload();
          mostrarMensagem("Não foi possível criar a proteção local do envio. O lote não foi iniciado.", "erro");
          return;
        }
      }

      try {
        document.getElementById("btnFecharCentralUpload")?.classList.add("desativado");
        mostrarMensagem("Enviando arquivo(s). Aguarde...");
        atualizarProgressoUpload(0, "Preparando envio", `Enviando 0 de ${indicesParaEnviar.length} arquivos`, "");

        const ocupados = criarConjuntoNomesUploadOcupados();
        const total = indicesParaEnviar.length;

        for (let posicao = 0; posicao < indicesParaEnviar.length; posicao++) {
          const { arquivo, indice } = indicesParaEnviar[posicao];
          atualizarStatusArquivoUpload(indice, "Enviando");
          atualizarItemSessaoUpload(indice, { status: "enviando" });
          const basePercentual = (posicao / total) * 100;
          atualizarProgressoUpload(basePercentual, "Enviando arquivo", `Enviando ${posicao + 1} de ${total} arquivos`, arquivo.name);

          try {
            const indiceItemSessao = indicesSessaoUploadPorArquivo[indice];
            const sessaoAtual = lerSessaoUploadLocal();
            const nomeFinalPrevisto = sessaoAtual?.idLote === idSessaoUploadEmUso
              ? sessaoAtual.itens[indiceItemSessao]?.nomeFinalPrevisto
              : "";
            const resultado = await enviarArquivoPdfComMetadados(arquivo, gaveta, motivo, ocupados, (etapa, progressoArquivo) => {
              const percentualArquivo = Number(progressoArquivo?.percentual);
              const percentualTotal = Number.isFinite(percentualArquivo)
                ? basePercentual + (percentualArquivo / 100) * (100 / total)
                : basePercentual;
              const detalheArquivo = progressoArquivo?.total
                ? `${formatarTamanhoUpload(progressoArquivo.enviados)} de ${formatarTamanhoUpload(progressoArquivo.total)}`
                : `Enviando ${posicao + 1} de ${total} arquivos`;
              atualizarProgressoUpload(percentualTotal, etapa, detalheArquivo, arquivo.name);
              if (progressoArquivo?.arquivoCriado) {
                atualizarItemSessaoUpload(indice, {
                  nomeFinalReal: progressoArquivo.nomeFinal || nomeFinalPrevisto,
                  driveId: progressoArquivo.driveId || "",
                  driveItemId: progressoArquivo.driveItemId || "",
                  listItemId: progressoArquivo.listItemId || "",
                  arquivoExiste: true,
                  tamanhoRemotoBytes: progressoArquivo.conferenciaTamanho?.tamanhoRemotoBytes ?? null,
                  conferenciaTamanhoOk: !!progressoArquivo.conferenciaTamanho?.ok,
                  pendencias: progressoArquivo.conferenciaTamanho?.ok ? [] : ["conferencia-tamanho"]
                });
              }
            }, { nomeFinalPrevisto });
            resultadosArquivosUpload[indice] = resultado;
            atualizarStatusArquivoUpload(indice, resultado.status);
            atualizarItemSessaoUpload(indice, {
              status: resultado.status === STATUS_UPLOAD_ENVIADO ? "enviado" : "enviado-atencao",
              nomeFinalReal: resultado.nomeFinal,
              driveId: resultado.driveId,
              driveItemId: resultado.driveItemId,
              listItemId: resultado.listItemId,
              arquivoExiste: true,
              tamanhoRemotoBytes: resultado.tamanhoRemotoBytes,
              conferenciaTamanhoOk: resultado.conferenciaTamanhoOk,
              pendencias: resultado.pendencias
            });
          } catch (erroArquivo) {
            logger.error(erroArquivo);
            if (erroArquivo.uploadParcial || erroArquivo.arquivoCriado) {
              const resultadoParcial = {
                arquivoCriado: true,
                nomeSolicitado: erroArquivo.nomeSolicitado || limparNomeArquivoPdf(arquivo.name),
                nomeFinal: erroArquivo.nomeFinal || limparNomeArquivoPdf(arquivo.name),
                nomeFoiAjustado: !!erroArquivo.nomeFoiAjustado,
                driveId: erroArquivo.driveId || "",
                driveItemId: erroArquivo.driveItemId || "",
                listItemId: erroArquivo.listItemId || "",
                caminho: erroArquivo.caminho || "",
                observacaoEnvio: erroArquivo.observacaoEnvio || `${motivo} Gaveta: ${gaveta}.`,
                status: STATUS_UPLOAD_AVISO,
                tamanhoLocalBytes: Number(arquivo.size || 0),
                tamanhoRemotoBytes: erroArquivo.conferenciaTamanho?.tamanhoRemotoBytes ?? null,
                conferenciaTamanhoOk: !!erroArquivo.conferenciaTamanho?.ok,
                pendencias: erroArquivo.pendencias || ["conclusao-pos-upload", "conferencia-tamanho"]
              };
              const reparo = await repararUploadParcial(resultadoParcial, { gaveta, motivo, observacaoEnvio: resultadoParcial.observacaoEnvio });
              resultadosArquivosUpload[indice] = { ...resultadoParcial, ...reparo };
              atualizarStatusArquivoUpload(indice, reparo.arquivoExiste ? reparo.status : STATUS_UPLOAD_NAO_ENVIADO);
              atualizarItemSessaoUpload(indice, {
                status: reparo.arquivoExiste ? "enviado-atencao" : "nao-enviado",
                nomeFinalReal: resultadoParcial.nomeFinal,
                driveId: resultadoParcial.driveId,
                driveItemId: resultadoParcial.driveItemId,
                listItemId: resultadoParcial.listItemId,
                arquivoExiste: reparo.arquivoExiste,
                tamanhoRemotoBytes: resultadoParcial.tamanhoRemotoBytes,
                conferenciaTamanhoOk: resultadoParcial.conferenciaTamanhoOk,
                pendencias: reparo.pendencias
              });
            } else {
              resultadosArquivosUpload[indice] = {
                nomeSolicitado: limparNomeArquivoPdf(arquivo.name),
                nomeFinal: "",
                status: STATUS_UPLOAD_NAO_ENVIADO,
                erro: erroArquivo.message || String(erroArquivo)
              };
              atualizarStatusArquivoUpload(indice, STATUS_UPLOAD_NAO_ENVIADO);
              atualizarItemSessaoUpload(indice, {
                status: "nao-enviado",
                arquivoExiste: false,
                pendencias: ["envio"]
              });
            }
          }

          atualizarProgressoUpload(((posicao + 1) / total) * 100, "Enviando arquivo", `Enviando ${posicao + 1} de ${total} arquivos`, arquivo.name);
        }

        atualizarProgressoUpload(100, "Atualizando lista", "Atualizando documentos e histórico.", "");
        await new Promise(resolve => setTimeout(resolve, 1200));
        await listarDocumentos();
        reconciliarStatusUploadComDocumentosAtivos();
        if (typeof carregarDadosDeApoio === "function") {
          await carregarDadosDeApoio();
        }
        if (typeof atualizarCentralDuplicidades === "function") {
          await atualizarCentralDuplicidades();
        }

        const resumo = resumirStatusUpload();
        uploadTeveErro = resumo.naoEnviados > 0;
        uploadConcluidoComSucesso = resumo.naoEnviados === 0;
        const temFalhaConferencia = resultadosArquivosUpload.some(resultado =>
          resultado?.pendencias?.includes("conferencia-tamanho")
        );
        const resultadoFinal = formatarResultadoFinalUpload(resumo, { temFalhaConferencia });
        atualizarProgressoUpload(100, resultadoFinal.titulo, resultadoFinal.mensagem, "");
        atualizarAcoesCentralUpload();

        mostrarMensagem(resultadoFinal.mensagem);
        concluirOuManterSessaoUpload();
      } catch (erro) {
        logger.error(erro);
        uploadTeveErro = true;
        atualizarProgressoUpload(100, "Erro", "O envio foi interrompido. Confira a lista de arquivos.", "");
        atualizarAcoesCentralUpload();
        mostrarMensagem("Não foi possível enviar os arquivo(s). Tente novamente.", "erro");
        concluirOuManterSessaoUpload();
      } finally {
        uploadEmAndamento = false;
        atualizarAcoesCentralUpload();
        document.getElementById("btnFecharCentralUpload")?.classList.remove("desativado");
      }
    };

    window.verificarSessaoUploadInterrompida = async function () {
      const sessao = lerSessaoUploadLocal();
      if (!sessaoUploadTemPendencia(sessao)) {
        renderizarAvisoSessaoUploadInterrompida();
        return;
      }

      abrirCentralUpload();
      atualizarProgressoUpload(0, "Verificando envio anterior", "Consultando somente metadados dos arquivos.", "");
      try {
        const documentosAtualizados = await listarDocumentos();
        if (!documentosAtualizados) {
          throw new Error("A lista de documentos não pôde ser atualizada para a conferência.");
        }
        const token = await obterToken();
        const driveIdPadrao = await obterDriveDocumentosAtivos();
        const porListItemId = new Map(documentosAtivos.map(doc => [String(doc.listItemId || ""), doc]));
        const porNome = new Map(documentosAtivos.map(doc => [normalizarTexto(doc.nome), doc]));

        for (const item of sessao.itens) {
          let documento = null;
          let metadado = null;
          if (item.listItemId) documento = porListItemId.get(String(item.listItemId)) || null;
          if (!documento) {
            const nome = item.nomeFinalReal || item.nomeFinalPrevisto;
            if (nome) documento = porNome.get(normalizarTexto(nome)) || null;
          }

          const tamanhoJaConfirmado = item.conferenciaTamanhoOk
            && Number(item.tamanhoRemotoBytes) === Number(item.tamanhoLocalBytes);
          if (documento && tamanhoJaConfirmado) {
            metadado = {
              id: item.driveItemId || "",
              name: documento.nome,
              size: item.tamanhoRemotoBytes,
              parentReference: { driveId: item.driveId || driveIdPadrao }
            };
          } else {
            try {
              if (item.driveItemId) {
                metadado = await obterMetadadoRemotoDriveItem(item.driveId || driveIdPadrao, item.driveItemId, token);
              } else if (documento?.listItemId) {
                metadado = await obterMetadadoDriveItemPorListItem(documento.listItemId, token);
              }
            } catch (erroMetadado) {
              logger.warn("Nao foi possivel obter metadado durante conferencia de sessao.", erroMetadado);
            }
          }

          const encontrou = !!(metadado?.id || documento || item.driveItemId || item.listItemId);
          if (!encontrou) {
            item.status = "nao-encontrado";
            item.arquivoExiste = false;
            item.conferenciaTamanhoOk = false;
            item.pendencias = ["arquivo-nao-localizado"];
            continue;
          }

          item.arquivoExiste = true;
          item.driveItemId = metadado?.id || item.driveItemId || "";
          item.driveId = metadado?.parentReference?.driveId || item.driveId || driveIdPadrao;
          item.listItemId = documento?.listItemId || item.listItemId || "";
          item.nomeFinalReal = metadado?.name || documento?.nome || item.nomeFinalReal || item.nomeFinalPrevisto;
          const tamanhoRemoto = metadado?.size === undefined || metadado?.size === null
            ? NaN
            : Number(metadado.size);
          item.tamanhoRemotoBytes = Number.isFinite(tamanhoRemoto) ? tamanhoRemoto : null;
          item.conferenciaTamanhoOk = Number.isFinite(tamanhoRemoto) && tamanhoRemoto === Number(item.tamanhoLocalBytes);
          item.status = item.conferenciaTamanhoOk ? "enviado" : "enviado-atencao";
          item.pendencias = item.conferenciaTamanhoOk ? [] : ["conferencia-tamanho"];
        }

        const temAtencao = sessao.itens.some(item => item.status === "enviado-atencao");
        const temNaoEncontrado = sessao.itens.some(item => item.status === "nao-encontrado" || item.status === "nao-enviado");
        sessao.statusLote = temAtencao || temNaoEncontrado ? "interrompido" : "concluido";
        salvarSessaoUploadLocal(sessao);

        if (!temAtencao && !temNaoEncontrado) {
          apagarSessaoUploadLocal(sessao.idLote);
          atualizarProgressoUpload(100, "Envio anterior verificado", "Todos os arquivos foram encontrados.", "");
          mostrarMensagem("Envio anterior verificado. Todos os arquivos foram encontrados.");
          return;
        }

        renderizarPainelSessaoUpload(sessao);
        renderizarAvisoSessaoUploadInterrompida();
        atualizarProgressoUpload(100, "Verificação concluída", "Revise os arquivos encontrados com atenção e os não encontrados.", "");
      } catch (erro) {
        logger.error(erro);
        salvarSessaoUploadLocal(sessao);
        mostrarMensagem("Não foi possível verificar o envio anterior agora. A sessão foi mantida para nova tentativa.", "erro");
      }
    };

    window.ignorarSessaoUploadInterrompida = function () {
      const sessao = lerSessaoUploadLocal();
      if (!sessao) return;
      const confirmar = confirm("Tem certeza que deseja ignorar este envio interrompido? Use esta opção apenas se você já conferiu que está tudo certo.");
      if (!confirmar) return;
      apagarSessaoUploadLocal(sessao.idLote);
      mostrarMensagem("Aviso de envio interrompido removido.");
    };

    window.fecharPainelSessaoUploadInterrompida = function () {
      const painel = document.getElementById("painelSessaoUploadInterrompida");
      if (painel) painel.hidden = true;
    };

    window.selecionarArquivosReenvioSessaoUpload = function () {
      const sessao = lerSessaoUploadLocal();
      if (!sessaoUploadTemPendencia(sessao)) return;
      document.getElementById("inputReenvioSessaoUpload")?.click();
    };

    window.receberArquivosReenvioSessaoUpload = function (input) {
      const sessao = lerSessaoUploadLocal();
      const selecionados = Array.from(input?.files || []);
      if (input) input.value = "";
      if (!sessaoUploadTemPendencia(sessao) || !selecionados.length) return;

      const candidatos = new Map();
      sessao.itens.forEach((item, indice) => {
        if (item.status !== "nao-encontrado" && item.status !== "nao-enviado") return;
        const chave = `${normalizarTexto(item.nomeOriginal)}|${Number(item.tamanhoLocalBytes || 0)}`;
        if (!candidatos.has(chave)) candidatos.set(chave, []);
        candidatos.get(chave).push(indice);
      });

      const arquivosReenvio = [];
      const indicesItens = [];
      let ignorados = 0;
      for (const arquivo of selecionados) {
        const chave = `${normalizarTexto(arquivo.name)}|${Number(arquivo.size || 0)}`;
        const fila = candidatos.get(chave);
        if (!fila?.length) {
          ignorados++;
          continue;
        }
        arquivosReenvio.push(arquivo);
        indicesItens.push(fila.shift());
      }

      if (!arquivosReenvio.length) {
        mostrarMensagem("Nenhum arquivo selecionado corresponde aos itens não encontrados do lote.", "erro");
        return;
      }

      arquivosCentralUpload = arquivosReenvio;
      statusArquivosUpload = arquivosReenvio.map(() => "Pendente");
      resultadosArquivosUpload = arquivosReenvio.map(() => null);
      idSessaoUploadEmUso = sessao.idLote;
      indicesSessaoUploadPorArquivo = indicesItens;
      reenvioSessaoUploadAtivo = true;
      sessao.idExecucaoAtual = idExecucaoUploadAtual;
      sessao.statusLote = "enviando";
      salvarSessaoUploadLocal(sessao);
      resetarEstadoAoSelecionarArquivosUpload();
      calcularAnaliseNomesCentralUpload();
      analiseNomesCentralUpload = analiseNomesCentralUpload.map((analise, indice) => ({
        ...analise,
        nomeFinalPrevisto: sessao.itens[indicesItens[indice]]?.nomeFinalPrevisto || analise.nomeFinalPrevisto
      }));
      abrirCentralUpload();
      document.getElementById("gavetaUpload").value = sessao.gaveta || "";
      document.getElementById("motivoUpload").value = sessao.motivo || "";
      renderizarListaCentralUpload();
      atualizarAcoesCentralUpload();
      mostrarMensagem(`${arquivosReenvio.length} arquivo(s) serão reenviados. ${ignorados} arquivo(s) foram ignorados porque já foram encontrados ou não pertencem ao lote.`);
    };

function atualizarBotaoCarregarMaisDocumentos(totalLista, totalExibido) {
      const botao = document.getElementById("btnCarregarMaisDocumentos");
      if (!botao) return;

      const temMais = totalLista > totalExibido;
      botao.hidden = !temMais;
      botao.textContent = temMais
        ? `Carregar mais (${totalExibido} de ${totalLista})`
        : "Carregar mais";
    }

    window.carregarMaisDocumentos = function () {
      quantidadeDocumentosVisiveis += TAMANHO_PAGINA_DOCUMENTOS;
      renderizarDocumentos(documentosFiltradosAtuais);
    };

function renderizarDocumentos(listaArquivos) {
      const lista = document.getElementById("listaDocumentos");
      const contador = document.getElementById("contadorResultados");
      const movimentacoesRecentes = obterUltimasMovimentacoesPorArquivo(20);
      const termoBusca = normalizarTexto(document.getElementById("campoBusca").value);
      const mapaNomesRepetidos = modoListaAtual === "recentes"
        ? obterMapaNomesVisuaisTodosDocumentos()
        : obterMapaNomesVisuaisRepetidosCacheado(listaArquivos);
      const indiceDocumentoPorId = new Map();
      documentosCarregados.forEach((doc, indice) => {
        if (doc?.id) indiceDocumentoPorId.set(doc.id, indice);
      });

      const listaOrdenada = modoListaAtual === "recentes" && !termoBusca
        ? ordenarPorModificacao(listaArquivos, preferenciasSistema.ordemRecentes).slice(0, preferenciasSistema.limiteRecentes)
        : modoListaAtual === "recentes"
          ? ordenarPorModificacao(listaArquivos, preferenciasSistema.ordemRecentes)
        : modoListaAtual === "na Lixeira"
          ? ordenarPorModificacao(listaArquivos, preferenciasSistema.ordemLixeira)
        : listaArquivos;

      const totalFiltrado = listaOrdenada.length;
      const listaExibida = listaOrdenada.slice(0, quantidadeDocumentosVisiveis);

      contador.textContent = modoListaAtual === "recentes" && !termoBusca
        ? `${listaExibida.length} de ${totalFiltrado} documento(s) recente(s) exibido(s)`
        : `${listaExibida.length} de ${totalFiltrado} resultado(s) exibido(s)`;

      atualizarBotaoCarregarMaisDocumentos(totalFiltrado, listaExibida.length);

      if (!totalFiltrado) {
        lista.innerHTML = montarEstadoVazioDocumentos();
        return;
      }

      const itensHtml = listaExibida.map(item => {
        const indiceOriginal = indiceDocumentoPorId.has(item.id)
          ? indiceDocumentoPorId.get(item.id)
          : -1;
        const idArquivo = obterIdArquivoDocumento(item);
        const chaveId = idArquivo ? `id:${idArquivo}` : "";
        const movimento = item.movimentoRecente || (modoListaAtual !== "na Lixeira"
          ? movimentacoesRecentes.get(chaveId)
          : null);
        const statusRecente = item.status === "ARQUIVADO" ? "Lixeira" : "Ativo";
        const classeStatusRecente = item.status === "ARQUIVADO" ? "tagArquivado" : "tagAtivo";
        const nomeRepetido = (mapaNomesRepetidos.get(chaveNomeArquivoVisualLimpo(item.nome || "")) || 0) > 1;

        return `
          <li>
          <button class="itemArquivo" data-indice-documento="${indiceOriginal}">
            <strong>${escaparHtml(nomeArquivoVisualLimpo(item.nome))}</strong>
            <span class="metadadosArquivo">
              ${modoListaAtual === "recentes" && movimento ? `<span class="${classeStatusRecente} statusRecenteArquivo">${statusRecente}</span>` : ""}
              ${seloGavetaHtml(item.gaveta)}
              ${nomeRepetido ? "<span class=\"seloNomeRepetido\">Nome igual</span>" : ""}
            </span>
            <span>Clique para ver detalhes, histórico e ações</span>
            ${movimento ? `<span class="linhaMovimentacaoArquivo">${escaparHtml(formatarAcaoRecente(movimento.ACAO || "MOVIMENTOU"))} - ${escaparHtml(formatarData(movimento.DATA_HORA))}</span>` : ""}
            ${item.modificado ? `<span class="linhaDataArquivo">Atualizado: ${escaparHtml(formatarData(item.modificado))}</span>` : ""}
          </button>
          </li>
        `;
      });

      lista.innerHTML = itensHtml.join("");
    }

    window.gerarDiagnosticoPerformanceArquivoDigital = function () {
      const todosDocumentos = [...documentosAtivos, ...documentosLixeira];
      const medir = funcao => {
        const inicio = agoraPerformance();
        const resultado = funcao();
        return {
          ms: Number((agoraPerformance() - inicio).toFixed(1)),
          resultado
        };
      };
      const inicioNormalizacao = agoraPerformance();
      medirTempoPerformance("diagnostico.normalizar-nomes-documentos", () => {
        todosDocumentos.forEach(atualizarIndiceBuscaDocumento);
      });
      const tempoNormalizacaoMs = agoraPerformance() - inicioNormalizacao;
      const simuladosBusca = Array.from({ length: 6000 }, (_, indice) => ({
        nome: `ALUNO TESTE ESCALA ${String(indice + 1).padStart(4, "0")}.pdf`
      }));
      const inicioBuscaSimulada = agoraPerformance();
      const totalBuscaSimulada = medirTempoPerformance("diagnostico.buscar-6000-documentos", () => {
        const termoSimulado = normalizarTexto("aluno teste escala 59");
        return simuladosBusca
          .map(atualizarIndiceBuscaDocumento)
          .filter(doc => doc.nomeBusca.includes(termoSimulado))
          .length;
      });
      const tempoBuscaSimuladaMs = agoraPerformance() - inicioBuscaSimulada;
      const simuladosDuplicidades = Array.from({ length: 6000 }, (_, indice) => {
        const grupo = Math.floor(indice / 2);
        return {
          id: `simulado-${indice + 1}`,
          nome: `ALUNO ESCALA ${String(grupo + 1).padStart(4, "0")}.pdf`
        };
      });
      const inicioDuplicidadesSimulada = agoraPerformance();
      const paresDuplicidadesSimulados = medirTempoPerformance("diagnostico.duplicidades-6000-indexado", () =>
        gerarParesDuplicidadesIndexado(simuladosDuplicidades)
      );
      const tempoDuplicidadesSimuladaMs = agoraPerformance() - inicioDuplicidadesSimulada;
      const listaAtualOriginal = documentosCarregados;
      const modoOriginal = modoListaAtual;
      const filtroOriginal = filtroGavetaAtual;
      const qtdVisivelOriginal = quantidadeDocumentosVisiveis;
      const buscaComum = medir(() => todosDocumentos.filter(doc => atualizarIndiceBuscaDocumento(doc)?.nomeBusca?.includes("a")).length);
      const buscaRara = medir(() => todosDocumentos.filter(doc => atualizarIndiceBuscaDocumento(doc)?.nomeBusca?.includes("__termo_raro_sem_resultado__")).length);
      const recentesSemBusca = medir(() => montarDocumentosRecentes({ limitado: true }).length);
      const recentesComBusca = medir(() => documentosAtivos.filter(doc => atualizarIndiceBuscaDocumento(doc)?.nomeBusca?.includes("a")).length);
      const lixeira = medir(() => documentosLixeira.filter(doc => atualizarIndiceBuscaDocumento(doc)).length);
      const assinaturaAtual = medir(() => assinaturaDuplicidades(documentosAtivos.filter(doc => doc && doc.nome && doc.id)));
      let renderizacaoPrimeiraPaginaMs = 0;
      let renderizacaoSimuladaMs = 0;

      try {
        documentosCarregados = documentosAtivos;
        quantidadeDocumentosVisiveis = TAMANHO_PAGINA_DOCUMENTOS;
        const renderPrimeira = medir(() => renderizarDocumentos(documentosAtivos));
        renderizacaoPrimeiraPaginaMs = renderPrimeira.ms;

        documentosCarregados = simuladosBusca.map((doc, indice) => ({
          ...doc,
          id: `render-simulado-${indice}`,
          status: "ATIVO",
          gaveta: "SIMULADO",
          modificado: ""
        }));
        const renderSimulada = medir(() => renderizarDocumentos(documentosCarregados));
        renderizacaoSimuladaMs = renderSimulada.ms;
      } finally {
        documentosCarregados = listaAtualOriginal;
        modoListaAtual = modoOriginal;
        filtroGavetaAtual = filtroOriginal;
        quantidadeDocumentosVisiveis = qtdVisivelOriginal;
        if (document.getElementById("listaDocumentos")) {
          renderizarDocumentos(documentosFiltradosAtuais);
        }
      }

      const totalDocumentosDuplicidades = documentosAtivos.filter(doc => doc && doc.nome && doc.id).length;
      const paresExaustivosEstimados = totalDocumentosDuplicidades > 1
        ? (totalDocumentosDuplicidades * (totalDocumentosDuplicidades - 1)) / 2
        : 0;
      const itensRenderizados = document.querySelectorAll("#listaDocumentos > li").length;
      const painelLateral = document.getElementById("painelLateral");
      const painelCentral = document.getElementById("painelCentralDuplicidades");
      const painelDashboard = document.getElementById("painelDashboard");
      const estilosPainelLateral = painelLateral ? getComputedStyle(painelLateral) : null;
      const estilosPainelCentral = painelCentral ? getComputedStyle(painelCentral) : null;
      const estilosPainelDashboard = painelDashboard ? getComputedStyle(painelDashboard) : null;

      const resumo = {
        documentosAtivos: documentosAtivos.length,
        documentosLixeira: documentosLixeira.length,
        documentosCarregados: documentosCarregados.length,
        historicoCarregado: historicoCarregado.length,
        historicoGeralInicializado,
        historicoGeralCarregando,
        historicoGeralTemMaisPaginas: Boolean(proximaPaginaHistoricoGeral),
        anotacoesCarregadas: anotacoesCarregadas.length,
        duplicidadesIgnoradas: paresDuplicidadesIgnoradosDetalhes.length || paresDuplicidadesIgnorados.size,
        cacheNormalizarTexto: cacheNormalizarTexto.size,
        duplicidades: {
          documentosAtivosComNomeEId: totalDocumentosDuplicidades,
          paresExaustivosEstimados,
          limiteAnaliseExaustiva: LIMITE_ANALISE_DUPLICIDADES_EXAUSTIVA,
          usaIndice: totalDocumentosDuplicidades > LIMITE_ANALISE_DUPLICIDADES_EXAUSTIVA,
          modoUsado: totalDocumentosDuplicidades > LIMITE_ANALISE_DUPLICIDADES_EXAUSTIVA ? "indexado" : "exaustivo",
          cacheAssinaturaAtiva: Boolean(cacheParesDuplicidades.assinatura),
          centralCarregando: duplicidadesCarregando,
          centralAnalisada: centralDuplicidadesAnalisada,
          analiseAutomaticaNoCarregamento: preferenciasSistema.analiseDuplicidadesAuto === "sim",
          tarefaAgendada: tarefaCentralDuplicidadesAgendada,
          paresRetornadosCache: cacheParesDuplicidades.pares.length,
          assinaturaMs: assinaturaAtual.ms,
          assinaturaTamanho: assinaturaAtual.resultado.length
        },
        medicaoLocal: {
          normalizarNomesDocumentosMs: Number(tempoNormalizacaoMs.toFixed(1)),
          filtrarBuscaTermoComumMs: buscaComum.ms,
          filtrarBuscaTermoComumResultados: buscaComum.resultado,
          filtrarBuscaTermoRaroMs: buscaRara.ms,
          filtrarBuscaTermoRaroResultados: buscaRara.resultado,
          montarRecentesSemBuscaMs: recentesSemBusca.ms,
          montarRecentesComBuscaMs: recentesComBusca.ms,
          montarLixeiraMs: lixeira.ms,
          renderizarPrimeiraPaginaMs: renderizacaoPrimeiraPaginaMs,
          renderizarCom6000SimuladosMs: renderizacaoSimuladaMs,
          buscar6000DocumentosMs: Number(tempoBuscaSimuladaMs.toFixed(1)),
          buscar6000DocumentosResultados: totalBuscaSimulada,
          duplicidades6000IndexadoMs: Number(tempoDuplicidadesSimuladaMs.toFixed(1)),
          duplicidades6000ParesRetornados: paresDuplicidadesSimulados.length
        },
        dom: {
          itensRenderizados,
          tamanhoPagina: TAMANHO_PAGINA_DOCUMENTOS,
          respeitaPaginacao: itensRenderizados <= TAMANHO_PAGINA_DOCUMENTOS || itensRenderizados <= documentosFiltradosAtuais.length,
          documentosFiltradosAtuais: documentosFiltradosAtuais.length
        },
        visual: {
          painelLateral: {
            aberto: painelLateral?.classList.contains("aberto") || false,
            transition: estilosPainelLateral?.transition || "",
            transform: estilosPainelLateral?.transform || "",
            boxShadow: estilosPainelLateral?.boxShadow || "",
            backdropFilter: estilosPainelLateral?.backdropFilter || ""
          },
          painelCentralDuplicidades: {
            aberto: painelCentral?.classList.contains("aberto") || false,
            transition: estilosPainelCentral?.transition || "",
            transform: estilosPainelCentral?.transform || "",
            boxShadow: estilosPainelCentral?.boxShadow || "",
            backdropFilter: estilosPainelCentral?.backdropFilter || ""
          },
          painelDashboard: {
            aberto: painelDashboard?.classList.contains("aberto") || false,
            transition: estilosPainelDashboard?.transition || "",
            transform: estilosPainelDashboard?.transform || "",
            boxShadow: estilosPainelDashboard?.boxShadow || "",
            backdropFilter: estilosPainelDashboard?.backdropFilter || ""
          }
        },
        observacao: "Diagnostico local: nao chama SharePoint e nao altera dados de documentos."
      };

      if (MODO_DIAGNOSTICO) logger.info("Diagnostico de performance do Arquivo Digital", resumo);
      return resumo;
    };

    function obterUltimasMovimentacoesPorArquivo(limite = 20) {
      if (
        cacheUltimasMovimentacoes.versao === versaoHistoricoCache &&
        cacheUltimasMovimentacoes.limite === limite
      ) {
        return cacheUltimasMovimentacoes.mapa;
      }

      const vistos = new Set();
      const mapa = new Map();

      for (const item of obterHistoricoOrdenado("desc")) {
        if (vistos.size >= limite) break;
        if (!item?.ARQUIVO_ID) continue;

        const chave = `id:${normalizarIdArquivo(item.ARQUIVO_ID)}`;

        if (!chave || vistos.has(chave)) continue;

        vistos.add(chave);
        mapa.set(chave, item);
      }

      cacheUltimasMovimentacoes = { versao: versaoHistoricoCache, limite, mapa };
      return mapa;
    }

    function montarDocumentosRecentes(opcoes = {}) {
      const limitado = Boolean(opcoes.limitado);
      const limite = Math.max(1, Number(preferenciasSistema.limiteRecentes) || 20);
      const ordem = preferenciasSistema.ordemRecentes === "asc" ? "asc" : "desc";
      if (
        cacheDocumentosRecentes.versaoDocumentos === versaoDocumentosCache &&
        cacheDocumentosRecentes.limitado === limitado &&
        cacheDocumentosRecentes.limite === limite &&
        cacheDocumentosRecentes.ordem === ordem
      ) {
        return cacheDocumentosRecentes.itens;
      }

      const todos = [...documentosAtivos, ...documentosLixeira]
        .map(documento => ({
          ...documento,
          dataRecente: documento.modificado || documento.dataModificacao || ""
        }));
      const recentes = ordenarPorModificacao(todos, ordem);
      const itens = limitado ? recentes.slice(0, limite) : recentes;
      cacheDocumentosRecentes = {
        versaoDocumentos: versaoDocumentosCache,
        limitado,
        limite,
        ordem,
        itens
      };
      return itens;
    }

    function obterIdsDuplicidadePendente() {
      try {
        return new Set(gerarParesDuplicidades().flatMap(par => [par.a.id, par.b.id]).filter(Boolean));
      } catch {
        return new Set();
      }
    }

    function documentoTemAnotacao(doc) {
      const id = obterIdArquivoDocumento(doc);
      const item = id ? obterAnotacoesPorArquivoId().get(id) : null;
      return Boolean(item && (item.ANOTACAO || "").trim());
    }

    function documentoEnviadoRecentemente(doc) {
      const limite = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const id = obterIdArquivoDocumento(doc);
      const historicoDocumento = id ? obterHistoricoPorArquivoId().get(id) || [] : [];
      return historicoDocumento.some(item =>
        normalizarTexto(item.ACAO || "") === "enviou" &&
        (new Date(item.DATA_HORA).getTime() || 0) >= limite
      );
    }

    function documentoAlteradoRecentemente(doc) {
      const limite = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return (new Date(doc.modificado || 0).getTime() || 0) >= limite;
    }

    function aplicarFiltrosAvancados(lista, opcoes = {}) {
      let resultado = lista;

      if (modoListaAtual === "ativos" && filtroGavetaAtual && !opcoes.ignorarGaveta) {
        resultado = resultado.filter(doc => chaveGaveta(doc.gaveta) === filtroGavetaAtual);
      }

      return resultado;
    }

    function filtrarDocumentos() {
      const termo = normalizarTexto(document.getElementById("campoBusca").value);
      quantidadeDocumentosVisiveis = TAMANHO_PAGINA_DOCUMENTOS;


      documentosCarregados = modoListaAtual === "na Lixeira"
        ? documentosLixeira
        : modoListaAtual === "recentes"
          ? montarDocumentosRecentes({ limitado: !termo })
          : documentosAtivos;

      if (modoListaAtual === "ativos" && !termo && !filtroGavetaAtual) {
        document.getElementById("contadorResultados").textContent = `${documentosAtivos.length} documento(s) ativo(s) disponivel(is)`;
        document.getElementById("listaDocumentos").innerHTML = "<li class=\"mensagemListaVazia\">Selecione uma gaveta para listar os documentos ou use a busca acima.</li>";
        atualizarBotaoCarregarMaisDocumentos(0, 0);
        atualizarBotoesFiltros();
        return;
      }

      const filtradosBusca = documentosCarregados.filter(doc => {
        if (!termo) return true;
        return atualizarIndiceBuscaDocumento(doc)?.nomeBusca?.includes(termo);
      });

      const filtrados = aplicarFiltrosAvancados(filtradosBusca, {
        ignorarGaveta: modoListaAtual === "ativos" && Boolean(termo)
      });
      documentosFiltradosAtuais = filtrados;
      atualizarBotoesFiltros();
      renderizarDocumentos(filtrados);
    }

    /* INICIO_ESTADOS_VAZIOS_DOCUMENTOS_FASE6A_20260527 */
    function montarEstadoVazioDocumentos() {
      const campoBusca = document.getElementById("campoBusca");
      const termo = (campoBusca?.value || "").trim();
      const temBusca = termo.length > 0;
      const nomeGaveta = filtroGavetaAtual || "";
      let icone = "📄";
      let titulo = "Nenhum documento encontrado.";
      let texto = "Quando houver documentos disponíveis, eles aparecerão aqui.";
      let dica = "Tente atualizar a página ou conferir os filtros.";

      if (temBusca) {
        icone = "🔎";
        titulo = "Nenhum resultado para esta busca.";
        texto = `Não encontrei documentos com “${termo}”.`;
        dica = "Tente pesquisar por parte do nome, matrícula, ano ou palavra-chave.";
      } else if (modoListaAtual === "na Lixeira") {
        icone = "🗑️";
        titulo = "A lixeira está vazia.";
        texto = "Nenhum documento foi movido para a Lixeira até o momento.";
        dica = "Arquivos enviados para a Lixeira continuam recuperáveis.";
      } else if (modoListaAtual === "ativos" && nomeGaveta) {
        icone = "🗂️";
        titulo = "Esta gaveta ainda não possui documentos.";
        texto = `A gaveta “${nomeGaveta}” não tem documentos vinculados no momento.`;
        dica = "Escolha outra gaveta ou envie um novo PDF para esta categoria.";
      } else if (modoListaAtual === "ativos") {
        icone = "🗃️";
        titulo = "Nenhum documento ativo encontrado.";
        texto = "Não há documentos ativos para exibir nesta guia.";
        dica = "Envie PDFs ou confira se os documentos estão na Lixeira.";
      } else {
        icone = "🕘";
        titulo = "Nenhum documento recente para exibir.";
        texto = "Os documentos acessados ou enviados recentemente aparecerão aqui.";
        dica = "Use a guia Gavetas ou o campo de busca para localizar arquivos.";
      }

      return `
        <li class="estadoVazioDocumentos">
          <div class="estadoVazioDocumentosCard">
            <div class="estadoVazioDocumentosIcone" aria-hidden="true">${escaparHtml(icone)}</div>
            <div>
              <p class="estadoVazioDocumentosTitulo">${escaparHtml(titulo)}</p>
              <p class="estadoVazioDocumentosTexto">${escaparHtml(texto)}</p>
              <span class="estadoVazioDocumentosDica">${escaparHtml(dica)}</span>
            </div>
          </div>
        </li>
      `;
    }
    /* FIM_ESTADOS_VAZIOS_DOCUMENTOS_FASE6A_20260527 */

    /* INICIO_CARREGAMENTOS_VISUAIS_FASE6C_20260527 */
    function montarCarregamentoVisual(titulo, texto = "", icone = "⏳", tag = "div") {
      const tagSeguro = tag === "li" ? "li" : "div";
      return `
        <${tagSeguro} class="carregamentoVisual" aria-live="polite">
          <div class="carregamentoVisualCard">
            <div class="carregamentoVisualIcone" aria-hidden="true">${escaparHtml(icone)}</div>
            <div class="carregamentoVisualTexto">
              <p class="carregamentoVisualTitulo">${escaparHtml(titulo || "Carregando...")}</p>
              ${texto ? `<p class="carregamentoVisualDescricao">${escaparHtml(texto)}</p>` : ""}
            </div>
          </div>
        </${tagSeguro}>
      `;
    }
    /* FIM_CARREGAMENTOS_VISUAIS_FASE6C_20260527 */
    async function listarDocumentos(tokenInformado = "") {
      const lista = document.getElementById("listaDocumentos");
      lista.innerHTML = montarCarregamentoVisual("Buscando documentos", "Consultando o Arquivo Digital. Aguarde um instante.", "📂", "li");

      try {
        const token = tokenInformado || await obterToken();

        const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.documentosAtivosListId}/items?$expand=fields($select=FileLeafRef,FileRef,UniqueId,Modified,FileDirRef,FSObjType,GAVETA)&$top=999`;

        const itens = await buscarTodosItens(url, token);

        const arquivos = itens.filter(item => {
          const f = item.fields || {};
          return f.FileLeafRef && String(f.FSObjType || "0") === "0";
        });

        const mapear = item => {
          const nome = item.fields.FileLeafRef;
          const caminho = item.fields.FileRef;
          const pasta = item.fields.FileDirRef || "";
          const status = pasta === `${CONFIG.documentosAtivosRootPath}/_ARQUIVADOS` ? "ARQUIVADO" : "ATIVO";

          return atualizarIndiceBuscaDocumento({
            nome,
            caminho,
            fileDirRef: pasta,
            status,
            id: item.fields.UniqueId,
            listItemId: item.id,
            driveItemId: "",
            driveId: "",
            link: "https://eduieda.sharepoint.com" + caminho,
            modificado: item.fields?.Modified || item.lastModifiedDateTime || "",
            gaveta: item.fields?.GAVETA || ""
          });
        };

        documentosAtivos = arquivos
          .filter(item => String(item.fields.FileDirRef || "") === CONFIG.documentosAtivosRootPath)
          .map(mapear);

        documentosLixeira = arquivos
          .filter(item => String(item.fields.FileDirRef || "") === `${CONFIG.documentosAtivosRootPath}/_ARQUIVADOS`)
          .map(mapear);

        invalidarCacheDocumentos();
        atualizarInterfacesGaveta();
        limparCacheDuplicidades();
        aplicarListaAtual();

        if (preferenciasSistema.analiseDuplicidadesAuto === "sim") {
          atualizarCentralDuplicidadesSegundoPlano();
        } else {
          totalParesCentralDuplicidades = 0;
          aplicarEstadoVisualCentralDuplicidades(0);
          const resumo = document.getElementById("resumoCentralDuplicidades");
          if (resumo) resumo.textContent = "Analise automatica desativada. Abra a Central para analisar.";
        }
        renderizarAvisoSessaoUploadInterrompida();
        return true;

      } catch (erro) {
        lista.innerHTML = "<li class=\"erro\">Não foi possível carregar os documentos. Tente novamente.</li>";
        logger.error(erro);
        return false;
      }
    }

    async function atualizarTela() {
      aplicarBlindagemVisualPreLogin();
      aplicarPreferenciasVisuais();
      atualizarControlesPreferencias();
      const contas = msalInstance.getAllAccounts();
      const usuario = contas[0];

      const nomeUsuarioConectado = usuario?.name || "Usuário conectado";

      document.getElementById("status").textContent = usuario
        ? `Usuário conectado: ${nomeUsuarioConectado}`
        : "Usuário não conectado";

      definirVisibilidadeBotaoCabecalho("btnEntrar", !usuario);
      definirVisibilidadeBotaoCabecalho("btnSair", false);
      definirVisibilidadeBotaoCabecalho("btnAbrirConfiguracoesTopo", false);
      document.getElementById("areaSistema").style.display = "none";

      if (usuario) {
        modoListaAtual = preferenciasSistema.guiaInicial || "recentes";
        const areaUsuario = document.getElementById("usuario");
        areaUsuario.textContent = "";

        document.getElementById("status").textContent = "Verificando acesso...";

        try {
          const token = await obterToken();
          const temAcesso = await verificarPermissaoArquivoDigital(token);

          if (!temAcesso) {
            mostrarTelaAcessoRestrito();
            return;
          }

          acessoArquivoDigitalPermitido = true;
          ocultarTelaAcessoRestrito();
          document.getElementById("status").textContent = `Usuário conectado: ${nomeUsuarioConectado}`;
          liberarBlindagemVisualPreLogin();
          definirVisibilidadeBotaoCabecalho("btnAbrirConfiguracoesTopo", true);
          definirVisibilidadeBotaoCabecalho("btnSair", true);
          document.getElementById("areaSistema").style.display = "block";
          await listarDocumentos();
          agendarTarefaSegundoPlano(() => carregarDadosDeApoio(token));
          agendarTarefaSegundoPlano(() => carregarOpcoesGavetaSharePoint(token));
        } catch (erro) {
          logger.error(erro);
          mostrarTelaAcessoRestrito("Não foi possível confirmar o acesso ao SharePoint. Tente novamente.");
        }
      } else {
        acessoArquivoDigitalPermitido = false;
        aplicarBlindagemVisualPreLogin();
        ocultarTelaAcessoRestrito();
        document.getElementById("usuario").innerHTML = "";
      }
    }

    window.entrar = async function () {
      await msalInstance.loginRedirect(loginRequest);
    };

    window.sair = async function () {
      const conta = msalInstance.getAllAccounts()[0];
      await msalInstance.logoutRedirect({ account: conta });
    };

    function filtrarDocumentosDebounced() {
      clearTimeout(timerBuscaDocumentos);
      timerBuscaDocumentos = setTimeout(() => {
        filtrarDocumentos();
      }, 220);
    }

    window.filtrarDocumentos = filtrarDocumentos;
    window.filtrarDocumentosDebounced = filtrarDocumentosDebounced;

    function inicializarEventosFixos() {
      if (eventosFixosInicializados) return;
      eventosFixosInicializados = true;

      const aoClicar = (id, manipulador) => {
        const elemento = document.getElementById(id);
        if (elemento && typeof manipulador === "function") {
          elemento.addEventListener("click", manipulador);
        }
      };

      aoClicar("btnEntrar", window.entrar);
      aoClicar("btnSair", window.sair);
      aoClicar("btnSairAcessoRestrito", window.sair);
      aoClicar("btnTentarNovamenteAcessoRestrito", window.tentarNovamenteAcessoArquivoDigital);
      aoClicar("btnAbrirConfiguracoesTopo", window.alternarCentralConfiguracoes);
      aoClicar("btnFecharCentralConfiguracoes", window.alternarCentralConfiguracoes);
      aoClicar("btnCadastrarNovaGaveta", window.cadastrarNovaGaveta);
      aoClicar("btnNovoDocumentoHero", window.alternarCentralUploadHero);
      aoClicar("btnFecharCentralUpload", window.fecharCentralUpload);
      aoClicar("btnContinuarUpload", window.continuarCentralUpload);
      aoClicar("btnSairUpload", window.sairSemEnviarCentralUpload);
      aoClicar("btnSelecionarArquivoUpload", window.escolherArquivosCentralUpload);
      aoClicar("btnConfirmarUploadCentral", window.confirmarUploadCentral);
      aoClicar("btnEnviarMaisUploadCentral", window.prepararNovoEnvioCentralUpload);
      aoClicar("btnConcluirUploadCentral", window.concluirFecharCentralUpload);
      aoClicar("btnLimparSelecaoUpload", window.limparCentralUpload);
      aoClicar("btnVerificarSessaoUpload", window.verificarSessaoUploadInterrompida);
      aoClicar("btnIgnorarSessaoUpload", window.ignorarSessaoUploadInterrompida);
      aoClicar("btnIgnorarSessaoUploadPainel", window.ignorarSessaoUploadInterrompida);
      aoClicar("btnSelecionarReenvioSessaoUpload", window.selecionarArquivosReenvioSessaoUpload);
      aoClicar("btnFecharPainelSessaoUpload", window.fecharPainelSessaoUploadInterrompida);
      aoClicar("btnAbrirHistoricoGeral", window.abrirHistoricoGeral);
      aoClicar("btnFecharPainelCentralDuplicidades", fecharPainelCentralDuplicidades);
      aoClicar("btnFecharPainelDashboard", window.fecharPainelDashboard);
      aoClicar("btnFecharPainelLateral", fecharPainel);
      aoClicar("btnAbrirArquivoPainel", window.abrirPdfSelecionado);
      aoClicar("btnRenomear", window.prepararRenomear);
      aoClicar("btnSubstituir", window.prepararSubstituir);
      aoClicar("btnArquivar", window.prepararArquivar);
      aoClicar("btnRestaurar", window.prepararRestaurar);
      aoClicar("btnMesclar", window.prepararMesclar);
      aoClicar("btnConfirmarRenomear", window.confirmarRenomear);
      aoClicar("btnCancelarRenomear", window.cancelarRenomear);
      aoClicar("btnConfirmarSubstituir", window.confirmarSubstituir);
      aoClicar("btnCancelarSubstituir", window.cancelarSubstituir);
      aoClicar("btnConfirmarArquivar", window.confirmarArquivar);
      aoClicar("btnCancelarArquivar", window.cancelarArquivar);
      aoClicar("btnConfirmarRestaurar", window.confirmarRestaurar);
      aoClicar("btnCancelarRestaurar", window.cancelarRestaurar);
      aoClicar("btnPrepararAlterarGaveta", window.prepararAlterarGaveta);
      aoClicar("btnConfirmarAlterarGaveta", window.confirmarAlterarGaveta);
      aoClicar("btnCancelarAlterarGaveta", window.cancelarAlterarGaveta);
      aoClicar("btnEscolherArquivoMesclar", window.escolherArquivoLocalMesclar);
      aoClicar("btnConfirmarMesclar", window.confirmarMesclar);
      aoClicar("btnCancelarMesclar", window.cancelarMesclar);
      aoClicar("btnSalvarAnotacaoPainel", window.salvarAnotacaoManual);
      aoClicar("btnCarregarMaisDocumentos", window.carregarMaisDocumentos);
      aoClicar("btnVerRecentes", window.mostrarDocumentosRecentes);
      aoClicar("btnVerAtivos", window.mostrarDocumentosAtivos);
      aoClicar("btnVerLixeira", window.mostrarDocumentosLixeira);

      document.getElementById("inputNovoDocumento")?.addEventListener("change", (event) => {
        window.receberArquivosCentralUpload(event.target);
      });
      document.getElementById("inputReenvioSessaoUpload")?.addEventListener("change", (event) => {
        window.receberArquivosReenvioSessaoUpload(event.target);
      });
      document.getElementById("gavetaUpload")?.addEventListener("change", atualizarAcoesCentralUpload);
      document.getElementById("motivoUpload")?.addEventListener("input", atualizarAcoesCentralUpload);

      document.getElementById("campoBusca")?.addEventListener("input", window.filtrarDocumentosDebounced);
      document.getElementById("arquivoLocalMesclar")?.addEventListener("change", (event) => {
        window.selecionarArquivoLocalMesclar(event.target);
      });

      document.getElementById("listaDocumentos")?.addEventListener("click", (event) => {
        const itemArquivo = event.target.closest(".itemArquivo[data-indice-documento]");
        if (!itemArquivo) return;

        event.preventDefault();

        const indice = Number(itemArquivo.dataset.indiceDocumento);
        if (!Number.isInteger(indice)) return;

        window.selecionarDocumento(indice);
      });

      document.getElementById("versoesSharePoint")?.addEventListener("click", (event) => {
        const botao = event.target.closest("[data-acao-versao]");
        if (!botao) return;

        event.preventDefault();
        event.stopPropagation();

        const acao = botao.dataset.acaoVersao;

        if (acao === "abrir") {
          if (botao.dataset.urlVersao) {
            abrirUrlVersaoSharePoint(botao.dataset.urlVersao);
            return;
          }

          window.visualizarVersaoSharePoint(botao.dataset.versionId);
          return;
        }

        if (acao === "alternar-todas") {
          window.alternarTodasVersoesSharePoint(event);
        }
      });

      const cardDuplicidades = document.getElementById("centralDuplicidades");
      cardDuplicidades?.addEventListener("click", window.alternarCentralDuplicidades);
      cardDuplicidades?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        window.alternarCentralDuplicidades();
      });

      document.getElementById("painelCentralDuplicidades")?.addEventListener("click", (event) => {
        const botao = event.target.closest("[data-acao-duplicidade]");
        if (!botao) return;

        event.preventDefault();
        event.stopPropagation();

        const acao = botao.dataset.acaoDuplicidade;

        if (acao === "abrir") {
          window.abrirArquivoDaCentral(botao.dataset.id || "", botao.dataset.status || "");
          return;
        }

        if (acao === "pessoas-diferentes") {
          window.marcarPessoasDiferentesCentral(botao.dataset.idA || "", botao.dataset.idB || "");
          return;
        }

        if (acao === "desfazer-pessoas-diferentes") {
          window.desfazerPessoasDiferentesCentral(botao.dataset.itemId || "", botao.dataset.chave || "");
          return;
        }

        if (acao === "desfazer-todos") {
          window.desfazerTodosParesPessoasDiferentesCentral();
        }
      });

      document.getElementById("listaGavetasAtivos")?.addEventListener("click", (event) => {
        const botaoGaveta = event.target.closest("[data-gaveta]");
        if (!botaoGaveta) return;
        window.filtrarPorGaveta(botaoGaveta.dataset.gaveta || "");
      });

      const painelDashboard = document.getElementById("painelDashboard");
      painelDashboard?.addEventListener("click", (event) => {
        const filtro = event.target.closest("[data-filtro-historico]");
        if (filtro) {
          window.filtrarHistoricoGeralPeriodo(filtro.dataset.filtroHistorico || "todos", event);
          return;
        }

        const ordem = event.target.closest("[data-ordem-historico]");
        if (ordem) {
          window.alterarOrdemHistoricoGeral(ordem.dataset.ordemHistorico || "desc", event);
          return;
        }

        const acao = event.target.closest("[data-acao-historico]");
        if (acao?.dataset.acaoHistorico === "aplicar-personalizado") {
          window.aplicarFiltroHistoricoGeralPersonalizado(event);
          return;
        }

        if (acao?.dataset.acaoHistorico === "ver-mais") {
          window.verMaisHistoricoGeral(event);
        }
      });

      painelDashboard?.addEventListener("input", (event) => {
        if (event.target?.id === "buscaHistoricoGeral") {
          window.atualizarBuscaHistoricoGeral(event);
        }
      });
    }

    function fecharCamadaAbertaPorVoltar() {
      const centralUpload = document.getElementById("centralUpload");
      if (centralUpload?.classList.contains("aberta")) {
        fecharCentralUpload();
        return true;
      }

      const painel = document.getElementById("painelLateral");
      if (painel?.classList.contains("aberto")) {
        fecharPainel();
        return true;
      }

      const painelCentral = document.getElementById("painelCentralDuplicidades");
      if (painelCentral?.classList.contains("aberto")) {
        fecharPainelCentralDuplicidades();
        return true;
      }

      const painelDashboard = document.getElementById("painelDashboard");
      if (painelDashboard?.classList.contains("aberto")) {
        window.fecharPainelDashboard();
        return true;
      }

      const centralConfiguracoes = document.getElementById("centralConfiguracoes");
      if (centralConfiguracoes?.classList.contains("aberta")) {
        centralConfiguracoes.classList.remove("aberta");
        marcarCamadaFechadaAcessivel("centralConfiguracoes");
        return true;
      }

      return false;
    }

    window.addEventListener("popstate", function () {
      if (!camadaHistoricoMobileAtiva) {
        return;
      }

      camadaHistoricoMobileAtiva = false;
      const fechou = fecharCamadaAbertaPorVoltar();

      if (fechou && existeCamadaAberta()) {
        setTimeout(registrarCamadaHistoricoMobile, 0);
      }
    });

    // Clique fora do painel lateral para fechar
    window.addEventListener("click", function (event) {
      const painel = document.getElementById("painelLateral");
      const painelCentral = document.getElementById("painelCentralDuplicidades");
      const painelDashboard = document.getElementById("painelDashboard");
      const caminhoClique = typeof event.composedPath === "function" ? event.composedPath() : [];

      if (
        painelCentral &&
        painelCentral.classList.contains("aberto") &&
        !(painelCentral.contains(event.target) || caminhoClique.includes(painelCentral)) &&
        !(painel && (painel.contains(event.target) || caminhoClique.includes(painel))) &&
        !event.target.closest("#centralDuplicidades")
      ) {
        fecharPainelCentralDuplicidades();
        return;
      }

      if (
        painelDashboard &&
        painelDashboard.classList.contains("aberto") &&
        !(painelDashboard.contains(event.target) || caminhoClique.includes(painelDashboard)) &&
        !event.target.closest(".cardDash") &&
        !event.target.closest("#painelCentralDuplicidades") &&
        !event.target.closest("#centralDuplicidades") &&
        !event.target.closest(".itemArquivo")
      ) {
        window.fecharPainelDashboard();
      }

      if (!painel || !painel.classList.contains("aberto")) {
        return;
      }

      if (painel.contains(event.target)) {
        return;
      }

      if (event.target.closest("#painelCentralDuplicidades")) {
        return;
      }

      if (event.target.closest("#centralDuplicidades")) {
        return;
      }

      if (event.target.closest(".cardDash")) {
        return;
      }

      if (event.target.closest(".itemArquivo")) {
        return;
      }

      if (fluxoMesclagemAtivo()) {
        mostrarMensagemPainel("Conclua ou cancele a mesclagem antes de fechar.", "erro");
        return;
      }

      fecharPainel();
    });

    window.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        const centralUpload = document.getElementById("centralUpload");
        if (centralUpload && centralUpload.classList.contains("aberta")) {
          event.preventDefault();
          fecharCentralUpload();
          return;
        }

        const centralConfiguracoes = document.getElementById("centralConfiguracoes");
        if (centralConfiguracoes && centralConfiguracoes.classList.contains("aberta")) {
          event.preventDefault();
          centralConfiguracoes.classList.remove("aberta");
          marcarCamadaFechadaAcessivel("centralConfiguracoes");
          return;
        }

        const painelCentral = document.getElementById("painelCentralDuplicidades");
        if (painelCentral && painelCentral.classList.contains("aberto")) {
          fecharPainelCentralDuplicidades();
          return;
        }

        const painelDashboard = document.getElementById("painelDashboard");
        if (painelDashboard && painelDashboard.classList.contains("aberto")) {
          window.fecharPainelDashboard();
          return;
        }

        const painel = document.getElementById("painelLateral");
        if (painel && painel.classList.contains("aberto")) {
          if (fluxoMesclagemAtivo()) {
            event.preventDefault();
            mostrarMensagemPainel("Conclua ou cancele a mesclagem antes de fechar.", "erro");
            return;
          }

          fecharPainel();
        }
      }
    });

    window.addEventListener("beforeunload", function (event) {
      if (!uploadEmAndamento) return;
      event.preventDefault();
      event.returnValue = "";
    });

    // EVENTOS_ANOTACAO
    document.addEventListener("input", (evento) => {
      if (evento.target && evento.target.id === "campoAnotacao") {
        ajustarAlturaAnotacao();
      }
    });

    document.addEventListener("focusin", (evento) => {
      if (evento.target && evento.target.id === "campoAnotacao") {
        ajustarAlturaAnotacao();
      }
    });
    inicializarEventosFixos();
    renderizarAvisoSessaoUploadInterrompida();
    await msalInstance.handleRedirectPromise();
    await atualizarTela();

