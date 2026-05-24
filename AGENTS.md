# AGENTS.md — Projeto Arquivo Digital Escolar

> Este arquivo é a memória técnica principal do projeto.  
> O Codex deve ler este arquivo antes de alterar qualquer arquivo do repositório.

---

## 1. Identidade e objetivo do projeto

O projeto se chama **Arquivo Digital Escolar**.

Objetivo: construir e manter um sistema web para a Escola Iêda MCPM, publicado em:

```text
https://escolaieda.com/arquivo-digital/
```

O sistema deve organizar documentos escolares em PDF com:

- login Microsoft;
- integração com Microsoft 365, SharePoint e Microsoft Graph;
- listagem e busca de documentos;
- painel lateral de detalhes;
- histórico de ações;
- anotações por arquivo;
- Lixeira;
- versões do SharePoint;
- relatório apenas para visualização;
- Central de Duplicidades;
- dashboard.

O foco atual do projeto é **estabilizar, diagnosticar e limpar tecnicamente o `index.html` antes de adicionar funções grandes**, evitando remendos acumulados e protegendo o que já funciona.

---

## 2. Como o Codex deve trabalhar neste projeto

### 2.1. Regra principal

Nunca tentar “terminar o site inteiro” de uma vez.

Trabalhar sempre em ciclos pequenos:

```text
diagnóstico → backup → alteração mínima → relatório → teste manual → commit → tag/ponto seguro
```

### 2.2. Antes de qualquer alteração

O Codex deve:

1. ler este `AGENTS.md`;
2. ler os relatórios mais recentes da pasta `diagnosticos`, se ela existir;
3. rodar `git status`;
4. rodar `git log -1 --oneline`;
5. verificar se há alterações pendentes;
6. se houver alteração pendente, não sobrescrever sem entender;
7. criar backup antes de mexer no `arquivo-digital/index.html`;
8. gerar relatório do diagnóstico em `diagnosticos`.

### 2.3. Durante alterações

O Codex deve:

- alterar somente o necessário;
- preservar o que já funciona;
- evitar reescrever o `index.html` inteiro;
- não adicionar scripts concorrentes ao final do arquivo sem diagnóstico;
- não usar regex ampla sem confirmar o trecho atual;
- procurar funções existentes antes de criar novas;
- manter UTF-8;
- registrar no relatório o que foi alterado, onde e por quê.

### 2.4. Depois de alterações

O Codex deve:

- gerar relatório em `diagnosticos`;
- mostrar resumo curto do que mudou;
- não fazer commit automaticamente se o usuário ainda não testou;
- pedir teste manual quando a alteração afetar comportamento visual, login, SharePoint, histórico, upload, painel ou duplicidades;
- só criar commit/tag depois de aprovação explícita do usuário.

---

## 3. Estrutura conhecida do projeto

### Repositório GitHub

```text
mcpmieda/escolaieda
```

### Pasta local conhecida no computador do usuário

```text
C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda
```

### Arquivo principal

```text
arquivo-digital\index.html
```

### Estrutura conhecida do repositório

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

### Pastas locais auxiliares

```text
backups_locais\
diagnosticos\
```

Essas pastas são locais e devem ficar fora do Git.

### `.gitignore`

Já foi criado e enviado ao GitHub com:

```text
backups_locais/
diagnosticos/
```

Commit relacionado:

```text
702e388 Ignorar backups e diagnosticos locais
```

---

## 4. SharePoint, Graph e Microsoft 365

### Site SharePoint

```text
https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL
```

### Bibliotecas/listas conhecidas

```text
DOCUMENTOS_ATIVOS
DOCUMENTOS_ARQUIVADOS
HISTORICO_ACESSOS
ANOTACOES_ARQUIVOS
ALERTAS_SISTEMA
```

### Decisão técnica sobre Lixeira

Apesar de existir a biblioteca `DOCUMENTOS_ARQUIVADOS`, durante a implementação foi adotada a estratégia técnica de usar a pasta interna:

```text
DOCUMENTOS_ATIVOS/_ARQUIVADOS
```

para a função de Lixeira/arquivamento, pois mover arquivos entre bibliotecas diferentes via Graph pode ser mais delicado.

### IDs conhecidos

Site ID usado no código:

```text
eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17
```

Lista/biblioteca `DOCUMENTOS_ATIVOS`:

```text
7adea611-e627-4593-a0b0-cecf58744c16
```

Lista `HISTORICO_ACESSOS`:

```text
144b31da-83f8-4ba4-b573-61fd8e5ac09f
```

Lista `ANOTACOES_ARQUIVOS`:

```text
2698ef54-73e9-4ea1-995a-5d552349f57e
```

Lista `ALERTAS_SISTEMA`:

```text
9abdb5fc-c009-4a59-9f91-03677b001b56
```

### Entra ID / Microsoft Graph

Aplicativo conhecido no Entra:

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

Redirect URI configurada:

```text
https://escolaieda.com/arquivo-digital/
```

Permissões Microsoft Graph já usadas/concedidas:

```text
User.Read
Sites.Read.All
Sites.ReadWrite.All
```

### Segurança

Não incluir tokens, senhas ou credenciais em código, documentação, relatórios ou commits.

---

## 5. Funcionalidades já feitas ou já confirmadas em algum ponto

### 5.1. Login e acesso

- Login Microsoft funcionando com MSAL.
- Usuário conectado aparece com nome e conta.
- Leitura de PDFs do SharePoint funcionando.
- Permissões Graph configuradas e testadas.

### 5.2. Listagem e busca

- Lista documentos ativos.
- Busca instantânea por parte do nome.
- Documentos da Lixeira também podem ser listados/restaurados.
- Documentos da Lixeira devem aparecer ordenados do mais recente ao menos recente quando possível.

### 5.3. Painel lateral por arquivo

Decisão importante:

```text
Clicar no nome do arquivo NÃO deve abrir o PDF diretamente.
```

Fluxo desejado:

```text
Clique no arquivo
→ abre painel lateral na mesma página
→ mostra detalhes, histórico, anotações e ações
→ PDF só abre pelo botão ABRIR PDF dentro do painel
```

Ações esperadas no painel:

- ABRIR PDF;
- renomear;
- substituir;
- enviar para Lixeira;
- restaurar da Lixeira;
- ver histórico;
- ver anotações;
- ver versões do SharePoint;
- visualizar relatório.

O registro de acesso deve ocorrer ao clicar no botão **ABRIR PDF**, não ao apenas selecionar/clicar no arquivo.

### 5.4. Histórico

A lista `HISTORICO_ACESSOS` registra ações como:

```text
VISUALIZOU
RENOMEOU
SUBSTITUIU
ARQUIVOU / Enviou para Lixeira
RESTAUROU
ENVIOU
ANOTACAO
```

O histórico do painel deve mostrar:

- ação;
- data/hora;
- usuário;
- motivo/observação digitado pelo usuário quando houver;
- anotações registradas no histórico.

Regra decidida:

Quando houver motivo digitado pelo usuário, mostrar **somente o motivo do usuário**, sem frases automáticas longas como:

```text
Arquivo restaurado da pasta _ARQUIVADOS para a lista principal. Motivo:
```

### 5.5. Anotações por arquivo

Regras desejadas:

- cada arquivo tem caixa de texto de anotações;
- a anotação atual fica salva em `ANOTACOES_ARQUIVOS`;
- alterações reais de anotação também aparecem no histórico;
- a caixa de anotação deve iniciar menor e crescer conforme o texto;
- o histórico deve manter alterações reais da anotação, não apenas substituir tudo;
- evitar duplicar a mesma anotação quando o usuário salva sem alterar o texto.

Problema atual:

```text
No último teste, o usuário não viu as anotações aparecerem no histórico.
```

Não está confirmado se o problema é:

- falha de exibição;
- falha de gravação;
- cache;
- diferença entre site local/publicado;
- efeito colateral de ajustes anteriores;
- problema no vínculo entre arquivo e anotação.

