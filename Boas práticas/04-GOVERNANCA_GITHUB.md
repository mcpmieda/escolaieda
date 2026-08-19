# Governança do GitHub

O GitHub deve registrar não apenas o código final, mas também as decisões e o caminho técnico que permitam reconstruir o projeto.

## 1. Regra principal

Avanços importantes devem ser registrados durante o desenvolvimento, não somente no encerramento.

Um bom checkpoint informa:

- o que mudou;
- por que mudou;
- resultado do teste;
- se houve impacto em produção;
- se rollback foi necessário;
- qual baseline passa a ser considerado seguro.

## 2. Estrutura recomendada por projeto

```text
projeto/
├── README.md
├── DOCUMENTO_BASE.md
├── AI_CONTEXT.md
├── DECISOES.md
├── CHANGELOG_DEV.md
├── TESTES.md
├── ERROS_CONHECIDOS.md
├── RUNBOOK.md
├── VERSAO_ATUAL.md
├── scripts/
├── templates/
└── auditorias/
```

Nem todo projeto precisa de todos os arquivos desde o primeiro dia. Criar os que realmente agregam rastreabilidade.

## 3. README

Deve responder rapidamente:

- o que é;
- para que serve;
- como funciona em poucas linhas;
- estado atual;
- onde está a documentação principal;
- como começar.

## 4. DOCUMENTO_BASE

É criado antes da execução e contém arquitetura, escopo, restrições, critérios de sucesso, riscos, testes e rollback.

## 5. AI_CONTEXT

É a versão condensada que outra IA deve ler primeiro para continuar o projeto sem reler todo o histórico.

Deve conter somente o contexto vigente e decisões que realmente influenciam o trabalho atual.

## 6. DECISOES

Cada decisão importante deve registrar:

```text
ID
Título
Motivo
Alternativas descartadas
Status
Data ou fase
```

Quando uma decisão for substituída, marcar como superada. Não apagar silenciosamente o histórico.

## 7. CHANGELOG_DEV

Registrar mudanças curtas por versão ou checkpoint.

Exemplo:

```text
v1.4.2
- alterada detecção de candidatos
- nenhuma mudança em escrita
- smoke test aprovado
- baseline anterior: v1.4.1
```

## 8. TESTES

Separar claramente:

- teste planejado;
- resultado esperado;
- resultado observado;
- aprovado/reprovado;
- ambiente;
- versão testada.

## 9. ERROS_CONHECIDOS

Erro relevante deve registrar:

```text
Sintoma
Causa
Diagnóstico
Correção validada
Como evitar reincidência
Versões afetadas
```

Sempre que possível, a seção “como evitar” deve apontar para teste, assert, preflight ou validação automática.

## 10. RUNBOOK

O runbook deve permitir manutenção sem reconstruir o raciocínio do desenvolvimento.

Incluir:

- saúde normal;
- diagnóstico por sintoma;
- procedimentos comuns;
- permissões;
- conexões;
- backup;
- rollback;
- recuperação rápida;
- checklist periódico.

## 11. VERSAO_ATUAL

Registrar o ponto seguro atual:

- commit/tag;
- versão lógica;
- funcionalidades validadas;
- limitações;
- instrução de recuperação.

## 12. Checkpoints

Criar checkpoint quando houver:

- implantação em produção;
- conclusão de fase;
- correção de erro importante;
- mudança estrutural;
- hardening de segurança;
- validação end-to-end;
- atualização de baseline.

## 13. Commits

Preferir mensagens que expliquem intenção:

```text
docs: consolida arquitetura final
fix: corrige leitura de Choice no SharePoint
feat: adiciona reconciliação periódica
chore: atualiza baseline seguro
```

Evitar commits genéricos como `ajustes`, `teste`, `novo` quando puder existir descrição melhor.

## 14. Repositório público

Nunca commitar:

- senhas;
- tokens;
- client secrets;
- certificados privados;
- cookies;
- MFA;
- UPNs reais em massa;
- dumps de usuários;
- IDs internos desnecessários;
- exports brutos com dados sensíveis;
- configurações locais reais.

Usar arquivos `.example` e `.gitignore`.

## 15. Continuidade entre IAs

Ao terminar uma sessão importante, garantir que outra IA consiga responder estas perguntas lendo o GitHub:

```text
Qual é o objetivo?
Qual é o baseline seguro?
O que já foi validado?
O que não deve ser alterado?
Quais erros já aconteceram?
Como testar?
Como recuperar?
Qual é a próxima ação?
```

Se essas respostas estiverem apenas no chat, a documentação ainda não está completa.
