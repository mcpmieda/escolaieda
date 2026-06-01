# Relatorio - correcao final V1 cards, painel e performance

Data: 2026-06-01

## Diagnostico encontrado

### Nomes parecidos

- A secao `nomesParecidosArquivo` aplicava `.comNomesParecidos` sempre que `buscarNomesParecidos()` retornava algum item.
- Como o algoritmo tambem retorna nomes exatamente iguais, o chip "Nome igual" podia deixar a secao inteira com visual de alerta de nomes parecidos.
- Ao abrir outro documento, o estado de carregamento tambem podia herdar temporariamente `.comNomesParecidos` do documento anterior.

### Cards da tela inicial

- O visual pesado vinha dos blocos de destaque que aplicavam pseudo-icones `::before`/`::after` e padding esquerdo alto tambem aos cards de acao.
- A largura desigual vinha da combinacao de grid com cards de acao usando padding/icone grande e `minmax(0, 1fr)`, que deixava o conteudo parecer estreito em notebook.
- O ajuste anterior mexeu em seletores de `.centralDuplicidades` amplos o suficiente para gerar risco visual em usos que nao fossem apenas o card da tela inicial.

### Central de Duplicidades aberta

- Nao foi encontrada alteracao de logica ou render do painel aberto da Central.
- A correcao desta rodada foi limitada ao card da tela inicial em `.dashboardAcoes`, evitando alterar o interior da Central aberta.

### Lentidao dos paineis

- Nao foram encontradas chamadas extras de Graph/SharePoint nem listeners duplicados criados pela ultima rodada.
- Foi encontrada uma causa local plausivel: recalculo repetido do mapa de nomes iguais no topo do painel e dentro da lista de nomes parecidos.
- A correcao reduziu recalculos usando um mapa compartilhado por render, sem alterar regra de negocio.

## Correcoes aplicadas

- A classe `.comNomesParecidos` agora so e aplicada quando existe nome parecido real, diferente do nome visual do documento atual.
- Ao iniciar carregamento de nomes parecidos, a classe de alerta e removida para nao herdar estado do documento anterior.
- Os chips dentro de nomes parecidos permanecem padronizados, com Ativo/Lixeira primeiro.
- Os cards da tela inicial em `.dashboardAcoes` foram refinados para manter duas colunas equivalentes com `minmax(260px, 1fr)`.
- O visual dos cards de acao voltou a ser compacto: sem pseudo-icone grande, sem padding lateral exagerado.
- O botao visual do Historico ficou discreto e alinhado ao card de duplicidades.
- O texto inicial do botao da Central de Duplicidades foi ajustado para "Abrir Central".

## Codigo antigo removido/substituido

- Substituido o uso direto de `seloNomeRepetidoHtml()` em renderizacoes repetidas por `seloNomeRepetidoHtmlComMapa()`.
- Substituido o alerta incondicional de `nomesParecidosBox` por alerta condicionado a nome parecido real.
- Substituidas regras de padding/altura dos cards de acao que deixavam os cards grosseiros.
- Removido o ajuste posterior de pseudo-icones dos cards de acao.

## Itens mantidos por duvida

- O algoritmo de nomes parecidos foi mantido intacto.
- Os contadores foram mantidos sem alteracao estrutural, pois estavam aprovados.
- O ajuste de largura geral/background foi mantido sem alteracao.
- Regras historicas de dashboard fora de `.dashboardAcoes` foram mantidas quando afetavam contadores ou outros estados ja aprovados.

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

- Abrir um documento com nomes apenas iguais e confirmar que a secao "Nomes parecidos" nao fica inteira em alerta.
- Abrir um documento com nome realmente parecido e confirmar alerta leve na secao.
- Alternar entre documentos com e sem nomes parecidos e confirmar que o estado visual nao fica herdado.
- No notebook/PC, confirmar que Central de Duplicidades e Central de historico ocupam duas colunas equivalentes.
- Abrir a Central de Duplicidades e confirmar que o interior do painel nao mudou visualmente.
- Abrir alguns paineis laterais em sequencia e confirmar melhora ou ausencia de piora na percepcao de abertura.
