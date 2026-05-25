# AGENTS_ATUALIZADO_COMPLETO.md — Arquivo Digital Escolar

> **ESTE É O AGENTS MAIS ATUAL DO PROJETO ARQUIVO DIGITAL ESCOLAR.**  
> Este arquivo deve ser lido antes de qualquer novo diagnóstico, alteração por Codex, PowerShell ou ChatGPT.  
> Existe outro `AGENTS.md` na pasta local do projeto, mas este documento foi criado depois dos pontos seguros mais recentes e deve ser considerado a versão técnica mais completa e atualizada.

---

## 0. Aviso importante sobre este documento

Este documento foi criado para permitir que um novo chat/Codex continue o projeto como se estivesse acompanhando a conversa anterior.

Ele consolida:

- objetivo do sistema;
- decisões tomadas;
- estrutura conhecida;
- regras técnicas;
- passos executados;
- pontos seguros criados;
- problemas encontrados;
- soluções aprovadas;
- comportamento esperado;
- próximos passos recomendados.

**Não foi possível incluir literalmente todo o texto integral de todas as mensagens da conversa**, porque a conversa completa é muito longa e parte dela foi resumida pelo ambiente. Em vez disso, este AGENTS traz uma reconstrução técnica extremamente detalhada e confiável com base no histórico disponível, nos diagnósticos, nos testes informados pelo usuário e nos pontos seguros aprovados.

Sempre que houver conflito entre este arquivo e um AGENTS antigo, este arquivo deve prevalecer.

---

## 1. Identidade do projeto

O projeto se chama:

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

Pasta local conhecida no computador do usuário:

```text
C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda
```

Arquivo principal do sistema:

```text
arquivo-digital\index.html
```

O usuário está construindo um sistema web para organizar documentos escolares em PDF da Escola Iêda MCPM, com integração ao Microsoft 365, SharePoint e Microsoft Graph.

---

## 2. Objetivo principal do sistema

O Arquivo Digital Escolar deve permitir:

- login com conta Microsoft;
- listagem de PDFs escolares;
- busca por nome;
- abertura de painel lateral ao clicar no arquivo;
- abertura do PDF somente por botão próprio dentro do painel;
- histórico de ações;
- anotações por documento;
- envio de novo PDF;
- renomear documento;
- substituir conteúdo do PDF mantendo versões do SharePoint;
- enviar para Lixeira;
- restaurar da Lixeira;
- visualizar versões anteriores do SharePoint;
- Central de Duplicidades;
- Dashboard com indicadores;
- prevenção contra substituições acidentais;
- operação simples para usuário leigo.

O foco atual não é criar grandes funcionalidades novas, mas estabilizar o sistema para entrega, corrigindo riscos reais e fazendo pequenos polimentos seguros.

---

## 3. Preferências de condução do usuário

O usuário prefere:

- passos curtos e objetivos;
- pouca leitura por vez;
- comandos prontos para PowerShell;
- arquivos `.txt` para scripts longos;
- alterações pequenas e específicas;
- diagnóstico antes de mudanças arriscadas;
- sempre testar no site publicado antes de commit/tag;
- sempre criar backup antes de mexer no `index.html`;
- sempre gerar relatório em `diagnosticos`;
- quando possível, acelerar o processo com scripts PowerShell;
- evitar colar códigos longos diretamente no chat;
- receber o arquivo `.txt` para baixar e um comando curto para executar.

O usuário cansou do fluxo via Codex para alterações simples, pois ficou confuso e mais lento. A preferência atual é:

```text
ChatGPT cria script direto em .txt
Usuário baixa
Usuário executa no PowerShell
Usuário testa
Usuário publica
Usuário confirma
ChatGPT orienta commit/tag/ponto seguro
```

O Codex pode ser usado para diagnósticos grandes, mas alterações pequenas devem continuar pelo método antigo com scripts diretos.

---

