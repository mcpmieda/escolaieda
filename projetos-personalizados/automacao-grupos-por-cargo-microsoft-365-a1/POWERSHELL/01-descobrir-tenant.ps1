param(
    [Parameter(Mandatory = $false)]
    [string]$ConfigPath = "$PSScriptRoot\CONFIG.local.psd1"
)

$ErrorActionPreference = 'Stop'

function Assert-Condition {
    param([bool]$Condition,[string]$Message)
    if (-not $Condition) { throw $Message }
}

Write-Host ''
Write-Host '============================================================'
Write-Host ' DESCOBERTA | Tenant, Cargos e Grupos'
Write-Host '============================================================'

Assert-Condition (Test-Path $ConfigPath) "Configuração não encontrada: $ConfigPath"
$config = Import-PowerShellDataFile -Path $ConfigPath

Import-Module Microsoft.Graph.Authentication -Force
Import-Module Microsoft.Graph.Users -Force
Import-Module Microsoft.Graph.Groups -Force
Import-Module Microsoft.Graph.Identity.DirectoryManagement -Force

Write-Host '[1/5] Autenticando no Microsoft Graph...'
Connect-MgGraph -Scopes @(
    'Organization.Read.All',
    'User.Read.All',
    'Group.Read.All'
) -NoWelcome

Write-Host '[2/5] Lendo organização...'
$org = @(Get-MgOrganization -Property Id,DisplayName,VerifiedDomains)
Assert-Condition ($org.Count -eq 1) "Esperada exatamente uma organização; encontradas: $($org.Count)"

$verifiedDomains = @($org[0].VerifiedDomains | ForEach-Object Name)
Assert-Condition ($verifiedDomains -contains $config.Tenant.PrimaryDomain) "O domínio configurado '$($config.Tenant.PrimaryDomain)' não aparece entre os domínios verificados do tenant autenticado."

Write-Host "[OK] Organização: $($org[0].DisplayName)"

Write-Host '[3/5] Resolvendo grupos por nome exato...'
$resolvedGroups = @()

foreach ($groupConfig in $config.Groups) {
    $name = [string]$groupConfig.Name
    $escaped = $name.Replace("'", "''")

    $matches = @(
        Get-MgGroup -Filter "displayName eq '$escaped'" -All -Property Id,DisplayName,GroupTypes,MailEnabled,SecurityEnabled
    )

    Assert-Condition ($matches.Count -eq 1) "Grupo '$name': esperado 1 resultado exato; encontrados: $($matches.Count)"

    $resolvedGroups += [PSCustomObject]@{
        Name            = $matches[0].DisplayName
        Id              = $matches[0].Id
        GroupTypes      = @($matches[0].GroupTypes)
        MailEnabled     = $matches[0].MailEnabled
        SecurityEnabled = $matches[0].SecurityEnabled
    }

    Write-Host "[OK] Grupo resolvido: $name"
}

Write-Host '[4/5] Auditando distribuição de Cargos...'
$users = @(
    Get-MgUser -All -Property Id,DisplayName,UserPrincipalName,JobTitle,AccountEnabled,UserType
)

$jobTitleSummary = @(
    $users |
        Group-Object {
            if ([string]::IsNullOrWhiteSpace($_.JobTitle)) {
                '<VAZIO>'
            }
            else {
                $_.JobTitle.Trim().ToLowerInvariant()
            }
        } |
        Sort-Object Count -Descending |
        ForEach-Object {
            [PSCustomObject]@{
                CargoNormalizado = $_.Name
                Quantidade       = $_.Count
            }
        }
)

$configuredCargo = @($config.Rules | ForEach-Object { ([string]$_.Cargo).Trim().ToLowerInvariant() })
$unmappedCargo = @(
    $jobTitleSummary |
        Where-Object {
            $_.CargoNormalizado -ne '<VAZIO>' -and
            $configuredCargo -notcontains $_.CargoNormalizado
        }
)

Write-Host '[5/5] Gravando descoberta local sanitizada...'
$outputFolder = Join-Path $PSScriptRoot $config.Installer.OutputFolder
New-Item -ItemType Directory -Path $outputFolder -Force | Out-Null

$outputPath = Join-Path $outputFolder 'tenant-discovery.local.json'

$result = [ordered]@{
    GeneratedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    Organization = [ordered]@{
        DisplayName = $org[0].DisplayName
        Id          = $org[0].Id
        VerifiedDomains = $verifiedDomains
    }
    Counts = [ordered]@{
        Users = $users.Count
        GroupsConfigured = $resolvedGroups.Count
        RulesConfigured = @($config.Rules).Count
        EmptyJobTitle = @($users | Where-Object { [string]::IsNullOrWhiteSpace($_.JobTitle) }).Count
        UnmappedCargoValues = $unmappedCargo.Count
    }
    Groups = $resolvedGroups
    JobTitleSummary = $jobTitleSummary
    UnmappedCargo = $unmappedCargo
}

$result | ConvertTo-Json -Depth 10 | Set-Content -Path $outputPath -Encoding UTF8

Write-Host ''
Write-Host "Arquivo local: $outputPath"
Write-Host 'ATENÇÃO: o arquivo contém IDs do tenant. Não commitar em repositório público.'
Write-Host ''

[PSCustomObject]@{
    TenantValidated       = $true
    UsersFound            = $users.Count
    GroupsResolved        = $resolvedGroups.Count
    EmptyJobTitle         = $result.Counts.EmptyJobTitle
    UnmappedCargoValues   = $unmappedCargo.Count
    DiscoveryFileCreated  = $true
} | Format-List

Write-Host 'RESULTADO_FINAL=DESCOBERTA_TENANT_OK'
