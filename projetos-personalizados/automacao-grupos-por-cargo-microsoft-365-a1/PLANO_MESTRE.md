# PLANO MESTRE DO PROJETO
## Automação de Inclusão de Usuários em Grupos por Cargo — Microsoft 365 Education A1

**Status:** Planejamento aprovado / pré-implementação  
**Versão deste documento:** 1.0  
**Data-base:** 18/08/2026  
**Tenant:** `eduieda.onmicrosoft.com`  
**Proprietário administrativo previsto:** `adminn@eduieda.onmicrosoft.com`  
**Plataformas principais:** Microsoft 365 Education A1, Power Automate, SharePoint Online, Microsoft 365 Groups, Microsoft Entra ID  
**Repositório de gestão do projeto:** GitHub `mcpmieda/escolaieda`  
**Classificação deste documento:** documentação técnica e operacional sem segredos

> **Regra de segurança:** este documento nunca deve conter senhas, tokens, client secrets, certificados privados, cookies, chaves de API ou qualquer credencial. O repositório GitHub atualmente usado para o projeto é público; portanto, dados pessoais de usuários, logs reais, GUIDs sensíveis desnecessários e exportações que possam carregar referências internas devem ser revisados antes de qualquer commit.

---

# 1. OBJETIVO DO PROJETO

Construir uma automação totalmente baseada em recursos do ecossistema Microsoft 365 já disponível no ambiente Office 365 Education A1, sem contratação de Microsoft Entra ID P1, Power Automate Premium, servidores próprios ou computadores que precisem permanecer ligados.

A automação deverá identificar usuários internos do Microsoft 365 a partir do atributo **Cargo** (`jobTitle`) preenchido no cadastro do usuário e adicioná-los automaticamente ao grupo Microsoft 365 correspondente.

O cadastro continuará sendo realizado normalmente no **Centro de Administração do Microsoft 365**, inclusive utilizando os modelos de usuário já existentes. O usuário administrativo não deverá precisar abrir Power Automate, Teams, SharePoint ou executar scripts para concluir cada cadastro.

## 1.1 Resultado funcional esperado

Exemplo:

1. Um administrador cria `Maria Silva`.
2. O campo Cargo é preenchido como `professor`.
3. O usuário é provisionado no Microsoft 365.
4. O Power Automate identifica que existe um usuário novo ou com alteração relevante.
5. O fluxo normaliza o Cargo.
6. O fluxo consulta a tabela de regras.
7. A regra `professor` aponta para o grupo `PROFESSORES`.
8. O fluxo verifica se Maria já pertence ao grupo.
9. Se não pertencer, adiciona Maria diretamente ao grupo `PROFESSORES`.
10. O fluxo registra o novo estado do usuário no SharePoint.
11. O fluxo grava um registro de auditoria.
12. Nenhuma intervenção adicional é necessária.

## 1.2 Meta de tempo

A meta inicial será executar a verificação a cada **2 minutos**.

O objetivo operacional é que um usuário seja classificado normalmente entre **0 e aproximadamente 2 minutos após ficar visível para os conectores utilizados pelo fluxo**, acrescido do tempo normal de propagação do próprio Microsoft 365.

Esse valor é uma **meta de projeto**, não um SLA fornecido pela Microsoft.

## 1.3 Restrições obrigatórias

A solução deve:

- não exigir Microsoft Entra ID P1;
- não exigir Power Automate Premium;
- não exigir computador ligado permanentemente;
- não depender de PowerShell na operação diária;
- não depender de scripts locais;
- não depender de uma pessoa adicionando manualmente usuários aos grupos;
- usar somente recursos compatíveis com o ambiente disponível;
- permitir auditoria;
- permitir manutenção futura por pessoas não programadoras;
- evitar regras de Cargo codificadas diretamente no fluxo sempre que possível;
- ser idempotente;
- não remover associações manuais na primeira versão;
- registrar erros sem interromper definitivamente o processamento do usuário;
- permitir evolução futura para sincronização mais rigorosa.

---

# 2. CONTEXTO ATUAL DO TENANT

## 2.1 Licenciamento

Ambiente principal: **Office 365 Education A1**.

A estratégia escolhida foi desenhada para utilizar conectores Standard do Power Automate e recursos já disponíveis no Microsoft 365.

Não será assumido que funcionalidades Premium estejam disponíveis.

## 2.2 Conta administrativa

Conta administrativa estável indicada:

`adminn@eduieda.onmicrosoft.com`

Essa conta é considerada a conta global permanente do tenant e poderá ser utilizada como:

- proprietário ou coproprietário do fluxo;
- conta de recuperação administrativa;
- responsável por auditorias;
- responsável por exportações e restaurações.

### Observação de segurança

Ser Administrador Global não significa que seja tecnicamente necessário usar essa conta para toda ação operacional do fluxo.

Se futuramente houver uma conta institucional dedicada e estável, com licença adequada e somente as permissões necessárias, deverá ser avaliada a migração das conexões operacionais para essa conta, mantendo `adminn@...` como coproprietário e conta de contingência.

Isso reduz privilégios e também ajuda a isolar consumo de solicitações do Power Platform, que é contabilizado conforme licenciamento do usuário/fluxo.

Nenhuma alteração nesse sentido será feita sem validação prévia.

## 2.3 Microsoft Graph

Existe uma configuração do Microsoft Graph já preparada no Microsoft Entra ID.

**Decisão atual:** não utilizar Microsoft Graph diretamente na versão 1 da automação.

Motivos:

- os conectores Standard já atendem à necessidade principal;
- chamadas HTTP/custom connector podem introduzir complexidade ou dependência Premium;
- o objetivo é manter a solução administrável por usuários comuns;
- Graph continuará disponível como rota de evolução caso surja limitação de escala ou recurso.

## 2.4 Aplicativo ChatGPT no Microsoft Entra

O fato de o aplicativo ChatGPT estar cadastrado no Entra não significa, por si só, que o ChatGPT tenha acesso administrativo ao tenant, Power Automate ou Entra.

As integrações dependem das permissões e ferramentas efetivamente conectadas.

**Decisão:** não considerar o ChatGPT no Entra como componente de execução da automação.

O ChatGPT poderá ser usado como ferramenta de projeto, documentação, auditoria e apoio à manutenção quando houver conectores adequados disponíveis.

## 2.5 SharePoint escolhido

O site SharePoint do **Arquivo Digital** será utilizado como repositório operacional da automação.

Ele armazenará:

- regras Cargo → Grupo;
- estado dos usuários;
- log de auditoria.

As listas técnicas deverão ter permissões controladas e não deverão ficar expostas como conteúdo de uso cotidiano dos membros comuns do Arquivo Digital.

---

# 3. GRUPOS E CARGOS DEFINIDOS

## 3.1 Grupos de destino

Os grupos atuais relevantes para a automação são:

1. `ALUNOS`
2. `EQUIPE DE APOIO`
3. `PROFESSORES`
4. `VISITANTE`
5. `GRUPO DA SECRETARIA - ARQUIVO DIGITAL`

## 3.2 Mapeamento atual de Cargos

