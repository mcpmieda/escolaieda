[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePocPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [string]$SourceTableName = "TB_EXPORT_NOTAS",
  [string]$ModelTableName = "TB_LANCAMENTOS",
  [switch]$Force
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Release-ComObject {
  param([object]$Object)
  if ($null -ne $Object) {
    try { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($Object) } catch { }
  }
}

function Normalize-CellValue {
  param([object]$Value)
  if ($null -eq $Value) { return $null }
  if ($Value -is [string] -and [string]::IsNullOrWhiteSpace($Value)) { return $null }
  return $Value
}

function Values-Equal {
  param([object]$Expected, [object]$Actual)
  $left = Normalize-CellValue $Expected
  $right = Normalize-CellValue $Actual
  if ($null -eq $left -and $null -eq $right) { return $true }
  if ($null -eq $left -or $null -eq $right) { return $false }
  $leftNumber = 0.0
  $rightNumber = 0.0
  if ([double]::TryParse([string]$left, [Globalization.NumberStyles]::Any, [Globalization.CultureInfo]::InvariantCulture, [ref]$leftNumber) -and
      [double]::TryParse([string]$right, [Globalization.NumberStyles]::Any, [Globalization.CultureInfo]::InvariantCulture, [ref]$rightNumber)) {
    return [math]::Abs($leftNumber - $rightNumber) -lt 0.0001
  }
  return [string]$left -ceq [string]$right
}

function Test-ActiveStudentName {
  param([object]$Value)
  $name = [string]$Value
  return -not [string]::IsNullOrWhiteSpace($name) -and $name.Trim().Length -ge 7 -and $name.Trim() -match '\s'
}

function Get-StableId {
  param([string]$Key)
  $sha = [Security.Cryptography.SHA256]::Create()
  try {
    $bytes = [Text.Encoding]::UTF8.GetBytes($Key)
    $hash = $sha.ComputeHash($bytes)
    return ([BitConverter]::ToString($hash).Replace("-", "").Substring(0, 32)).ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

function Ensure-OutsideGitWorktree {
  param([string]$Path)
  $cursor = [IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($Path))
  while ($cursor) {
    if (Test-Path -LiteralPath (Join-Path $cursor ".git")) {
      throw "O arquivo com dados reais nao pode ser criado dentro de um worktree Git: $Path"
    }
    $parent = [IO.Directory]::GetParent($cursor)
    if ($null -eq $parent) { break }
    $cursor = $parent.FullName
  }
}

$sourceFullPath = [IO.Path]::GetFullPath($SourcePocPath)
$outputFullPath = [IO.Path]::GetFullPath($OutputPath)
if (-not (Test-Path -LiteralPath $sourceFullPath)) {
  throw "Arquivo de origem nao encontrado: $sourceFullPath"
}
if ([IO.Path]::GetExtension($outputFullPath) -ne ".xlsx") {
  throw "O modelo de saida deve usar a extensao .xlsx."
}
Ensure-OutsideGitWorktree -Path $outputFullPath
if (Test-Path -LiteralPath $outputFullPath) {
  if (-not $Force) { throw "Arquivo de saida ja existe. Use -Force para substituir." }
  Remove-Item -LiteralPath $outputFullPath -Force
}
$outputDirectory = [IO.Path]::GetDirectoryName($outputFullPath)
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

$excel = $null
$sourceWorkbook = $null
$modelWorkbook = $null
$sourceSheet = $null
$sourceTable = $null
$sourceRange = $null
$readmeSheet = $null
$modelSheet = $null
$configSheet = $null
$exportSheet = $null
$modelTable = $null
$exportTable = $null
$validationWorkbook = $null

try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  $excel.EnableEvents = $false
  $excel.AutomationSecurity = 3
  $excel.AskToUpdateLinks = $false

  $sourceWorkbook = $excel.Workbooks.Open($sourceFullPath, 0, $true)
  foreach ($sheet in $sourceWorkbook.Worksheets) {
    foreach ($table in $sheet.ListObjects) {
      if ($table.Name -eq $SourceTableName) {
        $sourceSheet = $sheet
        $sourceTable = $table
        break
      }
      Release-ComObject $table
    }
    if ($sourceTable) { break }
    Release-ComObject $sheet
  }
  if (-not $sourceTable) { throw "Tabela $SourceTableName nao encontrada na origem." }
  $sourceRange = $sourceTable.DataBodyRange
  $sourceValues = $sourceRange.Value2
  $sourceRows = [int]$sourceRange.Rows.Count
  $sourceColumns = [int]$sourceRange.Columns.Count
  if ($sourceColumns -ne 16) { throw "Contrato de origem invalido: esperado 16 colunas, encontrado $sourceColumns." }

  $modelWorkbook = $excel.Workbooks.Add()
  while ($modelWorkbook.Worksheets.Count -lt 4) { [void]$modelWorkbook.Worksheets.Add() }
  while ($modelWorkbook.Worksheets.Count -gt 4) { $modelWorkbook.Worksheets.Item($modelWorkbook.Worksheets.Count).Delete() }
  $readmeSheet = $modelWorkbook.Worksheets.Item(1)
  $modelSheet = $modelWorkbook.Worksheets.Item(2)
  $configSheet = $modelWorkbook.Worksheets.Item(3)
  $exportSheet = $modelWorkbook.Worksheets.Item(4)
  $readmeSheet.Name = "LEIA-ME"
  $modelSheet.Name = "LANCAMENTOS"
  $configSheet.Name = "CONFIG"
  $exportSheet.Name = "EXPORT_NOTAS"

  $readmeSheet.Range("A1:H1").Merge()
  $readmeSheet.Range("A1").Value2 = "MODELO DE LANCAMENTO E SINCRONIZACAO DE NOTAS"
  $readmeSheet.Range("A1").Font.Bold = $true
  $readmeSheet.Range("A1").Font.Size = 18
  $readmeSheet.Range("A1").Font.Color = 16777215
  $readmeSheet.Range("A1:H1").Interior.Color = 6697728
  $readmeSheet.Range("A3").Value2 = "Finalidade"
  $readmeSheet.Range("B3:H3").Merge()
  $readmeSheet.Range("B3").Value2 = "Copia tecnica controlada para validar o novo contrato, o add-in e a chegada imediata de eventos. Nao e o banco oficial."
  $readmeSheet.Range("A5").Value2 = "Como usar"
  $readmeSheet.Range("B5:H5").Merge()
  $readmeSheet.Range("B5").Value2 = "Edite somente as colunas de notas em LANCAMENTOS. Total, TotalRec e NotaFinal sao calculados. O add-in monitora TB_LANCAMENTOS."
  $readmeSheet.Range("A7").Value2 = "Privacidade"
  $readmeSheet.Range("B7:H7").Merge()
  $readmeSheet.Range("B7").Value2 = "Arquivo restrito ao Microsoft 365 institucional. Nao publicar, anexar ao Git ou compartilhar anonimamente."
  $readmeSheet.Range("A9").Value2 = "Contrato"
  $readmeSheet.Range("B9:H9").Merge()
  $readmeSheet.Range("B9").Value2 = "modelo-notas-v2 / grade-event-v1 / TB_EXPORT_NOTAS v1 para reconciliacao."
  $readmeSheet.Range("A3:A9").Font.Bold = $true
  $readmeSheet.Range("A3:H9").WrapText = $true
  $readmeSheet.Columns.Item("A").ColumnWidth = 18
  $readmeSheet.Columns.Item("B:H").ColumnWidth = 15
  $readmeSheet.Rows.Item("1:10").RowHeight = 28

  $headers = @(
    "RegistroId", "ChaveExterna", "ContratoVersao", "AnoLetivo", "TurmaCodigo",
    "ComponenteCodigo", "LinhaOrigem", "AlunoNome", "SituacaoMatricula",
    "NotaT1", "NotaT2", "NotaT3", "Total", "RecT1", "RecT2", "RecT3",
    "TotalRec", "NotaFinal", "Sequencia", "UltimaAlteracao"
  )
  $headerMatrix = New-Object 'object[,]' 1, $headers.Count
  for ($c = 0; $c -lt $headers.Count; $c++) { $headerMatrix[0, $c] = $headers[$c] }
  $modelSheet.Range("A1:T1").Value2 = $headerMatrix

  $data = New-Object 'object[,]' $sourceRows, $headers.Count
  $activeRows = 0
  for ($r = 1; $r -le $sourceRows; $r++) {
    $year = [string]$sourceValues[$r, 2]
    $class = [string]$sourceValues[$r, 3]
    $component = [string]$sourceValues[$r, 4]
    $line = [string]$sourceValues[$r, 5]
    $key = "$year|$class|$component|$line"
    $data[($r - 1), 0] = Get-StableId -Key $key
    $data[($r - 1), 1] = $key
    $data[($r - 1), 2] = $sourceValues[$r, 1]
    $data[($r - 1), 3] = $sourceValues[$r, 2]
    $data[($r - 1), 4] = $sourceValues[$r, 3]
    $data[($r - 1), 5] = $sourceValues[$r, 4]
    $data[($r - 1), 6] = $sourceValues[$r, 5]
    $data[($r - 1), 7] = $sourceValues[$r, 6]
    $data[($r - 1), 8] = $sourceValues[$r, 7]
    $data[($r - 1), 9] = $sourceValues[$r, 8]
    $data[($r - 1), 10] = $sourceValues[$r, 9]
    $data[($r - 1), 11] = $sourceValues[$r, 10]
    $data[($r - 1), 12] = $null
    $data[($r - 1), 13] = $sourceValues[$r, 12]
    $data[($r - 1), 14] = $sourceValues[$r, 13]
    $data[($r - 1), 15] = $sourceValues[$r, 14]
    $data[($r - 1), 16] = $null
    $data[($r - 1), 17] = $null
    $data[($r - 1), 18] = 0
    $data[($r - 1), 19] = $null
    if (Test-ActiveStudentName $sourceValues[$r, 6]) { $activeRows++ }
  }
  $modelDataRange = $modelSheet.Range("A2:T$($sourceRows + 1)")
  $modelDataRange.Value2 = $data
  $modelSheet.Range("M2:M$($sourceRows + 1)").Formula = '=SUM(J2:L2)'
  $modelSheet.Range("Q2:Q$($sourceRows + 1)").Formula = '=SUM(N2:P2)'
  $modelSheet.Range("R2:R$($sourceRows + 1)").Formula = '=MAX(M2,Q2)'
  $modelTableRange = $modelSheet.Range("A1:T$($sourceRows + 1)")
  $modelTable = $modelSheet.ListObjects.Add(1, $modelTableRange, $null, 1)
  $modelTable.Name = $ModelTableName
  $modelTable.TableStyle = "TableStyleMedium2"

  $modelSheet.Columns.Item("A:G").Hidden = $true
  $modelSheet.Columns.Item("H").ColumnWidth = 31
  $modelSheet.Columns.Item("I").ColumnWidth = 19
  $modelSheet.Columns.Item("J:R").ColumnWidth = 11
  $modelSheet.Columns.Item("S:T").Hidden = $true
  $modelSheet.Range("J2:R$($sourceRows + 1)").NumberFormat = "0.00"
  $modelSheet.Range("M2:M$($sourceRows + 1)").Interior.Color = 15987699
  $modelSheet.Range("Q2:R$($sourceRows + 1)").Interior.Color = 15987699
  $modelSheet.Activate()

  foreach ($rule in @(
    @{ Range = "J2:K$($sourceRows + 1)"; Max = 30 },
    @{ Range = "L2:L$($sourceRows + 1)"; Max = 40 },
    @{ Range = "N2:O$($sourceRows + 1)"; Max = 30 },
    @{ Range = "P2:P$($sourceRows + 1)"; Max = 40 }
  )) {
    $validationRange = $modelSheet.Range($rule.Range)
    $validationRange.Validation.Delete()
    $validationRange.Validation.Add(2, 1, 1, 0, $rule.Max)
    $validationRange.Validation.IgnoreBlank = $true
    $validationRange.Validation.ErrorTitle = "Nota invalida"
    $validationRange.Validation.ErrorMessage = "Informe um numero entre 0 e $($rule.Max), ou deixe a celula vazia."
    $validationRange.Validation.ShowError = $true
    Release-ComObject $validationRange
  }

  $configRows = @(
    @("Chave", "Valor"),
    @("ModeloVersao", "2"),
    @("ContratoEvento", "grade-event-v1"),
    @("TabelaMonitorada", $ModelTableName),
    @("TabelaReconciliacao", "TB_EXPORT_NOTAS"),
    @("AnoLetivo", "2026"),
    @("LinhasEstruturais", [string]$sourceRows),
    @("LinhasAtivas", [string]$activeRows),
    @("Origem", "Copia tecnica da agenda institucional"),
    @("FonteAutoritativaPOC", "Agenda de origem para baseline; SharePoint apenas para transporte"),
    @("FormulaTotal", "NotaT1 + NotaT2 + NotaT3"),
    @("FormulaTotalRec", "RecT1 + RecT2 + RecT3"),
    @("FormulaNotaFinal", "MAX(Total, TotalRec)"),
    @("AddIn", "https://escolaieda.com/notas-integracao/addin/"),
    @("Receptor", "https://escolaieda.com/notas-integracao/receptor/")
  )
  $configMatrix = New-Object 'object[,]' $configRows.Count, 2
  for ($r = 0; $r -lt $configRows.Count; $r++) {
    $configMatrix[$r, 0] = $configRows[$r][0]
    $configMatrix[$r, 1] = $configRows[$r][1]
  }
  $configSheet.Range("A1:B$($configRows.Count)").Value2 = $configMatrix
  $configSheet.Range("A1:B1").Font.Bold = $true
  $configSheet.Range("A1:B1").Interior.Color = 6697728
  $configSheet.Range("A1:B1").Font.Color = 16777215
  $configSheet.Columns.Item("A").ColumnWidth = 27
  $configSheet.Columns.Item("B").ColumnWidth = 72
  $configSheet.Columns.Item("B").WrapText = $true

  $exportHeaders = @("ContratoVersao", "AnoLetivo", "TurmaCodigo", "ComponenteCodigo", "LinhaOrigem", "AlunoNome", "SituacaoMatricula", "NotaT1", "NotaT2", "NotaT3", "Total", "RecT1", "RecT2", "RecT3", "TotalRec", "NotaFinal")
  $exportHeaderMatrix = New-Object 'object[,]' 1, $exportHeaders.Count
  for ($c = 0; $c -lt $exportHeaders.Count; $c++) { $exportHeaderMatrix[0, $c] = $exportHeaders[$c] }
  $exportSheet.Range("A1:P1").Value2 = $exportHeaderMatrix
  $modelColumnLetters = @("C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R")
  for ($c = 0; $c -lt $modelColumnLetters.Count; $c++) {
    $targetColumn = [char]([int][char]'A' + $c)
    $exportSheet.Range("$targetColumn`2:$targetColumn$($sourceRows + 1)").Formula = "=LANCAMENTOS!$($modelColumnLetters[$c])2"
  }
  $exportTableRange = $exportSheet.Range("A1:P$($sourceRows + 1)")
  $exportTable = $exportSheet.ListObjects.Add(1, $exportTableRange, $null, 1)
  $exportTable.Name = "TB_EXPORT_NOTAS"
  $exportTable.TableStyle = "TableStyleMedium2"
  $exportSheet.Visible = 2

  $modelWorkbook.Worksheets.Item("LEIA-ME").Activate()
  $modelWorkbook.SaveAs($outputFullPath, 51)

  $modelValues = $modelSheet.Range("J2:R$($sourceRows + 1)").Value2
  $sourceToModel = @(8, 9, 10, 11, 12, 13, 14, 15, 16)
  $mismatchCount = 0
  $checkedValues = 0
  for ($r = 1; $r -le $sourceRows; $r++) {
    if (-not (Test-ActiveStudentName $sourceValues[$r, 6])) { continue }
    for ($c = 0; $c -lt $sourceToModel.Count; $c++) {
      $checkedValues++
      $sourceColumn = [int]$sourceToModel[$c]
      if (-not (Values-Equal -Expected $sourceValues[$r, $sourceColumn] -Actual $modelValues[$r, ($c + 1)])) {
        $mismatchCount++
      }
    }
  }
  if ($mismatchCount -ne 0) { throw "Reconciliacao falhou: $mismatchCount divergencias em $checkedValues valores ativos." }

  $modelWorkbook.Close($true)
  Release-ComObject $modelWorkbook
  $modelWorkbook = $null
  $sourceWorkbook.Close($false)
  Release-ComObject $sourceWorkbook
  $sourceWorkbook = $null

  $validationWorkbook = $excel.Workbooks.Open($outputFullPath, 0, $true)
  $validationTable = $validationWorkbook.Worksheets.Item("LANCAMENTOS").ListObjects.Item($ModelTableName)
  $validationExportTable = $validationWorkbook.Worksheets.Item("EXPORT_NOTAS").ListObjects.Item("TB_EXPORT_NOTAS")
  $linkSources = $validationWorkbook.LinkSources(1)
  $externalLinkCount = if ($null -eq $linkSources) { 0 } else { @($linkSources).Count }
  $validationResult = [ordered]@{
    OutputPath = $outputFullPath
    ModelVersion = 2
    StructuralRows = [int]$validationTable.ListRows.Count
    ActiveRows = $activeRows
    ModelColumns = [int]$validationTable.ListColumns.Count
    ExportRows = [int]$validationExportTable.ListRows.Count
    ExportColumns = [int]$validationExportTable.ListColumns.Count
    CheckedNumericValues = $checkedValues
    ReconciliationMismatches = $mismatchCount
    ExternalLinks = $externalLinkCount
    FileFormat = [int]$validationWorkbook.FileFormat
    HasVbaProject = [bool]$validationWorkbook.HasVBProject
    Reopen = "ok"
  }
  $validationWorkbook.Close($false)
  Release-ComObject $validationExportTable
  Release-ComObject $validationTable
  Release-ComObject $validationWorkbook
  $validationWorkbook = $null
  [pscustomobject]$validationResult | ConvertTo-Json -Depth 4
} finally {
  if ($validationWorkbook) { try { $validationWorkbook.Close($false) } catch { } }
  if ($modelWorkbook) { try { $modelWorkbook.Close($false) } catch { } }
  if ($sourceWorkbook) { try { $sourceWorkbook.Close($false) } catch { } }
  if ($excel) { try { $excel.Quit() } catch { } }
  foreach ($object in @($exportTable, $modelTable, $exportSheet, $configSheet, $modelSheet, $readmeSheet, $sourceRange, $sourceTable, $sourceSheet, $validationWorkbook, $modelWorkbook, $sourceWorkbook, $excel)) {
    Release-ComObject $object
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
