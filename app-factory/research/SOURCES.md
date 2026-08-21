# Sources — referências iniciais

Este arquivo registra fontes que influenciam a Factory. Uma referência não vira regra automaticamente: primeiro deve ser avaliada criticamente.

## Padrões de agentes

### OpenAI Codex

- https://openai.com/codex/
- https://openai.com/index/introducing-codex/

Uso: `AGENTS.md`, desenvolvimento agentic, worktrees, Skills, execução verificável.

### Anthropic Agent Skills / Claude Code

- https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- https://www.anthropic.com/webinars/claude-code-foundations

Uso: Skills portáveis, `SKILL.md`, progressive disclosure, contexto do repositório, subagentes/MCP como referência arquitetural.

## UI e Registry

### shadcn/ui

- https://ui.shadcn.com/docs/registry
- https://ui.shadcn.com/docs/registry/github
- https://ui.shadcn.com/docs/mcp

Uso: registry distribuindo componentes, páginas, regras, workflows, testes e automações; MCP para agentes pesquisarem e instalarem itens.

### ReUI

- https://reui.io/

Uso: referência de componentes e padrões avançados para sistemas sobre ecossistema shadcn. Validar documentação/licença/integração antes de cada adoção concreta.

### HeroUI

- https://www.heroui.com/

Uso: alternativa de design system para aplicações em que seja mais adequada que shadcn/ReUI.

## Origem interna

A pasta histórica `Boas práticas/` do repositório `mcpmieda/escolaieda` é a fonte da V0 da filosofia da Factory. Seus princípios foram filtrados; não devem ser copiados integralmente nem carregados em todo contexto.

## Regra de pesquisa

Para novas fontes registrar:

- problema que resolve;
- licença;
- manutenção/atividade;
- qualidade arquitetural;
- testes;
- dependências;
- segurança;
- compatibilidade;
- decisão: **ADOTAR / INSPIRAR / DESCARTAR**;
- justificativa curta.