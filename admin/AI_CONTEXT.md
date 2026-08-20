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
Runtime local materializado na branch:

- `admin/editor/vendor/grapes.min.js`
- `admin/editor/vendor/grapes.min.css`
- `admin/editor/vendor/GRAPESJS-LICENSE`
- `admin/editor/vendor/VERSION.txt`

O navegador usa os arquivos locais. Não usar CDN em runtime, Vercel, TinaCMS/TinaCloud, PHP, banco novo ou CMS hospedado externamente.

### Bundles validados e incorporados

Em 2026-08-19 o usuário forneceu os dois bundles pelo celular e depois fez o upload para a branch de desenvolvimento.

`grapes.min.js`
- tamanho: `1095002` bytes
- SHA-256: `c459a47bf7ff831e309b10aab4ce27c8d2d8280f62aa35dc6c1b7f776368f8c6`
- Git blob SHA: `7e6965661f682e20915b4489cbeb3f85ec8706df`
- `node --check`: aprovado

`grapes.min.css`
- tamanho: `60968` bytes
- SHA-256: `1edd206fb9e41c60d70c66cfdb2e79e2b9358df5c952333a8b5a6a5989f8c2d4`
- Git blob SHA: `62009a27142982215ecb7eb02f114eadf4e93841`

Os blobs presentes no GitHub coincidem exatamente com os arquivos locais validados. **Não tratar mais a vendorização como pendente.**

### Escopo deliberadamente reduzido

A primeira versão edita somente `index.html`.

Não oferecer criação arbitrária de novas páginas nesta fase. Só reconsiderar depois que a edição visual da Home estiver validada no uso real.

Cabeçalho e rodapé são protegidos contra exclusão acidental. Scripts da Home não são executados nem editados dentro do canvas.

### Escopo de imagens na V1

A troca de imagens dentro do editor visual foi **retirada da V1**.

O teste real mostrou que o arquivo conseguia ser enviado para o GitHub e aparecia no Asset Manager, porém a imagem escolhida não permanecia vinculada ao bloco após salvar e recarregar. O usuário decidiu pular esse refinamento e avançar por marcos maiores.

Decisão vigente:

- bloco `Imagem` removido da paleta;
- imagens existentes continuam visíveis, mas protegidas contra troca pelo editor;
- arquivos usados somente nos testes de `imagens/editor/` foram removidos da branch;
- não reativar esse recurso sem teste completo de persistência;
- imagens de **Publicações** são um fluxo independente e continuam no escopo de `/admin/`.

## Compatibilidade Home + JSON

O renderizador público antigo ainda conhece `site-data/publicacoes-publicas.json > home` e pode sobrescrever alguns textos conhecidos da Home.

Por isso, ao salvar visualmente, o adaptador:

1. preserva o HTML canônico como base;
2. aplica o conteúdo visual da Home;
3. extrai os campos conhecidos da Home;
4. atualiza o objeto `home` do JSON;
5. grava `index.html` e o JSON no **mesmo commit Git**, usando Git Data API.

A Home real foi verificada e possui os seletores esperados, incluindo `[data-home-titulo]`, `[data-home-subtitulo]`, `[data-home-missao]`, `#topbar`, `<footer>` e os atributos das seções legadas.

## Testes reais já comprovados

Em navegador real, no preview protegido:

- GrapesJS local abriu a Home real;
- logo, estilos e imagens relativas carregaram;
- edição de texto funcionou;
- undo e redo funcionaram;
- Prévia mostrou alterações não salvas;
- modos Computador e Celular funcionaram visualmente;
- blocos Título, Texto, Cartões, Destaque e Botão funcionaram e apareceram na Prévia;
- primeiro salvamento expôs reserialização excessiva e foi revertido;
- mecanismo foi corrigido e um segundo salvamento textual produziu diff mínimo;
- `index.html` e `site-data/publicacoes-publicas.json` foram gravados no mesmo commit;
- escrita real ficou restrita a `feat/admin-visual-builder`;
- `main` permaneceu no baseline seguro;
- bloco de texto persistiu após recarregar;
- teste de imagem falhou na persistência e motivou a retirada do recurso da V1.

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

Imagens de publicações: `imagens/publicacoes/`.

### Proteção de teste

`admin/github-safe-target.js` redireciona chamadas GitHub destinadas a `main` para `feat/admin-visual-builder` quando o hostname não é `escolaieda.com` ou `www.escolaieda.com`.

Teste isolado: 5/5 cenários aprovados, incluindo confirmação de que chamadas Microsoft Graph não são alteradas.

Teste de escrita real também comprovou que commits feitos pelo editor no preview foram para `feat/admin-visual-builder`, enquanto `main` permaneceu intacta.

## Microsoft / Graph

O novo CMS não escreve no SharePoint.

A leitura de `DOCUMENTOS_ATIVOS` continua servindo como gate de autorização da Secretaria.

O ambiente funcional anterior foi validado com `Sites.ReadWrite.All`. Durante a revisão anterior aos testes, o código foi restaurado para esse escopo para preservar o consentimento já conhecido. A futura redução para leitura deve ser feita em etapa separada, coordenando código, App Registration e consentimento do Entra ID.

### Login no preview

O botão de login abriu corretamente o Microsoft Entra e chegou à autenticação.

O retorno foi bloqueado por `AADSTS50011` porque o domínio temporário da Vercel não está cadastrado como redirect URI. Por decisão explícita do usuário, esse domínio **não será cadastrado**. Isso não é tratado como falha do código novo.

O teste completo de retorno ao dashboard e autorização Graph fica para o domínio oficial em momento controlado.

## Itens removidos deste painel

- provisionamento de listas SharePoint;
- botão “Preparar SharePoint”;
- publicações armazenadas em listas SharePoint;
- formulário customizado da Home;
- enquetes inacabadas;
- prévia separada `admin-preview.js`;
- configurações técnicas antigas expostas ao usuário comum;
- VvvebJs;
- criação arbitrária de páginas no primeiro marco;
- bloco de imagem do editor visual V1.

## Página institucional

`institucional/index.html` era somente página de teste e foi removida na branch.

NÃO remover `site-institucional/` automaticamente: contém conteúdo real/legado e exige auditoria própria.

## Vercel

Não existe dependência Vercel na arquitetura nova.

O Vercel está sendo usado somente como preview temporário porque uma integração residual externa continua criando deployments para o PR. Não incorporar Vercel ao desenho final do produto.

Depois do marco, tratar a desconexão administrativa dessa integração separadamente.

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
8. manter GrapesJS fixado em `0.22.13` neste marco e não substituir os bundles sem nova validação de hash/versão.

## Regra de aceite atualizada

Não considerar pronto apenas porque o código existe. Antes de merge, o marco precisa comprovar ou registrar explicitamente como pendente:

- login Microsoft completo no domínio correto;
- acesso da Secretaria;
- painel em desktop e celular;
- publicação direta no GitHub;
- imagem de Publicação, se usada;
- renderização pública;
- editor visual abrindo a Home;
- textos e blocos editáveis;
- desfazer/refazer;
- modos desktop/tablet/celular;
- prévia sem escrita;
- salvamento atômico Home + JSON;
- recarregamento preservando alteração suportada;
- Livro de Ponto abrindo corretamente;
- ausência de regressão em Arquivo Digital e Notas.

**Imagem dentro do editor visual não é requisito de aceite da V1.**