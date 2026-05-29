# AGENTS.md — Arquivo Digital Escolar

Arquivo operacional do projeto **Arquivo Digital Escolar**.

Este AGENTS existe para orientar ChatGPT, Codex no PowerShell ou qualquer agente que vá mexer no sistema do Arquivo Digital.

Escopo deste arquivo:

```text
arquivo-digital/index.html
```

Fora do escopo deste arquivo:

```text
site público da escola;
página institucional;
calendário escolar;
página de professores;
portais de teste de aluno/professor/direção;
organização geral do repositório;
imagens gerais do site fora do Arquivo Digital.
```

---

# 1. Regra principal

O Arquivo Digital Escolar já funciona. O objetivo é estabilizar, corrigir dívidas técnicas e evoluir com segurança.

Não reescrever tudo.
Não fazer várias fases de uma vez.
Não mexer em área sensível sem diagnóstico.

Regra-mãe:

```text
confirmar estado real no Git
→ diagnosticar
→ alterar pouco
→ validar
→ usuário testar
→ commit/tag somente quando autorizado
```

---

# 2. Primeira ação ao retomar

Quando o usuário disser “vamos continuar”, “comece”, “retomar projeto” ou abrir o Codex no repositório, a primeira ação deve ser somente diagnóstico:

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"
git status --short
git log -1 --oneline --decorate
git tag --points-at HEAD
```

Depois informar objetivamente:

```text
estado do Git;
último commit;
tags no HEAD;
se há alterações pendentes;
próximo passo recomendado.
```

Se houver alteração pendente não explicada, parar e avisar.

---

# 3. Fluxo obrigatório de segurança

Para qualquer alteração em `arquivo-digital/index.html`:

```text
1. Confirmar estado real do Git.
2. Criar backup em backups_locais.
3. Gerar relatório em diagnosticos.
4. Alterar somente o necessário.
5. Validar JS com Node quando disponível.
6. Rodar git diff --check.
7. Conferir que o diff mudou só o necessário.
8. Mostrar resumo objetivo do que mudou.
9. Aguardar teste do usuário no site publicado.
10. Só fazer commit/push/tag quando autorizado.
```

Regras permanentes:

```text
não usar git add . como padrão;
não apagar backups/diagnosticos sem pedido claro;
não criar arquivos extras de salvamento automático a cada passo;
registrar mudanças em diagnosticos, commit e tag quando for ponto seguro;
atualizar este AGENTS somente quando houver decisão técnica importante.
```

---

# 4. Identidade do projeto

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

Objetivo:

```text
organizar documentos escolares em PDF, com busca, gavetas, histórico, anotações, upload, substituição, mesclagem, versões, Lixeira e Central de Duplicidades usando Microsoft 365, SharePoint e Graph.
```

---

# 5. Preferências do usuário

O usuário prefere:

```text
passos curtos;
pouca leitura por vez;
comandos PowerShell prontos quando necessário;
diagnóstico antes de mudança arriscada;
alteração pequena por vez;
backup antes de mexer no index.html;
relatório em diagnosticos;
teste no site publicado antes de commit/tag;
preservar o que já funciona;
não colar códigos enormes no chat;
evitar refatoração grande sem necessidade.
```

Quando o ChatGPT no navegador preparar alteração longa, pode entregar `.txt` para o usuário rodar.

Quando o Codex estiver no PowerShell, pode agir diretamente no repositório seguindo este AGENTS.

---

# 6. Estrutura relevante

Estrutura relevante para este AGENTS:

```text
escolaieda/
├─ arquivo-digital/
│  └─ index.html
├─ backups_locais/   # local, fora do Git
└─ diagnosticos/     # local, fora do Git
```

Regras:

```text
backups_locais/ deve ficar fora do Git;
diagnosticos/ deve ficar fora do Git;
se alguma dessas pastas estiver rastreada, remover do rastreamento com git rm --cached, sem apagar arquivos físicos.
```

---

# 7. Microsoft 365, SharePoint e Graph

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
DOCUMENTOS_ATIVOS:   7adea611-e627-4593-a0b0-cecf58744c16
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

Grupo de acesso previsto/controlador do Arquivo Digital:

```text
GRUPO DA SECRETARIA - ARQUIVO DIGITAL
```

Regra permanente:

```text
nunca incluir tokens, senhas ou credenciais em commits, relatórios, código ou documentação.
```

---

# 8. Decisões técnicas permanentes

## 8.1. Lixeira

Na interface, usar sempre:

```text
Lixeira
```

A estratégia aprovada usa a pasta interna:

```text
DOCUMENTOS_ATIVOS/_ARQUIVADOS
```

Internamente, podem continuar termos técnicos como:

```text
ARQUIVADO
_ARQUIVADOS
tagArquivado
estaArquivado
```

Não trocar nomes técnicos só por estética.

No histórico/dashboard, usar linguagem clara para leigos, preferindo termos como:

```text
FOI PARA LIXEIRA
```

em vez de textos ambíguos como “arquivou”.

## 8.2. Gavetas

Coluna SharePoint:

```text
Title: GAVETA
InternalName: GAVETA
Tipo: Choice
Biblioteca: DOCUMENTOS_ATIVOS
```

Decisão atual:

```text
SharePoint é a fonte oficial das gavetas;
localStorage não é fonte definitiva;
fallback local só serve para emergência quando o SharePoint não carrega.
```

Opções reais padronizadas em 27/05/2026:

```text
Gaveta 1 até Gaveta 36
```

Regras:

```text
não criar coluna duplicada de gaveta;
usar sempre InternalName GAVETA;
cadastro/edição/exclusão de gavetas deve atualizar a coluna Choice no SharePoint;
excluir gaveta não apaga PDF;
excluir gaveta reclassifica documentos para gaveta vazia;
gaveta vazia aparece como Gaveta nao informada;
quando SharePoint falhar, cadastro/edição/exclusão devem ser bloqueados ou tratados com mensagem clara.
```

## 8.3. Upload comum nunca substitui

Regra aprovada:

```text
Upload comum nunca substitui arquivo existente.
Se já existir nome igual, o sistema gera nome livre automaticamente.
Substituição só ocorre pelo botão Substituir dentro do painel lateral.
```

Exemplo:

```text
ALUNO.pdf
ALUNO (2).pdf
ALUNO (3).pdf
```

Essa regra também orienta qualquer renomeação que precise evitar colisão de nomes.

## 8.4. Abertura de PDF

Regra aprovada:

```text
clicar no nome do arquivo não abre PDF diretamente;
clicar no arquivo abre painel lateral;
PDF só abre pelo botão ABRIR PDF;
registro VISUALIZOU fica em segundo plano.
```

## 8.5. Anotações

Regra aprovada:

```text
anotações não salvam automaticamente texto incompleto;
salvar deve ocorrer pelo botão existente.
```

`agendarSalvarAnotacao` deve indicar alteração não salva, mas não deve gravar texto incompleto sozinho.

Evolução futura:

```text
controle de concorrência com eTag / If-Match.
```

## 8.6. Histórico

Regra recente:

```text
não reintroduzir busca completa de histórico/anotações dentro de carregarHistoricoDocumento;
usar dados em cache sempre que possível.
```

Histórico deve ser legível para usuário leigo, separando:

```text
Ação
Data/hora
Usuário
Detalhes técnicos úteis
Motivo informado somente quando houver motivo real
```

## 8.7. Central de Duplicidades

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

Possível melhoria futura:

```text
mostrar possíveis semelhanças leves.
```

Essa opção deve ficar escondida por padrão e não contar como pendência principal.

## 8.8. Mesclar PDFs

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
versões do SharePoint preservam atualização quando aplicável;
bloqueia documento na Lixeira.
```

