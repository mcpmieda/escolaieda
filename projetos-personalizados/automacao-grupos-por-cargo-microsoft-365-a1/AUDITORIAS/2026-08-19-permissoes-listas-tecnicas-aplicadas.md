# Permissões das listas técnicas aplicadas

Data: 2026-08-19

## Estado final aplicado

As três listas técnicas usam permissões exclusivas.

- AUTOMAÇÃO - REGRAS DE GRUPOS
  - conta técnica do fluxo: Leitura
  - Proprietários do site: Controle Total
  - grupo Membros: removido
  - grupo Visitantes: removido

- AUTOMAÇÃO - ESTADO DOS USUÁRIOS
  - conta técnica do fluxo: Colaboração
  - Proprietários do site: Controle Total
  - grupo Membros: removido
  - grupo Visitantes: removido

- AUTOMAÇÃO - LOG DE GRUPOS
  - conta técnica do fluxo: Colaboração
  - Proprietários do site: Controle Total
  - grupo Membros: removido
  - grupo Visitantes: removido

## Validação

A lista de REGRAS foi restringida primeiro e o fluxo permaneceu verde.

Depois ESTADO e LOG foram restringidas e uma nova execução automática também permaneceu verde.

Conclusão: o princípio de menor privilégio foi aplicado às três listas sem quebrar leitura, criação ou atualização necessária ao fluxo.

Nenhum UPN, GUID interno, ID de grupo ou outro identificador sensível foi registrado neste arquivo.
