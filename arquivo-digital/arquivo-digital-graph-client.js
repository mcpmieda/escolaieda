function valorFiltroOData(valor) {
  return (valor || "").toString().replace(/'/g, "''");
}

function filtroCampoIgual(nomeCampo, valor) {
  return encodeURIComponent(`fields/${nomeCampo} eq '${valorFiltroOData(valor)}'`);
}

function filtroCamposIguais(criterios) {
  return encodeURIComponent(
    Object.entries(criterios)
      .map(([nomeCampo, valor]) => `fields/${nomeCampo} eq '${valorFiltroOData(valor)}'`)
      .join(" and ")
  );
}

function montarUrlItensLista(siteId, listId, campos, opcoes = {}) {
  const parametros = [
    `$expand=fields($select=${campos.join(",")})`,
    opcoes.filtro ? `$filter=${opcoes.filtro}` : "",
    `$top=${opcoes.top || 100}`
  ].filter(Boolean);

  return `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?${parametros.join("&")}`;
}

export {
  filtroCampoIgual,
  filtroCamposIguais,
  montarUrlItensLista,
  valorFiltroOData
};
