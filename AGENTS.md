# AGENTS.md — Arquivo Digital Escolar

Arquivo operacional curto para continuar o projeto **Arquivo Digital Escolar** com ChatGPT, Codex no PowerShell ou outro agente.

A V2 foi encerrada após auditorias complementares. A partir de agora, o foco é **V3 — escala real, limpeza profunda e operação segura para a Secretaria**.

---

## 1. Regra-mãe

```text
O sistema já funciona.
Não reescrever tudo.
Não mexer em área sensível sem diagnóstico.
Fazer uma etapa por vez.
Preservar o que está aprovado.
Economizar comandos, relatórios e leituras desnecessárias.
```

Fluxo padrão:

```text
confirmar Git limpo → diagnosticar só o necessário → alterar pouco → validar → usuário testar → commit/push → tag quando autorizado
```

---

## 2. Projeto

```text
Projeto: Arquivo Digital Escolar
Site: https://escolaieda.com/arquivo-digital/
Repositório: mcpmieda/escolaieda
Pasta local: C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda
```

Arquivos principais:

```text
arquivo-digital/index.html
arquivo-digital/arquivo-digital.css
arquivo-digital/arquivo-digital.js
arquivo-digital/arquivo-digital-utils.js
scripts/validar-arquivo-digital.mjs
scripts/testes-regressao-arquivo-digital.mjs
scripts/testes-utils-arquivo-digital.mjs
scripts/diagnostico-sharepoint-v2-9.ps1
```

Pastas locais fora do Git:

```text
backups_locais/
diagnosticos/
```

---

## 3. Primeira ação ao abrir nova sessão no Codex

Use este começo apenas quando for uma **nova sessão**:

```text
Leia o AGENTS.md inteiro. Não altere arquivos ainda. Rode:

git status --short
git log -1 --oneline --decorate
git tag --points-at HEAD

Depois informe estado do Git, último commit, tags no HEAD e se está pronto para iniciar a próxima etapa da V3.
```

Na **mesma sessão**, não repetir contexto grande. Usar prompts curtos com a etapa da V3.

---

## 4. Comandos padrão de validação

Sempre que alterar código do Arquivo Digital, rodar o que fizer sentido:

```powershell
node scripts/validar-arquivo-digital.mjs
node scripts/testes-regressao-arquivo-digital.mjs
node scripts/testes-utils-arquivo-digital.mjs
node --check arquivo-digital/arquivo-digital.js
node --check arquivo-digital/arquivo-digital-utils.js
git diff --check
git status --short
```

Se alterar scripts:

```powershell
node --check scripts/validar-arquivo-digital.mjs
node --check scripts/testes-regressao-arquivo-digital.mjs
node --check scripts/testes-utils-arquivo-digital.mjs
```

Não usar `git add .` como padrão. Adicionar somente arquivos necessários.

---

## 5. Padrão AQUI.txt simplificado

Quando o usuário disser `open AQUI`, interpretar como:

```text
Ler C:\Users\Eugui\Downloads\AQUI.txt.
Executar exatamente as instruções do arquivo.
Ao final, apagar somente o AQUI.txt usado.
```

Regras:

```text
Não procurar AQUI.docx.
Não extrair imagens.
Não criar fluxo alternativo.
Se falhar antes de ler, não apagar.
Se leu e executou, apagar ao final.
```

---

## 6. Decisões permanentes do sistema

### Lixeira

Na interface, sempre usar o termo:

```text
Lixeira
```

Implementação atual aprovada:

```text
DOCUMENTOS_ATIVOS/_ARQUIVADOS
```

Não trocar nomes técnicos internos só por estética.

### Gavetas

Fonte oficial:

```text
Coluna Choice GAVETA na biblioteca DOCUMENTOS_ATIVOS
```

Regras:

```text
SharePoint é a fonte oficial.
localStorage nunca é fonte definitiva.
cadastro/edição/exclusão de gavetas deve respeitar SharePoint.
excluir gaveta não apaga PDF.
gaveta vazia aparece como Gaveta não informada.
```

### Upload

```text
Upload comum nunca substitui arquivo existente.
Nome igual gera nome livre: NOME (2).pdf, NOME (3).pdf.
Substituição só pelo botão Substituir no painel lateral.
```

### Abertura de arquivo

```text
Clicar no card abre painel lateral.
PDF só abre pelo botão ABRIR ARQUIVO.
Registro VISUALIZOU fica protegido contra duplo clique.
```

