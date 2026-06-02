# AGENTS.md — Arquivo Digital Escolar

> **Versão nota 10 — 28/05/2026.**  
> Arquivo operacional para ChatGPT, Codex no PowerShell e qualquer novo agente que continue o projeto **Arquivo Digital Escolar**.  
> Este documento consolida contexto, regras, decisões permanentes, estado atual conhecido, riscos, modo de execução com Codex e o **Plano de Erradicação de Dívida Técnica em 16 fases**, sem perder detalhes importantes.

---

# 0. Leitura obrigatória antes de agir

Este AGENTS existe para impedir que o projeto seja quebrado por falta de contexto.

Antes de qualquer diagnóstico, alteração, refatoração, commit ou orientação técnica, o agente deve entender:

```text
O Arquivo Digital Escolar já funciona.
O objetivo agora é estabilizar, corrigir dívidas técnicas e evoluir com segurança.
Não é para reescrever tudo.
Não é para fazer várias fases de uma vez.
Não é para mexer em área sensível sem diagnóstico.
```

Regra-mãe:

```text
Confirmar estado real no Git → diagnosticar → alterar pouco → validar → usuário testar → commit/tag quando autorizado.
```

---

# 1. Modo de operação do Codex

## 1.1. O que o Codex pode fazer

O Codex no PowerShell pode:

```text
ler este AGENTS.md;
diagnosticar o projeto;
abrir e analisar arquivos;
editar arquivos diretamente no repositório;
rodar validações;
gerar relatórios em diagnosticos;
preparar commits;
fazer commit/push/tag quando o usuário autorizar.
```

O Codex não precisa receber scripts `.txt` para alterações comuns. Esse fluxo de `.txt` é útil quando o ChatGPT no navegador prepara algo para o usuário executar manualmente.

## 1.2. O que o Codex não deve fazer sozinho

O Codex não deve:

```text
começar fases por conta própria apenas porque leu este AGENTS;
executar mais de uma fase sem autorização explícita;
fazer refatoração geral do index.html;
usar git add . como padrão;
fazer commit/push/tag sem autorização ou confirmação do usuário;
apagar arquivos físicos de backups/diagnosticos sem pedido claro;
alterar login/MSAL/Graph/SharePoint/permissões sem diagnóstico específico;
aceitar diagnóstico externo de outra IA como verdade sem confirmar no index atual.
```

## 1.3. Primeira ação do Codex em qualquer retomada

Quando o usuário disser algo como “vamos continuar”, “comece”, “retomar projeto” ou abrir o Codex no repositório, a primeira ação deve ser:

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"
git status --short
git log -1 --oneline --decorate
git tag --points-at HEAD
```

Depois disso, informar:

```text
estado do Git;
último commit;
tags no HEAD;
se há alterações pendentes;
próximo passo recomendado segundo este AGENTS.
```

## 1.4. Prompt seguro para iniciar o Codex

Prompt recomendado ao abrir Codex:

```text
Leia o AGENTS.md inteiro. Não altere arquivos ainda. Confirme o estado com git status --short, git log -1 --oneline --decorate e git tag --points-at HEAD. Depois me diga se o projeto está pronto para iniciar a próxima fase.
```

Para iniciar a próxima fase recomendada:

```text
Leia o AGENTS.md inteiro. Inicie a FASE 1.1 — corrigir chave dupla da Central de Duplicidades. Primeiro faça diagnóstico somente leitura, gere relatório em diagnosticos e não altere arquivos ainda.
```

Depois de aprovar o diagnóstico:

```text
Agora aplique a correção da FASE 1.1 seguindo o AGENTS.md. Crie backup, gere relatório, valide JS e git diff --check. Não faça commit ainda.
```

---

# 2. Fluxo obrigatório de segurança

Para qualquer alteração em `arquivo-digital/index.html`:

```text
1. Confirmar estado real do Git.
2. Abortar se houver alteração pendente não explicada.
3. Criar backup em backups_locais.
4. Gerar relatório em diagnosticos.
5. Alterar somente o necessário.
6. Validar JS com Node quando disponível.
7. Rodar git diff --check.
8. Mostrar resumo objetivo do que mudou.
9. Aguardar teste do usuário no site publicado.
10. Só fazer commit/push/tag quando autorizado.
```

Fluxo resumido:

```text
diagnóstico focado
→ backup
→ alteração pequena
→ relatório
→ validação JS
→ git diff --check
→ teste no site publicado
→ commit/push
→ tag/ponto seguro
```

Regra atual de registro:

```text
Não criar arquivos extras de salvamento a cada passo.
O registro de cada alteração deve ficar no relatório em diagnosticos, no commit e, quando for ponto seguro, na tag.
Atualizar o AGENTS somente quando houver conjunto relevante de mudanças ou decisão técnica importante.
```

---

# 3. Identidade do projeto

Projeto:

```text
Arquivo Digital Escolar
```

Site publicado:

```text
https://escolaieda.com/arquivo-digital/
```

Repositório GitHub:

```text
mcpmieda/escolaieda
```

Pasta local conhecida:

```text
C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda
```

Arquivo principal atual:

```text
arquivo-digital\index.html
```

O sistema organiza documentos escolares em PDF da Escola Iêda MCPM com integração ao Microsoft 365, SharePoint e Microsoft Graph.

---

# 4. Preferências do usuário

O usuário prefere:

```text
passos curtos;
pouca leitura por vez;
comandos PowerShell prontos;
diagnóstico antes de mudança arriscada;
alteração pequena por vez;
backup antes de mexer no index.html;
relatório em diagnosticos;
teste no site publicado antes de commit/tag;
preservar o que já funciona;
não colar códigos enormes no chat;
evitar refatoração grande sem necessidade.
```

Quando o ChatGPT no navegador preparar uma alteração longa, pode entregar `.txt` para o usuário rodar.

Quando o Codex estiver no PowerShell, pode agir diretamente no repositório seguindo este AGENTS.

---

# 5. Estrutura conhecida do repositório

Estrutura conhecida:

```text
escolaieda/
├─ aluno/
├─ arquivos/
├─ direcao/
├─ imagens/
├─ professor/
├─ arquivo-digital/
│  └─ index.html
├─ calendario.html
├─ CNAME
├─ documentos.html
├─ fundo_logo_ieda.jpg
├─ index.html
├─ logo_escola.png
└─ professores.html
```

Pastas locais auxiliares:

```text
backups_locais/
diagnosticos/
```

Regras:

```text
backups_locais/ deve ficar fora do Git.
diagnosticos/ deve ficar fora do Git.
Não criar arquivos extras de salvamento automático a cada passo.
```

`.gitignore` deve conter:

```text
backups_locais/
diagnosticos/
```

Se essas pastas já foram versionadas no passado, remover do rastreamento com cuidado usando `git rm --cached`, sem apagar arquivos físicos, salvo pedido explícito.

---

# 6. Microsoft 365, SharePoint e Graph

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

## 6.1. IDs conhecidos

Site ID:

```text
eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17
```

`DOCUMENTOS_ATIVOS`:

```text
7adea611-e627-4593-a0b0-cecf58744c16
```

`HISTORICO_ACESSOS`:

```text
144b31da-83f8-4ba4-b573-61fd8e5ac09f
```

`ANOTACOES_ARQUIVOS`:

```text
2698ef54-73e9-4ea1-995a-5d552349f57e
```

`ALERTAS_SISTEMA`:

```text
9abdb5fc-c009-4a59-9f91-03677b001b56
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

Redirect URI:

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

# 7. Decisões técnicas permanentes

## 7.1. Lixeira

Apesar da existência de `DOCUMENTOS_ARQUIVADOS`, a estratégia aprovada é usar a pasta interna:

