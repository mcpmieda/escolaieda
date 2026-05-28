# AGENTS.md — Arquivo Digital Escolar

> **Versão operacional atualizada em 28/05/2026.**  
> Este arquivo deve ser lido antes de qualquer novo diagnóstico, alteração por Codex, PowerShell ou ChatGPT no projeto **Arquivo Digital Escolar**.  
> Ele substitui versões antigas e consolida o estado atual, as decisões técnicas, os pontos seguros recentes e o **Plano de Erradicação de Dívida Técnica**.

---

## 0. Como usar este AGENTS

Este documento serve para permitir que qualquer novo chat, Codex ou automação continue o projeto sem perder contexto.

Regra principal:

```text
Não reescrever o sistema de uma vez.
Não mexer no que funciona sem diagnóstico.
Corrigir por fases pequenas, testáveis e reversíveis.
```

Fluxo obrigatório:

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

Se houver conflito entre este arquivo e um AGENTS antigo, este arquivo prevalece.

---

## 1. Identidade do projeto

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

## 2. Preferências do usuário

O usuário prefere:

- passos curtos;
- comandos PowerShell prontos;
- arquivos `.txt` para scripts longos;
- diagnóstico antes de mudanças arriscadas;
- alteração pequena por vez;
- backup antes de mexer no `index.html`;
- relatório em `diagnosticos`;
- teste no site publicado antes de commit/tag;
- não colar códigos longos no chat;
- preservar o que já funciona;
- quando pedir código/alteração longa, receber arquivo para baixar.

Fluxo preferido:

```text
ChatGPT cria script direto em .txt
Usuário baixa
Usuário executa no PowerShell
Usuário testa
Usuário publica
Usuário confirma
ChatGPT orienta tag/ponto seguro
```

Codex pode ser usado para diagnósticos grandes, mas alterações pequenas devem continuar por script direto.

---

## 3. Estrutura conhecida do repositório

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
SALVAMENTO_AUTOMATICO/
```

Regras:

```text
backups_locais/ deve ficar fora do Git.
diagnosticos/ deve ficar fora do Git.
SALVAMENTO_AUTOMATICO/ é registro local temporário e deve ficar fora do Git.
```

`.gitignore` deve conter:

```text
backups_locais/
diagnosticos/
SALVAMENTO_AUTOMATICO/
```

---

## 4. Microsoft 365, SharePoint e Graph

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

### 4.1. IDs conhecidos

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

Regra:

```text
Nunca incluir tokens, senhas ou credenciais em commits, relatórios, código ou documentação.
```

---

## 5. Decisões técnicas permanentes

### 5.1. Lixeira

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

### 5.2. Gavetas

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

- não criar coluna duplicada de gaveta;
- usar sempre `InternalName: GAVETA`;
- cadastro/edição/exclusão de gavetas deve atualizar a coluna Choice no SharePoint;
- excluir gaveta não apaga PDF;
- excluir gaveta reclassifica documentos para gaveta vazia, exibida como `Gaveta nao informada`;
- `Gaveta 1` até `Gaveta 34` não são mais necessariamente intocáveis quando carregadas do SharePoint; todas as gavetas reais carregadas podem ser administradas com segurança, se a regra atual do sistema permitir.

### 5.3. Upload comum nunca substitui

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

### 5.4. Abertura de PDF

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

### 5.5. Anotações

Regra aprovada:

```text
Anotações não devem salvar automaticamente texto incompleto.
Salvar deve ocorrer pelo botão existente.
```

`agendarSalvarAnotacao` deve indicar alteração não salva, mas não gravar texto incompleto sozinho.

### 5.6. Histórico

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

### 5.7. Central de Duplicidades

A Central:

- ignora documentos da Lixeira;
- aparece no dashboard;
- abre em painel lateral esquerdo;
- o painel de documento abre à direita;
- respeita pares marcados como `São pessoas diferentes`;
- permite desfazer individualmente e desfazer todos;
- deve preservar os casos fortes e evitar falsos positivos de sobrenomes comuns.

Regra consolidada:

```text
- nomes exatamente iguais aparecem;
- nomes compactos iguais ou claramente contidos aparecem;
- 4 pontos ou mais aparecem;
- 3 pontos aparecem somente se primeiro/segundo nomes atenderem critério forte;
- 2 pontos não aparecem;
- se primeiro nome for parecido, mas não igual, o segundo nome precisa ser exatamente igual;
- se primeiro nome for igual, o segundo nome pode ser igual/parecido;
- pares marcados como São pessoas diferentes não aparecem mais.
```

Possível melhoria futura:

```text
Mostrar possíveis semelhanças leves
```

Essa opção deve ser escondida por padrão e não contar como pendência principal.

### 5.8. Mesclar PDFs

Função `Mesclar` aprovada:

- usuário abre PDF no painel;
- clica em `Mesclar`;
- escolhe um PDF local;
- motivo é obrigatório;
- sistema baixa PDF atual do SharePoint;
- adiciona páginas do PDF local ao final;
- substitui o conteúdo do mesmo arquivo;
- mantém nome e caminho;
- registra `MESCLOU`;
- versões do SharePoint preservam atualização quando aplicável;
- bloqueia documento na Lixeira.

Decisões:

```text
Mesclar não escolhe outro documento do Arquivo Digital.
Mesclar não cria arquivo novo separado.
Mesclar não muda o nome do arquivo atual.
Mesclar não apaga documentos automaticamente.
Mesclar não mexe na Central de Upload.
```

---

## 6. Áreas sensíveis — não alterar sem diagnóstico

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

## 7. Estado atual aprovado em linguagem simples

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

Antes de continuar, confirmar sempre:

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"
git status --short
git log -1 --oneline --decorate
git tag --points-at HEAD
```

