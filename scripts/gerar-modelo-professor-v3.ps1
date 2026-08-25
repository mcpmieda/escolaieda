[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$SourceXlsb,
  [Parameter(Mandatory=$true)][string]$TechnicalPayloadXlsx,
  [Parameter(Mandatory=$true)][string]$OutputXlsx,
  [Parameter(Mandatory=$true)][string]$TeacherDisplayName,
  [int]$SchoolYear = 2026,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Release-Com([object]$Object) {
  if ($null -ne $Object) { try { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($Object) } catch {} }
}

function Stable-Id([string]$Value) {
  $sha = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($Value))).Replace('-','').Substring(0,32)).ToLowerInvariant() }
  finally { $sha.Dispose() }
}

function Range-Value([object]$Data, [int]$Index) {
  if ($null -eq $Data) { return $null }
  if ($Data -is [Array]) {
    if ($Data.Rank -eq 2) { return $Data.GetValue($Data.GetLowerBound(0)+$Index-1, $Data.GetLowerBound(1)) }
    return $Data.GetValue($Data.GetLowerBound(0)+$Index-1)
  }
  if ($Index -eq 1) { return $Data }
  return $null
}

function Write-RowsWithRecordset([object]$Worksheet, [string]$StartCell, [object]$Rows, [int]$ColumnCount) {
  $recordset = New-Object -ComObject ADODB.Recordset
  try {
    for ($column=0; $column -lt $ColumnCount; $column++) { [void]$recordset.Fields.Append("C$column", 202, 255) }
    $recordset.Open()
    foreach ($rowValues in $Rows) {
      $recordset.AddNew()
      for ($column=0; $column -lt $ColumnCount; $column++) {
        $value = $rowValues.GetValue($column)
        $recordset.Fields.Item($column).Value = if ($null -eq $value) { '' } else { [string]$value }
      }
      $recordset.Update()
    }
    $recordset.MoveFirst()
    [void]$Worksheet.Range($StartCell).CopyFromRecordset($recordset)
  } finally {
    try { $recordset.Close() } catch {}
    Release-Com $recordset
  }
}

function Ensure-OutsideGit([string]$Path) {
  $cursor = [IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($Path))
  while ($cursor) {
    if (Test-Path -LiteralPath (Join-Path $cursor '.git')) { throw "Saída com dados reais não pode ficar dentro de worktree Git: $Path" }
    $parent = [IO.Directory]::GetParent($cursor)
    if ($null -eq $parent) { break }
    $cursor = $parent.FullName
  }
}

$source = [IO.Path]::GetFullPath($SourceXlsb)
$payload = [IO.Path]::GetFullPath($TechnicalPayloadXlsx)
$output = [IO.Path]::GetFullPath($OutputXlsx)
if (-not (Test-Path -LiteralPath $source)) { throw "Origem não encontrada: $source" }
if (-not (Test-Path -LiteralPath $payload)) { throw "Payload técnico não encontrado: $payload" }
if ([IO.Path]::GetExtension($output) -ne '.xlsx') { throw 'A saída deve ser .xlsx.' }
Ensure-OutsideGit $output
if (Test-Path -LiteralPath $output) {
  if (-not $Force) { throw 'A saída já existe; use -Force para substituir.' }
  Remove-Item -LiteralPath $output -Force
}
New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($output)) -Force | Out-Null

