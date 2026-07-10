# AGENTS_NOTAS — Sistema de Gestão de Notas

> Documento operacional e fonte de verdade para pessoas e inteligências artificiais que trabalharem neste módulo.
>
> Última atualização: 10/07/2026
>
> Estado: fase 1/3 — arquivos reais analisados, contrato de exportação proposto, POC Graph confirmada e SPA `/notas/` em modo demonstração. Em 07/07/2026, após comando salvo no Bloco de Notas, a fase visual foi remodelada para conter somente `Movimento`, `Notas` e `Boletim`, com menu lateral compacto, seletor de temas, busca global preparada, gráfico estatístico por disciplina, tabela de notas sem rolagem horizontal em desktop e boletim com quatro emissões por A4 em quatro faixas horizontais de largura total. Em 08/07/2026, a antiga aba `Movimento` passou a ser tratada como `Estatísticas` e foi refinada contra o `anexo 7.png`, com captura desktop 1420×941 e captura mobile 390×844; a navegação lateral compacta e o cabeçalho superior comum foram reativados nessa view após o responsável apontar que fazem parte do corpo geral do projeto. Em seguida, `Estatísticas` deixou de usar números estáticos e passou a calcular cartões, gráfico, donut, ranking top 3/top 10, `TODAS AS TURMAS` e `VISÃO GERAL` com base nos dados fictícios do recorte selecionado. Na finalização de 08/07/2026, a aba foi ajustada para linguagem de soma/pontuação/mínimo, ranking por somatório, rodapé com horário atual, donut sem rotação do percentual, barras com transição lenta de cor, remoção da lista nominal genérica de alunos abaixo do mínimo, seletor customizado com rolagem, temas claro/mono mais abrangentes e impressão própria de relatório estatístico. Na etapa `aqui2.txt`, a aba recebeu acabamento final de usabilidade: indicadores visuais sem função removidos, busca global com painel próprio e fechamento ao clicar fora, perfil com fechamento externo e pontos de tema visíveis, ranking top 10 expandindo dentro da própria caixa com rolagem moderna e avatares fictícios, cartões `NOTAS AZUIS`/`NOTAS VERMELHAS`/`MÉDIA DA TURMA`, donut com maior profundidade visual, barras com movimento de cor mais perceptível e relatório contextual de notas vermelhas ao clicar em uma disciplina. Na etapa `aqui3.txt`, o brilho do donut e dos pontos de legenda foi suavizado, o centro do donut foi limpo, as barras e o anel do donut passaram a alternar tons lentamente, os seletores de turma/período ganharam ícones, os cards de dashboard receberam ícones mais explícitos e nomes mais legíveis, o ranking top 10 preserva a área dos três primeiros ao expandir e o gráfico passou a escalar pelo maior valor real do recorte. Após `aqui4.txt`, a aba `Notas` avançou para a ficha principal: seletores e impressão no mesmo padrão de `Estatísticas`, filtro compacto dentro da tabela, remoção da área externa de filtros/cards fora do novo prompt, tabela com colunas `Nº`, `Status`, `Aluno`, disciplinas e `Resultado`, pílulas arredondadas para status/resultado/notas, hover horizontal e vertical, insights laterais sem recolhimento e dados fictícios com nomes completos, notas de três trimestres, recuperação e resultados `APROVADO DIRETO`, `APROVADO APÓS RECUPERAÇÃO`, `APROVADO PELO CONSELHO`, `REPROVADO PELO CONSELHO` e `REPROVADO`. Após `aqui5.txt`, `Notas` foi revisada para remover o resumo/dashboard da ficha, mover o filtro para a linha de anotações da tabela, padronizar os seletores com `Estatísticas`, manter 35 alunos fictícios por turma, reforçar o modal opaco de hover do aluno, aproximar os insights do `anexo 10.png` e remover a view ativa fixa do HTML para evitar o carregamento visual do botão de impressão da aba errada antes do roteamento. Após `aqui6.txt`, `Estatísticas` reservou respiro superior no gráfico para os rótulos das barras não invadirem o cabeçalho, travou a altura dos itens do ranking ao alternar top 3/top 10 e reforçou o relevo 3D sutil do donut; `Notas` compactou a tabela, manteve status em uma linha, escureceu o modal do aluno, restringiu destaque de coluna às notas e estreitou/limpou os insights removendo a nota numérica lateral. Após os prints de 09/07/2026, `Notas` removeu a duplicidade `Ficha de notas`, retirou a regra demonstrativa da linha da ficha, redesenhou o popover de filtros e a prévia de aluno com camadas opacas/legíveis, suavizou o destaque cruzado da tabela e reduziu mais a altura das linhas. Na revisão seguinte, o filtro da tabela ficou em grade compacta de duas colunas no desktop, a aba `Notas` passou a ter variáveis próprias para os temas claro/mono e a tabela deixou de animar linhas e chips de nota individualmente para eliminar atraso percebido na rolagem. Em 10/07/2026, os seletores Turma/Período da aba `Notas` foram conferidos contra `Estatísticas` e passaram a usar menus opacos próprios, mantendo as mesmas dimensões de cards, botões e listagens nos viewports testados. Após `aqui7.txt`, `Estatísticas` deixou de existir como aba separada e foi incorporada abaixo da ficha de `Notas` em `.notesStatsSection`; os hashes legados `#estatisticas` e `#movimento` agora abrem `/notas/#notas`. Os seletores de `Notas` comandam tabela, insights, cards, ranking, gráfico, donut e painel contextual; `TODAS AS TURMAS` mantém a análise geral, mas a grade de notas exibe aviso para escolher turma individual e os insights laterais não exibem contadores de alunos em atenção ou disciplinas. Foram adicionadas recuperações por trimestre, nomes de alunos em caixa alta, hover de aluno somente com foto maior, painel lateral mais opaco com fechamento externo e remoção de termos de demonstração da superfície principal. Leitura pelo conector Excel Online (Business), integração Graph real da tela e provisionamento das listas `NOTAS_*` seguem pendentes; nenhuma lista, biblioteca, fluxo definitivo, permissão ou recurso Microsoft 365 foi criado.
>
> Baseline do repositório no início desta fase: commit `899f1a915a126d94507ca0e4e39030458bf19206`, branch `main`.

## 1. Leitura obrigatória antes de trabalhar

1. Leia este arquivo integralmente.
2. Leia o `AGENTS.md` e o `README.md` da raiz.
3. Leia `ANALISE_PLANILHAS_2026.md` antes de alterar o contrato de importação, modelo de notas ou estratégia para as planilhas dos professores.
4. Leia `POC_EXCEL_ONLINE_2026.md` antes de preparar ou avaliar a prova online com Excel Online (Business).
5. Antes de alterar autenticação ou Graph, leia `admin/admin.js`, `index.html` e o bloco `CONFIG` de `arquivo-digital/arquivo-digital.js`.
6. Não presuma que uma decisão pendente já foi aprovada.
7. Não crie recursos no SharePoint, Entra ID ou Power Automate sem autorização explícita do responsável pelo projeto.
8. Não faça reescrita ampla do site existente. O Arquivo Digital está operacional e é uma referência, não uma área livre para refatoração.
9. Nunca registre neste repositório notas reais, nomes de estudantes, tokens, senhas, segredos, arquivos de professores ou exportações do SharePoint.
10. Ao terminar uma etapa, atualize as seções **Estado atual**, **Decisões**, **Pendências** e **Registro de continuidade** deste arquivo.

## 2. Objetivo do projeto

Criar um sistema web de gestão e consolidação de notas que substitua apenas o banco central hoje mantido em planilha, preservando inicialmente as planilhas individuais usadas pelos professores.

O sistema deverá:

- receber automaticamente as alterações salvas nas planilhas online dos professores;
- funcionar sem computador, agente desktop ou servidor local permanentemente ligado;
- usar, sempre que tecnicamente possível, os serviços já disponíveis no Microsoft/Office 365 A1;
- centralizar notas, vínculos, situações de sincronização e inconsistências;
- permitir consulta rápida por ano letivo, turma, estudante, componente curricular e professor;
- registrar origem, versão, data e resultado de cada importação;
- reaproveitar os colaboradores e as permissões gerais do site SharePoint do Arquivo Digital;
- aparecer como um novo módulo no painel administrativo de `escolaieda.com`;
- funcionar bem em notebooks e celulares;
- oferecer aparência contemporânea inspirada em Material 3 Expressive/Android 16 e nos princípios adaptativos da Samsung One UI, sem copiar marcas ou ativos proprietários.

## 3. Escopo aprovado e decisões vigentes

Estas decisões foram aprovadas na conversa com o responsável pelo projeto:

1. Nesta primeira implantação, o escopo é somente o **banco de notas**.
2. As planilhas dos professores serão mantidas inicialmente.
3. A fonte deve ser a planilha online, não uma cópia desktop sujeita a atraso de sincronização.
4. A automação deve ser remota e independente de um computador ligado.
5. O sistema de notas usará o **mesmo site SharePoint do Arquivo Digital**.
6. Não será criado outro site SharePoint nem outro conjunto manual de colaboradores.
7. Todos os colaboradores atuais do site/Arquivo Digital deverão acessar o módulo de notas.
8. As novas estruturas serão separadas das listas e bibliotecas atuais, usando o prefixo `NOTAS_`.
9. A aplicação será acessada por `https://escolaieda.com/notas/` e por um cartão no painel `/admin/`.
10. Nesta etapa, estão autorizados documentação, scripts de POC e protótipo estático local do módulo de notas. Nenhum recurso Microsoft 365 deve ser criado ainda sem aprovação explícita.

### Consequência da decisão de permissões

As listas `NOTAS_*` deverão herdar as permissões do site SharePoint atual. Não criar um grupo exclusivo para notas neste momento. Isso evita vincular e desvincular os mesmos colaboradores em dois lugares.

Mesmo com permissões herdadas, a aplicação deve validar acesso tentando ler uma lista própria, preferencialmente `NOTAS_CONFIGURACOES`. Não basta esconder o cartão no painel e não se deve usar somente a leitura de `DOCUMENTOS_ATIVOS` como autorização do novo módulo.

Se no futuro professores, responsáveis ou estudantes passarem a acessar partes do sistema, essa decisão deverá ser revista antes da implementação. Não conceder acesso item a item improvisado.

## 4. Fora do escopo inicial

- substituir ou redesenhar as planilhas dos professores por completo;
- portal de estudante ou responsável;
- lançamento manual de nota pelo professor diretamente no novo sistema;
- aplicativo Android nativo;
- banco SQL, Dataverse ou servidor próprio;
- conector premium, gateway local, RPA ou automação desktop;
- publicação de qualquer nota no JSON público do site;
- integração com sistemas externos da Secretaria de Educação;
- cálculo definitivo de médias sem antes validar as regras pedagógicas reais.

## 5. Estado atual do repositório e infraestrutura

### 5.1 Git e hospedagem

- Repositório: `https://github.com/mcpmieda/escolaieda.git`
- Branch operacional: `main`
- Domínio do GitHub Pages: `https://escolaieda.com`
- Arquivo de domínio: `/CNAME`
- Hospedagem atual: site estático no GitHub Pages, sem backend próprio e sem pipeline de build identificado na fase 0.
- Painel administrativo: `/admin/`
- Arquivo Digital: `/arquivo-digital/`
- Novo módulo planejado: `/notas/`

### 5.2 Microsoft Entra ID e MSAL existentes

Os identificadores abaixo já estão publicados no código cliente e não são segredos:

| Configuração | Valor atual |
| --- | --- |
| Tenant ID | `f04e0fa3-b8dc-4f77-be3c-7dfda0635188` |
| Client ID | `bc2ecead-5f2e-48b8-9d48-9d01f2848cfa` |
| Biblioteca usada | `@azure/msal-browser@5.11.0`, importada por `esm.sh` |
| Escopos atuais | `User.Read`, `Sites.ReadWrite.All` |
| Callback do painel | raiz do domínio, seguida de retorno para `/admin/` via `sessionStorage` |
| Callback do Arquivo Digital | `https://escolaieda.com/arquivo-digital/` |
| Cache atual | `sessionStorage` |

O `index.html` da raiz já conclui o retorno do login e usa a chave `escolaIedaDestinoLogin`. O novo módulo poderá seguir o mesmo padrão, definindo o destino como `/notas/`. Antes de implementar, confirmar no Entra ID quais URIs estão efetivamente registradas.

Não criar segredo de cliente em uma SPA. A autenticação deverá continuar usando Authorization Code Flow com PKCE por meio do MSAL Browser.

### 5.3 SharePoint existente

| Configuração | Valor atual |
| --- | --- |
| Host | `eduieda.sharepoint.com` |
| Site | `ARQUIVODIGITAL` |
| Site ID do Graph | `eduieda.sharepoint.com,7ea13de9-13ae-40d5-b5f0-ad4782e3f585,d31492d1-c5c1-4710-8f6e-bd38e1fcfb17` |
| Biblioteca/lista de documentos | `DOCUMENTOS_ATIVOS` |
| ID de `DOCUMENTOS_ATIVOS` | `7adea611-e627-4593-a0b0-cecf58744c16` |
| ID de histórico atual | `144b31da-83f8-4ba4-b573-61fd8e5ac09f` |
| ID de anotações atual | `2698ef54-73e9-4ea1-995a-5d552349f57e` |

Esses IDs são referências do sistema operacional existente. O módulo de notas não deve gravar nas listas do Arquivo Digital.

O painel também conhece listas como `CONFIGURACOES_PORTAL`, `SERVICOS_PAINEL`, `LOGS_PORTAL` e outras estruturas do CMS. `SERVICOS_PAINEL` está provisionada, mas os cartões atuais ainda são definidos diretamente no HTML. O primeiro cartão de Gestão de Notas pode ser estático; a adoção posterior de catálogo dinâmico deve ser uma mudança separada.

### 5.4 Microsoft 365 A1 e Power Automate

Segundo a documentação vigente pesquisada em 06/07/2026, Office 365 A1 para docentes e estudantes inclui direitos limitados do Power Automate para fluxos automatizados, agendados e por botão, com conectores padrão. SharePoint, OneDrive for Business e Excel Online (Business) são conectores padrão. Conectores premium, gateway local, RPA e AI Builder não fazem parte dessa estratégia.

Documentação oficial reconferida em 07/07/2026 para esta fase:

- Excel Online (Business) mantém limite documentado de 25 MB por arquivo e pode bloquear arquivo para atualização/exclusão por até seis minutos após uso do conector.
- Microsoft Graph Workbook API documenta suporte apenas a workbooks Office Open XML; portanto, `.xlsb` não deve virar dependência Graph sem prova real.
- O conector SharePoint possui gatilhos para arquivo criado/modificado, mas gatilhos antigos por pasta têm limitações com subpastas; o desenho do fluxo precisa considerar a árvore real dos arquivos.

Licenciamento e limites mudam. Antes de provisionar o fluxo real, confirmar no tenant:

- licença da conta proprietária do fluxo;
- disponibilidade dos conectores SharePoint, OneDrive for Business e Excel Online (Business);
- políticas DLP do ambiente;
- limite efetivo de solicitações/ações do tenant;
- política institucional para conta proprietária e continuidade do fluxo.

## 6. Arquitetura alvo

```text
Professor edita e salva a planilha no Excel Online
                       │
                       ▼
        OneDrive for Business ou SharePoint Online
                       │
                       ▼
         Power Automate detecta arquivo alterado
                       │
             estabiliza + deduplica versão
                       │
                       ▼
       lê a tabela padronizada de exportação de notas
                       │
          valida, normaliza e registra inconsistências
                       │
                       ▼
       listas NOTAS_* no site SharePoint ARQUIVODIGITAL
                       ▲
                       │ Microsoft Graph
                       │
      https://escolaieda.com/notas/ — SPA autenticada
                       ▲
                       │
       cartão Gestão de Notas em /admin/
```

### 6.1 Divisão de responsabilidades

**Planilha do professor**

- continua sendo a interface de lançamento do professor;
- expõe uma tabela estável de exportação;
- não deve receber escrita automática do Power Automate durante a fase inicial.

**Power Automate**

- detecta salvamento online;
- lê somente a tabela de exportação;
- valida e transforma linhas;
- realiza upsert idempotente nas listas;
- registra importação, erro e versão processada.

**SharePoint Lists**

- são o banco operacional inicial;
- mantêm dados normalizados, indexados e auditáveis;
- ficam no site existente, mas separadas pelas listas `NOTAS_*`.

**Aplicação `/notas/`**

- autentica o colaborador;
- consulta e apresenta dados pelo Microsoft Graph;
- não contém notas embutidas em HTML/JS;
- não depende de computador local;
- não lê os arquivos de todos os professores a cada abertura.

## 7. Estratégia para as planilhas dos professores

### 7.1 Contrato mínimo de exportação

Cada arquivo deverá, após uma validação de viabilidade, oferecer uma tabela nomeada `TB_EXPORT_NOTAS`. A tabela deve ser gerada por fórmulas ou referências às células já utilizadas pelo professor, sem depender de VBA para atualizar o banco.

Colunas mínimas propostas:

| Coluna | Finalidade |
| --- | --- |
| `AnoLetivo` | ano de referência |
| `Periodo` | unidade, trimestre, bimestre ou etapa |
| `TurmaCodigo` | identificador estável da turma |
| `ComponenteCodigo` | identificador estável da disciplina |
| `ProfessorEmail` | vínculo com o responsável pelo arquivo |
| `AlunoCodigo` | identificador estável; não usar somente o nome |
| `AlunoNome` | conferência humana |
| `AvaliacaoCodigo` | atividade ou campo de nota |
| `Nota` | valor normalizado |
| `Faltas` | quando aplicável |
| `Situacao` | ativo, transferido, dispensado etc. |
| `AtualizadoEm` | data informada pela origem, quando disponível |

O nome da planilha, posição das células, nome do professor e nome do estudante não podem ser a única chave de integração.

### 7.2 Prova de conceito obrigatória

Antes de modificar todas as planilhas, testar uma cópia representativa com o Excel Online (Business):

1. confirmar o formato real (`.xlsx`, `.xlsb` ou outro);
2. confirmar que o arquivo abre e recalcula no Excel Online;
3. confirmar que `TB_EXPORT_NOTAS` aparece no conector;
4. medir o tempo entre salvar e iniciar o fluxo;
5. medir tempo e volume para listar todas as linhas;
6. testar fórmulas, linhas vazias, caracteres acentuados e notas decimais;
7. testar arquivo aberto simultaneamente pelo professor;
8. testar salvamentos consecutivos;
9. testar planilha protegida e tabela/aba oculta;
10. confirmar que nenhuma leitura altera conteúdo ou fórmulas.

