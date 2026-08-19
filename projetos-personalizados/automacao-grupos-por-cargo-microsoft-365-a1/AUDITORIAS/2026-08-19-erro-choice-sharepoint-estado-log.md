# Auditoria — erro de schema SharePoint na Fase 4D

Data: 2026-08-19

Resultado observado ao tentar adicionar Estado + Log ao fluxo:

- O fluxo foi desativado temporariamente antes da alteração.
- O PATCH do clientdata foi rejeitado com `InvalidOpenApiFlow` / `OpenApiOperationParameterValidationFailed`.
- A validação falhou em `10A_Registrar_Log`, no campo `item/Resultado`.
- O conector esperava um objeto para a coluna Choice, mas a definição enviava a string `SUCESSO`.
- A alteração não foi aplicada ao fluxo.
- A rotina de recuperação manteve o fluxo ativo.

Conclusão técnica:

As colunas SharePoint do tipo Choice usadas em escrita devem ser enviadas no formato de objeto compatível com o schema do conector (por exemplo, objeto com `Value`), assim como já foi observado na leitura de `Status.Value`.

Próximo passo:

Corrigir no bloco 10 todos os campos Choice relevantes (`Resultado`, `Operacao` e `Status`) antes de reaplicar a Fase 4D.
