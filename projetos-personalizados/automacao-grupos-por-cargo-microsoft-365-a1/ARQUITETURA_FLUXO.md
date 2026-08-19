# ARQUITETURA TÉCNICA DO FLUXO

Este documento descreve a estrutura lógica final do Power Automate validado em produção. Serve como referência para template multi-tenant e manutenção por `clientdata`.

## 1. Árvore principal

```text
00 | Recorrencia
01 | Buscar Usuarios
02 | Buscar Estado
04_Assinaturas_Estado
05_Detectar_Candidatos
06_Quantidade_Candidatos
07_Ha_Candidatos
  ├─ false → encerra
  └─ true
      03 | Buscar Regras
      08_Processar_Candidatos (foreach)
```

`03 | Buscar Regras` fica propositalmente dentro do ramo TRUE para evitar uma consulta SharePoint em execuções sem candidato.

## 2. Recorrência

```text
2 minutos
```

É uma frequência de verificação, não um SLA rígido.

## 3. Buscar Usuários

Conector: Office 365 Users.

A detecção leve usa campos que foram confirmados na saída de Search users (V2):

```text
Id
JobTitle
AccountEnabled
```

`UserType` não é exigido nessa primeira etapa. Ele é obtido no perfil completo somente para candidatos.

## 4. Buscar Estado

Conector: SharePoint Online.

Lista lógica:

```text
AUTOMAÇÃO - ESTADO DOS USUÁRIOS
```

O Estado é carregado em memória para comparação das assinaturas e para upsert posterior.

## 5. Assinaturas do Estado

A ação `04_Assinaturas_Estado` é um Select.

A expressão final inclui retry imediato e reconciliação de 24 horas:

```text
if(
  or(
    equals(
      toUpper(string(item()?['Status']?['Value'])),
      'PENDENTE_GRUPO'
    ),
    equals(
      toUpper(string(item()?['Status']?['Value'])),
      'ERRO'
    ),
    lessOrEquals(
      ticks(
        if(
          empty(item()?['UltimaVerificacao']),
          '1900-01-01T00:00:00Z',
          string(item()?['UltimaVerificacao'])
        )
      ),
      ticks(addHours(utcNow(),-24))
    )
  ),
  concat(
    'retry|',
    toLower(item()?['EntraID'])
  ),
  concat(
    toLower(item()?['EntraID']),
    '|',
    toLower(trim(coalesce(item()?['CargoNormalizado'],''))),
    '|',
    toLower(string(item()?['AccountEnabled']))
  )
)
```

### Motivo do `Status.Value`

Choice do SharePoint chega como objeto expandido. Comparar diretamente `Status` com string falha silenciosamente na lógica de candidatos.

## 6. Detectar Candidatos

A ação `05_Detectar_Candidatos` compara cada usuário atual contra as assinaturas de Estado.

Forma validada:

```text
@not(
  contains(
    body('04_Assinaturas_Estado'),
    json(
      concat(
        '{"Signature":"',
        toLower(item()?['Id']),
        '|',
        toLower(trim(coalesce(item()?['JobTitle'],''))),
        '|',
        toLower(string(item()?['AccountEnabled'])),
        '"}'
      )
    )
  )
)
```

Resultado: somente novos usuários, mudanças de assinatura e retries entram no processamento pesado.

## 7. Quantidade e condição

```text
06_Quantidade_Candidatos = length(body('05_Detectar_Candidatos'))
07_Ha_Candidatos         = 06 > 0
```

Em estado estável:

```text
0
false
```

## 8. Buscar Regras

Executa apenas quando `07_Ha_Candidatos = true`.

Conector: SharePoint Online.

Lista lógica:

```text
AUTOMAÇÃO - REGRAS DE GRUPOS
```

## 9. Processar Candidatos

`08_Processar_Candidatos` é um Foreach sobre `05_Detectar_Candidatos`.

Estrutura interna:

```text
08A_Obter_Perfil
08B_Localizar_Estado
08C_Cargo_Normalizado
08D_Localizar_Regra
08E_Regra_Atual
08F_Decisao
08G_Rotear_Decisao (Switch)
```

Essa arquitetura plana substituiu a primeira versão muito aninhada.

## 10. Obter Perfil

Conector: Office 365 Users — `UserProfile_V2`.

Campos selecionados:

```text
id
displayName
userPrincipalName
jobTitle
accountEnabled
userType
```

## 11. Localizar Estado

Filtra em memória a saída de `02 | Buscar Estado` pelo Entra ID.

O contrato esperado é:

```text
0 itens → usuário novo
1 item  → usuário conhecido
>1      → inconsistência; tratar como erro
```

Na produção, Estado é criado ou atualizado conforme existência.

## 12. Normalizar Cargo

Expressão:

```text
toLower(trim(coalesce(body('08A_Obter_Perfil')?['jobTitle'],'')))
```

Acentos são preservados. Não existe correção automática de sinônimos/ortografia.

## 13. Localizar Regra

Filtra `03 | Buscar Regras` por:

