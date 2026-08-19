# SCHEMA SHAREPOINT — Contrato Final

Este documento define o contrato lógico das três listas técnicas. Em novo tenant, nomes internos e tipos devem ser validados antes de apontar o fluxo para as listas.

## 1. Princípios

- `EntraID` é a chave técnica do usuário.
- `GrupoID` é a chave técnica do grupo.
- nomes/UPNs existem para leitura humana e auditoria.
- Choice deve ser lido por `.Value` e escrito como objeto `{Value:...}` no conector Power Automate.
- campos usados em busca/filtro frequente devem ser indexados.
- nenhuma lista deve permanecer editável por membros comuns do site.

## 2. Lista REGRAS

Nome lógico:

```text
AUTOMAÇÃO - REGRAS DE GRUPOS
```

### Colunas

| Coluna | Tipo lógico | Obrigatório | Índice/único | Uso |
|---|---|---:|---|---|
| `Title` | Texto | sim | — | descrição humana da regra |
| `CargoOriginalReferencia` | Texto | não | — | referência legível |
| `CargoNormalizado` | Texto | sim | **indexado + único** | chave lógica da regra |
| `GrupoNome` | Texto | não | — | nome humano do grupo |
| `GrupoID` | Texto/GUID armazenado como texto | não | — | ID técnico do grupo |
| `Ativo` | Sim/Não | sim | recomendado | habilita regra |
| `Observacao` | Texto multilinha | não | — | governança |
| `DataRevisao` | Data/Hora | não | — | auditoria |
| `RevisadoPor` | Texto/Pessoa conforme tenant | não | — | auditoria humana |
| `Acao` | Choice | sim | **indexado** | `ADICIONAR` ou `IGNORAR` |

### Choices

```text
Acao:
- ADICIONAR
- IGNORAR
```

### Regras de integridade

```text
CargoNormalizado não pode ser vazio
CargoNormalizado ativo deve ser único
ADICIONAR exige GrupoID válido
IGNORAR pode ter GrupoID vazio
```

### Permissão final

```text
Conta técnica do fluxo → Leitura
Proprietários → Controle Total
Membros → removidos
Visitantes → removidos
```

## 3. Lista ESTADO

Nome lógico:

```text
AUTOMAÇÃO - ESTADO DOS USUÁRIOS
```

### Colunas

| Coluna | Tipo lógico | Obrigatório | Índice/único | Uso |
|---|---|---:|---|---|
| `Title` | Texto | sim | — | identificação humana |
| `EntraID` | Texto/GUID | sim | **indexado + único** | chave técnica do usuário |
| `UPN` | Texto | não | **indexado** | auditoria/consulta |
| `NomeExibicao` | Texto | não | — | leitura humana |
| `UserType` | Texto | não | — | Member/Guest |
| `AccountEnabled` | Sim/Não | não | — | estado da conta |
| `CargoOriginal` | Texto | não | — | valor original |
| `CargoNormalizado` | Texto | não | **indexado** | comparação rápida |
| `GrupoGerenciadoNome` | Texto | não | — | grupo lógico atual |
| `GrupoGerenciadoID` | Texto/GUID | não | — | grupo técnico atual |
| `Status` | Choice | sim | **indexado** | estado operacional |
| `UltimaVerificacao` | Data/Hora | não | recomendado | reconciliação 24h |
| `UltimoSucesso` | Data/Hora | não | — | auditoria |
| `UltimoErro` | Data/Hora | não | — | auditoria de falha |
| `DetalheUltimoErro` | Texto multilinha | não | — | diagnóstico |
| `TentativasConsecutivas` | Número inteiro | não | — | retry/monitoramento |
| `FlowRunID` | Texto | não | — | correlação com execução |

### Choices

```text
Status:
- OK
- PENDENTE_CARGO
- SEM_REGRA
- PENDENTE_GRUPO
- ERRO
- DESABILITADO
- IGNORADO
```

### Regra de upsert

```text
0 registros por EntraID → PostItem
1 registro por EntraID → PatchItem
>1 → inconsistência/ERRO
```

### Permissão final

```text
Conta técnica do fluxo → Colaboração
Proprietários → Controle Total
Membros → removidos
Visitantes → removidos
```

## 4. Lista LOG

Nome lógico:

```text
AUTOMAÇÃO - LOG DE GRUPOS
```

### Colunas

| Coluna | Tipo lógico | Obrigatório | Índice | Uso |
|---|---|---:|---|---|
| `Title` | Texto | sim | — | identificação do evento |
| `DataHora` | Data/Hora | sim | **indexado** | ordenação/auditoria |
| `FlowRunID` | Texto | não | — | correlação |
| `EntraID` | Texto/GUID | não | **indexado** | usuário técnico |
| `UPN` | Texto | não | — | auditoria |
| `NomeExibicao` | Texto | não | — | leitura humana |
| `CargoOriginal` | Texto | não | — | dado recebido |
| `CargoNormalizado` | Texto | não | — | regra aplicada |
| `GrupoNome` | Texto | não | **indexado** | filtro humano |
| `GrupoID` | Texto/GUID | não | — | grupo técnico |
| `Operacao` | Choice | sim | — | decisão executada |
| `Resultado` | Choice | sim | — | sucesso/aviso/erro |
| `Detalhes` | Texto multilinha | não | — | contexto |
| `Tentativa` | Número inteiro | não | — | retry |
| `VersaoFluxo` | Texto | não | — | rastreabilidade |

### Choices

```text
Operacao:
- ANALISAR
- ADICIONAR
- JA_MEMBRO
- ALTERACAO_CARGO
- SEM_REGRA
- ERRO
- IGNORAR

Resultado:
- SUCESSO
- AVISO
- ERRO
```

### Permissão final

```text
Conta técnica do fluxo → Colaboração
Proprietários → Controle Total
Membros → removidos
Visitantes → removidos
```

## 5. Choice no Power Automate

### Leitura

Errado:

```text
item()?['Status']
```

Correto:

```text
item()?['Status']?['Value']
```

### Escrita

Errado:

```json
{"Status":"OK"}
```

Correto:

```json
{"Status":{"Value":"OK"}}
```

Aplicar o mesmo padrão a `Acao`, `Operacao` e `Resultado`.

## 6. Índices mínimos recomendados

### REGRAS

```text
CargoNormalizado
Acao
```

### ESTADO

```text
EntraID
UPN
CargoNormalizado
Status
```

### LOG

```text
DataHora
EntraID
GrupoNome
```

## 7. Nomes internos

Em tenants novos, não confiar apenas no nome exibido da coluna.

O instalador definitivo deve armazenar em template:

```text
DisplayName
InternalName
Type
Required
Indexed
Unique
Choices
```

Depois da criação, deve reler o schema e comparar antes de liberar o fluxo.

## 8. Política de mudança de schema

Não alterar simultaneamente:

```text
schema SharePoint + clientdata + regras de produção
```

Procedimento:

1. backup;
2. alterar schema;
3. validar lista;
4. alterar fluxo se necessário;
5. testar;
6. somente depois alterar regras em massa.