Decisões:

```text
Mesclar não escolhe outro documento do Arquivo Digital;
Mesclar não cria arquivo novo separado;
Mesclar não muda o nome do arquivo atual;
Mesclar não apaga documentos automaticamente;
Mesclar não mexe na Central de Upload.
```

## 8.9. Relatório de arquivo

Regra aprovada:

```text
Relatório de arquivo é apenas visual.
Não reintroduzir download/cópia sem pedido explícito e diagnóstico.
```

---

# 9. Áreas sensíveis

Não alterar sem diagnóstico específico:

```text
login Microsoft;
MSAL;
CONFIG;
siteId;
clientId;
tenantId;
IDs das listas;
SharePoint/Graph;
upload;
substituição;
mesclagem;
histórico;
anotações;
Central de Duplicidades;
Lixeira/restaurar;
gavetas;
permissões Microsoft.
```

Não reintroduzir blocos antigos removidos sem diagnóstico específico.

Atenção especial a blocos antigos de upload, duplicidades, relatório visual e funções duplicadas de envio direto.

Não recriar a função:

```text
São a mesma pessoa
```

sem pedido explícito e diagnóstico específico.

---

# 10. Estado funcional conhecido

Estado conhecido pelo histórico, sempre confirmando no Git antes de agir:

```text
Login, documentos, guias, busca, painel lateral, abertura de PDF, histórico, anotações, upload, gavetas, Lixeira, substituir, mesclar, versões SharePoint, dashboard e Central de Duplicidades funcionam.
```

