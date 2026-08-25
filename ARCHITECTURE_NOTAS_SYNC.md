# Arquitetura da POC de sincronização de notas

## Classificação

- nível: `critical-system` para a arquitetura alvo; a entrega atual é uma POC controlada e reversível;
- risco da mudança: `high` por envolver notas de estudantes, identidade, ordenação e persistência;
- fonte autoritativa durante a POC: agenda de Nina para o baseline; snapshot SharePoint somente para demonstrar transporte e recepção;
- API mode: `contract`;
- profundidade semântica: `domain`;
- Independent Verification: `adversarial`, limitada a alvos locais e recursos de POC autorizados;
- custo: `free-only`, usando GitHub Pages e Microsoft 365 já existentes.

## Resultado arquitetural

```text
Agenda Nina (somente leitura)
        │ geração + reconciliação
        ▼
Modelo limpo .xlsx ────── Add-in Office.js
        │                         │
        │                         ├─ grade.changed (sem esperar cálculo)
        │                         └─ grade.recalculated (segunda fase)
        │
Modelo web autenticado ───────────┘
                    │ Microsoft Graph delegado
                    ▼
     SharePoint de POC, permissões herdadas
       ├─ NOTAS_POC_MODELO_NINA (snapshot)
       └─ NOTAS_POC_EVENTOS (log append-only)
                    ▲
                    │ polling incremental de 1 s
                    │
          Receptor web autenticado
```

O GitHub Pages hospeda somente HTML, CSS, JavaScript e o manifesto do add-in. Dados reais não são enviados ao GitHub. O token delegado permanece no navegador e o SharePoint aplica a autorização efetiva.

## Por que há duas fases de evento

O teste local do legado comprovou que uma célula editada pode ser observada em cerca de 1,3 s, enquanto o estado de cálculo completo do workbook levou aproximadamente 10 s. Bloquear o primeiro envio até o cálculo terminar violaria o requisito de chegada imediata.

- `grade.changed`: prova que a edição aceita chegou ao banco/receptor.
- `grade.recalculated`: prova posterior dos campos derivados quando estabilizados.

Ambos compartilham `CorrelationId`; o segundo não substitui nem apaga a auditoria do primeiro.

## Fronteiras

### Modelo e add-in

`TB_LANCAMENTOS` é a única tabela monitorada. Colunas de identificação não são editáveis pelo fluxo normal. O add-in registra handlers `worksheet.onChanged`, lê a linha afetada, valida o campo, cria chave idempotente e envia em fila serial.

### Adaptador Microsoft 365 da POC

O adaptador usa Microsoft Graph diretamente porque o repositório atual é estático e o tenant já possui autenticação e SharePoint. Ele não é apresentado como a API definitiva. A fronteira futura está definida em `api/notas-sync-v1.openapi.yaml` e `api/notas-sync-events-v1.asyncapi.yaml`.

### Futuro banco

O futuro serviço deve validar token e escopo no servidor, aplicar idempotência e ordenação atomicamente, produzir stream/SSE e manter trilha de auditoria. O cliente não deve conhecer a tecnologia de persistência final.

## Dados e identidade

- chave do lançamento na POC: `AnoLetivo|TurmaCodigo|ComponenteCodigo|LinhaOrigem`;
- chave futura: substituir `LinhaOrigem` por `AlunoId` estável assim que a resolução de matrícula for aprovada;
- `AlunoNome` é apenas conferência humana, nunca identidade;
- vazio e zero são estados diferentes;
- valores reais só existem no workbook privado e nas listas autenticadas.

## Resiliência

- debounce máximo de 250 ms por célula;
- fila serial por origem;
- retry exponencial limitado para 429/5xx e rede offline;
- respeito a `Retry-After`;
- `IdempotencyKey` única no log;
- sequência monotônica por sessão/origem;
- fila local limitada, sem nomes/notas em logs de console;
- botão de pausar sincronização e kill switch por configuração.

## Limitações honestas da POC

- SharePoint não oferece a mesma garantia transacional de uma API própria para ordenação concorrente entre vários editores; a POC serializa cada origem e detecta obsolescência, enquanto o contrato futuro exige aplicação atômica no servidor.
- O add-in fica pronto e hospedado, mas sua distribuição central para todos os usuários depende de aprovação administrativa no Microsoft 365.
- A meta de até 3 s é uma meta medida, não promessa de SLA antes dos testes reais.

## Rollback

- páginas estáticas: reverter o commit;
- workbook: remover apenas a cópia técnica criada na pasta POC;
- SharePoint: script de remoção exige nomes/IDs exatos e confirmação explícita; nunca afeta listas sem prefixo `NOTAS_POC_`;
- teste de edição: restaurar o valor inicial e emitir evento de reversão correlacionado.