### Anotações

```text
Não salvar automaticamente texto incompleto.
Salvar somente pelo botão.
PATCH de anotação existente usa If-Match/eTag.
Não registrar histórico se salvar anotação falhar por conflito.
```

### Central de Duplicidades

```text
ignora documentos da Lixeira;
respeita pares marcados como Pessoas diferentes;
nomes exatamente iguais aparecem;
nomes compactos iguais ou claramente contidos aparecem;
4 pontos ou mais aparecem;
3 pontos aparecem somente com critério forte;
2 pontos não aparecem;
Nome igual é cálculo visual do frontend, não coluna SharePoint.
```

### Mesclagem

```text
Mesclar baixa o PDF atual, adiciona páginas do PDF local ao final e substitui o conteúdo do mesmo arquivo.
Mantém nome e caminho.
Registra MESCLOU.
Bloqueia documento na Lixeira.
Limite defensivo de mesclagem local: 50 MB somados conhecidos.
```

---

## 7. Áreas sensíveis

Não alterar sem diagnóstico específico:

```text
login Microsoft / MSAL
CONFIG, tenantId, clientId, siteId, listIds
Graph / SharePoint / permissões
upload / upload session
substituição
mesclagem
histórico
anotações
Central de Duplicidades
Lixeira/restaurar
gavetas
notificações globais
CSS de pré-login
```

Nunca incluir em código, relatório ou commit:

```text
tokens
senhas
segredos
conteúdo completo de PDFs
conteúdo sensível de anotações
```

---

## 8. Regras de HTML, CSS e UI

### HTML seguro

```text
Não inserir dados externos diretamente em innerHTML.
Dados externos: nome de arquivo, gaveta, usuário, histórico, observação, anotação, SharePoint, Graph ou texto digitado.
Quando montar HTML com string, usar escaparHtml ou helper equivalente.
Evolução futura: createElement/textContent em templates críticos.
```

### CSS e hovers

```text
Não criar botão novo dependendo de button:hover global.
Todo botão sensível deve ter classe própria.
Hover novo deve ser escopado pelo container da área.
Não remover CSS antigo no escuro.
Limpeza CSS profunda deve ser por blocos pequenos, com teste visual.
```

Pontos conhecidos para V3:

```text
hovers antigos ainda podem existir em alguns X de fechar;
1 ou 2 botões de opção ainda podem estar herdando hover antigo;
notificações funcionam, mas o CSS do overlay ainda tem camadas históricas;
CSS ainda tem duplicidades e !important que precisam limpeza controlada.
```

Regras de notificações:

```text
#mensagemSistema deve ficar fora de .card.
Não recolocar em containers com overflow, transform, filter ou backdrop-filter.
Notificação global deve ficar no topo visível da viewport.
Evitar duplicar mensagem no canal global e no painel ao mesmo tempo.
```

---

## 9. Estado V2 encerrado

V2 concluída e testada:

```text
V2.1A — integridade por ARQUIVO_ID
V2.1 — hardening seguro
V2.2 — auditoria innerHTML/XSS
V2.3 — handlers inline zerados
V2.4 — acessibilidade avançada
V2.5/V2.5A — segurança de operações e correção do título ao substituir PDF
V2.6 — performance medida
V2.7 — limpeza CSS controlada
V2.8 — diagnóstico CSP/CDN/SRI
V2.9 — permissões/SharePoint/operação
V2.10 — testes automatizados mínimos
V2.11 — modularização gradual de utilitários
V2.12 — fechamento pós-auditorias
```

Regra:

```text
Não reabrir refatoração grande da V2 sem diagnóstico específico.
Próximas mudanças devem ser bug real, auditoria pontual ou etapa planejada da V3.
```

---

## 10. Plano-mãe V3 — escala real, CSS profundo e operação

A V3 deve ser executada em etapas. O Codex pode trabalhar várias etapas na mesma sessão, mas deve finalizar uma, validar, pedir OK do usuário e só então seguir para a próxima.

Ao concluir uma etapa, atualizar este checklist trocando `[ ]` por `[x]`, sem reescrever o AGENTS inteiro.

### Checklist V3

