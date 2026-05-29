# Escola Iêda MCPM

Repositório do site e dos sistemas digitais da Escola Municipal Professora Iêda Alves de Oliveira MCPM.

## Estrutura principal

```text
escolaieda/
├─ index.html                 # Página inicial pública do site escolaieda.com
├─ CNAME                      # Domínio personalizado do GitHub Pages
├─ AGENTS.md                  # Guia operacional do projeto Arquivo Digital Escolar
├─ README.md                  # Organização geral do repositório
│
├─ institucional/             # Página de teste da futura área institucional
│  └─ index.html
│
├─ arquivo-digital/           # Sistema Arquivo Digital Escolar (não mover sem fase própria)
│  └─ index.html
│
├─ portais/                   # Portais de teste ou áreas futuras
│  ├─ aluno/
│  ├─ professor/
│  └─ direcao/
│
├─ aluno/                     # Redirecionamento antigo para portais/aluno
├─ professor/                 # Redirecionamento antigo para portais/professor
├─ direcao/                   # Redirecionamento antigo para portais/direcao
│
├─ site-institucional/        # Pasta prevista para páginas públicas institucionais
├─ professores.html           # Página institucional pública de professores
├─ calendario.html            # Página institucional pública de calendário escolar
├─ imagens/                   # Imagens usadas por páginas atuais
├─ arquivos/                  # Arquivos públicos ou auxiliares
├─ fundo_logo_ieda.jpg
└─ logo_escola.png
```

## Regras de organização

- A raiz deve ficar reservada para a página inicial, domínio, documentação e arquivos exigidos pela publicação.
- O `arquivo-digital/` é sensível e não deve ser movido ou reorganizado sem diagnóstico próprio.
- Páginas antigas usadas em links públicos devem continuar existindo como redirecionamento quando forem movidas.
- Portais de aluno, professor e direção estão em fase de teste.
- A pasta `institucional/` é a página de teste da futura área institucional/secretaria.
- Mudanças grandes devem ser feitas em fases pequenas e testáveis.

## Roteiro de organização

### Fase 1 — Portais de teste

Concluída.

- Criar `portais/aluno/`, `portais/professor/` e `portais/direcao/`.
- Manter `/aluno/`, `/professor/` e `/direcao/` como redirecionamentos.

### Fase 1.1 — Área institucional de teste

Concluída parcialmente.

- Criar `institucional/index.html`.
- Usar `https://escolaieda.com/institucional/` como endereço da futura área institucional.
- Próximo ajuste seguro: ativar no `index.html` da home o redirecionamento de perfis `secretaria`, `secretario`, `institucional`, `admin` e `administrador` para `/institucional/`.

### Fase 2 — Páginas institucionais públicas

Próxima fase recomendada.

- Organizar `professores.html` e `calendario.html` dentro de `site-institucional/`.
- Manter os caminhos antigos como redirecionamentos para não quebrar links públicos.

### Fase 3 — Imagens e arquivos públicos

- Organizar imagens em `assets/`, atualizando caminhos com cuidado.
- Testar todas as páginas publicadas depois de mover imagens.

### Fase 4 — Arquivo Digital

- Não mover `arquivo-digital/` agora.
- Só planejar organização interna em fase própria, com diagnóstico específico e sem alterar comportamento.
