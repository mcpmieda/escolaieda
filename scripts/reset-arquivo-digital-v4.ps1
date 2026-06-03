param(
  [ValidateSet("DryRun", "ResetSeguro")]
  [string]$Mode = "DryRun",
  [switch]$IncluirLixeira,
  [switch]$EnviarParaLixeiraSharePoint,
  [switch]$PularBackupMetadados,
  [string]$SiteUrl = "https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL",
  [string]$ClientId = $env:ENTRAID_APP_ID
)

$ErrorActionPreference = "Stop"

$SitePermitido = "https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL"
$RootDocumentos = "/sites/ARQUIVODIGITAL/DOCUMENTOS_ATIVOS"
$RootLixeira = "/sites/ARQUIVODIGITAL/DOCUMENTOS_ATIVOS/_ARQUIVADOS"
$ListasApoio = @("HISTORICO_ACESSOS", "ANOTACOES_ARQUIVOS", "ALERTAS_SISTEMA")
$ListasEsperadas = @("DOCUMENTOS_ATIVOS", "DOCUMENTOS_ARQUIVADOS") + $ListasApoio

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
    return $Item.FieldValues[$Nome]
  } catch {
    return $null
  }
}

function ConvertTo-TextoSeguro {
  param([object]$Valor)

  if ($null -eq $Valor) { return "" }
  if ($Valor.PSObject.Properties.Name -contains "LookupValue") { return [string]$Valor.LookupValue }
  if ($Valor -is [array]) { return ($Valor | ForEach-Object { ConvertTo-TextoSeguro $_ }) -join "; " }
  return [string]$Valor
}

function Get-ItensLista {
  param(
    [string]$Lista,
    [string[]]$Campos
  )

  return @(Get-PnPListItem -List $Lista -PageSize 500 -Fields $Campos -ScriptBlock {
    param($items)
    $items.Context.ExecuteQuery()
  })
}

function Confirmar-CmdletsRecycle {
  $removeFile = Get-Command Remove-PnPFile -ErrorAction Stop
  $removeItem = Get-Command Remove-PnPListItem -ErrorAction Stop

  if (-not $removeFile.Parameters.ContainsKey("Recycle")) {
    throw "Remove-PnPFile nao possui parametro -Recycle. Abortando para evitar exclusao definitiva."
  }
  if (-not $removeItem.Parameters.ContainsKey("Recycle")) {
    throw "Remove-PnPListItem nao possui parametro -Recycle. Abortando para evitar exclusao definitiva."
  }
}

function Confirmar-SiteSeguro {
  param([string]$UrlEsperada)

  $web = Get-PnPWeb -Includes Title,Url
  $urlAtual = ([string]$web.Url).TrimEnd("/")
  $urlPermitida = $UrlEsperada.TrimEnd("/")

  if ($urlAtual -ne $urlPermitida) {
    throw "Site conectado invalido: $urlAtual. Esperado: $urlPermitida."
  }

  if ($urlAtual -notmatch "/sites/ARQUIVODIGITAL$") {
    throw "Site conectado nao termina em /sites/ARQUIVODIGITAL. Abortando."
  }

  return $web
}

function Confirmar-ListasEsperadas {
  param([string[]]$Nomes)

  $mapa = @{}
  foreach ($nome in $Nomes) {
    try {
      $lista = Get-PnPList -Identity $nome -Includes Title,ItemCount,RootFolder,EnableVersioning,HasUniqueRoleAssignments
      $mapa[$nome] = $lista
    } catch {
      throw "Lista/biblioteca esperada nao encontrada: $nome. $($_.Exception.Message)"
    }
  }
  return $mapa
}

