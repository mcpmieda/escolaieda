# AGENTS.md — Arquivo Digital Escolar

Arquivo operacional curto para continuar o projeto **Arquivo Digital Escolar** com ChatGPT, Codex no PowerShell ou outro agente.

A V2 foi encerrada após auditorias complementares. A partir de agora, o foco é **V3 — escala real, limpeza profunda de CSS, operação segura para a Secretaria e preparação para 6 mil+ arquivos**.

---

## 1. Regra-mãe

```text
O sistema já funciona.
Não reescrever tudo.
Não mexer em área sensível sem diagnóstico.
Fazer uma etapa por vez.
Preservar o que está aprovado.
Economizar comandos, relatórios e leituras desnecessárias.
Na mesma sessão do Codex, não repetir contexto grande.
```

Fluxo padrão:

```text
confirmar Git limpo → diagnosticar só o necessário → alterar pouco → validar → usuário testar → commit/push → atualizar checklist → tag quando autorizado
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
Leia o AGENTS.md inteiro. Não altere arquivos ainda.

Trabalhe na pasta:
C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda

Rode:

git status --short
git log -1 --oneline --decorate
git tag --points-at HEAD

Se o Git estiver limpo, rode também:

git pull --ff-only origin main

Depois informe:
- estado do Git;
- último commit;
- tags no HEAD;
- se há alterações pendentes;
- se está pronto para iniciar a V3.0.

Não altere arquivos ainda.
```

Na **mesma sessão**, depois que o Codex já leu este AGENTS, usar comandos curtos como:

```text
Execute a V3.1 conforme o AGENTS. Valide, faça commit/push, atualize somente o checklist do AGENTS e pare aguardando meu OK.
```

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

```text
Na interface, usar sempre: Lixeira.
Implementação atual aprovada: DOCUMENTOS_ATIVOS/_ARQUIVADOS.
Não trocar nomes técnicos internos só por estética.
```

### Gavetas

