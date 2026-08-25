import { INTEGRATION_CONFIG } from "../js/config.js";
import { InstitutionalAuth } from "../js/auth.js";
import { GraphClient } from "../js/graph-client.js";
import { NotesSyncClient, SerialEventQueue } from "../js/sync-client.js";
import { editableFields, calculateDerived, nextSequence, gradeKey } from "../js/domain.js";
import { buildMappingIndex, mappedEntriesForChange, mappingRecord } from "./workbook-adapter.js";

const elements = {
  status: document.getElementById("addinStatus"), connect: document.getElementById("connectButton"),
  retry: document.getElementById("retryButton"), disconnect: document.getElementById("disconnectButton")
};
const auth = new InstitutionalAuth();
const graph = new GraphClient(auth);
const sync = new NotesSyncClient(graph);
const queue = new SerialEventQueue(sync);
const workbookSession = crypto.randomUUID();
let changeHandlers = [];
let connected = false;
let workbookMode = "normalized";
let mappingIndex = new Map();
const localValues = new Map();
const localSequences = new Map();

function status(message) { elements.status.textContent = message; }

function buildEvent(record, { eventType, field, before, after, sequence, correlationId, derivedValues, address, worksheet = "LANCAMENTOS" }) {
  return {
    schemaVersion: 1,
    eventId: crypto.randomUUID(),
    idempotencyKey: `excel:${workbookSession}:${sequence}:${field}:${eventType}`,
    correlationId,
    eventType,
    gradeKey: record.GradeKey || gradeKey(record),
    source: { kind: "excel-addin", workbookId: `teacher-model-${workbookSession}`, worksheetId: worksheet, cellAddress: address },
    field,
    valueBefore: before,
    valueAfter: after,
    derivedValues,
    sequence,
    sourceRevision: workbookSession,
    clientSentAt: new Date().toISOString()
  };
}

async function loadVisualMapping() {
  return Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem("MAPEAMENTO");
    const table = sheet.tables.getItem("TB_MAPEAMENTO_CELULAS");
    const headers = table.getHeaderRowRange();
    const body = table.getDataBodyRange();
    headers.load("values"); body.load("values");
    await context.sync();
    const names = headers.values[0];
    return body.values.map((values) => Object.fromEntries(names.map((name, index) => [name, values[index]])));
  });
}

async function readMappedValue(worksheet, address) {
  return Excel.run(async (context) => {
    const range = context.workbook.worksheets.getItem(worksheet).getRange(address);
    range.load("values");
    await context.sync();
    return range.values[0][0];
  });
}

async function handleMappedChange(worksheet, event) {
  if (!connected || event.changeType === "Unknown") return;
  const entries = mappedEntriesForChange(mappingIndex, worksheet, event.address);
  for (const entry of entries) {
    const value = await readMappedValue(worksheet, entry.Address);
    const after = value === "" || value == null ? null : Number(value);
    if (after != null && !Number.isFinite(after)) continue;
    const localKey = `${worksheet}!${entry.Address}`;
    const before = localValues.has(localKey) ? localValues.get(localKey) : null;
    localValues.set(localKey, after);
    const sequence = nextSequence(localSequences.get(localKey) || 0);
    localSequences.set(localKey, sequence);
    queue.enqueue(buildEvent(mappingRecord(entry), {
      eventType: "grade.changed", field: entry.Field, before, after, sequence,
      correlationId: crypto.randomUUID(), address: entry.Address, worksheet
    }));
  }
}

async function readChangedCells(address) {
  return Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem("LANCAMENTOS");
    const table = sheet.tables.getItem(INTEGRATION_CONFIG.modelTable);
    const body = table.getDataBodyRange();
    const headers = table.getHeaderRowRange();
    const localAddress = String(address).includes("!") ? String(address).split("!").pop() : String(address);
    const changed = sheet.getRange(localAddress);
    body.load(["rowIndex", "columnIndex", "rowCount", "columnCount", "values"]);
    headers.load("values");
    changed.load(["rowIndex", "columnIndex", "rowCount", "columnCount", "values"]);
    await context.sync();
    const rows = [];
    const headerValues = headers.values[0];
    const maxCells = Math.min(changed.rowCount * changed.columnCount, 20);
    let seen = 0;
    for (let rowOffset = 0; rowOffset < changed.rowCount && seen < maxCells; rowOffset += 1) {
      const bodyRow = changed.rowIndex + rowOffset - body.rowIndex;
      if (bodyRow < 0 || bodyRow >= body.rowCount) continue;
      const record = Object.fromEntries(headerValues.map((header, index) => [header, body.values[bodyRow][index]]));
      for (let columnOffset = 0; columnOffset < changed.columnCount && seen < maxCells; columnOffset += 1) {
        const bodyColumn = changed.columnIndex + columnOffset - body.columnIndex;
        if (bodyColumn < 0 || bodyColumn >= body.columnCount) continue;
        const field = String(headerValues[bodyColumn]);
        if (!editableFields.includes(field)) continue;
        rows.push({ record, field, after: changed.values[rowOffset][columnOffset], address: localAddress });
        seen += 1;
      }
    }
    return rows;
  });
}