---

## 8. Pontos seguros recentes

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

Se alguma tag não existir localmente, confirmar com:

```powershell
git tag --list "NOME_DA_TAG"
```

Não presumir que uma tag foi criada apenas porque foi recomendada. Confirmar no Git.

---

## 9. Regras atuais de CSS e hover

As correções recentes mostraram que o maior risco visual era o acúmulo de CSS e hovers antigos.

Regras obrigatórias:

1. Não criar botão novo dependendo de `button:hover` global.
2. Todo botão novo deve ter classe própria.
3. Todo hover novo deve ser escopado pelo container da área.
4. Se um botão tiver visual próprio, ele deve ser excluído da regra global de hover/active.
5. Não remover CSS antigo no escuro.
6. Sequência segura:
   - aplicar CSS novo escopado;
   - testar;
   - criar tag;
   - remover seletor antigo exato;
   - testar de novo.
7. Ao procurar CSS antigo, não confundir seletor real com ocorrência dentro de `:not(...)`.
8. Evitar `!important`, mas aceitar temporariamente em blocos finais de estabilização.
9. Depois consolidar CSS antigo conscientemente.

Padrões recentes aprovados:

```text
mensagens sobrepostas sem mover layout;
carregamentos com montarCarregamentoVisual;
cabeçalho do painel com #painelTitulo legível;
botões de versões do SharePoint com hover próprio;
botões de ações do painel com hover próprio;
```

---

## 10. Regras atuais de segurança de HTML

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

Próxima fase deve evoluir para:

```text
criar elementos com document.createElement;
preencher texto com textContent;
usar addEventListener em vez de onclick inline.
```

---

## 11. Padrão operacional `open AQUI`

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

1. Dar preferência para `AQUI.txt` se os dois existirem.
2. Se houver `AQUI.docx`, extrair texto e imagens relevantes.
3. Antes de alterar:
   - ler `AGENTS.md`;
   - rodar `git status --short`;
   - rodar `git log -1 --oneline`;
   - criar backup se mexer no `index.html`;
   - gerar relatório em `diagnosticos`.
4. Ao terminar, apagar somente o arquivo AQUI usado.
5. Se a tarefa falhar antes de ler o conteúdo, não apagar.
6. Se a tarefa foi lida e executada, apagar ao final mesmo se foi só diagnóstico.

---

## 12. Modelo de comandos

### 12.1. Verificar estado

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"
git status --short
git log -1 --oneline --decorate
git tag --points-at HEAD
```

### 12.2. Executar script enviado pelo ChatGPT

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"; $tmp = Join-Path $env:TEMP "NOME_DO_PASSO.ps1"; Get-Content -Raw "$env:USERPROFILE\Downloads\NOME_DO_ARQUIVO.txt" | Set-Content -Path $tmp -Encoding UTF8; & $tmp
```

### 12.3. Publicar alteração aprovada

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

### 12.4. Criar tag

