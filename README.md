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
- Mudanças grandes devem ser feitas em fases pequenas e testáveis.

## Próximas fases recomendadas

1. Organizar páginas institucionais em `site-institucional/`, mantendo redirecionamentos antigos.
2. Organizar imagens em `assets/`, atualizando caminhos com cuidado.
3. Só depois planejar organização interna do `arquivo-digital/`, sem alterar comportamento.
