param(
  [ValidateSet("DryRun", "ArquivarEEnviarLixeira")]
  [string]$Mode = "DryRun",
  [int]$RetencaoVisualizouDias = 180,
  [int]$RetencaoAnotacaoDias = 730,
  [int]$RetencaoOutrasDias = 730,
  [int]$RetencaoCriticasDias = 1825,
  [switch]$IncluirOperacoesCriticasMuitoAntigas,
  [switch]$EnviarParaLixeiraSharePoint,
  [switch]$ConfirmarRetencaoHistoricoAntigo,
  [int]$MaxItensPorExecucao = 2000,
  [int]$PausaEntreItensMs = 80,
  [datetime]$DataReferencia = (Get-Date),
  [string]$SiteUrl = "https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL",
  [string]$ClientId = $env:ENTRAID_APP_ID
)

$ErrorActionPreference = "Stop"

$SitePermitido = "https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL"
$ListaHistorico = "HISTORICO_ACESSOS"
$CamposHistorico = @("Title", "USUARIO_EMAIL", "ACAO", "USUARIO_NOME", "DATA_HORA", "ARQUIVO_ID", "OBSERVACAO")
$AcoesCriticas = @("ENVIOU", "RENOMEOU", "SUBSTITUIU", "MESCLOU", "ARQUIVOU", "RESTAUROU", "ALTEROU_GAVETA")
$StatusAcaoCriticaPreservada = "acao critica preservada por padrao"

function Add-Linha {
  param(
    [System.Collections.Generic.List[string]]$Linhas,
    [string]$Texto = ""
  )

  $Linhas.Add($Texto) | Out-Null
}

function ConvertTo-TextoSeguro {
  param([object]$Valor)

  if ($null -eq $Valor) { return "" }
  if ($Valor.PSObject.Properties.Name -contains "LookupValue") { return [string]$Valor.LookupValue }
  if ($Valor -is [array]) { return ($Valor | ForEach-Object { ConvertTo-TextoSeguro $_ }) -join "; " }
  return [string]$Valor
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

function ConvertTo-AcaoNormalizada {
  param([string]$Acao)

  return (($Acao | ForEach-Object { "$_" }).Trim().ToUpperInvariant())
}

function ConvertTo-DataHistorico {
  param([object]$Valor)

  if ($null -eq $Valor) { return $null }
  if ($Valor -is [datetime]) { return $Valor }

  $texto = ConvertTo-TextoSeguro $Valor
  if (-not $texto.Trim()) { return $null }

  $data = [datetime]::MinValue
  if ([datetime]::TryParse($texto, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AssumeLocal, [ref]$data)) {
    return $data
  }

  if ([datetime]::TryParse($texto, [Globalization.CultureInfo]::GetCultureInfo("pt-BR"), [Globalization.DateTimeStyles]::AssumeLocal, [ref]$data)) {
    return $data
  }

  return $null
}

function Get-ItensHistorico {
  return @(Get-PnPListItem -List $ListaHistorico -PageSize 500 -Fields $CamposHistorico -ScriptBlock {
    param($items)
    $items.Context.ExecuteQuery()
  })
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

function Confirmar-ListaHistorico {
  $lista = Get-PnPList -Identity $ListaHistorico -Includes Title,ItemCount,RootFolder
  if (-not $lista -or $lista.Title -ne $ListaHistorico) {
    throw "Lista HISTORICO_ACESSOS nao encontrada com seguranca."
  }
  return $lista
}

function Confirmar-CmdletRecycle {
  $cmd = Get-Command Remove-PnPListItem -ErrorAction Stop
  if (-not $cmd.Parameters.ContainsKey("Recycle")) {
    throw "Remove-PnPListItem nao possui parametro -Recycle. Abortando para evitar exclusao definitiva."
  }
}

function Get-RegraRetencao {
  param([string]$Acao)

  $acaoNormalizada = ConvertTo-AcaoNormalizada $Acao
  $critica = $AcoesCriticas -contains $acaoNormalizada

  if ($acaoNormalizada -eq "VISUALIZOU") {
    return [pscustomobject]@{ Categoria = "VISUALIZOU"; Dias = $RetencaoVisualizouDias; PodeRemover = $true }
  }

  if ($acaoNormalizada -eq "ANOTACAO") {
    return [pscustomobject]@{ Categoria = "ANOTACAO"; Dias = $RetencaoAnotacaoDias; PodeRemover = $true }
  }

  if ($critica) {
    return [pscustomobject]@{ Categoria = "CRITICA"; Dias = $RetencaoCriticasDias; PodeRemover = [bool]$IncluirOperacoesCriticasMuitoAntigas }
  }

  return [pscustomobject]@{ Categoria = "OUTRAS"; Dias = $RetencaoOutrasDias; PodeRemover = $true }
}

function ConvertTo-RegistroHistorico {
  param([object]$Item)

  $data = ConvertTo-DataHistorico (Get-CampoSeguro $Item "DATA_HORA")
  $acao = ConvertTo-AcaoNormalizada (ConvertTo-TextoSeguro (Get-CampoSeguro $Item "ACAO"))
  $regra = Get-RegraRetencao -Acao $acao
  $limite = $DataReferencia.AddDays(-1 * $regra.Dias)
  $semData = $null -eq $data
  $antigo = (-not $semData) -and $data -lt $limite
  $elegivel = $antigo -and $regra.PodeRemover
  $motivoPreservacao = ""

  if ($semData) {
    $motivoPreservacao = "sem DATA_HORA valida"
  } elseif (-not $antigo) {
    $motivoPreservacao = "dentro da retencao"
  } elseif (-not $regra.PodeRemover) {
    $motivoPreservacao = $StatusAcaoCriticaPreservada
  }

  return [pscustomobject]@{
    Item = $Item
    ID = $Item.Id
    Title = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "Title")
    ARQUIVO_ID = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "ARQUIVO_ID")
    ACAO = $acao
    USUARIO_EMAIL = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "USUARIO_EMAIL")
    USUARIO_NOME = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "USUARIO_NOME")
    DATA_HORA = if ($data) { $data.ToString("o") } else { "" }
    OBSERVACAO = ConvertTo-TextoSeguro (Get-CampoSeguro $Item "OBSERVACAO")
    Categoria = $regra.Categoria
    RetencaoDias = $regra.Dias
    LimiteRetencao = $limite.ToString("yyyy-MM-dd")
    Elegivel = $elegivel
    MotivoPreservacao = $motivoPreservacao
  }
}

