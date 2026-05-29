# AGENTS.md — Arquivo Digital Escolar

Arquivo operacional para ChatGPT, Codex no PowerShell e qualquer agente que continue o projeto **Arquivo Digital Escolar**.

Este documento é focado somente no sistema localizado em:

```text
arquivo-digital/index.html
```

Assuntos de organização do site público, páginas institucionais, portais de teste, calendário, professores, imagens gerais do site e outras áreas fora do Arquivo Digital devem ficar no `README.md`, não neste arquivo.

---

## 1. Objetivo do projeto

O **Arquivo Digital Escolar** é um sistema web para organizar documentos escolares em PDF usando Microsoft 365, SharePoint e Microsoft Graph.

Objetivo principal:

```text
Centralizar, localizar, visualizar, classificar, anotar, substituir, mesclar e mover para Lixeira documentos escolares em PDF, com segurança e histórico de ações.
```

Site publicado:

```text
https://escolaieda.com/arquivo-digital/
```

Repositório:

```text
mcpmieda/escolaieda
```

Pasta local conhecida:

```text
C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda
```

Arquivo principal:

```text
arquivo-digital/index.html
```

---

## 2. Regra principal

O Arquivo Digital já funciona. Não reescrever tudo.

Fluxo obrigatório:

```text
confirmar estado real no Git
→ diagnosticar
→ alterar pouco
→ validar
→ usuário testar
→ commit/push/tag somente quando autorizado
```

Antes de alterar `arquivo-digital/index.html`:

```text
1. Conferir Git.
2. Criar backup local.
3. Gerar relatório em diagnosticos.
4. Alterar somente o necessário.
5. Validar JS quando possível.
6. Rodar git diff --check.
7. Mostrar resumo objetivo.
8. Aguardar validação do usuário.
```

---

## 3. Primeira ação ao retomar

