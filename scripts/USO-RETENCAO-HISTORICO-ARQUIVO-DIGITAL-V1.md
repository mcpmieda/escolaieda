# Retencao do Historico do Arquivo Digital V1

Use esta rotina para manter a lista `HISTORICO_ACESSOS` leve sem apagar PDFs, anotacoes atuais, gavetas, listas, colunas ou permissoes.

## Estrategia de longo prazo

O modelo adotado e:

- historico quente no SharePoint para uso diario e auditoria humana recente;
- historico frio fora da lista ativa, particionado por ano e mes;
- manifesto com SHA-256 para conferir integridade dos arquivos arquivados;
- consulta sob demanda por script, sem carregar tudo no navegador.

O arquivo frio oficial fica por padrao em:

```text
backups_locais/arquivo-digital/historico-frio/
```

Essa pasta fica fora do Git.

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
- `manifest-retencao-YYYYMMDD-HHMMSS.json`
- `previsualizacao-arquivo-frio/`

## Execucao real em lote controlado

Use somente depois de conferir o `DryRun`.

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\retencao-historico-arquivo-digital-v1.ps1 -Mode ArquivarEEnviarLixeira -EnviarParaLixeiraSharePoint -ConfirmarRetencaoHistoricoAntigo -MaxItensPorExecucao 2000
```

A execucao real:

- grava `historico-arquivado.jsonl` e `historico-arquivado.csv` antes de remover;
- grava o arquivo frio oficial particionado por ano/mes antes de remover;
- grava manifesto com SHA-256 em `_manifestos/`;
- atualiza `_manifestos/indice-retencoes.jsonl`;
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

## Consultar historico frio

```powershell
# Ultimos resultados arquivados de um arquivo especifico
pwsh -ExecutionPolicy Bypass -File .\scripts\consultar-historico-frio-arquivo-digital-v1.ps1 -ArquivoId "ID_DO_ARQUIVO" -Limite 100

# Buscar por periodo e acao
pwsh -ExecutionPolicy Bypass -File .\scripts\consultar-historico-frio-arquivo-digital-v1.ps1 -Inicio 2024-01-01 -Fim 2024-12-31 -Acao VISUALIZOU -Limite 200 -ExportarCsv

# Buscar por usuario
pwsh -ExecutionPolicy Bypass -File .\scripts\consultar-historico-frio-arquivo-digital-v1.ps1 -UsuarioEmail "usuario@dominio" -Limite 200
```

## Avisos

- Nao usar este script para apagar listas, bibliotecas, colunas, PDFs, anotacoes atuais, permissoes ou grupos.
- Nao executar o modo real sem revisar os arquivos gerados pelo `DryRun`.
- A Lixeira do SharePoint ainda tem sua propria retencao; a recuperacao depende da politica do SharePoint.
- Para venda futura do sistema, o arquivo frio deve ser copiado para armazenamento com backup e retencao propria, como SharePoint dedicado, Azure Blob, S3 ou outro storage institucional.
