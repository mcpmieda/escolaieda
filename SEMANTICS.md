# Semântica da sincronização de notas

- **Edição antes de cálculo:** `grade.changed` comprova transporte da entrada aceita; não afirma que os derivados já terminaram de calcular.
- **Recálculo correlacionado:** `grade.recalculated` carrega `Total`, `TotalRec` e `NotaFinal` estáveis usando o mesmo `correlationId`.
- **Ausente não é zero:** célula vazia continua `null`; o número `0` continua nota explícita.
- **Evento não é snapshot:** o log é imutável e auditável; o snapshot é a projeção vigente sujeita a ordenação.
- **Duplicata não é nova edição:** a mesma `IdempotencyKey` com o mesmo conteúdo confirma o evento original.
- **Nome não é identidade:** durante a POC a chave transitória usa posição de origem; a produção exige `AlunoId` estável.
- **POC Graph não é API final:** SharePoint/Graph implementam o adaptador de teste; OpenAPI/AsyncAPI definem a fronteira futura.
- **Imediato é mensurável:** fila do cliente em até 300 ms e chegada alvo em até 3 s sob condição normal; resultados observados serão reportados, não presumidos.

O modelo de domínio completo e sua rastreabilidade estão em `specs/semantic-assurance.json`.
