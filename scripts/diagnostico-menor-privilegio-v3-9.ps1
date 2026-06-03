param(
  [string]$Saida = ""
)

$ErrorActionPreference = "Stop"

function Add-Linha {
  param(
    [System.Collections.Generic.List[string]]$Linhas,
    [string]$Texto = ""
  )

  $Linhas.Add($Texto) | Out-Null
}

$raizProjeto = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$arquivoJs = Join-Path $raizProjeto "arquivo-digital\arquivo-digital.js"
$pastaDiagnosticos = Join-Path $raizProjeto "diagnosticos"
if (-not $Saida) {
  $Saida = Join-Path $pastaDiagnosticos ("relatorio-menor-privilegio-v3-9-{0}.md" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
}

if (-not (Test-Path $pastaDiagnosticos)) {
  New-Item -ItemType Directory -Path $pastaDiagnosticos | Out-Null
}

$js = Get-Content -Raw -LiteralPath $arquivoJs
$linhas = [System.Collections.Generic.List[string]]::new()

Add-Linha $linhas "# Diagnostico V3.9 - menor privilegio"
Add-Linha $linhas ""
Add-Linha $linhas "- Gerado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Linha $linhas "- Modo: somente leitura; nao altera Entra ID, SharePoint, permissoes ou codigo de producao."
Add-Linha $linhas ""

Add-Linha $linhas "## Estado atual"
Add-Linha $linhas ""
Add-Linha $linhas "- O app e uma SPA com MSAL no navegador."
Add-Linha $linhas "- Escopos encontrados no codigo: $(if ($js -match 'Sites\.ReadWrite\.All') { 'Sites.ReadWrite.All, User.Read' } else { 'revisar manualmente' })"
Add-Linha $linhas "- Operacoes cobertas: login, leitura de listas/biblioteca, upload, substituicao, mesclagem, historico, anotacoes, alertas, versoes e lixeira."
Add-Linha $linhas ""

Add-Linha $linhas "## Impacto por fluxo"
Add-Linha $linhas ""
Add-Linha $linhas "- Login: permanece delegado via MSAL; precisa consentimento interativo do usuario."
Add-Linha $linhas "- Upload/substituicao/mesclagem: exigem escrita em biblioteca e conteudo de drive."
Add-Linha $linhas "- Historico/anotacoes/alertas: exigem leitura/escrita nas listas de apoio."
Add-Linha $linhas "- Versoes: exigem leitura de driveItem/versions."
Add-Linha $linhas "- Lixeira/restaurar: depende de mover arquivos dentro da biblioteca."
Add-Linha $linhas ""

Add-Linha $linhas "## Caminho recomendado"
Add-Linha $linhas ""
Add-Linha $linhas "- Sites.Selected e o caminho de menor privilegio para restringir a app ao site do Arquivo Digital."
Add-Linha $linhas "- Para uma SPA pura, Sites.Selected normalmente exige componente backend/app-only para receber permissao no site e intermediar chamadas sensiveis."
Add-Linha $linhas "- Nao trocar producao diretamente: criar app registration controlada, conceder permissao apenas ao site ARQUIVODIGITAL e validar em ambiente controlado."
Add-Linha $linhas "- Se for manter SPA sem backend no curto prazo, manter Sites.ReadWrite.All e compensar com grupos SharePoint, auditoria mensal e escopos revisados."
Add-Linha $linhas ""

Add-Linha $linhas "## Decisao V3.9"
Add-Linha $linhas ""
Add-Linha $linhas "- Nao implementar Sites.Selected agora para nao quebrar login, Graph, upload, historico, anotacoes, mesclagem e versoes em producao."
Add-Linha $linhas "- Registrar Sites.Selected/backend app-only como fase futura controlada."
Add-Linha $linhas "- A V3.9 fica concluida como diagnostico e plano de menor privilegio, sem alteracao real de permissao."

$linhas | Set-Content -Path $Saida -Encoding UTF8
Write-Host "Relatorio gerado: $Saida"
