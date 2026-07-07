# Análise técnica das planilhas de notas — 2026

> Data da análise: 06/07/2026  
> Escopo: banco central de teste, relação anual e 18 planilhas de professores.  
> Método: leitura local somente, por Excel COM, com macros, eventos e atualização automática de links desativados.  
> Privacidade: este relatório não contém nomes, notas ou identificadores reais de estudantes e professores.

## 1. Resultado executivo

O sistema atual é uma aplicação construída dentro do Excel, não apenas uma planilha de consolidação. Ele combina vínculos externos, milhares de nomes definidos, macros VBA, fórmulas, objetos gráficos e guias de impressão para produzir:

- painel estatístico por turma e trimestre;
- balanço por componente;
- aproveitamento escolar;
- boletins;
- ficha individual;
- conselho de classe;
- relatório de resultado final;
- ata de resultados;
- classificação e indicadores gerais.

O banco central não precisa ser reproduzido célula por célula no novo sistema. A informação essencial pode ser representada por registros normalizados no SharePoint, com cálculos testáveis e telas web próprias.

A estratégia viável é manter as planilhas dos professores e acrescentar uma tabela técnica `TB_EXPORT_NOTAS`, alimentada por fórmulas, para que o Power Automate leia somente dados consolidados. Isso foi comprovado localmente em uma cópia temporária. A compatibilidade online do conector com `.xlsb` ainda precisa ser comprovada no tenant antes de qualquer alteração em massa.

## 2. Arquivos analisados

### 2.1 Banco central

- Arquivo de trabalho analisado: `BANCO DE NOTAS 2026 TESTE.xlsb`.
- Formato: Excel Binary Workbook, com VBA.
- Tamanho aproximado: 2,9 MB.
- Existe também uma versão operacional no OneDrive; os hashes e tamanhos são diferentes, portanto o arquivo de teste não deve ser tratado como cópia binária idêntica da versão online.
- Nenhum dos dois arquivos foi alterado.

### 2.2 Planilhas dos professores

- Localização atual: OneDrive institucional da Secretaria, na árvore `PEDAGÓGICO/CONTROLE DE NOTAS/CONTROLE DE NOTAS 2026`.
- Quantidade: 18 arquivos `.xlsb`.
- Volume total aproximado: 30,6 MB.
- Tamanho por arquivo: aproximadamente 0,8 MB a 2,4 MB.
- Todos usam a mesma família de modelo e o mesmo conjunto básico de macros.

### 2.3 Relação anual

- Arquivo: `RELAÇÃO 2026.xlsb`.
- Função: cadastro/matrícula, composição das turmas e alimentação das agendas dos professores.
- Possui uma base interna estruturada com dados cadastrais, incluindo INEP e CPF.
- O vínculo exportado atualmente para as agendas e para o banco não inclui esses códigos estáveis.

## 3. Banco central: estrutura confirmada

### 3.1 Indicadores gerais

| Item | Quantidade observada |
| --- | ---: |
| Guias | 10 |
| Nomes definidos | 2.057 |
| Vínculos externos | 19 |
| Componentes VBA | 26 |
| Linhas VBA aproximadas | 5.688 |
| Fórmulas em `VINCULO NOTAS` | 77.760 |
| Fórmulas em `RELAÇÃO` | 13.303 |
| Fórmulas em `BASE DE CONTROLE` | 5.218 |
| Fórmulas em `CONSELHO` | 7.046 |
| Fórmulas principais somadas | 103.327 |
| Tabelas Excel | 0 |
| Conexões de dados do workbook | 0 |

### 3.2 Guias

| Guia | Função |
| --- | --- |
| `INICIO` | painel estatístico e navegação |
| `APROVEITAMENTO` | matriz por aluno e componente |
| `CONFIGURAÇÕES` | turmas, componentes, limites e comandos |
| `BOLETIM` | geração e impressão de boletins |
| `FICHA ALUNO` | ficha individual completa |
| `CONSELHO` | consulta e decisões do conselho de classe |
| `RELAÇÃO` | consolidação oculta da relação anual |
| `ATA RESULTADOS` | ata final por turma |
| `BASE DE CONTROLE` | cálculo e classificação de resultados |
| `VINCULO NOTAS` | matriz oculta de vínculos com os arquivos de professores |

