# TESTES — Centro de Administração Visual

## Regra

Executar testes por escopo. Não reauditar Arquivo Digital, Notas ou Livro de Ponto se os arquivos desses módulos não forem alterados.

Branch de teste: `feat/admin-visual-builder`.
Baseline: `96e16d599d06768a0ab6a7a0ea807b94a838a168`.

## 1. Validação estática

- [ ] `admin/admin.js` sem erro de sintaxe.
- [ ] `admin/editor/escola-editor.js` sem erro de sintaxe.
- [ ] `admin/editor/escola-componentes.js` sem erro de sintaxe.
- [ ] HTML principal abre sem recursos ausentes críticos.
- [ ] diff não altera `arquivo-digital/`, `notas/` ou `admin/livro-ponto/`.
- [ ] não existem TinaCMS, Vercel, Astro ou PHP introduzidos.
- [ ] nenhum token/segredo versionado.

## 2. Login e acesso

- [ ] abrir `/admin/` sem sessão → tela de login.
- [ ] entrar com conta autorizada → dashboard.
- [ ] entrar com conta não autorizada → acesso restrito.
- [ ] botão Sair encerra sessão e volta ao site.
- [ ] nome do usuário aparece corretamente.

## 3. UI

Desktop:

- [ ] sidebar estável.
- [ ] Visão geral abre sem rolagem horizontal.
- [ ] cards têm hover/foco sem ocultar ações.
- [ ] navegação troca de tela corretamente.
- [ ] modal GitHub abre e fecha.

Celular:

- [ ] menu lateral abre/fecha.
- [ ] cards ficam em uma coluna.
- [ ] formulário de publicação é utilizável.
- [ ] botões não ficam cortados.
- [ ] não há rolagem horizontal inesperada.

Acessibilidade:

- [ ] tabulação alcança controles principais.
- [ ] foco de teclado é visível.
- [ ] `prefers-reduced-motion` reduz movimentos.

## 4. Atalhos dos sistemas

- [ ] Livro de Ponto abre `/admin/livro-ponto/`.
- [ ] Arquivo Digital abre `/arquivo-digital/`.
- [ ] Gestão de Notas abre `/notas/`.
- [ ] Ver site abre a Home pública.

## 5. GitHub

Usar token restrito ao repositório.

- [ ] sem token, salvar publicação pede configuração.
- [ ] token inválido produz mensagem amigável.
- [ ] token válido é aceito.
- [ ] opção sem “lembrar” grava somente na sessão.
- [ ] opção “lembrar” persiste apenas no dispositivo.
- [ ] token não aparece em nenhum commit ou arquivo público.

## 6. Publicações

- [ ] criar publicação como rascunho.
- [ ] criar publicação publicada.
- [ ] editar publicação existente.
- [ ] excluir publicação.
- [ ] pesquisar por título/conteúdo/local.
- [ ] enviar imagem JPG.
- [ ] enviar imagem PNG ou WebP.
- [ ] imagem é criada em `imagens/publicacoes/`.
- [ ] JSON mantém o objeto `home` existente.
- [ ] JSON mantém publicações não editadas.
- [ ] conflito de SHA não sobrescreve silenciosamente outra alteração.
- [ ] publicação aparece no site conforme `local`.
- [ ] rascunho não aparece no site.
- [ ] datas inicial/final são respeitadas pelo renderizador público.

## 7. Editor visual

- [ ] `/admin/editor/` abre sem backend PHP.
- [ ] Home real é carregada como página inicial.
- [ ] texto existente pode ser selecionado e editado.
- [ ] elemento pode ser movido.
- [ ] bloco Escola Iêda pode ser inserido.
- [ ] undo funciona.
- [ ] redo funciona.
- [ ] preview funciona.
- [ ] visualização celular funciona.
- [ ] Salvar atualiza `index.html` pelo GitHub.
- [ ] recarregar confirma persistência da alteração.
- [ ] criar nova página gera `paginas/<slug>/index.html`.
- [ ] página recém-criada pode ser reaberta.
- [ ] upload do editor cria arquivo em `imagens/editor/`.
- [ ] imagem enviada pode ser aplicada a um elemento de imagem selecionado.
- [ ] editor não oferece edição direta de `arquivo-digital/`, `notas/` e Livro de Ponto.

## 8. Regressão pública

- [ ] `https://escolaieda.com/` mantém carregamento normal.
- [ ] menus e atalhos da Home continuam funcionando.
- [ ] `site-data/publicacoes-site.js` continua carregando.
- [ ] nenhuma publicação antiga é perdida.
- [ ] calendário/professor/portais continuam acessíveis.

## 9. Limpeza

- [ ] `institucional/index.html` removido.
- [ ] `site-institucional/` preservado.
- [ ] `admin/admin-preview.js` removido e sem referência restante.
- [ ] nenhum botão “Preparar SharePoint”.
- [ ] nenhuma tela de enquetes inacabada.
- [ ] nenhuma tela de configuração de listas SharePoint.

## 10. Antes do merge

- [ ] comparar branch inteira com `main`.
- [ ] revisar permissões Microsoft realmente necessárias.
- [ ] revisar todas as chamadas GitHub de escrita.
- [ ] confirmar licença/commit vendorizado do VvvebJs.
- [ ] usuário aprovar visual e fluxo real.
- [ ] somente então solicitar autorização explícita para merge.
