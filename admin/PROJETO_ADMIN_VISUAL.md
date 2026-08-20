# Centro de Administração Visual — Escola Iêda

## 1. Objetivo

Transformar `https://escolaieda.com/admin/` em uma central administrativa única, elegante e simples para usuários não técnicos, evitando continuar construindo um CMS próprio recurso por recurso.

O projeto adota um construtor visual open-source pronto e mantém o GitHub como fonte de verdade dos arquivos públicos do site.

## 2. Ponto seguro de partida

- Repositório: `mcpmieda/escolaieda`
- Baseline preservado: `96e16d599d06768a0ab6a7a0ea807b94a838a168`
- Branch de desenvolvimento: `feat/admin-visual-builder`
- Regra: a `main` não é alterada durante a construção e validação deste marco.

Este marco começou depois do descarte integral da experiência anterior Astro + TinaCMS + Vercel. Nenhum código daquela arquitetura deve ser reaproveitado sem nova decisão explícita.

## 3. Problema que estamos resolvendo

O painel anterior tinha crescido como um CMS customizado:

- formulários próprios para página inicial;
- gerenciamento próprio de seções;
- publicação baseada em listas do SharePoint;
- criação/provisionamento de listas Microsoft 365;
- sincronização SharePoint → JSON público → GitHub;
- telas técnicas expostas ao usuário;
- recursos ainda incompletos, como enquetes;
- prévia separada do editor real.

Esse caminho exigia desenvolver manualmente capacidades que já existem em construtores visuais maduros.

## 4. Arquitetura escolhida

```text
Usuário autorizado da Secretaria
        ↓
/admin/
        ├── Visão geral
        ├── Publicações simples
        ├── Editar site → /admin/editor/
        ├── Livro de Ponto → /admin/livro-ponto/
        └── Sistemas internos

Publicações
        ↓
GitHub Contents API
        ↓
site-data/publicacoes-publicas.json
        ↓
site-data/publicacoes-site.js
        ↓
escolaieda.com

Editor visual
        ↓
VvvebJs vendorizado no próprio repositório
        ↓
GitHub Contents API
        ↓
index.html / paginas/*/index.html
```

### Dependências externas em tempo de execução

Não usar:

- Vercel;
- TinaCloud/TinaCMS;
- banco de dados adicional;
- servidor PHP;
- CMS hospedado por terceiros.

O GitHub continua sendo o repositório e o mecanismo de versionamento. A Microsoft continua apenas como autenticação/validação de acesso ao painel administrativo.

## 5. Construtor visual

Projeto escolhido: `givanz/VvvebJs`.

Motivos:

- open-source;
- Apache License 2.0;
- JavaScript puro;
- editor drag-and-drop já existente;
- edição direta de HTML;
- undo/redo;
- estilos e componentes;
- suporte a páginas;
- não exige React, Astro, Next.js, PHP ou banco de dados para o editor em si.

### Versão fixada

O código vendorizado deve vir exatamente do commit:

`1acbab7ebfe3e7b004f1f18c039d26550fc04bd8`

Não acompanhar `master` automaticamente. Atualizações futuras devem ser deliberadas e testadas.

### Adaptações da Escola Iêda

O editor original é reduzido e adaptado para:

- idioma português;
- identidade visual da escola;
- página inicial real como página padrão;
- criação de páginas em `paginas/<slug>/index.html`;
- salvamento direto no GitHub;
- upload de imagens para `imagens/editor/`;
- blocos próprios da escola;
- remoção do salvamento PHP do projeto original;
- remoção de exemplos/demo desnecessários;
- remoção do assistente de IA do upstream;
- remoção de recursos que dependam de backend do Vvveb.

## 6. Publicações

### Antes

```text
Admin → SharePoint Lists → sincronização → JSON no GitHub → site
```

### Agora

```text
Admin → GitHub JSON → site
```

O renderizador público já consome `site-data/publicacoes-publicas.json`, portanto a camada SharePoint era desnecessária para este caso.

O painel passa a criar/editar/excluir itens diretamente no array `publicacoes` do JSON público.

Campos mantidos:

- título;
- resumo;
- conteúdo;
- local de exibição;
- aparência;
- imagem;
- link e texto do botão;
- data inicial/final;
- publicado/rascunho;
- identificador;
- data de atualização.

## 7. SharePoint / Microsoft 365

### Mantido

- login Microsoft;
- validação de que a conta possui acesso à estrutura da Secretaria usando leitura da biblioteca `DOCUMENTOS_ATIVOS`.

### Removido do CMS do site