```text
DOCUMENTOS_ATIVOS/_ARQUIVADOS
```

Na interface, usar sempre:

```text
Lixeira
```

Internamente, podem existir termos técnicos:

```text
ARQUIVADO
_ARQUIVADOS
tagArquivado
estaArquivado
```

Não trocar nomes técnicos só por estética.

## 7.2. Gavetas

Coluna SharePoint:

```text
Title: GAVETA
InternalName: GAVETA
Tipo: Choice
Biblioteca: DOCUMENTOS_ATIVOS
```

Decisão atual:

```text
SharePoint é a fonte oficial das gavetas.
localStorage não é fonte definitiva.
Fallback local só serve para emergência quando o SharePoint não carrega.
```

Em 27/05/2026, as opções reais foram padronizadas para `Gaveta 1` até `Gaveta 36`.

Regras:

```text
não criar coluna duplicada de gaveta;
usar sempre InternalName GAVETA;
cadastro/edição/exclusão de gavetas deve atualizar a coluna Choice no SharePoint;
excluir gaveta não apaga PDF;
excluir gaveta reclassifica documentos para gaveta vazia;
gaveta vazia aparece como Gaveta nao informada;
localStorage não pode ser a fonte oficial;
quando SharePoint falhar, cadastro/edição/exclusão devem ser bloqueados ou tratados com mensagem clara.
```

## 7.3. Upload comum nunca substitui

Regra aprovada:

```text
Upload comum nunca substitui arquivo existente.
Se já existir nome igual, o sistema gera nome livre automaticamente.
Substituição só ocorre pelo botão Substituir dentro do painel lateral.
```

Exemplo:

```text
TESTEI.pdf
TESTEI (2).pdf
TESTEI (3).pdf
```

## 7.4. Abertura de PDF

Regra aprovada:

```text
Clicar no arquivo não abre PDF diretamente.
Clicar no arquivo abre painel lateral.
PDF só abre pelo botão ABRIR PDF.
```

Depois de otimização recente:

```text
ABRIR PDF abre imediatamente.
Registro VISUALIZOU fica em segundo plano.
```

## 7.5. Anotações

Regra aprovada:

```text
Anotações não devem salvar automaticamente texto incompleto.
Salvar deve ocorrer pelo botão existente.
```

`agendarSalvarAnotacao` deve indicar alteração não salva, mas não gravar texto incompleto sozinho.

Futuro planejado:

```text
controle de concorrência com eTag / If-Match.
```

## 7.6. Histórico

Histórico do documento usa dados em cache sempre que possível.

Regra recente:

```text
Não reintroduzir busca completa de histórico/anotações dentro de carregarHistoricoDocumento.
```

O histórico deve ser legível para usuário leigo, separando:

```text
Ação
Data/hora
Usuário
Detalhes técnicos úteis
Motivo informado, somente quando houver motivo real
```

## 7.7. Central de Duplicidades

A Central:

```text
ignora documentos da Lixeira;
aparece no dashboard;
abre em painel lateral esquerdo;
o painel de documento abre à direita;
respeita pares marcados como São pessoas diferentes;
permite desfazer individualmente e desfazer todos;
deve preservar casos fortes e reduzir falsos positivos por sobrenomes comuns.
```

Regra consolidada:

```text
nomes exatamente iguais aparecem;
nomes compactos iguais ou claramente contidos aparecem;
4 pontos ou mais aparecem;
3 pontos aparecem somente se primeiro/segundo nomes atenderem critério forte;
2 pontos não aparecem;
se primeiro nome for parecido, mas não igual, o segundo nome precisa ser exatamente igual;
se primeiro nome for igual, o segundo nome pode ser igual/parecido;
pares marcados como São pessoas diferentes não aparecem mais.
```

Possível melhoria futura:

```text
Mostrar possíveis semelhanças leves.
```

Essa opção deve ficar escondida por padrão e não contar como pendência principal.

## 7.8. Mesclar PDFs

Função `Mesclar` aprovada:

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
versões do SharePoint preservam atualização quando aplicável;
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

# 8. Áreas sensíveis

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

Não recriar a função:

```text
São a mesma pessoa
```

sem pedido explícito e diagnóstico específico. Uma tentativa anterior bagunçou visual e botões.

---

# 9. Estado atual aprovado em linguagem simples

Estado funcional conhecido após as correções recentes:

```text
Site funciona.
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
Hover dos botões de versões foi corrigido.
Hover antigo dos botões de versões foi removido.
Botões de ações do painel foram corrigidos.
CSS antigo dos botões de ações do painel foi removido.
```

Importante:

```text
Esse estado é conhecido pelo histórico, mas deve ser confirmado no Git antes de agir.
```

---

# 10. Pontos seguros recentes

Pontos seguros importantes conhecidos:

```text
ponto-seguro-gavetas-sharepoint-fonte-oficial-ok
ponto-seguro-correcao-profunda-index-ok
ponto-seguro-mensagens-sobrepostas-ok
ponto-seguro-mensagens-css-limpo-ok
ponto-seguro-carregamentos-visuais-ok
ponto-seguro-hover-versoes-sharepoint-ok
ponto-seguro-hover-antigo-versoes-removido-ok
ponto-seguro-hover-acoes-painel-ok
ponto-seguro-hover-acoes-painel-css-antigo-removido-ok
```

Confirmar sempre:

```powershell
git tag --list "NOME_DA_TAG"
git tag --points-at HEAD
```

Não presumir que uma tag foi criada apenas porque foi recomendada.

---

# 11. Regras de CSS, hover e UI

As correções recentes mostraram que o maior risco visual era o acúmulo de CSS e hovers antigos.

Regras obrigatórias:

```text
1. Não criar botão novo dependendo de button:hover global.
2. Todo botão novo deve ter classe própria.
3. Todo hover novo deve ser escopado pelo container da área.
4. Se um botão tiver visual próprio, ele deve ser excluído da regra global de hover/active.
5. Não remover CSS antigo no escuro.
6. Primeiro aplicar CSS novo escopado.
7. Testar.
8. Criar tag.
9. Remover seletor antigo exato.
10. Testar de novo.
11. Ao procurar CSS antigo, não confundir seletor real com ocorrência dentro de :not(...).
12. Evitar !important, mas aceitar temporariamente em blocos finais de estabilização.
```

Padrões recentes aprovados:

```text
mensagens sobrepostas sem mover layout;
carregamentos com montarCarregamentoVisual;
cabeçalho do painel com #painelTitulo legível;
botões de versões do SharePoint com hover próprio;
botões de ações do painel com hover próprio.
```

---

# 12. Regras de segurança de HTML

Regra permanente:

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

Sempre que montar HTML com string, usar `escaparHtml` nos dados.

Próxima evolução:

```text
criar elementos com document.createElement;
preencher texto com textContent;
usar addEventListener em vez de onclick inline.
```

---

# 13. Padrão operacional `open AQUI`

Quando o usuário digitar aproximadamente:

```text
open AQUI
```

o Codex deve interpretar como:

```text
Ler o arquivo AQUI em C:\Users\Eugui\Downloads, executar exatamente as instruções contidas nele e apagar o arquivo usado ao final.
```

Caminhos aceitos:

```text
C:\Users\Eugui\Downloads\AQUI.txt
C:\Users\Eugui\Downloads\AQUI.docx
```

Regras:

