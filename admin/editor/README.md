# Editor visual da Escola Iêda

O editor visual fica em `/admin/editor/` e é parte do Centro de Administração da escola.

## Objetivo do primeiro marco

A primeira versão edita **somente a página inicial**. Essa decisão é intencional: reduz risco, deixa a experiência simples para usuário leigo e evita transformar o painel em um construtor irrestrito de sites.

Publicações continuam sendo administradas pela tela estruturada de `/admin/`.

## Motor visual

- Projeto: `GrapesJS/grapesjs`
- Versão fixada: `0.22.13`
- Licença: BSD-3-Clause
- Runtime local: `vendor/grapes.min.js` + `vendor/grapes.min.css`

O site em produção não deve carregar GrapesJS por CDN.

Em 2026-08-19, os dois bundles foram fornecidos pelo usuário, validados localmente e incorporados à branch `feat/admin-visual-builder`.

Validação confirmada:

`grapes.min.js`
- tamanho: `1095002` bytes
- SHA-256: `c459a47bf7ff831e309b10aab4ce27c8d2d8280f62aa35dc6c1b7f776368f8c6`
- Git blob SHA: `7e6965661f682e20915b4489cbeb3f85ec8706df`
- `node --check`: aprovado

`grapes.min.css`
- tamanho: `60968` bytes
- SHA-256: `1edd206fb9e41c60d70c66cfdb2e79e2b9358df5c952333a8b5a6a5989f8c2d4`
- Git blob SHA: `62009a27142982215ecb7eb02f114eadf4e93841`

Os blobs do GitHub coincidem exatamente com os arquivos validados antes do upload. A vendorização não é mais uma pendência.

## Arquivos próprios

- `index.html`: shell simplificado do editor.
- `escola-editor.css`: interface visual da Escola Iêda.
- `escola-editor.js`: integração GrapesJS, GitHub, preview, upload e salvamento.
- `vendor/`: runtime local fixado do GrapesJS, licença e metadados de versão/hash.

## Como funciona

1. O editor carrega `../../index.html` sem executar os scripts da página dentro do canvas.
2. Textos, imagens e blocos podem ser selecionados e editados visualmente.
3. Cabeçalho e rodapé recebem proteção contra exclusão acidental.
4. A prévia é local e não grava nada.
5. Ao salvar, o editor monta o HTML completo novamente.
6. Campos antigos de `site-data/publicacoes-publicas.json > home` são sincronizados com a Home para manter compatibilidade com o renderizador público existente.
7. `index.html` e `site-data/publicacoes-publicas.json` são enviados no **mesmo commit Git**, usando Git Data API. Isso evita um estado parcial em que somente um dos dois arquivos seja atualizado.

## Imagens

O Asset Manager do GrapesJS envia imagens para:

`imagens/editor/`

Formatos aceitos pelo adaptador: JPG, PNG, WebP, GIF e SVG. Limite defensivo: 8 MB por imagem.

## GitHub

O token é informado pelo próprio usuário no navegador e pode ficar apenas na sessão ou ser lembrado localmente. Ele nunca deve aparecer em código, documentação, log ou commit.

`admin/github-safe-target.js` protege o desenvolvimento: fora de `escolaieda.com` e `www.escolaieda.com`, requisições GitHub destinadas a `main` são redirecionadas para `feat/admin-visual-builder`. Isso permite testar escrita sem alterar produção.

## Microsoft / Graph

O novo CMS não escreve no SharePoint. Entretanto, o login do ambiente existente foi comprovado com o escopo `Sites.ReadWrite.All`; esse escopo permanece temporariamente no código para não alterar consentimentos do Entra ID neste marco. A redução para leitura deve ser feita em uma etapa coordenada e testada separadamente.

## Próximo teste obrigatório

Agora que o runtime está local, a próxima barreira é funcional e visual, não de empacotamento. Antes de merge, validar em navegador real:

- `/admin/` desktop/celular;
- login Microsoft;
- Publicações na branch protegida;
- `/admin/editor/` carregando a Home;
- blocos, estilos, camadas, undo/redo e dispositivos;
- prévia sem escrita;
- salvamento Home + JSON na branch protegida;
- upload de imagem;
- atalhos Livro de Ponto, Arquivo Digital e Notas.

## Regras permanentes

- não reintroduzir VvvebJs;
- não usar Vercel, TinaCMS, TinaCloud ou PHP para fazer o editor funcionar;
- não usar CDN em runtime no candidato final;
- não atualizar GrapesJS automaticamente;
- qualquer atualização da biblioteca exige versão fixada e novo teste;
- não permitir edição de scripts da Home pelo usuário comum;
- não misturar edição visual da Home com os módulos internos (`arquivo-digital`, `notas`, `livro-ponto`);
- não ampliar para criação arbitrária de páginas antes de a Home ser validada por usuário leigo.

Consulte `../PROJETO_ADMIN_VISUAL.md`, `../AI_CONTEXT.md`, `../TESTES.md` e `../EXECUCAO_ADMIN_VISUAL.md`.
