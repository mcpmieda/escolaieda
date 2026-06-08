(function () {
  const scriptAtual = document.currentScript;
  const estado = {
    carregado: false
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
    if (Boolean(a.fixado) !== Boolean(b.fixado)) return a.fixado ? -1 : 1;
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
    alternarBloco("sobre", home.mostrarSobre);
    alternarBloco("numeros", home.mostrarNumeros);
    alternarBloco("informacoes", home.mostrarInformacoes);
    alternarBloco("contato", home.mostrarContato);
    alternarLocal("banner", home.mostrarBanners);
    alternarLocal("avisos", home.mostrarAvisos);
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
      resumo.textContent = item.resumo;
      card.appendChild(resumo);
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
    if (item.link) {
      const link = document.createElement("a");
      link.className = "publicacao-botao";
      link.href = item.link;
      link.textContent = item.botao || "Abrir";
      banner.appendChild(link);
    }
    return banner;
  }

  function renderizarLocal(local, itens) {
    const alvo = document.querySelector(`[data-publicacoes-local="${local}"]`);
    if (!alvo || !itens.length) return;
    const criador = local === "banner" ? criarBanner : criarCard;
    alvo.replaceChildren(...itens.map(criador));
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
      renderizarLocal("informacoes", (grupos.informacoes || []).slice(0, 6));
      renderizarLocal("avisos", (grupos.avisos || []).slice(0, 3));
      renderizarLocal("destaques", (grupos.destaques || []).slice(0, 3));
      renderizarLocal("documentos", (grupos.documentos || []).slice(0, 3));
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
