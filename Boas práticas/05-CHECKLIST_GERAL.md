# Checklist geral de projeto técnico

## Antes de começar

```text
[ ] Objetivo definido em linguagem simples
[ ] Impacto x esforço avaliados
[ ] Documento-base criado se o projeto for relevante
[ ] Escopo e fora de escopo definidos
[ ] Arquitetura inicial registrada
[ ] Diagrama Mermaid criado quando ajudar a entender o fluxo
[ ] Dependências identificadas
[ ] Restrições permanentes registradas
[ ] Critérios de sucesso definidos
[ ] Comportamentos esperados transformáveis em testes identificados
[ ] Plano de testes definido
[ ] Plano de rollback definido
[ ] Riscos conhecidos registrados
[ ] Repositório/pasta do projeto preparado
[ ] AI_CONTEXT criado para projeto relevante
```

## Ao retomar um projeto

```text
[ ] AI_CONTEXT recuperado do repositório quando acessível
[ ] Objetivo vigente confirmado
[ ] Baseline seguro identificado
[ ] Últimos checkpoints lidos
[ ] Próxima ação concreta identificada
[ ] Usuário não foi obrigado a reexplicar contexto já disponível
```

## Antes de alterar algo existente

```text
[ ] Baseline estável identificado
[ ] Commit/versão segura registrada
[ ] Escopo da mudança fechado
[ ] Risco classificado: baixo / médio / alto
[ ] Dependências diretas conhecidas
[ ] Backup criado se a alteração for estrutural
[ ] Contrato/schema atual validado
[ ] Impacto em permissões/conexões avaliado
[ ] Se alto risco: impacto/diff, backup e rollback confirmados antes da escrita
```

## Durante a implementação

```text
[ ] Alterar somente o necessário
[ ] Separar configuração de lógica
[ ] Não copiar IDs entre ambientes
[ ] Falhar em ambiguidade
[ ] Preferir operações idempotentes
[ ] Adicionar logs/estado quando necessário
[ ] Criar validação para erros importantes encontrados
[ ] Preferir guardrail automático quando substituir memória manual com segurança
[ ] Registrar avanço relevante no GitHub
```

## Antes de escrever em produção

```text
[ ] Sintaxe/JSON/schema válidos
[ ] Referências válidas
[ ] Versão/checkpoint esperado confirmado
[ ] Backup disponível
[ ] Teste controlado definido
[ ] Rollback conhecido
[ ] Permissões mínimas suficientes
[ ] Rollout gradual avaliado
[ ] Kill switch/feature flag avaliado se o risco justificar
[ ] Autorização explícita de escrita confirmada quando ainda não estiver coberta pela solicitação
```

## Depois da mudança

```text
[ ] Reler estado real do sistema
[ ] Confirmar que a alteração foi aplicada
[ ] Executar teste específico da mudança
[ ] Executar regressão direta
[ ] Confirmar estado estável
[ ] Confirmar ausência de efeito colateral relevante
[ ] Atualizar changelog/checkpoint
[ ] Atualizar AI_CONTEXT se o estado vigente mudou
[ ] Atualizar baseline se aprovado
```

## Antes de automatizar processo manual

```text
[ ] Processo manual já funcionou
[ ] Variações conhecidas
[ ] Entradas definidas
[ ] Saídas definidas
[ ] Erros comuns documentados
[ ] Ambiguidades tratadas
[ ] Rollback possível
[ ] Configuração parametrizada
[ ] Guardrails/preflight definidos
```

## GitHub e segurança

```text
[ ] .gitignore cobre arquivos locais/sensíveis
[ ] Secret scanning/push protection avaliados
[ ] Checks automáticos avaliados
[ ] Branch protection/ruleset avaliado conforme criticidade
[ ] Commits têm intenção clara
[ ] Automação de release só existe se a estratégia de versionamento estiver definida
```

## Se ocorrer incidente grave

```text
[ ] Contenção executada
[ ] Impacto real medido
[ ] Causa raiz investigada
[ ] Post-mortem criado
[ ] Ação corretiva registrada
[ ] Ação preventiva transformada em teste/check/preflight quando possível
[ ] Baseline seguro restaurado ou redefinido
```

## Antes de encerrar o projeto

```text
[ ] README simples atualizado
[ ] Documento técnico final atualizado
[ ] AI_CONTEXT atualizado
[ ] Decisões registradas
[ ] Erros conhecidos documentados
[ ] Testes finais registrados
[ ] Runbook criado/atualizado
[ ] Versão estável registrada
[ ] Backup/recovery documentado
[ ] Dados sensíveis removidos do repositório
[ ] Próximas evoluções separadas da versão concluída
[ ] Outra IA conseguiria continuar somente lendo o GitHub
```
