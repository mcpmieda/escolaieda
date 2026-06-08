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
- marcar publicacoes como rascunho, publicado, destaque, agendado ou expirado;
- escolher local de exibicao na home, como Informacoes, Avisos, Destaques, Banner, Documentos, Calendario, Rodape e Modal;
- configurar imagem, link, botao, icone, estilo, ordem e fixacao;
- visualizar previa antes de publicar;
- editar textos e visibilidade basica da pagina inicial;
- cadastrar URLs de midias para uso nas publicacoes;
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

Todos os tipos e locais configurados em uma publicacao usam esse mesmo fluxo. Ou seja: card simples, banner, aviso urgente, link/documento, destaque, calendario, rodape e modal entram no JSON publico quando estiverem publicados e validos.

O painel sincroniza automaticamente depois de salvar, publicar, despublicar ou excluir. O botao "Sincronizar agora" fica apenas em Configuracoes como ferramenta de recuperacao, para reconstruir a fonte publica manualmente quando necessario.

Quando varias alteracoes sao feitas em sequencia, o painel agrupa a sincronizacao por alguns segundos antes de atualizar o GitHub. Isso reduz commits intermediarios e evita cancelamentos normais do GitHub Pages em commits antigos.

Cuidados:

- o token deve ter permissao minima para conteudo do repositorio `mcpmieda/escolaieda`;
- o token nao deve ser colocado no codigo fonte;
- se o token expirar ou for revogado, a sincronizacao avisa erro no painel;
- em caso de duvida, verificar `CONFIGURACOES_PORTAL/githubPublicacoesToken` e clicar em "Sincronizar site".

## Home Publica

A home publica carrega `site-data/publicacoes-site.js`, que busca `site-data/publicacoes-publicas.json` com cache-busting simples e mantem fallback estatico caso a fonte publica falhe.

A pagina inicial suporta conteudos gerenciaveis em:

- banner/topo;
- Informacoes;
- Avisos;
- Destaques;
- Documentos;
- Calendario;
- Rodape;
- Modal/aviso importante;
- textos principais e visibilidade de blocos basicos.

As paginas de professores, calendario, contato e area restrita permanecem preservadas.

## Arquivo Digital

`arquivo-digital/` e o sistema de gestao de documentos escolares em PDF. Ele possui login Microsoft, integracao com SharePoint/Graph, upload, historico, anotacoes, gavetas, lixeira, duplicidades, substituicao, mesclagem e validacoes automatizadas.

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

- Manter o token GitHub de menor permissao atualizado em `CONFIGURACOES_PORTAL`.
- Rodar "Sincronizar site" no painel quando precisar reconstruir o JSON publico a partir do SharePoint.
- Evoluir `MIDIAS_SITE` para upload direto de imagens quando a politica de armazenamento estiver definida.
- Ativar votacao publica de enquetes em etapa futura.
- Melhorar editor visual da home conforme o uso real da Secretaria.

## Regras de Manutencao

- Nao apagar `AGENTS.md`.
- Nao mover ou alterar `arquivo-digital/` sem planejamento especifico.
- Preservar redirecionamentos publicos antigos quando uma pagina mudar de caminho.
- Evitar commitar arquivos temporarios, relatorios locais ou backups.
- Preferir alteracoes pequenas, testaveis e com `git diff --check` antes do commit.
