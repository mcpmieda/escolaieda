import { INTEGRATION_CONFIG } from "../js/config.js";
import { InstitutionalAuth } from "../js/auth.js";
import { GraphClient } from "../js/graph-client.js";
import { NotesSyncClient, SerialEventQueue } from "../js/sync-client.js";
import { editableFields, fieldLimits, normalizeGrade, calculateDerived, nextSequence, gradeKey, valueLabel } from "../js/domain.js";

const elements = {
  authView: document.getElementById("authView"), modelView: document.getElementById("modelView"),
  loginButton: document.getElementById("loginButton"), logoutButton: document.getElementById("logoutButton"),
  connectionStatus: document.getElementById("connectionStatus"), classFilter: document.getElementById("classFilter"),
  componentFilter: document.getElementById("componentFilter"), modelBody: document.getElementById("modelBody"),
  modelCount: document.getElementById("modelCount"), liveRegion: document.getElementById("liveRegion")
};

const auth = new InstitutionalAuth();
const graph = new GraphClient(auth);
const sync = new NotesSyncClient(graph);
const queue = new SerialEventQueue(sync);
const sourceSession = crypto.randomUUID();
const timers = new WeakMap();
const rowStates = new Map();
let records = [];

function setConnection(title, detail, state = "working") {
  elements.connectionStatus.dataset.state = state;
  elements.connectionStatus.querySelector("strong").textContent = title;
  elements.connectionStatus.querySelector("span").textContent = detail;
}

function announce(message) { elements.liveRegion.textContent = message; }

function option(select, value) {
  const node = document.createElement("option");
  node.value = value;
  node.textContent = value;
  select.append(node);
}

function populateFilters() {
  const classes = [...new Set(records.map((record) => String(record.TurmaCodigo)))].sort();
  elements.classFilter.replaceChildren();
  classes.forEach((value) => option(elements.classFilter, value));
  refreshComponents();
}

function refreshComponents() {
  const selectedClass = elements.classFilter.value;
  const previous = elements.componentFilter.value;
  const components = [...new Set(records.filter((record) => String(record.TurmaCodigo) === selectedClass).map((record) => String(record.ComponenteCodigo)))].sort();
  elements.componentFilter.replaceChildren();
  components.forEach((value) => option(elements.componentFilter, value));
  if (components.includes(previous)) elements.componentFilter.value = previous;
  renderModel();
}

function setRowState(key, text, className = "") {
  rowStates.set(key, { text, className });
  const cell = elements.modelBody.querySelector(`[data-row-state="${CSS.escape(key)}"]`);
  if (cell) { cell.textContent = text; cell.className = `row-state ${className}`.trim(); }
}

function createGradeInput(record, field, stateCell) {
  const input = document.createElement("input");
  input.className = "grade-input";
  input.type = "text";
  input.inputMode = "decimal";
  input.autocomplete = "off";
  input.value = record[field] == null ? "" : String(record[field]).replace(".", ",");
  input.setAttribute("aria-label", `${field} de ${record.AlunoNome}`);
  input.dataset.field = field;
  input.addEventListener("input", () => {
    window.clearTimeout(timers.get(input));
    input.classList.remove("invalid");
    const timer = window.setTimeout(() => processEdit(input, record, field, stateCell), INTEGRATION_CONFIG.editDebounceMs);
    timers.set(input, timer);
  });
  return input;
}

function updateDerivedCells(row, derived) {
  for (const [field, value] of Object.entries(derived)) {
    const cell = row.querySelector(`[data-derived="${field}"]`);
    if (cell) cell.textContent = valueLabel(value);
  }
}

function buildEvent(record, { eventType, field, valueBefore, valueAfter, sequence, correlationId, derivedValues }) {
  const eventId = crypto.randomUUID();
  return {
    schemaVersion: 1,
    eventId,
    idempotencyKey: `web:${sourceSession}:${sequence}:${field}:${eventType}`,
    correlationId,
    eventType,
    gradeKey: gradeKey(record),
    source: { kind: "web-model", workbookId: `web-nina-${sourceSession}`, worksheetId: "TB_LANCAMENTOS", cellAddress: `TB_LANCAMENTOS[${field}]` },
    field,
    valueBefore,
    valueAfter,
    derivedValues,
    sequence,
    sourceRevision: sourceSession,
    clientSentAt: new Date().toISOString()
  };
}

