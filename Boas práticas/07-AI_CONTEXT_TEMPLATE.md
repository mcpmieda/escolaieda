# AI_CONTEXT — template para continuidade por IA

Este arquivo deve existir dentro de cada projeto relevante. Ele é um resumo técnico condensado para permitir que uma nova IA continue o trabalho rapidamente, sem precisar reler todo o histórico.

> Regra: manter apenas contexto vigente e decisões que realmente alteram como o projeto deve ser tratado. Não usar como diário.

## Como usar no início de uma sessão

Quando a IA tiver acesso ao repositório, ela deve localizar e ler este arquivo diretamente antes de pedir contexto adicional ao usuário.

Prioridade de acesso:

```text
conector do GitHub/repositório
→ API/ferramenta do ambiente
→ URL pública/raw quando aplicável
→ pedir ao usuário somente se não houver acesso
```

Depois da leitura, a IA deve conseguir identificar internamente pelo menos:

```text
objetivo
baseline seguro
estado atual
próxima ação concreta
```

Não é obrigatório responder ao usuário com um ritual fixo se isso não agregar valor; o importante é que o contexto seja recuperado antes de agir.

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

Se houver vários componentes, apontar também para diagrama Mermaid ou arquivo de arquitetura.

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
- backup e rollback antes de mudança estrutural;
- gates proporcionais ao risco.

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
Lista curta dos comportamentos que uma alteração relevante não pode quebrar.

Preferir descrição por contrato:

```text
entrada/condição
→ comportamento esperado
→ resultado/estado esperado
```

## Erros conhecidos importantes
Sintoma → causa → solução resumida.

## Segurança
- dados que não podem ir para repositório;
- contas técnicas;
- política de privilégio mínimo;
- arquivos locais ignorados;
- guardrails automáticos importantes.

## Operação e recuperação
Resumo do runbook e do rollback.

## Rollout/kill switch
Se aplicável, indicar como ativar/desativar funcionalidade de risco e como voltar ao comportamento seguro.

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
7. Classifique risco antes de escrever.
8. Não peça que o usuário reexplique contexto que pode ser recuperado daqui ou do repositório.
```

## Como usar no encerramento de uma sessão ou marco

Quando o estado vigente tiver mudado, atualizar este arquivo com:

- novo baseline, se aprovado;
- funcionalidades validadas;
- limitações novas;
- erro importante que muda decisões futuras;
- próxima ação concreta.

O histórico detalhado deve ir para changelog/checkpoints. O `AI_CONTEXT.md` deve continuar curto e atual.

## Relação com outros documentos

`AI_CONTEXT.md` não substitui:

- `DOCUMENTO_BASE.md` — visão detalhada do projeto;
- `DECISOES.md` — histórico formal das decisões;
- `CHANGELOG_DEV.md` — avanços por versão;
- `TESTES.md` — evidências de teste;
- `RUNBOOK.md` — operação e recuperação;
- `POSTMORTEM_*.md` — análise de incidentes graves quando necessária.

Ele serve como índice inteligente e contexto rápido para IA.
