# AI_CONTEXT — Centro de Administração da Escola Iêda

## Objetivo

Manter e evoluir o painel administrativo em `admin/` como centro simples de gestão do site e acesso aos módulos internos da Escola Iêda, preservando o que já funciona e evitando acoplamento indevido com o Arquivo Digital Escolar.

## Estado atual

- Branch principal de referência no início deste ciclo: `main`.
- Baseline de retomada: `c564fd5cf34666e9b9a314aeee8194ab802ceee1`.
- O painel funciona como mini-CMS da home pública.
- SharePoint é a fonte administrativa principal.
- `site-data/publicacoes-publicas.json` é uma fonte pública derivada para o GitHub Pages.
- A próxima evolução em desenvolvimento é a prévia completa da home dentro do painel, com modos computador e celular.

## Arquitetura

```text
admin/index.html
  → interface do painel
admin/admin.css
  → apresentação do painel
admin/admin.js
  → MSAL + Microsoft Graph + SharePoint + sincronização GitHub
site-data/publicacoes-publicas.json
  → snapshot público derivado
site-data/publicacoes-site.js
  → aplica o snapshot na home pública
index.html
  → página pública real usada como referência visual
```

`admin/livro-ponto/` é um módulo separado dentro da área administrativa e atualmente usa armazenamento local no navegador.

## Restrições obrigatórias

- Não reescrever o painel do zero.
- Trabalhar por escopo incremental e revisar por diff.
- Não alterar `arquivo-digital/` sem solicitação explícita.
- Não alterar autenticação, permissões, SharePoint, listas ou schema como efeito colateral de mudanças visuais do painel.
- Não inventar IDs, propriedades ou contratos do Microsoft Graph.
- Não colocar tokens ou segredos no repositório.
- Preservar o fluxo SharePoint → JSON derivado → GitHub Pages.
- Mudanças estruturais exigem baseline, impacto, backup/rollback e validação específica.

## Baseline seguro

Baseline de retomada: `c564fd5cf34666e9b9a314aeee8194ab802ceee1`.

Comportamentos que devem ser preservados:

- login Microsoft e validação de acesso da Secretaria;
- CRUD de publicações;
- rascunho, agendamento e expiração;
- editor de seções da home;
- sincronização automática agrupada para o GitHub;
- upload/otimização WebP;
- logs administrativos;
- ausência de alterações no Arquivo Digital durante trabalho do CMS.

## Método de trabalho

- entender antes de alterar;
- escopo fechado;
- mudanças pequenas;
- revisão por diff;
- testes dirigidos ao comportamento afetado;
- sem reauditoria completa em cada ajuste;
- checkpoint no GitHub ao concluir marco relevante.

## Decisões vigentes

- SharePoint continua sendo a fonte administrativa principal.
- O JSON público continua sendo derivado e reconstruível.
- O token GitHub não deve entrar no código-fonte.
- A prévia completa deve ser local/visual e não gravar no SharePoint ou GitHub.
- A prévia deve reutilizar a home real como referência visual em vez de manter uma segunda implementação completa do layout.

## Dependências principais

- Microsoft Entra ID / MSAL Browser.
- Microsoft Graph.
- SharePoint.
- GitHub Contents API.
- GitHub Pages.

## Testes obrigatórios

Para mudanças comuns no CMS:

```text
node --check admin/admin.js
node --check site-data/publicacoes-site.js
git diff --check
```

Para a prévia completa:

```text
abrir prévia sem salvar → nenhuma escrita externa ocorre
modo computador → home completa é exibida na largura ampla
modo celular → mesma home é exibida em viewport móvel
alterar título/seção sem salvar → prévia reflete a edição
pré-visualizar publicação não salva → item aparece apenas na prévia
fechar prévia → retorna ao painel sem perder os campos editados
```

## Segurança

- `arquivo-digital/` é sistema separado e sensível.
- Não ampliar `Sites.ReadWrite.All` nem alterar permissões neste ciclo sem trabalho explícito de segurança/autenticação.
- O token GitHub deve permanecer fora do repositório e com privilégio mínimo.

## Operação e recuperação

- Para mudanças de código, usar o baseline registrado como ponto de retorno.
- Não empilhar correções sobre tentativa incerta; reverter ao último checkpoint estável quando necessário.
- A publicação pública pode ser reconstruída pelo fluxo de sincronização existente.

## Último checkpoint

- `c564fd5cf34666e9b9a314aeee8194ab802ceee1` — baseline lido antes do início da prévia completa.

## Próxima ação concreta

Implementar e validar a prévia completa da home em `admin/`, com modos computador/celular e suporte a visualizar alterações ainda não salvas, sem escrita em SharePoint ou GitHub.