```text
Fonte oficial: coluna Choice GAVETA na biblioteca DOCUMENTOS_ATIVOS.
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
Arquivos acima de 25 MB usam upload session.
Não reintroduzir retry cego no upload inteiro.
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
Ignora documentos da Lixeira.
Respeita pares marcados como Pessoas diferentes.
Nomes exatamente iguais aparecem.
Nomes compactos iguais ou claramente contidos aparecem.
4 pontos ou mais aparecem.
3 pontos aparecem somente com critério forte.
2 pontos não aparecem.
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

A V3 deve ser executada em etapas. O Codex pode trabalhar várias etapas na mesma sessão, mas deve finalizar uma, validar, atualizar checklist, fazer commit/push, parar e aguardar OK do usuário antes da próxima.

Ao concluir uma etapa, atualizar este checklist trocando `[ ]` por `[x]`, sem reescrever o AGENTS inteiro.

### Checklist V3

```text
[x] V3.0 — Abrir V3 e proteger ponto final da V2
[x] V3.1 — Auditoria real SharePoint/PnP para 6 mil+ arquivos
[x] V3.2 — Preparação SharePoint para mais de 5 mil itens
[x] V3.3 — Limpeza CSS profunda: hovers antigos, X de fechar, botões de opção e notificações
[x] V3.4 — Lista com paginação visual/virtualização segura
[x] V3.5 — Busca preparada para 6 mil arquivos
[x] V3.6 — Central de Duplicidades com teste de 6 mil e Web Worker se necessário
[x] V3.7 — Histórico, anotações e alertas por demanda
[x] V3.8 — Operação mensal segura da Secretaria
[x] V3.9 — Permissões avançadas e menor privilégio
[x] V3.10 — CSP real e dependências locais
[x] V3.11 — Modularização por domínio
[x] V3.12 — Testes avançados e auditoria visual
[x] V3.13 — Polimento final V3 e tag de fechamento
```

### Checklist V4

```text
[x] V4.0 — Reset automático seguro pré-carga dos 6 mil arquivos
```

Regra V4.0:

```text
O usuário autorizou o reset real para preparar a entrada dos 6 mil+ arquivos.
Executar somente com backup/exportação antes, envio para Lixeira do SharePoint por padrão, relatório antes/depois e sem apagar estrutura, permissões, colunas, listas ou gavetas.
Script principal: scripts/reset-arquivo-digital-v4.ps1
Guia: scripts/USO-RESET-ARQUIVO-DIGITAL-V4.md
```

---

## 11. Comandos prontos para o Codex executar a V3 completa

### Comando inicial da nova sessão

```text
Leia o AGENTS.md inteiro. Não altere arquivos ainda.
Trabalhe em C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda.
Rode git status --short, git log -1 --oneline --decorate e git tag --points-at HEAD.
Se o Git estiver limpo, rode git pull --ff-only origin main.
Depois me diga se está pronto para iniciar a V3.0.
```

### Comando padrão para continuar etapa por etapa

```text
Execute a próxima etapa pendente da V3 conforme o checklist do AGENTS.
Faça somente o escopo dessa etapa.
Valide com os comandos necessários.
Atualize apenas o checklist do AGENTS marcando a etapa como concluída se tudo passar.
Faça commit/push com mensagem objetiva.
Não crie tag.
Pare ao final e aguarde meu OK antes de seguir.
```

### V3.0 — comando

```text
Execute a V3.0.
Confirme Git limpo, último commit, tags no HEAD e rode as validações atuais.
Se tudo passar, marque V3.0 como concluída no checklist do AGENTS, faça commit/push e pare.
Não altere lógica do site.
Não crie relatório longo.
Não crie tag.
```

### V3.1 — comando

```text
Execute a V3.1.
Faça auditoria real SharePoint/PnP somente leitura usando scripts/diagnostico-sharepoint-v2-9.ps1.
Não altere permissões, listas, colunas, arquivos, histórico ou anotações.
Se o script exigir login, oriente o usuário e aguarde.
Gere ou preserve o relatório local em diagnosticos se o script já fizer isso.
Ao final, resuma achados práticos: volume, permissões únicas, links, registros órfãos e riscos para 6 mil+ arquivos.
Marque V3.1 no checklist se concluída, commit/push e pare.
Não crie tag.
```

### V3.2 — comando

```text
Execute a V3.2 somente se a V3.1 estiver concluída.
Com base na auditoria real, diagnostique índices e estrutura SharePoint para mais de 5 mil itens.
Não crie índice nem altere SharePoint sem confirmação explícita.
Se houver confirmação, aplicar somente os índices necessários e registrar antes/depois.
Prioridade provável: GAVETA, Modified, FileDirRef, UniqueId/ID técnico e campos usados em filtros.
Marque V3.2 no checklist se concluída, commit/push se houver alteração no repositório e pare.
Não crie tag.
```

### V3.3 — comando

```text
Execute a V3.3 em blocos pequenos dentro da mesma sessão.
Foco: limpeza CSS profunda sem mudar design aprovado.
Alvos: hovers antigos em X de fechar, hover antigo em botões de opção, button:hover global afetando botões sensíveis, CSS de notificações em camadas, seletores duplicados e !important desnecessários.
Primeiro diagnostique rapidamente os seletores reais.
Depois corrija apenas o que estiver comprovado.
Não mexa em JS salvo se for necessário para classe/estado já existente.
Não mexa em login, Graph, SharePoint, upload, histórico, anotações, duplicidades ou dados.
Valide CSS/JS/testes.
Marque V3.3 no checklist se concluída, commit/push e pare.
Não crie tag.
```

Sub-blocos recomendados para V3.3, se precisar dividir sem sair da sessão:

```text
V3.3A — Diagnóstico rápido dos hovers antigos e seletores globais.
V3.3B — Corrigir hovers dos X de fechar.
V3.3C — Corrigir botões de opção/abas afetados por hover antigo.
V3.3D — Consolidar CSS das notificações em bloco único, sem mudar comportamento.
V3.3E — Remover CSS morto/duplicado comprovado e !important desnecessário.
```

### V3.4 — comando

```text
Execute a V3.4.
Implementar paginação visual ou virtualização segura para evitar renderizar 6 mil cards de uma vez.
Preferir primeira versão simples: exibir 50/100 itens e botão Carregar mais.
Preservar busca, Recentes, Gavetas, Lixeira, Nome igual, painel lateral e identidade por ARQUIVO_ID.
Não alterar Graph/SharePoint estruturalmente.
Valide e teste com dados simulados se possível.
Marque V3.4 no checklist, commit/push e pare.
Não crie tag.
```

### V3.5 — comando

```text
Execute a V3.5.
Preparar busca para 6 mil arquivos.
Medir com dados simulados.
Criar ou reforçar índice local de busca normalizada se necessário.
Evitar normalização repetida.
Manter debounce.
Garantir combinação busca + gaveta + lixeira.
Não alterar UX aprovada sem necessidade.
Marque V3.5 no checklist, commit/push e pare.
Não crie tag.
```

### V3.6 — comando

```text
Execute a V3.6.
Testar Central de Duplicidades com 6 mil documentos simulados.
Confirmar modo indexado e medir tempo real.
Não criar Web Worker se não houver prova de travamento.
Se houver travamento, criar Web Worker apenas para duplicidades, preservando regras aprovadas.
Se criar Worker, adicionar validações/testes mínimos e fallback seguro.
Marque V3.6 no checklist, commit/push e pare.
Não crie tag.
```

### V3.7 — comando

```text
Execute a V3.7.
Reduzir carregamento em massa de histórico, anotações e alertas.
Priorizar carregamento por demanda: histórico por período/página, histórico do arquivo por ARQUIVO_ID, anotações por ARQUIVO_ID e alertas necessários ao dashboard/duplicidades.
Preservar eTag/If-Match das anotações.
Não perder dados e não buscar por nome.
Valide fluxos de painel, histórico geral, anotações e recentes.
Marque V3.7 no checklist, commit/push e pare.
Não crie tag.
```

### V3.8 — comando

```text
Execute a V3.8.
Criar rotina operacional mensal segura da Secretaria.
Preferir roteiro/PowerShell/PnP somente leitura no início.
Incluir revisão de grupo da Secretaria, links compartilhados, permissões únicas, registros órfãos, lixeira, versionamento e relatório de saúde.
Não alterar SharePoint sem confirmação explícita.
Marque V3.8 no checklist, commit/push se houver alteração no repositório e pare.
Não crie tag.
```

### V3.9 — comando

```text
Execute a V3.9.
Diagnosticar caminho para permissões avançadas e menor privilégio.
Estudar Sites.Selected em ambiente controlado, sem trocar produção.
Mapear impacto em login, upload, histórico, anotações, mesclagem e versões.
Se exigir backend/app-only, registrar como fase futura e não implementar agora.
Não alterar permissões Azure/SharePoint nesta etapa sem autorização explícita.
Marque V3.9 no checklist, commit/push e pare.
Não crie tag.
```

### V3.10 — comando

```text
Execute a V3.10.
Preparar CSP real e dependências locais.
Diagnosticar caminhos para vendorizar MSAL e pdf-lib ou criar build controlado.
Não aplicar CSP bloqueante sem teste.
Remover CSS inline/atributos style somente quando seguro.
Se o servidor permitir, planejar Report-Only antes de bloquear.
Valide login, Graph, upload, substituir e mesclar se qualquer dependência mudar.
Marque V3.10 no checklist, commit/push e pare.
Não crie tag.
```

### V3.11 — comando

```text
Execute a V3.11.
Modularizar por domínio, sem dividir tudo de uma vez.
Ordem sugerida: graph-client, historico, anotacoes, upload, painel-lateral, duplicidades, configuracoes, pdf-engine, ui.
Só modularizar bloco com teste/validação.
Não mudar comportamento aprovado.
Ao modularizar cada bloco, validar antes de seguir.
Marque V3.11 no checklist, commit/push e pare.
Não crie tag.
```

### V3.12 — comando

```text
Execute a V3.12.
Planejar e implementar testes avançados e auditoria visual somente se fizer sentido.
Não instalar dependências sem justificar.
Possíveis ferramentas: Vitest, Playwright, axe, Lighthouse.
Priorizar testes de navegador para login falso/mock quando possível, painéis, hover, mobile e fluxos críticos.
Se não for seguro instalar ferramentas agora, criar plano e deixar pendente documentado.
Marque V3.12 no checklist, commit/push e pare.
Não crie tag.
```

### V3.13 — comando

```text
Execute a V3.13.
Fechamento final da V3.
Rode todas as validações.
Confirme checklist completo.
Faça revisão final do AGENTS, sem reescrever desnecessariamente.
Prepare resumo final da V3.
Commit/push se houver ajustes.
Não crie tag sem autorização do usuário.
Ao final, informe o comando recomendado para tag final da V3.
```

---

## 12. Detalhamento rápido das etapas V3

```text
V3.0: abrir V3, confirmar ponto final da V2, validar base.
V3.1: auditoria real SharePoint/PnP somente leitura.
V3.2: índices/preparação SharePoint para 5 mil+ itens.
V3.3: limpeza CSS profunda, hovers antigos, X, botões e notificações.
V3.4: paginação visual/virtualização da lista.
V3.5: busca preparada para 6 mil arquivos.
V3.6: duplicidades com teste de 6 mil e Worker se necessário.
V3.7: histórico/anotações/alertas por demanda.
V3.8: rotina mensal segura da Secretaria.
V3.9: menor privilégio/Sites.Selected sem quebrar produção.
V3.10: CSP real e dependências locais.
V3.11: modularização por domínio.
V3.12: testes avançados e auditoria visual.
V3.13: fechamento final e tag da V3.
```

---

## 13. Como o Codex deve trabalhar na V3

```text
Pode fazer várias etapas na mesma sessão, mas nunca misturar mudanças sem validação.
Cada etapa deve ter escopo claro.
Relatório longo só quando necessário.
Diagnóstico longo só quando necessário.
Para limpeza CSS, pode usar resumo curto se a mudança for pequena.
Ao concluir etapa V3, atualizar apenas o checklist do AGENTS.
Não criar arquivos extras de salvamento.
Não criar tag sem autorização.
Não deixar etapa pela metade sem registrar o que falta.
```

Se o usuário disser “próxima etapa”, seguir o checklist V3 na ordem.

---

## 14. Pendências opcionais fora do caminho crítico

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

## 15. Comando de publicação aprovado

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
