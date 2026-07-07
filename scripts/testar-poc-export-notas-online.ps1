param(
  [string]$SiteUrl = "https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL",

  [string]$ClientId = "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",

  [string]$TenantId = "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",

  [string]$UserPrincipalName = "SECRETARIA@escolaieda.com",

  [string]$DrivePath = "PEDAGÓGICO/CONTROLE DE NOTAS/_POC_NOTAS_EXPORT_2026/POC_TB_EXPORT_NOTAS_CORRIGIDO_20260707.xlsb",

  [string]$TableName = "TB_EXPORT_NOTAS",

  [switch]$Interactive
)

$ErrorActionPreference = "Stop"

function Join-GraphDrivePath {
  param([string]$Path)

  (($Path -split "/") | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object {
    [System.Uri]::EscapeDataString($_)
  }) -join "/"
}

function New-CellClass {
  param(
    [string]$Header,
    [object[]]$Headers,
    [object[]]$Values
  )

  $index = [array]::IndexOf($Headers, $Header)
  $value = ""
  if ($index -ge 0 -and $Values.Count -gt $index) {
    $value = [string]$Values[$index]
  }

  return [ordered]@{
    Header = $Header
    Present = ($index -ge 0)
    Empty = [string]::IsNullOrWhiteSpace($value)
    Length = $value.Length
    HasSpace = ($value -match " ")
    LooksLikeSituation = ($value -match "TRANSFER|FOI|DESIST|REM|ADMIT|ATIVO|MATR|ASSIST|REMANEJ")
  }
}

Import-Module PnP.PowerShell

$connectParams = @{
  Url = $SiteUrl
  ClientId = $ClientId
  Tenant = $TenantId
  PersistLogin = $true
}

if ($Interactive) {
  $connectParams.Interactive = $true
}

Connect-PnPOnline @connectParams

$me = Invoke-PnPGraphMethod -Url "v1.0/me" -Method Get
$escapedPath = Join-GraphDrivePath -Path $DrivePath
$item = Invoke-PnPGraphMethod -Url "v1.0/users/$UserPrincipalName/drive/root:/$escapedPath" -Method Get
$table = Invoke-PnPGraphMethod -Url "v1.0/users/$UserPrincipalName/drive/items/$($item.id)/workbook/tables/$TableName" -Method Get
$range = Invoke-PnPGraphMethod -Url ("v1.0/users/$UserPrincipalName/drive/items/$($item.id)/workbook/tables/$TableName/range?" + '$select=address,rowCount,columnCount') -Method Get
$columns = Invoke-PnPGraphMethod -Url "v1.0/users/$UserPrincipalName/drive/items/$($item.id)/workbook/tables/$TableName/columns" -Method Get
$rows = Invoke-PnPGraphMethod -Url ("v1.0/users/$UserPrincipalName/drive/items/$($item.id)/workbook/tables/$TableName/rows?" + '$top=1') -Method Get

$headers = @($columns.value | ForEach-Object { $_.name })
$firstRowValues = @()
if (@($rows.value).Count -gt 0) {
  $firstRowValues = @($rows.value[0].values[0])
}

[PSCustomObject]@{
  ConnectedAs = $me.userPrincipalName
  CheckedUserDrive = $UserPrincipalName
  DrivePath = $DrivePath
  File = [ordered]@{
    Name = $item.name
    Id = $item.id
    Size = $item.size
    LastModifiedDateTime = $item.lastModifiedDateTime
    WebUrl = $item.webUrl
  }
  WorkbookApi = "Microsoft Graph Workbook API"
  PowerAutomateConnector = "Nao testado por este script"
  Table = [ordered]@{
    Name = $table.name
    Id = $table.id
    ShowHeaders = $table.showHeaders
    Address = $range.address
    RowsIncludingHeader = $range.rowCount
    DataRows = $range.rowCount - 1
    Columns = $range.columnCount
    ColumnNames = $headers
  }
  FirstRowChecks = @(
    New-CellClass -Header "AlunoNome" -Headers $headers -Values $firstRowValues
    New-CellClass -Header "SituacaoMatricula" -Headers $headers -Values $firstRowValues
  )
} | ConvertTo-Json -Depth 8
