# AGENTS.md — Arquivo Digital Escolar

Arquivo curto de continuidade do **Arquivo Digital Escolar**.

Estado atual: o site está em fase final de lançamento, com carga real de milhares de documentos. Tratar como sistema operacional aprovado, não como projeto inicial.

Atualizado em: 2026-06-07.

---

## 1. Regra principal

```text
O sistema já funciona.
Não reescrever tudo.
Não fazer refatoração grande sem motivo real.
Diagnosticar antes de mexer.
Alterar pouco, validar bem e preservar o que está aprovado.
Não alterar SharePoint, permissões, listas, colunas ou gavetas sem pedido explícito.
```

Fluxo recomendado:

```text
git status --short → git pull --ff-only origin main → diagnosticar → alterar só o necessário → validar → commit/push → usuário testar
```

Não usar `git add .` como padrão. Adicionar somente arquivos alterados e necessários.

---

## 2. Projeto

```text
Projeto: Arquivo Digital Escolar
Site: https://escolaieda.com/arquivo-digital/
Repositório: mcpmieda/escolaieda
Pasta local principal: C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda
Área do sistema: arquivo-digital/
```

Arquivos principais:

```text
arquivo-digital/index.html
arquivo-digital/arquivo-digital.css
arquivo-digital/arquivo-digital.js
arquivo-digital/arquivo-digital-utils.js
arquivo-digital/arquivo-digital-graph-client.js
scripts/validar-arquivo-digital.mjs
scripts/testes-regressao-arquivo-digital.mjs
scripts/testes-utils-arquivo-digital.mjs
scripts/testes-graph-client-arquivo-digital.mjs
scripts/auditoria-visual-estatica-v3-12.mjs
scripts/auditoria-massiva-lancamento-arquivo-digital.mjs
scripts/reset-arquivo-digital-v4.ps1
scripts/USO-RESET-ARQUIVO-DIGITAL-V4.md
scripts/retencao-historico-arquivo-digital-v1.ps1
scripts/USO-RETENCAO-HISTORICO-ARQUIVO-DIGITAL-V1.md
```

Pastas locais fora do Git:

```text
diagnosticos/
backups_locais/
```

---

## 3. Validações padrão

Quando alterar código do sistema, rodar conforme o escopo:

```powershell
node scripts/validar-arquivo-digital.mjs
node scripts/testes-regressao-arquivo-digital.mjs
node scripts/testes-utils-arquivo-digital.mjs
node scripts/testes-graph-client-arquivo-digital.mjs
node scripts/auditoria-visual-estatica-v3-12.mjs
node scripts/auditoria-massiva-lancamento-arquivo-digital.mjs
node --check arquivo-digital/arquivo-digital.js
node --check arquivo-digital/arquivo-digital-utils.js
node --check arquivo-digital/arquivo-digital-graph-client.js
git diff --check
git status --short
```

Se alterar apenas documentação, não precisa rodar todos os testes do app, salvo se também alterar código.

---

## 4. Estrutura operacional

Estrutura conhecida no ambiente do Arquivo Digital:

```text
DOCUMENTOS_ATIVOS
DOCUMENTOS_ATIVOS/_ARQUIVADOS  → exibido na interface como Lixeira
DOCUMENTOS_ARQUIVADOS          → não limpar/alterar sem diagnóstico
HISTORICO_ACESSOS
ANOTACOES_ARQUIVOS
ALERTAS_SISTEMA
```

Regras permanentes:

```text
Interface usa o termo Lixeira, não Arquivado.
A pasta técnica _ARQUIVADOS pode continuar existindo.
Não apagar listas, bibliotecas, colunas, gavetas ou permissões.
Não mexer em identificadores de configuração sem diagnóstico.
Não colocar credenciais ou conteúdo completo de PDFs em código, relatório ou commit.
```

Controle de acesso:

```text
Arquivo Digital deve ser restrito à Secretaria.
Grupo planejado/usado: GRUPO DA SECRETARIA - ARQUIVO DIGITAL.
Professores e outros usuários não devem receber acesso a este sistema sem nova decisão.
```