Esse problema deve ser diagnosticado antes de commit/tag.

### 5.6. Dashboard

Dashboard atual funcionando com cartões como:

- documentos ativos;
- acessos/movimentações;
- acessos hoje;
- arquivos com anotações;
- duplicidades pendentes;
- últimas movimentações por arquivo.

Decisão implementada:

```text
Últimas movimentações por arquivo
→ considera todas as ações
→ mostra cada PDF apenas uma vez
→ usa a movimentação mais recente daquele arquivo
```

O dashboard deve atualizar pelas ações do sistema, sem depender de botão manual de atualizar.

### 5.7. Lixeira

Terminologia decidida:

```text
Na interface, usar Lixeira.
Evitar Arquivado, Arquivados e Arquivar para usuários leigos.
```

Internamente a pasta técnica pode continuar sendo:

```text
_ARQUIVADOS
```

Comportamento esperado:

```text
Enviar para Lixeira
→ move para DOCUMENTOS_ATIVOS/_ARQUIVADOS
→ não exclui definitivamente
→ registra histórico
```

```text
Restaurar
→ move da pasta _ARQUIVADOS para a lista principal
→ registra histórico
```

### 5.8. Substituição e versões

- É possível substituir o conteúdo de um PDF mantendo o nome.
- O SharePoint mantém versões do arquivo.
- A seção “Versões do SharePoint” foi adicionada ao painel.

### 5.9. Relatório

Decisão mais recente:

```text
Relatório apenas para visualização.
```

O relatório não deve mais ter funções de copiar ou baixar.

Foram removidos/zerados em ponto anterior:

```text
baixarRelatorioArquivo: 0
copiarRelatorioArquivo: 0
new Blob: 0
clipboard.writeText: 0
```

Função atual esperada:

```text
visualizarRelatorioArquivo
```

O relatório aparece dentro do próprio painel lateral.

### 5.10. Central de Duplicidades

Central de Duplicidades básica existe ou já funcionou.

Funcionalidades conhecidas:

- detecta nomes iguais ou parecidos;
- exibe cartão “Duplicidades pendentes” no dashboard;
- ao clicar, abre a central/modal de duplicidades;
- possui ação **São pessoas diferentes**;
- pares marcados como “São pessoas diferentes” deixam de aparecer como pendência;
- no painel do PDF, nomes parecidos também respeitam a marcação de pessoas diferentes.

Tentativa problemática:

- A função **São a mesma pessoa** foi tentada no Passo 115.
- Essa tentativa bagunçou a visualização e os botões não funcionaram.
- O passo foi revertido.
- Não tentar recriar essa função sem diagnóstico e limpeza do trecho de duplicidades.

### 5.11. Upload

Estado desejado atual:

- upload direto de um PDF pelo botão principal;
- sem caixinha/modal de upload;
- não mexer em upload em massa por enquanto.

Histórico:

- houve várias tentativas de modal/upload em massa entre os Passos 98 e 113;
- essas tentativas geraram conflitos e camadas acumuladas;
- depois foi decidido voltar ao envio simples/direto;
- o ponto seguro `ponto-seguro-upload-direto` foi criado;
- após novas tentativas, a orientação final foi: deixar sem caixinha e seguir a linha principal.

---

## 6. Estado seguro e histórico recente

### 6.1. Ponto seguro confirmado antes da última alteração não commitada

```text
ponto-seguro-js-relatorio-separado
```

Commit:

```text
fce9b62 Separar JS do relatorio da central de duplicidades
```

Esse ponto seguro foi criado após confirmar que o JS do relatório ficou em script próprio e que o Git estava limpo.

### 6.2. Ponto seguro anterior importante

```text
ponto-seguro-relatorio-apenas-visualizacao
```

Commit:

```text
17643dd Deixar relatorio apenas para visualizacao
```

Nesse ponto, o relatório deixou de ter botões/funções de copiar e baixar, ficando apenas para visualização.

