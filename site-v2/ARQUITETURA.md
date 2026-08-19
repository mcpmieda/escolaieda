# Escola Iêda V2 — Arquitetura

## Objetivo
Construir uma nova geração do portal `escolaieda.com` com foco em:

- site institucional moderno, rápido, responsivo e acessível;
- administração em `/admin` utilizável por pessoas não técnicas;
- edição visual com prévia real antes de salvar/publicar;
- conteúdo estruturado, versionado e recuperável;
- componentes reutilizáveis e identidade visual consistente;
- redução drástica de código administrativo artesanal;
- preservação dos módulos existentes até que cada um tenha migração própria validada.

## Decisão arquitetural inicial

### Site
- Astro + TypeScript.
- Componentes de interface próprios e reutilizáveis.
- Design tokens centralizados para cores, tipografia, espaçamento, sombras, raios e breakpoints.
- Sem CSS por sobreposição histórica: cada componente mantém seu estilo em uma única fonte de verdade.

### CMS / Administração
- TinaCMS em `/admin`.
- Edição visual da página real.
- Conteúdo estruturado em blocos reutilizáveis.
- Git como histórico e fonte de verdade do conteúdo.
- Nenhum editor precisa manipular HTML, CSS, JSON ou Git manualmente.

### Modelo de edição
A administração não será um editor totalmente livre de HTML/CSS. O editor trabalhará com blocos profissionais previamente desenhados, podendo adicionar, remover, reorganizar, ocultar e editar conteúdo sem quebrar a identidade visual.

Blocos iniciais previstos:

1. Hero / capa
2. Aviso importante
3. Destaques
4. Cards de acesso rápido
5. Texto institucional
6. Galeria de imagens
7. Notícias / publicações
8. Eventos / calendário
9. Documentos e downloads
10. Números / indicadores
11. Equipe / pessoas
12. Contato
13. Banner
14. Modal / comunicado
15. CTA / chamada para ação
16. Espaçador / divisor visual controlado

Cada bloco poderá ter variantes de layout previamente testadas.

## O que não será reaproveitado como base da V2
- O CMS artesanal atual de `admin/` não será a fundação da nova administração.
- A lógica atual de montar prévia manualmente dentro de iframe não será transportada.
- O JSON derivado atual de publicações não será tratado como modelo definitivo da V2.
- Não haverá crescimento por camadas de overrides ou funções duplicadas.

O código atual continuará preservado na `main` enquanto a V2 estiver em desenvolvimento.

## O que será reaproveitado
- domínio e identidade institucional;
- conteúdo textual válido;
- logos, imagens e arquivos úteis;
- páginas/módulos independentes que já funcionam;
- regras institucionais e integrações Microsoft que fizerem sentido;
- caminhos públicos importantes, sempre que possível, para evitar links quebrados.

## Módulos legados
`arquivo-digital/`, `aluno/`, `direcao/`, `notas/` e outros módulos existentes não serão reescritos junto com a primeira etapa da V2. Eles deverão permanecer acessíveis e isolados até uma migração específica ser aprovada.

## Autenticação
A V2 deverá aceitar duas estratégias sem acoplamento ao restante do sistema:

1. TinaCloud para implantação inicial mais simples; ou
2. Tina self-hosted com Auth.js e Microsoft Entra ID para aproveitar contas institucionais Microsoft.

A escolha final de autenticação será tomada antes da publicação da V2, sem bloquear a construção da interface e do modelo de conteúdo.

## Hospedagem
A V2 não deve depender exclusivamente de GitHub Pages para a experiência completa de edição visual. A hospedagem deverá suportar o runtime necessário ao Astro/Tina e ambientes de preview/staging.

O domínio `escolaieda.com` só será apontado para a V2 depois de validação completa.

## Fluxo de desenvolvimento

### Fase 1 — Fundação
- criar projeto Astro/Tina isolado;
- configurar TypeScript, lint e build;
- definir design system;
- criar estrutura base de layouts e componentes;
- criar `/admin` do Tina.

### Fase 2 — Home profissional
- reconstruir a home com componentes novos;
- transformar cada seção em bloco editável;
- edição visual em tempo real;
- desktop, tablet e celular.

### Fase 3 — Conteúdo
- notícias;
- avisos;
- documentos;
- galerias;
- equipe;
- calendário/eventos;
- páginas institucionais.

### Fase 4 — Administração
- permissões por perfil;
- mídia;
- SEO;
- rascunho/publicação;
- histórico/rollback;
- validações para impedir conteúdo inválido.

### Fase 5 — Integrações e legado
- manter rotas existentes funcionando;
- integrar ou migrar módulos somente quando houver vantagem clara;
- preservar Arquivo Digital fora de mudanças estruturais até projeto específico.

### Fase 6 — Staging e substituição
- publicar ambiente de teste;
- validar conteúdo e administração com usuário não técnico;
- auditoria de acessibilidade, desempenho, SEO e segurança;
- somente então trocar o site principal.

## Critérios de pronto
A V2 só poderá substituir o site atual quando:

- uma pessoa não técnica conseguir editar conteúdo sem orientação de código;
- a prévia mostrar exatamente o que será publicado;
- salvar/publicar não exigir GitHub manual;
- o site responder corretamente em celular e desktop;
- houver rollback do conteúdo;
- os módulos legados importantes continuarem acessíveis;
- build e testes principais estiverem aprovados;
- nenhuma credencial estiver no frontend ou no repositório.

## Papel de GrapesJS e Webstudio

### GrapesJS
Pode ser avaliado posteriormente para páginas especiais que realmente exijam liberdade de composição maior do que os blocos do Tina. Não será a fundação do CMS porque exigiria construir ao redor dele autenticação, armazenamento, workflow e publicação.

### Webstudio
Pode servir como referência de qualidade visual e fluxo de builder. Não será a fundação inicial da V2 porque o objetivo é manter o centro administrativo integrado ao próprio domínio e sob controle da arquitetura do projeto.

## Regra principal da V2
A prioridade não é escrever mais código. A prioridade é eliminar código que plataformas maduras já resolvem e manter código próprio apenas onde a Escola Iêda realmente possui uma necessidade específica.
