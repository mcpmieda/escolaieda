[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$WorkbookPath,
  [string]$SiteUrl = "https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL",
  [string]$TenantId = "f04e0fa3-b8dc-4f77-be3c-7dfda0635188",
  [string]$ClientId = "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",
  [string]$UserPrincipalName = "SECRETARIA@escolaieda.com",
  [string]$DriveFolder = "PEDAGÓGICO/CONTROLE DE NOTAS/_POC_NOTAS_SYNC_2026",
  [string]$RemoteFileName = "Modelo_Notas_Nina_2026_POC.xlsx"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$workbookFullPath = [IO.Path]::GetFullPath($WorkbookPath)
if (-not (Test-Path -LiteralPath $workbookFullPath)) { throw "Workbook nao encontrado: $workbookFullPath" }
if ([IO.Path]::GetExtension($workbookFullPath) -ne ".xlsx") { throw "Somente o modelo .xlsx pode ser publicado por este script." }
if ($DriveFolder -ne "PEDAGÓGICO/CONTROLE DE NOTAS/_POC_NOTAS_SYNC_2026") { throw "Pasta remota fora do escopo permitido da POC." }

function Encode-GraphPath {
  param([string]$Path)
  return (($Path -split '/') | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
}

Import-Module PnP.PowerShell -ErrorAction Stop
Connect-PnPOnline -Url $SiteUrl -Tenant $TenantId -ClientId $ClientId -PersistLogin
$me = Invoke-PnPGraphMethod -Url "v1.0/me?`$select=userPrincipalName" -Method Get
$drive = Invoke-PnPGraphMethod -Url "v1.0/users/$UserPrincipalName/drive?`$select=id,webUrl" -Method Get

$parentPath = ($DriveFolder -split '/')[0..(($DriveFolder -split '/').Count - 2)] -join '/'
$folderName = ($DriveFolder -split '/')[-1]
$encodedFolder = Encode-GraphPath $DriveFolder
$folder = $null
try {
  $folder = Invoke-PnPGraphMethod -Url "v1.0/users/$UserPrincipalName/drive/root:/$encodedFolder" -Method Get
} catch {
  $encodedParent = Encode-GraphPath $parentPath
  $folder = Invoke-PnPGraphMethod -Url "v1.0/users/$UserPrincipalName/drive/root:/$encodedParent`:/children" -Method Post -Content @{
    name = $folderName
    folder = @{}
    '@microsoft.graph.conflictBehavior' = 'fail'
  }
}

$tokenSecure = Get-PnPAccessToken -ResourceTypeName Graph
$token = if ($tokenSecure -is [Security.SecureString]) { ConvertFrom-SecureString $tokenSecure -AsPlainText } else { [string]$tokenSecure }
$remotePath = "$DriveFolder/$RemoteFileName"
$encodedRemotePath = Encode-GraphPath $remotePath
$uploadUri = "https://graph.microsoft.com/v1.0/users/$UserPrincipalName/drive/root:/$encodedRemotePath`:/content"
$item = Invoke-RestMethod -Uri $uploadUri -Method Put -InFile $workbookFullPath -ContentType "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -Headers @{ Authorization = "Bearer $token" }
$token = $null

$link = Invoke-PnPGraphMethod -Url "v1.0/users/$UserPrincipalName/drive/items/$($item.id)/createLink" -Method Post -Content @{ type = "edit"; scope = "organization" }
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $workbookFullPath).Hash

[pscustomobject]@{
  ConnectedAs = $me.userPrincipalName
  TargetDriveUser = $UserPrincipalName
  DriveId = $drive.id
  FolderId = $folder.id
  ItemId = $item.id
  RemotePath = $remotePath
  FileSize = [int64]$item.size
  WorkbookSha256 = $hash
  WebUrl = $item.webUrl
  OrganizationEditLink = $link.link.webUrl
  AnonymousLink = $false
} | ConvertTo-Json -Depth 5
