# Checkpoint — 2 candidatos validados

**Data:** 18/08/2026  
**Projeto:** Automação de Inclusão de Usuários em Grupos por Cargo — Microsoft 365 Education A1

## Estado oficial retomado

A lógica de detecção de candidatos foi validada no Power Automate.

Resultado confirmado:

- `06_Quantidade_Candidatos = 2`
- `07_Ha_Candidatos = true`

Os dois candidatos correspondem ao baseline conhecido de usuários em `PENDENTE_GRUPO`.

## Correções já incorporadas

- `Search for users (V2)` usa propriedades `Id`, `JobTitle` e `AccountEnabled`.
- `UserType` foi removido da assinatura rápida de comparação.
- O campo `Status` do SharePoint é retornado como objeto de escolha expandido; a leitura correta usa `Status.Value`.
- Estados `PENDENTE_GRUPO` e `ERRO` geram assinatura especial `retry|<EntraID>` para nova tentativa.

## Mudança de método aprovada

O projeto continua com Power Automate como motor de produção, mas a construção da lógica restante deverá ser mais automatizada e baseada em código, evitando montagem manual ação por ação sempre que possível.

Próximo passo técnico: migrar o fluxo atual para uma solução do Dataverse usando `Add-AdminFlowsToSolution`, preservando o fluxo existente, para permitir gerenciamento da definição por código e facilitar versionamento/implantação.

## Segurança

Nenhum identificador interno, GUID, token ou dado pessoal foi incluído neste registro público.
