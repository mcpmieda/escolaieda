# TESTES — Centro de Administração Visual

## Regra

Executar testes por escopo. Não reauditar Arquivo Digital, Notas ou Livro de Ponto se os arquivos desses módulos não forem alterados.

Branch: `feat/admin-visual-builder`.
PR draft: `#27`.
Baseline: `96e16d599d06768a0ab6a7a0ea807b94a838a168`.

Não marcar teste visual como aprovado sem execução real no navegador.

## 1. Validação estática

- [ ] `admin/admin.js` sem erro de sintaxe.
- [ ] `admin/editor/escola-editor.js` sem erro de sintaxe.
- [x] `admin/github-safe-target.js` revisado e testado isoladamente.
- [ ] `admin/editor/index.html` sem recurso local crítico ausente.
- [ ] `admin/editor/vendor/grapes.min.js` existe e não está vazio.
- [ ] `admin/editor/vendor/grapes.min.css` existe e não está vazio.
- [x] licença GrapesJS está versionada em `admin/editor/vendor/`.
- [x] `VERSION.txt` registra GrapesJS 0.22.13 e BSD-3-Clause.
- [x] diff não altera `arquivo-digital/`, `notas/` ou `admin/livro-ponto/` nas comparações já realizadas.
- [x] workflow temporário de vendorização GrapesJS foi removido após não executar.
- [ ] confirmar por busca final que não existem TinaCMS, TinaCloud, Astro, PHP ou dependência Vercel introduzidos no código ativo.
- [ ] editor final não usa CDN em runtime.
- [x] busca no diff por padrão `ghp_` não encontrou token GitHub.
- [ ] executar busca final por demais formatos de segredo/token antes de merge.

## 2. Proteção de produção

- [x] em hostname não oficial, `contents?...ref=main` é redirecionado à branch de desenvolvimento.
- [x] em hostname não oficial, `/git/ref/heads/main` é redirecionado à branch de desenvolvimento.
- [x] em hostname não oficial, `/git/refs/heads/main` é redirecionado à branch de desenvolvimento.
- [x] em hostname não oficial, corpo JSON `branch: main` é redirecionado à branch de desenvolvimento.
- [x] chamadas Microsoft Graph permanecem inalteradas.
- [ ] confirmar em navegador que preview/local realmente grava em `feat/admin-visual-builder` com token de teste.
- [ ] confirmar no domínio oficial que a proteção não altera chamadas legítimas de produção.

Resultado do teste unitário isolado da camada `github-safe-target.js`: **5/5 aprovado**.

## 3. Login e acesso

- [ ] abrir `/admin/` sem sessão → login.
- [ ] conta autorizada → dashboard.
- [ ] conta não autorizada → acesso restrito.
- [ ] Sair encerra sessão.
- [ ] nome do usuário aparece corretamente.
- [ ] validar compatibilidade real da permissão Graph antes de reduzir `Sites.ReadWrite.All`.

## 4. UI do painel

Desktop:

- [ ] sidebar estável.
- [ ] Visão geral sem rolagem horizontal.
- [ ] cards com hover e foco sem ocultar ações.
- [ ] navegação interna correta.
- [ ] diálogo GitHub abre e fecha.

Celular:

- [ ] menu lateral abre/fecha.
- [ ] cards ficam em uma coluna.
- [ ] formulário de publicação utilizável.
- [ ] botões não ficam cortados.
- [ ] nenhuma rolagem horizontal inesperada.

Acessibilidade:

- [ ] controles principais acessíveis por teclado.
- [ ] foco visível.
- [ ] `prefers-reduced-motion` reduz movimentos.

## 5. Atalhos dos sistemas

- [ ] Livro de Ponto abre `/admin/livro-ponto/`.
- [ ] Arquivo Digital abre `/arquivo-digital/`.
- [ ] Gestão de Notas abre `/notas/`.
- [ ] Ver site abre a Home.

## 6. GitHub

Usar token restrito ao repositório.

- [ ] sem token, gravação pede conexão.
- [ ] token inválido mostra mensagem simples.
- [ ] token válido é aceito.
- [ ] sem “lembrar” → sessão somente.
- [ ] com “lembrar” → apenas navegador local.
- [ ] token não aparece em commit, HTML, JSON ou log público.

## 7. Publicações

Executar primeiro em ambiente não oficial, onde a proteção deve direcionar a escrita para `feat/admin-visual-builder`.

- [ ] criar rascunho.
- [ ] criar publicação publicada.
- [ ] editar.
- [ ] excluir.
- [ ] buscar publicação.
- [ ] enviar JPG.
- [ ] enviar PNG/WebP.
- [ ] imagem vai para `imagens/publicacoes/` na branch de teste.
- [ ] JSON mantém o objeto `home`.
- [ ] publicações não editadas permanecem.
- [ ] conflito não sobrescreve silenciosamente outra alteração.
- [ ] publicação aparece no `local` correto em ambiente seguro.
- [ ] rascunho não aparece.
- [ ] período inicial/final é respeitado.