O conector Excel Online (Business) documenta limitações importantes: arquivo de até 25 MB, possíveis bloqueios de arquivo por até seis minutos após uso, ausência de suporte a modificações concorrentes e risco de timeout com fórmulas complexas ou muitas linhas. Por isso o fluxo inicial deve ser somente de leitura da planilha e a tabela de exportação deve ser simples.

Não afirmar que a sincronização é instantânea. O SharePoint informa que gatilhos podem iniciar dentro de minutos. O projeto deve buscar experiência próxima de tempo real, mas só definir um SLA depois da prova de conceito no tenant real.

## 8. Modelo de dados inicial no SharePoint

Todas as listas abaixo são propostas. Nenhuma existe ainda. Usar listas genéricas, herdar as permissões do site atual e indexar os campos usados em filtros.

### 8.1 Listas propostas

| Lista | Responsabilidade |
| --- | --- |
| `NOTAS_CONFIGURACOES` | versão do esquema, ano ativo, parâmetros e sinal de acesso |
| `NOTAS_ANOS_LETIVOS` | ciclo anual e estado: preparação, ativo, fechamento, fechado, arquivado |
| `NOTAS_TURMAS` | turmas por ano letivo |
| `NOTAS_COMPONENTES` | componentes curriculares e regras básicas |
| `NOTAS_ALUNOS` | cadastro mínimo e identificador estável do estudante |
| `NOTAS_MATRICULAS` | vínculo estudante–turma–ano |
| `NOTAS_PROFESSORES` | referência institucional mínima dos professores |
| `NOTAS_VINCULOS_PLANILHAS` | `driveId`, `itemId`, professor, turma, componente e estado do vínculo |
| `NOTAS_AVALIACOES` | metadados das avaliações/períodos existentes na origem |
| `NOTAS_LANCAMENTOS` | valor consolidado de cada lançamento |
| `NOTAS_IMPORTACOES` | fila, versão, início, fim, contagens e resultado de sincronização |
| `NOTAS_INCONSISTENCIAS` | erros de vínculo, duplicidade, valor e estrutura |
| `NOTAS_AUDITORIA` | ações administrativas e alterações feitas pelo sistema |

### 8.2 Chaves e versionamento

- Todo registro funcional deve ter um `RegistroId` UUID estável.
- Todo registro anual deve ter `AnoLetivoId`.
- `NOTAS_LANCAMENTOS` deve ter uma chave externa determinística, por exemplo: `AnoLetivoId|TurmaId|ComponenteId|AlunoId|Periodo|AvaliacaoCodigo`.
- A importação deve armazenar `DriveId`, `ItemId`, `ETag` ou versão, `ModifiedDateTime` e hash lógico quando viável.
- Não usar caminho ou nome do arquivo como identidade primária. Pastas e arquivos podem ser renomeados.
- O mesmo evento pode chegar mais de uma vez; toda operação precisa ser idempotente.
- O estado mais recente confirmado vence, mas uma importação antiga não pode sobrescrever uma versão nova.
- Usar `ETag`/`If-Match` nas alterações administrativas em que concorrência importe.

### 8.3 Cuidados de escala no SharePoint

- Não carregar a lista inteira no navegador.
- Usar `$select`, `$filter`, `$top` e paginação.
- Criar índices para `AnoLetivoId`, `TurmaId`, `AlunoId`, `ComponenteId`, `ChaveExterna`, `Status` e `Modified` conforme o padrão real de consulta.
- Evitar excesso de colunas Lookup. Preferir IDs textuais estáveis e resolver metadados em lotes.
- Projetar consultas para o limite de exibição de listas; não depender de uma visualização sem filtro.
- Usar cache de sessão limitado e invalidação por versão.
- Para rastrear mudanças futuras, avaliar `listItem/delta` em vez de varrer coleções completas.

## 9. Fluxos de automação propostos

### 9.1 Fluxo A — detectar e enfileirar

1. Gatilho de arquivo criado ou modificado no local online definido.
2. Filtrar somente arquivos vinculados e formatos aprovados.
3. Obter `driveId`, `itemId`, versão/ETag e horário de modificação.
4. Aguardar curto período de estabilidade, se a prova de conceito demonstrar necessidade.
5. Criar ou atualizar uma entrada em `NOTAS_IMPORTACOES` com estado `PENDENTE`.
6. Se a mesma versão já estiver concluída, encerrar como duplicata segura.

### 9.2 Fluxo B — processar importação

1. Selecionar uma importação pendente.
2. Marcar `PROCESSANDO` com identificador de execução.
3. Ler `TB_EXPORT_NOTAS` pelo identificador estável do arquivo.
4. Validar cabeçalhos e versão do contrato.
5. Normalizar códigos, casas decimais, vazios e situações.
6. Registrar inconsistências sem descartar silenciosamente o restante do lote.
7. Fazer upsert dos lançamentos por chave externa.
8. Se uma linha existente deixou de vir na versão nova, aplicar a regra de exclusão/inativação aprovada; nunca apagar por suposição.
9. Marcar `CONCLUIDO`, `CONCLUIDO_COM_ALERTAS` ou `ERRO` com contagens.
10. Registrar auditoria técnica sem copiar dados desnecessários para mensagens de erro.

### 9.3 Concorrência e repetição

- Limitar concorrência por arquivo a uma execução.
- Agrupar ou descartar versões intermediárias quando uma versão mais nova já estiver pendente.
- Implementar tentativas com atraso progressivo para falhas transitórias.
- Respeitar `Retry-After` em respostas 429 do Graph.
- Não fazer repetição infinita.
- Criar uma fila de intervenção para erros permanentes.
- Disponibilizar reprocessamento manual de uma versão pela tela administrativa.

### 9.4 Propriedade dos fluxos

Os fluxos não devem depender da conta pessoal de alguém que possa sair da escola. Definir uma conta institucional proprietária, coproprietários e documentação de recuperação. Essa decisão precisa respeitar as licenças e políticas reais do tenant.

## 10. Aplicação web `/notas/`

### 10.1 Estratégia técnica inicial

Para preservar a implantação direta existente do GitHub Pages, a primeira versão usa HTML semântico, CSS modular e JavaScript ES Modules, divididos por domínio. Não repetir o padrão de um único arquivo JavaScript muito grande.

Estrutura implementada em 07/07/2026:

```text
notas/
├── AGENTS.md
├── AGENTS_NOTAS.md
├── index.html
├── css/
│   ├── tokens.css
│   ├── base.css
│   ├── layouts.css
│   └── componentes.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── demo-data.js
│   ├── domain.js
│   ├── graph-client.js
└── scripts/testes-notas.mjs
```

A estrutura atual é uma SPA estática compatível com GitHub Pages, sem etapa de build. O modo demonstração usa somente dados fictícios. O cliente Graph existe para autenticação MSAL e verificação estrutural das listas `NOTAS_*`, mas não grava em SharePoint e não contém dados reais embutidos.

Em 07/07/2026 a interface deixou de ser apenas prova técnica e passou a representar uma primeira visão de produto: navegação lateral com identidade própria, início com indicadores, banco/matriz de notas por componente, consulta de alunos, prévia de boletim, relatórios de aproveitamento/conselho/ata, importações e estrutura. No redesenho posterior da mesma data, as referências visuais da pasta `C:\Users\Eugui\Desktop\imagens` foram usadas como inspiração, mas não copiadas literalmente: o modelo final usa um console acadêmico escuro, botões compactos, turma/período no topo, ranking, donut de desempenho, matriz por componente, ficha/boletim com identidade real da escola e tela própria de conselho de classe.

Usar JavaScript moderno com JSDoc rigoroso inicialmente. Avaliar TypeScript + Vite somente se houver uma estratégia aprovada para compilar e publicar sem quebrar o GitHub Pages da raiz. Não introduzir framework apenas para reproduzir componentes que HTML/CSS resolvem.

### 10.2 Telas mínimas

1. **Entrada/autenticação** — estado de sessão e acesso negado claros.
2. **Visão geral** — integridade da sincronização, últimas importações e alertas.
3. **Turmas** — filtros por ano, turma, período e componente.
4. **Estudantes** — visão consolidada e detalhamento por período.
5. **Professores/planilhas** — vínculos, última versão e saúde da integração.
6. **Importações** — fila, duração, linhas processadas, alertas e reprocessamento.
7. **Inconsistências** — resolução orientada, com histórico.
8. **Auditoria** — ações e mudanças administrativas.
9. **Configurações** — ano ativo, contrato de importação e parâmetros aprovados.

Não implementar edição de notas na interface durante a primeira entrega sem uma decisão explícita sobre fonte de verdade e reconciliação com a planilha do professor.

Estado real em 10/07/2026: para a fase visual atual, a SPA tem navegação visível somente para `Notas` e `Boletim`. A antiga aba `Estatísticas` foi incorporada à aba `Notas` como seção `.notesStatsSection`, abaixo da ficha de notas. Os hashes legados `#estatisticas` e `#movimento` são aceitos apenas para compatibilidade e devem redirecionar para a URL canônica `#notas`; não recriar botão de navegação, view HTML `view-movimento` nem impressão própria separada para Estatísticas. O código ainda preserva nomes técnicos `movement*` para os widgets analíticos herdados: cards, ranking top 3/top 10, gráfico por disciplina, donut e painel contextual de notas vermelhas. Os seletores Turma/Período de `Notas` sincronizam tabela, insights laterais e toda a seção analítica integrada. Quando `TODAS AS TURMAS` estiver selecionado, a tabela não deve listar notas de toda a escola; deve exibir aviso para selecionar uma turma individual, enquanto os insights laterais não exibem valores de alunos em atenção ou ranking de disciplinas. A análise integrada pode continuar mostrando visão agregada, cards, ranking, gráfico e donut para o recorte geral. A ficha de notas é a experiência principal, com filtros compactos em botão na própria tabela, colunas `Nº`, `Status`, `Aluno`, componentes e `Resultado`, pílulas arredondadas, nomes de alunos em caixa alta, recuperações por trimestre/anual e resultados completos. O hover do aluno deve mostrar somente foto maior/legível; o painel lateral de aluno deve ser opaco, fechar por clique externo e exibir notas em tabela com chips arredondados. O carregamento inicial renderiza somente a view ativa para evitar flash de painéis de outras abas. O sistema de notas é baseado em somas/pontuações e mínimos por período; usar o termo `média` somente quando houver cálculo real de média. As telas de alunos, conselho, relatórios, sync/importações, professores/planilhas, inconsistências, auditoria detalhada e configurações reais ficam fora desta etapa e dependem de nova autorização, provisionamento das listas `NOTAS_*` e fluxo piloto.

## 11. Direção visual: Android 16, Material 3 Expressive e One UI

### 11.1 Interpretação correta do pedido

`Android 16` usa uma linguagem visual complementada pelo **Material 3 Expressive**. `One UI` é o sistema de design da Samsung e possui versões próprias. Não existe um padrão único chamado “Android 16 UI 8.5/9”.

O projeto deve combinar princípios, não copiar interfaces:

- Material 3 Expressive: cor, tipografia, formas, componentes e movimento expressivo;
- One UI: foco na tarefa, área de visualização separada da área de interação, conforto, alcance e adaptação a telas grandes;
- identidade da Escola Iêda: cores e marca próprias;
- padrões web: teclado, mouse, toque, leitor de tela e navegador responsivo.

Não usar logotipos, ícones, fontes exclusivas ou componentes proprietários da Samsung.

### 11.2 Princípios visuais obrigatórios

- superfícies calmas e conteúdo prioritário evidente;
- cartões com raios generosos, mas hierarquia clara;
- cor forte em áreas pequenas de ação e estados, não em todo o conteúdo;
- sombras leves; blur e dim somente em camadas temporárias;
- títulos amplos e espaço respirável no topo em telas compactas;
- ações frequentes ao alcance do polegar no celular;
- navegação persistente e maior densidade informacional no notebook;
- modo claro e escuro desde a definição dos tokens;
- tabelas legíveis no notebook e transformação em lista/cartões no celular;
- estados de carregamento, vazio, sucesso, alerta, erro e offline desenhados explicitamente.

### 11.3 Classes adaptativas para a web

Usar a largura disponível, não detectar modelo de dispositivo:

| Classe | Largura CSS proposta | Comportamento |
| --- | --- | --- |
| Compacta | `< 600px` | uma coluna, navegação inferior, filtros em bottom sheet |
| Média | `600–839px` | rail lateral ou navegação híbrida, painéis sobrepostos |
| Expandida | `840–1199px` | navegação lateral, lista + detalhe quando útil |
| Grande | `1200–1599px` | grid amplo, filtros persistentes e maior densidade |
| Extra grande | `>= 1600px` | largura de leitura controlada; não esticar conteúdo indefinidamente |

Além da largura, verificar altura baixa, orientação, teclado, mouse, ponteiro fino/grosso e zoom.

### 11.4 Tokens CSS iniciais

Os valores serão validados em protótipo; nunca espalhar números arbitrários pelo CSS.

```css
:root {
  --notas-cor-primaria: #00639a;
  --notas-cor-destaque: #3e91ff;
  --notas-superficie: #f7f9fc;
  --notas-superficie-elevada: #ffffff;
  --notas-texto: #17202a;
  --notas-raio-sm: 12px;
  --notas-raio-md: 20px;
  --notas-raio-lg: 28px;
  --notas-duracao-rapida: 120ms;
  --notas-duracao-padrao: 240ms;
  --notas-duracao-longa: 360ms;
  --notas-curva-expressiva: cubic-bezier(.22, .25, 0, 1);
}
```

As cores finais precisam ser derivadas da identidade escolar e testadas em claro/escuro. Não assumir que azul Samsung é a cor oficial da escola.

### 11.5 Movimento e transições

Segundo a orientação One UI, animações devem explicar causa, efeito, profundidade e continuidade. Durações não devem atrapalhar a tarefa; a referência oficial recomenda movimentos reconhecíveis entre aproximadamente 100 e 500 ms.

Regras do módulo:

- feedback de pressão/seleção imediato;
- 120–180 ms para estados pequenos;
- 200–280 ms para cartões, filtros e navegação local;
- 280–400 ms para troca de painel ou modal;
- nenhuma animação funcional acima de 500 ms;
- animar preferencialmente `transform` e `opacity`;
- não animar grandes tabelas linha por linha;
- não bloquear interação enquanto uma animação termina;
- manter foco e contexto ao abrir/fechar camadas;
- respeitar `prefers-reduced-motion: reduce`, reduzindo ou removendo deslocamento, escala, parallax e blur animado.

Decisão adicional em 08/07/2026: toda evolução visual nova do módulo deve considerar microinterações e movimento proporcional desde o início, não como acabamento posterior. Quando um `select` nativo gerar uma lista visualmente incompatível com o sistema, criar seletor customizado sincronizado com o controle real. Em dashboards, gráficos e indicadores devem ter entrada animada e movimento ambiente lento, desde que isso não reduza legibilidade, desempenho nem acessibilidade. Toda decisão estética aprovada em uma aba deve orientar as próximas abas e recursos para preservar um ecossistema visual padronizado: squircles simulados por raios generosos, camadas translúcidas com blur controlado, hierarquia limpa, temas realmente abrangentes, estados pressionados/foco físicos, ilhas conceituais, carregamento escalonado e badges compactos.

Decisão adicional em 08/07/2026 após `aqui2.txt`: menus, perfis, buscas e painéis flutuantes devem fechar ao clicar fora e, quando fizer sentido, limpar o estado digitado para não manter filtros invisíveis. Busca global deve mostrar resultados em camada própria, não re-renderizar a página enquanto o usuário digita. Rankings e listas expansíveis devem crescer dentro do próprio contêiner, com rolagem interna estável e sem deslocar a página. Relatórios nominais de alunos devem ser contextuais a uma ação clara, como clicar em uma disciplina, e não reaparecer como lista genérica permanente na aba.

Decisão adicional em 08/07/2026 após `aqui3.txt`: brilhos fortes devem ser evitados em bordas, legendas e gráficos; profundidade precisa parecer natural e não competir com os dados. Movimento ambiente de barras e donuts deve alternar tons dentro do próprio corpo visual, sem deslocar texto, sem girar percentuais e sem criar manchas atrás de números. Seletores importantes devem trazer ícones quando isso reforçar a função do controle. Menus de perfil e camadas similares devem usar entrada animada, blur e sombra no mesmo padrão das demais superfícies do sistema.

Decisão adicional em 09/07/2026 para a aba `Notas`: ao levar a linguagem de `Estatísticas` para telas tabulares, preservar densidade e leitura acima de efeitos decorativos. Selects nativos devem virar seletores customizados quando estiverem no fluxo principal; a seção de turma/período e impressão deve seguir o mesmo padrão visual de `Estatísticas`; filtros frequentes devem abrir como menu compacto dentro da tabela, não ocupar uma faixa inteira da página; tabelas aprovadas devem usar pílulas arredondadas para status, notas críticas e resultado, com nome completo legível, hover de linha e destaque de coluna. No mobile, tabelas podem manter rolagem interna, mas não podem alargar a página inteira. A renderização de uma view não deve sobrescrever título/subtítulo do cabeçalho superior de outra view nem mostrar painel de outra aba durante o carregamento.

Decisão adicional em 09/07/2026 após prints de revisão da aba `Notas`: overlays que aparecem sobre dados tabulares precisam ser opacos, com contraste alto e z-index suficiente para não misturar texto com linhas, pílulas ou colunas do fundo. Popovers de filtro devem usar controles clicáveis grandes, labels em linha única e estado marcado evidente. Prévia/hover de aluno deve priorizar legibilidade do nome, turma, status e notas; se a tabela ficar visualmente carregada, suavizar o destaque cruzado de linha/coluna antes de adicionar novos efeitos. Textos auxiliares como regras demonstrativas não devem competir com a ficha principal quando a informação já está documentada no modelo.

Decisão adicional em 09/07/2026 para desempenho e temas da aba `Notas`: tabelas com muitas linhas/células não devem usar animação escalonada por linha nem animação infinita por célula. Movimento em tabelas deve ficar restrito a hover/foco leve e superfícies de maior nível, preservando resposta imediata na rolagem. Toda aba com tema deve trocar também suas superfícies internas críticas, não apenas o fundo global; na aba `Notas`, isso inclui seletores, ficha, tabela, filtro, painel lateral, tooltip de aluno e botão de impressão. Filtros de tabela devem ser compactos no desktop, preferencialmente em grade curta, e podem voltar a uma coluna no mobile.

Decisão adicional em 10/07/2026 para seletores compartilhados: quando `Notas` reutilizar controles de Turma/Período aprovados em `Estatísticas`, cards, botões, listagens, sombras, bordas e menus devem manter as mesmas dimensões e comportamento. O menu aberto não pode herdar superfície translúcida de painel comum se isso deixar o fundo da página aparecer por trás; cada tema precisa ter variáveis próprias de menu quase opaco e contraste suficiente para a lista.