```powershell
git tag nome-da-tag
git push origin nome-da-tag
```

### 12.5. Reverter último commit

```powershell
git revert --no-edit HEAD
git push
```

---

# 13. Plano de Erradicação de Dívida Técnica — roadmap de engenharia de software

Este plano foi criado após comparação entre:

1. diagnósticos internos do projeto;
2. apontamentos de outras IAs;
3. estado real atual do `arquivo-digital/index.html`;
4. correções já feitas e testadas.

Regra:

```text
Diagnóstico externo não é ordem de execução.
Confirmar tudo no index atual antes de mexer.
```

Algumas opiniões externas foram úteis, mas outras estavam desatualizadas ou eram agressivas demais.

---

## 13.1. Fase 0 — Marco seguro pré-dívida técnica

Objetivo:

```text
Garantir ponto de restauração antes de atacar dívida técnica.
```

Ações:

1. Confirmar Git limpo.
2. Confirmar último commit.
3. Confirmar tags recentes.
4. Criar tag se ainda não existir:

```text
ponto-seguro-hover-acoes-painel-css-antigo-removido-ok
```

5. Manter AGENTS atualizado.

Critério de saída:

```text
Git limpo, tag criada e AGENTS atualizado.
```

---

## 13.2. Fase 1 — correções lógicas pequenas

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

### Fase 1.2 — ordenação da Lixeira

Problema suspeito:

```text
ordenarLixeiraMaisRecentes pode retornar 0 de forma genérica.
```

Correção:

```text
ordenação consistente por data e nome.
```

### Fase 1.3 — filtros avançados

Suspeitas:

```text
atualizarBotoesFiltros() chama limparFiltrosAvancadosOcultos()
aplicarFiltroRapido(nomeFiltro) pode ignorar nomeFiltro
```

Decidir:

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

---

## 13.3. Fase 2 — XSS, innerHTML e criação segura de DOM

Objetivo:

```text
Reduzir risco de DOM XSS.
```

Ações:

1. Inventariar todos os `innerHTML`.
2. Classificar:
   - texto fixo seguro;
   - HTML com `escaparHtml`;
   - HTML com dados do SharePoint;
   - HTML com dados de usuário;
   - HTML com `onclick` interpolado;
   - risco alto.
3. Corrigir primeiro:
   - nomes de arquivos;
   - gavetas;
   - usuários;
   - histórico;
   - observações;
   - anotações;
   - nomes parecidos;
   - relatórios;
   - Central de Duplicidades.
4. Criar helper seguro:

```javascript
function criarElemento(tag, texto = "", classes = []) {
  const el = document.createElement(tag);
  if (texto) el.textContent = texto;
  if (classes.length) el.classList.add(...classes);
  return el;
}
```

5. Evoluir de `innerHTML` para:
   - `document.createElement`;
   - `textContent`;
   - `append`;
   - `addEventListener`.

Critério de saída:

```text
innerHTML de risco alto corrigido ou documentado.
```

---

## 13.4. Fase 3 — remover onclick inline gradualmente

Objetivo:

```text
Preparar o sistema para CSP futura e reduzir risco de injeção.
```

Ações:

1. Inventariar todos os `onclick`.
2. Priorizar:
   - ações críticas;
   - botões criados por string;
   - Central de Duplicidades;
   - painel lateral;
   - gavetas;
   - upload.
3. Trocar por `addEventListener`.
4. Não trocar todos de uma vez.

Critério de saída:

```text
ações críticas sem onclick inline.
```

---

## 13.5. Fase 4 — modais com `<dialog>`

Objetivo:

```text
Substituir confirm/prompt/alert nativos por modais próprios e acessíveis.
```

Ações:

1. Criar componente modal padrão com `<dialog>`.
2. Trocar primeiro:
   - excluir gaveta;
   - editar gaveta;
   - mover para Lixeira;
   - restaurar;
   - substituir;
   - mesclar;
   - desfazer todos;
   - fechar upload com pendência.
3. Garantir:
   - Esc fecha quando permitido;
   - foco volta para quem abriu;
   - texto claro para usuário leigo;
   - acessibilidade mínima.

Critério:

```text
ações críticas sem confirm/prompt nativo.
```

---

## 13.6. Fase 5 — Graph API, retry e confiabilidade

Objetivo:

```text
Padronizar chamadas Graph.
```

