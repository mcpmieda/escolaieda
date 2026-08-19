param(
    [Parameter(Mandatory = $false)]
    [string]$ConfigPath = "$PSScriptRoot\CONFIG.local.psd1",

    [Parameter(Mandatory = $false)]
    [string]$DiscoveryPath = "$PSScriptRoot\output-local\tenant-discovery.local.json"
)

$ErrorActionPreference = 'Stop'

function Assert-Condition {
    param([bool]$Condition,[string]$Message)
    if (-not $Condition) { throw $Message }
}

Assert-Condition (Test-Path $ConfigPath) "Configuração não encontrada: $ConfigPath"
Assert-Condition (Test-Path $DiscoveryPath) "Descoberta não encontrada: $DiscoveryPath"

$config = Import-PowerShellDataFile -Path $ConfigPath
$discovery = Get-Content $DiscoveryPath -Raw | ConvertFrom-Json

$groupMap = @{}
foreach ($group in @($discovery.Groups)) {
    $name = [string]$group.Name
    Assert-Condition (-not $groupMap.ContainsKey($name)) "Grupo duplicado no arquivo de descoberta: $name"
    $groupMap[$name] = [string]$group.Id
}

$resolvedRules = @()

foreach ($rule in @($config.Rules)) {
    $cargo = ([string]$rule.Cargo).Trim().ToLowerInvariant()
    $action = ([string]$rule.Action).Trim().ToUpperInvariant()
    $groupName = [string]$rule.Group
    $groupId = $null

    if ($action -eq 'ADICIONAR') {
        Assert-Condition ($groupMap.ContainsKey($groupName)) "Regra '$cargo' referencia grupo não resolvido: $groupName"
        $groupId = $groupMap[$groupName]
    }

    $resolvedRules += [PSCustomObject]@{
        CargoNormalizado = $cargo
        Acao             = $action
        GrupoNome        = if ([string]::IsNullOrWhiteSpace($groupName)) { $null } else { $groupName }
        GrupoID          = $groupId
        Ativo            = $true
    }
}

$outputFolder = Join-Path $PSScriptRoot $config.Installer.OutputFolder
New-Item -ItemType Directory -Path $outputFolder -Force | Out-Null
$outputPath = Join-Path $outputFolder 'deployment-plan.local.json'

$plan = [ordered]@{
    GeneratedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    ConfigVersion  = $config.Installer.ConfigVersion
    Tenant = [ordered]@{
        OrganizationId   = $discovery.Organization.Id
        OrganizationName = $discovery.Organization.DisplayName
        PrimaryDomain    = $config.Tenant.PrimaryDomain
        AdminUpn         = $config.Tenant.AdminUpn
    }
    SharePoint = [ordered]@{
        SiteUrl = $config.SharePoint.SiteUrl
        Lists   = $config.SharePoint.Lists
    }
    Flow = [ordered]@{
        DisplayName         = $config.Flow.DisplayName
        RecurrenceMinutes   = $config.Flow.RecurrenceMinutes
        ReconciliationHours = $config.Flow.ReconciliationHours
        AddOnly             = $config.Flow.AddOnly
    }
    Groups = @($discovery.Groups)
    Rules  = $resolvedRules
    Security = $config.Security
    Validation = [ordered]@{
        GroupsResolved = @($discovery.Groups).Count
        RulesResolved  = $resolvedRules.Count
        UnmappedCargoValuesFoundDuringDiscovery = @($discovery.UnmappedCargo).Count
    }
}

$plan | ConvertTo-Json -Depth 20 | Set-Content -Path $outputPath -Encoding UTF8

Write-Host ''
Write-Host '============================================================'
Write-Host ' PLANO DE DEPLOY LOCAL'
Write-Host '============================================================'

[PSCustomObject]@{
    GroupsResolved       = $plan.Validation.GroupsResolved
    RulesResolved        = $plan.Validation.RulesResolved
    UnmappedCargoValues  = $plan.Validation.UnmappedCargoValuesFoundDuringDiscovery
    OutputPath           = $outputPath
    ReadyForBootstrap    = $true
} | Format-List

Write-Host 'ATENÇÃO: deployment-plan.local.json contém IDs internos e não deve ser commitado.'
Write-Host ''
Write-Host 'RESULTADO_FINAL=PLANO_DEPLOY_OK'
