# Instruções do módulo de notas

Antes de criar, alterar ou revisar qualquer arquivo dentro desta pasta, leia integralmente `AGENTS_NOTAS.md`, `ANALISE_PLANILHAS_2026.md` e, quando o trabalho envolver a prova online, `POC_EXCEL_ONLINE_2026.md`.

O arquivo `AGENTS_NOTAS.md` é a fonte de verdade do projeto: contém decisões aprovadas, arquitetura, restrições, segurança, modelo de dados, direção visual, plano de implantação e o ponto exato de continuidade. `ANALISE_PLANILHAS_2026.md` registra o funcionamento confirmado nos arquivos reais e o contrato de integração proposto. `POC_EXCEL_ONLINE_2026.md` registra o roteiro operacional da prova controlada com Excel Online (Business) e o teste online já feito pela Microsoft Graph Workbook API.

Estado atual: existe uma SPA estática em `/notas/`, em modo demonstração, com visual reimaginado a partir das referências em `C:\Users\Eugui\Desktop\imagens` e corrigido para ficar mais fiel aos prints reais do banco de notas (`APROVEITAMENTO`, `BOLETIM`, `FICHA ALUNO` e `CONSELHO`). As áreas atuais são Turma, Banco, Alunos, Boletim, Conselho, Relatórios, Sync e Estrutura; `#banco`, `#boletins` e `#conselho` abrem telas específicas. Os dados continuam fictícios e o cliente Graph serve apenas para autenticação/verificação estrutural das futuras listas `NOTAS_*`. Ela não substitui o provisionamento real nem autoriza criação de recursos Microsoft 365.

As regras do `AGENTS.md` da raiz do repositório também continuam válidas. Em caso de conflito, preserve o sistema operacional existente e peça confirmação antes de alterar autenticação, permissões, SharePoint, Microsoft Graph, Power Automate ou dados reais.
