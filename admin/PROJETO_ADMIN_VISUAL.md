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

Runtime local incorporado:

- `admin/editor/vendor/grapes.min.js`
- `admin/editor/vendor/grapes.min.css`
- `admin/editor/vendor/GRAPESJS-LICENSE`
- `admin/editor/vendor/VERSION.txt`

O navegador usa os arquivos do próprio repositório. CDN não é dependência de execução do candidato final.

### Bundles validados e presentes na branch

`grapes.min.js`
- 1095002 bytes
- SHA-256 `c459a47bf7ff831e309b10aab4ce27c8d2d8280f62aa35dc6c1b7f776368f8c6`
- Git blob SHA `7e6965661f682e20915b4489cbeb3f85ec8706df`
- `node --check` aprovado

`grapes.min.css`
- 60968 bytes
- SHA-256 `1edd206fb9e41c60d70c66cfdb2e79e2b9358df5c952333a8b5a6a5989f8c2d4`
- Git blob SHA `62009a27142982215ecb7eb02f114eadf4e93841`

Os blobs Git coincidem exatamente com os arquivos fornecidos e validados antes do upload.

### Por que GrapesJS substituiu VvvebJs

VvvebJs foi avaliado primeiro, mas sua distribuição exigia muitos arquivos independentes. A tentativa de vendorização automática acrescentava complexidade operacional. GrapesJS oferece os recursos necessários com dois bundles principais e uma integração menor.

Não reintroduzir VvvebJs sem nova decisão arquitetural.

## 6. Escopo da V1 do editor

O editor visual trabalha **somente na Home (`index.html`)**.

Recursos da V1:

- editar textos e elementos suportados;
- arrastar blocos Título, Texto, Cartões, Destaque e Botão;
- alterar aparência do elemento selecionado;
- Estrutura/camadas;
- undo/redo;
- computador/tablet/celular;
- prévia local sem escrita;
- salvar somente por ação explícita;
- cabeçalho e rodapé protegidos contra exclusão acidental;
- scripts da Home preservados fora do canvas.

Criação arbitrária de páginas foi retirada até a Home ser validada por usuário leigo.

### Imagens no editor visual

Troca/upload de imagem dentro do editor **não faz parte da V1**.

Nos testes reais, o arquivo foi enviado ao GitHub e apareceu no Asset Manager, mas a imagem escolhida não permaneceu vinculada ao bloco depois de salvar e recarregar. Em vez de manter um recurso parcialmente funcional, o bloco Imagem foi removido e imagens existentes foram protegidas contra troca.

Essa decisão não afeta o upload de imagem no formulário estruturado de Publicações, que é um fluxo separado.

## 7. Compatibilidade da Home antiga

O renderizador público ainda utiliza o bloco `home` de `site-data/publicacoes-publicas.json` para alguns textos conhecidos.

Para não criar duas versões divergentes, o salvamento visual:

1. parte do HTML canônico do GitHub;
2. aplica o conteúdo suportado da Home;
3. extrai os campos conhecidos;
4. sincroniza esses valores no bloco `home` do JSON;
5. cria blobs dos dois arquivos;
6. cria uma nova tree Git;
7. cria um commit único;
8. move o ref sem `force`.

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

### Preview e redirect

No preview Vercel, o login chegou ao Microsoft Entra, mas o retorno foi bloqueado por `AADSTS50011` porque o domínio temporário não está cadastrado no App Registration.

Por decisão do usuário, esse redirect temporário não será adicionado. O teste completo do login fica para o domínio oficial.

## 10. UI administrativa

Navegação principal:

- Visão geral
- Publicações
- Editar site
- Livro de Ponto
- Sistemas

Princípios: poucas decisões por tela, linguagem não técnica, ação frequente evidente, efeitos discretos, responsividade, foco visível e suporte a `prefers-reduced-motion`.

O cartão do editor na Visão Geral foi alinhado ao escopo real da V1 e não promete edição de imagens.

