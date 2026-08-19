# VERSÃO ATUAL / BASELINE SEGURO

Data do baseline: 2026-08-19

## Produção

```text
Release: Produção 1.0
Motor: Power Automate
Modo: ADD-ONLY
Recorrência: 2 minutos
Reconciliação: 24 horas
Profundidade do fluxo: 6
Flow marker: V1-PRODUCAO-R2
Otimização: Buscar Regras somente com candidatos
Permissões técnicas: hardening concluído
Status: VALIDADO EM EXECUÇÃO REAL
```

## Critérios que definem este baseline

- usuário novo processado ponta a ponta;
- inclusão real em grupo;
- idempotência validada;
- Estado `OK`;
- Log real;
- execução sem candidato `0 / false`;
- reconciliação 24h validada;
- fluxo verde após permissões mínimas nas três listas;
- backups/rollback de mutações estruturais validados.

## Instalador multi-tenant

```text
Installer: 0.1
Status: bootstrap + discovery + plano + validação/deploy seguro de clientdata
```

Implementado:

- `CONFIG.example.psd1`;
- `INSTALAR.ps1`;
- preflight;
- descoberta Graph;
- plano local de deploy;
- validador de clientdata;
- export de Modern Flow;
- deploy com backup/rollback;
- módulos reutilizáveis de definição e Dataverse.

Pendente para uma próxima iteração, preferencialmente durante o segundo tenant:

- gerador automático de `clientdata` tenant-neutral;
- criação/validação automatizada do schema SharePoint;
- automação de Connection References/conexões conforme viabilidade;
- hardening de permissões por código somente depois de nova validação.

## Regra de mudança

Qualquer atualização futura deve partir deste baseline e ser tratada por diff/escopo.

Não refazer toda a solução por causa de uma alteração pequena.

Para mudança estrutural no fluxo:

```text
backup → alteração candidata → validação → deploy → smoke test → checkpoint
```

Se falhar, retornar a este baseline antes de tentar abordagem diferente.
