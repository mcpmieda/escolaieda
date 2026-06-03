import assert from "node:assert/strict";
import {
  filtroCampoIgual,
  filtroCamposIguais,
  montarUrlItensLista,
  valorFiltroOData
} from "../arquivo-digital/arquivo-digital-graph-client.js";

function testar(nome, funcao) {
  funcao();
  console.log(`OK - ${nome}`);
}

testar("valorFiltroOData escapa aspas simples", () => {
  assert.equal(valorFiltroOData("D'Ávila"), "D''Ávila");
});

testar("filtroCampoIgual monta filtro de campo Graph codificado", () => {
  assert.equal(
    decodeURIComponent(filtroCampoIgual("ARQUIVO_ID", "abc'123")),
    "fields/ARQUIVO_ID eq 'abc''123'"
  );
});

testar("filtroCamposIguais combina criterios com and", () => {
  assert.equal(
    decodeURIComponent(filtroCamposIguais({ STATUS: "IGNORADO", TIPO_ALERTA: "DUPLICADO" })),
    "fields/STATUS eq 'IGNORADO' and fields/TIPO_ALERTA eq 'DUPLICADO'"
  );
});

testar("montarUrlItensLista preserva expand, filtro e top", () => {
  const url = montarUrlItensLista("site-id", "lista-id", ["Title", "ARQUIVO_ID"], {
    filtro: filtroCampoIgual("ARQUIVO_ID", "abc"),
    top: 1
  });

  assert.equal(
    url,
    "https://graph.microsoft.com/v1.0/sites/site-id/lists/lista-id/items?$expand=fields($select=Title,ARQUIVO_ID)&$filter=fields%2FARQUIVO_ID%20eq%20'abc'&$top=1"
  );
});

console.log("Testes do graph-client do Arquivo Digital concluidos com sucesso.");
