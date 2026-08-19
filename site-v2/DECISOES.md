# Decisões arquiteturais — Escola Iêda V2

## ADR-001 — Não clonar plataformas inteiras
**Decisão:** usar pacotes oficiais como dependências e padrões arquiteturais maduros; não manter forks completos de TinaCMS, GrapesJS ou Webstudio.

**Motivo:** evita herdar milhares de arquivos, atualizações internas e responsabilidade de manutenção de plataformas inteiras.

## ADR-002 — Astro como camada do site
**Decisão:** Astro + TypeScript.

**Motivo:** portal predominantemente institucional e orientado a conteúdo, com necessidade de desempenho, SEO, componentes e baixa complexidade no frontend.

## ADR-003 — TinaCMS como CMS inicial
**Decisão:** TinaCMS em `/admin`, com edição visual e blocos estruturados.

**Motivo:** substitui grande parte do CMS artesanal: editor, modelagem de conteúdo, preview contextual, mídia e integração Git.

## ADR-004 — Blocos seguros, não HTML livre
**Decisão:** usuários adicionam e reorganizam componentes previamente desenhados.

**Motivo:** permite flexibilidade sem quebrar identidade visual, responsividade ou acessibilidade.

## ADR-005 — V2 isolada
**Decisão:** construir em `site-v2/` e `v2/astro-tina`.

**Motivo:** o site e módulos atuais permanecem como rollback enquanto a V2 amadurece.

## ADR-006 — Autenticação e hospedagem ainda desacopladas
**Decisão:** desenvolver primeiro o modelo visual/conteúdo. Escolher TinaCloud ou self-hosted + Microsoft Entra antes do staging público.

**Motivo:** essa escolha não deve bloquear a prova de conceito da experiência de edição.
