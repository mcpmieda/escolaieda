[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = "High")]
param(
  [string]$SiteUrl = "https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL",
  [string]$TenantId = "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",
  [string]$ClientId = "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",
  [string]$ModelListName = "NOTAS_POC_MODELO_NINA",
  [string]$EventListName = "NOTAS_POC_EVENTOS",
  [switch]$Apply,
  [switch]$Remove,
  [string]$ConfirmRemoval
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$allowedNames = @("NOTAS_POC_MODELO_NINA", "NOTAS_POC_EVENTOS")
foreach ($name in @($ModelListName, $EventListName)) {
  if ($name -notin $allowedNames) { throw "Nome de lista fora do escopo permitido da POC: $name" }
}
if ($Remove -and $ConfirmRemoval -ne "REMOVER-NOTAS-POC") {
  throw "Para remover, informe -ConfirmRemoval REMOVER-NOTAS-POC."
}

function Get-FieldDefinition {
  param([string]$InternalName, [string]$DisplayName, [string]$Type, [bool]$Required = $false, [bool]$Indexed = $false, [bool]$Unique = $false)
  return [pscustomobject]@{
    InternalName = $InternalName
    DisplayName = $DisplayName
    Type = $Type
    Required = $Required
    Indexed = $Indexed
    Unique = $Unique
  }
}

$modelFields = @(
  (Get-FieldDefinition "RegistroId" "RegistroId" "Text" $true $true $true),
  (Get-FieldDefinition "ChaveExterna" "ChaveExterna" "Text" $true $true $true),
  (Get-FieldDefinition "ContratoVersao" "ContratoVersao" "Number" $true),
  (Get-FieldDefinition "AnoLetivo" "AnoLetivo" "Number" $true $true),
  (Get-FieldDefinition "TurmaCodigo" "TurmaCodigo" "Text" $true $true),
  (Get-FieldDefinition "ComponenteCodigo" "ComponenteCodigo" "Text" $true $true),
  (Get-FieldDefinition "LinhaOrigem" "LinhaOrigem" "Number" $true),
  (Get-FieldDefinition "AlunoNome" "AlunoNome" "Text" $false),
  (Get-FieldDefinition "SituacaoMatricula" "SituacaoMatricula" "Text" $false),
  (Get-FieldDefinition "NotaT1" "NotaT1" "Number" $false),
  (Get-FieldDefinition "NotaT2" "NotaT2" "Number" $false),
  (Get-FieldDefinition "NotaT3" "NotaT3" "Number" $false),
  (Get-FieldDefinition "Total" "Total" "Number" $false),
  (Get-FieldDefinition "RecT1" "RecT1" "Number" $false),
  (Get-FieldDefinition "RecT2" "RecT2" "Number" $false),
  (Get-FieldDefinition "RecT3" "RecT3" "Number" $false),
  (Get-FieldDefinition "TotalRec" "TotalRec" "Number" $false),
  (Get-FieldDefinition "NotaFinal" "NotaFinal" "Number" $false),
  (Get-FieldDefinition "Sequencia" "Sequencia" "Number" $true),
  (Get-FieldDefinition "UltimoEventoId" "UltimoEventoId" "Text" $false),
  (Get-FieldDefinition "UltimaAlteracao" "UltimaAlteracao" "DateTime" $false),
  (Get-FieldDefinition "OrigemModelo" "OrigemModelo" "Text" $true),
  (Get-FieldDefinition "Ativo" "Ativo" "Boolean" $true $true)
)

$eventFields = @(
  (Get-FieldDefinition "EventId" "EventId" "Text" $true $true $true),
  (Get-FieldDefinition "IdempotencyKey" "IdempotencyKey" "Text" $true $true $true),
  (Get-FieldDefinition "CorrelationId" "CorrelationId" "Text" $true $true),
  (Get-FieldDefinition "SchemaVersion" "SchemaVersion" "Number" $true),
  (Get-FieldDefinition "EventType" "EventType" "Text" $true $true),
  (Get-FieldDefinition "GradeKey" "GradeKey" "Text" $true $true),
  (Get-FieldDefinition "SourceKind" "SourceKind" "Text" $true),
  (Get-FieldDefinition "WorkbookId" "WorkbookId" "Text" $true),
  (Get-FieldDefinition "WorksheetId" "WorksheetId" "Text" $true),
  (Get-FieldDefinition "CellAddress" "CellAddress" "Text" $true),
  (Get-FieldDefinition "FieldName" "FieldName" "Text" $true),
  (Get-FieldDefinition "ValueBefore" "ValueBefore" "Number" $false),
  (Get-FieldDefinition "ValueAfter" "ValueAfter" "Number" $false),
  (Get-FieldDefinition "DerivedTotal" "DerivedTotal" "Number" $false),
  (Get-FieldDefinition "DerivedTotalRec" "DerivedTotalRec" "Number" $false),
  (Get-FieldDefinition "DerivedNotaFinal" "DerivedNotaFinal" "Number" $false),
  (Get-FieldDefinition "Sequence" "Sequence" "Number" $true),
  (Get-FieldDefinition "SourceRevision" "SourceRevision" "Text" $false),
  (Get-FieldDefinition "ClientSentAt" "ClientSentAt" "DateTime" $true),
  (Get-FieldDefinition "Status" "Status" "Text" $true $true),
  (Get-FieldDefinition "ErrorCode" "ErrorCode" "Text" $false),
  (Get-FieldDefinition "SnapshotItemId" "SnapshotItemId" "Number" $false),
  (Get-FieldDefinition "PayloadHash" "PayloadHash" "Text" $true)
)

if (-not $Apply -and -not $Remove) {
  [pscustomobject]@{
    Mode = "dry-run"
    SiteUrl = $SiteUrl
    Lists = @(
      [pscustomobject]@{ Name = $ModelListName; Fields = $modelFields.Count; Purpose = "snapshot protegido do modelo Nina" },
      [pscustomobject]@{ Name = $EventListName; Fields = $eventFields.Count; Purpose = "log append-only de eventos da POC" }
    )
    Permissions = "herdadas do site; nenhum grupo ou permissao individual"
    RemovalGuard = "-Remove -ConfirmRemoval REMOVER-NOTAS-POC"
  } | ConvertTo-Json -Depth 5
  return
}

Import-Module PnP.PowerShell -ErrorAction Stop
Connect-PnPOnline -Url $SiteUrl -Tenant $TenantId -ClientId $ClientId -PersistLogin
$connectedUser = (Invoke-PnPGraphMethod -Url "v1.0/me?`$select=userPrincipalName" -Method Get).userPrincipalName

if ($Remove) {
  foreach ($name in @($EventListName, $ModelListName)) {
    $list = Get-PnPList -Identity $name -Includes Id, Title -ErrorAction SilentlyContinue
    if ($list -and $PSCmdlet.ShouldProcess("$SiteUrl/$name", "Remover lista de POC")) {
      Remove-PnPList -Identity $list.Id -Force
    }
  }
  [pscustomobject]@{ Mode = "remove"; ConnectedAs = $connectedUser; Removed = @($EventListName, $ModelListName) } | ConvertTo-Json -Depth 4
  return
}

function Ensure-List {
  param([string]$Name, [string]$Description, [array]$Fields)
  $list = Get-PnPList -Identity $Name -Includes Id, Title, Hidden, HasUniqueRoleAssignments -ErrorAction SilentlyContinue
  $created = $false
  if (-not $list) {
    if (-not $PSCmdlet.ShouldProcess("$SiteUrl/$Name", "Criar lista de POC")) { return $null }
    New-PnPList -Title $Name -Template GenericList -Url "Lists/$Name" -OnQuickLaunch:$false | Out-Null
    $list = Get-PnPList -Identity $Name -Includes Id, Title, Hidden, HasUniqueRoleAssignments
    $created = $true
  }
  Set-PnPList -Identity $list.Id -Description $Description -EnableVersioning $true -EnableAttachments $false | Out-Null
  $titleField = Get-PnPField -List $list.Id -Identity "Title"
  Set-PnPField -List $list.Id -Identity $titleField.Id -Values @{ Required = $true; Indexed = $true } | Out-Null

  $existingFields = @{}
  foreach ($field in (Get-PnPField -List $list.Id)) { $existingFields[$field.InternalName] = $field }
  $createdFields = 0
  foreach ($definition in $Fields) {
    if (-not $existingFields.ContainsKey($definition.InternalName)) {
      Add-PnPField -List $list.Id -InternalName $definition.InternalName -DisplayName $definition.DisplayName -Type $definition.Type -Required:$definition.Required -AddToDefaultView | Out-Null
      $createdFields++
    }
    $field = Get-PnPField -List $list.Id -Identity $definition.InternalName
    $values = @{ Required = $definition.Required }
    if ($definition.Indexed) { $values.Indexed = $true }
    if ($definition.Unique) { $values.EnforceUniqueValues = $true; $values.Indexed = $true }
    Set-PnPField -List $list.Id -Identity $field.Id -Values $values | Out-Null
  }
  $refreshed = Get-PnPList -Identity $list.Id -Includes Id, Title, HasUniqueRoleAssignments, ItemCount, RootFolder
  return [pscustomobject]@{
    Name = $Name
    Id = [string]$refreshed.Id
    Created = $created
    CreatedFields = $createdFields
    ItemCount = [int]$refreshed.ItemCount
    UniquePermissions = [bool]$refreshed.HasUniqueRoleAssignments
    ServerRelativeUrl = [string]$refreshed.RootFolder.ServerRelativeUrl
  }
}

$modelResult = Ensure-List -Name $ModelListName -Description "POC controlada: snapshot do novo modelo com dados de Nina. Nao e banco oficial." -Fields $modelFields
$eventResult = Ensure-List -Name $EventListName -Description "POC controlada: log de eventos grade.changed/recalculated. Nao e banco oficial." -Fields $eventFields

[pscustomobject]@{
  Mode = "apply"
  ConnectedAs = $connectedUser
  SiteUrl = $SiteUrl
  Lists = @($modelResult, $eventResult)
  Permissions = "inherited"
} | ConvertTo-Json -Depth 6
