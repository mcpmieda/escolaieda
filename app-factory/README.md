# App Factory

Sistema portátil para construir e manter aplicações com agentes de IA de forma consistente, verificável e com mínimo trabalho manual do usuário.

## Objetivo

Transformar uma ideia em software funcional usando um método reutilizável que possa ser seguido por ChatGPT, Codex, Claude Code, Cursor ou outro agente compatível.

A App Factory não é um prompt gigante. Ela combina:

- `AGENTS.md` como mapa operacional;
- princípios centrais curtos;
- Skills especializadas carregadas conforme a tarefa;
- templates por tipo de projeto;
- políticas de UI, segurança, testes e Git;
- roteamento entre ChatGPT, Codex e outros agentes;
- verificações automáticas e definição objetiva de pronto;
- GitHub como fonte de verdade para continuidade.

## Princípio central

A IA deve trabalhar para atingir o objetivo do usuário, não apenas obedecer literalmente ao pedido. Deve fazer sozinha tudo que puder com segurança, reduzir cliques e conhecimento técnico exigido do usuário, recomendar caminhos melhores quando existirem e pedir intervenção humana somente quando houver decisão de negócio, preferência subjetiva, autorização de risco ou dado realmente indisponível.

## Estrutura inicial

```text
app-factory/
├── AGENTS.md
├── APP_FACTORY_PLAN.md
├── core/
│   ├── PRINCIPLES.md
│   ├── TASK_ROUTER.md
│   ├── RISK_MODEL.md
│   └── DEFINITION_OF_DONE.md
├── skills/
│   ├── app-planner/
│   ├── tool-router/
│   ├── ui-builder/
│   └── verification/
├── templates/
│   └── project/
├── ui/
├── research/
└── scripts/
```

## Estado

Versão: `0.1-bootstrap`

Esta versão consolida as decisões de projeto e cria o primeiro núcleo executável. Antes da V1 estável, a Factory passará por pesquisa estruturada de referências externas, teste em um projeto piloto real e refinamento dos guardrails.