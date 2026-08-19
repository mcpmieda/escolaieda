# TESTES — Centro de Administração

## Convenção

Registrar aqui somente testes relevantes do painel administrativo. Testes específicos do Arquivo Digital pertencem à documentação e aos runners próprios daquele sistema.

## Marco — prévia completa da página

Branch de desenvolvimento: `feat/admin-preview-completa`

Baseline de comparação: `c564fd5cf34666e9b9a314aeee8194ab802ceee1`

### Comportamentos esperados

1. Abrir a prévia não grava em SharePoint nem GitHub.
2. A prévia reutiliza a `index.html` real e o renderizador público `site-data/publicacoes-site.js`.
3. Alterações ainda não salvas no editor da home aparecem na prévia.
4. Na aba Publicações, a publicação em edição aparece na prévia sem ser salva.
5. Computador e Celular usam a mesma página, alterando somente a largura do viewport.
6. Fechar a prévia retorna ao painel sem apagar os campos em edição.
7. Scripts da home que não pertencem à renderização pública não são executados na prévia.

### Validações executadas

#### Sintaxe do novo módulo

Comando equivalente executado sobre o conteúdo atual de `admin/admin-preview.js`:

```text
node --check admin/admin-preview.js
```

Resultado: **APROVADO**.

#### Ausência de escrita externa no novo módulo

Foi verificado o novo `admin/admin-preview.js` em busca de métodos/indicadores de escrita (`POST`, `PATCH`, `PUT`, `DELETE`), endpoints Graph/GitHub, `Authorization` e token de sessão.

Resultado: **APROVADO** — o módulo de prévia faz somente leitura da home/JSON público e manipulação local de DOM/iframe.

#### Fonte virtual e cache-busting

O renderizador público acrescenta `?v=<timestamp>` à URL de dados. A primeira tentativa com `data:` URL foi descartada porque o query string passava a fazer parte do corpo e invalidava o JSON.

A implementação final usa uma rota virtual somente dentro do iframe (`/__admin-preview-data__.json`) e intercepta o `fetch` local antes de executar o renderizador público.

Teste isolado reproduzindo o cache-busting e a interceptação:

```text
/__admin-preview-data__.json?v=123
→ interceptado pelo pathname
→ Response JSON temporária
→ JSON.parse aprovado
```

Resultado: **APROVADO**.

#### Revisão por diff

O escopo da branch foi comparado com o baseline.

Arquivos de código afetados neste marco:

```text
admin/index.html
admin/admin.css
admin/admin-preview.js
```

Documentação adicionada:

```text
admin/AI_CONTEXT.md
admin/TESTES.md
```

Resultado: **APROVADO** — nenhuma alteração em `arquivo-digital/`, autenticação, permissões, SharePoint, schema, `site-data/` ou home pública.

### Smoke test visual ainda necessário antes do merge em `main`

Executar no painel real com uma conta autorizada:

```text
[ ] abrir Publicações → Prévia da página
[ ] confirmar carregamento da home completa
[ ] alternar Computador ↔ Celular
[ ] digitar uma publicação sem salvar e confirmar que aparece somente na prévia
[ ] editar título/subtítulo/seção da home sem salvar e confirmar a prévia
[ ] conferir Banner, seção comum e Modal quando houver itens disponíveis
[ ] fechar a prévia e confirmar que os campos editados continuam preenchidos
[ ] confirmar que nenhuma ação da prévia criou commit ou alteração no SharePoint
```

Até esse smoke test ser concluído, a branch deve permanecer candidata e o PR deve continuar em rascunho.