Também já foram melhorados:

```text
estados vazios;
mensagens sem mover layout;
carregamentos visuais;
cabeçalho do painel;
hovers e botões de ações do painel.
```

---

# 11. Pontos seguros conhecidos

Pontos seguros importantes, a confirmar no Git antes de usar:

```text
ponto-seguro-gavetas-sharepoint-fonte-oficial-ok
ponto-seguro-correcao-profunda-index-ok
ponto-seguro-carregamentos-visuais-ok
ponto-seguro-hover-versoes-sharepoint-ok
ponto-seguro-hover-acoes-painel-css-antigo-removido-ok
```

Comandos de conferência:

```powershell
git tag --list "NOME_DA_TAG"
git tag --points-at HEAD
```

Não presumir que uma tag existe apenas porque foi recomendada.

---

# 12. Regras de UI, CSS e HTML seguro

Regras gerais de CSS/UI:

```text
não criar botão novo dependendo de button:hover global;
todo botão novo deve ter classe própria;
todo hover novo deve ser escopado pelo container da área;
se botão tiver visual próprio, excluir da regra global de hover/active;
não remover CSS antigo no escuro;
primeiro aplicar CSS novo escopado, testar, depois remover seletor antigo exato;
evitar !important, mas aceitar temporariamente em blocos finais de estabilização.
```

Regra permanente de HTML:

```text
não inserir dados externos diretamente em innerHTML.
```

Dados externos incluem:

```text
nome de arquivo;
gaveta;
usuário;
histórico;
observação;
anotação;
resultado do SharePoint;
resultado do Graph;
texto digitado pelo usuário.
```

Sempre que montar HTML com string, usar `escaparHtml` nos dados.

Evolução recomendada:

```text
criar elementos com document.createElement;
preencher texto com textContent;
usar addEventListener em vez de onclick inline.
```

---

# 13. Padrão operacional open AQUI

Quando o usuário digitar aproximadamente:

```text
open AQUI
```

o Codex deve procurar em Downloads por:

```text
AQUI.txt
AQUI.docx
```

Regras:

```text
preferir AQUI.txt se existir;
ler o conteúdo antes de agir;
seguir este AGENTS;
gerar relatório em diagnosticos;
apagar somente o arquivo AQUI usado ao final, se a tarefa foi lida e executada.
```

---

# 14. Comandos padrão

