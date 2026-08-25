[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$WorkbookPath,
  [string]$SiteUrl = "https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL",
  [string]$TenantId = "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",
  [string]$ClientId = "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",
  [string]$ListName = "NOTAS_POC_MODELO_NINA",
  [string]$TableName = "TB_LANCAMENTOS"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ($ListName -ne "NOTAS_POC_MODELO_NINA") { throw "Lista fora do escopo permitido da POC." }
$workbookFullPath = [IO.Path]::GetFullPath($WorkbookPath)
if (-not (Test-Path -LiteralPath $workbookFullPath)) { throw "Workbook nao encontrado: $workbookFullPath" }

function Release-ComObject {
  param([object]$Object)
  if ($null -ne $Object) {
    try { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($Object) } catch { }
  }
}

function Cell-OrNull {
  param([object]$Value)
  if ($null -eq $Value) { return $null }
  if ($Value -is [string] -and [string]::IsNullOrWhiteSpace($Value)) { return $null }
  return $Value
}

function Test-ActiveStudentName {
  param([object]$Value)
  $name = [string]$Value
  return -not [string]::IsNullOrWhiteSpace($name) -and $name.Trim().Length -ge 7 -and $name.Trim() -match '\s'
}

$excel = $null
$workbook = $null
$worksheet = $null
$table = $null
$range = $null
try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  $excel.EnableEvents = $false
  $excel.AutomationSecurity = 3
  $excel.AskToUpdateLinks = $false
  $workbook = $excel.Workbooks.Open($workbookFullPath, 0, $true)
  $worksheet = $workbook.Worksheets.Item("LANCAMENTOS")
  $table = $worksheet.ListObjects.Item($TableName)
  $range = $table.DataBodyRange
  $values = $range.Value2
  $rows = [int]$range.Rows.Count

  Import-Module PnP.PowerShell -ErrorAction Stop
  Connect-PnPOnline -Url $SiteUrl -Tenant $TenantId -ClientId $ClientId -PersistLogin
  $connectedUser = (Invoke-PnPGraphMethod -Url "v1.0/me?`$select=userPrincipalName" -Method Get).userPrincipalName
  $list = Get-PnPList -Identity $ListName -Includes Id, ItemCount

  $existing = @{}
  $existingItems = Get-PnPListItem -List $list.Id -PageSize 500 -Fields "RegistroId", "Ativo"
  foreach ($item in $existingItems) {
    $registroId = [string]$item["RegistroId"]
    if ($registroId) { $existing[$registroId] = [int]$item.Id }
  }

  $batch = New-PnPBatch
  $activeIds = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  $activeRows = 0
  $created = 0
  $updated = 0
  for ($r = 1; $r -le $rows; $r++) {
    $studentName = [string]$values[$r, 8]
    if (-not (Test-ActiveStudentName $studentName)) { continue }
    $activeRows++
    $registroId = [string]$values[$r, 1]
    [void]$activeIds.Add($registroId)
    $key = [string]$values[$r, 2]
    $itemValues = @{
      Title = $key
      RegistroId = $registroId
      ChaveExterna = $key
      ContratoVersao = [double]$values[$r, 3]
      AnoLetivo = [double]$values[$r, 4]
      TurmaCodigo = [string]$values[$r, 5]
      ComponenteCodigo = [string]$values[$r, 6]
      LinhaOrigem = [double]$values[$r, 7]
      AlunoNome = $studentName
      SituacaoMatricula = [string](Cell-OrNull $values[$r, 9])
      NotaT1 = Cell-OrNull $values[$r, 10]
      NotaT2 = Cell-OrNull $values[$r, 11]
      NotaT3 = Cell-OrNull $values[$r, 12]
      Total = Cell-OrNull $values[$r, 13]
      RecT1 = Cell-OrNull $values[$r, 14]
      RecT2 = Cell-OrNull $values[$r, 15]
      RecT3 = Cell-OrNull $values[$r, 16]
      TotalRec = Cell-OrNull $values[$r, 17]
      NotaFinal = Cell-OrNull $values[$r, 18]
      Sequencia = 0
      OrigemModelo = "modelo-notas-v2:nina-2026"
      Ativo = $true
    }
    if ($existing.ContainsKey($registroId)) {
      Set-PnPListItem -List $list.Id -Identity $existing[$registroId] -Values $itemValues -Batch $batch | Out-Null
      $updated++
    } else {
      Add-PnPListItem -List $list.Id -Values $itemValues -Batch $batch | Out-Null
      $created++
    }
  }
  $inactivated = 0
  foreach ($item in $existingItems) {
    $registroId = [string]$item["RegistroId"]
    if ($registroId -and -not $activeIds.Contains($registroId) -and [bool]$item["Ativo"]) {
      Set-PnPListItem -List $list.Id -Identity $item.Id -Values @{ Ativo = $false; OrigemModelo = "modelo-notas-v2:nina-2026:inactive" } -Batch $batch | Out-Null
      $inactivated++
    }
  }
  Invoke-PnPBatch -Batch $batch

  $refreshed = Get-PnPList -Identity $list.Id -Includes ItemCount
  $activeItemCount = @(Get-PnPListItem -List $list.Id -PageSize 500 -Fields "Ativo" | Where-Object { [bool]$_["Ativo"] }).Count
  if ($activeItemCount -ne $activeRows) {
    throw "Importacao incompleta: esperado $activeRows itens ativos, lista possui $activeItemCount."
  }
  $fileHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $workbookFullPath).Hash
  [pscustomobject]@{
    ConnectedAs = $connectedUser
    ListName = $ListName
    ListId = [string]$list.Id
    StructuralRowsRead = $rows
    ActiveRowsImported = $activeRows
    Created = $created
    Updated = $updated
    Inactivated = $inactivated
    FinalItemCount = [int]$refreshed.ItemCount
    ActiveItemCount = $activeItemCount
    WorkbookSha256 = $fileHash
    SensitiveValuesPrinted = $false
  } | ConvertTo-Json -Depth 4
} finally {
  if ($workbook) { try { $workbook.Close($false) } catch { } }
  if ($excel) { try { $excel.Quit() } catch { } }
  foreach ($object in @($range, $table, $worksheet, $workbook, $excel)) { Release-ComObject $object }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
