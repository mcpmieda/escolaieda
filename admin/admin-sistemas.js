const sistemasStyleHref = new URL("./admin-sistemas.css", import.meta.url).href;
if (!document.querySelector('link[data-admin-sistemas="1"]')) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = sistemasStyleHref;
  link.dataset.adminSistemas = "1";
  document.head.appendChild(link);
}

requestAnimationFrame(() => requestAnimationFrame(inicializarCentralDeSistemas));

const PORTAIS = [
  {
    sigla: "SM",
    nome: "SMECEL",
    descricao: "Gestão escolar municipal",
    href: "https://www.smecel.com.br/",
    grupo: "Gestão escolar"
  },
  {
    sigla: "M365",
    nome: "Microsoft 365 Admin",
    descricao: "Usuários, licenças e serviços",
    href: "https://admin.microsoft.com/",
    grupo: "Administração"
  },
  {
    sigla: "ID",
    nome: "Microsoft Entra",
    descricao: "Identidades, grupos e aplicativos",
    href: "https://entra.microsoft.com/",
    grupo: "Administração"
  },
  {
    sigla: "T",
    nome: "Microsoft Teams",
    descricao: "Equipes, reuniões e comunicação",
    href: "https://teams.microsoft.com/",
    grupo: "Comunicação"
  },
  {
    sigla: "F",
    nome: "Microsoft Forms",
    descricao: "Formulários e respostas",
    href: "https://forms.office.com/",
    grupo: "Produtividade"
  },
  {
    sigla: "WA",
    nome: "WhatsApp Web",
    descricao: "Atendimento e comunicação rápida",
    href: "https://web.whatsapp.com/",
    grupo: "Comunicação"
  }
];

function inicializarCentralDeSistemas() {
  const view = document.getElementById("view-sistemas");
  if (!view || view.dataset.centralSistemas === "1") return;
  view.dataset.centralSistemas = "1";

  ajustarCabecalho(view);
  organizarSistemasInternos(view);
  inserirPortaisExternos(view);
}

function ajustarCabecalho(view) {
  const lead = view.querySelector(".pageLead");
  const titulo = lead?.querySelector("h2");
  const descricao = lead?.querySelector("p");
  if (titulo) titulo.textContent = "Central de Sistemas";
  if (descricao) descricao.textContent = "Sistemas da escola e portais externos usados nas rotinas administrativas.";
}

function organizarSistemasInternos(view) {
  const grid = view.querySelector(".systemGrid");
  if (!grid || grid.previousElementSibling?.classList.contains("systemsSectionHeading")) return;

  const heading = document.createElement("div");
  heading.className = "systemsSectionHeading";
  heading.innerHTML = `
    <div>
      <span class="eyebrow">Ambiente da escola</span>
      <h3>Sistemas internos</h3>
    </div>
    <small>Recursos integrados ou mantidos pela escola</small>
  `;
  grid.insertAdjacentElement("beforebegin", heading);
  grid.classList.add("internalSystemsGrid");
}

function inserirPortaisExternos(view) {
  if (document.getElementById("portaisOperacionais")) return;

  const settings = view.querySelector(".settingsPanel");
  const section = document.createElement("section");
  section.id = "portaisOperacionais";
  section.className = "externalPortalsSection";
  section.innerHTML = `
    <div class="systemsSectionHeading">
      <div>
        <span class="eyebrow">Acessos oficiais</span>
        <h3>Portais externos</h3>
      </div>
      <small>Abrem em nova guia e não compartilham senhas com este painel</small>
    </div>
    <div class="portalGrid" aria-label="Portais externos da Secretaria"></div>
  `;

  const grid = section.querySelector(".portalGrid");
  PORTAIS.forEach((portal) => grid.appendChild(criarPortalCard(portal)));

  if (settings) settings.insertAdjacentElement("beforebegin", section);
  else view.appendChild(section);
}

function criarPortalCard(portal) {
  const link = document.createElement("a");
  link.className = "portalCard";
  link.href = portal.href;
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", `${portal.nome} — abrir em nova guia`);
  link.innerHTML = `
    <span class="portalBadge" aria-hidden="true">${portal.sigla}</span>
    <span class="portalCopy">
      <small>${portal.grupo}</small>
      <strong>${portal.nome}</strong>
      <span>${portal.descricao}</span>
    </span>
    <span class="portalArrow" aria-hidden="true">↗</span>
  `;
  return link;
}
