import assert from "node:assert/strict";
import { buildMappingIndex, mappedEntriesForChange, mappingRecord, parseA1 } from "../notas-integracao/addin/workbook-adapter.js";

const rows = [
  { Worksheet: "6A2º", Address: "R5", GradeKey: "2026|6A|GEO|A001", Field: "AVAL_I", Period: "II TRIMESTRE", AssessmentLabel: "I", StudentRow: 5, StudentId: "A001", ClassCode: "6A", ComponentCode: "GEO", Active: true },
  { Worksheet: "6A2º", Address: "U5", GradeKey: "2026|6A|GEO|A001", Field: "AVAL_MAQ", Period: "II TRIMESTRE", AssessmentLabel: "MAQ.", StudentRow: 5, StudentId: "A001", ClassCode: "6A", ComponentCode: "GEO", Active: true },
  { Worksheet: "6AREC", Address: "R5", GradeKey: "2026|6A|GEO|A001", Field: "REC_I", Period: "RECUPERAÇÃO", AssessmentLabel: "I", StudentRow: 5, StudentId: "A001", ClassCode: "6A", ComponentCode: "GEO", Active: false }
];

assert.deepEqual(parseA1("6A2º!R5:S7"), { top: 5, bottom: 7, left: 18, right: 19 });
const index = buildMappingIndex(rows);
assert.equal(index.size, 1, "mapeamentos inativos não devem registrar handler");
assert.equal(mappedEntriesForChange(index, "6A2º", "R5").length, 1);
assert.equal(mappedEntriesForChange(index, "6A2º", "R5:U5").length, 2);
assert.equal(mappedEntriesForChange(index, "6A2º", "S5:T5").length, 0);
const record = mappingRecord(rows[0]);
assert.equal(record.GradeKey, "2026|6A|GEO|A001");
assert.equal(record.LinhaOrigem, 5);
assert.equal(record.AlunoId, "A001");
console.log("Modelo professor v3: mapeamento visual aprovado (5 asserções).");
