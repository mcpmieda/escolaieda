# Decisions — App Factory

Registro das decisões vigentes. Decisões substituídas devem ser marcadas, não apagadas silenciosamente.

## D-001 — Factory independente dos projetos

**Status:** vigente

A App Factory deve terminar em repositório próprio. A pasta atual em `escolaieda` é apenas staging da V0.1 porque a integração disponível não cria repositórios novos.

## D-002 — Não usar um documento monolítico

**Status:** vigente

O agente recebe um mapa curto (`AGENTS.md`) e carrega módulos/Skills conforme a necessidade. Evitar manual gigante sempre carregado no contexto.

## D-003 — GitHub como fonte de verdade

**Status:** vigente

Conversas não são mecanismo principal de continuidade. Código, estado, decisões e verificações ficam versionados.

## D-004 — Portável entre agentes

**Status:** vigente

A Factory deve funcionar principalmente com ChatGPT + Codex, mas não pode depender deles para seu núcleo. Claude Code, Cursor e futuros agentes devem poder consumir o mesmo conhecimento por adaptadores pequenos.

## D-005 — Roteador ChatGPT/Codex

**Status:** vigente

A Factory deve dizer ao usuário em qual ambiente executar cada fase. ChatGPT é preferido para pensamento/pesquisa/revisão; Codex para ambiente real, terminal, múltiplos arquivos e validação executável.

## D-006 — Menor trabalho humano

**Status:** vigente

O agente faz tudo que puder fazer com segurança. Não manda o usuário executar comandos, copiar arquivos ou escolher detalhes técnicos rotineiros se o agente puder assumir isso.

## D-007 — Grandes blocos funcionais

**Status:** vigente

Abandonar trabalho de formiguinha como padrão. Escopo deve ser fechado, porém amplo o bastante para entregar uma capacidade verificável de ponta a ponta.

## D-008 — Baseline/diff é forte em manutenção, não dogma para criação

**Status:** vigente

Preservar baseline, rollback e revisão por impacto em sistemas existentes. Em projeto novo, não fragmentar construção artificialmente apenas para manter diffs minúsculos.

## D-009 — UI padrão por contexto

**Status:** vigente

Admin/dashboard/CRUD: avaliar primeiro shadcn + ReUI. HeroUI é alternativa seletiva quando fizer sentido como design system principal. Não misturar os três automaticamente.

## D-010 — Reutilizar antes de criar

**Status:** vigente

Pesquisar registries, componentes, starters, bibliotecas e repositórios antes de implementar equivalente do zero.

## D-011 — Pesquisa antes da V1

**Status:** vigente

Avaliar aproximadamente 30–50 referências fortes e classificar como ADOTAR / INSPIRAR / DESCARTAR antes de congelar o starter e a arquitetura V1.

## D-012 — Boas práticas antigas são origem histórica

**Status:** vigente

A pasta `Boas práticas/` contém princípios úteis, mas não será copiada integralmente. O núcleo foi extraído e a repetição deve ser removida. Guardrails devem migrar de texto para mecanismos executáveis quando possível.

## D-013 — Agent Skills e progressive disclosure

**Status:** vigente

Usar Skills modulares no padrão aberto sempre que possível. Carregar conhecimento especializado apenas quando a tarefa o exigir.

## D-014 — Registry/MCP após validação real

**Status:** vigente

Não criar catálogo grande de componentes antes de validar starter/projeto piloto. Promover ao Registry somente itens realmente reutilizáveis e testados.

## D-015 — Começar privado

**Status:** vigente

O futuro repositório próprio deve começar privado. Tornar público apenas após sanitização e quando houver benefício claro; GitHub Registry público pode ser reavaliado nessa fase.

## D-016 — Stack não congelada prematuramente

**Status:** vigente

Next.js/React/TypeScript e ferramentas relacionadas são candidatas fortes para web apps, mas a V1 final deve ser definida após pesquisa e piloto. A Factory precisa escolher tecnologia conforme o tipo de aplicação.

## D-017 — Validação faz parte da implementação

**Status:** vigente

Build isolado não prova UX nem comportamento. Projetos com UI devem usar teste real de navegador/E2E quando apropriado; erros conhecidos devem ser relatados, não mascarados.

## D-018 — Governança proporcional

**Status:** vigente

Projeto simples não recebe automaticamente toda a burocracia de projeto crítico. Documentação, branch protection, runbooks, feature flags e gates crescem conforme risco e complexidade.