As telas visíveis usam grande quantidade de formas, imagens vinculadas e gráficos. `BOLETIM`, por exemplo, possui mais de duzentos objetos e 138 gráficos. Esse modelo é visualmente rico, mas dificulta manutenção, acessibilidade, uso em celular e desempenho.

### 3.3 Vínculos externos

O banco possui:

- um vínculo para a relação anual;
- 18 vínculos para os arquivos dos professores.

Os caminhos apontam para o OneDrive for Business da Secretaria. Os dados são buscados diretamente na guia oculta `CONFIGURAÇÃO` de cada agenda.

Não existe Power Query nem uma tabela de importação. A integração é feita por fórmulas externas célula a célula.

### 3.4 Capacidade configurada

O modelo reserva:

- 22 posições possíveis de turma;
- 15 turmas ativas em 2026;
- 46 posições de estudante por turma;
- 12 componentes curriculares;
- 9 campos consolidados por combinação turma/componente.

Componentes observados:

| Código | Componente |
| --- | --- |
| `P` | Língua Portuguesa |
| `M` | Matemática |
| `C` | Ciências |
| `G` | Geografia |
| `H` | História |
| `A` | Artes |
| `RL` | Religião |
| `F` | Educação Física |
| `I` | Inglês |
| `RD` | Redação |
| `ET` | Ética |
| `CPT` | Computação |

O cálculo que explica a largura de `VINCULO NOTAS` é:

```text
15 turmas × 12 componentes × 9 campos = 1.620 colunas de dados
```

### 3.5 Campos consolidados atuais

Para uma combinação como turma `T1` e componente `G`, os códigos seguem o padrão:

| Código | Significado |
| --- | --- |
| `T1G1` | nota do I trimestre |
| `T1G2` | nota do II trimestre |
| `T1G3` | nota do III trimestre |
| `T1GT` | total anual antes da recuperação |
| `T1G1REC` | recuperação do I trimestre |
| `T1G2REC` | recuperação do II trimestre |
| `T1G3REC` | recuperação do III trimestre |
| `T1GTREC` | total após recuperação |
| `T1GNF` | nota final |

O padrão se repete para turma e componente.

## 4. Regras pedagógicas confirmadas

### 4.1 Pontuação por trimestre

| Etapa | Mínimo | Máximo |
| --- | ---: | ---: |
| I trimestre | 18 | 30 |
| II trimestre | 18 | 30 |
| III trimestre | 24 | 40 |
| Total anual | 60 | 100 |

### 4.2 Resultado final observado

O banco trabalha com estados como:

- `EM CURSO`;
- `APROVADO DIRETO`;
- `APROVADO PELA RECUPERAÇÃO`;
- `APROVADO PELO CONSELHO`;
- `REPROVADO`;
- `REPROVADO POR NÃO COMPARECER`;
- `APROVADO POR LEI`;
- `ASSISTIDO`.

A fórmula atual, resumida, aplica esta ordem:

1. se existe decisão de conselho, classifica como aprovado pelo conselho;
2. senão, se as notas após recuperação atingem 60 em todos os componentes aplicáveis, aprova pela recuperação;
3. senão, se as notas finais atingem 60 em todos os componentes aplicáveis, aprova direto;
4. caso contrário, reprova;
5. situações especiais e assistidas podem substituir o resultado comum;
6. antes da data de encerramento, resultados ainda são apresentados como `EM CURSO`.

O novo sistema não deve copiar a fórmula como uma string. A regra deverá ser implementada como função testável, versionada por ano letivo e validada com casos reais.

## 5. Planilhas dos professores: estrutura confirmada

### 5.1 Modelo comum

Todas as planilhas seguem esta composição:

```text
CONFIGURAÇÃO        guia oculta de dados e consolidação
INICIO              painel e navegação
<turma>VG           visão geral da turma/componente
<turma>1º           I trimestre
<turma>2º           II trimestre
<turma>3º           III trimestre
<turma>REC          recuperação
RELAÇÃO             situação e nomes por turma
```

Para cada atribuição de turma/componente são criadas cinco guias. Assim:

```text
quantidade de guias = 3 + (5 × quantidade de atribuições)
```

Os 18 arquivos somam exatamente 180 atribuições:

```text
15 turmas × 12 componentes = 180 atribuições
```

Isso demonstra que o conjunto cobre integralmente a matriz de 2026.

### 5.2 Variação por professor

