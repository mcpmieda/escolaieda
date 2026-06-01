# Relatorio - restaurar design e corrigir grid dos cards de acao

Data: 2026-06-01

## Diagnostico

- O grid continuava aparecendo em 5 colunas porque a regra base `.dashboard` ainda declarava `grid-template-columns: repeat(5, minmax(140px, 1fr))`.
- Outro bloco antigo, `UX_FINAL_CURTO_20260526`, tambem reaplicava `.dashboard { grid-template-columns: repeat(5, minmax(130px, 1fr)); }`.
- Como `.dashboardAcoes` tambem possui a classe `.dashboard`, o navegador real podia continuar exibindo a secao como 5 colunas.
- A regra responsiva de `max-width: 1100px` ja tinha sido ajustada, mas as regras base antigas ainda eram amplas demais.
- O visual grosseiro vinha da estrutura diferente do Historico e das classes introduzidas no commit `12aedd2`, que deixavam o card mais parecido com um botao do que com o card anterior da Central.

## Design restaurado

- A Central de Duplicidades da tela inicial voltou a usar uma estrutura de card leve:
  - titulo com marcador vertical;
  - descricao normal;
  - botao pequeno "Abrir Central";
  - resumo abaixo.
- O destaque de alerta segue condicionado aos estados existentes `.comAlerta` e `.discreta`.
- A Central de Duplicidades aberta nao foi alterada.

## Historico como card irmao

- O card de Historico passou a usar a mesma estrutura visual da Central:
  - titulo "Central de historico";
  - marcador vertical;
  - descricao normal;
  - acao pequena "Abrir Central".
- A cor do Historico permanece verde/azulada, sem copiar o alerta da duplicidade.
- O Historico Geral aberto nao foi alterado.

## Regras removidas/substituidas

- `.dashboard` foi substituido por `.dashboard:not(.dashboardAcoes)` na regra base de 5 colunas.
- O bloco `UX_FINAL_CURTO_20260526` tambem passou a usar `.dashboard:not(.dashboardAcoes)`.
- Regras compactas que aplicavam padding/min-height genericos a `.dashboard > .cardDash` e `.dashboard .centralDuplicidades` foram restringidas para nao atingir `.dashboardAcoes`.
- `.dashboard.dashboardAcoes` ficou com regra propria de 2 colunas:
  - `display: grid`;
  - `grid-template-columns: repeat(2, minmax(0, 1fr))`;
  - `width: 100%`;
  - `gap: 12px`;
  - `align-items: stretch`.
- Filhos diretos de `.dashboardAcoes` receberam largura, margem e `grid-column` normalizados.

## Escopo preservado

- Nao houve alteracao em JS.
- Nao houve alteracao em login/MSAL, Graph/SharePoint, upload, painel lateral, contadores, Central aberta ou Historico aberto.

## Arquivos alterados

- `arquivo-digital/index.html`
- `arquivo-digital/arquivo-digital.css`

## Validacoes executadas

- `node scripts/validar-arquivo-digital.mjs` antes das alteracoes.
- `node scripts/validar-arquivo-digital.mjs` apos as alteracoes.
- `git diff --check` sem erro; apenas aviso normal de normalizacao CRLF do Git no Windows.
- `git status --short` apos as alteracoes.

## Testes recomendados

- Em notebook com largura proxima de 974px, confirmar que `.dashboardAcoes` mostra exatamente 2 colunas.
- Confirmar que Central de Duplicidades e Central de historico possuem mesma largura e altura visual.
- Confirmar que o card da Central recuperou o visual leve com marcador vertical.
- Confirmar que o Historico nao tem botao gigante nem descricao em negrito pesado.
- Abrir a Central de Duplicidades e o Historico Geral para confirmar que os paineis abertos nao foram afetados.