function Get-DocumentosReset {
  param([switch]$ComLixeira)

  $campos = @("FileLeafRef", "FileRef", "UniqueId", "Modified", "Editor", "GAVETA", "FSObjType", "FileDirRef", "ID")
  $itens = Get-ItensLista -Lista "DOCUMENTOS_ATIVOS" -Campos $campos
  $arquivos = @($itens | Where-Object { [string](Get-CampoSeguro $_ "FSObjType") -eq "0" })

  $ativos = @($arquivos | Where-Object { [string](Get-CampoSeguro $_ "FileDirRef") -eq $RootDocumentos })
  $lixeira = @($arquivos | Where-Object { [string](Get-CampoSeguro $_ "FileDirRef") -eq $RootLixeira })
  $alvo = if ($ComLixeira) { @($ativos + $lixeira) } else { $ativos }

  return [pscustomobject]@{
    Ativos = $ativos
    Lixeira = $lixeira
    Alvo = $alvo
  }
}

function Convert-DocumentoCsv {
  param([object]$Item)

  [pscustomobject]@{
    ID = $Item.Id
    Nome = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "FileLeafRef")
    Caminho = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "FileRef")
    UniqueId = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "UniqueId")
    Modified = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "Modified")
    Editor = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "Editor")
    GAVETA = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "GAVETA")
  }
}

function Convert-ItemApoioCsv {
  param(
    [object]$Item,
    [string]$Lista
  )

  [pscustomobject]@{
    Lista = $Lista
    ID = $Item.Id
    Title = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "Title")
    ARQUIVO_ID = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "ARQUIVO_ID")
    ACAO = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "ACAO")
    USUARIO_EMAIL = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "USUARIO_EMAIL")
    USUARIO_NOME = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "USUARIO_NOME")
    DATA_HORA = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "DATA_HORA")
    TIPO_ALERTA = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "TIPO_ALERTA")
    STATUS = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "STATUS")
    DATA_ALERTA = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "DATA_ALERTA")
    ATUALIZADO_POR = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "ATUALIZADO_POR")
    DATA_ATUALIZACAO = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "DATA_ATUALIZACAO")
    TemAnotacao = [bool]((ConvertTo-TextoSeguro (Get-CampoSeguro $Item "ANOTACAO")).Trim())
    TamanhoAnotacao = (ConvertTo-TextoSeguro (Get-CampoSeguro $Item "ANOTACAO")).Length
    TamanhoObservacao = (ConvertTo-TextoSeguro (Get-CampoSeguro $Item "OBSERVACAO")).Length
  }
}

function Exportar-Backup {
  param(
    [string]$Pasta,
    [object]$Documentos,
    [hashtable]$ItensApoio,
    [hashtable]$Contagens,
    [object]$Web
  )

  if (-not $PularBackupMetadados) {
    $Documentos.Ativos | ForEach-Object { Convert-DocumentoCsv $_ } |
      Export-Csv -NoTypeInformation -Encoding UTF8 -Path (Join-Path $Pasta "documentos-ativos.csv")
    $Documentos.Lixeira | ForEach-Object { Convert-DocumentoCsv $_ } |
      Export-Csv -NoTypeInformation -Encoding UTF8 -Path (Join-Path $Pasta "documentos-lixeira.csv")
    $ItensApoio["HISTORICO_ACESSOS"] | ForEach-Object { Convert-ItemApoioCsv $_ "HISTORICO_ACESSOS" } |
      Export-Csv -NoTypeInformation -Encoding UTF8 -Path (Join-Path $Pasta "historico.csv")
    $ItensApoio["ANOTACOES_ARQUIVOS"] | ForEach-Object { Convert-ItemApoioCsv $_ "ANOTACOES_ARQUIVOS" } |
      Export-Csv -NoTypeInformation -Encoding UTF8 -Path (Join-Path $Pasta "anotacoes.csv")
    $ItensApoio["ALERTAS_SISTEMA"] | ForEach-Object { Convert-ItemApoioCsv $_ "ALERTAS_SISTEMA" } |
      Export-Csv -NoTypeInformation -Encoding UTF8 -Path (Join-Path $Pasta "alertas.csv")
  }

  $linhas = [System.Collections.Generic.List[string]]::new()
  Add-Linha $linhas "# Resumo antes do reset V4"
  Add-Linha $linhas ""
  Add-Linha $linhas "- Data/hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
  Add-Linha $linhas "- Site: $($Web.Url)"
  Add-Linha $linhas "- Titulo: $($Web.Title)"
  Add-Linha $linhas "- Modo: $Mode"
  Add-Linha $linhas "- Backup metadados: $(if ($PularBackupMetadados) { 'pulado por parametro' } else { 'gerado' })"
  Add-Linha $linhas ""
  Add-Linha $linhas "## Contagens antes"
  Add-Linha $linhas ""
  foreach ($chave in ($Contagens.Keys | Sort-Object)) {
    Add-Linha $linhas "- ${chave}: $($Contagens[$chave])"
  }

  $linhas | Set-Content -Path (Join-Path $Pasta "resumo-antes.md") -Encoding UTF8
}

