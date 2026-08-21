# Task Router — escolha de ambiente e agente

A Factory deve orientar explicitamente o usuário sobre onde executar cada fase.

## Regra principal

Escolha pelo tipo de trabalho, não pela palavra "código".

### Preferir ChatGPT

Quando a tarefa for principalmente:

- descobrir o problema real;
- definir produto, requisitos e prioridades;
- pesquisar tecnologias, padrões ou repositórios;
- comparar alternativas;
- desenhar arquitetura conceitual;
- escrever ou revisar documentação;
- revisar Issue, PR, diff ou decisão técnica;
- fazer alteração pequena e verificável diretamente no GitHub;
- decidir o próximo passo após um resultado de teste já disponível.

### Preferir Codex

Quando a tarefa exigir uma ou mais destas capacidades:

- trabalhar no checkout/local do repositório;
- alterar vários arquivos coordenados;
- instalar ou atualizar dependências;
- executar terminal;
- rodar servidor local;
- lint, typecheck, testes ou build;
- browser/E2E/Playwright;
- debugging de comportamento real;
- migrations e mudanças de banco;
- refatoração ampla;
- implementar módulo funcional completo;
- produzir evidência executável de que a mudança funciona.

### Tanto faz / escolher pelo custo

Para tarefas como README, texto, pequenas configurações ou revisão simples, use o ambiente já aberto. Se ambos forem equivalentes, prefira ChatGPT para preservar recursos de execução do Codex.

## Heurística de roteamento

Pergunte internamente:

1. Precisa executar o projeto ou comandos? → Codex.
2. Precisa observar comportamento real no navegador? → Codex.
3. Precisa modificar muitos arquivos interdependentes? → Codex.
4. É principalmente raciocínio, pesquisa, especificação ou revisão? → ChatGPT.
5. É uma edição pequena via GitHub que pode ser verificada sem ambiente local? → ChatGPT.
6. Existe risco relevante que exige prova antes de merge? → Codex para implementar/verificar; ChatGPT pode revisar depois.

## Comunicação com o usuário

Quando houver mudança de ambiente, diga de forma simples:

- fase atual;
- ambiente recomendado;
- motivo em uma frase;
- o que ficará registrado no GitHub para continuidade.

Não encaminhe o usuário ao Codex sem necessidade. Não tente concluir apenas no ChatGPT uma tarefa que precisa de execução real para ser considerada segura.

## Futuro

Este roteador deve aceitar novos agentes. O núcleo classifica a necessidade; adaptadores mapeiam a necessidade para ChatGPT, Codex, Claude Code, Cursor ou outra ferramenta disponível.