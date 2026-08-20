# Diário de execução — Centro de Administração Visual

Este documento registra o que foi efetivamente feito, decisões, descobertas e pendências. Ele deve ser atualizado conforme o projeto avança.

## 2026-08-19 — Reinício seguro

### Contexto

A experiência anterior de ampliação do admin havia evoluído para Astro + TinaCMS/TinaCloud e chegou a envolver Vercel. O resultado aumentou a complexidade operacional e contrariou a meta do projeto: administração simples para usuário leigo, com o mínimo de infraestrutura e sem desenvolver um CMS artesanal recurso por recurso.

### Ação anterior ao novo marco

A `main` foi devolvida ao commit seguro:

`96e16d599d06768a0ab6a7a0ea807b94a838a168`

Esse passou a ser o baseline deste novo trabalho.

## 2026-08-19 — Decisão arquitetural

Objetivo definido:

- uma única central em `/admin/`;
- interface moderna e simples;
- edição visual do site;
- criação de novas páginas;
- blocos reutilizáveis;
- publicações simples;
- GitHub como fonte de verdade;
- nada de TinaCMS/TinaCloud;
- nada de Vercel como requisito de arquitetura;
- nada de PHP/banco novo;
- não reconstruir manualmente recursos de page builder que um projeto maduro já possui.

VvvebJs foi selecionado inicialmente como page builder open-source por oferecer experiência drag-and-drop já pronta e funcionar em JavaScript puro.

Commit upstream fixado para avaliação/vendorização:

`1acbab7ebfe3e7b004f1f18c039d26550fc04bd8`

## 2026-08-19 — Branch isolada

Criada:

`feat/admin-visual-builder`

A branch partiu exatamente do baseline seguro. A `main` não recebeu o novo admin.

## 2026-08-19 — Auditoria do admin antigo

Foram confirmados:

1. `admin/livro-ponto/index.html` já existe e é um módulo real. Não era necessário “preparar integração”; bastava ligar o botão diretamente.
2. `institucional/index.html` era somente uma pequena página de teste da futura área institucional.
3. `site-institucional/` é diferente: contém páginas reais/legadas e não deve ser apagado automaticamente.
4. O CMS antigo do site usava listas do SharePoint e depois sincronizava conteúdo para `site-data/publicacoes-publicas.json` no GitHub.
5. O renderizador público já lê o array `publicacoes` desse JSON, permitindo retirar o SharePoint do caminho de publicação.

## 2026-08-19 — Nova UI do Centro de Administração

Criado novo `admin/index.html` com:

- login Microsoft preservado;
- sidebar escura e central de tarefas;
- Visão geral;
- Publicações;
- Editar site;
- Livro de Ponto;
- Sistemas;
- cartões de acesso rápido;
- interface responsiva;
- modal simples de conexão GitHub.

Criado novo `admin/admin.css` com:

- visual moderno;
- gradientes e efeitos discretos;
- transparência/blur onde útil;
- cards com microinterações;
- layout mobile;
- foco de teclado;
- suporte a `prefers-reduced-motion`.

## 2026-08-19 — Simplificação do CMS de publicações

Criado novo `admin/admin.js`.

Removido do fluxo operacional:

- criar/provisionar listas SharePoint;
- botão “Preparar SharePoint”;
- lista de enquetes inacabada;
- telas de configuração de listas;
- formulário customizado da Home;
- sincronização SharePoint → GitHub;
- prévia separada da Home.

Novo fluxo implementado:

`Admin → GitHub Contents API → site-data/publicacoes-publicas.json → site`

Suporte implementado para:

- criar publicação;
- editar;
- excluir;
- rascunho/publicado;
- título/resumo/texto;
- local de exibição;
- aparência;
- período de exibição;
- imagem;
- botão/link;
- busca;
- upload de imagem para `imagens/publicacoes/`.

## 2026-08-19 — Microsoft / SharePoint

Decisão final deste marco:

- Microsoft continua como autenticação e gate de acesso da Secretaria;
- a leitura de `DOCUMENTOS_ATIVOS` continua sendo usada para validar acesso;
- o novo CMS não escreve no SharePoint.

### Compatibilidade de permissão

Durante a implementação foi considerada a redução de `Sites.ReadWrite.All` para `Sites.Read.All`.

