# Portal Escola Iêda V2

Nova geração do `escolaieda.com`, mantida em paralelo com a Home oficial atual.

## Arquitetura adotada

A fonte da V2 fica em `portal-v2/` na branch `main`, mas a Home oficial da raiz continua independente.

- `https://escolaieda.com/` — site oficial atual, preservado durante os testes;
- `https://escolaieda.com/v2/` — preview público da nova Home;
- `https://escolaieda.com/v2/admin/` — painel TinaCMS da V2;
- `portal-v2/` — código-fonte Astro + conteúdo + configuração TinaCMS;
- `v2/` — saída estática compilada e publicada automaticamente.

Essa organização elimina a necessidade de Codespaces, terminal e sincronização manual de branches para o uso cotidiano do CMS.

## Estado atual

- Home visual V2 aprovada como base;
- Astro 6 com TypeScript;
- animações e responsividade implementadas;
- conteúdo público separado de recursos internos da escola;
- Home dividida em componentes reutilizáveis;
- conteúdo editável em `content/home/home.json`;
- esquema TinaCMS em `tina/config.ts`;
- `tina/tina-lock.json` versionado para indexação do TinaCloud;
- TinaCloud conectado ao repositório;
- secrets `TINA_PUBLIC_CLIENT_ID` e `TINA_TOKEN` armazenados no GitHub Actions;
- `v2/home-visual` preservada como baseline visual anterior.

## Estrutura da Home

- `src/components/SiteHeader.astro` — cabeçalho e navegação;
- `src/components/Hero.astro` — capa principal e identidade visual;
- `src/components/QuickLinks.astro` — acessos públicos principais;
- `src/components/InfoBanner.astro` — faixa informativa;
- `src/components/SchoolOverview.astro` — apresentação e dados institucionais;
- `src/components/ContactSection.astro` — contato público;
- `src/components/SiteFooter.astro` — rodapé;
- `content/home/home.json` — fonte única do conteúdo editável;
- `src/data/home.ts` — adaptador entre conteúdo e componentes;
- `tina/config.ts` — modelo e configuração do CMS.

## Publicação automática

O workflow `.github/workflows/portal-v2-cms-ci.yml` observa alterações em `portal-v2/**` na `main`.

Fluxo:

1. instala dependências com `npm ci`;
2. audita o conteúdo TinaCMS;
3. executa `astro check`;
4. compila o site;
5. compila o painel TinaCMS usando os secrets do GitHub;
6. substitui somente a pasta `/v2/` pelo novo build;
7. mantém `index.html` da raiz e os sistemas existentes intactos.

Alterações feitas pelo painel TinaCMS no conteúdo da V2 acionam esse mesmo fluxo automaticamente.

## Segurança e rollback

A V2 não substitui automaticamente a Home oficial. Durante os testes, o workflow pode modificar somente a pasta `/v2/` e os próprios arquivos-fonte de `portal-v2/` quando houver edição autorizada pelo CMS.

As branches `v2/home-visual` e `v2/cms-integration` permanecem como referências históricas e pontos de recuperação durante a implantação.

A troca da Home oficial só será feita depois de validação visual, técnica e administrativa.