function ConvertTo-RegistroArquivo {
  param([object]$Registro)

  return [pscustomobject]@{
    ID = $Registro.ID
    Title = $Registro.Title
    ARQUIVO_ID = $Registro.ARQUIVO_ID
    ACAO = $Registro.ACAO
    USUARIO_EMAIL = $Registro.USUARIO_EMAIL
    USUARIO_NOME = $Registro.USUARIO_NOME
    DATA_HORA = $Registro.DATA_HORA
    OBSERVACAO = $Registro.OBSERVACAO
    Categoria = $Registro.Categoria
    RetencaoDias = $Registro.RetencaoDias
    LimiteRetencao = $Registro.LimiteRetencao
  }
}

function Exportar-ArquivoHistorico {
  param(
    [string]$Pasta,
    [object[]]$RegistrosElegiveis
  )

  $jsonl = Join-Path $Pasta "historico-arquivado.jsonl"
  $csv = Join-Path $Pasta "historico-arquivado.csv"
  $cabecalhoCsv = '"ID","Title","ARQUIVO_ID","ACAO","USUARIO_EMAIL","USUARIO_NOME","DATA_HORA","OBSERVACAO","Categoria","RetencaoDias","LimiteRetencao"'
  Set-Content -Path $jsonl -Value @() -Encoding UTF8

  if ($RegistrosElegiveis.Count) {
    $RegistrosElegiveis | ForEach-Object {
      ConvertTo-RegistroArquivo $_ | ConvertTo-Json -Compress -Depth 4
    } | Set-Content -Path $jsonl -Encoding UTF8

    $RegistrosElegiveis | ForEach-Object { ConvertTo-RegistroArquivo $_ } |
      Export-Csv -NoTypeInformation -Encoding UTF8 -Path $csv
  } else {
    Set-Content -Path $csv -Value $cabecalhoCsv -Encoding UTF8
  }

  return [pscustomobject]@{
    Jsonl = $jsonl
    Csv = $csv
    JsonlBytes = (Get-Item $jsonl).Length
    CsvBytes = (Get-Item $csv).Length
  }
}

