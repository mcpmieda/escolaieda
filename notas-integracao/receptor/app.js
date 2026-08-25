import { INTEGRATION_CONFIG } from "../js/config.js";
import { InstitutionalAuth } from "../js/auth.js";
import { GraphClient } from "../js/graph-client.js";
import { NotesSyncClient } from "../js/sync-client.js";
import { valueLabel } from "../js/domain.js";

const elements = {
  authView: document.getElementById("authView"), receiverView: document.getElementById("receiverView"),
  loginButton: document.getElementById("loginButton"), logoutButton: document.getElementById("logoutButton"),
  pauseButton: document.getElementById("pauseButton"), connectionStatus: document.getElementById("connectionStatus"),
  eventCount: document.getElementById("eventCount"), medianLatency: document.getElementById("medianLatency"),
  p95Latency: document.getElementById("p95Latency"), targetRate: document.getElementById("targetRate"),
  eventList: document.getElementById("eventList"), lastPoll: document.getElementById("lastPoll"),
  liveRegion: document.getElementById("liveRegion")
};

const auth = new InstitutionalAuth();
const graph = new GraphClient(auth);
const sync = new NotesSyncClient(graph);
const observedAt = new Map();
const baselineIds = new Set();
let events = [];
let timer = 0;
let paused = false;

function setConnection(title, detail, state = "working") {
  elements.connectionStatus.dataset.state = state;
  elements.connectionStatus.querySelector("strong").textContent = title;
  elements.connectionStatus.querySelector("span").textContent = detail;
}

function percentile(values, ratio) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
}

function latencyFor(event) {
  if (baselineIds.has(event.EventId)) return null;
  const sent = new Date(event.ClientSentAt).getTime();
  const observed = observedAt.get(event.EventId) || Date.now();
  return Number.isFinite(sent) ? Math.max(0, observed - sent) : null;
}

function updateMetrics() {
  const latencies = events.map(latencyFor).filter(Number.isFinite);
  const median = percentile(latencies, 0.5);
  const p95 = percentile(latencies, 0.95);
  const inTarget = latencies.filter((value) => value <= INTEGRATION_CONFIG.arrivalTargetMs).length;
  elements.eventCount.textContent = String(events.length);
  elements.medianLatency.textContent = median == null ? "—" : `${median} ms`;
  elements.p95Latency.textContent = p95 == null ? "—" : `${p95} ms`;
  elements.targetRate.textContent = latencies.length ? `${Math.round((inTarget / latencies.length) * 100)}%` : "—";
}

function textBlock(className, title, detail) {
  const wrapper = document.createElement("div");
  wrapper.className = className;
  const strong = document.createElement("strong"); strong.textContent = title;
  const span = document.createElement("span"); span.textContent = detail;
  wrapper.append(strong, span);
  return wrapper;
}

function renderEvents() {
  if (!events.length) {
    const empty = document.createElement("p"); empty.className = "empty"; empty.textContent = "Nenhum evento da prova foi recebido ainda.";
    elements.eventList.replaceChildren(empty);
    updateMetrics();
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const event of events) {
    const snapshot = sync.modelByKey.get(String(event.GradeKey));
    const row = document.createElement("article");
    row.className = "event";
    row.dataset.type = String(event.EventType || "");
    row.dataset.status = String(event.Status || "");
    const dot = document.createElement("span"); dot.className = "event-dot"; dot.setAttribute("aria-hidden", "true");
    const identity = snapshot?.AlunoNome ? String(snapshot.AlunoNome) : "Lançamento protegido";
    const context = snapshot ? `${snapshot.TurmaCodigo} · ${snapshot.ComponenteCodigo}` : String(event.GradeKey || "");
    const main = textBlock("event-main", identity, context);
    const phase = textBlock("event-detail", String(event.EventType || "evento"), `${event.FieldName}: ${valueLabel(event.ValueAfter)}`);
    const status = textBlock("event-detail", String(event.Status || "received"), new Date(event.createdDateTime).toLocaleTimeString("pt-BR"));
    const latency = document.createElement("div"); latency.className = "latency";
    const latencyValue = latencyFor(event);
    const strong = document.createElement("strong"); strong.textContent = latencyValue == null ? "—" : `${latencyValue} ms`;
    const span = document.createElement("span"); span.textContent = "envio → tela";
    latency.append(strong, span);
    row.append(dot, main, phase, status, latency);
    fragment.append(row);
  }
  elements.eventList.replaceChildren(fragment);
  updateMetrics();
}

async function poll() {
  if (paused || document.hidden) return;
  try {
    const next = await sync.loadRecentEvents(100);
    const existingIds = new Set(events.map((event) => event.EventId));
    const now = Date.now();
    if (!events.length && !observedAt.size) {
      for (const event of next) baselineIds.add(event.EventId);
    }
    for (const event of next) if (!observedAt.has(event.EventId)) observedAt.set(event.EventId, now);
    const newCount = next.filter((event) => !existingIds.has(event.EventId)).length;
    events = next;
    renderEvents();
    elements.lastPoll.textContent = `Atualizado às ${new Date().toLocaleTimeString("pt-BR")}`;
    setConnection("Recepção ativa", "Consulta incremental a cada 1 segundo.", "ok");
    if (newCount) elements.liveRegion.textContent = `${newCount} novo(s) evento(s) recebido(s).`;
  } catch (error) {
    setConnection("Recepção interrompida", error.message || "Falha ao consultar eventos.", "error");
  }
}

function schedule() {
  window.clearInterval(timer);
  timer = window.setInterval(poll, INTEGRATION_CONFIG.pollingMs);
}

elements.loginButton.addEventListener("click", async () => {
  try {
    await auth.login({ popup: true });
    await start();
  } catch (error) {
    setConnection("Acesso não concluído", error.message || "Não foi possível concluir o login.", "error");
  }
});
elements.logoutButton.addEventListener("click", () => auth.logout());
elements.pauseButton.addEventListener("click", () => {
  paused = !paused;
  elements.pauseButton.textContent = paused ? "Retomar" : "Pausar";
  setConnection(paused ? "Recepção pausada" : "Recepção ativa", paused ? "Nenhuma nova consulta será feita." : "Consulta incremental a cada 1 segundo.", paused ? "working" : "ok");
  if (!paused) void poll();
});
document.addEventListener("visibilitychange", () => { if (!document.hidden && !paused) void poll(); });

async function start() {
  try {
    const account = await auth.initialize();
    if (!account) { setConnection("Aguardando login", "Nenhum dado foi carregado.", "working"); return; }
    await sync.initialize();
    await sync.loadModel();
    elements.authView.classList.add("hidden");
    elements.receiverView.classList.remove("hidden");
    elements.receiverView.setAttribute("aria-busy", "false");
    elements.logoutButton.classList.remove("hidden");
    elements.pauseButton.classList.remove("hidden");
    await poll();
    schedule();
  } catch (error) {
    setConnection("Acesso não concluído", error.message || "Não foi possível abrir o receptor.", "error");
  }
}

void start();
