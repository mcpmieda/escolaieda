param(
  [Parameter(Mandatory = $false)]
  [string]$SiteUrl = "https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL",

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

Garantir-PnpModulo

Escrever "Conectando em $SiteUrl"
Connect-PnPOnline -Url $SiteUrl -Interactive

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

Garantir-Lista -Titulo "ENQUETES_SITE" | Out-Null
Garantir-CampoTexto -Lista "ENQUETES_SITE" -Nome "Pergunta"
Garantir-CampoTexto -Lista "ENQUETES_SITE" -Nome "Opcoes" -Multilinha
Garantir-CampoBool -Lista "ENQUETES_SITE" -Nome "Publicado"
Garantir-CampoData -Lista "ENQUETES_SITE" -Nome "DataInicial"
Garantir-CampoData -Lista "ENQUETES_SITE" -Nome "DataFinal"

Garantir-Lista -Titulo "CONFIGURACOES_PORTAL" | Out-Null
Garantir-CampoTexto -Lista "CONFIGURACOES_PORTAL" -Nome "Chave"
Garantir-CampoTexto -Lista "CONFIGURACOES_PORTAL" -Nome "Valor" -Multilinha

Garantir-Lista -Titulo "MIDIAS_SITE" -Template "DocumentLibrary" | Out-Null

Escrever "Concluído. Use -Aplicar para criar estruturas; sem -Aplicar o script atua como conferência."