```text
[ ] V3.0 — Abrir V3 e proteger ponto final da V2
[ ] V3.1 — Auditoria real SharePoint/PnP para 6 mil+ arquivos
[ ] V3.2 — Preparação SharePoint para mais de 5 mil itens
[ ] V3.3 — Limpeza CSS profunda: hovers antigos, X de fechar, botões de opção e notificações
[ ] V3.4 — Lista com paginação visual/virtualização segura
[ ] V3.5 — Busca preparada para 6 mil arquivos
[ ] V3.6 — Central de Duplicidades com teste de 6 mil e Web Worker se necessário
[ ] V3.7 — Histórico, anotações e alertas por demanda
[ ] V3.8 — Operação mensal segura da Secretaria
[ ] V3.9 — Permissões avançadas e menor privilégio
[ ] V3.10 — CSP real e dependências locais
[ ] V3.11 — Modularização por domínio
[ ] V3.12 — Testes avançados e auditoria visual
[ ] V3.13 — Polimento final V3 e tag de fechamento
```

---

## 11. Detalhamento das etapas V3

### V3.0 — Abrir V3 e proteger ponto final da V2

Objetivo:

```text
confirmar Git limpo, último commit, tag final da V2 e testes atuais.
```

Fazer:

```text
git status --short
git log -1 --oneline --decorate
git tag --points-at HEAD
node scripts/validar-arquivo-digital.mjs
node scripts/testes-regressao-arquivo-digital.mjs
node scripts/testes-utils-arquivo-digital.mjs
```

Pode atualizar AGENTS apenas para marcar V3.0 concluída.

---

### V3.1 — Auditoria real SharePoint/PnP para 6 mil+ arquivos

Objetivo:

```text
rodar diagnóstico real e somente leitura do SharePoint.
```

Usar:

```text
scripts/diagnostico-sharepoint-v2-9.ps1
```

Verificar:

```text
quantidade real de documentos;
listas e bibliotecas;
versionamento;
permissões únicas;
links compartilhados;
usuários diretos fora do grupo;
registros sem ARQUIVO_ID;
ARQUIVO_ID sem documento em Ativos/Lixeira;
nomes iguais com IDs diferentes;
volume de histórico, anotações e alertas.
```

Não alterar SharePoint nesta etapa.

---

### V3.2 — Preparação SharePoint para mais de 5 mil itens

Objetivo:

```text
preparar DOCUMENTOS_ATIVOS e listas auxiliares para volume grande.
```

Fazer somente após V3.1:

```text
confirmar/criar índices necessários;
prioridade provável: GAVETA, Modified, FileDirRef, UniqueId/ID técnico e campos usados em filtros;
registrar antes/depois;
não mudar nomes de listas/colunas sem necessidade.
```

Se exigir alteração real no SharePoint, pedir confirmação explícita do usuário antes.

---

### V3.3 — Limpeza CSS profunda: hovers antigos, X de fechar, botões de opção e notificações

Objetivo:

```text
remover heranças visuais antigas e CSS morto sem mudar o design aprovado.
```

Alvos prioritários:

```text
hovers antigos em botões X de fechar;
hover antigo em botões de opção ainda escondidos;
button:hover global afetando botões sensíveis;
CSS de notificações em camadas;
seletores duplicados de dashboard/cards/chips;
!important desnecessários;
CSS morto de fases antigas.
```

Modo de execução:

```text
fazer por blocos pequenos dentro da mesma sessão;
validar cada bloco;
usuário testa no final ou entre blocos críticos;
não criar relatório longo se um resumo no commit bastar;
se houver risco visual, manter e anotar no resumo.
```

Testar:

```text
login/pré-login;
X de painel lateral;
X da Central de Duplicidades;
X do Histórico Geral;
X da Central de Upload;
X das Configurações;
botões de opção/abas;
notificações;
mobile.
```

---

### V3.4 — Lista com paginação visual/virtualização segura

Objetivo:

```text
evitar renderizar 6 mil cards de uma vez.
```

Caminho recomendado:

```text
primeiro paginação visual simples: 50/100 itens + Carregar mais;
depois, se necessário, virtualização.
```

Preservar:

```text
busca;
Recentes;
Gavetas;
Lixeira;
Nome igual;
painel lateral;
identidade por ARQUIVO_ID.
```

---

### V3.5 — Busca preparada para 6 mil arquivos

Objetivo:

```text
busca rápida mesmo com milhares de documentos.
```

Fazer:

```text
medir busca com dados simulados;
criar índice local de busca normalizada;
evitar normalização repetida;
manter debounce;
garantir combinação busca + gaveta + lixeira.
```

---

### V3.6 — Central de Duplicidades com teste de 6 mil e Web Worker se necessário

