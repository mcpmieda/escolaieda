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

Foi tentada inicialmente no código uma redução de `Sites.ReadWrite.All` para `Sites.Read.All`. O ambiente anterior já havia sido validado com `Sites.ReadWrite.All`.

Durante a revisão anterior aos testes, o código foi restaurado para `Sites.ReadWrite.All` para preservar o consentimento já comprovadamente funcional do Entra ID. O novo CMS continua sem realizar escrita no SharePoint. A redução de privilégio será uma etapa coordenada separada, com ajuste da App Registration e teste específico.

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

Foi preparado um adaptador e o workflow `.github/workflows/vendor-vvveb.yml` para copiar o commit upstream fixado.

Resultado da avaliação:

- o runtime exigia muitos arquivos independentes;
- a vendorização não se materializou na branch com os eventos de push produzidos nesta sessão;
- `admin/editor/index.html` não chegou a existir por esse mecanismo;
- insistir aumentaria a complexidade operacional.

Decisão: **VvvebJs descartado antes do merge**.

## 2026-08-19 — Troca aprovada para GrapesJS

O usuário aceitou a recomendação de substituir VvvebJs por GrapesJS.

Versão fixada escolhida para o primeiro marco:

`GrapesJS 0.22.13`

Licença: BSD-3-Clause.

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
7. atualiza o ref com `force:false`.

Objetivo: evitar estado parcial Home/JSON.

## 2026-08-19 — Proteção da branch de desenvolvimento

Criado `admin/github-safe-target.js`.

Fora de `escolaieda.com` e `www.escolaieda.com`, chamadas à API GitHub que apontariam para `main` são desviadas para `feat/admin-visual-builder`.

Teste isolado executado em cinco cenários:

- `?ref=main`;
- `/git/ref/heads/main`;
- `/git/refs/heads/main`;
- corpo JSON com `branch: main`;
- chamada Microsoft Graph não deve ser alterada.

Resultado: **5/5 aprovados**.

## 2026-08-19 — Vendorização GrapesJS

A tentativa de usar GitHub Actions para copiar o runtime foi descartada porque os eventos produzidos nesta integração não geraram execução do workflow. O workflow temporário foi removido.

A licença oficial e `vendor/VERSION.txt` foram versionados.

## 2026-08-19 — Bundles fornecidos pelo usuário

O usuário forneceu pelo celular:

- `grapes.min.js`;
- `grapes.min.css`.

Validação local:

### grapes.min.js

- identifica `grapesjs - 0.22.13` no cabeçalho;
- tamanho: `1095002` bytes;
- SHA-256: `c459a47bf7ff831e309b10aab4ce27c8d2d8280f62aa35dc6c1b7f776368f8c6`;
- `node --check`: aprovado.

### grapes.min.css

- tamanho: `60968` bytes;
- SHA-256: `1edd206fb9e41c60d70c66cfdb2e79e2b9358df5c952333a8b5a6a5989f8c2d4`;
- presença das classes principais `gjs-*`: confirmada.

Os hashes foram gravados em `admin/editor/vendor/VERSION.txt`.

### Limitação operacional atual

O conector GitHub desta sessão aceita conteúdo textual, mas não possui parâmetro de arquivo local para transferir diretamente esses dois bundles grandes. Não criar workaround arquitetural permanente por causa dessa limitação. O candidato final continua exigindo os arquivos reais em:

- `admin/editor/vendor/grapes.min.js`;
- `admin/editor/vendor/grapes.min.css`.

## 2026-08-19 — Compatibilidade com a Home real

Verificado contra `index.html`:

- `[data-home-titulo]` existe;
- `[data-home-subtitulo]` existe;
- `[data-home-missao]` existe;
- `#topbar` existe;
- `<footer>` existe;
- seções usam os atributos esperados pelo sincronizador.

O contrato da nova tela de Publicações também foi comparado com `site-data/publicacoes-site.js`; os campos de publicação, período, estilos e locais usados pelo novo admin são compatíveis com o renderizador público existente.

## 2026-08-19 — Vercel residual

Os commits da branch continuam recebendo um status externo `Vercel`.

A conta Vercel conectada nesta sessão retorna zero projetos e o deployment indicado pelo status não é acessível por essa conexão. Portanto ele permanece classificado como integração/check residual fora da arquitetura.

Conclusão:

- não existe dependência Vercel no código novo;
- precisa ser removido administrativamente em etapa separada;
- não usar Vercel como requisito do produto.

## Próximas condições antes do merge

1. colocar fisicamente `grapes.min.js` e `grapes.min.css` em `admin/editor/vendor/` na branch;
2. executar smoke test real do admin/editor;
3. testar Publicações e upload de imagem contra a branch protegida;
4. testar Home visual contra a branch protegida;
5. revisar diff final contra baseline;
6. resolver ou registrar formalmente a integração Vercel residual;
7. obter aprovação do usuário;
8. somente então solicitar autorização explícita para merge.

Nenhum merge na `main` foi autorizado ou realizado neste marco.