function Remover-ArquivosParaLixeira {
  param(
    [object[]]$Itens,
    [System.Collections.Generic.List[object]]$Falhas
  )

  $removidos = 0
  $total = $Itens.Count
  for ($i = 0; $i -lt $total; $i++) {
    $item = $Itens[$i]
    $caminho = ConvertTo-TextoSeguro (Get-CampoSeguro $item "FileRef")
    Write-Progress -Activity "Enviando PDFs para Lixeira do SharePoint" -Status "$($i + 1) de $total" -PercentComplete ((($i + 1) / [Math]::Max($total, 1)) * 100)

    if (-not $caminho -or -not $caminho.StartsWith($RootDocumentos)) {
      $Falhas.Add([pscustomobject]@{ Tipo = "arquivo"; ID = $item.Id; Caminho = $caminho; Erro = "Caminho fora de DOCUMENTOS_ATIVOS" }) | Out-Null
      continue
    }

    try {
      Remove-PnPFile -ServerRelativeUrl $caminho -Recycle -Force | Out-Null
      $removidos++
    } catch {
      $Falhas.Add([pscustomobject]@{ Tipo = "arquivo"; ID = $item.Id; Caminho = $caminho; Erro = $_.Exception.Message }) | Out-Null
    }
  }
  Write-Progress -Activity "Enviando PDFs para Lixeira do SharePoint" -Completed
  return $removidos
}

function Remover-ItensListaParaLixeira {
  param(
    [string]$Lista,
    [object[]]$Itens,
    [System.Collections.Generic.List[object]]$Falhas
  )

  $removidos = 0
  $total = $Itens.Count
  for ($i = 0; $i -lt $total; $i++) {
    $item = $Itens[$i]
    Write-Progress -Activity "Enviando itens de $Lista para Lixeira do SharePoint" -Status "$($i + 1) de $total" -PercentComplete ((($i + 1) / [Math]::Max($total, 1)) * 100)

    try {
      Remove-PnPListItem -List $Lista -Identity $item.Id -Recycle -Force | Out-Null
      $removidos++
    } catch {
      $Falhas.Add([pscustomobject]@{ Tipo = "lista"; Lista = $Lista; ID = $item.Id; Caminho = ""; Erro = $_.Exception.Message }) | Out-Null
    }
  }
  Write-Progress -Activity "Enviando itens de $Lista para Lixeira do SharePoint" -Completed
  return $removidos
}

function Obter-ItensApoio {
  $camposPorLista = @{
    HISTORICO_ACESSOS = @("Title", "USUARIO_EMAIL", "ACAO", "USUARIO_NOME", "DATA_HORA", "ARQUIVO_ID", "OBSERVACAO")
    ANOTACOES_ARQUIVOS = @("Title", "ARQUIVO_ID", "ANOTACAO", "ATUALIZADO_POR", "DATA_ATUALIZACAO")
    ALERTAS_SISTEMA = @("Title", "ARQUIVO_ID", "TIPO_ALERTA", "STATUS", "DATA_ALERTA", "OBSERVACAO")
  }

  $resultado = @{}
  foreach ($lista in $ListasApoio) {
    $resultado[$lista] = @(Get-ItensLista -Lista $lista -Campos $camposPorLista[$lista])
  }
  return $resultado
}