Ações:

1. Inventariar todos os `fetch`.
2. Classificar:
   - GET;
   - POST;
   - PATCH;
   - PUT;
   - ações destrutivas.
3. GET deve usar wrapper com retry/backoff.
4. Em erro 429, respeitar `Retry-After`.
5. Sem `Retry-After`, usar backoff exponencial.
6. Escritas não devem repetir cegamente:
   - `POST` pode duplicar histórico;
   - `PATCH` pode sobrescrever estado;
   - `PUT` pode afetar upload/substituição.
7. Criar wrapper separado para escrita segura.

Critério:

```text
leituras críticas com retry padronizado e escritas mapeadas.
```

---

## 13.7. Fase 6 — upload profissional com upload session

Objetivo:

```text
Melhorar confiabilidade para PDFs grandes ou internet instável.
```

Decisão corrigida após comparação com outras IAs:

```text
Não usar 4 MB como regra absoluta.
PUT simples do Microsoft Graph pode ser mantido para arquivos pequenos/médios.
Upload Session deve ser usada primeiro para arquivos grandes ou conexão instável.
```

Regra prática recomendada:

```text
até 25 MB ou 50 MB → manter PUT simples;
acima disso → usar Upload Session.
```

Ações:

1. Criar fluxo `createUploadSession`.
2. Enviar blocos com `file.slice`.
3. Usar `Content-Range`.
4. Mostrar progresso real por bloco.
5. Permitir retry do bloco com falha.
6. Usar `AbortController`.
7. Botão cancelar envio.
8. Preservar regra:

```text
Upload comum nunca substitui arquivo existente.
```

Critério:

```text
arquivos pequenos continuam simples; arquivos grandes usam upload em blocos.
```

---

## 13.8. Fase 7 — lazy-load da pdf-lib e proteção de mesclagem

Objetivo:

```text
Reduzir peso inicial e proteger memória.
```

Ações:

1. Remover carregamento inicial desnecessário da `pdf-lib`, se existir.
2. Carregar `pdf-lib` apenas ao clicar em `Mesclar`.
3. Mostrar mensagem:
   - “Carregando motor de PDF...”
4. Criar limite por tamanho.
5. Avisar antes de mesclar PDF grande.
6. Futuro:
   - Web Worker;
   - backend/API para PDFs muito grandes, se necessário.

Critério:

```text
Mesclar continua funcionando, mas pdf-lib sai do caminho crítico inicial.
```

---

## 13.9. Fase 8 — anotações com eTag / If-Match

Objetivo:

```text
Evitar sobrescrita silenciosa quando duas pessoas editam a mesma anotação.
```

Ações:

1. Ao carregar anotação, guardar:
   - `@odata.etag`;
   - ou data de modificação, se eTag não estiver disponível.
2. Ao salvar, enviar `If-Match`.
3. Se SharePoint retornar `412 Precondition Failed`, mostrar conflito:
   - texto atual no SharePoint;
   - texto que o usuário tentou salvar;
   - opções: copiar, substituir ou cancelar.
4. Não voltar a salvar automaticamente sem botão.

Critério:

```text
usuário não sobrescreve anotação de outra pessoa sem perceber.
```

---

## 13.10. Fase 9 — Central de Duplicidades e performance

Objetivo:

```text
Melhorar precisão e evitar travamento com volume maior.
```

Ações:

1. Corrigir chave dupla ordenada.
2. Melhorar indexação:
   - palavras ordenadas;
   - sobrenome/nome;
   - chaves compostas;
   - limitar grupos grandes.
3. Registrar quando análise foi simplificada por volume.
4. Testar com:
   - 500 documentos;
   - 1.000 documentos;
   - 5.000 documentos simulados.
5. Futuro:
   - Web Worker para análise pesada;
   - progresso real da análise.

Critério:

```text
Central continua útil e não trava com volume maior.
```

---

## 13.11. Fase 10 — permissões Microsoft e menor privilégio

Objetivo:

```text
Mapear e reduzir risco de permissões amplas.
```

Ações:

1. Mapear permissões por função:
   - leitura;
   - upload;
   - substituir;
   - renomear;
   - mover para Lixeira;
   - restaurar;
   - alterar gaveta;
   - versões;
   - histórico;
   - anotações.
