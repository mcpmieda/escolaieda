# Automação de Grupos por Cargo — Microsoft 365 Education A1

Projeto para incluir automaticamente usuários em grupos Microsoft 365 com base no atributo **Cargo (`jobTitle`)** informado no cadastro do Microsoft 365, sem Entra ID P1, sem Power Automate Premium e sem computador permanentemente ligado.

## Arquitetura aprovada

```text
Microsoft 365 Admin Center
        ↓
usuário criado/alterado
        ↓
Power Automate — recorrência inicial 2 min
        ↓
SharePoint — regras + estado + log
        ↓
Microsoft 365 Groups
        ↓
inclusão direta no grupo correspondente ao Cargo
```

## Camada administrativa complementar

PowerShell foi incorporado ao projeto para:

- implantação;
- diagnóstico;
- auditoria;
- descoberta de IDs;
- validação de SharePoint;
- governança do Power Automate;
- recuperação.

PowerShell **não substitui** o Power Automate como motor de produção.

## Documentos oficiais

- [`PLANO_MESTRE.md`](./PLANO_MESTRE.md) — planejamento consolidado original e arquitetura da V1.
- [`PLANO_MESTRE_ADENDO_POWERSHELL.md`](./PLANO_MESTRE_ADENDO_POWERSHELL.md) — incorporação formal da camada PowerShell.
- [`DECISOES.md`](./DECISOES.md) — registro das decisões formais vigentes.
- [`CHANGELOG.md`](./CHANGELOG.md) — histórico de alterações do projeto.
- [`POWERSHELL/README.md`](./POWERSHELL/README.md) — especificação do toolkit administrativo.

## Grupos atuais

- `ALUNOS`
- `EQUIPE DE APOIO`
- `PROFESSORES`
- `VISITANTE`
- `GRUPO DA SECRETARIA - ARQUIVO DIGITAL`

## Cargos atuais

| Cargo normalizado | Grupo |
|---|---|
| `aluno` | `ALUNOS` |
| `equipe de apoio` | `EQUIPE DE APOIO` |
| `professor` | `PROFESSORES` |
| `visitante` | `VISITANTE` |
| `diretor` | `GRUPO DA SECRETARIA - ARQUIVO DIGITAL` |
| `auxiliar de secretaria` | `GRUPO DA SECRETARIA - ARQUIVO DIGITAL` |
| `secretaria` | `GRUPO DA SECRETARIA - ARQUIVO DIGITAL` |
| `coordenador pedagógico` | `GRUPO DA SECRETARIA - ARQUIVO DIGITAL` |

## Estado atual

**Fase:** pré-implementação / Fase 0.

Próximo bloco de trabalho:

1. preparar toolkit PowerShell de leitura;
2. auditar tenant e Cargos;
3. descobrir GUIDs reais dos grupos;
4. confirmar site SharePoint Arquivo Digital;
5. criar/validar as três listas;
6. iniciar o Power Automate em modo auditoria.

## Segurança

O repositório atual é público. Nunca armazenar aqui:

- senhas;
- tokens;
- client secrets;
- certificados privados;
- cookies;
- códigos MFA;
- exportações com dados pessoais reais em massa;
- logs não sanitizados.

A fonte oficial de verdade do projeto é este diretório do GitHub. Alterações relevantes devem ser documentadas e versionadas.
