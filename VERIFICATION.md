# Verificação da POC de sincronização de notas

Data da execução: 25/08/2026. Escopo: recursos isolados `NOTAS_POC_*`, cópia privada do workbook e páginas autenticadas. Nenhum teste alterou arquivos originais ou listas operacionais.

## Modelo real

- origem Nina aberta com macros, eventos e atualização de vínculos desabilitados;
- 690 posições estruturais, 376 linhas ativas e 3.384 valores numéricos ativos;
- zero divergência entre origem e `Modelo_Notas_Nina_2026_POC.xlsx`;
- `Total`, `TotalRec` e `NotaFinal` reconciliados conforme o legado;
- arquivo reaberto como `.xlsx`, sem VBA e sem vínculos externos;
- SHA-256: `AF0CB1C895388134B03919910BFDFB79770257D8B763C470365EC581107D3132`.

## Chegada real

Execução segura de `scripts/testar-chegada-notas-poc.ps1`, com alteração temporária de uma nota, eventos correlacionados e restauração:

| Fase | Chegada e aplicação |
| --- | ---: |
| `grade.changed` | 1.927 ms |
| `grade.recalculated` | 1.335 ms |
| reversão | 1.280 ms |

Correlação: `d555133a-01ea-4cc0-af98-c23adaa338cf`. A duplicata foi recusada e o snapshot terminou com o valor inicial restaurado. Valores e identidade da linha não foram impressos.

Depois da publicação, o mesmo fluxo foi exercitado no navegador autenticado pelo Link 1, com o Link 2 aberto antes da edição:

| Ação no Link 1 | `grade.changed` no Link 2 | `grade.recalculated` no Link 2 |
| --- | ---: | ---: |
| alteração temporária | 1.565 ms | 4.394 ms |
| restauração do original | 1.513 ms | 2.406 ms |

Os quatro eventos ficaram `applied`. A interface voltou a mostrar o valor original e o estado `Recalculado` em 2.555 ms após a restauração. A meta de até 3 segundos para `grade.changed` passou nas duas direções. O p95 agregado das quatro fases foi 4.394 ms porque inclui o recálculo posterior, que deliberadamente não bloqueia a chegada imediata.

## Reconciliacao

- consulta Graph equivalente à usada pelo navegador: 391 snapshots, dos quais 376 ativos; paginação íntegra;
- log da POC: oito eventos após o teste terminal e o teste autenticado no navegador;
- teste final: duplicata lógica zero, snapshot restaurado e divergência zero na chave exercitada;
- auditoria de privacidade final: 369 nomes reais comparados com 196 arquivos de texto, zero ocorrência no worktree e nenhum nome impresso.

## Gates executados

- `npm ci`: lockfile reproduzível, zero dependência e zero vulnerabilidade;
- `npm test`: regressão do módulo existente e 15 testes da integração aprovados;
- `npm run test:visual`: modelo e receptor, 1440×900 e 390×844, sem overflow, sem erro de runtime e sem conteúdo protegido antes do login;
- OpenAPI: Redocly `1.34.3`, válido sem aviso;
- AsyncAPI: AsyncAPI CLI `6.0.2`, documento 3.1.0 válido;
- Office add-in: `office-addin-manifest 2.1.6`, manifesto válido para Excel Web, Windows e Mac;
- oito arquivos JavaScript: sintaxe válida;
- `git diff --check`: sem erro.

## Publicacao

- commit publicado: `f175f55b8d2e5f0c2002a572bea0cded01bbc4c1`;
- GitHub Pages concluiu o build com estado `built`;
- modelo, receptor, manifesto, OpenAPI e AsyncAPI responderam por HTTPS com status 200;
- o modelo autenticado carregou exatamente 376 linhas protegidas;
- o receptor autenticado iniciou sem contabilizar os quatro eventos anteriores nas métricas e recebeu quatro novos eventos sem recarregar;
- o workbook está privado no OneDrive institucional e possui somente link organizacional.

## Limites da prova

O adaptador Graph/SharePoint comprovou transporte, persistência, ordenação, idempotência e reversão. Ele não fornece ainda a atomicidade da API definitiva para editores concorrentes. O add-in teve contrato, manifesto e lógica validados; distribuição central no tenant continua uma etapa administrativa futura.
