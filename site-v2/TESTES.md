# Testes — Escola Iêda V2

## Status desta rodada
A estrutura foi montada no repositório, mas a execução completa ainda precisa ocorrer em um ambiente com acesso ao registro npm. O ambiente desta sessão não consegue resolver hosts externos pelo terminal, portanto não registrar build como aprovado antes do teste real.

## Fundação
- [ ] `npm install` sem erro
- [ ] `npm run check` sem erro
- [ ] `npm run build:local` sem erro
- [ ] `npm run dev` abre a Home
- [ ] `/admin/` abre o Tina

## Prova de edição visual
- [ ] abrir Página inicial no `/admin`
- [ ] clicar no título da capa
- [ ] alterar texto sem salvar
- [ ] página refletir alteração imediatamente
- [ ] salvar conteúdo
- [ ] recarregar e confirmar persistência
- [ ] adicionar um bloco novo
- [ ] reorganizar blocos
- [ ] remover bloco sem quebrar a página

## Layout
- [ ] desktop 1440px
- [ ] notebook 1024px
- [ ] celular 390px
- [ ] sem rolagem horizontal
- [ ] navegação por teclado básica
- [ ] contraste legível

## Segurança/regressão
- [ ] nenhuma credencial versionada
- [ ] V2 não altera `/admin` atual
- [ ] V2 não altera `arquivo-digital/`
- [ ] V2 não altera módulos legados
- [ ] nenhum merge em `main` antes da validação do marco