---

## 5. Decisões permanentes de funcionamento

### Abertura de PDF

```text
Clicar no card/nome do arquivo abre o painel lateral.
O PDF só abre pelo botão Abrir arquivo/Visualizar dentro do painel.
O histórico de visualização é registrado ao abrir o PDF, não ao clicar no card.
Duplo clique em ações críticas deve ser bloqueado.
```

### Identidade dos documentos

```text
Histórico, anotações e operações devem usar o ID único do arquivo quando disponível.
Não associar histórico/anotação apenas por nome do arquivo.
Nome igual não é identidade.
```

### Upload

```text
Upload comum nunca substitui arquivo existente.
Nome igual gera nome livre: NOME (2).pdf, NOME (3).pdf etc.
Substituição só pelo botão Substituir no painel lateral.
Arquivos acima de 25 MB usam upload session.
Não reintroduzir retry cego do upload inteiro.
Não reenviar automaticamente arquivo que já tem evidência de criação.
```

Proteções atuais do upload:

```text
Falso aviso de nome existente foi corrigido com análise congelada antes do envio.
Mensagem final do upload foi simplificada para usuário leigo.
Upload parcial não deve ser rebaixado para Não enviado se houver evidência de criação.
Conferência leve compara tamanho local com tamanho remoto, sem baixar PDF e sem contar páginas.
Sessão local de upload salva apenas metadados para recuperação após queda/fechamento.
Card de envio interrompido aparece somente quando há sessão pendente real, não durante upload normal.
Reenvio de lote interrompido exige nova seleção do usuário e processa somente arquivos não encontrados.
```

### Anotações

```text
Não salvar automaticamente texto incompleto.
Salvar somente pelo botão.
Usar controle de conflito ao atualizar anotação existente.
Não registrar histórico se salvar anotação falhar por conflito.
```

### Gavetas

```text
Fonte oficial: coluna GAVETA na biblioteca de documentos ativos.
SharePoint é a fonte oficial.
localStorage nunca é fonte definitiva.
Excluir gaveta não apaga PDF.
Gaveta vazia aparece como Gaveta não informada.
```

### Lixeira

```text
Mover para Lixeira não deve excluir definitivamente.
Restaurar deve voltar o arquivo para a área ativa.
Busca na Lixeira deve pesquisar somente a Lixeira.
```

### Substituir e mesclar

```text
Substituir troca o conteúdo pelo novo PDF e mantém fluxo seguro de nome/link atual.
Mesclar baixa o PDF atual, adiciona páginas do PDF local ao final e substitui o conteúdo do mesmo arquivo.
Mesclar mantém nome e caminho, registra MESCLOU e bloqueia documento na Lixeira.
Limite defensivo de mesclagem local: 50 MB somados conhecidos.
```

### Central de Duplicidades

```text
Ignora documentos da Lixeira.
Respeita pares marcados como Pessoas diferentes.
Com muitos documentos, mostra suspeitas prioritárias, não necessariamente o total absoluto.
O número de suspeitas pode variar quando entram novos documentos, pois a análise é indexada e limitada por desempenho.
Não transformar essa variação em bug sem evidência de falha real.
```

---

## 6. Performance e escala real

```text
Carregamento inicial pode demorar um pouco com 5 mil+ PDFs reais.
Central de Duplicidades roda em segundo plano e prioriza suspeitas.
Painéis devem abrir visualmente primeiro e carregar dados pesados depois quando possível.
Não renderizar todos os documentos de uma vez; preservar paginação/carregar mais.
Busca em Recentes com termo deve usar todos os documentos ativos.
Recentes sem busca deve respeitar limite de recentes.
Lixeira deve continuar separada.
```

Diagnóstico útil no navegador:

```text
window.gerarDiagnosticoPerformanceArquivoDigital()
```

---

## 7. Reset seguro de testes/carga

Script principal:

```text
scripts/reset-arquivo-digital-v4.ps1
```

