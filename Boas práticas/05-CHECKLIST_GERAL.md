# Checklist geral de projeto técnico

## Antes de começar

```text
[ ] Objetivo definido em linguagem simples
[ ] Documento-base criado
[ ] Escopo e fora de escopo definidos
[ ] Arquitetura inicial registrada
[ ] Dependências identificadas
[ ] Restrições permanentes registradas
[ ] Critérios de sucesso definidos
[ ] Plano de testes definido
[ ] Plano de rollback definido
[ ] Riscos conhecidos registrados
[ ] Repositório/pasta do projeto preparado
```

## Antes de alterar algo existente

```text
[ ] Baseline estável identificado
[ ] Commit/versão segura registrada
[ ] Escopo da mudança fechado
[ ] Dependências diretas conhecidas
[ ] Backup criado se a alteração for estrutural
[ ] Contrato/schema atual validado
[ ] Impacto em permissões/conexões avaliado
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
