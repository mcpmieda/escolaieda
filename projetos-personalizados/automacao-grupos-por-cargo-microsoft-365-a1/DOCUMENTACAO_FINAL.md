# DOCUMENTAÇÃO FINAL — Automação de Grupos por Cargo

## 1. Objetivo

Automatizar a inclusão de usuários em grupos Microsoft 365 com base no atributo **Cargo (`jobTitle`)** cadastrado no Microsoft 365, usando Power Automate, SharePoint e conectores Standard.

A solução foi construída para Microsoft 365 Education A1, sem exigir Entra ID P1 e sem manter um computador ligado para a operação cotidiana.

## 2. Como funciona em linguagem simples

Quando uma pessoa é cadastrada no Microsoft 365, o sistema olha o Cargo dela. Existe uma tabela de regras dizendo qual Cargo pertence a qual grupo. O fluxo compara as duas informações e, quando encontra uma regra válida, verifica se a pessoa já está no grupo. Se ainda não estiver, adiciona. Depois registra o resultado para não repetir trabalho desnecessariamente.

Além disso, uma revisão automática de 24 horas reabre usuários antigos para verificar se alguma regra mudou ou se alguém foi removido manualmente do grupo.

## 3. Arquitetura final

```text
Microsoft 365 / Entra ID
  Usuário + jobTitle
        ↓
Power Automate
  Recorrência: 2 minutos
        ↓
01 Buscar Usuários
02 Buscar Estado
04 Montar Assinaturas do Estado
05 Detectar Candidatos
06 Quantidade de Candidatos
07 Há Candidatos?
        ↓ SIM
03 Buscar Regras
08 Processar Candidatos
        ↓
Office 365 Users
Office 365 Groups
SharePoint
        ↓
Estado + Log + associação no grupo
```

O fluxo é solution-aware e fica armazenado como Modern Flow no Dataverse. A definição do fluxo fica no campo `clientdata` e pode ser lida/alterada por Dataverse Web API com controle de backup e rollback.

## 4. Componentes

### 4.1 Power Automate

É o motor de produção. Executa continuamente na nuvem e não depende de PowerShell para o uso diário.

### 4.2 SharePoint

Três listas técnicas:

#### `AUTOMAÇÃO - REGRAS DE GRUPOS`
Fonte de verdade das regras de Cargo.

Campos principais:

- Cargo original de referência;
- Cargo normalizado;
- nome do grupo;
- ID do grupo;
- Ativo;
- Ação: `ADICIONAR` ou `IGNORAR`;
- observação e revisão.

Regra de contrato: para um Cargo normalizado ativo deve existir no máximo uma regra aplicável. Zero regras gera `SEM_REGRA`; mais de uma gera `ERRO`.

#### `AUTOMAÇÃO - ESTADO DOS USUÁRIOS`
Mantém o estado contínuo de cada usuário.

Campos principais:

- EntraID;
- UPN;
- NomeExibicao;
- UserType;
- AccountEnabled;
- CargoOriginal;
- CargoNormalizado;
- GrupoGerenciadoNome;
- GrupoGerenciadoID;
- Status;
- UltimaVerificacao;
- UltimoSucesso;
- UltimoErro;
- TentativasConsecutivas;
- FlowRunID.

#### `AUTOMAÇÃO - LOG DE GRUPOS`
Histórico das decisões e operações realizadas.

Registra, entre outros:

- data/hora;
- FlowRunID;
- usuário;
- Cargo;
- grupo;
- operação;
- resultado;
- detalhes;
- tentativa;
- versão do fluxo.

## 5. Status possíveis

| Status | Significado | Ação esperada |
|---|---|---|
| `OK` | usuário tratado corretamente | nenhuma intervenção |
| `PENDENTE_CARGO` | Cargo vazio | preencher Cargo |
| `SEM_REGRA` | Cargo não tem regra | criar regra ou manter sem automação |
| `PENDENTE_GRUPO` | regra ADICIONAR sem grupo válido | revisar GrupoID/regra |
| `ERRO` | falha técnica ou regra inválida | corrigir causa; fluxo tenta novamente |
| `DESABILITADO` | conta desabilitada | nenhuma remoção automática |
| `IGNORADO` | regra/usuário não deve ser gerenciado | nenhuma inclusão |

## 6. Detecção de candidatos

A solução não processa todos os usuários em profundidade a cada execução.

Ela compara uma assinatura resumida do usuário atual com o Estado salvo. A assinatura operacional considera:

```text
EntraID | CargoNormalizado | AccountEnabled
```

Casos `PENDENTE_GRUPO` e `ERRO` recebem assinatura de retry e voltam imediatamente para processamento.

Usuários cuja `UltimaVerificacao` tenha 24 horas ou mais também recebem retry. Isso implementa a reconciliação periódica.

## 7. Reconciliação de 24 horas

A reconciliação resolve limitações naturais da detecção por mudança.

Ela permite detectar:

- membro removido manualmente de grupo;
- regra criada depois para um Cargo anteriormente `SEM_REGRA`;
- regra alterada sem alteração no Cargo do usuário;
- mudança rara de propriedades que não fazem parte da assinatura curta;
- Estado antigo que precise ser revisado.

A reconciliação continua seguindo a política ADD-ONLY.

## 8. Política ADD-ONLY

A V1 **não remove usuários de grupos**.

Motivos:

- preservar associações manuais;
- evitar remover acesso legítimo sem rastreabilidade de origem;
- simplificar recuperação;
- reduzir risco operacional.

Se o Cargo mudar, a nova associação pode ser adicionada, mas a associação anterior não é removida automaticamente pela V1.

Uma futura versão com remoção deverá registrar explicitamente quais associações foram criadas pela própria automação.

## 9. Resolução de regras

