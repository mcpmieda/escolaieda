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
  assert.equal(botoesFechar.length, 5, "Todos os cinco botoes X devem usar btnFechar.");
  botoesFechar.forEach(match => {
    assert.match(match[0], /aria-label=/, "Botao X precisa de aria-label.");
  });
  assert.match(css, /INICIO_CARDS_E_FECHAR_PADRONIZADOS_20260818[\s\S]*?button\.btnFechar\s*\{[\s\S]*?width:\s*36px\s*!important;[\s\S]*?height:\s*36px\s*!important;[\s\S]*?border-radius:\s*999px\s*!important;/, "Botoes X devem compartilhar tamanho e formato finais.");
  const blocoOficial = css.slice(css.indexOf("/* INICIO_CARDS_E_FECHAR_PADRONIZADOS_20260818 */"));
  const cssAnterior = css.slice(0, css.indexOf("/* INICIO_CARDS_E_FECHAR_PADRONIZADOS_20260818 */"));
  assert.equal((blocoOficial.match(/button\.btnFechar\s*\{/g) || []).length, 1, "Visual base dos X deve ter uma unica regra oficial.");
  assert.doesNotMatch(cssAnterior, /(?:^|\n)\s*(?:\.btnFechar(?:Upload)?|\.centralConfiguracoes \.btnFechar)\s*\{/, "Regras visuais antigas dos X devem ser removidas.");
});

testar("selos semanticos dos cards preservam as cores no hover", () => {
  const blocoBaseSelos = css.match(/button\.itemArquivo \.seloGaveta,[\s\S]*?\n\s*}/)?.[0] || "";
  assert.ok(blocoBaseSelos, "Bloco estrutural dos selos deve existir.");
  assert.doesNotMatch(blocoBaseSelos, /\n\s*(?:border|background|color):/, "Bloco estrutural nao deve impor uma cor semantica a todos os selos.");
  assert.match(css, /span:not\(\.seloGaveta\):not\(\.seloLixeiraRecente\):not\(\.seloNomeRepetido\):not\(\.tagAtivo\):not\(\.tagArquivado\):not\(\.statusRecenteArquivo\)/, "Hover generico deve excluir todos os selos semanticos.");
  assert.match(css, /button\.itemArquivo \.seloNomeRepetido,[\s\S]*?button\.itemArquivo:hover:not\(:disabled\) \.seloNomeRepetido,[\s\S]*?background:\s*#fef3c7\s*!important;/, "Nome igual deve permanecer amarelo no repouso e no hover.");
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

testar("botoes de gaveta em configuracoes mantem texto legivel no hover", () => {
  assert.match(css, /\.acoesGavetaConfiguracao button\.secundario:hover:not\(:disabled\),[\s\S]*?color:\s*#0f2f66;/, "Botao editar gaveta deve preservar contraste no hover.");
  assert.match(css, /\.acoesGavetaConfiguracao button\.perigo:hover:not\(:disabled\),[\s\S]*?color:\s*#ffffff;/, "Botao excluir gaveta deve preservar contraste no hover.");
});

testar("graph-client modularizado esta em uso", () => {
  assert.match(js, /from "\.\/arquivo-digital-graph-client\.js"/, "Modulo graph-client deve ser importado.");
  assert.match(js, /montarUrlItensLista\(/, "Helpers do graph-client devem ser usados.");
});

testar("handlers inline continuam ausentes no HTML", () => {
  assert.doesNotMatch(html, /\son(?:click|change|input|keydown|keyup|submit)\s*=/i);
});

console.log("Auditoria visual estatica V3.12 concluida com sucesso.");