```text
dar preferência para AQUI.txt se os dois existirem;
se houver AQUI.docx, extrair texto e imagens relevantes;
antes de alterar, ler AGENTS.md;
rodar git status --short;
rodar git log -1 --oneline;
criar backup se mexer no index.html;
gerar relatório em diagnosticos;
ao terminar, apagar somente o arquivo AQUI usado;
se a tarefa falhar antes de ler o conteúdo, não apagar;
se a tarefa foi lida e executada, apagar ao final mesmo se foi só diagnóstico.
```

---

# 14. Comandos padrão

## 14.1. Verificar estado

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"
git status --short
git log -1 --oneline --decorate
git tag --points-at HEAD
```

## 14.2. Executar script enviado pelo ChatGPT, quando esse fluxo for usado

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"; $tmp = Join-Path $env:TEMP "NOME_DO_PASSO.ps1"; Get-Content -Raw "$env:USERPROFILE\Downloads\NOME_DO_ARQUIVO.txt" | Set-Content -Path $tmp -Encoding UTF8; & $tmp
```

## 14.3. Validacoes recomendadas

```powershell
node scripts/validar-arquivo-digital.mjs
node scripts/testes-regressao-arquivo-digital.mjs
node --check arquivo-digital/arquivo-digital.js
git diff --check
```

## 14.4. Publicar alteração aprovada

Publicar somente depois de teste/confirmação do usuário ou autorização explícita.

Adicionar apenas arquivos necessários. Evitar `git add .`.

```powershell
git add arquivo-digital/index.html
git commit -m "Mensagem objetiva"
git push
```

Se alterar só o AGENTS:

```powershell
git add AGENTS.md
git commit -m "Atualizar AGENTS"
git push
```

## 14.5. Criar tag

Criar tag somente quando o usuário aprovar o ponto seguro ou autorizar explicitamente.

```powershell
git tag nome-da-tag
git push origin nome-da-tag
```

## 14.5. Reverter último commit

```powershell
git revert --no-edit HEAD
git push
```

---

# 15. Plano de Erradicação de Dívida Técnica — 16 fases

Este plano foi criado após comparação entre:

```text
diagnósticos internos do projeto;
apontamentos de outras IAs;
estado real atual do arquivo-digital/index.html;
correções já feitas e testadas.
```

Regra:

```text
Diagnóstico externo não é ordem de execução.
Confirmar tudo no index atual antes de mexer.
Não fazer refatoração gigante.
Fazer uma fase por vez.
```

---

## FASE 0 — Marco seguro pré-dívida técnica

Objetivo:

```text
Garantir ponto de restauração antes de atacar dívida técnica.
```

Ações:

```text
1. Confirmar Git limpo.
2. Confirmar último commit.
3. Confirmar tags recentes.
4. Criar tag se ainda não existir: ponto-seguro-hover-acoes-painel-css-antigo-removido-ok.
5. Confirmar AGENTS atualizado.
6. Não iniciar fase técnica se houver alteração pendente não explicada.
```

Critério de saída:

```text
Git limpo, tag criada/confirmada e AGENTS atualizado.
```

---

## FASE 1 — Correções lógicas pequenas

Objetivo:

```text
Corrigir bugs reais de lógica com baixo risco.
```

### Fase 1.1 — chave dupla da Central de Duplicidades

Problema:

```text
dupla:joao|silva
dupla:silva|joao
```

podem cair em grupos diferentes.

Correção:

```text
ordenar as duas palavras antes de montar a chave dupla:
[palavra1, palavra2].sort().join("|")
```

Teste:

```text
JOAO SILVA.pdf
SILVA JOAO.pdf
```

Critério:

```text
a Central deve considerar os dois como candidatos quando fizer sentido.
```

### Fase 1.2 — ordenação da Lixeira

Problema suspeito:

```text
ordenarLixeiraMaisRecentes pode retornar 0 de forma genérica.
```

Correção:

```text
usar comparação consistente por data de modificação/arquivamento e nome.
```

Critério:

```text
Lixeira com ordem previsível.
```

### Fase 1.3 — filtros avançados

Suspeitas:

```text
atualizarBotoesFiltros() chama limparFiltrosAvancadosOcultos();
aplicarFiltroRapido(nomeFiltro) pode ignorar nomeFiltro.
```

Decisão:

```text
religar corretamente;
ou remover como recurso morto;
ou simplificar filtros úteis.
```

### Fase 1.4 — falsos positivos

Exemplo:

```text
atualizarGavetaItemSharePoint
```

Uma IA apontou como inexistente, mas isso deve ser confirmado no index atual antes de concluir.

Critério da Fase 1:

```text
cada correção deve ser pequena, diagnosticada e testada separadamente.
```

---

## FASE 2 — XSS, innerHTML e criação segura de DOM

Objetivo:

```text
Reduzir risco de DOM XSS.
```

Ações:

```text
1. Inventariar todos os innerHTML.
2. Classificar cada ocorrência.
3. Corrigir primeiro os pontos com dados externos.
4. Criar helpers seguros.
5. Migrar gradualmente de innerHTML para createElement/textContent.
```

Classificação:

```text
texto fixo seguro;
HTML com escaparHtml;
HTML com dados do SharePoint;
HTML com dados de usuário;
HTML com onclick interpolado;
risco alto.
```

Prioridade:

```text
nomes de arquivos;
gavetas;
usuários;
histórico;
observações;
anotações;
nomes parecidos;
relatórios;
Central de Duplicidades.
```

Helper recomendado:

```javascript
function criarElemento(tag, texto = "", classes = []) {
  const el = document.createElement(tag);
  if (texto) el.textContent = texto;
  if (classes.length) el.classList.add(...classes);
  return el;
}
```

Critério de saída:

```text
innerHTML de risco alto corrigido ou documentado.
```

---

## FASE 3 — Remover onclick inline gradualmente

Objetivo:

```text
Preparar o sistema para CSP futura e reduzir risco de injeção.
```

Ações:

```text
1. Inventariar todos os onclick inline.
2. Priorizar ações críticas.
3. Trocar por addEventListener.
4. Não trocar todos de uma vez.
```

Prioridade:

```text
botões criados por string;
Central de Duplicidades;
painel lateral;
gavetas;
upload;
ações críticas.
```

Critério de saída:

```text
ações críticas sem onclick inline.
```

---

## FASE 4 — Modais com dialog

Objetivo:

```text
Substituir confirm/prompt/alert nativos por modais próprios e acessíveis.
```

Ações:

```text
1. Criar componente modal padrão com <dialog>.
2. Trocar primeiro ações críticas.
3. Garantir Esc quando permitido.
4. Garantir foco de entrada e saída.
5. Usar texto claro para usuário leigo.
```

Prioridade:

```text
excluir gaveta;
editar gaveta;
mover para Lixeira;
restaurar;
substituir;
mesclar;
desfazer todos;
fechar upload com pendência.
```

Critério de saída:

```text
ações críticas sem confirm/prompt nativo.
```

---

## FASE 5 — Graph API, retry e confiabilidade

Objetivo:

```text
Padronizar chamadas Graph.
```

Ações:

```text
1. Inventariar todos os fetch.
2. Classificar GET, POST, PATCH, PUT e ações destrutivas.
3. Garantir retry/backoff em leituras críticas.
4. Respeitar Retry-After em erro 429.
5. Criar wrapper separado para escrita segura.
```

Cuidado:

```text
POST pode duplicar histórico;
PATCH pode sobrescrever estado;
PUT pode afetar upload/substituição;
escritas não devem repetir cegamente.
```

Critério:

```text
leituras críticas com retry padronizado e escritas mapeadas.
```

---

## FASE 6 — Upload profissional com upload session

Objetivo:

```text
Melhorar confiabilidade para PDFs grandes ou internet instável.
```

Decisão corrigida:

```text
Não usar 4 MB como regra absoluta.
PUT simples pode ser mantido para arquivos pequenos/médios.
Upload Session deve ser usada primeiro para arquivos grandes ou conexão instável.
```

Regra prática recomendada:

```text
até 25 MB ou 50 MB → manter PUT simples;
acima disso → usar Upload Session.
```

Ações:

```text
criar fluxo createUploadSession;
enviar blocos com file.slice;
usar Content-Range;
mostrar progresso real por bloco;
permitir retry do bloco com falha;
usar AbortController;
criar botão cancelar envio;
preservar regra de nome livre.
```

Critério:

```text
arquivos pequenos continuam simples; arquivos grandes usam upload em blocos.
```

---

## FASE 7 — Lazy-load da pdf-lib e proteção de mesclagem

Objetivo:

```text
Reduzir peso inicial e proteger memória.
```

Ações:

```text
1. Remover carregamento inicial desnecessário da pdf-lib, se existir.
2. Carregar pdf-lib apenas ao clicar em Mesclar.
3. Mostrar mensagem “Carregando motor de PDF...”.
4. Criar limite por tamanho.
5. Avisar antes de mesclar PDF grande.
```

Futuro:

```text
Web Worker;
backend/API para PDFs muito grandes, se necessário.
```

Critério:

```text
Mesclar continua funcionando, mas pdf-lib sai do caminho crítico inicial.
```

---

## FASE 8 — Anotações com eTag / If-Match

Objetivo:

```text
Evitar sobrescrita silenciosa quando duas pessoas editam a mesma anotação.
```

Ações:

```text
1. Ao carregar anotação, guardar @odata.etag ou data de modificação.
2. Ao salvar, enviar If-Match.
3. Se SharePoint retornar 412 Precondition Failed, mostrar conflito.
4. Não voltar a salvar automaticamente sem botão.
```

Modal de conflito deve mostrar:

```text
texto atual no SharePoint;
texto que o usuário tentou salvar;
opções: copiar, substituir ou cancelar.
```

Critério:

```text
usuário não sobrescreve anotação de outra pessoa sem perceber.
```

---

## FASE 9 — Central de Duplicidades e performance

Objetivo:

```text
Melhorar precisão e evitar travamento com volume maior.
```

Ações:

```text
corrigir chave dupla ordenada;
melhorar indexação por palavras ordenadas;
avaliar sobrenome/nome;
criar chaves compostas;
limitar grupos grandes;
registrar quando análise foi simplificada por volume.
```

Testes:

```text
500 documentos;
1.000 documentos;
5.000 documentos simulados.
```

Futuro:

```text
Web Worker para análise pesada;
progresso real da análise.
```

Critério:

```text
Central continua útil e não trava com volume maior.
```

---

## FASE 10 — Permissões Microsoft e menor privilégio

Objetivo:

```text
Mapear e reduzir risco de permissões amplas.
```

Ações:

```text
mapear permissões por função;
revisar Sites.ReadWrite.All;
estudar Sites.Selected;
estudar permissões selecionadas/mais granulares;
confirmar grupo da secretaria;
não alterar permissões no escuro.
```

Funções a mapear:

```text
leitura;
upload;
substituir;
renomear;
mover para Lixeira;
restaurar;
alterar gaveta;
versões;
histórico;
anotações.
```

Critério:

```text
mapa de permissões documentado e plano de redução validado.
```

---

## FASE 11 — CSS, hovers e design system

Objetivo:

```text
Eliminar guerra de CSS e excesso de !important.
```

Ações:

```text
diagnóstico geral de CSS restante;
mapear hovers antigos;
mapear seletores duplicados;
mapear CSS morto;
mapear blocos de fase antigos;
mapear !important.
```

Limpar por componente:

```text
botões globais;
cards;
gavetas;
painel lateral;
Central de Upload;
Central de Duplicidades;
dashboard;
Histórico Geral;
Configurações.
```

Criar tokens:

```text
cores;
sombras;
bordas;
espaçamentos;
fontes;
estados de erro/alerta/sucesso.
```

Critério:

```text
menos CSS duplicado, menos !important e hovers previsíveis.
```

---

## FASE 12 — Código morto e IDs órfãos

Objetivo:

```text
Remover código sem uso confirmado.
```

Ações:

```text
diagnóstico de funções declaradas x chamadas;
diagnóstico de IDs do DOM x getElementById;
classificar ativo, dinâmico, morto provável e recurso incompleto;
não apagar sem prova.
```

Possíveis candidatos:

```text
filtros avançados antigos;
relatórios antigos;
CSS antigo de fase;
funções auxiliares não usadas;
HTML invisível que não abre mais.
```

Critério:

```text
código morto óbvio removido e falsos positivos preservados.
```

---

## FASE 13 — Arquitetura: separar sem quebrar

Objetivo:

```text
Começar modularização sem reescrever o sistema.
```

Ordem:

```text
1. Separar CSS primeiro: arquivo-digital/styles.css.
2. Depois separar JS por área.
3. Só depois estudar build.
```

Módulos futuros:

```text
auth.js
graph.js
sharepoint.js
documentos.js
gavetas.js
historico.js
anotacoes.js
upload.js
duplicidades.js
painel.js
ui.js
pdf-engine.js
```

Build futuro:

```text
Vite;
ESLint;
Prettier;
bundle local;
dependências fixas.
```

Critério:

```text
CSS externo funcionando e index menor sem mudar comportamento.
```

---

## FASE 14 — Testes automáticos

Objetivo:

```text
Criar segurança para mudanças futuras.
```

Testes de funções puras:

```text
normalizarTexto
sanitizarNomeArquivo
normalizarNomeGavetaAdministrativa
calcularPontuacaoNomes
deveExibirNomeParecido
gerar chave de duplicidade
ordenar documentos
formatar histórico
separarNomePdf
gerarNomeLivreUploadPdf
```

Ferramentas futuras:

```text
Vitest
Playwright
axe
Lighthouse CI
```

Critério:

```text
primeiros testes de funções puras rodando localmente.
```

---

## FASE 15 — Observabilidade e logs

Objetivo:

```text
Trocar console solto por diagnóstico controlado.
```

Ações:

```text
criar logger.info;
criar logger.warn;
criar logger.error;
modo produção com menos detalhes;
modo diagnóstico com mais detalhes.
```

Não logar:

```text
token;
dados sensíveis;
caminhos completos desnecessários;
conteúdo de anotações;
informações pessoais desnecessárias.
```

Atenção:

```text
Não gravar logs automaticamente no SharePoint sem projeto específico.
Isso pode gerar excesso de registros ou expor dados.
```

Critério:

```text
console mais limpo e erros importantes rastreáveis.
```

---

## FASE 16 — Textos, consistência, CSP/SRI e polimento final

Objetivo:

```text
Padronizar linguagem e preparar segurança de navegador.
```

Ações:

```text
padronizar português visível;
usar acentos em textos visíveis quando não houver problema de encoding;
centralizar textos em MENSAGENS/I18N;
preparar CSP depois de reduzir onclick inline;
avaliar SRI/hospedagem local de dependências;
revisão final mobile/desktop.
```

Critério:

```text
interface consistente e base pronta para CSP/SRI.
```

---

# 16. Ordem recomendada de execução agora

Ordem recomendada:

```text
1. Fase 0 — fechar ponto seguro atual.
2. Fase 1.1 — corrigir chave dupla da Central de Duplicidades.
3. Fase 1.2 — revisar ordenação da Lixeira.
4. Fase 1.3 — diagnosticar filtros avançados.
5. Fase 2.1 — inventário de innerHTML/XSS.
6. Fase 2.2 — corrigir innerHTML de maior risco.
7. Fase 7.1 — lazy-load pdf-lib.
8. Fase 5.1 — inventário de fetch Graph.
9. Fase 6 — upload grande/upload session.
10. Fase 8 — eTag/If-Match em anotações.
11. Fase 11 — limpeza geral de CSS restante.
12. Fase 12 — código morto/IDs órfãos.
13. Fase 13 — separar CSS e depois JS.
```