Quando o usuário disser “vamos continuar”, “retomar”, “comece”, ou pedir para seguir pelo AGENTS, a primeira ação deve ser somente diagnóstico:

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"
git status --short
git log -1 --oneline --decorate
git tag --points-at HEAD
```

Depois informar:

```text
estado do Git;
último commit;
tags apontando para HEAD;
se há alterações pendentes;
próxima fase recomendada.
```

Não iniciar alteração se houver mudança pendente não explicada.

---

## 4. Preferências do usuário

O usuário prefere:

```text
passos curtos;
pouca leitura;
diagnóstico antes de mudança arriscada;
alteração pequena por vez;
backup antes de mexer no index.html;
relatório em diagnosticos;
teste no site publicado antes de commit/tag;
preservar o que funciona;
não colar códigos enormes no chat;
evitar refatoração grande sem necessidade.
```

Quando o Codex estiver no PowerShell, ele pode editar arquivos diretamente, desde que siga este AGENTS.

---

## 5. Estrutura relevante do Arquivo Digital

Estrutura mínima relevante:

```text
escolaieda/
├─ arquivo-digital/
│  └─ index.html
├─ backups_locais/       # local, fora do Git
└─ diagnosticos/         # local, fora do Git
```

Regras:

```text
backups_locais/ deve ficar fora do Git;
diagnosticos/ deve ficar fora do Git;
não criar arquivos extras de salvamento automático a cada passo;
registrar mudanças no relatório, no commit e em tag quando for ponto seguro.
```

---

## 6. Microsoft 365, SharePoint e Graph

Site SharePoint:

```text
https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL
```

Bibliotecas/listas conhecidas:

```text
DOCUMENTOS_ATIVOS
DOCUMENTOS_ARQUIVADOS
HISTORICO_ACESSOS
ANOTACOES_ARQUIVOS
ALERTAS_SISTEMA
```

Site ID:

```text
eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17
```

IDs conhecidos:

```text
DOCUMENTOS_ATIVOS:    7adea611-e627-4593-a0b0-cecf58744c16
HISTORICO_ACESSOS:   144b31da-83f8-4ba4-b573-61fd8e5ac09f
ANOTACOES_ARQUIVOS:  2698ef54-73e9-4ea1-995a-5d552349f57e
ALERTAS_SISTEMA:     9abdb5fc-c009-4a59-9f91-03677b001b56
```

Aplicativo Entra ID:

```text
Portal Escolar Iêda
```

Client ID conhecido:

```text
bc2ecead-5f2e-48b8-9d48-9d01f2848cfa
```

Tenant ID conhecido:

```text
f04e0fa3-b8dc-4f77-be3c-7dfda0635188
```

Redirect URI do Arquivo Digital:

```text
https://escolaieda.com/arquivo-digital/
```

Permissões Graph atuais/conhecidas:

```text
User.Read
Sites.Read.All
Sites.ReadWrite.All
```

Regra permanente:

```text
Nunca incluir tokens, senhas ou credenciais em commits, relatórios, código ou documentação.
```

---

## 7. Decisões permanentes do sistema

### 7.1 Lixeira

Na interface, usar sempre:

```text
Lixeira
```

A estratégia aprovada usa a pasta interna:

```text
DOCUMENTOS_ATIVOS/_ARQUIVADOS
```

Não trocar nomes técnicos internos apenas por estética. Termos como `ARQUIVADO`, `_ARQUIVADOS`, `tagArquivado` e `estaArquivado` podem continuar internamente.

### 7.2 Gavetas

Coluna SharePoint:

```text
Title: GAVETA
InternalName: GAVETA
Tipo: Choice
Biblioteca: DOCUMENTOS_ATIVOS
```

Decisão:

```text
SharePoint é a fonte oficial das gavetas.
localStorage não é fonte definitiva.
Fallback local só serve para emergência.
```

Opções reais padronizadas em 27/05/2026:

```text
Gaveta 1 até Gaveta 36
```

Regras:

```text
não criar coluna duplicada;
usar sempre InternalName GAVETA;
cadastro/edição/exclusão de gavetas deve atualizar a coluna Choice no SharePoint;
excluir gaveta não apaga PDF;
excluir gaveta reclassifica documentos para gaveta vazia;
gaveta vazia aparece como Gaveta nao informada;
quando SharePoint falhar, alterações em gavetas devem ser bloqueadas ou tratadas com mensagem clara.
```

### 7.3 Upload comum nunca substitui

Regra aprovada:

```text
Upload comum nunca substitui arquivo existente.
Se já existir nome igual, gerar nome livre automaticamente.
Substituição só ocorre pelo botão Substituir dentro do painel lateral.
```

Exemplo:

```text
ALUNO.pdf
ALUNO (2).pdf
ALUNO (3).pdf
```

### 7.4 Abertura de PDF

Regra aprovada:

```text
Clicar no nome do arquivo não abre PDF diretamente.
Clicar no arquivo abre painel lateral.
PDF só abre pelo botão ABRIR PDF.
Registro VISUALIZOU fica em segundo plano.
```

### 7.5 Anotações

Regra aprovada:

```text
Anotações não salvam automaticamente texto incompleto.
Salvar ocorre pelo botão existente.
```

`agendarSalvarAnotacao` pode indicar alteração não salva, mas não deve gravar texto incompleto sozinho.

Evolução futura:

```text
controle de concorrência com eTag / If-Match.
```

### 7.6 Histórico

Regra recente:

```text
Não reintroduzir busca completa de histórico/anotações dentro de carregarHistoricoDocumento.
Usar dados em cache sempre que possível.
```

Histórico deve ser claro para usuário leigo, separando:

```text
Ação
Data/hora
Usuário
Detalhes técnicos úteis
Motivo informado somente quando houver motivo real
```

### 7.7 Central de Duplicidades

A Central:

```text
ignora documentos da Lixeira;
aparece no dashboard;
abertura em painel lateral esquerdo;
painel de documento abre à direita;
respeita pares marcados como São pessoas diferentes;
permite desfazer individualmente e desfazer todos;
deve reduzir falsos positivos por sobrenomes comuns.
```

Regra consolidada:

```text
nomes exatamente iguais aparecem;
nomes compactos iguais ou claramente contidos aparecem;
4 pontos ou mais aparecem;
3 pontos aparecem somente com critério forte;
2 pontos não aparecem;
se primeiro nome for parecido, mas não igual, o segundo nome precisa ser exatamente igual;
se primeiro nome for igual, o segundo nome pode ser igual ou parecido;
pares marcados como São pessoas diferentes não aparecem mais.
```

### 7.8 Mesclar PDFs

Função aprovada:

```text
usuário abre PDF no painel;
clica em Mesclar;
escolhe um PDF local;
motivo é obrigatório;
sistema baixa PDF atual do SharePoint;
adiciona páginas do PDF local ao final;
substitui o conteúdo do mesmo arquivo;
mantém nome e caminho;
registra MESCLOU;
bloqueia documento na Lixeira.
```

Decisões:

```text
Mesclar não escolhe outro documento do Arquivo Digital.
Mesclar não cria arquivo novo separado.
Mesclar não muda o nome do arquivo atual.
Mesclar não apaga documentos automaticamente.
Mesclar não mexe na Central de Upload.
```

---

## 8. Áreas sensíveis

Não alterar sem diagnóstico específico:

```text
login Microsoft
MSAL
CONFIG
siteId
clientId
tenantId
IDs das listas
SharePoint/Graph
upload
substituição
mesclagem
histórico
anotações
Central de Duplicidades
Lixeira/restaurar
gavetas
permissões Microsoft
```

Não reintroduzir blocos antigos removidos:

```text
modalUpload98
modalUpload105
modalUpload106
modalUpload108
modalUpload111
PASSO98
PASSO99
PASSO112
PASSO113
modalDuplicidades84
CONFIG_PASSO_83
cardDuplicidadesDashboard84
btnVisualizarRelatorio
visualizacaoRelatorioArquivo
relatorioArquivoBox
UPLOAD_DIRETO_LIMPO
enviarNovoDocumentoDireto
__enviarNovoDocumentoOriginalDireto
```

Não recriar a função “São a mesma pessoa” sem pedido explícito e diagnóstico específico.

---

## 9. Estado funcional conhecido

Estado conhecido pelo histórico, mas sempre confirmar no Git antes de agir:

```text
Login funciona.
Documentos carregam.
Guias Recentes / Ativos / Gavetas / Lixeira funcionam.
Busca funciona.
Painel lateral funciona.
PDF abre pelo botão correto.
Histórico funciona.
Anotações funcionam.
Upload pela Central funciona.
Upload com nome igual não substitui; renomeia automaticamente.
Gavetas usam SharePoint como fonte oficial.
Alterar gaveta funciona.
Lixeira/restaurar funciona.
Substituir funciona.
Mesclar funciona.
Versões SharePoint funcionam.
Dashboard funciona.
Central de Duplicidades funciona em painel esquerdo.
Estados vazios foram melhorados.
Mensagens não movem layout.
Carregamentos visuais foram aprovados.
Cabeçalho do painel está legível.
Hovers e botões de ações do painel foram corrigidos.
```

---

## 10. Regras de UI, CSS e HTML seguro

Regras de CSS/UI:

```text
não criar botão novo dependendo de button:hover global;
todo botão novo deve ter classe própria;
todo hover novo deve ser escopado pelo container da área;
se um botão tiver visual próprio, excluir da regra global de hover/active;
não remover CSS antigo no escuro;
primeiro aplicar CSS novo escopado, testar, depois remover seletor antigo exato;
evitar !important, mas aceitar temporariamente em estabilização.
```

Regra de HTML seguro:

```text
Não inserir dados externos diretamente em innerHTML.
```

Dados externos incluem:

```text
nome de arquivo
gaveta
usuário
histórico
observação
anotação
resultado do SharePoint
resultado do Graph
texto digitado pelo usuário
```

Sempre usar `escaparHtml` quando montar HTML com string contendo dados externos.

Evolução recomendada:

```text
criar elementos com document.createElement;
preencher texto com textContent;
usar addEventListener em vez de onclick inline.
```

---

## 11. Comandos padrão

Verificar estado:

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"
git status --short
git log -1 --oneline --decorate
git tag --points-at HEAD
```

