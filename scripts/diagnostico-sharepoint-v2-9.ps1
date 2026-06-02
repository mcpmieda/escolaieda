param(
  [string]$SiteUrl = "https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL",
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
  $Saida = Join-Path $pastaDiagnosticos ("relatorio-auditoria-sharepoint-v2-9-{0}.md" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
}

if (-not (Test-Path $pastaDiagnosticos)) {
  New-Item -ItemType Directory -Path $pastaDiagnosticos | Out-Null
}

$linhas = [System.Collections.Generic.List[string]]::new()
Add-Linha $linhas "# Auditoria SharePoint V2.9"
Add-Linha $linhas ""
Add-Linha $linhas "- Site: $SiteUrl"
Add-Linha $linhas "- Gerado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Linha $linhas "- Modo: somente leitura; este script nao altera permissoes, listas, colunas, arquivos ou itens."
Add-Linha $linhas ""

if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
  Add-Linha $linhas "## Bloqueio"
  Add-Linha $linhas ""
  Add-Linha $linhas "Modulo PnP.PowerShell nao encontrado. Instale manualmente em uma sessao administrativa apropriada e execute novamente."
  $linhas | Set-Content -Path $Saida -Encoding UTF8
  Write-Host "Relatorio gerado: $Saida"
  return
}

Import-Module PnP.PowerShell
Connect-PnPOnline -Url $SiteUrl -Interactive

$listasEsperadas = @(
  @{ Nome = "DOCUMENTOS_ATIVOS"; Id = "7adea611-e627-4593-a0b0-cecf58744c16"; Obrigatoria = $true; Campos = @("FileLeafRef", "FileRef", "UniqueId", "Modified", "FileDirRef", "FSObjType", "GAVETA") },
  @{ Nome = "DOCUMENTOS_ARQUIVADOS"; Id = ""; Obrigatoria = $false; Campos = @("FileLeafRef", "FileRef", "UniqueId", "Modified", "FileDirRef", "FSObjType") },
  @{ Nome = "HISTORICO_ACESSOS"; Id = "144b31da-83f8-4ba4-b573-61fd8e5ac09f"; Obrigatoria = $true; Campos = @("Title", "USUARIO_EMAIL", "ACAO", "USUARIO_NOME", "DATA_HORA", "ARQUIVO_ID", "OBSERVACAO") },
  @{ Nome = "ANOTACOES_ARQUIVOS"; Id = "2698ef54-73e9-4ea1-995a-5d552349f57e"; Obrigatoria = $true; Campos = @("Title", "ARQUIVO_ID", "ANOTACAO", "ATUALIZADO_POR", "DATA_ATUALIZACAO") },
  @{ Nome = "ALERTAS_SISTEMA"; Id = "9abdb5fc-c009-4a59-9f91-03677b001b56"; Obrigatoria = $true; Campos = @("Title", "ARQUIVO_ID", "TIPO_ALERTA", "STATUS", "DATA_ALERTA", "OBSERVACAO") }
)

$web = Get-PnPWeb -Includes Title,Url,HasUniqueRoleAssignments
Add-Linha $linhas "## Site"
Add-Linha $linhas ""
Add-Linha $linhas "- Titulo: $($web.Title)"
Add-Linha $linhas "- URL: $($web.Url)"
Add-Linha $linhas "- Permissoes unicas no site: $($web.HasUniqueRoleAssignments)"
Add-Linha $linhas ""

Add-Linha $linhas "## Grupos E Usuarios"
Add-Linha $linhas ""
$grupos = Get-PnPGroup | Sort-Object Title
foreach ($grupo in $grupos) {
  Add-Linha $linhas "- Grupo: $($grupo.Title)"
}

$grupoSecretaria = $grupos | Where-Object { $_.Title -eq "GRUPO DA SECRETARIA - ARQUIVO DIGITAL" }
Add-Linha $linhas ""
Add-Linha $linhas "- Grupo da secretaria encontrado: $(if ($grupoSecretaria) { 'sim' } else { 'nao' })"
Add-Linha $linhas ""

$usuarios = Get-PnPUser | Sort-Object LoginName
Add-Linha $linhas "### Usuarios Diretos Conhecidos"
Add-Linha $linhas ""
foreach ($usuario in $usuarios) {
  Add-Linha $linhas "- $($usuario.Title) <$($usuario.Email)> [$($usuario.LoginName)]"
}
Add-Linha $linhas ""

$listasEncontradas = @{}
Add-Linha $linhas "## Listas, Bibliotecas E Campos"
Add-Linha $linhas ""