Decisão adicional em 10/07/2026 após `aqui7.txt`: `Estatísticas` não deve voltar como aba separada nesta fase. Os widgets aprovados de Estatísticas vivem dentro de `Notas`, em `.notesStatsSection`, e os hashes `#estatisticas`/`#movimento` são apenas atalhos legados para `#notas`. Os seletores Turma/Período de `Notas` devem sempre controlar ficha, insights e análise integrada. Ao clicar em disciplina no gráfico, preservar as barras existentes e apenas alternar o estado ativo/lista contextual de alunos com nota vermelha. Para `TODAS AS TURMAS`, não renderizar grade geral de notas nem contadores nos insights laterais; mostrar aviso para seleção de turma individual. Recuperações por trimestre devem ficar disponíveis no seletor, com texto na mesma linha. Hover de aluno deve mostrar somente foto maior; painel lateral deve ser opaco, fechar por clique externo e usar tabela com chips de nota. Nomes de alunos devem aparecer em caixa alta nas superfícies visíveis e a página não deve usar linguagem de "demo"/"demonstrativa" na superfície principal.

### 11.6 Acessibilidade obrigatória

Meta mínima: WCAG 2.2 nível AA.

- contraste de texto normal de pelo menos 4,5:1;
- não comunicar estado somente por cor;
- alvos de toque confortáveis, preferencialmente 44–48 CSS px;
- foco visível e com contraste;
- ordem de foco lógica;
- todos os controles operáveis por teclado;
- nomes acessíveis para ícones e botões;
- tabelas com cabeçalhos e descrições adequadas;
- modais com foco contido e devolvido ao acionador;
- mensagens dinâmicas críticas anunciadas por região viva;
- zoom de 200% sem perda funcional e reflow adequado;
- texto em português claro, direto e sem depender da posição ou cor do botão.

## 12. Segurança, privacidade e LGPD

Notas e dados de estudantes são dados pessoais educacionais e envolvem crianças/adolescentes. O sistema deve observar finalidade, adequação, necessidade, segurança e acesso restrito.

Regras obrigatórias:

- somente colaboradores autenticados e autorizados pelo SharePoint;
- dados nunca enviados ao GitHub Pages como arquivo público;
- nenhum segredo no JavaScript cliente;
- nenhum GitHub PAT usado pelo módulo de notas;
- não reutilizar o mecanismo do CMS que publica JSON público;
- pedir apenas os campos necessários;
- evitar nomes de estudantes em logs técnicos quando um ID resolver;
- não exibir nota em notificação do navegador, URL ou título da página;
- não colocar filtros sensíveis completos em query string compartilhável;
- escapar todo conteúdo vindo de listas/planilhas antes de inseri-lo no DOM;
- preferir `textContent` a `innerHTML`;
- confirmar ações destrutivas e registrar ator, data e motivo;
- definir retenção e arquivamento antes de excluir dados reais;
- documentar restauração e continuidade operacional;
- revisar o escopo amplo `Sites.ReadWrite.All` antes da produção. Ele é o padrão atual, mas não deve ser considerado automaticamente o menor privilégio possível.

Herança das permissões do site é uma decisão operacional aprovada, mas não elimina a necessidade de auditoria. Qualquer futura abertura para professores, estudantes ou responsáveis exige revisão de arquitetura e privacidade.

## 13. Desempenho e confiabilidade

### Metas iniciais a validar

- primeira renderização útil em até 2,5 s em conexão escolar razoável, após autenticação;
- ações locais com feedback visual em menos de 100 ms;
- consultas paginadas e canceláveis;
- nenhum carregamento integral de `NOTAS_LANCAMENTOS`;
- busca digitada com debounce e cancelamento de resposta obsoleta;
- dashboard baseado em agregados ou consultas específicas, não em varredura geral;
- erros Graph com timeout, mensagem útil e possibilidade de tentar novamente;
- tratamento de 401, 403, 404, 409/412, 429 e 5xx;
- respeito a `Retry-After` e backoff exponencial quando ausente;
- telemetria funcional em `NOTAS_AUDITORIA`/`NOTAS_IMPORTACOES`, sem serviço externo obrigatório.

Power Automate e Excel Online são serviços assíncronos. A interface deve mostrar `última sincronização`, `versão processada`, `pendente`, `processando`, `com alertas` e `erro`; nunca fingir atualização instantânea.

## 14. Testes obrigatórios

### 14.1 Aplicação web

- sintaxe JavaScript;
- testes unitários de normalização, chaves e cálculos;
- testes de Graph com respostas simuladas, paginação e erros;
- testes de regressão para login e controle de acesso;
- testes de teclado e leitor de tela;
- contraste e modo escuro;
- layouts em 360, 600, 840, 1280 e 1600 px;
- `prefers-reduced-motion`;
- rede lenta, offline após login e token expirado;
- nenhuma nota ou dado real nos fixtures.

### 14.2 Automação

- versão duplicada;
- dois salvamentos rápidos;
- arquivo ausente ou renomeado;
- tabela ausente ou cabeçalhos alterados;
- aluno sem código;
- aluno duplicado;
- nota vazia, zero, decimal, texto e fora do intervalo;
- linha removida na origem;
- fórmula com erro;
- arquivo bloqueado;
- 429, 504 e timeout;
- execução interrompida e reprocessamento idempotente;
- lote parcialmente válido;
- ano letivo fechado.

## 15. Fases de implantação

### Fase 0 — fundação documental — concluída

- [x] estudar o repositório e o painel administrativo;
- [x] identificar autenticação, site ID e padrão Graph atuais;
- [x] decidir usar o mesmo site e os mesmos colaboradores;
- [x] pesquisar Material 3 Expressive, One UI, acessibilidade e limites Microsoft 365;
- [x] criar `notas/AGENTS.md` e `notas/AGENTS_NOTAS.md`;
- [x] receber e analisar a planilha/banco original e as planilhas de professores de 2026;
- [x] confirmar estrutura, regras centrais de pontuação e cálculos de resultado;
- [x] registrar a análise em `ANALISE_PLANILHAS_2026.md`.

### Fase 1 — descoberta e prova de conceito

- [x] mapear campos, guias, fórmulas, macros e chaves das planilhas;
- [x] comparar estruturalmente os 18 arquivos de professores de 2026;
- [x] criar e reabrir `TB_EXPORT_NOTAS` em uma cópia temporária local;
- [x] criar ferramenta local para preparar uma cópia controlada com `TB_EXPORT_NOTAS`;
- [x] preparar uma cópia controlada em pasta OneDrive de POC;
- [x] comprovar leitura online de `TB_EXPORT_NOTAS` em `.xlsb` pela Microsoft Graph Workbook API;
- [x] inventariar ambiente Power Automate, conector Excel Online (Business) e conexões existentes;
- [ ] confirmar no tenant que a cópia de POC está disponível para o conector Excel Online (Business);
- [ ] comprovar leitura online de `TB_EXPORT_NOTAS` pelo conector Excel Online (Business);
- medir latência e limites no tenant A1;
- validar se a origem permanecerá no OneDrive da Secretaria ou migrará para biblioteca no mesmo site;
- validar e fechar o contrato versão 1 após o teste online;
- [x] criar protótipo funcional estático do dashboard, turmas, estudantes, importações e POC/estrutura em modo demonstração;
- [x] redesenhar o protótipo como central de notas com banco, boletim e relatórios inspirados no fluxo do Excel;
- [x] criar fixtures fictícios e testes automatizados locais para o módulo web;
- obter aprovação antes de provisionar.

### Fase 2 — infraestrutura controlada

- criar script de provisionamento idempotente, inicialmente em modo de simulação;
- criar listas `NOTAS_*` com permissões herdadas e índices;
- criar dados fictícios;
- criar fluxo piloto com uma planilha;
- criar plano de rollback e remoção dos recursos de teste.

### Fase 3 — aplicação mínima

- [x] implementar entrada/autenticação inicial com MSAL configurado e fallback de demonstração;
- [x] implementar cliente Graph modular para verificar a existência das listas `NOTAS_*`;
- [x] implementar visão geral, turmas, estudantes e importações em modo demonstração;
- [x] implementar banco/matriz por componente, boletim individual e relatórios de aproveitamento/conselho/ata em modo demonstração;
- [x] implementar estados básicos de estrutura ausente, demonstração, erro e sessão;
- [x] adicionar cartão Gestão de Notas no painel;
- [x] testar visualmente por captura Playwright em notebook e celular no servidor local;
- [ ] ligar consultas reais depois que as listas `NOTAS_*` forem provisionadas;
- [ ] implementar professores/planilhas, inconsistências, auditoria e configurações reais.

### Fase 4 — piloto real

- selecionar poucos professores/turmas;
- acompanhar sincronizações e inconsistências;
- comparar resultados com a planilha central atual;
- corrigir diferenças antes de declarar o novo banco como fonte operacional.

### Fase 5 — expansão e encerramento da planilha central

- migrar gradualmente todos os vínculos;
- documentar rotina anual;
- treinar secretaria/direção;
- manter plano de contingência;
- somente após reconciliação formal, retirar a dependência do banco central antigo.

## 16. Critérios de conclusão do produto

O projeto só poderá ser considerado concluído quando:

1. todas as planilhas aprovadas sincronizarem sem computador ligado;
2. a origem online e o banco produzirem os mesmos resultados para os cenários validados;
3. versões repetidas não criarem duplicidades;
4. erros forem visíveis e reprocessáveis;
5. o fechamento anual não exigir recriar manualmente todo o sistema;
6. colaboradores atuais acessarem pelo mesmo login e permissões do site;
7. nenhum usuário externo ou não autorizado conseguir consultar notas;
8. a interface cumprir os testes funcionais, responsivos e de acessibilidade;
9. houver trilha de auditoria, retenção, restauração e documentação operacional;
10. o painel administrativo possuir acesso claro ao módulo `/notas/`;
11. nenhuma nota ou credencial estiver no repositório público;
12. o responsável pelo projeto aprovar a reconciliação e a entrada em produção.

## 17. Pendências que bloqueiam a implementação real

- executar a POC final pelo conector Excel Online (Business), pois a leitura online por Microsoft Graph Workbook API já foi comprovada em `.xlsb`;
- criar/autorizar uma conexão `Excel Online (Business)` no ambiente padrão do Power Automate;
- confirmar no tenant que o conector Excel Online (Business) lista e lê `TB_EXPORT_NOTAS` dentro de `.xlsb`;
- executar o teste Power Automate descrito em `POC_EXCEL_ONLINE_2026.md` usando cópia fora do repositório;
- se `.xlsb` falhar, testar uma cópia `.xlsm` informada por identificador de arquivo, sem converter os originais;
- definir e persistir um `AlunoId` estável; o fluxo atual usa principalmente nome/posição, embora a relação possua INEP e CPF na base interna;
- confirmar a regra para nota apagada, estudante removido, transferido ou reposicionado na relação;
- confirmar regras restantes de faltas, arredondamento e situações excepcionais;
- decidir se `Total`, `TotalRec` e `NotaFinal` serão importados para conferência ou recalculados pelo sistema como fonte oficial;
- decidir o que ocorre quando uma nota é apagada ou uma linha desaparece;
- confirmar conta institucional proprietária dos fluxos;
- validar conectores e limites no tenant A1;
- confirmar URIs cadastradas no aplicativo Entra;
- validar com o responsável a versão integrada de `/notas/#notas` após `aqui7.txt`, incluindo ausência da aba separada `Estatísticas`, compatibilidade dos hashes `#estatisticas`/`#movimento` redirecionando para `#notas`, ficha com seletores Turma/Período controlando tabela, insights, cards, ranking, gráfico, donut e painel contextual, recuperação por trimestre/anual com texto sem quebra, `TODAS AS TURMAS` exibindo aviso na grade e sem contadores nos insights laterais, seção analítica preservando os elementos aprovados contra `anexo 7.png`/`anexo 12.png`, clique em disciplina sem recriar barras, nomes de alunos em caixa alta, hover somente com foto maior, painel lateral opaco/legível e com fechamento externo, filtro compacto, tabela sem atraso de rolagem, temas claro/mono aplicados à ficha e à análise, e ausência de termos de demonstração na superfície principal antes de considerar a aba visualmente fechada;
- provisionar listas `NOTAS_*` somente depois da aprovação e de script idempotente em modo simulação;
- substituir fixtures fictícios por consultas reais somente após as listas e permissões existirem.

### 17.1 Problemas comuns e soluções confirmadas

- **Power Automate sem conexão Excel Online (Business)**: não adianta criar fluxo completo enquanto `Get-PowerAppConnection` não mostrar `shared_excelonlinebusiness`. Solução: criar/autorizar a conexão OAuth no portal do Power Automate e repetir `scripts/verificar-power-automate-notas.ps1`.
- **Módulos Power Platform no PowerShell 7**: os módulos oficiais usados nesta etapa funcionaram no Windows PowerShell 5.1, não no `pwsh` 7. Solução: usar Windows PowerShell 5.1 e instalar antes o provider NuGet `2.8.5.201` quando solicitado.
- **Graph lendo o OneDrive errado**: `/me/drive` abriu o OneDrive da conta autenticada, não o da Secretaria. Solução: acessar o drive por usuário, usando `v1.0/users/SECRETARIA@escolaieda.com/drive`, quando a origem estiver na conta da Secretaria.
- **Arquivo POC bloqueado (`resourceLocked`)**: o item antigo pode permanecer bloqueado pelo Excel/Graph por alguns minutos. Solução: aguardar o bloqueio expirar ou subir uma nova cópia técnica de POC, sem alterar o arquivo original.
- **Colunas nome/situação invertidas na guia `RELAÇÃO`**: não confiar apenas em par/ímpar fixo. Solução já aplicada em `scripts/preparar-poc-export-notas-v1.ps1`: inferir a coluna de nomes pela quantidade de células preenchidas.
- **OneDrive local atrasado**: reparse points e sincronização local podem esconder a versão online real. Solução: validar pelo Graph ou pelo conector online antes de concluir que a cópia está disponível.
- **Desenvolvimento web sem dados reais**: nunca copiar nomes, notas, CPF, INEP ou exportações para fixtures. Solução: manter `notas/js/demo-data.js` com estudantes e professores fictícios e rodar `node scripts/testes-notas.mjs`.
- **Servidor local com `python` no Windows**: nesta máquina `python.exe` aponta para o atalho `WindowsApps`, que abre a orientação da Microsoft Store e não inicia servidor HTTP. Solução: usar `npx --yes http-server . -a 127.0.0.1 -p <porta> -c-1 --silent` ou instalar Python real fora do alias.
- **Playwright sem navegador instalado**: a CLI pode existir, mas a captura falha se o Chromium do Playwright não estiver baixado. Solução usada: `npx --yes playwright install chromium` e depois `npx --yes playwright screenshot ...`.
- **Teste Playwright sem dependência local**: o runner não conseguiu resolver `@playwright/test`/`playwright/test` em arquivo temporário local sem instalar dependência no projeto. Solução nesta etapa: não adicionar dependência; usar `node scripts/testes-notas.mjs`, `git diff --check` e capturas Playwright CLI.
- **Script temporário com `require("playwright")` via `npx --package`**: nesta máquina o `node` executado pelo `npx --package playwright` não resolveu o módulo para scripts temporários. Solução usada em 07/07/2026: não instalar dependência no repositório; adicionar suporte a hash na SPA e usar a CLI `npx --yes playwright screenshot` com URLs como `/notas/#banco`, `/notas/#boletins` e `/notas/#conselho`.
- **Flash visual de painel de outra aba ao carregar**: renderizar todas as views logo após abrir a SPA, ou manter uma view com `active` fixo no HTML, pode produzir percepção de conteúdo estranho durante o primeiro ciclo de layout, como botão de impressão gigante antes da aba correta abrir. Solução aplicada em 09/07/2026: `abrirView()` renderiza somente a view ativa; as demais views renderizam quando forem abertas ou quando seus controles mudarem; o HTML estático não deve deixar nenhuma `.pageView` marcada como `active` antes do roteamento.
- **Exportação de prints reais do Excel em branco**: `CopyPicture` pode gerar imagem branca se a faixa não estiver ativa/selecionada corretamente. Solução usada: abrir o `.xlsb` somente leitura com macros/eventos/links desabilitados, ativar a planilha, selecionar a faixa e usar `CopyPicture(1, -4147)` antes de colar/exportar via gráfico temporário.
- **Aluno em foco do Conselho fora da turma exibida**: escolher o menor desempenho global pode mostrar aluno de outra turma enquanto o relatório final está em uma turma ativa. Solução aplicada: derivar a turma ativa por filtro/hash e escolher o candidato do Conselho dentro dessa turma; só cair para o conjunto filtrado geral se a turma estiver vazia.
- **Banco com barra horizontal**: tabelas HTML com `min-width` fixo preservam colunas, mas quebram o pedido de ver todas as notas na tela. Solução aplicada em 07/07/2026: no quadro principal do Banco, usar `table-layout: fixed`, `min-width: 0`, fontes compactas, nomes de componentes escondidos no cabeçalho e larguras fixas pequenas para número/AP anterior; manter a ordem `P M C G H A RL F I RD ET CPT`.
- **Painéis analíticos competindo com o quadro real**: a matriz consolidada por componente e a leitura por área deixavam a aba Banco menos fiel aos prints. Solução aplicada: remover visualmente esses painéis da aba Banco e deixar o quadro trimestral como experiência principal.
- **Tela Boletim começando baixa demais**: reaproveitar `classDeck`, banner de demonstração e filtros globais antes da área de impressão consumia a altura útil e afastava o layout do print `Relatórios e Impressão`. Solução aplicada: definir `body[data-view]` em `abrirView()` e esconder `classDeck`, `syncStrip` e `filtersBar` apenas em `boletins`; esconder `filtersBar` também em `dashboard` e `banco` para aproximar dos prints.
- **Ordem de componentes diferente entre Banco e Boletim**: o Banco usa a ordem visual `P M C G H A RL F I RD ET CPT`, mas o print do Boletim posiciona Religião antes de Educação Física/Inglês/Redação. Solução aplicada: manter `componentesPlanilha()` para Banco e criar `componentesBoletim()` para a prévia fiel do Boletim.
- **Gráfico de Turma preso em uma coluna**: ao trocar cards por gráfico, a classe antiga `.disciplineBars` ainda criava quatro colunas e espremia o gráfico no primeiro quadrante. Solução aplicada: alterar `.disciplineBars` para uma coluna no desktop e renderizar um único `.disciplineChart` com barras internas.
- **SharePoint/Power Automate por impulso**: não criar listas, fluxos ou permissões para “testar rápido”. Solução: manter a SPA em modo demonstração, usar scripts de verificação e só provisionar com autorização explícita e rollback documentado.

