# Auditoria — Fase 3C Correção da detecção de candidatos

**Data:** 18/08/2026  
**Projeto:** Automação de Inclusão de Usuários em Grupos por Cargo — Microsoft 365 Education A1

## Sintoma observado

No primeiro teste da lógica de candidatos, a ação de contagem retornou 28 candidatos, embora o baseline conhecido tivesse apenas 2 usuários em `PENDENTE_GRUPO`.

Todas as ações executaram com sucesso, indicando erro lógico de comparação, não falha de conector.

## Causa identificada

A ação `Search for users (V2)` do conector Office 365 Users retorna o tipo `User`, cujos caminhos relevantes usam nomes de propriedade com inicial maiúscula, como `Id`, `JobTitle` e `AccountEnabled`.

A expressão inicialmente usada tratava esses campos como propriedades Graph em minúsculas (`id`, `jobTitle`, `accountEnabled`, `userType`). Como resultado, as assinaturas dos usuários atuais não correspondiam às assinaturas armazenadas e todos os usuários foram classificados como candidatos.

Além disso, `Search for users (V2)` não expõe `UserType` no tipo `User` documentado. A assinatura rápida será simplificada para `EntraID + Cargo normalizado + AccountEnabled`.

## Correção de arquitetura

A comparação recorrente de baixo custo passa a usar:

- EntraID;
- Cargo normalizado;
- AccountEnabled.

`PENDENTE_GRUPO` e `ERRO` continuam forçados a nova tentativa por meio de assinatura especial `retry|<EntraID>`.

`UserType` será verificado apenas quando um usuário entrar no caminho de candidato, usando `Get user profile (V2)`, que retorna o tipo GraphUser_V1 com `userType` disponível. Uma reconciliação periódica completa poderá detectar alterações raras de UserType em usuários já estabilizados sem aumentar o custo do ciclo de 2 minutos.

## Estado

Correção lógica preparada. Aguardando reteste do fluxo para confirmar que a contagem de candidatos cai de 28 para o número esperado pelo baseline atual.
