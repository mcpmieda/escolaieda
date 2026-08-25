[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$WorkbookPath,
  [string]$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Release-ComObject {
  param([object]$Object)
  if ($null -ne $Object) { try { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($Object) } catch { } }
}

$excel = $null; $workbook = $null; $table = $null; $range = $null
try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false; $excel.DisplayAlerts = $false; $excel.EnableEvents = $false; $excel.AutomationSecurity = 3
  $workbook = $excel.Workbooks.Open([IO.Path]::GetFullPath($WorkbookPath), 0, $true)
  $table = $workbook.Worksheets.Item("LANCAMENTOS").ListObjects.Item("TB_LANCAMENTOS")
  $range = $table.DataBodyRange
  $values = $range.Value2
  $nameColumn = $table.ListColumns.Item("AlunoNome").Index
  $names = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  for ($row = 1; $row -le $range.Rows.Count; $row++) {
    $name = [string]$values[$row, $nameColumn]
    if (-not [string]::IsNullOrWhiteSpace($name) -and $name.Trim().Length -ge 7 -and $name.Trim() -match '\s') { [void]$names.Add($name.Trim()) }
  }

  $extensions = @(".js", ".mjs", ".html", ".css", ".json", ".md", ".yaml", ".yml", ".xml", ".ps1")
  $hits = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  $files = Get-ChildItem -LiteralPath $RepositoryRoot -Recurse -File | Where-Object {
    $_.Extension -in $extensions -and $_.FullName -notmatch '[\\/]\.git[\\/]'
  }
  foreach ($file in $files) {
    $content = [IO.File]::ReadAllText($file.FullName)
    foreach ($name in $names) {
      if ($content.IndexOf($name, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
        [void]$hits.Add($file.FullName.Substring($RepositoryRoot.Length).TrimStart('\', '/'))
        break
      }
    }
  }
  if ($hits.Count -gt 0) { throw "Dados reais detectados em $($hits.Count) arquivo(s) do worktree. Os nomes nao foram impressos." }
  [pscustomobject]@{
    DistinctRealNamesChecked = $names.Count
    TextFilesChecked = @($files).Count
    FilesWithRealNames = $hits.Count
    RealNamesPrinted = $false
    Status = "pass"
  } | ConvertTo-Json
} finally {
  if ($workbook) { try { $workbook.Close($false) } catch { } }
  if ($excel) { try { $excel.Quit() } catch { } }
  foreach ($object in @($range, $table, $workbook, $excel)) { Release-ComObject $object }
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}
