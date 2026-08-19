param(
    [Parameter(Mandatory)]
    [string]$TenantId,

    [Parameter(Mandatory)]
    [string]$DataverseUrl,

    [Parameter(Mandatory)]
    [Guid]$WorkflowId,

    [Parameter(Mandatory = $false)]
    [string]$OutputFolder = "$PSScriptRoot\output-local"
)

$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'lib\DataverseFlowTools.psm1'
if (-not (Test-Path $modulePath)) {
    throw "Módulo ausente: $modulePath"
}

Import-Module $modulePath -Force

Write-Host ''
Write-Host '============================================================'
Write-Host ' EXPORTAR CLIENTDATA | Modern Flow'
Write-Host '============================================================'

$context = Connect-DataverseFlowContext -TenantId $TenantId -DataverseUrl $DataverseUrl

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outputPath = Join-Path $OutputFolder "flow-clientdata-BACKUP-$timestamp.json"

$result = Export-DataverseModernFlowClientData `
    -Context $context `
    -WorkflowId $WorkflowId `
    -OutputPath $outputPath

$result | Format-List

Write-Host ''
Write-Host 'ATENÇÃO: esse arquivo contém identificadores internos do tenant.'
Write-Host 'Não commitar em repositório público.'
Write-Host ''
Write-Host 'RESULTADO_FINAL=EXPORT_CLIENTDATA_OK'
