import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const raizProjeto = path.resolve(import.meta.dirname, "..");
const html = await readFile(path.join(raizProjeto, "arquivo-digital", "index.html"), "utf8");
const css = await readFile(path.join(raizProjeto, "arquivo-digital", "arquivo-digital.css"), "utf8");
const js = await readFile(path.join(raizProjeto, "arquivo-digital", "arquivo-digital.js"), "utf8");

function testar(nome, funcao) {
  funcao();
  console.log(`OK - ${nome}`);
}

testar("notificacao global fica fora do card principal", () => {
  const indiceMensagem = html.indexOf('id="mensagemSistema"');
  const indiceCard = html.indexOf('<div class="card">');
  assert.ok(indiceMensagem >= 0, "mensagemSistema deve existir.");
  assert.ok(indiceCard >= 0, "card principal deve existir.");
  assert.ok(indiceMensagem < indiceCard, "mensagemSistema deve ficar antes e fora do card.");
});

testar("botoes X seguem acessiveis", () => {
  const botoesFechar = [...html.matchAll(/<button[^>]+class="[^"]*\bbtnFechar\b[^"]*"[^>]*>/g)];
  assert.ok(botoesFechar.length >= 4, "Botoes de fechar esperados nao encontrados.");
  botoesFechar.forEach(match => {
    assert.match(match[0], /aria-label=/, "Botao X precisa de aria-label.");
  });
});

testar("paginacao visual tem botao, evento e estado hidden", () => {
  assert.match(html, /id="btnCarregarMaisDocumentos"/, "Botao Carregar mais deve existir.");
  assert.match(js, /TAMANHO_PAGINA_DOCUMENTOS\s*=\s*100/, "Pagina visual deve limitar cards por lote.");
  assert.match(js, /btnCarregarMaisDocumentos/, "Evento do botao Carregar mais deve estar registrado.");
  assert.match(css, /\.btnCarregarMaisDocumentos\[hidden\]\s*{[^}]*display:\s*none/s, "Estado hidden do botao deve ser protegido.");
});

testar("abas e botoes sensiveis nao dependem do hover global", () => {
  const regraGlobal = css.match(/REGRA_GLOBAL_BUTTON_HOVER_LIMITADA[\s\S]*?button:not\(([\s\S]*?)\):hover:not\(:disabled\)/);
  assert.ok(regraGlobal, "Regra global limitada de hover deve existir.");
  assert.match(regraGlobal[0], /:not\(\.abaDocumento\)/, "Abas devem ficar fora do hover global.");
  assert.match(regraGlobal[0], /:not\(\.btnFechar\)/, "Botoes X devem ficar fora do hover global.");
  assert.match(regraGlobal[0], /:not\(\.btnCarregarMaisDocumentos\)/, "Carregar mais deve ter hover proprio.");
});

testar("graph-client modularizado esta em uso", () => {
  assert.match(js, /from "\.\/arquivo-digital-graph-client\.js"/, "Modulo graph-client deve ser importado.");
  assert.match(js, /montarUrlItensLista\(/, "Helpers do graph-client devem ser usados.");
});

testar("handlers inline continuam ausentes no HTML", () => {
  assert.doesNotMatch(html, /\son(?:click|change|input|keydown|keyup|submit)\s*=/i);
});

console.log("Auditoria visual estatica V3.12 concluida com sucesso.");