function Exportar-Preservados {
  param(
    [string]$Pasta,
    [object[]]$RegistrosPreservados
  )

  $csv = Join-Path $Pasta "historico-preservado.csv"

  if ($RegistrosPreservados.Count) {
    $RegistrosPreservados |
      Select-Object ID,Title,ARQUIVO_ID,ACAO,USUARIO_EMAIL,USUARIO_NOME,DATA_HORA,Categoria,RetencaoDias,LimiteRetencao,MotivoPreservacao |
      Export-Csv -NoTypeInformation -Encoding UTF8 -Path $csv
  } else {
    Set-Content -Path $csv -Value '"ID","Title","ARQUIVO_ID","ACAO","USUARIO_EMAIL","USUARIO_NOME","DATA_HORA","Categoria","RetencaoDias","LimiteRetencao","MotivoPreservacao"' -Encoding UTF8
  }
}

function Remover-HistoricoParaLixeira {
  param(
    [object[]]$Registros,
    [System.Collections.Generic.List[object]]$Falhas
  )

  $removidos = 0
  $total = $Registros.Count

  for ($i = 0; $i -lt $total; $i++) {
    $registro = $Registros[$i]
    Write-Progress -Activity "Enviando historico antigo para Lixeira do SharePoint" -Status "$($i + 1) de $total" -PercentComplete ((($i + 1) / [Math]::Max($total, 1)) * 100)

    try {
      Remove-PnPListItem -List $ListaHistorico -Identity $registro.ID -Recycle -Force | Out-Null
      $removidos++
      if ($PausaEntreItensMs -gt 0) {
        Start-Sleep -Milliseconds $PausaEntreItensMs
      }
    } catch {
      $Falhas.Add([pscustomobject]@{
        Lista = $ListaHistorico
        ID = $registro.ID
        ACAO = $registro.ACAO
        DATA_HORA = $registro.DATA_HORA
        Erro = $_.Exception.Message
      }) | Out-Null
    }
  }

  Write-Progress -Activity "Enviando historico antigo para Lixeira do SharePoint" -Completed
  return $removidos
}

function Add-ResumoContagem {
  param(
    [System.Collections.Generic.List[string]]$Linhas,
    [string]$Titulo,
    [object[]]$Registros
  )

  Add-Linha $Linhas "## $Titulo"
  Add-Linha $Linhas ""
  Add-Linha $Linhas "- Total: $($Registros.Count)"
  Add-Linha $Linhas ""

  $Registros |
    Group-Object Categoria,ACAO |
    Sort-Object Count -Descending |
    ForEach-Object {
      Add-Linha $Linhas "- $($_.Name): $($_.Count)"
    }

  Add-Linha $Linhas ""
}