### 6.3. Situação atual após o último passo executado

O **Passo 134** foi executado e alterou o arquivo:

```text
arquivo-digital/index.html
```

Ele removeu CSS duplicado dentro do bloco da Central de Duplicidades.

Importante:

```text
O Passo 134 ainda NÃO foi commitado.
O status após o Passo 134 mostrou:
 M arquivo-digital/index.html
```

Backup criado pelo Passo 134:

```text
C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda\backups_locais\index.backup_antes_passo134_css_duplicado_central_20260523_182315.html
```

Relatório gerado pelo Passo 134:

```text
C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda\diagnosticos\PASSO_134_LIMPAR_CSS_DUPLICADO_CENTRAL_20260523_182315.txt
```

Não criar ponto seguro ainda porque o usuário relatou que não viu as anotações aparecerem no histórico no último teste.

### 6.4. Estado confirmado no Passo 132 V2

```text
Blocos script: 9
Inicio JS relatorio: 1
Fim JS relatorio: 1
Relatorio dentro de script proprio: True
Relatorio com fechamento proprio: True
```

### 6.5. Resultado do Passo 134

O Passo 134 removeu 48 linhas relacionadas a estilos já existentes no bloco principal:

```text
.itemHistorico.anotacaoEvento
.anotacaoHistorico
#campoAnotacao
.linhaDataArquivo
.itemVersao
```

Depois da limpeza, ficaram:

```text
itemHistorico.anotacaoEvento depois: 1
anotacaoHistorico depois: 1
campoAnotacao depois: 1
linhaDataArquivo depois: 1
itemVersao depois: 7
cardDuplicidadesDashboard84 depois: 8
modalDuplicidades84 depois: 2
```

Essa alteração ainda não está commitada.

---

## 7. Problemas encontrados e lições aprendidas

### 7.1. `index.html` acumulado

O `index.html` ficou grande e acumulou muitos blocos.

Tamanho aproximado observado:

```text
144 KB / 4.827 linhas após Passo 116
133,79 KB / 4.505 linhas após limpezas
```

O tamanho exato atual após Passo 134 não foi confirmado.

Lição:

```text
Não adicionar blocos novos no final do index.html sem diagnosticar onde a função correta já existe.
```

### 7.2. Upload/modal acumulado

Houve tentativas de:

- modal pequeno;
- modal grande;
- modal final;
- input visível;
- scripts de correção;
- scripts de fechamento;
- envio em massa.

Problemas gerados:

- duas caixas aparecendo;
- botão de enviar não funcionando;
- janela não fechando;
- lista de arquivos não carregando;
- comportamento antigo acumulado.

Decisão final:

```text
Não mexer no upload em massa por enquanto.
Manter envio direto simples.
```

### 7.3. Histórico quebrado em tentativa anterior

Houve tentativa de corrigir histórico que quebrou login/página.

Lições:

- login/MSAL é sensível;
- não alterar blocos de inicialização sem diagnóstico;
- qualquer mudança em funções globais deve ser mínima;
- se a página parar em “Verificando login...”, reverter imediatamente.

### 7.4. Central de Duplicidades bagunçada

A tentativa de adicionar “São a mesma pessoa” gerou:

- visual bagunçado;
- botões repetidos;
- botões sem funcionar.

Lições:

- diagnosticar HTML/JS atual antes de mexer na Central;
- preferir limpar/refatorar antes de adicionar ações novas;
- não recriar “São a mesma pessoa” sem plano específico.

---

## 8. Regras que não podem ser esquecidas

### 8.1. Trabalhar um passo por vez

O usuário pediu explicitamente que o trabalho seja feito passo a passo.

### 8.2. Diagnóstico antes de função grande

Antes de qualquer função grande:

```text
fazer diagnóstico específico
```

Exemplos:

- diagnóstico do dashboard;
- diagnóstico da Central de Duplicidades;
- diagnóstico do painel lateral;
- diagnóstico do histórico;
- diagnóstico das anotações;
- diagnóstico do upload.