| Cargo cadastrado | Cargo normalizado | Grupo de destino |
|---|---|---|
| aluno | `aluno` | `ALUNOS` |
| equipe de apoio | `equipe de apoio` | `EQUIPE DE APOIO` |
| professor | `professor` | `PROFESSORES` |
| visitante | `visitante` | `VISITANTE` |
| diretor | `diretor` | `GRUPO DA SECRETARIA - ARQUIVO DIGITAL` |
| Auxiliar de secretaria | `auxiliar de secretaria` | `GRUPO DA SECRETARIA - ARQUIVO DIGITAL` |
| secretaria | `secretaria` | `GRUPO DA SECRETARIA - ARQUIVO DIGITAL` |
| Coordenador pedagógico | `coordenador pedagógico` | `GRUPO DA SECRETARIA - ARQUIVO DIGITAL` |

## 3.3 Usuário com Cargo `visitante`

`visitante` é apenas um valor do campo Cargo.

O usuário é criado como usuário interno normal do tenant, e não como `Guest`.

Portanto:

- `userType = Member` continua válido;
- o fluxo deverá tratá-lo normalmente;
- Cargo `visitante` → grupo `VISITANTE`.

---

# 4. ABORDAGENS ESTUDADAS

## 4.1 Grupos dinâmicos do Microsoft Entra

### Ideia

Criar regras nativas como:

`jobTitle = professor → grupo PROFESSORES`

### Vantagens

- arquitetura nativa;
- baixa manutenção;
- atualização automática;
- ótima escalabilidade.

### Problema

Grupos dinâmicos do Microsoft Entra dependem de licenciamento superior ao A1 disponível no cenário considerado, como Entra ID P1/recursos equivalentes aplicáveis.

### Decisão

**Descartado para este projeto.**

Motivo principal: requisito de não gerar custo adicional.

---

## 4.2 PowerShell + Microsoft Graph em computador/servidor

### Ideia

Criar script que consulte usuários e grupos e seja executado periodicamente pelo Agendador de Tarefas.

### Vantagens

- controle técnico elevado;
- possibilidade de Delta Query;
- boa escalabilidade;
- lógica totalmente personalizável.

### Problemas

- exige configuração local;
- aumenta dificuldade para usuário comum;
- exige máquina ligada ou infraestrutura;
- manutenção mais técnica;
- introduz dependência operacional fora do Microsoft 365.

### Decisão

**Não usar como arquitetura principal.**

O Graph fica reservado como alternativa futura.

---

## 4.3 Equipe “Toda a organização” como gatilho

### Ideia inicialmente estudada

Criar uma equipe geral e utilizar a inclusão automática de usuários nessa equipe como evento para o Power Automate.

Foi criada a equipe:

`TODOS OS MEMBROS`

### Testes realizados

Na interface do Teams, a equipe apresentou apenas:

- Equipe Privada;
- Equipe Pública.

A opção `Toda a organização` não foi apresentada.

Foi realizado diagnóstico no Teams PowerShell via Azure Cloud Shell.

#### Política consultada

Resultado:

```text
Identity    AllowOrgWideTeamCreation
--------    ------------------------
Global                          True
Tag:Default                     True
```

Também foi consultada atribuição específica da conta:

`adminn@eduieda.onmicrosoft.com`

Resultado: nenhuma política específica retornada.

Conclusão prática do diagnóstico:

- a conta herda a política Global;
- `AllowOrgWideTeamCreation = True`;
- mesmo assim, a interface do tenant não oferece a opção desejada;
- não é adequado basear a automação em um comportamento que não está disponível de forma comprovada nesse ambiente.

### Decisão

**Abandonar a equipe “Toda a organização” como componente técnico do projeto.**

A equipe `TODOS OS MEMBROS`:

- não será necessária para a automação;
- poderá ser mantida se houver uso institucional;
- poderá ser removida se não houver finalidade;
- não deverá ser usada como marcador de usuários processados.

---

## 4.4 `TODOS OS MEMBROS` como registro de processamento

### Ideia

Adicionar primeiro cada usuário em `TODOS OS MEMBROS` e usar esse grupo como indicação de que o usuário já foi processado.

### Problema

Cria uma etapa intermediária desnecessária:

`usuário → TODOS OS MEMBROS → grupo correto`

A necessidade real é:

`usuário → grupo correto`

Além disso, misturaria estado técnico da automação com uma associação real do Microsoft 365.

### Decisão

**Descartado.**

O estado será armazenado no SharePoint.

---

## 4.5 Power Automate recorrente + inclusão direta no grupo

### Ideia

Executar o Power Automate periodicamente, encontrar usuários novos ou alterados e adicionar diretamente ao grupo indicado pela regra do Cargo.

### Vantagens

- não depende de P1;
- não depende de computador ligado;
- conectores necessários são Standard;
- configuração inteiramente na nuvem;
- manutenção acessível;
- rastreabilidade;
- regras podem ser mantidas no SharePoint;
- grupos recebem o usuário diretamente;
- pode evoluir gradualmente.

### Decisão

**ARQUITETURA APROVADA PARA A VERSÃO 1.**

---

# 5. ARQUITETURA DEFINITIVA DA VERSÃO 1

```text
CENTRO DE ADMINISTRAÇÃO MICROSOFT 365
             │
             │ usuário criado/alterado
             │ Cargo preenchido
             ▼
     OFFICE 365 USERS
     Pesquisar usuários (V2)
             │
             ▼
      POWER AUTOMATE
      recorrência: 2 min
             │
             ├───────────────┐
             │               │
             ▼               ▼
 SHAREPOINT: ESTADO   SHAREPOINT: REGRAS
   DOS USUÁRIOS        CARGO → GRUPO
             │               │
             └───────┬───────┘
                     ▼
             NOVO OU ALTERADO?
                     │
              ┌──────┴──────┐
              │             │
             NÃO           SIM
              │             │
          encerrar          ▼
                    NORMALIZAR CARGO
                            │
                            ▼
                      LOCALIZAR REGRA
                            │
                            ▼
                    VALIDAR ASSOCIAÇÃO
                            │
                            ▼
                 OFFICE 365 GROUPS /
                     ENTRA STANDARD
                            │
                            ▼
                    ADICIONAR AO GRUPO
                            │
                            ▼
                    ATUALIZAR ESTADO
                            │
                            ▼
                       GRAVAR LOG
```

---

# 6. PRINCÍPIOS DE PROJETO

## 6.1 Separação de responsabilidades

A solução será dividida em três camadas:

### Configuração e estado — SharePoint

Responsável por:

- regras;
- estado atual conhecido;
- histórico.

### Motor — Power Automate

Responsável por:

- buscar;
- comparar;
- decidir;
- executar;
- registrar.

### Diretório e grupos — Microsoft 365

Responsável por:

- usuários;
- Cargo;
- associação aos grupos.

Isso evita que o fluxo se torne um bloco monolítico difícil de manter.

## 6.2 Configuração fora do código

As regras de Cargo não deverão ficar espalhadas em vários `Condition` ou `Switch` fixos no fluxo.

O fluxo consultará uma lista SharePoint.

Benefício:

adicionar `bibliotecário → EQUIPE DE APOIO` deverá ser uma alteração de dados, não uma alteração de código.

