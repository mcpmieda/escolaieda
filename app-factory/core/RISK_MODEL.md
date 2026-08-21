# Risk Model

A governança deve ser proporcional ao impacto possível.

## Baixo risco

Exemplos: documentação, pesquisa, protótipo descartável, texto, arquivos de exemplo sem efeito real.

Padrão:
- executar diretamente quando autorizado;
- validação simples;
- sem cerimônia de rollback desnecessária.

## Médio risco

Exemplos: funcionalidade localizada, regra de negócio não destrutiva, dependência, configuração de aplicação, refatoração limitada.

Padrão:
- escopo fechado;
- revisar dependências diretas;
- executar verificações relevantes;
- registrar mudança no Git;
- explicar consequência não óbvia.

## Alto risco

Exemplos: produção, exclusão, operação em massa, banco/schema, migration, permissões, autenticação, infraestrutura, dados sensíveis, mudança estrutural ampla.

Padrão:
1. confirmar estado/baseline;
2. entender impacto;
3. ter backup ou estratégia de recuperação quando aplicável;
4. obter autorização quando a ação destrutiva não estiver já explicitamente coberta;
5. testar em escopo controlado quando possível;
6. aplicar;
7. reler estado real;
8. testar comportamento;
9. registrar resultado e caminho de rollback.

## Regra de simplicidade

Não adicionar processo, ferramenta ou gate cujo custo de manutenção seja maior que o risco que reduz.