## 4. Estrutura conhecida do repositório

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
backups_locais\
diagnosticos\
```

Essas pastas devem ficar fora do Git.

`.gitignore` já deve conter:

```text
backups_locais/
diagnosticos/
```

---

## 5. SharePoint, Graph e Microsoft 365

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

### 5.1. Decisão técnica sobre Lixeira

Apesar da existência da biblioteca `DOCUMENTOS_ARQUIVADOS`, a estratégia técnica atual aprovada é usar a pasta interna:

```text
DOCUMENTOS_ATIVOS/_ARQUIVADOS
```

Na interface do usuário, usar sempre:

```text
Lixeira
```

Internamente, podem continuar existindo termos técnicos como:

```text
ARQUIVADO
_ARQUIVADOS
tagArquivado
estaArquivado
```

Não trocar esses nomes técnicos só por estética. Trocar apenas textos visíveis para usuário quando necessário.

---

## 6. IDs conhecidos do Microsoft Graph

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

Redirect URI configurada:

```text
https://escolaieda.com/arquivo-digital/
```

Permissões Graph usadas/concedidas:

```text
User.Read
Sites.Read.All
Sites.ReadWrite.All
```

Nunca incluir tokens, senhas ou credenciais em commits, relatórios, código ou documentação.

---

## 7. Regras de ouro para qualquer alteração

Sempre seguir:

```text
diagnóstico → backup → alteração pequena → relatório → teste no site publicado → commit → tag/ponto seguro
```

Antes de alterar:

```powershell
git status --short
git log -1 --oneline
```

Antes de mexer em `arquivo-digital/index.html`, criar backup em:

```text
backups_locais\
```

Gerar relatório em:

```text
diagnosticos\
```

Depois que o usuário testar e aprovar:

```powershell
git add arquivo-digital/index.html
git commit -m "Mensagem objetiva"
git push
```

Para ponto seguro:

```powershell
git tag nome-do-ponto-seguro
git push origin nome-do-ponto-seguro
```

Se quebrar algo após commit:

```powershell
git revert --no-edit HEAD
git push
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
função de substituição do painel
upload
histórico
anotações
Central de Duplicidades
Lixeira/restaurar
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
```

Não recriar a função:

```text
São a mesma pessoa
```

sem pedido explícito e diagnóstico específico. Uma tentativa anterior bagunçou visual e botões.

---

## 9. Funcionalidades consolidadas

### 9.1. Login

O login Microsoft/MSAL está funcionando e deve ser preservado.

Critério de teste:

```text
Site não pode travar em "Verificando login..."
Usuário deve conseguir entrar e listar documentos.
```

### 9.2. Listagem e busca

O sistema lista documentos ativos e documentos da Lixeira.

Busca funciona por nome.

Variáveis importantes:

```text
documentosAtivos
documentosLixeira
documentosCarregados
modoListaAtual
```

A lista exibida depende do modo atual:

```text
ativos
na Lixeira
```

### 9.3. Painel lateral

Decisão central:

```text
Clicar no nome do arquivo NÃO abre o PDF diretamente.
```

Fluxo correto:

```text
Clicar no arquivo → abrir painel lateral → usuário decide ação
```

O painel deve conter:

- nome;
- ID/caminho quando disponível;
- status;
- botão ABRIR PDF;
- renomear;
- substituir;
- enviar para Lixeira;
- restaurar;
- anotações;
- histórico;
- versões do SharePoint;
- nomes parecidos.

O PDF só abre pelo botão:

```text
ABRIR PDF
```

O histórico de visualização só deve registrar quando o usuário clicar em ABRIR PDF, não ao apenas selecionar o arquivo.

### 9.4. Histórico

Lista SharePoint:

```text
HISTORICO_ACESSOS
```

Ações importantes:

```text
VISUALIZOU
RENOMEOU
SUBSTITUIU
ARQUIVOU
RESTAUROU
ENVIOU
ANOTACAO
```

Na interface, `ARQUIVOU` deve aparecer como:

```text
FOI PARA LIXEIRA
```

Função importante:

```text
formatarAcaoHistorico
```

O histórico deve mostrar motivos do usuário sem textos automáticos longos, quando possível.

### 9.5. Anotações

Lista SharePoint:

```text
ANOTACOES_ARQUIVOS
```

Funções importantes:

```text
carregarAnotacaoDocumento
salvarAnotacaoAgora
agendarSalvarAnotacao
salvarAnotacaoManual
registrarHistorico
carregarHistoricoDocumento
```

Decisão aplicada:

```text
Anotações não devem salvar automaticamente texto incompleto.
Salvar deve ocorrer pelo botão existente.
```

Ajuste feito:

- `agendarSalvarAnotacao` passou a apenas indicar que há alteração não salva;
- `salvarAnotacaoManual` salva quando o usuário clica;
- evita múltiplas anotações incompletas.

As anotações foram testadas depois e consideradas funcionando.

### 9.6. Dashboard

Dashboard existe e mostra:

- total de documentos;
- movimentações;
- acessos hoje;
- arquivos com anotações;
- duplicidades pendentes;
- últimas movimentações por arquivo.

Decisão:

```text
Últimas movimentações por arquivo
→ mostra cada PDF uma vez
→ usa movimentação mais recente daquele arquivo
```

Dashboard deve atualizar após ações do sistema.

### 9.7. Lixeira

Interface deve falar:

```text
Lixeira
```

Evitar no visual para usuário:

```text
Arquivado
Arquivados
Arquivar
```

Comportamento:

```text
Enviar para Lixeira → move para DOCUMENTOS_ATIVOS/_ARQUIVADOS
Restaurar → move de _ARQUIVADOS para raiz de DOCUMENTOS_ATIVOS
```

A função técnica pode manter `ARQUIVADO`.

Correção aprovada:

- onde aparecia `arquivando...`, `arquivou`, etc., foi ajustado para Lixeira ou FOI PARA LIXEIRA.

### 9.8. Substituição e versões

Substituição intencional:

- ocorre apenas pelo painel lateral;
- usuário escolhe arquivo substituto;
- SharePoint preserva versões;
- histórico registra `SUBSTITUIU`.

Função de substituição usa endpoint:

```text
/drives/{driveId}/items/{driveItem.id}/content
```

Esse fluxo deve ser preservado.

Versões do SharePoint:

- seção `Versões do SharePoint` no painel;
- versão atual pode abrir no navegador;
- versões anteriores foram ajustadas para visualizar corretamente PDF em nova aba;
- problema de download estranho foi corrigido;
- textos quebrados como `VersÃ£o` foram corrigidos/evitados.

### 9.9. Abertura de PDF com nome correto

Problema identificado:

- ao substituir arquivo, o PDF abria no navegador com nome original do arquivo enviado, não com o nome exibido no sistema.

Foi ajustado para abrir PDF com título/nome do sistema quando possível.

### 9.10. Relatório no painel

Decisão:

```text
Remover/evitar relatório no painel.
```

Não reintroduzir:

```text
btnVisualizarRelatorio
visualizacaoRelatorioArquivo
relatorioArquivoBox
```

### 9.11. Central de Upload

Estado atual aprovado:

```text
Enviar novo PDF → abrir Central de Upload no proprio site
```

A Central de Upload substituiu o antigo fluxo direto.

Nao reintroduzir:

```text
UPLOAD_DIRETO_LIMPO
enviarNovoDocumentoDireto
__enviarNovoDocumentoOriginalDireto
modalUpload*
```

Comportamento atual:

- permite selecionar varios PDFs;
- exige gaveta fisica;
- exige motivo do upload;
- lista os arquivos antes do envio;
- envia somente ao clicar em `Enviar PDF(s)`;
- preserva a regra segura de nome livre;
- salva o metadado `GAVETA` no SharePoint;
- registra historico `ENVIOU` com motivo e gaveta;
- mostra progresso por arquivo/etapa;
- protege o fechamento durante envio;
- evita clique duplo e reenvio acidental.

---

## 10. Central de Duplicidades — estado final aprovado

A Central de Duplicidades foi bastante trabalhada.

### 10.1. Comportamento geral

A Central:

- analisa automaticamente ao abrir/carregar documentos;
- se não houver suspeitos, fica discreta;
- se houver suspeitos, mostra aviso/cartões;
- mantém botão `Atualizar análise`;
- usa `ALERTAS_SISTEMA` para pares marcados como `São pessoas diferentes`;
- painel lateral também respeita pares ignorados;
- Central vermelha é desejada, pois chama atenção do usuário leigo.

### 10.2. Funções importantes

Preservar:

```text
atualizarCentralDuplicidades
gerarParesDuplicidades
carregarParesDuplicidadeIgnorados
marcarPessoasDiferentesCentral
calcularPontuacaoNomes
buscarNomesParecidos
deveExibirNomeParecido
primeiroESegundoNomeParecidos
```

### 10.3. Ajustes executados

Foi feito refinamento progressivo usando 308 arquivos de teste:

- antes: 50 casos suspeitos;
- depois do Passo 175: 19 casos;
- depois do Passo 176: 13 casos;
- depois do Passo 177: 11 casos.

O usuário aprovou seguir com 11 casos.

### 10.4. Regra atual consolidada

Regra aprovada:

```text
- nomes exatamente iguais aparecem;
- nomes compactos iguais ou claramente contidos aparecem;
- 4 pontos ou mais aparecem;
- 3 pontos aparecem somente se primeiro/segundo nomes atenderem critério mais forte;
- 2 pontos não aparecem;
- se primeiro nome for parecido, mas não igual, o segundo nome precisa ser exatamente igual;
- se primeiro nome for igual, o segundo nome pode ser igual/parecido;
- pares marcados como São pessoas diferentes não aparecem mais.
```

### 10.5. Exemplos que devem continuar aparecendo

Com base nos testes:

```text
ADEILTON DA SILVA SANTOS.pdf
ADILSON DA SILVA SANTOS.pdf

ADRIANA MOREIRA DA SILVA.pdf
ADRIANO MOREIRA DA SILVA.pdf

ADRIANA SILVA SANTOS.pdf
ADRIANO DA SILVA SANTOS.pdf

CAMILA SILVA.pdf
CAMILA SILVA SANTOS.pdf

CAMILA SILVA.pdf
CAMILA SILVA SOUZA.pdf

CLEIDIONICE SOUZA OLIVEIRA.pdf
CLEIDIONICE SOUZA DE OLIVEIRA.pdf

CLEUZA PEREIRA DA COSTA.pdf
CREUSA PEREIRA DA COSTA.pdf

ANA PAULA SILVA DOS SANTOS.pdf
ANA PAULA DIAS SANTOS.pdf

ANA PAULA SILVA DOS SANTOS.pdf
ANA PAULA SOUZA DOS SANTOS.pdf

