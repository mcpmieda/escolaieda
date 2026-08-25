[CmdletBinding(SupportsShouldProcess=$true)]
param(
  [Parameter(Mandatory=$true)][string]$ManifestJson,
  [Parameter(Mandatory=$true)][string]$TechnicalPayloadXlsx,
  [Parameter(Mandatory=$true)][string]$OutputDirectory,
  [int]$SchoolYear = 2026,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$manifestPath = [IO.Path]::GetFullPath($ManifestJson)
$payloadPath = [IO.Path]::GetFullPath($TechnicalPayloadXlsx)
$outputRoot = [IO.Path]::GetFullPath($OutputDirectory)
if (-not (Test-Path -LiteralPath $manifestPath)) { throw "Manifesto não encontrado: $manifestPath" }
if (-not (Test-Path -LiteralPath $payloadPath)) { throw "Payload não encontrado: $payloadPath" }
$items = @(Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json)
if ($items.Count -eq 0) { throw 'O manifesto não contém professores.' }
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null

$generator = Join-Path $PSScriptRoot 'gerar-modelo-professor-v3.ps1'
$inventory = [Collections.Generic.List[object]]::new()
foreach ($item in $items) {
  foreach ($required in @('sourceXlsb','teacherDisplayName','outputFileName')) {
    if (-not $item.$required) { throw "Campo obrigatório ausente no manifesto: $required" }
  }
  if ([IO.Path]::GetExtension([string]$item.outputFileName) -ne '.xlsx') { throw 'outputFileName deve terminar em .xlsx.' }
  $destination = Join-Path $outputRoot ([IO.Path]::GetFileName([string]$item.outputFileName))
  if ($PSCmdlet.ShouldProcess($destination, "Gerar modelo de $($item.teacherDisplayName)")) {
    try {
      $arguments = @{
        SourceXlsb=[string]$item.sourceXlsb; TechnicalPayloadXlsx=$payloadPath; OutputXlsx=$destination;
        TeacherDisplayName=[string]$item.teacherDisplayName; SchoolYear=$SchoolYear
      }
      if ($Force) { $arguments.Force=$true }
      $audit = & $generator @arguments | ConvertFrom-Json
      $inventory.Add([ordered]@{
        teacherDisplayName=[string]$item.teacherDisplayName; teacherEntraUpn=[string]$item.teacherEntraUpn;
        outputPath=$destination; modelId=$audit.modelId; status='validated'; syncEnabled=$false;
        shareStatus='awaiting_human_review'; auditPath="$destination.audit.json"
      })
    } catch {
      $inventory.Add([ordered]@{teacherDisplayName=[string]$item.teacherDisplayName; outputPath=$destination; status='failed'; error=$_.Exception.Message})
    }
  }
}
$inventoryPath = Join-Path $outputRoot "inventario-modelos-$SchoolYear.json"
$inventory | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $inventoryPath -Encoding UTF8
$inventory