2. Revisar `Sites.ReadWrite.All`.
3. Estudar:
   - `Sites.Selected`;
   - permissões selecionadas/mais granulares;
   - controle via grupo da secretaria.
4. Não alterar permissões no escuro.

Critério:

```text
mapa de permissões documentado e plano de redução validado.
```

---

## 13.12. Fase 11 — CSS, hovers e design system

Objetivo:

```text
Eliminar guerra de CSS e excesso de !important.
```

Ações:

1. Diagnóstico geral de CSS restante.
2. Mapear:
   - hovers antigos;
   - seletores duplicados;
   - CSS morto;
   - blocos de fase antigos;
   - `!important`.
3. Limpar por componente:
   - botões globais;
   - cards;
   - gavetas;
   - painel lateral;
   - Central de Upload;
   - Central de Duplicidades;
   - dashboard;
   - Histórico Geral;
   - Configurações.
4. Criar tokens:
   - cores;
   - sombras;
   - bordas;
   - espaçamentos;
   - fontes;
   - estados de erro/alerta/sucesso.

Critério:

```text
menos CSS duplicado, menos !important e hovers previsíveis.
```

---

## 13.13. Fase 12 — código morto e IDs órfãos

Objetivo:

```text
Remover código sem uso confirmado.
```

Ações:

1. Diagnóstico de funções declaradas x chamadas.
2. Diagnóstico de IDs do DOM x `getElementById`.
3. Classificar:
   - ativo;
   - usado por onclick inline;
   - usado dinamicamente;
   - morto provável;
   - recurso incompleto.
4. Não apagar sem prova.

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

## 13.14. Fase 13 — arquitetura: separar sem quebrar

Objetivo:

```text
Começar modularização sem reescrever o sistema.
```

Ordem:

1. Separar CSS primeiro:

```text
arquivo-digital/styles.css
```

2. Depois separar JS por área:

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

3. Só depois estudar build:

```text
Vite
ESLint
Prettier
bundle local
dependências fixas
```

Critério:

```text
CSS externo funcionando e index menor sem mudar comportamento.
```

---

## 13.15. Fase 14 — testes automáticos

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

## 13.16. Fase 15 — observabilidade e logs

Objetivo:

```text
Trocar console solto por diagnóstico controlado.
```

Ações:

1. Criar logger:

```text
logger.info
logger.warn
logger.error
```

2. Modo produção com menos detalhes.
3. Modo diagnóstico com mais detalhes.
4. Não logar:
   - token;
   - dados sensíveis;
   - caminhos completos desnecessários;
   - conteúdo de anotações;
   - informações pessoais desnecessárias.
5. Futuro:
   - área de diagnóstico para administrador;
   - última falha Graph;
   - última falha upload;
   - tempo de carregamento;
   - quantidade de documentos.

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

## 13.17. Fase 16 — textos, consistência, CSP/SRI e polimento final

Objetivo:

```text
Padronizar linguagem e preparar segurança de navegador.
```

Ações:

1. Padronizar português visível.
2. Usar acentos em textos visíveis quando não houver problema de encoding.
3. Centralizar textos em objeto:

```text
MENSAGENS
I18N
```

4. Preparar CSP depois de reduzir `onclick` inline.
5. Avaliar SRI/hospedagem local de dependências.
6. Revisão final mobile/desktop.

Critério:

```text
interface consistente e base pronta para CSP/SRI.
```

---

# 14. Ordem recomendada de execução agora

Próximas ações recomendadas:

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

## 15. Regra sobre opiniões externas de IAs

Opiniões externas são úteis, mas devem ser tratadas assim:

```text
1. Ler o apontamento.
2. Confirmar no index atual.
3. Separar bug real de falso positivo.
4. Corrigir apenas o que for confirmado.
5. Não permitir que diagnóstico externo provoque refatoração gigante.
```

Exemplos:

- A ideia de `createElement`/`textContent` é boa e deve entrar na Fase 2.
- A ideia de `<dialog>` é boa e deve entrar na Fase 4.
- A ideia de `eTag`/`If-Match` é boa e deve entrar na Fase 8.
- A ideia de Web Worker é boa, mas futura.
- A sugestão de `git add .` não deve virar padrão do projeto.
- A regra fixa de upload session acima de 4 MB não deve ser usada como verdade absoluta; o projeto usará threshold prático de 25 MB ou 50 MB após diagnóstico.
- A sugestão de logs automáticos no SharePoint deve ser estudada com cautela.