## 18. Protocolo para futuras sessões com IA

Ao iniciar:

1. informar que leu este documento;
2. executar `git status --short --branch`;
3. preservar alterações do usuário;
4. verificar a seção **Registro de continuidade**;
5. trabalhar apenas na próxima etapa autorizada;
6. pesquisar documentação atual se a decisão envolver licenças, APIs ou produtos que possam ter mudado.

Ao concluir:

1. executar testes proporcionais à mudança;
2. registrar arquivos alterados e resultados;
3. atualizar checklist, pendências e decisões;
4. não marcar uma fase como concluída com trabalho pendente;
5. fazer commit dos arquivos necessários e push para `origin/main` por padrão ao concluir alterações no módulo `/notas/`;
6. nunca provisionar ou apagar recursos Microsoft 365 por inferência.

Exceção da regra de publicação: não fazer commit/push apenas se o responsável pedir explicitamente para deixar a alteração local. Tags, criação/alteração de listas `NOTAS_*`, SharePoint, Graph, Power Automate, permissões e Entra ID continuam exigindo autorização explícita separada.

## 19. Registro de continuidade

### 10/07/2026 — integração de Estatísticas dentro da aba Notas (`aqui7.txt`)

- Responsável pediu para executar `C:\Users\Eugui\Desktop\aqui7.txt`: incorporar todos os recursos da antiga aba `Estatísticas` dentro de `Notas`, remover a guia separada, fazer os seletores Turma/Período comandarem a página inteira e documentar o ponto de continuidade para novas IAs.
- Decisão aplicada: a navegação visível de `/notas/` agora tem somente `Notas` e `Boletim`. Os hashes legados `#estatisticas` e `#movimento` continuam aceitos, mas são normalizados para `#notas`. Não recriar `view-movimento` nem botão lateral/topo para `Estatísticas` nesta fase.
- Ajustes feitos em `notas/index.html`:
  - removida a view HTML separada de `Estatísticas` e o botão de navegação correspondente;
  - inserida a seção `.notesStatsSection` abaixo da ficha de notas, contendo cards, `Destaques da turma`, gráfico por disciplina, donut, painel de detalhamento e rodapé analítico;
  - seletor de período de `Notas` passou a oferecer `REC. I TRIMESTRE`, `REC. II TRIMESTRE`, `REC. III TRIMESTRE` e `RECUPERAÇÃO ANUAL`;
  - textos de superfície trocaram linguagem demonstrativa por linguagem de ambiente visual/revisão.
- Ajustes feitos em `notas/js/app.js`:
  - `viewAliases` passou a mapear `estatisticas` e `movimento` para `notas`, e `viewHashes` ficou sem URL canônica separada para Estatísticas;
  - `renderNotas()` agora sincroniza `state.movimento` internamente com Turma/Período de `Notas` e renderiza tabela, insights e painel analítico no mesmo ciclo;
  - `TODAS AS TURMAS` não renderiza grade geral de notas: mostra aviso na tabela e blocos laterais vazios, mantendo os widgets analíticos agregados;
  - clique em disciplina no gráfico apenas alterna classe ativa e renderiza o painel contextual de alunos com nota vermelha, sem chamar novamente `renderMovementChart(recorte)`;
  - recuperações por trimestre foram adicionadas ao modelo de período;
  - nomes de alunos passaram a usar `nomeAluno(estudante)` em caixa alta nas superfícies visíveis;
  - hover do aluno passou a mostrar somente foto/avatar maior, e o painel lateral do aluno ganhou fechamento por clique externo/Escape e tabela com chips de nota.
- Ajustes feitos em `notas/css/componentes.css` e `notas/css/layouts.css`:
  - estilos aprovados dos widgets `movement*` foram escopados também para `body[data-view="notas"] .notesStatsSection`;
  - opções dos seletores de `Notas` foram ajustadas para manter descrições de recuperação na mesma linha do rótulo;
  - hover de aluno virou cartão compacto de foto maior, e o painel lateral ficou mais opaco, com maior z-index e tabela visualmente mais limpa;
  - removido CSS de impressão da antiga view `movimento`, que não existe mais no HTML.
- Ajustes feitos em `scripts/testes-notas.mjs`:
  - travas atualizadas para exigir apenas duas guias visíveis, ausência de `view-movimento`, hashes legados para `#notas`, seção analítica integrada em `Notas`, recuperações por trimestre, comportamento de `TODAS AS TURMAS`, nomes em caixa alta, painel lateral com fechamento externo e remoção da impressão separada de Estatísticas.
- Validação executada: `node scripts/testes-notas.mjs` passou com 140 estudantes fictícios, 4 turmas fictícias e 1680 lançamentos fictícios.
- Nenhum dado real de aluno, professor, CPF, INEP ou nota real foi inserido; os dados continuam fictícios.
- Nenhuma lista `NOTAS_*`, biblioteca, fluxo Power Automate, permissão, configuração Entra ID, Graph ou recurso Microsoft 365 foi criado ou alterado.
- Próxima etapa correta: validar visualmente `/notas/#notas` publicada com foco na integração completa da antiga Estatísticas abaixo da ficha; depois decidir se os próximos refinamentos continuam em `Notas` ou avançam para `Boletim`.

### 10/07/2026 — padronização dos seletores de Notas com Estatísticas

- Responsável pediu para corrigir a diferença visual entre as caixas de listagem Turma/Período da aba `Notas` e as mesmas caixas da aba `Estatísticas`, especialmente dimensões e transparência do menu aberto.
- Diagnóstico: os cards e botões de `Notas` já usavam as mesmas medidas principais de `Estatísticas`, mas o menu aberto herdava `--notes-panel`, uma superfície mais translúcida. Por isso a lista deixava o fundo da página aparecer atrás das opções.
- A etapa permaneceu restrita à SPA estática em modo demonstração; nenhum recurso Microsoft 365, Graph, SharePoint, Power Automate, lista `NOTAS_*`, permissão, configuração Entra ID ou dado real foi criado ou alterado.
- Ajustes feitos em `notas/css/componentes.css`:
  - criadas variáveis `--notes-select-menu`, `--notes-select-menu-line`, `--notes-select-menu-shadow` e variáveis de opções para os temas padrão, claro e mono;
  - menu `.statsSelectMenu` dentro de `body[data-view="notas"]` passou a usar fundo, borda e sombra próprios, alinhados ao menu de `Estatísticas`;
  - opções do menu passaram a consumir variáveis de fundo, texto, texto auxiliar, hover e ativo, mantendo contraste sem deixar a página aparecer por trás.
- Ajustes feitos em `scripts/testes-notas.mjs`:
  - adicionada trava para as dimensões dos seletores de `Notas` continuarem iguais às de `Estatísticas`;
  - adicionada trava para impedir que o menu de `Notas` volte a usar painel translúcido comum.
- Validações executadas:
  - `node --check notas/js/app.js` passou;
  - `node scripts/testes-notas.mjs` passou com 10 arquivos verificados, 140 estudantes fictícios, 4 turmas fictícias e 1680 lançamentos fictícios;
  - `git diff --check -- notas/css/componentes.css scripts/testes-notas.mjs` não apontou erro, apenas avisos esperados de LF/CRLF no Windows;
  - validação DOM local em Edge headless com viewport de notebook confirmou `Notas` e `Estatísticas` com Turma `297×84`, Período `301×84`, botões de `82px` de altura, mesma largura de menu e mesmo fundo calculado.
- Resultado observado: os seletores Turma/Período da aba `Notas` ficaram visualmente padronizados com `Estatísticas`, e o menu aberto deixou de revelar o conteúdo da página por transparência excessiva.

### 09/07/2026 — filtro compacto, temas e desempenho da tabela de Notas

- Responsável pediu para melhorar a aparência da guia de filtros da tabela, deixar o filtro mais compacto, corrigir a aplicação de cores/temas na aba `Notas` e investigar o atraso percebido ao descer a tabela.
- Diagnóstico: a tabela de `Notas` ainda participava da animação `notesRiseIn` por linha com `animation-delay` progressivo, e cada `.scorePill` tinha `scoreBreath` infinito. Com 35 alunos por turma e 12 componentes, isso criava muitas animações simultâneas e explicava a sensação de linhas aparecendo com atraso/lag na rolagem.
- A etapa permaneceu restrita à SPA estática em modo demonstração; nenhum recurso Microsoft 365, Graph, SharePoint, Power Automate, lista `NOTAS_*`, permissão, configuração Entra ID ou dado real foi criado ou alterado.
- Ajustes feitos em `notas/css/componentes.css`:
  - criada camada de variáveis específicas de `Notas` para fundo, painéis, tabela, linhas, chips, filtro, tooltip e painel lateral;
  - adicionados acabamentos explícitos para `body[data-theme="claro"][data-view="notas"]` e `body[data-theme="mono"][data-view="notas"]`;
  - botão `Imprimir ficha` passou a ter variação própria nos temas claro e mono;
  - filtro da tabela ficou mais compacto em grade de duas colunas no desktop, com largura `306px`, labels de `30px` e retorno a uma coluna no mobile;
  - tabela deixou de animar cada linha com delay progressivo;
  - `.scorePill` deixou de usar animação infinita, mantendo apenas transições de hover/foco;
  - seletores, ficha, tabela, tooltip do aluno e insights passaram a consumir variáveis de tema, reduzindo cores fixas que não acompanhavam o tema ativo.
- Ajustes feitos em `scripts/testes-notas.mjs`:
  - travas para temas claro/mono específicos da aba `Notas`;
  - travas para filtro compacto em duas colunas;
  - travas contra `animation-delay` progressivo nas linhas da tabela;
  - travas contra animação `scoreBreath` aplicada a todos os chips de nota.
- Validações executadas:
  - `node --check notas/js/app.js` passou;
  - `node scripts/testes-notas.mjs` passou com 10 arquivos verificados, 140 estudantes fictícios, 4 turmas fictícias e 1680 lançamentos fictícios;
  - `git diff --check -- notas/css/componentes.css scripts/testes-notas.mjs` não apontou erro, apenas avisos esperados de LF/CRLF no Windows.
- Validação visual/DOM local executada em `http://127.0.0.1:8094/notas/#notas` via Edge headless:
  - `rowAnimation: none`;
  - `scoreAnimation: none`;
  - `filterWidth: 306px`;
  - `filterColumns: 141px 141px`;
  - `filterLabelHeight: 30px`;
  - captura final do filtro claro: `diagnosticos/notas-tema-claro-filtro-compacto-v2.png`;
  - captura do tema mono: `diagnosticos/notas-tema-mono-v1.png`.
- Resultado observado: a aba `Notas` responde aos temas claro e mono de forma mais coerente, o filtro ocupa menos altura e a tabela não atrasa mais a aparição de linhas por animação escalonada.
- Próxima etapa correta: responsável validar `/notas/#notas` publicado no GitHub Pages; se aprovado, aplicar a mesma regra de desempenho a futuras tabelas/filtros do módulo.

### 09/07/2026 — correção de legibilidade dos overlays da aba Notas

- Responsável deixou dois prints na Área de Trabalho indicando que a prévia ao passar o mouse no nome do aluno e o popover de `Filtros` ainda estavam ilegíveis; também pediu remover a duplicidade `Ficha de notas`, remover a frase `Regra demonstrativa: 18/30, 18/30, 24/40...`, suavizar o foco cruzado linha × coluna e condensar mais a altura da tabela.
- A etapa permaneceu restrita à SPA estática em modo demonstração; nenhum recurso Microsoft 365, Graph, SharePoint, Power Automate, lista `NOTAS_*`, permissão, configuração Entra ID ou dado real foi criado ou alterado.
- Prints usados como referência:
  - `C:\Users\Eugui\Desktop\Captura de tela 2026-07-09 165655.png`;
  - `C:\Users\Eugui\Desktop\Captura de tela 2026-07-09 165716.png`.
- Ajustes feitos em `notas/index.html`:
  - removido o `sectionKicker` duplicado `Ficha de notas`, mantendo apenas o título principal da ficha;
  - removida a frase da regra demonstrativa da linha de anotações da tabela;
  - labels do filtro receberam `span` próprio para permitir controle visual mais robusto.
- Ajustes feitos em `notas/css/componentes.css`:
  - popover de `Filtros` passou a usar painel claro de alto contraste, uma coluna, controles maiores, checkboxes customizados e z-index acima da tabela;
  - linha de metadados da tabela e linha ativa receberam hierarquia de camadas para impedir que a tabela pinte por cima de popovers/tooltips;
  - prévia do aluno passou a abrir abaixo da célula do nome, com fundo opaco, largura maior, chips em duas colunas, tipografia maior e z-index superior;
  - destaque cruzado de coluna foi suavizado para reduzir o incômodo visual do foco célula/linha/coluna;
  - tabela ficou mais compacta com `border-spacing: 0 2px`, menor padding e pílulas ligeiramente mais baixas.
- Ajustes feitos em `notas/js/app.js`:
  - texto da prévia do aluno passou a mostrar `Turma · Status · Média X`;
  - chips da prévia passaram de `P 11,0` para `P: 11,0`, melhorando leitura rápida.
- Ajustes feitos em `scripts/testes-notas.mjs`:
  - travas para impedir retorno da regra demonstrativa e da duplicidade do título;
  - travas para filtro de alto contraste acima da tabela, tooltip opaco acima das linhas e nova densidade `0 2px`.
- Decisão registrada na seção 11.5: overlays sobre tabelas devem ser opacos, legíveis e com camada suficiente; popovers de filtro devem ter controles grandes e estado marcado evidente; textos auxiliares que competem com o dado principal devem sair da ficha.
- Pendência atualizada na seção 17 para incluir validação específica da revisão dos prints de 09/07/2026 antes de considerar a aba `Notas` visualmente fechada.
- Validações executadas:
  - `node --check notas/js/app.js` passou;
  - `node scripts/testes-notas.mjs` passou com 10 arquivos verificados, 140 estudantes fictícios, 4 turmas fictícias e 1680 lançamentos fictícios;
  - `git diff --check -- notas/index.html notas/css/componentes.css notas/js/app.js scripts/testes-notas.mjs notas/AGENTS_NOTAS.md` não apontou erro, apenas avisos esperados de LF/CRLF no Windows.
- Validação visual local executada em `http://127.0.0.1:8094/notas/#notas`:
  - captura base: `diagnosticos/notas-revisao-prints-base.png`;
  - captura final do filtro aberto: `diagnosticos/notas-revisao-prints-filtro-v3.png`;
  - captura final do hover do aluno: `diagnosticos/notas-revisao-prints-hover-aluno-v3.png`.
- Resultado visual observado: o título não aparece duplicado, a regra demonstrativa saiu da superfície principal, o filtro fica legível em painel claro de alto contraste, a prévia do aluno não é coberta pelas linhas seguintes e a tabela exibe mais linhas com menos peso no destaque cruzado.
- Próxima etapa correta: responsável validar `/notas/#notas` publicado no GitHub Pages; se aprovado, manter esse padrão para os próximos overlays da aba `Boletim` e para qualquer filtro/tooltip novo do ecossistema.

### 09/07/2026 — refinamentos `aqui6.txt` em Estatísticas e Notas

- Responsável pediu para executar `C:\Users\Eugui\Desktop\aqui6.txt`, com refinamentos na aba `Estatísticas` e na aba `Notas`.
- A etapa permaneceu restrita à SPA estática em modo demonstração; nenhum recurso Microsoft 365, Graph, SharePoint, Power Automate, lista `NOTAS_*`, permissão ou dado real foi criado ou alterado.
- Referência visual reaberta: `C:\Users\Eugui\Desktop\imagens\anexo 12.png`, mostrando as barras do gráfico de `Estatísticas` com rótulos invadindo a área do cabeçalho/legenda.
- Ajustes feitos em `notas/css/componentes.css` para `Estatísticas`:
  - `statsChartCanvas` passou a reservar respiro superior para rótulos das barras;
  - altura útil das barras foi recalibrada para evitar sobreposição com o cabeçalho do gráfico;
  - itens do ranking receberam altura fixa por linha e `grid-auto-rows`, mantendo a mesma altura visual antes e depois de `VER TOP 10`;
  - donut recebeu relevo 3D sutil com borda, sombra inferior, brilho e sombra interna no anel, sem girar percentual nem sair da linguagem visual atual.
- Ajustes feitos em `notas/css/componentes.css` e `notas/css/layouts.css` para `Notas`:
  - tabela foi compactada com menor espaçamento entre linhas, menor padding e pílulas mais densas;
  - pílulas de `Status` passaram a manter rótulos como `ESTAVA NO 7B` em linha única;
  - modal temporário do aluno recebeu fundo mais escuro, opaco e com z-index alto;
  - painel lateral de insights ficou mais estreito no desktop e volta a uma coluna abaixo da tabela em telas menores;
  - lista de alunos em atenção ficou mais limpa, sem a nota numérica à direita.
- Ajustes feitos em `notas/js/app.js`:
  - destaque de coluna em `Notas` passou a ocorrer somente nas colunas de notas, não em `Nº`, `Status`, `Aluno` ou `Resultado`;
  - renderização dos insights deixou de criar o badge numérico lateral de menor nota.
- Ajustes feitos em `scripts/testes-notas.mjs`:
  - travas para destaque restrito às colunas de notas;
  - travas para tabela compacta, status em linha única, hover do aluno opaco, ranking com altura fixa, respiro superior do gráfico, relevo do donut e coluna lateral mais estreita.
- Validações executadas:
  - `node --check notas/js/app.js` passou;
  - `node scripts/testes-notas.mjs` passou com 10 arquivos verificados, 140 estudantes fictícios, 4 turmas fictícias e 1680 lançamentos fictícios;
  - `git diff --check -- notas/css/layouts.css notas/css/componentes.css notas/js/app.js scripts/testes-notas.mjs` não apontou erro, apenas avisos esperados de LF/CRLF no Windows.
- Capturas Playwright geradas no servidor local `http://127.0.0.1:8093/notas/`:
  - antes: `diagnosticos/notas-aqui6-estatisticas-antes-estavel.png` e `diagnosticos/notas-aqui6-notas-antes-estavel.png`;
  - depois: `diagnosticos/notas-aqui6-estatisticas-v1.png`, `diagnosticos/notas-aqui6-notas-v1.png`, `diagnosticos/notas-aqui6-notas-mobile-v2.png` e `diagnosticos/notas-aqui6-notas-mobile-full-v1.png`.
- Resultado visual observado: no desktop, o gráfico de `Estatísticas` não encosta mais os rótulos na legenda, o donut ganhou profundidade e a tabela de `Notas` mostra mais linhas sem quebrar os status; no mobile, os insights de `Notas` permanecem abaixo da ficha sem sobrepor a tabela.
- Próxima etapa correta: responsável validar `/notas/#estatisticas` e `/notas/#notas` publicados no GitHub Pages; se aprovados, seguir para novo refinamento solicitado ou para a aba `Boletim`.

