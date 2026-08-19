# Aprendizados técnicos consolidados

Este arquivo reúne princípios gerais extraídos de projetos reais. O objetivo não é documentar um produto específico, mas registrar padrões de engenharia que podem ser reaproveitados.

## 1. Baseline estável vale mais que correções acumuladas

Quando uma tentativa falha, continuar corrigindo em cima de um estado incerto aumenta o risco. Melhor voltar ao último ponto seguro, entender o erro e reaplicar somente a mudança necessária.

## 2. Revisão por diff reduz custo e retrabalho

Uma alteração localizada normalmente exige revisar apenas o que mudou, dependências diretas e testes afetados. Reauditar todo o projeto em cada pequena mudança consome tempo e aumenta ruído.

## 3. Manual primeiro, instalador depois

Automação prematura costuma codificar suposições erradas. Primeiro executar e validar o processo, observar o que realmente varia e só então transformar em script, template ou instalador.

## 4. Configuração deve viajar; IDs não

Em projetos multiambiente, transportar lógica, schema e nomes lógicos. Descobrir novamente IDs, URLs internas, referências e objetos reais em cada ambiente.

## 5. Ambiguidade é um erro de entrada

Se uma busca deveria encontrar um único recurso e retorna mais de um, o sistema não tem informação suficiente para decidir com segurança. Parar é melhor que escolher arbitrariamente.

## 6. Backup sem validação não basta

Um bom processo de mudança estrutural precisa de:

```text
backup
+ validação antes da escrita
+ validação depois da escrita
+ teste funcional
+ rollback conhecido
```

## 7. Idempotência reduz incidentes

Ações que podem ser repetidas sem efeitos colaterais são mais fáceis de recuperar e automatizar.

## 8. Estado e log são diferentes

Estado responde “como está agora”. Log responde “o que aconteceu”. Misturar os dois dificulta auditoria e recuperação.

## 9. Reconciliação corrige o mundo real

Mesmo quando existe detecção de eventos ou alterações, pessoas e sistemas externos podem modificar o estado. Revisões periódicas ajudam a restaurar o estado desejado.

## 10. Menor privilégio reduz impacto de erro

Uma conta que só precisa ler não deveria administrar o recurso. Uma conta que só precisa atualizar dados não deveria alterar schema ou permissões.

## 11. O erro deve virar conhecimento executável

A melhor correção de um erro importante é fazer com que ele seja impossível ou mais difícil de repetir. Criar testes, asserts, validações de schema, preflight e checks automáticos.

## 12. Contratos precisam ser validados explicitamente

APIs, conectores, JSON, bancos e plataformas possuem formatos específicos. Não inferir que um campo, tipo ou referência funciona de determinada forma sem verificar o contrato real.

## 13. Estrutura visual não é necessariamente a melhor estrutura de desenvolvimento

Quando uma ferramenta visual passa a exigir dezenas de cliques repetitivos, uma definição por código pode ser mais segura e reproduzível — desde que a plataforma seja compreendida e existam backup e rollback.

## 14. O caminho mais sofisticado nem sempre é o melhor

Soluções robustas devem ser proporcionais ao problema. Complexidade extra precisa pagar seu custo em segurança, escala, manutenção ou economia real.

## 15. Documentação simples e técnica devem coexistir

Um bom projeto precisa de dois níveis:

```text
RESUMO FÁCIL
→ permite entender rapidamente o propósito e funcionamento

DOCUMENTAÇÃO TÉCNICA
→ permite manter, reconstruir, migrar e recuperar
```

## 16. Documento-base antes da execução melhora decisões

Registrar arquitetura, riscos, dependências e rollback antes de começar reduz decisões improvisadas durante a implementação e facilita comparar proposta versus resultado real.

## 17. Registrar o avanço durante o projeto preserva contexto

O histórico de decisões, falhas e correções perde valor quando escrito somente no final. Checkpoints no GitHub permitem entender por que a solução chegou ao estado atual.

## 18. Preferir grandes blocos determinísticos a muitos cliques quando houver proteção

Para tarefas administrativas repetitivas, um script validado com entradas claras, saída clara e rollback costuma ser mais eficiente que dezenas de passos manuais. Isso não significa automatizar sem controle: o script deve falhar cedo, registrar resultado e limitar seu escopo.

## 19. Segurança pública exige sanitização por padrão

Quando o repositório é público, considerar sensível qualquer dado que identifique diretamente ambiente ou pessoas sem necessidade técnica. Templates públicos devem usar exemplos e arquivos locais ignorados pelo Git.

## 20. O projeto deve ser retomável sem depender do chat

Memória de conversa é útil para continuidade imediata, mas não deve ser a única fonte de verdade. O objetivo final da documentação é permitir que uma nova IA ou pessoa reconstrua o estado vigente a partir do repositório.

## 21. Boa prática forte deve virar mecanismo quando possível

Uma regra que depende apenas de alguém lembrar de executá-la é mais frágil que uma validação automática equivalente.

Sempre avaliar se a regra pode virar:

```text
preflight
teste
lint
check de CI
ruleset
script
assert
template
```

O mecanismo deve ser simples e justificar sua manutenção.

## 22. Aprovação deve ser proporcional ao risco

Exigir confirmação manual para cada alteração reduz velocidade sem necessariamente aumentar segurança.

Melhor classificar mudanças por risco e aumentar os gates apenas quando o impacto justificar.

Documentação autorizada pode ser automática; exclusão, migração, produção, permissões e operações em massa exigem proteção maior.

## 23. Testes de comportamento sobrevivem melhor a refatorações

Testes muito ligados à estrutura interna quebram quando o código é reorganizado mesmo sem regressão real.

Quando possível, testar contratos observáveis:

```text
entrada
→ comportamento esperado
→ saída/estado esperado
```

## 24. Contexto deve ser recuperado, não recontado

Se o projeto já possui `AI_CONTEXT.md`, baseline e documentação acessíveis, a IA deve recuperá-los diretamente.

Pedir que o usuário reexplique algo já versionado é retrabalho e aumenta risco de divergência entre conversa e fonte de verdade.

## 25. Arquitetura como código reduz custo cognitivo

Diagramas versionáveis, como Mermaid, ajudam pessoas e IAs a compreender rapidamente sistemas com vários componentes.

O diagrama é especialmente útil quando acompanha o texto técnico e evolui no mesmo commit da arquitetura.

## 26. Automação de release exige estratégia de versão antes da ferramenta

Gerar tags e changelog automaticamente é útil somente quando está claro:

- o que constitui uma release;
- qual componente está sendo versionado;
- como monorepos são tratados;
- quais commits realmente alteram versão.

Automatizar versão antes de definir esse contrato produz ruído, não governança.

## 27. Feature flag é um princípio de controle, não um arquivo específico

A ideia importante é conseguir reduzir exposição ou desligar rapidamente uma funcionalidade de risco.

A implementação deve aproveitar a arquitetura existente e evitar criar dependência remota ou infraestrutura extra sem necessidade.

## 28. Incidente grave merece análise diferente de bug comum

Um erro comum pode ir para `ERROS_CONHECIDOS.md`.

Um incidente com impacto relevante exige linha do tempo, impacto, causa raiz, contenção e prevenção. Esse rigor adicional ajuda a transformar falha sistêmica em melhoria de processo.

## 29. Triage impacto x esforço evita burocracia desnecessária

Nem toda tarefa precisa de documento-base completo, release, branch protegida e processo pesado.

Antes de aplicar governança, dimensionar o trabalho e o risco. O método deve proteger projetos relevantes sem transformar ajustes pequenos em processo excessivo.
