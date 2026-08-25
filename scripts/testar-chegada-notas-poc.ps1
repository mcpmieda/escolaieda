[CmdletBinding()]
param(
  [string]$SiteUrl = "https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL",
  [string]$TenantId = "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",
  [string]$ClientId = "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",
  [string]$ModelListName = "NOTAS_POC_MODELO_NINA",
  [string]$EventListName = "NOTAS_POC_EVENTOS"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
if ($ModelListName -ne "NOTAS_POC_MODELO_NINA" -or $EventListName -ne "NOTAS_POC_EVENTOS") { throw "Listas fora do escopo da POC." }

function New-Id { return [guid]::NewGuid().ToString() }
function Hash-Text {
  param([string]$Text)
  $sha = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($Text))).Replace("-", "").ToLowerInvariant()) } finally { $sha.Dispose() }
}
function Number-OrZero { param([object]$Value) if ($null -eq $Value -or [string]::IsNullOrWhiteSpace([string]$Value)) { return 0.0 }; return [double]$Value }

Import-Module PnP.PowerShell -ErrorAction Stop
Connect-PnPOnline -Url $SiteUrl -Tenant $TenantId -ClientId $ClientId -PersistLogin
$connectedUser = (Invoke-PnPGraphMethod -Url "v1.0/me?`$select=userPrincipalName" -Method Get).userPrincipalName
$modelList = Get-PnPList -Identity $ModelListName -Includes Id
$eventList = Get-PnPList -Identity $EventListName -Includes Id, ItemCount
$modelItem = Get-PnPListItem -List $modelList.Id -PageSize 1 -Fields "RegistroId", "ChaveExterna", "NotaT1", "NotaT2", "NotaT3", "RecT1", "RecT2", "RecT3", "Total", "TotalRec", "NotaFinal", "Sequencia", "Ativo" |
  Where-Object { [bool]$_["Ativo"] } | Select-Object -First 1
if (-not $modelItem) { throw "Nenhum snapshot ativo encontrado." }

