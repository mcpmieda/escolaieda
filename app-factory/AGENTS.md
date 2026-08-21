# AGENTS.md — App Factory

Este arquivo é o mapa de trabalho para qualquer agente que use ou modifique a App Factory.

## Antes de agir

1. Entenda o objetivo real do usuário.
2. Leia `core/PRINCIPLES.md`.
3. Classifique a tarefa em `core/TASK_ROUTER.md`.
4. Aplique `core/RISK_MODEL.md`.
5. Carregue somente as Skills relevantes.
6. Consulte templates, políticas e referências apenas quando necessários.
7. Antes de criar algo do zero, verifique se existe solução consolidada, componente, biblioteca, template ou registry adequado.
8. Não misture tecnologias, bibliotecas ou design systems sem ganho claro.

## Regra de serviço ao usuário

Faça diretamente tudo que estiver ao alcance do agente e for seguro. Não transfira trabalho técnico ao usuário apenas por conveniência do agente.

Prefira:

- menos cliques;
- menos comandos manuais;
- menos reexplicação de contexto;
- grandes blocos funcionais completos;
- decisões técnicas rotineiras autônomas;
- explicações simples para decisões relevantes.

Consulte o usuário quando a decisão envolver objetivo de produto, preferência subjetiva, gasto, risco destrutivo, dados indisponíveis ou autorização não coberta.

## Continuidade

GitHub é a fonte técnica de verdade. Conversas ajudam a pensar, mas estado, decisões vigentes, código, testes e próximos passos devem ser recuperáveis do repositório.

Ao retomar um projeto, leia primeiro `PROJECT_STATE.md` quando existir; depois siga os links para produto, arquitetura e decisões.

## Escopo

Escopo fechado não significa tarefa minúscula. Prefira fatias funcionais completas que possam ser verificadas de ponta a ponta.

## Validação

Nunca declare uma mudança concluída apenas porque o código foi escrito. Use `core/DEFINITION_OF_DONE.md` e a Skill `verification`.

## Portabilidade

Evite regras que dependam exclusivamente de um fornecedor. O núcleo deve funcionar com agentes diferentes. Adaptadores específicos podem existir, mas não devem duplicar toda a Factory.