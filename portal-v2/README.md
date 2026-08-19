# Portal Escola Iêda V2

Nova geração do `escolaieda.com`, desenvolvida de forma isolada enquanto a Home oficial atual permanece em produção.

## Estado atual

- Home visual V2 aprovada como base;
- Astro funcionando e publicado para testes em `https://escolaieda.com/v2/`;
- animações e responsividade implementadas;
- conteúdo público separado de recursos internos da escola;
- Home dividida em componentes reutilizáveis;
- conteúdo da Home armazenado em `content/home/home.json`;
- componentes consomem o JSON sem misturar conteúdo e apresentação;
- esquema TinaCMS definido em `tina/config.ts`;
- coleção `Página inicial` configurada como documento único/global;
- branch `v2/home-visual` preservada como baseline visual estável;
- a raiz `https://escolaieda.com/` continua usando a Home oficial atual.

## Estrutura da Home

- `SiteHeader.astro` — cabeçalho e navegação;
- `Hero.astro` — capa principal e identidade visual;
- `QuickLinks.astro` — acessos públicos principais;
- `InfoBanner.astro` — faixa informativa;
- `SchoolOverview.astro` — apresentação e dados institucionais;
- `ContactSection.astro` — contato público;
- `SiteFooter.astro` — rodapé;
- `content/home/home.json` — fonte única do conteúdo editável da Home;
- `src/data/home.ts` — adaptador simples entre o conteúdo e os componentes;
- `tina/config.ts` — modelo do CMS.

## Estratégia

1. ~~validar uma Home moderna em Astro puro~~ — concluído;
2. ~~consolidar componentes e separar conteúdo da apresentação~~ — concluído;
3. ~~mover a Home para uma fonte de conteúdo estruturada~~ — concluído;
4. validar o esquema do CMS em CI — em andamento;
5. conectar o backend de edição e publicar o painel de teste em `/v2/admin/`;
6. validar o painel com usuário leigo;
7. decidir se a edição visual completa exige migração da V2 para um host com suporte a rotas dinâmicas;
8. substituir a Home atual somente após aprovação final.

## Comandos de desenvolvimento

```bash
npm install
npm run dev
```

## Validação

```bash
npm run cms:audit
npm run check
npm run build
```

## Regra de segurança

A publicação automática da V2 pode atualizar somente a pasta `/v2/` na `main`. Ela não pode substituir o `index.html` da raiz nem os sistemas existentes. A migração da Home oficial só ocorre após validação visual, técnica e administrativa.
