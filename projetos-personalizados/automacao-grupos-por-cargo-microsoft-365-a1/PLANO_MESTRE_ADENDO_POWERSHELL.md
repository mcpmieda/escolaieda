# ADENDO AO PLANO MESTRE — ESTRATÉGIA POWERSHELL
## Automação de Inclusão de Usuários em Grupos por Cargo — Microsoft 365 Education A1

**Status:** aprovado para incorporação ao projeto  
**Data:** 18/08/2026  
**Relacionamento:** complemento formal do `PLANO_MESTRE.md`  
**Escopo:** uso de PowerShell para implantação, diagnóstico, auditoria, recuperação e administração — sem substituir o Power Automate como motor de produção.

> **Segurança:** nenhum script, exemplo, relatório ou arquivo deste diretório poderá conter senhas, tokens, client secrets, certificados privados, cookies, códigos MFA ou dados pessoais reais em massa. O repositório atual é público.

---

# 1. DECISÃO PRINCIPAL

O PowerShell será incorporado ao projeto como uma **camada administrativa e de auditoria**, e não como o componente que executa a automação cotidiana.

A arquitetura de produção permanece:

```text
MICROSOFT 365 ADMIN CENTER
        ↓
usuário criado/alterado
        ↓
POWER AUTOMATE
recorrência inicial: 2 min
        ↓
SHAREPOINT
regras + estado + log
        ↓
MICROSOFT 365 GROUPS
inclusão direta no grupo correto
```

A nova camada complementar será:

```text
ADMINISTRAÇÃO / AUDITORIA / RECUPERAÇÃO
                  ↓
          POWERSHELL TOOLKIT
                  ↓
     ┌────────────┼────────────┐
     ↓            ↓            ↓
Microsoft Graph  SharePoint   Power Platform
     ↓            ↓            ↓
usuários/grupos  listas       fluxos/governança
```

O PowerShell **não será requisito para cadastrar usuários** e não deverá exigir computador permanentemente ligado.

---

# 2. POR QUE INCORPORAR POWERSHELL

O Power Automate é adequado para o processo contínuo, mas tarefas de implantação, diagnóstico e auditoria podem exigir muitos cliques e verificações manuais.

PowerShell permitirá transformar essas tarefas em procedimentos reproduzíveis.

Objetivos:

- acelerar a implantação inicial;
- descobrir IDs reais dos grupos sem consulta manual;
- auditar Cargos em massa;
- auditar associações de grupo;
- comparar estado esperado e estado real;
- verificar listas SharePoint;
- verificar propriedades do fluxo e proprietários;
- produzir relatórios técnicos consistentes;
- executar diagnóstico sem alterar dados;
- facilitar recuperação e manutenção futura;
- reduzir dependência de conhecimento tácito.

---

# 3. O QUE POWERSHELL NÃO RESOLVE

PowerShell, sozinho, não torna a detecção do usuário automaticamente instantânea.

Trocar:

```text
Power Automate a cada 2 minutos
```

por:

```text
PowerShell a cada 2 minutos
```

não elimina a recorrência.

Para near-real-time orientado a evento seria necessária outra arquitetura, como Microsoft Graph Change Notifications/Webhooks e um endpoint permanentemente acessível. Isso aumenta significativamente a complexidade e poderá envolver infraestrutura/serviços adicionais.

**Decisão:** manter a V1 baseada em Power Automate com recorrência inicial de 2 minutos.

---

# 4. MÓDULOS / FERRAMENTAS PREVISTAS

## 4.1 Microsoft Graph PowerShell SDK

Uso prioritário para:

- listar usuários;
- obter `id`, `userPrincipalName`, `displayName`, `jobTitle`, `accountEnabled` e `userType`;
- listar grupos;
- descobrir GUIDs dos cinco grupos de destino;
- consultar membros;
- comparar associação real com associação esperada;
- executar testes administrativos controlados;
- produzir relatórios de auditoria.

O Graph PowerShell será a ferramenta preferencial para auditoria de usuários e grupos.

## 4.2 Exchange Online PowerShell

Uso complementar para Microsoft 365 Groups quando necessário.

Exemplos de uso administrativo:

- consultar membros de grupos Microsoft 365;
- inclusão em massa controlada durante correções ou baseline, se tecnicamente adequado;
- validação independente do Power Automate.

Não será o motor permanente da automação.

## 4.3 Microsoft Teams PowerShell

Uso para:

- diagnóstico de Teams;
- políticas;
- equipes;
- canais;
- validações específicas quando algum grupo possuir Team associado.

Já foi utilizado no diagnóstico da equipe `TODOS OS MEMBROS` por Azure Cloud Shell.

Não será usado como caminho principal de associação porque nem todos os destinos precisam ser tratados como Teams.

