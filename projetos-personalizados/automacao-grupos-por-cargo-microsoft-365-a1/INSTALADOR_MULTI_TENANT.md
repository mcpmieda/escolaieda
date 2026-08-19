# INSTALADOR MULTI-TENANT — Estratégia de Replicação

## 1. Objetivo

Transformar a solução validada em um processo repetível para outros tenants Microsoft 365, com o mínimo possível de edição manual e sem copiar IDs internos de uma organização para outra.

O modelo recomendado é um **instalador em etapas com checkpoints**. Ele automatiza descoberta, validação, geração de plano local e deploy seguro de uma definição de fluxo; mantém interativas as etapas que dependem de consentimento/conexões e de decisões administrativas do tenant.

## 2. Regra principal de escala

Nunca transportar diretamente entre tenants:

- Tenant ID;
- Environment ID;
- Dataverse URL;
- Workflow ID;
- Group IDs;
- SharePoint List IDs;
- Connection IDs;
- Connection Reference IDs;
- UPNs reais;
- FlowRunIDs;
- tokens ou credenciais.

Transportar apenas:

- lógica do fluxo;
- schema das listas;
- nomes lógicos;
- regras configuráveis;
- scripts de descoberta;
- scripts de validação;
- template sanitizado de definição quando estiver formalmente empacotado.

## 3. Pacote implementado

```text
POWERSHELL/
├── .gitignore
├── CONFIG.example.psd1
├── INSTALAR.ps1
├── 00-preflight.ps1
├── 01-descobrir-tenant.ps1
├── GERAR-PLANO.ps1
├── 02-validar-clientdata.ps1
├── 03-exportar-clientdata.ps1
├── 04-deploy-clientdata.ps1
├── regras.example.csv
└── lib/
    ├── FlowDefinitionTools.psm1
    └── DataverseFlowTools.psm1
```

### O que já é funcional

- preflight local;
- instalação opcional de módulos base;
- descoberta do tenant via Graph;
- resolução exata de grupos;
- auditoria agregada de Cargos;
- geração de `deployment-plan.local.json`;
- export de `clientdata` de Modern Flow;
- validação de JSON/profundidade/`runAfter`;
- deploy de `clientdata` candidato;
- backup obrigatório;
- desativação/reativação do fluxo;
- rollback automático em falha.

### O que ainda é deliberadamente semi-automático

- criação/validação completa das listas SharePoint;
- criação/autorização das conexões Power Automate;
- criação/associação das Connection References;
- geração automática de um `clientdata` tenant-neutral a partir do baseline atual;
- permissões exclusivas finais das listas.

Essas etapas devem ser automatizadas somente depois da solução ser repetida em mais de um tenant e o modelo ficar estável.

## 4. Modos de implantação

### Modo A — recomendado: semi-automático

Mais simples e sustentável.

Automatizar:

- pré-requisitos;
- autenticação Graph;
- descoberta de tenant;
- descoberta de grupos por nome exato;
- auditoria de Cargos;
- geração do plano local com IDs resolvidos;
- export/backup de Modern Flow;
- validação estrutural de `clientdata`;
- deploy/rollback por Dataverse Web API;
- testes técnicos.

Manter interativo por tenant:

- criação/autorização inicial das conexões Power Automate;
- confirmação/criação das listas SharePoint;
- confirmação das regras de negócio;
- hardening final das permissões.

### Modo B — automação total

Só deve ser adotado depois que houver autenticação app-only/certificado, governança central e teste em vários tenants.

É mais complexo porque precisa automatizar também consentimentos, conexões, permissões SharePoint e lifecycle das Connection References.

Para poucas escolas/tenants, o Modo A oferece melhor relação entre velocidade, risco e manutenção.

## 5. Arquivo de configuração por tenant

Começar copiando:

```powershell
Copy-Item .\CONFIG.example.psd1 .\CONFIG.local.psd1
```

`CONFIG.local.psd1` nunca deve ser commitado.

Exemplo conceitual:

```powershell
@{
    Tenant = @{
        PrimaryDomain = 'contoso.onmicrosoft.com'
        AdminUpn      = 'admin@contoso.onmicrosoft.com'
    }

    SharePoint = @{
        SiteUrl = 'https://contoso.sharepoint.com/sites/ARQUIVODIGITAL'
    }

    Flow = @{
        DisplayName = 'AUTO | Grupos por Cargo | Microsoft 365'
        RecurrenceMinutes = 2
        ReconciliationHours = 24
        AddOnly = $true
    }

    Groups = @(
        @{ Name = 'ALUNOS' },
        @{ Name = 'PROFESSORES' }
    )

    Rules = @(
        @{ Cargo = 'aluno';     Action = 'ADICIONAR'; Group = 'ALUNOS' },
        @{ Cargo = 'professor'; Action = 'ADICIONAR'; Group = 'PROFESSORES' },
        @{ Cargo = 'administrador global'; Action = 'IGNORAR'; Group = $null }
    )
}
```

