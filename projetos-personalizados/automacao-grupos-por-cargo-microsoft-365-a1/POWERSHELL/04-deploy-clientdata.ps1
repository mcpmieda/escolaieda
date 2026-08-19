param(
    [Parameter(Mandatory)]
    [string]$TenantId,

    [Parameter(Mandatory)]
    [string]$DataverseUrl,

    [Parameter(Mandatory)]
    [Guid]$WorkflowId,

    [Parameter(Mandatory)]
    [string]$CandidateClientDataPath,

    [Parameter(Mandatory = $false)]
    [string]$ExpectedFlowName,

    [Parameter(Mandatory = $false)]
    [string]$BackupFolder = "$PSScriptRoot\output-local",

    [int]$MaximumDepth = 8,

    [switch]$ConfirmWrite
)

$ErrorActionPreference = 'Stop'

if (-not $ConfirmWrite) {
    throw 'Escrita bloqueada. Execute novamente com -ConfirmWrite após revisar os parâmetros.'
}

if (-not (Test-Path $CandidateClientDataPath)) {
    throw "CandidateClientDataPath não encontrado: $CandidateClientDataPath"
}

$flowToolsPath = Join-Path $PSScriptRoot 'lib\FlowDefinitionTools.psm1'
$dataverseToolsPath = Join-Path $PSScriptRoot 'lib\DataverseFlowTools.psm1'

foreach ($path in @($flowToolsPath,$dataverseToolsPath)) {
    if (-not (Test-Path $path)) { throw "Módulo ausente: $path" }
}

Import-Module $flowToolsPath -Force
Import-Module $dataverseToolsPath -Force

Write-Host ''
Write-Host '============================================================'
Write-Host ' DEPLOY CLIENTDATA | Modern Flow'
Write-Host '============================================================'

Write-Host '[1/8] Validando candidato local...'
$candidateJson = Get-Content $CandidateClientDataPath -Raw
$candidateValidation = Assert-FlowClientData -ClientDataJson $candidateJson -MaximumDepth $MaximumDepth
Write-Host "[OK] Profundidade candidata: $($candidateValidation.MaximumDepth)"

Write-Host '[2/8] Autenticando no Dataverse...'
$context = Connect-DataverseFlowContext -TenantId $TenantId -DataverseUrl $DataverseUrl

Write-Host '[3/8] Lendo fluxo atual...'
$current = Get-DataverseModernFlow -Context $context -WorkflowId $WorkflowId

if ([int]$current.category -ne 5) {
    throw 'Workflow informado não é category=5 (Modern Flow).'
}

if (-not [string]::IsNullOrWhiteSpace($ExpectedFlowName)) {
    if ([string]$current.name -ne $ExpectedFlowName) {
        throw "Nome do fluxo não confere. Esperado '$ExpectedFlowName'; encontrado '$($current.name)'."
    }
}

if ([string]::IsNullOrWhiteSpace([string]$current.clientdata)) {
    throw 'Fluxo atual está sem clientdata.'
}

$currentValidation = Assert-FlowClientData -ClientDataJson $current.clientdata -MaximumDepth $MaximumDepth
Write-Host "[OK] Fluxo atual válido. Profundidade: $($currentValidation.MaximumDepth)"

Write-Host '[4/8] Criando backup obrigatório...'
New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = Join-Path $BackupFolder "flow-clientdata-BACKUP-preDeploy-$timestamp.json"
$current.clientdata | Set-Content -Path $backupPath -Encoding UTF8
Write-Host "[OK] Backup: $backupPath"

$clientAlterado = $false
$wasActive = ([int]$current.statecode -eq 1)

try {
    Write-Host '[5/8] Desativando fluxo temporariamente...'
    if ($wasActive) {
        Set-DataverseModernFlowState -Context $context -WorkflowId $WorkflowId -State Inactive
        Start-Sleep -Seconds 4
    }

    $off = Get-DataverseModernFlow -Context $context -WorkflowId $WorkflowId
    if ([int]$off.statecode -ne 0) {
        throw 'Não foi possível confirmar o fluxo inativo antes do PATCH.'
    }

    Write-Host '[6/8] Aplicando clientdata candidato...'
    Set-DataverseModernFlowClientData -Context $context -WorkflowId $WorkflowId -ClientData $candidateJson
    $clientAlterado = $true

    Write-Host '[7/8] Validando definição salva no servidor...'
    $after = Get-DataverseModernFlow -Context $context -WorkflowId $WorkflowId
    $serverValidation = Assert-FlowClientData -ClientDataJson $after.clientdata -MaximumDepth $MaximumDepth

    Write-Host "[OK] Servidor válido. Profundidade: $($serverValidation.MaximumDepth)"

    Write-Host '[8/8] Reativando fluxo...'
    Set-DataverseModernFlowState -Context $context -WorkflowId $WorkflowId -State Active
    Start-Sleep -Seconds 4

    $final = Get-DataverseModernFlow -Context $context -WorkflowId $WorkflowId
    if ([int]$final.statecode -ne 1) {
        throw 'Não foi possível confirmar o fluxo ativo após o deploy.'
    }

    [PSCustomObject]@{
        FlowName          = $final.name
        CandidateValid    = $candidateValidation.Valid
        ServerValid       = $serverValidation.Valid
        MaximumDepth      = $serverValidation.MaximumDepth
        RunAfterIssues    = @($serverValidation.RunAfterIssues).Count
        FlowActive        = $true
        BackupPath        = $backupPath
        RollbackNeeded    = $false
    } | Format-List

    Write-Host ''
    Write-Host 'RESULTADO_FINAL=DEPLOY_CLIENTDATA_OK'
}
catch {
    $originalError = $_

    Write-Host ''
    Write-Host "ERRO: $($originalError.Exception.Message)"
    Write-Host 'Executando rollback...'

    try {
        if ($clientAlterado) {
            Set-DataverseModernFlowClientData -Context $context -WorkflowId $WorkflowId -ClientData $current.clientdata
            Write-Host '[OK] clientdata anterior restaurado.'
        }

        Set-DataverseModernFlowState -Context $context -WorkflowId $WorkflowId -State Active
        Write-Host '[OK] fluxo garantido como ativo.'
    }
    catch {
        Write-Host "FALHA NO ROLLBACK: $($_.Exception.Message)"
    }

    throw $originalError
}