## 6.3 Idempotência

Executar o mesmo processamento mais de uma vez não deve gerar efeito incorreto.

Exemplo:

1. usuário é adicionado ao grupo;
2. fluxo falha antes de gravar o estado;
3. próximo ciclo identifica novamente o usuário;
4. sistema verifica associação;
5. percebe que ele já pertence ao grupo;
6. considera a etapa concluída;
7. atualiza estado e log.

## 6.4 Segurança por padrão

A versão 1 será **add-only**.

Ela poderá adicionar usuário ao grupo correto, mas não removerá automaticamente associações anteriores.

Motivo:

uma associação anterior pode ter sido concedida manualmente como exceção.

## 6.5 Evolução controlada

Remoção automática poderá existir em uma versão futura somente quando o sistema tiver registro confiável de quais associações foram criadas pela própria automação.

---

# 7. LISTAS DO SHAREPOINT

O site do **Arquivo Digital** será o repositório operacional.

Serão criadas três listas.

---

## 7.1 LISTA 1 — `AUTOMAÇÃO - REGRAS DE GRUPOS`

### Objetivo

Definir quais Cargos correspondem a quais grupos.

### Colunas propostas

#### `Title`

Tipo: Texto

Uso: nome amigável da regra.

Exemplo:

`Professor → PROFESSORES`

#### `CargoOriginalReferencia`

Tipo: Texto

Exemplo:

`Professor`

Uso: referência humana.

#### `CargoNormalizado`

Tipo: Texto  
Obrigatório: Sim  
Indexado: Sim  
Valor único: preferencialmente Sim

Exemplos:

- `professor`
- `aluno`
- `auxiliar de secretaria`

#### `GrupoNome`

Tipo: Texto  
Obrigatório: Sim

Exemplo:

`PROFESSORES`

#### `GrupoID`

Tipo: Texto  
Obrigatório: Sim

Uso: GUID real do grupo.

**Regra:** ações técnicas usarão `GrupoID`; `GrupoNome` é apenas leitura humana.

#### `Ativo`

Tipo: Sim/Não  
Padrão: Sim  
Indexado: Sim

Permite desativar uma regra sem excluí-la.

#### `Observacao`

Tipo: várias linhas de texto

#### `DataRevisao`

Tipo: Data/Hora

#### `RevisadoPor`

Tipo: Pessoa ou Texto

### Registros iniciais

Oito regras serão criadas conforme o mapeamento oficial deste documento.

---

## 7.2 LISTA 2 — `AUTOMAÇÃO - ESTADO DOS USUÁRIOS`

### Objetivo

Registrar o último estado conhecido de cada usuário e permitir detectar:

- novo usuário;
- alteração de Cargo;
- pendência;
- erro;
- usuário desabilitado.

O nome **Estado dos Usuários** é preferido a “Usuários Processados” porque o processo é contínuo.

### Colunas propostas

#### `Title`

Sugestão: UPN do usuário.

#### `EntraID`

Tipo: Texto  
Obrigatório: Sim  
Indexado: Sim  
Valor único: Sim

É a chave principal lógica.

#### `UPN`

Tipo: Texto  
Obrigatório: Sim  
Indexado: Sim

#### `NomeExibicao`

Tipo: Texto

#### `UserType`

Tipo: Texto

Esperado: `Member`.

#### `AccountEnabled`

Tipo: Sim/Não

#### `CargoOriginal`

Tipo: Texto

Valor exatamente como recebido do Microsoft 365.

#### `CargoNormalizado`

Tipo: Texto  
Indexado: Sim

#### `GrupoGerenciadoNome`

Tipo: Texto

#### `GrupoGerenciadoID`

Tipo: Texto

#### `Status`

Tipo: Escolha ou Texto  
Indexado: Sim

Valores iniciais:

- `OK`
- `PENDENTE_CARGO`
- `SEM_REGRA`
- `PENDENTE_GRUPO`
- `ERRO`
- `DESABILITADO`
- `IGNORADO`

#### `UltimaVerificacao`

Tipo: Data/Hora

#### `UltimoSucesso`

Tipo: Data/Hora

#### `UltimoErro`

Tipo: Data/Hora

#### `DetalheUltimoErro`

Tipo: várias linhas

#### `TentativasConsecutivas`

Tipo: Número

#### `FlowRunID`

Tipo: Texto

### Regras

- nunca identificar usuário por nome;
- nunca usar email como chave única definitiva se `EntraID` estiver disponível;
- UPN é informativo e operacional;
- EntraID é a chave canônica;
- se Cargo mudar, o usuário é novamente elegível para processamento.

---

## 7.3 LISTA 3 — `AUTOMAÇÃO - LOG DE GRUPOS`

### Objetivo

Criar trilha permanente de auditoria independente do histórico temporário do Power Automate.

### Colunas propostas

#### `Title`

Exemplo:

`2026-08-18 | Maria Silva | PROFESSORES`

#### `DataHora`

Tipo: Data/Hora  
Indexado: Sim

#### `FlowRunID`

Tipo: Texto  
Indexado: Sim

#### `EntraID`

Tipo: Texto  
Indexado: Sim

#### `UPN`

Tipo: Texto

#### `NomeExibicao`

Tipo: Texto

#### `CargoOriginal`

Tipo: Texto

#### `CargoNormalizado`

Tipo: Texto

#### `GrupoNome`

Tipo: Texto  
Indexado: Sim

#### `GrupoID`

Tipo: Texto

#### `Operacao`

Tipo: Escolha

Valores:

- `ANALISAR`
- `ADICIONAR`
- `JA_MEMBRO`
- `ALTERACAO_CARGO`
- `SEM_REGRA`
- `ERRO`
- `IGNORAR`

#### `Resultado`

Tipo: Escolha  
Indexado: Sim

Valores:

- `SUCESSO`
- `AVISO`
- `ERRO`

#### `Detalhes`

Tipo: várias linhas

#### `Tentativa`

Tipo: Número

#### `VersaoFluxo`

Tipo: Texto

### Crescimento

SharePoint Online trabalha com limiar de exibição/consulta de 5.000 itens em certos cenários.

Portanto:

- DataHora deve ser indexada;
- EntraID deve ser indexado;
- Resultado deve ser indexado;
- GrupoNome/GrupoID deve ser indexado conforme necessidade;
- criar visualizações filtradas por ano;
- considerar arquivamento anual;
- evitar consultas não filtradas em logs muito grandes.

---

# 8. PERMISSÕES NO SHAREPOINT

As listas técnicas não devem depender das permissões comuns de uso do Arquivo Digital sem revisão.

## 8.1 Acesso mínimo desejado

### Administração

`adminn@eduieda.onmicrosoft.com`

Permissão: Controle total ou equivalente necessário.

### Conta operacional do Power Automate

Permissão necessária para:

- ler Regras;
- ler/escrever Estado;
- gravar Log.

### Usuários comuns

Não precisam:

- editar regras;
- editar estado;
- editar logs.

Se possível, restringir acesso.

## 8.2 Não armazenar

Nunca armazenar nessas listas:

