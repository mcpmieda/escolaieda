# Centro de Administração Visual — Escola Iêda

## 1. Objetivo

Transformar `https://escolaieda.com/admin/` em uma central administrativa única, elegante e simples para usuários não técnicos, eliminando camadas desnecessárias e evitando desenvolver um CMS artesanal recurso por recurso.

## 2. Ponto seguro de partida

- Repositório: `mcpmieda/escolaieda`
- Baseline: `96e16d599d06768a0ab6a7a0ea807b94a838a168`
- Branch de desenvolvimento: `feat/admin-visual-builder`
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

O runtime é incorporado ao próprio repositório. CDN não é dependência de execução do candidato final. A origem cdnjs é usada apenas pelo processo controlado de vendorização para obter a versão fixada.

### Por que GrapesJS substituiu VvvebJs

VvvebJs foi avaliado primeiro, mas sua distribuição exigia uma quantidade grande de arquivos e dependências de runtime. A tentativa de vendorização automática não se materializou na branch.

GrapesJS oferece um bundle distribuível muito menor em superfície operacional e mantém os recursos necessários: seleção visual, blocos, estilos, camadas, asset manager, undo/redo e dispositivos.

Não reintroduzir VvvebJs sem nova decisão arquitetural.

## 6. Escopo do primeiro editor

O editor visual trabalha **somente na Home (`index.html`)**.

Foi retirada a criação arbitrária de páginas nesta fase. Essa capacidade aumentava muito o risco de navegação inconsistente e de complexidade para usuário leigo antes mesmo de a edição básica estar validada.

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
7. move `main` para esse commit sem `force`.

Assim Home e JSON não ficam pela metade se uma gravação falhar.

Uma etapa futura poderá remover definitivamente o bloco `home` do JSON quando a Home visual já estiver comprovada em produção.

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
- workflow e adaptadores VvvebJs;
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

## 14. Vendorização

Workflow:

`.github/workflows/vendor-grapesjs.yml`

Ele é restrito ao PR desta branch contra `main`, baixa GrapesJS 0.22.13, valida que JS/CSS/licença existem e grava os arquivos em `admin/editor/vendor/` na própria branch.

O workflow antigo `vendor-vvveb.yml` foi removido.

Não considerar o editor executável enquanto os arquivos locais de `vendor/` ainda não estiverem materializados.

## 15. Vercel residual

O código novo não depende de Vercel.

O GitHub ainda apresentou um check externo chamado `Vercel`, associado ao deployment `escolaieda-prova-visual-formato`. Isso é integração residual fora desta arquitetura e precisa de limpeza administrativa separada. Não usar esse deployment como requisito do produto.

## 16. Critérios de aceite

Antes de merge:

1. runtime GrapesJS local presente;
2. login Microsoft funcional;
3. autorização da Secretaria funcional;
4. dashboard desktop e celular;
5. Livro de Ponto abre pelo painel;
6. Arquivo Digital e Notas intactos;
7. criar/editar/excluir publicação;
8. upload de imagem de publicação;
9. publicação renderizada no site;
10. editor abre a Home real;
11. editar texto e imagem;
12. adicionar/mover bloco;
13. undo/redo;
14. modos computador/tablet/celular;
15. preview sem escrita;
16. salvar Home + JSON no mesmo commit;
17. recarregar e confirmar persistência;
18. nenhuma dependência Vercel/Tina/PHP/CDN em runtime;
19. nenhum módulo sensível modificado fora do escopo.

## 17. Rollback

Enquanto estiver isolado, rollback = descartar `feat/admin-visual-builder`.

Baseline permanente deste marco:

`96e16d599d06768a0ab6a7a0ea807b94a838a168`

## 18. Próximos marcos possíveis

Somente após a Home visual ser aprovada por usuário leigo:

- ampliar/refinar blocos;
- biblioteca de mídia mais amigável;
- avaliar criação controlada de páginas;
- revisar navegação pública;
- migrar totalmente a Home para HTML como única fonte, removendo o bloco legado `home` do JSON.