- provisionar listas;
- criar listas do site;
- carregar publicações de listas SharePoint;
- salvar publicações em listas SharePoint;
- sincronização manual SharePoint → GitHub;
- configurações de `PUBLICACOES_SITE`, `AVISOS_SITE`, `BANNERS_SITE`, `DESTAQUES_SITE`, `ENQUETES_SITE`, `CONFIGURACOES_PORTAL`, `PREFERENCIAS_USUARIO`, `SERVICOS_PAINEL`, `LOGS_PORTAL`, `MIDIAS_SITE` para o CMS público;
- botão “Preparar SharePoint”.

A permissão Graph do novo painel é reduzida para leitura (`Sites.Read.All`) porque o admin não precisa mais escrever no SharePoint para publicar no site.

## 8. Interface administrativa

A nova UI substitui a estrutura antiga por uma central de tarefas.

### Navegação principal

- Visão geral
- Publicações
- Editar site
- Livro de Ponto
- Sistemas

### Princípios de UI

- poucas decisões por tela;
- linguagem não técnica;
- destaque para ações frequentes;
- navegação consistente;
- responsividade para celular;
- animações leves e opcionais;
- `prefers-reduced-motion` respeitado;
- contraste e foco de teclado visíveis;
- detalhes técnicos escondidos da rotina normal.

## 9. Livro de Ponto

O módulo já existia em:

`admin/livro-ponto/index.html`

O painel antigo ainda mostrava “preparado para integração”. Isso é removido. Os botões do novo painel apontam diretamente para:

`/admin/livro-ponto/`

Nenhum código interno do Livro de Ponto é alterado neste marco.

## 10. Limpeza de páginas

`institucional/index.html` era apenas uma página de teste da futura área institucional. Ela é removida porque o `/admin/` passa a cumprir esse papel.

A pasta `site-institucional/` NÃO é apagada neste marco. Ela contém páginas reais/legadas (`calendario.html`, `professores.html`) e só deve ser removida após uma auditoria de referências e uma decisão específica.

## 11. Segurança do GitHub

O token GitHub:

- nunca é escrito no repositório;
- pode ficar somente na sessão do navegador;
- opcionalmente pode ser lembrado em `localStorage` no dispositivo escolhido pelo usuário;
- deve ser um token restrito ao repositório `mcpmieda/escolaieda` e apenas às permissões necessárias de conteúdo.

Ações de gravação usam a API oficial GitHub Contents e o `sha` atual do arquivo para reduzir risco de sobrescrever uma alteração concorrente.

## 12. Arquivos do marco

### Substituídos

- `admin/index.html`
- `admin/admin.css`
- `admin/admin.js`
- `admin/AI_CONTEXT.md`
- `admin/TESTES.md`

### Novos

- `admin/PROJETO_ADMIN_VISUAL.md`
- `admin/editor/escola-editor.js`
- `admin/editor/escola-componentes.js`
- `admin/editor/escola-editor.css`
- `admin/editor/modelos/pagina-basica.html`
- `admin/editor/README.md`
- workflow temporário/controlado para vendorizar VvvebJs fixado.

### Removidos

- `admin/admin-preview.js` — a prévia separada deixa de ser necessária quando a edição passa a ocorrer visualmente.
- `institucional/index.html` — página de teste redundante.

## 13. Critérios de aceite

A arquitetura só deve ir para `main` se os testes reais confirmarem:

1. login Microsoft continua funcionando;
2. conta autorizada entra e não autorizada é bloqueada;
3. dashboard funciona em desktop e celular;
4. Livro de Ponto abre pelo cartão/botão;
5. Arquivo Digital e Notas continuam intactos;
6. publicação pode ser criada, editada e excluída;
7. imagem de publicação pode ser enviada;
8. site público renderiza a publicação nova;
9. editor visual abre a Home real;
10. texto pode ser alterado visualmente;
11. bloco pode ser adicionado e movido;
12. alteração pode ser salva no GitHub;
13. nova página pode ser criada e salva em `paginas/`;
14. imagem pode ser inserida pelo editor;
15. undo/redo e visualização responsiva funcionam;
16. nenhuma dependência Vercel/Tina/PHP foi introduzida;
17. nenhum módulo sensível foi modificado fora do escopo.

## 14. Rollback

Enquanto este marco estiver em `feat/admin-visual-builder`, rollback é simplesmente descartar a branch.

Mesmo depois de eventual merge, o baseline anterior permanece identificado pelo commit:

`96e16d599d06768a0ab6a7a0ea807b94a838a168`

Não fazer rollback por exclusões manuais de arquivos sem antes comparar com esse baseline.

## 15. Próximos marcos após validação

Somente depois do editor básico aprovado:

- refinar os blocos próprios da Escola Iêda;
- definir modelos de novas páginas;
- esconder ainda mais controles técnicos do VvvebJs se necessário;
- criar biblioteca de mídia mais amigável;
- revisar navegação pública do site;
- eventualmente modernizar a Home oficial usando o próprio editor visual.

A prioridade é validar a experiência completa antes de acrescentar novos recursos.