Próxima correção técnica mais segura:

```text
FASE 1.1 — corrigir chave dupla da Central de Duplicidades
```

Motivo:

```text
falha lógica real;
mudança pequena;
baixo risco;
fácil de testar;
não mexe em login, Graph, upload, SharePoint ou visual.
```

---

# 17. Regra sobre opiniões externas de IAs

Opiniões externas são úteis, mas devem ser tratadas assim:

```text
1. Ler o apontamento.
2. Confirmar no index atual.
3. Separar bug real de falso positivo.
4. Corrigir apenas o que for confirmado.
5. Não permitir que diagnóstico externo provoque refatoração gigante.
```

Exemplos:

```text
createElement/textContent é boa ideia e entra na Fase 2;
dialog é boa ideia e entra na Fase 4;
eTag/If-Match é boa ideia e entra na Fase 8;
Web Worker é boa ideia, mas futura;
git add . não deve virar padrão;
regra fixa de upload session acima de 4 MB não deve ser usada como verdade absoluta;
logs automáticos no SharePoint exigem projeto específico.
```

Regra final:

```text
Diagnóstico externo não é ordem de execução.
O AGENTS.md e o estado real do index atual prevalecem.
```

---

# 18. Histórico consolidado de marcos

## 18.1. Base inicial

```text
login Microsoft/MSAL;
Graph/SharePoint;
listagem de documentos;
busca;
abertura de PDF;
painel lateral;
histórico;
anotações;
Lixeira;
restaurar;
substituir;
versões SharePoint;
Central de Duplicidades;
Dashboard.
```

## 18.2. Upload seguro

```text
Central de Upload criada;
upload exige gaveta e motivo;
progresso e fechamento seguro;
nome igual não substitui;
sistema gera NOME (2).pdf;
histórico registra ENVIOU.
```

## 18.3. Gavetas

```text
coluna GAVETA criada/reutilizada;
SharePoint virou fonte oficial;
edição/exclusão segura;
gavetas visuais;
card Gavetas removido do dashboard porque a função ficou na guia Gavetas.
```

## 18.4. Histórico Geral

```text
layout compacto;
botão Ver mais corrigido para não fechar painel;
filtro de datas planejado;
busca textual e ordenação trabalhadas em fases anteriores.
```

## 18.5. Correções profundas do index

```text
formatarData e limparObservacaoHistorico organizadas;
nomes escapados nos cards;
histórico usando cache;
abertura de PDF imediata;
salvamento de anotação sem recarregamento duplo;
gavetas e abas responsivas.
```

## 18.6. UX recente

```text
estados vazios bonitos;
mensagens modernas;
mensagens sobrepostas sem mover layout;
CSS antigo das mensagens removido;
carregamentos visuais;
cabeçalho do painel corrigido;
hovers dos botões de versões corrigidos;
hover antigo das versões removido;
botões de ações do painel corrigidos;
CSS antigo dos botões de ações removido.
```

---

# 19. O que foi condensado nesta versão

Esta versão foi feita para chegar ao nível “nota 10” como guia operacional.

Foi condensado:

```text
listas enormes de commits antigos;
narrativas muito longas de conversa;
repetições de ponto seguro antigo;
seções duplicadas;
detalhes obsoletos de estado atual;
exemplos repetitivos.
```

Foi preservado:

```text
decisões permanentes;
estado atual conhecido;
regras operacionais;
áreas sensíveis;
padrões de Git;
padrão open AQUI;
fluxo Codex;
roadmap completo de 16 fases;
detalhes de cada fase;
critérios de saída;
ordem recomendada de execução.
```

---

# 20. Primeira ação ao retomar

Se o usuário disser “vamos continuar”, a primeira ação deve ser:

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"
git status --short
git log -1 --oneline --decorate
git tag --points-at HEAD
```

Depois seguir, se o usuário autorizar, para:

```text
FASE 1.1 — corrigir chave dupla da Central de Duplicidades
```

---

# ADENDO AO PLANO DE ERRADICAÇÃO DE DÍVIDA TÉCNICA

Este adendo complementa o Plano de Erradicação de Dívida Técnica do Arquivo Digital Escolar.

Objetivo deste adendo:

```text
Adicionar ao roteiro oficial:
- FASE 0.1 — Blindagem visual pré-login;
- FASE 10.1 — SharePoint como fonte oficial das regras;
- nova ordem recomendada de execução.

Regra para qualquer agente, ChatGPT ou Codex:

Não apagar nenhuma das 16 fases já existentes.
Não resumir o Plano de Erradicação de Dívida Técnica.
Não substituir o AGENTS por versão condensada.
Não alterar arquivo-digital/index.html apenas para organizar este adendo.
Este adendo deve ser usado como complemento do roadmap oficial.
FASE 0.1 — Blindagem visual pré-login

Prioridade:

alta;
fazer antes da Fase 1.1.

Objetivo:

Nada administrativo deve aparecer antes do login Microsoft ser confirmado.

Problema observado:

ao entrar no site antes do login, algumas coisas aparecem rapidamente e depois somem;
a aba de Configurações chegou a aparecer antes de fazer login;
isso passa sensação de falha visual e exposição desnecessária da interface.

O que deve ser diagnosticado/corrigido:

Configurações aparecendo antes do login;
abas aparecendo rapidamente;
dashboard aparecendo antes da autenticação;
botões administrativos piscando na tela;
Central de Upload aparecendo antes da hora;
Central de Duplicidades aparecendo antes da hora;
painéis laterais aparecendo antes da hora;
qualquer dado ou estrutura administrativa aparecendo antes da autenticação confirmada.

Regra técnica desejada:

antes do login, mostrar apenas tela neutra de entrada/carregamento;
o app administrativo deve começar oculto por padrão;
somente depois da autenticação Microsoft confirmada liberar interface, abas, botões e dados;
não confiar apenas em esconder visualmente como segurança real;
usar essa fase como blindagem visual, UX e redução de exposição antes do login.

Critério de saída:

em carregamento anônimo/pré-login não há flash de Configurações, abas, dashboard, botões administrativos, painéis, Central de Upload, Central de Duplicidades ou dados administrativos.

Observação importante:

Esta fase não esconde o código-fonte do site.
Em site estático, o JavaScript continua visível no navegador.
A segurança real deve continuar em Microsoft Entra, Graph, SharePoint e permissões por grupo.
FASE 10.1 — SharePoint como fonte oficial das regras

Prioridade:

alta/média;
fazer junto com a Fase 10 ou antes quando a alteração envolver regras oficiais do sistema.

Objetivo:

Mover o máximo possível de regras oficiais para SharePoint, deixando o front-end principalmente como interface.

Regra estratégica:

se for regra/dado oficial, preferir SharePoint;
se for visual/interação imediata, manter no front-end;
se for rotina agendada, considerar Power Automate no futuro;
nunca confiar em JavaScript como barreira real de segurança.

Candidatos a fonte oficial no SharePoint:

gavetas oficiais;
status do documento;
metadados obrigatórios;
valores permitidos;
permissões por grupo;
visões administrativas;
histórico;
anotações;
alertas;
regras de Lixeira;
colunas de controle;
validações que precisam valer independentemente do navegador.

Candidatos que devem permanecer no front-end:

layout;
cores;
animações;
filtros instantâneos;
painel lateral;
mensagens visuais;
modais;
estados de carregamento;
organização de botões.

Exemplos práticos:

Bom:
GAVETA vem da coluna Choice do SharePoint.

Ruim:
GAVETA existir apenas em lista fixa dentro do JavaScript.

Bom:
SharePoint negar acesso a quem não pertence ao grupo da secretaria.

Ruim:
JavaScript apenas esconder botão de quem não deveria acessar.

Critério de saída:

mapa claro do que é regra oficial e deve ir para SharePoint;
mapa claro do que é apenas interface e deve ficar no front-end;
nenhuma regra crítica dependendo apenas de JavaScript quando poderia ser validada por SharePoint/permissões.

Observação importante:

SharePoint deve ser fonte oficial de dados, regras e permissões.
Front-end deve ser principalmente a tela de operação.
Quanto mais regra oficial ficar no SharePoint, menor a dependência de lógica escondida no JavaScript.
Nova ordem recomendada de execução

Ordem recomendada:

1. Fase 0 — fechar ponto seguro atual.
2. Fase 0.1 — Blindagem visual pré-login.
3. Fase 1.1 — corrigir chave dupla da Central de Duplicidades.
4. Fase 1.2 — revisar ordenação da Lixeira.
5. Fase 1.3 — diagnosticar filtros avançados.
6. Fase 2.1 — inventário de innerHTML/XSS.
7. Fase 2.2 — corrigir innerHTML de maior risco.
8. Fase 7.1 — lazy-load pdf-lib.
9. Fase 5.1 — inventário de fetch Graph.
10. Fase 6 — upload grande/upload session.
11. Fase 8 — eTag/If-Match em anotações.
12. Fase 10 — permissões Microsoft e menor privilégio.
13. Fase 10.1 — SharePoint como fonte oficial das regras.
14. Fase 11 — limpeza geral de CSS restante.
15. Fase 12 — código morto/IDs órfãos.
16. Fase 13 — separar CSS e depois JS.

Próxima correção técnica mais segura:

FASE 0.1 — Blindagem visual pré-login

Motivo:

problema observado pelo usuário;
prioridade alta;
melhora sensação de segurança;
baixo/médio risco;
não mexe em Graph, upload, SharePoint ou dados;
protege a tela antes de iniciar correções lógicas.
Regra final deste adendo
Este adendo deve ser considerado parte oficial do roadmap.
A FASE 0.1 deve ser executada antes da Fase 1.1.
A FASE 10.1 deve ser considerada parte complementar da Fase 10.
Nenhuma das 16 fases originais deve ser apagada, resumida ou substituída por causa deste adendo.

Fim do arquivo.

---

## 18.4. Bloco concluido em 31/05/2026

Resumo curto do bloco concluido:

- FASE 0.1 — Blindagem visual pre-login: concluida, publicada, testada e com ponto seguro.
- FASE 1.1 — Central de Duplicidades: concluida, incluindo reconhecimento de nomes invertidos como "silva joao" e "JOAO SILVA".
- FASE 1.2 — Ordenacao da Lixeira: diagnosticada sem alteracao e com ponto seguro.
- FASE 1.3 — Filtros avancados: diagnosticada sem alteracao; existem funcoes/CSS legados sem HTML ativo correspondente.
- FASE 2.1 — Inventario innerHTML/XSS: concluido e com ponto seguro.
- FASE 2.2 — Correcoes XSS de maior risco: Central de Duplicidades, Gavetas de Configuracao e Painel interno/Dashboard corrigidos e testados.
- FASE 7.1 — pdf-lib sob demanda: concluida e testada; regressao da primeira mesclagem foi corrigida.
- FASE 5.1 — Inventario de fetch Graph: concluido e com ponto seguro.

Observacao importante da FASE 5.1:

- Ja existe fetchGraphComRetry com retry/backoff e suporte a Retry-After.
- Algumas leituras ja usam caminho mais seguro.
- Leituras criticas ainda usam fetch direto e podem ser padronizadas depois.
- Escritas como historico, anotacoes, upload, substituir, mesclar, mover/restaurar NAO devem receber retry cego, para evitar duplicidade de acoes.
- Anotacoes sem eTag/If-Match ficaram confirmadas como risco futuro da FASE 8.

Resumo recente da FASE 6:

- FASE 6 — Diagnostico upload grande/upload session: concluida e com ponto seguro.
- FASE 6.1 — Preparacao para upload grande: concluida, publicada, testada e com ponto seguro.
- FASE 6.2 — Projeto tecnico upload session: concluida e com ponto seguro.
- O upload atual ainda usa PUT simples para arquivos pequenos/medios.
- Arquivos acima de 25 MB agora recebem aviso e confirmacao antes do envio simples.
- Upload session real ainda NAO foi implementada.
- FASE 6.3 sera a implementacao real de createUploadSession para arquivos grandes.
- FASE 6.3 e media/grande e deve preservar nome livre, gaveta obrigatoria, motivo obrigatorio, historico ENVIOU e evitar retry cego.

Regra operacional:

- Usar modo economico com Codex.
- Nao refazer inventarios completos sem necessidade.
- Nao reler arquivos grandes repetidamente.
- Nao criar relatorios longos quando commit/resumo curto bastar.
- Manter uma fase por vez.
- Nao usar git add .
- Nao alterar index.html sem necessidade confirmada.

Proximo caminho recomendado:

- Antes de iniciar nova fase, confirmar git status, ultimo commit e tags no HEAD.
- Proxima fase provavel: FASE 6 — upload grande/upload session, com diagnostico somente antes de qualquer alteracao.


---

## 18.5. Fechamento da FASE 6 em 31/05/2026

Resumo da FASE 6 — upload grande/upload session:

- FASE 6 diagnostico: concluida com ponto seguro.
- FASE 6.1 preparacao: concluida, publicada, testada e com ponto seguro.
- FASE 6.2 projeto tecnico: concluida com ponto seguro.
- FASE 6.3 upload session real: concluida, publicada, testada e com ponto seguro.

Resultado final:

- Upload pequeno/medio continua usando PUT simples do Microsoft Graph.
- Arquivos acima de 25 MB usam createUploadSession.
- Upload grande e enviado em blocos sequenciais.
- Retry permitido somente no bloco atual, sem retry cego do upload inteiro.
- Nome livre automatico foi preservado.
- Gaveta obrigatoria foi preservada.
- Motivo obrigatorio foi preservado.
- Historico ENVIOU so deve ser registrado apos o upload concluir e o documento final existir.
- Fluxo foi testado com PDF pequeno, PDF grande e nome repetido.

Regra permanente:

- Nao reintroduzir retry cego em upload, mesclar, substituir, mover/restaurar, historico ou anotacoes.
- Qualquer ajuste futuro no upload deve preservar o PUT simples para arquivos pequenos e upload session para arquivos grandes.

Proxima fase provavel:

- FASE 8 — eTag/If-Match em anotacoes.


---

## 18.6. Fechamento da FASE 8.1 em 31/05/2026

Resumo da FASE 8 — eTag/If-Match em anotações:

- Diagnóstico da FASE 8 confirmou risco real de sobrescrita silenciosa quando duas pessoas editam a mesma anotação.
- FASE 8.1 foi implementada, publicada, testada e fechada com ponto seguro.
- O sistema agora guarda `@odata.etag` das anotações carregadas.
- Ao abrir uma anotação, o sistema associa o eTag atual ao item em edição.
- Ao salvar anotação existente, o PATCH envia `If-Match`.
- Se o Graph retornar `412 Precondition Failed`, o sistema não registra histórico, não atualiza cache como se tivesse salvo, recarrega a anotação atual e mantém o texto tentado pelo usuário para não perder conteúdo.
- POST de nova anotação não foi alterado nesta fase.

