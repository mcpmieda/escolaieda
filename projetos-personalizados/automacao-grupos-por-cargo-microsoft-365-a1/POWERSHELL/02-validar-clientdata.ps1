param(
    [Parameter(Mandatory)]
    [string]$ClientDataPath,

    [int]$MaximumDepth = 8
)

$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'lib\FlowDefinitionTools.psm1'
if (-not (Test-Path $modulePath)) {
    throw "Módulo ausente: $modulePath"
}

if (-not (Test-Path $ClientDataPath)) {
    throw "Arquivo não encontrado: $ClientDataPath"
}

Import-Module $modulePath -Force

$json = Get-Content $ClientDataPath -Raw
$result = Test-FlowClientData -ClientDataJson $json -MaximumDepth $MaximumDepth

Write-Host ''
Write-Host '============================================================'
Write-Host ' VALIDAÇÃO DE CLIENTDATA'
Write-Host '============================================================'

[PSCustomObject]@{
    JsonValido       = $result.JsonValid
    DefinicaoValida  = $result.Valid
    Profundidade     = $result.MaximumDepth
    Limite           = $result.DepthLimit
    RunAfterInvalidos = @($result.RunAfterIssues).Count
} | Format-List

if (@($result.RunAfterIssues).Count -gt 0) {
    Write-Host ''
    Write-Host 'Referências runAfter inválidas:'
    $result.RunAfterIssues | Format-Table Action,Dependency,Path -AutoSize
}

if (@($result.Errors).Count -gt 0) {
    Write-Host ''
    Write-Host 'Erros:'
    $result.Errors | ForEach-Object { Write-Host " - $_" }
}

if (-not $result.Valid) {
    throw 'RESULTADO_FINAL=CLIENTDATA_INVALIDO'
}

Write-Host ''
Write-Host 'RESULTADO_FINAL=CLIENTDATA_OK'