Os IDs são descobertos pelos scripts, não digitados no template público.

## 6. Bootstrap em um comando

No PowerShell 7:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

.\INSTALAR.ps1 -Stage Bootstrap -InstallMissingModules
```

O Bootstrap executa:

```text
00-preflight
↓
01-descobrir-tenant
↓
GERAR-PLANO
```

Arquivos locais gerados:

```text
output-local/tenant-discovery.local.json
output-local/deployment-plan.local.json
```

Eles contêm IDs internos e são ignorados pelo Git.

## 7. Etapa 0 — preflight

Objetivo: falhar cedo antes de alterar produção.

Valida:

- PowerShell 7;
- módulos Microsoft Graph/Az.Accounts;
- arquivo de configuração;
- template já preenchido;
- duplicidade de grupos;
- duplicidade de Cargos;
- ações `ADICIONAR`/`IGNORAR`;
- grupos lógicos existentes;
- modo ADD-ONLY.

Atalho:

```powershell
.\00-preflight.ps1 -ConfigPath .\CONFIG.local.psd1 -InstallMissingModules
```

## 8. Etapa 1 — descoberta do tenant

Script:

```powershell
.\01-descobrir-tenant.ps1 -ConfigPath .\CONFIG.local.psd1
```

Ele usa Microsoft Graph com acesso delegado e resolve grupos por nome exato.

Regra do instalador: **zero ou mais de um resultado é erro**.

Exemplo geral de resolução:

```powershell
$name = 'PROFESSORES'
$escaped = $name.Replace("'", "''")
$matches = @(
    Get-MgGroup -Filter "displayName eq '$escaped'" -All
)

if ($matches.Count -ne 1) {
    throw "Esperado exatamente 1 grupo '$name'; encontrados: $($matches.Count)"
}
```

## 9. Etapa 2 — gerar plano local

Script:

```powershell
.\GERAR-PLANO.ps1
```

O plano combina:

- configuração humana;
- organização detectada;
- grupos e IDs resolvidos;
- regras com GroupID do tenant atual;
- site/listas;
- recorrência/reconciliação;
- política de segurança.

Saída:

```text
deployment-plan.local.json
```

Esse arquivo vira a fonte local do deploy daquele tenant.

## 10. Etapa 3 — SharePoint

Criar ou validar:

```text
AUTOMAÇÃO - REGRAS DE GRUPOS
AUTOMAÇÃO - ESTADO DOS USUÁRIOS
AUTOMAÇÃO - LOG DE GRUPOS
```

Contrato completo em:

[`SCHEMA_SHAREPOINT.md`](./SCHEMA_SHAREPOINT.md)

### Permissões finais

REGRAS:

```text
Conta técnica → Leitura
Proprietários → Controle Total
```

ESTADO e LOG:

```text
Conta técnica → Colaboração
Proprietários → Controle Total
```

Membros e Visitantes não devem ter acesso às listas técnicas.

## 11. Etapa 4 — conexões Power Automate

Conexões necessárias:

- Office 365 Users;
- SharePoint Online;
- Office 365 Groups.

No processo semi-automático, o operador cria/autoriza as três conexões com a conta técnica estável do tenant.

Depois, validar as Connection References do fluxo.

## 12. Etapa 5 — solution-aware

O fluxo precisa estar em uma Solution para administração por código.

Contrato usado:

```text
Dataverse table: workflows
category = 5
clientdata = JSON da definição + connectionReferences
```

Fluxos fora de Solutions não entram no deploy por `clientdata`.

## 13. Etapa 6 — exportar baseline/backup

Script genérico:

```powershell
.\03-exportar-clientdata.ps1 `
  -TenantId '<TENANT-ID>' `
  -DataverseUrl 'https://org.crm.dynamics.com/' `
  -WorkflowId '<WORKFLOW-ID>'
```

Saída local:

```text
flow-clientdata-BACKUP-<timestamp>.json
```

Nunca commitar.

## 14. Etapa 7 — validar candidato

Antes do deploy:

```powershell
.\02-validar-clientdata.ps1 `
  -ClientDataPath .\flow-clientdata-CANDIDATO.json