- senhas;
- refresh tokens;
- access tokens;
- client secrets;
- certificados privados;
- cookies;
- códigos MFA;
- chaves privadas.

---

# 9. NORMALIZAÇÃO DO CARGO

## 9.1 Objetivo

Evitar falhas causadas apenas por formatação.

## 9.2 Transformações

Cargo recebido será normalizado com lógica equivalente a:

1. converter nulo para string vazia segura;
2. remover espaços no início;
3. remover espaços no final;
4. converter para minúsculas;
5. opcionalmente tratar múltiplos espaços internos somente se validado.

Exemplos:

| Entrada | Normalizado |
|---|---|
| `Professor` | `professor` |
| ` PROFESSOR ` | `professor` |
| `professor` | `professor` |
| `Coordenador pedagógico` | `coordenador pedagógico` |

## 9.3 O que NÃO será feito automaticamente

Não haverá inferência sem regra.

Exemplo:

`professora`

não será automaticamente convertido para:

`professor`

a menos que uma regra específica seja cadastrada.

Resultado:

`SEM_REGRA`

Isso evita erros silenciosos.

---

# 10. QUEM DEVE SER PROCESSADO

## 10.1 Critérios iniciais

Priorizar:

- `userType = Member`;
- `accountEnabled = true`.

## 10.2 Contas desabilitadas

Não devem receber nova associação automática.

Estado:

`DESABILITADO`

## 10.3 Cargo vazio

Estado:

`PENDENTE_CARGO`

A conta não deve ser considerada “finalizada”.

Se o Cargo for preenchido futuramente, a alteração deverá ser detectada.

## 10.4 Cargo desconhecido

Estado:

`SEM_REGRA`

Nenhum grupo será atribuído.

A ocorrência deverá aparecer na auditoria.

## 10.5 Contas administrativas/técnicas

Se não possuírem Cargo reconhecido:

- não serão adicionadas a grupo de profissão;
- poderão permanecer `PENDENTE_CARGO`, `SEM_REGRA` ou ser explicitamente marcadas como `IGNORADO`.

A criação de uma lista de exclusões poderá ser adicionada se surgirem muitos objetos técnicos.

---

# 11. DETECÇÃO DE NOVO USUÁRIO OU ALTERAÇÃO

A automação não procurará apenas “novos usuários”.

Ela procurará:

**NOVO OU ALTERADO**

## 11.1 Usuário novo

Condição conceitual:

`EntraID atual não existe na lista Estado`

## 11.2 Cargo alterado

Condição conceitual:

`CargoNormalizado atual != CargoNormalizado armazenado`

## 11.3 Conta habilitada/desabilitada

Mudança em `accountEnabled` poderá ser registrada.

Na versão 1:

- desabilitar usuário não removerá automaticamente associação de grupo;
- apenas impedirá novas inclusões e atualizará estado.

## 11.4 UPN/nome alterado

Se EntraID permanecer igual:

- atualizar informações no SharePoint;
- não tratar como usuário novo.

---

# 12. FLUXO POWER AUTOMATE — DESENHO FUNCIONAL

Nome sugerido:

`AUTO | Grupos por Cargo | Microsoft 365`

Versão inicial:

`1.0.0`

---

## 12.1 Gatilho

Tipo:

`Recorrência`

Configuração inicial:

- Frequência: Minuto
- Intervalo: 2

Timezone:

usar timezone consistente com a organização; preferencialmente `America/Sao_Paulo` quando aplicável.

---

## 12.2 Etapa A — buscar usuários

Conector:

`Office 365 Users`

Ação:

`Pesquisar usuários (V2)`

Configuração:

- Search Term: vazio;
- Is Search Term Required: Não;
- TOP: controlar explicitamente.

Campos necessários:

- id;
- displayName;
- userPrincipalName;
- jobTitle;
- accountEnabled;
- userType.

### Limitação conhecida

A documentação do conector informa `TOP` padrão de 1000.

Antes de considerar o projeto apto para tenants acima desse volume, será obrigatório validar como o conector se comporta com a população real e se a paginação necessária é suportada no desenho escolhido.

Se o tenant se aproximar de 1.000 usuários ou o conector se mostrar inadequado:

**rota de evolução:** Microsoft Graph, incluindo estratégia incremental/delta, após revisão de licenciamento e autenticação.

---

## 12.3 Etapa B — buscar estado

Conector:

`SharePoint`

Ação:

`Get items / Obter itens`

Lista:

`AUTOMAÇÃO - ESTADO DOS USUÁRIOS`

Objetivo:

carregar a base necessária para comparação.

Evitar uma consulta SharePoint por usuário.

---

## 12.4 Etapa C — comparar em memória

Objetivo:

reduzir chamadas de conector.

O fluxo deverá identificar somente:

- usuários sem registro;
- usuários cujo Cargo mudou;
- usuários com mudança de estado relevante;
- usuários pendentes que agora podem ser resolvidos.

A maior parte dos usuários deverá passar por comparação interna e não gerar chamadas adicionais.

---

## 12.5 Etapa D — processar somente alterações

Para cada usuário novo/alterado:

1. validar `userType`;
2. validar `accountEnabled`;
3. normalizar Cargo;
4. localizar regra;
5. se não houver Cargo → PENDENTE_CARGO;
6. se não houver regra → SEM_REGRA;
7. se houver regra → continuar.

---

## 12.6 Etapa E — obter regra

Conector:

SharePoint.

Lista:

`AUTOMAÇÃO - REGRAS DE GRUPOS`

Filtro preferencial:

`CargoNormalizado = cargo atual AND Ativo = true`

A consulta das regras pode ser feita apenas quando houver usuário que realmente precisa de processamento.

Isso reduz consumo durante ciclos sem alterações.

---

## 12.7 Etapa F — verificar associação

Antes de adicionar:

verificar se o usuário já pertence ao grupo.

Pode ser usada ação Standard adequada do Microsoft Entra ID ou Microsoft 365 Groups, conforme resultado da implementação e menor custo de chamadas.

Resultado:

### Já pertence

- não adicionar novamente;
- considerar estado coerente;
- log `JA_MEMBRO`;
- atualizar estado.

### Não pertence

- adicionar ao grupo;
- log `ADICIONAR`;
- atualizar estado.

---

## 12.8 Etapa G — adicionar diretamente ao grupo

Conector preferencial:

`Office 365 Groups`

Ação:

`Add member to group / Adicionar membro ao grupo`

Entradas:

- `Group Id` = GrupoID da regra;
- `User Principal Name` = UPN do usuário.

O conector é Standard.

---

## 12.9 Etapa H — gravar estado

Somente após resultado coerente.

Atualizar/criar item na lista Estado.

Nunca marcar como `OK` antes de confirmar associação ou condição equivalente de sucesso.

---

## 12.10 Etapa I — gravar log

Registrar:

- data/hora;
- usuário;
- Cargo;
- grupo;
- operação;
- resultado;
- FlowRunID;
- versão;
- erro, se houver.

---

# 13. ORÇAMENTO DE SOLICITAÇÕES POWER PLATFORM

Este ponto é crítico.

A documentação atual do Power Platform informa limite oficial de **6.000 solicitações por usuário em 24 horas** para Office 365/níveis equivalentes indicados.

