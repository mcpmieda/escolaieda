# Toolkit PowerShell — Instalador e Administração Multi-Tenant

Este diretório contém a camada administrativa da automação de grupos por Cargo.

O PowerShell **não é o motor de produção**. O Power Automate continua executando a automação cotidiana na nuvem. O toolkit serve para preparar, descobrir, instalar, validar, atualizar e recuperar a solução em um ou vários tenants.

## Início rápido

1. Copie o template:

```powershell
Copy-Item .\CONFIG.example.psd1 .\CONFIG.local.psd1
```

2. Edite `CONFIG.local.psd1` com dados do tenant.

3. Execute no PowerShell 7:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

.\INSTALAR.ps1 -Stage Bootstrap -InstallMissingModules
```

O Bootstrap é somente leitura no Microsoft 365: valida configuração, módulos, tenant, grupos e Cargos e gera um arquivo local de descoberta.

## Arquivos atuais

### `CONFIG.example.psd1`
Template genérico de configuração por tenant.

Nunca editar o example com dados reais. Copiar para `CONFIG.local.psd1`.

### `INSTALAR.ps1`
Orquestrador do instalador.

Etapas disponíveis:

```powershell
.\INSTALAR.ps1 -Stage Preflight
.\INSTALAR.ps1 -Stage Discovery
.\INSTALAR.ps1 -Stage Bootstrap
```

### `00-preflight.ps1`
Validação local antes de qualquer implantação.

Verifica:

- PowerShell 7;
- módulos;
- configuração;
- duplicidade de grupos;
- duplicidade de Cargos;
- ação válida;
- regra ADICIONAR com grupo lógico existente;
- política ADD-ONLY.

Pode instalar módulos ausentes com:

```powershell
.\00-preflight.ps1 -InstallMissingModules
```

### `01-descobrir-tenant.ps1`
Somente leitura.

Conecta ao Microsoft Graph e:

- valida a organização autenticada;
- confirma domínio configurado;
- resolve grupos por nome exato;
- rejeita grupo ausente ou ambíguo;
- audita distribuição de Cargos;
- aponta Cargos sem regra;
- gera `tenant-discovery.local.json`.

Esse arquivo local contém IDs do tenant e **não deve ser commitado**.

### `02-validar-clientdata.ps1`
Validador local para uma definição `clientdata` exportada.

```powershell
.\02-validar-clientdata.ps1 -ClientDataPath .\flow-clientdata-local.json
```

Valida JSON, `properties.definition.actions`, profundidade e referências `runAfter` no mesmo nível.

Saída válida:

```text
RESULTADO_FINAL=CLIENTDATA_OK
```

### `03-exportar-clientdata.ps1`
Exporta o `clientdata` de um Modern Flow solution-aware para backup local.

```powershell
.\03-exportar-clientdata.ps1 `
  -TenantId '<TENANT-ID>' `
  -DataverseUrl 'https://org.crm.dynamics.com/' `
  -WorkflowId '<WORKFLOW-ID>'
```

O arquivo exportado contém IDs internos e é bloqueado pelo `.gitignore`.

### `04-deploy-clientdata.ps1`
Script de escrita genérico para aplicar uma definição candidata com proteção.

Exige `-ConfirmWrite` explicitamente.

```powershell
.\04-deploy-clientdata.ps1 `
  -TenantId '<TENANT-ID>' `
  -DataverseUrl 'https://org.crm.dynamics.com/' `
  -WorkflowId '<WORKFLOW-ID>' `
  -CandidateClientDataPath '.\flow-clientdata-CANDIDATO.json' `
  -ExpectedFlowName 'AUTO | Grupos por Cargo | Microsoft 365' `
  -ConfirmWrite
```

O script:

1. valida o candidato local;
2. autentica no Dataverse;
3. lê e valida o fluxo atual;
4. cria backup obrigatório;
5. desativa temporariamente;
6. aplica PATCH;
7. relê e valida o servidor;
8. reativa;
9. em erro, restaura `clientdata` anterior e garante o fluxo ativo.

Esse é o padrão base para o deploy multi-tenant por definição.

### `lib/FlowDefinitionTools.psm1`
Funções reutilizáveis para estrutura de fluxo:

```text
Get-FlowMaxActionDepth
Get-FlowRunAfterIssues
Test-FlowClientData
Assert-FlowClientData
New-SharePointChoiceObject
```

