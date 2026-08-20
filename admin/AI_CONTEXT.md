# AI_CONTEXT — Centro de Administração Escola Iêda

## Estado atual

Projeto em desenvolvimento isolado na branch `feat/admin-visual-builder`.

PR de validação:

`#27 — Admin visual: GrapesJS para edição segura da Home`

Baseline seguro anterior ao marco:

`96e16d599d06768a0ab6a7a0ea807b94a838a168`

Não alterar ou mesclar `main` sem validação real e autorização explícita do usuário.

## Objetivo

Entregar um painel administrativo único, moderno e simples para usuário não técnico, evitando desenvolver um CMS artesanal recurso por recurso.

## Arquitetura aprovada

- `/admin/` = central administrativa.
- `/admin/editor/` = editor visual **da Home**, baseado em GrapesJS.
- `/admin/livro-ponto/` = Livro de Ponto já existente, apenas linkado diretamente.
- `/arquivo-digital/` e `/notas/` permanecem módulos independentes e não devem ser refatorados neste projeto.
- GitHub é a fonte de verdade para conteúdo público.
- Microsoft/Graph permanece para login e validação de acesso da Secretaria.
- SharePoint NÃO é mais CMS do site.

## Editor visual

Motor aprovado: GrapesJS.

Versão fixada deste marco: `0.22.13`.
Licença: BSD-3-Clause.

Runtime final esperado no próprio repositório:

- `admin/editor/vendor/grapes.min.js`
- `admin/editor/vendor/grapes.min.css`
- `admin/editor/vendor/GRAPESJS-LICENSE`
- `admin/editor/vendor/VERSION.txt`

### Estado do runtime

Já existem localmente:

- `GRAPESJS-LICENSE`;
- `VERSION.txt`.

Ainda faltam:

- `grapes.min.js`;
- `grapes.min.css`.

O workflow temporário de vendorização foi **removido**, porque não houve execução do GitHub Actions nem após abertura/reabertura do PR. Não restaurar esse workflow como se fosse uma solução já comprovada.

Não usar CDN em runtime no candidato final. Não introduzir Vercel, TinaCMS/TinaCloud, PHP, banco novo ou CMS hospedado externamente para contornar o empacotamento.

### Escopo deliberadamente reduzido

A primeira versão edita somente `index.html`.

Não oferecer criação arbitrária de novas páginas nesta fase. Só reconsiderar depois que a edição visual da Home estiver validada no uso real.

Cabeçalho e rodapé são protegidos contra exclusão acidental. Scripts da Home não são executados nem editados dentro do canvas.

## Compatibilidade Home + JSON

O renderizador público antigo ainda conhece `site-data/publicacoes-publicas.json > home` e pode sobrescrever alguns textos conhecidos da Home.

Por isso, ao salvar visualmente, o adaptador:

1. monta o novo `index.html`;
2. extrai os campos conhecidos da Home;
3. atualiza o objeto `home` do JSON para manter compatibilidade;
4. grava `index.html` e o JSON no **mesmo commit Git**, usando Git Data API.

Essa estratégia evita salvamento parcial.

Blocos novos que não usam os atributos legados da Home ficam somente no HTML e não dependem do JSON.

## Publicações

Fonte pública existente:

`site-data/publicacoes-publicas.json`

Renderizador existente:

`site-data/publicacoes-site.js`

Fluxo novo:

`admin → GitHub → JSON público → site`

Não restaurar `SharePoint Lists → sincronização → GitHub` sem decisão explícita.

## GitHub

Repositório: `mcpmieda/escolaieda`.
Branch de produção: `main`.
Branch de desenvolvimento: `feat/admin-visual-builder`.

Token:

- nunca versionar;
- sessão por padrão;
- `localStorage` somente se usuário optar por lembrar;
- usar token restrito ao repositório e com o menor privilégio compatível com escrita de conteúdo.

Imagens do editor: `imagens/editor/`.
Imagens de publicações: `imagens/publicacoes/`.

### Proteção de escrita em testes

Arquivo obrigatório neste marco:

