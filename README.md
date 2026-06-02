# Escola Iêda MCPM

Repositório do site público e dos sistemas digitais da Escola Municipal Professora Iêda Alves de Oliveira MCPM.

O projeto é publicado pelo GitHub Pages no domínio `https://escolaieda.com/` e reúne a página institucional da escola, páginas públicas de calendário e equipe, portais em teste e o sistema interno Arquivo Digital Escolar.

## Características do repositório

- Site institucional estático em HTML, CSS e JavaScript.
- Publicação via GitHub Pages com domínio personalizado definido em `CNAME`.
- Páginas públicas organizadas em `site-institucional/`.
- Portais experimentais em `portais/`, com redirecionamentos antigos preservados.
- Sistema sensível `arquivo-digital/` isolado da organização institucional.
- Imagens de professores otimizadas sem alterar nomes nem caminhos públicos.
- Pastas locais de trabalho, como `backups_locais/` e `diagnosticos/`, ficam fora do Git.

## Estrutura principal

```text
escolaieda/
├─ index.html                    # Home pública do site escolaieda.com
├─ CNAME                         # Domínio personalizado do GitHub Pages
├─ AGENTS.md                     # Guia operacional do Arquivo Digital Escolar
├─ README.md                     # Visão geral e organização do repositório
│
├─ institucional/                # Área institucional/secretaria em teste
│  └─ index.html
│
├─ site-institucional/           # Páginas públicas institucionais
│  ├─ professores.html
│  ├─ calendario.html
│  └─ README.md
│
├─ arquivo-digital/              # Sistema Arquivo Digital Escolar
│  ├─ index.html
│  ├─ arquivo-digital.css
│  ├─ arquivo-digital.js
│  └─ arquivo-digital-utils.js
│
├─ portais/                      # Portais de teste ou áreas futuras
│  ├─ aluno/
│  ├─ professor/
│  └─ direcao/
│
├─ aluno/                        # Redirecionamento antigo para portais/aluno
├─ professor/                    # Redirecionamento antigo para portais/professor
├─ direcao/                      # Redirecionamento antigo para portais/direcao
│
├─ professores.html              # Redirecionamento para site-institucional/professores.html
├─ calendario.html               # Redirecionamento para site-institucional/calendario.html
├─ imagens/                      # Imagens usadas pelas páginas atuais
├─ arquivos/                     # Arquivos públicos ou auxiliares
├─ fundo_logo_ieda.jpg
└─ logo_escola.png
```

## Áreas do site

### Home pública

A home em `index.html` apresenta a escola, atalhos públicos, contato e entrada para perfis. Os links de professores e calendário apontam para `site-institucional/`.

### Área institucional

A área `institucional/` é a rota de teste para secretaria/administração. Os perfis `secretaria`, `secretario`, `institucional`, `admin` e `administrador` já redirecionam para `/institucional/`.

### Site institucional

A pasta `site-institucional/` concentra páginas públicas da escola:

- `professores.html`: equipe gestora, coordenação e professores.
- `calendario.html`: calendário escolar e arquivo de calendário.

Os caminhos antigos `/professores.html` e `/calendario.html` continuam existindo como redirecionamentos para preservar links já divulgados.

### Portais

Os portais `aluno`, `professor` e `direcao` estão organizados em `portais/`. As pastas antigas na raiz continuam como redirecionamentos.

### Arquivo Digital Escolar

`arquivo-digital/` é uma aplicação separada e sensível, integrada ao Microsoft 365, SharePoint e Microsoft Graph. Ela organiza documentos escolares em PDF, com upload, histórico, anotações, gavetas, lixeira, duplicidades, substituição e mesclagem.

Regra permanente: não mover nem reorganizar `arquivo-digital/` sem fase própria, diagnóstico específico e validações do `AGENTS.md`.

## Estado da organização

### Fase 1 — Portais de teste

Concluída.

- `portais/aluno/`, `portais/professor/` e `portais/direcao/` criados.
- `/aluno/`, `/professor/` e `/direcao/` preservados como redirecionamentos.

### Fase 1.1 — Rota institucional

Concluída.

- `institucional/index.html` criado.
- Perfis institucionais ativados na home para `/institucional/`.

### Fase 2 — Páginas institucionais públicas

Concluída.

- `professores.html` movido para `site-institucional/professores.html`.
- `calendario.html` movido para `site-institucional/calendario.html`.
- Arquivos antigos da raiz transformados em redirecionamentos.
- Links públicos da home atualizados.

### Fase 3 — Otimização de imagens de professores

Concluída.

- Fotos JPG/JPEG de `imagens/professores/` recomprimidas e limitadas a dimensão máxima de 1200px quando necessário.
- Nomes e extensões foram preservados.
- PNGs foram preservados sem conversão automática.
- Backup local e relatório foram gerados em pastas ignoradas pelo Git.

### Fase 4 — Imagens e arquivos públicos em assets

Futura.

- Organizar imagens em `assets/`, atualizando caminhos com cuidado.
- Exige validação visual posterior porque pode afetar fundo, logo, favicon, calendário e fotos.
- Não executar automaticamente sem novo plano.

### Fase 5 — Arquivo Digital

Bloqueada por enquanto.

- Não mover `arquivo-digital/`.
- Qualquer organização interna deve ser planejada separadamente.

## Regras de manutenção

- Não alterar `arquivo-digital/` durante organização institucional.
- Manter redirecionamentos quando uma página pública mudar de caminho.
- Fazer mudanças grandes em fases pequenas e testáveis.
- Otimizar imagens com backup e relatório antes/depois.
- Não criar tags sem pedido explícito.
- Evitar `git add .`; adicionar apenas arquivos da fase.

## Validações recomendadas

```powershell
git status --short
git diff --check
node scripts/validar-arquivo-digital.mjs
node scripts/testes-regressao-arquivo-digital.mjs
node scripts/testes-utils-arquivo-digital.mjs
```

Para mudanças fora do Arquivo Digital, conferir também:

- links da home;
- redirecionamentos antigos;
- caminhos internos de imagens nas páginas movidas;
- renderização visual das fotos otimizadas.
