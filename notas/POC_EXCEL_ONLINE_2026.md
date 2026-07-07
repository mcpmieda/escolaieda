# Prova de conceito online — Exportação de notas 2026

> Estado em 07/07/2026: preparação local corrigida e leitura online pela Microsoft Graph Workbook API comprovadas; leitura pelo conector Excel Online (Business) do Power Automate ainda pendente.

## Objetivo

Comprovar, antes de qualquer implantação em massa, se o Excel Online (Business) consegue listar e ler uma Tabela Excel `TB_EXPORT_NOTAS` dentro de uma agenda `.xlsb` copiada para ambiente controlado.

Esta POC não cria listas `NOTAS_*`, não cria fluxo definitivo, não altera as 18 agendas reais e não publica dados no GitHub.

## Preparar a cópia piloto

Usar o script:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\preparar-poc-export-notas-v1.ps1 `
  -SourcePath "CAMINHO_DA_AGENDA_XLSB" `
  -OutputDirectory "PASTA_ONEDRIVE_DE_TESTE" `
  -Force
```

O script:

- copia a agenda para uma pasta fora do repositório Git;
- adiciona a guia técnica `EXPORT_NOTAS_POC`;
- cria a tabela `TB_EXPORT_NOTAS` com 16 colunas;
- usa fórmulas para referenciar `CONFIGURAÇÃO` e `RELAÇÃO`;
- detecta a ordem real das colunas de nome/situação na guia `RELAÇÃO`;
- deixa a guia muito oculta por padrão;
- reabre o arquivo para validar tabela, linhas, colunas e proteção estrutural.

Não colocar a cópia piloto dentro do repositório. Ela contém dados reais da agenda. Sempre informar `-OutputDirectory`; se esse parâmetro for omitido, o script cria a pasta `_POC_NOTAS_EXPORT_2026` ao lado do arquivo de origem, o que pode gerar cópia de teste dentro da árvore operacional.

## Verificar leitura online por Graph

Usar o script:

```powershell
pwsh -ExecutionPolicy Bypass -File .\scripts\testar-poc-export-notas-online.ps1
```

O script usa PnP.PowerShell e Microsoft Graph para:

- conectar ao site `ARQUIVODIGITAL` com o aplicativo já usado pelo projeto;
- acessar o OneDrive institucional da Secretaria pelo identificador do usuário, não pelo OneDrive local ativo;
- localizar o arquivo técnico `POC_TB_EXPORT_NOTAS_CORRIGIDO_20260707.xlsb`;
- confirmar que `TB_EXPORT_NOTAS` existe;
- conferir endereço, linhas, colunas e cabeçalhos;
- imprimir apenas metadados e classes de campo, sem valores reais de aluno ou nota.

Esse teste comprova leitura online pela Microsoft Graph Workbook API. Ele não substitui a prova final pelo conector Excel Online (Business) do Power Automate.

## Teste manual no Power Automate

Criar um fluxo manual temporário, preferencialmente no ambiente padrão e com uma conta institucional autorizada.

## Execução local registrada

Em 07/07/2026, o script foi executado em uma agenda piloto menor, fora do repositório Git, na pasta OneDrive institucional `_POC_NOTAS_EXPORT_2026`.

Resultado local:

| Item | Resultado |
| --- | ---: |
| Atribuições detectadas | 3 |
| Linhas da `TB_EXPORT_NOTAS` | 138 |
| Colunas da `TB_EXPORT_NOTAS` | 16 |
| Reabertura no Excel Desktop | OK |
| Guia `EXPORT_NOTAS_POC` | muito oculta |
| Estrutura do workbook | protegida após salvar |
| Leitura online pela Graph Workbook API | OK |
| Leitura pelo Excel Online (Business) | pendente |

Nenhum dado da cópia piloto foi colocado no repositório.

Em 07/07/2026, a cópia corrigida foi enviada diretamente ao OneDrive da Secretaria por Graph com nome técnico genérico, porque a sincronização local do OneDrive apresentou atraso/bloqueio. Resultado online:

| Item | Resultado |
| --- | ---: |
| Arquivo online | `POC_TB_EXPORT_NOTAS_CORRIGIDO_20260707.xlsb` |
| Formato | `.xlsb` |
| Tamanho online | 829.218 bytes |
| `TB_EXPORT_NOTAS` encontrada | sim |
| Faixa lida | `EXPORT_NOTAS_POC!A1:P139` |
| Linhas de dados | 138 |
| Colunas | 16 |
| `AlunoNome` | presente e preenchido na primeira linha lida |
| `SituacaoMatricula` | presente; pode estar vazia quando não há ocorrência |

A sessão PnP estava autenticada como conta administrativa institucional e acessou o drive de `SECRETARIA@escolaieda.com` por Graph. Isso evita depender da seleção manual de conta no navegador, mas não cria fluxo Power Automate.

Etapas mínimas:

