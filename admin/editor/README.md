# Editor visual da Escola Iêda

Esta pasta contém a adaptação do VvvebJs usada pelo Centro de Administração.

## Origem

- Projeto: `givanz/VvvebJs`
- Licença: Apache License 2.0
- Commit fixado: `1acbab7ebfe3e7b004f1f18c039d26550fc04bd8`

Os arquivos do upstream são copiados para esta pasta por um workflow controlado durante o desenvolvimento. O site não carrega o editor a partir de CDN, Vercel, Tina ou outro CMS.

## Arquivos da Escola Iêda

- `escola-editor.js`: integração GitHub, páginas, upload e salvamento.
- `escola-componentes.js`: blocos próprios para o editor.
- `escola-editor.css`: simplificação visual da interface.
- `modelos/pagina-basica.html`: ponto de partida de novas páginas.

Esses arquivos não devem ser sobrescritos quando o upstream for vendorizado.

## Regras

- não atualizar o VvvebJs automaticamente para a branch `master`;
- qualquer atualização deve fixar um novo commit e ser testada;
- não ativar `save.php`, backend PHP ou plugins que exijam servidor;
- não ativar o assistente de IA do upstream;
- páginas criadas pelo usuário ficam em `paginas/<slug>/index.html`;
- imagens enviadas pelo editor ficam em `imagens/editor/`;
- o editor grava arquivos pela GitHub Contents API usando token fornecido pelo usuário no navegador;
- token nunca deve entrar no código ou em commit.

Consulte `../PROJETO_ADMIN_VISUAL.md` para a arquitetura completa e `../TESTES.md` para os testes obrigatórios.
