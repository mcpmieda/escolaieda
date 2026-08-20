requestAnimationFrame(() => requestAnimationFrame(inicializarDashboardSecretaria));

function inicializarDashboardSecretaria() {
  const inicio = document.getElementById("view-inicio");
  if (!inicio || inicio.dataset.dashboardSecretaria === "1") return;
  inicio.dataset.dashboardSecretaria = "1";

  prepararHero(inicio);
  prepararResumo(inicio);
  prepararAcessos(inicio);
  prepararConexao(inicio);
  atualizarResumo();
}

function prepararHero(inicio) {
  const hero = inicio.querySelector(".heroPanel");
  if (!hero) return;

  hero.classList.add("dashboardHero");
  const eyebrow = hero.querySelector(".heroContent > .eyebrow");
  const descricao = hero.querySelector(".heroContent > p");
  const acoes = hero.querySelector(".heroActions");

  if (eyebrow) eyebrow.textContent = "Secretaria • visão geral";
  if (descricao) descricao.textContent = "Acompanhe o conteúdo do site e acesse as rotinas administrativas a partir de um único painel.";

  if (acoes) {
    const nova = criarBotao("+ Nova publicação", "buttonLight", () => abrirConteudo("publicacoes", true));
    const editar = criarBotao("Editar página", "buttonGlass", () => abrirConteudo("editor", false));
    acoes.replaceChildren(nova, editar);
  }
}

function prepararResumo(inicio) {
  const hero = inicio.querySelector(".heroPanel");
  if (!hero || document.getElementById("dashboardResumoSite")) return;

  const resumo = document.createElement("section");
  resumo.id = "dashboardResumoSite";
  resumo.className = "dashboardStats";
  resumo.setAttribute("aria-label", "Resumo do conteúdo do site");
  resumo.innerHTML = `
    <article class="dashboardStat">
      <span>Publicações</span>
      <strong id="dashTotalPublicacoes">—</strong>
      <small>Total cadastrado</small>
    </article>
    <article class="dashboardStat">
      <span>No ar</span>
      <strong id="dashPublicadas">—</strong>
      <small>Publicadas</small>
    </article>
    <article class="dashboardStat">
      <span>Em preparo</span>
      <strong id="dashRascunhos">—</strong>
      <small>Rascunhos</small>
    </article>
    <article class="dashboardStat dashboardStatWide">
      <span>Última atualização</span>
      <strong id="dashAtualizadoEm">—</strong>
      <small id="dashUltimaPublicacao">Conteúdo do site</small>
    </article>
  `;
  hero.insertAdjacentElement("afterend", resumo);
}

function prepararAcessos(inicio) {
  const cabecalho = inicio.querySelector(".sectionHeading");
  if (cabecalho) {
    const eyebrow = cabecalho.querySelector(".eyebrow");
    const titulo = cabecalho.querySelector("h2");
    if (eyebrow) eyebrow.textContent = "Rotinas da Secretaria";
    if (titulo) titulo.textContent = "Acesso rápido";
  }

  const grade = inicio.querySelector(".actionGrid");
  if (!grade) return;
  grade.classList.add("dashboardActionGrid");

  const cards = [...grade.children];
  personalizarCard(cards.find((card) => card.matches("[data-view-target='publicacoes']")), {
    tag: "Site",
    titulo: "Conteúdo do site",
    descricao: "Publicações e edição visual da página inicial.",
    acao: "Abrir conteúdo"
  });
  personalizarCard(cards.find((card) => card.matches("[data-open-livro-ponto]")), {
    tag: "Secretaria",
    titulo: "Livro de Ponto",
    descricao: "Folhas, funcionários, recessos, conferência e backup.",
    acao: "Abrir livro"
  });
  personalizarCard(cards.find((card) => card.getAttribute?.("href") === "../arquivo-digital/"), {
    tag: "Documentos",
    titulo: "Arquivo Digital",
    descricao: "Módulo protegido de documentos da Secretaria.",
    acao: "Abrir nova guia"
  });

  if (!grade.querySelector("[data-dashboard-notas]")) {
    const notas = document.createElement("button");
    notas.type = "button";
    notas.className = "actionCard dashboardActionCard";
    notas.setAttribute("data-dashboard-notas", "");
    notas.innerHTML = `
      <span class="cardIcon">▥</span>
      <span class="cardTag">Pedagógico</span>
      <h3>Gestão de Notas</h3>
      <p>Notas, desempenho por turma e boletins.</p>
      <span class="cardArrow">Abrir notas <b>→</b></span>
    `;
    notas.addEventListener("click", () => document.querySelector("[data-open-notas]")?.click());
    grade.appendChild(notas);
  }

  [...grade.children].forEach((card) => card.classList.add("dashboardActionCard"));
}