## 11. Livro de Ponto

O módulo real já existe em `admin/livro-ponto/`.

O novo painel liga diretamente para esse módulo. Nenhum arquivo interno do Livro de Ponto é alterado.

## 12. Limpeza

Removidos na branch:

- `institucional/index.html`, página de teste redundante;
- `admin/admin-preview.js`, preview customizado duplicado;
- workflows/adaptadores VvvebJs;
- workflow temporário GrapesJS que não executou;
- modelo de criação arbitrária de páginas do primeiro desenho;
- bloco Imagem do editor V1;
- arquivos usados somente nos testes de `imagens/editor/`;
- resíduos de HTML/CSS/JSON gerados pelos testes de imagem.

Preservado:

- `site-institucional/`;
- `arquivo-digital/`;
- `notas/`;
- `admin/livro-ponto/`.

## 13. Segurança GitHub

O token nunca entra no repositório, fica na sessão por padrão e só é lembrado localmente por opção do usuário.

Home + JSON usam Git Data API para um commit único. Imagem de Publicações usa Contents API separadamente.

`admin/github-safe-target.js` protege o desenvolvimento: fora dos hosts oficiais, chamadas GitHub destinadas a `main` são redirecionadas para `feat/admin-visual-builder`.

A proteção passou em 5/5 cenários isolados e também foi comprovada em escrita real: os commits do editor foram para a branch de desenvolvimento e a `main` permaneceu intacta.

## 14. Testes reais já executados

Comprovado em navegador:

- GrapesJS local carrega a Home real;
- texto pode ser editado;
- Título, Texto, Cartões, Destaque e Botão funcionam e aparecem na Prévia;
- undo/redo;
- modos Computador e Celular;
- Prévia sem escrita;
- token GitHub válido aceito;
- escrita real protegida na branch;
- Home + JSON no mesmo commit;
- salvamento textual com diff mínimo após correção;
- bloco novo persistindo após recarregar.

Falha conhecida encerrada por decisão de escopo:

- imagem no editor visual não persistia e foi retirada da V1.

## 15. Vercel residual

O código novo não depende de Vercel.

O GitHub ainda apresenta um check externo Vercel e o ambiente está sendo usado apenas como preview temporário. Isso é limpeza administrativa separada e não requisito do produto final.

## 16. Critérios de aceite antes do merge

Concluídos ou comprovados:

1. bundles GrapesJS presentes e validados;
2. editor abre a Home real;
3. edição de texto;
4. blocos principais da V1;
5. undo/redo;
6. computador/celular;
7. prévia sem escrita;
8. escrita protegida na branch;
9. Home + JSON no mesmo commit;
10. persistência de bloco suportado;
11. nenhuma dependência Vercel/Tina/PHP/CDN em runtime;
12. módulos sensíveis preservados.

Pendentes para o candidato final:

1. login Microsoft completo no domínio oficial;
2. autorização da Secretaria;
3. dashboard desktop/celular autenticado;
4. Livro de Ponto, Arquivo Digital e Notas abrindo pelo painel;
5. criar/editar/excluir Publicação na branch protegida;
6. imagem de Publicação, se mantida;
7. publicação renderizada no local correto;
8. regressão pública final;
9. revisão final de CI/PR;
10. autorização explícita do usuário para merge.

Imagem dentro do editor visual **não é critério de aceite da V1**.

## 17. Rollback

Enquanto estiver isolado, rollback = descartar `feat/admin-visual-builder`.

Baseline permanente deste marco:

`96e16d599d06768a0ab6a7a0ea807b94a838a168`

## 18. Próximos marcos possíveis

Somente depois que a V1 estiver aprovada:

- ampliar/refinar blocos;
- retomar biblioteca de mídia com persistência comprovada;
- avaliar criação controlada de páginas;
- revisar navegação pública;
- migrar totalmente a Home para HTML como única fonte, removendo o bloco legado `home` do JSON;
- reduzir permissão Graph de forma coordenada.