## 8. Runtime GrapesJS

Estado atual:

- [x] versão fixada em `0.22.13`.
- [x] licença oficial local.
- [x] `VERSION.txt` local.
- [ ] `grapes.min.js` incorporado ao repositório.
- [ ] `grapes.min.css` incorporado ao repositório.
- [ ] JS local tem tamanho esperado (> 1 MB).
- [ ] CSS local tem tamanho esperado (> 50 KB).
- [ ] abrir editor com rede externa bloqueada continua funcionando, exceto serviços necessários quando o usuário salva.

Não existe mais workflow de vendorização ativo neste marco.

## 9. Editor visual

Carregamento:

- [ ] `/admin/editor/` abre sem PHP.
- [ ] Home real é carregada.
- [ ] scripts públicos não são executados dentro do canvas.
- [ ] logo/imagens relativas resolvem corretamente.
- [ ] estilos originais da Home aparecem no canvas.

Edição:

- [ ] texto existente selecionável/editável.
- [ ] elemento pode ser movido.
- [ ] bloco “Título” pode ser inserido.
- [ ] bloco “Texto” pode ser inserido.
- [ ] bloco “Cartões” pode ser inserido.
- [ ] bloco “Destaque” pode ser inserido.
- [ ] cabeçalho não pode ser apagado acidentalmente.
- [ ] rodapé não pode ser apagado acidentalmente.
- [ ] propriedades de aparência aparecem para o elemento selecionado.
- [ ] painel Camadas funciona.
- [ ] undo funciona.
- [ ] redo funciona.

Responsividade e prévia:

- [ ] Computador funciona.
- [ ] Tablet funciona.
- [ ] Celular funciona.
- [ ] Prévia abre sem gravar GitHub.
- [ ] fechar prévia retorna ao mesmo estado do editor.

Salvamento:

- [ ] Salvar sem token pede conexão.
- [ ] em ambiente de teste, escrita vai para `feat/admin-visual-builder`.
- [ ] Home + JSON são gravados no mesmo commit Git.
- [ ] `force:false` impede avanço destrutivo do ref em conflito.
- [ ] título/subtítulo/missão conhecidos sincronizam com `home` do JSON.
- [ ] indicadores de seção legada sincronizam quando editados.
- [ ] bloco novo permanece no HTML sem depender do JSON legado.
- [ ] recarregar confirma persistência.
- [ ] scripts originais continuam presentes no HTML salvo.
- [ ] `<!DOCTYPE html>` é preservado.

Mídia:

- [ ] upload cria arquivo em `imagens/editor/` na branch-alvo correta.
- [ ] limite defensivo de 8 MB é respeitado.
- [ ] arquivo não-imagem é recusado.
- [ ] imagem enviada aparece no Asset Manager.

Escopo:

- [x] editor não oferece criação arbitrária de novas páginas no código atual.
- [x] editor não oferece `arquivo-digital`, `notas` ou Livro de Ponto para edição no código atual.
- [x] editor não expõe edição de scripts ao usuário comum no desenho atual.

## 10. Regressão pública

- [ ] Home mantém carregamento normal.
- [ ] menus e atalhos continuam funcionando.
- [ ] animações/reveal continuam funcionando após salvar.
- [ ] `site-data/publicacoes-site.js` continua carregando.
- [ ] nenhuma publicação existente é perdida.
- [ ] calendário e professores continuam acessíveis.
- [ ] Área Restrita continua abrindo `/admin/`.

## 11. Limpeza

- [x] `institucional/index.html` removido na branch.
- [x] `site-institucional/` preservado.
- [x] `admin/admin-preview.js` removido.
- [x] workflow VvvebJs removido.
- [x] workflow temporário GrapesJS removido após não executar.
- [x] adaptador `escola-componentes.js` do VvvebJs removido.
- [x] criação arbitrária de páginas retirada do primeiro marco.
- [ ] confirmar ausência de botão “Preparar SharePoint”.
- [ ] confirmar ausência de tela de enquetes inacabada.
- [ ] confirmar ausência de tela de configuração de listas SharePoint.

## 12. Vercel residual

- [x] código novo não depende de Vercel nas comparações já realizadas.
- [x] equipe Vercel conectada retorna zero projetos acessíveis.
- [ ] identificar/remover administrativamente a integração externa que ainda cria o check `Vercel`, se possível.
- [x] nenhum teste obrigatório deve depender dela.

## 13. Antes do merge

- [ ] comparar branch inteira com `main` novamente.
- [ ] revisar chamadas GitHub de escrita novamente após smoke test.
- [ ] revisar permissão Microsoft/Entra em conjunto com o código.
- [ ] confirmar bundles, licença e versão local do GrapesJS.
- [ ] executar smoke test real no navegador.
- [ ] usuário aprovar visual e fluxo.
- [ ] somente então solicitar autorização explícita para merge.
