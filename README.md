# Escola Iêda MCPM

Repositório do site e dos sistemas digitais da Escola Municipal Professora Iêda Alves de Oliveira MCPM.

## Continuação automática da organização

Quando este README for usado para retomar a organização do repositório, a próxima tarefa é seguir as fases pendentes descritas abaixo, na ordem em que aparecem.

Ordem atual:

```text
1. Fase 1.1 — ativar a rota institucional na home.
2. Fase 2 — mover professores.html e calendario.html para site-institucional/.
3. Fase 3 — otimizar imagens de professores e funcionários.
4. Parar antes de mover imagens para assets/, pois isso exige validação visual posterior.
```

Regra principal:

```text
Não alterar arquivo-digital/ durante esta organização.
```

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
- Imagens devem ser otimizadas com backup e relatório antes/depois, sem reduzir qualidade visual perceptível.

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

### Fase 3 — Otimizar imagens de professores e funcionários

Pendente.

Objetivo:

- Reduzir o peso das fotos da pasta `imagens/professores/`.
- Manter qualidade visual adequada para o site.
- Manter os nomes e extensões dos arquivos quando possível, para não quebrar caminhos existentes.
- Não alterar `arquivo-digital/`.

#### Roteiro para o Codex — otimizar imagens

Codex deve fazer a otimização localmente pelo PowerShell, não manualmente pelo GitHub web.

Plano seguro:

1. Ler este README e o AGENTS.md.
2. Conferir estado do Git.
3. Criar backup local da pasta `imagens/professores/` em `backups_locais/`.
4. Gerar relatório em `diagnosticos/` com tamanho de cada imagem antes da otimização.
5. Otimizar somente imagens de `imagens/professores/`.
6. Preferir manter o mesmo nome e a mesma extensão.
7. Para fotos JPG/JPEG, usar largura máxima entre 900px e 1200px e qualidade aproximada entre 82 e 88.
8. Para PNG, manter PNG se houver transparência; se for foto sem transparência, apenas sugerir conversão para JPG em relatório, sem converter automaticamente nesta fase.
9. Remover metadados pesados quando possível.
10. Gerar relatório depois da otimização com peso antes/depois e percentual reduzido.
11. Conferir visualmente algumas imagens importantes antes de commit.
12. Conferir que `arquivo-digital/` não foi alterado.

Critério de conclusão:

- Fotos continuam visualmente boas no site.
- O peso total de `imagens/professores/` diminui.
- Nenhum caminho público é quebrado.
- `arquivo-digital/` permanece intacto.

### Fase 4 — Imagens e arquivos públicos em assets

Futura.

- Organizar imagens em `assets/`, atualizando caminhos com cuidado.
- Testar todas as páginas publicadas depois de mover imagens.
- Não executar antes de validação visual, pois pode quebrar fundo, logo, favicon e fotos.

### Fase 5 — Arquivo Digital

Bloqueada por enquanto.

- Não mover `arquivo-digital/` agora.
- Só planejar organização interna em fase própria, com diagnóstico específico e sem alterar comportamento.
