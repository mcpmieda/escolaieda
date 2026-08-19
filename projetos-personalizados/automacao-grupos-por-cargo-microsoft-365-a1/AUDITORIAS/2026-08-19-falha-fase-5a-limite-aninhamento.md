# Falha controlada — Fase 5A / limite de aninhamento

Data: 2026-08-19

## Resultado
A tentativa de substituir o bloco piloto por um bloco geral de produção foi recusada pelo Dataverse antes de salvar a nova definição.

Erro principal informado pelo Power Automate:
- `TemplateValidationError`
- ações aninhadas no nível 9
- limite máximo permitido: 8 níveis

A rotina de recuperação manteve o fluxo anterior ativo e não houve alteração permanente da definição.

## Causa
A primeira versão de produção usou uma cadeia profunda de condições: perfil -> conta ativa -> cargo -> regra única -> ação -> grupo -> associação -> atualização/criação de Estado. Essa composição ultrapassou o limite estrutural do Power Automate.

## Correção adotada
Redesenhar a Fase 5A com roteamento plano:
1. preparar perfil, Estado, cargo normalizado e regra em ações irmãs dentro do `Apply to each`;
2. calcular uma decisão única;
3. usar um único `Switch` para os estados finais;
4. manter somente a operação de grupo dentro de um `Scope` no caso `ADICIONAR`;
5. realizar Log e upsert de Estado dentro de cada caso, sem cadeia sequencial de condições.

Objetivo do redesenho: manter a profundidade máxima bem abaixo do limite 8, sem empilhar o bloco piloto e sem alterar a regra V1 add-only.

## Segurança
- fluxo permaneceu ativo após a falha;
- nenhum grupo foi removido;
- nenhum novo bloco de produção foi persistido;
- backup local anterior à tentativa foi criado pelo script.
