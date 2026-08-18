# Auditoria — Fase 2B refinamento de regras e baseline

**Data:** 18/08/2026  
**Projeto:** Automação de Inclusão de Usuários em Grupos por Cargo — Microsoft 365 Education A1

## Objetivo

Refinar o modelo de regras para diferenciar Cargos que devem resultar em inclusão automática de Cargos que devem ser explicitamente ignorados, sem alterar associações reais de grupos.

## Alterações estruturais realizadas

Na lista `AUTOMAÇÃO - REGRAS DE GRUPOS`:

- `GrupoNome` deixou de ser obrigatório;
- `GrupoID` deixou de ser obrigatório;
- foi criada a coluna `Acao`, indexada, com os valores `ADICIONAR` e `IGNORAR`;
- as oito regras profissionais existentes foram marcadas como `ADICIONAR`;
- foi criada a regra `administrador global` com ação `IGNORAR` e sem grupo de destino.

## Resultado do baseline após refinamento

Total de usuários avaliados: 28.

| Status | Total |
|---|---:|
| IGNORADO | 1 |
| OK | 20 |
| PENDENTE_CARGO | 4 |
| PENDENTE_GRUPO | 2 |
| SEM_REGRA | 1 |

## Cargo ainda sem regra

- `monitoria disciplinar` — 1 usuário.

Nenhuma regra foi criada automaticamente para esse Cargo porque o grupo de destino ainda não foi definido pelo responsável do projeto.

## Pendências reais de associação detectadas

Foram identificados dois usuários cujo Cargo possui regra válida, mas que ainda não pertencem ao grupo esperado:

- 1 usuário com Cargo `coordenador pedagógico` → `GRUPO DA SECRETARIA - ARQUIVO DIGITAL`;
- 1 usuário com Cargo `professor` → `PROFESSORES`.

Os nomes e identificadores dos usuários não são registrados neste repositório público.

## Regras ativas após a Fase 2B

- `administrador global` → `IGNORAR`;
- `aluno` → `ADICIONAR` → `ALUNOS`;
- `auxiliar de secretaria` → `ADICIONAR` → grupo da Secretaria;
- `coordenador pedagógico` → `ADICIONAR` → grupo da Secretaria;
- `diretor` → `ADICIONAR` → grupo da Secretaria;
- `equipe de apoio` → `ADICIONAR` → `EQUIPE DE APOIO`;
- `professor` → `ADICIONAR` → `PROFESSORES`;
- `secretaria` → `ADICIONAR` → grupo da Secretaria;
- `visitante` → `ADICIONAR` → `VISITANTE`.

## Segurança

Nenhum membro foi adicionado ou removido de grupos durante esta fase.

GUIDs reais, Tenant ID, UPNs e nomes de usuários não foram registrados neste arquivo por o repositório atual ser público.

## Decisão técnica decorrente

O modelo oficial de regra passa a ser:

`Cargo -> Acao -> Grupo opcional`

Isso permite representar explicitamente contas técnicas/administrativas que devem ser ignoradas, em vez de deixá-las permanentemente como erro ou `SEM_REGRA`.

## Próxima etapa

1. manter `monitoria disciplinar` como `SEM_REGRA` até definição explícita do destino;
2. construir o Power Automate em modo auditoria utilizando `Acao`;
3. validar que o fluxo identifica apenas novos usuários, alterações de Cargo e pendências;
4. depois habilitar inclusão automática de forma controlada.