function processEdit(input, record, field, stateCell) {
  const before = record[field] == null ? null : Number(record[field]);
  let after;
  try {
    after = normalizeGrade(input.value, field);
  } catch (error) {
    input.classList.add("invalid");
    stateCell.textContent = error.message;
    stateCell.className = "row-state error";
    announce(error.message);
    return;
  }
  if (Object.is(before, after)) return;
  record[field] = after;
  const derived = calculateDerived(record);
  Object.assign(record, derived);
  updateDerivedCells(input.closest("tr"), derived);

  const correlationId = crypto.randomUUID();
  const changedSequence = nextSequence(record.Sequencia);
  const recalculatedSequence = changedSequence + 1;
  setRowState(gradeKey(record), "Na fila", "sending");
  queue.enqueue(buildEvent(record, { eventType: "grade.changed", field, valueBefore: before, valueAfter: after, sequence: changedSequence, correlationId }));
  queue.enqueue(buildEvent(record, { eventType: "grade.recalculated", field, valueBefore: before, valueAfter: after, sequence: recalculatedSequence, correlationId, derivedValues: derived }));
}

function renderModel() {
  const selectedClass = elements.classFilter.value;
  const selectedComponent = elements.componentFilter.value;
  const visible = records.filter((record) => String(record.TurmaCodigo) === selectedClass && String(record.ComponenteCodigo) === selectedComponent)
    .sort((a, b) => Number(a.LinhaOrigem) - Number(b.LinhaOrigem));
  const fragment = document.createDocumentFragment();
  for (const record of visible) {
    const row = document.createElement("tr");
    const name = document.createElement("td");
    name.className = "name";
    name.textContent = String(record.AlunoNome);
    row.append(name);
    const stateCell = document.createElement("td");
    stateCell.dataset.rowState = gradeKey(record);
    const currentState = rowStates.get(gradeKey(record)) || { text: "Pronto", className: "" };
    stateCell.className = `row-state ${currentState.className}`.trim();
    stateCell.textContent = currentState.text;
    for (const field of editableFields.slice(0, 3)) {
      const cell = document.createElement("td"); cell.append(createGradeInput(record, field, stateCell)); row.append(cell);
    }
    const total = document.createElement("td"); total.className = "derived"; total.dataset.derived = "Total"; total.textContent = valueLabel(record.Total); row.append(total);
    for (const field of editableFields.slice(3)) {
      const cell = document.createElement("td"); cell.append(createGradeInput(record, field, stateCell)); row.append(cell);
    }
    for (const field of ["TotalRec", "NotaFinal"]) {
      const cell = document.createElement("td"); cell.className = "derived"; cell.dataset.derived = field; cell.textContent = valueLabel(record[field]); row.append(cell);
    }
    row.append(stateCell);
    fragment.append(row);
  }
  elements.modelBody.replaceChildren(fragment);
  elements.modelCount.textContent = `${visible.length} lançamento(s) · ${selectedClass} · ${selectedComponent}`;
}

queue.addEventListener("sent", (event) => {
  const { event: sent, receipt, pending } = event.detail;
  const key = sent.gradeKey;
  const label = receipt.status === "duplicate" ? "Duplicata segura" : sent.eventType === "grade.changed" ? "Chegou" : "Recalculado";
  setRowState(key, pending ? `${label} · ${pending} fila` : label, "sent");
  setConnection("Sincronização ativa", `${pending} evento(s) aguardando envio.`, "ok");
  announce(`${sent.eventType} confirmado.`);
});
queue.addEventListener("error", (event) => {
  setRowState(event.detail.event.gradeKey, "Falha · tentar novamente", "error");
  setConnection("Sincronização interrompida", "A fila foi preservada nesta sessão. Verifique a rede e tente novamente.", "error");
});
window.addEventListener("online", () => queue.retry());
elements.classFilter.addEventListener("change", refreshComponents);
elements.componentFilter.addEventListener("change", renderModel);
elements.loginButton.addEventListener("click", async () => {
  try {
    await auth.login({ popup: true });
    await start();
  } catch (error) {
    setConnection("Acesso não concluído", error.message || "Não foi possível concluir o login.", "error");
  }
});
elements.logoutButton.addEventListener("click", () => auth.logout());

async function start() {
  try {
    const account = await auth.initialize();
    if (!account) { setConnection("Aguardando login", "Nenhum dado foi carregado.", "working"); return; }
    await sync.initialize();
    records = await sync.loadModel();
    populateFilters();
    elements.authView.classList.add("hidden");
    elements.modelView.classList.remove("hidden");
    elements.modelView.setAttribute("aria-busy", "false");
    elements.logoutButton.classList.remove("hidden");
    setConnection("Conectado", `${records.length} linhas protegidas carregadas.`, "ok");
  } catch (error) {
    setConnection("Acesso não concluído", error.message || "Não foi possível abrir a POC.", "error");
    elements.authView.classList.remove("hidden");
  }
}

void start();
