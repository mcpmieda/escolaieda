param(
  [string]$ArquivoFrioRoot = "",
  [string]$ArquivoId = "",
  [string]$UsuarioEmail = "",
  [string]$Acao = "",
  [string]$Texto = "",
  [datetime]$Inicio,
  [datetime]$Fim,
  [int]$Limite = 200,
  [switch]$ExportarCsv
)

$ErrorActionPreference = "Stop"

function Resolve-CaminhoCompleto {
  param(
    [string]$Base,
    [string]$Caminho
  )

  if ([string]::IsNullOrWhiteSpace($Caminho)) {
    return ""
  }

  if ([System.IO.Path]::IsPathRooted($Caminho)) {
    return [System.IO.Path]::GetFullPath($Caminho)
  }

  return [System.IO.Path]::GetFullPath((Join-Path $Base $Caminho))
}

function ConvertTo-TextoSeguro {
  param([object]$Valor)

  if ($null -eq $Valor) { return "" }
  if ($Valor -is [datetime]) { return $Valor.ToString("o") }
  return [string]$Valor
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

function Testar-TextoContem {
  param(
    [string]$Valor,
    [string]$Filtro
  )

  if ([string]::IsNullOrWhiteSpace($Filtro)) { return $true }
  return $Valor -like "*$Filtro*"
}

function Testar-ArquivoPodeConterPeriodo {
  param(
    [System.IO.FileInfo]$Arquivo,
    [bool]$TemInicio,
    [datetime]$InicioFiltro,
    [bool]$TemFim,
    [datetime]$FimFiltro
  )

  if (-not $TemInicio -and -not $TemFim) { return $true }

  $caminho = $Arquivo.FullName
  $match = [regex]::Match($caminho, "ano=([^\\]+)\\mes=([^\\]+)")
  if (-not $match.Success) { return $true }

  $ano = $match.Groups[1].Value
  $mes = $match.Groups[2].Value
  if ($ano -eq "sem-data" -or $mes -eq "sem-data") { return $false }

  $inicioMes = [datetime]::ParseExact("$ano-$mes-01", "yyyy-MM-dd", [Globalization.CultureInfo]::InvariantCulture)
  $fimMes = $inicioMes.AddMonths(1).AddTicks(-1)

  if ($TemInicio -and $fimMes -lt $InicioFiltro) { return $false }
  if ($TemFim -and $inicioMes -gt $FimFiltro) { return $false }
  return $true
}

function Testar-Registro {
  param(
    [object]$Registro,
    [bool]$TemInicio,
    [datetime]$InicioFiltro,
    [bool]$TemFim,
    [datetime]$FimFiltro
  )

  if (-not (Testar-TextoContem -Valor (ConvertTo-TextoSeguro $Registro.ARQUIVO_ID) -Filtro $ArquivoId)) { return $false }
  if (-not (Testar-TextoContem -Valor (ConvertTo-TextoSeguro $Registro.USUARIO_EMAIL) -Filtro $UsuarioEmail)) { return $false }
  if (-not (Testar-TextoContem -Valor (ConvertTo-TextoSeguro $Registro.ACAO) -Filtro $Acao)) { return $false }

  if (-not [string]::IsNullOrWhiteSpace($Texto)) {
    $textoRegistro = @(
      ConvertTo-TextoSeguro $Registro.Title
      ConvertTo-TextoSeguro $Registro.OBSERVACAO
      ConvertTo-TextoSeguro $Registro.USUARIO_NOME
      ConvertTo-TextoSeguro $Registro.USUARIO_EMAIL
      ConvertTo-TextoSeguro $Registro.ARQUIVO_ID
      ConvertTo-TextoSeguro $Registro.ACAO
    ) -join " "

    if (-not (Testar-TextoContem -Valor $textoRegistro -Filtro $Texto)) { return $false }
  }

  if ($TemInicio -or $TemFim) {
    $data = ConvertTo-DataHistorico $Registro.DATA_HORA
    if ($null -eq $data) { return $false }
    if ($TemInicio -and $data -lt $InicioFiltro) { return $false }
    if ($TemFim -and $data -gt $FimFiltro) { return $false }
  }

  return $true
}

if ($Limite -lt 0) {
  throw "Limite nao pode ser negativo. Use 0 para sem limite."
}

$raizProjeto = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$raizArquivoFrio = if ([string]::IsNullOrWhiteSpace($ArquivoFrioRoot)) {
  Join-Path $raizProjeto "backups_locais\arquivo-digital\historico-frio"
} else {
  Resolve-CaminhoCompleto -Base $raizProjeto -Caminho $ArquivoFrioRoot
}

if (-not (Test-Path -LiteralPath $raizArquivoFrio)) {
  throw "Arquivo frio nao encontrado: $raizArquivoFrio"
}

$temInicio = $PSBoundParameters.ContainsKey("Inicio")
$temFim = $PSBoundParameters.ContainsKey("Fim")
if ($temFim -and $Fim.TimeOfDay.Ticks -eq 0) {
  $Fim = $Fim.Date.AddDays(1).AddTicks(-1)
}
$arquivos = @(Get-ChildItem -LiteralPath $raizArquivoFrio -Recurse -Filter "historico-retencao-*.jsonl" -File |
  Where-Object {
    $_.FullName -notmatch "\\_manifestos\\" -and
    (Testar-ArquivoPodeConterPeriodo -Arquivo $_ -TemInicio $temInicio -InicioFiltro $Inicio -TemFim $temFim -FimFiltro $Fim)
  } |
  Sort-Object FullName)

$resultados = [System.Collections.Generic.List[object]]::new()

:arquivosLoop foreach ($arquivo in $arquivos) {
  foreach ($linha in [System.IO.File]::ReadLines($arquivo.FullName)) {
    if ([string]::IsNullOrWhiteSpace($linha)) { continue }

    try {
      $registro = $linha | ConvertFrom-Json
    } catch {
      continue
    }

    if (-not (Testar-Registro -Registro $registro -TemInicio $temInicio -InicioFiltro $Inicio -TemFim $temFim -FimFiltro $Fim)) {
      continue
    }

    $resultados.Add([pscustomobject]@{
      DATA_HORA = ConvertTo-TextoSeguro $registro.DATA_HORA
      ACAO = ConvertTo-TextoSeguro $registro.ACAO
      Title = ConvertTo-TextoSeguro $registro.Title
      ARQUIVO_ID = ConvertTo-TextoSeguro $registro.ARQUIVO_ID
      USUARIO_EMAIL = ConvertTo-TextoSeguro $registro.USUARIO_EMAIL
      USUARIO_NOME = ConvertTo-TextoSeguro $registro.USUARIO_NOME
      OBSERVACAO = ConvertTo-TextoSeguro $registro.OBSERVACAO
      Fonte = $arquivo.FullName
    }) | Out-Null

    if ($Limite -gt 0 -and $resultados.Count -ge $Limite) {
      break arquivosLoop
    }
  }
}

Write-Host "Consulta do historico frio concluida."
Write-Host "Raiz: $raizArquivoFrio"
Write-Host "Arquivos lidos: $($arquivos.Count)"
Write-Host "Resultados: $($resultados.Count)"

if ($ExportarCsv) {
  $pastaDiagnosticos = Join-Path $raizProjeto "diagnosticos"
  $pastaConsulta = Join-Path $pastaDiagnosticos ("consulta-historico-frio-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
  New-Item -ItemType Directory -Path $pastaConsulta -Force | Out-Null
  $csv = Join-Path $pastaConsulta "resultado-consulta-historico-frio.csv"

  if ($resultados.Count) {
    $resultados | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $csv
  } else {
    Set-Content -Path $csv -Value '"DATA_HORA","ACAO","Title","ARQUIVO_ID","USUARIO_EMAIL","USUARIO_NOME","OBSERVACAO","Fonte"' -Encoding UTF8
  }

  Write-Host "CSV: $csv"
}

$resultados |
  Sort-Object DATA_HORA -Descending |
  Select-Object DATA_HORA,ACAO,Title,ARQUIVO_ID,USUARIO_EMAIL,USUARIO_NOME,OBSERVACAO,Fonte
