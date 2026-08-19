# ERROS CONHECIDOS E CORREÇÕES VALIDADAS

Este documento registra falhas reais encontradas durante a construção e a solução adotada. O objetivo é impedir repetição de diagnóstico e acelerar implantações futuras.

## E-001 — Todos os usuários viraram candidatos

### Sintoma

`06_Quantidade_Candidatos` retornava a quantidade total de usuários.

### Causa

A ação Search for users (V2) devolvia os campos principais com nomes como:

```text
Id
JobTitle
AccountEnabled
```

As expressões estavam tentando usar nomes em caixa diferente. Além disso, `UserType` não fazia parte do retorno usado para a detecção de baixo custo.

### Correção

Assinatura do usuário baseada em:

```text
Id | JobTitle normalizado | AccountEnabled
```

`UserType` passou a ser consultado somente no perfil completo dos candidatos.

### Regra para o instalador

Nunca assumir casing de propriedades de um conector. Validar a saída real da ação antes de escrever a expressão.

---

## E-002 — Nenhum candidato detectado mesmo existindo PENDENTE_GRUPO

### Sintoma

`06_Quantidade_Candidatos = 0` quando deveriam existir retries.

### Causa

Campo Choice do SharePoint era retornado como objeto expandido:

```json
{
  "Status": {
    "Value": "PENDENTE_GRUPO"
  }
}
```

A expressão comparava o objeto inteiro com a string.

### Correção

```text
item()?['Status']?['Value']
```

### Regra para o instalador

Campos Choice devem ser tratados explicitamente tanto na leitura quanto na escrita.

---

## E-003 — Dataverse recusou PostItem/PatchItem com campo Choice

### Erro

`OpenApiOperationParameterValidationFailed`

Mensagem indicava que valor String não era conversível para Object.

### Causa

Foi enviado:

```json
"Resultado":"SUCESSO"
```

quando o conector esperava objeto Choice.

### Correção

```json
"Resultado":{"Value":"SUCESSO"}
```

Aplicar o mesmo padrão a `Operacao`, `Status` e outros Choice.

---

## E-004 — TemplateValidationError: nesting level 9 exceeds maximum 8

### Sintoma

Dataverse rejeitou a definição de produção.

### Causa

Múltiplas Conditions aninhadas dentro de Apply to each/If/Else elevaram a profundidade para 9.

### Correção

Arquitetura refeita com:

```text
perfil
↓
preparação de dados
↓
decisão única
↓
Switch plano
```

Profundidade final validada: 6.

### Regra para o instalador

Calcular recursivamente a profundidade antes do PATCH e cancelar localmente se `> 8`.

---

## E-005 — `runAfter` apontando para ação em outro nível

### Erro

`TemplateValidationError`

Mensagem:

```text
the action ... must belong to same level
```

### Cenário

`03 | Buscar Regras` foi movida para dentro do ramo TRUE de `07 | Há Candidatos`, mas `04 | Assinaturas Estado` na raiz ainda apontava para `03` no `runAfter`.

### Correção

Antes de remover/mover uma ação:

1. localizar todas as referências `runAfter` no mesmo nível;
2. capturar o predecessor original da ação movida;
3. fazer a ação seguinte herdar esse predecessor;
4. mover a ação;
5. criar nova dependência somente entre ações no mesmo nível;
6. validar que restaram zero referências inválidas.

### Regra para o instalador

Toda transformação de árvore deve validar dependências estruturais antes do deploy.

---

## E-006 — Validação PowerShell falhava mesmo encontrando exatamente uma dependência

### Sintoma

Saída mostrava:

```text
Acoes da raiz que aguardam o 03: 04_Assinaturas_Estado
```

mas o script tratava como dependência inesperada.

### Causa

No PowerShell, uma função que retorna um único item pode ser desembrulhada para escalar/string. O código usava índice/Count supondo array.

### Correção

```powershell
$refs = @(
    Get-AlgumaCoisa
)
```

E comparação:

```powershell
$refs -contains '04_Assinaturas_Estado'
```

### Regra para o instalador

Quando quantidade importa, sempre force coleção com `@(...)`.

---

## E-007 — PowerShell 7 iniciado a partir do PowerShell 5.1 ficou parado

### Sintoma

Tentativa de lançar processo PS7 filho durante mutação do fluxo aparentou travar.

### Correção validada

Executar os scripts Dataverse diretamente em uma janela PowerShell 7 e usar device authentication.

```powershell
Connect-AzAccount \
  -Tenant $tenantId \
  -UseDeviceAuthentication \
  -SkipContextPopulation
```

### Regra para o instalador

Não encadear PS7 como processo filho do PS5.1 para deploy do fluxo.

---

## E-008 — Módulos Power Platform incompatíveis com o shell usado

### Cenário validado no ambiente original

