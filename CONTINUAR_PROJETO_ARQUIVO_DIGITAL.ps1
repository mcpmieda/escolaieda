$ErrorActionPreference = "Continue"

$Projeto = Join-Path $env:USERPROFILE "Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"
$ArquivoPrompt = Join-Path $Projeto "prompts_codex\RETOMAR_PROJETO_ARQUIVO_DIGITAL.txt"
$PastaSalvamento = Join-Path $Projeto "SALVAMENTO_AUTOMATICO"

Set-Location $Projeto
New-Item -ItemType Directory -Force -Path (Split-Path $ArquivoPrompt) | Out-Null

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " ARQUIVO DIGITAL ESCOLAR - CONTINUAR DE ONDE PAROU" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$statusGit = git status --short
$ultimoCommit = git log -1 --oneline
$tagsHead = git tag --points-at HEAD

$arquivosSalvamento = @()
if (Test-Path $PastaSalvamento) {
    $arquivosSalvamento = Get-ChildItem -LiteralPath $PastaSalvamento -Filter "*.txt" |
        Sort-Object LastWriteTime
}

$ultimoSalvamento = $null
if ($arquivosSalvamento.Count -gt 0) {
    $ultimoSalvamento = $arquivosSalvamento[-1]
}

$resumoSalvamentos = if ($arquivosSalvamento.Count -gt 0) {
    ($arquivosSalvamento | Select-Object -Last 8 | ForEach-Object {
        "- " + $_.Name
    }) -join "`r`n"
} else {
    "- Nenhum TXT encontrado em SALVAMENTO_AUTOMATICO."
}

$ultimoSalvamentoTexto = ""
if ($ultimoSalvamento) {
    $ultimoSalvamentoTexto = Get-Content -Raw -LiteralPath $ultimoSalvamento.FullName
}

$estadoGitTexto = if ($statusGit) { $statusGit -join "`r`n" } else { "Git limpo." }
$tagsTexto = if ($tagsHead) { $tagsHead -join "`r`n" } else { "Nenhuma tag no HEAD atual." }

$pedidoInicial = @"
OI GUI, VAMOS VOLTAR AO PROJETO.
Nós paramos no Arquivo Digital Escolar com o último commit:

$ultimoCommit

Ponto(s) seguro(s) no commit atual:

$tagsTexto

Estado do Git ao abrir:

$estadoGitTexto

Últimos TXT do SALVAMENTO_AUTOMATICO:

$resumoSalvamentos

Último salvamento registrado:

$ultimoSalvamentoTexto

Antes de continuar:
1. Leia o AGENTS.md.
2. Leia os TXT da pasta SALVAMENTO_AUTOMATICO.
3. Considere que o projeto deve continuar com passos pequenos, backup, relatório, salvamento automático, validação, commit/push para mudanças pequenas e tag só após teste aprovado.

Mensagem inicial desejada:

OI GUI, VAMOS VOLTAR AO PROJETO. NÓS PARAMOS NO ÚLTIMO PASSO REGISTRADO NO SALVAMENTO AUTOMÁTICO E NO AGENTS. O QUE DESEJA FAZER?
"@

$pedidoInicial | Set-Content -Path $ArquivoPrompt -Encoding UTF8

try {
    $pedidoInicial | Set-Clipboard
    $copiado = $true
} catch {
    $copiado = $false
}

Write-Host "Pasta do projeto:" -ForegroundColor Yellow
Write-Host $Projeto
Write-Host ""

Write-Host "Ultimo commit:" -ForegroundColor Yellow
Write-Host $ultimoCommit
Write-Host ""

Write-Host "Ponto seguro no HEAD:" -ForegroundColor Yellow
Write-Host $tagsTexto
Write-Host ""

Write-Host "Ultimos salvamentos automaticos:" -ForegroundColor Yellow
Write-Host $resumoSalvamentos
Write-Host ""

Write-Host "Prompt de retomada gerado em:" -ForegroundColor Green
Write-Host $ArquivoPrompt
Write-Host ""

if ($copiado) {
    Write-Host "O prompt tambem foi copiado para a area de transferencia." -ForegroundColor Green
} else {
    Write-Host "Nao consegui copiar para a area de transferencia. Abra o arquivo acima e copie o texto." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Agora abra o Codex/ChatGPT e cole o prompt, ou use este chat e diga o que deseja fazer." -ForegroundColor Cyan
Write-Host ""
Read-Host "Pressione ENTER para fechar"
