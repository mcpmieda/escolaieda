# Smoke test — Produção R2

Data: 2026-08-19

Resultado confirmado após implantação da Produção R2:
- `06_Quantidade_Candidatos = 0`
- `07_Ha_Candidatos = false`
- execução sem candidatos pendentes no momento do teste

Conclusão:
- o fluxo de produção permaneceu estável após a migração do bloco piloto para a estrutura R2;
- nenhum usuário foi processado indevidamente no smoke test;
- próximo teste recomendado: criar um usuário de teste novo com Cargo que possua regra ativa e validar o ciclo ponta a ponta (detecção, criação/atualização de Estado, regra, grupo, Log e Status OK).

Observação: a política V1 continua add-only, sem remoções automáticas de grupos.
