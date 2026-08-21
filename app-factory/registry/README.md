# Registry / MCP Layer

## Objetivo

Distribuir padrões validados para novos projetos sem copiar manualmente arquivos ou reescrever prompts.

Itens futuros podem incluir:

- componentes UI;
- layouts completos;
- páginas;
- configurações;
- `AGENTS.md` e adaptadores;
- Skills;
- setup de testes;
- scripts;
- workflows de CI;
- convenções de projeto.

## shadcn Registry

A Factory deverá avaliar o formato `registry.json` como mecanismo principal para itens compatíveis com o ecossistema shadcn. MCP pode permitir que agentes pesquisem e instalem itens em linguagem natural.

## Estado atual

Não criar um catálogo grande antes de existir código realmente validado. Primeiro construir e testar o starter/piloto; depois promover itens reutilizáveis para o Registry.

## Privacidade

O formato de GitHub Registry direto exige repositório público. Enquanto a Factory for privada, avaliar registry com endpoint/autenticação ou manter esta camada em preparação. Não tornar o repositório público apenas para ganhar conveniência técnica.