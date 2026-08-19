# AI Context — Escola Iêda V2

## Missão
Construir uma V2 profissional do `escolaieda.com` com administração simples para usuários não técnicos. Reduzir código artesanal usando Astro e TinaCMS e escrever código próprio apenas para necessidades específicas da escola.

## Limite de segurança
- Desenvolvimento da V2 somente em `site-v2/` e branch `v2/astro-tina` até validação.
- Não substituir a `main`, o site oficial ou `/admin` atual sem gate explícito.
- Não alterar `arquivo-digital/`, `aluno/`, `direcao/`, `notas/` ou integrações Microsoft durante a construção inicial.
- Nenhuma credencial em código ou Git.

## Arquitetura
- Astro + TypeScript para o site.
- TinaCMS para `/admin` e edição visual.
- Conteúdo estruturado em blocos.
- Design system centralizado em `src/styles/global.css`.
- Um componente por bloco; evitar CSS duplicado, overrides históricos e funções sobrepostas.
- GrapesJS é opcional e futuro, apenas se houver necessidade comprovada de páginas com composição totalmente livre.
- Webstudio serve como referência de UX/design, não como fundação atual.

## Fluxo de trabalho
1. Partir de baseline estável.
2. Trabalhar por marco pequeno e demonstrável.
3. Preferir componentes e recursos oficiais de Astro/Tina a soluções próprias.
4. Testar build, desktop, celular e edição visual antes de ampliar escopo.
5. Registrar decisões em `DECISOES.md`, mudanças em `CHANGELOG_DEV.md` e testes em `TESTES.md`.
6. Só migrar o domínio após staging e aceitação por usuário leigo.

## Primeiro marco
Home V2 + `/admin` visual funcionando. O editor deve conseguir alterar título e conteúdo de um bloco e visualizar imediatamente a página sem editar HTML, CSS, JSON ou Git.