Publicar alteração aprovada:

```powershell
git add arquivo-digital/index.html AGENTS.md
git commit -m "Mensagem objetiva"
git push
```

Criar tag de ponto seguro somente quando autorizado:

```powershell
git tag nome-da-tag
git push origin nome-da-tag
```

Reverter último commit, se necessário:

```powershell
git revert --no-edit HEAD
git push
```

---

## 12. Próximas fases recomendadas

Executar uma fase por vez.

### Fase 0 — confirmar ponto seguro

Objetivo:

```text
confirmar Git limpo;
confirmar último commit;
confirmar tags recentes;
não iniciar alteração se houver pendência não explicada.
```

### Fase 1.1 — corrigir chave dupla da Central de Duplicidades

Problema:

```text
dupla:joao|silva
dupla:silva|joao
```

podem cair em grupos diferentes.

Correção sugerida:

```text
ordenar as duas palavras antes de montar a chave dupla:
[palavra1, palavra2].sort().join("|")
```

Critério:

```text
JOAO SILVA.pdf e SILVA JOAO.pdf devem cair no mesmo grupo quando fizer sentido.
```

### Fase 1.2 — revisar ordenação da Lixeira

Objetivo:

```text
garantir ordem previsível por data e nome.
```

### Fase 1.3 — diagnosticar filtros avançados

Objetivo:

```text
confirmar se atualizarBotoesFiltros, limparFiltrosAvancadosOcultos e aplicarFiltroRapido ainda são úteis ou se há código morto.
```

### Fase 2 — inventário de innerHTML/XSS

Objetivo:

```text
mapear innerHTML com dados externos e corrigir primeiro pontos de maior risco.
```

### Fase 3 — remover onclick inline gradualmente

Objetivo:

```text
migrar ações críticas para addEventListener, sem trocar tudo de uma vez.
```

### Fase 4 — modais próprios

Objetivo:

```text
substituir confirm/prompt/alert em ações críticas por modais próprios e acessíveis.
```

### Fases futuras

```text
retry/backoff em chamadas Graph;
upload session para arquivos grandes;
lazy-load da pdf-lib;
eTag/If-Match em anotações;
performance da Central de Duplicidades;
revisão de permissões Microsoft;
limpeza gradual de CSS;
separação futura de CSS/JS;
testes automáticos.
```

Próxima correção técnica recomendada:

```text
Fase 1.1 — corrigir chave dupla da Central de Duplicidades.
```

Motivo:

```text
é uma falha lógica real;
é uma mudança pequena;
não mexe em login, Graph, upload, SharePoint ou visual.
```

---

## 13. Regra final

Este AGENTS é a fonte de orientação para o **Arquivo Digital Escolar**.

Se a tarefa for sobre organização do site público, página institucional, calendário, professores, portais de teste ou estrutura geral do repositório, usar o `README.md`.

Se a tarefa for sobre `arquivo-digital/index.html`, usar este `AGENTS.md`.
