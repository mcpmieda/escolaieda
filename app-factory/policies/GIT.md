# Git Policy

## Fonte de verdade

Git registra estado técnico; Issues registram trabalho; PRs registram proposta/diff/revisão; CI registra evidência automática.

## Projeto novo

- `main` representa estado integrado;
- funcionalidades relevantes preferem branch/worktree própria;
- PR quando o risco, colaboração ou necessidade de revisão justificar;
- evitar commits genéricos como `ajustes` quando uma intenção clara puder ser registrada.

## Manutenção

- identificar baseline/commit seguro antes de mudança relevante;
- revisar preferencialmente por diff;
- não misturar alterações independentes no mesmo commit sem motivo.

## Commits

Conventional Commits podem ser usados quando agregarem clareza:

`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `security`.

Não transformar convenção em burocracia para repositório pequeno.

## Branch protection

Projetos de produção ou maior criticidade devem avaliar rulesets/checks obrigatórios. Protótipos não precisam copiar automaticamente a mesma governança.

## Continuidade

Ao trocar de agente, não copie toda a conversa. Aponte para branch/PR, Issue, `PROJECT_STATE.md` e critérios de conclusão.