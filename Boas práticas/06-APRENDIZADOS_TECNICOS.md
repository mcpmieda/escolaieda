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
