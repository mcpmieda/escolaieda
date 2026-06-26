# Retencao do Historico do Arquivo Digital V1

Use esta rotina para manter a lista `HISTORICO_ACESSOS` leve sem apagar PDFs, anotacoes atuais, gavetas, listas, colunas ou permissoes.

## Politica padrao

- `VISUALIZOU`: pode ser arquivado apos 180 dias.
- `ANOTACAO`: pode ser arquivado apos 730 dias.
- Outras acoes nao criticas: podem ser arquivadas apos 730 dias.
- Acoes criticas ficam preservadas por padrao: `ENVIOU`, `RENOMEOU`, `SUBSTITUIU`, `MESCLOU`, `ARQUIVOU`, `RESTAUROU`, `ALTEROU_GAVETA`.
- Acoes criticas so entram na retencao se o operador usar `-IncluirOperacoesCriticasMuitoAntigas`.

## Simular sem remover

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\retencao-historico-arquivo-digital-v1.ps1 -Mode DryRun
```

O `DryRun` conecta no SharePoint, le a lista e cria relatorios em:

```text
diagnosticos/retencao-historico-v1-YYYYMMDD-HHMMSS/
```

Conferir principalmente:

- `resumo-retencao-historico.md`
- `historico-arquivado.csv`
- `historico-arquivado.jsonl`
- `historico-preservado.csv`

## Execucao real em lote controlado

Use somente depois de conferir o `DryRun`.

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\retencao-historico-arquivo-digital-v1.ps1 -Mode ArquivarEEnviarLixeira -EnviarParaLixeiraSharePoint -ConfirmarRetencaoHistoricoAntigo -MaxItensPorExecucao 2000
```

A execucao real:

- grava `historico-arquivado.jsonl` e `historico-arquivado.csv` antes de remover;
- envia itens antigos para a Lixeira do SharePoint com `Remove-PnPListItem -Recycle`;
- limita o volume por execucao com `-MaxItensPorExecucao`;
- pausa entre itens para reduzir risco de throttling;
- aborta se o site conectado nao for exatamente `https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL`.

## Ajustes comuns

```powershell
# Manter visualizacoes por 1 ano
pwsh -ExecutionPolicy Bypass -File .\scripts\retencao-historico-arquivo-digital-v1.ps1 -Mode DryRun -RetencaoVisualizouDias 365

# Processar lote menor
pwsh -ExecutionPolicy Bypass -File .\scripts\retencao-historico-arquivo-digital-v1.ps1 -Mode ArquivarEEnviarLixeira -EnviarParaLixeiraSharePoint -ConfirmarRetencaoHistoricoAntigo -MaxItensPorExecucao 500
```

## Avisos

- Nao usar este script para apagar listas, bibliotecas, colunas, PDFs, anotacoes atuais, permissoes ou grupos.
- Nao executar o modo real sem revisar os arquivos gerados pelo `DryRun`.
- A Lixeira do SharePoint ainda tem sua propria retencao; a recuperacao depende da politica do SharePoint.
- Para historico com crescimento muito alto, combinar esta rotina com carregamento paginado/filtros no front-end.
