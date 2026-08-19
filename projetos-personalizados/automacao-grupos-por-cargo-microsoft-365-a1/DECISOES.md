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
Regras, Estado e Log ficarão no site operacional escolhido pelo tenant.

**Status:** aprovado.

## D-008 — Três listas SharePoint
- Regras de Grupos;
- Estado dos Usuários;
- Log de Grupos.

**Status:** aprovado.

## D-009 — Recorrência de 2 minutos
Equilíbrio entre rapidez e consumo de solicitações. Não constitui SLA rígido.

**Status:** validado em produção.

## D-010 — Estado contínuo
Usar conceito `ESTADO DOS USUÁRIOS`, não “usuário processado definitivamente”.

**Status:** aprovado.

## D-011 — V1 não remove associações
V1 somente adiciona. Remoção automática exige rastreabilidade de origem.

**Status:** aprovado e mantido em produção.

## D-012 — IDs como referência técnica
Usar `GroupID` e `EntraID` nas operações; nomes são leitura humana.

**Status:** aprovado.

## D-013 — Conta administrativa estável
Cada tenant deve possuir uma conta técnica/administrativa estável para conexões, contingência e operação do fluxo.

O UPN real não deve ser fixado na documentação pública nem no template multi-tenant.

**Status:** aprovado; sanitizado para escala.

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
A recorrência permanece em 2 minutos. Near-real-time orientado a evento exige arquitetura diferente.

**Status:** aprovado.

## D-025 — Scripts começam por leitura
A ordem de implantação em novo tenant será diagnóstico, auditoria de Cargos e descoberta de grupos/IDs antes de qualquer escrita.

**Status:** aprovado.

## D-026 — Construção do fluxo orientada a definição
Evitar continuar montando o Power Automate ação por ação quando a alteração puder ser aplicada de forma segura por definição JSON, solução, PowerShell ou API oficial.

O Power Automate continua sendo o motor de produção. A mudança é no método de desenvolvimento e implantação.

**Status:** aprovado e aplicado.

## D-027 — Fluxo solution-aware
O fluxo deve estar em uma Solution/Dataverse para administração por código via `clientdata`.

A migração deve preservar o fluxo existente e ser precedida por validação/backup.

**Status:** concluído e validado.

## D-028 — Produção R2 é o baseline estável
A arquitetura de produção usa preparação de dados + decisão única + `Switch`, com profundidade final validada de 6 níveis.

**Status:** baseline de produção.

## D-029 — Limite estrutural deve ser validado antes do deploy
Nenhuma definição pode ser enviada sem validação de profundidade e `runAfter`. O instalador deve cancelar localmente se a profundidade exceder 8 ou se existir referência entre níveis incompatíveis.

**Status:** obrigatório.

## D-030 — Reconciliação periódica de 24 horas
Além da detecção rápida por assinatura, usuários com Estado antigo devem ser reavaliados em 24 horas.

Objetivos:

- reaplicar associação removida manualmente;
- aplicar regra criada posteriormente;
- reavaliar estados antigos;
- cobrir mudanças fora da assinatura curta.

`ERRO` e `PENDENTE_GRUPO` mantêm retry imediato.

**Status:** ativo e validado.

## D-031 — Buscar regras somente quando existirem candidatos
A consulta da lista de Regras fica dentro do ramo `Há Candidatos = true`.

**Status:** ativo e validado.

## D-032 — Menor privilégio nas listas técnicas
As três listas usam permissões exclusivas.

- REGRAS: conta técnica com Leitura;
- ESTADO: conta técnica com Colaboração;
- LOG: conta técnica com Colaboração;
- Proprietários: Controle Total;
- Membros e Visitantes: sem acesso.

**Status:** aplicado e validado em execução verde.

## D-033 — Instalação multi-tenant será orientada por configuração
Novos tenants usarão `CONFIG.local.psd1` ou equivalente, com nomes lógicos. IDs internos serão descobertos dinamicamente por tenant.

Nenhum GroupID, WorkflowID, ListID, ConnectionID ou TenantID do ambiente original será reutilizado.

**Status:** aprovado.

## D-034 — Instalador multi-tenant em modo semi-automático primeiro
A primeira versão escalável automatiza preflight, descoberta, auditoria e preparação; conexões cloud, confirmação das listas e hardening permanecem com checkpoints interativos até o processo estar validado em vários tenants.

Automação total só será adotada depois de autenticação app-only/governança adequada e múltiplas implantações bem-sucedidas.

**Status:** aprovado.

## D-035 — Documentação final substitui planos como referência operacional
`PLANO_MESTRE.md` e adendos permanecem como histórico. A referência corrente para operação, escala e manutenção passa a ser:

- `README.md`;
- `DOCUMENTACAO_FINAL.md`;
- `INSTALADOR_MULTI_TENANT.md`;
- `RUNBOOK_OPERACIONAL.md`;
- `ERROS_CONHECIDOS.md`;
- `POWERSHELL/README.md`.

**Status:** aprovado.
