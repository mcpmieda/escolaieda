# INSTALADOR MULTI-TENANT — Estratégia de Replicação

## 1. Objetivo

Transformar a solução validada em um processo repetível para outros tenants Microsoft 365, com o mínimo possível de edição manual e sem copiar IDs internos de uma organização para outra.

O modelo recomendado é um **instalador em etapas com checkpoints**. Ele automatiza descoberta, validação, geração de configuração e implantação do fluxo; deixa manuais apenas as etapas que dependem de consentimento/conexão interativa do próprio tenant.

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
- template de definição com marcadores substituíveis.

## 3. Pacote recomendado

```text
POWERSHELL/
├── CONFIG.example.psd1
├── INSTALAR.ps1
├── 00-preflight.ps1
├── 01-descobrir-tenant.ps1
├── 02-validar-config.ps1
├── templates/
│   ├── regras.example.csv
│   ├── schema-sharepoint.json
│   └── flow-template.json   # somente quando sanitizado/testado
└── lib/
```

O repositório público contém apenas código e templates sanitizados. O instalador gera arquivos locais por tenant que não devem ser commitados.

## 4. Modos de implantação

### Modo A — recomendado: semi-automático

Mais simples e sustentável.

Automatizar:

- pré-requisitos;
- autenticação Graph;
- descoberta de tenant;
- descoberta de grupos por nome exato;
- auditoria de Cargos;
- validação do site SharePoint;
- validação das listas;
- geração do plano local com IDs resolvidos;
- validação do fluxo solution-aware;
- backup/patch/rollback do `clientdata`;
- testes técnicos.

Manter interativo por tenant:

- criação/autorização inicial das conexões Power Automate;
- confirmação do site SharePoint escolhido;
- confirmação das regras de negócio;
- hardening final das permissões.

### Modo B — automação total

Só deve ser adotado depois que houver autenticação app-only/certificado, governança central e teste em vários tenants.

É mais complexo porque precisa automatizar também consentimentos, criação de conexões, permissões SharePoint e lifecycle das Connection References.

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

Os IDs devem ser preenchidos pelo script de descoberta, não pelo operador.

## 6. Etapa 0 — preflight

Objetivo: falhar cedo antes de alterar produção.

Validar:

- PowerShell 7 disponível;
- módulo Microsoft.Graph;
- módulo Az.Accounts;
- arquivo de configuração local;
- domínio e site informados;
- nomes de grupos sem duplicidade no arquivo;
- Cargos normalizados sem duplicidade;
- nenhuma regra `ADICIONAR` sem grupo lógico.

Atalho para módulos:

```powershell
Install-Module Microsoft.Graph -Scope CurrentUser -Force
Install-Module Az.Accounts -Scope CurrentUser -Force
```

PowerShell 7 é o ambiente preferido para o SDK do Microsoft Graph e para a camada Dataverse deste projeto.

## 7. Etapa 1 — descoberta do tenant

Conectar ao Graph com acesso delegado:

```powershell
Connect-MgGraph -Scopes 'User.Read.All','Group.Read.All'
```

Descobrir organização:

```powershell
Get-MgOrganization | Select-Object Id,DisplayName,VerifiedDomains
```

Descobrir grupo por nome exato:

```powershell
$name = 'PROFESSORES'
$matches = @(
    Get-MgGroup -Filter "displayName eq '$name'" -All
)

if ($matches.Count -ne 1) {
    throw "Esperado exatamente 1 grupo '$name'; encontrados: $($matches.Count)"
}

$groupId = $matches[0].Id
```

Regra do instalador: **zero ou mais de um resultado é erro**, nunca selecionar o primeiro silenciosamente.

## 8. Etapa 2 — auditoria de Cargos

Exemplo de inventário:

```powershell
$users = Get-MgUser -All -Property Id,DisplayName,UserPrincipalName,JobTitle,AccountEnabled,UserType

$users |
    Group-Object { if ([string]::IsNullOrWhiteSpace($_.JobTitle)) { '<VAZIO>' } else { $_.JobTitle.Trim().ToLowerInvariant() } } |
    Sort-Object Count -Descending |
    Select-Object Count,Name
```

O relatório completo deve ficar local. No GitHub público registrar somente contagens e conclusões sanitizadas.

## 9. Etapa 3 — SharePoint

Criar ou validar três listas:

```text
AUTOMAÇÃO - REGRAS DE GRUPOS
AUTOMAÇÃO - ESTADO DOS USUÁRIOS
AUTOMAÇÃO - LOG DE GRUPOS
```

O instalador deve manter o schema em template versionado e comparar antes de criar/alterar.

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

## 10. Etapa 4 — conexões Power Automate

Conexões necessárias:

- Office 365 Users;
- SharePoint Online;
- Office 365 Groups.

No processo semi-automático, o operador cria/autoriza essas três conexões com a conta técnica estável do tenant.

O instalador então valida que as Connection References do fluxo apontam para conexões válidas.

## 11. Etapa 5 — solution-aware

O fluxo precisa estar na aba Soluções para administração por código.

