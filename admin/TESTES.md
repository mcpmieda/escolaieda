# TESTES — Centro de Administração Visual

## Regra

Executar testes por escopo. Não reauditar Arquivo Digital, Notas ou Livro de Ponto se os arquivos desses módulos não forem alterados.

Branch: `feat/admin-visual-builder`.
Baseline seguro: `96e16d599d06768a0ab6a7a0ea807b94a838a168`.
PR: `#27` — Draft, sem autorização de merge.

## 1. Validação estática e dependências

- [ ] `admin/admin.js` sem erro de sintaxe em ambiente de execução real.
- [ ] `admin/editor/escola-editor.js` sem erro de sintaxe após o fechamento final da V1.
- [x] `admin/editor/index.html` aponta somente para runtime GrapesJS local.
- [x] `admin/editor/vendor/grapes.min.js` existe fisicamente na branch.
- [x] `admin/editor/vendor/grapes.min.css` existe fisicamente na branch.
- [x] licença GrapesJS está versionada.
- [x] GrapesJS fixado em `0.22.13`.
- [x] `grapes.min.js` fornecido passou em `node --check`.
- [x] tamanho e SHA-256 dos bundles registrados em `vendor/VERSION.txt`.
- [x] blobs Git dos bundles coincidem com os arquivos validados.
- [x] novo admin reutiliza MSAL 5.11.0 local por import map.
- [x] GrapesJS/MSAL não dependem de CDN no candidato.
- [x] não foram introduzidos TinaCMS, TinaCloud, Astro, PHP, banco novo ou dependência Vercel no código do produto.
- [x] nenhum token/segredo foi encontrado no diff revisado.
- [x] `arquivo-digital/`, `notas/` e arquivos internos de `admin/livro-ponto/` permanecem fora do escopo alterado.

## 2. Login Microsoft e autorização

Teste no preview em 2026-08-20:

- [x] `/admin/` abre a interface de login.
- [x] botão “Entrar com Microsoft” chega ao Microsoft Entra e abre o fluxo de autenticação.
- [x] retorno do preview foi bloqueado com `AADSTS50011` por redirect URI temporária da Vercel não cadastrada.
- [x] usuário decidiu **não cadastrar** o domínio temporário no Entra.
- [ ] conta autorizada retorna ao dashboard no domínio oficial.
- [ ] conta não autorizada mostra acesso restrito.
- [ ] Sair encerra sessão.
- [ ] nome do usuário aparece corretamente.
- [x] código usa temporariamente `Sites.ReadWrite.All`, escopo já consentido no ambiente anterior.
- [ ] em marco posterior, reduzir permissão Graph somente junto com App Registration/consentimento e teste específico.

O erro `AADSTS50011` do preview não é tratado como regressão do código novo.

## 3. UI do Centro de Administração

A UI está implementada, mas o dashboard completo ainda não pôde ser aberto no preview por causa do redirect do Entra.

Desktop:

- [ ] sidebar estável em navegador real autenticado.
- [ ] Visão geral sem rolagem horizontal.
- [ ] cards com hover/foco sem ocultar ações.
- [ ] navegação interna correta.
- [ ] diálogo GitHub abre/fecha no dashboard.

Celular:

- [ ] menu lateral abre/fecha.
- [ ] cards ficam em uma coluna.
- [ ] formulário de publicação utilizável.
- [ ] botões não ficam cortados.
- [ ] nenhuma rolagem horizontal inesperada.

Estático:

- [x] CSS global contém proteção contra rolagem horizontal no `body`.
- [x] cartão “Editar o site” foi alinhado ao escopo da V1: textos, blocos e seções; não promete troca de imagens.

## 4. Atalhos dos sistemas

- [x] painel aponta Livro de Ponto para `/admin/livro-ponto/`.
- [x] painel aponta Arquivo Digital para `/arquivo-digital/`.
- [x] painel aponta Gestão de Notas para `/notas/`.
- [ ] validar os três atalhos em navegador real autenticado.

