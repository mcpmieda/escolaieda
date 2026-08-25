import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  editableFields, normalizeGrade, calculateDerived, nextSequence, classifySequence, gradeKey
} from "../notas-integracao/js/domain.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
let passed = 0;

function test(name, fn) {
  fn();
  passed += 1;
  process.stdout.write(`✓ ${name}\n`);
}

test("vazio continua ausente e zero continua explícito", () => {
  assert.equal(normalizeGrade("", "NotaT1"), null);
  assert.equal(normalizeGrade("  ", "NotaT1"), null);
  assert.equal(normalizeGrade("0", "NotaT1"), 0);
});

test("normalização aceita decimal brasileiro e rejeita fora do intervalo", () => {
  assert.equal(normalizeGrade("17,25", "NotaT1"), 17.25);
  assert.throws(() => normalizeGrade("30,01", "NotaT1"), RangeError);
  assert.throws(() => normalizeGrade("41", "NotaT3"), RangeError);
});

test("fórmulas Nina reproduzem total, recuperação e nota final", () => {
  assert.deepEqual(calculateDerived({ NotaT1: 18, NotaT2: 17.5, NotaT3: 24, RecT1: null, RecT2: 20, RecT3: 22 }), {
    Total: 59.5, TotalRec: 42, NotaFinal: 59.5
  });
  assert.deepEqual(calculateDerived({ NotaT1: null, NotaT2: null, NotaT3: null, RecT1: null, RecT2: null, RecT3: null }), {
    Total: 0, TotalRec: 0, NotaFinal: 0
  });
});

test("sequência nova aplica e sequência repetida ou antiga fica stale", () => {
  assert.equal(classifySequence(10, 11), "applied");
  assert.equal(classifySequence(10, 10), "stale");
  assert.equal(classifySequence(10, 9), "stale");
  assert.ok(nextSequence(9999999999999) > 9999999999999);
});

test("chave do lançamento não depende do nome do estudante", () => {
  const record = { ChaveExterna: "2026|T1|M|3", AlunoNome: "Nome fictício" };
  assert.equal(gradeKey(record), "2026|T1|M|3");
});

test("somente seis campos de entrada são editáveis", () => {
  assert.deepEqual(editableFields, ["NotaT1", "NotaT2", "NotaT3", "RecT1", "RecT2", "RecT3"]);
});

test("páginas protegidas não embutem nomes ou notas reais no HTML", () => {
  for (const file of ["notas-integracao/modelo/index.html", "notas-integracao/receptor/index.html"]) {
    const html = read(file);
    assert.doesNotMatch(html, /AlunoNome\s*[:=]\s*["'][^"']+/);
    assert.doesNotMatch(html, /NotaT1\s*[:=]\s*\d/);
    assert.match(html, /Acesso institucional necessário/);
  }
});

test("renderizadores de dados reais usam textContent e não innerHTML", () => {
  for (const file of ["notas-integracao/modelo/app.js", "notas-integracao/receptor/app.js"]) {
    const js = read(file);
    assert.doesNotMatch(js, /\.innerHTML\s*=/);
    assert.match(js, /\.textContent\s*=/);
  }
});

test("modelo emite edição antes do recálculo e usa debounce de 250 ms", () => {
  const app = read("notas-integracao/modelo/app.js");
  assert.match(app, /editDebounceMs/);
  assert.ok(app.indexOf('eventType: "grade.changed"') < app.indexOf('eventType: "grade.recalculated"'));
  assert.doesNotMatch(app, /record\.Sequencia\s*=\s*recalculatedSequence/);
});

test("modelo conclui o login sem abandonar a página de teste", () => {
  const app = read("notas-integracao/modelo/app.js");
  assert.match(app, /auth\.login\(\{ popup: true \}\)/);
});

test("add-in monitora TB_LANCAMENTOS por worksheet.onChanged", () => {
  const app = read("notas-integracao/addin/app.js");
  assert.match(app, /sheet\.onChanged\.add\(handleWorksheetChange\)/);
  assert.match(app, /INTEGRATION_CONFIG\.modelTable/);
  assert.match(app, /Excel\.CalculationType\.full/);
  assert.doesNotMatch(app, /snapshot\.Sequencia\s*=\s*recalculatedSequence/);
});

test("receptor exclui eventos anteriores à abertura das métricas de latência", () => {
  const app = read("notas-integracao/receptor/app.js");
  assert.match(app, /baselineIds\.has\(event\.EventId\)/);
  assert.match(app, /baselineIds\.add\(event\.EventId\)/);
});

test("receptor conclui o login sem abandonar a página de teste", () => {
  const app = read("notas-integracao/receptor/app.js");
  assert.match(app, /auth\.login\(\{ popup: true \}\)/);
});

test("manifesto usa HTTPS, ExcelApi e permissão ReadWriteDocument", () => {
  const manifest = read("notas-integracao/addin/manifest.xml");
  assert.match(manifest, /https:\/\/escolaieda\.com\/notas-integracao\/addin\//);
  assert.match(manifest, /<Set Name="ExcelApi" MinVersion="1\.9"/);
  assert.match(manifest, /<Permissions>ReadWriteDocument<\/Permissions>/);
});

test("adaptador aponta somente para listas isoladas da POC", () => {
  const config = read("notas-integracao/js/config.js");
  assert.match(config, /NOTAS_POC_MODELO_NINA/);
  assert.match(config, /NOTAS_POC_EVENTOS/);
  assert.doesNotMatch(config, /DOCUMENTOS_ATIVOS/);
});

test("fila serial possui limite e não descarta falha silenciosamente", () => {
  const client = read("notas-integracao/js/sync-client.js");
  assert.match(client, /maxPending = 50/);
  assert.match(client, /this\.dispatchEvent\(new CustomEvent\("error"/);
  assert.match(client, /this\.pending\[0\]/);
});

test("contratos distinguem API futura do adaptador atual", () => {
  const architecture = read("ARCHITECTURE_NOTAS_SYNC.md");
  const api = read("API_NOTAS_SYNC.md");
  assert.match(architecture, /não é apresentado como a API definitiva/i);
  assert.match(api, /A POC usa listas SharePoint protegidas/);
});

process.stdout.write(`\n${passed} testes de integração aprovados.\n`);
