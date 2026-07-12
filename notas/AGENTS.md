# Instruções do módulo de notas

Antes de criar, alterar ou revisar qualquer arquivo dentro desta pasta, leia integralmente `AGENTS_NOTAS.md`, `ANALISE_PLANILHAS_2026.md` e, quando o trabalho envolver a prova online, `POC_EXCEL_ONLINE_2026.md`.

O arquivo `AGENTS_NOTAS.md` é a fonte de verdade do projeto: contém decisões aprovadas, arquitetura, restrições, segurança, modelo de dados, direção visual, plano de implantação e o ponto exato de continuidade. `ANALISE_PLANILHAS_2026.md` registra o funcionamento confirmado nos arquivos reais e o contrato de integração proposto. `POC_EXCEL_ONLINE_2026.md` registra o roteiro operacional da prova controlada com Excel Online (Business) e o teste online já feito pela Microsoft Graph Workbook API.

Estado atual em 12/07/2026: existe uma SPA estática em `/notas/`, ainda em modo visual e com dados exclusivamente fictícios. A navegação visível contém as guias `Notas` e `Boletim`. A antiga guia `Estatísticas` continua incorporada abaixo da ficha como `.notesStatsSection`; quaisquer outras guias permanecem removidas para reconstrução futura. Os hashes legados `#estatisticas` e `#movimento` abrem `/notas/#notas`; `#boletins` normaliza para `/notas/#boletim`.

A guia `Notas` preserva seletores Turma/Período, tabela, insights laterais, cards, ranking, gráfico, donut, detalhamento por disciplina, filtros, impressão da ficha e painel lateral do aluno. A etapa de 12/07/2026 também corrigiu códigos canônicos de componentes, precedência do conselho, distinção entre nota ausente e zero, aplicabilidade da recuperação, rótulos das métricas, foco/teclado, semântica da tabela/gráficos, contraste, impressão de teste e limpeza de código/CSS órfão.

A nova guia `Boletim` foi reconstruída do zero contra `C:\Users\Eugui\Desktop\aqui.png`: mantém o shell comum, oferece turma, aluno, trimestres, situações, modo colorido/P&B, impressão/PDF, zoom e tela cheia. A turma selecionada gera todos os boletins fictícios, organizados em folhas A4 verticais com quatro boletins horizontais empilhados por página. O documento usa retrato inteiramente fictício, 12 colunas disciplinares de largura idêntica e a mesma cor azul para notas regulares e nota final. Os anéis trimestrais contam componentes com nota azul/vermelha entre lançamentos válidos; não voltar ao cálculo por média. A logo deve permanecer integralmente dentro do cabeçalho. Após validação na página real, o conteúdo interno passou a ser redimensionado por uma escala compartilhada controlada por `ResizeObserver`; não remover `--bulletin-shared-scale`. A prévia é contínua e mostra todas as folhas em rolagem vertical: primeira folha imediata, demais preenchidas progressivamente e páginas fora da tela otimizadas com `content-visibility: auto`. Imprimir remonta as folhas para `window.print()` e Baixar PDF gera/download o arquivo diretamente.

Os dados continuam fictícios. Nenhum Graph, lista `NOTAS_*`, fluxo Power Automate, permissão ou recurso Microsoft 365 foi criado ou alterado nesta etapa.

As regras do `AGENTS.md` da raiz do repositório também continuam válidas. Em caso de conflito, preserve o sistema operacional existente e peça confirmação antes de alterar autenticação, permissões, SharePoint, Microsoft Graph, Power Automate ou dados reais.

Regra permanente de publicação neste módulo: ao concluir uma etapa de alteração em `/notas/`, executar as validações proporcionais, fazer commit somente dos arquivos necessários e enviar para `origin/main` por padrão. Não fazer commit/push apenas se o responsável pedir explicitamente para deixar local. Tags, provisionamento Microsoft 365, permissões, SharePoint, Graph e Power Automate continuam exigindo autorização explícita separada.

Regra permanente de documentação neste módulo: toda etapa concluída deve atualizar `AGENTS_NOTAS.md`, especialmente **Estado atual**, **Decisões**, **Pendências** e **Registro de continuidade**, antes do commit/push.

Regra permanente de UI neste módulo: toda mudança visual nova deve prever transições/microinterações proporcionais, aparência compatível com o sistema, seletor acessível quando o `select` nativo destoar do design, e fallback por `prefers-reduced-motion`. Toda decisão estética aprovada deve ser propagada às próximas guias reconstruídas para manter o ecossistema padronizado.

Regra permanente de reconstrução: não reativar Estatísticas como guia separada nem qualquer outra guia por meio de código/CSS legado. `Boletim` é a primeira guia reconstruída e vive em `js/boletim.js`/`css/boletim.css`; preservar essa separação. Cada próxima guia deve nascer em etapa própria, com escopo aprovado, acessibilidade, testes de comportamento, documentação e validação visual.

Validação visual do Boletim: executar `node scripts/auditoria-visual-boletim.mjs`. O script abre Edge/Chrome local, valida 1672×941, 1550×741, 1420×941, 1280×720 e 390×844 e grava capturas ignoradas pelo Git em `diagnosticos/auditoria-visual-boletim/`.
