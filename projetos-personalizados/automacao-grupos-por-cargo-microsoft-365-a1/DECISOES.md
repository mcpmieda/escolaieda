# DECISÕES FORMAIS DO PROJETO

Este arquivo consolida as decisões vigentes. Quando uma decisão for substituída, registrar a nova decisão e marcar a anterior como superada em vez de apagá-la silenciosamente.

## D-001 — Sem custo adicional
Utilizar somente recursos disponíveis no ambiente atual, salvo nova decisão explícita.

**Status:** aprovado.

## D-002 — Não usar grupo dinâmico Entra P1 na V1
Motivo: licenciamento adicional.

**Status:** aprovado.

## D-003 — Power Automate como motor de produção
Motivo: nuvem, simplicidade operacional e integração Microsoft 365.

**Status:** aprovado.

## D-004 — Operação cotidiana não depende de Windows/PowerShell
PowerShell pode existir como ferramenta administrativa, mas o cadastro cotidiano não dependerá dele.

**Status:** aprovado.

## D-005 — `TODOS OS MEMBROS` fora do motor
A equipe criada não será usada como gatilho nem marcador técnico da automação.

**Status:** aprovado.

## D-006 — Inclusão direta no grupo final
O usuário será adicionado diretamente ao grupo correspondente ao Cargo.

**Status:** aprovado.

## D-007 — SharePoint Arquivo Digital como repositório operacional
Regras, Estado e Log ficarão no site do Arquivo Digital.

**Status:** aprovado.

## D-008 — Três listas SharePoint
- Regras de Grupos;
- Estado dos Usuários;
- Log de Grupos.

**Status:** aprovado.

## D-009 — Recorrência inicial de 2 minutos
Equilíbrio inicial entre rapidez e consumo de solicitações.

**Status:** aprovado para piloto, sujeito a medição.

## D-010 — Estado contínuo
Usar conceito `ESTADO DOS USUÁRIOS`, não “usuário processado definitivamente”.

**Status:** aprovado.

## D-011 — V1 não remove associações
V1 somente adiciona. Remoção automática exige rastreabilidade de origem.

**Status:** aprovado.

## D-012 — IDs como referência técnica
Usar `GroupID` e `EntraID` nas operações; nomes são leitura humana.

**Status:** aprovado.

## D-013 — Conta administrativa estável
`adminn@eduieda.onmicrosoft.com` será proprietário/coproprietário administrativo e conta de contingência.

**Status:** aprovado.

## D-014 — Microsoft Graph não é motor da V1
Graph fica reservado para auditoria via PowerShell e possível evolução arquitetural futura.

**Status:** atualizado pela D-020.

## D-015 — GitHub como livro do projeto
Decisões, testes, scripts e versões serão registrados no diretório do projeto.

**Status:** aprovado.

## D-016 — GitHub sem segredos
Nenhuma credencial, token ou dado pessoal real em massa deve ser commitado.

**Status:** obrigatório.

## D-017 — Modo auditoria antes de escrita
Nenhuma inclusão em massa antes de validar regras, estado e diagnóstico inicial.

**Status:** obrigatório.

## D-018 — PowerShell como camada administrativa oficial
PowerShell fará parte do projeto para implantação, diagnóstico, auditoria, recuperação e manutenção.

**Status:** aprovado.

## D-019 — PowerShell não substitui o Power Automate
A automação cotidiana continua na nuvem pelo Power Automate.

**Status:** aprovado.

## D-020 — Graph PowerShell como ferramenta prioritária para diretório
Priorizar Microsoft Graph PowerShell para usuários, Cargos, grupos e associações em auditorias e implantação.

**Status:** aprovado.

## D-021 — Auditoria e correção devem ser separadas
Scripts de auditoria são somente leitura. Ferramentas que alterem produção devem existir separadamente e ter impacto explícito.

**Status:** obrigatório.

## D-022 — Toolkit PowerShell versionado no GitHub
Scripts não secretos e sua documentação farão parte do diretório `POWERSHELL/`.

**Status:** aprovado.

## D-023 — Azure Cloud Shell é ambiente de execução pontual
Pode ser usado para comandos e scripts sem instalação local, mas não será fonte de verdade nem armazenamento permanente.

**Status:** aprovado.

## D-024 — PowerShell não é atalho para reduzir a recorrência
A recorrência da V1 permanece em 2 minutos. Near-real-time exige estudo de arquitetura orientada a eventos.

**Status:** aprovado.

## D-025 — Primeiros scripts serão de leitura
A ordem inicial será diagnóstico do tenant, auditoria de Cargos e descoberta de grupos/IDs antes de qualquer script de escrita.

**Status:** aprovado.