### 09/07/2026 — revisão `aqui5.txt` da aba Notas

- Responsável pediu para ler `C:\Users\Eugui\Desktop\aqui5.txt` porque a entrega anterior ainda não seguia o `aqui4.txt` com fidelidade suficiente.
- A etapa permaneceu restrita à SPA estática em modo demonstração; nenhum recurso Microsoft 365, Graph, SharePoint, Power Automate, lista `NOTAS_*`, permissão ou dado real foi criado ou alterado.
- Referência visual reaberta: `C:\Users\Eugui\Desktop\imagens\anexo 11.png`, identificada como um botão/ícone grande de impressão que aparecia durante carregamento incorreto de aba.
- Ajustes feitos em `notas/index.html`:
  - removido `active` fixo da `pageView` de `Estatísticas`, deixando o roteamento JS decidir a view inicial;
  - cabeçalho interno da ficha de `Notas` foi simplificado para não repetir a seção superior do shell;
  - removido o bloco `notesSummary`/dashboard de cards da ficha;
  - filtro de situação foi movido para a linha de anotações da tabela;
  - selects de `Notas` receberam labels acessíveis e rótulos visuais em caixa alta no padrão de `Estatísticas`.
- Ajustes feitos em `notas/js/app.js`:
  - `Notas` passou a usar subtitle superior com turma, período e `35 aluno(s) no recorte`;
  - seletor de turma da aba passou para rótulos `TODAS AS TURMAS`/`8º ANO C` no mesmo padrão de `Estatísticas`;
  - removidos `renderNotesSummary()` e referências ao resumo antigo;
  - insights laterais passaram a ter título direto `Insights da turma`, bloco `Alunos em atenção (abaixo do mínimo)` e segunda seção de disciplinas com mais notas abaixo do mínimo.
- Ajustes feitos em `notas/js/demo-data.js`:
  - fixtures passaram de 10 para 35 alunos fictícios por turma, totalizando 140 estudantes fictícios e 1680 lançamentos;
  - nomes continuam fictícios, com aparência de nomes reais, sem copiar nomes reais, CPF, INEP ou dados dos anexos;
  - situações operacionais demonstrativas continuam distribuindo regular, transferido, desistente, novato, `foi para` e `estava no`.
- Ajustes feitos em `notas/css/componentes.css`:
  - seletores da aba `Notas` foram aproximados dos tamanhos de `Estatísticas`;
  - hover/modal do aluno ganhou fundo opaco, z-index maior e overflow visível no quadro;
  - filtro compacto passou a se alinhar à linha de anotações da tabela;
  - regras antigas de `notesSummary`/`notesBoardActions` foram removidas;
  - painel de insights foi limpo para se aproximar do `anexo 10.png`.
- Ajustes feitos em `scripts/testes-notas.mjs`:
  - travas contra `.pageView active` fixo no HTML;
  - travas contra retorno de `notesSummary`/`renderNotesSummary`;
  - travas para 35 alunos fictícios por turma, anotações compactas da tabela e hover opaco do aluno.
- Validações executadas:
  - `node --check notas/js/app.js` passou;
  - `node --check notas/js/demo-data.js` passou;
  - `node scripts/testes-notas.mjs` passou com 10 arquivos verificados, 140 estudantes fictícios, 4 turmas fictícias e 1680 lançamentos fictícios;
  - `git diff --check -- notas/index.html notas/js/app.js notas/js/demo-data.js notas/css/componentes.css scripts/testes-notas.mjs` não apontou erro, apenas avisos esperados de LF/CRLF no Windows.
- Capturas Playwright geradas no servidor local `http://127.0.0.1:8093/notas/#notas`:
  - `diagnosticos/notas-aqui5-desktop.png`;
  - `diagnosticos/notas-aqui5-mobile.png`;
  - `diagnosticos/notas-aqui5-mobile-full.png`.
- Resultado visual observado: desktop preserva menu lateral e cabeçalho comum, dois seletores no padrão de `Estatísticas`, botão de impressão, ficha com filtro compacto, tabela com 35 alunos e insights laterais; mobile preserva navegação superior compacta, controles empilhados e rolagem horizontal confinada à tabela.
- Próxima etapa correta: responsável validar `/notas/#notas` publicada no GitHub Pages; se aprovada, seguir para refinamento fino da aba `Boletim` ou para outra etapa explicitamente autorizada do módulo.

### 09/07/2026 — remodelagem `aqui4.txt` da aba Notas

- Responsável pediu para ler `C:\Users\Eugui\Desktop\aqui4.txt` e remodelar a aba `Notas` com a padronização visual de `Estatísticas`, mais movimento, nomes/notas fictícios completos, regra demonstrativa anual e correção de possível flash em `Estatísticas`.
- A etapa permaneceu restrita à SPA estática em modo demonstração; nenhum recurso Microsoft 365, Graph, SharePoint, Power Automate, lista `NOTAS_*`, permissão ou dado real foi criado ou alterado.
- Referências locais reabertas: `anexo 8.png` para pílulas de status, `anexo 9.png` para pílulas de resultado e `anexo 10.png` para painel de insights sem recolhimento.
- Ajustes feitos em `notas/index.html`:
  - aba `Notas` passou a usar linha superior com seletores customizados de turma/período e botão `Imprimir ficha`, no mesmo padrão de `Estatísticas`;
  - removidos a faixa externa de filtros e o strip de cards que não faziam parte do novo prompt;
  - filtros de situação foram movidos para um botão compacto no cabeçalho da ficha de notas;
  - painel lateral foi reduzido para insights da turma, sem seção separada de lista filtrável/recuperação.
- Ajustes feitos em `notas/js/app.js`:
  - inicialização/renderização passou a chamar apenas a view ativa, mitigando flash de conteúdo de outra aba;
  - adicionados `toggleNotasFilterMenu()`, `closeNotasFilterMenu()`, `highlightNotesColumn()` e `imprimirRelatorioNotas()`;
  - tabela passou para as colunas `Nº`, `Status`, `Aluno`, componentes e `Resultado`, com pílulas de status, notas e resultado;
  - insights passaram a listar alunos com nota vermelha e disciplinas com mais notas abaixo do mínimo, sem botão de expandir/recolher;
  - perfil/hover do aluno passou a usar avatar fictício gerado por CSS, mantendo mini informações.
- Ajustes feitos em `notas/js/demo-data.js` e `notas/js/domain.js`:
  - fixtures passaram a usar 40 nomes fictícios completos;
  - notas fictícias foram geradas para os três trimestres, recuperação e nota final;
  - regra demonstrativa anual passou a contemplar `APROVADO DIRETO`, `APROVADO APÓS RECUPERAÇÃO`, `APROVADO PELO CONSELHO`, `REPROVADO PELO CONSELHO` e `REPROVADO`.
- Ajustes feitos em `notas/css/componentes.css` e `notas/css/layouts.css`:
  - substituído o bloco visual antigo da aba `Notas` por layout de ficha viva, com seletores grandes, botão de impressão, painel glass, pílulas arredondadas, animações de entrada/movimento leve, filtro flutuante e rolagem horizontal confinada à tabela no mobile;
  - adicionada impressão própria para `body[data-print-view="notas"]`.
- Ajustes feitos em `scripts/testes-notas.mjs`:
  - testes passaram a validar filtro compacto, impressão própria, pílulas de status/resultado, destaque de coluna, ausência de `Lista filtrável` e presença dos cinco resultados fictícios.
- Validações executadas:
  - `node --check notas/js/app.js` passou;
  - `node --check notas/js/demo-data.js` e `node --check notas/js/domain.js` passaram;
  - `node scripts/testes-notas.mjs` passou com 10 arquivos verificados, 40 estudantes fictícios, 4 turmas fictícias e 480 lançamentos fictícios;
  - `git diff --check -- notas/index.html notas/js/app.js notas/js/demo-data.js notas/js/domain.js notas/css/componentes.css notas/css/layouts.css scripts/testes-notas.mjs` não apontou erro; apenas avisos esperados de LF/CRLF no Windows.
- Capturas Playwright geradas em servidor local `http://127.0.0.1:8093/notas/#notas`:
  - `diagnosticos/notas-aqui4-desktop-v2.png`;
  - `diagnosticos/notas-aqui4-mobile-v2.png`;
  - `diagnosticos/notas-aqui4-mobile-full-v2.png`.
- Resultado visual observado: desktop com menu lateral, cabeçalho comum, seletores, impressão, tabela principal e insights laterais; mobile com controles grandes, tabela confinada ao quadro e insights abaixo da ficha.
- Próxima etapa correta: responsável validar `/notas/#notas` publicada no GitHub Pages; se aprovada, aplicar o mesmo padrão de ficha/tabela/filtro às próximas tabelas do ecossistema e seguir para ajustes finos do Boletim ou para a POC final do conector Excel Online (Business), conforme prioridade.

### 08/07/2026 — primeira remodelagem da aba Notas

- Responsável considerou a aba `Estatísticas` finalizada por enquanto e pediu para começar a remodelar a aba `Notas`.
- A etapa continuou restrita à SPA estática em modo demonstração; nenhum recurso Microsoft 365, Graph, SharePoint, Power Automate, lista `NOTAS_*`, permissão ou dado real foi criado ou alterado.
- Ajustes feitos em `notas/index.html`:
  - selects de turma/período da aba `Notas` foram trocados para hosts `notesSelectCard statsSelectCard`, reaproveitando o seletor customizado sincronizado já aprovado em `Estatísticas`;
  - painel de filtros recebeu classe própria `notesFilterPanel`;
  - painel principal da tabela recebeu `notesBoardModern`;
  - painéis de insights e recuperação receberam `notesSidePanel`.
- Ajustes feitos em `notas/js/app.js`:
  - `statsSelectIconName()` passou a detectar qualquer seletor de período, permitindo ícones também em `Notas`;
  - `renderNotas()` passou a preservar o título/subtítulo do cabeçalho superior quando a aba ativa é `Notas`;
  - `renderMovimento()` deixou de sobrescrever o cabeçalho superior quando outra view está ativa;
  - métricas de `Notas` passaram a usar `notesMetricCard()` com ícones e badges próprios;
  - insights por disciplina passaram a usar ícones de componente;
  - lista de recuperação passou a usar avatares fictícios e layout em linha;
  - linhas da tabela receberam `--row-index` para entrada escalonada.
- Ajustes feitos em CSS:
  - criada linguagem visual escopada em `body[data-view="notas"]`, com superfícies glass, seletor customizado, cards com ícones, filtros em chips, tabela com linhas arredondadas e side panels mais modernos;
  - tabela no mobile voltou a rolar apenas dentro de `notesTableWrap`, sem alargar a página inteira;
  - painel lateral de perfil do aluno passou a ficar invisível e sem interação quando fechado, evitando overflow lateral em capturas/telas estreitas;
  - adicionada animação `notesRiseIn` para cards, painéis e linhas.
- Ajustes feitos em `scripts/testes-notas.mjs`:
  - travas para seletores customizados na aba `Notas`, cards próprios, preservação de cabeçalho ativo, tratamento de recuperação, CSS de métricas/seletores, tabela responsiva e animação `notesRiseIn`.
- Capturas de conferência geradas:
  - `diagnosticos/notas-aba-notas-antes-desktop.png`;
  - `diagnosticos/notas-aba-notas-antes-mobile.png`;
  - `diagnosticos/notas-aba-notas-remodelada-desktop.png`;
  - `diagnosticos/notas-aba-notas-remodelada-mobile.png`;
  - `diagnosticos/notas-aba-notas-remodelada-mobile-full.png`.
- Validações executadas:
  - `node --check notas/js/app.js` passou;
  - `node scripts/testes-notas.mjs` passou com 10 arquivos verificados, 40 estudantes fictícios, 4 turmas fictícias e 480 lançamentos fictícios;
  - `git diff --check -- notas/index.html notas/js/app.js notas/css/componentes.css notas/css/layouts.css scripts/testes-notas.mjs` não apontou erros, apenas avisos esperados de LF/CRLF no Windows.

### 08/07/2026 — refinamento visual `aqui3.txt` da aba Estatísticas

- Responsável pediu para ler `C:\Users\Eugui\Desktop\aqui3.txt` e corrigir refinamentos visuais da aba `Estatísticas`.
- A etapa continuou restrita à SPA estática em modo demonstração; nenhum recurso Microsoft 365, Graph, SharePoint, Power Automate, lista `NOTAS_*`, permissão ou dado real foi criado ou alterado.
- Ajustes feitos em `notas/js/app.js`:
  - seletores customizados de turma/período passaram a renderizar ícones no próprio controle;
  - gráfico de desempenho por disciplina passou a calcular `maxEixo` pelo maior valor real das barras do recorte, evitando eixo artificialmente alto e barras baixas demais;
  - adicionada função `calcularMaxEixoMovimento()` para centralizar essa regra.
- Ajustes feitos em `notas/css/componentes.css`:
  - brilho do donut e dos pontos de legenda foi suavizado;
  - centro do donut foi limpo, mantendo o percentual sem mancha visual atrás do texto;
  - anel do donut passou a alternar tons por `donutToneFlow`, sem girar percentual;
  - barras azul/vermelha passaram a alternar lentamente tons internos do próprio corpo da barra, com menos brilho artificial;
  - cards do dashboard receberam ícones mais explícitos e nomes um pouco maiores, com quebra confortável;
  - ranking top 10 mantém altura reservada para não deslocar os três primeiros ao expandir;
  - menu de perfil recebeu animação `profileMenuEnter`, blur e sombra compatíveis com os demais painéis.
- Ajustes feitos em `scripts/testes-notas.mjs`:
  - travas para ícones nos seletores, escala dinâmica do gráfico, entrada animada do perfil e `donutToneFlow`.
- Capturas de conferência geradas:
  - `diagnosticos/notas-estatisticas-aqui3-desktop.png`;
  - `diagnosticos/notas-estatisticas-aqui3-mobile.png`;
  - `diagnosticos/notas-estatisticas-aqui3-mobile-full.png`.
- Validações executadas nesta etapa:
  - `node --check notas/js/app.js` passou;
  - `node scripts/testes-notas.mjs` passou com 10 arquivos verificados, 40 estudantes fictícios, 4 turmas fictícias e 480 lançamentos fictícios;
  - `git diff --check -- notas/index.html notas/js/app.js notas/css/componentes.css notas/css/layouts.css scripts/testes-notas.mjs` não apontou erros, apenas avisos esperados de LF/CRLF no Windows.

### 08/07/2026 — acabamento `aqui2.txt` da aba Estatísticas

- Responsável pediu para ler `C:\Users\Eugui\Desktop\aqui2.txt` e concluir ações pendentes da aba `Estatísticas`, ainda sem avançar para dados reais.
- O pedido foi tratado como refinamento visual/interativo local da SPA; nenhum recurso Microsoft 365, Graph, SharePoint, Power Automate, lista `NOTAS_*`, permissão ou dado real foi criado ou alterado.
- Ajustes feitos em `notas/index.html`:
  - busca global deixou de ser apenas campo visual e ganhou painel próprio `globalSearchResults`, com `aria-controls`, `aria-expanded` e fechamento controlado pelo script;
  - removidos indicadores `ⓘ` sem função da seção `DESEMPENHO POR DISCIPLINA` e do rodapé do gráfico;
  - legenda do gráfico passou para `NOTAS AZUIS` e `NOTAS VERMELHAS`.
- Ajustes feitos em `notas/js/app.js`:
  - busca global passou a abrir resultados de alunos, turmas e disciplinas em painel abaixo do campo, sem re-renderizar a página a cada tecla; clique fora fecha o painel e limpa o texto;
  - menu de perfil passou a fechar ao clicar fora ou pressionar `Escape`;
  - seletor customizado de `Estatísticas` deixou de exibir descrições técnicas como `T1`, `T2`, `T3` e `GERAL` no menu visual;
  - cartões de dashboard passaram para `NOTAS AZUIS`, `NOTAS VERMELHAS`, total de alunos e `MÉDIA DA TURMA`, com cálculo real em `mediaTurma`;
  - ranking `Destaques da turma` mantém top 10 no DOM, expande/recolhe dentro da própria caixa, usa texto `VER TOP 10` e substitui os círculos numerados por avatares fictícios com bordas ouro/prata/bronze no pódio;
  - clique em disciplina no gráfico passou a abrir relatório contextual abaixo com alunos fictícios que possuem nota vermelha naquela disciplina/período.
- Ajustes feitos em CSS:
  - busca recebeu painel animado, estado vazio compacto e resultado com ícones por tipo;
  - botão de perfil ficou alinhado à altura da busca, e os pontos de tema no menu voltaram a ficar visíveis;
  - ranking ganhou altura fixa, rolagem vertical moderna somente quando expandido, sem barra horizontal e sem deslocamento da página;
  - donut recebeu camadas de profundidade, brilho e movimento leve sem girar o percentual;
  - barras azul/vermelha ganharam fluxo de cor mais perceptível, e o painel de disciplina recebeu card visual próprio para notas vermelhas;
  - cards do dashboard foram alinhados à altura de `Destaques da turma` no desktop e preservados em duas colunas no mobile.
- Capturas de conferência geradas:
  - `diagnosticos/notas-estatisticas-aqui2-desktop.png`;
  - `diagnosticos/notas-estatisticas-aqui2-mobile.png`.
- Testes/travas atualizados em `scripts/testes-notas.mjs` para cobrir busca global, remoção dos indicadores sem função, ranking top 10 interno, seletor customizado sem códigos técnicos na descrição, linguagem de notas azuis/vermelhas, média real da turma, relatório por disciplina, rolagem estável do ranking e novo movimento/profundidade do donut.

### 08/07/2026 — finalização de Estatísticas por soma, temas e impressão própria

- Responsável pediu para ler `C:\Users\Eugui\Desktop\aqui.txt` e finalizar a aba `Estatísticas` antes de avançar para outras abas.
- O pedido autorizou um pacote amplo de finalização/usabilidade e reforçou regras permanentes:
  - o sistema de notas é baseado em soma/pontuação/mínimo; usar `média` somente quando houver cálculo real de média;
  - mudanças visuais/estéticas aprovadas devem orientar futuras abas e recursos para padronizar o ecossistema;
  - a aba `Estatísticas` não deve conter lista nominal de alunos abaixo do mínimo.
- Referências oficiais revisadas para orientar a adaptação visual sem copiar marcas/ativos:
  - Samsung One UI Motion Introduction e Motion basics;
  - Samsung One UI Visual depth;
  - Samsung One UI Layout design for large screens;
  - Android Material 3 e Dynamic colors.