### `lib/DataverseFlowTools.psm1`
Funções reutilizáveis para Modern Flow no Dataverse:

```text
Connect-DataverseFlowContext
Get-DataverseModernFlow
Set-DataverseModernFlowState
Set-DataverseModernFlowClientData
Export-DataverseModernFlowClientData
```

Os módulos concentram correções aprendidas durante a construção real e devem ser reutilizados nos próximos scripts em vez de duplicar lógica.

### `regras.example.csv`
Modelo de carga de regras. É apenas exemplo; cada tenant pode usar nomes e regras diferentes.

### `.gitignore`
Bloqueia configuração local, exports de `clientdata`, certificados e arquivos com dados reais que não devem chegar ao repositório público.

## Método recomendado de implantação

O instalador é deliberadamente dividido em duas partes.

### Parte 1 — automatizada e segura

```text
Preflight
↓
Descoberta do tenant
↓
Resolução dos grupos
↓
Auditoria de Cargos
↓
Plano local
```

### Parte 2 — implantação com checkpoints

```text
SharePoint
↓
Conexões Power Automate
↓
Flow solution-aware
↓
Connection References
↓
Export/backup clientdata
↓
Validação local de clientdata
↓
Deploy / validação / rollback
↓
Piloto
↓
Reconciliação
↓
Permissões finais
```

A sequência completa está em [`../INSTALADOR_MULTI_TENANT.md`](../INSTALADOR_MULTI_TENANT.md). Criação de conexões e hardening continuam com checkpoints interativos até o processo estar validado em vários tenants.

## Princípios obrigatórios

1. **Leitura antes de escrita.**
2. Nunca selecionar o primeiro resultado quando há ambiguidade.
3. GroupID e IDs internos são resolvidos por tenant.
4. Nenhum ID de produção fica no template público.
5. Backup antes de mutação do fluxo.
6. Validar profundidade e `runAfter` antes do PATCH.
7. Rollback automático quando possível.
8. Cada mudança estrutural deve ser um checkpoint separado.
9. Scripts de auditoria não devem modificar produção.
10. Nenhum segredo ou export bruto no GitHub público.

## Shells

### PowerShell 7 — padrão do instalador

Usar para:

- Microsoft Graph;
- Az.Accounts;
- Dataverse Web API;
- leitura/alteração de `clientdata`;
- scripts multi-tenant.

Microsoft recomenda PowerShell 7 ou posterior para Microsoft Graph PowerShell SDK.

### Windows PowerShell 5.1 — compatibilidade administrativa

No tenant original, módulos administrativos de Power Platform foram executados separadamente no Windows PowerShell 5.1.

Não lançar PS7 como processo filho do PS5.1 para deploy Dataverse; executar a janela PS7 diretamente.

## Módulos usados/recomendados

Instalador base:

```text
Microsoft.Graph.Authentication
Microsoft.Graph.Users
Microsoft.Graph.Groups
Microsoft.Graph.Identity.DirectoryManagement
Az.Accounts
```

Compatibilidade/inventário conforme necessidade:

```text
Microsoft.PowerApps.Administration.PowerShell
Microsoft.PowerApps.PowerShell
MicrosoftTeams
ExchangeOnlineManagement
```

Não instalar módulos extras sem necessidade do estágio atual.

## Arquivos locais que nunca devem ir para o GitHub

```text
CONFIG.local.psd1
output-local/
tenant-discovery.local.json
flow-metadados-local.json
flow-clientdata-*.json
exports brutos
CSV com usuários reais
logs contendo UPNs/IDs reais
```

## Segurança

Nunca armazenar senha, token, client secret, certificado privado, cookie, código MFA, dumps de usuários ou IDs internos de produção desnecessários.

## Erros já conhecidos

Antes de diagnosticar do zero, consultar [`../ERROS_CONHECIDOS.md`](../ERROS_CONHECIDOS.md).

O documento cobre casing do Search Users V2, SharePoint Choice, limite de aninhamento, `runAfter`, scalar x array, PS5.1 x PS7, Dataverse, reconciliação e permissões.

## Referências oficiais

- Microsoft Graph PowerShell SDK: https://learn.microsoft.com/powershell/microsoftgraph/installation
- Power Automate — cloud flows com código: https://learn.microsoft.com/power-automate/manage-flows-with-code
- Office 365 Groups connector: https://learn.microsoft.com/connectors/office365groups/
