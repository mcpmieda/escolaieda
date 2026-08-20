# Escola Iêda MCPM

Repositório do site público e dos sistemas digitais da Escola Municipal Professora Iêda Alves de Oliveira MCPM.

## Estado do projeto

O projeto está em **candidato final de produção**. A arquitetura principal já está implantada no domínio oficial `https://escolaieda.com/` e a branch de produção é `main`.

A tag final `v1.0.0` ainda não foi criada porque o fechamento formal depende da última rodada de testes funcionais e de regressão pública.

## Hospedagem

- Site público: GitHub Pages.
- Domínio oficial: `https://escolaieda.com/`.
- Fonte de produção: branch `main`.
- Não há outra plataforma de hospedagem necessária para o funcionamento do produto.

## Estrutura principal

- `index.html` — Home pública.
- `site-data/` — dados públicos consumidos pela Home.
- `site-institucional/` — páginas públicas reais, incluindo professores e calendário.
- `admin/` — Centro de Administração.
- `admin/editor/` — editor visual da Home com GrapesJS local.
- `admin/livro-ponto/` — Livro de Ponto Digital.
- `notas/` — Gestão de Notas e boletins.
- `arquivo-digital/` — sistema documental protegido da Secretaria.
- `imagens/` — ativos públicos e imagens de publicações.
- `scripts/` — validadores e rotinas auxiliares.
- `AGENTS.md` — contexto operacional do Arquivo Digital; preservar.

## Centro de Administração

O `/admin/` é a central administrativa única. A interface atual contém:

- **Visão geral** — dashboard da Secretaria com indicadores de conteúdo e acessos rápidos;
- **Publicações** — criação, edição, busca e exclusão de conteúdo do site;
- **Editar página** — editor visual da Home integrado dentro da área de Publicações;
- **Livro de Ponto** — módulo aberto dentro do próprio painel, com navegação superior;
- **Sistemas** — central de sistemas internos e portais externos;
- **Gestão de Notas** — módulo integrado dentro do painel;
- **Arquivo Digital** — módulo protegido independente, aberto em nova guia.

O usuário permanece no mesmo shell administrativo ao navegar entre as áreas integradas.

## Publicações

Fluxo atual:

```text
Centro de Administração
        ↓
GitHub
        ↓
site-data/publicacoes-publicas.json
        ↓
site-data/publicacoes-site.js
        ↓
site público
```

O SharePoint não é mais CMS de Publicações.

O formulário de Publicações suporta título, resumo, conteúdo, local, aparência, período, imagem, link, texto de botão e estado publicado/rascunho.

Imagens de Publicações são armazenadas em `imagens/publicacoes/`.

## Editor visual da Home

Motor: GrapesJS `0.22.13`, vendorizado localmente.

Recursos do marco atual:

- editar textos e elementos suportados;
- blocos Título, Texto, Cartões, Destaque e Botão;
- aparência do elemento selecionado;
- undo/redo;
- computador/tablet/celular;
- prévia local;
- salvamento explícito;
- cabeçalho e rodapé protegidos;
- scripts preservados fora do canvas.

A troca/upload de imagem dentro do editor visual não faz parte da V1. Imagem de Publicação é um fluxo separado e continua disponível.

O editor grava `index.html` e a compatibilidade do objeto `home` em `site-data/publicacoes-publicas.json` no mesmo commit Git.

## Microsoft e autorização

O login do Centro de Administração usa Microsoft Entra ID.

O SharePoint é usado apenas como gate de leitura para confirmar acesso da Secretaria por meio de `DOCUMENTOS_ATIVOS`. O novo CMS não grava Publicações no SharePoint.

O domínio oficial já foi validado com login Microsoft e acesso ao dashboard.

A permissão Graph ainda usa `Sites.ReadWrite.All` por compatibilidade com o consentimento existente. A redução para leitura é item de segurança separado e deve ser feita junto com App Registration, consentimento e teste específico.

## GitHub e segurança

- Repositório: `mcpmieda/escolaieda`.
- Branch de produção: `main`.
- O token GitHub nunca é versionado.
- Sessão é o armazenamento padrão; persistência local só ocorre quando o usuário opta por lembrar.
- Fora dos hosts oficiais, `admin/github-safe-target.js` bloqueia escritas GitHub para impedir alteração acidental de produção.

## Estado funcional já confirmado

Em produção foram confirmados pelo usuário:

- login Microsoft no domínio oficial;
- carregamento do Centro de Administração;
- dashboard da Secretaria;
- navegação unificada;
- Publicações + Editar página no mesmo painel;
- Livro de Ponto integrado;
- Gestão de Notas integrada;
- Sistemas e portais operacionais;
- ausência do antigo flash de login durante a navegação normal.

Em testes anteriores do editor foram confirmados edição de texto, blocos, undo/redo, prévia, responsividade básica e persistência de conteúdo suportado.

## Pendências para a tag `v1.0.0`

Somente itens de fechamento, sem adicionar novos recursos:

1. teste completo de Publicações em produção: criar rascunho, publicar, editar, buscar e excluir;
2. upload de imagem de Publicação;
3. teste controlado de salvamento do editor visual em produção;
4. teste de logout e conta não autorizada;
5. regressão final do site público em desktop e celular;
6. revisão final de segurança, incluindo a futura redução de permissão Graph;
7. criar a tag/release `v1.0.0` após aprovação desses testes.

Agenda, enquetes, criação arbitrária de páginas e troca de imagens pelo editor visual são melhorias futuras e não bloqueiam a conclusão da V1.

## Documentação do admin

- `admin/AI_CONTEXT.md` — estado técnico atual para continuidade com IA.
- `admin/PROJETO_ADMIN_VISUAL.md` — arquitetura e decisões vigentes.
- `admin/TESTES.md` — matriz atual de validação.
- `admin/EXECUCAO_ADMIN_VISUAL.md` — diário histórico de execução.
- `admin/editor/README.md` — documentação específica do editor.

## Regras de manutenção

- preservar `AGENTS.md`;
- não reorganizar `arquivo-digital/` sem planejamento específico;
- manter mudanças por escopo fechado;
- evitar arquivos temporários e branches de teste abandonadas;
- preferir GitHub como fonte de verdade do site;
- não introduzir banco, CMS externo ou dependência de hospedagem adicional sem necessidade comprovada;
- após o fechamento da V1, tratar novas funções como V2.