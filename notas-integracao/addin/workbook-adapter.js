function columnNumber(label) {
  return [...label.toUpperCase()].reduce((value, character) => value * 26 + character.charCodeAt(0) - 64, 0);
}

export function parseA1(address) {
  const local = String(address).split("!").pop().replace(/\$/g, "");
  const [startText, endText = startText] = local.split(":");
  const parseCell = (text) => {
    const match = /^([A-Z]+)(\d+)$/i.exec(text);
    if (!match) throw new Error(`Endereço Excel inválido: ${address}`);
    return { column: columnNumber(match[1]), row: Number(match[2]) };
  };
  const start = parseCell(startText);
  const end = parseCell(endText);
  return { top: Math.min(start.row, end.row), bottom: Math.max(start.row, end.row), left: Math.min(start.column, end.column), right: Math.max(start.column, end.column) };
}

export function buildMappingIndex(rows) {
  const index = new Map();
  for (const row of rows) {
    if (row.Active === false || String(row.Active).toLowerCase() === "false") continue;
    const worksheet = String(row.Worksheet);
    const entry = { ...row, bounds: parseA1(row.Address) };
    if (!index.has(worksheet)) index.set(worksheet, []);
    index.get(worksheet).push(entry);
  }
  return index;
}

export function mappedEntriesForChange(index, worksheet, changedAddress, limit = 100) {
  const changed = parseA1(changedAddress);
  const matches = [];
  for (const entry of index.get(worksheet) || []) {
    const cell = entry.bounds;
    if (cell.top >= changed.top && cell.bottom <= changed.bottom && cell.left >= changed.left && cell.right <= changed.right) {
      matches.push(entry);
      if (matches.length >= limit) break;
    }
  }
  return matches;
}

export function mappingRecord(entry) {
  return {
    GradeKey: entry.GradeKey,
    AnoLetivo: Number(String(entry.GradeKey).split("|")[0]) || null,
    TurmaCodigo: entry.ClassCode,
    ComponenteCodigo: entry.ComponentCode,
    AlunoId: entry.StudentId,
    LinhaOrigem: Number(entry.StudentRow),
    Planilha: entry.Worksheet,
    Celula: entry.Address,
    Periodo: entry.Period
  };
}
