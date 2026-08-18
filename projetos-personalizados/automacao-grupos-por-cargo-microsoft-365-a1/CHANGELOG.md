# CHANGELOG

Todas as alterações relevantes do projeto devem ser registradas aqui.

## [Planejamento 1.1] — 2026-08-18

### Adicionado

- PowerShell incorporado formalmente como camada administrativa do projeto.
- Microsoft Graph PowerShell definido como ferramenta prioritária para auditoria de usuários, Cargos, grupos e associações.
- SharePoint/PnP PowerShell previsto para implantação e validação das listas técnicas.
- Power Platform PowerShell previsto para governança e inventário do fluxo.
- Teams e Exchange Online PowerShell mantidos como ferramentas complementares de diagnóstico/administração.
- Diretório `POWERSHELL/` incorporado à estrutura oficial.
- Planejamento dos scripts:
  - `01-diagnostico-tenant.ps1`
  - `02-auditar-cargos.ps1`
  - `03-descobrir-grupos.ps1`
  - `04-auditar-associacoes.ps1`
  - `05-validar-sharepoint.ps1`
  - `06-validar-power-automate.ps1`
  - `07-relatorio-completo.ps1`
- Separação formal entre plano de produção e plano administrativo.
- Política de scripts de auditoria somente leitura.
- Azure Cloud Shell reconhecido como ambiente possível de execução pontual, não como armazenamento permanente.

### Mantido

- Power Automate como motor de produção.
- Recorrência inicial de 2 minutos.
- SharePoint do Arquivo Digital como repositório operacional.
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
- Mapeamento de oito Cargos para cinco grupos.
- Recorrência inicial de 2 minutos.
- Três listas SharePoint previstas: Regras, Estado e Log.
- Política de V1 `add-only`.
- Estratégia de auditoria antes da escrita.
- Critérios de aceitação, testes, riscos e fases de execução.
- Diagnóstico e descarte da equipe `TODOS OS MEMBROS` como componente técnico da automação.