Existe período de transição com limites de fluxo diferentes em alguns cenários, porém o projeto utilizará **6.000 como teto de projeto conservador**.

## 13.1 Recorrência de 2 minutos

Execuções máximas aproximadas:

`24 × 60 / 2 = 720 execuções por dia`

## 13.2 Meta para ciclo sem alterações

O fluxo deve buscar ficar em aproximadamente **até 5 ou 6 ações contabilizáveis por ciclo sem alteração**.

Estimativa:

- 5 × 720 = 3.600;
- 6 × 720 = 4.320.

Isso deixa margem para:

- novos usuários;
- atualizações;
- logs;
- retries;
- eventuais execuções extras.

## 13.3 Limite de segurança

Se o fluxo básico consumir 9 ações em toda execução:

`9 × 720 = 6.480`

Isso ultrapassaria o teto conservador.

**Regra de implementação:** qualquer ação colocada no caminho executado a cada 2 minutos precisa ser justificada.

## 13.4 Ações que devem ocorrer somente quando necessário

- consulta individual de regra;
- verificação de associação;
- inclusão;
- atualização do item de estado;
- criação de log detalhado;
- notificação;
- retry.

## 13.5 Conta proprietária e consumo

Solicitações podem ser contabilizadas no contexto do usuário/licença.

Se `adminn@...` possuir outros fluxos, o consumo agregado deverá ser considerado.

A criação futura de uma conta dedicada de automação poderá ser avaliada.

---

# 14. POLÍTICA DE ALTERAÇÃO DE CARGO

## 14.1 Versão 1 — add-only

Exemplo:

Estado anterior:

`professor → PROFESSORES`

Novo Cargo:

`diretor → GRUPO DA SECRETARIA - ARQUIVO DIGITAL`

A V1 fará:

- adicionar ao grupo da Secretaria;
- atualizar estado;
- registrar alteração;
- NÃO remover de PROFESSORES.

## 14.2 Motivo

Pode existir uma associação manual legítima.

Remoção automática sem origem conhecida é arriscada.

## 14.3 Evolução futura

Uma V2 poderá armazenar:

- associação criada pela automação;
- data;
- regra usada;
- origem `AUTOMACAO`.

Somente associações comprovadamente gerenciadas pela automação poderão ser removidas automaticamente.

---

# 15. TRATAMENTO DE ERROS

## 15.1 Princípio

Erro não deve transformar usuário em “concluído”.

## 15.2 Estados

Falha transitória:

`PENDENTE_GRUPO` ou `ERRO`

## 15.3 Retry

Usar política exponencial adequada nas ações de conector que suportarem retry.

Atenção:

retries também consomem solicitações.

## 15.4 Erro persistente

Após número definido de falhas consecutivas:

- manter Status `ERRO`;
- registrar detalhes;
- registrar número de tentativas;
- gerar alerta administrativo somente quando necessário.

## 15.5 Alertas

Evitar email a cada execução.

Preferência:

alertar quando:

- erro persistir;
- Cargo estiver sem regra por período relevante;
- regra apontar para grupo inválido;
- SharePoint ficar indisponível repetidamente.

---

# 16. MODO AUDITORIA ANTES DA ATIVAÇÃO

A primeira execução não deverá sair adicionando usuários indiscriminadamente.

## 16.1 Fase de simulação

Criar versão do fluxo com escrita de grupos desabilitada.

Ela deverá produzir diagnóstico:

- total de usuários;
- usuários com Cargo reconhecido;
- usuários sem Cargo;
- usuários sem regra;
- usuários que já estão no grupo correto;
- usuários que precisariam ser adicionados;
- contas desabilitadas;
- contas ignoradas.

## 16.2 Critério de aprovação

Somente liberar ação `Adicionar membro ao grupo` após conferir o relatório.

## 16.3 Benefício

Evita erro de configuração em massa.

---

# 17. INICIALIZAÇÃO DA LISTA ESTADO

Existem usuários já existentes antes da automação.

## 17.1 Objetivo

Criar baseline sem tratar toda a população como “novo cadastro”.

## 17.2 Procedimento

1. executar modo auditoria;
2. validar regras;
3. preencher Estado com a situação conhecida;
4. identificar inconsistências existentes;
5. decidir quais inconsistências corrigir;
6. marcar baseline;
7. ativar versão operacional.

## 17.3 Importante

A primeira carga deve ser controlada.

Não habilitar escrita em grupos antes da validação.

---

# 18. PLANO DE TESTES

Nenhuma versão deve ser considerada estável apenas porque o fluxo foi salvo sem erro.

## 18.1 Teste — Professor

Criar usuário de teste.

Cargo: `professor`

Esperado:

- detectado;
- regra encontrada;
- adicionado a `PROFESSORES`;
- estado `OK`;
- log `SUCESSO`.

## 18.2 Teste — Aluno

Cargo: `aluno`

Esperado: `ALUNOS`.

## 18.3 Teste — Equipe de Apoio

Cargo: `equipe de apoio`

Esperado: `EQUIPE DE APOIO`.

## 18.4 Teste — Visitante

Usuário interno normal.

Cargo: `visitante`

Esperado: `VISITANTE`.

## 18.5 Teste — Diretor

Cargo: `diretor`

Esperado: `GRUPO DA SECRETARIA - ARQUIVO DIGITAL`.

## 18.6 Teste — Secretaria

Cargo: `secretaria`

Esperado: grupo da Secretaria.

## 18.7 Teste — Auxiliar de secretaria

Testar: `Auxiliar de secretaria`

Esperado após normalização: `auxiliar de secretaria`.

Destino: grupo da Secretaria.

## 18.8 Teste — Coordenador pedagógico

Testar: `Coordenador pedagógico`

Esperado: grupo da Secretaria.

## 18.9 Teste — caixa e espaços

Entrada: `  PROFESSOR  `

Esperado: normalizado para `professor`.

## 18.10 Teste — Cargo desconhecido

Cargo: `bibliotecário`, sem regra.

Esperado:

- não adicionar;
- Status `SEM_REGRA`;
- log de aviso.

## 18.11 Teste — Cargo vazio

Esperado: `PENDENTE_CARGO`.

Sem inclusão.

Depois preencher Cargo.

Esperado: alteração detectada no próximo ciclo.

## 18.12 Teste — usuário desabilitado

Esperado:

- não adicionar;
- Estado `DESABILITADO`.

## 18.13 Teste — usuário já pertencente ao grupo

Esperado:

- não falhar;
- não duplicar;
- considerar sucesso coerente;
- log `JA_MEMBRO`.

## 18.14 Teste — repetição após falha

Simular: grupo adicionado, Estado não atualizado.

Esperado:

- novo ciclo detecta;
- verifica associação;
- não duplica;
- corrige Estado.

## 18.15 Teste — alteração de Cargo

Inicial: `professor`

Depois: `diretor`

Esperado V1:

- adicionar grupo Secretaria;
- manter PROFESSORES;
- atualizar Estado;
- log `ALTERACAO_CARGO`.

## 18.16 Teste — grupo renomeado

Renomear grupo de teste mantendo GUID.

