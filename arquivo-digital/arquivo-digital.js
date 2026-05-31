    import { PublicClientApplication } from "https://esm.sh/@azure/msal-browser@5.11.0";

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
    let documentoSelecionado = null;
    let anotacaoAtualItemId = null;
    let anotacaoAtualEtag = "";
    let timerSalvarAnotacao = null;
    let timerMensagemPainel = null;
    let anotacaoUltimoTextoSalvo = "";
    let arquivoLocalMesclar = null;
    let mesclagemEmAndamento = false;
    let pdfLibPromise = null;
    let dadosApoioCarregando = false;
    let dadosApoioCarregados = false;
    let duplicidadesCarregando = false;
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

    function normalizarTexto(texto) {
      return (texto || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    }

    function sanitizarNomeArquivo(nome) {
      let limpo = (nome || "")
        .toString()
        .replace(/[\\/:*?"<>|]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!limpo.toLowerCase().endsWith(".pdf")) {
        limpo += ".pdf";
      }

      return limpo;
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
        const dataA = new Date(a.modificado || a.dataModificacao || 0).getTime() || 0;
        const dataB = new Date(b.modificado || b.dataModificacao || 0).getTime() || 0;

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

    function carregarNomesParecidos(documento) {
      const caixa = document.getElementById("nomesParecidosArquivo");

      if (!caixa) {
        return;
      }

      const parecidos = buscarNomesParecidos(documento);

      if (!parecidos.length) {
        caixa.innerHTML = "<p>Nenhum nome parecido encontrado.</p>";
        return;
      }

      caixa.innerHTML = parecidos.map(item => {
        const status = item.doc.status === "ARQUIVADO" ? "Lixeira" : "Ativo";
        const classe = item.doc.status === "ARQUIVADO" ? "tagArquivado" : "tagAtivo";

        return `
          <div class="nomeParecido">
            <strong>${escaparHtml(item.doc.nome)}</strong>
            <span class="${classe}">${status}</span>
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
      document.getElementById("btnAbrirConfiguracoesTopo").style.display = "none";
      fecharPainel();
    }

    function aplicarBlindagemVisualPreLogin() {
      document.body.classList.add("estadoPreLogin");
      document.getElementById("areaSistema")?.style.setProperty("display", "none");
      document.getElementById("btnAbrirConfiguracoesTopo")?.style.setProperty("display", "none");
      document.getElementById("btnSair")?.style.setProperty("display", "none");
      document.getElementById("centralConfiguracoes")?.classList.remove("aberta");
      document.getElementById("centralUpload")?.classList.remove("aberta");
      document.getElementById("painelCentralDuplicidades")?.classList.remove("aberto");
      document.getElementById("painelDashboard")?.classList.remove("aberto");
      document.getElementById("painelLateral")?.classList.remove("aberto");
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
      msg.style.display = "block";

      setTimeout(() => {
        msg.style.display = "none";
      }, 4000);
    }

    function mostrarMensagemPainel(texto, tipo = "info") {
      const msg = document.getElementById("mensagemPainel");
      if (!msg) return;

      clearTimeout(timerMensagemPainel);

      msg.textContent = texto;
      msg.className = tipo === "erro" ? "mensagemPainel erroPainel" : "mensagemPainel";
      msg.style.visibility = "visible";
      msg.style.opacity = "1";
      msg.style.pointerEvents = "auto";

      timerMensagemPainel = setTimeout(() => {
        msg.style.opacity = "0";
        msg.style.visibility = "hidden";
        msg.style.pointerEvents = "none";
      }, 3500);
    }
    function atualizarStatusAnotacao(texto) {
      document.getElementById("statusAnotacao").textContent = texto;
    }

    function escaparHtml(valor) {
      const div = document.createElement("div");
      div.textContent = (valor || "").toString();
      return div.innerHTML;
    }

    function agendarTarefaSegundoPlano(tarefa, atraso = 80) {
      const executar = () => {
        try {
          const resultado = tarefa();
          if (resultado && typeof resultado.catch === "function") {
            resultado.catch(erro => console.warn("Tarefa em segundo plano falhou.", erro));
          }
        } catch (erro) {
          console.warn("Tarefa em segundo plano falhou.", erro);
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
      const statusRepetiveis = new Set([429, 500, 502, 503, 504]);
      let ultimoErro = null;

      for (let tentativa = 1; tentativa <= totalTentativas; tentativa++) {
        try {
          const resposta = await fetch(url, opcoes);

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

          console.warn(`Graph retornou HTTP ${resposta.status}. Nova tentativa ${tentativa + 1}/${totalTentativas} em ${atraso}ms.`);
          await aguardar(atraso);

        } catch (erro) {
          ultimoErro = erro;

          const deveRepetir = podeRepetirMetodo && tentativa < totalTentativas;
          if (!deveRepetir) {
            throw erro;
          }

          const atraso = Math.min(6000, atrasoBaseMs * Math.pow(2, tentativa - 1));
          console.warn(`Falha temporaria no Graph. Nova tentativa ${tentativa + 1}/${totalTentativas} em ${atraso}ms.`, erro);
          await aguardar(atraso);
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
    async function carregarDadosDeApoio() {
      if (dadosApoioCarregando) return;
      dadosApoioCarregando = true;
      try {
        const token = await obterToken();

        const urlHistorico = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.historicoAcessosListId}/items?$expand=fields($select=Title,USUARIO_EMAIL,ACAO,USUARIO_NOME,DATA_HORA,ARQUIVO_ID,OBSERVACAO)&$top=999`;

        const itensHistorico = await buscarTodosItens(urlHistorico, token);

        historicoCarregado = itensHistorico.map(item => ({
          ID: item.id,
          ARQUIVO: item.fields?.Title || "",
          USUARIO_EMAIL: item.fields?.USUARIO_EMAIL || "",
          ACAO: item.fields?.ACAO || "",
          USUARIO_NOME: item.fields?.USUARIO_NOME || "",
          DATA_HORA: item.fields?.DATA_HORA || "",
          ARQUIVO_ID: item.fields?.ARQUIVO_ID || "",
          OBSERVACAO: item.fields?.OBSERVACAO || ""
        }));

        const urlAnotacoes = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.anotacoesArquivosListId}/items?$expand=fields($select=Title,ARQUIVO_ID,ANOTACAO,ATUALIZADO_POR,DATA_ATUALIZACAO)&$top=999`;

        const itensAnotacoes = await buscarTodosItens(urlAnotacoes, token);

        anotacoesCarregadas = itensAnotacoes.map(item => ({
          ID: item.id,
          ETAG: item["@odata.etag"] || item.eTag || "",
          ARQUIVO: item.fields?.Title || "",
          ARQUIVO_ID: item.fields?.ARQUIVO_ID || "",
          ANOTACAO: item.fields?.ANOTACAO || "",
          ATUALIZADO_POR: item.fields?.ATUALIZADO_POR || "",
          DATA_ATUALIZACAO: item.fields?.DATA_ATUALIZACAO || ""
        }));

        dadosApoioCarregados = true;
        atualizarDashboard();
        filtrarDocumentos();
        if (document.getElementById("painelDashboard")?.classList.contains("aberto") && document.getElementById("listaHistoricoGeral")) {
          renderizarHistoricoGeral();
        }
      } finally {
        dadosApoioCarregando = false;
      }
    }

    window.recarregarDashboard = async function () {
      try {
        mostrarMensagem("Atualizando dashboard...");
        await carregarDadosDeApoio();
        mostrarMensagem("Dashboard atualizado.");
      } catch (erro) {
        console.error(erro);
        mostrarMensagem("Nao foi possivel atualizar o resumo agora.", "erro");
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
      central.classList.toggle("aberta");
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
        mostrarMensagem("Configuracoes salvas.");
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
                <button class="secundario" type="button" ${gavetasDisponiveis ? "" : "disabled"} data-acao-gaveta-config="editar" data-gaveta="${gavetaParam}">Editar</button>
                <button class="perigo" type="button" ${gavetasDisponiveis ? "" : "disabled"} data-acao-gaveta-config="excluir" data-gaveta="${gavetaParam}">Excluir</button>
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
        console.warn("Nao foi possivel carregar opcoes da coluna GAVETA no SharePoint. Usando fallback Gaveta 1 a Gaveta 34.", erro);
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
        console.error(erro);
        if (status) status.textContent = "Não foi possível salvar a nova gaveta no SharePoint. Verifique as permissões.";
        mostrarMensagem("Não foi possível salvar a nova gaveta no SharePoint. Verifique as permissões.", "erro");
      }
    };

    async function registrarHistoricoGavetasEmLote(documentos, gavetaAnterior, novaGaveta, motivo) {
      for (const documento of documentos) {
        try {
          await registrarHistorico(documento, "ALTEROU_GAVETA", motivo(gavetaAnterior, novaGaveta));
        } catch (erro) {
          console.warn("Nao foi possivel registrar historico da alteracao de gaveta.", documento?.nome, erro);
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
        console.error(erro);
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
        console.error(erro);
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
          <button class="gavetaCard ${filtroGavetaAtual === gaveta ? "ativo" : ""}" type="button" title="${escaparHtml(gaveta)}" aria-label="${escaparHtml(gaveta)}" onclick='filtrarPorGaveta(${JSON.stringify(gaveta)})'>
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

      abrirPainelDashboard("Histórico geral", `
        <div class="filtroHistoricoGeral" onclick="event.stopPropagation()">
          <div class="topoFiltroHistoricoGeral">
            <strong>Filtrar alterações</strong>
            <small id="resumoFiltroHistoricoGeral">Mostrando histórico completo.</small>
          </div>

          <div class="linhaBotoesFiltroHistoricoGeral">
            <button class="botaoFiltroHistoricoGeral ativo" type="button" data-filtro-historico="todos" onclick="filtrarHistoricoGeralPeriodo('todos', event)">Tudo</button>
            <button class="botaoFiltroHistoricoGeral" type="button" data-filtro-historico="hoje" onclick="filtrarHistoricoGeralPeriodo('hoje', event)">Hoje</button>
            <button class="botaoFiltroHistoricoGeral" type="button" data-filtro-historico="7dias" onclick="filtrarHistoricoGeralPeriodo('7dias', event)">7 dias</button>
            <button class="botaoFiltroHistoricoGeral" type="button" data-filtro-historico="30dias" onclick="filtrarHistoricoGeralPeriodo('30dias', event)">30 dias</button>
            <button class="botaoFiltroHistoricoGeral" type="button" data-filtro-historico="personalizado" onclick="filtrarHistoricoGeralPeriodo('personalizado', event)">Personalizado</button>
          </div>

          <div id="camposFiltroHistoricoPersonalizado" class="camposFiltroHistoricoPersonalizado">
            <label>De <input id="filtroHistoricoInicio" type="date" onclick="event.stopPropagation()"></label>
            <label>Até <input id="filtroHistoricoFim" type="date" onclick="event.stopPropagation()"></label>
            <button class="botaoAplicarFiltroHistorico" type="button" onclick="aplicarFiltroHistoricoGeralPersonalizado(event)">Aplicar</button>
          </div>

          <div class="linhaBuscaHistoricoGeral">
            <input id="buscaHistoricoGeral" class="buscaHistoricoGeral" type="search" placeholder="Buscar por arquivo, usuário, ação, gaveta ou motivo..." autocomplete="off" onclick="event.stopPropagation()" oninput="atualizarBuscaHistoricoGeral(event)">
            <div class="botoesOrdemHistoricoGeral" title="Ordenar histórico">
              <button class="botaoOrdemHistoricoGeral ativo" type="button" data-ordem-historico="desc" onclick="alterarOrdemHistoricoGeral('desc', event)" title="Mais recentes primeiro">↓</button>
              <button class="botaoOrdemHistoricoGeral" type="button" data-ordem-historico="asc" onclick="alterarOrdemHistoricoGeral('asc', event)" title="Mais antigos primeiro">↑</button>
            </div>
          </div>
        </div>

        <div id="listaHistoricoGeral" class="listaHistoricoGeral">
          <p>Carregando histórico geral...</p>
        </div>
      `, { htmlInternoConfiavel: true });

      sincronizarCamposFiltroHistoricoGeral();
      renderizarHistoricoGeral();
    };
window.verMaisHistoricoGeral = function (event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      const conteudoPainel = document.querySelector("#painelDashboard .painelConteudo");
      const posicaoRolagem = conteudoPainel ? conteudoPainel.scrollTop : 0;

      limiteHistoricoGeralAtual += preferenciasSistema.limiteRelatorios || 30;
      renderizarHistoricoGeral();

      requestAnimationFrame(() => {
        const conteudoAtualizado = document.querySelector("#painelDashboard .painelConteudo");
        if (conteudoAtualizado) {
          conteudoAtualizado.scrollTop = posicaoRolagem;
        }
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
        resumoPeriodo = `Histórico completo: ${totalBase} registro(s).`;
      } else if (filtro.tipo === "hoje") {
        resumoPeriodo = `Hoje: ${totalBase} de ${totalGeral} registro(s).`;
      } else if (filtro.tipo === "7dias") {
        resumoPeriodo = `Últimos 7 dias: ${totalBase} de ${totalGeral} registro(s).`;
      } else if (filtro.tipo === "30dias") {
        resumoPeriodo = `Últimos 30 dias: ${totalBase} de ${totalGeral} registro(s).`;
      } else {
        const partes = [];
        if (filtro.inicio) partes.push(`de ${filtro.inicio.split("-").reverse().join("/")}`);
        if (filtro.fim) partes.push(`até ${filtro.fim.split("-").reverse().join("/")}`);
        resumoPeriodo = `Período ${partes.join(" ")}: ${totalBase} de ${totalGeral} registro(s).`;
      }

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
        caixa.innerHTML = "<p>Histórico geral ainda não carregado. Aguarde alguns segundos e tente novamente.</p>";
        return;
      }

      const ordenados = [...historicoCarregado]
        .filter(item => item && item.DATA_HORA)
        .sort(compararHistoricoGeralPorData);

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
        const usuario = item.USUARIO_NOME || item.USUARIO_EMAIL || "Usuario nao informado";
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

      const botaoMais = filtrados.length > exibidos.length ? `
        <button class="secundario btnVerMaisHistoricoGeral" type="button" onclick="verMaisHistoricoGeral(event)">Ver mais</button>
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
        conteudo.innerHTML = conteudoHtml || "";
      } else {
        conteudo.textContent = conteudoHtml || "";
      }
      painel.classList.add("aberto");
    }

    window.fecharPainelDashboard = function () {
      document.getElementById("painelDashboard")?.classList.remove("aberto");
    };

    window.abrirRelatoriosAdministrativos = function () {
      const secao = document.getElementById("centralRelatorios");
      if (!secao) return;
      secao.classList.toggle("aberta");
      if (secao.classList.contains("aberta")) {
        renderizarRelatoriosAdministrativos();
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
      const recentesEnviados = documentosAtivos.filter(documentoEnviadoRecentemente).length;
      const recentesAlterados = documentosAtivos.filter(documentoAlteradoRecentemente).length;
      const usuarios = new Map();
      historicoCarregado.forEach(item => {
        const usuario = item.USUARIO_NOME || item.USUARIO_EMAIL || "Usuario nao informado";
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
        <div class="relatorioCard"><strong>Enviados recentemente</strong><span>${recentesEnviados}</span></div>
        <div class="relatorioCard"><strong>Alterados recentemente</strong><span>${recentesAlterados}</span></div>
        <div class="relatorioCard"><strong>Histórico por usuário</strong><ul>${linhasUsuarios || "<li>Histórico ainda não carregado.</li>"}</ul></div>
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
        mostrarMensagem("Nao foi possivel copiar o relatorio automaticamente.", "erro");
      }
    };

    function aplicarListaAtual() {
      documentosCarregados = modoListaAtual === "na Lixeira"
        ? documentosLixeira
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
      centralDuplicidadesAnalisada = false;
    }

    async function carregarParesDuplicidadeIgnorados() {
      if (carregouIgnoradosDuplicidade) return;

      try {
        const token = await obterToken();
        const alertasSistemaListId = "9abdb5fc-c009-4a59-9f91-03677b001b56";
        const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${alertasSistemaListId}/items?$expand=fields($select=Title,ARQUIVO_ID,TIPO_ALERTA,STATUS,DATA_ALERTA,OBSERVACAO)&$top=999`;

        const resposta = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!resposta.ok) {
          console.warn("Não foi possível carregar pares ignorados.", await resposta.text());
          return;
        }

        const dados = await resposta.json();

        const ignorados = (dados.value || [])
          .map(item => ({
            itemId: item.id,
            fields: item.fields || {}
          }))
          .filter(item => item.fields.STATUS === "IGNORADO" && item.fields.ARQUIVO_ID && item.fields.ARQUIVO_ID.includes("|"));

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
        console.warn("Erro ao carregar pares ignorados:", erro);
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
        mostrarMensagem("Nao foi possivel localizar os dois arquivos.", "erro");
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

        paresDuplicidadesIgnorados.add(chave);
        limparCacheDuplicidades();
        mostrarMensagem("Par marcado como pessoas diferentes.");

        if (typeof atualizarCentralDuplicidades === "function") {
          await atualizarCentralDuplicidades();
        }
      } catch (erro) {
        console.error(erro);
        mostrarMensagem("Nao foi possivel salvar esta marcacao. Tente novamente.", "erro");
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
          <button onclick="desfazerTodosParesPessoasDiferentesCentral()">Desfazer todos</button>
        </div>
      ` + paresDuplicidadesIgnoradosDetalhes.map(item => `
        <div class="duplicidadeIgnorada">
          <div>
            <strong>${textoSeguroCentral(item.nomeA)}</strong>
            <span>${textoSeguroCentral(item.nomeB)}</span>
          </div>
          <button onclick='desfazerPessoasDiferentesCentral(${JSON.stringify(item.itemId)}, ${JSON.stringify(item.chave)})'>Desfazer</button>
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
        mostrarMensagem("Nao foi possivel identificar este par.", "erro");
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
        console.error(erro);
        mostrarMensagem("Nao foi possivel desfazer a marcacao. Tente novamente.", "erro");
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
        console.error(erro);
        carregouIgnoradosDuplicidade = false;
        mostrarMensagem("Nao foi possivel desfazer todas as marcacoes. Atualize a analise e confira os pares restantes.", "erro");

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
      const botao = document.getElementById("btnAlternarCentralDuplicidades");

      if (!central || !caixa) {
        return;
      }

      central.classList.toggle("discreta", quantidadePares === 0);
      central.classList.toggle("comAlerta", quantidadePares > 0);
      central.classList.toggle("centralFechada", quantidadePares > 0 && !centralDuplicidadesAberta);
      caixa.style.display = quantidadePares > 0 && centralDuplicidadesAberta ? "grid" : "none";

      if (botao) {
        botao.style.display = "inline-block";
        botao.textContent = quantidadePares > 0 ? "Abrir Central" : "Ver Central";
      }
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
      }, 150);
    }

    window.alternarCentralDuplicidades = function () {
      centralDuplicidadesAberta = true;
      aplicarEstadoVisualCentralDuplicidades(totalParesCentralDuplicidades);
      document.getElementById("painelCentralDuplicidades")?.classList.add("aberto");

      if (!centralDuplicidadesAnalisada && !duplicidadesCarregando) {
        atualizarCentralDuplicidadesSegundoPlano();
      }
    };

    window.fecharPainelCentralDuplicidades = function () {
      centralDuplicidadesAberta = false;
      aplicarEstadoVisualCentralDuplicidades(totalParesCentralDuplicidades);
      document.getElementById("painelCentralDuplicidades")?.classList.remove("aberto");
    };

    window.abrirParesIgnoradosDashboard = function () {
      centralDuplicidadesAberta = true;
      aplicarEstadoVisualCentralDuplicidades(totalParesCentralDuplicidades);
      document.getElementById("painelCentralDuplicidades")?.classList.add("aberto");

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
      resumo.textContent = "Analisando duplicidades em segundo plano...";

      try {
        await carregarParesDuplicidadeIgnorados();
        renderizarParesIgnoradosDuplicidade();
      } catch (erro) {
        console.warn("Nao foi possivel atualizar a Central de Duplicidades.", erro);
        resumo.textContent = "Nao foi possivel atualizar a Central de Duplicidades agora.";
        duplicidadesCarregando = false;
        return;
      }

      const pares = gerarParesDuplicidades();
      totalParesCentralDuplicidades = pares.length;

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
                <strong>${textoSeguroCentral(par.a.nome)}</strong>
                <button data-acao-duplicidade="abrir" data-id="${idA}" data-status="${statusValorA}">Abrir no painel</button>
              </div>

              <div class="duplicidadeArquivo">
                <span class="${tagB}">${statusB}</span>
                <strong>${textoSeguroCentral(par.b.nome)}</strong>
                <button data-acao-duplicidade="abrir" data-id="${idB}" data-status="${statusValorB}">Abrir no painel</button>
              </div>
            </div>

            <div class="duplicidadeAcoes">
              <button class="btnPessoasDiferentes" data-acao-duplicidade="pessoas-diferentes" data-id-a="${idA}" data-id-b="${idB}">São pessoas diferentes</button>
            </div>
            <small>Revise os dois documentos antes de arquivar, substituir ou mesclar.</small>
          </div>
        `;
      }).join("");
      duplicidadesCarregando = false;
    };

    document.addEventListener("click", function (evento) {
      const botao = evento.target.closest("[data-acao-duplicidade]");
      if (!botao || !botao.closest("#listaCentralDuplicidades")) return;

      const acao = botao.dataset.acaoDuplicidade;

      if (acao === "abrir") {
        window.abrirArquivoDaCentral(botao.dataset.id || "", botao.dataset.status || "");
        return;
      }

      if (acao === "pessoas-diferentes") {
        window.marcarPessoasDiferentesCentral(botao.dataset.idA || "", botao.dataset.idB || "");
      }
    });

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

      const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists/${CONFIG.historicoAcessosListId}/items`;

      const corpo = {
        fields: {
          Title: documento.nome,
          USUARIO_EMAIL: conta?.username || "",
          ACAO: acao,
          USUARIO_NOME: conta?.name || "",
          DATA_HORA: new Date().toISOString(),
          ARQUIVO_ID: documento.id || "",
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
        ARQUIVO_ID: documento.id || "",
        OBSERVACAO: observacao
      });

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
      const limpo = limparTextoHistoricoCard(valor);
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
    async function carregarHistoricoDocumento(documento) {
      const caixa = document.getElementById("historicoArquivo");
      if (!caixa) return;

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
        const anotacoesJaMostradas = new Set();

        const entradasHistorico = (historicoCarregado || [])
          .filter(item => item && item.ARQUIVO_ID === documento.id)
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

        const entradasAnotacao = (anotacoesCarregadas || [])
          .filter(item => item && item.ARQUIVO_ID === documento.id && (item.ANOTACAO || "").trim())
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
              <div class="itemHistorico anotacaoEvento">
                <strong>${esc(item.tipo === "anotacaoAtual" ? "ANOTAÇÃO ATUAL" : "ANOTAÇÃO")}</strong><br>
                <span>${esc(dataFormatada)}</span><br>
                <span>${usuario}${email}</span>
                <div class="motivoHistorico anotacaoHistorico"><strong>Anotação:</strong> ${esc(item.observacao)}</div>
              </div>
            `;
          }

          const usuarioHistorico = usuario || email
            ? `${usuario}${email}`.replace(/^\s+-\s+/, "")
            : "Usuario nao informado";
          const historicoFormatado = montarHistoricoFormatado(item.acao, item.observacao || "", esc);

          return `
            <div class="itemHistorico">
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

      if (!dadosApoioCarregados) {
        caixa.innerHTML = montarCarregamentoVisual("Histórico em segundo plano", "Os dados estão sendo preparados. Tente novamente em alguns instantes.", "⏱️");

        agendarTarefaSegundoPlano(async () => {
          try {
            if (dadosApoioCarregando) {
              for (let tentativa = 0; tentativa < 30 && dadosApoioCarregando; tentativa++) {
                await new Promise(resolve => setTimeout(resolve, 200));
              }
            } else {
              await carregarDadosDeApoio();
            }

            if (documentoSelecionado && documentoSelecionado.id === documento.id) {
              carregarHistoricoDocumento(documento);
            }
          } catch (erro) {
            console.error(erro);
            if (documentoSelecionado && documentoSelecionado.id === documento.id) {
              caixa.innerHTML = "<p class='textoErro'>Nao foi possivel carregar o historico.</p>";
            }
          }
        }, 120);

        return;
      }

      try {
        renderizarHistoricoDoCache();
      } catch (erro) {
        console.error(erro);
        caixa.innerHTML = "<p class='textoErro'>Nao foi possivel carregar o historico.</p>";
      }
    }
    async function carregarAnotacaoDocumento(documento) {
      const textarea = document.getElementById("campoAnotacao");
      textarea.value = "";
      anotacaoAtualItemId = null;
      anotacaoAtualEtag = "";
      atualizarStatusAnotacao("Carregando anotação...");

      try {
        const item = anotacoesCarregadas.find(x => x.ARQUIVO_ID === documento.id);

        if (item) {
          anotacaoAtualItemId = item.ID;
          anotacaoAtualEtag = item.ETAG || "";
          textarea.value = item.ANOTACAO || "";
          atualizarStatusAnotacao(`Última atualização: ${formatarData(item.DATA_ATUALIZACAO)} - ${item.ATUALIZADO_POR || ""}`);
        } else {
          anotacaoUltimoTextoSalvo = "";
          atualizarStatusAnotacao("Nenhuma anotação salva ainda.");
        }

      } catch (erro) {
        console.error(erro);
        atualizarStatusAnotacao("Nao foi possivel carregar a anotacao.");
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

      const campos = {
        Title: documentoSelecionado.nome,
        ARQUIVO_ID: documentoSelecionado.id || "",
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
            await carregarDadosDeApoio();
            await carregarAnotacaoDocumento(documentoSelecionado);

            const campoAnotacao = document.getElementById("campoAnotacao");
            const textoAtualSharePoint = campoAnotacao?.value || "";
            if (campoAnotacao) {
              campoAnotacao.dataset.textoAtualSharePoint = textoAtualSharePoint;
              campoAnotacao.dataset.textoConflitoAnotacao = textoTentado;
              campoAnotacao.value = textoTentado;
              ajustarAlturaAnotacao();
            }

            atualizarStatusAnotacao("Conflito de edicao: outra pessoa salvou uma versao mais recente. Seu texto foi mantido no campo; copie ou revise antes de salvar novamente.");
            const erroConflito = new Error("Conflito de edicao na anotacao. Outra pessoa salvou uma versao mais recente.");
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
          ARQUIVO_ID: documentoSelecionado.id || "",
          ANOTACAO: texto,
          ATUALIZADO_POR: atualizadoPor,
          DATA_ATUALIZACAO: agora
        });
      }

      atualizarDashboard();
            // Registrar historico de anotacao somente quando o texto mudou
      if (texto !== anotacaoUltimoTextoSalvo) {
        const textoHistorico = texto ? texto : "Anotação removida.";

        try {
          await registrarHistorico(documentoSelecionado, "ANOTACAO", textoHistorico);
          anotacaoUltimoTextoSalvo = texto;

        } catch (erroHistoricoAnotacao) {
          console.warn("Anotação salva, mas não foi possível registrar no histórico.", erroHistoricoAnotacao);
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
      atualizarStatusAnotacao("Alteracao nao salva. Clique em Salvar anotacao.");
    };

    window.salvarAnotacaoManual = async function () {
      clearTimeout(timerSalvarAnotacao);
      anotacaoUltimoTextoSalvo = "";

      try {
        atualizarStatusAnotacao("Salvando...");
        await salvarAnotacaoAgora();
        mostrarMensagemPainel("Anotação salva.");
      } catch (erro) {
        console.error(erro);
        if (erro.conflitoAnotacao) {
          mostrarMensagemPainel("Conflito de edicao: revise o texto antes de salvar novamente.", "erro");
        } else {
          atualizarStatusAnotacao("Nao foi possivel salvar a anotacao.");
          mostrarMensagemPainel("Nao foi possivel salvar a anotacao. Tente novamente.", "erro");
        }
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

      const jaExiste = documentosCarregados.some(doc =>
        doc.id !== documentoSelecionado.id &&
        normalizarTexto(doc.nome) === normalizarTexto(novoNome)
      );

      const nomesExistentesRenomear = new Set(
        documentosAtivos
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
        mostrarMensagem(
          houveAjusteNomeDuplicado
            ? `Arquivo renomeado como "${nomeFinalRenomear}". A Central de Duplicidades pode apontar nomes parecidos.`
            : "Arquivo renomeado com sucesso."
        );

      } catch (erro) {
        console.error(erro);
        mostrarMensagemPainel("Nao foi possivel renomear o arquivo. Tente novamente.", "erro");
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

      if (!arquivo.name.toLowerCase().endsWith(".pdf")) {
        mostrarMensagemPainel("Selecione somente arquivo PDF.", "erro");
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

      try {
        mostrarMensagemPainel("Substituindo arquivo. Aguarde...");

        const token = await obterToken();
        const driveItem = await obterDriveItemDoDocumento(documentoSelecionado);
        const driveId = driveItem.parentReference?.driveId || documentoSelecionado.driveId;

        const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${driveItem.id}/content`;

        const resposta = await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": arquivo.type || "application/pdf"
          },
          body: arquivo
        });

        if (!resposta.ok) {
          throw new Error(await resposta.text());
        }

        await registrarHistorico(
          documentoSelecionado,
          "SUBSTITUIU",
          `Arquivo substituído por nova versão enviada: ${arquivo.name}. Tamanho: ${Math.round(arquivo.size / 1024)} KB.`
        );

        document.getElementById("boxSubstituir").style.display = "none";
        document.getElementById("arquivoSubstituto").value = "";

        await atualizarDadosMantendoPainel();
        mostrarMensagemPainel("Arquivo substituido com sucesso. O historico foi atualizado.");

      } catch (erro) {
        console.error(erro);
        mostrarMensagemPainel("Nao foi possivel substituir o arquivo. Tente novamente.", "erro");
      }
    };

    window.prepararMesclar = function () {
      if (!documentoSelecionado) {
        mostrarMensagemPainel("Selecione um arquivo antes de mesclar.", "erro");
        return;
      }

      if (documentoSelecionado.status === "ARQUIVADO") {
        mostrarMensagemPainel("Restaure o documento antes de mesclar.", "erro");
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

    window.selecionarArquivoLocalMesclar = function (input) {
      const arquivo = input?.files && input.files[0];
      arquivoLocalMesclar = null;

      if (!arquivo) {
        document.getElementById("arquivoSelecionadoMesclar").textContent = "Nenhum PDF selecionado.";
        return;
      }

      if (arquivo.type !== "application/pdf" && !arquivo.name.toLowerCase().endsWith(".pdf")) {
        input.value = "";
        document.getElementById("arquivoSelecionadoMesclar").textContent = "Escolha um arquivo em PDF.";
        mostrarMensagemPainel("Escolha um arquivo em PDF.", "erro");
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
        throw new Error("pdf-lib nao carregou corretamente.");
      }

      return modulo.PDFDocument;
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

        atualizarStatusMesclar("Registrando no historico...");
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
        atualizarStatusMesclar("Concluido.");

        await atualizarDadosMantendoPainel();
        mostrarMensagemPainel("Mesclagem concluida. O arquivo foi atualizado mantendo o mesmo nome.");
      } catch (erro) {
        console.error(erro);
        atualizarStatusMesclar("");
        mostrarMensagemPainel("Nao foi possivel concluir a mesclagem. Tente novamente.", "erro");
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
        mostrarMensagem("Arquivo movido para a Lixeira. Ele nao foi excluido.");

      } catch (erro) {
        console.error(erro);
        mostrarMensagemPainel("Nao foi possivel mover o arquivo para a Lixeira. Tente novamente.", "erro");
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
          mostrarMensagemPainel("Ja existe um arquivo ativo com esse nome. Renomeie um dos arquivos antes de restaurar.", "erro");
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
        console.error(erro);
        mostrarMensagemPainel("Nao foi possivel restaurar o arquivo. Tente novamente.", "erro");
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
        console.error(erro);
        mostrarMensagemPainel("Nao foi possivel alterar a gaveta. Tente novamente.", "erro");
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

      let indice = documentosCarregados.findIndex(doc => doc.id === id);

      if (indice < 0 && nome) {
        indice = documentosCarregados.findIndex(doc => normalizarTexto(doc.nome) === normalizarTexto(nome));
      }

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
        mostrarMensagemPainel("Nao foi possivel identificar o arquivo para abrir esta versao.", "erro");
        return;
      }

      if (!versionId) {
        mostrarMensagemPainel("Esta versao nao esta disponivel.", "erro");
        return;
      }

      try {
        mostrarMensagemPainel("Abrindo versao...");

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
        console.error(erro);
        mostrarMensagemPainel("Nao foi possivel abrir esta versao. Tente novamente.", "erro");
      }
    };

    function renderizarVersoesSharePoint() {
      const caixa = document.getElementById("versoesSharePoint");
      if (!caixa) return;

      const versoes = versoesSharePointCarregadas || [];
      if (!versoes.length) {
        caixa.innerHTML = "<p>Nenhuma versao encontrada.</p>";
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
          ? `<button class="btnVersaoSharePoint" type="button" onclick="window.open(window.versaoDownloadDocumentoAtual?.linkAtual || '#', '_blank')">Visualizar versao atual</button>`
          : `<button class="btnVersaoSharePoint" type="button" data-version-id="${escaparHtml(numero)}">Visualizar versao</button>`;

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
        <button class="btnAlternarVersoes" type="button" onclick="alternarTodasVersoesSharePoint()">
          ${versoesSharePointExpandido ? "Recolher" : "Ver todas"}
        </button>
      ` : "");

      caixa.querySelectorAll(".btnVersaoSharePoint[data-version-id]").forEach(botao => {
        botao.addEventListener("click", () => {
          visualizarVersaoSharePoint(botao.dataset.versionId);
        });
      });
    }

    window.alternarTodasVersoesSharePoint = function () {
      versoesSharePointExpandido = !versoesSharePointExpandido;
      renderizarVersoesSharePoint();
    };
    async function carregarVersoesSharePointDocumento(documento) {
      const caixa = document.getElementById("versoesSharePoint");

      if (!caixa) return;

      window.versaoDownloadDocumentoAtual = null;
      versoesSharePointCarregadas = [];
      versoesSharePointExpandido = false;

      if (!documento || !documento.listItemId) {
        caixa.innerHTML = "<p>Selecione um arquivo para carregar as versoes.</p>";
        return;
      }

      const documentoVersoesId = documento.id || "";
      const versoesAindaDoDocumentoAtual = () =>
        !documentoVersoesId ||
        (documentoSelecionado && documentoSelecionado.id === documentoVersoesId);

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
          caixa.innerHTML = "<p>Nenhuma versao encontrada.</p>";
          return;
        }

        versoesSharePointCarregadas = versoes;
        renderizarVersoesSharePoint();

      } catch (erro) {
        console.error(erro);

        if (versoesAindaDoDocumentoAtual()) {
          caixa.innerHTML = "<p class='textoErro'>Nao foi possivel carregar as versoes do arquivo.</p>";
        }
      }
    }
    async function abrirDocumentoNoPainel(documento) {
      if (!documento) {
        mostrarMensagem("Documento nao encontrado.", "erro");
        return;
      }

      documentoSelecionado = documento;

      document.getElementById("painelTitulo").textContent = documento.nome;
      document.getElementById("painelNome").textContent = documento.nome;
      const painelId = document.getElementById("painelId");
      if (painelId) painelId.textContent = documento.id || "";
      const painelCaminho = document.getElementById("painelCaminho");
      if (painelCaminho) painelCaminho.textContent = documento.caminho || "";
      document.getElementById("painelStatus").textContent = documento.status === "ARQUIVADO" ? "Lixeira" : "Ativo";
      const painelGaveta = document.getElementById("painelGaveta");
      if (painelGaveta) painelGaveta.textContent = gavetaOuPadrao(documento.gaveta);

      const estaArquivado = documento.status === "ARQUIVADO";
      document.getElementById("btnRenomear").style.display = estaArquivado ? "none" : "inline-block";
      document.getElementById("btnSubstituir").style.display = estaArquivado ? "none" : "inline-block";
      document.getElementById("btnArquivar").style.display = estaArquivado ? "none" : "inline-block";
      document.getElementById("btnRestaurar").style.display = estaArquivado ? "inline-block" : "none";
      document.getElementById("btnMesclar").style.display = estaArquivado ? "none" : "inline-block";

      document.getElementById("painelLateral").classList.add("aberto");
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
      const painel = document.getElementById("painelLateral");
      const tokenCarregamentoPainel = `${documentoDoPainel.id || ""}-${Date.now()}`;
      if (painel) painel.dataset.carregamentoPainel = tokenCarregamentoPainel;

      const painelAindaMostraDocumento = () =>
        painel &&
        painel.dataset.carregamentoPainel === tokenCarregamentoPainel &&
        documentoSelecionado &&
        documentoSelecionado.id === documentoDoPainel.id;

      const carregarBlocoPainel = (nomeBloco, tarefa, atraso = 0) => {
        setTimeout(async () => {
          if (!painelAindaMostraDocumento()) return;

          try {
            await tarefa();
          } catch (erro) {
            console.error(`Falha ao carregar ${nomeBloco} do painel.`, erro);
          }
        }, atraso);
      };

      const nomesParecidosPainel = document.getElementById("nomesParecidosArquivo");
      if (nomesParecidosPainel) nomesParecidosPainel.innerHTML = "<p>Procurando nomes parecidos...</p>";

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

      carregarBlocoPainel("nomes parecidos", () => carregarNomesParecidos(documentoDoPainel), 0);

      carregarBlocoPainel("historico", () => carregarHistoricoDocumento(documentoDoPainel), 40);

      carregarBlocoPainel("anotacao", async () => {
        await carregarAnotacaoDocumento(documentoDoPainel);
        ajustarAlturaAnotacao();
      }, 80);

      carregarBlocoPainel("versoes", () => carregarVersoesSharePointDocumento(documentoDoPainel), 120);
      /* FIM_PAINEL_LATERAL_SEGUNDO_PLANO_20260527 */
    }

    window.selecionarDocumento = async function (indice) {
      const documento = documentosCarregados[indice];
      await abrirDocumentoNoPainel(documento);
    };

    window.fecharPainel = function () {
      document.getElementById("painelLateral").classList.remove("aberto");
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
        mostrarMensagemPainel("Nao foi possivel localizar o link deste PDF.", "erro");
        return;
      }

      const aba = window.open("", "_blank");

      if (aba) {
        aba.location.href = linkPdf;
      } else {
        window.location.href = linkPdf;
      }

      mostrarMensagemPainel("PDF aberto. Registrando acesso no historico...");

      setTimeout(async () => {
        try {
          await registrarHistorico(
            documentoAberto,
            "VISUALIZOU",
            "Documento aberto pelo botão Abrir PDF no painel lateral."
          );

          if (documentoSelecionado && documentoSelecionado.id === documentoAberto.id) {
            mostrarMensagemPainel("Acesso registrado no historico.");
          }
        } catch (erro) {
          console.error(erro);

          if (documentoSelecionado && documentoSelecionado.id === documentoAberto.id) {
            mostrarMensagemPainel("PDF aberto, mas nao foi possivel registrar no historico agora.", "erro");
          }
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

    function limparNomeArquivoPdf(nomeOriginal) {
      let nome = (nomeOriginal || "DOCUMENTO.pdf")
        .replace(/[\\/:*?"<>|]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!nome.toLowerCase().endsWith(".pdf")) {
        nome += ".pdf";
      }

      return nome.toUpperCase();
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
        opcoes.push(`<option value="${valor}"${selecionado}>${valor}</option>`);
      });
      return opcoes.join("");
    }

    let arquivosCentralUpload = [];
    let uploadEmAndamento = false;
    let uploadConcluidoComSucesso = false;
    let uploadTeveErro = false;
    let statusArquivosUpload = [];
    const LIMITE_UPLOAD_SIMPLES_BYTES = 25 * 1024 * 1024;
    const TAMANHO_BLOCO_UPLOAD_SESSION_BYTES = 5 * 1024 * 1024;
    const MAX_TENTATIVAS_EXTRAS_BLOCO_UPLOAD = 2;

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
      document.getElementById("gavetaUpload").innerHTML = opcoesGavetaHtml();
      uploadConcluidoComSucesso = false;
      uploadTeveErro = false;
      atualizarProgressoUpload(0, "Aguardando arquivos", "Selecione os PDFs para enviar.", "");
      renderizarListaCentralUpload();
    };

    function centralUploadTemRascunho() {
      const gaveta = (document.getElementById("gavetaUpload")?.value || "").trim();
      const motivo = (document.getElementById("motivoUpload")?.value || "").trim();
      return arquivosCentralUpload.length > 0 || !!gaveta || !!motivo;
    }

    function descartarCentralUpload() {
      arquivosCentralUpload = [];
      statusArquivosUpload = [];
      uploadConcluidoComSucesso = false;
      uploadTeveErro = false;
      document.getElementById("motivoUpload").value = "";
      document.getElementById("gavetaUpload").value = "";
      const btnConcluir = document.getElementById("btnConcluirUploadCentral");
      if (btnConcluir) btnConcluir.style.display = "none";
      atualizarProgressoUpload(0, "Aguardando arquivos", "Selecione os PDFs para enviar.", "");
      renderizarListaCentralUpload();
      document.getElementById("centralUpload")?.classList.remove("aberta");
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
      arquivosCentralUpload = Array.from(input?.files || []);
      statusArquivosUpload = arquivosCentralUpload.map(() => "Pendente");
      uploadConcluidoComSucesso = false;
      uploadTeveErro = false;
      ocultarConfirmacaoFecharUpload();
      input.value = "";
      abrirCentralUpload();
      renderizarListaCentralUpload();
    };

    window.limparCentralUpload = function () {
      if (uploadEmAndamento) {
        mostrarMensagem("O envio está em andamento. Aguarde terminar para evitar falhas.", "erro");
        return;
      }

      if (!uploadConcluidoComSucesso && !uploadTeveErro && centralUploadTemRascunho()) {
        const limpar = confirm("Você selecionou arquivos que ainda não foram enviados. Deseja limpar a seleção?");
        if (!limpar) return;
      }

      arquivosCentralUpload = [];
      statusArquivosUpload = [];
      uploadConcluidoComSucesso = false;
      uploadTeveErro = false;
      ocultarConfirmacaoFecharUpload();
      document.getElementById("motivoUpload").value = "";
      document.getElementById("gavetaUpload").value = "";
      atualizarProgressoUpload(0, "Aguardando arquivos", "Selecione os PDFs para enviar.", "");
      renderizarListaCentralUpload();
    };

    function textoStatusUpload(status) {
      return status || "Pendente";
    }

    function analisarNomesSelecionadosUpload() {
      const ocupados = criarConjuntoNomesUploadOcupados();
      const vistosNaSelecao = new Set();

      return arquivosCentralUpload.map(arquivo => {
        const nomeSolicitado = limparNomeArquivoPdf(arquivo.name);
        const chave = normalizarTexto(nomeSolicitado);
        const repetidoExistente = ocupados.has(chave);
        const repetidoNaSelecao = vistosNaSelecao.has(chave);
        vistosNaSelecao.add(chave);

        return {
          nomeSolicitado,
          nomeRepetido: repetidoExistente || repetidoNaSelecao,
          arquivoGrande: (arquivo.size || 0) > LIMITE_UPLOAD_SIMPLES_BYTES
        };
      });
    }

    function renderizarListaCentralUpload() {
      const lista = document.getElementById("listaArquivosUpload");
      const contador = document.getElementById("contadorArquivosUpload");
      if (!lista || !contador) return;

      contador.textContent = `${arquivosCentralUpload.length} arquivo(s) selecionado(s)`;

      if (!arquivosCentralUpload.length) {
        lista.innerHTML = "<li>Nenhum PDF selecionado.</li>";
        return;
      }

      const analiseNomes = analisarNomesSelecionadosUpload();

      lista.innerHTML = arquivosCentralUpload.map((arquivo, indice) => {
        const nomeRepetido = analiseNomes[indice]?.nomeRepetido;
        const arquivoGrande = analiseNomes[indice]?.arquivoGrande;
        return `
        <li class="statusUpload${escaparHtml(textoStatusUpload(statusArquivosUpload[indice])).replace(/\s+/g, "")}${nomeRepetido ? " uploadNomeRepetido" : ""}${arquivoGrande ? " uploadNomeRepetido" : ""}">
          <strong>${escaparHtml(arquivo.name)}</strong>
          <span>${escaparHtml(formatarTamanhoUpload(arquivo.size))}</span>
          <small>${escaparHtml(textoStatusUpload(statusArquivosUpload[indice]))}</small>
          ${nomeRepetido ? "<small class=\"avisoNomeRepetido\">Nome já existe — será enviado com nome livre</small>" : ""}
          ${arquivoGrande ? "<small class=\"avisoNomeRepetido\">Arquivo grande — será enviado em blocos</small>" : ""}
        </li>
      `;
      }).join("");
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
        throw new Error("Graph nao retornou URL de upload session.");
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

    async function enviarArquivoPdfComMetadados(arquivo, gaveta, motivo, ocupados, onEtapa = () => {}) {
      if (arquivo.type !== "application/pdf" && !arquivo.name.toLowerCase().endsWith(".pdf")) {
        throw new Error(`Arquivo ignorado porque nao e PDF: ${arquivo.name}`);
      }

      onEtapa("Preparando envio");
      const token = await obterToken();
      const driveId = await obterDriveDocumentosAtivos();
      const nomeSolicitado = limparNomeArquivoPdf(arquivo.name);
      const nomeFinal = gerarNomeLivreUploadPdfComOcupados(nomeSolicitado, ocupados);
      ocupados.add(normalizarTexto(nomeFinal));
      const nomeFoiAjustado = normalizarTexto(nomeFinal) !== normalizarTexto(nomeSolicitado);
      const usarUploadSession = (arquivo.size || 0) > LIMITE_UPLOAD_SIMPLES_BYTES;
      let driveItem;

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

      try {
        const listItemId = await obterListItemIdDoDriveItem(driveId, driveItem.id, token);
        onEtapa("Salvando gaveta");
        await atualizarGavetaItemSharePoint(listItemId, gaveta, token);
        const documentoNovo = await carregarDocumentoPorListItemId(listItemId, token);

        const observacaoEnvio = nomeFoiAjustado
          ? `${motivo} Gaveta: ${gaveta}. Nome original: ${nomeSolicitado}. Enviado automaticamente como: ${nomeFinal}, para evitar substituicao acidental.`
          : `${motivo} Gaveta: ${gaveta}.`;

        onEtapa("Registrando no historico");
        await registrarHistorico(documentoNovo, "ENVIOU", observacaoEnvio);
      } catch (erroConclusao) {
        const erroParcial = new Error(`Arquivo enviado como ${nomeFinal}, mas houve falha ao salvar gaveta ou historico. Verifique o SharePoint antes de reenviar.`);
        erroParcial.uploadParcial = true;
        erroParcial.causaOriginal = erroConclusao;
        throw erroParcial;
      }

      return { nomeSolicitado, nomeFinal, nomeFoiAjustado };
    }

    window.enviarNovoDocumento = async function (input) {
      arquivosCentralUpload = Array.from(input?.files || []);
      input.value = "";
      abrirCentralUpload();
      renderizarListaCentralUpload();
    };

    window.confirmarUploadCentral = async function () {
      if (uploadEmAndamento) {
        mostrarMensagem("O envio ja esta em andamento. Aguarde terminar.", "erro");
        return;
      }

      if (uploadConcluidoComSucesso || uploadTeveErro) {
        mostrarMensagem("Este envio ja foi processado. Clique em Concluir e fechar antes de iniciar outro envio.", "erro");
        return;
      }

      const gaveta = (document.getElementById("gavetaUpload").value || "").trim();
      const motivo = (document.getElementById("motivoUpload").value || "").trim();
      const botao = document.getElementById("btnConfirmarUploadCentral");

      if (!arquivosCentralUpload.length) {
        mostrarMensagem("Selecione pelo menos um arquivo PDF.", "erro");
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

      const invalidos = arquivosCentralUpload.filter(arquivo =>
        arquivo.type !== "application/pdf" && !arquivo.name.toLowerCase().endsWith(".pdf")
      );

      if (invalidos.length) {
        mostrarMensagem("Remova os arquivos que nao sao PDF antes de enviar.", "erro");
        return;
      }

      const arquivosGrandes = arquivosCentralUpload.filter(arquivo => (arquivo.size || 0) > LIMITE_UPLOAD_SIMPLES_BYTES);
      if (arquivosGrandes.length) {
        const maiorArquivo = arquivosGrandes.reduce((maior, atual) => ((atual.size || 0) > (maior.size || 0) ? atual : maior), arquivosGrandes[0]);
        const continuar = confirm(
          `${arquivosGrandes.length} arquivo(s) acima de ${formatarTamanhoUpload(LIMITE_UPLOAD_SIMPLES_BYTES)} serao enviados em blocos.\n\n` +
          `Maior arquivo: ${maiorArquivo.name} (${formatarTamanhoUpload(maiorArquivo.size)}).\n\n` +
          "Se a internet oscilar, o envio pode falhar. Deseja continuar?"
        );
        if (!continuar) return;
      }

      try {
        uploadEmAndamento = true;
        uploadConcluidoComSucesso = false;
        uploadTeveErro = false;
        if (botao) botao.disabled = true;
        document.getElementById("btnFecharCentralUpload")?.classList.add("desativado");
        mostrarMensagem("Enviando PDF(s). Aguarde...");
        atualizarProgressoUpload(0, "Preparando envio", `Enviando 0 de ${arquivosCentralUpload.length} arquivos`, "");

        const ocupados = criarConjuntoNomesUploadOcupados();
        const resultados = [];
        const erros = [];
        const total = arquivosCentralUpload.length;

        for (let indice = 0; indice < arquivosCentralUpload.length; indice++) {
          const arquivo = arquivosCentralUpload[indice];
          atualizarStatusArquivoUpload(indice, "Enviando");
          const basePercentual = (indice / total) * 100;
          atualizarProgressoUpload(basePercentual, "Enviando arquivo", `Enviando ${indice + 1} de ${total} arquivos`, arquivo.name);

          try {
            const resultado = await enviarArquivoPdfComMetadados(arquivo, gaveta, motivo, ocupados, (etapa, progressoArquivo) => {
              const percentualArquivo = Number(progressoArquivo?.percentual);
              const percentualTotal = Number.isFinite(percentualArquivo)
                ? basePercentual + (percentualArquivo / 100) * (100 / total)
                : basePercentual;
              const detalheArquivo = progressoArquivo?.total
                ? `${formatarTamanhoUpload(progressoArquivo.enviados)} de ${formatarTamanhoUpload(progressoArquivo.total)}`
                : `Enviando ${indice + 1} de ${total} arquivos`;
              atualizarProgressoUpload(percentualTotal, etapa, detalheArquivo, arquivo.name);
            });
            resultados.push(resultado);
            atualizarStatusArquivoUpload(indice, resultado.nomeFoiAjustado ? "Conflito" : "Enviado");
          } catch (erroArquivo) {
            console.error(erroArquivo);
            erros.push({ arquivo: arquivo.name, erro: erroArquivo.message || String(erroArquivo) });
            atualizarStatusArquivoUpload(indice, erroArquivo.uploadParcial ? "Parcial" : "Erro");
          }

          atualizarProgressoUpload(((indice + 1) / total) * 100, "Enviando arquivo", `Enviando ${indice + 1} de ${total} arquivos`, arquivo.name);
        }

        atualizarProgressoUpload(100, "Atualizando lista", "Atualizando documentos e historico.", "");
        await new Promise(resolve => setTimeout(resolve, 1200));
        await listarDocumentos();
        if (typeof carregarDadosDeApoio === "function") {
          await carregarDadosDeApoio();
        }
        if (typeof atualizarCentralDuplicidades === "function") {
          await atualizarCentralDuplicidades();
        }

        const ajustados = resultados.filter(item => item.nomeFoiAjustado).length;
        const parciais = erros.filter(item => /Verifique o SharePoint antes de reenviar/i.test(item.erro || "")).length;
        uploadTeveErro = erros.length > 0;
        uploadConcluidoComSucesso = erros.length === 0;
        atualizarProgressoUpload(100, erros.length ? "Concluido com erro" : "Concluido", `${arquivosCentralUpload.length} arquivo(s) processado(s). ${resultados.length} enviado(s) com sucesso. ${erros.length} com erro.${parciais ? ` ${parciais} pode(m) ja existir no SharePoint.` : ""}`, "");
        const btnConcluir = document.getElementById("btnConcluirUploadCentral");
        if (btnConcluir) btnConcluir.style.display = erros.length ? "none" : "inline-block";

        const mensagemConflito = ajustados ? " Revise nomes parecidos na Central de Duplicidades." : "";

        mostrarMensagem(`${arquivosCentralUpload.length} arquivo(s) processado(s). ${resultados.length} enviado(s) com sucesso. ${erros.length} com erro.${parciais ? " Verifique o SharePoint antes de reenviar arquivo parcial." : ""}${mensagemConflito}`);
        if (!erros.length) {
          setTimeout(() => {
            if (uploadConcluidoComSucesso && !uploadEmAndamento) {
              descartarCentralUpload();
            }
          }, 900);
        }
      } catch (erro) {
        console.error(erro);
        uploadTeveErro = true;
        atualizarProgressoUpload(100, "Erro", "O envio foi interrompido. Confira a lista de arquivos.", "");
        mostrarMensagem("Nao foi possivel enviar os PDF(s). Tente novamente.", "erro");
      } finally {
        uploadEmAndamento = false;
        if (botao) botao.disabled = false;
        document.getElementById("btnFecharCentralUpload")?.classList.remove("desativado");
      }
    };

function renderizarDocumentos(listaArquivos) {
      const lista = document.getElementById("listaDocumentos");
      const contador = document.getElementById("contadorResultados");
      const movimentacoesRecentes = obterUltimasMovimentacoesPorArquivo(20);
      const termoBusca = normalizarTexto(document.getElementById("campoBusca").value);

      const totalFiltrado = listaArquivos.length;
      const listaExibida = modoListaAtual === "recentes" && !termoBusca
        ? ordenarPorModificacao(listaArquivos, preferenciasSistema.ordemRecentes).slice(0, preferenciasSistema.limiteRecentes)
        : modoListaAtual === "recentes"
          ? ordenarPorModificacao(listaArquivos, preferenciasSistema.ordemRecentes)
        : modoListaAtual === "na Lixeira"
          ? ordenarPorModificacao(listaArquivos, preferenciasSistema.ordemLixeira)
        : listaArquivos;

      contador.textContent = modoListaAtual === "recentes" && !termoBusca
        ? `${listaExibida.length} documento(s) recente(s) exibido(s)`
        : `${listaExibida.length} resultado(s) encontrado(s)`;

      if (!listaExibida.length) {
        lista.innerHTML = montarEstadoVazioDocumentos();
        return;
      }

      lista.innerHTML = "";

      listaExibida.forEach(item => {
        const indiceOriginal = documentosCarregados.findIndex(doc => doc.id === item.id);
        const chaveId = item.id ? `id:${item.id}` : "";
        const chaveNome = `nome:${normalizarTexto(item.nome || "")}`;
        const movimento = modoListaAtual !== "na Lixeira"
          ? movimentacoesRecentes.get(chaveId) || movimentacoesRecentes.get(chaveNome)
          : null;

        const li = document.createElement("li");
        li.innerHTML = `
          <button class="itemArquivo" onclick="selecionarDocumento(${indiceOriginal})">
            <strong>${escaparHtml(item.nome)}</strong>
            ${seloGavetaHtml(item.gaveta)}
            <span>Clique para ver detalhes, histórico e ações</span>
            ${movimento ? `<span class="linhaMovimentacaoArquivo">${escaparHtml(formatarAcaoHistorico(movimento.ACAO || "MOVIMENTOU"))} - ${formatarData(movimento.DATA_HORA)}</span>` : ""}
            ${item.modificado ? `<span class="linhaDataArquivo">Atualizado: ${escaparHtml(formatarData(item.modificado))}</span>` : ""}
          </button>
        `;
        lista.appendChild(li);
      });
    }

    function obterUltimasMovimentacoesPorArquivo(limite = 20) {
      const vistos = new Set();
      const mapa = new Map();

      historicoCarregado
        .filter(item => item && item.DATA_HORA && (item.ARQUIVO_ID || item.ARQUIVO))
        .sort((a, b) => new Date(b.DATA_HORA) - new Date(a.DATA_HORA))
        .forEach(item => {
          if (vistos.size >= limite) return;

          const chave = item.ARQUIVO_ID
            ? `id:${item.ARQUIVO_ID}`
            : `nome:${normalizarTexto(item.ARQUIVO || "")}`;

          if (!chave || vistos.has(chave)) return;

          vistos.add(chave);
          mapa.set(chave, item);

          if (item.ARQUIVO) {
            mapa.set(`nome:${normalizarTexto(item.ARQUIVO)}`, item);
          }
        });

      return mapa;
    }

    function obterIdsDuplicidadePendente() {
      try {
        return new Set(gerarParesDuplicidades().flatMap(par => [par.a.id, par.b.id]).filter(Boolean));
      } catch {
        return new Set();
      }
    }

    function documentoTemAnotacao(doc) {
      return anotacoesCarregadas.some(item => item.ARQUIVO_ID === doc.id && (item.ANOTACAO || "").trim());
    }

    function documentoEnviadoRecentemente(doc) {
      const limite = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return historicoCarregado.some(item =>
        item.ARQUIVO_ID === doc.id &&
        normalizarTexto(item.ACAO || "") === "enviou" &&
        (new Date(item.DATA_HORA).getTime() || 0) >= limite
      );
    }

    function documentoAlteradoRecentemente(doc) {
      const limite = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return (new Date(doc.modificado || 0).getTime() || 0) >= limite;
    }

    function aplicarFiltrosAvancados(lista) {
      let resultado = lista;

      if (modoListaAtual === "ativos" && filtroGavetaAtual) {
        resultado = resultado.filter(doc => chaveGaveta(doc.gaveta) === filtroGavetaAtual);
      }

      return resultado;
    }

    function filtrarDocumentos() {
      const termo = normalizarTexto(document.getElementById("campoBusca").value);

      if (modoListaAtual === "ativos" && !termo && !filtroGavetaAtual) {
        document.getElementById("contadorResultados").textContent = `${documentosAtivos.length} documento(s) ativo(s) disponivel(is)`;
        document.getElementById("listaDocumentos").innerHTML = "<li class=\"mensagemListaVazia\">Selecione uma gaveta para listar os documentos ou use a busca acima.</li>";
        atualizarBotoesFiltros();
        return;
      }

      const filtradosBusca = documentosCarregados.filter(doc =>
        !termo || normalizarTexto(doc.nome).includes(termo)
      );

      const filtrados = aplicarFiltrosAvancados(filtradosBusca);
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
        texto = `Não encontrei documentos com “${escaparHtml(termo)}”.`;
        dica = "Tente pesquisar por parte do nome, matrícula, ano ou palavra-chave.";
      } else if (modoListaAtual === "na Lixeira") {
        icone = "🗑️";
        titulo = "A lixeira está vazia.";
        texto = "Nenhum documento foi movido para a Lixeira até o momento.";
        dica = "Arquivos enviados para a Lixeira continuam recuperáveis.";
      } else if (modoListaAtual === "ativos" && nomeGaveta) {
        icone = "🗂️";
        titulo = "Esta gaveta ainda não possui documentos.";
        texto = `A gaveta “${escaparHtml(nomeGaveta)}” não tem documentos vinculados no momento.`;
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
            <div class="estadoVazioDocumentosIcone" aria-hidden="true">${icone}</div>
            <div>
              <p class="estadoVazioDocumentosTitulo">${titulo}</p>
              <p class="estadoVazioDocumentosTexto">${texto}</p>
              <span class="estadoVazioDocumentosDica">${dica}</span>
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
    async function listarDocumentos() {
      const lista = document.getElementById("listaDocumentos");
      lista.innerHTML = montarCarregamentoVisual("Buscando documentos", "Consultando o Arquivo Digital. Aguarde um instante.", "📂", "li");

      try {
        const token = await obterToken();

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

          return {
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
          };
        };

        documentosAtivos = arquivos
          .filter(item => String(item.fields.FileDirRef || "") === CONFIG.documentosAtivosRootPath)
          .map(mapear);

        documentosLixeira = arquivos
          .filter(item => String(item.fields.FileDirRef || "") === `${CONFIG.documentosAtivosRootPath}/_ARQUIVADOS`)
          .map(mapear);

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

      } catch (erro) {
        lista.innerHTML = "<li class=\"erro\">Nao foi possivel carregar os documentos. Tente novamente.</li>";
        console.error(erro);
      }
    }

    async function atualizarTela() {
      aplicarBlindagemVisualPreLogin();
      aplicarPreferenciasVisuais();
      atualizarControlesPreferencias();
      const contas = msalInstance.getAllAccounts();
      const usuario = contas[0];

      document.getElementById("status").textContent = usuario
        ? "Usuário conectado"
        : "Usuário não conectado";

      document.getElementById("btnEntrar").style.display = usuario ? "none" : "inline-block";
      document.getElementById("btnSair").style.display = usuario ? "inline-block" : "none";
      document.getElementById("btnAbrirConfiguracoesTopo").style.display = "none";
      document.getElementById("areaSistema").style.display = "none";

      if (usuario) {
        modoListaAtual = preferenciasSistema.guiaInicial || "recentes";
        document.getElementById("usuario").innerHTML = `
          <span>${usuario.name || "Usuário conectado"}</span>
          <small>${usuario.username || ""}</small>
        `;

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
          document.getElementById("status").textContent = "Usuário conectado";
          liberarBlindagemVisualPreLogin();
          document.getElementById("btnAbrirConfiguracoesTopo").style.display = "inline-block";
          document.getElementById("areaSistema").style.display = "block";

          await carregarOpcoesGavetaSharePoint(token);
          await listarDocumentos();
          agendarTarefaSegundoPlano(carregarDadosDeApoio, 120);
        } catch (erro) {
          console.error(erro);
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

    window.filtrarDocumentos = filtrarDocumentos;
    // Clique fora do painel lateral para fechar
    window.addEventListener("click", function (event) {
      const painel = document.getElementById("painelLateral");
      const painelCentral = document.getElementById("painelCentralDuplicidades");
      const painelDashboard = document.getElementById("painelDashboard");
      const caminhoClique = typeof event.composedPath === "function" ? event.composedPath() : [];

      if (
        painelCentral &&
        painelCentral.classList.contains("aberto") &&
        !painelCentral.contains(event.target) &&
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

    setInterval(() => {
      const campo = document.getElementById("campoAnotacao");
      const painelAberto = document.getElementById("painelLateral")?.classList.contains("aberto");

      if (campo && painelAberto) {
        ajustarAlturaAnotacao();
      }
    }, 800);
    await msalInstance.handleRedirectPromise();
    await atualizarTela();