- menor arquivo: 3 atribuições e 18 guias;
- maior arquivo: 15 atribuições e 78 guias;
- existem casos em que uma mesma turma aparece duas vezes no arquivo por componentes diferentes, identificados internamente por sufixos auxiliares;
- a variação não representa modelos incompatíveis, apenas diferentes cargas de trabalho.

### 5.3 Macros

O código VBA comum tem aproximadamente 333 linhas e 16 procedimentos. As macros cuidam principalmente de:

- tela cheia e aparência do Excel;
- proteção/desproteção;
- seleção e exclusão de guias do modelo;
- atualização do vínculo com a relação anual;
- renomeação das guias conforme a carga atribuída.

As macros não devem ser usadas pela automação online. Power Automate não executa VBA. A exportação precisa depender de valores/fórmulas que já estejam salvos no arquivo.

### 5.4 Vínculos de cada agenda

Uma agenda completa possui normalmente quatro vínculos:

- relação anual;
- notas do simulado do I trimestre;
- notas do simulado do II trimestre;
- notas do simulado do III trimestre.

Esses vínculos permanecem responsabilidade da planilha do professor enquanto ela continuar sendo a interface de lançamento.

### 5.5 Ausência de tabela de exportação

Nenhum dos 18 arquivos possui `ListObject`/Tabela Excel.

Os dados consolidados estão em uma matriz oculta na guia `CONFIGURAÇÃO`, cuja área chega a `A1:JX130`. A linha 2 contém códigos como `T1G1`, `T1G2`, `T1G3`, `T1GT`, recuperações e nota final. As linhas seguintes contêm os valores por posição do estudante.

Essa faixa é suficiente para provar que a informação existe de forma consolidada, mas não é um contrato adequado para Power Automate porque:

- é extremamente larga;
- possui colunas inutilizadas e marcadores repetidos;
- não é uma Tabela Excel;
- usa posição e nome, sem um identificador estável do aluno;
- muda conforme a atribuição do professor;
- depende de convenções internas difíceis de validar.

## 6. Relação anual e identidade do estudante

### 6.1 Estrutura relevante

A relação possui:

- 34 guias;
- 22 posições de turma;
- guias específicas por turma;
- uma base interna de alunos;
- uma guia oculta de vínculo com 1.013 linhas;
- campos de matrícula, relatórios e quadro geral.

### 6.2 Identificadores existentes

A base interna contém, entre outros:

- nome;
- repetição;
- INEP;
- nascimento;
- sexo;
- CPF;
- filiação;
- contatos;
- etapa e turno;
- situação anterior;
- necessidades e observações.

Entretanto, o vínculo consumido pelas agendas leva principalmente nome e situação por turma. A consolidação de notas usa `XLOOKUP` pelo nome do estudante. Isso é frágil em casos de homônimos, correções de grafia, mudança de posição ou transferência.

### 6.3 Decisão recomendada

Criar um `AlunoId` interno e imutável em `NOTAS_ALUNOS`.

- INEP pode ser uma chave externa importante quando preenchido.
- CPF não deve ser chave primária e não deve ser copiado para as listas de notas.
- Nome nunca deve ser a única identidade.
- Durante a transição, o fluxo poderá usar `TurmaCodigo + LinhaOrigem + AlunoNome` apenas para localizar o vínculo e deverá rejeitar divergências, não adivinhar.

## 7. Contrato de exportação proposto

### 7.1 Forma

Adicionar a cada agenda uma guia técnica muito oculta contendo uma Tabela Excel chamada `TB_EXPORT_NOTAS`.

Cada linha representa:

```text
uma posição de estudante + uma turma + um componente
```

Isso reduz a complexidade de centenas de colunas para 16 colunas estáveis.

### 7.2 Colunas da versão 1

| Coluna | Tipo | Origem |
| --- | --- | --- |
| `ContratoVersao` | texto | constante `1` |
| `AnoLetivo` | texto/número | configuração anual |
| `TurmaCodigo` | texto | `T1`, `T2` etc. |
| `ComponenteCodigo` | texto | `P`, `M`, `G` etc. |
| `LinhaOrigem` | número | posição 1–46 |
| `AlunoNome` | texto | relação vinculada |
| `SituacaoMatricula` | texto | relação vinculada |
| `NotaT1` | decimal | matriz atual |
| `NotaT2` | decimal | matriz atual |
| `NotaT3` | decimal | matriz atual |
| `Total` | decimal | matriz atual |
| `RecT1` | decimal | matriz atual |
| `RecT2` | decimal | matriz atual |
| `RecT3` | decimal | matriz atual |
| `TotalRec` | decimal | matriz atual |
| `NotaFinal` | decimal | matriz atual |

