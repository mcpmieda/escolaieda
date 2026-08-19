# Método geral de desenvolvimento e manutenção

## 1. Antes de executar

Todo projeto relevante deve começar com um documento-base detalhado contendo objetivo, escopo, arquitetura inicial, dependências, restrições, riscos, critérios de sucesso, plano de testes, plano de rollback e próximos marcos.

Esse documento não precisa estar perfeito, mas deve existir antes da execução para impedir que decisões importantes fiquem dispersas apenas no chat.

Para tarefas pequenas, usar triagem rápida antes de criar estrutura pesada:

```text
alto impacto + baixo esforço  → priorizar
alto impacto + alto esforço   → planejar formalmente
baixo impacto + baixo esforço → fazer se útil
baixo impacto + alto esforço  → normalmente descartar
```

## 2. Criar um baseline estável

Definir explicitamente a última versão conhecida como segura.

Registrar:

- versão/tag/commit;
- comportamento validado;
- limitações conhecidas;
- testes que passaram;
- arquivos principais;
- instruções para voltar a esse ponto.

O baseline é o ponto de retorno quando uma tentativa falha.

## 3. Escopo incremental

Cada alteração deve ter escopo fechado.

Exemplo:

```text
Objetivo: adicionar reconciliação de 24h
Não alterar: lógica de associação, regras, permissões e interface
Validar: detecção, retry, profundidade, execução seguinte estável
Rollback: clientdata anterior
```

Evitar alterar várias dimensões independentes ao mesmo tempo.

## 4. Revisão por impacto

Após uma mudança, revisar prioritariamente:

- função alterada;
- chamadas/dependências diretas;
- dados de entrada e saída;
- interface afetada;
- permissões afetadas;
- testes relacionados;
- logs/erros relacionados.

Auditoria completa somente quando:

- o sistema mudou muito;
- existe incidente sistêmico;
- será publicada versão final;
- dependências principais foram substituídas;
- não existe baseline confiável.

## 5. Fluxo de alteração segura

```text
1. Definir escopo
2. Confirmar baseline
3. Classificar risco da mudança
4. Fazer backup se necessário
5. Alterar o mínimo
6. Validar sintaxe/contrato
7. Testar comportamento alterado
8. Testar regressão direta
9. Confirmar estado estável
10. Registrar no GitHub
11. Atualizar baseline se aprovado
```

## 6. Testes por camadas

### Camada A — validação estática

- sintaxe;
- schema;
- referências;
- tipos;
- configuração;
- dependências.

### Camada B — teste controlado

- usuário/objeto de teste;
- dados limitados;
- nenhuma operação em massa;
- resultado esperado explícito.

### Camada C — smoke test

Confirmar que a operação comum continua funcionando depois da mudança.

### Camada D — regressão dirigida

Repetir somente os testes que podem ter sido afetados pela mudança.

### Camada E — auditoria completa

Reservada para marcos finais ou quando realmente necessária.

## 7. Testes derivados do comportamento

Sempre que possível, definir o teste a partir da regra de negócio antes de olhar a implementação.

Exemplo:

```text
Comportamento esperado:
“Executar a mesma operação duas vezes não duplica o registro.”

Teste:
1. executar
2. repetir
3. confirmar um único resultado final
```

Esse estilo cria contratos mais duráveis e evita testes excessivamente acoplados à estrutura interna do código.

## 8. Desenvolvimento orientado à definição

Quando o editor visual se torna gargalo, considerar JSON/API/CLI/PowerShell/arquivos declarativos.

Antes disso, garantir:

- backup confiável;
- entendimento do formato;
- validação local;
- validação pós-escrita;
- rollback;
- versionamento.

## 9. Configuração parametrizada

Projetos que podem migrar ou escalar devem usar:

```text
CONFIG.example.*   → modelo público
CONFIG.local.*     → configuração real, fora do Git
```

O instalador deve descobrir automaticamente o máximo possível:

- IDs;
- URLs de ambiente;
- referências;
- objetos reais;
- capacidades disponíveis.

## 10. Automação só depois de conhecimento suficiente

Uma tarefa manual repetitiva vira boa candidata a automação quando:

- já foi executada com sucesso;
- variações são conhecidas;
- erros comuns são conhecidos;
- entradas e saídas estão definidas;
- rollback é possível.

## 11. Guardrails antes da execução

Sempre que uma regra importante depender de lembrar manualmente, avaliar se ela pode virar:

```text
preflight
validação estática
lint
check de CI
teste automatizado
proteção de branch
script
assert
```

A automação do guardrail deve ser proporcional ao risco e não criar manutenção maior que o problema prevenido.

## 12. Rollout controlado

Para mudanças de maior risco, avaliar implantação gradual:

```text
teste local/controlado
→ piloto
→ produção limitada
→ produção ampla
```

Se a funcionalidade puder precisar de desligamento rápido, considerar kill switch/feature flag compatível com a arquitetura existente.

## 13. Início de sessão de trabalho

Se existir `AI_CONTEXT.md`, recuperar primeiro:

- objetivo;
- baseline;
- estado atual;
- próxima ação.

Não pedir que o usuário reexplique contexto já disponível no repositório.

## 14. Encerramento de sessão ou marco

Ao concluir trabalho relevante:

- atualizar resumo simples quando necessário;
- registrar checkpoint/changelog;
- atualizar `AI_CONTEXT.md` se o estado vigente mudou;
- registrar testes relevantes;
- registrar versão estável quando aprovada;
- registrar erros/aprendizados;
- deixar próxima ação concreta.

## 15. Encerramento de projeto

Antes de considerar um projeto concluído:

- atualizar resumo simples;
- consolidar documentação técnica;
- registrar versão estável;
- registrar erros conhecidos;
- registrar recuperação;
- registrar comandos/atalhos reutilizáveis;
- separar histórico de documentação vigente;
- garantir que outra IA possa retomar o projeto lendo o repositório.
