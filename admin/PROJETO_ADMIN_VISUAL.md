# Centro de Administração Visual — Escola Iêda

## 1. Objetivo

Transformar `https://escolaieda.com/admin/` em uma central administrativa única, elegante e simples para usuários não técnicos, eliminando camadas desnecessárias e evitando desenvolver um CMS artesanal recurso por recurso.

## 2. Ponto seguro de partida

- Repositório: `mcpmieda/escolaieda`
- Baseline: `96e16d599d06768a0ab6a7a0ea807b94a838a168`
- Branch de desenvolvimento: `feat/admin-visual-builder`
- PR draft: `#27`
- Regra: `main` permanece intocada até validação real e autorização explícita.

## 3. Problema anterior

O admin havia acumulado:

- formulários próprios para Home;
- gerenciamento próprio de seções;
- publicações em listas SharePoint;
- provisionamento de listas;
- sincronização SharePoint → JSON → GitHub;
- configurações técnicas expostas ao usuário;
- enquetes inacabadas;
- preview separado do editor real.

Isso contrariava o objetivo de uma rotina simples para a Secretaria.

## 4. Arquitetura atual

```text
Usuário autorizado
        ↓
/admin/
        ├── Visão geral
        ├── Publicações
        ├── Editar site → /admin/editor/
        ├── Livro de Ponto → /admin/livro-ponto/
        └── Sistemas

Publicações
        ↓
GitHub
        ↓
site-data/publicacoes-publicas.json
        ↓
site-data/publicacoes-site.js
        ↓
site público

Home visual
        ↓
GrapesJS local
        ↓
Git Data API
        ↓
index.html + sincronização de compatibilidade do JSON
```

## 5. Editor visual

Motor: `GrapesJS/grapesjs`.

Versão fixada neste marco: `0.22.13`.
Licença: BSD-3-Clause.

Runtime final esperado:

- `admin/editor/vendor/grapes.min.js`
- `admin/editor/vendor/grapes.min.css`
- `admin/editor/vendor/GRAPESJS-LICENSE`
- `admin/editor/vendor/VERSION.txt`

Já incorporados:

- licença oficial;
- metadados de versão.

Ainda pendentes:

- `grapes.min.js`;
- `grapes.min.css`.

O candidato final não deve depender de CDN em runtime.

### Por que GrapesJS substituiu VvvebJs

VvvebJs foi avaliado primeiro, mas sua distribuição exigia uma quantidade grande de arquivos e dependências de runtime. A tentativa de vendorização automática não se materializou na branch.

GrapesJS oferece os recursos necessários com superfície operacional menor: seleção visual, blocos, estilos, camadas, Asset Manager, undo/redo e dispositivos.

Não reintroduzir VvvebJs sem nova decisão arquitetural.

## 6. Escopo do primeiro editor

O editor visual trabalha **somente na Home (`index.html`)**.

Foi retirada a criação arbitrária de páginas nesta fase. Essa capacidade aumentava o risco de navegação inconsistente e a complexidade para usuário leigo antes de a edição básica estar validada.

Recursos desta primeira versão:

- editar textos e elementos existentes;
- arrastar blocos próprios;
- alterar aparência do elemento selecionado;
- camadas;
- undo/redo;
- computador/tablet/celular;
- prévia local sem escrita;
- upload de imagens para `imagens/editor/`;
- salvar somente por ação explícita;
- cabeçalho e rodapé protegidos contra exclusão acidental;
- scripts da Home preservados fora do canvas.

## 7. Compatibilidade da Home antiga

O renderizador público ainda utiliza o bloco `home` de `site-data/publicacoes-publicas.json` para alguns textos conhecidos.

Para não criar duas versões divergentes, o salvamento visual:

1. gera o novo `index.html`;
2. extrai título, subtítulo, missão, texto de informações e seções legadas;
3. sincroniza esses valores no bloco `home` do JSON;
4. cria os blobs dos dois arquivos;
5. cria uma nova tree Git;
6. cria um commit único;
7. move o branch-alvo para esse commit sem `force`.

Assim Home e JSON não ficam pela metade se uma gravação falhar.

Uma etapa futura poderá remover definitivamente o bloco `home` do JSON quando a Home visual estiver comprovada em produção.

## 8. Publicações

Fluxo antigo:

```text
Admin → SharePoint Lists → sincronização → GitHub → site
```

Fluxo novo:

```text
Admin → GitHub JSON → site
```

A tela de Publicações mantém título, resumo, conteúdo, local, aparência, imagem, link, botão, período de exibição, publicado/rascunho, id e atualização.

## 9. Microsoft / SharePoint

Mantido:

- login Microsoft;
- leitura de `DOCUMENTOS_ATIVOS` como gate da Secretaria.

Removido do CMS público:

- criar/provisionar listas;
- “Preparar SharePoint”;
- CRUD de publicações em listas;
- sincronização SharePoint → GitHub;
- telas das listas técnicas do antigo portal.

O novo código de conteúdo não escreve no SharePoint.

### Permissão Graph

O ambiente previamente funcional foi validado com `Sites.ReadWrite.All`. A redução para `Sites.Read.All` deve ser feita apenas em conjunto com a App Registration do Entra ID. Não assumir que a redução já está pronta apenas porque o novo CMS não precisa escrever no SharePoint.

## 10. UI administrativa

Navegação principal:

- Visão geral
- Publicações
- Editar site
- Livro de Ponto
- Sistemas

Princípios:

- poucas decisões por tela;
- linguagem não técnica;
- ação frequente evidente;
- efeitos discretos;
- responsividade;
- foco visível;
- `prefers-reduced-motion`;
- nenhuma ação essencial dependente de hover.

## 11. Livro de Ponto

O módulo real já existe em `admin/livro-ponto/`.

O novo painel liga diretamente para esse módulo. Nenhum arquivo interno do Livro de Ponto é alterado.

## 12. Limpeza

Removidos na branch:

- `institucional/index.html`, página de teste redundante;
- `admin/admin-preview.js`, preview customizado duplicado;
- workflows e adaptadores VvvebJs;
- workflow temporário de vendorização GrapesJS que não executou;
- modelo de criação arbitrária de páginas do primeiro desenho.

Preservado:

- `site-institucional/`, pois contém páginas reais/legadas;
- `arquivo-digital/`;
- `notas/`;
- `admin/livro-ponto/`.

## 13. Segurança GitHub

O token:

- nunca entra no repositório;
- fica na sessão por padrão;
- só é lembrado localmente por opção do usuário;
- deve ser restrito ao repositório e a conteúdo.

Home + JSON usam Git Data API para um commit único. Upload de mídia usa a Contents API e é uma operação separada.

### Alvo seguro durante testes

`admin/github-safe-target.js` protege a produção:

- `escolaieda.com` e `www.escolaieda.com` mantêm `main`;
- qualquer outro hostname redireciona referências GitHub deste repositório de `main` para `feat/admin-visual-builder`;
- Microsoft Graph e demais origens ficam inalterados.

A camada é carregada antes de `admin.js` e antes de `escola-editor.js`.

Teste isolado realizado: **5/5 aprovado**.

Essa proteção é requisito para testes com token real fora da produção.

## 14. Vendorização

A tentativa inicial por GitHub Actions foi descartada porque não houve execução nem na abertura nem na reabertura do PR #27.

O workflow temporário foi removido em `5b970391...`.

Estado atual:

- licença e versão estão versionadas;
- os dois bundles compilados JS/CSS ainda precisam ser incorporados ao próprio repositório;
- o editor não deve ser considerado executável antes disso.

Não adicionar um mecanismo permanente de build ou hospedagem apenas para resolver essa cópia de arquivos.

## 15. Vercel residual

O código novo não depende de Vercel.

O GitHub ainda apresentou um check externo chamado `Vercel`, associado ao nome `escolaieda-prova-visual-formato`. A equipe Vercel conectada retorna zero projetos acessíveis. Trata-se de uma pendência externa à arquitetura nova.

Não usar esse deployment/check como requisito do produto.

## 16. Critérios de aceite

Antes de merge:

1. runtime GrapesJS local completo;
2. login Microsoft funcional;
3. autorização da Secretaria funcional;
4. dashboard desktop e celular;
5. Livro de Ponto abre pelo painel;
6. Arquivo Digital e Notas intactos;
7. criar/editar/excluir publicação na branch segura durante teste;
8. upload de imagem de publicação;
9. publicação renderizada em ambiente seguro;
10. editor abre a Home real;
11. editar texto e imagem;
12. adicionar/mover bloco;
13. undo/redo;
14. modos computador/tablet/celular;
15. preview sem escrita;
16. salvar Home + JSON no mesmo commit na branch segura durante teste;
17. recarregar e confirmar persistência;
18. nenhuma dependência Vercel/Tina/PHP/CDN em runtime final;
19. nenhum módulo sensível modificado fora do escopo;
20. usuário aprovar visual e fluxo real.

## 17. Rollback

Enquanto estiver isolado, rollback = descartar `feat/admin-visual-builder`.

Baseline permanente deste marco:

`96e16d599d06768a0ab6a7a0ea807b94a838a168`

A branch acidental `temp-should-not-create` foi neutralizada nesse mesmo baseline e não deve ser usada.

## 18. Próximos marcos possíveis

Somente após a Home visual ser aprovada por usuário leigo:

- ampliar/refinar blocos;
- biblioteca de mídia mais amigável;
- avaliar criação controlada de páginas;
- revisar navegação pública;
- migrar totalmente a Home para HTML como única fonte, removendo o bloco legado `home` do JSON.