function Obter-Contagens {
  param(
    [object]$Documentos,
    [hashtable]$ItensApoio,
    [hashtable]$Listas
  )

  return @{
    "DOCUMENTOS_ATIVOS_PDF_RAIZ" = $Documentos.Ativos.Count
    "DOCUMENTOS_ATIVOS_PDF_LIXEIRA_INTERNA" = $Documentos.Lixeira.Count
    "DOCUMENTOS_RESET_ALVO" = $Documentos.Alvo.Count
    "DOCUMENTOS_ARQUIVADOS_DIAGNOSTICO" = $Listas["DOCUMENTOS_ARQUIVADOS"].ItemCount
    "HISTORICO_ACESSOS" = $ItensApoio["HISTORICO_ACESSOS"].Count
    "ANOTACOES_ARQUIVOS" = $ItensApoio["ANOTACOES_ARQUIVOS"].Count
    "ALERTAS_SISTEMA" = $ItensApoio["ALERTAS_SISTEMA"].Count
  }
}

function Escrever-ResumoFinal {
  param(
    [string]$Pasta,
    [object]$Web,
    [hashtable]$Antes,
    [hashtable]$Depois,
    [hashtable]$Removidos,
    [System.Collections.Generic.List[object]]$Falhas
  )

  $conta = Get-PnPConnection
  $linhas = [System.Collections.Generic.List[string]]::new()
  Add-Linha $linhas "# Resumo final reset V4"
  Add-Linha $linhas ""
  Add-Linha $linhas "- Data/hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
  Add-Linha $linhas "- Usuario conectado: $($conta.PSObject.Properties['ConnectionMethod']?.Value)"
  Add-Linha $linhas "- Site: $($Web.Url)"
  Add-Linha $linhas "- Titulo: $($Web.Title)"
  Add-Linha $linhas "- Modo: $Mode"
  Add-Linha $linhas "- Incluir lixeira interna: $([bool]$IncluirLixeira)"
  Add-Linha $linhas "- Enviar para Lixeira SharePoint: $([bool]$EnviarParaLixeiraSharePoint)"
  Add-Linha $linhas ""
  Add-Linha $linhas "## Itens antes"
  Add-Linha $linhas ""
  foreach ($chave in ($Antes.Keys | Sort-Object)) { Add-Linha $linhas "- ${chave}: $($Antes[$chave])" }
  Add-Linha $linhas ""
  Add-Linha $linhas "## Enviados para Lixeira"
  Add-Linha $linhas ""
  foreach ($chave in ($Removidos.Keys | Sort-Object)) { Add-Linha $linhas "- ${chave}: $($Removidos[$chave])" }
  Add-Linha $linhas ""
  Add-Linha $linhas "## Itens depois"
  Add-Linha $linhas ""
  foreach ($chave in ($Depois.Keys | Sort-Object)) { Add-Linha $linhas "- ${chave}: $($Depois[$chave])" }
  Add-Linha $linhas ""
  Add-Linha $linhas "## Falhas"
  Add-Linha $linhas ""
  Add-Linha $linhas "- Total: $($Falhas.Count)"
  Add-Linha $linhas ""
  Add-Linha $linhas "## Observacoes"
  Add-Linha $linhas ""
  Add-Linha $linhas "- Nenhuma exclusao definitiva foi solicitada por este script."
  Add-Linha $linhas "- Estrutura, colunas, gavetas, permissoes e grupos nao sao alterados por este script."
  Add-Linha $linhas "- Itens enviados para a Lixeira do SharePoint podem ser recuperaveis conforme retencao do SharePoint."

  $linhas | Set-Content -Path (Join-Path $Pasta "resumo-final.md") -Encoding UTF8
  if ($Falhas.Count) {
    $Falhas | Export-Csv -NoTypeInformation -Encoding UTF8 -Path (Join-Path $Pasta "falhas.csv")
  }
}

$raizProjeto = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$pastaDiagnosticos = Join-Path $raizProjeto "diagnosticos"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$pastaReset = Join-Path $pastaDiagnosticos "reset-v4-$timestamp"
New-Item -ItemType Directory -Path $pastaReset -Force | Out-Null

Write-Host "Reset Arquivo Digital V4.0"
Write-Host "Modo: $Mode"
Write-Host "Site permitido: $SitePermitido"
Write-Host "Relatorios: $pastaReset"
Write-Host "Este script nao apaga estrutura, permissoes, colunas, gavetas nem listas."