## 5. GitHub e proteção de branch

- [x] `admin/github-safe-target.js` existe.
- [x] teste isolado da proteção de branch: 5/5 cenários aprovados.
- [x] fora de `escolaieda.com`, `?ref=main` é redirecionado para `feat/admin-visual-builder`.
- [x] Git refs de `main` são redirecionados para a branch de desenvolvimento.
- [x] corpo JSON com `branch: main` é redirecionado.
- [x] chamada Microsoft Graph não é alterada pela proteção GitHub.
- [x] escrita real com token foi executada no preview.
- [x] commits de teste foram para `feat/admin-visual-builder`.
- [x] `main` permaneceu no baseline seguro durante os testes.
- [x] sem token, o editor abriu a conexão GitHub.
- [x] token válido restrito ao repositório foi aceito.
- [x] token não foi enviado na conversa nem versionado.
- [ ] token inválido mostra mensagem simples.
- [ ] comportamento “Lembrar neste navegador” validado explicitamente.

## 6. Publicações

- [x] contrato de campos comparado estaticamente com `site-data/publicacoes-site.js`.
- [x] fluxo novo grava diretamente no JSON público via GitHub; SharePoint não é mais armazenamento de Publicações.
- [ ] criar rascunho.
- [ ] criar publicação publicada.
- [ ] editar publicação.
- [ ] excluir publicação.
- [ ] buscar publicação.
- [ ] enviar JPG.
- [ ] enviar PNG/WebP.
- [ ] imagem de Publicação vai para `imagens/publicacoes/`.
- [ ] JSON mantém o objeto `home`.
- [ ] publicações não editadas permanecem.
- [ ] publicação aparece no `local` correto.
- [ ] rascunho não aparece no site público.
- [ ] período inicial/final é respeitado.

**Imagem de Publicação é separada da imagem do editor visual.** A retirada do bloco Imagem do editor não remove o upload do formulário de Publicações.

## 7. Runtime GrapesJS

`grapes.min.js`

- tamanho: `1095002` bytes;
- SHA-256: `c459a47bf7ff831e309b10aab4ce27c8d2d8280f62aa35dc6c1b7f776368f8c6`;
- Git blob SHA: `7e6965661f682e20915b4489cbeb3f85ec8706df`.

`grapes.min.css`

- tamanho: `60968` bytes;
- SHA-256: `1edd206fb9e41c60d70c66cfdb2e79e2b9358df5c952333a8b5a6a5989f8c2d4`;
- Git blob SHA: `62009a27142982215ecb7eb02f114eadf4e93841`.

- [x] arquivos presentes na branch batem com os arquivos validados.
- [x] licença e versão local presentes.
- [x] preview real carregou o editor usando runtime local.

## 8. Editor visual — testes reais

### Carregamento e interface

- [x] `/admin/editor/` abre no preview sem PHP.
- [x] Home real carrega dentro do canvas.
- [x] logo e imagens relativas resolvem corretamente.
- [x] estilos originais da Home aparecem.
- [x] blocos próprios aparecem na lateral.
- [x] elemento existente pode ser selecionado.
- [x] propriedades de aparência aparecem.
- [x] localização PT-BR está ativa.
- [x] aba “Camadas” foi substituída por “Estrutura”.
- [x] traits técnicos `Id/Title` estão ocultos.
- [ ] scripts públicos não são executados dentro do canvas — confirmar por teste dirigido antes de produção.

### Edição

- [x] texto existente pode ser alterado.
- [x] bloco Título foi inserido e funcionou na Prévia.
- [x] bloco Texto foi inserido e funcionou na Prévia.
- [x] bloco Cartões foi inserido e funcionou na Prévia.
- [x] bloco Destaque foi inserido e funcionou na Prévia.
- [x] bloco Botão foi inserido e funcionou na Prévia.
- [x] undo funciona.
- [x] redo funciona.
- [ ] mover elemento existente foi validado separadamente.
- [ ] cabeçalho protegido contra exclusão foi testado manualmente.
- [ ] rodapé protegido contra exclusão foi testado manualmente.
- [ ] painel Estrutura foi validado explicitamente.