ANA PAULA SOUZA DOS SANTOS.pdf
ANA PAULA DIAS SANTOS.pdf

CLÁUDIA MARIA BISPO DOS SANTOS.pdf
CLAUDIA MARIA DOS SANTOS COSTA.pdf
```

### 10.6. Possível melhoria futura

Não aplicar agora, mas pode ser ideia futura:

```text
Mostrar possíveis semelhanças leves
```

Essa opção ficaria escondida por padrão e poderia mostrar pares mais fracos sem contar como pendência principal.

---

## 11. Upload com nome igual — estado final aprovado

Este foi o ajuste mais recente.

### 11.1. Problema antigo

Antes, ao enviar novo PDF com nome já existente, o sistema mostrava aviso:

```text
ATENÇÃO: já existe um arquivo ativo com esse mesmo nome.
Se continuar, o arquivo atual poderá ser substituído.
```

Isso era perigoso porque usuário leigo poderia clicar em OK sem ler e substituir documento de outra pessoa.

Diagnóstico confirmou:

- upload comum usava `PUT`;
- URL era montada com `/root:/NOME:/content`;
- se o caminho já existisse, poderia substituir;
- o próprio código registrava como `SUBSTITUIU` quando detectava nome igual;
- a verificação usava `documentosCarregados`, que poderia estar apontando para Lixeira, não necessariamente ativos.

### 11.2. Decisão aprovada

Regra final:

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

### 11.3. Ajuste aplicado

Foram inseridas funções semelhantes a:

```text
separarNomePdf
gerarNomeLivreUploadPdf
```

A lógica usa:

```text
documentosAtivos
```

como fonte de nomes ocupados.

O upload comum agora:

- calcula `nomeSolicitado`;
- calcula `nomeFinal`;
- identifica `nomeFoiAjustado`;
- avisa o usuário de forma legível;
- envia com nome livre;
- registra histórico como `ENVIOU`;
- nunca registra `SUBSTITUIU` no upload comum;
- mantém função `Substituir` do painel intacta.

### 11.4. Texto final do aviso

Por causa de problema de codificação nos acentos, o aviso foi trocado para texto sem acentos:

```text
Ja existe um arquivo ativo com o nome:

TESTEI .PDF

Para evitar substituicao acidental, o novo PDF sera enviado automaticamente como:

TESTEI (2).pdf

Depois confira a Central de Duplicidades.
```

Usuário testou e confirmou:

```text
funcionou perfeitamente
```

### 11.5. Ponto seguro criado

Ponto seguro atual:

```text
ponto-seguro-upload-nome-igual-numeracao-ok
```

Esse ponto foi enviado para o GitHub com sucesso.

---

## 12. Pontos seguros recentes e importantes

Pontos seguros conhecidos ao longo do projeto:

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
ponto-seguro-agents-css-central-ok
ponto-seguro-central-duplicidades-sem-blocos-antigos
ponto-seguro-upload-direto-sem-modal-antigo
ponto-seguro-upload-direto-limpo
ponto-seguro-textos-lixeira-ok
ponto-seguro-painel-sem-relatorio
ponto-seguro-historico-lixeira-ok
ponto-seguro-central-automatica-discreta-ok
ponto-seguro-entrega-checklist-ok
ponto-seguro-duplicidades-refinadas-ok
ponto-seguro-upload-nome-igual-numeracao-ok
```

Ponto seguro mais atual e mais importante:

```text
ponto-seguro-upload-nome-igual-numeracao-ok
```

Estado atual aprovado nesse ponto:

```text
Checklist geral passou.
Central de Duplicidades refinada.
Upload comum com nome igual não substitui.
Sistema renomeia automaticamente.
Aviso legível.
Histórico registra como ENVIOU.
Central acusa naturalmente.
```

---

## 13. Commits recentes citados

Commits observados durante a conversa:

```text
6a36894 Atualizar AGENTS com central automatica
0dd2e9b Refinar duplicidades com primeiro nome parecido
```

Outros commits mencionados:

```text
702e388 Ignorar backups e diagnosticos locais
17643dd Deixar relatorio apenas para visualizacao
fce9b62 Separar JS do relatorio da central de duplicidades
35380a9 Tornar central de duplicidades automatica e discreta
5268580 Refinar duplicidades para reduzir falsos positivos
e9a100f Deixar duplicidades de tres pontos mais exigentes
```

Se algum commit não existir localmente no futuro, considerar como referência histórica da conversa, não como fonte única de verdade. Conferir com:

```powershell
git log --oneline --decorate -20
```

---

## 14. Testes manuais já aprovados

O usuário fez checklist geral e informou que estava tudo funcionando.

Checklist usado:

```text
1. Abrir o site com Ctrl + F5
2. Fazer login Microsoft
3. Ver se os documentos carregam
4. Buscar um documento pelo nome
5. Abrir o painel lateral
6. Clicar em ABRIR PDF
7. Salvar uma anotação e ver se aparece no histórico
8. Enviar um PDF de teste para Lixeira
9. Restaurar esse PDF de teste
10. Substituir um PDF de teste
11. Ver se versões do SharePoint aparecem/abrem
12. Conferir se a Central fica discreta sem suspeitos e mostra alerta com suspeitos
13. Conferir o Dashboard depois das ações
```

Resultado informado:

```text
FIZ O CHECKLIST E ESTA TUDO FUNCIONANDO.
```

Depois disso foram feitas alterações pequenas adicionais:

- refinamento de duplicidades;
- upload com nome igual renomeando automaticamente.

Ambas foram testadas e aprovadas.

---

## 15. Problemas encontrados e lições aprendidas

### 15.1. Codificação/acentos

Alguns textos inseridos por scripts apareceram quebrados no navegador:

```text
JÃi
substituiÃSÃEo
serÃi
```

Solução aplicada:

- para avisos críticos via `confirm`, usar texto sem acentos;
- isso evita problemas de encoding.

### 15.2. PowerShell e scripts

Alguns scripts falharam por:

- `$()` dentro de strings;
- aspas quebradas;
- hash com chaves duplicadas;
- correspondência exata de trechos que mudavam por acento/quebra de linha.

Lição:

```text
Para trechos instáveis, usar scripts robustos por posição/regex controlada.
Evitar depender de bloco inteiro idêntico quando o arquivo muda muito.
```

### 15.3. Codex

Codex funciona, mas:

- pode demorar;
- pode gerar muita saída;
- pode escolher “próximo passo” errado se o prompt for genérico;
- melhor usar para diagnóstico somente-leitura;
- alterações pequenas devem ser feitas com script direto do ChatGPT.

Se usar Codex, sempre dar tarefa específica e usar saída em relatório.

### 15.4. Upload

O upload comum era perigoso por usar `PUT` em caminho que poderia existir.

Regra final:

```text
Upload comum nunca substitui.
Substituir só pelo painel.
```

### 15.5. Central de Duplicidades

Se a regra for muito sensível, sobrenomes comuns geram falsos positivos demais.

Sobrenomes muito frequentes no teste:

```text
SILVA
SANTOS
OLIVEIRA
COSTA
PEREIRA
SOUZA
JESUS
```

A regra atual reduziu bastante sem perder casos fortes.

---

## 16. Próximos passos recomendados

Como o sistema está em ponto seguro forte, os próximos passos devem ser pequenos.

### 16.1. Próximo passo mais recomendado