- Não foi encontrada documentação oficial pública específica chamada `One UI 8.5`; a implementação continuou baseada nos princípios oficiais atuais: movimento com causa/efeito, profundidade leve, responsividade em telas grandes, foco na tarefa, cor adaptativa e acessibilidade.
- Ajustes feitos em `notas/index.html`:
  - removidos botões sem uso da área de Estatísticas: três pontos do topo e ferramentas `Exibir valores`/três pontos do gráfico;
  - tema visual movido para dentro do menu de perfil;
  - cabeçalho inicial trocado para `Movimento estatístico escolar`, evitando o texto antigo `Escola Municipal / Sistema Acadêmico`;
  - rodapé deixou de carregar data demo fixa e passa a ser preenchido pela renderização atual.
- Ajustes feitos em `notas/js/app.js`:
  - rodapé `Atualizado em ...` passou a usar a data/hora atual da renderização;
  - impressão de `Estatísticas` passou a usar `imprimirRelatorioMovimento()` e `body[data-print-view="movimento"]`, sem acionar a impressão de `Boletim`;
  - cartões trocaram linguagem de média para `ACIMA OU IGUAL AO MÍNIMO`, `ABAIXO DO MÍNIMO` e `SOMA DO RECORTE`;
  - ranking `Destaques da turma` passou a ordenar por `somaPeriodoEstudante()`, mostrar top 3/top 10 pelo mesmo botão e indicar recuperação em componente com texto compacto;
  - lista nominal de alunos abaixo do mínimo foi removida da aba; permaneceu apenas o resumo quantitativo por turma quando o recorte pedir;
  - `#estatisticas` segue como hash canônico e `#movimento` permanece compatível.
- Ajustes feitos em CSS:
  - topo de `Estatísticas` passou a usar o título/descrição da própria aba no `systemBar`, sem logo institucional nessa view;
  - caixa de busca deixou de mudar borda/sombra ao focar;
  - seletores customizados ganharam rolagem, menu menos transparente e padronização de altura/texto para `TODAS AS TURMAS`;
  - cards/painéis receberam raios mais generosos, superfícies translúcidas, sombras e estados de pressão/hover consistentes;
  - barras azul/vermelha ganharam transição lenta de cor via `blueBarFlow`/`redBarFlow`;
  - percentual do donut deixou de girar; permanece apenas respiração leve do contêiner;
  - temas claro e mono receberam overrides específicos para background, painéis, menus, textos, donut, barras e botão de impressão;
  - relatório de impressão próprio para `Estatísticas` foi definido em `@media print`.
- Ajustes feitos em `scripts/testes-notas.mjs`:
  - travas para temas no perfil, remoção dos botões sem uso, ausência de data demo fixa, soma/pontuação/mínimo, impressão própria de Estatísticas, animações das barras, donut sem rotação e CSS de temas claro/mono.
- Validações executadas:
  - `node --check notas/js/app.js` passou;
  - `node scripts/testes-notas.mjs` passou com 10 arquivos verificados, 40 estudantes fictícios, 4 turmas fictícias e 480 lançamentos fictícios;
  - `git diff --check -- notas/index.html notas/js/app.js notas/css/componentes.css notas/css/layouts.css scripts/testes-notas.mjs` não apontou erros; apenas avisos esperados de LF/CRLF no Windows.
- Capturas Playwright CLI geradas:
  - `diagnosticos/notas-estatisticas-finalizacao-desktop.png` em desktop 1420×941;
  - `diagnosticos/notas-estatisticas-finalizacao-mobile.png` em mobile 390×844.
- Resultado visual observado: menu lateral e navegação mobile permanecem visíveis, o título está no cabeçalho superior, a busca/perfil ficam no shell comum, os seletores e botão de relatório ocupam o topo da aba, os cards/ranking/gráfico/donut renderizam sem sobreposição evidente.
- Nenhum dado real de aluno, professor, CPF, INEP ou nota real foi inserido; os dados continuam fictícios.
- Nenhuma lista `NOTAS_*`, biblioteca, fluxo Power Automate, permissão, configuração Entra ID, Graph ou recurso Microsoft 365 foi criado ou alterado.
- Próxima etapa correta: responsável validar `/notas/#estatisticas` publicada; se aprovada, aplicar o mesmo padrão visual/movimento/seletores/temas nas próximas evoluções de `Notas` e `Boletim`.

### 08/07/2026 — movimento, microinterações e seletor customizado em Estatísticas

- Responsável informou que a interface ainda parecia estática e pediu transições, animações em botões/cards, seletores mais bonitos e uma estética mais viva, com referência geral a Android/One UI.
- Foi feita consulta em documentação oficial pública da Samsung One UI e Android/Material:
  - One UI Motion Introduction;
  - One UI Motion basics and usage;
  - One UI Visual depth;
  - One UI Layout design for large screens;
  - Android Material 3 em Compose/large screens.
- Não foi encontrada documentação oficial pública específica chamada `One UI 8.5`; a implementação foi baseada nos princípios oficiais atuais já usados no projeto: movimento com causa/efeito, profundidade leve, responsividade em telas grandes, foco na tarefa e respeito a acessibilidade.
- Decisão visual registrada na seção 11.5: toda mudança visual nova no módulo deve considerar microinterações, movimento proporcional, seletor customizado quando o `select` nativo destoar, entrada animada de dashboards e `prefers-reduced-motion`.
- Ajustes feitos em `notas/index.html`:
  - os seletores de Turma e Período da aba `Estatísticas` passaram de `label` com `select` nativo visível para hosts `statsSelectCard` com `data-stats-select-label`;
  - os `<select>` reais continuam no DOM e com `aria-label`, preservando sincronização, valores e lógica existente.
- Ajustes feitos em `notas/js/app.js`:
  - adicionado `enhanceStatsSelects()` para criar seletor customizado sincronizado com o `<select>` real;
  - implementados abertura/fechamento, clique fora, tecla `Esc`, navegação por setas, `Home`, `End`, `Enter` e `Space`;
  - seleção customizada dispara `change` no `<select>` real, reaproveitando o fluxo já existente de renderização;
  - gráfico e ranking receberam índices CSS para animação escalonada.
- Ajustes feitos em CSS:
  - `notas/css/tokens.css` recebeu tokens de movimento e sombra elevada;
  - `notas/css/base.css` recebeu transição de entrada para views e manteve fallback global por `prefers-reduced-motion`;
  - `notas/css/componentes.css` recebeu microinterações globais em botões/cards, seletor customizado de `Estatísticas`, menu com blur/profundidade, entrada de painéis, brilho leve, crescimento das barras, movimento lento nas barras/donut e animação de ranking/detalhes.
- Ajustes feitos em `scripts/testes-notas.mjs`:
  - travas para hosts de seletor customizado, funções `enhanceStatsSelects`/`openStatsSelect`/`chooseStatsSelectOption`, tokens de movimento, `prefers-reduced-motion`, menu customizado e keyframes de gráfico/donut.
- Validações executadas:
  - `node --check notas/js/app.js` passou;
  - `node scripts/testes-notas.mjs` passou com 10 arquivos verificados, 40 estudantes fictícios, 4 turmas fictícias e 480 lançamentos fictícios;
  - `git diff --check -- notas scripts/testes-notas.mjs` não apontou erros; apenas avisos esperados de LF/CRLF no Windows.
- Capturas Playwright CLI geradas:
  - `diagnosticos/notas-estatisticas-motion-v2.png` em desktop 1420×941;
  - `diagnosticos/notas-estatisticas-motion-v2-mobile.png` em mobile 390×844.
- Limitação de validação: a CLI `playwright screenshot` não executa clique antes da captura; o pacote `playwright` não ficou resolvível por `npx --package` sem instalar dependência local. Não foi adicionada dependência ao projeto apenas para capturar o menu aberto.
- Nenhum dado real de aluno, professor, CPF, INEP ou nota real foi inserido; os dados continuam fictícios.
- Nenhuma lista `NOTAS_*`, biblioteca, fluxo Power Automate, permissão, configuração Entra ID, Graph ou recurso Microsoft 365 foi criado ou alterado.
- Próxima etapa correta: responsável testar no navegador a abertura dos seletores de Turma/Período em `/notas/#estatisticas`; se aprovado, aplicar a mesma regra de movimento aos controles restantes de `Notas` e `Boletim` conforme forem evoluídos.

### 08/07/2026 — funcionalização da aba Estatísticas

- Responsável autorizou avançar com a recomendação de tornar `Estatísticas` funcional, mantendo a documentação permanente nos agents.
- Confirmado que a regra de documentar mudanças já existia neste arquivo:
  - seção 1, item 10: ao terminar uma etapa, atualizar **Estado atual**, **Decisões**, **Pendências** e **Registro de continuidade**;
  - seção 18, bloco `Ao concluir`: registrar arquivos alterados/resultados, atualizar checklist/pendências/decisões e fazer commit/push por padrão em `/notas/`.
- `notas/AGENTS.md` recebeu uma regra curta adicional de documentação para deixar explícito, logo na entrada do módulo, que toda etapa deve atualizar `AGENTS_NOTAS.md` antes do commit/push.
- Ajustes feitos em `notas/index.html`:
  - adicionada opção `VISÃO GERAL` ao seletor de período da aba `Estatísticas`;
  - rodapé estatístico recebeu IDs para atualizar período e horário conforme o recorte;
  - painel inferior passou a ter título, subtítulo e dica dinâmicos para detalhamento por disciplina ou resumo quantitativo.
- Ajustes feitos em `notas/js/app.js`:
  - criado o recorte calculado de `Estatísticas` por turma, período e busca global, usando os dados fictícios de `demo-data.js`/`domain.js`;
  - adicionada a opção `TODAS AS TURMAS` no seletor da aba;
  - cartões passaram a recalcular alunos acima/abaixo da média, total no recorte e média geral;
  - gráfico por disciplina passou a recalcular azul/vermelho pelo recorte, destacar a disciplina clicada e abrir lista de alunos fictícios abaixo da média;
  - donut passou a recalcular percentuais do recorte selecionado;
  - ranking passou a alternar top 3/top 10, ordenar pela média do período e sinalizar nomes com nota vermelha;
  - recorte `VISÃO GERAL` ou `TODAS AS TURMAS` passa a exibir resumo quantitativo por turma no painel inferior;
  - removido o objeto estático antigo `movimentoReferencia`, mantendo apenas fallback de data/hora demonstrativo.
- Ajustes feitos em `notas/css/componentes.css`:
  - disciplina selecionada no gráfico recebeu destaque visual;
  - painel de detalhamento quantitativo ganhou estilo próprio;
  - grade do gráfico foi corrigida para 12 componentes, evitando que `CPT` caísse para outra linha no desktop;
  - rótulos das disciplinas foram compactados para evitar sobreposição visual.
- Ajustes feitos em `scripts/testes-notas.mjs`:
  - travas para `VISÃO GERAL`, recorte calculado, seleção de disciplina, ranking top 3/top 10, painel de detalhamento, remoção de `movimentoReferencia`, destaque da barra ativa e estilo do painel.
- Validações executadas:
  - `node --check notas/js/app.js` passou;
  - `node scripts/testes-notas.mjs` passou com 10 arquivos verificados, 40 estudantes fictícios, 4 turmas fictícias e 480 lançamentos fictícios;
  - `git diff --check -- notas scripts/testes-notas.mjs` não apontou erros; apenas avisos esperados de LF/CRLF no Windows.
- Capturas Playwright CLI geradas para comparação:
  - `diagnosticos/notas-estatisticas-funcional-v5.png` em desktop 1420×941;
  - `diagnosticos/notas-estatisticas-funcional-v3-mobile.png` em mobile 390×844;
  - `diagnosticos/notas-estatisticas-funcional-v3-mobile-full.png` em mobile full-page.
- Resultado visual: desktop mantém cabeçalho superior, navegação lateral, cards, ranking, gráfico com 12 disciplinas na mesma linha e donut; mobile mantém navegação compacta no topo e gráfico com rolagem horizontal.
- Nenhum dado real de aluno, professor, CPF, INEP ou nota real foi inserido; os dados continuam fictícios.
- Nenhuma lista `NOTAS_*`, biblioteca, fluxo Power Automate, permissão, configuração Entra ID, Graph ou recurso Microsoft 365 foi criado ou alterado.
- Próxima etapa correta: responsável validar a página publicada em `/notas/#estatisticas`; se aprovada, seguir para ajuste fino de `Notas`/`Boletim` ou retomar a POC final do conector Excel Online (Business), conforme prioridade.

### 08/07/2026 — restauração do cabeçalho superior e hash Estatísticas

- Responsável apontou que, além das abas laterais, faltava a parte superior do corpo descrita no `comando notas.txt`.
- O comando salvo foi relido e confirmou a regra geral do corpo da página: menu lateral esquerdo, título do site, caixa de pesquisa no canto superior direito, seletor de três temas e perfil do usuário com opção de sair devem compor todas as abas.
- Foram comparadas as abas `Notas` e `Boletim`, que já mantinham o cabeçalho comum com logo/título, busca global, três bolinhas de tema e perfil demonstrativo.
- Correção aplicada em `notas/css/layouts.css`:
  - removida a regra que escondia `.systemBar` em `body[data-view="movimento"]`;
  - removido o override de `.mainStage` específico de `movimento`, fazendo `Estatísticas` usar o mesmo corpo e espaçamento das demais abas;
  - `statsDashboard` passou a começar abaixo do cabeçalho comum, com `min-height: calc(100vh - 100px)` e padding ajustado.
- Correção aplicada em `notas/js/app.js`:
  - adicionada rota canônica `#estatisticas` para a antiga view interna `movimento`;
  - mantido `#movimento` como compatibilidade legada;
  - cliques novos na aba `Estatísticas` agora escrevem `#estatisticas` na URL.
- Teste de regressão atualizado em `scripts/testes-notas.mjs` para verificar:
  - existência do alias `estatisticas`;
  - hash canônico `movimento: "estatisticas"`;
  - proibição de esconder `.appRail` e `.systemBar` em `Estatísticas`.
- Capturas geradas:
  - `diagnosticos/notas-estatisticas-cabecalho-v1.png`;
  - `diagnosticos/notas-estatisticas-cabecalho-v1-mobile.png`;
  - `diagnosticos/notas-estatisticas-alias-movimento.png`.
- Resultado visual: `Estatísticas` agora mantém o mesmo cabeçalho superior de `Notas` e `Boletim`, preservando também a navegação lateral e o dashboard estatístico baseado no anexo 7.
- Nenhum dado real, lista `NOTAS_*`, Graph, SharePoint, Power Automate, permissão ou configuração Microsoft 365 foi alterado.
- Próxima etapa correta: responsável validar `/notas/#estatisticas` no GitHub Pages; depois continuar a comparação visual das abas `Notas` e `Boletim`.

### 08/07/2026 — reativação do menu lateral em Estatísticas

- Responsável informou que a aba `Estatísticas` ficou visualmente fiel ao `anexo 7.png`, mas perdeu as abas laterais esquerdas.
- Foram relidos os documentos estruturantes do repositório e do módulo de notas:
  - `AGENTS.md` da raiz;
  - `README.md` da raiz;
  - `notas/AGENTS.md`;
  - `notas/AGENTS_NOTAS.md`;
  - `notas/ANALISE_PLANILHAS_2026.md`;
  - `notas/POC_EXCEL_ONLINE_2026.md`;
  - READMEs de assets do Arquivo Digital, apenas para confirmar limites de escopo.
- Conclusão de contexto: o menu lateral compacto faz parte do shell aprovado do módulo `/notas/`; a fidelidade ao anexo 7 deve ser aplicada ao conteúdo da aba, sem remover a navegação principal do sistema.
- Causa do problema: o CSS específico de `body[data-view="movimento"]` estava transformando `.appShell` em bloco e escondendo `.appRail` junto com `.systemBar`.
- Correção aplicada em `notas/css/layouts.css`:
  - removido o override que transformava `.appShell` em `display: block` na view `movimento`;
  - removido o hide de `.appRail` nessa view;
  - mantido o hide somente de `.systemBar`, para preservar a tela estatística sem duplicar controles superiores;
  - zeradas margens desktop (`margin-right` e `margin-left`) no breakpoint responsivo para evitar corte horizontal no mobile.
- Ajuste aplicado em `notas/css/componentes.css`:
  - tipografia/spacing dos cards métricos e do ranking compactados para caber com a largura reduzida pela barra lateral.
- Capturas geradas:
  - `diagnosticos/notas-estatisticas-com-abas-v3.png`;
  - `diagnosticos/notas-estatisticas-com-abas-v4-mobile.png`.
- Resultado visual: no desktop, a barra lateral esquerda voltou com `Estatísticas`, `Notas` e `Boletim`, e o dashboard continua próximo do anexo 7 dentro da área útil restante; no mobile, a navegação compacta aparece no topo e os cards não cortam à direita.
- Nenhum dado real, lista `NOTAS_*`, Graph, SharePoint, Power Automate, permissão ou configuração Microsoft 365 foi alterado.
- Próxima etapa correta: responsável validar no GitHub Pages a presença da navegação lateral em `/notas/#movimento`; se aprovada, continuar o ciclo visual nas abas `Notas` e `Boletim`.

### 08/07/2026 — refinamento da aba Estatísticas contra o anexo 7

- Retomada da etapa interrompida pela IA anterior a partir das alterações locais não commitadas em `notas/index.html`, `notas/js/app.js`, `notas/css/layouts.css` e `notas/css/componentes.css`.
- Confirmado que o comando salvo em `C:\Users\Eugui\Desktop\comando notas.txt` pedia fase visual antes das conexões reais, mantendo somente `Movimento`, `Notas` e `Boletim` e comparando as telas com os anexos da pasta `C:\Users\Eugui\Desktop\imagens`.
- Confirmado que o foco atual do responsável era a antiga aba `Movimento`, agora apresentada ao usuário como `Estatísticas`, visualmente fiel ao `anexo 7.png`.
- Comparação inicial usada:
  - referência: `C:\Users\Eugui\Desktop\imagens\anexo 7.png`, 1420×941;
  - captura local anterior: `diagnosticos/notas-estatisticas-anexo7-v1.png`.
- Diferenças encontradas na captura anterior: botão `IMPRIMIR RELATÓRIO` quebrando em duas linhas, rótulos dos cards métricos quebrados, ranking e painéis inferiores cerca de 50 px fora da referência, donut menor/orientado diferente, rodapé fora ou com marcador textual, segundo nome do ranking truncado e problemas de overflow no mobile.
- Ajustes feitos em `notas/css/layouts.css`:
  - proporção da grade principal calibrada para aproximar gráfico e coluna direita do anexo;
  - espaçamentos verticais reduzidos para alinhar ranking, gráfico, donut e rodapé;
  - rodapé da tela estatística recebeu alinhamento com ícone e regras de quebra no mobile;
  - `statsDashboard` passou a conter overflow horizontal em telas menores.