`admin/github-safe-target.js`

Regra:

- em `escolaieda.com` e `www.escolaieda.com`, chamadas do admin podem continuar usando `main`;
- em qualquer outro hostname, referências GitHub deste repositório que apontariam para `main` são redirecionadas para `feat/admin-visual-builder`;
- Microsoft Graph e outras origens não são alterados.

Essa proteção foi integrada tanto ao `/admin/` quanto ao `/admin/editor/`.

Teste isolado: **5/5 aprovado** para Contents ref, Git refs de leitura/escrita, corpo `branch: main` e preservação de Microsoft Graph.

Não remover essa proteção durante testes de preview/local.

## Microsoft / Graph

O novo CMS não escreve no SharePoint.

A leitura de `DOCUMENTOS_ATIVOS` continua servindo como gate de autorização da Secretaria.

O ambiente funcional anterior foi validado com `Sites.ReadWrite.All`. A tentativa de reduzir o código para `Sites.Read.All` NÃO deve ser considerada concluída até a App Registration do Entra ID ser revisada em conjunto. Preservar compatibilidade de login primeiro; depois reduzir escopo de forma coordenada.

## Itens removidos deste painel

- provisionamento de listas SharePoint;
- botão “Preparar SharePoint”;
- publicações armazenadas em listas SharePoint;
- formulário customizado da Home;
- enquetes inacabadas;
- prévia separada `admin-preview.js`;
- configurações técnicas expostas ao usuário comum;
- VvvebJs;
- criação arbitrária de páginas no primeiro marco.

## Página institucional

`institucional/index.html` era somente página de teste e foi removida na branch.

NÃO remover `site-institucional/` automaticamente: contém conteúdo real/legado e exige auditoria própria.

## Vercel

Não existe dependência Vercel na arquitetura nova.

Foi detectado um check externo residual `Vercel` associado a commits do repositório. A equipe Vercel conectada retorna zero projetos acessíveis. Não usar esse deployment/check para validar funcionamento obrigatório e não reintroduzir Vercel como solução do editor.

## Branch temporária neutralizada

A branch `temp-should-not-create` foi criada acidentalmente durante uso do conector e imediatamente movida para o baseline seguro `96e16d...`.

O conector não oferece exclusão física de branch. Não usar essa branch.

## UI

Diretrizes permanentes:

- interface elegante, limpa e moderna;
- linguagem simples;
- ações frequentes visíveis;
- detalhes técnicos fora do caminho principal;
- responsiva;
- foco de teclado visível;
- respeitar `prefers-reduced-motion`;
- não depender de hover para ação essencial;
- evitar `innerHTML` com dados externos não confiáveis;
- mensagens de erro amigáveis;
- não expor script/código para usuário comum.

## Desenvolvimento

Fluxo obrigatório:

1. manter branch isolada;
2. revisar somente escopo alterado e dependências diretas;
3. preservar módulos sensíveis;
4. validar diff contra o baseline;
5. testar no navegador real antes de merge;
6. atualizar `admin/PROJETO_ADMIN_VISUAL.md` e `admin/EXECUCAO_ADMIN_VISUAL.md`;
7. manter `admin/TESTES.md` coerente com o comportamento real;
8. não declarar runtime GrapesJS pronto enquanto `grapes.min.js` e `grapes.min.css` não estiverem versionados;
9. manter PR #27 como draft até aprovação real;
10. nunca fazer merge sem autorização explícita do usuário.

## Regra de aceite

Não considerar pronto apenas porque o código existe. O marco precisa comprovar no navegador:

- login Microsoft;
- acesso da Secretaria;
- painel em desktop e celular;
- publicação direta no GitHub em branch segura durante teste;
- upload de imagem;
- renderização pública;
- editor visual abrindo a Home;
- texto/imagem/bloco editável;
- desfazer/refazer;
- modos desktop/tablet/celular;
- prévia sem escrita;
- salvamento atômico Home + JSON;
- recarregamento preservando a alteração;
- Livro de Ponto abrindo corretamente;
- ausência de regressão em Arquivo Digital e Notas.