Os módulos:

```text
Microsoft.PowerApps.Administration.PowerShell
Microsoft.PowerApps.PowerShell
```

foram executados de forma confiável no Windows PowerShell 5.1, não no PS7 utilizado para Dataverse.

### Correção operacional

Separar responsabilidades:

```text
Windows PowerShell 5.1 → Power Platform admin modules quando necessários
PowerShell 7           → Graph, Az.Accounts, Dataverse, instalador
```

Quando a política de execução bloquear apenas a sessão:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
```

### Regra para o instalador

O preflight deve informar em qual shell cada etapa será executada.

---

## E-009 — Cloud Shell não aceitou autenticação interativa de módulo específico

### Sintoma

Alguns módulos administrativos tentaram autenticação interativa não suportada no contexto Cloud Shell.

### Solução

Usar Cloud Shell principalmente para Microsoft Graph/auditoria e executar componentes que exigem fluxo interativo específico no shell local compatível.

### Regra

Cloud Shell é ferramenta pontual, não ambiente universal do instalador.

---

## E-010 — Teste direto do SharePoint REST retornou `invalid_request`

### Cenário

Utilitário de teste tentou obter token e editar diretamente uma lista SharePoint por REST para envelhecer `UltimaVerificacao`.

### Resultado

```text
{"error":"invalid_request"}
```

### Decisão

Não transformar esse caminho em dependência do instalador. O teste foi executado de forma controlada pela interface do SharePoint.

### Regra

Não adicionar complexidade de autenticação SharePoint REST apenas para tarefas auxiliares se o caminho principal já usa conector SharePoint validado.

---

## E-011 — Usuário novo não poderia usar o antigo bloqueio de piloto

### Problema arquitetural

O piloto exigia que já existisse exatamente um item de Estado com `PENDENTE_GRUPO`.

Um usuário realmente novo não possui Estado ainda.

### Correção

Produção R2 implementou **upsert**:

```text
Estado encontrado = 1 → PatchItem
Estado encontrado = 0 → PostItem
```

Fluxo de produção não depende de Estado pré-existente.

### Regra

Nunca remover uma proteção de piloto sem primeiro criar o lifecycle completo para novos objetos.

---

## E-012 — `SEM_REGRA` não reagiria a regra nova sem mudança no usuário

### Causa

A detecção curta compara estado atual do usuário com assinatura anterior. Se apenas a configuração de regras mudar, a assinatura do usuário permanece igual.

### Correção

Reconciliação de 24 horas força reavaliação periódica de estados antigos.

### Benefício adicional

Também repara associação removida manualmente do grupo.

---

## E-013 — Usuário removido manualmente do grupo permaneceria Estado OK

### Causa

Sem reconciliação, nenhuma propriedade do usuário mudaria e ele não seria candidato.

### Correção

Reconciliação de 24 horas → `ListGroupMembers` → se não for membro, `AddMemberToGroup` novamente.

A V1 continua sem remover nada.

---

## E-014 — Risco de editar lista de REGRAS por usuários comuns do site

### Estado inicial

As três listas herdavam permissões do site:

```text
Membros → Editar
Proprietários → Controle Total
Visitantes → Leitura
```

### Correção final

REGRAS:

```text
Conta técnica → Leitura
Proprietários → Controle Total
```

ESTADO/LOG:

```text
Conta técnica → Colaboração
Proprietários → Controle Total
```

Membros e Visitantes removidos.

Execução automática permaneceu verde após hardening.

---

## E-015 — Risco de commitar `clientdata` bruto em repositório público

### Problema

`clientdata`, metadados e saídas de conectores podem conter:

- tenant IDs;
- URLs internas;
- IDs de lista;
- connection references;
- creator IDs;
- UPNs;
- outros identificadores.

### Regra final

Nunca commitar export bruto. Commitar apenas:

- código genérico;
- templates sanitizados;
- resultados agregados;
- causas e soluções sem PII.

---

## Checklist de diagnóstico rápido

Quando um tenant novo falhar, verificar nesta ordem:

```text
1. O fluxo está ativo?
2. 01 retorna usuários?
3. 02 retorna Estado?
4. 04 usa Status.Value?
5. 05 usa Id/JobTitle/AccountEnabled corretos?
6. 06 mostra candidatos esperados?
7. 03 está no ramo TRUE?
8. regra é única e ativa?
9. Acao Choice está sendo lida por Value?
10. GrupoID existe no tenant atual?
11. conexão Office 365 Groups está conectada?
12. Choice de escrita está em {Value:...}?
13. profundidade <= 8?
14. todos runAfter apontam para ações do mesmo nível?
15. conta do fluxo tem Leitura em REGRAS e Colaboração em ESTADO/LOG?
16. depois da correção, execução seguinte volta a 0 / false?
```