Atualizar o `AGENTS.md` local com este arquivo ou manter os dois lado a lado.

Sugestão:

```text
Manter o antigo como histórico.
Adicionar este como AGENTS_ATUALIZADO_COMPLETO.md.
Opcionalmente copiar este conteúdo para AGENTS.md depois de conferir.
```

### 16.2. Melhorias funcionais possíveis

1. Criar área para desfazer `São pessoas diferentes`.

   Motivo:
   - hoje o par ignorado some;
   - se usuário marcou errado, precisa forma de desfazer.

2. Criar filtros úteis:

   Exemplos:
   - Ativos;
   - Lixeira;
   - Com anotação;
   - Com duplicidade;
   - Atualizados recentemente;
   - Enviados hoje;
   - Substituídos recentemente.

3. Melhorar visual mobile/desktop.

   Motivo:
   - painel lateral, dashboard e central têm muito conteúdo;
   - testar responsividade antes de entrega final.

4. Criar instruções curtas de uso para a escola.

   Documento simples:
   - como enviar PDF;
   - como abrir painel;
   - como abrir PDF;
   - como salvar anotação;
   - como enviar para Lixeira;
   - como restaurar;
   - como interpretar Central de Duplicidades.

5. Criar visão de “semelhanças leves” escondida.

   Não deve contar como pendência principal.

6. Avaliar permissões por perfil.

   Futuro:
   - quem pode enviar;
   - quem pode excluir/enviar para Lixeira;
   - quem pode substituir;
   - quem só visualiza.

7. Melhorar mensagens visuais.

   Trocar alguns `confirm`, `prompt`, `alert` por caixas próprias do sistema, com visual mais profissional.

### 16.3. Não recomendado agora

Não iniciar agora:

```text
upload em massa
São a mesma pessoa
mesclagem real de PDFs
OCR
grande refatoração do index.html
mudança de estrutura SharePoint
alteração de login/MSAL
```

Esses itens exigem diagnóstico grande e podem quebrar áreas estáveis.

---

## 17. Comando para verificar estado antes de continuar