Esperado: ação continua funcionando porque regra usa GrupoID.

## 18.17 Teste — regra desativada

`Ativo = Não`

Esperado: regra não utilizada.

## 18.18 Teste — grupo inválido

Inserir GrupoID inválido em regra de teste.

Esperado:

- não marcar OK;
- Estado ERRO;
- log com detalhe;
- retry controlado.

## 18.19 Teste — SharePoint indisponível

Simular falha de acesso/conexão em ambiente controlado.

Esperado:

- fluxo falha de modo visível;
- não perde integridade;
- próximo ciclo pode recuperar.

## 18.20 Teste — escala

Monitorar:

- duração;
- número de ações;
- quantidade de usuários;
- quantidade de itens na lista Estado;
- PPR por dia.

---

# 19. CRITÉRIOS DE ACEITAÇÃO DA V1

A V1 poderá ser declarada estável quando:

- todos os oito Cargos atuais estiverem mapeados;
- todos os testes principais passarem;
- nenhum usuário for removido automaticamente;
- Cargo vazio não virar OK;
- Cargo desconhecido gerar SEM_REGRA;
- usuário já associado não gerar falha;
- erro de grupo não gerar falso sucesso;
- log estiver sendo gravado;
- Estado estiver sendo atualizado;
- recorrência de 2 minutos estiver estável;
- consumo diário estiver dentro do orçamento;
- proprietário/coproprietário estiver configurado;
- backup/exportação tiver sido realizada;
- documentação GitHub estiver atualizada;
- houver pelo menos um ponto seguro identificado.

---

# 20. MONITORAMENTO PÓS-IMPLANTAÇÃO

## Primeiras 24 horas

Verificar:

- histórico de execução;
- erros;
- PPR;
- tempo médio;
- usuários pendentes;
- duplicidades.

## Primeiros 7 dias

Revisão diária.

## Após estabilidade

Revisão periódica.

Sugestão:

- mensal para regras;
- trimestral para arquitetura;
- anual para arquivamento de logs.

---

# 21. BACKUP E VERSIONAMENTO

## 21.1 Power Automate

Se o ambiente não tiver Dataverse/Soluções disponível:

usar exportação de fluxo não-solução como pacote `.zip`.

A Microsoft suporta exportação/importação de fluxos não-solução em pacote ZIP.

## 21.2 Soluções

Se houver Dataverse disponível sem custo adicional aplicável ao ambiente:

avaliar criar solução:

`Automação - Grupos por Cargo`

Vantagens:

- ALM;
- referências de conexão;
- variáveis de ambiente;
- exportação estruturada;
- JSON de workflow amigável para controle de revisão.

Dataverse é pré-requisito para fluxos solution-aware.

Não adquirir licença adicional somente para obter esse recurso sem nova análise.

## 21.3 GitHub

O GitHub será o **registro mestre do projeto** para:

- decisões;
- documentação;
- checklists;
- changelog;
- versões de configuração sanitizadas;
- scripts auxiliares não secretos;
- relatórios de auditoria sanitizados;
- documentação de testes.

---

# 22. SEGURANÇA DO GITHUB

## 22.1 Situação atual

Repositório:

`mcpmieda/escolaieda`

Visibilidade observada:

`public`

Isso é crítico.

## 22.2 Nunca commitar

- secrets;
- tokens;
- senhas;
- certificados;
- logs contendo dados pessoais reais em massa;
- exportações sem revisão;
- listas SharePoint exportadas com usuários;
- arquivos de autenticação;
- informações que permitam assumir identidade.

## 22.3 Documentação permitida

Este plano pode conter:

- arquitetura;
- nomes de grupos;
- nomes de Cargos;
- decisões;
- procedimentos;
- exemplos fictícios;
- placeholders de GUID.

Se a política da organização considerar os nomes internos sensíveis, migrar o projeto para repositório privado.

## 22.4 Futuro recomendado

Avaliar:

- repositório privado exclusivo para projetos administrativos;
- branch protection;
- revisão de mudanças;
- issues para tarefas;
- tags/releases para pontos seguros.

---

# 23. ESTRUTURA GITHUB DO PROJETO

Estrutura inicial:

```text
projetos-personalizados/
└── automacao-grupos-por-cargo-microsoft-365-a1/
    └── PLANO_MESTRE.md
```

Estrutura futura sugerida:

```text
projetos-personalizados/
└── automacao-grupos-por-cargo-microsoft-365-a1/
    ├── PLANO_MESTRE.md
    ├── README.md
    ├── CHANGELOG.md
    ├── DECISOES.md
    ├── TESTES.md
    ├── AUDITORIAS/
    │   ├── auditoria-v1.0.md
    │   └── ...
    ├── POWER-AUTOMATE/
    │   ├── exports-sanitizados/
    │   └── notas-de-versao/
    ├── SHAREPOINT/
    │   ├── schema-regras.md
    │   ├── schema-estado.md
    │   └── schema-log.md
    └── EVIDENCIAS/
        └── somente material sem dados pessoais
```

---

# 24. FLUXO DE GESTÃO DO PROJETO NO GITHUB

Cada alteração relevante deverá produzir algum registro.

## 24.1 Antes de mudar

Registrar:

- problema;
- objetivo;
- escopo;
- risco.

## 24.2 Durante

Registrar:

- alteração executada;
- componentes afetados;
- testes.

## 24.3 Depois

Registrar:

- resultado;
- regressões;
- status;
- nova versão.

## 24.4 Ponto seguro

Quando uma versão estiver estável:

- exportar fluxo;
- atualizar documentação;
- criar commit;
- opcionalmente criar tag/release;
- declarar a versão como ponto seguro.

---

# 25. VERSIONAMENTO PROPOSTO

Formato:

`MAJOR.MINOR.PATCH`

Exemplos:

### `1.0.0`

Primeira versão estável:

- detecção;
- regras;
- inclusão;
- estado;
- log.

### `1.1.0`

Nova funcionalidade compatível.

### `1.1.1`

Correção sem mudança de comportamento principal.

### `2.0.0`

Mudança estrutural, como remoção automática de associações gerenciadas.

---

# 26. CHANGE MANAGEMENT

Antes de qualquer mudança estrutural:

1. identificar versão estável;
2. exportar backup;
3. registrar alteração;
4. modificar escopo fechado;
5. testar somente área alterada e dependências;
6. executar regressão principal;
7. atualizar documentação;
8. promover novo ponto seguro.

Evitar acumular correções sobre correções sem limpeza.

---

# 27. FASES DE EXECUÇÃO

## FASE 0 — Segurança e pré-requisitos

- [ ] Confirmar URL do site SharePoint Arquivo Digital.
- [ ] Confirmar proprietário administrativo.
- [ ] Verificar conta que será usada nas conexões.
- [ ] Confirmar grupos.
- [ ] Obter GUID dos cinco grupos.
- [ ] Confirmar modelos de usuário e Cargos.
- [ ] Confirmar quantidade aproximada de usuários.
- [ ] Confirmar que nenhum segredo será colocado no GitHub.

**Saída:** pré-requisitos aprovados.

---

## FASE 1 — SharePoint

