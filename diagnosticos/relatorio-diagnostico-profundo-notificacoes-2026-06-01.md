# Relatorio - diagnostico profundo das notificacoes

Data: 2026-06-01

## Sintomas relatados

- No PC, nenhuma notificacao aparecia.
- No celular, a notificacao ainda aparecia na area do cabecalho.

## Causa raiz

O ajuste anterior mudou a notificacao para `bottom`, mas o elemento `#mensagemSistema` continuava dentro de `.card`.

A `.card` do layout moderno usa:

```css
body.visualModernoFase1A .card {
  overflow: hidden;
  backdrop-filter: blur(3px);
}
```

Esse conjunto e sensivel para elementos com `position: fixed` dentro do card. O `backdrop-filter` pode criar um novo contexto/bloco de contencao para descendentes fixos, e o `overflow: hidden` pode recortar o conteudo. Na pratica, a notificacao deixou de ser um overlay real da viewport e ficou condicionada ao card.

Isso explica:

- desktop: a notificacao ancorada em `bottom` podia ficar recortada/fora da area visivel do card;
- celular: a notificacao continuava parecendo vinculada ao topo/cabecalho porque o elemento ainda estava preso ao fluxo/contexto visual do card.

Tambem foi encontrado um detalhe secundario: `mostrarMensagem()` aplicava `display: block`, enquanto o CSS do componente `.mensagem` foi construido como `display: flex`. Isso nao era a causa principal do sumico, mas deixava o estado exibido diferente do estado visual esperado.

## Correcao aplicada

1. `#mensagemSistema` foi movido para ser filho direto do `body`, antes da `.card`.
2. O ponto antigo dentro da `.card` foi removido.
3. `mostrarMensagem()` passou a exibir a notificacao com `display: flex`, preservando o layout previsto pelo CSS.

O CSS de posicionamento inferior ja existente foi mantido:

- `#mensagemSistema`: `bottom: 24px`
- `#mensagemPainel`: `bottom: 88px`
- mobile do painel: `bottom: 82px`

## Por que esta correcao e mais segura

A notificacao global deixa de depender da estrutura interna da pagina e passa a funcionar como overlay real da viewport. Isso evita conflito com:

- cabecalho;
- `.card`;
- `overflow: hidden`;
- `backdrop-filter`;
- altura variavel do conteudo;
- diferencas entre desktop e mobile.

## Escopo preservado

Nao houve alteracao em login, MSAL, Graph/SharePoint, upload session, lixeira/restauracao, anotacoes/eTag, mesclagem, gavetas ou permissoes.

## Validacoes

- `node --check arquivo-digital/arquivo-digital.js`: OK
- `node scripts/validar-arquivo-digital.mjs`: OK
- `git diff --check`: OK
