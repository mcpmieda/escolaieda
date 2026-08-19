# Portal Escola Iêda V2

Nova geração do `escolaieda.com`, desenvolvida de forma isolada enquanto o site atual permanece em produção.

## Estado atual

- Home visual V2 aprovada como base;
- Astro funcionando em ambiente real;
- animações e responsividade implementadas;
- conteúdo público separado de recursos internos da escola;
- Home dividida em componentes reutilizáveis;
- conteúdo textual e dados principais separados da estrutura visual em `src/data/home.ts`;
- site atual e branch `main` permanecem intactos.

## Estrutura da Home

- `SiteHeader.astro` — cabeçalho e navegação;
- `Hero.astro` — capa principal e identidade visual;
- `QuickLinks.astro` — acessos públicos principais;
- `InfoBanner.astro` — faixa informativa;
- `SchoolOverview.astro` — apresentação e dados institucionais;
- `ContactSection.astro` — contato público;
- `SiteFooter.astro` — rodapé;
- `src/data/home.ts` — dados consumidos pelos componentes.

## Estratégia

1. ~~validar uma Home moderna em Astro puro~~ — concluído;
2. ~~consolidar componentes e separar conteúdo da apresentação~~ — concluído;
3. integrar o CMS ao `/admin` sobre os componentes aprovados — próximo marco;
4. validar edição por usuário leigo e preview visual;
5. publicar uma V2 de teste;
6. substituir o site atual somente após aprovação final.

## Executar

```bash
npm install
npm run dev
```

## Validar

```bash
npm run check
npm run build
```

## Regra de segurança

Nenhuma etapa da V2 deve substituir automaticamente a `main` ou o site oficial. A migração só ocorre depois de validação visual, técnica e de administração.
