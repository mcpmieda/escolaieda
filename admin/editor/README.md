# Editor visual da Escola Iêda

O editor visual fica em `/admin/editor/` e, para o usuário comum, é acessado dentro de **Publicações → Editar página** no Centro de Administração.

## Escopo da V1

A primeira versão edita somente a Home (`index.html`). Isso reduz risco e mantém a experiência simples para usuários não técnicos.

Publicações continuam sendo administradas pelo formulário estruturado do próprio `/admin/`.

## Motor visual

- GrapesJS `0.22.13`
- licença BSD-3-Clause
- runtime local em `vendor/grapes.min.js` e `vendor/grapes.min.css`
- nenhuma CDN é necessária em produção

Arquivos próprios:

- `index.html` — shell do editor;
- `escola-editor.css` — UI;
- `escola-editor.js` — GrapesJS, prévia e salvamento;
- `vendor/` — runtime, licença e metadados de versão/hash.

## Recursos

- editar textos e elementos suportados;
- blocos Título, Texto, Cartões, Destaque e Botão;
- aparência do elemento selecionado;
- Estrutura;
- desfazer/refazer;
- Computador, Tablet e Celular;
- prévia local sem escrita;
- salvamento somente por ação explícita;
- cabeçalho e rodapé protegidos contra exclusão acidental.

## Como o salvamento funciona

1. O editor parte do HTML canônico do GitHub.
2. Scripts da Home não são executados nem editados dentro do canvas.
3. O conteúdo visual suportado é aplicado ao HTML.
4. Campos conhecidos da Home são sincronizados no objeto legado `home` de `site-data/publicacoes-publicas.json`.
5. `index.html` e o JSON são gravados no mesmo commit usando Git Data API.
6. O ref é atualizado sem `force`.

## Imagens

Troca/upload de imagem dentro do editor visual **não faz parte da V1**.

Nos testes, o upload físico funcionou, mas a imagem escolhida não permaneceu associada ao bloco após salvar e recarregar. O recurso foi retirado em vez de permanecer parcialmente funcional.

Isso não afeta imagens de **Publicações**, que usam fluxo separado e são gravadas em `imagens/publicacoes/`.

## GitHub e segurança

- branch de produção: `main`;
- token GitHub nunca é versionado;
- sessão por padrão;
- armazenamento local apenas quando o usuário escolhe lembrar;
- fora de `escolaieda.com` e `www.escolaieda.com`, escritas GitHub ficam bloqueadas pelo `admin/github-safe-target.js`.

Não existe branch permanente de desenvolvimento exigida pelo editor. Quando uma futura alteração precisar de isolamento, criar branch temporária e removê-la após o merge.

## Microsoft / Graph

O editor não escreve no SharePoint.

A autenticação do Centro de Administração continua usando Microsoft Entra ID e o gate de leitura da Secretaria. O domínio oficial já foi validado com login funcional.

A permissão `Sites.ReadWrite.All` permanece temporariamente por compatibilidade com o consentimento existente e deve ser reduzida apenas em alteração coordenada com App Registration e teste específico.

## Estado já comprovado

Em testes reais foram confirmados:

- carregamento da Home no GrapesJS local;
- edição de texto;
- blocos Título, Texto, Cartões, Destaque e Botão;
- undo/redo;
- Computador e Celular;
- prévia local;
- persistência de bloco suportado após recarregar;
- salvamento de `index.html` + JSON no mesmo commit em ambiente protegido;
- correção da reserialização excessiva para alteração textual mínima.

O editor também já foi integrado visualmente ao Centro de Administração e o usuário confirmou seu funcionamento dentro da área de Publicações.

## Pendências de fechamento

Antes da tag `v1.0.0`:

- testar uma alteração mínima e reversível no domínio oficial;
- testar Tablet explicitamente;
- validar proteção de cabeçalho e rodapé;
- concluir regressão pública depois do salvamento.

## Regras permanentes

- não reintroduzir VvvebJs;
- não usar CDN em runtime;
- não atualizar GrapesJS automaticamente;
- qualquer atualização exige versão fixada e testes;
- não permitir edição de scripts da Home pelo usuário comum;
- não reativar troca/upload de imagem sem resolver persistência ponta a ponta;
- não ampliar para criação arbitrária de páginas antes de uma decisão de V2;
- manter módulos internos sensíveis fora do escopo do editor.

Consulte `../PROJETO_ADMIN_VISUAL.md`, `../AI_CONTEXT.md`, `../TESTES.md` e `../EXECUCAO_ADMIN_VISUAL.md`.