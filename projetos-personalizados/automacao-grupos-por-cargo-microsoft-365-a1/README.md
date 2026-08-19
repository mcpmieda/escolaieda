# Automação de Grupos por Cargo — Microsoft 365 Education A1

Automação em produção para incluir usuários em grupos Microsoft 365 conforme o atributo **Cargo (`jobTitle`)** cadastrado no Microsoft 365, usando recursos nativos/Standard e sem depender de computador ligado continuamente.

## Como funciona — resumo fácil

1. Um usuário é criado ou tem o Cargo alterado no Microsoft 365.
2. O Power Automate verifica os usuários em recorrência de 2 minutos.
3. O Cargo é normalizado e comparado com a lista de regras no SharePoint.
4. Se existir uma regra `ADICIONAR`, o fluxo verifica se o usuário já pertence ao grupo correto.
5. Se não pertencer, adiciona. Se já pertencer, apenas confirma o estado.
6. O resultado fica registrado nas listas de Estado e Log.
7. Uma reconciliação de 24 horas revisa estados antigos e consegue reparar associação removida manualmente ou aplicar regra criada posteriormente.

A V1 é **ADD-ONLY**: adiciona quando necessário, mas não remove usuários automaticamente de grupos.

Para uma explicação sem termos técnicos, veja [`RESUMO_FACIL.md`](./RESUMO_FACIL.md).

## Arquitetura final

```text
Microsoft 365 Admin Center
        ↓
Usuários + Cargo (jobTitle)
        ↓
Power Automate — recorrência 2 min
        ↓
Detecção por assinatura + retry + reconciliação 24h
        ↓
SharePoint
  ├─ REGRAS DE GRUPOS
  ├─ ESTADO DOS USUÁRIOS
  └─ LOG DE GRUPOS
        ↓
Office 365 Groups — conector Standard
        ↓
ListGroupMembers → AddMemberToGroup quando necessário
```

O fluxo é **solution-aware** e sua definição pode ser administrada pelo Dataverse Web API (`clientdata`). PowerShell é a camada de implantação, diagnóstico, versionamento e recuperação; o Power Automate continua sendo o motor cotidiano.

## Estado do projeto

**Produção validada em 2026-08-19.**

Validado em execução real:

- detecção de usuário novo;
- normalização de Cargo;
- resolução exata de regra;
- inclusão automática no grupo correto;
- idempotência (`JA_MEMBRO`);
- criação/atualização do Estado;
- gravação de Log;
- retry de `ERRO` e `PENDENTE_GRUPO`;
- otimização para buscar regras apenas quando houver candidatos;
- reconciliação automática em 24 horas;
- permissões mínimas nas três listas técnicas;
- rollback em alterações de definição do fluxo;
- profundidade final do fluxo: 6 níveis.

## Documentação final

Comece por estes arquivos:

- [`RESUMO_FACIL.md`](./RESUMO_FACIL.md) — explicação curta para usuário não técnico.
- [`DOCUMENTACAO_FINAL.md`](./DOCUMENTACAO_FINAL.md) — explicação completa da solução e arquitetura final.
- [`INSTALADOR_MULTI_TENANT.md`](./INSTALADOR_MULTI_TENANT.md) — método para replicar a solução em outros tenants como um instalador por etapas.
- [`RUNBOOK_OPERACIONAL.md`](./RUNBOOK_OPERACIONAL.md) — operação diária, manutenção, recuperação e testes.
- [`ERROS_CONHECIDOS.md`](./ERROS_CONHECIDOS.md) — erros encontrados no projeto e correções já validadas.
- [`DECISOES.md`](./DECISOES.md) — decisões formais vigentes.
- [`CHANGELOG.md`](./CHANGELOG.md) — histórico consolidado.
- [`POWERSHELL/README.md`](./POWERSHELL/README.md) — toolkit de implantação e auditoria multi-tenant.
- [`POWERSHELL/CONFIG.example.psd1`](./POWERSHELL/CONFIG.example.psd1) — configuração genérica por tenant.

### Documentos históricos

- [`PLANO_MESTRE.md`](./PLANO_MESTRE.md) — planejamento detalhado original e histórico de construção.
- [`PLANO_MESTRE_ADENDO_POWERSHELL.md`](./PLANO_MESTRE_ADENDO_POWERSHELL.md) — evolução da camada administrativa.
- [`AUDITORIAS/`](./AUDITORIAS/) — checkpoints sanitizados e evidências do desenvolvimento.

Os documentos históricos permanecem preservados, mas a documentação final acima é a referência operacional principal.

## Mapeamento atualmente validado

| Cargo normalizado | Ação | Grupo lógico |
|---|---|---|
| `aluno` | ADICIONAR | `ALUNOS` |
| `equipe de apoio` | ADICIONAR | `EQUIPE DE APOIO` |
| `professor` | ADICIONAR | `PROFESSORES` |
| `visitante` | ADICIONAR | `VISITANTE` |
| `diretor` | ADICIONAR | grupo da Secretaria / Arquivo Digital |
| `auxiliar de secretaria` | ADICIONAR | grupo da Secretaria / Arquivo Digital |
| `secretaria` | ADICIONAR | grupo da Secretaria / Arquivo Digital |
| `coordenador pedagógico` | ADICIONAR | grupo da Secretaria / Arquivo Digital |
| `administrador global` | IGNORAR | — |

O instalador multi-tenant não deve fixar estes nomes como obrigatórios: cada tenant usa um arquivo de configuração próprio.

## Segurança final das listas

- **REGRAS**: conta técnica do fluxo com `Leitura`; proprietários com `Controle Total`.
- **ESTADO**: conta técnica do fluxo com `Colaboração`; proprietários com `Controle Total`.
- **LOG**: conta técnica do fluxo com `Colaboração`; proprietários com `Controle Total`.
- grupos comuns de Membros e Visitantes não têm acesso às listas técnicas.

## Princípios de implantação

- leitura/auditoria antes de escrita;
- nenhuma escolha silenciosa quando houver ambiguidade;
- nomes para leitura humana, IDs para operações;
- backup do `clientdata` antes de alteração;
- desativar o fluxo apenas durante mutação estrutural;
- validar no servidor antes de reativar;
- rollback automático quando possível;
- nunca gravar segredos, tokens, UPNs reais em massa ou GUIDs internos no GitHub público.

## Fontes técnicas oficiais

- Power Automate — gerenciamento de cloud flows por código / Dataverse Web API: https://learn.microsoft.com/power-automate/manage-flows-with-code
- Office 365 Groups connector: https://learn.microsoft.com/connectors/office365groups/
- SharePoint connector no Power Automate: https://learn.microsoft.com/sharepoint/dev/business-apps/power-automate/sharepoint-connector-actions-triggers
- Microsoft Graph PowerShell SDK: https://learn.microsoft.com/powershell/microsoftgraph/installation