O padrão usado neste projeto é:

```text
Dataverse table: workflows
category = 5  # Modern Flow
clientdata = JSON da definição + connectionReferences
```

Fluxos fora de Solutions não devem ser tratados pelo instalador por `clientdata`.

## 12. Etapa 6 — implantação segura do fluxo

Pseudocódigo do deploy:

```powershell
# 1. Ler definição atual
$current = Get-FlowFromDataverse

# 2. Validar checkpoint/version marker
Assert-ExpectedVersion $current

# 3. Backup
$current.clientdata | Set-Content $backupPath

# 4. Gerar definição nova a partir do template + IDs resolvidos
$newClientData = Build-TenantFlowDefinition

# 5. Validar referências e profundidade <= 8
Assert-FlowDefinition $newClientData

# 6. Desativar
Set-FlowState -Inactive

try {
    # 7. PATCH
    Set-FlowClientData $newClientData

    # 8. Reler e validar servidor
    Assert-ServerDefinition

    # 9. Reativar
    Set-FlowState -Active
}
catch {
    # rollback
    Set-FlowClientData $current.clientdata
    Set-FlowState -Active
    throw
}
```

Esse padrão já evitou perda de produção durante erros de schema e de estrutura.

## 13. Etapa 7 — regras iniciais

Carga recomendada a partir de CSV local:

```csv
CargoNormalizado,Acao,GrupoNome,Ativo
aluno,ADICIONAR,ALUNOS,true
professor,ADICIONAR,PROFESSORES,true
administrador global,IGNORAR,,true
```

O instalador deve resolver `GrupoNome` → `GrupoID` antes da carga.

Nunca importar GroupID de outro tenant.

## 14. Etapa 8 — piloto obrigatório

Antes de liberar produção ampla:

1. criar/selecionar um usuário controlado;
2. colocar Cargo com regra conhecida;
3. garantir que não está manualmente no grupo;
4. aguardar o fluxo;
5. validar:
   - candidato detectado;
   - grupo correto;
   - Estado `OK`;
   - Log criado;
   - tentativas = 0;
6. executar novamente e confirmar `0 / false`.

## 15. Etapa 9 — reconciliação

Ativar somente depois que o processamento comum estiver estável.

A regra validada é revisar Estado com 24 horas ou mais, além de retry imediato para `ERRO` e `PENDENTE_GRUPO`.

Teste recomendado: envelhecer apenas `UltimaVerificacao` de uma conta de teste, confirmar `JA_MEMBRO` e retorno posterior a zero candidatos.

## 16. Etapa 10 — hardening

Somente depois de fluxo verde:

1. aplicar permissões exclusivas em REGRAS;
2. testar fluxo;
3. aplicar permissões em ESTADO e LOG;
4. testar novamente;
5. registrar checkpoint sanitizado.

## 17. Checklist de instalação por tenant

```text
[ ] CONFIG.local.psd1 preenchido
[ ] Preflight OK
[ ] Tenant identificado
[ ] Grupos resolvidos sem ambiguidade
[ ] Cargos auditados
[ ] Site SharePoint validado
[ ] 3 listas criadas/validadas
[ ] Regras carregadas
[ ] 3 conexões Power Automate criadas
[ ] Flow solution-aware
[ ] Connection References válidas
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

## 18. Atalhos técnicos já validados

### Autenticação Dataverse no PowerShell 7

```powershell
Connect-AzAccount -Tenant $tenantId -UseDeviceAuthentication -SkipContextPopulation

$secureToken = (Get-AzAccessToken -ResourceUrl $dataverseUrl -AsSecureString).Token
$token = [System.Net.NetworkCredential]::new('', $secureToken).Password
```

### Choice do SharePoint no conector

Leitura:

```text
item()?['Status']?['Value']
```

Escrita:

```json
{"Status":{"Value":"OK"}}
```

### Forçar array no PowerShell

```powershell
$matches = @(Get-AlgumaCoisa)
```

Necessário para `.Count` e comparação segura quando o comando retorna exatamente um item.

## 19. Estratégia de versionamento

Cada release multi-tenant deve ter:

```text
VERSION
flow template version
schema version
installer version
known errors version
```

Exemplo:

```text
Solution: 1.0.0
Flow: V1-PRODUCAO-R2
Schema: 1
Installer: 0.1
```

Nenhuma atualização deve alterar simultaneamente fluxo, schema e regras sem checkpoints separados.

## 20. O que transformar em instalador completo no futuro

Quando a solução estiver implantada em vários tenants, extrair para módulos reutilizáveis:

- `Resolve-TenantConfiguration`;
- `Resolve-M365Group`;
- `Test-SharePointSchema`;
- `Install-SharePointSchema`;
- `Get-SolutionAwareFlow`;
- `Backup-FlowClientData`;
- `Install-FlowDefinition`;
- `Test-FlowDefinition`;
- `Set-TechnicalListPermissions`;
- `Invoke-PostInstallTests`.

A evolução deve ser incremental: primeiro automatizar o que já foi testado manualmente em mais de um tenant; depois remover etapas manuais.
