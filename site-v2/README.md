# Escola Iêda V2

Nova geração do portal institucional da Escola Iêda MCPM. Esta pasta é isolada do site atual e não substitui a `main` enquanto o protótipo não estiver validado.

## Base técnica
- Astro + TypeScript
- TinaCMS em `/admin`
- Edição visual por blocos
- Conteúdo estruturado e versionável em Git
- CSS próprio com design tokens

## Executar localmente
Requer Node.js 22.22 ou superior.

```bash
cd site-v2
npm install
npm run dev
```

Site: `http://localhost:4321/`
Admin: `http://localhost:4321/admin/`

Para desenvolvimento local, o Tina pode operar com conteúdo local. Para ambiente compartilhado/produção, configurar `PUBLIC_TINA_CLIENT_ID` e `TINA_TOKEN` ou adotar self-hosting conforme decisão posterior.

## Estado atual
A fundação inicial contém uma Home de prova de conceito com quatro blocos: capa, acessos rápidos, aviso importante e números da escola. O objetivo do primeiro marco é validar edição visual real antes de ampliar o escopo.