async function recalculateAndRead(key) {
  return Excel.run(async (context) => {
    context.workbook.application.calculate(Excel.CalculationType.full);
    const table = context.workbook.worksheets.getItem("LANCAMENTOS").tables.getItem(INTEGRATION_CONFIG.modelTable);
    const body = table.getDataBodyRange();
    const headers = table.getHeaderRowRange();
    body.load("values"); headers.load("values");
    await context.sync();
    const headerValues = headers.values[0];
    for (const values of body.values) {
      const record = Object.fromEntries(headerValues.map((header, index) => [header, values[index]]));
      if (gradeKey(record) === key) return { record, derived: calculateDerived(record) };
    }
    throw new Error("Linha recalculada não localizada.");
  });
}

async function handleWorksheetChange(event) {
  if (!connected || event.changeType === "Unknown") return;
  try {
    const changes = await readChangedCells(event.address);
    for (const change of changes) {
      const snapshot = sync.modelByKey.get(gradeKey(change.record));
      if (!snapshot) continue;
      const before = snapshot[change.field] == null ? null : Number(snapshot[change.field]);
      const after = change.after === "" || change.after == null ? null : Number(change.after);
      if (after != null && !Number.isFinite(after)) continue;
      const correlationId = crypto.randomUUID();
      const changedSequence = nextSequence(snapshot.Sequencia);
      queue.enqueue(buildEvent(change.record, { eventType: "grade.changed", field: change.field, before, after, sequence: changedSequence, correlationId, address: change.address }));
      const recalculated = await recalculateAndRead(gradeKey(change.record));
      const recalculatedSequence = changedSequence + 1;
      queue.enqueue(buildEvent(recalculated.record, {
        eventType: "grade.recalculated", field: change.field, before, after, sequence: recalculatedSequence,
        correlationId, derivedValues: recalculated.derived, address: change.address
      }));
    }
  } catch (error) {
    status(error.message || "Falha ao processar a alteração.");
  }
}

async function registerHandler() {
  try {
    const rows = await loadVisualMapping();
    mappingIndex = buildMappingIndex(rows);
    workbookMode = "visual-mapped";
    await Excel.run(async (context) => {
      for (const worksheet of mappingIndex.keys()) {
        const sheet = context.workbook.worksheets.getItem(worksheet);
        changeHandlers.push(sheet.onChanged.add((event) => handleMappedChange(worksheet, event)));
      }
      await context.sync();
    });
  } catch {
    workbookMode = "normalized";
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getItem("LANCAMENTOS");
      const table = sheet.tables.getItem(INTEGRATION_CONFIG.modelTable);
      table.load("name");
      await context.sync();
      changeHandlers.push(sheet.onChanged.add(handleWorksheetChange));
      await context.sync();
    });
  }
}

async function connect() {
  elements.connect.disabled = true;
  status("Autenticando e validando a estrutura...");
  try {
    if (!auth.account) await auth.login({ popup: true });
    await sync.initialize({ popup: true });
    await sync.loadModel();
    await registerHandler();
    connected = true;
    elements.disconnect.disabled = false;
    elements.retry.disabled = false;
    status(workbookMode === "visual-mapped" ? "Monitoramento ativo nas abas visuais do professor." : "Monitoramento ativo em TB_LANCAMENTOS.");
  } catch (error) {
    elements.connect.disabled = false;
    status(error.message || "Não foi possível iniciar o monitoramento.");
  }
}

async function disconnect() {
  connected = false;
  if (changeHandlers.length) {
    await Excel.run(async (context) => { for (const handler of changeHandlers) handler.remove(); await context.sync(); });
    changeHandlers = [];
  }
  elements.connect.disabled = false;
  elements.disconnect.disabled = true;
  status("Monitoramento pausado. A fila já confirmada foi preservada.");
}

queue.addEventListener("sent", (event) => status(`${event.detail.event.eventType} confirmado · ${event.detail.pending} na fila.`));
queue.addEventListener("error", () => status("Falha transitória. A fila foi preservada; use Tentar fila novamente."));
elements.connect.addEventListener("click", connect);
elements.disconnect.addEventListener("click", disconnect);
elements.retry.addEventListener("click", () => queue.retry());

Office.onReady(async (info) => {
  if (info.host !== Office.HostType.Excel) { status("Este add-in deve ser aberto no Microsoft Excel."); return; }
  try { await auth.initialize(); } catch { /* O clique Conectar conclui a sessão. */ }
  elements.connect.disabled = false;
  status("Excel pronto. Clique em Conectar e monitorar.");
});
