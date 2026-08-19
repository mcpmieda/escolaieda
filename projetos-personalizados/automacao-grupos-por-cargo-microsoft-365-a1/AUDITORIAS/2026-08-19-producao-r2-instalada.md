# Checkpoint — Produção R2 instalada

Data: 2026-08-19

## Resultado

A versão de produção R2 do fluxo `AUTO | Grupos por Cargo | Microsoft 365` foi aplicada com sucesso.

Validações confirmadas:

- Produção R2 instalada: sim.
- Bloco piloto removido: sim.
- Profundidade local: 6.
- Profundidade no servidor: 6.
- Inclusão em grupos ativa: sim.
- Remoção automática de grupos: não.
- Fluxo permanece ativo: sim.
- Backup pré-produção R2 criado localmente antes da alteração.

## Arquitetura desta versão

O roteamento foi achatado para respeitar o limite estrutural do Power Automate. O fluxo calcula a decisão e utiliza um Switch de produção, evitando o excesso de aninhamento da tentativa anterior.

A política V1 continua add-only: membros podem ser adicionados aos grupos previstos pelas regras, mas não são removidos automaticamente.

## Próxima validação

Acompanhar as primeiras execuções em produção e confirmar os tratamentos de estados não-OK (por exemplo, PENDENTE_CARGO, SEM_REGRA e novos usuários), além de validar que usuários com regra ADICIONAR seguem o ciclo de verificação de associação, inclusão quando necessária, Log e atualização de Estado.

Nenhum identificador interno, dado pessoal ou segredo foi registrado neste arquivo público.
