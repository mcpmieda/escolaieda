# RELATORIO - GAVETAS COM SHAREPOINT COMO FONTE OFICIAL - 2026-05-27

## Conexao PnP

Conexao realizada com sucesso:

- URL: `https://eduieda.sharepoint.com/sites/ARQUIVODIGITAL`
- Confirmacao `Get-PnPContext`: `https://eduieda.sharepoint.com/sites/arquivodigital`

Estado Git inicial:

- `git status --short`: limpo
- HEAD inicial: `d7642a6 (HEAD -> main, origin/main, origin/HEAD) Ajustar responsividade e compactacao final`
- `git tag --points-at HEAD`: sem tag

## Estado inicial da coluna GAVETA

Biblioteca:

- `DOCUMENTOS_ATIVOS`

Coluna:

- Title: `GAVETA`
- InternalName: `GAVETA`
- TypeAsString: `Choice`
- Hidden: `False`

Opcoes encontradas antes da organizacao:

- `Gaveta 1` ate `Gaveta 34`
- `Gaveta 36`
- `Gaveta 35`

Nao foi necessario criar a coluna, porque ela ja existia e era Choice.

## Normalizacao no SharePoint

Foi padronizada a lista real de opcoes da coluna Choice para remover risco de ordem inconsistente e duplicatas futuras.

Opcoes depois:

- `Gaveta 1`
- `Gaveta 2`
- `Gaveta 3`
- `Gaveta 4`
- `Gaveta 5`
- `Gaveta 6`
- `Gaveta 7`
- `Gaveta 8`
- `Gaveta 9`
- `Gaveta 10`
- `Gaveta 11`
- `Gaveta 12`
- `Gaveta 13`
- `Gaveta 14`
- `Gaveta 15`
- `Gaveta 16`
- `Gaveta 17`
- `Gaveta 18`
- `Gaveta 19`
- `Gaveta 20`
- `Gaveta 21`
- `Gaveta 22`
- `Gaveta 23`
- `Gaveta 24`
- `Gaveta 25`
- `Gaveta 26`
- `Gaveta 27`
- `Gaveta 28`
- `Gaveta 29`
- `Gaveta 30`
- `Gaveta 31`
- `Gaveta 32`
- `Gaveta 33`
- `Gaveta 34`
- `Gaveta 35`
- `Gaveta 36`

## Documentos atualizados

Diagnostico de documentos via PnP:

- valores quebrados como `Gaveta35`, `gaveta35`, `GAVETA35` ou `gaveta  35`: `0`
- documentos atualizados nesta etapa: `0`

Distribuicao encontrada antes:

- campo `GAVETA` vazio: 311 documentos
- `Gaveta 1`: 2
- `Gaveta 3`: 1
- `Gaveta 4`: 16
- `Gaveta 6`: 6
- `Gaveta 8`: 4
- `Gaveta 12`: 1
- `Gaveta 14`: 19
- `Gaveta 17`: 6
- `Gaveta 18`: 1
- `Gaveta 21`: 118
- `Gaveta 34`: 5

Nenhum PDF foi apagado, movido ou renomeado.

## Alteracoes no codigo

Arquivo alterado:

- `arquivo-digital/index.html`

Backup local criado:

- `backups_locais/index_antes_gavetas_sharepoint_fonte_oficial_20260527.html`

Alteracoes principais:

- adicionada variavel `erroOpcoesGavetaSharePoint`;
- `obterOpcoesGavetas()` passa a usar somente `opcoesGavetaSharePoint` quando a leitura do SharePoint funciona;
- fallback `Gaveta 1` ate `Gaveta 34` continua existindo apenas para o sistema nao quebrar;
- em fallback, cadastro/edicao/exclusao ficam desabilitados;
- adicionada mensagem: `As gavetas reais do SharePoint não foram carregadas. Edição indisponível.`;
- removida a regra de bloqueio das Gavetas 1 a 34;
- removidas as funcoes antigas `numeroGavetaPadrao()` e `ehGavetaPadrao()`;
- removido o selo/trava `Padrão`;
- a lista da Central de Configuracoes passa a mostrar selo neutro `Cadastrada`;
- mantida normalizacao de nomes como `gaveta35` para `Gaveta 35`;
- mantidos os fluxos de atualizar documentos, atualizar coluna Choice, recarregar opcoes e atualizar interfaces.

## Regra final de fallback

Regra implementada:

1. Se a coluna Choice `GAVETA` carregar do SharePoint, o site usa somente as opcoes reais dessa coluna.
2. Se a leitura falhar, o site usa fallback `Gaveta 1` ate `Gaveta 34` apenas para nao quebrar.
3. Quando estiver em fallback, cadastro, edicao e exclusao de gavetas ficam indisponiveis.
4. Se uma gaveta for excluida no SharePoint e a leitura funcionar, ela nao deve reaparecer por causa do fallback.

## Como editar funciona

Ao editar qualquer gaveta real carregada:

- pede novo nome;
- normaliza o nome;
- impede duplicata;
- conta documentos vinculados;
- mostra confirmacao informando que documentos serao atualizados e nenhum PDF sera apagado;
- atualiza documentos que usam a gaveta antiga;
- atualiza a opcao da coluna Choice `GAVETA`;
- tenta registrar historico `ALTEROU_GAVETA`;
- recarrega opcoes reais da coluna;
- atualiza Central de Configuracoes, Central de Upload, Alterar gaveta no painel e guia Gavetas.

Agora isso tambem vale para:

- `Gaveta 1`
- `Gaveta 2`
- ...
- `Gaveta 34`

## Como excluir funciona

Ao excluir qualquer gaveta real carregada:

- conta documentos vinculados em ativos e Lixeira;
- mostra confirmacao forte;
- exige digitar exatamente o nome da gaveta;
- informa que nenhum PDF sera apagado;
- limpa o campo `GAVETA` dos documentos vinculados;
- remove a opcao da coluna Choice `GAVETA`;
- tenta registrar historico `ALTEROU_GAVETA`;
- recarrega opcoes reais da coluna;
- atualiza a interface.

`Gaveta nao informada` continua sendo apenas exibicao visual para campo `GAVETA` vazio. Nao foi criada opcao Choice com esse nome.

## Validacoes realizadas

PnP/SharePoint:

- conexao PnP: OK
- coluna `GAVETA` existe: OK
- `InternalName` = `GAVETA`: OK
- tipo `Choice`: OK
- `Hidden` = `False`: OK
- opcoes reais listadas: OK
- opcoes reais padronizadas: OK
- duplicatas quebradas na coluna: nao encontradas
- valores quebrados em documentos: `0`

Tecnicas locais:

- `git diff --check`: OK
- sintaxe JS como modulo: OK
- busca textual confirmou remocao de `Padrão`, `ehGavetaPadrao` e `numeroGavetaPadrao`.

## Pendencias

Validacao manual no site publicado ainda pendente:

- cadastrar nova gaveta;
- atualizar pagina e confirmar persistencia;
- editar uma gaveta de teste, inclusive podendo testar `Gaveta 1` se desejado;
- confirmar alteracao no SharePoint;
- confirmar documentos vinculados atualizados;
- excluir gaveta de teste;
- confirmar que nenhum PDF foi apagado;
- confirmar documentos como `Gaveta nao informada`;
- confirmar Central de Upload, Alterar gaveta no painel e guia Gavetas usando a lista real;
- confirmar login, upload, mesclar, substituir, lixeira/restaurar e duplicidades.

## Commit

Commit previsto:

- `Refatorar gavetas com SharePoint como fonte oficial`

Tag:

- nenhuma tag criada.