O vínculo do arquivo com professor, e-mail e componentes deverá ficar em `NOTAS_VINCULOS_PLANILHAS`, não repetido em todas as linhas.

`AlunoId` será acrescentado ao registro normalizado após a resolução contra `NOTAS_MATRICULAS`. Quando o modelo de origem passar a disponibilizar um identificador estável, o contrato poderá evoluir para a versão 2.

### 7.3 Quantidade esperada

Por arquivo:

```text
linhas = quantidade de atribuições × 46
```

Exemplos:

- 3 atribuições: 138 linhas;
- 15 atribuições: 690 linhas.

No conjunto completo:

```text
180 atribuições × 46 = 8.280 linhas máximas por sincronização completa
```

Linhas sem aluno devem ser descartadas pelo fluxo, mas mantidas na tabela para preservar estrutura fixa e fórmulas simples.

## 8. Prova de conceito local executada

Uma cópia temporária de uma agenda com 15 atribuições foi usada.

Procedimento:

1. cópia criada na pasta temporária do Windows;
2. macros e eventos desabilitados;
3. proteção estrutural removida somente na cópia;
4. atribuições detectadas pelos códigos existentes;
5. guia `EXPORT_NOTAS_POC` criada;
6. 690 linhas e 16 colunas preenchidas com fórmulas para as estruturas existentes;
7. tabela `TB_EXPORT_NOTAS` criada;
8. guia marcada como muito oculta;
9. proteção estrutural reaplicada;
10. arquivo salvo, fechado e reaberto;
11. tabela, colunas, linhas, visibilidade e proteção conferidas;
12. cópia temporária removida.

Resultado:

```text
Assignments: 15
Rows: 690
Columns: 16
Table: TB_EXPORT_NOTAS
Sheet: VeryHidden
Workbook structure: protected
Reopen: successful
Original files changed: 0
```

Isso comprova a adaptação do modelo no Excel Desktop. Não comprova ainda a leitura pelo serviço online.

## 9. Risco crítico: `.xlsb` no serviço online

A documentação do Excel Online (Business) declara suporte a Excel Binary Workbook, embora apresente a extensão como `*.xlxb`. A documentação do Microsoft Graph Workbook API afirma suporte somente a formatos Office Open XML, o que não inclui o formato binário `.xlsb` de forma inequívoca.

Consequências:

- não usar diretamente o Graph Workbook API como estratégia principal para `.xlsb` sem teste;
- testar o conector Excel Online (Business) com identificador de arquivo e `TB_EXPORT_NOTAS`;
- confirmar `Get tables` e `List rows present in a table`;
- não modificar as 18 agendas antes dessa confirmação.

Fallback controlado se `.xlsb` não funcionar:

1. criar uma cópia `.xlsm` de uma agenda piloto, preservando VBA;
2. informar o arquivo por ID no conector;
3. verificar fórmulas, objetos e abertura no Excel Online/Desktop;
4. comparar tamanho e comportamento;
5. somente discutir conversão geral após aprovação do piloto.

A Microsoft documenta que macros VBA não executam no Power Automate. Isso não impede o piloto, pois a automação deverá somente ler a tabela de exportação.

## 10. Fluxo online recomendado para o piloto

### Gatilho

OneDrive for Business — arquivo criado ou modificado na pasta de notas 2026.

### Filtro

- arquivo vinculado em `NOTAS_VINCULOS_PLANILHAS`;
- extensão aprovada;
- ignorar arquivos temporários `~$`;
- ignorar a mesma versão já processada.

### Leitura

1. obter metadados e identificador do arquivo;
2. obter as tabelas;
3. confirmar `TB_EXPORT_NOTAS` e `ContratoVersao`;
4. listar linhas com paginação;
5. descartar linhas sem estudante;
6. resolver matrícula e `AlunoId`;
7. validar intervalos e duplicidades;
8. fazer upsert na lista de lançamentos;
9. registrar importação e inconsistências.

### Regra de segurança

