# Starters

A Factory deve iniciar projetos a partir de bases testadas, não de pastas vazias, quando houver um starter adequado.

## Primeiros starters planejados

1. `web-admin` — sistema administrativo/dashboard.
2. `web-app` — aplicação web full-stack geral.
3. `website` — site institucional/conteúdo.
4. `chrome-extension` — extensão Chrome moderna.
5. `automation` — automação/script/integração.

## Estratégia

Cada starter deve conter apenas o que for universalmente útil para aquele tipo de projeto:

- estrutura;
- configuração;
- testes;
- lint/typecheck;
- CI;
- documentação mínima;
- design system quando aplicável;
- `AGENTS.md`/ponte para Factory;
- `PROJECT_STATE.md` inicial.

Não incluir banco, auth, analytics ou serviços externos em todo starter se o projeto não precisar.

## Primeiro candidato

O primeiro starter a ser construído e testado será `web-admin`, com forte avaliação de shadcn + ReUI. A stack final será definida após a pesquisa estruturada da V0.2, não congelada prematuramente.