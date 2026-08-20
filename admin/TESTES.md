# TESTES — Centro de Administração Visual

## Regra

Executar testes por escopo. Não reauditar Arquivo Digital, Notas ou Livro de Ponto se os arquivos desses módulos não forem alterados.

Branch: `feat/admin-visual-builder`.
Baseline: `96e16d599d06768a0ab6a7a0ea807b94a838a168`.

## 1. Validação estática

- [ ] `admin/admin.js` sem erro de sintaxe.
- [ ] `admin/editor/escola-editor.js` sem erro de sintaxe.
- [ ] `admin/editor/index.html` sem recurso local crítico ausente.
- [ ] `admin/editor/vendor/grapes.min.js` existe e não está vazio.
- [ ] `admin/editor/vendor/grapes.min.css` existe e não está vazio.
- [ ] licença GrapesJS está versionada em `admin/editor/vendor/`.
- [ ] diff não altera `arquivo-digital/`, `notas/` ou `admin/livro-ponto/`.
- [ ] não existem TinaCMS, TinaCloud, Astro, PHP ou dependência Vercel introduzidos.
- [ ] editor final não usa CDN em runtime.
- [ ] nenhum token/segredo foi versionado.

## 2. Login e acesso

- [ ] abrir `/admin/` sem sessão → login.
- [ ] conta autorizada → dashboard.
- [ ] conta não autorizada → acesso restrito.
- [ ] Sair encerra sessão.
- [ ] nome do usuário aparece corretamente.
- [ ] validar compatibilidade real da permissão Graph antes de reduzir `Sites.ReadWrite.All`.

## 3. UI do painel

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

## 4. Atalhos dos sistemas

- [ ] Livro de Ponto abre `/admin/livro-ponto/`.
- [ ] Arquivo Digital abre `/arquivo-digital/`.
- [ ] Gestão de Notas abre `/notas/`.
- [ ] Ver site abre a Home.

## 5. GitHub

Usar token restrito ao repositório.

- [ ] sem token, gravação pede conexão.
- [ ] token inválido mostra mensagem simples.
- [ ] token válido é aceito.
- [ ] sem “lembrar” → sessão somente.
- [ ] com “lembrar” → apenas navegador local.
- [ ] token não aparece em commit, HTML, JSON ou log público.

## 6. Publicações

- [ ] criar rascunho.
- [ ] criar publicação publicada.
- [ ] editar.
- [ ] excluir.
- [ ] buscar publicação.
- [ ] enviar JPG.
- [ ] enviar PNG/WebP.
- [ ] imagem vai para `imagens/publicacoes/`.
- [ ] JSON mantém o objeto `home`.
- [ ] publicações não editadas permanecem.
- [ ] conflito não sobrescreve silenciosamente outra alteração.
- [ ] publicação aparece no `local` correto.
- [ ] rascunho não aparece.
- [ ] período inicial/final é respeitado.

## 7. Runtime GrapesJS

- [ ] workflow do PR incorpora GrapesJS `0.22.13`.
- [ ] `VERSION.txt` registra versão/origem/licença.
- [ ] JS vendorizado tem tamanho esperado (> 1 MB).
- [ ] CSS vendorizado tem tamanho esperado (> 50 KB).
- [ ] abrir editor com rede externa bloqueada continua funcionando, exceto serviços já necessários ao admin como GitHub quando salvar.

## 8. Editor visual

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
- [ ] Home + JSON são gravados no mesmo commit Git.
- [ ] `force:false` impede avanço destrutivo do ref em conflito.
- [ ] título/subtítulo/missão conhecidos sincronizam com `home` do JSON.
- [ ] indicadores de seção legada sincronizam quando editados.
- [ ] bloco novo permanece no HTML sem depender do JSON legado.
- [ ] recarregar confirma persistência.
- [ ] scripts originais continuam presentes no HTML salvo.
- [ ] `<!DOCTYPE html>` é preservado.

Mídia:

- [ ] upload cria arquivo em `imagens/editor/`.
- [ ] limite defensivo de 8 MB é respeitado.
- [ ] arquivo não-imagem é recusado.
- [ ] imagem enviada aparece no Asset Manager.

Escopo:

- [ ] editor não oferece criação arbitrária de novas páginas.
- [ ] editor não oferece `arquivo-digital`, `notas` ou Livro de Ponto para edição.
- [ ] editor não expõe edição de scripts ao usuário comum.

## 9. Regressão pública

- [ ] Home mantém carregamento normal.
- [ ] menus e atalhos continuam funcionando.
- [ ] animações/reveal continuam funcionando após salvar.
- [ ] `site-data/publicacoes-site.js` continua carregando.
- [ ] nenhuma publicação existente é perdida.
- [ ] calendário e professores continuam acessíveis.
- [ ] Área Restrita continua abrindo `/admin/`.

## 10. Limpeza

- [x] `institucional/index.html` removido na branch.
- [x] `site-institucional/` preservado.
- [x] `admin/admin-preview.js` removido.
- [x] workflow VvvebJs removido.
- [x] adaptador `escola-componentes.js` do VvvebJs removido.
- [x] criação arbitrária de páginas retirada do primeiro marco.
- [ ] confirmar ausência de botão “Preparar SharePoint”.
- [ ] confirmar ausência de tela de enquetes inacabada.
- [ ] confirmar ausência de tela de configuração de listas SharePoint.

## 11. Vercel residual

- [ ] identificar a integração externa que cria o check `Vercel`.
- [ ] remover/desconectar essa integração administrativamente.
- [ ] confirmar que nenhum teste obrigatório depende dela.

## 12. Antes do merge

- [ ] comparar branch inteira com `main`.
- [ ] revisar chamadas GitHub de escrita.
- [ ] revisar permissão Microsoft/Entra em conjunto com o código.
- [ ] confirmar licença e versão local do GrapesJS.
- [ ] executar smoke test real no navegador.
- [ ] usuário aprovar visual e fluxo.
- [ ] somente então solicitar autorização explícita para merge.