```text
CargoNormalizado exato
Ativo = true
```

Contrato:

```text
0 regras → SEM_REGRA
1 regra  → continuar
>1 regra → ERRO / regra duplicada
```

## 14. Decisão central

`08F_Decisao` reduz o branching a um valor simples.

Valores lógicos:

```text
NAO_MEMBRO
DESABILITADO
PENDENTE_CARGO
SEM_REGRA
REGRA_DUPLICADA
IGNORAR_REGRA
ACAO_INVALIDA
PENDENTE_GRUPO
ADICIONAR
```

`08G_Rotear_Decisao` é um Switch.

Essa decisão foi adotada para manter profundidade abaixo do limite do Power Automate.

## 15. Casos terminais

### NAO_MEMBRO

```text
Status: IGNORADO
Operacao: IGNORAR
Resultado: AVISO
```

### DESABILITADO

```text
Status: DESABILITADO
Operacao: ANALISAR
Resultado: AVISO
```

Nenhuma remoção de grupo.

### PENDENTE_CARGO

```text
Status: PENDENTE_CARGO
Operacao: ANALISAR
Resultado: AVISO
```

### SEM_REGRA

```text
Status: SEM_REGRA
Operacao: SEM_REGRA
Resultado: AVISO
```

### REGRA_DUPLICADA

```text
Status: ERRO
Operacao: ERRO
Resultado: ERRO
```

### IGNORAR_REGRA

```text
Status: IGNORADO
Operacao: IGNORAR
Resultado: SUCESSO
```

### ACAO_INVALIDA

```text
Status: ERRO
Operacao: ERRO
Resultado: ERRO
```

### PENDENTE_GRUPO

```text
Status: PENDENTE_GRUPO
Operacao: ANALISAR
Resultado: AVISO
```

### ADICIONAR

Executa lógica de grupo.

## 16. Lógica ADICIONAR

```text
08H_Operacao_Grupo (Scope)
  08H1_Listar_Membros
  08H2_Localizar_Membro
  08H3_Ja_Membro
    ├─ true  → confirmar JA_MEMBRO
    └─ false → AddMemberToGroup
```

Conector: Office 365 Groups.

### Listar membros

Operation ID:

```text
ListGroupMembers
```

No ambiente original foi usado Top 999.

Para tenants com grupos maiores, configurar paginação/limite conforme documentação do conector.

### Adicionar membro

Operation ID:

```text
AddMemberToGroup
```

Parâmetros:

```text
Group Id
User Principal Name
```

## 17. Resultado da operação de grupo

Sucesso:

```text
já existia → Operacao JA_MEMBRO
não existia → Operacao ADICIONAR
Resultado   → SUCESSO
Status      → OK
```

Falha em listar/adicionar:

```text
Operacao → ERRO
Resultado → ERRO
Status → ERRO
TentativasConsecutivas += 1
```

## 18. Upsert de Estado

Cada caso terminal registra Log e depois salva Estado.

Padrão:

```text
length(08B_Localizar_Estado) = 1
  → PatchItem
else
  → PostItem
```

Usuário novo não precisa de Estado pré-existente.

## 19. Choice no SharePoint

### Leitura

```text
item()?['Status']?['Value']
```

### Escrita via conector

```json
{
  "Status": { "Value": "OK" },
  "Operacao": { "Value": "ADICIONAR" },
  "Resultado": { "Value": "SUCESSO" }
}
```

Enviar string simples para Choice pode gerar `OpenApiOperationParameterValidationFailed`.

## 20. Profundidade

Primeira tentativa de produção chegou ao nível 9 e foi recusada.

Final validado:

```text
Profundidade: 6
Limite: 8
```

Todo deploy por definição deve chamar o validador de profundidade antes do PATCH.

## 21. `runAfter`

Power Automate exige que dependências `runAfter` apontem para ações do mesmo nível estrutural.

Ao mover ação entre raiz/Condition/Switch/Scope:

1. identificar quem dependia dela;
2. reencadear o nível antigo;
3. inserir ação no novo nível;
4. criar dependência local;
5. validar zero referências cruzadas inválidas.

O módulo `POWERSHELL/lib/FlowDefinitionTools.psm1` automatiza essa validação.

## 22. Connection References

A definição depende de referências para:

```text
Office 365 Users
SharePoint Online
Office 365 Groups
```

Connection References e conexões são específicas de tenant. O template multi-tenant deve resolver/substituir esses valores durante implantação, nunca copiar os IDs do tenant de origem.

## 23. Deploy seguro

Scripts genéricos disponíveis:

```text
POWERSHELL/02-validar-clientdata.ps1
POWERSHELL/03-exportar-clientdata.ps1
POWERSHELL/04-deploy-clientdata.ps1
```

Fluxo de deploy:

```text
validar candidato
↓
exportar/backup atual
↓
desativar
↓
PATCH clientdata
↓
reler servidor
↓
validar profundidade/runAfter
↓
reativar
```

Em falha, restaurar o `clientdata` anterior e garantir o fluxo ativo.