### Responsividade e prévia

- [x] Computador funciona visualmente.
- [x] Celular funciona visualmente sem estouro horizontal visível nas capturas.
- [x] título e botões da Home reorganizam no modo Celular.
- [x] Prévia abre mostrando alterações locais sem salvar.
- [x] fechar Prévia retorna ao editor.
- [ ] Tablet foi validado explicitamente.

### Salvamento protegido

Primeiro teste:

- [x] escrita chegou ao GitHub na branch de teste.
- [x] detectada reserialização excessiva do HTML e script temporário do preview.
- [x] commit de teste foi revertido/limpo antes de continuar.

Segundo teste, após correção:

- [x] alteração textual produziu diff mínimo.
- [x] `index.html` e `site-data/publicacoes-publicas.json` foram gravados no mesmo commit.
- [x] subtítulo foi sincronizado com o JSON.
- [x] script temporário do Vercel não entrou no HTML.
- [x] `main` permaneceu intacta.
- [x] texto de teste foi removido depois da validação.

Persistência estrutural:

- [x] bloco de texto novo foi salvo.
- [x] após recarregar, o bloco permaneceu.
- [x] bloco de teste foi removido depois da validação.
- [x] `<!DOCTYPE html>` e scripts originais foram preservados nas verificações após o salvamento corrigido.
- [ ] conflito concorrente foi provocado para validar `force:false` na prática.

### Imagem dentro do editor visual

- [x] upload físico para `imagens/editor/` chegou a funcionar durante o experimento.
- [x] imagem enviada apareceu no Asset Manager.
- [x] falha reproduzida: imagem escolhida não permaneceu associada ao bloco após salvar e recarregar.
- [x] usuário decidiu pular esse refinamento e avançar por marcos maiores.
- [x] bloco **Imagem** foi removido da V1.
- [x] imagens existentes foram protegidas contra troca pelo editor.
- [x] arquivos usados somente nos testes foram removidos da branch.

A persistência de imagem **não é requisito de aceite da V1**.

## 9. Regressão pública

Ainda pendente como teste final controlado:

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
- [x] VvvebJs retirado.
- [x] criação arbitrária de páginas retirada do primeiro marco.
- [x] provisionamento/CRUD de listas SharePoint retirado do novo painel.
- [x] `DOCUMENTOS_ATIVOS` permanece somente como gate de leitura para autorização.
- [x] resíduos dos testes de imagem retirados do `index.html`, JSON e `imagens/editor/`.
- [ ] confirmar visualmente ausência das telas antigas no dashboard autenticado.

## 11. Vercel residual

- [x] Vercel não é dependência do produto novo.
- [x] está sendo usado apenas como preview temporário do PR.
- [x] usuário confirmou que não deseja incorporá-lo à arquitetura final.
- [ ] remover/desconectar a integração administrativamente após o marco.

## 12. Revisão final do PR

- [x] runtime local incorporado.
- [x] módulos independentes sensíveis preservados.
- [x] editor V1 fechado sem recurso de imagem parcialmente funcional.
- [x] documentação atualizada para refletir testes reais e limitações.
- [ ] checar status final de CI no head candidato.
- [ ] executar revisão CodeRabbit real fora do estado Draft, se ainda for útil antes do aceite.
- [ ] revisar threads/comentários de review.

## 13. Antes de qualquer merge

- [ ] testar Publicações na branch protegida.
- [ ] testar imagem de Publicação, se mantida no formulário.
- [ ] testar atalhos no dashboard autenticado.
- [ ] fazer regressão pública final.
- [ ] testar login completo no domínio oficial em momento controlado.
- [ ] apresentar resumo final ao usuário.
- [ ] obter autorização explícita do usuário para merge.

**Não há autorização de merge neste momento.**