O fluxo lê a agenda. Não deve escrever na planilha do professor. A Microsoft não recomenda modificações simultâneas por usuário e conector no mesmo arquivo.

## 11. Ajuste do modelo SharePoint após a análise

O modelo inicial pode ser simplificado.

Listas essenciais para o primeiro piloto:

| Lista | Uso |
| --- | --- |
| `NOTAS_CONFIGURACOES` | contrato e ano ativo |
| `NOTAS_ALUNOS` | `AlunoId` e dados mínimos |
| `NOTAS_MATRICULAS` | aluno, turma, ano e posição de origem |
| `NOTAS_VINCULOS_PLANILHAS` | arquivo e atribuições esperadas |
| `NOTAS_LANCAMENTOS` | notas normalizadas |
| `NOTAS_IMPORTACOES` | fila e resultado |
| `NOTAS_INCONSISTENCIAS` | erros que exigem decisão |
| `NOTAS_AUDITORIA` | ações administrativas |

Turmas e componentes podem ser listas próprias ou registros de configuração na primeira prova. A decisão deve considerar volume, consultas e manutenção anual.

### Chave de lançamento proposta

```text
AnoLetivoId|TurmaId|ComponenteId|AlunoId
```

Como cada registro consolidado contém todos os trimestres e recuperações, não é necessário criar nove itens separados por aluno/componente. A nota de cada etapa pode ser uma coluna do item de lançamento.

## 12. Validações obrigatórias do piloto online

1. `Get tables` encontra `TB_EXPORT_NOTAS` em guia muito oculta.
2. `List rows present in a table` retorna as 16 colunas.
3. Valores calculados estão atualizados após salvar no Excel Online.
4. Arquivo aberto por professor e leitura pelo fluxo não gera conflito.
5. Leitura não altera fórmulas, histórico ou versão de forma indevida.
6. Dois salvamentos rápidos não duplicam itens.
7. O gatilho ocorre em tempo aceitável e o tempo real é medido.
8. Linhas vazias são ignoradas.
9. Nome divergente da matrícula gera inconsistência.
10. Nota fora de 0–30, 0–40 ou 0–100, conforme o campo, é rejeitada.
11. Nota apagada não vira zero silenciosamente.
12. Transferência não apaga histórico.
13. Arquivo sem tabela ou contrato errado não atualiza produção.
14. Erro 429/504 é repetido com espera controlada.
15. A execução usa somente conectores padrão compatíveis com A1.

## 13. Decisões ainda necessárias

- valor vazio significa nota não lançada ou zero?
- a recuperação substitui a nota do trimestre, soma ou usa outra regra?
- `Total`, `TotalRec` e `NotaFinal` serão confiados à planilha ou recalculados e comparados pelo sistema?
- qual situação exata remove um componente da contagem do aluno?
- como registrar aprovação por lei, assistido e conselho sem perder o resultado calculado?
- quem pode reprocessar e corrigir inconsistências?
- por quanto tempo manter versões e auditoria?

Essas decisões não impedem o teste técnico de leitura, mas impedem declarar o banco web como fonte oficial.

## 14. Próxima ação correta

Criar uma cópia controlada de uma agenda em uma pasta de testes online, acrescentar `TB_EXPORT_NOTAS`, salvar como `.xlsb` e executar manualmente:

1. Excel Online (Business) — `Get tables`;
2. Excel Online (Business) — `List rows present in a table`;
3. registro do tempo e dos valores agregados;
4. alteração de uma nota fictícia/controle na cópia;
5. nova leitura e comparação da versão;
6. teste concorrente com o arquivo aberto no Excel Online.

Nenhuma lista de produção, fluxo definitivo ou alteração dos 18 arquivos deve ocorrer antes desse resultado.

## 15. Referências oficiais específicas

- [Excel Online (Business) — ações, formatos e limitações](https://learn.microsoft.com/en-us/connectors/excelonlinebusiness/)
- [Trabalhar com Excel no Microsoft Graph](https://learn.microsoft.com/en-us/graph/api/resources/excel?view=graph-rest-1.0)
- [Arquivos com macros no Power Automate](https://learn.microsoft.com/en-us/office/dev/scripts/develop/macros-power-automate)
- [Conector SharePoint e gatilhos](https://learn.microsoft.com/en-us/sharepoint/dev/business-apps/power-automate/sharepoint-connector-actions-triggers)