- [ ] Criar `AUTOMAÇÃO - REGRAS DE GRUPOS`.
- [ ] Criar colunas.
- [ ] Criar índices.
- [ ] Inserir oito regras.
- [ ] Criar `AUTOMAÇÃO - ESTADO DOS USUÁRIOS`.
- [ ] Criar colunas.
- [ ] Criar índices.
- [ ] Ativar unicidade de EntraID.
- [ ] Criar `AUTOMAÇÃO - LOG DE GRUPOS`.
- [ ] Criar colunas.
- [ ] Criar índices.
- [ ] Configurar permissões.
- [ ] Testar leitura/escrita.

**Saída:** armazenamento operacional pronto.

---

## FASE 2 — Power Automate em modo auditoria

- [ ] Criar fluxo.
- [ ] Configurar Recorrência 2 min.
- [ ] Conectar Office 365 Users.
- [ ] Buscar usuários.
- [ ] Buscar Estado.
- [ ] Criar comparação.
- [ ] Normalizar Cargo.
- [ ] Consultar regras.
- [ ] Não habilitar inclusão ainda.
- [ ] Gravar diagnóstico.
- [ ] Medir quantidade de ações por execução.
- [ ] Medir duração.

**Saída:** fluxo lê corretamente sem alterar grupos.

---

## FASE 3 — Baseline

- [ ] Analisar usuários existentes.
- [ ] Identificar sem Cargo.
- [ ] Identificar sem regra.
- [ ] Conferir associações atuais.
- [ ] Corrigir regras erradas.
- [ ] Criar Estado inicial.
- [ ] Registrar baseline no GitHub.

**Saída:** estado inicial confiável.

---

## FASE 4 — Piloto de escrita

- [ ] Habilitar inclusão somente para usuários de teste.
- [ ] Testar professor.
- [ ] Testar aluno.
- [ ] Testar apoio.
- [ ] Testar visitante.
- [ ] Testar Secretaria.
- [ ] Testar Cargo vazio.
- [ ] Testar Cargo desconhecido.
- [ ] Testar já membro.
- [ ] Testar erro.
- [ ] Testar mudança de Cargo.

**Saída:** escrita validada.

---

## FASE 5 — Produção controlada

- [ ] Remover filtro de usuário de teste.
- [ ] Ativar processamento geral.
- [ ] Monitorar 24 horas.
- [ ] Monitorar 7 dias.
- [ ] Medir PPR.
- [ ] Ajustar somente se necessário.

**Saída:** V1 operacional.

---

## FASE 6 — Ponto seguro V1.0.0

- [ ] Exportar fluxo.
- [ ] Revisar exportação antes de GitHub.
- [ ] Atualizar PLANO_MESTRE.
- [ ] Criar CHANGELOG.
- [ ] Criar TESTES.
- [ ] Registrar auditoria.
- [ ] Commitar documentação.
- [ ] Declarar V1.0.0 estável.

**Saída:** projeto recuperável e documentado.

---

# 28. RISCOS E MITIGAÇÕES

| Risco | Impacto | Mitigação |
|---|---|---|
| Cargo digitado diferente | usuário sem grupo | normalização + SEM_REGRA |
| Cargo vazio | usuário não classificado | PENDENTE_CARGO |
| Grupo renomeado | potencial quebra por nome | usar GrupoID |
| Grupo removido | erro | log + ERRO |
| Flow falha após inclusão | reprocessamento | idempotência |
| Associação manual especial | remoção indevida | V1 não remove |
| Muitas ações a cada 2 min | atingir PPR | caminho base enxuto |
| Mais de 1000 usuários | enumeração incompleta | checkpoint de escala + Graph futuro |
| SharePoint >5000 logs | consultas limitadas | índices + arquivo anual |
| Conta proprietária alterada | automação órfã | adminn estável + copropriedade |
| Conexão expirada | falha | monitoramento + alerta |
| GitHub público | exposição | sem segredos/dados pessoais |
| Retry excessivo | PPR | política controlada |
| Regra duplicada | destino ambíguo | CargoNormalizado único |
| Alteração simultânea | corrida | controle de concorrência se necessário |

---

# 29. CONCORRÊNCIA

Inicialmente, controlar concorrência para evitar duas execuções manipulando o mesmo estado simultaneamente se uma execução demorar mais de 2 minutos.

Opção a avaliar na implementação:

- limitar concorrência do gatilho a 1;
- ou usar controle apropriado para garantir consistência.

Critério:

se duração típica for muito inferior a 2 minutos, concorrência 1 simplifica bastante.

---

# 30. NOMENCLATURA

## Fluxo

`AUTO | Grupos por Cargo | Microsoft 365`

## Listas

- `AUTOMAÇÃO - REGRAS DE GRUPOS`
- `AUTOMAÇÃO - ESTADO DOS USUÁRIOS`
- `AUTOMAÇÃO - LOG DE GRUPOS`

## Versão

`1.0.0`

## Status

Usar valores padronizados em letras maiúsculas.

---

# 31. DOCUMENTAÇÃO OPERACIONAL FUTURA

Após concluir a implantação, criar manual simples contendo:

## Como adicionar Cargo novo

1. abrir lista Regras;
2. criar linha;
3. preencher CargoNormalizado;
4. selecionar GrupoID;
5. Ativo = Sim;
6. testar.

## Como trocar grupo de um Cargo

Atualizar GrupoID da regra.

## Como desativar uma regra

Ativo = Não.

## Como investigar usuário

Pesquisar EntraID/UPN em Estado e Log.

## Como suspender automação

Desativar fluxo no Power Automate.

## Como restaurar

Importar último pacote estável.

---

# 32. DECISÕES FORMAIS DO PROJETO

## D-001 — Sem custo adicional

**Decisão:** utilizar somente recursos disponíveis no ambiente atual.

**Status:** aprovado.

## D-002 — Não usar grupo dinâmico Entra P1

**Motivo:** licenciamento adicional.

**Status:** definitivo para V1.

## D-003 — Power Automate como motor

**Motivo:** nuvem, baixa barreira operacional e integração Microsoft 365.

**Status:** aprovado.

## D-004 — Não depender de Windows/PowerShell

PowerShell pode ser usado pontualmente para diagnóstico administrativo, mas não na operação normal.

**Status:** aprovado.

## D-005 — Equipe `TODOS OS MEMBROS` fora do motor

Após estudo e teste, a equipe não é necessária.

**Status:** aprovado.

## D-006 — Inclusão direta

Usuário será adicionado diretamente ao grupo final.

**Status:** aprovado.

## D-007 — SharePoint Arquivo Digital

Será o repositório operacional.

**Status:** aprovado.

## D-008 — Três listas

Regras, Estado e Log.

**Status:** aprovado.

## D-009 — Recorrência inicial de 2 minutos

Equilíbrio entre rapidez e PPR.

**Status:** aprovado para piloto; deverá ser medido.

## D-010 — Estado contínuo

Usar `ESTADO DOS USUÁRIOS`, não `USUÁRIOS PROCESSADOS`.

**Status:** aprovado.

## D-011 — V1 não remove membros

Apenas adiciona.

**Status:** aprovado.

## D-012 — IDs como referência técnica