function Escrever-Resumo {
  param(
    [string]$Pasta,
    [object]$Web,
    [object]$Lista,
    [object[]]$Todos,
    [object[]]$Elegiveis,
    [object[]]$ElegiveisExecucao,
    [object[]]$Preservados,
    [object]$Arquivo,
    [int]$Removidos = 0,
    [System.Collections.Generic.List[object]]$Falhas = $null
  )

  $linhas = [System.Collections.Generic.List[string]]::new()
  Add-Linha $linhas "# Retencao do Historico do Arquivo Digital V1"
  Add-Linha $linhas ""
  Add-Linha $linhas "- Data/hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
  Add-Linha $linhas "- Site: $($Web.Url)"
  Add-Linha $linhas "- Titulo: $($Web.Title)"
  Add-Linha $linhas "- Lista: $($Lista.Title)"
  Add-Linha $linhas "- Modo: $Mode"
  Add-Linha $linhas "- Data de referencia: $($DataReferencia.ToString('yyyy-MM-dd HH:mm:ss'))"
  Add-Linha $linhas "- Retencao VISUALIZOU: $RetencaoVisualizouDias dias"
  Add-Linha $linhas "- Retencao ANOTACAO: $RetencaoAnotacaoDias dias"
  Add-Linha $linhas "- Retencao outras acoes nao criticas: $RetencaoOutrasDias dias"
  Add-Linha $linhas "- Retencao acoes criticas: $RetencaoCriticasDias dias"
  Add-Linha $linhas "- Incluir acoes criticas antigas: $([bool]$IncluirOperacoesCriticasMuitoAntigas)"
  Add-Linha $linhas "- Maximo por execucao: $(if ($MaxItensPorExecucao -gt 0) { $MaxItensPorExecucao } else { 'sem limite' })"
  Add-Linha $linhas "- Enviar para Lixeira SharePoint: $([bool]$EnviarParaLixeiraSharePoint)"
  Add-Linha $linhas "- Confirmacao explicita: $([bool]$ConfirmarRetencaoHistoricoAntigo)"
  Add-Linha $linhas ""
  Add-Linha $linhas "## Arquivo gerado antes de remover"
  Add-Linha $linhas ""
  Add-Linha $linhas "- JSONL: $($Arquivo.Jsonl)"
  Add-Linha $linhas "- CSV: $($Arquivo.Csv)"
  Add-Linha $linhas "- JSONL bytes: $($Arquivo.JsonlBytes)"
  Add-Linha $linhas "- CSV bytes: $($Arquivo.CsvBytes)"
  Add-Linha $linhas ""
  Add-Linha $linhas "## Totais"
  Add-Linha $linhas ""
  Add-Linha $linhas "- Historico carregado: $($Todos.Count)"
  Add-Linha $linhas "- Elegiveis pela politica: $($Elegiveis.Count)"
  Add-Linha $linhas "- Elegiveis nesta execucao: $($ElegiveisExecucao.Count)"
  Add-Linha $linhas "- Preservados: $($Preservados.Count)"
  Add-Linha $linhas "- Enviados para Lixeira nesta execucao: $Removidos"
  Add-Linha $linhas "- Falhas: $(if ($Falhas) { $Falhas.Count } else { 0 })"
  Add-Linha $linhas ""

  Add-ResumoContagem -Linhas $linhas -Titulo "Elegiveis nesta execucao por categoria/acao" -Registros $ElegiveisExecucao
  Add-ResumoContagem -Linhas $linhas -Titulo "Preservados por categoria/acao" -Registros $Preservados

  Add-Linha $linhas "## Amostra dos elegiveis"
  Add-Linha $linhas ""
  $ElegiveisExecucao | Select-Object -First 20 | ForEach-Object {
    Add-Linha $linhas "- ID $($_.ID) | $($_.DATA_HORA) | $($_.ACAO) | $($_.Title)"
  }
  Add-Linha $linhas ""
  Add-Linha $linhas "## Observacoes"
  Add-Linha $linhas ""
  Add-Linha $linhas "- Este script nao altera PDFs, anotacoes atuais, listas, colunas, gavetas, permissoes ou grupos."
  Add-Linha $linhas "- A remocao real usa Remove-PnPListItem -Recycle, enviando para a Lixeira do SharePoint."
  Add-Linha $linhas "- Acoes criticas ficam preservadas por padrao: $($AcoesCriticas -join ', ')."
  Add-Linha $linhas "- O arquivo JSONL/CSV deve ser conferido antes de executar o modo real."

  $linhas | Set-Content -Path (Join-Path $Pasta "resumo-retencao-historico.md") -Encoding UTF8

  if ($Falhas -and $Falhas.Count) {
    $Falhas | Export-Csv -NoTypeInformation -Encoding UTF8 -Path (Join-Path $Pasta "falhas-retencao-historico.csv")
  }
}

$raizProjeto = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$pastaDiagnosticos = Join-Path $raizProjeto "diagnosticos"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$pastaRetencao = Join-Path $pastaDiagnosticos "retencao-historico-v1-$timestamp"
New-Item -ItemType Directory -Path $pastaRetencao -Force | Out-Null

