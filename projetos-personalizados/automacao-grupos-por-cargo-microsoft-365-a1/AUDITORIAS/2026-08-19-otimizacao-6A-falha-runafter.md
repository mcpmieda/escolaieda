# Otimizacao 6A — falha controlada de runAfter

Data: 2026-08-19

## Resultado

A primeira tentativa da Fase 6A foi recusada pelo Dataverse com `TemplateValidationError`.

Causa: a acao `04_Assinaturas_Estado` ainda possuia `runAfter` apontando para `03_|_Buscar_Regras`, mas a Fase 6A havia movido `03_|_Buscar_Regras` para dentro do ramo verdadeiro de `07_Ha_Candidatos`. Acoes em niveis diferentes nao podem ser usadas dessa forma em `runAfter`.

## Estado do fluxo

- PATCH recusado antes de salvar a nova definicao.
- Recuperacao automatica executada.
- Fluxo anterior permaneceu ativo.
- Nenhuma alteracao funcional foi aplicada.

## Correcao planejada

Ao mover `03_|_Buscar_Regras` para o ramo verdadeiro, `04_Assinaturas_Estado` deve herdar o `runAfter` anterior de `03_|_Buscar_Regras` (mantendo a cadeia da raiz). Dentro do ramo verdadeiro, `08_Processar_Candidatos` passa a aguardar `03_|_Buscar_Regras`.

A correcao deve validar explicitamente que nenhuma acao da raiz referencia a acao movida antes do PATCH.