### 8.3. Evitar áreas sensíveis sem necessidade

Não alterar sem diagnóstico:

```text
upload
modalUpload98
PASSO112
PASSO113
inputNovoDocumento
login Microsoft
MSAL
CONFIG
CONFIG_PASSO_83
Graph API
listas SharePoint
clientId
tenantId
siteId
IDs de listas
```

### 8.4. Código longo em arquivo `.txt`

Quando o ChatGPT entregar scripts longos ao usuário, preferir:

- arquivo `.txt` para baixar;
- comando curto para PowerShell lendo da pasta Downloads.

Padrão preferido atual:

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"; $tmp = Join-Path $env:TEMP "NOME_DO_PASSO.ps1"; Get-Content -Raw "$env:USERPROFILE\Downloads\NOME_DO_ARQUIVO.txt" | Set-Content -Path $tmp -Encoding UTF8; & $tmp
```

Esse padrão funcionou melhor que `Invoke-Expression`.

### 8.5. Relatórios

Sempre gerar relatórios em:

```text
diagnosticos\
```

Relatórios devem informar:

- data/hora;
- commit atual;
- status do Git;
- arquivos analisados;
- o que foi encontrado;
- o que foi alterado;
- riscos;
- próximos passos;
- se a alteração é segura para commit ou ainda precisa de teste.

### 8.6. Backups

Antes de mexer em `arquivo-digital/index.html`, criar backup em:

```text
backups_locais\
```

Nome sugerido:

```text
index.backup_antes_PASSO_XXX_DESCRICAO_YYYYMMDD_HHMMSS.html
```

### 8.7. Git

Antes de alterar:

```powershell
git status
git log -1 --oneline
```

Depois de teste aprovado:

```powershell
git add arquivo-digital/index.html
git commit -m "Mensagem objetiva"
git push
```

Se quebrar:

```powershell
git revert --no-edit HEAD
git push
```

### 8.8. Tags/pontos seguros conhecidos

```text
ponto-seguro-arquivo-digital
ponto-seguro-com-duplicidades
ponto-seguro-com-versoes
ponto-seguro-dashboard-movimentacoes
ponto-seguro-interface-lixeira
ponto-seguro-modal-envio-corrigido
ponto-seguro-upload-direto
ponto-seguro-pos-reversao-duplicidades
ponto-seguro-pos-limpeza-relatorio
ponto-seguro-relatorio-apenas-visualizacao
ponto-seguro-js-relatorio-separado
```

No estado atual, o ponto seguro confirmado mais recente é:

```text
ponto-seguro-js-relatorio-separado
commit fce9b62
```

### 8.9. Não criar ponto seguro se houver dúvida

No momento atual, por causa da dúvida sobre anotações no histórico:

```text
não commitar o Passo 134
não criar tag nova
diagnosticar primeiro
```

---

## 9. Próximo passo recomendado

### Passo 135 — diagnóstico das anotações no histórico

Próximo passo técnico imediato:

```text
Diagnosticar por que as anotações podem não aparecer no histórico do arquivo.
```

O diagnóstico deve verificar:

- funções de salvar anotação;
- funções de registrar histórico;
- funções de carregar histórico;
- filtros por ação `ANOTACAO`;
- renderização da anotação dentro do painel;
- ligação entre ID/nome/caminho do arquivo e registros nas listas;
- se o Passo 134 pode ter afetado a exibição;
- se o problema pode ser cache/local/publicado;
- se há duplicidade de função relacionada a histórico/anotação.

O diagnóstico não deve alterar o site.

Depois do diagnóstico:

- se for só exibição, corrigir apenas renderização;
- se for gravação, corrigir apenas função de salvar/registrar;
- se o Passo 134 não afetou anotações, testar e depois commitar o Passo 134;
- se o Passo 134 causou problema, reverter ou corrigir com alteração mínima.

---

## 10. Pendências

### 10.1. Técnicas imediatas

1. Diagnosticar anotações no histórico.
2. Decidir se mantém ou reverte o Passo 134.
3. Se o Passo 134 estiver ok, fazer commit e tag.
4. Continuar limpeza técnica do `index.html` somente com diagnóstico.
5. Melhorar Central de Duplicidades.
6. Revisar abertura dos dois arquivos no painel.
7. Criar relatório geral do dashboard.
8. Criar filtros avançados.
9. Avaliar permissões por perfil.
10. Melhorar layout profissional.

### 10.2. Funcionais futuras

- melhorar Central de Duplicidades;
- reavaliar função “São a mesma pessoa”;
- criar fluxo seguro para conflitos:
  - mesmo nome;
  - nomes parecidos;
  - documento ativo + documento na Lixeira;
  - possível duplicidade real;
- criar relatório geral do dashboard;
- criar filtros avançados;
- criar controle de perfis/permissões dentro da interface;
- criar tela/seção de Alertas;
- melhorar abertura/visualização dos PDFs, se necessário;
- voltar ao upload em massa somente depois de limpar a área de upload.

### 10.3. Não confirmado

- Se a biblioteca `DOCUMENTOS_ARQUIVADOS` será usada futuramente ou se `_ARQUIVADOS` continuará definitivo.
- Se haverá perfis diferentes de usuário.
- Se haverá OCR/leitura do conteúdo dos PDFs.
- Se haverá mesclagem real de PDFs.
- Se haverá integração com outras páginas do site.
- Se haverá painel administrativo separado.
- Se será necessário conectar ao SharePoint via PowerShell.
- Se as anotações não aparecem por erro real no código ou por cache/teste específico.
- Se o histórico deve mostrar só anotação atual ou também versões anteriores das anotações.

---

## 11. Como iniciar uma sessão no Codex neste projeto

Quando o usuário abrir o PowerShell na pasta do projeto, o Codex deve receber ou inferir esta rotina:

1. Ler `AGENTS.md`.
2. Ler os últimos relatórios em `diagnosticos`.
3. Verificar Git:
   ```powershell
   git status
   git log -1 --oneline
   ```
4. Confirmar se há alteração pendente do Passo 134.
5. Não alterar nada antes de diagnosticar as anotações no histórico.
6. Criar relatório novo em `diagnosticos`.
7. Sugerir próximo passo seguro.

Prompt inicial recomendado para o usuário colar no Codex:

```text
Leia o AGENTS.md e os relatórios mais recentes da pasta diagnosticos. Depois analise o projeto sem alterar nada. Confirme em que ponto estamos, verifique o status do Git, identifique se o Passo 134 ainda está pendente e gere um diagnóstico específico sobre o problema das anotações não aparecerem no histórico. Não altere index.html ainda. Gere relatório em diagnosticos.
```

---

## 12. Configuração local desejada para facilitar o usuário

O usuário quer reduzir esforço manual.

Se possível, criar um atalho na Área de Trabalho chamado:

```text
Arquivo Digital - Codex
```

O atalho deve abrir o PowerShell na pasta:

```text
C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda
```

E executar um script local que:

1. entra na pasta do projeto;
2. mostra último commit;
3. mostra status do Git;
4. avisa se houver alterações pendentes;
5. abre o site publicado no navegador, se solicitado no script;
6. inicia o Codex se o comando `codex` estiver disponível;
7. se o Codex não estiver disponível, mostra aviso simples.

Observação:

- Não existe, até agora, comando confirmado para “logar no SharePoint via PowerShell” neste fluxo.
- A conexão com SharePoint normalmente é testada pelo navegador no site publicado, com login Microsoft.
- Se `git push` já vinha funcionando, normalmente não precisa reconectar ao GitHub.
- Se o GitHub pedir autenticação, resolver no momento do erro.
- O primeiro login do Codex pode abrir autenticação no navegador ou solicitar login conforme instalação local.

---

## 13. Critérios de “pronto” para cada etapa

Uma etapa só deve ser considerada concluída quando:

- o site abre sem travar em “Verificando login...”;
- login Microsoft continua funcionando;
- listagem de documentos continua funcionando;
- função alterada foi testada;
- não houve perda de acentos;
- `git status` foi conferido;
- relatório foi gerado;
- usuário aprovou;
- commit foi criado;
- se for marco importante, tag/ponto seguro foi criado.

---

## 14. Resumo do estado atual

Estado final consolidado:

```text
Último ponto seguro confirmado:
ponto-seguro-js-relatorio-separado
commit fce9b62

