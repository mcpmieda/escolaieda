# Centro de Administração Visual — Escola Iêda

## Status

O Centro de Administração está em **candidato final de produção** na branch `main`.

Domínio oficial: `https://escolaieda.com/admin/`.

A arquitetura principal foi concluída ao longo dos PRs #27 a #35. A tag final `v1.0.0` fica reservada para depois da última rodada de testes de fechamento.

## Objetivo alcançado

O projeto substituiu um painel administrativo excessivamente técnico por uma central única para a Secretaria, com menos navegação, menos dependências e menos tarefas manuais.

O objetivo vigente é **fechar a V1**, não continuar acrescentando funcionalidades.

## Arquitetura final da V1

```text
Usuário autorizado
        ↓
/admin/
        ├── Visão geral
        ├── Conteúdo do site
        │     ├── Publicações
        │     └── Editar página
        ├── Livro de Ponto
        └── Sistemas
              ├── Gestão de Notas
              ├── Arquivo Digital
              └── Portais operacionais
```

### Publicações

```text
Admin → GitHub → site-data/publicacoes-publicas.json → site público
```

### Home visual

```text
Admin → GrapesJS local → Git Data API → index.html + JSON de compatibilidade
```

### Autorização

```text
Microsoft Entra ID → Microsoft Graph → leitura de DOCUMENTOS_ATIVOS → acesso ao admin
```

O SharePoint não é mais armazenamento de Publicações do site.

## Marcos implementados

### PR #27 — Admin visual + GrapesJS

- nova UI administrativa;
- Publicações diretas no GitHub;
- GrapesJS `0.22.13` local;
- remoção da dependência do CMS SharePoint para conteúdo público;
- simplificação do editor para Home apenas.

### PR #28 — Livro de Ponto integrado

- Livro de Ponto passou a abrir dentro do admin via same-origin iframe;
- módulo original e `localStorage` preservados.

### PR #29 — Livro de Ponto em área total

- retirada da sensação de “aplicativo dentro do aplicativo”;
- melhor uso de largura e altura.

### PR #30 — tentativa de shell unificado

- tentativa provocou travamento por reorganização dinâmica do DOM;
- alteração foi revertida integralmente;
- lição registrada: não usar `MutationObserver` para rearranjar o próprio workspace.

### PR #31 — shell unificado estável

- barra superior redundante removida;
- ações de conta mantidas nos cabeçalhos das views;
- Editar página incorporado a Publicações;
- Livro de Ponto com abas no topo;
- flash de login eliminado sem alterar autenticação.

### PR #32 — Conteúdo do site

- Publicações e Editar página passaram a compartilhar a mesma área;
- editor visual embutido no admin.

### PR #33 — Gestão de Notas integrada

- Notas/Boletim incorporados em Sistemas;
- Arquivo Digital mantido independente por segurança.

### PR #34 — dashboard da Secretaria

- indicadores de Publicações;
- acessos rápidos operacionais;
- Home administrativa deixou de ser apenas uma coleção de cartões genéricos.

### PR #35 — central de portais

- Sistemas internos e portais externos organizados na mesma área;
- atalhos externos abrem em nova guia e não compartilham credenciais com o admin.

## Editor visual

Motor: GrapesJS `0.22.13`, BSD-3-Clause.

Runtime local:

- `admin/editor/vendor/grapes.min.js`
- `admin/editor/vendor/grapes.min.css`
- `admin/editor/vendor/GRAPESJS-LICENSE`
- `admin/editor/vendor/VERSION.txt`

Recursos da V1:

- edição de textos;
- Título, Texto, Cartões, Destaque e Botão;
- aparência;
- Estrutura;
- undo/redo;
- computador/tablet/celular;
- prévia;
- salvamento explícito;
- proteção de cabeçalho e rodapé.

Troca/upload de imagem dentro do editor visual foi retirada da V1 após teste real de persistência. Isso não afeta imagens do formulário de Publicações.

## Segurança e dados

- token GitHub nunca é versionado;
- sessão é padrão; persistência local é opcional;
- `main` é produção;
- fora dos domínios oficiais, escritas GitHub devem ser bloqueadas;
- Microsoft Entra autentica;
- SharePoint serve apenas como gate de leitura da Secretaria no admin;
- Arquivo Digital permanece isolado por possuir fluxo Microsoft/Graph próprio.

## O que já foi validado em produção

O usuário confirmou:

- login oficial;
- dashboard;
- navegação do admin;
- Publicações + Editar página integrados;
- Livro de Ponto integrado;
- Gestão de Notas integrada;
- Sistemas e portais;
- correção do flash de login entre views.

## O que falta para `v1.0.0`

Somente fechamento:

1. teste completo de Publicações em produção;
2. teste de imagem de Publicação;
3. salvamento controlado do editor visual em produção;
4. logout e acesso negado;
5. regressão final da Home e páginas públicas em desktop/celular;
6. revisão final de segurança e permissões;
7. documentação final dos resultados;
8. criação da tag/release `v1.0.0`.

## Fora do escopo de fechamento

Não bloqueiam a V1:

- agenda;
- enquetes;
- criação arbitrária de novas páginas;
- biblioteca de mídia avançada;
- troca de imagens dentro do editor visual;
- novos sistemas ou dashboards.

Esses itens só devem voltar como V2 depois do fechamento formal.

## Rollback

Até a criação da tag `v1.0.0`, o rollback deve usar commits estáveis da `main`.

Após o fechamento, `v1.0.0` será o ponto oficial de referência e rollback da primeira versão completa.