Regra final:

```text
Diagnóstico externo não é ordem de execução.
O AGENTS.md e o estado real do index atual prevalecem.
```

---

## 16. Histórico consolidado de marcos

Esta seção substitui o histórico muito longo de versões anteriores do AGENTS.

### 16.1. Base inicial

- login Microsoft/MSAL;
- Graph/SharePoint;
- listagem de documentos;
- busca;
- abertura de PDF;
- painel lateral;
- histórico;
- anotações;
- Lixeira;
- restaurar;
- substituir;
- versões SharePoint;
- Central de Duplicidades;
- Dashboard.

### 16.2. Upload seguro

- Central de Upload criada;
- upload exige gaveta e motivo;
- progresso e fechamento seguro;
- nome igual não substitui;
- sistema gera `NOME (2).pdf`;
- histórico registra `ENVIOU`.

### 16.3. Gavetas

- coluna `GAVETA` criada/reutilizada;
- SharePoint virou fonte oficial;
- edição/exclusão segura;
- gavetas visuais;
- card Gavetas removido do dashboard porque a função ficou na guia Gavetas.

### 16.4. Histórico Geral

- layout compacto;
- botão `Ver mais` corrigido para não fechar painel;
- filtro de datas planejado;
- busca textual e ordenação foram trabalhadas em fases anteriores.

### 16.5. Correções profundas do index

Correções registradas:

- `formatarData` e `limparObservacaoHistorico` organizadas;
- nomes escapados nos cards;
- histórico usando cache;
- abertura de PDF imediata;
- salvamento de anotação sem recarregamento duplo;
- gavetas e abas responsivas.

### 16.6. UX recente

- estados vazios bonitos;
- mensagens modernas;
- mensagens sobrepostas sem mover layout;
- CSS antigo das mensagens removido;
- carregamentos visuais;
- cabeçalho do painel corrigido;
- hovers dos botões de versões corrigidos;
- hover antigo das versões removido;
- botões de ações do painel corrigidos;
- CSS antigo dos botões de ações removido.

---

## 17. O que foi removido/condensado nesta versão do AGENTS

Esta versão foi criada para substituir manualmente o AGENTS anterior. Para deixar o arquivo mais útil como guia operacional, foram removidos ou condensados:

1. **Histórico repetido de pontos antigos**
   - O AGENTS anterior citava muitas vezes “ponto seguro mais atual” de fases que já deixaram de ser atuais.
   - Mantive os pontos realmente relevantes no resumo e removi repetição.

2. **Listas enormes de commits antigos**
   - Commits antigos foram condensados por marco funcional.
   - A fonte real para commits deve ser `git log --oneline --decorate`.

3. **Trechos narrativos muito longos**
   - Conversas antigas foram transformadas em decisões técnicas objetivas.
   - Não apaguei a ideia; apenas reduzi a narrativa.

4. **Seções duplicadas**
   - Havia duplicação de numeração, especialmente seções 37 e atualizações sucessivas.
   - Consolidei em uma estrutura única.

5. **Registros detalhados de `SALVAMENTO_AUTOMATICO`**
   - A lista de dezenas de arquivos TXT foi condensada.
   - Regra preservada: os TXT são registros locais temporários, não fonte definitiva.

6. **Recomendações já concluídas**
   - Frases como “atualizar AGENTS” ou “copiar este arquivo depois” foram removidas quando já não ajudam na continuidade.

7. **Detalhes obsoletos de estado atual**
   - Estados antigos como “ponto seguro upload nome igual é o mais atual” foram substituídos por orientação para confirmar o estado real com Git.

8. **Blocos de exemplos excessivamente longos**
   - Exemplos importantes foram mantidos; excesso repetitivo foi resumido.

Nada essencial para continuar o projeto foi removido de forma intencional. O objetivo foi transformar o AGENTS em um documento prático, atual e menos contraditório.

---

## 18. Primeira resposta recomendada ao retomar

Se o usuário disser “vamos continuar”, responder com:

```text
Vamos confirmar o estado primeiro.
```

E pedir/rodar:

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"
git status --short
git log -1 --oneline --decorate
git tag --points-at HEAD
```

Depois seguir para:

```text
FASE 1.1 — corrigir chave dupla da Central de Duplicidades
```

---

Fim do arquivo.
