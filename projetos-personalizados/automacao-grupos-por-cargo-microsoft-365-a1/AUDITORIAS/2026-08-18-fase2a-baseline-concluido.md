# Auditoria — Fase 2A: validação e baseline concluídos

**Data:** 18/08/2026  
**Projeto:** Automação de Inclusão de Usuários em Grupos por Cargo — Microsoft 365 Education A1

## Resultado geral

A estrutura SharePoint foi validada e o baseline inicial foi gravado com sucesso na lista `AUTOMAÇÃO - ESTADO DOS USUÁRIOS`.

### Schema SharePoint

- `AUTOMAÇÃO - REGRAS DE GRUPOS`: 8/8 colunas esperadas presentes.
- `AUTOMAÇÃO - LOG DE GRUPOS`: 14/14 colunas esperadas presentes.
- `AUTOMAÇÃO - ESTADO DOS USUÁRIOS`: 16/16 colunas esperadas presentes.

Campos críticos de índice também foram confirmados, incluindo:

- `CargoNormalizado` em Regras: indexado e único;
- `EntraID` em Estado: indexado e único;
- `UPN`, `CargoNormalizado` e `Status` em Estado: indexados;
- `DataHora`, `EntraID` e `Resultado` em Log: indexados.

## Baseline

Foram encontrados **28 usuários** e gravados **28 registros** na lista Estado.

As **8 regras oficiais** estavam ativas.

### Classificação inicial

- `OK`: 20
- `PENDENTE_CARGO`: 4
- `PENDENTE_GRUPO`: 2
- `SEM_REGRA`: 2

Nenhum grupo foi alterado durante esta etapa.

## Interpretação

O baseline demonstra que a maior parte da população já está coerente com as regras atuais. Existem pendências que devem ser resolvidas antes da ativação do Power Automate em modo de escrita:

1. quatro contas sem Cargo;
2. duas contas com Cargo reconhecido pelas regras, mas ainda não associadas ao grupo esperado;
3. duas contas com Cargo sem regra atual.

Com base no diagnóstico anterior, os dois Cargos sem regra conhecidos são `administrador global` e `monitoria disciplinar`. O primeiro deve ser tratado como exceção administrativa/ignorado; o destino de `monitoria disciplinar` ainda precisa de decisão funcional.

## Observação sobre PowerShell interativo

A apresentação detalhada de `SEM_REGRA` e `PENDENTE_GRUPO` não foi exibida porque o Cloud Shell executou o bloco `if` antes de receber o `else`, interpretando `else` como comando independente. Isso foi apenas um erro de exibição e não afetou o baseline, que foi concluído e validado.

## Próximo passo recomendado

Antes de criar o fluxo definitivo:

1. identificar exatamente os dois registros `PENDENTE_GRUPO`;
2. confirmar a política de exceção para `administrador global`;
3. decidir o destino de `monitoria disciplinar`;
4. ajustar o modelo de regras para suportar explicitamente `IGNORAR` sem exigir grupo de destino;
5. repetir uma auditoria curta;
6. iniciar o Power Automate em modo auditoria.

## Segurança

Este arquivo contém apenas resultados agregados e decisões funcionais. Nenhum GUID, Tenant ID, UPN de usuário, nome pessoal ou dado de autenticação foi registrado no repositório público.
