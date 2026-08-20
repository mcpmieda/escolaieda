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
- `escola-editor.js`: integração GrapesJS, GitHub, prévia e salvamento.
- `vendor/`: runtime local fixado do GrapesJS, licença e metadados de versão/hash.

## Como funciona

1. O editor carrega `../../index.html` sem executar os scripts da página dentro do canvas.
2. Textos e blocos podem ser selecionados e editados visualmente.
3. Imagens existentes permanecem visíveis, mas a troca de imagem foi retirada da V1.
4. Cabeçalho e rodapé recebem proteção contra exclusão acidental.
5. A prévia é local e não grava nada.
6. Ao salvar, o editor preserva o HTML canônico e atualiza o conteúdo visual da Home.
7. Campos antigos de `site-data/publicacoes-publicas.json > home` são sincronizados com a Home para manter compatibilidade com o renderizador público existente.
8. `index.html` e `site-data/publicacoes-publicas.json` são enviados no **mesmo commit Git**, usando Git Data API. Isso evita um estado parcial em que somente um dos dois arquivos seja atualizado.

## Imagens na V1

O bloco **Imagem** e a troca de imagens existentes foram retirados da primeira versão do editor visual.

Durante os testes em navegador real, o envio físico do arquivo para `imagens/editor/` funcionou, mas a imagem escolhida não permaneceu associada ao bloco após salvar e recarregar. Como esse refinamento estava consumindo esforço desproporcional ao valor do primeiro marco, o recurso foi retirado da interface em vez de ser mantido parcialmente funcional.

Os arquivos usados apenas nesses testes foram removidos da branch.

Isso **não afeta imagens de Publicações**. O formulário estruturado de `/admin/` possui fluxo independente para imagem de aviso/comunicado em `imagens/publicacoes/` e deve ser testado separadamente.

## GitHub

O token é informado pelo próprio usuário no navegador e pode ficar apenas na sessão ou ser lembrado localmente. Ele nunca deve aparecer em código, documentação, log ou commit.

`admin/github-safe-target.js` protege o desenvolvimento: fora de `escolaieda.com` e `www.escolaieda.com`, requisições GitHub destinadas a `main` são redirecionadas para `feat/admin-visual-builder`. Isso permite testar escrita sem alterar produção.

## Microsoft / Graph

O novo CMS não escreve no SharePoint. Entretanto, o login do ambiente existente foi comprovado anteriormente com o escopo `Sites.ReadWrite.All`; esse escopo permanece temporariamente no código para não alterar consentimentos do Entra ID neste marco. A redução para leitura deve ser feita em uma etapa coordenada e testada separadamente.

No preview Vercel, o fluxo chegou ao Microsoft Entra, mas o retorno foi bloqueado por `AADSTS50011` porque o domínio temporário não está cadastrado como redirect URI. Por decisão do usuário, esse domínio não será cadastrado. O teste completo de retorno/login fica para o domínio oficial.

## Estado funcional já comprovado

Em navegador real foram comprovados:

- carregamento da Home no GrapesJS local;
- edição de texto;
- blocos Título, Texto, Cartões, Destaque e Botão aparecendo e funcionando na Prévia;
- undo e redo;
- modos Computador e Celular;
- Prévia local;
- salvamento real protegido na branch de desenvolvimento;
- `index.html` + JSON no mesmo commit;
- persistência de bloco de texto após recarregar;
- `main` mantida intacta durante os testes.

## Próximo marco

O foco não é mais ampliar o editor. Antes de qualquer merge:

- revisar a interface do Centro de Administração;
- testar Publicações na branch protegida;
- validar imagem de Publicações separadamente;
- validar atalhos Livro de Ponto, Arquivo Digital e Notas;
- fazer revisão final do PR;
- testar login completo no domínio oficial em momento controlado;
- obter autorização explícita do usuário para merge.

## Regras permanentes

- não reintroduzir VvvebJs;
- não usar Vercel, TinaCMS, TinaCloud ou PHP para fazer o editor funcionar;
- não usar CDN em runtime no candidato final;
- não atualizar GrapesJS automaticamente;
- qualquer atualização da biblioteca exige versão fixada e novo teste;
- não permitir edição de scripts da Home pelo usuário comum;
- não reativar troca/upload de imagem no editor visual sem resolver e testar a persistência de ponta a ponta;
- não misturar edição visual da Home com os módulos internos (`arquivo-digital`, `notas`, `livro-ponto`);
- não ampliar para criação arbitrária de páginas antes de a Home ser validada por usuário leigo.

Consulte `../PROJETO_ADMIN_VISUAL.md`, `../AI_CONTEXT.md`, `../TESTES.md` e `../EXECUCAO_ADMIN_VISUAL.md`.