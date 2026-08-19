# Auditoria de permissões das listas técnicas — 2026-08-19

As três listas técnicas do projeto estavam com a mesma configuração de permissões e herdando do site pai:

- AUTOMACAO - REGRAS DE GRUPOS
- AUTOMACAO - ESTADO DOS USUARIOS
- AUTOMACAO - LOG DE GRUPOS

Permissões herdadas observadas:
- Proprietários do site: Controle Total
- Membros do site: Editar
- Visitantes do site: Leitura

Conclusão: para listas técnicas da automação, o escopo herdado é mais amplo do que o necessário. Próxima etapa aprovada: aplicar permissões exclusivas por lista, preservando Proprietários e concedendo à conta de execução do fluxo o menor privilégio necessário antes de remover Membros e Visitantes.

Política proposta:
- REGRAS DE GRUPOS: conta de execução com Leitura.
- ESTADO DOS USUÁRIOS: conta de execução com Contribuir.
- LOG DE GRUPOS: conta de execução com Contribuir.
- Proprietários do site permanecem com Controle Total.
- Membros e Visitantes deixam de ter acesso às três listas técnicas.

Não registrar neste repositório UPNs, IDs internos, GUIDs ou outros identificadores sensíveis.
