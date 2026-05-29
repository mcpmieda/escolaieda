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
- Arquivos grandes, como `index.html`, `professores.html` e `calendario.html`, devem ser alterados preferencialmente pelo Codex/PowerShell, com edição local pequena, validação e conferência de diferenças antes do commit.

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

#### Roteiro para o Codex — ativar rota institucional

Codex deve ler este README e o AGENTS.md, preservar `arquivo-digital/` sem alterações e editar somente o trecho de rotas no `index.html` da raiz.

A alteração desejada é colocar os perfis `secretaria`, `secretario`, `institucional`, `admin` e `administrador` em `ROTAS_PORTAL_ATIVAS`, apontando para `/institucional/`. Esses mesmos perfis devem sair de `ROTAS_PORTAL_FUTURAS`, ou a lista futura pode ficar vazia se não houver outra rota pendente.

Antes de concluir, conferir que apenas o trecho de rotas do `index.html` mudou.

### Fase 2 — Páginas institucionais públicas

Em andamento inicial.

- Já existem rotas organizadas em `site-institucional/professores.html` e `site-institucional/calendario.html`, por enquanto redirecionando para as páginas antigas da raiz.
- Próxima etapa segura: mover de verdade `professores.html` e `calendario.html` para `site-institucional/`, mantendo os caminhos antigos como redirecionamentos para não quebrar links públicos.
- Essa fase deve ser executada pelo Codex/PowerShell, porque envolve arquivos grandes e caminhos internos de imagens/scripts.

#### Roteiro para o Codex — mover páginas institucionais

Codex deve ler este README e o AGENTS.md, preservar `arquivo-digital/` sem alterações e executar a Fase 2 com mudança pequena e validada.

Plano da Fase 2:

1. Copiar o conteúdo completo de `professores.html` para `site-institucional/professores.html`.
2. Copiar o conteúdo completo de `calendario.html` para `site-institucional/calendario.html`.
3. Transformar `professores.html` da raiz em redirecionamento para `/site-institucional/professores.html`.
4. Transformar `calendario.html` da raiz em redirecionamento para `/site-institucional/calendario.html`.
5. Atualizar na home apenas os links públicos de professores e calendário para os novos caminhos.
6. Conferir caminhos internos de imagens e arquivos nas páginas movidas.
7. Conferir que `arquivo-digital/` não foi alterado.

Não fazer refatoração visual nem mudança de design nessa fase.

### Fase 3 — Imagens e arquivos públicos

- Organizar imagens em `assets/`, atualizando caminhos com cuidado.
- Testar todas as páginas publicadas depois de mover imagens.

### Fase 4 — Arquivo Digital

- Não mover `arquivo-digital/` agora.
- Só planejar organização interna em fase própria, com diagnóstico específico e sem alterar comportamento.