Última alteração executada, mas ainda não commitada:
Passo 134 - limpar CSS duplicado dentro da Central

Problema observado depois:
Usuário não viu as anotações aparecerem no histórico.

Próximo passo recomendado:
Passo 135 - diagnóstico de anotações no histórico

Regra atual:
Não commitar o Passo 134 nem criar novo ponto seguro até diagnosticar as anotações.
```

<!-- ESTADO_ATUAL_PASSO_159_INICIO -->
# Estado atual consolidado após limpeza geral

Atualizado no Passo 159.

## Ponto estável atual

O projeto está em um estado mais limpo e estável após uma sequência de diagnósticos, remoções de blocos antigos e testes manuais no site publicado.

Pontos seguros recentes criados:

- `ponto-seguro-agents-css-central-ok`
- `ponto-seguro-central-duplicidades-sem-blocos-antigos`
- `ponto-seguro-upload-direto-sem-modal-antigo`
- `ponto-seguro-upload-direto-limpo`
- `ponto-seguro-textos-lixeira-ok`
- `ponto-seguro-painel-sem-relatorio`
- `ponto-seguro-historico-lixeira-ok`

## Decisões recentes importantes

### Central de Duplicidades

Foram removidos blocos antigos/remendos relacionados aos Passos 83 e 84.

Não devem ser recriados sem necessidade:

- `CONFIG_PASSO_83`
- `modalDuplicidades84`
- `cardDuplicidadesDashboard84`
- `contarDuplicidades84`
- `controlarVisibilidadeCentralDuplicidades83`
- `filtrarNomesParecidosDoPainel83`

A Central principal que deve ser preservada é a baseada em:

- `atualizarCentralDuplicidades`
- `marcarPessoasDiferentesCentral`
- lista `ALERTAS_SISTEMA`
- botão `São pessoas diferentes`

A função "São a mesma pessoa" não deve ser reintroduzida sem pedido explícito.

### Upload de PDF

O fluxo aprovado é:

`Enviar novo PDF` → abrir diretamente o seletor de arquivo.

Foram removidos os modais antigos de upload dos Passos 98, 98B, 99 e 112.

O fluxo atual limpo usa o bloco:

- `UPLOAD_DIRETO_LIMPO`

Não reintroduzir:

- `modalUpload98`
- `modalUpload105`
- `modalUpload106`
- `modalUpload108`
- `modalUpload111`
- `PASSO98`
- `PASSO99`
- `PASSO112`
- `PASSO113`

O usuário testou e aprovou o upload direto.

### Painel lateral

O clique no nome do arquivo deve abrir o painel lateral, não abrir o PDF diretamente.

O painel deve manter:

- dados do arquivo;
- anotações;
- nomes parecidos;
- versões do SharePoint;
- histórico do arquivo;
- botões de ação, incluindo abrir/visualizar PDF.

O botão/área de relatório foi removido do painel. Não reintroduzir:

- `btnVisualizarRelatorio`
- `visualizacaoRelatorioArquivo`
- `relatorioArquivoBox`

O usuário decidiu que quer deixar o painel com histórico e versões do SharePoint, sem relatório.

### Lixeira

Na interface, usar o termo "Lixeira".

A lógica técnica pode continuar usando:

- `ARQUIVADO`
- `_ARQUIVADOS`
- `tagArquivado`
- variáveis internas como `estaArquivado`

Não trocar esses nomes técnicos automaticamente.

Regra de interface:

- onde for texto visível para usuário, preferir "Lixeira";
- no histórico, `ARQUIVOU` deve aparecer como `FOI PARA LIXEIRA`.

Foi criada/aplicada a função:

- `formatarAcaoHistorico`

e o histórico deve exibir a ação usando:

- `formatarAcaoHistorico(item.acao)`

### Histórico

O histórico deve continuar registrando ações importantes.

Decisão recente:

- registros antigos com ação técnica `ARQUIVOU` devem aparecer para o usuário como `FOI PARA LIXEIRA`;
- não é necessário alterar a lista do SharePoint para isso;
- a conversão deve ocorrer apenas na exibição do site.

### Anotações

Anotações foram testadas e estão funcionando.

Devem continuar:

- salvando no SharePoint;
- aparecendo no campo de anotação;
- aparecendo no histórico;
- mantendo quebras de linha;
- sem recriar relatório.

Funções importantes a preservar:

- `carregarAnotacaoDocumento`
- `salvarAnotacaoAgora`
- `agendarSalvarAnotacao`
- `salvarAnotacaoManual`
- `registrarHistorico`
- `carregarHistoricoDocumento`

### Renomear com nome duplicado

O usuário quer permitir casos de pessoas com mesmo nome.

Observação técnica importante:

SharePoint não aceita dois arquivos com o mesmo nome exato na mesma pasta.

Solução rápida discutida:

- quando renomear para nome já existente, usar numeração automática:
  - `NOME.pdf`
  - `NOME (2).pdf`
  - `NOME (3).pdf`

Solução profissional futura:

- separar nome técnico do arquivo e nome exibido;
- usar campo como `NOME_EXIBICAO`;
- manter arquivo físico com nome único;
- mostrar nome limpo ao usuário.

Estado da implementação de renomear duplicado:

- houve tentativa de permitir nomes iguais removendo bloqueio do site;
- o SharePoint ainda exige nome físico único;
- deve-se garantir que a lógica final use nome único automático se essa função for concluída.

### Restaurar

Para restaurar arquivo da Lixeira, o bloqueio de nome já existente pode continuar existindo por segurança, a menos que seja decidido o mesmo comportamento de numeração automática.

Mensagem relacionada a restaurar não deve ser removida sem análise:

- "Renomeie o ativo ou o arquivo na Lixeira antes de restaurar."

### Substituir

Substituir arquivo pode avisar quando já existe arquivo ativo com mesmo nome.

Esse aviso é aceitável e não deve ser removido sem necessidade.

## Estado de limpeza do index.html

Diagnóstico geral recente indicou:

- `modalUpload` zerado;
- `modalDuplicidades84` zerado;
- `CONFIG_PASSO_83` zerado;
- `btnVisualizarRelatorio` zerado;
- marcadores antigos `PASSO98`, `PASSO99`, `PASSO112`, `PASSO113` zerados;
- Central principal preservada;
- Upload direto limpo preservado;
- Histórico e versões SharePoint preservados.

## Regras para próximas alterações

Sempre seguir esta ordem:

1. Diagnóstico somente-leitura.
2. Relatório em `diagnosticos`.
3. Backup em `backups_locais`.
4. Alteração pequena e específica.
5. Teste manual no site publicado.
6. Commit somente se o usuário confirmar funcionamento.
7. Tag de ponto seguro quando for uma etapa importante.

Não fazer grandes refatorações sem necessidade.

Não recriar blocos antigos removidos.

Não alterar `ARQUIVADO` e `_ARQUIVADOS` técnicos só por estética.

Não abrir PDF diretamente ao clicar no nome do arquivo.

Não remover histórico, anotações ou versões do SharePoint do painel.

## Preferência do usuário para condução

O usuário prefere passos curtos, objetivos e com pouca leitura.

Quando criar scripts longos, entregar em `.txt` para baixar e fornecer comando curto de PowerShell para executar.

Após diagnóstico que confirme o próximo passo, já preparar o próximo arquivo automaticamente, sem esperar muita explicação.
<!-- ESTADO_ATUAL_PASSO_159_FIM -->

