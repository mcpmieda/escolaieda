# Relatorio - ultimas correcoes V1 painel/upload/duplicidades

Data: 2026-06-01

## Escopo executado

- Corrigir fechamento indevido da Central de Duplicidades ao acionar botoes do painel lateral.
- Atualizar textos visuais do painel lateral de "ABRIR PDF" para "ABRIR ARQUIVO".
- Separar nome visual do cabecalho e nome real do arquivo SharePoint no campo "Nome do arquivo".
- Exibir chips compactos de status, gaveta e nome repetido abaixo do titulo principal do painel.
- Dar mais destaque visual para "Localizacao fisica".
- Atualizar Central de Upload para "ARQUIVOS DO ALUNO".
- Remover confirmacao para arquivo acima de 25 MB, mantendo upload session em blocos.
- Remover confirmacao do botao "Limpar selecao".
- Trocar avisos de nome existente e arquivo grande por mensagens visuais na lista de upload.

## Correcoes aplicadas

### Painel lateral

- O titulo principal continua usando nome visual limpo para leitura rapida.
- O campo "Nome do arquivo" agora mostra `documento.nome` completo, preservando `.pdf`, `(2)`, `(3)` e demais sufixos reais do SharePoint.
- Os chips de status, gaveta e "Nome igual" foram movidos para baixo do titulo principal.
- O botao principal passou a exibir "ABRIR ARQUIVO".
- As mensagens de abertura passaram a usar "Arquivo aberto".

### Central de Duplicidades

- O fechamento por clique externo agora ignora cliques dentro do painel lateral.
- Acionar "ABRIR ARQUIVO" no painel lateral nao fecha mais a Central de Duplicidades.
- A caixa de nomes parecidos so recebe visual de alerta quando existem nomes parecidos reais.
- Quando nao ha nomes parecidos, o bloco fica neutro e informa "Nenhum nome parecido encontrado."

### Upload

- O seletor foi renomeado para "ARQUIVOS DO ALUNO".
- O estado vazio e o progresso inicial passaram a falar em arquivos do aluno.
- Arquivos acima de 25 MB nao disparam mais confirmacao modal; continuam sendo enviados por upload session em blocos.
- Arquivo grande exibe os avisos:
  - "Arquivo grande — será enviado em blocos"
  - "Confira se o arquivo chegou com todas as páginas"
- Nome existente exibe:
  - "Nome já existe — será enviado com duplicidade — Confira na Central após envio"
- O botao "Limpar selecao" limpa sem confirmacao.
- A confirmacao para sair da Central sem enviar foi preservada.
- Os botoes pos-upload "Enviar mais arquivos" e "Fechar" foram preservados.

## Diagnostico profundo

- Nao foram removidas rotinas de Graph, historico, upload session, duplicidades ou mesclagem.
- Nao houve alteracao estrutural na geracao de nomes livres do upload; a protecao contra sobrescrita acidental continua ativa.
- As ocorrencias restantes de "PDF" pertencem a fluxos tecnicos de substituicao/mesclagem ou validacao de tipo de arquivo.
- O ajuste de fechamento da Central foi limitado ao listener global de clique, sem alterar a abertura ou renderizacao da Central.

## Arquivos alterados

- `arquivo-digital/index.html`
- `arquivo-digital/arquivo-digital.js`
- `arquivo-digital/arquivo-digital.css`
- `diagnosticos/relatorio-ultimas-correcoes-v1-painel-upload-duplicidades-2026-06-01.md`

## Validacoes previstas

- `node --check arquivo-digital/arquivo-digital.js`
- `node scripts/validar-arquivo-digital.mjs`
- `git diff --check`

## Resultado esperado para teste manual V1

- Abrir a Central de Duplicidades, abrir um arquivo pelo painel lateral e confirmar que a Central permanece aberta.
- Conferir que "Nome do arquivo" exibe o nome real com extensao e sufixos.
- Selecionar arquivo grande no upload e confirmar que nao ha modal de confirmacao antes do envio.
- Selecionar nome existente no upload e confirmar aviso visual antes do envio.
- Clicar "Limpar selecao" e confirmar limpeza imediata.
