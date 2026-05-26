# RELATORIO FASE 2 - REMOVER FILTROS DAS GUIAS - 2026-05-27

## Escopo executado

Arquivo alterado:

- `arquivo-digital/index.html`

Backup criado antes da alteracao:

- `backups_locais/index_antes_fase2_remover_filtros_20260527.html`

## Alteracoes realizadas

1. Interface de filtros removida

- Removido o bloco visual `.barraFiltros`.
- Removido o botao `Filtros avançados`.
- Removido o botao `Limpar filtros`.
- Removido o indicador visual `indicadorFiltrosAtivos`.
- Removido o painel `#filtrosAvancados` com os botoes:
  - `Sem gaveta`
  - `Com anotação`
  - `Com duplicidade`
  - `Enviados recentemente`
  - `Alterados recentemente`

2. Estado interno protegido contra filtros invisiveis

- Criada funcao `filtrosAvancadosPadrao()`.
- Criada funcao `limparFiltrosAvancadosOcultos()`.
- As funcoes antigas `alternarFiltrosAvancados()` e `aplicarFiltroRapido()` foram preservadas por compatibilidade, mas agora apenas limpam filtros.
- `atualizarBotoesFiltros()` tambem limpa qualquer filtro avancado e nao exibe indicador.

3. Busca e guias preservadas

- A busca continua chamando `filtrarDocumentos()` no `oninput`.
- As guias continuam chamando:
  - `mostrarDocumentosRecentes()`
  - `mostrarDocumentosAtivos()`
  - `mostrarDocumentosLixeira()`
- A guia Gavetas continua usando `filtroGavetaAtual`, pois esse estado e necessario para selecionar uma gaveta especifica.

4. Aplicacao de filtros simplificada

- `aplicarFiltrosAvancados(lista)` agora aplica somente `filtroGavetaAtual` quando a guia atual e `ativos`.
- Filtros avancados ocultos nao afetam mais resultados.

## Areas preservadas

- Login/MSAL.
- `clientId`, `tenantId`, `siteId` e IDs das listas.
- Permissoes SharePoint/Graph.
- Upload interno.
- Mesclar, substituir, lixeira/restaurar.
- Anotacoes.
- Historico individual.
- Logica da Central de Duplicidades.

## Validacoes

- `git diff --check`: OK.
- Sintaxe JS como modulo com `node --experimental-vm-modules`: OK.
- Busca textual confirmou ausencia dos textos visuais:
  - `Filtros avançados`
  - `Limpar filtros`
  - `Sem gaveta`
  - `Com anotação`
  - `Com duplicidade`
- Busca textual confirmou preservacao de:
  - `filtrarDocumentos`
  - `mostrarDocumentosRecentes`
  - `mostrarDocumentosAtivos`
  - `mostrarDocumentosLixeira`
  - `filtrarPorGaveta`
  - `filtroGavetaAtual`

## Resultado

Fase 2 concluida. A interface de filtros foi removida e os filtros avancados foram neutralizados para nao ficarem ativos de forma invisivel.

Commit sugerido:

- `Remover filtros visuais das guias`