## 4.4 SharePoint Online / PnP PowerShell

Uso previsto para acelerar e reproduzir a preparação do site do Arquivo Digital:

- validar site;
- criar/verificar listas;
- criar/verificar colunas;
- criar/verificar índices;
- configurar visualizações técnicas;
- verificar permissões;
- validar schema esperado;
- produzir relatório de divergências.

Antes de automatizar criação/alteração de listas em produção, qualquer script deverá ser testado em modo leitura ou ambiente controlado.

## 4.5 Power Platform PowerShell

Módulos administrativos do Power Platform poderão ser usados para:

- inventariar fluxos;
- identificar fluxo do projeto;
- consultar estado administrativo;
- verificar proprietários;
- auxiliar auditorias de governança;
- gerar inventário técnico.

Esses módulos não substituem a interface de edição do Power Automate.

---

# 5. PRINCÍPIO DE OPERAÇÃO

O projeto passa a possuir dois planos distintos.

## Plano A — Produção

Responsável pela operação automática diária.

```text
Power Automate
+ SharePoint
+ Microsoft 365 Groups
```

Características:

- automático;
- nuvem;
- sem computador ligado;
- sem intervenção cotidiana;
- baseado em recursos Standard;
- recorrência inicial de 2 minutos.

## Plano B — Administração técnica

Responsável por implantação, auditoria e manutenção.

```text
PowerShell Toolkit
+ GitHub
```

Características:

- execução sob demanda;
- scripts versionados;
- preferencialmente leitura por padrão;
- alterações somente em scripts explicitamente classificados como escrita;
- relatórios sanitizados antes de commit.

---

# 6. ESTRUTURA DO TOOLKIT

Estrutura planejada:

```text
POWERSHELL/
├── README.md
├── 01-diagnostico-tenant.ps1
├── 02-auditar-cargos.ps1
├── 03-descobrir-grupos.ps1
├── 04-auditar-associacoes.ps1
├── 05-validar-sharepoint.ps1
├── 06-validar-power-automate.ps1
├── 07-relatorio-completo.ps1
└── lib/
    └── funções reutilizáveis futuras
```

Os scripts serão criados conforme necessidade e testados individualmente. A existência do nome no planejamento não significa que já estejam implementados.

---

# 7. ESPECIFICAÇÃO DOS SCRIPTS PLANEJADOS

## 7.1 `01-diagnostico-tenant.ps1`

### Objetivo

Gerar visão geral do ambiente necessário para o projeto.

### Deve verificar

- tenant acessível;
- contexto autenticado;
- quantidade aproximada de usuários;
- quantidade de usuários ativos/desabilitados;
- distribuição de `userType`;
- disponibilidade dos grupos-alvo;
- módulos necessários;
- erros de autorização.

### Regra

Somente leitura.

---

## 7.2 `02-auditar-cargos.ps1`

### Objetivo

Auditar o atributo `jobTitle` em toda a população relevante.

### Saída esperada

Resumo semelhante a:

```text
Total de usuários: 684
Ativos: 679
Desabilitados: 5

CARGOS RECONHECIDOS
aluno: ...
professor: ...
equipe de apoio: ...
visitante: ...
diretor: ...
auxiliar de secretaria: ...
secretaria: ...
coordenador pedagógico: ...

PENDÊNCIAS
cargo vazio: ...
cargo sem regra: ...
```

### Deve detectar

- Cargo vazio;
- espaços extras;
- caixa diferente;
- Cargos desconhecidos;
- variações que não devem ser inferidas automaticamente.

### Regra

Somente leitura.

---

## 7.3 `03-descobrir-grupos.ps1`

### Objetivo

Localizar os cinco grupos de destino e seus GUIDs.

### Grupos esperados

- `ALUNOS`
- `EQUIPE DE APOIO`
- `PROFESSORES`
- `VISITANTE`
- `GRUPO DA SECRETARIA - ARQUIVO DIGITAL`

### Deve retornar

- nome;
- ID;
- tipo;
- se existe;
- se há duplicidade de nome;
- informação necessária para preencher `GrupoID` no SharePoint.

### Regra

Não selecionar silenciosamente um grupo se houver dois objetos com nome semelhante. Gerar erro de ambiguidade.

---

## 7.4 `04-auditar-associacoes.ps1`

### Objetivo

Comparar regra esperada por Cargo com associação real.

### Classificações

- `CORRETO`;
- `AUSENTE`;
- `JA_MEMBRO`;
- `SEM_REGRA`;
- `CARGO_VAZIO`;
- `DESABILITADO`;
- `DIVERGENTE`;
- `ERRO`.

### Primeira versão

Somente leitura.

Uma futura ferramenta de correção deverá ser outro script separado, nunca um parâmetro escondido no script de auditoria.