foreach ($esperada in $listasEsperadas) {
  Add-Linha $linhas "### $($esperada.Nome)"
  Add-Linha $linhas ""

  $lista = $null
  try {
    if ($esperada.Id) {
      $lista = Get-PnPList -Identity $esperada.Id -Includes Id,Title,BaseTemplate,ItemCount,EnableVersioning,RootFolder,HasUniqueRoleAssignments
    } else {
      $lista = Get-PnPList -Identity $esperada.Nome -Includes Id,Title,BaseTemplate,ItemCount,EnableVersioning,RootFolder,HasUniqueRoleAssignments
    }
  } catch {
    try {
      $lista = Get-PnPList -Identity $esperada.Nome -Includes Id,Title,BaseTemplate,ItemCount,EnableVersioning,RootFolder,HasUniqueRoleAssignments
    } catch {
      $lista = $null
    }
  }

  if (-not $lista) {
    Add-Linha $linhas "- Encontrada: nao"
    Add-Linha $linhas "- Obrigatoria pelo app: $($esperada.Obrigatoria)"
    Add-Linha $linhas ""
    continue
  }

  $listasEncontradas[$esperada.Nome] = $lista
  Add-Linha $linhas "- Encontrada: sim"
  Add-Linha $linhas "- Id: $($lista.Id)"
  Add-Linha $linhas "- Tipo/BaseTemplate: $($lista.BaseTemplate)"
  Add-Linha $linhas "- Itens: $($lista.ItemCount)"
  Add-Linha $linhas "- Versionamento: $($lista.EnableVersioning)"
  Add-Linha $linhas "- Permissoes unicas: $($lista.HasUniqueRoleAssignments)"
  Add-Linha $linhas "- Pasta raiz: $($lista.RootFolder.ServerRelativeUrl)"

  $campos = Get-PnPField -List $lista.Title
  $nomesCampos = $campos | ForEach-Object { $_.InternalName }
  $faltantes = @($esperada.Campos | Where-Object { $_ -notin $nomesCampos })
  Add-Linha $linhas "- Campos esperados ausentes: $(if ($faltantes.Count) { $faltantes -join ', ' } else { 'nenhum' })"
  Add-Linha $linhas ""

  $roleAssignments = Get-PnPProperty -ClientObject $lista -Property RoleAssignments
  Add-Linha $linhas "#### Permissoes Da Lista"
  Add-Linha $linhas ""
  foreach ($roleAssignment in $roleAssignments) {
    $member = Get-PnPProperty -ClientObject $roleAssignment -Property Member
    $bindings = Get-PnPProperty -ClientObject $roleAssignment -Property RoleDefinitionBindings
    $permissoes = ($bindings | ForEach-Object { $_.Name }) -join ", "
    Add-Linha $linhas "- $($member.Title): $permissoes"
  }
  Add-Linha $linhas ""
}

Add-Linha $linhas "## Itens Com Permissao Quebrada"
Add-Linha $linhas ""
foreach ($nomeLista in $listasEncontradas.Keys) {
  $lista = $listasEncontradas[$nomeLista]
  try {
    $itens = Get-PnPListItem -List $lista.Title -PageSize 500 -Fields "Title" -ScriptBlock {
      param($items)
      $items.Context.ExecuteQuery()
    }
    $quebrados = @($itens | Where-Object { $_.HasUniqueRoleAssignments })
    Add-Linha $linhas "- ${nomeLista}: $($quebrados.Count) item(ns) com permissao unica."
  } catch {
    Add-Linha $linhas "- ${nomeLista}: nao foi possivel conferir itens com permissao unica: $($_.Exception.Message)"
  }
}
Add-Linha $linhas ""

Add-Linha $linhas "## Orfaos Por ARQUIVO_ID"
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

Add-Linha $linhas "## Pontos Para Conferencia Manual"
Add-Linha $linhas ""
Add-Linha $linhas "- Links de compartilhamento anonimos ou externos nas bibliotecas."
Add-Linha $linhas "- Politica de compartilhamento externo do site."
Add-Linha $linhas "- Recycle bin primario e secundario antes de qualquer limpeza."
Add-Linha $linhas "- Membros externos, convidados ou usuarios diretos fora do grupo oficial."
Add-Linha $linhas "- App Registration e consentimentos Graph no Entra ID."
Add-Linha $linhas ""

$linhas | Set-Content -Path $Saida -Encoding UTF8
Write-Host "Relatorio gerado: $Saida"
