(function () {
  const scriptAtual = document.currentScript;
  const estado = {
    carregado: false,
    focoAntesDoModal: null
  };

  function obterFonte() {
    return scriptAtual?.dataset?.fonte || window.ESCOLA_IEDA_PUBLICACOES_URL || "";
  }

  function fonteComCacheBusting(fonte) {
    try {
      const url = new URL(fonte, window.location.href);
      url.searchParams.set("v", String(Date.now()));
      return url.toString();
    } catch {
      const separador = fonte.includes("?") ? "&" : "?";
      return `${fonte}${separador}v=${Date.now()}`;
    }
  }

  function publicacaoVisivel(item, agora) {
    if (!item || item.publicado !== true) return false;
    const inicial = item.dataInicial ? new Date(`${String(item.dataInicial).slice(0, 10)}T00:00:00`) : null;
    const final = item.dataFinal ? new Date(`${String(item.dataFinal).slice(0, 10)}T23:59:59`) : null;
    if (inicial && inicial > agora) return false;
    if (final && final < agora) return false;
    return true;
  }

  function ordenarPublicacoes(a, b) {
    const ordemA = Number(a.ordem || 0);
    const ordemB = Number(b.ordem || 0);
    if (ordemA !== ordemB) return ordemA - ordemB;
    return String(b.atualizadoEm || "").localeCompare(String(a.atualizadoEm || ""));
  }

  function aplicarHome(home) {
    if (!home) return;
    texto("[data-home-titulo]", home.titulo);
    texto("[data-home-subtitulo]", home.subtitulo);
    texto("[data-home-missao]", home.missao);
    texto("[data-home-info-texto]", home.infoTexto);
    if (home.corDestaque) document.documentElement.style.setProperty("--azul", home.corDestaque);
    const secoes = normalizarSecoesHome(home);
    secoes.forEach(aplicarSecao);
    alternarLocal("banner", home.mostrarBanners);
  }

  function texto(seletor, valor) {
    const elemento = document.querySelector(seletor);
    if (elemento && valor) elemento.textContent = valor;
  }

  function alternarBloco(nome, visivel) {
    const bloco = document.querySelector(`[data-home-bloco="${nome}"]`);
    if (bloco) bloco.classList.toggle("hidden-by-cms", visivel === false);
  }

  function alternarLocal(nome, visivel) {
    const bloco = document.querySelector(`[data-publicacoes-local="${nome}"]`);
    if (bloco) bloco.classList.toggle("hidden-by-cms", visivel === false);
  }

  function normalizarSecoesHome(home) {
    const fallback = [
      { id: "sobre", titulo: "Nossa Escola", texto: "", visivel: home.mostrarSobre !== false, layout: "blocos" },
      { id: "numeros", titulo: "Educar é construir o futuro", texto: home.missao, visivel: home.mostrarNumeros !== false, layout: "blocos" },
      { id: "informacoes", titulo: "Informações", texto: home.infoTexto, visivel: home.mostrarInformacoes !== false, layout: "blocos" },
      { id: "avisos", titulo: "Avisos", texto: "Comunicados rápidos e orientações importantes para estudantes, famílias e comunidade escolar.", visivel: home.mostrarAvisos !== false, layout: "lista" },
      { id: "destaques", titulo: "Destaques", texto: "Conteúdos que precisam de maior visibilidade na página inicial.", visivel: true, layout: "blocos" },
      { id: "documentos", titulo: "Documentos", texto: "Links, documentos e materiais úteis para a rotina escolar.", visivel: true, layout: "lista" },
      { id: "contato", titulo: "Contato", texto: "", visivel: home.mostrarContato !== false, layout: "lista" }
    ];
    const secoes = Array.isArray(home.secoes) && home.secoes.length ? home.secoes : fallback;
    return secoes.map((secao) => ({
      id: normalizarClasse(secao.id),
      titulo: secao.titulo || "",
      texto: secao.texto || "",
      visivel: secao.visivel !== false,
      layout: secao.layout === "lista" ? "lista" : "blocos"
    })).filter((secao) => secao.id);
  }

  function aplicarSecao(secao) {
    const bloco = document.querySelector(`[data-home-section="${secao.id}"]`) || criarSecaoDinamica(secao);
    if (!bloco) return;
    bloco.classList.toggle("hidden-by-cms", secao.visivel === false);
    texto(`[data-section-title="${secao.id}"]`, secao.titulo);
    texto(`[data-section-text="${secao.id}"]`, secao.texto);
    const lista = bloco.querySelector(`[data-publicacoes-local="${secao.id}"]`);
    if (lista) {
      lista.dataset.layout = secao.layout;
      lista.classList.toggle("layout-lista", secao.layout === "lista");
      lista.classList.toggle("layout-blocos", secao.layout !== "lista");
    }
  }

  function criarSecaoDinamica(secao) {
    const main = document.querySelector("main");
    if (!main) return null;
    const bloco = document.createElement("section");
    bloco.className = "container reveal ativo secao-vazia";
    bloco.id = secao.id;
    bloco.dataset.homeSection = secao.id;
    bloco.dataset.publicacoesSection = "";
    bloco.innerHTML = `
      <div class="titulo-secao">
        <h2 data-section-title="${secao.id}"></h2>
        <p data-section-text="${secao.id}"></p>
      </div>
      <div class="publicacoes-grid" data-publicacoes-local="${secao.id}"></div>
    `;
    const contato = document.querySelector('[data-home-section="contato"]');
    main.insertBefore(bloco, contato || null);
    return bloco;
  }

  function criarCard(item) {
    const card = document.createElement("article");
    card.className = `card publicacao-dinamica estilo-${normalizarClasse(item.estilo || "padrao")}`;

    if (item.imagem) {
      const imagem = document.createElement("img");
      imagem.className = "public-media";
      imagem.src = item.imagem;
      imagem.alt = item.imagemAlt || item.titulo || "";
      card.appendChild(imagem);
    }

    const titulo = document.createElement("h3");
    titulo.textContent = item.titulo || item.categoria || "Publicação";
    card.appendChild(titulo);

    if (item.resumo) {
      const resumo = document.createElement("p");
      resumo.className = "public-resumo";
      resumo.textContent = item.resumo;
      card.appendChild(resumo);
    }

    if (item.conteudo) {
      const conteudo = document.createElement("p");
      conteudo.className = "public-conteudo";
      conteudo.textContent = item.conteudo;
      card.appendChild(conteudo);
    }

    if (item.link) {
      const link = document.createElement("a");
      link.className = "publicacao-botao";
      link.href = item.link;
      link.textContent = item.botao || "Abrir";
      card.appendChild(link);
    }

    return card;
  }

  function criarBanner(item) {
    const banner = document.createElement("div");
    banner.className = "public-banner";
    const titulo = document.createElement("strong");
    titulo.textContent = item.titulo || "Aviso";
    banner.appendChild(titulo);
    if (item.resumo) {
      const resumo = document.createElement("span");
      resumo.textContent = item.resumo;
      banner.appendChild(resumo);
    }
    if (item.conteudo) {
      const conteudo = document.createElement("p");
      conteudo.className = "public-conteudo";
      conteudo.textContent = item.conteudo;
      banner.appendChild(conteudo);
    }
    if (item.link) {
      const link = document.createElement("a");
      link.className = "publicacao-botao";
      link.href = item.link;
      link.textContent = item.botao || "Abrir";
      banner.appendChild(link);
    }
    return banner;
  }

  function criarModal(itens) {
    const modal = document.createElement("div");
    modal.className = "public-modal-content";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "public-modal-title");
    modal.tabIndex = -1;

    const cabecalho = document.createElement("div");
    cabecalho.className = "public-modal-header";
    const tituloModal = document.createElement("strong");
    tituloModal.id = "public-modal-title";
    tituloModal.textContent = "Aviso importante";
    cabecalho.appendChild(tituloModal);

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "public-modal-close";
    fechar.textContent = "Fechar";
    fechar.addEventListener("click", fecharModal);
    cabecalho.appendChild(fechar);
    modal.appendChild(cabecalho);

    const corpo = document.createElement("div");
    corpo.className = "public-modal-body";
    itens.forEach((item) => {
      corpo.appendChild(criarCard(item));
    });
    modal.appendChild(corpo);
    modal.addEventListener("keydown", manterFocoNoModal);

    return modal;
  }

  function renderizarLocal(local, itens) {
    const alvo = document.querySelector(`[data-publicacoes-local="${local}"]`);
    if (!alvo || !itens.length) return;
    if (local === "modal") {
      const chave = `escolaIedaModalVisto:${itens.map((item) => item.id).join(",")}`;
      if (sessionStorage.getItem(chave)) return;
      alvo.replaceChildren(criarModal(itens));
      alvo.removeAttribute("hidden");
      alvo.dataset.sessionKey = chave;
      estado.focoAntesDoModal = document.activeElement;
      document.body.classList.add("modal-open");
      alvo.addEventListener("click", fecharModalPeloFundo);
      document.addEventListener("keydown", fecharModalComEsc);
      requestAnimationFrame(() => alvo.querySelector(".public-modal-close")?.focus());
      return;
    }
    const criador = local === "banner" ? criarBanner : criarCard;
    alvo.replaceChildren(...itens.map(criador));
    const secao = alvo.closest("[data-publicacoes-section]");
    secao?.classList.remove("secao-vazia");
    secao?.removeAttribute("hidden");
  }

  function fecharModalComEsc(event) {
    if (event.key !== "Escape") return;
    fecharModal();
  }

  function fecharModalPeloFundo(event) {
    if (event.target === event.currentTarget) fecharModal();
  }

  function fecharModal() {
    const alvo = document.querySelector("[data-publicacoes-local='modal']");
    if (!alvo || alvo.hasAttribute("hidden")) return;
    alvo.setAttribute("hidden", "");
    if (alvo.dataset.sessionKey) sessionStorage.setItem(alvo.dataset.sessionKey, "1");
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", fecharModalComEsc);
    alvo.removeEventListener("click", fecharModalPeloFundo);
    if (estado.focoAntesDoModal instanceof HTMLElement) estado.focoAntesDoModal.focus();
    estado.focoAntesDoModal = null;
  }

  function manterFocoNoModal(event) {
    if (event.key !== "Tab") return;
    const foco = [...event.currentTarget.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
      .filter((elemento) => !elemento.disabled && elemento.offsetParent !== null);
    if (!foco.length) {
      event.preventDefault();
      event.currentTarget.focus();
      return;
    }
    const primeiro = foco[0];
    const ultimo = foco[foco.length - 1];
    if (event.shiftKey && document.activeElement === primeiro) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primeiro.focus();
    }
  }

  function normalizarClasse(valor) {
    return String(valor || "padrao").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  }

  async function carregar() {
    if (estado.carregado) return;
    estado.carregado = true;

    const fonte = obterFonte();
    if (!fonte) return;

    try {
      const resposta = await fetch(fonteComCacheBusting(fonte), { cache: "no-store" });
      if (!resposta.ok) return;
      const dados = await resposta.json();
      aplicarHome(dados.home);

      const publicacoes = Array.isArray(dados) ? dados : dados.publicacoes || [];
      const visiveis = publicacoes.filter((item) => publicacaoVisivel(item, new Date())).sort(ordenarPublicacoes);
      const grupos = visiveis.reduce((mapa, item) => {
        const local = item.local || (item.destaque ? "destaques" : "informacoes");
        mapa[local] = mapa[local] || [];
        mapa[local].push(item);
        return mapa;
      }, {});

      renderizarLocal("banner", grupos.banner || []);
      Object.keys(grupos).forEach((local) => {
        if (local !== "banner" && local !== "modal") renderizarLocal(local, grupos[local].slice(0, 12));
      });
      renderizarLocal("modal", (grupos.modal || []).slice(0, 1));
    } catch (erro) {
      console.warn("Publicações dinâmicas indisponíveis.", erro);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", carregar);
  } else {
    carregar();
  }
})();
