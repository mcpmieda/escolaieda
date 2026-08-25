import { INTEGRATION_CONFIG } from "./config.js";
import { GraphError } from "./graph-client.js";
import { classifySequence, gradeKey } from "./domain.js";

const graphRoot = "https://graph.microsoft.com/v1.0";
const modelFieldNames = Object.freeze([
  "RegistroId", "ChaveExterna", "ContratoVersao", "AnoLetivo", "TurmaCodigo", "ComponenteCodigo",
  "LinhaOrigem", "AlunoNome", "SituacaoMatricula", "NotaT1", "NotaT2", "NotaT3", "Total",
  "RecT1", "RecT2", "RecT3", "TotalRec", "NotaFinal", "Sequencia", "UltimoEventoId",
  "UltimaAlteracao", "OrigemModelo", "Ativo"
]);

function compactFields(fields) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
}

function escapeOData(value) {
  return String(value).replaceAll("'", "''");
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

class NotesSyncClient {
  constructor(graph) {
    this.graph = graph;
    this.listIds = new Map();
    this.modelByKey = new Map();
  }

  async initialize({ popup = false } = {}) {
    const response = await this.graph.request(
      `${graphRoot}/sites/${INTEGRATION_CONFIG.siteId}/lists?$select=id,displayName,webUrl`,
      {},
      { popup }
    );
    for (const list of response.value || []) this.listIds.set(list.displayName, list.id);
    for (const required of Object.values(INTEGRATION_CONFIG.lists)) {
      if (!this.listIds.has(required)) throw new Error(`Estrutura de POC ausente: ${required}.`);
    }
  }

  listId(name) {
    const id = this.listIds.get(name);
    if (!id) throw new Error(`Lista não resolvida: ${name}.`);
    return id;
  }

  async paged(url, options = {}) {
    const items = [];
    let next = url;
    while (next) {
      const page = await this.graph.request(next, options);
      items.push(...(page.value || []));
      next = page["@odata.nextLink"] || "";
    }
    return items;
  }

  async loadModel() {
    const listId = this.listId(INTEGRATION_CONFIG.lists.model);
    const select = modelFieldNames.join(",");
    const url = `${graphRoot}/sites/${INTEGRATION_CONFIG.siteId}/lists/${listId}/items?$expand=fields($select=${select})&$top=500`;
    const items = await this.paged(url);
    const records = items.map((item) => ({ itemId: item.id, eTag: item.eTag, ...item.fields }))
      .filter((record) => record.Ativo !== false && record.AlunoNome);
    this.modelByKey = new Map(records.map((record) => [gradeKey(record), record]));
    return records;
  }

  async loadRecentEvents(limit = 100) {
    const listId = this.listId(INTEGRATION_CONFIG.lists.events);
    const url = `${graphRoot}/sites/${INTEGRATION_CONFIG.siteId}/lists/${listId}/items?$expand=fields&$top=${Math.min(limit, 200)}`;
    const items = await this.paged(url);
    return items.map((item) => ({ itemId: item.id, createdDateTime: item.createdDateTime, ...item.fields }))
      .sort((a, b) => new Date(b.createdDateTime) - new Date(a.createdDateTime))
      .slice(0, limit);
  }

  async findEventByIdempotencyKey(idempotencyKey) {
    const listId = this.listId(INTEGRATION_CONFIG.lists.events);
    const filter = `fields/IdempotencyKey eq '${escapeOData(idempotencyKey)}'`;
    const url = `${graphRoot}/sites/${INTEGRATION_CONFIG.siteId}/lists/${listId}/items?$filter=${encodeURIComponent(filter)}&$expand=fields&$top=1`;
    const response = await this.graph.request(url, { headers: { Prefer: "HonorNonIndexedQueriesWarningMayFailRandomly" } });
    const item = response.value?.[0];
    return item ? { itemId: item.id, createdDateTime: item.createdDateTime, ...item.fields } : null;
  }

  async createEvent(event) {
    const listId = this.listId(INTEGRATION_CONFIG.lists.events);
    const payloadHash = await sha256(JSON.stringify(event));
    const fields = compactFields({
      Title: event.eventId,
      EventId: event.eventId,
      IdempotencyKey: event.idempotencyKey,
      CorrelationId: event.correlationId,
      SchemaVersion: 1,
      EventType: event.eventType,
      GradeKey: event.gradeKey,
      SourceKind: event.source.kind,
      WorkbookId: event.source.workbookId,
      WorksheetId: event.source.worksheetId,
      CellAddress: event.source.cellAddress,
      FieldName: event.field,
      ValueBefore: event.valueBefore,
      ValueAfter: event.valueAfter,
      DerivedTotal: event.derivedValues?.Total,
      DerivedTotalRec: event.derivedValues?.TotalRec,
      DerivedNotaFinal: event.derivedValues?.NotaFinal,
      Sequence: event.sequence,
      SourceRevision: event.sourceRevision,
      ClientSentAt: event.clientSentAt,
      Status: "received",
      PayloadHash: payloadHash
    });
    try {
      const created = await this.graph.request(
        `${graphRoot}/sites/${INTEGRATION_CONFIG.siteId}/lists/${listId}/items`,
        { method: "POST", body: JSON.stringify({ fields }) }
      );
      return { itemId: created.id, createdDateTime: created.createdDateTime, ...created.fields, duplicate: false };
    } catch (error) {
      if (!(error instanceof GraphError) || ![400, 409].includes(error.status)) throw error;
      const existing = await this.findEventByIdempotencyKey(event.idempotencyKey);
      if (!existing || existing.PayloadHash !== payloadHash) throw error;
      return { ...existing, duplicate: true };
    }
  }

  async patchFields(listName, itemId, fields) {
    const listId = this.listId(listName);
    return this.graph.request(
      `${graphRoot}/sites/${INTEGRATION_CONFIG.siteId}/lists/${listId}/items/${itemId}/fields`,
      { method: "PATCH", body: JSON.stringify(compactFields(fields)) }
    );
  }

  async sendGradeEvent(event) {
    const snapshot = this.modelByKey.get(event.gradeKey);
    if (!snapshot) throw new Error("Lançamento não localizado no snapshot protegido.");
    const receipt = await this.createEvent(event);
    if (receipt.duplicate) return { ...receipt, status: "duplicate" };

    const currentSequence = Number(snapshot.Sequencia || 0);
    if (classifySequence(currentSequence, event.sequence) === "stale") {
      await this.patchFields(INTEGRATION_CONFIG.lists.events, receipt.itemId, { Status: "stale", SnapshotItemId: Number(snapshot.itemId) });
      return { ...receipt, status: "stale" };
    }

    const snapshotPatch = {
      Sequencia: event.sequence,
      UltimoEventoId: event.eventId,
      UltimaAlteracao: event.clientSentAt
    };
    if (event.eventType === "grade.recalculated") {
      Object.assign(snapshotPatch, event.derivedValues || {});
    } else {
      snapshotPatch[event.field] = event.valueAfter;
    }
    await this.patchFields(INTEGRATION_CONFIG.lists.model, snapshot.itemId, snapshotPatch);
    Object.assign(snapshot, snapshotPatch);
    await this.patchFields(INTEGRATION_CONFIG.lists.events, receipt.itemId, { Status: "applied", SnapshotItemId: Number(snapshot.itemId) });
    return { ...receipt, status: "applied" };
  }
}

class SerialEventQueue extends EventTarget {
  constructor(syncClient, { maxPending = 50 } = {}) {
    super();
    this.syncClient = syncClient;
    this.maxPending = maxPending;
    this.pending = [];
    this.running = false;
  }

  enqueue(event) {
    if (this.pending.length >= this.maxPending) throw new Error("Fila local cheia; aguarde a sincronização antes de continuar.");
    this.pending.push(event);
    this.dispatchEvent(new CustomEvent("state", { detail: { pending: this.pending.length, state: "queued" } }));
    void this.drain();
  }

  async drain() {
    if (this.running) return;
    this.running = true;
    while (this.pending.length) {
      const event = this.pending[0];
      try {
        const receipt = await this.syncClient.sendGradeEvent(event);
        this.pending.shift();
        this.dispatchEvent(new CustomEvent("sent", { detail: { event, receipt, pending: this.pending.length } }));
      } catch (error) {
        this.dispatchEvent(new CustomEvent("error", { detail: { event, error, pending: this.pending.length } }));
        break;
      }
    }
    this.running = false;
    this.dispatchEvent(new CustomEvent("state", { detail: { pending: this.pending.length, state: this.pending.length ? "paused" : "idle" } }));
  }

  retry() { void this.drain(); }
}

export { NotesSyncClient, SerialEventQueue, sha256 };
