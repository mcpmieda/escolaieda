# CHANGELOG

Todas as alterações relevantes do projeto devem ser registradas aqui.

## [Produção 1.0] — 2026-08-19

### Concluído

- fluxo migrado para Solution/Dataverse;
- definição administrável por `clientdata` e Dataverse Web API;
- detecção de candidatos por assinatura;
- correção de `Status.Value` para Choice do SharePoint;
- escrita de Choice como `{Value:...}`;
- bloco de auditoria de candidatos;
- Connection Reference do Office 365 Groups;
- pilotos reais de inclusão;
- `ListGroupMembers` + `AddMemberToGroup` idempotente;
- criação de Log;
- upsert de Estado;
- produção R2 com roteamento por `Switch`;
- profundidade reduzida e validada em 6 níveis;
- retry imediato de `ERRO` e `PENDENTE_GRUPO`;
- usuário novo validado ponta a ponta;
- otimização: `Buscar Regras` somente quando existem candidatos;
- reconciliação automática de 24 horas;
- reconciliação validada em execução real;
- permissões exclusivas e mínimo privilégio nas três listas técnicas;
- execução automática verde após hardening completo.

### Segurança

- REGRAS: conta técnica com Leitura;
- ESTADO: conta técnica com Colaboração;
- LOG: conta técnica com Colaboração;
- Membros e Visitantes removidos das listas técnicas;
- backups brutos e IDs internos mantidos fora do GitHub público.

### Documentação final

Criados/reorganizados:

- `README.md` como porta de entrada final;
- `DOCUMENTACAO_FINAL.md`;
- `INSTALADOR_MULTI_TENANT.md`;
- `RUNBOOK_OPERACIONAL.md`;
- `ERROS_CONHECIDOS.md`;
- `POWERSHELL/CONFIG.example.psd1`;
- `POWERSHELL/00-preflight.ps1`;
- `POWERSHELL/01-descobrir-tenant.ps1`;
- `POWERSHELL/INSTALAR.ps1`;
- `POWERSHELL/regras.example.csv`;
- `POWERSHELL/README.md` reorganizado para escala multi-tenant.

### Baseline

- modo: ADD-ONLY;
- recorrência: 2 minutos;
- reconciliação: 24 horas;
- profundidade do fluxo: 6;
- Power Automate: motor de produção;
- PowerShell: instalação, auditoria, deploy e recuperação.

---

## [Planejamento 1.1] — 2026-08-18

### Adicionado

- PowerShell incorporado formalmente como camada administrativa do projeto.
- Microsoft Graph PowerShell definido como ferramenta prioritária para auditoria de usuários, Cargos, grupos e associações.
- SharePoint/PnP PowerShell previsto para implantação e validação das listas técnicas.
- Power Platform PowerShell previsto para governança e inventário do fluxo.
- Teams e Exchange Online PowerShell mantidos como ferramentas complementares de diagnóstico/administração.
- Diretório `POWERSHELL/` incorporado à estrutura oficial.
- Planejamento dos scripts de diagnóstico e auditoria.
- Separação formal entre plano de produção e plano administrativo.
- Política de scripts de auditoria somente leitura.
- Azure Cloud Shell reconhecido como ambiente possível de execução pontual, não como armazenamento permanente.

### Mantido

- Power Automate como motor de produção.
- Recorrência inicial de 2 minutos.
- SharePoint como repositório operacional.
- Inclusão direta nos grupos Microsoft 365.
- V1 em modo `add-only`.
- GitHub como registro mestre do projeto.

### Não alterado

A incorporação do PowerShell não reduz automaticamente a latência de produção. Near-real-time orientado a evento permanece como possível estudo futuro com Microsoft Graph Change Notifications/Webhooks e infraestrutura própria para recebimento de eventos.

---

## [Planejamento 1.0] — 2026-08-18

### Criado

- Plano Mestre inicial.
- Arquitetura Power Automate + SharePoint + Microsoft 365 Groups.
- Mapeamento inicial de Cargos para grupos.
- Recorrência inicial de 2 minutos.
- Três listas SharePoint previstas: Regras, Estado e Log.
- Política de V1 `add-only`.
- Estratégia de auditoria antes da escrita.
- Critérios de aceitação, testes, riscos e fases de execução.
- Diagnóstico e descarte da equipe `TODOS OS MEMBROS` como componente técnico da automação.