Regra permanente:

- Não remover o uso de `If-Match` no PATCH de anotação existente.
- Não registrar histórico `ANOTACAO` quando o salvamento falhar por conflito.
- Não sobrescrever anotação alterada por outro usuário sem aviso claro.
- Futuras melhorias podem tratar corrida na criação de anotação nova, mas a proteção principal de edição existente já foi implementada.


---

## 18.7. Fechamento das FASES 11, 12 e 13.1 em 31/05/2026

Resumo recente:

- FASE 11 — Limpeza geral de CSS restante: concluída com limpezas seguras.
- FASE 11.1 — CSS de gavetas mobile: removidas regras mobile duplicadas/obsoletas, preservando o bloco atual de 2 colunas no celular.
- FASE 11.2 — CSS obsoleto restante: removidos blocos `.btnAtualizar` sem uso confirmado.
- FASE 11.3 — encerrada sem alteração porque os candidatos restantes tinham uso real, área sensível ou dúvida visual.
- FASE 12 — Código morto/IDs órfãos: removido CSS órfão seguro de `.cardRelatorios`, `.listaRelatorios` e `#centralRelatorios`.
- FASE 13.1 — CSS principal separado: CSS grande do `arquivo-digital/index.html` movido para `arquivo-digital/arquivo-digital.css`.

Decisão importante da FASE 13.1:

- O JavaScript NÃO foi separado nesta fase.
- O CSS principal foi extraído preservando a ordem original.
- O `index.html` passou a referenciar `arquivo-digital.css`.
- Foi mantido CSS crítico mínimo inline para evitar flash visual pré-login antes do CSS externo carregar.

Regras permanentes:

- Não juntar novamente o CSS principal dentro do `index.html` sem motivo forte.
- Não remover o CSS crítico inline de pré-login sem testar risco de flash visual.
- Separação de JavaScript deve ser fase futura própria, com diagnóstico e cuidado maior.
- Limpezas futuras devem continuar em pacotes seguros dentro da mesma fase, sem misturar áreas sensíveis.

Próxima fase provável:

- FASE 13.2 — diagnóstico para separar JavaScript, sem alteração automática no primeiro passo.


---

## 18.8. Fechamento da FASE 13 em 31/05/2026

Resumo da FASE 13 — separação estrutural:

- FASE 13.1 — CSS principal separado do `index.html` para `arquivo-digital/arquivo-digital.css`.
- FASE 13.2 — diagnóstico da separação do JavaScript concluído sem alteração.
- FASE 13.3 — JavaScript principal separado do `index.html` para `arquivo-digital/arquivo-digital.js`.
- O `index.html` agora referencia o CSS e o JavaScript externos.
- Foi mantido CSS crítico mínimo inline para blindagem visual pré-login.
- O JavaScript foi extraído de forma mecânica, preservando `type="module"`, ordem original, `window.*`, handlers existentes e comportamento.
- Teste manual geral foi aprovado: login, listagem, busca, painel lateral, PDF, anotações, upload, duplicidades, configurações, gavetas, Lixeira/restaurar, mesclar e sair/entrar.

Regras permanentes:

- Não juntar novamente CSS ou JavaScript principal dentro do `index.html` sem motivo forte.
- Não remover CSS crítico inline de pré-login sem testar risco de flash visual.
- Futuras mudanças devem considerar que agora existem:
  - `arquivo-digital/index.html`
  - `arquivo-digital/arquivo-digital.css`
  - `arquivo-digital/arquivo-digital.js`
- Alterações futuras em visual devem procurar primeiro no CSS externo.
- Alterações futuras em lógica devem procurar primeiro no JS externo.
- Continuar validando JavaScript com Node após mudanças no JS.

Fases restantes principais:

- FASE 14 — testes automatizados iniciais.
- FASE 15 — observabilidade e logs.
- FASE 16 — textos, consistência, CSP/SRI e polimento final.
- Revisão final geral antes de considerar o Arquivo Digital pronto para uso oficial amplo.


---

## 18.9. Fechamento das FASES 14 e 15 em 31/05/2026

FASE 14 — validação automática inicial:

- Criado `scripts/validar-arquivo-digital.mjs`.
- Valida `index.html`, `arquivo-digital.css` e `arquivo-digital.js`.
- Valida referências externas de CSS/JS.
- Valida CSS crítico pré-login.
- Valida ausência de tags indevidas.
- Valida sintaxe JS em modo módulo.
- Valida funções `window.*`, IDs principais e handlers esperados.
- Comando oficial: `node scripts/validar-arquivo-digital.mjs`.

FASE 15 — observabilidade e logs:

- Criado logger controlado em `arquivo-digital/arquivo-digital.js`.
- Criado `MODO_DIAGNOSTICO = false`.
- Criados `logger.info`, `logger.warn` e `logger.error`.
- `console.warn/error` diretos foram substituídos por `logger.warn/error`.
- Não adicionar logs de token, senha, conteúdo completo de anotações, conteúdo de PDF ou dados pessoais desnecessários.

Regras permanentes:

- Sempre que alterar `index.html`, `arquivo-digital.css` ou `arquivo-digital.js`, rodar `node scripts/validar-arquivo-digital.mjs`.
- Após alteração no JavaScript, validar sintaxe com Node.
- Não substituir `logger.*` por `console.*` direto sem motivo justificado.
- Próxima fase provável: FASE 16 — textos, consistência, CSP/SRI e polimento final.


---

## 18.10. Fechamento da FASE 16 em 31/05/2026

FASE 16.1 — polimento textual:

- Concluída, publicada e testada.
- Corrigiu textos visíveis, acentos e termos como Lixeira.
- Não alterou lógica.

FASE 16.2 — diagnóstico CSP/SRI:

- Concluída como diagnóstico.
- CSP forte ainda não é segura.
- SRI ainda não é plenamente viável.
- Bloqueios: handlers inline, CSS inline crítico, atributos `style`, MSAL via CDN, pdf-lib via CDN/import dinâmico e conexões Graph/SharePoint.

FASE 16.3 — redução de handlers inline:

- Removidos 3 `onclick` inline de botões estáticos de fechamento.
- Migrados para `addEventListener`.
- Handlers inline no HTML caíram de 48 para 45.

FASE 16.4 — redução de handlers inline de abas:

- Removidos 3 `onclick` inline de `btnVerRecentes`, `btnVerAtivos` e `btnVerLixeira`.
- Migrados para `addEventListener`.
- Handlers inline no HTML caíram de 45 para 42.

Regras permanentes:

- Não implementar CSP forte enquanto ainda houver handlers inline e dependências externas sem estratégia.
- Não mexer em MSAL, Graph, upload, anotações, Lixeira, Duplicidades, gavetas, Dashboard, mesclar/substituir sem fase própria.
- Continuar usando `node scripts/validar-arquivo-digital.mjs` após mudanças.
- Reduzir handlers restantes só em pacotes pequenos e testáveis.


---

## 18.11. Fechamento dos ajustes visuais finais em 31/05/2026

Resumo dos ajustes visuais finais:

- Corrigida a aba Gavetas quando não selecionada, padronizando com as demais abas.
- Corrigidos cabeçalhos/títulos da Central de Duplicidades e do Histórico Geral, com contraste e fundo consistentes.
- Cabeçalhos desses painéis passaram a ficar fixos no topo do painel.
- Central de Configurações e Histórico Geral passaram a resetar a rolagem ao abrir, para o título aparecer imediatamente.
- Notificações foram padronizadas para ficarem centralizadas e empilhadas verticalmente, evitando sobreposição.
- Após a correção visual, foi feita limpeza das regras antigas conflitantes relacionadas aos mesmos itens.