$sourceHashBefore = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
$excel = $null; $src = $null; $dst = $null; $payloadWb = $null
try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  $excel.EnableEvents = $false
  $excel.AutomationSecurity = 3
  $excel.AskToUpdateLinks = $false
  try { $excel.Calculation = -4135 } catch {}

  $src = $excel.Workbooks.Open($source, 0, $true)
  # A proteção estrutural legada usa senha vazia. A remoção ocorre apenas na
  # sessão de leitura para permitir copiar as abas; o XLSB original não é salvo.
  try { $src.Unprotect() } catch {}
  $src.SaveAs($output, 51)
  $dst = $src
  $src = $null
  $payloadWb = $excel.Workbooks.Open($payload, 0, $true)
  foreach ($technicalName in @('LEIA-ME_TECNICO','INTEGRACAO_CONFIG','LANCAMENTOS','MAPEAMENTO')) {
    $technicalSheet = $payloadWb.Worksheets.Item($technicalName)
    $lastSheet = $dst.Worksheets.Item($dst.Worksheets.Count)
    $technicalSheet.Copy([Type]::Missing, $lastSheet)
  }
  $payloadWb.Close($false); Release-Com $payloadWb; $payloadWb=$null

  $config = $dst.Worksheets.Item('INTEGRACAO_CONFIG')
  $modelId = Stable-Id "$SchoolYear|$TeacherDisplayName|$sourceHashBefore"
  $now = [DateTime]::UtcNow.ToString('o')
  $config.Range('B3').Value2 = $modelId
  $config.Range('B5').Value2 = [string]$SchoolYear
  $config.Range('B6').Value2 = $TeacherDisplayName
  $config.Range('B18').Value2 = $now
  try { $config.ListObjects.Add(1, $config.Range('A1:B18'), $null, 1).Name = 'TB_INTEGRACAO_CONFIG' } catch {}

  $grades = $dst.Worksheets.Item('LANCAMENTOS')
  $mapping = $dst.Worksheets.Item('MAPEAMENTO')
  $gradeRows = [Collections.Generic.List[object[]]]::new()
  $mapRows = [Collections.Generic.List[object[]]]::new()
  $sheetCount = 0; $activeStudents = 0; $visibleSheetCount = 0

  foreach ($ws in $dst.Worksheets) {
    if ([int]$ws.Visible -ne 0 -and $ws.Name -notin @('LEIA-ME_TECNICO','INTEGRACAO_CONFIG','LANCAMENTOS','MAPEAMENTO')) { $visibleSheetCount++ }
    if ($ws.Name -match '^(?!INICIO$).+(1º|2º|3º|REC)(D2)?$') {
      $sheetCount++
      $component = ([string]$ws.Range('K2').Text).Trim()
      $classCode = ([string]$ws.Range('K3').Text).Trim()
      $period = ([string]$ws.Range('K4').Text).Trim()
      $studentNames = $ws.Range('K5:K50').Value2
      $inputColumns = [Collections.Generic.List[int]]::new()
      for ($col=18; $col -le 30; $col++) { if (-not $ws.Cells.Item(5,$col).Locked) { $inputColumns.Add($col) } }
      foreach ($col in $inputColumns) {
        $columnLetter = ($ws.Cells.Item(1,$col).Address($false,$false) -replace '\d','')
        $columnValues = $ws.Range("${columnLetter}5:${columnLetter}50").Value2
        $label4 = ([string]$ws.Cells.Item(4,$col).Text).Trim()
        $label3 = ([string]$ws.Cells.Item(3,$col).Text).Trim()
        $assessment = if ($label4) { $label4 } elseif ($label3) { $label3 } else { "COL_$col" }
        $field = if ($ws.Name -match 'REC') { "REC_$assessment" } else { "AVAL_$assessment" }
        for ($offset=1; $offset -le 46; $offset++) {
          $row = $offset + 4
          $studentName = ([string](Range-Value $studentNames $offset)).Trim()
          if ([string]::IsNullOrWhiteSpace($studentName)) { continue }
          if ($col -eq $inputColumns[0]) { $activeStudents++ }
          $studentId = Stable-Id "$SchoolYear|$classCode|$row|$studentName"
          $gradeKey = "$SchoolYear|$classCode|$component|$studentId"
          $address = "${columnLetter}${row}"
          $value = Range-Value $columnValues $offset
          if ($value -is [Array]) { $value = $null }
          $gradeRows.Add([object[]]@($gradeKey,$SchoolYear,$classCode,$component,$studentId,$row,$studentName,$ws.Name,$address,$field,$period,$value,0,$null))
          $mapRows.Add([object[]]@($ws.Name,$address,$gradeKey,$field,$period,$assessment,$row,$studentId,$classCode,$component,$true,'cell-map-v1'))
        }
      }
    }
  }

  if ($gradeRows.Count -gt 0) {
    $gradeLastRow = ([int]$gradeRows.Count) + 1
    Write-RowsWithRecordset $grades 'A2' $gradeRows 14
    $gt = $grades.ListObjects.Add(1, $grades.Range("A1:N$gradeLastRow"), $null, 1); $gt.Name='TB_LANCAMENTOS'; Release-Com $gt
  }
  if ($mapRows.Count -gt 0) {
    $mapLastRow = ([int]$mapRows.Count) + 1
    Write-RowsWithRecordset $mapping 'A2' $mapRows 12
    $mt = $mapping.ListObjects.Add(1, $mapping.Range("A1:L$mapLastRow"), $null, 1); $mt.Name='TB_MAPEAMENTO_CELULAS'; Release-Com $mt
  }

  $dst.Worksheets.Item(1).Activate()
  foreach ($techName in @('LEIA-ME_TECNICO','INTEGRACAO_CONFIG','LANCAMENTOS','MAPEAMENTO')) {
    $tech = $dst.Worksheets.Item($techName)
    try { $tech.Visible = 0 } catch {}
  }
  $externalLinks = $dst.LinkSources(1)
  if ($null -ne $externalLinks) {
    foreach ($externalLink in @($externalLinks)) { try { $dst.BreakLink([string]$externalLink, 1) } catch {} }
  }
  foreach ($connection in $dst.Connections) { try { $connection.Delete() } catch {} }
  $dst.Save()
  $summary = [ordered]@{
    contract='teacher-model-v3'; modelId=$modelId; sourceSha256=$sourceHashBefore;
    outputSha256=$null; visibleSheets=$visibleSheetCount; mappedSheets=$sheetCount;
    mappedCells=$mapRows.Count; normalizedRows=$gradeRows.Count; activeStudentOccurrences=$activeStudents;
    generatedAtUtc=$now
  }
  $dst.Close($true); Release-Com $dst; $dst=$null
  $summary.outputSha256=(Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash
  $summary | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath "$output.audit.json" -Encoding UTF8
} finally {
  if ($null -ne $payloadWb) { try {$payloadWb.Close($false)} catch {}; Release-Com $payloadWb }
  if ($null -ne $dst) { try {$dst.Close($false)} catch {}; Release-Com $dst }
  if ($null -ne $src) { try {$src.Close($false)} catch {}; Release-Com $src }
  if ($null -ne $excel) { try {$excel.Quit()} catch {}; Release-Com $excel }
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}

$sourceHashAfter = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
if ($sourceHashAfter -ne $sourceHashBefore) { throw 'A origem foi alterada durante a conversão.' }
Get-Content -LiteralPath "$output.audit.json" -Raw
