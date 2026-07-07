param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [string]$OutputDirectory = "",

  [string]$OutputFileName = "",

  [int]$MaxLinhasOrigem = 46,

  [string]$SheetName = "EXPORT_NOTAS_POC",

  [string]$TableName = "TB_EXPORT_NOTAS",

  [switch]$KeepSheetVisible,

  [switch]$Force
)

$ErrorActionPreference = "Stop"

function Escrever-Info {
  param([string]$Texto)
  Write-Host "[notas-poc] $Texto"
}

function Resolver-Caminho {
  param([string]$Caminho)

  if ([string]::IsNullOrWhiteSpace($Caminho)) {
    return ""
  }

  $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Caminho)
}

function Testar-DentroDeDiretorio {
  param(
    [string]$Caminho,
    [string]$Diretorio
  )

  $full = [System.IO.Path]::GetFullPath($Caminho).TrimEnd('\') + '\'
  $root = [System.IO.Path]::GetFullPath($Diretorio).TrimEnd('\') + '\'
  return $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)
}

function Converter-NumeroColunaParaLetra {
  param([int]$Numero)

  $resultado = ""
  while ($Numero -gt 0) {
    $resto = ($Numero - 1) % 26
    $resultado = [char](65 + $resto) + $resultado
    $Numero = [math]::Floor(($Numero - 1) / 26)
  }

  return $resultado
}

function Limpar-NomeArquivo {
  param([string]$Nome)

  $base = [System.IO.Path]::GetFileNameWithoutExtension($Nome)
  $limpo = $base -replace '[\\/:*?"<>|]+', ' '
  $limpo = $limpo -replace '\s+', ' '
  $limpo = $limpo.Trim()
  if (-not $limpo) {
    $limpo = "agenda-notas"
  }

  return "$limpo - POC TB_EXPORT_NOTAS.xlsb"
}

function Liberar-Com {
  param([object]$Objeto)

  if ($null -ne $Objeto) {
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($Objeto)
  }
}

function Invoke-ComRetry {
  param(
    [scriptblock]$Action,
    [int]$Tries = 20,
    [int]$DelayMs = 250
  )

  for ($try = 1; $try -le $Tries; $try++) {
    try {
      return & $Action
    } catch {
      if ($try -eq $Tries) {
        throw
      }

      Start-Sleep -Milliseconds ($DelayMs * $try)
    }
  }
}

function Abrir-Workbook {
  param(
    [object]$Excel,
    [string]$Caminho,
    [bool]$SomenteLeitura
  )

  return Invoke-ComRetry { $Excel.Workbooks.Open($Caminho, 0, $SomenteLeitura) }
}

function Obter-Worksheet {
  param(
    [object]$Workbook,
    [string]$Nome
  )

  foreach ($worksheet in $Workbook.Worksheets) {
    if ($worksheet.Name -eq $Nome) {
      return $worksheet
    }
  }

  return $null
}

function Remover-WorksheetSeExistir {
  param(
    [object]$Workbook,
    [string]$Nome
  )

  $existente = Obter-Worksheet -Workbook $Workbook -Nome $Nome
  if ($null -eq $existente) {
    return
  }

  $existente.Delete()
}

function Analisar-CodigoCampo {
  param([string]$Codigo)

  $valor = ($Codigo ?? "").Trim().ToUpperInvariant()
  if ($valor -notmatch '^(T\d+)(CPT|RL|RD|ET|P|M|C|G|H|A|F|I)(1REC|2REC|3REC|TREC|NF|1|2|3|T)$') {
    return $null
  }

  return [PSCustomObject]@{
    TurmaCodigo = $Matches[1]
    ComponenteCodigo = $Matches[2]
    Campo = $Matches[3]
  }
}

function Contar-CelulasPreenchidas {
  param(
    [object]$Worksheet,
    [int]$Coluna,
    [int]$LinhaInicial,
    [int]$LinhaFinal
  )

  $total = 0
  for ($linha = $LinhaInicial; $linha -le $LinhaFinal; $linha++) {
    $valor = [string]$Worksheet.Cells.Item($linha, $Coluna).Value2
    if (-not [string]::IsNullOrWhiteSpace($valor)) {
      $total += 1
    }
  }

  return $total
}

function Obter-ColunasRelacaoTurma {
  param(
    [object]$RelacaoSheet,
    [int]$NumeroTurma,
    [int]$MaxLinhas
  )

  $colunaA = (2 * $NumeroTurma) - 1
  $colunaB = 2 * $NumeroTurma
  $linhaInicial = 3
  $linhaFinal = $MaxLinhas + 2
  $preenchidasA = Contar-CelulasPreenchidas -Worksheet $RelacaoSheet -Coluna $colunaA -LinhaInicial $linhaInicial -LinhaFinal $linhaFinal
  $preenchidasB = Contar-CelulasPreenchidas -Worksheet $RelacaoSheet -Coluna $colunaB -LinhaInicial $linhaInicial -LinhaFinal $linhaFinal

  if ($preenchidasB -gt $preenchidasA) {
    return [PSCustomObject]@{
      NomeRelacaoColuna = $colunaB
      SituacaoRelacaoColuna = $colunaA
    }
  }

  if ($preenchidasA -gt $preenchidasB) {
    return [PSCustomObject]@{
      NomeRelacaoColuna = $colunaA
      SituacaoRelacaoColuna = $colunaB
    }
  }

  throw "Nao foi possivel inferir as colunas de nome/situacao da turma T$NumeroTurma na guia RELAÇÃO."
}

function Obter-GruposExportacao {
  param(
    [object]$ConfigSheet,
    [object]$RelacaoSheet,
    [int]$MaxLinhas
  )

  $used = $ConfigSheet.UsedRange
  $colunas = [int]$used.Columns.Count
  $row2Range = $ConfigSheet.Range($ConfigSheet.Cells.Item(2, 1), $ConfigSheet.Cells.Item(2, $colunas))
  $row2 = $row2Range.Value2
  $mapa = @{}
  $ordem = @()
  $camposObrigatorios = @("1", "2", "3", "T", "1REC", "2REC", "3REC", "TREC", "NF")

  for ($col = 1; $col -le $colunas; $col++) {
    $codigo = [string]$row2[1, $col]
    $partes = Analisar-CodigoCampo -Codigo $codigo
    if ($null -eq $partes) {
      continue
    }

    $chave = "$($partes.TurmaCodigo)|$($partes.ComponenteCodigo)"
    if (-not $mapa.ContainsKey($chave)) {
      $mapa[$chave] = [ordered]@{
        TurmaCodigo = $partes.TurmaCodigo
        ComponenteCodigo = $partes.ComponenteCodigo
        PrimeiraColuna = $col
        Campos = @{}
      }
      $ordem += $chave
    }

    $mapa[$chave].Campos[$partes.Campo] = $col
  }

  $grupos = @()
  foreach ($chave in $ordem) {
    $grupo = $mapa[$chave]
    $faltantes = $camposObrigatorios | Where-Object { -not $grupo.Campos.ContainsKey($_) }
    if ($faltantes.Count -gt 0) {
      Escrever-Info "Ignorando grupo incompleto $chave. Campos ausentes: $($faltantes -join ', ')."
      continue
    }

    $numeroTurma = [int]($grupo.TurmaCodigo -replace '^T', '')
    if ($numeroTurma -lt 1) {
      Escrever-Info "Ignorando turma invalida $($grupo.TurmaCodigo)."
      continue
    }

    $colunasRelacao = Obter-ColunasRelacaoTurma -RelacaoSheet $RelacaoSheet -NumeroTurma $numeroTurma -MaxLinhas $MaxLinhas

    $grupos += [PSCustomObject]@{
      TurmaCodigo = $grupo.TurmaCodigo
      ComponenteCodigo = $grupo.ComponenteCodigo
      PrimeiraColuna = $grupo.PrimeiraColuna
      NomeRelacaoColuna = $colunasRelacao.NomeRelacaoColuna
      SituacaoRelacaoColuna = $colunasRelacao.SituacaoRelacaoColuna
      Campos = $grupo.Campos
    }
  }

  Liberar-Com $row2Range
  Liberar-Com $used

  return $grupos
}

function Criar-TabelaExportacao {
  param(
    [object]$Workbook,
    [object]$ConfigSheet,
    [object[]]$Grupos,
    [int]$MaxLinhas,
    [string]$NomeSheet,
    [string]$NomeTabela,
    [switch]$ManterVisivel
  )

  $xlSrcRange = 1
  $xlYes = 1
  $xlSheetVisible = -1
  $xlSheetVeryHidden = 2

  $novo = Invoke-ComRetry { $Workbook.Worksheets.Add() }
  $novo.Name = $NomeSheet

  $headers = @(
    "ContratoVersao",
    "AnoLetivo",
    "TurmaCodigo",
    "ComponenteCodigo",
    "LinhaOrigem",
    "AlunoNome",
    "SituacaoMatricula",
    "NotaT1",
    "NotaT2",
    "NotaT3",
    "Total",
    "RecT1",
    "RecT2",
    "RecT3",
    "TotalRec",
    "NotaFinal"
  )

  $headerData = New-Object 'object[,]' 1, $headers.Count
  for ($i = 0; $i -lt $headers.Count; $i++) {
    $headerData[0, $i] = $headers[$i]
  }

  $headerRange = $novo.Range($novo.Cells.Item(1, 1), $novo.Cells.Item(1, $headers.Count))
  Invoke-ComRetry { $headerRange.Value2 = $headerData } | Out-Null

  $anoLetivo = $ConfigSheet.Cells.Item(2, 3).Value2
  $totalLinhasDados = $Grupos.Count * $MaxLinhas
  $dados = New-Object 'object[,]' $totalLinhasDados, $headers.Count
  $indiceSaida = 0
  $mapaCampos = @(
    @{ Coluna = 8; Campo = "1" },
    @{ Coluna = 9; Campo = "2" },
    @{ Coluna = 10; Campo = "3" },
    @{ Coluna = 11; Campo = "T" },
    @{ Coluna = 12; Campo = "1REC" },
    @{ Coluna = 13; Campo = "2REC" },
    @{ Coluna = 14; Campo = "3REC" },
    @{ Coluna = 15; Campo = "TREC" },
    @{ Coluna = 16; Campo = "NF" }
  )

  foreach ($grupo in $Grupos) {
    $nomeRelacaoCol = Converter-NumeroColunaParaLetra -Numero $grupo.NomeRelacaoColuna
    $situacaoRelacaoCol = Converter-NumeroColunaParaLetra -Numero $grupo.SituacaoRelacaoColuna

    for ($linhaOrigem = 1; $linhaOrigem -le $MaxLinhas; $linhaOrigem++) {
      $linhaPlanilha = $linhaOrigem + 2
      $dados[$indiceSaida, 0] = "1"
      $dados[$indiceSaida, 1] = [string]$anoLetivo
      $dados[$indiceSaida, 2] = $grupo.TurmaCodigo
      $dados[$indiceSaida, 3] = $grupo.ComponenteCodigo
      $dados[$indiceSaida, 4] = [string]$linhaOrigem
      $dados[$indiceSaida, 5] = "='RELAÇÃO'!" + '$' + $nomeRelacaoCol + '$' + $linhaPlanilha
      $dados[$indiceSaida, 6] = "='RELAÇÃO'!" + '$' + $situacaoRelacaoCol + '$' + $linhaPlanilha

      foreach ($campo in $mapaCampos) {
        $nomeCampo = [string]$campo["Campo"]
        $colunaDestino = [int]$campo["Coluna"]
        $colunaOrigem = Converter-NumeroColunaParaLetra -Numero $grupo.Campos[$nomeCampo]
        $dados[$indiceSaida, ($colunaDestino - 1)] = "='CONFIGURAÇÃO'!" + '$' + $colunaOrigem + '$' + $linhaPlanilha
      }

      $indiceSaida += 1
    }
  }

  $ultimaLinha = $totalLinhasDados + 1
  $dadosRange = $novo.Range($novo.Cells.Item(2, 1), $novo.Cells.Item($ultimaLinha, $headers.Count))
  Invoke-ComRetry { $dadosRange.Formula = $dados } | Out-Null

  $rangeTabela = $novo.Range($novo.Cells.Item(1, 1), $novo.Cells.Item($ultimaLinha, $headers.Count))
  $tabela = Invoke-ComRetry { $novo.ListObjects.Add($xlSrcRange, $rangeTabela, $null, $xlYes) }
  Invoke-ComRetry { $tabela.Name = $NomeTabela } | Out-Null
  Invoke-ComRetry { $tabela.TableStyle = "TableStyleMedium2" } | Out-Null
  Invoke-ComRetry { $novo.Columns.AutoFit() } | Out-Null
  Invoke-ComRetry { $novo.Visible = $(if ($ManterVisivel) { $xlSheetVisible } else { $xlSheetVeryHidden }) } | Out-Null

  return [PSCustomObject]@{
    Worksheet = $novo
    Table = $tabela
    Rows = $ultimaLinha - 1
    Columns = $headers.Count
  }
}

function Validar-WorkbookExportado {
  param(
    [string]$Caminho,
    [string]$NomeSheet,
    [string]$NomeTabela
  )

  $excelValidacao = $null
  $workbookValidacao = $null

  try {
    $excelValidacao = New-Object -ComObject Excel.Application
    $excelValidacao.Visible = $false
    $excelValidacao.DisplayAlerts = $false
    $excelValidacao.EnableEvents = $false
    $excelValidacao.AutomationSecurity = 3
    $excelValidacao.AskToUpdateLinks = $false
    $workbookValidacao = Abrir-Workbook -Excel $excelValidacao -Caminho $Caminho -SomenteLeitura $true
    $sheet = Obter-Worksheet -Workbook $workbookValidacao -Nome $NomeSheet
    if ($null -eq $sheet) {
      throw "Guia $NomeSheet nao encontrada ao reabrir."
    }

    $tabela = $null
    foreach ($listObject in $sheet.ListObjects) {
      if ($listObject.Name -eq $NomeTabela) {
        $tabela = $listObject
        break
      }
    }

    if ($null -eq $tabela) {
      throw "Tabela $NomeTabela nao encontrada ao reabrir."
    }

    return [PSCustomObject]@{
      SheetVisible = $sheet.Visible
      ProtectStructure = [bool]$workbookValidacao.ProtectStructure
      TableRows = [int]$tabela.ListRows.Count
      TableColumns = [int]$tabela.ListColumns.Count
    }
  } finally {
    if ($workbookValidacao) {
      Invoke-ComRetry { $workbookValidacao.Close($false) } | Out-Null
      Liberar-Com $workbookValidacao
    }
    if ($excelValidacao) {
      Invoke-ComRetry { $excelValidacao.Quit() } | Out-Null
      Liberar-Com $excelValidacao
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
  }
}

$sourceFullPath = Resolver-Caminho -Caminho $SourcePath
if (-not (Test-Path -LiteralPath $sourceFullPath -PathType Leaf)) {
  throw "Arquivo de origem nao encontrado: $sourceFullPath"
}

if ([System.IO.Path]::GetExtension($sourceFullPath).ToLowerInvariant() -ne ".xlsb") {
  throw "A POC V1 espera uma agenda .xlsb. Origem informada: $sourceFullPath"
}

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $OutputDirectory = Join-Path ([System.IO.Path]::GetDirectoryName($sourceFullPath)) "_POC_NOTAS_EXPORT_2026"
}

$outputDirFullPath = Resolver-Caminho -Caminho $OutputDirectory
if (Testar-DentroDeDiretorio -Caminho $outputDirFullPath -Diretorio $repoRoot) {
  throw "Destino recusado: a copia POC contem dados reais e nao pode ficar dentro do repositorio Git. Destino: $outputDirFullPath"
}

if ([string]::IsNullOrWhiteSpace($OutputFileName)) {
  $OutputFileName = Limpar-NomeArquivo -Nome (Split-Path $sourceFullPath -Leaf)
}

$outputFullPath = Join-Path $outputDirFullPath $OutputFileName
if ((Test-Path -LiteralPath $outputFullPath) -and -not $Force) {
  throw "Arquivo de saida ja existe. Use -Force para substituir: $outputFullPath"
}

if ($MaxLinhasOrigem -lt 1 -or $MaxLinhasOrigem -gt 100) {
  throw "MaxLinhasOrigem fora do intervalo seguro: $MaxLinhasOrigem"
}

New-Item -ItemType Directory -Path $outputDirFullPath -Force | Out-Null
Copy-Item -LiteralPath $sourceFullPath -Destination $outputFullPath -Force:$Force

$excel = $null
$workbook = $null
$resultado = $null

try {
  Escrever-Info "Abrindo copia POC no Excel Desktop."
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  $excel.EnableEvents = $false
  $excel.AutomationSecurity = 3
  $excel.AskToUpdateLinks = $false

  $workbook = Abrir-Workbook -Excel $excel -Caminho $outputFullPath -SomenteLeitura $false
  $protecaoEstruturaOriginal = [bool]$workbook.ProtectStructure
  if ($protecaoEstruturaOriginal) {
    Escrever-Info "Removendo protecao estrutural temporariamente na copia."
    Invoke-ComRetry { $workbook.Unprotect() } | Out-Null
    if ([bool]$workbook.ProtectStructure) {
      throw "Nao foi possivel remover a protecao estrutural da copia. A POC nao foi criada."
    }
  }

  $configSheet = Obter-Worksheet -Workbook $workbook -Nome "CONFIGURAÇÃO"
  if ($null -eq $configSheet) {
    throw "Guia CONFIGURAÇÃO nao encontrada."
  }

  $relacaoSheet = Obter-Worksheet -Workbook $workbook -Nome "RELAÇÃO"
  if ($null -eq $relacaoSheet) {
    throw "Guia RELAÇÃO nao encontrada."
  }

  if (Obter-Worksheet -Workbook $workbook -Nome $SheetName) {
    if (-not $Force) {
      throw "A guia $SheetName ja existe na copia. Use -Force para recriar."
    }
    Escrever-Info "Removendo guia POC anterior."
    Remover-WorksheetSeExistir -Workbook $workbook -Nome $SheetName
  }

  $grupos = @(Obter-GruposExportacao -ConfigSheet $configSheet -RelacaoSheet $relacaoSheet -MaxLinhas $MaxLinhasOrigem)
  if ($grupos.Count -lt 1) {
    throw "Nenhum grupo completo de turma/componente foi encontrado na linha 2 da guia CONFIGURAÇÃO."
  }

  Escrever-Info "Grupos completos detectados: $($grupos.Count)."
  $resultado = Criar-TabelaExportacao `
    -Workbook $workbook `
    -ConfigSheet $configSheet `
    -Grupos $grupos `
    -MaxLinhas $MaxLinhasOrigem `
    -NomeSheet $SheetName `
    -NomeTabela $TableName `
    -ManterVisivel:$KeepSheetVisible

  if ($protecaoEstruturaOriginal) {
    Escrever-Info "Reaplicando protecao estrutural na copia."
    Invoke-ComRetry { $workbook.Protect($null, $true, $false) } | Out-Null
  }

  Invoke-ComRetry { $workbook.Save() } | Out-Null
  Invoke-ComRetry { $workbook.Close($true) } | Out-Null
  Liberar-Com $workbook
  $workbook = $null
} finally {
  if ($workbook) {
    Invoke-ComRetry { $workbook.Close($false) } | Out-Null
    Liberar-Com $workbook
  }
  if ($excel) {
    Invoke-ComRetry { $excel.Quit() } | Out-Null
    Liberar-Com $excel
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}

$validacao = Validar-WorkbookExportado -Caminho $outputFullPath -NomeSheet $SheetName -NomeTabela $TableName

[PSCustomObject]@{
  SourceFile = Split-Path $sourceFullPath -Leaf
  OutputPath = $outputFullPath
  SheetName = $SheetName
  TableName = $TableName
  Groups = $resultado.Rows / $MaxLinhasOrigem
  Rows = $resultado.Rows
  Columns = $resultado.Columns
  ReopenTableRows = $validacao.TableRows
  ReopenTableColumns = $validacao.TableColumns
  SheetVeryHidden = ($validacao.SheetVisible -eq 2)
  WorkbookStructureProtected = $validacao.ProtectStructure
} | ConvertTo-Json -Depth 3
