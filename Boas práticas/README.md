# Boas práticas — padrão de trabalho com IA

Este diretório consolida o método de trabalho aprendido e validado em projetos técnicos reais. Ele deve ser lido por qualquer inteligência artificial, agente de código ou colaborador antes de propor mudanças em projetos deste repositório.

## Objetivo

Trabalhar com velocidade sem perder segurança, rastreabilidade ou capacidade de recuperação.

O padrão desejado é:

```text
entender antes de alterar
↓
documentar a base do projeto
↓
validar o estado atual
↓
definir um baseline estável
↓
fazer mudança de escopo pequeno
↓
validar somente o que foi afetado
↓
registrar avanço no GitHub
↓
manter rollback possível
↓
automatizar o que já foi comprovado
```

## Regra para qualquer IA

Antes de executar uma solicitação técnica, a IA deve verificar se existe uma abordagem significativamente mais simples, segura, sustentável, reproduzível ou econômica. Se existir, deve informar isso antes de seguir uma abordagem inferior.

A IA não deve apenas obedecer comandos de forma mecânica. Deve atuar como conselheira técnica, apontando riscos, dependências, limitações e alternativas melhores quando forem relevantes.

## Documentos deste diretório

- [`01-REGRAS_PARA_IA.md`](./01-REGRAS_PARA_IA.md) — instruções operacionais que qualquer IA deve seguir.
- [`02-METODO_DE_DESENVOLVIMENTO.md`](./02-METODO_DE_DESENVOLVIMENTO.md) — método geral de construção, alteração e auditoria.
- [`03-DOCUMENTO_BASE_DE_PROJETO.md`](./03-DOCUMENTO_BASE_DE_PROJETO.md) — modelo obrigatório para iniciar projetos antes da execução.
- [`04-GOVERNANCA_GITHUB.md`](./04-GOVERNANCA_GITHUB.md) — como registrar avanços, checkpoints, decisões e documentação.
- [`05-CHECKLIST_GERAL.md`](./05-CHECKLIST_GERAL.md) — checklist curto para início, mudanças, testes e encerramento.
- [`06-APRENDIZADOS_TECNICOS.md`](./06-APRENDIZADOS_TECNICOS.md) — princípios extraídos de erros e sucessos reais.
- [`07-AI_CONTEXT_TEMPLATE.md`](./07-AI_CONTEXT_TEMPLATE.md) — template curto para contexto permanente de cada projeto.

## Princípios centrais

1. Criar um documento-base detalhado antes de iniciar a execução de um projeto relevante.
2. Registrar decisões e avanços no GitHub ao longo do trabalho, não apenas no final.
3. Manter um baseline estável conhecido e voltar a ele quando uma tentativa falhar.
4. Preferir mudanças incrementais e revisão por diff em vez de reauditar o projeto inteiro a cada alteração.
5. Separar lógica fixa de configuração variável.
6. Descobrir IDs e dependências por ambiente em vez de copiá-los.
7. Falhar diante de ambiguidade em vez de escolher silenciosamente um resultado.
8. Validar, fazer backup, alterar, reler, testar e manter rollback para mudanças estruturais.
9. Projetar operações idempotentes, observáveis e recuperáveis.
10. Corrigir a causa do erro, não apenas o estado aparente.
11. Automatizar primeiro aquilo que já foi validado manualmente.
12. Transformar erros importantes em validações automáticas para impedir reincidência.
13. Usar privilégio mínimo e evitar permissões maiores que o necessário.
14. Preferir código, configuração e definições versionáveis a longas sequências manuais quando isso reduzir risco e retrabalho.
15. Manter documentação em dois níveis: resumo simples e documentação técnica completa.
16. Projetar pensando em futura migração, reinstalação, outro tenant ou outro ambiente.
17. Não aumentar complexidade apenas para obter ganho marginal.

## Fonte de verdade

Para cada projeto, o GitHub deve ser tratado como livro técnico e histórico do trabalho. O chat pode ajudar a construir e interpretar, mas decisões permanentes, scripts, documentação, checkpoints e procedimentos de recuperação devem estar versionados no repositório.
