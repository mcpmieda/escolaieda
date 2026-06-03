param(
  [string]$SiteUrl = "https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL",
  [string]$ClientId = $env:ENTRAID_APP_ID,
  [string]$Saida = ""
)

$ErrorActionPreference = "Stop"

function Add-Linha {
  param(
    [System.Collections.Generic.List[string]]$Linhas,
    [string]$Texto = ""
  )

  $Linhas.Add($Texto) | Out-Null
}

function Get-CampoSeguro {
  param(
    [object]$Item,
    [string]$Nome
  )

  try {
    return [string]$Item.FieldValues[$Nome]
  } catch {
    return ""
  }
}

$raizProjeto = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$pastaDiagnosticos = Join-Path $raizProjeto "diagnosticos"
if (-not $Saida) {
  $Saida = Join-Path $pastaDiagnosticos ("relatorio-operacional-mensal-v3-8-{0}.md" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
}

if (-not (Test-Path $pastaDiagnosticos)) {
  New-Item -ItemType Directory -Path $pastaDiagnosticos | Out-Null
}

$linhas = [System.Collections.Generic.List[string]]::new()
Add-Linha $linhas "# Rotina operacional mensal V3.8"
Add-Linha $linhas ""
Add-Linha $linhas "- Site: $SiteUrl"
Add-Linha $linhas "- Gerado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Linha $linhas "- Modo: somente leitura; nao altera permissoes, listas, arquivos, links ou itens."
Add-Linha $linhas ""

if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
  Add-Linha $linhas "## Bloqueio"
  Add-Linha $linhas ""
  Add-Linha $linhas "Modulo PnP.PowerShell nao encontrado."
  $linhas | Set-Content -Path $Saida -Encoding UTF8
  Write-Host "Relatorio gerado: $Saida"
  return
}

Import-Module PnP.PowerShell
if ($ClientId) {
  Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId
} else {
  Connect-PnPOnline -Url $SiteUrl -Interactive
}

$listas = @(
  "DOCUMENTOS_ATIVOS",
  "DOCUMENTOS_ARQUIVADOS",
  "HISTORICO_ACESSOS",
  "ANOTACOES_ARQUIVOS",
  "ALERTAS_SISTEMA"
)

Add-Linha $linhas "## Checklist mensal"
Add-Linha $linhas ""
Add-Linha $linhas "- Conferir membros dos grupos da Secretaria e remover acessos indevidos pelo SharePoint, se houver."
Add-Linha $linhas "- Revisar links compartilhados diretamente no SharePoint Admin Center."
Add-Linha $linhas "- Conferir permissoes unicas em listas e itens antes de qualquer limpeza."
Add-Linha $linhas "- Conferir registros orfaos por ARQUIVO_ID antes de apagar dados de apoio."
Add-Linha $linhas "- Conferir lixeira primaria/secundaria e versionamento antes de limpeza operacional."
Add-Linha $linhas ""

Add-Linha $linhas "## Grupos do site"
Add-Linha $linhas ""
Get-PnPGroup | Sort-Object Title | ForEach-Object {
  Add-Linha $linhas "- $($_.Title)"
}
Add-Linha $linhas ""

Add-Linha $linhas "## Saude das listas"
Add-Linha $linhas ""
$listasEncontradas = @{}
foreach ($nome in $listas) {
  try {
    $lista = Get-PnPList -Identity $nome -Includes Title,ItemCount,EnableVersioning,HasUniqueRoleAssignments,RootFolder
    $listasEncontradas[$nome] = $lista
    Add-Linha $linhas "### $nome"
    Add-Linha $linhas ""
    Add-Linha $linhas "- Itens: $($lista.ItemCount)"
    Add-Linha $linhas "- Versionamento: $($lista.EnableVersioning)"
    Add-Linha $linhas "- Permissoes unicas na lista: $($lista.HasUniqueRoleAssignments)"
    Add-Linha $linhas "- Raiz: $($lista.RootFolder.ServerRelativeUrl)"
    Add-Linha $linhas ""
  } catch {
    Add-Linha $linhas "### $nome"
    Add-Linha $linhas ""
    Add-Linha $linhas "- Erro ao consultar: $($_.Exception.Message)"
    Add-Linha $linhas ""
  }
}

Add-Linha $linhas "## Itens com permissoes unicas"
Add-Linha $linhas ""
foreach ($nome in $listasEncontradas.Keys) {
  $lista = $listasEncontradas[$nome]
  try {
    $itens = Get-PnPListItem -List $lista.Title -PageSize 500 -Fields "Title" -ScriptBlock {
      param($items)
      $items.Context.ExecuteQuery()
    }
    $quebrados = @($itens | Where-Object { $_.HasUniqueRoleAssignments })
    Add-Linha $linhas "- ${nome}: $($quebrados.Count) item(ns) com permissao unica."
  } catch {
    Add-Linha $linhas "- ${nome}: nao foi possivel conferir itens: $($_.Exception.Message)"
  }
}
Add-Linha $linhas ""

Add-Linha $linhas "## Registros orfaos por ARQUIVO_ID"
Add-Linha $linhas ""
try {
  $docs = if ($listasEncontradas.ContainsKey("DOCUMENTOS_ATIVOS")) {
    Get-PnPListItem -List $listasEncontradas["DOCUMENTOS_ATIVOS"].Title -PageSize 500 -Fields "UniqueId", "FileLeafRef", "FileDirRef", "FSObjType"
  } else {
    @()
  }

  $idsDocs = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
  foreach ($doc in $docs) {
    $id = Get-CampoSeguro $doc "UniqueId"
    if ($id) { $idsDocs.Add($id) | Out-Null }
  }

  foreach ($nomeApoio in @("HISTORICO_ACESSOS", "ANOTACOES_ARQUIVOS", "ALERTAS_SISTEMA")) {
    if (-not $listasEncontradas.ContainsKey($nomeApoio)) {
      Add-Linha $linhas "- ${nomeApoio}: lista nao encontrada."
      continue
    }

    $itensApoio = Get-PnPListItem -List $listasEncontradas[$nomeApoio].Title -PageSize 500 -Fields "Title", "ARQUIVO_ID"
    $semArquivoId = 0
    $semDocumento = 0
    foreach ($item in $itensApoio) {
      $arquivoId = Get-CampoSeguro $item "ARQUIVO_ID"
      if (-not $arquivoId) {
        $semArquivoId++
      } elseif (-not $idsDocs.Contains($arquivoId)) {
        $semDocumento++
      }
    }

    Add-Linha $linhas "- ${nomeApoio}: sem ARQUIVO_ID=$semArquivoId; ARQUIVO_ID sem documento ativo/lixeira=$semDocumento."
  }
} catch {
  Add-Linha $linhas "- Nao foi possivel concluir conferencia de orfaos: $($_.Exception.Message)"
}
Add-Linha $linhas ""

Add-Linha $linhas "## Itens para conferencia manual"
Add-Linha $linhas ""
Add-Linha $linhas "- Links anonimos/externos e politica de compartilhamento do site."
Add-Linha $linhas "- Usuarios convidados, contas diretas e membros fora do grupo operacional."
Add-Linha $linhas "- Lixeira primaria e secundaria antes de exclusoes definitivas."
Add-Linha $linhas "- App Registration, consentimentos Graph e escopos concedidos."

$linhas | Set-Content -Path $Saida -Encoding UTF8
Write-Host "Relatorio gerado: $Saida"
