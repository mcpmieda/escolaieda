(function () {
  const estado = {
    carregado: false
  };

  function obterFonte() {
    const script = document.currentScript;
    return script?.dataset?.fonte || window.ESCOLA_IEDA_PUBLICACOES_URL || "";
  }

  function publicacaoVisivel(item, agora) {
    if (!item || item.publicado !== true) return false;
    const inicial = item.dataInicial ? new Date(item.dataInicial) : null;
    const final = item.dataFinal ? new Date(item.dataFinal) : null;
    if (inicial && inicial > agora) return false;
    if (final && final < agora) return false;
    return true;
  }

  function criarCard(item) {
    const card = document.createElement("article");
    card.className = "card publicacao-dinamica";

    const titulo = document.createElement("h3");
    titulo.textContent = item.titulo || item.categoria || "Publicação";
    card.appendChild(titulo);

    if (item.resumo) {
      const resumo = document.createElement("p");
      resumo.textContent = item.resumo;
      card.appendChild(resumo);
    }

    return card;
  }

  async function carregar() {
    if (estado.carregado) return;
    estado.carregado = true;

    const fonte = obterFonte();
    if (!fonte) return;

    try {
      const resposta = await fetch(fonte, { cache: "no-store" });
      if (!resposta.ok) return;
      const dados = await resposta.json();
      const publicacoes = Array.isArray(dados) ? dados : dados.publicacoes || [];
      const visiveis = publicacoes.filter((item) => publicacaoVisivel(item, new Date())).slice(0, 6);
      const alvo = document.querySelector("[data-publicacoes-site]");
      if (!alvo || !visiveis.length) return;
      alvo.replaceChildren(...visiveis.map(criarCard));
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
