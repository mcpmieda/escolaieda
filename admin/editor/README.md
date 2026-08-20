# Editor visual da Escola Iêda

O editor visual fica em `/admin/editor/` e é parte do Centro de Administração da escola.

## Objetivo do primeiro marco

A primeira versão edita **somente a página inicial**. Essa decisão é intencional: reduz risco, deixa a experiência simples para usuário leigo e evita transformar o painel em um construtor irrestrito de sites.

Publicações continuam sendo administradas pela tela estruturada de `/admin/`.

## Motor visual

- Projeto: `GrapesJS/grapesjs`
- Versão fixada: `0.22.13`
- Licença: BSD-3-Clause
- Runtime final esperado: `vendor/grapes.min.js` + `vendor/grapes.min.css`

O candidato final não deve carregar GrapesJS por CDN em runtime.

### Estado atual do runtime

Já versionados:

- `vendor/GRAPESJS-LICENSE`;
- `vendor/VERSION.txt`.

Ainda pendentes:

- `vendor/grapes.min.js`;
- `vendor/grapes.min.css`.

A tentativa de materializar esses arquivos por GitHub Actions não executou no PR e o workflow temporário foi removido. Portanto, **não declarar o editor executável ou aprovado enquanto os dois bundles locais não existirem**.

## Arquivos próprios

- `index.html`: shell simplificado do editor.
- `escola-editor.css`: interface visual da Escola Iêda.
- `escola-editor.js`: integração GrapesJS, GitHub, preview, upload e salvamento.
- `../github-safe-target.js`: proteção para testes fora da produção.
- `vendor/`: runtime e licença locais do GrapesJS.

## Como funciona

1. O editor carrega `../../index.html` sem executar os scripts da página dentro do canvas.
2. Textos, imagens e blocos podem ser selecionados e editados visualmente.
3. Cabeçalho e rodapé recebem proteção contra exclusão acidental.
4. A prévia é local e não grava nada.
5. Ao salvar, o editor monta o HTML completo novamente.
6. Campos antigos de `site-data/publicacoes-publicas.json > home` são sincronizados com a Home para manter compatibilidade com o renderizador público existente.
7. `index.html` e `site-data/publicacoes-publicas.json` são enviados no **mesmo commit Git**, usando Git Data API.

## Imagens

O Asset Manager do GrapesJS envia imagens para:

`imagens/editor/`

Formatos aceitos pelo adaptador: JPG, PNG, WebP, GIF e SVG. Limite defensivo: 8 MB por imagem.

## GitHub

O token é informado pelo próprio usuário no navegador e pode ficar apenas na sessão ou ser lembrado localmente. Ele nunca deve aparecer em código, documentação, log ou commit.

### Alvo de gravação

O código de produção continua concebido para `main`, porém `admin/github-safe-target.js` protege os testes:

- em `escolaieda.com` e `www.escolaieda.com`, as chamadas mantêm o alvo de produção;
- em qualquer outro hostname, chamadas GitHub deste repositório que apontariam para `main` são redirecionadas para `feat/admin-visual-builder`.

Essa camada é carregada antes de `escola-editor.js` e teve **5/5 casos isolados aprovados**.

Mesmo assim, o teste real com token deve confirmar no GitHub que a gravação caiu na branch correta antes de qualquer teste destrutivo/mais amplo.

## Regras permanentes

- não reintroduzir VvvebJs;
- não usar Vercel, TinaCMS, TinaCloud ou PHP para fazer o editor funcionar;
- não usar CDN em runtime no candidato final;
- não atualizar GrapesJS automaticamente;
- qualquer atualização da biblioteca exige versão fixada e novo teste;
- não permitir edição de scripts da Home pelo usuário comum;
- não misturar edição visual da Home com os módulos internos (`arquivo-digital`, `notas`, `livro-ponto`);
- não ampliar para criação arbitrária de páginas antes de a Home ser validada por usuário leigo;
- manter a proteção `github-safe-target.js` durante previews e testes fora do domínio oficial;
- não fazer merge do PR #27 sem autorização explícita do usuário.

Consulte `../PROJETO_ADMIN_VISUAL.md`, `../AI_CONTEXT.md`, `../TESTES.md` e `../EXECUCAO_ADMIN_VISUAL.md`.
