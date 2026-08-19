# Documento-base obrigatório de projeto

Antes de iniciar a execução de um projeto relevante, criar um documento-base detalhado. Ele será o primeiro ponto de leitura para qualquer IA ou colaborador.

## Template

```markdown
# NOME DO PROJETO

## 1. Objetivo
Descrever o resultado final esperado em linguagem simples.

## 2. Problema atual
O que existe hoje, qual dificuldade está sendo resolvida e por que o projeto é necessário.

## 3. Escopo
### Incluído
- ...

### Fora do escopo
- ...

## 4. Arquitetura inicial
Descrever componentes, serviços, integrações e fluxo de dados.

## 5. Ambiente atual
- plataforma;
- versões;
- licenças;
- serviços disponíveis;
- contas técnicas;
- repositórios;
- ambientes/tenants.

Nunca colocar segredos.

## 6. Restrições permanentes
- custo;
- segurança;
- compatibilidade;
- requisitos de interface;
- regras de negócio;
- limites técnicos conhecidos.

## 7. Dependências
- APIs;
- conectores;
- bibliotecas;
- módulos;
- permissões;
- serviços externos.

## 8. Dados e identificadores
Separar nomes humanos de IDs técnicos. Definir quais IDs devem ser descobertos automaticamente por ambiente.

## 9. Baseline inicial
- versão/commit;
- comportamento conhecido;
- testes aprovados;
- limitações;
- procedimento de retorno.

## 10. Estratégia de desenvolvimento
Definir se será:
- incremental;
- por diff;
- orientado a definição;
- manual primeiro e automatizado depois;
- com piloto antes de produção.

## 11. Critérios de sucesso
Resultados mensuráveis que indicam que o projeto funciona.

## 12. Plano de testes
- validação estática;
- teste controlado;
- smoke test;
- regressão;
- teste final.

## 13. Observabilidade
Definir logs, estados, auditorias, IDs de execução e onde investigar falhas.

## 14. Segurança
- menor privilégio;
- segregação de contas;
- proteção de segredos;
- dados que não podem ir para GitHub;
- política de backup.

## 15. Plano de rollback
Descrever como voltar ao estado anterior antes de qualquer alteração estrutural.

## 16. Estratégia de escala/migração
O que é fixo e o que deve ser parametrizado para outro ambiente, tenant, cliente ou instalação.

## 17. Decisões formais
Registrar decisões importantes com identificador, motivo e status.

## 18. Riscos conhecidos
Listar risco, impacto, mitigação e sinal de detecção.

## 19. Fases
- Fase 0 — inventário
- Fase 1 — preparação
- Fase 2 — piloto
- Fase 3 — produção
- Fase 4 — hardening
- Fase 5 — documentação/escala

Adaptar ao projeto.

## 20. Próxima ação concreta
Indicar exatamente o próximo bloco de trabalho.
```

## Regras para manter o documento útil

O documento-base deve ser atualizado quando houver mudança de arquitetura, decisão permanente, baseline, restrição importante ou estratégia de implantação.

Não transformar o documento-base em diário. Avanços pontuais devem ir para changelog/checkpoints. O documento-base deve mostrar a visão vigente do projeto.

## Documentos complementares recomendados

```text
README.md             → entrada simples
DOCUMENTO_BASE.md     → arquitetura e plano vigente
AI_CONTEXT.md         → contexto condensado para IA
DECISOES.md           → decisões formais
CHANGELOG_DEV.md      → avanços por versão
TESTES.md             → cenários e resultados
ERROS_CONHECIDOS.md   → problemas e soluções
RUNBOOK.md            → operação e recuperação
VERSAO_ATUAL.md       → baseline seguro
```
