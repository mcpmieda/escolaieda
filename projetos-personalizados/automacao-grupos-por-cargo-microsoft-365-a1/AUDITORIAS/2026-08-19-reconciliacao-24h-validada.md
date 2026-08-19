# Reconciliação 24h validada

Data: 2026-08-19

Checkpoint sanitizado da automação de grupos por Cargo.

## Resultado

- Reconciliação periódica de 24 horas validada em execução real.
- Um registro de teste foi envelhecido manualmente em `UltimaVerificacao` para mais de 24 horas.
- Na execução seguinte, o fluxo detectou o registro como candidato e reprocessou o usuário.
- O usuário já era membro do grupo gerenciado, portanto o fluxo confirmou a associação sem duplicação.
- O Estado permaneceu `OK` e `UltimaVerificacao` foi atualizada.
- Na execução subsequente, o fluxo voltou ao estado normal sem candidatos.
- Política `ADD-ONLY` preservada; nenhuma remoção automática de grupo foi introduzida.

## Cobertura confirmada

A reconciliação passa a cobrir, em até 24 horas, cenários como:

- associação gerenciada removida manualmente do grupo;
- regra criada ou alterada sem mudança no Cargo do usuário;
- estado antigo que precisa ser reavaliado;
- mudanças raras de propriedades verificadas durante o perfil completo.

Nenhum UPN, GUID, FlowRunID ou outro identificador interno foi registrado neste arquivo público.
