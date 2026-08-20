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

O admin havia acumulado formulários próprios para Home, gerenciamento próprio de seções, publicações e provisionamento em listas SharePoint, sincronização SharePoint → JSON → GitHub, configurações técnicas expostas, enquetes inacabadas e preview separado do editor real.

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

Runtime final:

- `admin/editor/vendor/grapes.min.js`
- `admin/editor/vendor/grapes.min.css`

O runtime fica no próprio repositório. CDN não é dependência de execução do candidato final.

### Bundles já validados

`grapes.min.js`
- 1095002 bytes
- SHA-256 `c459a47bf7ff831e309b10aab4ce27c8d2d8280f62aa35dc6c1b7f776368f8c6`
- `node --check` aprovado

`grapes.min.css`
- 60968 bytes
- SHA-256 `1edd206fb9e41c60d70c66cfdb2e79e2b9358df5c952333a8b5a6a5989f8c2d4`

Esses arquivos foram fornecidos pelo usuário. A conexão GitHub desta sessão não possui parâmetro para anexar arquivos locais grandes, portanto ainda precisam estar fisicamente presentes na branch antes do teste real.

### Por que GrapesJS substituiu VvvebJs

VvvebJs foi avaliado primeiro, mas sua distribuição exigia muitos arquivos independentes. A tentativa de vendorização automática acrescentava complexidade operacional. GrapesJS oferece os recursos necessários com dois bundles principais e uma integração menor.

Não reintroduzir VvvebJs sem nova decisão arquitetural.

## 6. Escopo do primeiro editor

O editor visual trabalha **somente na Home (`index.html`)**.

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

Criação arbitrária de páginas foi retirada até a Home ser validada por usuário leigo.

## 7. Compatibilidade da Home antiga

O renderizador público ainda utiliza o bloco `home` de `site-data/publicacoes-publicas.json` para alguns textos conhecidos.

Para não criar duas versões divergentes, o salvamento visual:

1. gera o novo `index.html`;
2. extrai os campos conhecidos da Home;
3. sincroniza esses valores no bloco `home` do JSON;
4. cria os blobs dos dois arquivos;
5. cria uma nova tree Git;
6. cria um commit único;
7. move o ref sem `force`.

A Home real foi verificada e contém os seletores usados por essa compatibilidade, incluindo título, subtítulo, missão, `#topbar`, `<footer>` e atributos das seções.

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

A tela de Publicações mantém título, resumo, conteúdo, local, aparência, imagem, link, botão, período, publicado/rascunho, id e atualização. O contrato foi comparado com `site-data/publicacoes-site.js` e é compatível estaticamente.

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

O ambiente previamente funcional foi validado com `Sites.ReadWrite.All`. Durante a revisão anterior aos testes o código foi restaurado para esse escopo, evitando alterar consentimentos do Entra ID neste marco. A redução para leitura deve ocorrer posteriormente, em conjunto com App Registration, consentimento e teste específico.

## 10. UI administrativa

Navegação principal:

- Visão geral
- Publicações
- Editar site
- Livro de Ponto
- Sistemas

Princípios: poucas decisões por tela, linguagem não técnica, ação frequente evidente, efeitos discretos, responsividade, foco visível e suporte a `prefers-reduced-motion`.

## 11. Livro de Ponto

O módulo real já existe em `admin/livro-ponto/`.

O novo painel liga diretamente para esse módulo. Nenhum arquivo interno do Livro de Ponto é alterado.

## 12. Limpeza

Removidos na branch:

- `institucional/index.html`, página de teste redundante;
- `admin/admin-preview.js`, preview customizado duplicado;
- workflows/adaptadores VvvebJs;
- workflow temporário GrapesJS que não executou;
- modelo de criação arbitrária de páginas do primeiro desenho.

Preservado:

- `site-institucional/`;
- `arquivo-digital/`;
- `notas/`;
- `admin/livro-ponto/`.

## 13. Segurança GitHub

O token nunca entra no repositório, fica na sessão por padrão e só é lembrado localmente por opção do usuário.

Home + JSON usam Git Data API para um commit único. Upload de mídia usa Contents API separadamente.

`admin/github-safe-target.js` protege o desenvolvimento: fora dos hosts oficiais, chamadas GitHub destinadas a `main` são redirecionadas para `feat/admin-visual-builder`. O teste isolado dessa proteção passou em 5/5 cenários.

## 14. Vercel residual

O código novo não depende de Vercel.

O GitHub ainda apresenta um check externo `Vercel`. A conta Vercel conectada nesta sessão retorna zero projetos relacionados e não acessa o deployment indicado. Isso é limpeza administrativa separada e não requisito do produto.

## 15. Critérios de aceite

Antes de merge:

1. bundles GrapesJS presentes na branch e batendo com os hashes fixados;
2. login Microsoft funcional;
3. autorização da Secretaria funcional;
4. dashboard desktop e celular;
5. Livro de Ponto abre pelo painel;
6. Arquivo Digital e Notas intactos;
7. criar/editar/excluir publicação na branch protegida;
8. upload de imagem;
9. publicação renderizada;
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

## 16. Rollback

Enquanto estiver isolado, rollback = descartar `feat/admin-visual-builder`.

Baseline permanente deste marco:

`96e16d599d06768a0ab6a7a0ea807b94a838a168`

## 17. Próximos marcos possíveis

Somente após a Home visual ser aprovada por usuário leigo:

- ampliar/refinar blocos;
- biblioteca de mídia mais amigável;
- avaliar criação controlada de páginas;
- revisar navegação pública;
- migrar totalmente a Home para HTML como única fonte, removendo o bloco legado `home` do JSON.