---

## 7.5 `05-validar-sharepoint.ps1`

### Objetivo

Comparar o SharePoint real com o schema definido no Plano Mestre.

### Deve validar

- site Arquivo Digital;
- existência das três listas;
- nomes das colunas;
- tipos;
- obrigatoriedade;
- índices;
- unicidade do EntraID;
- registros iniciais de regras;
- permissões relevantes;
- divergências.

### Saída

Relatório de conformidade, sem alterar automaticamente por padrão.

---

## 7.6 `06-validar-power-automate.ps1`

### Objetivo

Auxiliar governança do fluxo.

### Deve procurar

- fluxo esperado;
- nome;
- estado administrativo;
- proprietário(s), quando disponível;
- ambiente;
- dados administrativos expostos pelo módulo;
- divergências relevantes.

### Nome esperado do fluxo

`AUTO | Grupos por Cargo | Microsoft 365`

---

## 7.7 `07-relatorio-completo.ps1`

### Objetivo

Orquestrar auditorias somente de leitura e consolidar resultado.

### Exemplo de saída

```text
AUTOMAÇÃO GRUPOS POR CARGO
Auditoria: AAAA-MM-DD HH:mm

USUÁRIOS
...

CARGOS
...

GRUPOS
...

ASSOCIAÇÕES
...

SHAREPOINT
...

POWER AUTOMATE
...

RESULTADO
OK / ATENÇÃO / CRÍTICO
```

O relatório destinado ao GitHub deverá ser sanitizado.

---

# 8. POLÍTICA DE SEGURANÇA DOS SCRIPTS

## 8.1 Proibido

- segredo em texto puro;
- senha hardcoded;
- client secret;
- token;
- certificado privado;
- login persistido no repositório;
- exportação de usuários reais para o GitHub;
- CSV contendo dados pessoais reais em repositório público.

## 8.2 Autenticação

Scripts deverão solicitar autenticação no momento da execução ou usar mecanismo administrativo aprovado e documentado.

Nunca implementar mecanismo de conveniência que resulte em credencial persistida no GitHub.

## 8.3 Leitura e escrita separadas

Scripts de auditoria devem ser leitura.

Scripts capazes de alterar produção deverão:

- ter nome explícito;
- documentar impacto;
- exigir confirmação quando apropriado;
- suportar modo de simulação quando tecnicamente possível;
- registrar o que será alterado;
- ser testados antes da execução ampla.

---

# 9. PAPEL DO AZURE CLOUD SHELL

O Azure Cloud Shell pode ser utilizado para diagnósticos administrativos sem instalação local, como já ocorreu com Teams PowerShell.

Vantagens:

- ambiente temporário;
- sem necessidade de configurar o computador do usuário;
- adequado para comandos pontuais.

Limitação:

- arquivos e alterações locais da sessão são efêmeros;
- não é repositório do projeto;
- scripts permanentes continuam versionados no GitHub.

Fluxo recomendado:

```text
GitHub → script versionado
        ↓
Cloud Shell / ambiente PowerShell autorizado
        ↓
execução
        ↓
resultado sanitizado
        ↓
GitHub → auditoria/documentação
```

---

# 10. USO DURANTE A IMPLANTAÇÃO

A incorporação do PowerShell altera a estratégia de execução das fases iniciais.

## Fase 0

PowerShell poderá acelerar:

- inventário do tenant;
- contagem de usuários;
- auditoria de Cargos;
- descoberta dos GUIDs dos grupos.

## Fase 1 — SharePoint

PowerShell poderá:

- validar o site;
- auxiliar criação do schema;
- verificar se as três listas estão conformes.

Qualquer criação automática deverá ser precedida por validação e backup/configuração conhecida.

## Fase 2 — Power Automate

PowerShell poderá:

- verificar existência do fluxo;
- conferir proprietário;
- produzir inventário administrativo.

A lógica do fluxo continuará sendo montada no Power Automate.

## Fase 3 — Baseline

PowerShell será especialmente útil para:

- produzir relatório de Cargos;
- conferir grupos;
- identificar associações ausentes;
- comparar dados antes da ativação de escrita.

---

# 11. USO EM AUDITORIAS FUTURAS

Uma auditoria completa deverá ser capaz de responder:

1. O fluxo existe e está ativo?
2. Quem é proprietário?
3. As listas SharePoint existem e estão com schema correto?
4. Os cinco grupos ainda existem?
5. Os GUIDs configurados continuam válidos?
6. Existem regras duplicadas?
7. Existem usuários sem Cargo?
8. Existem Cargos sem regra?
9. Usuários reconhecidos estão no grupo esperado?
10. Existem erros persistentes no Estado/Log?
11. O projeto documentado corresponde ao ambiente real?