Limpeza pós-ajuste visual:

- Removida regra antiga específica de #btnVerAtivos:not(.ativo) que deixava a aba Gavetas diferente.
- Removida regra antiga específica de #btnVerLixeira:not(.ativo) que ficou redundante.
- Substituído posicionamento antigo separado das notificações por base comum mínima.
- Removido media query antigo das notificações que conflitava com o novo empilhamento.

Arquivos alterados nessa rodada:

- arquivo-digital/arquivo-digital.css
- arquivo-digital/arquivo-digital.js

Validações realizadas:

- node scripts/validar-arquivo-digital.mjs
- validação de sintaxe JS quando o JS foi alterado
- git diff --check
- teste manual visual pelo usuário

Regra permanente:

- Não recriar regras antigas específicas que deixem abas não selecionadas com aparência diferente sem motivo claro.
- Notificações devem permanecer centralizadas e empilhadas, sem sobreposição direta.
- Cabeçalhos de painéis importantes devem manter contraste adequado e aparecer imediatamente ao abrir.
- Ajustes visuais futuros devem substituir/remover regras antigas conflitantes quando isso for claramente seguro, evitando empilhar CSS desnecessário.

Estado:

- Pacote visual final aplicado.
- Limpeza pós-ajuste visual aplicada.
- Tag criada: ponto-seguro-ajustes-visuais-finais-ok.


---

## 18.12. Fechamento dos ajustes de 01/06/2026

Resumo da rodada:

- Corrigido hover antigo dos botões da Central de Upload.
- Os botões "Continuar enviando" e "Sair sem enviar" receberam classes próprias:
  - `btnConfirmacaoFecharUpload`
  - `btnContinuarUpload`
  - `btnSairUpload`
- A regra global antiga de `button:hover` e `button:active` foi limitada para não atingir os botões de confirmação do fechamento da Central de Upload.
- Corrigido o posicionamento das notificações para não aparecerem sobre o cabeçalho.
- Corrigida a causa real do sumiço/posição errada das notificações: `#mensagemSistema` estava dentro de `.card`, que usa `overflow: hidden` e `backdrop-filter`.
- `#mensagemSistema` agora fica como filho direto do `body`, fora da `.card`.
- `mostrarMensagem()` passou a exibir a mensagem com `display: flex`, alinhado ao CSS do componente.
- Foi feito diagnóstico de sobras nas notificações: não há função duplicada nem ID duplicado, mas há CSS de mensagens em camadas históricas.

Commits relevantes:

- `cac0239` — Corrigir hover antigo dos botoes.
- `8889c4f` — Corrigir notificacoes fora do cabecalho.
- `b129102` — Corrigir notificacao fora do card.

Relatórios relevantes:

- `diagnosticos/relatorio-correcao-hover-botoes-2026-06-01.md`
- `diagnosticos/relatorio-correcao-notificacoes-fora-cabecalho-2026-06-01.md`
- `diagnosticos/relatorio-diagnostico-profundo-notificacoes-2026-06-01.md`
- `diagnosticos/relatorio-diagnostico-lixo-notificacoes-2026-06-01.md`

Regras permanentes adicionadas:

- A notificação global `#mensagemSistema` deve permanecer fora de `.card`.
- Não recolocar `#mensagemSistema` dentro de containers com `overflow`, `transform`, `filter`, `backdrop-filter` ou contexto visual forte.
- Notificações globais devem funcionar como overlay real da viewport.
- `mostrarMensagem()` deve continuar compatível com o layout flex da classe `.mensagem`.
- Botões sensíveis de diálogos ou centrais não devem depender apenas de `button:hover` global; usar classe própria e hover escopado.
- Antes de adicionar CSS novo para notificações, verificar os blocos existentes de `.mensagem`, `.mensagemPainel`, `#mensagemSistema` e `#mensagemPainel`.

Dívida técnica pequena identificada:

- O CSS das mensagens está funcional, mas em camadas:
  - bloco visual base;
  - bloco de sobreposição;
  - bloco posterior de posicionamento final.
- Próxima limpeza recomendada: consolidar o overlay das mensagens em um bloco único marcado, sem alterar comportamento.

Validações realizadas na rodada:

- `node scripts/validar-arquivo-digital.mjs`
- `node --check arquivo-digital/arquivo-digital.js` quando o JS foi alterado
- `git diff --check`
- teste manual do usuário confirmando funcionamento das notificações

Estado:

- Hover da Central de Upload corrigido.
- Notificações corrigidas no PC e no celular.
- Diagnóstico de sobras concluído.
- Tag de fechamento desta rodada: `ponto-seguro-notificacoes-hover-2026-06-01-ok`.


---

## 18.13. Ajustes UX pós-teste de 01/06/2026

Resumo curto da rodada:

- Notificações globais foram consolidadas para aparecer no topo fixo da viewport.
- Mensagens de ações do painel lateral passaram a usar canal global único; `#mensagemPainel` foi mantido, mas não deve duplicar mensagem embaixo.
- Central de Upload agora oculta o botão vermelho `Enviar PDF(s)` após envio processado e mostra ações coerentes como `Enviar mais PDFs` e `Fechar`.
- Cards de documentos passaram a agrupar chips em `.metadadosArquivo`, com chips lado a lado e quebra apenas quando faltar espaço.
- Chips foram padronizados em altura, padding, fonte e cores:
  - Ativo: verde;
  - Lixeira: rosa/vermelho claro;
  - Gaveta: azul discreto;
  - Nome igual: amarelo discreto.
- Texto visual `Nome repetido` foi trocado por `Nome igual`.
- `Nome igual` permanece cálculo visual do frontend, derivado dos nomes atuais; não criar coluna SharePoint para isso sem fase própria e autorização.
- Dashboard de ações foi ajustado para manter Central de Duplicidades e Histórico Geral como cards irmãos, com mesma proporção no desktop e empilhamento apenas no mobile.
- Central de Duplicidades só deve usar visual de alerta quando tiver `.comAlerta`; com zero casos deve ficar `.discreta`, neutra/positiva.

Commits relevantes:

- `057bd56` — Ajustar notificacoes cards dashboard e upload.
- `f0cbc03` — Corrigir notificacoes chips e dashboard.
- `956ccc8` — Padronizar dashboard chips e nome igual.

Relatórios relevantes:

- `diagnosticos/relatorio-pacote-ajustes-ux-notificacoes-cards-upload-2026-06-01.md`
- `diagnosticos/relatorio-correcao-pos-teste-ux-2026-06-01.md`
- `diagnosticos/relatorio-diagnostico-dashboard-chips-nome-igual-2026-06-01.md`

Regras permanentes adicionadas:

- Não voltar notificações globais para `bottom`; `#mensagemSistema` deve ficar fixo no topo visível da viewport.
- Para ações do painel lateral, evitar exibir a mesma mensagem em `mostrarMensagem()` e `mostrarMensagemPainel()` ao mesmo tempo.
- Não recriar chips como `display:block`, `width:100%` ou filhos sem agrupamento quando fizerem parte dos metadados do card.
- Manter `.metadadosArquivo` como agrupador visual dos chips dos cards.
- A classe interna `seloNomeRepetido` pode permanecer por compatibilidade, mas o texto visível deve ser `Nome igual`.
- `Nome igual` não é dado oficial salvo no SharePoint; recalcular no frontend após mudanças de lista/nome/status.
- Ao ajustar dashboard, preferir corrigir o bloco final responsável por `.dashboardAcoes`; evitar novo CSS apenas para vencer camadas antigas.

