# Escola Ieda MCPM

Repositorio do site publico e dos sistemas digitais da Escola Municipal Professora Ieda Alves de Oliveira MCPM.

O projeto e publicado pelo GitHub Pages no dominio `https://escolaieda.com/`. Ele reune a pagina inicial da escola, paginas institucionais, portais em teste, painel administrativo do Sistema Escola Ieda e o sistema interno Arquivo Digital Escolar.

## Visao Geral

- `index.html` e a home publica do site.
- `admin/` contem o Painel Administrativo do Sistema Escola Ieda.
- `site-data/` contem a fonte publica consumida pela home.
- `site-institucional/` concentra paginas publicas da escola, como professores e calendario escolar.
- `institucional/` e a area institucional/secretaria em teste.
- `portais/` guarda areas experimentais para aluno, professor e direcao.
- `arquivo-digital/` e uma aplicacao separada, sensivel, integrada ao Microsoft 365, SharePoint e Microsoft Graph.
- `scripts/` contem validadores e rotinas auxiliares.
- `AGENTS.md` preserva o contexto operacional detalhado do Arquivo Digital e nao deve ser apagado.

## Sistema Escola Ieda

O Sistema Escola Ieda usa SharePoint como base institucional do painel administrativo. As estruturas principais ja preparadas sao:

- `PUBLICACOES_SITE`
- `AVISOS_SITE`
- `BANNERS_SITE`
- `DESTAQUES_SITE`
- `ENQUETES_SITE`
- `CONFIGURACOES_PORTAL`
- `PREFERENCIAS_USUARIO`
- `SERVICOS_PAINEL`
- `LOGS_PORTAL`
- `MIDIAS_SITE`

## Painel Administrativo

O painel em `admin/` permite gerenciar publicacoes do site como um mini CMS escolar simples:

- criar, editar, duplicar, despublicar e excluir publicacoes;
- filtrar por busca, status, local e ordenacao;
- configurar secoes da pagina inicial, incluindo titulo, texto, visibilidade e formato das publicacoes no site;
- marcar publicacoes como rascunho, visivel no site, agendada ou expirada;
- escolher onde a publicacao aparece: secoes da home, Banner/topo ou Modal;
- enviar imagem, configurar link, texto do botao, periodo de exibicao, aparencia e prioridade;
- visualizar previa antes de publicar;
- manter uma biblioteca de imagens enviadas para reutilizacao nas publicacoes;
- manter base administrativa inicial para enquetes futuras.

O usuario acessa o login pelo painel em `/admin/`. O Entra ID usa a raiz `https://escolaieda.com/` como URL de retorno cadastrada; a home conclui o callback MSAL e volta automaticamente para `/admin/`. Isso evita depender de uma URL de redirect ainda nao cadastrada no aplicativo.

## Fonte Publica

O SharePoint e a fonte principal dos dados. O arquivo `site-data/publicacoes-publicas.json` e apenas uma fonte publica derivada para a home do GitHub Pages consumir sem login.

Ao sincronizar pelo painel, o JSON e reconstruido a partir do estado atual do SharePoint. Isso remove do site itens excluidos, rascunhos, publicacoes expiradas e publicacoes agendadas para o futuro.

Para atualizar o JSON publico pelo painel, e necessario configurar um token GitHub com permissao minima de conteudo restrita ao repositorio `mcpmieda/escolaieda`. O token e usado somente para publicar o arquivo derivado no GitHub Pages e fica registrado em `CONFIGURACOES_PORTAL` para que a Secretaria nao precise redigitar em toda sessao.

Se o token GitHub estiver ausente ou sem permissao, a publicacao fica salva no SharePoint, mas nao aparece no site ate que a fonte publica seja sincronizada com sucesso.

### Token GitHub do CMS

O painel usa a configuracao `githubPublicacoesToken` na lista `CONFIGURACOES_PORTAL`. Essa chave guarda o token usado para atualizar `site-data/publicacoes-publicas.json` via GitHub API.

Fluxo atual:

1. A Secretaria cria, edita, publica, despublica ou exclui uma publicacao no painel.
2. O painel salva a mudanca em `PUBLICACOES_SITE`.
3. O painel le novamente o estado atual do SharePoint.
4. O painel monta um JSON limpo somente com itens publicos validos.
5. O painel usa `githubPublicacoesToken` para gravar o JSON no repositorio.
6. O GitHub Pages passa a servir a fonte publica atualizada.

Todas as publicacoes usam esse mesmo fluxo. Para o usuario, a escolha principal e "Onde aparece"; categoria e tipo tecnico sao derivados automaticamente pelo painel para evitar combinacoes confusas. A secao "Destaques" substitui o antigo uso de um checkbox separado de destaque.

O painel sincroniza automaticamente depois de salvar, publicar, despublicar ou excluir. O botao "Sincronizar agora" fica apenas em Configuracoes como ferramenta de recuperacao, para reconstruir a fonte publica manualmente quando necessario.

Quando varias alteracoes sao feitas em sequencia, o painel agrupa a sincronizacao por alguns segundos antes de atualizar o GitHub. Isso reduz commits intermediarios e evita cancelamentos normais do GitHub Pages em commits antigos.

