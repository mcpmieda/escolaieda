# POC de integração imediata de notas

Esta área hospeda somente a aplicação estática e o manifesto do add-in. Nomes e notas reais são carregados após autenticação Microsoft diretamente das listas isoladas da POC no site `ARQUIVODIGITAL`; nenhum dado real é incorporado ao GitHub Pages.

## Links publicados

- modelo simulado: `https://escolaieda.com/notas-integracao/modelo/`;
- receptor ao vivo: `https://escolaieda.com/notas-integracao/receptor/`;
- central de modelos: `https://escolaieda.com/notas-integracao/central/`;
- add-in: `https://escolaieda.com/notas-integracao/addin/manifest.xml`;
- contrato OpenAPI: `https://escolaieda.com/api/notas-sync-v1.openapi.yaml`;
- contrato OpenAPI de modelos/importação: `https://escolaieda.com/api/modelos-professor-v1.openapi.yaml`;
- contrato AsyncAPI: `https://escolaieda.com/api/notas-sync-events-v1.asyncapi.yaml`.

O workbook de Nina é privado e seu link organizacional deve ser entregue fora do repositório.

## Recursos da POC

- modelo: `NOTAS_POC_MODELO_NINA` (`6b2c0f42-2e05-4df7-aa45-bd2e458776c4`);
- eventos: `NOTAS_POC_EVENTOS` (`a824f962-6cce-4e53-9755-88e541f60fbb`);
- permissões: herdadas do site existente, sem compartilhamento anônimo;
- rollback: `scripts/provisionar-poc-sync-notas.ps1 -Remove -ConfirmRemoval REMOVER-NOTAS-POC`.

## Fluxo

1. A edição válida sofre debounce de 250 ms.
2. `grade.changed` é enviado sem esperar recálculo.
3. `grade.recalculated` segue com o mesmo `CorrelationId`.
4. O receptor consulta o log a cada segundo e mede somente eventos posteriores à sua abertura.
5. `IdempotencyKey` evita efeito duplicado e `Sequence` impede regressão silenciosa.

## Instalação futura do add-in

O manifesto é válido para Excel na Web, Windows e Mac. Para homologação, carregar `notas-integracao/addin/manifest.xml` como add-in personalizado. Para implantação institucional, publicar o mesmo manifesto em **Aplicativos integrados** no Centro de Administração do Microsoft 365 e atribuir primeiro a um grupo piloto. O add-in requer `TB_LANCAMENTOS` na guia `LANCAMENTOS` e permissão delegada efetiva no SharePoint.

## Validação

```powershell
node scripts/testes-notas-integracao.mjs
node scripts/auditoria-visual-notas-integracao.mjs
npx --yes @redocly/cli@1.34.3 lint api/notas-sync-v1.openapi.yaml
npx --yes @asyncapi/cli@6.0.2 validate api/notas-sync-events-v1.asyncapi.yaml
npx --yes office-addin-manifest@2.1.6 validate notas-integracao/addin/manifest.xml
```

O adaptador Graph/SharePoint comprova transporte e recepção; ele não é a API definitiva. A fronteira futura está em `API_NOTAS_SYNC.md` e nos contratos em `api/`.
