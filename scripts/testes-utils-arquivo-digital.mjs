import assert from "node:assert/strict";
import {
  escaparHtml,
  limparNomeArquivoPdf,
  nomeArquivoSemExtensaoVisual,
  nomeArquivoVisualLimpo,
  sanitizarNomeArquivo
} from "../arquivo-digital/arquivo-digital-utils.js";

function testar(nome, funcao) {
  try {
    funcao();
    console.log(`OK - ${nome}`);
  } catch (erro) {
    console.error(`FALHOU - ${nome}`);
    throw erro;
  }
}

testar("nomeArquivoSemExtensaoVisual remove apenas .pdf final", () => {
  assert.equal(nomeArquivoSemExtensaoVisual("Aluno.pdf"), "Aluno");
  assert.equal(nomeArquivoSemExtensaoVisual("Aluno.PDF"), "Aluno");
  assert.equal(nomeArquivoSemExtensaoVisual("Aluno.pdf antigo"), "Aluno.pdf antigo");
  assert.equal(nomeArquivoSemExtensaoVisual(""), "");
  assert.equal(nomeArquivoSemExtensaoVisual(null), "");
});

testar("nomeArquivoVisualLimpo remove .pdf e sufixo visual de duplicidade", () => {
  assert.equal(nomeArquivoVisualLimpo("Maria Silva (2).pdf"), "Maria Silva");
  assert.equal(nomeArquivoVisualLimpo("Maria Silva (10).PDF"), "Maria Silva");
  assert.equal(nomeArquivoVisualLimpo("Maria Silva (1).pdf"), "Maria Silva (1)");
  assert.equal(nomeArquivoVisualLimpo("Maria Silva"), "Maria Silva");
});

testar("sanitizarNomeArquivo limpa caracteres invalidos e garante .pdf", () => {
  assert.equal(sanitizarNomeArquivo("Aluno: 01"), "Aluno 01.pdf");
  assert.equal(sanitizarNomeArquivo(" Pasta / Aluno?.pdf "), "Pasta Aluno .pdf");
  assert.equal(sanitizarNomeArquivo("relatorio.PDF"), "relatorio.PDF");
  assert.equal(sanitizarNomeArquivo(""), ".pdf");
});

testar("limparNomeArquivoPdf prepara nome de upload em caixa alta", () => {
  assert.equal(limparNomeArquivoPdf("Aluno: 01"), "ALUNO 01.PDF");
  assert.equal(limparNomeArquivoPdf(" Pasta / Aluno?.pdf "), "PASTA ALUNO .PDF");
  assert.equal(limparNomeArquivoPdf(""), "DOCUMENTO.PDF");
  assert.equal(limparNomeArquivoPdf(null), "DOCUMENTO.PDF");
});

testar("escaparHtml escapa caracteres basicos de HTML", () => {
  assert.equal(escaparHtml("<script>alert(\"x\")</script>"), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  assert.equal(escaparHtml("A&B"), "A&amp;B");
  assert.equal(escaparHtml("'aspas'"), "&#39;aspas&#39;");
  assert.equal(escaparHtml(null), "");
});

console.log("Testes de utilitarios do Arquivo Digital concluidos com sucesso.");