Ações usarão GroupID e EntraID.

**Status:** aprovado.

## D-013 — adminn como proprietário administrativo

`adminn@eduieda.onmicrosoft.com`

**Status:** aprovado.

## D-014 — Graph não utilizado na V1

Reservado para evolução.

**Status:** aprovado.

## D-015 — GitHub como livro do projeto

Decisões, testes e versões serão registrados no GitHub.

**Status:** aprovado.

## D-016 — GitHub sem segredos

Especialmente importante porque o repositório atual é público.

**Status:** obrigatório.

## D-017 — Modo auditoria antes de escrita

Nenhuma inclusão em massa antes de diagnóstico.

**Status:** obrigatório.

---

# 33. QUESTÕES A VALIDAR DURANTE A IMPLEMENTAÇÃO

Estas questões não bloqueiam o planejamento, mas precisam de resposta antes da V1 estável:

1. URL exata do site SharePoint Arquivo Digital.
2. GUID dos cinco grupos.
3. Quantidade atual de usuários do tenant.
4. Número de outros fluxos pertencentes à conta operacional.
5. PPR observado por ciclo.
6. Comportamento real do Search Users V2 na quantidade de usuários atual.
7. Disponibilidade de Dataverse/Soluções sem custo adicional no ambiente.
8. Melhor ação Standard para verificar associação com menor consumo.
9. Necessidade de conta dedicada de automação.
10. Política de retenção anual do log.
11. Se a equipe `TODOS OS MEMBROS` será mantida ou excluída por finalidade institucional.
12. Se contas técnicas deverão ser `IGNORADO` explicitamente.

---

# 34. EVOLUÇÕES POSSÍVEIS

Não implementar antes da V1 estável.

## V1.1 — Painel de auditoria

Criar visualização/página SharePoint:

- OK;
- Pendentes;
- Sem Regra;
- Erros;
- alterações recentes.

## V1.2 — Alerta administrativo

Notificar erros persistentes.

## V1.3 — Interface de manutenção

Formulário simples para regras.

## V2 — Sincronização estrita

Remover associação anterior somente quando comprovadamente gerenciada pela automação.

## V2.x — Graph Delta

Para ambientes maiores ou necessidade de near-real-time mais eficiente.

## V3 — Regras compostas

Exemplo:

`Cargo + Departamento + Unidade`

Somente se surgir necessidade real.

---

# 35. INDICADORES DE SAÚDE

Acompanhar:

- execuções/dia;
- PPR/dia;
- duração média;
- duração máxima;
- novos usuários/dia;
- alterações de Cargo/dia;
- erros/dia;
- SEM_REGRA;
- PENDENTE_CARGO;
- tempo entre criação e associação;
- retries;
- crescimento do log.

---

# 36. PROCEDIMENTO DE AUDITORIA

## Auditoria rápida

1. verificar status do fluxo;
2. verificar últimas execuções;
3. consultar Estado;
4. consultar Log;
5. verificar PPR.

## Auditoria de usuário

1. obter EntraID/UPN;
2. localizar Estado;
3. comparar Cargo atual;
4. localizar regra;
5. localizar logs;
6. verificar grupo;
7. identificar causa.

## Auditoria de versão

1. comparar documentação GitHub;
2. verificar export do fluxo;
3. conferir data de modificação;
4. conferir proprietário/conexões;
5. executar testes de regressão.

---

# 37. POLÍTICA DE ALTERAÇÕES FUTURAS

Toda modificação deve responder:

- qual problema resolve?
- qual versão-base?
- quais componentes altera?
- quais riscos cria?
- quais testes serão executados?
- como reverter?
- qual novo número de versão?

Mudanças que não atendam essas perguntas não devem ir diretamente para produção.

---

# 38. FONTES TÉCNICAS PRINCIPAIS

Documentação oficial Microsoft consultada durante o planejamento:

1. Office 365 Users connector  
   https://learn.microsoft.com/pt-br/connectors/office365users/

2. Office 365 Groups connector  
   https://learn.microsoft.com/en-us/connectors/office365groups/

3. Power Platform — Requests limits and allocations  
   https://learn.microsoft.com/en-us/power-platform/admin/api-request-limits-allocations

4. Power Automate — Limits and configuration  
   https://learn.microsoft.com/pt-br/power-automate/limits-and-config

5. SharePoint Online — List view threshold  
   https://learn.microsoft.com/en-us/troubleshoot/sharepoint/lists-and-libraries/items-exceeds-list-view-threshold

6. Export/import non-solution flows  
   https://learn.microsoft.com/pt-br/power-automate/export-import-flow-non-solution

7. Solution-aware flows  
   https://learn.microsoft.com/en-us/power-automate/overview-solution-flows

8. Export Power Automate solution  
   https://learn.microsoft.com/en-us/power-automate/export-flow-solution

> As regras de licenciamento e limites podem mudar. Antes de alterações arquiteturais relevantes, confirmar novamente a documentação oficial.

---

# 39. DEFINIÇÃO DO OBJETIVO FINAL

O projeto estará concluído quando o processo cotidiano puder ser resumido assim:

```text
Administrador abre o Microsoft 365 Admin Center
               │
               ▼
Escolhe o modelo/cadastra usuário
               │
               ▼
Cargo já vem definido ou é informado
               │
               ▼
Clica em criar
               │
               ▼
NÃO FAZ MAIS NADA
               │
               ▼
Power Automate detecta
               │
               ▼
Regra SharePoint identifica o grupo
               │
               ▼
Usuário entra automaticamente no grupo correto
               │
               ▼
Estado e auditoria são gravados
```

A solução deverá ser:

- rápida;
- previsível;
- auditável;
- sustentável;
- de baixo custo;
- administrável;
- recuperável;
- documentada;
- segura;
- preparada para evolução.

---

# 40. PRÓXIMO PASSO OFICIAL

Após a criação e registro deste documento:

## Próxima atividade

**FASE 0 — confirmar o site SharePoint Arquivo Digital e preparar as três listas.**

Ordem:

1. identificar o site;
2. revisar permissões;
3. criar lista Regras;
4. criar lista Estado;
5. criar lista Log;
6. inserir regras;
7. obter GroupIDs;
8. somente depois iniciar o Power Automate.

Não criar o fluxo antes de o modelo de dados estar definido.

---

# 41. REGISTRO DE MARCO — 18/08/2026

## Situação

Planejamento arquitetural consolidado.

## Decisões principais

- Power Automate Standard;
- recorrência inicial de 2 minutos;
- SharePoint Arquivo Digital;
- inclusão direta em grupos;
- regras externas;
- estado contínuo;
- log permanente;
- V1 add-only;
- `TODOS OS MEMBROS` fora da lógica;
- GitHub como registro do projeto;
- Graph reservado para futuro.

## Próximo marco

Criação e validação das listas SharePoint.

---

# 42. REGRA DE OURO DO PROJETO

**O cadastro do usuário deve continuar simples. A complexidade deve ficar na automação, mas a automação deve permanecer transparente, auditável e reversível.**

Qualquer evolução que torne o processo cotidiano mais dependente de passos manuais deve ser questionada antes de ser adotada.
