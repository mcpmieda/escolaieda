# AI_CONTEXT — Centro de Administração Escola Iêda

## Estado atual

Projeto em **candidato final de produção**.

- Repositório: `mcpmieda/escolaieda`
- Branch de produção: `main`
- Domínio oficial: `https://escolaieda.com/`
- O trabalho funcional principal já está mesclado na `main`.
- A tag `v1.0.0` será criada somente após a rodada final de testes.

Não tratar mais `feat/admin-visual-builder` ou qualquer outra branch antiga como branch vigente do projeto.

## Objetivo

Manter um Centro de Administração único, simples e moderno para usuários não técnicos, evitando CMS artesanal, integrações desnecessárias e trabalho manual repetitivo.

## Arquitetura vigente

### `/admin/`

Central administrativa com:

- Visão geral / dashboard da Secretaria;
- Publicações;
- Editar página integrado dentro de Publicações;
- Livro de Ponto integrado no painel;
- Sistemas;
- Gestão de Notas integrada;
- Arquivo Digital como módulo protegido independente;
- portais operacionais externos em nova guia.

### Conteúdo público

```text
Admin → GitHub → site-data/publicacoes-publicas.json → site público
```

SharePoint não é CMS de Publicações.

### Home visual

```text
Admin → GrapesJS local → Git Data API → index.html + compatibilidade JSON
```

O salvamento da Home mantém `index.html` e o objeto legado `home` do JSON sincronizados no mesmo commit.

## Editor visual

Motor: GrapesJS `0.22.13`, licença BSD-3-Clause, runtime local em `admin/editor/vendor/`.

Recursos aprovados na V1:

- edição de texto;
- blocos Título, Texto, Cartões, Destaque e Botão;
- aparência;
- undo/redo;
- computador/tablet/celular;
- prévia;
- salvamento explícito;
- proteção de cabeçalho e rodapé.

Troca/upload de imagem dentro do editor visual está fora da V1. Não reativar sem teste de persistência de ponta a ponta.

Imagens de **Publicações** são independentes e continuam suportadas em `imagens/publicacoes/`.

## Microsoft / Graph

- Microsoft Entra ID autentica o usuário.
- `DOCUMENTOS_ATIVOS` é usado como gate de leitura da Secretaria.
- O CMS atual não escreve Publicações no SharePoint.
- Login oficial e dashboard já foram comprovados em `escolaieda.com`.
- O código ainda usa `Sites.ReadWrite.All` para preservar o consentimento atual; reduzir para leitura somente em alteração coordenada com App Registration e teste.

## GitHub

- `main` é produção.
- O token nunca é versionado.
- sessão por padrão; armazenamento local apenas por escolha explícita do usuário.
- fora de `escolaieda.com` e `www.escolaieda.com`, escritas GitHub devem permanecer bloqueadas.
- não depender de branch de desenvolvimento permanente para segurança.

## Módulos

### Livro de Ponto

`admin/livro-ponto/` permanece como módulo original. No admin ele é exibido de forma integrada, com o cabeçalho redundante removido no modo incorporado e navegação superior.

### Gestão de Notas

`notas/` permanece como módulo original. No admin ele é incorporado em Sistemas, com navegação compacta e opção de tela cheia.

### Arquivo Digital

`arquivo-digital/` é módulo sensível e independente, com autenticação/Graph próprios. Não incorporar ou reorganizar sem planejamento específico e leitura de `AGENTS.md`.

## Estado confirmado pelo usuário

Em produção:

- login Microsoft funciona;
- dashboard abre corretamente;
- navegação unificada funciona;
- Publicações e Editar página funcionam no mesmo painel;
- Livro de Ponto funciona integrado;
- Gestão de Notas funciona integrada;
- Sistemas e portais funcionam;
- o flash de login durante mudança de views foi eliminado.

## Pendências reais para fechar a V1

Não adicionar novas funções antes de concluir:

1. CRUD completo de Publicações em produção;
2. upload de imagem de Publicação;
3. salvamento controlado do editor visual em produção;
4. logout e conta sem autorização;
5. regressão pública desktop/celular;
6. revisão final de segurança;
7. tag/release `v1.0.0`.

Agenda, enquetes, novas páginas e imagem no editor são V2, não pendências da V1.

## Regras permanentes de desenvolvimento

1. manter `main` como ponto oficial de produção;
2. criar branch temporária somente quando uma nova alteração exigir isolamento;
3. depois do merge, remover branches temporárias;
4. revisar diff e dependências diretas, evitando reauditorias completas repetidas;
5. não empilhar CSS/JS de correção; substituir ou limpar a regra existente;
6. preservar módulos sensíveis fora do escopo;
7. atualizar documentação em marcos, não a cada clique;
8. não introduzir novo backend, CMS, banco ou plataforma de hospedagem sem ganho claro;
9. GrapesJS permanece fixado em `0.22.13` até decisão explícita de atualização.