Write-Host "Retencao Historico Arquivo Digital V1"
Write-Host "Modo: $Mode"
Write-Host "Site permitido: $SitePermitido"
Write-Host "Relatorios: $pastaRetencao"
Write-Host "Este script nao altera PDFs, anotacoes atuais, estrutura, permissoes, colunas ou listas."

if ($SiteUrl.TrimEnd("/") -ne $SitePermitido) {
  throw "Parametro SiteUrl invalido. Use exatamente $SitePermitido."
}

if ($RetencaoVisualizouDias -lt 30) { throw "RetencaoVisualizouDias deve ser pelo menos 30." }
if ($RetencaoAnotacaoDias -lt 180) { throw "RetencaoAnotacaoDias deve ser pelo menos 180." }
if ($RetencaoOutrasDias -lt 180) { throw "RetencaoOutrasDias deve ser pelo menos 180." }
if ($RetencaoCriticasDias -lt 365) { throw "RetencaoCriticasDias deve ser pelo menos 365." }
if ($MaxItensPorExecucao -lt 0) { throw "MaxItensPorExecucao nao pode ser negativo." }

if ($Mode -eq "ArquivarEEnviarLixeira") {
  if (-not $EnviarParaLixeiraSharePoint) {
    throw "Modo ArquivarEEnviarLixeira exige -EnviarParaLixeiraSharePoint."
  }
  if (-not $ConfirmarRetencaoHistoricoAntigo) {
    throw "Modo ArquivarEEnviarLixeira exige -ConfirmarRetencaoHistoricoAntigo."
  }
}

if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
  throw "Modulo PnP.PowerShell nao encontrado."
}

Import-Module PnP.PowerShell
Confirmar-CmdletRecycle

if ($ClientId) {
  Connect-PnPOnline -Url $SitePermitido -Interactive -ClientId $ClientId
} else {
  Connect-PnPOnline -Url $SitePermitido -Interactive
}

$web = Confirmar-SiteSeguro -UrlEsperada $SitePermitido
$lista = Confirmar-ListaHistorico
$itens = Get-ItensHistorico
$todos = @($itens | ForEach-Object { ConvertTo-RegistroHistorico $_ })
$elegiveis = @($todos | Where-Object { $_.Elegivel } | Sort-Object DATA_HORA,ID)
$preservados = @($todos | Where-Object { -not $_.Elegivel })

$elegiveisExecucao = $elegiveis
if ($MaxItensPorExecucao -gt 0) {
  $elegiveisExecucao = @($elegiveis | Select-Object -First $MaxItensPorExecucao)
}

$arquivo = Exportar-ArquivoHistorico -Pasta $pastaRetencao -RegistrosElegiveis $elegiveisExecucao
Exportar-Preservados -Pasta $pastaRetencao -RegistrosPreservados $preservados

if ($Mode -eq "DryRun") {
  Escrever-Resumo -Pasta $pastaRetencao -Web $web -Lista $lista -Todos $todos -Elegiveis $elegiveis -ElegiveisExecucao $elegiveisExecucao -Preservados $preservados -Arquivo $arquivo
  Write-Host "DryRun concluido. Nada foi removido."
  Write-Host "Relatorio: $pastaRetencao"
  return
}

if ($elegiveisExecucao.Count -gt 0 -and ($arquivo.JsonlBytes -le 2 -or $arquivo.CsvBytes -le 0)) {
  throw "Arquivo de historico arquivado parece vazio. Abortando remocao."
}

$falhas = [System.Collections.Generic.List[object]]::new()
$removidos = Remover-HistoricoParaLixeira -Registros $elegiveisExecucao -Falhas $falhas
Escrever-Resumo -Pasta $pastaRetencao -Web $web -Lista $lista -Todos $todos -Elegiveis $elegiveis -ElegiveisExecucao $elegiveisExecucao -Preservados $preservados -Arquivo $arquivo -Removidos $removidos -Falhas $falhas

Write-Host "Retencao concluida."
Write-Host "Itens enviados para Lixeira: $removidos"
Write-Host "Falhas: $($falhas.Count)"
Write-Host "Relatorio: $pastaRetencao"
