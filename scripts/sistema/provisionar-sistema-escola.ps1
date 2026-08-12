param(
  [Parameter(Mandatory = $false)]
  [string]$SiteUrl = "https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL",

  [Parameter(Mandatory = $false)]
  [string]$ClientId = "bc2ecead-5f2e-48b8-9d48-9d01f2848cfa",

  [switch]$Aplicar
)

$ErrorActionPreference = "Stop"

function Escrever($Texto) {
  Write-Host $Texto
}

function Garantir-PnpModulo {
  if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
    throw "PnP.PowerShell não está instalado. Instale com: Install-Module PnP.PowerShell -Scope CurrentUser"
  }
}

function Garantir-Lista {
  param(
    [string]$Titulo,
    [string]$Template = "GenericList"
  )

  $lista = Get-PnPList -Identity $Titulo -ErrorAction SilentlyContinue
  if ($lista) {
    Escrever "${Titulo}: já existe."
    return $lista
  }

  if (-not $Aplicar) {
    Escrever "${Titulo}: seria criada."
    return $null
  }

  Escrever "${Titulo}: criando."
  New-PnPList -Title $Titulo -Template $Template -OnQuickLaunch:$false | Out-Null
  Get-PnPList -Identity $Titulo
}

function Garantir-CampoTexto {
  param([string]$Lista, [string]$Nome, [switch]$Multilinha)
  $campo = Get-PnPField -List $Lista -Identity $Nome -ErrorAction SilentlyContinue
  if ($campo) { return }
  if (-not $Aplicar) {
    Escrever "${Lista}/${Nome}: campo seria criado."
    return
  }
  if ($Multilinha) {
    Add-PnPField -List $Lista -DisplayName $Nome -InternalName $Nome -Type Note -AddToDefaultView | Out-Null
  } else {
    Add-PnPField -List $Lista -DisplayName $Nome -InternalName $Nome -Type Text -AddToDefaultView | Out-Null
  }
}

function Garantir-CampoBool {
  param([string]$Lista, [string]$Nome)
  $campo = Get-PnPField -List $Lista -Identity $Nome -ErrorAction SilentlyContinue
  if ($campo) { return }
  if (-not $Aplicar) {
    Escrever "${Lista}/${Nome}: campo seria criado."
    return
  }
  Add-PnPField -List $Lista -DisplayName $Nome -InternalName $Nome -Type Boolean -AddToDefaultView | Out-Null
}

function Garantir-CampoData {
  param([string]$Lista, [string]$Nome)
  $campo = Get-PnPField -List $Lista -Identity $Nome -ErrorAction SilentlyContinue
  if ($campo) { return }
  if (-not $Aplicar) {
    Escrever "${Lista}/${Nome}: campo seria criado."
    return
  }
  Add-PnPField -List $Lista -DisplayName $Nome -InternalName $Nome -Type DateTime -AddToDefaultView | Out-Null
}

function Garantir-ItemPorTitulo {
  param(
    [string]$Lista,
    [string]$Titulo,
    [hashtable]$Valores
  )

  if (-not $Aplicar) {
    Escrever "${Lista}/${Titulo}: item seria garantido."
    return
  }

  $itens = Get-PnPListItem -List $Lista -PageSize 200 -Fields "Title"
  $existente = $itens | Where-Object { $_["Title"] -eq $Titulo } | Select-Object -First 1

  if ($existente) {
    Set-PnPListItem -List $Lista -Identity $existente.Id -Values $Valores | Out-Null
    Escrever "${Lista}/${Titulo}: item atualizado."
    return
  }

  Add-PnPListItem -List $Lista -Values $Valores | Out-Null
  Escrever "${Lista}/${Titulo}: item criado."
}

function Garantir-Configuracao {
  param(
    [string]$Chave,
    [string]$Valor
  )

  if (-not $Aplicar) {
    Escrever "CONFIGURACOES_PORTAL/${Chave}: configuração seria garantida."
    return
  }

  $itens = Get-PnPListItem -List "CONFIGURACOES_PORTAL" -PageSize 200 -Fields "Chave", "Valor"
  $existente = $itens | Where-Object { $_["Chave"] -eq $Chave } | Select-Object -First 1
  $valores = @{ "Title" = $Chave; "Chave" = $Chave; "Valor" = $Valor }

  if ($existente) {
    Set-PnPListItem -List "CONFIGURACOES_PORTAL" -Identity $existente.Id -Values $valores | Out-Null
    Escrever "CONFIGURACOES_PORTAL/${Chave}: configuração atualizada."
    return
  }

  Add-PnPListItem -List "CONFIGURACOES_PORTAL" -Values $valores | Out-Null
  Escrever "CONFIGURACOES_PORTAL/${Chave}: configuração criada."
}

Garantir-PnpModulo

Escrever "Conectando em $SiteUrl"
Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId

