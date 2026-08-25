const editableFields = Object.freeze(["NotaT1", "NotaT2", "NotaT3", "RecT1", "RecT2", "RecT3"]);
const derivedFields = Object.freeze(["Total", "TotalRec", "NotaFinal"]);
const fieldLimits = Object.freeze({ NotaT1: 30, NotaT2: 30, NotaT3: 40, RecT1: 30, RecT2: 30, RecT3: 40 });

function normalizeGrade(raw, field) {
  const text = String(raw ?? "").trim().replace(",", ".");
  if (!text) return null;
  const value = Number(text);
  const max = fieldLimits[field];
  if (!Number.isFinite(value) || !Number.isFinite(max) || value < 0 || value > max) {
    throw new RangeError(`Informe um valor entre 0 e ${max}, ou deixe vazio.`);
  }
  return Math.round(value * 100) / 100;
}

function sumPresent(values) {
  return values.reduce((sum, value) => sum + (value == null ? 0 : Number(value)), 0);
}

function calculateDerived(record) {
  const Total = Math.round(sumPresent([record.NotaT1, record.NotaT2, record.NotaT3]) * 100) / 100;
  const TotalRec = Math.round(sumPresent([record.RecT1, record.RecT2, record.RecT3]) * 100) / 100;
  const NotaFinal = Math.max(Total, TotalRec);
  return { Total, TotalRec, NotaFinal };
}

function nextSequence(previous = 0) {
  const now = Date.now();
  return Math.max(Number(previous || 0) + 1, now);
}

function classifySequence(currentSequence, incomingSequence) {
  return Number(incomingSequence) > Number(currentSequence || 0) ? "applied" : "stale";
}

function gradeKey(record) {
  return String(record.ChaveExterna || `${record.AnoLetivo}|${record.TurmaCodigo}|${record.ComponenteCodigo}|${record.LinhaOrigem}`);
}

function valueLabel(value) {
  return value == null ? "—" : Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export { editableFields, derivedFields, fieldLimits, normalizeGrade, calculateDerived, nextSequence, classifySequence, gradeKey, valueLabel };
