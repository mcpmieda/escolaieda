# AI_CONTEXT — Centro de Administração da Escola Iêda

## Objetivo

Manter e evoluir o painel administrativo em `admin/` como centro simples de gestão do site e acesso aos módulos internos da Escola Iêda, preservando o que já funciona e evitando acoplamento indevido com o Arquivo Digital Escolar.

## Estado atual

- Baseline estável de referência: `main` em `c564fd5cf34666e9b9a314aeee8194ab802ceee1`.
- O painel funciona como mini-CMS da home pública.
- SharePoint é a fonte administrativa principal.
- `site-data/publicacoes-publicas.json` é a fonte pública derivada consumida pela home.
- A prévia completa da página está implementada como candidata na branch `feat/admin-preview-completa` e no PR #19.
- Validações estáticas da prévia foram aprovadas; smoke test visual com sessão real ainda é obrigatório antes de merge em `main`.

## Arquitetura

```text
admin/index.html
  → interface do painel
admin/admin.css
  → apresentação do painel
admin/admin.js
  → MSAL + Microsoft Graph + SharePoint + sincronização GitHub
admin/admin-preview.js
  → prévia local isolada, sem escrita externa
site-data/publicacoes-publicas.json
  → snapshot público derivado
site-data/publicacoes-site.js
  → renderizador público reutilizado também pela prévia
index.html
  → página pública real usada pela prévia
```

A prévia carrega a `index.html` real em memória, remove scripts que não pertencem à renderização pública, alimenta `site-data/publicacoes-site.js` com uma fonte JSON virtual dentro do iframe e permite alternar o viewport entre computador e celular.

`admin/livro-ponto/` é um módulo separado dentro da área administrativa e atualmente usa armazenamento local no navegador.

## Restrições obrigatórias

- Não reescrever o painel do zero.
- Trabalhar por escopo incremental e revisar por diff.
- Não alterar `arquivo-digital/` sem solicitação explícita.
- Não alterar autenticação, permissões, SharePoint, listas ou schema como efeito colateral de mudanças visuais do painel.
- Não inventar IDs, propriedades ou contratos do Microsoft Graph.
- Não colocar tokens ou segredos no repositório.
- Preservar o fluxo SharePoint → JSON derivado → GitHub Pages.
- Mudanças estruturais exigem baseline, impacto, backup/rollback e validação específica.

## Baseline seguro

Baseline vigente até aprovação do PR #19:

```text
c564fd5cf34666e9b9a314aeee8194ab802ceee1
```

Comportamentos que devem ser preservados:

- login Microsoft e validação de acesso da Secretaria;
- CRUD de publicações;
- rascunho, agendamento e expiração;
- editor de seções da home;
- sincronização automática agrupada para o GitHub;
- upload/otimização WebP;
- logs administrativos;
- ausência de alterações no Arquivo Digital durante trabalho do CMS.

## Método de trabalho

- entender antes de alterar;
- escopo fechado;
- mudanças pequenas;
- revisão por diff;
- testes dirigidos ao comportamento afetado;
- sem reauditoria completa em cada ajuste;
- checkpoint no GitHub ao concluir marco relevante.

## Decisões vigentes

- SharePoint continua sendo a fonte administrativa principal.
- O JSON público continua sendo derivado e reconstruível.
- O token GitHub não deve entrar no código-fonte.
- A prévia completa é somente leitura e não grava em SharePoint ou GitHub.
- A prévia reutiliza a `index.html` e o renderizador público reais para reduzir divergência futura.
- O JSON temporário da prévia usa uma rota virtual interceptada somente dentro do iframe; a tentativa inicial com `data:` URL foi descartada porque o cache-busting do renderizador invalidava o corpo JSON.
- Publicações do tipo Modal recebem identificador temporário na prévia para não serem ocultadas por estado de sessão anterior da home pública.

## Dependências principais

- Microsoft Entra ID / MSAL Browser.
- Microsoft Graph.
- SharePoint.
- GitHub Contents API.
- GitHub Pages.

## Testes obrigatórios

Para mudanças comuns no CMS:

```text
node --check admin/admin.js
node --check admin/admin-preview.js
node --check site-data/publicacoes-site.js
git diff --check
```

Para a prévia completa:

```text
abrir prévia sem salvar → nenhuma escrita externa ocorre
modo computador → home completa é exibida na largura ampla
modo celular → mesma home é exibida em viewport móvel
alterar título/seção sem salvar → prévia reflete a edição
pré-visualizar publicação não salva → item aparece apenas na prévia
fechar prévia → retorna ao painel sem perder os campos editados
```

Resultados e pendências ficam em `admin/TESTES.md`.

## Segurança

- `arquivo-digital/` é sistema separado e sensível.
- Não ampliar `Sites.ReadWrite.All` nem alterar permissões neste ciclo sem trabalho explícito de segurança/autenticação.
- O token GitHub deve permanecer fora do repositório e com privilégio mínimo.
- O iframe da prévia executa somente o renderizador público controlado; os demais scripts da home são removidos da cópia de prévia.

## Operação e recuperação

- Para mudanças de código, usar o baseline registrado como ponto de retorno.
- Não empilhar correções sobre tentativa incerta; reverter ao último checkpoint estável quando necessário.
- A publicação pública pode ser reconstruída pelo fluxo de sincronização existente.
- O PR #19 permanece em rascunho até smoke test visual e autorização de merge.

## Últimos checkpoints

- `c564fd5cf34666e9b9a314aeee8194ab802ceee1` — baseline estável anterior ao desenvolvimento da prévia.
- `feat/admin-preview-completa` / PR #19 — candidata da prévia completa; ainda não é baseline de produção.

## Próxima ação concreta

Executar smoke test visual da prévia com uma conta autorizada, conferindo computador/celular, edição não salva de home/publicação, Modal/Banner quando disponíveis e ausência de escrita externa. Se aprovado, revisar o diff final e então decidir o merge em `main`.
