# Direção da V2

## Objetivo
Criar um portal institucional moderno, rápido e simples de administrar por pessoas não técnicas.

## Decisão de execução
A V2 será construída em duas camadas deliberadamente separadas:

### Marco A — experiência pública
- Astro puro;
- nova Home;
- componentes reutilizáveis;
- responsividade e acessibilidade;
- aprovação visual antes do CMS.

### Marco B — administração
- TinaCMS;
- edição visual em `/admin`;
- blocos estruturados equivalentes aos componentes aprovados;
- conteúdo versionado;
- autenticação definida antes da publicação.

## Regra
Não construir novamente recursos de CMS que uma plataforma madura já oferece. O código próprio deve se concentrar na identidade e nas necessidades específicas da Escola Iêda.
