# RELATORIO FASE 4 - CENTRAL DE UPLOAD - 2026-05-27

## Escopo executado

Arquivo alterado:

- `arquivo-digital/index.html`

Backup criado antes da alteracao:

- `backups_locais/index_antes_fase4_upload_ux_20260527.html`

## Estado encontrado

A Central de Upload ja tinha parte importante da Fase 4 implementada:

- apos envio 100% concluido sem erros, fecha automaticamente com `descartarCentralUpload()`;
- se houver erro em algum arquivo, nao fecha automaticamente;
- nomes ja existentes nos documentos ativos eram marcados com aviso discreto;
- o upload ja usava `gerarNomeLivreUploadPdfComOcupados(...)`, sem bloquear envio.

## Alteracao realizada

Foi ajustada a marcacao previa de nomes repetidos na lista de arquivos selecionados.

Antes:

- o aviso `Nome já existe — será enviado com nome livre` aparecia quando o nome ja existia nos documentos ativos carregados.

Agora:

- o aviso tambem aparece quando ha nomes repetidos dentro da mesma selecao de upload;
- a verificacao usa somente dados ja carregados e os arquivos selecionados;
- nao consulta SharePoint durante a renderizacao da lista;
- nao bloqueia o upload.

Funcoes envolvidas:

- criada `analisarNomesSelecionadosUpload()`;
- `renderizarListaCentralUpload()` passou a usar essa analise.

## Comportamentos preservados

- Upload interno para SharePoint.
- Geracao de nome livre pelo fluxo existente.
- Registro de gaveta.
- Registro de historico.
- Atualizacao de documentos, dashboard e Central de Duplicidades apos upload.
- Fechamento automatico somente quando nao ha erro.
- Central permanece aberta quando algum arquivo falha.

## Areas preservadas

- Login/MSAL.
- `clientId`, `tenantId`, `siteId` e IDs das listas.
- Permissoes SharePoint/Graph.
- Mesclar, substituir, lixeira/restaurar.
- Anotacoes.
- Historico individual.
- Logica de duplicidades.

## Validacoes

- `git diff --check`: OK.
- Sintaxe JS como modulo com `node --experimental-vm-modules`: OK.
- Busca textual confirmou:
  - `gerarNomeLivreUploadPdfComOcupados(...)` preservado.
  - `ocupados.add(...)` preservado para evitar conflito na mesma leva.
  - `uploadConcluidoComSucesso = erros.length === 0` preservado.
  - `uploadTeveErro = erros.length > 0` preservado.
  - fechamento automatico condicionado a `!erros.length`.
  - aviso `Nome já existe — será enviado com nome livre` preservado.

## Observacao de teste real

Nao foi executado upload real pelo terminal, porque o fluxo depende de sessao Microsoft/SharePoint no navegador.

Teste recomendado no site publicado:

- upload de arquivo com nome novo;
- upload de arquivo com nome igual a um documento ativo;
- upload de dois arquivos selecionados com o mesmo nome;
- caso com falha parcial para confirmar que a Central permanece aberta.

## Resultado

Fase 4 concluida com ajuste localizado na usabilidade da Central de Upload.

Commit sugerido:

- `Ajustar usabilidade da Central de Upload`