O Cargo é normalizado com:

- `trim`;
- lowercase;
- acentos preservados.

Não existe correção automática de ortografia ou sinônimos. Isso é proposital.

Exemplo:

```text
professor   → pode ter regra
professora  → NÃO é assumido como professor
```

Se necessário, deve ser criada uma regra explícita.

## 10. Verificação e inclusão em grupos

Quando a regra tem ação `ADICIONAR`:

1. o fluxo lista os membros do grupo;
2. procura o usuário pelo Entra ID;
3. se encontrar, registra `JA_MEMBRO`;
4. se não encontrar, executa `AddMemberToGroup`;
5. grava Log;
6. cria ou atualiza Estado como `OK`.

A verificação antes da inclusão torna o processo idempotente.

## 11. Tratamento de erro

Falhas de consulta ou inclusão no grupo levam o usuário para `ERRO`, registram tentativa e mantêm retry automático nas próximas execuções.

O objetivo é que um erro transitório não transforme o usuário em um estado permanente incorreto.

## 12. Otimização de solicitações

A ação de buscar regras no SharePoint foi movida para dentro do ramo `Há Candidatos = true`.

Portanto, em uma execução comum sem mudanças:

- busca usuários;
- busca Estado;
- monta assinaturas;
- detecta candidatos;
- calcula quantidade;
- encerra sem buscar Regras.

Isso reduz chamadas desnecessárias ao SharePoint.

## 13. Profundidade do fluxo

O Power Automate rejeitou uma primeira versão de produção com nível 9 de aninhamento.

A arquitetura final usa decisão central + `Switch` e ficou com profundidade validada de **6 níveis**.

Regra de manutenção: nenhuma alteração deve ultrapassar 8 níveis. Scripts de implantação devem validar isso antes do PATCH.

## 14. Segurança das listas

As três listas usam permissões exclusivas.

### REGRAS

- conta técnica do fluxo: Leitura;
- proprietários: Controle Total;
- Membros: removidos;
- Visitantes: removidos.

### ESTADO e LOG

- conta técnica do fluxo: Colaboração;
- proprietários: Controle Total;
- Membros: removidos;
- Visitantes: removidos.

Isso aplica menor privilégio sem impedir o funcionamento do fluxo.

## 15. Desenvolvimento por definição

O fluxo passou de edição manual ação por ação para gerenciamento orientado a definição.

Processo seguro adotado:

1. ler `clientdata` atual;
2. validar checkpoint esperado;
3. criar backup local;
4. construir alteração em memória;
5. validar estrutura e profundidade localmente;
6. desativar fluxo temporariamente;
7. PATCH no Dataverse;
8. reler e validar no servidor;
9. reativar;
10. em qualquer falha, restaurar backup e garantir fluxo ativo.

Esse modelo reduziu retrabalho e torna possível escalar para outros tenants.

## 16. Ambientes PowerShell validados

### PowerShell 7

Preferido para:

- Microsoft Graph;
- `Az.Accounts`;
- Dataverse Web API;
- alteração de `clientdata`;
- scripts do instalador multi-tenant.

### Windows PowerShell 5.1

No ambiente original, os módulos administrativos de Power Platform usados no inventário funcionaram melhor no Windows PowerShell 5.1.

Quando necessário foi utilizado:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
```

O escopo `Process` evita mudar permanentemente a política da máquina.

## 17. Backup e recuperação

Antes de qualquer mutação estrutural do fluxo:

```text
flow-clientdata-BACKUP-<fase>-<timestamp>.json
```

O backup deve permanecer fora do GitHub público se contiver IDs, connection references, URLs internas ou outros identificadores do tenant.

Se uma alteração falhar:

1. manter/desativar fluxo conforme estado da transação;
2. restaurar `clientdata` anterior;
3. reativar fluxo;
4. confirmar execução automática verde;
5. registrar causa sanitizada em `AUDITORIAS/`.

## 18. Critério de saúde

Em estado estável, sem mudanças recentes:

```text
06_Quantidade_Candidatos = 0
07_Ha_Candidatos = false
```

Um novo usuário ou mudança relevante deve gerar candidato e, após processamento, voltar a zero.

## 19. Testes finais realizados

Foram validados:

- dois pilotos reais de inclusão;
- novo usuário com regra válida;
- escrita real de Estado e Log;
- execução sem candidatos;
- produção R2;
- otimização da busca de regras;
- reconciliação de 24 horas por envelhecimento controlado do Estado;
- execução com permissões mínimas das listas.

## 20. Limitações conhecidas

- recorrência de 2 minutos não é SLA rígido;
- listagem de membros deve considerar paginação se grupos crescerem acima do limite prático configurado;
- V1 não remove associação antiga;
- conexões do Power Automate são recursos do tenant e precisam ser criadas/autorizadas por tenant;
- IDs de ambiente, lista, grupo, conexão e workflow nunca devem ser copiados de um tenant para outro sem resolução dinâmica.

## 21. Referências oficiais

- Power Automate — Work with cloud flows using code: https://learn.microsoft.com/power-automate/manage-flows-with-code
- Office 365 Groups connector: https://learn.microsoft.com/connectors/office365groups/
- SharePoint connector: https://learn.microsoft.com/sharepoint/dev/business-apps/power-automate/sharepoint-connector-actions-triggers
- Microsoft Graph PowerShell SDK: https://learn.microsoft.com/powershell/microsoftgraph/installation

## 22. Próximo nível: multi-tenant

Para replicar a solução em outras organizações, não copiar IDs do ambiente original. Use o processo de [`INSTALADOR_MULTI_TENANT.md`](./INSTALADOR_MULTI_TENANT.md), com um arquivo de configuração por tenant e etapas de descoberta, bootstrap, implantação, validação e hardening.