- Ajustes feitos em `notas/css/componentes.css`:
  - botão de impressão mantido em uma linha, com ícone maior;
  - cards métricos compactados no desktop para manter rótulos em uma linha;
  - ranking compactado para caber no painel do anexo e manter os nomes visíveis;
  - donut aumentado para 277 px no desktop, reposicionado verticalmente e com segmento vermelho rotacionado para a área esquerda;
  - exceções mobile adicionadas para permitir quebra de texto nos cards e evitar corte visual.
- Ajustes feitos em `notas/index.html`:
  - rodapé de `Estatísticas` trocou o marcador textual por SVG de calendário.
- Ajuste feito em `notas/js/app.js`:
  - ícone da disciplina Português alterado para livro aberto, aproximando do anexo 7.
- Capturas geradas na comparação/ciclo:
  - `diagnosticos/notas-estatisticas-anexo7-v2.png`;
  - `diagnosticos/notas-estatisticas-anexo7-v3.png`;
  - `diagnosticos/notas-estatisticas-anexo7-v4.png`;
  - `diagnosticos/notas-estatisticas-anexo7-v5.png`;
  - `diagnosticos/notas-estatisticas-anexo7-v6.png`;
  - `diagnosticos/notas-estatisticas-anexo7-v6-mobile.png`.
- Resultado visual da captura `v6`: desktop 1420×941 ficou alinhado ao anexo 7 na posição dos seletores, botão, ranking, cards, gráfico, donut e rodapé; mobile 390×844 deixou de cortar os textos dos cards métricos.
- Validação executada: `node scripts/testes-notas.mjs` passou.
- Validação executada: `git diff --check -- notas scripts/testes-notas.mjs` não apontou erros; houve apenas avisos esperados de LF/CRLF no Windows.
- Nenhum dado real de aluno, professor, CPF, INEP ou nota real foi inserido.
- Nenhuma lista `NOTAS_*`, biblioteca, fluxo Power Automate, permissão, configuração Entra ID, Graph ou recurso Microsoft 365 foi criado ou alterado.
- Após a entrega visual, o responsável definiu nova regra permanente: sempre fazer commit e push das etapas concluídas do módulo `/notas/`, salvo pedido explícito para deixar local. A regra foi registrada em `notas/AGENTS.md` e no protocolo de futuras sessões deste arquivo.
- Próxima etapa correta: responsável validar visualmente a aba `Estatísticas` local/GitHub Pages; se aprovada, repetir o mesmo ciclo de comparação para `Notas`/anexos 3 e 4 ou `Boletim`/anexos 5 e 6, conforme prioridade.

### 07/07/2026 — correção por comparação visual com anexos

- Usuário reforçou que o resultado deveria ser comparado visualmente com os anexos e corrigido até ficar fiel, especialmente no Boletim.
- Referência principal do Boletim: anexos 5/6, nos quais cada boletim é uma peça horizontal de largura total. A prévia foi corrigida para manter quatro boletins por A4 em quatro faixas horizontais, não mais em grade 2×2.
- Cada faixa do Boletim passou a usar cabeçalho institucional azul com logo, identificação do aluno/turma, foto 3x4 demonstrativa, três círculos de trimestre, situação, tabela de notas, data vertical, recado, rodapé e numeração.
- A tela `Notas` foi ajustada para ficar mais próxima do anexo 3: hero com turma em destaque (`8º ANO C` no demo), ícone de capelo em SVG, subtítulo com etapa/turma/alunos/período, cartões de métricas antes da tabela e filtros mais compactos.
- A tela `Movimento` foi conferida contra o anexo 7 e manteve a composição com seletores, cards, gráfico azul/vermelho, ranking e donut, com ranking acima do donut como no fluxo visual de referência.
- Capturas geradas e comparadas visualmente:
  - `diagnosticos/notas-movimento-fiel-v2.png`;
  - `diagnosticos/notas-banco-fiel-v4.png`;
  - `diagnosticos/notas-boletim-fiel-v2-full.png`.
- Validação executada após os ajustes: `node scripts/testes-notas.mjs` passou.
- Validação executada após os ajustes: `git diff --check` não apontou erro de whitespace; houve apenas avisos esperados de LF/CRLF no Windows.
- Nenhum dado real de aluno, professor, CPF, INEP ou nota real foi inserido; os anexos foram usados apenas como referência visual.
- Nenhuma lista `NOTAS_*`, biblioteca, fluxo Power Automate, permissão, configuração Entra ID ou recurso Microsoft 365 foi criado ou alterado.
- Próxima etapa correta: commit/push para teste do responsável no GitHub Pages.

### 07/07/2026 — remodelagem visual restrita a Movimento, Notas e Boletim

- Usuário pediu para executar o comando escrito no Bloco de Notas aberto na tela, priorizando uma fase visual maior antes de conexões reais.
- O conteúdo do Bloco de Notas orientou limpar a navegação e implantar somente três menus: `Movimento estatístico trimestral`, `Notas` e `Boletim`.
- Foram reabertos os anexos principais em `C:\Users\Eugui\Desktop\imagens`, especialmente `anexo 3.png`, `anexo 5.png` e `anexo 7.png`, para comparar o protótipo com as referências da outra IA.
- `notas/index.html` foi reescrito para uma experiência mais próxima de One UI em tela grande: rail compacto não expansível, ícones SVG, título do sistema, busca global, seletor de três temas e perfil de usuário demonstrativo.
- `notas/js/app.js` foi refeito para renderizar apenas a fase visual atual, mantendo `demo-data.js` e `domain.js` como fonte de cálculo fictício.
- A área `Movimento` passou a ter seleção de turma/período, métricas compactas, gráfico azul/vermelho por disciplina, donut, ranking top 3/top 10 e cartões quantitativos quando o recorte é geral/todas as turmas.
- A área `Notas` passou a substituir o antigo Banco: tabela com todas as disciplinas visíveis em desktop, filtros `Regular`, `Transferidos`, `Desistentes`, `Especial`, `Foi para...` e `Estava no...`, além de perfil compacto do aluno ao clicar no nome e prévia 3x4 ao passar o mouse.
- A área `Boletim` passou a ter controles de título, data de impressão, preto/colorido, situações, recado e rodapé; a prévia monta quatro boletins por A4 e numera conforme a ordem do resultado filtrado.
- O mapeamento visual de componentes foi ajustado para o pedido atual: `P`, `M`, `C`, `G`, `H`, `A`, `RL` Ensino Religioso, `F`, `I`, `RD` Redação, `ET` Ética e Cidadania e `CPT` Computação.
- `scripts/testes-notas.mjs` foi atualizado para validar somente as três guias atuais e bloquear a volta acidental de `Conselho`, `Relatórios` e `Importações` nesta fase.
- Validação executada: `node scripts/testes-notas.mjs` passou com 40 estudantes fictícios, 4 turmas fictícias e 480 lançamentos fictícios.
- Validação executada: `git diff --check` não apontou erro de whitespace; houve apenas avisos esperados de LF/CRLF no Windows.
- Validação HTTP executada: `/notas/` respondeu 200 em `http://127.0.0.1:4177/notas/`.
- Validação visual executada por Playwright CLI:
  - desktop 1366×900 em `/notas/#movimento`;
  - desktop 1366×900 em `/notas/#notas`;
  - desktop 1366×900 em `/notas/#boletim`;
  - mobile full-page 390×844 em `/notas/#notas` e `/notas/#boletim`.
- Ajustes feitos após a primeira captura: coluna `Aluno` da tabela de notas ampliada sem criar rolagem horizontal desktop; checkboxes de situações do boletim compactados.
- Nenhum dado real de aluno, professor, CPF, INEP ou nota real foi inserido; nomes reais dos anexos não foram copiados.
- Nenhuma lista `NOTAS_*`, biblioteca, fluxo Power Automate, permissão, configuração Entra ID ou recurso Microsoft 365 foi criado ou alterado.
- Próxima etapa correta: publicar com commit/push para teste do responsável no GitHub Pages; depois decidir se o refinamento visual continua ou se volta para a prova pendente do conector Excel Online (Business).

### 07/07/2026 — foco em Turma, Banco e Boletim fiel ao print

- Usuário informou que as páginas ainda não estavam parecidas com os prints da outra IA, pediu mais elegância no estilo One UI, Banco sem barra horizontal e Boletim 100% fiel ao print real colocado na pasta `C:\Users\Eugui\Desktop\imagens`.
- Novo print encontrado e analisado: `Captura de tela 2026-07-07 132720 print boletim do banco de notas.png`.
- Referências revisadas:
  - prints da outra IA para `Movimento Estatístico Escolar`, Banco/tabela de notas e `Relatórios e Impressão`;
  - print real `02-APROVEITAMENTO.png` extraído do Excel;
  - novo print real do Boletim na pasta `imagens`;
  - documentação oficial Samsung One UI sobre layout em telas grandes, cor e profundidade visual, aplicada apenas como orientação de hierarquia/compactação.
- Aba `Turma`:
  - título inicial alterado para `Movimento estatístico trimestral`;
  - cards métricos reescritos para `Acima ou igual à média`, `Abaixo da média`, `Alunos na turma` e `Média geral da turma`;
  - lista de disciplinas substituída por gráfico compacto de colunas com azul/vermelho, legenda e rodapé de regra do I trimestre;
  - corrigido o cálculo padrão para usar a turma ativa exibida quando o filtro está em `Todas`.
- Aba `Banco`:
  - removidos visualmente os blocos `Matriz por componente` e `Aproveitamento por área`;
  - quadro de notas virou a experiência principal, com busca/filtros/impressão dentro do painel;
  - tabela compactada para exibir todas as notas na largura disponível, sem rolagem horizontal em desktop 1366×900;
  - ordem preservada como `P M C G H A RL F I RD ET CPT`;
  - filtros globais foram ocultados nesta aba para aproximar do print de referência.
- Aba `Boletim`:
  - removida a coluna lateral de ficha/boletins recentes desta tela;
  - criada tela única de configuração e prévia, com grupos `Impressão`, `Geração`, `Situações` e `Informações e recados`;
  - controles adicionados: `Preto e branco`, `Colorido`, ocultar II/III trimestre, situações, título, data de impressão, recado e texto de rodapé;
  - `classDeck`, banner de demonstração e filtros globais foram ocultados apenas em `boletins` para a prévia subir na tela;
  - prévia recriada como folha horizontal baseada no print real: faixa vermelha, faixa azul, percentuais I/II/III trimestre, matriz central com traços, data vertical, número da página, recado e rodapé;
  - criada ordem específica `componentesBoletim()` para o print do Boletim, separada da ordem do Banco.
- `scripts/testes-notas.mjs` foi atualizado para validar `boletimPrintExact`, `boletimControls` e `disciplineChart`.
- Validação executada: `node scripts/testes-notas.mjs` passou.
- Validação executada: `git diff --check` não apontou erro de whitespace; apenas avisos esperados de conversão LF/CRLF no Windows.
- Validação visual executada por Playwright CLI:
  - `/notas/` com `#dashboardDisciplinas .disciplineChart`;
  - `/notas/#banco` com `#quadroAproveitamento .excelTable`;
  - `/notas/#boletins` com `#boletimPreview .boletimPrintExact`.
- Nenhum dado real de aluno/professor/nota foi inserido; o print real foi usado só como referência visual e não foi versionado.
- Nenhuma lista, fluxo, permissão ou recurso Microsoft 365 foi criado ou alterado.
- Pendência assumida: a aba `Conselho` ainda precisa de uma fase própria, conforme o usuário indicou que pode ficar para depois.
- Próxima etapa correta: publicar com commit/push; o responsável validar no GitHub Pages; depois decidir entre ajuste fino de Boletim/Turma/Banco ou fase própria do Conselho.

### 07/07/2026 — correção de fidelidade aos prints reais do banco de notas

- Usuário informou que o modelo ainda estava distante das telas geradas por outra IA e pediu nova correção mais fiel, revisando novamente a pasta `C:\Users\Eugui\Desktop\imagens` e os prints reais do arquivo `BANCO DE NOTAS 2026 TESTE.xlsb`.
- Foram reabertas as seis imagens de referência e comparadas com prints temporários extraídos do Excel real: `APROVEITAMENTO`, `BOLETIM`, `FICHA ALUNO`, `CONSELHO`, `INICIO` e `ATA RESULTADOS`.
- A extração dos prints reais ficou fora do repositório, em pasta temporária local; nenhum PNG gerado do Excel foi versionado.
- O print `APROVEITAMENTO` passou a orientar a tela `Banco`: foi adicionado `quadroAproveitamento`, com faixa vertical `APROVEITAMENTO ESCOLAR ANUAL`, cabeçalho de turma/período, linhas numeradas, colunas por componente e destaques vermelhos em notas abaixo do mínimo do I trimestre.
- A ordem visual dos componentes foi ajustada para o padrão observado no banco real: `P`, `M`, `C`, `G`, `H`, `A`, `RL`, `F`, `I`, `RD`, `ET`, `CPT`.
- O print `BOLETIM` passou a orientar a tela `Boletim`: a prévia agora tem área `Relatórios e impressão`, faixa institucional vermelha/azul, dados do aluno, blocos de trimestres e matriz por componente com linhas de nota, recuperação, total, nota necessária e faltas.
- O print `FICHA ALUNO` passou a orientar o painel lateral da ficha: foi substituído o resumo em cards por um mini-documento com logo, campos do aluno, tabela de aproveitamento anual, regime de avaliação, dias letivos e faltas.
- O print `CONSELHO` passou a orientar a tela `Conselho`: foram adicionados chips de turma, aluno em foco, botões de deliberação e folha `RELATÓRIO DE RESULTADO FINAL` com cabeçalho institucional, ano, linhas alternadas e colunas verticais de decisão.
- Corrigida inconsistência detectada na validação visual: o aluno em foco do Conselho agora é escolhido dentro da turma ativa, não pelo menor desempenho global de todas as turmas.
- Adicionado suporte a hash de tela para validação e acesso direto: `/notas/#banco`, `/notas/#boletins` e `/notas/#conselho`.
- `scripts/testes-notas.mjs` foi ampliado para travar `quadroAproveitamento`, `renderQuadroAproveitamento`, `boletimExcelPage`, `conselhoReportPage` e os estilos principais dos novos documentos.
- Validação executada: `node scripts/testes-notas.mjs` passou com 40 estudantes fictícios, 4 turmas fictícias e 480 lançamentos fictícios.
- Validação executada: `git diff --check` não apontou erro de whitespace; apenas avisos esperados de conversão LF/CRLF.
- Validação HTTP executada: `/notas/` respondeu 200 no servidor local já ativo em `http://127.0.0.1:4177/notas/`.
- Validação visual executada por Playwright CLI:
  - desktop 1366×900 em `/notas/#banco` com `#quadroAproveitamento .excelTable`;
  - desktop 1366×900 em `/notas/#boletins` com `#boletimPreview .boletimExcelPage`;
  - desktop 1366×900 em `/notas/#conselho` com `#conselhoAlunoFoco .conselhoReportPage`;
  - mobile full-page 390×844 em `/notas/#boletins`.
- Nenhum dado real de aluno, professor, CPF, INEP ou nota real foi inserido em fixture; nomes reais vistos nos prints de referência não foram copiados.
- Nenhuma lista `NOTAS_*`, biblioteca, fluxo Power Automate, permissão, configuração Entra ID ou recurso Microsoft 365 foi criado ou alterado.
- Próxima etapa correta: publicar com commit/push para o responsável testar no GitHub Pages; se o visual for aprovado, voltar à prova pendente do conector Excel Online (Business) ou iniciar script de provisionamento simulado das listas `NOTAS_*`, conforme autorização.

### 07/07/2026 — reimaginação baseada nas telas de referência da pasta imagens

- Usuário informou que ainda considerava o design fraco e pediu para ler as imagens geradas por outra IA em `C:\Users\Eugui\Desktop\imagens`, cruzar com o contexto real do banco de notas e criar um modelo final mais casado, leve, moderno e imersivo.
- Foram inspecionados seis PNGs:
  - `ChatGPT Image 7 de jul. de 2026, 11_04_10.png`;
  - `ChatGPT Image 7 de jul. de 2026, 11_07_38.png`;
  - `ChatGPT Image 7 de jul. de 2026, 11_07_50 (1).png`;
  - `ChatGPT Image 7 de jul. de 2026, 11_07_50 (2).png`;
  - `ChatGPT Image 7 de jul. de 2026, 11_07_50 (3).png`;
  - `ChatGPT Image 7 de jul. de 2026, 11_16_04.png`.
- Elementos aproveitados das referências:
  - menu lateral fixo junto ao conteúdo em telas grandes;
  - seletor de turma/período no topo da experiência;
  - cartões compactos de média, alunos acima/abaixo e sincronização;
  - matriz de notas por componente;
  - ranking/destaques da turma;
  - gráfico circular de desempenho geral;
  - área de boletim/ficha com cabeçalho institucional;
  - tela de conselho de classe com aluno em foco, decisões e matriz por disciplina.
- Elementos descartados ou suavizados:
  - azul excessivamente genérico e pesado;
  - botões grandes demais dominando a tela;
  - excesso de brilho e aparência de mockup de produto genérico;
  - nomes reais que apareciam nas referências geradas pela outra IA;
  - folha de boletim como simples imagem estática sem comportamento de sistema.
- Recursos reais incorporados:
  - identidade `Escola Municipal Profª Iêda Alves de Oliveira` / `Escola Iêda MCPM`;
  - localização pública `Medeiros Neto - BA`;
  - contato público `secretaria@escolaieda.com` e `(73) 99871-0105`;
  - endereço público `Rua Clidenor de Oliveira, S/N`;
  - estrutura real confirmada do banco: `INICIO`, `APROVEITAMENTO`, `BOLETIM`, `FICHA ALUNO`, `CONSELHO`, `ATA RESULTADOS`, `BASE DE CONTROLE`, `VINCULO NOTAS`;
  - regime de avaliação confirmado: I trimestre 18/30, II trimestre 18/30, III trimestre 24/40, total anual 60/100;
  - componentes e campos do contrato `TB_EXPORT_NOTAS`: `NotaT1`, `NotaT2`, `NotaT3`, `Total`, `RecT1`, `RecT2`, `RecT3`, `TotalRec`, `NotaFinal`.