Essa alteração NÃO deve ser tratada como concluída antes de confirmar/configurar a permissão correspondente no Entra ID. O ambiente atual já foi validado anteriormente com `Sites.ReadWrite.All`. Preservar compatibilidade de login tem prioridade; a redução de privilégio deve ser feita em uma etapa coordenada entre código e App Registration.

## 2026-08-19 — Livro de Ponto

Os novos botões apontam diretamente para:

`/admin/livro-ponto/`

Nenhum arquivo interno do Livro de Ponto foi alterado.

## 2026-08-19 — Limpeza

Removido na branch:

`institucional/index.html`

Motivo: era somente página de teste e o `/admin/` agora centraliza a administração.

Preservado:

`site-institucional/`

Motivo: contém páginas reais/legadas e exige auditoria específica antes de eventual remoção.

Removido:

`admin/admin-preview.js`

Motivo: a estratégia nova é editar visualmente a própria página; manter um segundo mecanismo de prévia customizado duplicaria complexidade.

## 2026-08-19 — Preparação do editor visual

Criados na branch:

- `admin/editor/escola-editor.js`
- `admin/editor/escola-componentes.js`
- `admin/editor/escola-editor.css`
- `admin/editor/modelos/pagina-basica.html`
- `admin/editor/README.md`

O adaptador da Escola Iêda prevê:

- Home real como página inicial;
- salvar HTML via GitHub Contents API;
- `Ctrl+S`;
- criar páginas em `paginas/<slug>/index.html`;
- listar páginas criadas;
- upload de imagens em `imagens/editor/`;
- blocos Escola Iêda (aviso, destaque, cartões, texto, chamada e galeria);
- remoção do `save.php` do upstream;
- redução de controles técnicos.

## 2026-08-19 — Vendorização do VvvebJs

Foi criado um workflow controlado:

`.github/workflows/vendor-vvveb.yml`

Objetivo: copiar o runtime do VvvebJs do commit fixado para `admin/editor/`, adaptar `editor.html` e gravar os arquivos na própria branch.

### Estado real

PENDENTE.

Os commits produzidos pela conexão GitHub desta sessão não dispararam a execução do novo workflow. Por isso `admin/editor/index.html` e os diretórios de runtime do upstream ainda não foram gerados.

Não declarar o editor como concluído enquanto estes arquivos não existirem e forem validados.

### Regra

Não contornar esta pendência introduzindo CDN, Tina, Vercel ou backend externo. Se o workflow continuar sem executar, escolher outro mecanismo de vendorização controlado ou solicitar uma ação mínima no GitHub apenas para disparar o workflow.

## 2026-08-19 — Descoberta de integração Vercel residual

Durante a validação dos commits da branch, o GitHub retornou um status externo:

`context: Vercel`

Projeto indicado pelo status:

`escolaieda-prova-visual-formato`

Isso ocorreu mesmo depois do rollback do código e mesmo com a API Vercel conectada retornando zero projetos para a equipe acessível nesta sessão.

Conclusão:

- não há dependência Vercel no código atual;
- porém existe uma integração/check Vercel residual fora do código que ainda reage a commits do repositório;
- essa integração deve ser removida/desconectada antes de considerar o ecossistema totalmente limpo de Vercel;
- o novo projeto não deve usar esse deployment para funcionar.

## 2026-08-19 — Diff de segurança

Comparação entre baseline e `feat/admin-visual-builder` confirmou mudanças restritas a:

- `.github/workflows/vendor-vvveb.yml`;
- arquivos do `admin/`;
- novos arquivos `admin/editor/`;
- remoção de `institucional/index.html`.

Não foram modificados:

- `arquivo-digital/`;
- `notas/`;
- `admin/livro-ponto/`;
- Home pública `index.html`;
- demais portais operacionais.

## Próxima condição para avançar

1. concluir a vendorização do page builder;
2. validar sintaxe e dependências;
3. abrir o painel/editor em navegador real;
4. testar login e Livro de Ponto;
5. testar criação de publicação em branch/ambiente seguro;
6. testar edição visual e criação de página;
7. revisar integração Vercel residual;
8. somente depois preparar candidato a merge.

Nenhum merge na `main` foi autorizado ou realizado neste marco.