Sempre que voltar ao projeto:

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"
git status --short
git log -1 --oneline
git tag --points-at HEAD
```

O estado ideal atual deve estar limpo e com tag recente:

```text
ponto-seguro-upload-nome-igual-numeracao-ok
```

---

## 18. Modelo de comando para executar scripts enviados pelo ChatGPT

Padrão preferido:

```powershell
Set-Location "$env:USERPROFILE\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda"; $tmp = Join-Path $env:TEMP "NOME_DO_PASSO.ps1"; Get-Content -Raw "$env:USERPROFILE\Downloads\NOME_DO_ARQUIVO.txt" | Set-Content -Path $tmp -Encoding UTF8; & $tmp
```

Depois de teste aprovado:

```powershell
git add arquivo-digital/index.html
git commit -m "Mensagem objetiva"
git push
```

Para tag:

```powershell
git tag nome-da-tag
git push origin nome-da-tag
```

---

## 19. Resumo cronológico técnico do ponto zero até agora

### Fase 1 — Criação/estrutura base

- Sistema criado dentro de `arquivo-digital/index.html`.
- Integração com Microsoft login/MSAL.
- Configuração Graph/SharePoint.
- Listagem inicial de documentos PDF.
- Busca por documentos.
- Abertura de PDFs.

### Fase 2 — Painel lateral

- Decisão de não abrir PDF diretamente ao clicar no nome.
- Clique passou a abrir painel lateral.
- Botão ABRIR PDF virou ação própria.
- Histórico de acesso passou a ser associado ao botão ABRIR PDF.

### Fase 3 — Histórico e anotações

- Criado histórico de ações.
- Criadas anotações por arquivo.
- Ajuste para anotações não salvarem automaticamente textos incompletos.
- Salvar anotação pelo botão.
- Histórico de anotação mantido.

### Fase 4 — Lixeira

- Enviar para Lixeira implementado via `_ARQUIVADOS`.
- Restaurar implementado.
- Interface passou a usar “Lixeira”.
- `ARQUIVOU` passou a aparecer como `FOI PARA LIXEIRA`.

### Fase 5 — Substituição e versões

- Substituir PDF pelo painel.
- Preservar versões SharePoint.
- Exibir versões no painel.
- Visualizar versão atual/anterior.
- Corrigir visualização de versão anterior que baixava arquivo estranho.
- Corrigir nome/título de abertura do PDF quando necessário.

### Fase 6 — Limpezas

- Removidos modais antigos de upload.
- Removidos blocos antigos da Central.
- Removidos elementos antigos de relatório do painel.
- Mantido upload direto limpo.
- Criado/atualizado AGENTS antigo com estado parcial.

### Fase 7 — Central de Duplicidades

- Central automática e discreta.
- Painel respeita pares ignorados.
- Ajustes sucessivos de pontuação.
- Teste com 308 arquivos.
- Redução de 50 para 11 suspeitos.
- Ponto seguro criado.

### Fase 8 — Entrega/checklist

- Usuário fez checklist geral no site publicado.
- Tudo funcionou.
- Ponto seguro de checklist criado.

### Fase 9 — Upload seguro com nome igual

- Discussão do risco de usuário leigo substituir arquivo sem perceber.
- Decisão: upload comum nunca substitui.
- Se nome igual existir, renomeia automaticamente.
- Ajuste aplicado.
- Corrigido aviso com caracteres quebrados.
- Usuário testou e aprovou.
- Ponto seguro mais atual criado:

```text
ponto-seguro-upload-nome-igual-numeracao-ok
```

---

## 20. Estado atual em linguagem simples

O sistema atualmente está assim:

```text
O site funciona.
O login funciona.
Os documentos carregam.
O painel lateral funciona.
O PDF abre pelo botão correto.
Anotações funcionam.
Histórico funciona.
Lixeira/restaurar funciona.
Substituir funciona.
Versões SharePoint funcionam.
Dashboard funciona.
Central de Duplicidades funciona e está refinada.
Upload direto funciona.
Upload com nome igual não substitui mais; renomeia automaticamente.
```

Esse é o melhor ponto seguro conhecido até agora.

---

## 21. Texto de contexto para novo ChatGPT/Codex

Se um novo chat ler este arquivo, considerar:

```text
Você está continuando um projeto real chamado Arquivo Digital Escolar.
O usuário prefere passos curtos, scripts .txt para baixar e comandos PowerShell prontos.
Não explique demais.
Não faça grandes refatorações.
Sempre proteger o que já funciona.
Sempre criar backup, relatório, teste, commit e tag.
O ponto seguro mais atual é ponto-seguro-upload-nome-igual-numeracao-ok.
```

Próxima resposta ideal ao usuário, se ele disser “vamos continuar”:

```text
Vamos confirmar o estado primeiro:
git status --short
git log -1 --oneline
git tag --points-at HEAD
```

Depois perguntar qual alteração pequena ele quer fazer.

---

## 22. Anexo — resumo conversacional detalhado

Abaixo está um resumo narrativo dos principais trechos da conversa recente. Ele não é transcrição literal completa, mas preserva as decisões e intenções.

### Continuidade e AGENTS

O usuário perguntou se deveria continuar na mesma conversa ou abrir outra. Foi explicado que poderia continuar, mas que um `AGENTS.md` ajudaria outros chats/Codex a saber os detalhes. O usuário pediu um resumo técnico em formato AGENTS com objetivo, estrutura, funcionalidades, problemas, decisões, pendências, próximos passos e cuidados para Codex/PowerShell.

### Fluxo PowerShell/Codex

O usuário quis reduzir trabalho manual de colar scripts longos. Tentamos usar Codex pelo PowerShell. O usuário percebeu que a saída ficava confusa e que diagnósticos demoravam. Foi concluído que o melhor fluxo seria:

```text
Scripts diretos do ChatGPT para mudanças pequenas.
Codex somente para diagnósticos maiores.
```

### Anotações

O usuário percebeu que anotações estavam salvando automaticamente e gerando registros incompletos. Foi decidido que o ideal era salvar apenas pelo botão existente. Ajustes foram feitos para desativar autosave real e manter apenas o status de alteração não salva. Depois o usuário testou e confirmou funcionamento.

### Textos de Lixeira

O usuário percebeu que ao mover para Lixeira ainda apareciam termos como `arquivando...` e `arquivou`. Foram feitos ajustes para mostrar termos de Lixeira, principalmente no histórico e dashboard. O usuário confirmou que funcionou.

### Versões do SharePoint

O usuário observou que as versões apareciam, mas não havia botão. Adicionamos botão para visualizar/baixar versão. Depois ajustamos para visualizar no navegador em vez de baixar. Houve problema com versão anterior baixando coisa estranha, e isso foi corrigido. O usuário confirmou funcionamento.

### PDF com nome correto

O usuário percebeu que após substituir, ao abrir PDF no navegador aparecia o nome do arquivo enviado do computador, e não o nome mantido no sistema. Foi discutido que o SharePoint mantém nome físico; ajustamos para abertura com título/nome do sistema quando possível. O usuário confirmou 100%.

### Central de Duplicidades automática

O usuário queria que a Central analisasse automaticamente ao abrir o site, sem precisar clicar, e que só aparecesse quando houvesse duplicidade. Ajustamos para Central automática e discreta. O usuário confirmou funcionamento e salvou ponto seguro.

### Checklist de entrega

Codex gerou diagnóstico de entrega final. O relatório recomendou não iniciar funções novas, mas testar o site publicado. O usuário fez checklist completo e disse que tudo estava funcionando. Foi criado ponto seguro.

### Refinamento de duplicidades

O usuário carregou 308 modelos de arquivos para testar duplicidade. A Central inicialmente mostrou 50 suspeitos, com muitos falsos positivos por sobrenomes comuns. Foram feitos refinamentos:

- ocultar 2 pontos;
- exigir primeiro nome igual/parecido;
- exigir primeiro e segundo nome para 3 pontos;
- tornar primeiro nome parecido mais rígido.

Resultado caiu para 11 suspeitos. O usuário aprovou. Criado ponto seguro.

### Upload com nome igual

O usuário levantou risco grave: usuário leigo poderia enviar arquivo com nome igual e substituir documento de outra pessoa. Primeiro discutimos bloquear upload, mas o usuário achou perigoso porque usuário poderia não ler aviso. A solução aprovada foi:

```text
se nome já existe, sistema renomeia automaticamente e envia;
depois Central acusa duplicidade.
```

Foi diagnosticado que upload comum usava `PUT` e podia substituir. Ajustamos para gerar `NOME (2).pdf`, `NOME (3).pdf`. Houve texto quebrado no aviso, corrigido para sem acentos. O usuário testou e disse que funcionou perfeitamente. Criado ponto seguro atual.

---

## 23. Comando para instalar/copiar este AGENTS no projeto

Este arquivo foi criado como:

```text
AGENTS_ATUALIZADO_COMPLETO.md
```

Ele deve ser copiado para a pasta local do projeto:

```text
C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda
```

Recomenda-se manter o AGENTS antigo e colocar este ao lado dele. Depois, se desejado, copiar também por cima de `AGENTS.md`.

Comandos sugeridos estão na resposta do ChatGPT junto com o link de download.

---

## 24. Última atualização deste documento

Gerado em:

```text
2026-05-24
```

Estado final registrado:

```text
ponto-seguro-upload-nome-igual-numeracao-ok
```

Fim do arquivo.

---

## 25. Padrao operacional - `open AQUI`

Esta regra e permanente para o uso do Codex neste projeto.

Quando o usuario digitar exatamente ou aproximadamente:

```text
open AQUI
```

o Codex deve interpretar isso como:

```text
Ler o arquivo AQUI disponivel em C:\Users\Eugui\Downloads, seguir exatamente as instrucoes contidas nele, executar a tarefa solicitada e, ao final, excluir o arquivo AQUI usado da pasta Downloads.
```

### Caminhos padrao do arquivo AQUI

```text
C:\Users\Eugui\Downloads\AQUI.txt
C:\Users\Eugui\Downloads\AQUI.docx
```

### Regras para executar `open AQUI`

1. Entrar ou permanecer na pasta do projeto:

```text
C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda
```

2. Verificar se existe `AQUI.txt` ou `AQUI.docx`:

```powershell
Test-Path "$env:USERPROFILE\Downloads\AQUI.txt"
Test-Path "$env:USERPROFILE\Downloads\AQUI.docx"
```

3. Dar preferencia para `AQUI.txt` se os dois existirem.

4. Se nenhum arquivo existir, avisar o usuario:

```text
Nao encontrei C:\Users\Eugui\Downloads\AQUI.txt nem C:\Users\Eugui\Downloads\AQUI.docx. Crie o arquivo e tente novamente.
```

5. Se existir `AQUI.txt`, ler todo o conteudo:

```powershell
Get-Content -Raw "$env:USERPROFILE\Downloads\AQUI.txt"
```

6. Se existir `AQUI.docx`, tratar o Word como a instrucao principal da tarefa atual:
   - extrair e ler o texto do documento;
   - se houver imagens relevantes, extrair as imagens internas do `.docx`;
   - analisar as imagens extraidas quando a tarefa depender delas;
   - se a imagem tiver texto, tentar interpretar visualmente ou usar OCR local se disponivel.

7. Tratar o conteudo de `AQUI.txt` ou `AQUI.docx` como a instrucao principal da tarefa atual.

8. Antes de alterar qualquer arquivo, seguir as regras normais do projeto:
   - ler `AGENTS.md`;
   - rodar `git status --short`;
   - rodar `git log -1 --oneline`;
   - criar backup se for alterar `arquivo-digital/index.html`;
   - gerar relatorio em `diagnosticos`;
   - alterar somente o necessario;
   - fazer commit/push automaticamente para mudancas pequenas e validadas, conforme combinado com o usuario;
   - nao fazer commit automatico para mudancas grandes ou sensiveis sem confirmar.

9. Ao terminar a tarefa, apagar somente o arquivo AQUI que foi usado:

```powershell
Remove-Item "$env:USERPROFILE\Downloads\AQUI.txt" -Force
Remove-Item "$env:USERPROFILE\Downloads\AQUI.docx" -Force
```

10. Se a tarefa falhar antes de ler o conteudo, nao apagar o arquivo.
11. Se a tarefa for lida e executada, apagar o arquivo ao final, mesmo que o resultado seja apenas diagnostico.
12. No resumo final, dizer:
    - que leu o arquivo `AQUI.txt` ou `AQUI.docx`;
    - o que executou;
    - onde gerou relatorio, se houver;
    - se apagou o arquivo AQUI usado.

### Importante

`open AQUI` nao significa abrir uma janela ou editor.
Neste projeto, `open AQUI` significa ler, executar e excluir o arquivo `Downloads\AQUI.txt` ou `Downloads\AQUI.docx`.

---

## 26. Atualizacao da sessao Codex - 2026-05-24

Esta secao registra os passos feitos depois do ponto seguro `ponto-seguro-upload-nome-igual-numeracao-ok`.

### 26.1. AGENTS organizado

O arquivo `AGENTS.md` foi consolidado como documento principal atualizado.

As copias soltas foram movidas para:

```text
backups_locais\agents\
```

Commit:

```text
d5d552a Atualizar AGENTS do projeto
```

### 26.2. Central de Duplicidades - desfazer pessoas diferentes

Foi adicionada uma secao recolhida:

```text
Pares marcados como pessoas diferentes
```

Nela, cada par ignorado pode ser desfeito individualmente.

Comportamento:

- carrega itens `IGNORADO` da lista `ALERTAS_SISTEMA`;
- mostra os pares ignorados;
- botao `Desfazer` muda o item para `STATUS: ATIVO`;
- a Central recalcula depois do desfazer.

Commit:

```text
10385eb Adicionar desfazer pessoas diferentes
```

Ponto seguro:

```text
ponto-seguro-desfazer-pessoas-diferentes-ok
```

### 26.3. Padrao operacional `open AQUI`

Foi criado o padrao:

```text
open AQUI
```

Primeira versao aceitava `Downloads\AQUI.txt`.

Depois foi ampliada para aceitar tambem:

```text
Downloads\AQUI.docx
```

Regra atual:

- se existir `AQUI.txt`, ele tem prioridade;
- se existir `AQUI.docx`, ler texto do Word;
- se o Word tiver imagens importantes, extrair e analisar;
- apagar o arquivo AQUI usado ao final;
- para mudancas pequenas e validadas, fazer commit/push automaticamente.

Commits:

```text
de5a379 Adicionar padrao open AQUI
c8d1c4f Atualizar padrao open AQUI para Word
```

### 26.4. Central de Duplicidades - desfazer todos

Foi adicionado o botao:

```text
Desfazer todos
```

Ele aparece dentro de `Pares marcados como pessoas diferentes`.

Comportamento:

- mostra a quantidade de pares ignorados;
- pede confirmacao;
- percorre todos os itens ignorados;
- muda cada item para `STATUS: ATIVO`;
- recalcula a Central depois;
- em caso de erro no meio, recarrega a analise.

Commit:

```text
524806c Adicionar desfazer todos pares diferentes
```

Ponto seguro:

```text
ponto-seguro-desfazer-todos-pares-diferentes-ok
```

### 26.5. Central recolhida e painel direto

Pedido do usuario via `open AQUI`:

- a Central deveria aparecer recolhida para evitar rolagem longa;
- o botao `Abrir no painel` deveria abrir diretamente o painel lateral do PDF.

Ajustes feitos:

- a Central mostra resumo e botao `Mostrar casos`;
- os cards ficam ocultos inicialmente;
- `Mostrar casos` / `Ocultar casos` abre e fecha a lista;
- o botao `Atualizar analise` foi removido da interface;
- `Abrir no painel` nao troca mais a lista inferior;
- foi criada a funcao `abrirDocumentoNoPainel(documento)`;
- `selecionarDocumento(indice)` passou a reutilizar `abrirDocumentoNoPainel`;
- `abrirArquivoDaCentral` localiza o documento pelo ID em ativos/lixeira e abre o painel lateral diretamente.

Commits:

```text
319a372 Recolher central e abrir painel direto
1bcbc18 Corrigir central recolhida
155a582 Otimizar botao mostrar casos
```

Ponto seguro:

```text
ponto-seguro-central-recolhida-otimizada-ok
```

---

## 27. Salvamento automatico de passos

Foi criada uma pasta para registrar pequenos passos concluidos durante o trabalho no projeto:

```text
SALVAMENTO_AUTOMATICO\
```

Nome escolhido sem espaco para facilitar comandos, Git e automacoes.

Regra operacional:

- a cada pequeno passo concluido, criar um arquivo `.txt` dentro de `SALVAMENTO_AUTOMATICO`;
- usar nomes como `PASSO_185_DESCRICAO_CURTA.txt`;
- registrar de forma objetiva:
  - data;
  - pedido do usuario;
  - arquivos alterados;
  - backup criado, se houver;
  - validacao feita;
  - commit/push/tag, se houver;
  - resultado final.

Objetivo:

```text
Manter um historico simples, em TXT, para depois consolidar no AGENTS.md.
```

Primeiro arquivo criado:

```text
SALVAMENTO_AUTOMATICO\PASSO_185_CRIAR_SALVAMENTO_AUTOMATICO.txt
```

### 26.6. Observacao sobre desempenho

O botao `Mostrar casos` teve travadinha porque recalculava duplicidades ao abrir.

Correcao aplicada:

- foi criada a variavel `totalParesCentralDuplicidades`;
- a quantidade e guardada apos a analise;
- `Mostrar casos` agora apenas abre/fecha a lista ja calculada.

### 26.7. Estado atual aprovado

O usuario testou e confirmou:

```text
BOTÃO DESFAZER TODOS FUNCIONOU
FICOU OTIMO
```

Estado atual:

```text
Central fica recolhida.
So aparece o botao Mostrar casos/Ocultar casos.
Abrir no painel abre direto o painel lateral do documento.
Mostrar casos ficou mais rapido.
Desfazer individual funciona.
Desfazer todos funciona.
Padrao open AQUI aceita TXT e DOCX.
```

Ponto seguro mais atual:

```text
ponto-seguro-central-recolhida-otimizada-ok
```

---

## 28. Atualizacao recente - filtros, salvamento automatico e Central no dashboard

Data: 2026-05-24

Esta secao registra os passos posteriores a `ponto-seguro-central-recolhida-otimizada-ok`.

### 28.1. Filtros de documentos

Foi feita uma tentativa de adicionar filtros na lista:

```text
Todos
Com anotacao
Com duplicidade
```

Depois o filtro `Com duplicidade` foi removido, pois a Central de Duplicidades ja cobre esse fluxo.

Depois os filtros restantes tambem foram removidos:

```text
Todos
Com anotacao
```

Estado atual:

```text
A lista de documentos tem apenas Ativos/Lixeira e busca por nome.
Nao ha filtros adicionais na lista.
```

Commits relevantes:

```text
c046c4e Adicionar filtros de documentos
79605df Otimizar filtro com duplicidade
20806a4 Remover filtro com duplicidade
be2ac15 Mover central para dashboard
```

Ponto seguro relacionado aos filtros antes das mudancas posteriores:

```text
ponto-seguro-filtros-documentos-ok
```

### 28.2. Salvamento automatico

Foi criada a pasta:

```text
SALVAMENTO_AUTOMATICO\
```

Regra atual:

- a cada pequeno passo concluido, criar um `.txt` nessa pasta;
- registrar pedido, arquivo alterado, backup, validacao, commit/push/tag e resultado;
- usar esses TXT como apoio para atualizar o `AGENTS.md`.

Commit:

```text
01f265b Adicionar salvamento automatico de passos
```

### 28.3. Atalho de retomada

Foi criado/atualizado o atalho na Area de Trabalho:

```text
Arquivo Digital - Continuar Projeto.lnk
```

Ele aponta para:

```text
CONTINUAR_PROJETO_ARQUIVO_DIGITAL.ps1
```

O script:

- entra no projeto;
- le estado do Git;
- le os TXT de `SALVAMENTO_AUTOMATICO`;
- gera prompt de retomada em `prompts_codex\RETOMAR_PROJETO_ARQUIVO_DIGITAL.txt`;
- tenta copiar o prompt para a area de transferencia.

Commit:

```text
52df664 Criar atalho para continuar projeto
```

### 28.4. Central de Duplicidades no dashboard

O cartao `Arquivos com anotacoes` foi removido do dashboard por nao merecer tanta notoriedade.

No lugar dele, foi colocada a Central de Duplicidades.

Evolucao:

1. Central colocada no dashboard.
2. Resultado expandido no dashboard ficou ruim, parecendo uma coluna longa.
3. Lista de casos foi movida para painel lateral proprio.
4. Painel da Central ficou parcialmente visivel quando fechado e foi corrigido.
5. Painel da Central foi movido para o lado esquerdo para nao conflitar com o painel do documento.

Estado atual aprovado:

```text
Dashboard mostra card compacto da Central de Duplicidades.
Ao clicar no card/botao da Central, abre painel lateral proprio pela esquerda.
Ao clicar em Abrir no painel dentro da Central, o painel do documento abre pela direita.
Painel da Central fecha ao clicar fora ou apertar ESC.
Painel de documentos ativos/Lixeira continua funcionando do lado direito.
```

Funcoes da Central preservadas:

```text
Abrir no painel
Sao pessoas diferentes
Pares marcados como pessoas diferentes
Desfazer
Desfazer todos
```

Commits relevantes:

```text
be2ac15 Mover central para dashboard
dd6494d Abrir central em painel lateral
369c4da Corrigir painel lateral da central
2558a09 Mover painel da central para esquerda
db4638e Registrar ponto seguro da central no dashboard
```

Ponto seguro mais atual:

```text
ponto-seguro-central-dashboard-painel-esquerda-ok
```

### 28.5. Diagnostico curto do index

Foi feito diagnostico curto do `arquivo-digital/index.html`.

Resultado:

```text
Git limpo.
JS OK.
Blocos antigos proibidos nao encontrados.
Funcoes principais encontradas.
Estado geral saudavel.
```

Registro:

```text
SALVAMENTO_AUTOMATICO\PASSO_189_DIAGNOSTICO_CURTO_INDEX_SAUDAVEL.txt
```

### 28.6. Estado atual em linguagem simples

Estado mais atual aprovado:

```text
Sistema funcionando.
Central de Duplicidades fica no dashboard.
Central abre em painel lateral esquerdo.
Painel de PDF/documento abre pela direita.
Lista de documentos sem filtros extras.
Busca por nome preservada.
Salvamento automatico em TXT ativo.
Atalho de retomada criado.
Ponto seguro mais atual: ponto-seguro-central-dashboard-painel-esquerda-ok.
```

---

## 29. Atualizacao recente - movimentacoes e limite de documentos ativos

Data: 2026-05-24

### 29.1. Ultimas movimentacoes fora do dashboard

O cartao `Ultimas movimentacoes por arquivo` foi removido do dashboard.

Motivo:

```text
O usuario preferiu que as movimentacoes aparecessem diretamente nos documentos ativos, e nao como tres itens em um cartao do dashboard.
```

Estado atual:

- a movimentacao recente aparece diretamente no item do documento ativo;
- a indicacao aparece apenas para os 20 arquivos com movimentacao mais recente;
- a Lixeira nao mostra essa linha extra;
- a busca por nome continua funcionando.

Funcao criada:

```text
obterUltimasMovimentacoesPorArquivo(20)
```

Commit:

```text
bd9ded5 Mover movimentacoes para documentos ativos
```

Registro:

```text
SALVAMENTO_AUTOMATICO\PASSO_197_MOVIMENTACOES_NOS_DOCUMENTOS_ATIVOS.txt
```

### 29.2. Ativos limitados aos 20 mais recentes

A aba `Ativos` passou a mostrar apenas os 20 documentos ativos mais recentes.

Motivo:

```text
Evitar que a pagina liste muitos documentos de uma vez e fique pesada.
```

Estado atual:

- aba `Ativos` mostra no maximo 20 documentos;
- documentos aparecem do mais recente para o menos recente;
- ordenacao usa o campo `modificado`;
- a Lixeira nao foi alterada;
- a busca por nome continua funcionando dentro dessa regra de exibicao;
- a lista de ativos nao despeja todos os documentos.

Funcao criada:

```text
ordenarPorModificacaoMaisRecente(lista)
```

Commit:

```text
71423dc Limitar ativos aos vinte recentes
```

Registro:

```text
SALVAMENTO_AUTOMATICO\PASSO_198_ATIVOS_APENAS_20_RECENTES.txt
```

### 29.3. Estado atual em linguagem simples

Estado mais atual apos essa etapa:

```text
Dashboard sem cartao de ultimas movimentacoes.
Movimentacoes recentes aparecem nos documentos ativos.
Aba Ativos mostra apenas 20 documentos recentes.
Busca por nome preservada.
Lixeira preservada.
Central de Duplicidades no dashboard com painel esquerdo preservada.
```

---

## 30. Atualizacao recente - guias, gaveta fisica e Central de Upload

Data: 2026-05-25

Esta secao registra os passos posteriores ao ponto seguro dos ativos recentes.

### 30.1. Guias Recentes, Ativos e Lixeira

Foi criada a guia:

```text
Recentes
```

Estado atual:

- as guias sao `Recentes`, `Ativos` e `Lixeira`;
- `Recentes` mostra os 20 documentos ativos mais recentes quando nao ha busca;
- busca em `Recentes` e `Ativos` pesquisa todos os documentos ativos, sem limite de 20;
- busca em `Lixeira` pesquisa somente documentos da Lixeira;
- mover documento para Lixeira nao troca automaticamente para a guia Lixeira;
- Dashboard nao mostra mais `Acessos registrados` nem `Acessos hoje`;
- Central de Duplicidades ignora documentos da Lixeira.

Commits relevantes:

```text
cabfc72 Ajustar guias recentes lixeira e dashboard
c2666ea Registrar ponto seguro das guias recentes
```

Ponto seguro:

```text
ponto-seguro-guias-recentes-lixeira-dashboard-ok
```

Registros:

```text
SALVAMENTO_AUTOMATICO\PASSO_201_GUIAS_RECENTES_LIXEIRA_DASHBOARD.txt
SALVAMENTO_AUTOMATICO\PASSO_202_PONTO_SEGURO_GUIAS_RECENTES_LIXEIRA_DASHBOARD.txt
```

### 30.2. Coluna GAVETA no SharePoint

Foi criada/reutilizada a coluna:

```text
Title: GAVETA
InternalName: GAVETA
Tipo: Choice
Lista/biblioteca: DOCUMENTOS_ATIVOS
```

Opcoes atuais:

```text
Gaveta 1 ate Gaveta 34
```

Regras:

- nao criar coluna duplicada de gaveta;
- usar sempre o InternalName `GAVETA`;
- a coluna fica na biblioteca `DOCUMENTOS_ATIVOS`;
- Lixeira interna usa a pasta `_ARQUIVADOS`, mas o item continua na mesma biblioteca e preserva metadados.

Commit:

```text
94f7414 Registrar coluna gaveta no SharePoint
```

Registro:

```text
SALVAMENTO_AUTOMATICO\PASSO_203_CRIAR_COLUNA_GAVETA_SHAREPOINT.txt
```

### 30.3. Exibicao de gaveta no site

O site passou a carregar `GAVETA` na consulta de documentos:

```text
fields($select=FileLeafRef,FileRef,UniqueId,Modified,FileDirRef,FSObjType,GAVETA)
```

Estado atual:

- a gaveta aparece como selo na listagem;
- aparece em `Recentes`, `Ativos` e `Lixeira`;
- aparece no painel lateral em `Localizacao fisica`;
- quando o arquivo nao tem gaveta, mostra `Gaveta nao informada`.

Commit:

```text
29b9479 Exibir gaveta dos documentos
```

Registro:

```text
SALVAMENTO_AUTOMATICO\PASSO_204_EXIBIR_GAVETA_SITE.txt
```

### 30.4. Central de Upload com gaveta e motivo

A Central de Upload substituiu o antigo upload direto.

IDs e funcoes importantes:

```text
centralUpload
abrirCentralUpload
fecharCentralUpload
confirmarUploadCentral
listaArquivosUpload
gavetaUpload
motivoUpload
btnConfirmarUploadCentral
btnFecharCentralUpload
```

Comportamento atual:

- `Enviar novo PDF` abre a Central de Upload;
- permite selecionar varios PDFs;
- nao envia automaticamente ao selecionar arquivos;
- exige gaveta;
- exige motivo;
- lista arquivos para conferencia;
- preserva a regra de nome livre, gerando `NOME (2).pdf`, etc.;
- salva o campo `GAVETA` no SharePoint apos cada upload;
- registra historico `ENVIOU` com motivo e gaveta;
- atualiza documentos, dashboard/dados de apoio e Central de Duplicidades apos upload.

Nao reintroduzir:

```text
UPLOAD_DIRETO_LIMPO
enviarNovoDocumentoDireto
__enviarNovoDocumentoOriginalDireto
modalUpload*
```

Commit:

```text
3c7272e Adicionar central de upload com gaveta
```

Registro:

```text
SALVAMENTO_AUTOMATICO\PASSO_205_CENTRAL_UPLOAD_GAVETA.txt
```

### 30.5. Alterar gaveta no painel lateral

Foi adicionada no painel lateral a acao:

```text
Alterar gaveta
```

Comportamento:

- permite escolher `Gaveta 1` ate `Gaveta 34`;
- motivo e obrigatorio;
- atualiza a coluna `GAVETA` no SharePoint;
- registra historico `ALTEROU_GAVETA`;
- observacao registra gaveta anterior, nova gaveta e motivo;
- atualiza painel, listagem e historico.

Commit:

```text
395bf41 Permitir alterar gaveta no painel
```

Registro:

```text
SALVAMENTO_AUTOMATICO\PASSO_206_ALTERAR_GAVETA_PAINEL.txt
```

### 30.6. Validacao e ponto seguro da gaveta/upload

Validacao local feita:

```text
JS module syntax OK.
git diff --check sem erros.
PnP confirmou GAVETA como Choice, Hidden False.
```

O usuario testou no site publicado e aprovou.

Ponto seguro:

```text
ponto-seguro-gaveta-central-upload-ok
```

Commits:

```text
e683ed2 Registrar validacao final da gaveta
af3b488 Registrar ponto seguro da central de upload
```

Registros:

```text
SALVAMENTO_AUTOMATICO\PASSO_207_VALIDACAO_FINAL_GAVETA_UPLOAD.txt
SALVAMENTO_AUTOMATICO\PASSO_208_PONTO_SEGURO_GAVETA_CENTRAL_UPLOAD.txt
```

---

## 31. Atualizacao recente - seguranca e visual da Central de Upload

Data: 2026-05-25

### 31.1. Fechamento seguro e progresso

A Central de Upload ganhou protecoes para usuario leigo.

Comportamento atual:

- X fecha normalmente quando nao ha rascunho;
- se houver arquivos/gaveta/motivo sem envio, pede confirmacao;
- confirmacao mostra `Continuar enviando` e `Sair sem enviar`;
- durante upload, X, Esc, limpar selecao e saida da pagina ficam protegidos;
- `beforeunload` avisa se tentar sair durante upload;
- `Enviar PDF(s)` fica desativado durante upload;
- evita clique duplo e reenvio do mesmo lote;
- mostra barra de progresso por arquivo/etapa;
- mostra percentual, etapa, contagem e arquivo atual;
- mostra status por arquivo: `Pendente`, `Enviando`, `Enviado`, `Conflito`, `Erro`;
- em sucesso, exibe `Concluir e fechar`;
- em erro, mantem a lista visivel e pede confirmacao para fechar.

Commit:

```text
ff5acaf Adicionar fechamento seguro e progresso na Central de Upload
```

Registro:

```text
SALVAMENTO_AUTOMATICO\PASSO_209_FECHAMENTO_SEGURO_PROGRESSO_UPLOAD.txt
```

### 31.2. Destaque visual do botao de envio

Ajuste apenas visual em CSS:

- botao `Enviar PDF(s)` ficou vermelho forte;
- texto branco;
- fonte em negrito;
- borda arredondada;
- sombra leve;
- hover vermelho mais escuro;
- X da Central ficou mais visivel.

Commit:

```text
edc24dd Melhorar destaque visual do botão enviar upload
```

Ponto seguro:

```text
ponto-seguro-upload-visual-botao-vermelho-ok
```

Commit de registro:

```text
16b72ae Registrar ponto seguro visual do upload
```

Registros:

```text
SALVAMENTO_AUTOMATICO\PASSO_210_DESTAQUE_VISUAL_BOTAO_UPLOAD.txt
SALVAMENTO_AUTOMATICO\PASSO_211_PONTO_SEGURO_UPLOAD_VISUAL_BOTAO_VERMELHO.txt
```

### 31.3. Estado atual em linguagem simples

Estado aprovado mais recente:

```text
Site funcionando.
Guias: Recentes, Ativos e Lixeira.
Central de Duplicidades no dashboard e painel esquerdo.
Central ignora documentos da Lixeira.
Documentos carregam com gaveta fisica.
Central de Upload envia varios PDFs com gaveta e motivo.
Upload preserva regra segura de nome livre.
Historico registra ENVIOU com motivo/gaveta.
Painel lateral permite alterar gaveta.
Historico registra ALTEROU_GAVETA.
Central de Upload tem fechamento seguro e barra de progresso.
Botao Enviar PDF(s) esta em vermelho e destacado.
```

Ponto seguro mais atual:

```text
ponto-seguro-upload-visual-botao-vermelho-ok
```

### 31.4. Recomendacao para fechamento do projeto

Antes de considerar entrega final:

1. Rodar checklist completo no site publicado.
2. Corrigir apenas falhas reais encontradas no checklist.
3. Atualizar AGENTS com qualquer ajuste adicional.
4. Criar ponto seguro final de entrega.

Nao iniciar funcionalidades grandes novas antes do ponto seguro final.
