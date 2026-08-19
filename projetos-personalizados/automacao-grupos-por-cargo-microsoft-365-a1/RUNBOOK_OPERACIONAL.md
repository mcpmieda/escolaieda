# RUNBOOK OPERACIONAL

## 1. Objetivo

Guia curto para operar, manter, testar e recuperar a automação sem precisar reler todo o histórico do projeto.

## 2. Saúde normal do fluxo

Sem usuário novo ou alteração recente, o comportamento esperado é:

```text
06_Quantidade_Candidatos = 0
07_Ha_Candidatos = false
```

A execução deve terminar verde.

## 3. Quando um usuário novo é criado

Esperado:

```text
06_Quantidade_Candidatos = 1 ou mais
07_Ha_Candidatos = true
```

Depois do processamento:

- regra correta localizada;
- grupo correto verificado;
- usuário adicionado ou reconhecido como já membro;
- Estado atualizado;
- Log criado;
- execução seguinte volta a zero candidatos.

## 4. O que fazer por Status

### `OK`
Nada a fazer.

### `PENDENTE_CARGO`
Preencher o Cargo no Microsoft 365. Não editar manualmente o Estado para mascarar o problema.

### `SEM_REGRA`
Decidir se o Cargo deve ser automatizado. Se sim, criar uma regra exata. A reconciliação de 24 horas permitirá reavaliar o usuário mesmo sem mudança adicional.

### `PENDENTE_GRUPO`
Revisar a regra:

- `Acao = ADICIONAR`;
- GrupoNome correto;
- GrupoID do tenant atual;
- grupo ainda existe.

O fluxo tenta novamente automaticamente.

### `ERRO`
Abrir a execução do fluxo usando o período/FlowRunID registrado e identificar a primeira ação com falha. Corrigir a causa, não o item de Estado. O retry é automático.

### `DESABILITADO`
Nenhuma remoção é feita. Se a conta voltar a ser habilitada, será reavaliada pela detecção/reconciliação.

### `IGNORADO`
Comportamento esperado para regra `IGNORAR` ou usuário fora do escopo.

## 5. Como adicionar uma nova regra

1. Confirmar o Cargo exato usado no diretório.
2. Normalizar com trim + lowercase, preservando acentos.
3. Confirmar que não existe outra regra ativa com o mesmo CargoNormalizado.
4. Se `ADICIONAR`, localizar o grupo correto e usar o GroupID do tenant atual.
5. Criar a regra.
6. Não editar usuários em massa para forçar execução; aguardar reconciliação ou mudar apenas o Cargo de teste.
7. Validar um usuário controlado primeiro.

## 6. Como alterar o grupo de um Cargo

A V1 é ADD-ONLY.

Se uma regra passar de Grupo A para Grupo B:

- a próxima reavaliação pode adicionar o usuário ao Grupo B;
- o Grupo A não será removido automaticamente.

Se for necessário remover associações antigas, fazer operação administrativa separada e auditada.

## 7. Como validar uma regra nova

Use uma conta de teste ou usuário controlado.

Checklist:

```text
[ ] Cargo exato aplicado
[ ] usuário não está manualmente no grupo-alvo
[ ] candidato detectado
[ ] regra única encontrada
[ ] associação criada
[ ] Estado = OK
[ ] Log criado
[ ] TentativasConsecutivas = 0
[ ] próxima execução = 0 / false
```

## 8. Como testar idempotência

Para um usuário que já está corretamente no grupo:

1. aguardar reconciliação ou envelhecer `UltimaVerificacao` de uma conta de teste;
2. confirmar que ele vira candidato;
3. validar que a operação é `JA_MEMBRO`;
4. confirmar Estado `OK` e novo horário de verificação;
5. confirmar que não foi criada associação duplicada.

## 9. Como testar reconciliação

Em conta de teste:

1. alterar somente `UltimaVerificacao` para mais de 24h atrás;
2. aguardar próxima execução;
3. confirmar candidato;
4. confirmar `JA_MEMBRO` se associação está intacta;
5. confirmar novo Log e `UltimaVerificacao` atualizada;
6. execução seguinte deve voltar a zero.

