# AI_CONTEXT — template para continuidade por IA

Este arquivo deve existir dentro de cada projeto relevante. Ele é um resumo técnico condensado para permitir que uma nova IA continue o trabalho rapidamente, sem precisar reler todo o histórico.

> Regra: manter apenas contexto vigente e decisões que realmente alteram como o projeto deve ser tratado. Não usar como diário.

## Template

```markdown
# AI_CONTEXT — NOME DO PROJETO

## Objetivo
Uma frase clara descrevendo o resultado final esperado.

## Estado atual
- fase atual;
- versão/baseline seguro;
- funcionalidades já validadas;
- limitações conhecidas.

## Arquitetura
Resumo dos componentes e do fluxo de dados.

## Restrições obrigatórias
- custo;
- compatibilidade;
- segurança;
- regras de negócio;
- comportamentos que não podem ser quebrados.

## Baseline seguro
- versão/tag/commit;
- por que é seguro;
- tentativas descartadas que não devem ser reutilizadas.

## Método de trabalho
- mudanças incrementais;
- revisar por diff;
- auditar somente impacto direto;
- auditoria completa apenas em marco final/incidente amplo;
- backup e rollback antes de mudança estrutural.

## Decisões vigentes
- D-001 ...
- D-002 ...

## Dependências principais
- APIs;
- serviços;
- bibliotecas;
- conectores;
- permissões.

## Configuração por ambiente
O que varia e deve ser descoberto/parametrizado.

## Testes obrigatórios
Lista curta dos testes que uma alteração relevante não pode quebrar.

## Erros conhecidos importantes
Sintoma → causa → solução resumida.

## Segurança
- dados que não podem ir para repositório;
- contas técnicas;
- política de privilégio mínimo;
- arquivos locais ignorados.

## Operação e recuperação
Resumo do runbook e do rollback.

## Últimos checkpoints
Somente marcos relevantes recentes, com commit ou versão.

## Próxima ação concreta
O próximo bloco de trabalho, com escopo fechado.

## Instruções para a IA
1. Verifique se há caminho melhor antes de executar uma abordagem inferior.
2. Não altere fora do escopo sem explicar necessidade.
3. Não invente IDs nem escolha resultados ambíguos.
4. Use o baseline seguro como ponto de retorno.
5. Registre avanços relevantes no GitHub.
6. Transforme erros importantes em validações/testes.
```

## Relação com outros documentos

`AI_CONTEXT.md` não substitui:

- `DOCUMENTO_BASE.md` — visão detalhada do projeto;
- `DECISOES.md` — histórico formal das decisões;
- `CHANGELOG_DEV.md` — avanços por versão;
- `TESTES.md` — evidências de teste;
- `RUNBOOK.md` — operação e recuperação.

Ele serve como índice inteligente e contexto rápido para IA.
