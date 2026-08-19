# RESUMO FÁCIL — Como a automação funciona

## O que ela faz

Quando uma pessoa é cadastrada no Microsoft 365, o sistema usa o campo **Cargo** para decidir em qual grupo ela deve entrar.

Exemplo:

```text
Cargo: professor
↓
Regra: professor → PROFESSORES
↓
A pessoa é adicionada automaticamente ao grupo PROFESSORES
```

## O que acontece por trás

A cada poucos minutos o Power Automate verifica se existe alguém novo ou alguma mudança importante.

Ele consulta três listas técnicas:

- **REGRAS** — diz qual Cargo vai para qual grupo;
- **ESTADO** — guarda a situação atual de cada usuário;
- **LOG** — registra o que a automação fez.

Antes de adicionar alguém, o sistema confere se a pessoa já está no grupo. Se já estiver, não duplica nada.

## E se o Cargo estiver vazio?

A pessoa fica como:

```text
PENDENTE_CARGO
```

Depois que o Cargo for preenchido, a automação volta a analisar.

## E se não existir regra para o Cargo?

Fica como:

```text
SEM_REGRA
```

Isso não é uma falha do sistema. Significa apenas que ainda não foi definido um grupo para aquele Cargo.

## E se ocorrer um erro?

O Estado fica como:

```text
ERRO
```

O fluxo tenta novamente automaticamente. O Log e o FlowRunID ajudam a descobrir a causa.

## A automação remove pessoas dos grupos?

**Não.**

A versão atual é ADD-ONLY: adiciona quando necessário, mas não remove automaticamente.

Isso evita retirar acessos que possam ter sido concedidos manualmente.

## E se alguém for removido manualmente do grupo correto?

Existe uma revisão automática de 24 horas. Nessa revisão, a automação confere novamente. Se a regra ainda mandar aquela pessoa para o grupo e ela tiver sido removida, a associação é reparada.

## E se uma nova regra for criada depois?

A revisão de 24 horas também permite aplicar a nova regra mesmo que o Cargo do usuário não tenha mudado.

## Quem pode mexer nas listas técnicas?

As listas têm acesso restrito:

- proprietários administram;
- a conta técnica do fluxo recebe apenas o nível necessário;
- usuários comuns do site não podem editar as regras da automação.

## Como saber se está tudo normal?

Quando não há nada novo para fazer, a execução mostra:

```text
Quantidade de candidatos = 0
Há candidatos = false
```

E a execução fica verde.

## Resumo em uma frase

**Cadastre corretamente o Cargo no Microsoft 365; a automação cuida de conferir a regra, adicionar ao grupo, registrar o resultado e revisar periodicamente.**