function prepararConexao(inicio) {
  const info = inicio.querySelector(".infoStrip");
  if (!info) return;
  info.classList.add("dashboardConnectionStrip");
  const titulo = info.querySelector("strong");
  const texto = info.querySelector("p");
  if (titulo) titulo.textContent = "Conexão do conteúdo";
  if (texto) texto.textContent = "O GitHub é usado somente para publicar conteúdos e salvar alterações da página inicial.";
}

function criarBotao(texto, classe, aoClicar) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = `button ${classe}`;
  botao.textContent = texto;
  botao.addEventListener("click", aoClicar);
  return botao;
}

function personalizarCard(card, dados) {
  if (!card) return;
  const tag = card.querySelector(".cardTag");
  const titulo = card.querySelector("h3");
  const descricao = card.querySelector("p");
  const acao = card.querySelector(".cardArrow");
  if (tag) tag.textContent = dados.tag;
  if (titulo) titulo.textContent = dados.titulo;
  if (descricao) descricao.textContent = dados.descricao;
  if (acao) acao.innerHTML = `${dados.acao} <b>→</b>`;
}

function abrirConteudo(modo, novaPublicacao) {
  document.querySelector('[data-view="publicacoes"]')?.click();
  requestAnimationFrame(() => {
    document.querySelector(`[data-content-mode="${modo}"]`)?.click();
    if (novaPublicacao) {
      document.getElementById("btnNovaPublicacao")?.click();
      document.getElementById("pubTitulo")?.focus();
    }
  });
}

async function atualizarResumo() {
  try {
    const resposta = await fetch(`../site-data/publicacoes-publicas.json?v=${Date.now()}`, { cache: "no-store" });
    if (!resposta.ok) throw new Error("Resumo indisponível");
    const dados = await resposta.json();
    const publicacoes = Array.isArray(dados?.publicacoes) ? dados.publicacoes : [];
    const publicadas = publicacoes.filter((item) => item?.publicado === true).length;
    const rascunhos = publicacoes.length - publicadas;
    const ultima = [...publicacoes]
      .sort((a, b) => String(b?.atualizadoEm || "").localeCompare(String(a?.atualizadoEm || "")))[0];

    definirTexto("dashTotalPublicacoes", publicacoes.length);
    definirTexto("dashPublicadas", publicadas);
    definirTexto("dashRascunhos", rascunhos);
    definirTexto("dashAtualizadoEm", formatarData(dados?.atualizadoEm || ultima?.atualizadoEm));
    definirTexto("dashUltimaPublicacao", ultima?.titulo ? `Última: ${ultima.titulo}` : "Nenhuma publicação cadastrada");
  } catch {
    definirTexto("dashTotalPublicacoes", "—");
    definirTexto("dashPublicadas", "—");
    definirTexto("dashRascunhos", "—");
    definirTexto("dashAtualizadoEm", "Indisponível");
    definirTexto("dashUltimaPublicacao", "Não foi possível carregar o resumo agora");
  }
}

function definirTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = String(valor);
}

function formatarData(valor) {
  if (!valor) return "Sem registro";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Sem registro";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(data);
}
