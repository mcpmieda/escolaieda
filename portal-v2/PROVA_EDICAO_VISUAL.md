# Prova de edição visual — Portal V2

Objetivo: validar a edição contextual da Home atual sem alterar o design aprovado nem substituir a Home oficial.

## Critérios de aprovação

- a Home real aparece dentro do editor;
- textos editáveis podem ser selecionados diretamente na página;
- mudanças atualizam a região editável sem reconstruir um editor próprio;
- a solução preserva os componentes Astro existentes;
- nenhuma alteração desta branch é publicada na Home oficial antes da aprovação.

## Escopo desta prova

- integração `@tinacms/astro`;
- endpoint `tina-island` para atualização dinâmica;
- metadados `data-tina-field` nos principais textos da Home;
- adaptador Vercel somente para disponibilizar a rota dinâmica necessária ao teste.

A etapa de blocos adicionáveis/reordenáveis só será iniciada se esta prova de edição contextual for aprovada.
