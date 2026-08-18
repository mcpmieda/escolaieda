# Auditoria — Fase 0 — Diagnóstico inicial

**Data:** 18/08/2026  
**Projeto:** Automação de Inclusão de Usuários em Grupos por Cargo — Microsoft 365 Education A1  
**Modo:** somente leitura  
**Ferramenta:** Azure Cloud Shell + Microsoft Graph PowerShell  

## Objetivo

Validar rapidamente os pré-requisitos reais do tenant antes de criar listas SharePoint ou fluxo Power Automate.

## Resultado da autenticação

- Microsoft Graph conectado com sucesso.
- Conta administrativa usada: `adminn@eduieda.onmicrosoft.com`.
- Tipo de autenticação: Delegated.
- Permissões usadas no diagnóstico: somente leitura para usuários, grupos e sites.

> O Tenant ID e GUIDs reais de grupos não são registrados neste arquivo porque o repositório atual é público. Eles foram obtidos e validados durante a sessão administrativa e serão usados apenas nas configurações internas do Microsoft 365/SharePoint.

## Inventário do diretório

- Total de objetos de usuário: **28**.
- Membros ativos: **28**.
- Membros desabilitados: **0**.
- Convidados: **0**.

Conclusão: o tenant atual é pequeno, o que reduz significativamente o risco de escala e torna a recorrência inicial de 2 minutos mais confortável para a V1.

## Distribuição atual de Cargos normalizados

| Quantidade | Cargo |
|---:|---|
| 19 | `professor` |
| 4 | `<SEM CARGO>` |
| 2 | `auxiliar de secretaria` |
| 1 | `administrador global` |
| 1 | `coordenador pedagógico` |
| 1 | `monitoria disciplinar` |

### Observações

- Os Cargos planejados `aluno`, `equipe de apoio`, `visitante`, `diretor` e `secretaria` não possuem usuários ativos no momento do diagnóstico; isso não impede manter as regras preparadas para futuros cadastros.
- Existem **4 contas sem Cargo**; deverão ser tratadas como `PENDENTE_CARGO` ou explicitamente ignoradas conforme natureza de cada conta.
- `administrador global` não faz parte das regras de profissão. A princípio não deve ser associado automaticamente a grupo profissional.
- `monitoria disciplinar` não faz parte do mapeamento aprovado e permanecerá `SEM_REGRA` até decisão explícita. Não será inferido um grupo automaticamente.

## Grupos de destino

Os cinco grupos previstos foram encontrados de forma única e válida no Microsoft 365:

- `ALUNOS` — OK
- `EQUIPE DE APOIO` — OK
- `PROFESSORES` — OK
- `VISITANTE` — OK
- `GRUPO DA SECRETARIA - ARQUIVO DIGITAL` — OK

Todos foram identificados como grupos Microsoft 365 (`Unified`).

Os GUIDs foram obtidos corretamente na sessão, mas não são registrados no repositório público.

## SharePoint

A busca do site **Arquivo Digital** foi executada, porém a etapa de exibição do resultado terminou com erro de sintaxe interativa no bloco `else` do PowerShell.

O problema foi do modo como o bloco foi colado/executado no terminal interativo, e não indica falha do Graph ou do SharePoint.

### Próxima ação

Executar comando simples e independente para exibir a variável `$sites` já preenchida. Se necessário, repetir a busca por `Arquivo` em uma única instrução.

## Ocorrências não críticas durante a execução

1. Um endereço de login foi colado diretamente no prompt PowerShell antes do script e foi interpretado como comando. Sem impacto.
2. Durante instalação de módulos houve aviso de que `Microsoft.Graph.Authentication 2.39.0` já estava em uso. Os módulos necessários foram importados e o diagnóstico continuou normalmente.
3. O erro final do `else` não afetou os resultados de usuários e grupos já obtidos.

## Situação da Fase 0

### Concluído

- [x] autenticação Graph;
- [x] inventário de usuários;
- [x] auditoria de Cargos;
- [x] identificação dos cinco grupos;
- [x] confirmação de que não existem convidados;
- [x] confirmação de que todos os usuários atuais estão ativos;
- [x] obtenção dos GUIDs dos grupos na sessão administrativa.

### Pendente

- [ ] confirmar URL/ID do site SharePoint Arquivo Digital;
- [ ] decidir tratamento para `monitoria disciplinar`;
- [ ] revisar as 4 contas sem Cargo durante o baseline;
- [ ] iniciar criação automatizada das três listas SharePoint.

## Decisão operacional

Não há bloqueio relevante para continuar. Assim que o site SharePoint for confirmado, a próxima etapa será criar em bloco as listas técnicas, suas colunas e as regras iniciais, preferencialmente via Graph/PowerShell, mantendo o Power Automate para a operação contínua.
