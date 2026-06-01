# Relatorio - correcao do hover antigo dos botoes

Data: 2026-06-01

## Diagnostico

Foi feita varredura em `arquivo-digital/arquivo-digital.css` e `arquivo-digital/index.html` por regras e usos relacionados a:

- `button:hover`
- `button:not(...):hover`
- `.btn:hover`
- `.acoes button:hover`
- botoes da Central de Upload
- botoes de confirmacao/cancelamento
- botoes "Continuar enviando" e "Sair sem enviar"

## Regra encontrada

A regra que ainda podia afetar o botao "Sair sem enviar" era:

```css
button:not(...):hover:not(:disabled)
```

Ela esta identificada no CSS como `REGRA_GLOBAL_BUTTON_HOVER_LIMITADA_20260527`. Apesar de ja estar limitada para varios componentes, os botoes do aviso de fechamento da Central de Upload usavam apenas as classes genericas `principal` e `secundario`, sem uma classe propria para ficarem fora do hover global.

## Botoes afetados

Antes da correcao, os botoes do bloco `.confirmacaoFecharUploadAcoes` podiam ser atingidos pela regra global:

- "Continuar enviando"
- "Sair sem enviar"

Tambem foram verificados os hovers especificos ja existentes para:

- botoes secundarios da Central de Upload (`.centralUpload .btnUploadSecundario`);
- botao "Enviar PDF(s)" (`#btnConfirmarUploadCentral`);
- botao "Configuracoes" do cabecalho (`#btnAbrirConfiguracoesTopo.btnConfiguracoesTopo`);
- acoes do painel lateral (`#painelLateral .acoes button:hover`);
- acoes criticas do painel lateral (`#btnRenomear`, `#btnSubstituir`, `#btnArquivar`, `#btnRestaurar`, `#btnMesclar`).

Esses botoes ja tinham classe/id proprio e regras mais especificas, ou ja estavam excluidos da regra global.

## Correcao aplicada

Foram adicionadas classes especificas aos botoes de confirmacao do fechamento da Central de Upload:

- `btnConfirmacaoFecharUpload`
- `btnContinuarUpload`
- `btnSairUpload`

A regra global de hover e a regra global de active foram limitadas para nao atingir `.btnConfirmacaoFecharUpload`.

Foram criados estados escopados em `.confirmacaoFecharUploadAcoes`:

- "Continuar enviando": hover azul escuro com texto branco.
- "Sair sem enviar": hover laranja claro com texto marrom escuro.
- `focus-visible` acompanha o mesmo contraste visual do hover.
- `active` mantem apenas o deslocamento curto do clique.

Nao foi adicionado `!important`.

## Por que foi seguro

A mudanca nao altera JavaScript, fluxo da Central de Upload, upload session, Graph/SharePoint, lixeira, restauracao, anotacoes, eTag, mesclagem ou permissoes.

O ajuste fica restrito ao HTML dos dois botoes do aviso de fechamento e ao CSS de hover/active desses botoes. A regra global antiga foi preservada para botoes que ainda dependem dela, mas deixou de atingir esse dialogo sensivel.

## Validacoes

- `node scripts/validar-arquivo-digital.mjs`: OK
- `git diff --check`: OK

Como nao houve alteracao em JavaScript, `node --check arquivo-digital/arquivo-digital.js` nao foi necessario.