1. Selecionar manualmente o arquivo piloto por identificador, não por nome digitado.
2. Executar Excel Online (Business) — `Get tables`.
3. Confirmar se `TB_EXPORT_NOTAS` aparece.
4. Executar Excel Online (Business) — `List rows present in a table`.
5. Registrar quantidade de linhas, colunas retornadas, duração da ação e qualquer erro.
6. Abrir a cópia no Excel Online, alterar um valor de teste já existente e salvar.
7. Executar nova leitura manual e comparar se o valor calculado foi atualizado.
8. Repetir com o arquivo aberto simultaneamente no Excel Online.

## Resultado esperado

Para uma agenda com `N` atribuições:

```text
linhas esperadas = N × 46
colunas esperadas = 16
```

A POC deve ser considerada aprovada tecnicamente somente se:

- `Get tables` encontrar `TB_EXPORT_NOTAS`;
- `List rows present in a table` retornar as 16 colunas;
- a leitura não alterar fórmulas, histórico ou proteção do arquivo;
- o tempo real de leitura for aceitável no tenant;
- salvamentos consecutivos não exigirem retrabalho manual inseguro;
- erros de bloqueio, timeout ou formato forem documentados.

## Problemas comuns já resolvidos

### PnP pede Client ID

`Connect-PnPOnline -Interactive` sem `ClientId` falha nas versões atuais do PnP.PowerShell. Usar o `ClientId` e `TenantId` já documentados no projeto, com `-PersistLogin`.

### Login interativo cai na conta errada

O navegador pode reutilizar a sessão da conta administrativa. Para a POC, funcionou conectar como administrador e acessar o OneDrive da Secretaria por Graph:

```text
v1.0/users/SECRETARIA@escolaieda.com/drive
```

Não assumir que `/me/drive` aponta para o drive correto.

### OneDrive local aponta para outra conta

`$env:OneDrive` ou `$env:OneDriveCommercial` pode apontar para outra conta sincronizada. Confirmar a conta pelo Registro em:

```text
HKCU:\Software\Microsoft\OneDrive\Accounts\Business*
```

Na sessão de 07/07/2026, a pasta sem sufixo `(1)` era da Secretaria.

### Sincronização local ficou atrasada

A cópia local corrigida podia estar válida enquanto o Graph ainda lia a versão online anterior. Para a POC controlada, a solução foi enviar o arquivo corrigido diretamente pelo Graph para um novo nome técnico. Não confiar no tempo de sync local como evidência de disponibilidade online.

### Arquivo bloqueado pelo Excel online

Após leitura pela Workbook API, o item online retornou `resourceLocked` ao tentar sobrescrever. Caminhos seguros:

- aguardar o bloqueio expirar antes de sobrescrever;
- ou subir um novo item POC com nome técnico, mantendo o antigo apenas até limpeza posterior.

### Colunas de nome/situação estavam invertidas

A premissa inicial estava errada: nos 18 arquivos de 2026, a coluna par da guia `RELAÇÃO` contém nomes e a ímpar contém situação. O script foi corrigido para inferir a coluna de nome pela quantidade de células preenchidas, em vez de fixar par/ímpar.

### Excel COM pode ficar preso

Se um comando estourar timeout, verificar processos `EXCEL` sem janela e encerrar apenas os que foram criados pelo script. Não fechar janela visível do usuário.

### `UsedRange` pode falhar

Uma tentativa de usar `UsedRange` gerou erro COM `0x800A03EC`. Para inspeções simples da linha 2 da `CONFIGURAÇÃO`, preferir leitura controlada de colunas conhecidas ou retry COM.

### Não imprimir dados sensíveis

Os testes online devem retornar contagens, cabeçalhos e classes de campos. Não registrar nomes, notas ou amostras de linhas no Git.

## Se `.xlsb` falhar

Não converter as agendas reais.

Fallback controlado:

1. Criar uma cópia da mesma agenda piloto em `.xlsm`.
2. Adicionar `TB_EXPORT_NOTAS` nessa cópia.
3. Repetir `Get tables` e `List rows present in a table`.
4. Comparar comportamento, tamanho, fórmulas, abertura no Excel Online e abertura no Excel Desktop.
5. Só discutir conversão geral depois de aprovação explícita.

## Registro obrigatório

Depois da execução online, atualizar `AGENTS_NOTAS.md` com:

- data e conta/ambiente usado, sem registrar segredos;
- caminho lógico da pasta de teste, sem publicar dados dos alunos;
- formato testado (`.xlsb` ou `.xlsm`);
- quantidade de atribuições, linhas e colunas;
- resultado de `Get tables`;
- resultado de `List rows present in a table`;
- duração observada;
- erros e limitações;
- decisão: aprovado, aprovado com ressalvas, reprovado ou exige novo teste.

## Referências oficiais verificadas em 07/07/2026

- Excel Online (Business): limite de 25 MB por arquivo e possível bloqueio temporário após uso do conector.
- Microsoft Graph Workbook API: suporte documentado apenas para workbooks Office Open XML; não assumir `.xlsb` como estratégia Graph sem teste.
- SharePoint connector: gatilhos de arquivo criado/modificado existem, mas gatilhos de pasta legados têm limitações com subpastas.
