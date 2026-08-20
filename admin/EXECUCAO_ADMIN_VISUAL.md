# Diário de execução — Centro de Administração Visual

Este documento registra o que foi efetivamente executado, decisões, descobertas e pendências. Não declarar uma etapa concluída antes da evidência correspondente.

## 2026-08-19 — Reinício seguro

O trabalho foi reiniciado a partir do baseline:

`96e16d599d06768a0ab6a7a0ea807b94a838a168`

Branch criada:

`feat/admin-visual-builder`

A `main` permaneceu preservada.

## 2026-08-19 — Decisão arquitetural

Objetivo aprovado:

- uma única central em `/admin/`;
- UI moderna e simples;
- edição visual da Home;
- publicações simples;
- Livro de Ponto ligado diretamente;
- GitHub como fonte de verdade pública;
- SharePoint fora do fluxo de CMS;
- nada de TinaCMS/TinaCloud;
- nada de Vercel como requisito;
- nada de PHP/banco novo.

## 2026-08-19 — Auditoria do admin anterior

Confirmado:

1. `admin/livro-ponto/` já é um módulo real.
2. `institucional/index.html` era apenas página de teste.
3. `site-institucional/` contém páginas reais/legadas e não deve ser removido em bloco.
4. o CMS antigo publicava por listas SharePoint e depois sincronizava para GitHub;
5. o site público já lê `site-data/publicacoes-publicas.json`.

## 2026-08-19 — Nova UI administrativa

`admin/index.html`, `admin/admin.css` e `admin/admin.js` foram reorganizados para uma central com:

- Visão geral;
- Publicações;
- Editar site;
- Livro de Ponto;
- Sistemas;
- layout responsivo;
- microinterações discretas;
- foco de teclado;
- suporte a `prefers-reduced-motion`.

## 2026-08-19 — Simplificação das publicações

Retirado da rotina:

- “Preparar SharePoint”;
- provisionamento de listas;
- publicações em listas SharePoint;
- sincronização SharePoint → GitHub;
- formulário customizado da Home;
- enquetes inacabadas;
- configurações técnicas do antigo portal;
- `admin/admin-preview.js`.

Novo fluxo:

`Admin → GitHub → site-data/publicacoes-publicas.json → site`

A nova tela suporta criar, editar, excluir, rascunho/publicado, local, aparência, período, imagem e link.

## 2026-08-19 — Microsoft / SharePoint

Mantido:

- login Microsoft;
- leitura de `DOCUMENTOS_ATIVOS` para validar acesso da Secretaria.

O novo CMS não escreve no SharePoint.

### Permissão Graph

Foi tentada no código uma redução de `Sites.ReadWrite.All` para `Sites.Read.All`. O ambiente anterior já havia sido validado com `Sites.ReadWrite.All`.

Estado: **a redução não deve ser tratada como concluída** até código e App Registration do Entra ID serem ajustados em conjunto. Preservar login funcional tem prioridade; depois reduzir privilégio de forma coordenada.

## 2026-08-19 — Livro de Ponto

O painel novo aponta diretamente para:

`/admin/livro-ponto/`

O código interno do Livro de Ponto não foi alterado.

## 2026-08-19 — Limpeza inicial

Removidos:

- `institucional/index.html` — página de teste redundante;
- `admin/admin-preview.js` — preview customizado duplicado.

Preservados:

- `site-institucional/`;
- `arquivo-digital/`;
- `notas/`;
- `admin/livro-ponto/`.

## 2026-08-19 — Primeira avaliação: VvvebJs

VvvebJs foi escolhido inicialmente por já oferecer page builder drag-and-drop.

Foi preparado um adaptador e um workflow temporário para copiar o runtime fixado.

Resultado da avaliação:

- o runtime exigia muitos arquivos independentes;
- a vendorização não se materializou na branch;
- insistir aumentaria a complexidade operacional.

Decisão: **VvvebJs descartado antes do merge**.

## 2026-08-19 — Troca aprovada para GrapesJS

O usuário aceitou a recomendação de substituir VvvebJs por GrapesJS.