```

O validador checa:

- JSON;
- árvore de ações;
- profundidade `<= 8`;
- `runAfter` somente no mesmo nível.

## 15. Etapa 8 — deploy seguro

Script:

```powershell
.\04-deploy-clientdata.ps1 `
  -TenantId '<TENANT-ID>' `
  -DataverseUrl 'https://org.crm.dynamics.com/' `
  -WorkflowId '<WORKFLOW-ID>' `
  -CandidateClientDataPath '.\flow-clientdata-CANDIDATO.json' `
  -ExpectedFlowName 'AUTO | Grupos por Cargo | Microsoft 365' `
  -ConfirmWrite
```

O `-ConfirmWrite` é obrigatório para impedir escrita acidental.

Processo interno:

```text
validar candidato
↓
ler fluxo atual
↓
validar fluxo atual
↓
backup
↓
desativar
↓
PATCH
↓
validar servidor
↓
reativar
```

Em erro após alteração:

```text
restaurar clientdata anterior
reativar fluxo
relançar erro
```

## 16. Etapa 9 — regras iniciais

Modelo:

```text
POWERSHELL/regras.example.csv
```

Nunca importar GroupID de outro tenant. O plano local resolve Nome → ID.

## 17. Etapa 10 — piloto obrigatório

Antes de liberar produção ampla:

1. criar/selecionar um usuário controlado;
2. colocar Cargo com regra conhecida;
3. garantir que não está manualmente no grupo;
4. aguardar o fluxo;
5. validar candidato, grupo, Estado `OK`, Log e tentativas 0;
6. confirmar execução seguinte `0 / false`.

## 18. Etapa 11 — reconciliação

Ativar somente após o processamento comum estar estável.

Regra final:

- reavaliar `UltimaVerificacao >= 24h`;
- retry imediato de `ERRO`;
- retry imediato de `PENDENTE_GRUPO`.

Teste: envelhecer apenas `UltimaVerificacao` de uma conta de teste e confirmar `JA_MEMBRO`/reparo.

## 19. Etapa 12 — hardening

Somente depois de fluxo verde:

1. restringir REGRAS;
2. testar;
3. restringir ESTADO e LOG;
4. testar novamente;
5. registrar checkpoint sanitizado.

## 20. Checklist de instalação por tenant

```text
[ ] CONFIG.local.psd1 preenchido
[ ] Preflight OK
[ ] Tenant identificado
[ ] Grupos resolvidos sem ambiguidade
[ ] Cargos auditados
[ ] deployment-plan.local.json criado
[ ] Site SharePoint validado
[ ] 3 listas criadas/validadas
[ ] Regras carregadas
[ ] 3 conexões Power Automate criadas
[ ] Flow solution-aware
[ ] Connection References válidas
[ ] clientdata atual exportado
[ ] candidato validado
[ ] Definição implantada
[ ] Profundidade <= 8
[ ] Fluxo ativo
[ ] Smoke test 0 / false
[ ] Piloto de inclusão OK
[ ] Estado e Log OK
[ ] Reconciliação OK
[ ] Permissões mínimas aplicadas
[ ] Execução verde após hardening
[ ] Backup local guardado
[ ] Documentação do tenant atualizada
```

## 21. Atalhos técnicos validados

### Dataverse no PowerShell 7

```powershell
Connect-AzAccount -Tenant $tenantId -UseDeviceAuthentication -SkipContextPopulation

$secureToken = (Get-AzAccessToken -ResourceUrl $dataverseUrl -AsSecureString).Token
$token = [System.Net.NetworkCredential]::new('', $secureToken).Password
```

### Choice SharePoint

Leitura:

```text
item()?['Status']?['Value']
```

Escrita:

```json
{"Status":{"Value":"OK"}}
```

### Array PowerShell

```powershell
$matches = @(Get-AlgumaCoisa)
```

Quando `.Count` importa, force coleção.

## 22. Versionamento

Cada release multi-tenant deve registrar:

```text
Solution version
Flow template version
Schema version
Installer version
Known errors version
```

Exemplo:

```text
Solution: 1.0.0
Flow: V1-PRODUCAO-R2
Schema: 1
Installer: 0.1
```

Não alterar simultaneamente fluxo, schema e regras sem checkpoints separados.

## 23. Próxima evolução do instalador

A próxima peça a ser criada, preferencialmente durante a implantação no segundo tenant, é um **gerador de `clientdata` tenant-neutral**.

Ele deverá:

1. receber o `deployment-plan.local.json`;
2. carregar um template sanitizado da Produção R2;
3. substituir site/list IDs/connection references de forma controlada;
4. validar profundidade/runAfter;
5. produzir `flow-clientdata-CANDIDATO.local.json`;
6. entregar ao `04-deploy-clientdata.ps1`.

Essa etapa não deve ser improvisada antes de termos um segundo tenant para validar quais partes realmente variam por ambiente.
