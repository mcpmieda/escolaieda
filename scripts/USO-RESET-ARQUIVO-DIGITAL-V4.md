# Reset Arquivo Digital V4

Use somente antes da entrada oficial dos 6 mil+ arquivos.

## Conferir sem apagar

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\reset-arquivo-digital-v4.ps1 -Mode DryRun
```

## Reset automatico seguro autorizado

Envia documentos e itens de apoio para a Lixeira do SharePoint, incluindo a lixeira interna `_ARQUIVADOS`.

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\reset-arquivo-digital-v4.ps1 -Mode ResetSeguro -IncluirLixeira -EnviarParaLixeiraSharePoint
```

## Avisos

- Conferir os relatorios em `diagnosticos/reset-v4-YYYYMMDD-HHMMSS/`.
- Nao usar durante operacao normal da Secretaria.
- A Lixeira do SharePoint ainda pode permitir recuperacao conforme retencao do SharePoint.
- O script nao apaga listas, bibliotecas, colunas, gavetas, permissoes ou grupos.
- O script nao faz exclusao definitiva nesta fase.
