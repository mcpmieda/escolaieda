import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { access, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, "..");
const saida = path.join(raiz, "diagnosticos", "auditoria-visual-boletim");
const viewports = [
  { width: 1672, height: 941 },
  { width: 1550, height: 741 },
  { width: 1420, height: 941 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 }
];

const erros = [];
let proximoId = 0;

function registrar(condicao, mensagem) {
  if (!condicao) erros.push(mensagem);
}

function mime(caminho) {
  const extensao = path.extname(caminho).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml"
  }[extensao] || "application/octet-stream";
}

async function criarServidor() {
  const servidor = createServer(async (requisicao, resposta) => {
    try {
      const url = new URL(requisicao.url || "/", "http://127.0.0.1");
      const relativo = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      let arquivo = path.resolve(raiz, relativo || "index.html");
      if (!arquivo.startsWith(`${raiz}${path.sep}`) && arquivo !== raiz) throw new Error("Caminho inválido");
      const info = await stat(arquivo);
      if (info.isDirectory()) arquivo = path.join(arquivo, "index.html");
      const conteudo = await readFile(arquivo);
      resposta.writeHead(200, { "Content-Type": mime(arquivo), "Cache-Control": "no-store" });
      resposta.end(conteudo);
    } catch {
      resposta.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      resposta.end("Não encontrado");
    }
  });
  await new Promise((resolve) => servidor.listen(0, "127.0.0.1", resolve));
  return servidor;
}

async function localizarNavegador() {
  const candidatos = process.platform === "win32"
    ? [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
      ]
    : ["/usr/bin/microsoft-edge", "/usr/bin/google-chrome", "/usr/bin/chromium"];
  for (const candidato of candidatos) {
    try {
      await access(candidato, fsConstants.X_OK);
      return candidato;
    } catch {
      // Continua procurando um Chromium instalado.
    }
  }
  throw new Error("Microsoft Edge/Chrome não encontrado para a auditoria visual.");
}

async function aguardarArquivo(caminho, limiteMs = 12000) {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    try {
      return await readFile(caminho, "utf8");
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Tempo esgotado aguardando ${caminho}`);
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.pendentes = new Map();
  }

  async conectar() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const mensagem = JSON.parse(String(event.data));
      if (!mensagem.id || !this.pendentes.has(mensagem.id)) return;
      const { resolve, reject } = this.pendentes.get(mensagem.id);
      this.pendentes.delete(mensagem.id);
      if (mensagem.error) reject(new Error(mensagem.error.message));
      else resolve(mensagem.result);
    });
  }

  enviar(method, params = {}) {
    const id = ++proximoId;
    return new Promise((resolve, reject) => {
      this.pendentes.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  fechar() {
    this.socket.close();
  }
}

async function esperarCondicao(cdp, expression, limiteMs = 12000) {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    const resposta = await cdp.enviar("Runtime.evaluate", { expression, returnByValue: true });
    if (resposta.result.value) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Condição visual não atendida: ${expression}`);
}

