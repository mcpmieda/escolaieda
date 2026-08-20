# TESTES — Centro de Administração Visual

## Regra

Executar testes por escopo. Não reauditar Arquivo Digital, Notas ou Livro de Ponto se os arquivos desses módulos não forem alterados.

Branch: `feat/admin-visual-builder`.
Baseline: `96e16d599d06768a0ab6a7a0ea807b94a838a168`.

## 1. Validação estática

- [ ] `admin/admin.js` sem erro de sintaxe em ambiente de execução real.
- [ ] `admin/editor/escola-editor.js` sem erro de sintaxe em ambiente de execução real.
- [x] `admin/editor/index.html` aponta somente para o runtime GrapesJS local.
- [x] `admin/editor/vendor/grapes.min.js` existe fisicamente na branch.
- [x] `admin/editor/vendor/grapes.min.css` existe fisicamente na branch.
- [x] licença GrapesJS está versionada em `admin/editor/vendor/`.
- [x] bundles fornecidos pelo usuário identificados como GrapesJS 0.22.13.
- [x] `grapes.min.js` fornecido passa em `node --check`.
- [x] tamanho e SHA-256 dos dois bundles registrados em `vendor/VERSION.txt`.
- [x] blobs Git dos arquivos da branch coincidem exatamente com os arquivos locais validados.
- [x] diff não altera `arquivo-digital/`, `notas/` ou arquivos internos de `admin/livro-ponto/` nas comparações realizadas.
- [x] não foram introduzidos TinaCMS, TinaCloud, Astro, PHP ou dependência Vercel no código novo.
- [x] nenhum token/segredo foi encontrado no diff revisado.
- [x] editor não usa CDN para carregar GrapesJS em runtime.

## 2. Login e acesso

- [ ] abrir `/admin/` sem sessão → login.
- [ ] conta autorizada → dashboard.
- [ ] conta não autorizada → acesso restrito.
- [ ] Sair encerra sessão.
- [ ] nome do usuário aparece corretamente.
- [x] código restaurado temporariamente para `Sites.ReadWrite.All`, escopo já utilizado pelo ambiente funcional anterior.
- [ ] em marco posterior, reduzir permissão Graph somente junto com App Registration/consentimento e teste específico.

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

- [x] código do painel aponta Livro de Ponto para `/admin/livro-ponto/`.
- [x] código do painel aponta Arquivo Digital para `/arquivo-digital/`.
- [x] código do painel aponta Gestão de Notas para `/notas/`.
- [ ] validar os três atalhos em navegador real.

## 5. GitHub e proteção de teste

Usar token restrito ao repositório.

- [x] `admin/github-safe-target.js` existe.
- [x] teste isolado da proteção de branch: 5/5 cenários aprovados.
- [x] fora de `escolaieda.com`, `?ref=main` é redirecionado para `feat/admin-visual-builder`.
- [x] Git refs de `main` são redirecionados para a branch de desenvolvimento.
- [x] corpo JSON com `branch: main` é redirecionado.
- [x] chamada Microsoft Graph não é alterada pela proteção GitHub.
- [ ] repetir teste de escrita real com token agora que o runtime está na branch.
- [ ] sem token, gravação pede conexão.
- [ ] token inválido mostra mensagem simples.
- [ ] token válido é aceito.
- [ ] sem “lembrar” → sessão somente.
- [ ] com “lembrar” → apenas navegador local.
- [ ] token não aparece em commit, HTML, JSON ou log público.

## 6. Publicações

- [x] contrato de campos comparado com `site-data/publicacoes-site.js` e compatível estaticamente.
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

`grapes.min.js`

- tamanho esperado/confirmado: `1095002` bytes;
- SHA-256: `c459a47bf7ff831e309b10aab4ce27c8d2d8280f62aa35dc6c1b7f776368f8c6`;
- Git blob SHA: `7e6965661f682e20915b4489cbeb3f85ec8706df`.

`grapes.min.css`

- tamanho esperado/confirmado: `60968` bytes;
- SHA-256: `1edd206fb9e41c60d70c66cfdb2e79e2b9358df5c952333a8b5a6a5989f8c2d4`;
- Git blob SHA: `62009a27142982215ecb7eb02f114eadf4e93841`.

- [x] arquivos presentes na branch batem exatamente com os arquivos validados antes do upload.
- [x] licença e versão local estão presentes ao lado do runtime.
- [ ] abrir editor com rede externa bloqueada continua funcionando, exceto serviços necessários ao salvamento/autenticação.

## 8. Editor visual

Compatibilidade estática com a Home real:

- [x] `[data-home-titulo]` existe.
- [x] `[data-home-subtitulo]` existe.
- [x] `[data-home-missao]` existe.
- [x] `#topbar` existe e pode ser protegido.
- [x] `<footer>` existe e pode ser protegido.
- [x] seções legadas usam atributos esperados pelo sincronizador.

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

- [x] editor não oferece criação arbitrária de novas páginas.
- [x] editor não oferece Arquivo Digital, Notas ou Livro de Ponto para edição.
- [x] editor não expõe edição de scripts ao usuário comum.

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
- [x] workflow temporário GrapesJS removido depois de não executar.
- [x] adaptador `escola-componentes.js` do VvvebJs removido.
- [x] criação arbitrária de páginas retirada do primeiro marco.
- [x] contrato `PUBLICACOES_SITE` não aparece no novo `admin.js` revisado.
- [ ] confirmar visualmente ausência das telas antigas no navegador.

## 11. Vercel residual

- [x] confirmado que o check `Vercel` continua externo ao código novo.
- [x] conta Vercel conectada nesta sessão não apresenta o projeto desse deployment residual.
- [ ] remover/desconectar a integração administrativamente.
- [x] nenhum teste obrigatório foi desenhado para depender dela.

## 12. Revisão do PR após runtime

- [x] runtime local incorporado ao PR.
- [x] branch comparada novamente com o baseline após o upload.
- [x] branch está `ahead` e `0` commits atrás do baseline.
- [x] arquivos internos de Arquivo Digital, Notas e Livro de Ponto continuam fora do diff.
- [x] CodeRabbit retornou sucesso no head pós-upload.
- [x] nenhuma thread de review está aberta.

## 13. Antes do merge

- [ ] executar smoke test real no navegador.
- [ ] testar escrita somente contra branch protegida.
- [ ] usuário aprovar visual e fluxo.
- [ ] somente então solicitar autorização explícita para merge.