if ($SiteUrl.TrimEnd("/") -ne $SitePermitido) {
  throw "Parametro SiteUrl invalido. Use exatamente $SitePermitido."
}

if ($Mode -eq "ResetSeguro" -and -not $EnviarParaLixeiraSharePoint) {
  throw "ResetSeguro exige -EnviarParaLixeiraSharePoint para evitar exclusao definitiva."
}

if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
  throw "Modulo PnP.PowerShell nao encontrado."
}

Import-Module PnP.PowerShell
Confirmar-CmdletsRecycle

if ($ClientId) {
  Connect-PnPOnline -Url $SitePermitido -Interactive -ClientId $ClientId
} else {
  Connect-PnPOnline -Url $SitePermitido -Interactive
}

$web = Confirmar-SiteSeguro -UrlEsperada $SitePermitido
$listas = Confirmar-ListasEsperadas -Nomes $ListasEsperadas
$documentosAntes = Get-DocumentosReset -ComLixeira:$IncluirLixeira
$itensApoioAntes = Obter-ItensApoio
$contagensAntes = Obter-Contagens -Documentos $documentosAntes -ItensApoio $itensApoioAntes -Listas $listas

Exportar-Backup -Pasta $pastaReset -Documentos $documentosAntes -ItensApoio $itensApoioAntes -Contagens $contagensAntes -Web $web

if ($Mode -eq "DryRun") {
  $linhas = [System.Collections.Generic.List[string]]::new()
  Add-Linha $linhas "# DryRun reset V4"
  Add-Linha $linhas ""
  Add-Linha $linhas "- Data/hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
  Add-Linha $linhas "- Site: $($web.Url)"
  Add-Linha $linhas "- Titulo: $($web.Title)"
  Add-Linha $linhas "- Incluir lixeira interna: $([bool]$IncluirLixeira)"
  Add-Linha $linhas ""
  Add-Linha $linhas "## O que seria enviado para a Lixeira"
  Add-Linha $linhas ""
  foreach ($chave in ($contagensAntes.Keys | Sort-Object)) { Add-Linha $linhas "- ${chave}: $($contagensAntes[$chave])" }
  Add-Linha $linhas ""
  Add-Linha $linhas "## Amostra documentos alvo"
  Add-Linha $linhas ""
  $documentosAntes.Alvo | Select-Object -First 10 | ForEach-Object {
    Add-Linha $linhas "- $((ConvertTo-TextoSeguro (Get-CampoSeguro $_ 'FileLeafRef'))) | $((ConvertTo-TextoSeguro (Get-CampoSeguro $_ 'FileRef')))"
  }
  $linhas | Set-Content -Path (Join-Path $pastaReset "dryrun.md") -Encoding UTF8
  Write-Host "DryRun concluido. Nada foi removido."
  Write-Host "Relatorio: $pastaReset"
  return
}

$falhas = [System.Collections.Generic.List[object]]::new()
$removidos = @{
  "DOCUMENTOS_PDF" = 0
  "HISTORICO_ACESSOS" = 0
  "ANOTACOES_ARQUIVOS" = 0
  "ALERTAS_SISTEMA" = 0
}

$removidos["DOCUMENTOS_PDF"] = Remover-ArquivosParaLixeira -Itens $documentosAntes.Alvo -Falhas $falhas
foreach ($lista in $ListasApoio) {
  $removidos[$lista] = Remover-ItensListaParaLixeira -Lista $lista -Itens $itensApoioAntes[$lista] -Falhas $falhas
}

$documentosDepois = Get-DocumentosReset -ComLixeira:$IncluirLixeira
$itensApoioDepois = Obter-ItensApoio
$contagensDepois = Obter-Contagens -Documentos $documentosDepois -ItensApoio $itensApoioDepois -Listas $listas
Escrever-ResumoFinal -Pasta $pastaReset -Web $web -Antes $contagensAntes -Depois $contagensDepois -Removidos $removidos -Falhas $falhas

Write-Host "ResetSeguro concluido."
Write-Host "Relatorio: $pastaReset"
Write-Host "Falhas: $($falhas.Count)"
