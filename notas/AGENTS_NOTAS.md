# AGENTS_NOTAS — Sistema de Gestão de Notas

> Documento operacional e fonte de verdade para pessoas e inteligências artificiais que trabalharem neste módulo.
>
> Última atualização: 06/07/2026
>
> Estado: fase 0 — pesquisa e arquitetura; nenhuma lista, biblioteca, fluxo ou aplicação de notas foi criado no Microsoft 365.
>
> Baseline do repositório no início desta fase: commit `899f1a915a126d94507ca0e4e39030458bf19206`, branch `main`.

## 1. Leitura obrigatória antes de trabalhar

1. Leia este arquivo integralmente.
2. Leia o `AGENTS.md` e o `README.md` da raiz.
3. Antes de alterar autenticação ou Graph, leia `admin/admin.js`, `index.html` e o bloco `CONFIG` de `arquivo-digital/arquivo-digital.js`.
4. Não presuma que uma decisão pendente já foi aprovada.
5. Não crie recursos no SharePoint, Entra ID ou Power Automate sem autorização explícita do responsável pelo projeto.
6. Não faça reescrita ampla do site existente. O Arquivo Digital está operacional e é uma referência, não uma área livre para refatoração.
7. Nunca registre neste repositório notas reais, nomes de estudantes, tokens, senhas, segredos, arquivos de professores ou exportações do SharePoint.
8. Ao terminar uma etapa, atualize as seções **Estado atual**, **Decisões**, **Pendências** e **Registro de continuidade** deste arquivo.

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
10. Nesta fase 0, somente documentação e estrutura inicial do repositório são autorizadas. Nenhum recurso Microsoft 365 deve ser criado ainda.

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

Para preservar a implantação direta existente do GitHub Pages, começar com HTML semântico, CSS modular e JavaScript ES Modules, divididos por domínio. Não repetir o padrão de um único arquivo JavaScript muito grande.

Estrutura futura sugerida:

```text
notas/
├── AGENTS.md
├── AGENTS_NOTAS.md
├── index.html
├── css/
│   ├── tokens.css
│   ├── base.css
│   ├── componentes.css
│   ├── layouts.css
│   └── movimento.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── auth.js
│   ├── graph-client.js
│   ├── estado.js
│   ├── rotas.js
│   ├── dados/
│   ├── componentes/
│   └── telas/
└── testes/
```

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

### Fase 0 — fundação documental — estado atual

- [x] estudar o repositório e o painel administrativo;
- [x] identificar autenticação, site ID e padrão Graph atuais;
- [x] decidir usar o mesmo site e os mesmos colaboradores;
- [x] pesquisar Material 3 Expressive, One UI, acessibilidade e limites Microsoft 365;
- [x] criar `notas/AGENTS.md` e `notas/AGENTS_NOTAS.md`;
- [ ] receber e analisar a planilha/banco original e uma planilha representativa de professor;
- [ ] confirmar regras pedagógicas e cálculos reais.

### Fase 1 — descoberta e prova de conceito

- mapear campos, guias, fórmulas, macros e chaves das planilhas;
- escolher um arquivo de teste sem dados pessoais reais ou com cópia controlada;
- comprovar leitura online de `TB_EXPORT_NOTAS`;
- medir latência e limites no tenant A1;
- validar se a origem permanecerá no OneDrive da Secretaria ou migrará para biblioteca no mesmo site;
- fechar o esquema de dados e o contrato versão 1;
- criar protótipo visual estático do dashboard e da visão de turma;
- obter aprovação antes de provisionar.

### Fase 2 — infraestrutura controlada

- criar script de provisionamento idempotente, inicialmente em modo de simulação;
- criar listas `NOTAS_*` com permissões herdadas e índices;
- criar dados fictícios;
- criar fluxo piloto com uma planilha;
- criar plano de rollback e remoção dos recursos de teste.

### Fase 3 — aplicação mínima

- implementar autenticação e acesso;
- implementar cliente Graph modular;
- visão geral, turmas, estudantes e importações;
- estados de erro, carregamento e acessibilidade;
- adicionar cartão Gestão de Notas no painel;
- testar em notebook e celular.

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

- analisar o arquivo `BANCO DE NOTAS 2026 TESTE` e suas guias/fórmulas;
- localizar e analisar uma planilha real representativa de professor;
- confirmar formatos, tamanhos e localização online atual dos arquivos;
- definir códigos estáveis de aluno, turma, professor e componente;
- documentar regras de média, recuperação, faltas, arredondamento e situação final;
- decidir o que ocorre quando uma nota é apagada ou uma linha desaparece;
- confirmar conta institucional proprietária dos fluxos;
- validar conectores e limites no tenant A1;
- confirmar URIs cadastradas no aplicativo Entra;
- aprovar protótipo visual antes de desenvolver todas as telas.

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
5. não fazer commit/push sem autorização da sessão, salvo quando o usuário já tiver pedido explicitamente;
6. nunca provisionar ou apagar recursos Microsoft 365 por inferência.

## 19. Registro de continuidade

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
