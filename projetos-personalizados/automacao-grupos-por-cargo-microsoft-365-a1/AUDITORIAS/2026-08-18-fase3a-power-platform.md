# Auditoria — Fase 3A Power Platform

**Data:** 18/08/2026  
**Projeto:** Automação de Inclusão de Usuários em Grupos por Cargo — Microsoft 365 Education A1

## Resultado

O inventário administrativo do Power Platform foi concluído em modo somente leitura.

### Ambiente

- Existe um único ambiente padrão relevante para o projeto.
- Região observada: South America.
- Tipo: Default.

### Fluxos

- Nenhum fluxo existente foi encontrado no ambiente padrão.
- O fluxo `AUTO | Grupos por Cargo | Microsoft 365` ainda não existe.
- Não há risco de sobrescrever uma automação anterior com esse nome.

### Conexões

Foram encontradas 17 conexões existentes no ambiente. Entre as relevantes para o projeto, havia conexões do Office 365 Users e SharePoint Online, porém vinculadas a outras contas institucionais já existentes.

**Decisão:** não reutilizar essas conexões no fluxo novo. O projeto deve criar conexões próprias usando a conta administrativa estável definida para a automação, evitando dependência operacional de contas de terceiros ou de uso cotidiano.

### Observação sobre PowerShell

Os módulos oficiais do Power Platform foram executados em Windows PowerShell 5.1, com `ExecutionPolicy` temporariamente ajustada apenas no escopo `Process`. Nenhuma política permanente do computador foi alterada.

## Próxima etapa

1. criar o fluxo `AUTO | Grupos por Cargo | Microsoft 365` no ambiente padrão;
2. criar conexões próprias do projeto para Office 365 Users, SharePoint Online e Office 365 Groups usando a conta administrativa estável;
3. configurar inicialmente o fluxo em modo auditoria, sem adicionar membros;
4. apontar o SharePoint para as listas já criadas;
5. testar leitura de usuários, regras e estado;
6. somente depois habilitar a ação de inclusão em grupo.

## Segurança

Este registro foi sanitizado para o repositório público. IDs de ambiente, ConnectionName, Tenant ID, GUIDs e outros identificadores internos foram omitidos.
