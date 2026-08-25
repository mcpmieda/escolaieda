# API de sincronização de notas

## Contratos

- HTTP/OpenAPI: `api/notas-sync-v1.openapi.yaml`;
- eventos/AsyncAPI: `api/notas-sync-events-v1.asyncapi.yaml`;
- contrato semântico: `specs/semantic-contract.json`.

## Governança

Modo `contract`: add-in, simulador, receptor e futuro banco são consumidores independentes. O OpenAPI é a fonte de verdade para comandos e snapshots; o AsyncAPI é a fonte de verdade para eventos.

## Regras essenciais

- `POST /v1/grade-events` exige `Idempotency-Key` e bearer token;
- repetição da mesma chave retorna a confirmação existente, sem novo efeito lógico;
- sequência antiga é aceita para auditoria com estado `stale`, mas não altera o snapshot;
- ausência não é zero;
- `grade.changed` não espera cálculo completo;
- `grade.recalculated` usa o mesmo `correlationId` e inclui os derivados estabilizados;
- exemplos dos contratos usam somente identificadores e valores fictícios.

## Adaptador atual

A POC usa listas SharePoint protegidas e Microsoft Graph como adaptador de persistência. O código cliente isola esse detalhe em `notas-integracao/js/sync-client.js`. Migrar para a API futura deve trocar o adaptador, não a semântica do evento nem o monitoramento do workbook.

## Compatibilidade

A versão `1` só admite adição compatível de campos opcionais. Remoção, mudança de tipo, alteração de significado ou transformação de campo opcional em obrigatório exige nova versão ou período de compatibilidade.
