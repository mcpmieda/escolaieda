# AI_CONTEXT — Centro de Administração Escola Iêda

## Estado atual

Projeto em desenvolvimento isolado na branch `feat/admin-visual-builder`.

Baseline seguro anterior ao marco:

`96e16d599d06768a0ab6a7a0ea807b94a838a168`

Não alterar `main` sem validação real e autorização explícita do usuário.

## Objetivo

Entregar um painel administrativo único, moderno e simples para usuário não técnico, evitando desenvolver um CMS artesanal recurso por recurso.

## Arquitetura aprovada

- `/admin/` = central administrativa.
- `/admin/editor/` = construtor visual do site baseado em VvvebJs vendorizado.
- `/admin/livro-ponto/` = Livro de Ponto já existente, apenas linkado diretamente.
- `/arquivo-digital/` e `/notas/` permanecem módulos independentes e não devem ser refatorados neste projeto.
- GitHub é a fonte de verdade para conteúdo público e páginas.
- Microsoft/Graph permanece apenas para login e validação de acesso da Secretaria.
- SharePoint NÃO é mais CMS do site.

## VvvebJs

Upstream: `givanz/VvvebJs`.
Licença: Apache-2.0.
Versão fixada obrigatoriamente:

`1acbab7ebfe3e7b004f1f18c039d26550fc04bd8`

Nunca atualizar automaticamente para `master`.

O runtime deve ficar dentro do próprio repositório em `admin/editor/`. Não introduzir Vercel, TinaCMS/TinaCloud, PHP, banco de dados ou CMS hospedado externamente.

## Publicações

Fonte pública existente:

`site-data/publicacoes-publicas.json`

Renderizador existente:

`site-data/publicacoes-site.js`

Novo fluxo:

`admin → GitHub Contents API → JSON público → site`

Não restaurar o fluxo `SharePoint Lists → sincronização → GitHub` sem decisão explícita.

## GitHub

Repositório fixo: `mcpmieda/escolaieda`.
Branch de produção: `main`.

Token:

- nunca versionar;
- sessão por padrão;
- `localStorage` somente se usuário optar por lembrar;
- token de menor privilégio possível, restrito ao repositório.

## Páginas criadas pelo editor

- Home: `index.html`.
- Novas páginas gerenciadas pelo construtor: `paginas/<slug>/index.html`.
- Imagens do editor: `imagens/editor/`.
- Imagens de publicações: `imagens/publicacoes/`.

Não permitir que o editor ofereça edição de módulos internos como `arquivo-digital/`, `notas/`, `admin/livro-ponto/` ou outros sistemas operacionais sem uma decisão separada.

## Itens removidos deste painel

- provisionamento de listas SharePoint;
- botão “Preparar SharePoint”;
- publicações armazenadas em listas SharePoint;
- formulário customizado da Home;
- enquetes inacabadas;
- prévia separada `admin-preview.js`;
- configurações técnicas expostas ao usuário comum.

## Página institucional

`institucional/index.html` era somente uma página de teste e deve ser removida.

NÃO remover `site-institucional/` automaticamente: contém conteúdo real/legado e precisa de auditoria própria.

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
- evitar `innerHTML` com dados externos;
- mensagens de erro amigáveis.

## Desenvolvimento

Fluxo obrigatório:

1. manter branch isolada;
2. revisar somente o escopo alterado e dependências diretas;
3. preservar módulos sensíveis;
4. validar diff contra o baseline;
5. testar no navegador real antes de qualquer merge;
6. documentar decisões em `admin/PROJETO_ADMIN_VISUAL.md`;
7. atualizar `admin/TESTES.md` quando o comportamento mudar.

## Regra de aceite

Não considerar pronto apenas porque compila. O marco precisa comprovar no navegador:

- login;
- acesso da Secretaria;
- publicação direta no GitHub;
- upload de imagem;
- renderização no site;
- editor visual abrindo a Home;
- edição e salvamento da Home;
- criação de página;
- uso em celular;
- Livro de Ponto abrindo corretamente.
