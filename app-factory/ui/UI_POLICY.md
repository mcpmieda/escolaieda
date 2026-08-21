# UI Policy

## Objetivo

Produzir interfaces atuais, consistentes e fáceis de manter sem transformar a aplicação em uma colagem de bibliotecas.

## Seleção padrão

### Admin, dashboard, CRUD, ferramentas internas

Preferência inicial: **shadcn + ReUI**.

Motivos:
- composição e propriedade do código;
- grande ecossistema;
- facilidade de customização por agentes;
- ReUI oferece padrões avançados compatíveis com a abordagem shadcn.

### Aplicações altamente visuais

Avaliar **HeroUI** como design system principal quando oferecer vantagem clara no produto. Não adicioná-lo apenas para usar alguns componentes decorativos se o projeto já estiver coeso em shadcn/ReUI.

## Regras

1. Pesquisar antes de construir componente equivalente.
2. Consultar registry/MCP quando disponível.
3. Preferir blocks/padrões completos quando reduzirem trabalho sem importar complexidade inútil.
4. Verificar licença, manutenção, dependências e compatibilidade antes de incorporar repositório externo.
5. Evitar dependências duplicadas para a mesma função.
6. Preservar o design system vigente em manutenção, salvo redesign explícito.
7. Criar tokens e convenções locais para que o produto não dependa visualmente de defaults da biblioteca.

## Padrões mínimos de tela

Quando aplicável, tratar:
- loading;
- empty state;
- error state;
- success feedback;
- disabled;
- foco/teclado;
- responsividade;
- contraste/acessibilidade;
- densidade adequada ao contexto.

## Registry futuro

A Factory deverá distribuir componentes, layouts, páginas, convenções, testes e configurações aprovadas por registry. O objetivo é permitir que agentes instalem padrões já validados em vez de recriá-los em cada projeto.