Garantir-Lista -Titulo "PUBLICACOES_SITE" | Out-Null
Garantir-CampoTexto -Lista "PUBLICACOES_SITE" -Nome "Resumo"
Garantir-CampoTexto -Lista "PUBLICACOES_SITE" -Nome "Conteudo" -Multilinha
Garantir-CampoTexto -Lista "PUBLICACOES_SITE" -Nome "Imagem"
Garantir-CampoTexto -Lista "PUBLICACOES_SITE" -Nome "Categoria"
Garantir-CampoData -Lista "PUBLICACOES_SITE" -Nome "DataInicial"
Garantir-CampoData -Lista "PUBLICACOES_SITE" -Nome "DataFinal"
Garantir-CampoBool -Lista "PUBLICACOES_SITE" -Nome "Publicado"
Garantir-CampoBool -Lista "PUBLICACOES_SITE" -Nome "Destaque"
Garantir-CampoTexto -Lista "PUBLICACOES_SITE" -Nome "Autor"
Garantir-CampoData -Lista "PUBLICACOES_SITE" -Nome "DataCriacao"
Garantir-CampoData -Lista "PUBLICACOES_SITE" -Nome "DataAtualizacao"

foreach ($listaPublica in @("AVISOS_SITE", "BANNERS_SITE", "DESTAQUES_SITE")) {
  Garantir-Lista -Titulo $listaPublica | Out-Null
  Garantir-CampoTexto -Lista $listaPublica -Nome "Resumo"
  Garantir-CampoTexto -Lista $listaPublica -Nome "Conteudo" -Multilinha
  Garantir-CampoTexto -Lista $listaPublica -Nome "Imagem"
  Garantir-CampoTexto -Lista $listaPublica -Nome "Categoria"
  Garantir-CampoData -Lista $listaPublica -Nome "DataInicial"
  Garantir-CampoData -Lista $listaPublica -Nome "DataFinal"
  Garantir-CampoBool -Lista $listaPublica -Nome "Publicado"
  Garantir-CampoBool -Lista $listaPublica -Nome "Destaque"
  Garantir-CampoTexto -Lista $listaPublica -Nome "Autor"
  Garantir-CampoData -Lista $listaPublica -Nome "DataCriacao"
  Garantir-CampoData -Lista $listaPublica -Nome "DataAtualizacao"
}

Garantir-Lista -Titulo "ENQUETES_SITE" | Out-Null
Garantir-CampoTexto -Lista "ENQUETES_SITE" -Nome "Pergunta"
Garantir-CampoTexto -Lista "ENQUETES_SITE" -Nome "Opcoes" -Multilinha
Garantir-CampoBool -Lista "ENQUETES_SITE" -Nome "Publicado"
Garantir-CampoData -Lista "ENQUETES_SITE" -Nome "DataInicial"
Garantir-CampoData -Lista "ENQUETES_SITE" -Nome "DataFinal"

Garantir-Lista -Titulo "CONFIGURACOES_PORTAL" | Out-Null
Garantir-CampoTexto -Lista "CONFIGURACOES_PORTAL" -Nome "Chave"
Garantir-CampoTexto -Lista "CONFIGURACOES_PORTAL" -Nome "Valor" -Multilinha

Garantir-Lista -Titulo "PREFERENCIAS_USUARIO" | Out-Null
Garantir-CampoTexto -Lista "PREFERENCIAS_USUARIO" -Nome "Usuario"
Garantir-CampoTexto -Lista "PREFERENCIAS_USUARIO" -Nome "Chave"
Garantir-CampoTexto -Lista "PREFERENCIAS_USUARIO" -Nome "Valor" -Multilinha
Garantir-CampoData -Lista "PREFERENCIAS_USUARIO" -Nome "DataAtualizacao"

Garantir-Lista -Titulo "SERVICOS_PAINEL" | Out-Null
Garantir-CampoTexto -Lista "SERVICOS_PAINEL" -Nome "Nome"
Garantir-CampoTexto -Lista "SERVICOS_PAINEL" -Nome "Status"
Garantir-CampoTexto -Lista "SERVICOS_PAINEL" -Nome "Url"
Garantir-CampoTexto -Lista "SERVICOS_PAINEL" -Nome "Descricao" -Multilinha
Garantir-CampoData -Lista "SERVICOS_PAINEL" -Nome "DataAtualizacao"

Garantir-Lista -Titulo "LOGS_PORTAL" | Out-Null
Garantir-CampoTexto -Lista "LOGS_PORTAL" -Nome "Evento"
Garantir-CampoTexto -Lista "LOGS_PORTAL" -Nome "Usuario"
Garantir-CampoTexto -Lista "LOGS_PORTAL" -Nome "Detalhes" -Multilinha
Garantir-CampoData -Lista "LOGS_PORTAL" -Nome "DataHora"

Garantir-Lista -Titulo "MIDIAS_SITE" -Template "DocumentLibrary" | Out-Null

Garantir-ItemPorTitulo -Lista "PUBLICACOES_SITE" -Titulo "TESTE SITE" -Valores @{
  "Title" = "TESTE SITE"
  "Resumo" = "BOM DIA"
  "Conteudo" = "OLÁ"
  "Categoria" = "Aviso"
  "Publicado" = $true
  "Destaque" = $true
  "Autor" = "Sistema Escola Iêda"
  "DataAtualizacao" = (Get-Date)
}

Garantir-Configuracao -Chave "fontePublicaPublicacoes" -Valor "/site-data/publicacoes-publicas.json"

Escrever "Concluído. Use -Aplicar para criar estruturas; sem -Aplicar o script atua como conferência."