- A navegação foi reestruturada para `Turma`, `Banco`, `Alunos`, `Boletim`, `Conselho`, `Relatórios`, `Sync` e `Estrutura`.
- O topo passou a funcionar como área de visualização/contexto: título da experiência, busca compacta, turma selecionada, chips de período e ações rápidas de relatório/boletim.
- A tela `Turma` passou a renderizar desempenho por componente, ranking da turma, donut de desempenho geral, métricas compactas e regime de avaliação.
- A tela `Boletim` passou a renderizar ficha/boletim com marca real da escola, regime de avaliação, matriz de notas, recuperação, nota final e faltas demonstrativas.
- Foi criada tela própria `Conselho`, com aluno fictício em foco, botões compactos de decisão, matriz de notas, resumo para decisão e votos simulados.
- `scripts/testes-notas.mjs` foi ampliado para validar `view-conselho`, `dashboardDisciplinas` e `conselhoAlunoFoco`.
- Validação executada: `node scripts/testes-notas.mjs` passou.
- Validação executada: `git diff --check` não apontou erro de whitespace; apenas avisos esperados de conversão LF/CRLF.
- Validação HTTP executada: `/notas/` respondeu 200 e o HTML contém `view-conselho` e `dashboardDisciplinas`.
- Validação visual executada por Playwright CLI: capturas desktop 1366×900, mobile 390×844 e full-page com `#dashboardDisciplinas .disciplineBar` carregado.
- Nenhum recurso Microsoft 365 foi criado ou alterado; nenhum dado real de aluno/professor foi inserido.
- Próxima etapa correta: publicar com commit/push para avaliação no GitHub Pages; depois ajustar UX fino conforme retorno visual do responsável.

### 07/07/2026 — redesenho de produto do módulo de notas

- Usuário avaliou que o design inicial estava distante do pedido e solicitou uma etapa maior, com personalidade própria, visual leve/moderno inspirado em sistema Android no PC e telas mais próximas do banco de notas em Excel.
- A etapa foi tratada como redesenho de produto, não como integração real: nenhum dado real e nenhum recurso Microsoft 365 foi criado ou alterado.
- A navegação da SPA passou a ter áreas `Início`, `Banco`, `Alunos`, `Boletins`, `Relatórios`, `Importações` e `Estrutura`.
- O início recebeu cabeçalho institucional com imagem real do Arquivo Digital, indicadores de média/atenção/sincronização, cards operacionais, mapa anual por turma, etapas trimestrais e prioridades.
- O banco de notas passou a exibir matriz por componente com I trimestre, II trimestre, III trimestre, total, final e risco, refletindo a organização confirmada no Excel.
- A área de boletins passou a ter prévia individual com componentes, notas trimestrais, recuperação e resultado demonstrativo.
- A área de relatórios passou a simular aproveitamento escolar, conselho de classe e ata de resultados por turma.
- `notas/js/demo-data.js` foi ampliado para 4 turmas, 40 alunos fictícios, 12 componentes fictícios e 480 lançamentos fictícios, mantendo `origem: fixture-demo`.
- `notas/js/domain.js` passou a calcular resultado demonstrativo, etapas e resumo por componente.
- `scripts/testes-notas.mjs` foi atualizado para validar banco, boletins, relatórios, 12 componentes, etapas e resultado demonstrativo.
- Validação executada: `node scripts/testes-notas.mjs` passou com 40 estudantes fictícios, 4 turmas fictícias e 480 lançamentos fictícios.
- Validação executada: `git diff --check` não apontou erro de whitespace; apenas avisos esperados de conversão LF/CRLF.
- Validação visual executada por Playwright CLI: capturas desktop 1366×900 e mobile 390×844 geradas com sucesso. O overflow de nomes longos em importações e a exibição indevida do botão oculto `Sair` no mobile foram corrigidos.
- Tentativa de teste interativo com `@playwright/test` não foi mantida porque exigiria dependência local no projeto; não foi adicionada dependência npm ao repositório.
- Próxima etapa correta: publicar com commit/push, o responsável testar no GitHub Pages e então decidir entre ajustes finos de UX ou script de provisionamento simulado das listas `NOTAS_*`.

### 07/07/2026 — primeira SPA funcional do módulo de notas

- Usuário autorizou avançar em uma etapa mais larga para ver o sistema funcionando, mantendo documentação nos AGENTS e commits frequentes.
- Criada a primeira SPA estática em `/notas/`, compatível com GitHub Pages e sem build.
- Arquivos principais criados: `notas/index.html`, `notas/css/tokens.css`, `notas/css/base.css`, `notas/css/layouts.css`, `notas/css/componentes.css`, `notas/js/config.js`, `notas/js/demo-data.js`, `notas/js/domain.js`, `notas/js/graph-client.js` e `notas/js/app.js`.
- A SPA possui visão geral, turmas, estudantes, importações e POC/estrutura em modo demonstração.
- O modo demonstração usa apenas dados fictícios (`Estudante 6A-01` etc.) e não contém notas reais, nomes reais, CPF, INEP, tokens ou exportações do SharePoint.
- O cliente Graph foi limitado a autenticação MSAL e verificação estrutural das listas planejadas `NOTAS_*`; não cria, altera ou apaga recursos Microsoft 365.
- Adicionado cartão `Gestão de Notas` no painel `/admin/`, apontando para `../notas/`.
- Criado `scripts/testes-notas.mjs` para validar arquivos esperados, sintaxe JavaScript, referências HTML, fixtures fictícios e funções de domínio.
- Validação executada: `node scripts/testes-notas.mjs` passou com 28 estudantes fictícios, 4 turmas fictícias e 140 lançamentos fictícios.
- Validação de diff executada: `git diff --check` não apontou erro de whitespace; apenas avisos esperados de conversão LF/CRLF.
- Validação HTTP executada com `npx --yes http-server`: `/notas/` e `/admin/` responderam HTTP 200 em servidor local.
- Nenhuma lista `NOTAS_*`, biblioteca, fluxo Power Automate, configuração Entra ID ou permissão Microsoft 365 foi criada ou alterada.
- Próxima etapa correta: o responsável validar visualmente o protótipo local; em seguida, preparar script de provisionamento idempotente em modo simulação ou concluir a prova do conector Excel Online (Business), sem ligar dados reais ainda.

### 07/07/2026 — investigação Power Automate e conexão Excel

- Usuário autorizou uma etapa longa com subetapas internas e commits frequentes.
- Commit criado antes desta investigação: `0682f22` (`Adiciona POC online de exportacao de notas`), contendo documentação da POC Graph e scripts de preparação/verificação online.
- Foram instalados em escopo `CurrentUser` os módulos oficiais:
  - `Microsoft.PowerApps.Administration.PowerShell` 2.0.217;
  - `Microsoft.PowerApps.PowerShell` 1.0.45.
- A instalação em Windows PowerShell 5.1 exigiu instalar primeiro o provider NuGet `2.8.5.201`; `pwsh` 7 não é o caminho recomendado para esses módulos.
- `Add-PowerAppsAccount -Endpoint prod -TenantID ...` autenticou e listou o ambiente padrão `ESCOLA IÊDA ALVES DE OLIVEIRA (default)`.
- `Get-FlowEnvironment` localizou `Default-f04e0fa3-b8dc-4f77-be3c-7dfda0635188` em `southamerica`.
- `Get-PowerAppConnector -ConnectorName shared_excelonlinebusiness -ReturnConnectorSwagger` confirmou:
  - conector `Excel Online (Business)`;
  - tier `Standard`;
  - operação `GetTables` para `Get tables`;
  - operação `GetItems` para `List rows present in a table`;
  - runtime em Azure API Hub Brasil.
- `Get-PowerAppConnection` encontrou apenas conexão OneDrive for Business da conta administrativa; nenhuma conexão `shared_excelonlinebusiness` existia.
- `Get-Flow` e `Get-AdminFlow` não retornaram flows existentes no ambiente padrão.
- Foi criada a ferramenta `scripts/verificar-power-automate-notas.ps1` para diagnosticar módulos, ambiente, conector, operações necessárias e existência da conexão Excel.
- A página de conexões do Power Automate foi aberta pelo navegador, mas durante a janela de monitoramento a conexão `shared_excelonlinebusiness` não apareceu.
- Conclusão real: a prova final do conector Power Automate está bloqueada somente pela ausência de conexão OAuth `Excel Online (Business)`. Após criar/autorizar essa conexão no portal, repetir `scripts/verificar-power-automate-notas.ps1` e então executar o fluxo temporário com `Get tables`/`List rows present in a table`.
- Não criar Dataverse solution/cloud flow por API nesta fase apenas para contornar a UI: é mais pesado que a prova necessária e aumentaria o risco operacional sem ganho proporcional.

### 07/07/2026 — leitura online por Graph e correção da POC

- PnP.PowerShell 3.2.0 estava instalado; Microsoft Graph PowerShell e Power Platform PowerShell não estavam instalados.
- `Connect-PnPOnline` passou a exigir `ClientId`; a conexão funcional usou o `ClientId` e `TenantId` já documentados no projeto, com `-PersistLogin`.
- A sessão autenticou como conta administrativa institucional. `/me/drive` apontava para o OneDrive dessa conta, não para o OneDrive da Secretaria.
- O OneDrive correto da Secretaria foi acessado por Graph via `v1.0/users/SECRETARIA@escolaieda.com/drive`.
- A cópia POC inicial foi localizada online na pasta lógica `PEDAGÓGICO/CONTROLE DE NOTAS/_POC_NOTAS_EXPORT_2026`.
- A primeira leitura online encontrou `TB_EXPORT_NOTAS`, mas expôs uma falha de contrato: `AlunoNome` e `SituacaoMatricula` estavam invertidos na tabela gerada.
- A causa foi confirmada nos 18 arquivos `.xlsb` de 2026: nos pares da guia `RELAÇÃO`, a coluna par contém nomes e a coluna ímpar contém situação.
- `scripts/preparar-poc-export-notas-v1.ps1` foi corrigido para inferir as colunas de nome/situação pela quantidade de células preenchidas, sem depender de par/ímpar fixo.
- A cópia POC corrigida foi validada localmente: 138 linhas de dados, 16 colunas, `AlunoNome` presente/preenchido e `SituacaoMatricula` presente podendo estar vazia.
- A sincronização local do OneDrive ficou atrasada e o Graph ainda lia uma versão antiga; a cópia corrigida foi enviada diretamente por Graph com nome técnico `POC_TB_EXPORT_NOTAS_CORRIGIDO_20260707.xlsb`.
- Uma pasta POC duplicada criada por engano dentro de `CONTROLE DE NOTAS 2026` foi removida após validação de que continha somente a cópia POC gerada nesta sessão.
- O item online antigo com nome derivado da agenda ainda retornou `Locked` ao tentar excluir; a prova válida deve usar o item técnico corrigido até a limpeza posterior do item antigo.
- `scripts/testar-poc-export-notas-online.ps1` foi criado para repetir a leitura online sem imprimir nomes, notas ou amostras de linhas.
- Resultado do script online: `TB_EXPORT_NOTAS` encontrada pela Microsoft Graph Workbook API em `.xlsb`, faixa `EXPORT_NOTAS_POC!A1:P139`, 138 linhas de dados, 16 colunas e cabeçalhos esperados.
- Tentativa de sobrescrever o item online anterior retornou `resourceLocked`; solução registrada: aguardar expiração do bloqueio ou subir novo item POC técnico.
- Ainda não foi executado o teste final no Power Automate com o conector Excel Online (Business): `Get tables` e `List rows present in a table` continuam pendentes.
- Nenhuma lista `NOTAS_*`, biblioteca, fluxo Power Automate, configuração Entra ID ou permissão Microsoft 365 foi criada ou alterada.
- Próxima etapa correta: executar a prova final no Power Automate usando o arquivo técnico `POC_TB_EXPORT_NOTAS_CORRIGIDO_20260707.xlsb`, medir duração/erros e registrar o resultado.

### 07/07/2026 — preparação operacional da POC online

- `ANALISE_PLANILHAS_2026.md` foi enviado ao GitHub em `main` no commit `fad16da`.
- Confirmado que a pasta do repositório é `C:\Users\Eugui\Desktop\PROJETO_ARQUIVO_DIGITAL\escolaieda`.
- `git status --short --branch` indicou `main...origin/main` com alterações locais apenas em documentação do módulo `notas`.
- Foram localizadas 18 agendas `.xlsb` de 2026 em OneDrive institucional na pasta de controle de notas.
- Excel Desktop 16.0 foi confirmado disponível via COM.
- Uma tentativa de leitura COM em uma agenda grande ficou presa por vínculos/cálculo; o processo oculto do Excel criado pela tentativa foi encerrado e nenhum arquivo real foi alterado.
- Uma agenda menor abriu em modo somente leitura com macros/eventos desabilitados; confirmou-se que `CONFIGURAÇÃO` continua oculta, sem tabela Excel, e que `RELAÇÃO` possui pares de colunas compatíveis com as turmas.
- Criado `scripts/preparar-poc-export-notas-v1.ps1` para gerar cópia POC fora do Git, adicionar `EXPORT_NOTAS_POC` e `TB_EXPORT_NOTAS`, validar reabertura e impedir destino dentro do repositório.
- Criado `notas/POC_EXCEL_ONLINE_2026.md` com roteiro de execução manual no Power Automate/Excel Online (Business).
- O script foi executado em uma agenda piloto menor, gerando cópia na pasta OneDrive institucional `_POC_NOTAS_EXPORT_2026`.
- Resultado da cópia piloto: 3 grupos de turma/componente, 138 linhas, 16 colunas, guia `EXPORT_NOTAS_POC` muito oculta, tabela `TB_EXPORT_NOTAS` reaberta com sucesso e proteção estrutural preservada.
- O arquivo local da cópia piloto aparece com atributo `ReparsePoint` do OneDrive; ainda falta confirmar pelo portal/conector que a versão online está disponível para leitura.
- Nenhuma lista `NOTAS_*`, biblioteca, fluxo Power Automate, configuração Entra ID ou permissão Microsoft 365 foi criada ou alterada.
- Próxima etapa correta: aguardar/confirmar sincronização do OneDrive e testar `Get tables`/`List rows present in a table` no Excel Online (Business).

### 06/07/2026 — análise dos arquivos e prova local do contrato

- `BANCO DE NOTAS 2026 TESTE.xlsb` foi aberto em modo somente leitura, com macros, eventos e atualização de links desabilitados.
- Foram analisadas as dez guias, fórmulas, 2.057 nomes, 19 vínculos externos, objetos visuais e 26 componentes VBA.
- Foram visualizadas as telas de painel, aproveitamento, configurações, boletim, ficha individual, conselho, resultado final, ata e base de controle.
- Os 18 arquivos `.xlsb` de professores de 2026 foram localizados no OneDrive institucional e comparados estruturalmente.
- Confirmado: 180 atribuições de turma/componente, equivalentes a 15 turmas × 12 componentes.
- Confirmado: cada atribuição usa nove campos consolidados e até 46 posições de estudante.
- Confirmado: os arquivos não possuem tabela Excel de exportação; a integração atual usa faixas ocultas e vínculos célula a célula.
- A relação anual foi analisada; existe tabela interna com INEP e CPF, mas esses identificadores não chegam ao vínculo de notas atual.
- Em cópia temporária de uma planilha, foi criada `TB_EXPORT_NOTAS` com 690 linhas e 16 colunas; a guia ficou muito oculta, o arquivo reabriu e a proteção estrutural permaneceu ativa.
- A cópia temporária foi removida. Nenhum arquivo real foi alterado.
- A análise detalhada e o contrato proposto estão em `ANALISE_PLANILHAS_2026.md`.
- Próxima etapa correta: prova online controlada do conector Excel Online (Business) com uma cópia `.xlsb`; nenhuma implantação em massa antes desse resultado.

### 06/07/2026 — criação da fundação

- Repositório inteiro foi estudado, com foco em raiz, painel, autenticação, Arquivo Digital, scripts de provisionamento e validação.
- `main` local estava alinhada a `origin/main` no commit `899f1a9...` antes desta documentação.
- Validador oficial do Arquivo Digital e testes de regressão/utilitários passaram.
- Decidido: mesmo site `ARQUIVODIGITAL`, mesmos colaboradores, listas `NOTAS_*` separadas.
- Decidido: aplicação web em `/notas/`, ligada pelo painel `/admin/`.
- Decidido: nenhuma criação no Microsoft 365 na fase atual.
- Próxima etapa correta: analisar o banco de notas e uma planilha de professor, fechar o contrato de exportação e executar uma prova de conceito controlada.

## 20. Referências oficiais pesquisadas

### Android, Material e Samsung One UI

- [Material Design 3 em Compose — Android Developers](https://developer.android.com/develop/ui/compose/designsystems/material3)
- [Classes de tamanho de janela — Android Developers](https://developer.android.com/develop/adaptive-apps/guides/use-window-size-classes)
- [Adaptação de layouts — Android Developers](https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout)
- [Acessibilidade — Android Developers](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility)
- [Visão geral do One UI Design System — Samsung Developer](https://developer.samsung.com/one-ui/index.html)
- [Layout básico One UI — Samsung Developer](https://developer.samsung.com/one-ui/layout/basic.html)
- [Layout para telas grandes — Samsung Developer](https://developer.samsung.com/one-ui/largescreen-and-foldable/large_screen_layout.html)
- [Sistema e uso de cores One UI — Samsung Developer](https://developer.samsung.com/one-ui/color/system.html)
- [Movimento One UI — Samsung Developer](https://developer.samsung.com/one-ui/motion/basic.html)
- [Profundidade visual One UI — Samsung Developer](https://developer.samsung.com/one-ui/structure/visual-depth.html)
- [Cor e contraste One UI — Samsung Developer](https://developer.samsung.com/one-ui/accessibility/color-contrast.html)
- [WCAG 2.2 — W3C](https://www.w3.org/TR/WCAG22/)

### Microsoft 365, Graph e automação

- [MSAL Browser — Microsoft Learn](https://learn.microsoft.com/en-us/entra/msal/javascript/browser/about-msal-browser)
- [Criar item de lista pelo Microsoft Graph](https://learn.microsoft.com/en-us/graph/api/listitem-create?view=graph-rest-1.0)
- [Delta de itens de lista pelo Microsoft Graph](https://learn.microsoft.com/en-us/graph/api/listitem-delta?view=graph-rest-1.0)
- [Orientação de throttling do Microsoft Graph](https://learn.microsoft.com/en-us/graph/throttling)
- [Conector SharePoint para Power Automate](https://learn.microsoft.com/en-us/sharepoint/dev/business-apps/power-automate/sharepoint-connector-actions-triggers)
- [Conector Excel Online (Business)](https://learn.microsoft.com/en-us/connectors/excelonlinebusiness/)
- [Perguntas de licenciamento do Power Automate](https://learn.microsoft.com/en-us/power-platform/admin/power-automate-licensing/faqs)

### Privacidade

- [Lei Geral de Proteção de Dados — texto consolidado](https://www.gov.br/mme/pt-br/arquivos/legislacao-consolidada-lgpd.pdf)
- [ANPD — tratamento de dados de crianças e adolescentes](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes)