Objetivo:

```text
não travar a interface ao analisar nomes em volume grande.
```

Fazer:

```text
simular 6 mil documentos;
medir tempo real;
confirmar modo indexado;
se travar, criar Web Worker apenas para duplicidades;
mostrar progresso real se necessário.
```

Não criar Web Worker sem prova de necessidade.

---

### V3.7 — Histórico, anotações e alertas por demanda

Objetivo:

```text
não carregar tudo indefinidamente no início.
```

Fazer:

```text
Histórico Geral por período/página;
Histórico do arquivo sob demanda por ARQUIVO_ID;
Anotações por ARQUIVO_ID;
Alertas apenas necessários para dashboard/duplicidades;
considerar filtros server-side com índices.
```

---

### V3.8 — Operação mensal segura da Secretaria

Objetivo:

```text
criar rotina de manutenção sem depender de memória humana.
```

Incluir:

```text
revisão de membros do grupo da Secretaria;
links compartilhados;
permissões únicas;
registros órfãos;
lixeira;
versionamento;
relatório de saúde do Arquivo Digital.
```

Preferir PowerShell/PnP somente leitura no início.

---

### V3.9 — Permissões avançadas e menor privilégio

Objetivo:

```text
reduzir risco de Sites.ReadWrite.All sem quebrar produção.
```

Fazer:

```text
estudar Sites.Selected em ambiente controlado;
não trocar direto em produção;
testar login, upload, histórico, anotações, mesclagem, versões;
se exigir backend/app-only, planejar fase própria.
```

---

### V3.10 — CSP real e dependências locais

Objetivo:

```text
fortalecer segurança de carregamento externo.
```

Fazer:

```text
hospedar/vendorizar MSAL ou criar build controlado;
vendorizar pdf-lib;
remover CSS inline/atributos style quando possível;
testar CSP em modo relatório se o servidor permitir;
só depois aplicar política bloqueante.
```

---

### V3.11 — Modularização por domínio

Objetivo:

```text
reduzir arquivo-digital.js sem quebrar o app.
```

Ordem sugerida:

```text
graph-client.js
historico.js
anotacoes.js
upload.js
painel-lateral.js
duplicidades.js
configuracoes.js
pdf-engine.js
ui.js
```

Regra:

```text
só modularizar bloco com teste/validação.
Não dividir tudo de uma vez.
```

---

### V3.12 — Testes avançados e auditoria visual

Objetivo:

```text
ir além dos testes Node puros.
```

Futuro possível:

```text
Vitest;
Playwright;
axe;
Lighthouse;
testes de navegador;
testes visuais de hover, modal, painel e mobile.
```

Não instalar dependências sem plano.

---

### V3.13 — Polimento final V3 e tag de fechamento

Objetivo:

```text
fechar V3 com testes, Git limpo e tag final.
```

Fazer:

```text
rodar todas as validações;
teste manual do usuário;
atualizar checklist AGENTS;
criar tag final da V3 autorizada pelo usuário.
```

---

## 12. Como o Codex deve trabalhar na V3

```text
Pode fazer várias etapas na mesma sessão, mas nunca misturar mudanças sem validação.
Cada etapa deve ter escopo claro.
Relatório longo só quando necessário.
Diagnóstico longo só quando necessário.
Para limpeza CSS, pode usar resumo curto se a mudança for pequena.
Ao concluir etapa V3, atualizar apenas o checklist do AGENTS.
Não criar arquivos extras de salvamento.
Não criar tag sem autorização.
```

Se o usuário disser “próxima etapa”, seguir o checklist V3 na ordem.

---

## 13. Pendências opcionais fora do caminho crítico

```text
modais próprios no lugar de confirm/prompt;
semelhanças leves na Central de Duplicidades, escondidas por padrão;
página/nota de privacidade e retenção;
observabilidade avançada;
modo diagnóstico por query string;
backend próprio/Power Automate/Azure Function para operações pesadas;
migração para TypeScript ou framework, somente se algum dia fizer sentido.
```

---

## 14. Comando de publicação aprovado

Depois de mudança testada e autorizada:

```powershell
git status --short
git add CAMINHOS_ALTERADOS
git commit -m "Mensagem objetiva"
git push origin main
```

Depois de ponto seguro autorizado:

```powershell
git tag NOME_DA_TAG
git push origin NOME_DA_TAG
git tag --points-at HEAD
```
