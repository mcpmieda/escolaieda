param(
    [Parameter(Mandatory = $false)]
    [string]$ConfigPath = "$PSScriptRoot\CONFIG.local.psd1",

    [switch]$InstallMissingModules
)

$ErrorActionPreference = 'Stop'

function Assert-Condition {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

Write-Host ''
Write-Host '============================================================'
Write-Host ' PRE-FLIGHT | Automação de Grupos por Cargo'
Write-Host '============================================================'

# 1. PowerShell
Assert-Condition ($PSVersionTable.PSVersion.Major -ge 7) 'Execute este script no PowerShell 7 ou superior.'
Write-Host "[OK] PowerShell $($PSVersionTable.PSVersion)"

# 2. Configuração
Assert-Condition (Test-Path $ConfigPath) "Arquivo de configuração não encontrado: $ConfigPath"
$config = Import-PowerShellDataFile -Path $ConfigPath
Write-Host "[OK] Configuração carregada: $ConfigPath"

# 3. Módulos
$requiredModules = @(
    'Microsoft.Graph.Authentication',
    'Microsoft.Graph.Users',
    'Microsoft.Graph.Groups',
    'Microsoft.Graph.Identity.DirectoryManagement',
    'Az.Accounts'
)

foreach ($moduleName in $requiredModules) {
    $available = Get-Module -ListAvailable -Name $moduleName | Select-Object -First 1

    if (-not $available -and $InstallMissingModules) {
        Write-Host "[INFO] Instalando módulo ausente: $moduleName"
        Install-Module $moduleName -Scope CurrentUser -Repository PSGallery -Force -AllowClobber
        $available = Get-Module -ListAvailable -Name $moduleName | Select-Object -First 1
    }

    Assert-Condition ($null -ne $available) "Módulo ausente: $moduleName. Rode novamente com -InstallMissingModules ou instale manualmente."
    Write-Host "[OK] Módulo: $moduleName"
}

# 4. Campos mínimos
Assert-Condition (-not [string]::IsNullOrWhiteSpace($config.Tenant.PrimaryDomain)) 'Tenant.PrimaryDomain está vazio.'
Assert-Condition (-not [string]::IsNullOrWhiteSpace($config.Tenant.AdminUpn)) 'Tenant.AdminUpn está vazio.'
Assert-Condition (-not [string]::IsNullOrWhiteSpace($config.SharePoint.SiteUrl)) 'SharePoint.SiteUrl está vazio.'
Assert-Condition (-not [string]::IsNullOrWhiteSpace($config.Flow.DisplayName)) 'Flow.DisplayName está vazio.'
Assert-Condition ($config.Flow.RecurrenceMinutes -ge 1) 'Flow.RecurrenceMinutes deve ser >= 1.'
Assert-Condition ($config.Flow.ReconciliationHours -ge 1) 'Flow.ReconciliationHours deve ser >= 1.'
Assert-Condition ($config.Flow.AddOnly -eq $true) 'Este instalador foi validado apenas para modo ADD-ONLY.'

# 5. Evitar template não preenchido
$templateMarkers = @('SEU-TENANT', 'SEU-SITE', 'CONTA-TECNICA')
$configText = Get-Content $ConfigPath -Raw
foreach ($marker in $templateMarkers) {
    Assert-Condition ($configText -notmatch [regex]::Escape($marker)) "Configuração ainda contém marcador de template: $marker"
}

# 6. Grupos duplicados
$groupNames = @($config.Groups | ForEach-Object { [string]$_.Name })
Assert-Condition ($groupNames.Count -gt 0) 'Nenhum grupo foi configurado.'

$duplicateGroups = @(
    $groupNames |
        Group-Object |
        Where-Object Count -gt 1
)
Assert-Condition ($duplicateGroups.Count -eq 0) "Existem nomes de grupos duplicados na configuração: $($duplicateGroups.Name -join ', ')"

# 7. Regras duplicadas e inválidas
$normalizedRules = @()
foreach ($rule in $config.Rules) {
    $cargo = ([string]$rule.Cargo).Trim().ToLowerInvariant()
    $action = ([string]$rule.Action).Trim().ToUpperInvariant()
    $group = [string]$rule.Group

    Assert-Condition (-not [string]::IsNullOrWhiteSpace($cargo)) 'Existe regra com Cargo vazio.'
    Assert-Condition ($action -in @('ADICIONAR', 'IGNORAR')) "Ação inválida para Cargo '$cargo': $action"

    if ($action -eq 'ADICIONAR') {
        Assert-Condition (-not [string]::IsNullOrWhiteSpace($group)) "Regra ADICIONAR sem grupo: $cargo"
        Assert-Condition ($groupNames -contains $group) "Regra '$cargo' referencia grupo não declarado em Groups: $group"
    }

    $normalizedRules += [PSCustomObject]@{
        Cargo  = $cargo
        Action = $action
        Group  = $group
    }
}

$duplicateRules = @(
    $normalizedRules |
        Group-Object Cargo |
        Where-Object Count -gt 1
)
Assert-Condition ($duplicateRules.Count -eq 0) "Existem Cargos duplicados nas regras: $($duplicateRules.Name -join ', ')"

# 8. Output local
$outputFolder = Join-Path $PSScriptRoot $config.Installer.OutputFolder
New-Item -ItemType Directory -Path $outputFolder -Force | Out-Null

$result = [PSCustomObject]@{
    PowerShellVersion      = $PSVersionTable.PSVersion.ToString()
    ConfigVersion          = $config.Installer.ConfigVersion
    GroupsConfigured       = $groupNames.Count
    RulesConfigured        = $normalizedRules.Count
    RecurrenceMinutes      = $config.Flow.RecurrenceMinutes
    ReconciliationHours    = $config.Flow.ReconciliationHours
    AddOnly                = $config.Flow.AddOnly
    OutputFolder           = $outputFolder
    ReadyForDiscovery      = $true
}

$result | Format-List

Write-Host ''
Write-Host 'RESULTADO_FINAL=PREFLIGHT_OK'