Uso:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\reset-arquivo-digital-v4.ps1 -Mode DryRun -IncluirLixeira -EnviarParaLixeiraSharePoint
pwsh -ExecutionPolicy Bypass -File .\scripts\reset-arquivo-digital-v4.ps1 -Mode ResetSeguro -IncluirLixeira -EnviarParaLixeiraSharePoint
```

Regras:

```text
Reset real só para ambiente/testes/carga autorizada.
Enviar itens para Lixeira do SharePoint por padrão.
Não apagar estrutura.
Não apagar listas, colunas, permissões ou gavetas.
```

---

## 8. Retenção do histórico

Script principal:

```text
scripts/retencao-historico-arquivo-digital-v1.ps1
```

Uso seguro inicial:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\retencao-historico-arquivo-digital-v1.ps1 -Mode DryRun
```

Regras:

```text
Executar DryRun antes de qualquer remoção real.
Remoção real exige -EnviarParaLixeiraSharePoint e -ConfirmarRetencaoHistoricoAntigo.
Remover apenas itens antigos de HISTORICO_ACESSOS, nunca PDFs ou anotações atuais.
VISUALIZOU padrão: 180 dias.
ANOTACAO padrão: 730 dias.
Outras ações não críticas padrão: 730 dias.
Ações críticas ficam preservadas por padrão.
Remoção real deve usar Lixeira do SharePoint, não exclusão definitiva.
Conferir relatórios em diagnosticos/retencao-historico-v1-YYYYMMDD-HHMMSS/.
```

---

## 9. HTML, CSS e UI

```text
Não inserir dados externos diretamente em innerHTML sem escapar.
Dados externos incluem nome de arquivo, gaveta, usuário, histórico, observação, anotação, SharePoint, Graph e texto digitado.
Quando montar HTML com string, usar escaparHtml ou helper equivalente.
Não criar handler inline novo.
Não criar botão novo dependente de hover global.
Hover novo deve ser escopado.
Não mudar design geral sem pedido.
Manter interface clara para usuário leigo.
```

Termos de interface:

```text
Usar Lixeira.
Usar Possível duplicidade, não Nome já existe.
Usar Enviado — não reenviar quando o arquivo pode ter sido criado e não deve ser reenviado cegamente.
Evitar mensagens técnicas para a Secretaria.
```

---

## 10. Áreas sensíveis

Não alterar sem diagnóstico específico:

```text
login Microsoft / MSAL
configuração do ambiente
Graph / SharePoint / permissões
upload / upload session
sessão local de upload interrompido
conferência leve de upload por tamanho
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

---

## 11. Comandos úteis

Estado do repositório:

```powershell
git status --short
git log -1 --oneline --decorate
git pull --ff-only origin main
```

Commit seguro:

```powershell
git add caminho/do/arquivo1 caminho/do/arquivo2
git commit -m "Mensagem curta e clara"
git push origin main
git status --short
```

Tag somente quando o usuário autorizar:

```powershell
git tag v4-lancamento-oficial
git push origin v4-lancamento-oficial
git tag --points-at HEAD
```

---

## 12. Situação de lançamento

Considerar o sistema como fechado para uso operacional, dependendo apenas de testes reais finais e ajustes pequenos.

Antes de lançamento oficial ou tag final:

```text
1. Testar upload pequeno, médio e grande.
2. Testar queda/fechamento no meio de lote.
3. Testar recuperação de envio interrompido.
4. Testar busca em Recentes, Gavetas e Lixeira.
5. Testar abrir painel, visualizar PDF, salvar anotação e histórico.
6. Testar mover para Lixeira e restaurar.
7. Conferir Central de Duplicidades.
8. Conferir acesso com conta da Secretaria.
9. Criar tag somente após autorização do usuário.
```

Pendências futuras opcionais, não obrigatórias para funcionamento:

```text
Manual final da Secretaria com prints reais, se ainda não estiver pronto.
Ajustes finos de texto/treinamento após uso da equipe.
Melhorias futuras de relatório/conferência, somente se necessário.
```