O PowerShell Toolkit deverá reduzir essa auditoria de uma investigação manual para um procedimento padronizado.

---

# 12. RAPIDEZ DA AUTOMAÇÃO DE PRODUÇÃO

A incorporação do PowerShell **não altera a recorrência aprovada da V1**.

Configuração permanece:

```text
Power Automate
Recorrência: 2 minutos
```

Motivo:

- equilíbrio entre latência e consumo de solicitações;
- operação sem infraestrutura adicional;
- simplicidade;
- manutenção por usuário comum.

Após a V1 estável, o tempo real entre criação e associação deverá ser medido.

Somente dados reais justificarão redução para 1 minuto ou migração arquitetural.

---

# 13. ROTA FUTURA PARA QUASE TEMPO REAL

Se futuramente a meta de 2 minutos deixar de ser aceitável, deverá ser aberto estudo separado sobre:

- Microsoft Graph Change Notifications;
- webhook;
- Azure Function ou endpoint equivalente;
- autenticação por aplicação/certificado;
- custo real;
- segurança;
- disponibilidade;
- logs;
- retry;
- dead-letter/reprocessamento;
- manutenção por longo prazo.

Essa rota não pertence ao escopo V1.

---

# 14. GOVERNANÇA NO GITHUB

O diretório `POWERSHELL/` passa a ser parte oficial do projeto.

Regras:

1. cada script deve possuir cabeçalho com objetivo, versão e modo leitura/escrita;
2. mudanças devem ser registradas no `CHANGELOG.md`;
3. scripts de escrita exigem revisão maior que scripts de leitura;
4. relatório real com dados pessoais não deve ser commitado;
5. exemplos devem usar dados fictícios;
6. uma versão estável dos scripts deve acompanhar os pontos seguros do projeto;
7. auditorias devem registrar a versão do toolkit utilizada.

---

# 15. NOVAS DECISÕES FORMAIS

## D-018 — PowerShell incorporado como camada administrativa

**Decisão:** PowerShell fará parte oficial do projeto para implantação, auditoria, diagnóstico e recuperação.

**Status:** aprovado.

## D-019 — PowerShell não substitui Power Automate

**Decisão:** motor de produção continua sendo Power Automate.

**Status:** aprovado.

## D-020 — Microsoft Graph PowerShell como ferramenta principal de auditoria de diretório

**Decisão:** priorizar Graph PowerShell para usuários, Cargos, grupos e associações.

**Status:** aprovado.

## D-021 — Scripts de auditoria são somente leitura

**Decisão:** separar leitura de correção para reduzir risco.

**Status:** obrigatório.

## D-022 — GitHub versionará o toolkit

**Decisão:** scripts, documentação e versões do toolkit serão armazenados no diretório do projeto.

**Status:** aprovado.

## D-023 — Cloud Shell é ambiente de execução, não armazenamento

**Decisão:** Azure Cloud Shell pode ser usado pontualmente, mas a fonte oficial dos scripts permanece GitHub.

**Status:** aprovado.

## D-024 — Velocidade de produção permanece 2 minutos na V1

**Decisão:** PowerShell não será usado para tentar contornar a recorrência sem arquitetura orientada a eventos.

**Status:** aprovado.

---

# 16. IMPACTO NO PRÓXIMO PASSO

Antes de criar as listas SharePoint, a Fase 0 passa a incluir uma auditoria PowerShell de leitura.

Nova ordem recomendada:

1. criar a estrutura documental do toolkit no GitHub;
2. preparar `01-diagnostico-tenant.ps1`;
3. preparar `02-auditar-cargos.ps1`;
4. preparar `03-descobrir-grupos.ps1`;
5. executar em modo leitura;
6. registrar somente resultados sanitizados;
7. confirmar URL/site Arquivo Digital;
8. criar/validar listas SharePoint;
9. preencher regras com GUIDs confirmados;
10. iniciar montagem do Power Automate.

Isso reduz trabalho manual e aumenta a confiabilidade do baseline.

---

# 17. CRITÉRIO DE CONCLUSÃO DESTA INCORPORAÇÃO

A estratégia PowerShell estará completamente incorporada quando:

- o diretório `POWERSHELL/` existir no GitHub;
- o README do toolkit estiver documentado;
- os primeiros três scripts de leitura estiverem implementados e testados;
- os GUIDs dos grupos tiverem sido obtidos de forma auditável;
- a auditoria de Cargos tiver sido executada;
- o resultado sanitizado tiver sido registrado;
- o fluxo de produção continuar independente dos scripts.

---

# 18. REGRA DE OURO DA CAMADA POWERSHELL

**PowerShell deve tornar administração e auditoria mais rápidas e reproduzíveis, sem transformar a operação diária em um processo técnico ou dependente de scripts.**
