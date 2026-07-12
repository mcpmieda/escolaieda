# Instruções do módulo de notas

Antes de criar, alterar ou revisar qualquer arquivo dentro desta pasta, leia integralmente `AGENTS_NOTAS.md`, `ANALISE_PLANILHAS_2026.md` e, quando o trabalho envolver a prova online, `POC_EXCEL_ONLINE_2026.md`.

O arquivo `AGENTS_NOTAS.md` é a fonte de verdade do projeto: contém decisões aprovadas, arquitetura, restrições, segurança, modelo de dados, direção visual, plano de implantação e o ponto exato de continuidade. `ANALISE_PLANILHAS_2026.md` registra o funcionamento confirmado nos arquivos reais e o contrato de integração proposto. `POC_EXCEL_ONLINE_2026.md` registra o roteiro operacional da prova controlada com Excel Online (Business) e o teste online já feito pela Microsoft Graph Workbook API.

Estado atual em 12/07/2026: existe uma SPA estática em `/notas/`, ainda em modo visual e com dados exclusivamente fictícios. A navegação visível contém somente a guia `Notas`. A antiga guia `Estatísticas` continua incorporada abaixo da ficha como `.notesStatsSection`; as guias `Boletim` e quaisquer outras foram removidas para serem reconstruídas do zero em etapas futuras. Os hashes legados `#estatisticas`, `#movimento`, `#boletim` e `#boletins` abrem a URL canônica `/notas/#notas`.

A guia `Notas` preserva seletores Turma/Período, tabela, insights laterais, cards, ranking, gráfico, donut, detalhamento por disciplina, filtros, impressão da ficha e painel lateral do aluno. A etapa de 12/07/2026 também corrigiu códigos canônicos de componentes, precedência do conselho, distinção entre nota ausente e zero, aplicabilidade da recuperação, rótulos das métricas, foco/teclado, semântica da tabela/gráficos, contraste, impressão de teste e limpeza de código/CSS órfão.

Os dados continuam fictícios. Nenhum Graph, lista `NOTAS_*`, fluxo Power Automate, permissão ou recurso Microsoft 365 foi criado ou alterado nesta etapa.

As regras do `AGENTS.md` da raiz do repositório também continuam válidas. Em caso de conflito, preserve o sistema operacional existente e peça confirmação antes de alterar autenticação, permissões, SharePoint, Microsoft Graph, Power Automate ou dados reais.

Regra permanente de publicação neste módulo: ao concluir uma etapa de alteração em `/notas/`, executar as validações proporcionais, fazer commit somente dos arquivos necessários e enviar para `origin/main` por padrão. Não fazer commit/push apenas se o responsável pedir explicitamente para deixar local. Tags, provisionamento Microsoft 365, permissões, SharePoint, Graph e Power Automate continuam exigindo autorização explícita separada.

Regra permanente de documentação neste módulo: toda etapa concluída deve atualizar `AGENTS_NOTAS.md`, especialmente **Estado atual**, **Decisões**, **Pendências** e **Registro de continuidade**, antes do commit/push.

Regra permanente de UI neste módulo: toda mudança visual nova deve prever transições/microinterações proporcionais, aparência compatível com o sistema, seletor acessível quando o `select` nativo destoar do design, e fallback por `prefers-reduced-motion`. Toda decisão estética aprovada deve ser propagada às próximas guias reconstruídas para manter o ecossistema padronizado.

Regra permanente de reconstrução: não reativar Boletim, Estatísticas como guia separada nem qualquer outra guia por meio de código/CSS legado. Cada nova guia deve nascer em etapa própria, com escopo aprovado, acessibilidade, testes de comportamento, documentação e validação visual.