As imagens enviadas pelo painel sao validadas, redimensionadas e convertidas para WebP antes de serem publicadas em `imagens/publicacoes/`. O arquivo fica no proprio repositorio publico, evitando links do SharePoint que exigiriam autenticacao dos visitantes. A lista de imagens disponiveis para reutilizacao e registrada em `CONFIGURACOES_PORTAL/midiasConfig`.

O link do botao aceita apenas enderecos HTTP ou HTTPS e o painel exige um link quando houver texto de botao. As datas "Mostrar a partir de" e "Mostrar ate" controlam a janela de exibicao. A prioridade ordena os itens dentro da mesma secao: numeros menores aparecem primeiro e `0` deixa a publicacao na ordem normal.

Cuidados:

- o token deve ter permissao minima para conteudo do repositorio `mcpmieda/escolaieda`;
- o token nao deve ser colocado no codigo fonte;
- se o token expirar ou for revogado, a sincronizacao avisa erro no painel;
- em caso de duvida, verificar `CONFIGURACOES_PORTAL/githubPublicacoesToken` e clicar em "Sincronizar site".

## Home Publica

A home publica carrega `site-data/publicacoes-site.js`, que busca `site-data/publicacoes-publicas.json` com cache-busting simples e mantem fallback estatico caso a fonte publica falhe.

A pagina inicial e organizada por secoes configuraveis no painel. Cada secao pode ter titulo, texto, visibilidade e formato das publicacoes:

- `Blocos`: cards lado a lado, com maior espacamento;
- `Lista`: itens em uma coluna, melhor para muitos avisos ou documentos.
- `Faixa de destaque com indicadores`: painel azul para apresentar numeros institucionais em pequenos blocos. Cada indicador usa o formato `valor | descricao`, como `1990 | Fundacao`.

As secoes padrao sao Nossa Escola, Numeros institucionais, Informacoes, Avisos, Destaques, Documentos e Contato. O painel tambem permite adicionar novas secoes. Banner/topo e Modal continuam como locais especiais de publicacao.

O modal publico:

- pode ser fechado pelo botao, clique fora ou tecla `Esc`;
- mantem o foco de teclado dentro da janela enquanto estiver aberto;
- aparece uma vez por sessao para cada publicacao, evitando interromper o visitante repetidamente.

A home usa uma versao WebP otimizada da logo com fallback PNG. A biblioteca Microsoft de autenticacao so e carregada quando a pagina esta concluindo um retorno de login.

As paginas de professores, calendario, contato e area restrita permanecem preservadas.

## Arquivo Digital

`arquivo-digital/` e o sistema de gestao de documentos escolares em PDF. Ele possui login Microsoft, integracao com SharePoint/Graph, upload, historico, anotacoes, gavetas, lixeira, duplicidades, substituicao, mesclagem e validacoes automatizadas.

O crescimento do historico operacional e tratado por rotina segura de retencao em `scripts/retencao-historico-arquivo-digital-v1.ps1`. A rotina deve comecar por `-Mode DryRun`, gerar relatorios em `diagnosticos/` e, se aprovada, arquivar itens antigos em arquivo frio particionado antes de enviar somente esses itens de `HISTORICO_ACESSOS` para a Lixeira do SharePoint. A consulta do arquivo frio fica em `scripts/consultar-historico-frio-arquivo-digital-v1.ps1`. O guia esta em `scripts/USO-RETENCAO-HISTORICO-ARQUIVO-DIGITAL-V1.md`.

Essa pasta nao deve ser reorganizada junto com o site institucional. Qualquer alteracao nela deve seguir o `AGENTS.md` e rodar as validacoes proprias.

## Validacoes

Para conferir o estado geral:

```powershell
git status --short
git diff --check
node --check admin/admin.js
node --check site-data/publicacoes-site.js
```

Para conferir o Arquivo Digital, quando ele for alterado:

```powershell
node scripts/validar-arquivo-digital.mjs
node scripts/testes-regressao-arquivo-digital.mjs
node scripts/testes-utils-arquivo-digital.mjs
```

## Pendencias e Proximos Passos

- Ao iniciar uma nova conversa no Codex, ler este README e o estado atual do repositorio antes de alterar o sistema. Tratar as informacoes desta documentacao como continuidade das decisoes anteriores.
- Proximo passo planejado: criar previa ao vivo da pagina completa dentro do painel, com modos computador e celular, antes de publicar no SharePoint/GitHub.
- Continuar evoluindo o editor da pagina inicial como um construtor simples: secoes reutilizaveis, faixa de destaque com indicadores, ordenacao de secoes e modelos visuais sem expor opcoes tecnicas ao usuario leigo.
- Manter o token GitHub de menor permissao atualizado em `CONFIGURACOES_PORTAL`.
- Rodar "Sincronizar site" no painel quando precisar reconstruir o JSON publico a partir do SharePoint.
- Ativar votacao publica de enquetes em etapa futura.
- Melhorar editor visual da home conforme o uso real da Secretaria.

## Regras de Manutencao

- Nao apagar `AGENTS.md`.
- Nao mover ou alterar `arquivo-digital/` sem planejamento especifico.
- Preservar redirecionamentos publicos antigos quando uma pagina mudar de caminho.
- Evitar commitar arquivos temporarios, relatorios locais ou backups.
- Preferir alteracoes pequenas, testaveis e com `git diff --check` antes do commit.
