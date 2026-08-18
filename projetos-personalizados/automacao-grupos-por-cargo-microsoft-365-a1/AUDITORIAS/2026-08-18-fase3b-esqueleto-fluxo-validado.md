# Auditoria — Fase 3B Esqueleto do fluxo validado

**Data:** 18/08/2026  
**Projeto:** Automação de Inclusão de Usuários em Grupos por Cargo — Microsoft 365 Education A1

## Resultado

O fluxo `AUTO | Grupos por Cargo | Microsoft 365` foi criado no ambiente padrão do Power Platform e está habilitado.

Foram confirmadas conexões próprias do projeto, autenticadas com a conta administrativa estável definida para a automação:

- Office 365 Users;
- SharePoint Online.

As conexões existentes de outras contas institucionais permanecem no ambiente, mas não são a referência operacional escolhida para este fluxo.

## Estado do fluxo nesta fase

O esqueleto inicial contém:

- gatilho de recorrência;
- busca de usuários via Office 365 Users;
- leitura da lista `AUTOMAÇÃO - ESTADO DOS USUÁRIOS`;
- leitura da lista `AUTOMAÇÃO - REGRAS DE GRUPOS`.

Nesta etapa ainda não há escrita em grupos.

## Decisão de arquitetura para o próximo bloco

A detecção de usuários novos ou alterados deve evitar consultas SharePoint por usuário. O próximo desenho usará operações de dados em memória para comparar a coleção de usuários atuais com o estado armazenado e produzir somente candidatos.

A assinatura lógica mínima de comparação será baseada em:

- EntraID;
- Cargo normalizado;
- AccountEnabled;
- UserType.

`PENDENTE_CARGO` permanece estável enquanto o Cargo continuar vazio; quando o Cargo for preenchido, a assinatura muda e o usuário torna-se candidato.

`PENDENTE_GRUPO` e `ERRO` devem continuar elegíveis para nova tentativa controlada.

## Segurança e governança

- IDs de ambiente, FlowName e identificadores de conexões não foram registrados aqui porque o repositório atual é público.
- Nenhuma credencial ou token foi armazenado.
- A inclusão em grupos continua desabilitada até a validação da lógica de candidatos.