Teste de reparo:

- remover manualmente a conta de teste do grupo;
- envelhecer/reconciliar;
- confirmar que a automação adiciona novamente.

Não executar esse teste com usuário real sem necessidade.

## 10. Permissões das listas

Configuração final:

### REGRAS

```text
Conta técnica do fluxo → Leitura
Proprietários → Controle Total
```

### ESTADO e LOG

```text
Conta técnica do fluxo → Colaboração
Proprietários → Controle Total
```

Se o fluxo começar a falhar com 403/acesso negado, conferir essas permissões antes de mudar a lógica.

## 11. Alteração do fluxo por código

Nunca alterar `clientdata` diretamente sem este processo:

```text
1. Ler fluxo atual
2. Validar versão/checkpoint
3. Salvar backup local
4. Construir nova definição
5. Validar JSON
6. Validar profundidade <= 8
7. Validar runAfter no mesmo nível
8. Desativar fluxo
9. PATCH
10. Reler servidor
11. Validar estrutura
12. Reativar
```

Em falha após PATCH:

```text
restaurar clientdata anterior
reativar fluxo
confirmar execução verde
```

## 12. Backup mínimo obrigatório

Guardar localmente:

- último `clientdata` estável;
- metadados locais do workflow;
- configuração local do tenant;
- versão do instalador/template utilizado.

Não commitar esses arquivos em repositório público se contiverem identificadores internos.

## 13. Recuperação rápida do fluxo

Se o fluxo ficar inválido após uma mudança:

1. não fazer nova alteração no designer;
2. usar o backup imediatamente anterior;
3. desativar o workflow se ainda estiver ativo em estado inconsistente;
4. restaurar `clientdata`;
5. reativar;
6. aguardar uma execução automática;
7. confirmar `0 / false` em estado estável;
8. registrar a causa no GitHub sanitizado.

## 14. Conexões

Conexões necessárias:

```text
Office 365 Users
SharePoint Online
Office 365 Groups
```

Se uma conexão expirar ou for removida:

1. reparar/recriar a conexão com a conta técnica estável;
2. confirmar Connection Reference;
3. testar fluxo;
4. não recriar todo o fluxo.

## 15. Frequência e consumo

Recorrência atual: 2 minutos.

O fluxo foi otimizado para não buscar Regras quando não há candidato.

Não reduzir a recorrência sem medir consumo e sem necessidade real. Dois minutos é uma meta de verificação, não um SLA rígido de inclusão.

## 16. O que não fazer

- não editar Estado para transformar erro em OK;
- não copiar GroupID de outro tenant;
- não copiar Connection Reference de outro tenant;
- não duplicar regra ativa para o mesmo Cargo;
- não usar correção automática de sinônimos sem regra explícita;
- não ativar remoção automática na V1;
- não commitar export bruto do fluxo;
- não fazer várias mudanças estruturais no mesmo deploy sem checkpoint.

## 17. Escalonamento de incidentes

### Nível 1 — dado/regra

Exemplos:

- Cargo vazio;
- sem regra;
- grupo incorreto na regra.

Resolver no Microsoft 365/SharePoint.

### Nível 2 — conexão/permissão

Exemplos:

- 401/403;
- conexão desconectada;
- conta sem Colaboração.

Resolver conexão/permissão.

### Nível 3 — definição do fluxo

Exemplos:

- TemplateValidationError;
- InvalidOpenApiFlow;
- runAfter inválido;
- profundidade.

Restaurar checkpoint e corrigir definição antes de novo deploy.

## 18. Checklist mensal

```text
[ ] fluxo Enabled/Ativo
[ ] execuções recentes verdes
[ ] nenhum ERRO persistente
[ ] nenhum PENDENTE_GRUPO persistente
[ ] regras ativas sem duplicidade
[ ] conexões válidas
[ ] permissões das listas preservadas
[ ] backup estável conhecido
[ ] reconciliação continua produzindo 0/false após revisar
[ ] nenhum export bruto/PII foi commitado
```
