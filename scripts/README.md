# Scripts e ferramentas

Esta pasta concentra os runners de validação e as ferramentas auxiliares do repositório.

## Estrutura

- `sistema/`: ferramentas gerais que não dependem da posição do arquivo no repositório.

## Organização

A maior parte dos scripts permanece diretamente em `scripts/` de forma intencional. Muitos calculam a raiz do projeto a partir da própria localização, possuem imports relativos ou são citados pela documentação operacional. Movê-los sem necessidade cria risco de regressão.

`provisionar-sistema-escola.ps1` foi colocado em `scripts/sistema/` porque é independente da estrutura local de arquivos e não possui referências internas ao caminho antigo.

Regra de manutenção: novos scripts independentes devem ir para uma subpasta temática. Runners existentes só devem ser movidos quando todas as dependências e referências forem atualizadas e revalidadas.
