# Auditoria — extração `clientdata` validada

**Data:** 18/08/2026  
**Projeto:** Automação de Inclusão de Usuários em Grupos por Cargo — Microsoft 365 Education A1

## Resultado

A migração do fluxo para Solution-aware foi concluída anteriormente e a extração da definição do fluxo via Dataverse foi validada.

Constatações:

- o registro é um Modern Flow (`category = 5`);
- o fluxo permanece ativado;
- `clientdata` não está comprimido;
- a definição contém as referências de conexão já existentes para Office 365 Users e SharePoint;
- a definição contém o gatilho de recorrência de 2 minutos e as ações já construídas até `07_Ha_Candidatos`;
- o ramo verdadeiro de `07_Ha_Candidatos` ainda está vazio, confirmando o checkpoint correto para inserção automatizada da próxima lógica;
- nenhuma escrita em grupos foi realizada nesta etapa.

## Próximo passo

Aplicar por código, via Dataverse Web API, um bloco de auditoria dentro de `07_Ha_Candidatos` que:

1. percorra somente os candidatos;
2. obtenha o perfil V2 de cada candidato com a conexão Office 365 Users já existente;
3. valide `Member` + conta habilitada;
4. localize exatamente uma regra ativa de Cargo no conjunto de regras já carregado;
5. produza resultado de auditoria `ADICIONAR|<grupo>` ou `IGNORAR` sem alterar associações de grupo.

Somente depois de validar os resultados desse bloco será adicionada a ação real de associação a grupos.

## Segurança

Este registro público omite IDs internos de tenant, fluxo, listas, conexões e usuários. Os arquivos `clientdata` brutos não devem ser commitados no repositório público.
