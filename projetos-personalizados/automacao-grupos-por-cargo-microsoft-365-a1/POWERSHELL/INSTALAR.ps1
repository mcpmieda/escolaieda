param(
    [Parameter(Mandatory = $false)]
    [string]$ConfigPath = "$PSScriptRoot\CONFIG.local.psd1",

    [ValidateSet('Preflight','Discovery','Bootstrap')]
    [string]$Stage = 'Bootstrap',

    [switch]$InstallMissingModules
)

$ErrorActionPreference = 'Stop'

Write-Host ''
Write-Host '============================================================'
Write-Host ' INSTALADOR | Automação de Grupos por Cargo'
Write-Host '============================================================'
Write-Host "Etapa: $Stage"
Write-Host ''

$preflight = Join-Path $PSScriptRoot '00-preflight.ps1'
$discovery = Join-Path $PSScriptRoot '01-descobrir-tenant.ps1'
$plan      = Join-Path $PSScriptRoot 'GERAR-PLANO.ps1'

foreach ($script in @($preflight,$discovery,$plan)) {
    if (-not (Test-Path $script)) { throw "Script ausente: $script" }
}

switch ($Stage) {
    'Preflight' {
        & $preflight -ConfigPath $ConfigPath -InstallMissingModules:$InstallMissingModules
        if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw 'Preflight falhou.' }
    }

    'Discovery' {
        & $preflight -ConfigPath $ConfigPath -InstallMissingModules:$InstallMissingModules
        & $discovery -ConfigPath $ConfigPath
    }

    'Bootstrap' {
        & $preflight -ConfigPath $ConfigPath -InstallMissingModules:$InstallMissingModules
        & $discovery -ConfigPath $ConfigPath
        & $plan -ConfigPath $ConfigPath

        Write-Host ''
        Write-Host '============================================================'
        Write-Host ' BOOTSTRAP CONCLUÍDO'
        Write-Host '============================================================'
        Write-Host ''
        Write-Host 'Foram gerados localmente:'
        Write-Host '  output-local\tenant-discovery.local.json'
        Write-Host '  output-local\deployment-plan.local.json'
        Write-Host ''
        Write-Host 'Esses arquivos contêm IDs internos do tenant e NÃO devem ser commitados.'
        Write-Host ''
        Write-Host 'Próximos checkpoints do método semi-automático:'
        Write-Host '  1. Validar/criar as três listas SharePoint.'
        Write-Host '  2. Criar/autorizar conexões Office 365 Users, SharePoint e Office 365 Groups.'
        Write-Host '  3. Garantir que o fluxo esteja em uma Solution.'
        Write-Host '  4. Resolver Connection References.'
        Write-Host '  5. Exportar clientdata atual para backup.'
        Write-Host '  6. Validar e implantar definição com backup/rollback.'
        Write-Host '  7. Rodar piloto antes de hardening.'
        Write-Host ''
        Write-Host 'Consulte INSTALADOR_MULTI_TENANT.md para a sequência completa.'
        Write-Host ''
        Write-Host 'RESULTADO_FINAL=BOOTSTRAP_MULTI_TENANT_OK'
    }
}
