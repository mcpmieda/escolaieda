# Toolkit PowerShell — Automação de Grupos por Cargo

Este diretório armazenará scripts administrativos do projeto.

## Objetivo

Acelerar e padronizar:

- diagnóstico do tenant;
- auditoria de Cargos (`jobTitle`);
- descoberta dos grupos e GUIDs;
- auditoria de associações;
- validação das listas SharePoint;
- governança do Power Automate;
- geração de relatórios técnicos.

O toolkit **não é o motor de produção**. A inclusão automática cotidiana continuará no Power Automate.

## Princípios

1. **Leitura antes de escrita.**
2. Scripts de auditoria não alteram produção.
3. Scripts de correção, se futuramente necessários, serão arquivos separados.
4. Nunca armazenar segredos no código.
5. Não commitar relatórios contendo dados pessoais reais em massa.
6. Scripts devem ter versão e propósito claros.
7. Preferir resultados determinísticos e reproduzíveis.
8. Ambiguidade deve gerar aviso/erro, não escolha automática silenciosa.

## Scripts planejados

### `01-diagnostico-tenant.ps1`
Somente leitura. Inventário básico do ambiente, usuários, estado de autenticação e pré-requisitos.

### `02-auditar-cargos.ps1`
Somente leitura. Distribuição de Cargos, Cargo vazio, variações e valores sem regra.

### `03-descobrir-grupos.ps1`
Somente leitura. Localiza os cinco grupos oficiais e seus GUIDs, detectando ambiguidades.

### `04-auditar-associacoes.ps1`
Somente leitura. Compara Cargo esperado e associação real.

### `05-validar-sharepoint.ps1`
Inicialmente leitura. Compara site/listas/colunas/índices/permissões com o schema do projeto.

### `06-validar-power-automate.ps1`
Somente leitura. Inventário administrativo do fluxo, ambiente e proprietários quando expostos pelos módulos.

### `07-relatorio-completo.ps1`
Somente leitura. Consolida as auditorias anteriores em relatório técnico.

## Estrutura futura

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
```

Os arquivos `.ps1` serão criados somente quando forem implementados e testados. Não serão criados placeholders que possam ser confundidos com scripts funcionais.

## Módulos previstos

- Microsoft Graph PowerShell SDK;
- SharePoint Online Management Shell e/ou PnP PowerShell conforme necessidade validada;
- Microsoft.PowerApps.Administration.PowerShell / Power Platform PowerShell;
- MicrosoftTeams para diagnósticos específicos;
- Exchange Online PowerShell para operações específicas de Microsoft 365 Groups quando necessário.

## Ambientes de execução

Pode ser utilizado:

- Azure Cloud Shell para comandos pontuais;
- PowerShell 7 em máquina administrativa;
- outro ambiente autorizado.

A fonte oficial dos scripts será sempre este diretório no GitHub.

## Segurança

Nunca colocar neste diretório:

- senha;
- token;
- client secret;
- certificado privado;
- cookie;
- código MFA;
- arquivo de credencial;
- dump completo de usuários reais;
- CSV real de alunos/servidores em repositório público.

## Ordem oficial de implementação

1. `01-diagnostico-tenant.ps1`
2. `02-auditar-cargos.ps1`
3. `03-descobrir-grupos.ps1`
4. executar e validar os três em modo leitura;
5. registrar resultados sanitizados;
6. somente depois avançar para automações de SharePoint e auditorias mais amplas.
