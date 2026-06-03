import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const raizProjeto = path.resolve(import.meta.dirname, "..");
const arquivoHtml = path.join(raizProjeto, "arquivo-digital", "index.html");
const arquivoJs = path.join(raizProjeto, "arquivo-digital", "arquivo-digital.js");
const pastaDiagnosticos = path.join(raizProjeto, "diagnosticos");

function encontrarTodos(regex, texto) {
  return [...texto.matchAll(regex)].map(match => match[0]);
}

const [html, js] = await Promise.all([
  readFile(arquivoHtml, "utf8"),
  readFile(arquivoJs, "utf8")
]);

const importsExternos = encontrarTodos(/import\s+[^;]+from\s+["']https?:\/\/[^"']+["']/g, js);
const urlsExternas = [...new Set(encontrarTodos(/https?:\/\/[^"',)\s]+/g, `${html}\n${js}`)
  .map(url => {
    try {
      return new URL(url).origin;
    } catch {
      return url;
    }
  }))].sort();
const atributosStyle = encontrarTodos(/\sstyle\s*=/gi, html).length + encontrarTodos(/\.style\./g, js).length;
const metaCsp = /http-equiv=["']Content-Security-Policy["']/i.test(html);

const linhas = [
  "# Diagnostico V3.10 - CSP e dependencias locais",
  "",
  `- Gerado em: ${new Date().toISOString()}`,
  "- Modo: diagnostico; nao altera CSP, dependencias, login, Graph, upload, substituicao ou mesclagem.",
  "",
  "## Estado atual",
  "",
  `- Meta CSP no HTML: ${metaCsp ? "sim" : "nao"}`,
  `- Imports externos JS: ${importsExternos.length}`,
  `- Usos de style inline/DOM style aproximados: ${atributosStyle}`,
  "",
  "## Imports externos",
  "",
  ...(importsExternos.length ? importsExternos.map(item => `- ${item}`) : ["- Nenhum import externo encontrado."]),
  "",
  "## Origens externas observadas",
  "",
  ...urlsExternas.map(origem => `- ${origem}`),
  "",
  "## CSP Report-Only sugerida para teste",
  "",
  "```text",
  "default-src 'self';",
  "base-uri 'self';",
  "object-src 'none';",
  "frame-ancestors 'self';",
  "img-src 'self' data: https://escolaieda.com https://eduieda.sharepoint.com;",
  "style-src 'self' 'unsafe-inline';",
  "script-src 'self' https://esm.sh https://cdnjs.cloudflare.com;",
  "connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com https://eduieda.sharepoint.com;",
  "font-src 'self' data:;",
  "```",
  "",
  "## Caminho recomendado",
  "",
  "- Primeiro publicar CSP em Report-Only no servidor, nao como bloqueante.",
  "- Vendorizar MSAL e pdf-lib em build controlado antes de remover `https://esm.sh` e `https://cdnjs.cloudflare.com` de `script-src`.",
  "- Remover `style-src 'unsafe-inline'` somente depois de eliminar `style` no HTML e usos diretos de `.style` no JS.",
  "- Validar login, Graph, upload, substituir e mesclar se qualquer dependencia mudar.",
  "",
  "## Decisao V3.10",
  "",
  "- Nao aplicar CSP bloqueante agora.",
  "- Nao trocar dependencias externas agora sem build controlado.",
  "- V3.10 fica concluida como preparacao auditavel para CSP Report-Only e dependencias locais futuras."
];

await mkdir(pastaDiagnosticos, { recursive: true });
const saida = path.join(
  pastaDiagnosticos,
  `relatorio-csp-dependencias-v3-10-${new Date().toISOString().replace(/[-:]/g, "").slice(0, 13)}.md`
);
await writeFile(saida, `${linhas.join("\n")}\n`, "utf8");
console.log(`Relatorio gerado: ${saida}`);