Versão fixada escolhida para o primeiro marco:

`GrapesJS 0.22.13`

Motivo da versão: bundle JS/CSS distribuível, suficiente para o escopo da Home e sem exigir uma cadeia de build permanente.

Licença: BSD-3-Clause.

Arquivos distribuíveis:

- `grapes.min.js` — aproximadamente 1,1 MB;
- `grapes.min.css` — aproximadamente 61 KB.

A aplicação final não deve buscar esses arquivos por CDN em runtime.

## 2026-08-19 — Novo editor GrapesJS

Criado `admin/editor/index.html` com:

- topbar da Escola Iêda;
- voltar ao admin;
- desfazer/refazer;
- computador/tablet/celular;
- prévia;
- salvar;
- painel de blocos;
- canvas;
- aparência/camadas;
- conexão GitHub.

`admin/editor/escola-editor.css` foi refeito para a nova interface.

`admin/editor/escola-editor.js` foi reescrito para GrapesJS com:

- carregamento da Home real;
- scripts removidos do canvas e preservados para o HTML final;
- estilos originais injetados no canvas;
- blocos próprios simples;
- cabeçalho e rodapé protegidos contra exclusão acidental;
- undo/redo;
- dispositivos;
- prévia local sem escrita;
- Asset Manager com upload para `imagens/editor/`;
- limite de 8 MB por imagem;
- token GitHub apenas no navegador;
- salvamento explícito.

## 2026-08-19 — Redução de escopo do editor

A criação arbitrária de páginas, prevista no primeiro desenho, foi retirada deste marco.

Motivo: primeiro validar uma experiência segura e simples na Home. Ampliar para várias páginas antes dessa validação aumentaria muito a superfície de erro.

Removidos por isso:

- `admin/editor/modelos/pagina-basica.html`;
- adaptador VvvebJs `admin/editor/escola-componentes.js`.

A primeira versão do construtor edita **somente `index.html`**.

## 2026-08-19 — Salvamento atômico da Home

Descoberta: `site-data/publicacoes-site.js` ainda usa o objeto `home` do JSON para sobrescrever alguns textos conhecidos.

Para não quebrar compatibilidade, o editor não removeu isso de uma vez.

Ao salvar:

1. gera o novo `index.html`;
2. carrega o JSON público;
3. sincroniza os campos legados conhecidos da Home;
4. cria blobs Git para HTML e JSON;
5. cria uma tree baseada na versão atual;
6. cria **um único commit** com os dois arquivos;
7. atualiza o branch-alvo com `force:false`.

Objetivo: evitar estado parcial Home/JSON.

## 2026-08-19 — PR draft de validação

Aberto o PR draft:

`#27 — Admin visual: GrapesJS para edição segura da Home`

Base:

`main @ 96e16d599d06768a0ab6a7a0ea807b94a838a168`

Head:

`feat/admin-visual-builder`

O PR permanece draft e **não está autorizado para merge**.

## 2026-08-19 — Tentativa de vendorização por GitHub Actions

Foi criado temporariamente `.github/workflows/vendor-grapesjs.yml` para materializar os bundles locais do GrapesJS.

Foram testados eventos de abertura/sincronização e também fechamento + reabertura do PR para provocar `reopened`.

Resultado observado:

- nenhuma execução de Actions apareceu associada ao head ou ao merge ref do PR;
- a integração disponível nesta sessão não forneceu um dispatch alternativo utilizável;
- insistir no workflow adicionaria mecanismo sem evidência de funcionamento.

Decisão: **workflow temporário removido**.

Commit de remoção:

`5b97039125b9599986d534b39b64d3d1917d2bfe`

## 2026-08-19 — Estado real da vendorização GrapesJS

Já versionados localmente no repositório:

- `admin/editor/vendor/GRAPESJS-LICENSE`;
- `admin/editor/vendor/VERSION.txt`.

Commit:

`d7a33a0280d358cb10ac20093bb451936dd8f1fa`

Origem confirmada:

- GrapesJS `v0.22.13`;
- licença BSD-3-Clause;
- bundles públicos correspondentes existem no repositório cdnjs.

Ainda faltam no repositório da escola:

- `admin/editor/vendor/grapes.min.js`;
- `admin/editor/vendor/grapes.min.css`.

Esse é o **único bloqueio de empacotamento do motor visual**. Enquanto esses dois arquivos não existirem, não declarar `/admin/editor/` executável ou aprovado.

A limitação é operacional: os bundles compilados são arquivos grandes/minificados e não existem no source tag do GrapesJS; o ambiente desta sessão não conseguiu copiá-los de forma íntegra para o repositório. Não contornar isso transformando Vercel, Tina, PHP ou outro serviço em dependência do produto final.

## 2026-08-19 — Proteção contra escrita acidental na produção

Durante a revisão foi identificado um risco importante: `admin/admin.js` e `admin/editor/escola-editor.js` possuem `main` como branch de produção. Um teste em preview/local com token real poderia, sem proteção, atingir produção.

Foi criada a camada única:

`admin/github-safe-target.js`

Regra:

- em `escolaieda.com` e `www.escolaieda.com`, o comportamento de produção permanece apontando para `main`;
- em qualquer outro hostname, chamadas GitHub deste repositório que apontariam para `main` são redirecionadas para `feat/admin-visual-builder`;
- chamadas Microsoft Graph e outras origens não são interceptadas.

Integração:

- editor visual: commit `6f539339ae65b239181bc8b9259c6bf02c810f01`;
- painel/Publicações: commit `12533184b7f2a87a4e29fa342fb9745e2488ebbd`.

### Teste isolado da proteção

Foram verificados cinco casos:

1. `contents?...ref=main` → branch de desenvolvimento;
2. `/git/ref/heads/main` → branch de desenvolvimento;
3. `/git/refs/heads/main` → branch de desenvolvimento;
4. corpo JSON `branch: main` → branch de desenvolvimento;
5. Microsoft Graph → inalterado.

Resultado: **5/5 aprovado**.

Isso permite planejar testes com token real sem apontar gravações de preview/local para produção.

## 2026-08-19 — Vercel residual

Os commits da branch continuam recebendo um status externo:

`context: Vercel`

O destino mostrado pelo GitHub usa o nome `escolaieda-prova-visual-formato`.

A conta Vercel conectada foi consultada novamente:

- equipe: `mcpmieda`;
- projetos acessíveis: `0`.

Conclusão:

- não existe dependência Vercel no código novo;
- existe integração/check residual fora do código;
- a conexão disponível não expôs um projeto que pudesse ser removido;
- não usar Vercel como requisito de teste ou hospedagem do admin.

## 2026-08-19 — Branch temporária acidental

Durante uma consulta ao conector GitHub foi criada por engano a branch `temp-should-not-create`.

A branch não recebeu código próprio e foi imediatamente force-movida para o baseline seguro:

`96e16d599d06768a0ab6a7a0ea807b94a838a168`

O conector disponível não oferece exclusão física de branch. Portanto o nome pode continuar visível, mas ele está neutralizado e não deve ser usado.

## 2026-08-19 — Segurança de escopo

Comparações da branch com o baseline confirmaram que os módulos operacionais sensíveis continuam fora do diff:

- `arquivo-digital/`;
- `notas/`;
- `admin/livro-ponto/`.

Também foi feita busca no diff por padrão típico de token GitHub (`ghp_`), sem ocorrência.

## Próximas condições antes do merge

1. incorporar `grapes.min.js` e `grapes.min.css` localmente;
2. validar sintaxe e recursos locais;
3. executar smoke test real do admin/editor;
4. validar login e permissão Graph;
5. testar Publicações na branch segura;
6. testar Home visual na branch segura;
7. revisar diff final contra baseline;
8. resolver ou registrar formalmente a integração Vercel residual;
9. obter aprovação do usuário;
10. somente então solicitar autorização explícita para merge.

Nenhum merge na `main` foi autorizado ou realizado neste marco.
