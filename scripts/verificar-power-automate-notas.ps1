param(
  [string]$TenantId = "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",

  [string]$EnvironmentName = "Default-f04e0fa3-b8dc-4f77-be3c-7dfda0635188",

  [string]$ConnectorName = "shared_excelonlinebusiness",

  [switch]$InstallModules,

  [switch]$OpenConnectionsPage,

  [int]$PollSeconds = 0
)

$ErrorActionPreference = "Stop"
$WarningPreference = "SilentlyContinue"

if ($PSVersionTable.PSEdition -ne "Desktop") {
  throw "Este script usa os modulos oficiais Power Platform baseados em .NET Framework. Execute com Windows PowerShell 5.1: powershell.exe -ExecutionPolicy Bypass -File .\scripts\verificar-power-automate-notas.ps1"
}

function Ensure-PowerPlatformModules {
  param([switch]$Install)

  $requiredModules = @(
    "Microsoft.PowerApps.Administration.PowerShell",
    "Microsoft.PowerApps.PowerShell"
  )

  $missing = @($requiredModules | Where-Object { -not (Get-Module -ListAvailable $_) })
  if ($missing.Count -eq 0) {
    return
  }

  if (-not $Install) {
    throw "Modulos ausentes: $($missing -join ', '). Reexecute com -InstallModules."
  }

  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force -Scope CurrentUser | Out-Null
  Set-PSRepository -Name PSGallery -InstallationPolicy Trusted

  foreach ($module in $missing) {
    Install-Module -Name $module -Scope CurrentUser -Force -AllowClobber
  }
}

function Get-ExcelConnectionState {
  param(
    [string]$Environment,
    [string]$Connector
  )

  $connections = @(Get-PowerAppConnection -EnvironmentName $Environment | Where-Object {
    $_.ConnectorName -eq $Connector
  })

  return @($connections | ForEach-Object {
    [ordered]@{
      ConnectionName = $_.ConnectionName
      ConnectorName = $_.ConnectorName
      DisplayName = $_.DisplayName
      Statuses = @($_.Statuses | ForEach-Object { $_.status })
      CreatedTime = $_.CreatedTime
      LastModifiedTime = $_.LastModifiedTime
    }
  })
}

Ensure-PowerPlatformModules -Install:$InstallModules

Import-Module Microsoft.PowerApps.Administration.PowerShell -WarningAction SilentlyContinue
Import-Module Microsoft.PowerApps.PowerShell -WarningAction SilentlyContinue

Add-PowerAppsAccount -Endpoint prod -TenantID $TenantId | Out-Null

$environment = Get-FlowEnvironment | Where-Object { $_.EnvironmentName -eq $EnvironmentName } | Select-Object -First 1
if ($null -eq $environment) {
  throw "Ambiente nao encontrado: $EnvironmentName"
}

$connector = Get-PowerAppConnector -EnvironmentName $EnvironmentName -ConnectorName $ConnectorName -ReturnConnectorSwagger
$operations = @($connector.Internal.properties.swagger.paths.PSObject.Properties | ForEach-Object {
  $path = $_.Name
  $_.Value.PSObject.Properties | ForEach-Object {
    [PSCustomObject]@{
      Path = $path
      Method = $_.Name
      OperationId = $_.Value.operationId
      Summary = $_.Value.summary
    }
  }
} | Where-Object { $_.OperationId -in @("GetTables", "GetItems") })

if ($OpenConnectionsPage) {
  Start-Process "https://make.powerautomate.com/environments/$EnvironmentName/connections"
}

$connections = @(Get-ExcelConnectionState -Environment $EnvironmentName -Connector $ConnectorName)
if ($connections.Count -eq 0 -and $PollSeconds -gt 0) {
  $deadline = (Get-Date).AddSeconds($PollSeconds)
  while ((Get-Date) -lt $deadline -and $connections.Count -eq 0) {
    Start-Sleep -Seconds 15
    $connections = @(Get-ExcelConnectionState -Environment $EnvironmentName -Connector $ConnectorName)
  }
}

[PSCustomObject]@{
  TenantId = $TenantId
  Environment = [ordered]@{
    EnvironmentName = $environment.EnvironmentName
    DisplayName = $environment.DisplayName
    Location = $environment.Location
  }
  Connector = [ordered]@{
    ConnectorName = $ConnectorName
    DisplayName = $connector.DisplayName
    Tier = $connector.Tier
    RequiredOperations = @($operations | Sort-Object OperationId)
  }
  Connections = @($connections)
  ReadyForPowerAutomateTest = ($connections.Count -gt 0 -and @($connections | Where-Object { $_.Statuses -contains "Connected" }).Count -gt 0)
  NextAction = if ($connections.Count -eq 0) {
    "Criar conexao Excel Online (Business) no portal Power Automate e repetir este script."
  } else {
    "Executar fluxo temporario com Get tables e List rows present in a table."
  }
} | ConvertTo-Json -Depth 10
