# AI_CONTEXT — Centro de Administração Escola Iêda

## Estado atual

Projeto em desenvolvimento isolado na branch `feat/admin-visual-builder`.

Baseline seguro anterior ao marco:

`96e16d599d06768a0ab6a7a0ea807b94a838a168`

PR draft: `#27`.

Não alterar `main` sem validação real e autorização explícita do usuário.

## Objetivo

Entregar um painel administrativo único, moderno e simples para usuário não técnico, evitando desenvolver um CMS artesanal recurso por recurso.

## Arquitetura aprovada

- `/admin/` = central administrativa.
- `/admin/editor/` = editor visual **da Home**, baseado em GrapesJS vendorizado.
- `/admin/livro-ponto/` = Livro de Ponto já existente, apenas linkado diretamente.
- `/arquivo-digital/` e `/notas/` permanecem módulos independentes e não devem ser refatorados neste projeto.
- GitHub é a fonte de verdade para conteúdo público.
- Microsoft/Graph permanece para login e validação de acesso da Secretaria.
- SharePoint NÃO é mais CMS do site.

## Editor visual

Motor aprovado: GrapesJS.

Versão fixada deste marco: `0.22.13`.
Licença: BSD-3-Clause.
Runtime final local:

- `admin/editor/vendor/grapes.min.js`
- `admin/editor/vendor/grapes.min.css`

O runtime deve ficar dentro do próprio repositório. Não usar CDN em runtime, Vercel, TinaCMS/TinaCloud, PHP, banco novo ou CMS hospedado externamente.

### Bundles validados

Em 2026-08-19 o usuário forneceu os dois bundles pelo celular.

`grapes.min.js`
- tamanho: `1095002` bytes
- SHA-256: `c459a47bf7ff831e309b10aab4ce27c8d2d8280f62aa35dc6c1b7f776368f8c6`
- `node --check`: aprovado

`grapes.min.css`
- tamanho: `60968` bytes
- SHA-256: `1edd206fb9e41c60d70c66cfdb2e79e2b9358df5c952333a8b5a6a5989f8c2d4`

A conexão GitHub desta sessão não aceita anexar arquivos locais grandes ao repositório. Não criar workaround arquitetural permanente por causa dessa limitação. Antes de considerar o editor materializado, confirmar que os dois arquivos presentes na branch batem exatamente com os hashes acima.

### Escopo deliberadamente reduzido

A primeira versão edita somente `index.html`.

Não oferecer criação arbitrária de novas páginas nesta fase. Só reconsiderar depois que a edição visual da Home estiver validada no uso real.

Cabeçalho e rodapé são protegidos contra exclusão acidental. Scripts da Home não são executados nem editados dentro do canvas.

## Compatibilidade Home + JSON

O renderizador público antigo ainda conhece `site-data/publicacoes-publicas.json > home` e pode sobrescrever alguns textos conhecidos da Home.

Por isso, ao salvar visualmente, o adaptador:

1. monta o novo `index.html`;
2. extrai os campos conhecidos da Home;
3. atualiza o objeto `home` do JSON;
4. grava `index.html` e o JSON no **mesmo commit Git**, usando Git Data API.

A Home real foi verificada e possui os seletores esperados, incluindo `[data-home-titulo]`, `[data-home-subtitulo]`, `[data-home-missao]`, `#topbar`, `<footer>` e os atributos das seções legadas.

## Publicações

Fonte pública existente:

`site-data/publicacoes-publicas.json`

Renderizador existente:

`site-data/publicacoes-site.js`

Fluxo novo:

`admin → GitHub → JSON público → site`

O contrato da nova tela foi comparado estaticamente com o renderizador público e é compatível com os campos utilizados para visibilidade, período, local, estilo, conteúdo, imagem e link.

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

### Proteção de teste

`admin/github-safe-target.js` redireciona chamadas GitHub destinadas a `main` para `feat/admin-visual-builder` quando o hostname não é `escolaieda.com` ou `www.escolaieda.com`.

Teste isolado: 5/5 cenários aprovados, incluindo confirmação de que chamadas Microsoft Graph não são alteradas.

## Microsoft / Graph

O novo CMS não escreve no SharePoint.

A leitura de `DOCUMENTOS_ATIVOS` continua servindo como gate de autorização da Secretaria.

O ambiente funcional anterior foi validado com `Sites.ReadWrite.All`. Durante a revisão anterior aos testes, o código foi restaurado para esse escopo para preservar o consentimento já conhecido. A futura redução para leitura deve ser feita em etapa separada, coordenando código, App Registration e consentimento do Entra ID.

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

Existe um check externo residual `Vercel` associado aos commits. A conta Vercel conectada nesta sessão não apresenta o projeto relacionado e o deployment indicado pelo check não é acessível por essa conexão. Tratar como limpeza administrativa separada e não como parte do produto.

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
8. não declarar runtime GrapesJS pronto enquanto `admin/editor/vendor/grapes.min.js` e `.css` não estiverem fisicamente na branch e validados pelos hashes.

## Regra de aceite

Não considerar pronto apenas porque o código existe. O marco precisa comprovar no navegador:

- login Microsoft;
- acesso da Secretaria;
- painel em desktop e celular;
- publicação direta no GitHub;
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
