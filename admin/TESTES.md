# TESTES — Fechamento da V1

## Estado

Branch de produção: `main`.
Domínio oficial: `https://escolaieda.com/`.

Este arquivo registra apenas o estado atual. Testes históricos de branches antigas permanecem no diário `EXECUCAO_ADMIN_VISUAL.md`.

## 1. Autenticação e sessão

- [x] `/admin/` abre no domínio oficial.
- [x] login Microsoft funciona no domínio oficial.
- [x] conta autorizada chega ao dashboard.
- [x] nome/perfil do usuário aparece no painel.
- [x] navegação entre views não exibe mais a tela de login a cada troca.
- [ ] testar logout no estado final.
- [ ] testar conta sem autorização e confirmar tela de acesso restrito.
- [ ] revisar redução futura de `Sites.ReadWrite.All` para permissão somente de leitura, com consentimento e teste coordenados.

## 2. Centro de Administração

- [x] dashboard da Secretaria abre corretamente.
- [x] Visão geral reorganizada com indicadores e acessos rápidos.
- [x] Publicações abre dentro do shell.
- [x] Editar página está integrado à área de Publicações.
- [x] Livro de Ponto abre dentro do admin.
- [x] Livro de Ponto usa melhor a área útil e navegação superior.
- [x] Gestão de Notas abre dentro de Sistemas.
- [x] Sistemas internos e portais operacionais funcionam.
- [x] Arquivo Digital permanece independente e abre em nova guia.
- [ ] validar uma rodada final em celular sem rolagem horizontal ou botões cortados.

## 3. Publicações — teste final pendente

Executar em produção com conteúdo de teste claramente identificável e apagar ao final.

- [ ] criar rascunho.
- [ ] confirmar que rascunho não aparece no site público.
- [ ] publicar o item.
- [ ] confirmar renderização no local correto.
- [ ] editar título/conteúdo.
- [ ] buscar publicação.
- [ ] testar data inicial/final.
- [ ] enviar JPG.
- [ ] enviar PNG ou WebP.
- [ ] confirmar imagem em `imagens/publicacoes/`.
- [ ] excluir publicação de teste.
- [ ] confirmar que as demais publicações permanecem intactas.
- [ ] confirmar que o objeto `home` do JSON permanece intacto.

## 4. Editor visual

### Já comprovado em testes anteriores

- [x] GrapesJS local carrega a Home.
- [x] edição de texto.
- [x] Título, Texto, Cartões, Destaque e Botão.
- [x] undo/redo.
- [x] prévia local.
- [x] Computador e Celular.
- [x] persistência de bloco suportado após recarregar.
- [x] `index.html` + JSON gravados no mesmo commit em teste protegido.
- [x] scripts temporários externos não entram no HTML canônico após a correção do salvamento.
- [x] bloco Imagem foi retirado da V1 após falha de persistência reproduzida.

### Fechamento em produção

- [ ] fazer uma alteração textual mínima e reversível pelo editor integrado.
- [ ] salvar em produção.
- [ ] recarregar e confirmar persistência.
- [ ] reverter o texto de teste pelo próprio editor.
- [ ] testar Tablet explicitamente.
- [ ] confirmar cabeçalho e rodapé protegidos contra exclusão.

## 5. Livro de Ponto

- [x] abre integrado no admin.
- [x] cabeçalho redundante removido no modo incorporado.
- [x] navegação interna aparece na parte superior.
- [x] módulo original não foi reescrito.
- [ ] rodada final rápida de backup/importação e impressão, sem alterar dados reais desnecessariamente.

## 6. Gestão de Notas

- [x] abre integrada em Sistemas.
- [x] navegação Notas/Boletim funciona.
- [x] cabeçalho/perfil redundantes ficam reduzidos no modo incorporado.
- [x] opção de tela cheia preservada.

## 7. Arquivo Digital

- [x] acesso preservado pelo Centro de Administração.
- [x] abre em nova guia.
- [x] não foi incorporado ao shell, preservando sua arquitetura Microsoft/Graph independente.

Não reauditar internamente o Arquivo Digital sem alteração na pasta `arquivo-digital/`. Seguir `AGENTS.md` quando houver mudança nesse módulo.

## 8. Site público — regressão final pendente

- [ ] Home carrega normalmente em desktop.
- [ ] Home carrega normalmente em celular.
- [ ] menu e links principais funcionam.
- [ ] publicações continuam carregando pelo JSON público.
- [ ] nenhuma publicação existente foi perdida.
- [ ] calendário abre.
- [ ] professores abre.
- [ ] Área Restrita abre `/admin/`.
- [ ] imagens principais carregam.
- [ ] animações/reveal não apresentam regressão.
- [ ] ausência de rolagem horizontal inesperada.
- [ ] ausência de erro crítico no console.

## 9. Segurança e GitHub

- [x] token GitHub não está versionado.
- [x] `main` é branch de produção.
- [x] fora do domínio oficial, a proteção final deve bloquear escrita GitHub em vez de redirecionar para branch antiga.
- [ ] validar esse bloqueio após o commit de fechamento documental.
- [ ] reduzir permissões Graph somente após teste específico de consentimento.

## 10. Critério para criar `v1.0.0`

Criar a tag/release somente quando estiverem concluídos:

- [ ] Publicações de ponta a ponta.
- [ ] imagem de Publicação.
- [ ] salvamento mínimo do editor em produção.
- [ ] logout e acesso negado.
- [ ] regressão pública desktop/celular.
- [ ] revisão de segurança final.

Depois disso, novas funções passam a ser V2.