# Método geral de desenvolvimento e manutenção

## 1. Antes de executar

Todo projeto relevante deve começar com um documento-base detalhado contendo objetivo, escopo, arquitetura inicial, dependências, restrições, riscos, critérios de sucesso, plano de testes, plano de rollback e próximos marcos.

Esse documento não precisa estar perfeito, mas deve existir antes da execução para impedir que decisões importantes fiquem dispersas apenas no chat.

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
3. Fazer backup
4. Alterar o mínimo
5. Validar sintaxe/contrato
6. Testar comportamento alterado
7. Testar regressão direta
8. Confirmar estado estável
9. Registrar no GitHub
10. Atualizar baseline se aprovado
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

## 7. Desenvolvimento orientado à definição

Quando o editor visual se torna gargalo, considerar JSON/API/CLI/PowerShell/arquivos declarativos.

Antes disso, garantir:

- backup confiável;
- entendimento do formato;
- validação local;
- validação pós-escrita;
- rollback;
- versionamento.

## 8. Configuração parametrizada

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

## 9. Automação só depois de conhecimento suficiente

Uma tarefa manual repetitiva vira boa candidata a automação quando:

- já foi executada com sucesso;
- variações são conhecidas;
- erros comuns são conhecidos;
- entradas e saídas estão definidas;
- rollback é possível.

## 10. Encerramento de projeto

Antes de considerar um projeto concluído:

- atualizar resumo simples;
- consolidar documentação técnica;
- registrar versão estável;
- registrar erros conhecidos;
- registrar recuperação;
- registrar comandos/atalhos reutilizáveis;
- separar histórico de documentação vigente;
- garantir que outra IA possa retomar o projeto lendo o repositório.
