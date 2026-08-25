import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { access, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.resolve(root, "..", "qa-integracao");
const pages = ["modelo", "receptor"];
const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];
let nextId = 0;

function mime(file) {
  return ({ ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png" })[path.extname(file).toLowerCase()] || "application/octet-stream";
}

async function server() {
  const instance = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      let file = path.resolve(root, decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html");
      if (!file.startsWith(`${root}${path.sep}`) && file !== root) throw new Error("invalid path");
      const info = await stat(file);
      if (info.isDirectory()) file = path.join(file, "index.html");
      response.writeHead(200, { "Content-Type": mime(file), "Cache-Control": "no-store" });
      response.end(await readFile(file));
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); response.end("Não encontrado");
    }
  });
  await new Promise((resolve) => instance.listen(0, "127.0.0.1", resolve));
  return instance;
}

async function browserPath() {
  for (const candidate of ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"]) {
    try { await access(candidate, fsConstants.X_OK); return candidate; } catch { /* continua */ }
  }
  throw new Error("Microsoft Edge não encontrado.");
}

async function waitFile(file, timeout = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try { return await readFile(file, "utf8"); } catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
  }
  throw new Error(`Tempo esgotado aguardando ${file}`);
}

class Cdp {
  constructor(url) { this.socket = new WebSocket(url); this.pending = new Map(); this.events = []; }
  async connect() {
    await new Promise((resolve, reject) => { this.socket.addEventListener("open", resolve, { once: true }); this.socket.addEventListener("error", reject, { once: true }); });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) { this.events.push(message); return; }
      const pending = this.pending.get(message.id); if (!pending) return;
      this.pending.delete(message.id); message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
    });
  }
  send(method, params = {}) {
    const id = ++nextId;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.socket.send(JSON.stringify({ id, method, params })); });
  }
  async evaluate(expression) {
    const response = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Falha na página");
    return response.result.value;
  }
}

async function main() {
  await mkdir(output, { recursive: true });
  const http = await server();
  const address = http.address();
  const profile = path.join(os.tmpdir(), `notas-integracao-qa-${process.pid}-${Date.now()}`);
  await mkdir(profile, { recursive: true });
  const processEdge = spawn(await browserPath(), ["--headless=new", "--disable-gpu", "--disable-extensions", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  const failures = [];
  let cdp;
  try {
    const [port] = (await waitFile(path.join(profile, "DevToolsActivePort"))).trim().split(/\r?\n/);
    const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((response) => response.json());
    cdp = new Cdp(target.webSocketDebuggerUrl); await cdp.connect();
    await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("Log.enable");
    for (const page of pages) {
      for (const viewport of viewports) {
        cdp.events.length = 0;
        await cdp.send("Emulation.setDeviceMetricsOverride", { ...viewport, deviceScaleFactor: 1, mobile: viewport.width < 600 });
        await cdp.send("Page.navigate", { url: `http://127.0.0.1:${address.port}/notas-integracao/${page}/` });
        await new Promise((resolve) => setTimeout(resolve, 900));
        const metrics = await cdp.evaluate(`(() => {
          const auth = document.getElementById('authView')?.getBoundingClientRect();
          const login = document.getElementById('loginButton')?.getBoundingClientRect();
          return {
            ready: document.readyState === 'complete',
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            authVisible: auth && auth.width > 0 && auth.height > 0,
            authWithin: auth && auth.left >= -1 && auth.right <= innerWidth + 1,
            protectedHidden: document.getElementById('${page === "modelo" ? "modelView" : "receiverView"}')?.classList.contains('hidden'),
            loginHeight: login?.height || 0,
            title: document.title
          };
        })()`);
        const label = `${page}-${viewport.width}x${viewport.height}`;
        if (!metrics.ready) failures.push(`${label}: documento não concluiu carregamento.`);
        if (metrics.overflow > 1) failures.push(`${label}: overflow horizontal global de ${metrics.overflow}px.`);
        if (!metrics.authVisible || !metrics.authWithin) failures.push(`${label}: cartão de autenticação saiu do viewport.`);
        if (!metrics.protectedHidden) failures.push(`${label}: dados protegidos poderiam aparecer antes do login.`);
        if (metrics.loginHeight < 42) failures.push(`${label}: alvo de login menor que 42px.`);
        const runtimeErrors = cdp.events.filter((event) => event.method === "Runtime.exceptionThrown" || (event.method === "Log.entryAdded" && event.params?.entry?.level === "error"));
        if (runtimeErrors.length) {
          const details = runtimeErrors.map((event) => {
            const entry = event.params?.entry;
            return [entry?.text || event.params?.exceptionDetails?.text || event.method, entry?.url].filter(Boolean).join(" @ ");
          }).join(" | ");
          failures.push(`${label}: ${runtimeErrors.length} erro(s) de runtime/console: ${details}`);
        }
        const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
        await writeFile(path.join(output, `${label}.png`), Buffer.from(screenshot.data, "base64"));
      }
    }
  } finally {
    if (cdp) { try { await cdp.send("Browser.close"); } catch { /* encerrado */ } }
    if (processEdge.exitCode === null) processEdge.kill();
    await new Promise((resolve) => http.close(resolve));
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }
  if (failures.length) { console.error(failures.map((item) => `- ${item}`).join("\n")); process.exit(1); }
  console.log("Auditoria visual da integração concluída com sucesso.");
  console.log(`- Páginas: ${pages.join(", ")}.`);
  console.log(`- Viewports: ${viewports.map((item) => `${item.width}x${item.height}`).join(", ")}.`);
  console.log("- Sem overflow; conteúdo protegido oculto antes do login; sem erros de runtime.");
  console.log(`- Capturas: ${output}`);
}

await main();