$initial = @{
  NotaT1 = Number-OrZero $modelItem["NotaT1"]
  NotaT2 = Number-OrZero $modelItem["NotaT2"]
  NotaT3 = Number-OrZero $modelItem["NotaT3"]
  RecT1 = Number-OrZero $modelItem["RecT1"]
  RecT2 = Number-OrZero $modelItem["RecT2"]
  RecT3 = Number-OrZero $modelItem["RecT3"]
  Total = Number-OrZero $modelItem["Total"]
  TotalRec = Number-OrZero $modelItem["TotalRec"]
  NotaFinal = Number-OrZero $modelItem["NotaFinal"]
  Sequencia = Number-OrZero $modelItem["Sequencia"]
}
$testValue = if ($initial.NotaT1 -le 29) { $initial.NotaT1 + 1 } else { $initial.NotaT1 - 1 }
$testTotal = $testValue + $initial.NotaT2 + $initial.NotaT3
$testTotalRec = $initial.RecT1 + $initial.RecT2 + $initial.RecT3
$testFinal = [math]::Max($testTotal, $testTotalRec)
$gradeKey = [string]$modelItem["ChaveExterna"]
$correlationId = New-Id
$baseSequence = [math]::Max([int64]$initial.Sequencia + 1, [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())

function Add-TestEvent {
  param(
    [string]$EventType,
    [string]$IdempotencyKey,
    [int64]$Sequence,
    [double]$Before,
    [double]$After,
    [hashtable]$Derived = $null
  )
  $eventId = New-Id
  $sentAt = [DateTime]::UtcNow
  $values = @{
    Title = $eventId
    EventId = $eventId
    IdempotencyKey = $IdempotencyKey
    CorrelationId = $correlationId
    SchemaVersion = 1
    EventType = $EventType
    GradeKey = $gradeKey
    SourceKind = "reconciliation"
    WorkbookId = "poc-terminal"
    WorksheetId = "LANCAMENTOS"
    CellAddress = "TB_LANCAMENTOS[NotaT1]"
    FieldName = "NotaT1"
    ValueBefore = $Before
    ValueAfter = $After
    Sequence = $Sequence
    SourceRevision = $correlationId
    ClientSentAt = $sentAt
    Status = "received"
    SnapshotItemId = [double]$modelItem.Id
    PayloadHash = Hash-Text "$EventType|$IdempotencyKey|$Sequence|$Before|$After"
  }
  if ($Derived) {
    $values.DerivedTotal = $Derived.Total
    $values.DerivedTotalRec = $Derived.TotalRec
    $values.DerivedNotaFinal = $Derived.NotaFinal
  }
  $started = [Diagnostics.Stopwatch]::StartNew()
  $created = Add-PnPListItem -List $eventList.Id -Values $values
  Set-PnPListItem -List $eventList.Id -Identity $created.Id -Values @{ Status = "applied" } | Out-Null
  $started.Stop()
  $stored = Get-PnPListItem -List $eventList.Id -Id $created.Id -Fields "EventId", "IdempotencyKey", "Status", "Created", "ClientSentAt"
  return [pscustomobject]@{
    ItemId = [int]$created.Id
    EventId = $eventId
    IdempotencyKey = $IdempotencyKey
    ClientSentAt = $sentAt
    ServerCreatedAt = [DateTime]$stored["Created"]
    RoundTripMs = [int]$started.ElapsedMilliseconds
    Status = [string]$stored["Status"]
  }
}

$changedKey = "terminal:${correlationId}:${baseSequence}:changed"
$changed = Add-TestEvent -EventType "grade.changed" -IdempotencyKey $changedKey -Sequence $baseSequence -Before $initial.NotaT1 -After $testValue
Set-PnPListItem -List $modelList.Id -Identity $modelItem.Id -Values @{
  NotaT1 = $testValue; Sequencia = $baseSequence; UltimoEventoId = $changed.EventId; UltimaAlteracao = $changed.ClientSentAt
} | Out-Null

$derivedSequence = $baseSequence + 1
$recalculated = Add-TestEvent -EventType "grade.recalculated" -IdempotencyKey "terminal:${correlationId}:${derivedSequence}:recalculated" -Sequence $derivedSequence -Before $initial.NotaT1 -After $testValue -Derived @{
  Total = $testTotal; TotalRec = $testTotalRec; NotaFinal = $testFinal
}
Set-PnPListItem -List $modelList.Id -Identity $modelItem.Id -Values @{
  Total = $testTotal; TotalRec = $testTotalRec; NotaFinal = $testFinal; Sequencia = $derivedSequence; UltimoEventoId = $recalculated.EventId; UltimaAlteracao = $recalculated.ClientSentAt
} | Out-Null

$duplicateRejected = $false
try {
  Add-TestEvent -EventType "grade.changed" -IdempotencyKey $changedKey -Sequence $baseSequence -Before $initial.NotaT1 -After $testValue | Out-Null
} catch {
  $duplicateRejected = $true
}

$revertSequence = $derivedSequence + 1
$reverted = Add-TestEvent -EventType "grade.reverted" -IdempotencyKey "terminal:${correlationId}:${revertSequence}:reverted" -Sequence $revertSequence -Before $testValue -After $initial.NotaT1 -Derived @{
  Total = $initial.Total; TotalRec = $initial.TotalRec; NotaFinal = $initial.NotaFinal
}
Set-PnPListItem -List $modelList.Id -Identity $modelItem.Id -Values @{
  NotaT1 = $initial.NotaT1; Total = $initial.Total; TotalRec = $initial.TotalRec; NotaFinal = $initial.NotaFinal
  Sequencia = $revertSequence; UltimoEventoId = $reverted.EventId; UltimaAlteracao = $reverted.ClientSentAt
} | Out-Null

$finalItem = Get-PnPListItem -List $modelList.Id -Id $modelItem.Id -Fields "NotaT1", "Total", "TotalRec", "NotaFinal"
$restored =
  ([math]::Abs((Number-OrZero $finalItem["NotaT1"]) - $initial.NotaT1) -lt 0.0001) -and
  ([math]::Abs((Number-OrZero $finalItem["Total"]) - $initial.Total) -lt 0.0001) -and
  ([math]::Abs((Number-OrZero $finalItem["TotalRec"]) - $initial.TotalRec) -lt 0.0001) -and
  ([math]::Abs((Number-OrZero $finalItem["NotaFinal"]) - $initial.NotaFinal) -lt 0.0001)
if (-not $restored) { throw "A reversao final nao restaurou o snapshot inicial." }
if (-not $duplicateRejected) { throw "A restricao de idempotencia nao rejeitou a duplicata." }

[pscustomobject]@{
  ConnectedAs = $connectedUser
  CorrelationId = $correlationId
  ChangedRoundTripMs = $changed.RoundTripMs
  RecalculatedRoundTripMs = $recalculated.RoundTripMs
  RevertedRoundTripMs = $reverted.RoundTripMs
  ChangedStatus = $changed.Status
  RecalculatedStatus = $recalculated.Status
  DuplicateRejected = $duplicateRejected
  SnapshotRestored = $restored
  InitialValuePrinted = $false
  TestValuePrinted = $false
} | ConvertTo-Json -Depth 4