Verificar estado:

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"
git status --short
git log -1 --oneline --decorate
git tag --points-at HEAD
```

Executar script enviado pelo ChatGPT, quando esse fluxo for usado:

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"; $tmp = Join-Path $env:TEMP "NOME_DO_PASSO.ps1"; Get-Content -Raw "$env:USERPROFILE\Downloads\NOME_DO_ARQUIVO.txt" | Set-Content -Path $tmp -Encoding UTF8; & $tmp
```

Publicar alteração aprovada:

```powershell
git add arquivo-digital/index.html AGENTS.md
git commit -m "Mensagem objetiva"
git push
```

Atenção:

```text
não usar git add . como padrão.
```

Criar tag, somente quando autorizado:

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

# 15. Plano de dívida técnica

O plano abaixo é guia de evolução. Diagnóstico externo não é ordem de execução.

Antes de aplicar qualquer fase:

```text
confirmar no arquivo atual;
comparar caminhos possíveis;
escolher o melhor caminho com base no diagnóstico real;
executar uma fase por vez;
não fazer refatoração gigante.
```

## Fase 0 — confirmar ponto seguro

Objetivo:

```text
confirmar Git limpo;
confirmar último commit;
confirmar tags recentes;
não iniciar alteração se houver pendência não explicada.
```

## Fase 1 — correções lógicas pequenas

### Fase 1.1 — chave dupla da Central de Duplicidades

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

Teste:

```text
JOAO SILVA.pdf
SILVA JOAO.pdf
```

### Fase 1.2 — ordenação da Lixeira

Objetivo:

```text
garantir ordem previsível por data e nome.
```

### Fase 1.3 — filtros avançados

Objetivo:

```text
diagnosticar se atualizarBotoesFiltros, limparFiltrosAvancadosOcultos e aplicarFiltroRapido ainda são úteis ou se há código morto.
```

## Fase 2 — XSS, innerHTML e DOM seguro

Objetivo:

```text
inventariar innerHTML;
classificar risco;
corrigir primeiro dados externos;
comparar melhor caminho entre escaparHtml, createElement/textContent e addEventListener com base no diagnóstico.
```

Prioridade:

```text
nomes de arquivos;
gavetas;
usuários;
histórico;
observações;
anotações;
Central de Duplicidades.
```

## Fase 3 — remover onclick inline gradualmente

Objetivo:

```text
migrar ações críticas para addEventListener, sem trocar tudo de uma vez.
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

## Fase 4 — modais próprios

Objetivo:

```text
substituir confirm/prompt/alert em ações críticas por modais próprios e acessíveis.
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

## Fases futuras resumidas

Não executar automaticamente. Diagnosticar e comparar alternativas antes.

```text
Graph API: inventariar fetch, criar retry/backoff seguro para leituras e evitar repetição cega em escritas.
Upload grande: avaliar upload session apenas quando diagnóstico mostrar necessidade real.
pdf-lib: avaliar lazy-load para Mesclar e limites de tamanho.
Anotações: implementar eTag / If-Match para evitar sobrescrita silenciosa.
Duplicidades: melhorar performance e precisão com volume alto.
Permissões Microsoft: mapear menor privilégio e estudar Sites.Selected sem alterar no escuro.
CSS: limpar duplicidades por componente, sem remover no escuro.
Código morto: remover apenas com prova.
Arquitetura: separar CSS/JS somente em fase própria e sem mudar comportamento.
Testes: começar por funções puras antes de testes de interface.
Logs: reduzir console solto sem gravar dados sensíveis.
CSP/SRI: preparar só depois de reduzir onclick inline.
```

Próxima correção técnica recomendada:

```text
Fase 1.1 — corrigir chave dupla da Central de Duplicidades.
```

Motivo:

```text
falha lógica real;
mudança pequena;
baixo risco;
não mexe em login, Graph, upload, SharePoint ou visual.
```

---

# 16. Regra final

Este AGENTS orienta somente o **Arquivo Digital Escolar**.

Se a tarefa não ajudar a mexer com segurança em `arquivo-digital/index.html`, ela não deve entrar neste AGENTS.
