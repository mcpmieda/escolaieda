# Relatorio - ajuste fino final V1 dashboard e painel

Data: 2026-06-01

## Causa encontrada

- A largura excessiva no PC vinha do bloco `AJUSTE_LARGURA_DESKTOP_LAYOUT_MODERNO_20260527`, que ampliava `.card` para ate `1760px` e `1840px` em telas grandes.
- O desalinhamento dos contadores vinha de uma regra posterior que aplicava `repeat(4, minmax(0, 1fr))` em `.dashboardContadores`, embora existam 3 cards reais.
- A diferenca visual entre Central de Duplicidades e Historico vinha de estrutura/texto distintos no card de historico e de estilos internos diferentes.
- A secao "Status" do painel lateral ficou redundante depois que o status passou a existir no topo como chip.

## Correcoes aplicadas

- Removida a secao visual "Status" do painel lateral.
- Removidas as referencias JS e CSS especificas de `#painelStatus`.
- Chips do topo do painel padronizados e reordenados: status primeiro, depois "Nome igual" e gaveta.
- Chips em "Nomes parecidos" reordenados com Ativo/Lixeira primeiro.
- A caixa "Nomes parecidos" agora e neutra por padrao e so recebe destaque quando a classe `.comNomesParecidos` e aplicada.
- O card "Historico geral" passou a "Central de historico", com acao visual "Abrir Central" e texto auxiliar alinhado ao card de duplicidades.
- Contadores do dashboard voltaram a 3 colunas iguais no desktop.
- Cards de acao do dashboard mantem 2 colunas iguais no desktop e empilham no mobile.
- Largura maxima util do container central foi reduzida em desktop grande para deixar o background mais aparente.

## Codigo antigo removido/substituido

- HTML morto da secao "Status" no painel lateral.
- JS que preenchia `painelStatus`.
- CSS especifico de `#painelStatus`.
- Regra antiga de `.nomesParecidosBox` que deixava alerta mesmo sem nomes parecidos.
- Larguras desktop antigas de `1760px` e `1840px`.
- Grid antigo de 4 colunas para os 3 contadores.

## Itens mantidos por duvida

- Ocorrencias internas de "Historico geral" em comentario/CSS legado foram mantidas quando nao afetam texto visivel nem comportamento.
- Seletores duplicados historicos de dashboard fora do escopo direto foram mantidos quando remover poderia afetar outras variacoes visuais ja aprovadas.

## Arquivos alterados

- `arquivo-digital/index.html`
- `arquivo-digital/arquivo-digital.js`
- `arquivo-digital/arquivo-digital.css`

## Validacoes executadas

- `node scripts/validar-arquivo-digital.mjs` antes das alteracoes.
- `node scripts/validar-arquivo-digital.mjs` apos as alteracoes.
- `node --check arquivo-digital/arquivo-digital.js`.
- `git diff --check` sem erro; apenas aviso normal de normalizacao CRLF do Git no Windows.
- `git status --short` antes das alteracoes estava limpo.

## Testes recomendados

- No PC, verificar se os 3 contadores ocupam larguras iguais.
- No PC, verificar se Central de Duplicidades e Central de historico ocupam duas colunas iguais.
- Abrir um documento e confirmar que nao existe mais a secao "Status" no corpo do painel.
- Conferir chips do topo do painel: status, Nome igual quando aplicavel, gaveta.
- Abrir Nomes parecidos com e sem resultado e confirmar visual neutro/alerta correto.
- Em tela pequena, confirmar que os cards empilham sem quebra visual.