async function avaliar(cdp, expression) {
  const resposta = await cdp.enviar("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (resposta.exceptionDetails) throw new Error(resposta.exceptionDetails.text || "Falha ao avaliar a página");
  return resposta.result.value;
}

const expressaoMetricas = `(() => {
  const retangulo = (seletor) => document.querySelector(seletor)?.getBoundingClientRect();
  const pagina = retangulo('.bulletinPage');
  const viewport = retangulo('.bulletinPreviewViewport');
  const documentos = [...document.querySelectorAll('.bulletinDocument')];
  const paineis = [...document.querySelectorAll('.bulletinControlPanel')].map((item) => item.getBoundingClientRect());
  const primeiraTabela = document.querySelector('.bulletinGradeTable');
  const colunas = primeiraTabela ? [...primeiraTabela.querySelectorAll('col.bulletinDisciplineColumn')] : [];
  const larguras = primeiraTabela
    ? [...primeiraTabela.querySelectorAll('thead th')].slice(1).map((item) => item.getBoundingClientRect().width)
    : [];
  const dentro = (filho, pai, tolerancia = 1.5) => filho && pai
    && filho.left >= pai.left - tolerancia && filho.right <= pai.right + tolerancia
    && filho.top >= pai.top - tolerancia && filho.bottom <= pai.bottom + tolerancia;
  const documentosValidos = documentos.every((documento) => {
    const caixa = documento.getBoundingClientRect();
    const cabecalho = documento.querySelector('.bulletinDocumentHeader')?.getBoundingClientRect();
    const corpo = documento.querySelector('.bulletinDocumentBody')?.getBoundingClientRect();
    const rodape = documento.querySelector('.bulletinDocumentFooter')?.getBoundingClientRect();
    const tabela = documento.querySelector('.bulletinGradeTable')?.getBoundingClientRect();
    return dentro(cabecalho, caixa) && dentro(corpo, caixa) && dentro(rodape, caixa)
      && dentro(tabela, caixa) && cabecalho.bottom <= corpo.top + 2 && corpo.bottom <= rodape.bottom + 2;
  });
  return {
    bodyOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    pageCount: document.querySelectorAll('.bulletinPage').length,
    documentCount: documentos.length,
    pageWithinViewport: innerWidth < 820 || (pagina && viewport && pagina.left >= viewport.left - 2 && pagina.right <= viewport.right + 2),
    pageRatio: pagina ? pagina.width / pagina.height : 0,
    documentsValid: documentosValidos,
    panelsTopSpread: paineis.length ? Math.max(...paineis.map((item) => item.top)) - Math.min(...paineis.map((item) => item.top)) : 999,
    controlsOverflow: [...document.querySelectorAll('.bulletinSituationButton, .bulletinActionButton')]
      .some((item) => item.scrollWidth > item.clientWidth + 2),
    columnSpread: larguras.length ? Math.max(...larguras) - Math.min(...larguras) : 999,
    busyPages: document.querySelectorAll('.bulletinPage[aria-busy="true"]').length,
    hasPaginationButtons: Boolean(document.getElementById('bulletinPreviousPage') || document.getElementById('bulletinNextPage')),
    hiddenColumnCount: colunas.length
  };
})()`;

async function principal() {
  await mkdir(saida, { recursive: true });
  const servidor = await criarServidor();
  const endereco = servidor.address();
  const url = `http://127.0.0.1:${endereco.port}/notas/#boletim`;
  const navegador = await localizarNavegador();
  const perfil = path.join(os.tmpdir(), `auditoria-boletim-${process.pid}-${Date.now()}`);
  await mkdir(perfil, { recursive: true });
  const processo = spawn(navegador, [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--hide-scrollbars",
    "--remote-debugging-port=0",
    `--user-data-dir=${perfil}`,
    "about:blank"
  ], { stdio: "ignore" });

  let cdp;
  try {
    const ativo = await aguardarArquivo(path.join(perfil, "DevToolsActivePort"));
    const [porta] = ativo.trim().split(/\r?\n/);
    const alvo = await fetch(`http://127.0.0.1:${porta}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((resposta) => resposta.json());
    cdp = new Cdp(alvo.webSocketDebuggerUrl);
    await cdp.conectar();
    await cdp.enviar("Page.enable");
    await cdp.enviar("Runtime.enable");

    for (const viewport of viewports) {
      await cdp.enviar("Emulation.setDeviceMetricsOverride", {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: false
      });
      await cdp.enviar("Page.navigate", { url });
      await esperarCondicao(cdp, `document.body.dataset.view === 'boletim' && document.querySelectorAll('.bulletinDocument').length > 0`);
      await esperarCondicao(cdp, `document.querySelectorAll('.bulletinPage').length === 9 && document.querySelectorAll('.bulletinDocument').length === 35`);

      const metricas = await avaliar(cdp, expressaoMetricas);
      const rotulo = `${viewport.width}x${viewport.height}`;
      registrar(metricas.bodyOverflow <= 1, `${rotulo}: a página criou overflow horizontal global (${metricas.bodyOverflow}px).`);
      registrar(metricas.pageCount === 9, `${rotulo}: a prévia contínua deve conter nove folhas.`);
      registrar(metricas.documentCount === 35, `${rotulo}: a prévia contínua deve conter os 35 boletins da turma.`);
      registrar(metricas.pageWithinViewport, `${rotulo}: a folha saiu dos limites da prévia no desktop.`);
      registrar(Math.abs(metricas.pageRatio - (210 / 275)) < 0.015, `${rotulo}: a proporção da folha A4 visual foi alterada.`);
      registrar(metricas.documentsValid, `${rotulo}: cabeçalho, corpo, tabela ou rodapé saiu do boletim.`);
      registrar(viewport.width < 1100 || metricas.panelsTopSpread <= 2, `${rotulo}: os três painéis de controle não começaram na mesma linha.`);
      registrar(!metricas.controlsOverflow, `${rotulo}: texto de botão escapou da própria caixa.`);
      registrar(metricas.columnSpread <= 1, `${rotulo}: as colunas de disciplinas deixaram de ter larguras iguais.`);
      registrar(metricas.hiddenColumnCount === 12, `${rotulo}: a tabela não contém as 12 colunas disciplinares.`);
      registrar(metricas.busyPages === 0, `${rotulo}: o carregamento progressivo deixou folhas pendentes.`);
      registrar(metricas.hasPaginationButtons === false, `${rotulo}: a prévia contínua não deve exibir botões de paginação.`);

      const captura = await cdp.enviar("Page.captureScreenshot", { format: "png", fromSurface: true });
      await writeFile(path.join(saida, `boletim-${rotulo}.png`), Buffer.from(captura.data, "base64"));
    }

    const fluxoContinuo = await avaliar(cdp, `(() => {
      const folhas = [...document.querySelectorAll('.bulletinPage')];
      const viewport = document.getElementById('bulletinPreviewViewport');
      viewport.scrollTop = viewport.scrollHeight;
      return {
        primeira: folhas[0]?.getAttribute('aria-label'),
        ultima: folhas.at(-1)?.getAttribute('aria-label'),
        ultimaQuantidade: folhas.at(-1)?.querySelectorAll('.bulletinDocument').length,
        rolavel: viewport.scrollHeight > viewport.clientHeight
      };
    })()`);
    registrar(fluxoContinuo.primeira === "Folha 1 de 9", "A primeira folha contínua perdeu seu nome acessível.");
    registrar(fluxoContinuo.ultima === "Folha 9 de 9", "A última folha contínua perdeu seu nome acessível.");
    registrar(fluxoContinuo.ultimaQuantidade === 3, "A última folha deveria conter os três boletins restantes.");
    registrar(fluxoContinuo.rolavel === true, "A prévia contínua deveria permitir rolagem vertical.");

    await cdp.enviar("Emulation.setDeviceMetricsOverride", {
      width: 1672,
      height: 941,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.enviar("Page.navigate", { url });
    await esperarCondicao(cdp, `document.body.dataset.view === 'boletim' && document.querySelectorAll('.bulletinPage').length === 9 && document.querySelectorAll('.bulletinDocument').length >= 4`);
    const pdfResultado = await cdp.enviar("Page.printToPDF", {
      printBackground: true,
      preferCSSPageSize: true,
      transferMode: "ReturnAsStream"
    });
    const partesPdf = [];
    let fimPdf = false;
    while (!fimPdf) {
      const parte = await cdp.enviar("IO.read", { handle: pdfResultado.stream, size: 1024 * 1024 });
      partesPdf.push(Buffer.from(parte.data, parte.base64Encoded ? "base64" : "latin1"));
      fimPdf = parte.eof;
    }
    await cdp.enviar("IO.close", { handle: pdfResultado.stream });
    const pdf = Buffer.concat(partesPdf);
    const pdfTexto = pdf.toString("latin1");
    const paginasPdf = (pdfTexto.match(/\/Type\s*\/Page\b/g) || []).length;
    registrar(paginasPdf === 9, `O PDF deveria ter nove páginas, mas gerou ${paginasPdf}.`);
    registrar(pdf.length < 18 * 1024 * 1024, `O PDF otimizado ultrapassou 18 MB (${(pdf.length / 1024 / 1024).toFixed(2)} MB).`);
    await writeFile(path.join(saida, "boletim-a4-otimizado.pdf"), pdf);

    const caminhoDownload = path.join(saida, "Boletins-8C-2026.pdf");
    await rm(caminhoDownload, { force: true });
    await cdp.enviar("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: saida,
      eventsEnabled: true
    });
    await avaliar(cdp, `document.getElementById('bulletinDownload').click()`);
    const inicioDownload = Date.now();
    let downloadConcluido = false;
    while (Date.now() - inicioDownload < 90000) {
      try {
        const info = await stat(caminhoDownload);
        const ocupado = await avaliar(cdp, `document.getElementById('bulletinDownload').getAttribute('aria-busy') === 'true'`);
        if (info.size > 100_000 && !ocupado) {
          downloadConcluido = true;
          break;
        }
      } catch {
        // O navegador ainda está gerando ou transferindo o arquivo.
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    registrar(downloadConcluido, "Baixar PDF não concluiu um download direto em até 90 segundos.");
    if (downloadConcluido) {
      const pdfDireto = await readFile(caminhoDownload);
      registrar(pdfDireto.subarray(0, 5).toString("ascii") === "%PDF-", "O download direto não gerou um arquivo PDF válido.");
      registrar(pdfDireto.length < 25 * 1024 * 1024, `O PDF direto ultrapassou 25 MB (${(pdfDireto.length / 1024 / 1024).toFixed(2)} MB).`);
    }
  } finally {
    if (cdp) {
      try {
        await cdp.enviar("Browser.close");
      } catch {
        // O processo pode encerrar o socket antes de confirmar Browser.close.
      }
      cdp.fechar();
    }
    if (processo.exitCode === null) processo.kill();
    await Promise.race([
      new Promise((resolve) => processo.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 1500))
    ]);
    await new Promise((resolve) => servidor.close(resolve));
    if (perfil.startsWith(os.tmpdir())) {
      for (let tentativa = 0; tentativa < 5; tentativa += 1) {
        try {
          await rm(perfil, { recursive: true, force: true });
          break;
        } catch (erro) {
          if (tentativa === 4) console.warn(`Aviso: não foi possível remover o perfil temporário: ${erro.message}`);
          else await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    }
  }

  if (erros.length) {
    console.error("Auditoria visual do Boletim falhou:");
    for (const erro of erros) console.error(`- ${erro}`);
    process.exit(1);
  }

  console.log("Auditoria visual do Boletim concluída com sucesso.");
  console.log(`- Viewports: ${viewports.map(({ width, height }) => `${width}x${height}`).join(", ")}.`);
  console.log("- Prévia contínua: 9 folhas e 35 boletins sem paginação por clique.");
  console.log("- PDF: 9 páginas e limite automatizado de 18 MB.");
  console.log("- Download direto: arquivo PDF validado sem abrir a impressão.");
  console.log(`- Capturas locais: ${saida}`);
}

await principal();
