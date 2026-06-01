# Relatorio - correcao real dashboard acoes

Data: 2026-06-01

## Diagnostico encontrado

- A regra base `.dashboard` usa `grid-template-columns: repeat(5, minmax(140px, 1fr))`.
- Em notebook/PC ate `1100px`, o bloco `CSS_RESPONSIVIDADE_FASE4` trocava `.dashboard` para `repeat(3, minmax(150px, 1fr))`.
- No mesmo bloco, `.dashboard .centralDuplicidades` aplicava `grid-column: span 3`.
- Como a area de acoes tem as classes `dashboard dashboardAcoes`, ela herdava esse grid de 3 colunas no breakpoint.
- Resultado confirmado pelo navegador: `#centralDuplicidades` ocupava 3 colunas, com cerca de 540px, e `.cardHistoricoGeral` ficava preso em 1 coluna, com cerca de 176px.
- O historico tambem era um `button` com estrutura interna diferente da Central, deixando texto/botao mais grosseiros.

## Correcoes aplicadas

- A regra responsiva de `.dashboard` foi restringida para `.dashboard:not(.dashboardAcoes)`.
- A regra de span 3 foi restringida para `.dashboard:not(.dashboardAcoes) .centralDuplicidades`.
- `.dashboard.dashboardAcoes` agora declara explicitamente:
  - `display: grid`
  - `grid-template-columns: repeat(2, minmax(0, 1fr))`
  - `width: 100%`
  - `align-items: stretch`
- Os dois filhos diretos de `.dashboardAcoes` agora ficam com `grid-column: auto`, `min-width: 0`, `max-width: none`, `margin: 0` e altura equivalente.
- O empilhamento em uma coluna foi mantido apenas no breakpoint mobile existente.
- O HTML do card de historico recebeu estrutura visual equivalente com:
  - `.cardAcaoTitulo`
  - `.cardAcaoDescricao`
  - `.cardAcaoBotao`
- A Central de Duplicidades da tela inicial recebeu as mesmas classes visuais, mantendo o botao real e o handler atual.

## Regras removidas/substituidas

- Substituida a incidencia de `.dashboard` no breakpoint de `1100px` por `.dashboard:not(.dashboardAcoes)`.
- Substituida a incidencia de `.dashboard .centralDuplicidades { grid-column: span 3; }` por escopo que nao atinge `.dashboardAcoes`.
- Substituidas regras visuais antigas de titulo/botao do historico por classes comuns aos dois cards.
- Mantidas regras dos contadores e da largura geral/background, pois ja estavam aprovadas.

## Preservacao de escopo

- A Central de Duplicidades aberta nao foi alterada.
- O Historico Geral aberto nao foi alterado.
- Login, MSAL, Graph, SharePoint, upload, painel lateral e contadores nao foram alterados.

## Arquivos alterados

- `arquivo-digital/index.html`
- `arquivo-digital/arquivo-digital.css`

## Validacoes executadas

- `node scripts/validar-arquivo-digital.mjs` antes das alteracoes.
- `node scripts/validar-arquivo-digital.mjs` apos as alteracoes.
- `git diff --check` sem erro; apenas aviso normal de normalizacao CRLF do Git no Windows.
- `git status --short` apos as alteracoes.

## Testes recomendados

- No notebook/PC, confirmar que `.dashboardAcoes` tem 2 colunas iguais.
- Confirmar que `#centralDuplicidades` e `.cardHistoricoGeral` aparecem como cards irmaos.
- Confirmar que o Historico nao aparece com botao/texto grosseiros.
- Abrir a Central de Duplicidades e confirmar que o painel interno nao mudou.
- Conferir mobile para confirmar empilhamento em 1 coluna.
