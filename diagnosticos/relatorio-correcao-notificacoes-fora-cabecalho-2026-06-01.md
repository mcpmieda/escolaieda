# Relatorio - notificacoes fora do cabecalho

Data: 2026-06-01

## Diagnostico

A notificacao ainda aparecia no cabecalho porque o CSS final de mensagens forçava os elementos:

- `#mensagemSistema.mensagem`
- `#mensagemSistema.mensagem.erroBox`
- `#mensagemPainel.mensagemPainel`
- `#mensagemPainel.mensagemPainel.erroPainel`

com `position: fixed !important` e coordenadas no topo da tela:

- `#mensagemSistema`: `top: 14px !important`
- `#mensagemPainel`: `top: 74px !important`
- mobile do `#mensagemPainel`: `top: 72px !important`

Como o cabecalho fica no topo da pagina, essas regras mantinham a notificacao visualmente sobre o cabecalho, mesmo quando a rolagem ou outros ajustes de layout mudavam.

## Correcao aplicada

A regra existente foi corrigida na origem:

- `#mensagemSistema` agora usa `top: auto !important` e `bottom: 24px !important`;
- `#mensagemPainel` agora usa `top: auto !important` e `bottom: 88px !important`;
- no mobile, `#mensagemPainel` usa `top: auto !important` e `bottom: 82px !important`.

Isso mantem as mensagens como notificacoes sobrepostas, mas ancoradas na parte inferior da viewport, fora da area do cabecalho.

## Escopo

Nao houve alteracao em JavaScript, login, MSAL, Graph/SharePoint, upload session, lixeira/restauracao, anotacoes/eTag, mesclagem, gavetas ou permissoes.

## Validacoes

- `node scripts/validar-arquivo-digital.mjs`: OK
- `git diff --check`: OK

Como nao houve alteracao em JavaScript, `node --check arquivo-digital/arquivo-digital.js` nao foi necessario.
