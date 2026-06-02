# Escola Ieda MCPM

Repositorio do site publico e dos sistemas digitais da Escola Municipal Professora Ieda Alves de Oliveira MCPM.

O projeto e publicado pelo GitHub Pages no dominio `https://escolaieda.com/`. Ele reune a pagina inicial da escola, paginas institucionais, portais em teste e o sistema interno Arquivo Digital Escolar.

## Visao Geral

- `index.html` e a home publica do site.
- `site-institucional/` concentra paginas publicas da escola, como professores e calendario escolar.
- `institucional/` e a area institucional/secretaria em teste.
- `portais/` guarda areas experimentais para aluno, professor e direcao.
- `arquivo-digital/` e uma aplicacao separada, sensivel, integrada ao Microsoft 365, SharePoint e Microsoft Graph.
- `imagens/` contem apenas imagens usadas pelas paginas publicas atuais.
- `scripts/` contem validadores e testes do Arquivo Digital.
- `AGENTS.md` preserva o contexto operacional detalhado do Arquivo Digital e nao deve ser apagado.

## Estrutura

```text
escolaieda/
├─ index.html
├─ CNAME
├─ README.md
├─ AGENTS.md
│
├─ institucional/
│  └─ index.html
│
├─ site-institucional/
│  ├─ professores.html
│  └─ calendario.html
│
├─ arquivo-digital/
│  ├─ index.html
│  ├─ arquivo-digital.css
│  ├─ arquivo-digital.js
│  ├─ arquivo-digital-utils.js
│  └─ assets/
│
├─ portais/
│  ├─ aluno/
│  ├─ professor/
│  └─ direcao/
│
├─ aluno/
├─ professor/
├─ direcao/
│
├─ professores.html
├─ calendario.html
├─ imagens/
├─ scripts/
├─ fundo_logo_ieda.jpg
└─ logo_escola.png
```

## Paginas Publicas

A home apresenta a escola, informa o contato e direciona visitantes para calendario, professores e area institucional.

As paginas antigas `professores.html` e `calendario.html` continuam na raiz apenas como redirecionamentos para preservar links ja divulgados. O conteudo real dessas paginas fica em:

- `site-institucional/professores.html`
- `site-institucional/calendario.html`

## Portais

As pastas `aluno/`, `professor/` e `direcao/` mantem redirecionamentos de compatibilidade. As paginas de teste ficam em:

- `portais/aluno/`
- `portais/professor/`
- `portais/direcao/`

## Arquivo Digital

`arquivo-digital/` e o sistema de gestao de documentos escolares em PDF. Ele possui login Microsoft, integracao com SharePoint/Graph, upload, historico, anotacoes, gavetas, lixeira, duplicidades, substituicao, mesclagem e validacoes automatizadas.

Essa pasta nao deve ser reorganizada junto com o site institucional. Qualquer alteracao nela deve seguir o `AGENTS.md` e rodar as validacoes proprias.

## Imagens e Arquivos

O repositorio foi limpo para remover arquivos e imagens publicas sem referencia nas paginas atuais. As fotos de professores permanecem em `imagens/professores/` com os nomes usados pelo site institucional.

Relatorios de diagnostico e backups locais devem ficar fora do Git, conforme `.gitignore`.

## Validacoes

Para conferir o estado geral:

```powershell
git status --short
git diff --check
```

Para conferir o Arquivo Digital:

```powershell
node scripts/validar-arquivo-digital.mjs
node scripts/testes-regressao-arquivo-digital.mjs
node scripts/testes-utils-arquivo-digital.mjs
```

## Regras de Manutencao

- Nao apagar `AGENTS.md`.
- Nao mover `arquivo-digital/` sem planejamento especifico.
- Preservar redirecionamentos publicos antigos quando uma pagina mudar de caminho.
- Evitar commitar arquivos temporarios, relatorios locais ou backups.
- Preferir alteracoes pequenas, testaveis e com `git diff --check` antes do commit.
