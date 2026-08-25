import { InstitutionalAuth } from "../js/auth.js";

const auth = new InstitutionalAuth();
const elements = {
  authView: document.getElementById("authView"), centralView: document.getElementById("centralView"),
  login: document.getElementById("loginButton"), logout: document.getElementById("logoutButton"),
  status: document.getElementById("centralStatus"), rows: document.getElementById("modelRows"),
  search: document.getElementById("modelSearch"), empty: document.getElementById("emptyModels"), live: document.getElementById("liveRegion")
};

const models = [
  { teacher: "Modelo de homologação A", scope: "Geografia · turmas detectadas", stage: "Validado", sync: "Desativada" },
  { teacher: "Modelo de homologação B", scope: "Componentes e turmas detectados", stage: "Validado", sync: "Desativada" }
];
const configuration = [
  ["Experiência visual", "Legado preservado"], ["Cálculo oficial", "Servidor"], ["Relação de alunos", "Assistente manual"],
  ["Compartilhamento", "Usuário Entra específico"], ["Ambiente", "Homologação"], ["Sincronização inicial", "Desativada"]
];

function setStatus(title, detail, state) {
  elements.status.dataset.state = state;
  elements.status.querySelector("strong").textContent = title;
  elements.status.querySelector("span").textContent = detail;
}

function renderModels(filter = "") {
  const term = filter.trim().toLocaleLowerCase("pt-BR");
  const visible = models.filter((model) => `${model.teacher} ${model.scope}`.toLocaleLowerCase("pt-BR").includes(term));
  elements.rows.replaceChildren(...visible.map((model) => {
    const row = document.createElement("tr");
    for (const value of [model.teacher, model.scope]) { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); }
    const stage = document.createElement("td"); const stageBadge = document.createElement("span"); stageBadge.className = "state-badge ok"; stageBadge.textContent = model.stage; stage.append(stageBadge); row.append(stage);
    const sync = document.createElement("td"); const syncBadge = document.createElement("span"); syncBadge.className = "state-badge warning"; syncBadge.textContent = model.sync; sync.append(syncBadge); row.append(sync);
    const action = document.createElement("td"); const button = document.createElement("button"); button.className = "button secondary small-button"; button.type = "button"; button.textContent = "Inspecionar"; button.addEventListener("click", () => { elements.live.textContent = `${model.teacher} selecionado para revisão.`; }); action.append(button); row.append(action);
    return row;
  }));
  elements.empty.classList.toggle("hidden", visible.length > 0);
}

function renderConfiguration() {
  const list = document.getElementById("configList");
  for (const [term, value] of configuration) { const dt = document.createElement("dt"); dt.textContent = term; const dd = document.createElement("dd"); dd.textContent = value; list.append(dt, dd); }
}

async function showCentral() {
  elements.authView.classList.add("hidden"); elements.centralView.classList.remove("hidden"); elements.logout.classList.remove("hidden");
  setStatus("Acesso confirmado", "Exemplos anonimizados de homologação.", "ok");
}

elements.login.addEventListener("click", async () => { try { await auth.login({ popup: true }); await showCentral(); } catch (error) { setStatus("Acesso não concluído", error.message || "Tente novamente.", "error"); } });
elements.logout.addEventListener("click", async () => { await auth.logout(); });
elements.search.addEventListener("input", () => renderModels(elements.search.value));
document.getElementById("newImportButton").addEventListener("click", () => { elements.live.textContent = "O novo job será criado pela futura operação POST /v1/import-jobs; nenhuma alteração foi executada nesta demonstração."; });
document.getElementById("reviewButton").addEventListener("click", () => { elements.live.textContent = "Revisão obrigatória: confirmar conta Entra, escopo de turmas, ambiente e sincronização antes do compartilhamento."; });

renderModels(); renderConfiguration();
try { await auth.initialize(); if (auth.account) await showCentral(); else setStatus("Aguardando autenticação", "Nenhum dado real foi carregado.", "working"); } catch { setStatus("Aguardando autenticação", "Entre com sua conta institucional.", "working"); }
