# Auditoria — Fase 3C Detecção de candidatos validada

**Data:** 18/08/2026  
**Projeto:** Automação de Inclusão de Usuários em Grupos por Cargo — Microsoft 365 Education A1

## Resultado

A lógica de detecção de candidatos foi corrigida e validada no Power Automate.

O erro anterior tinha duas causas principais:

1. `Search for users (V2)` usa propriedades como `Id`, `JobTitle` e `AccountEnabled`, não os nomes Graph em minúsculas inicialmente usados na expressão.
2. A coluna SharePoint `Status` é retornada como referência expandida, devendo ser lida por `Status.Value`.

Após as correções, a contagem de candidatos passou a refletir o baseline esperado: 2 usuários.

Os dois candidatos conhecidos no baseline são um usuário com Cargo `professor` e um com Cargo `coordenador pedagógico`, ambos classificados como `PENDENTE_GRUPO`.

## Arquitetura validada

A assinatura recorrente de baixo custo considera:

- EntraID;
- Cargo normalizado;
- AccountEnabled.

Registros com status `PENDENTE_GRUPO` ou `ERRO` recebem assinatura especial `retry|<EntraID>` para permanecerem elegíveis a nova tentativa.

Nenhum grupo foi alterado nesta fase.

## Próxima etapa

Construir o processamento do ramo `Se sim` para os candidatos, ainda inicialmente em modo auditoria:

- obter perfil completo do candidato e confirmar `userType`;
- localizar exatamente uma regra ativa para o Cargo;
- interpretar `Acao` (`ADICIONAR` ou `IGNORAR`);
- preparar verificação de associação ao grupo;
- registrar resultado sem escrever em grupos até o teste lógico final;
- depois habilitar `Add member to group` de forma idempotente.
