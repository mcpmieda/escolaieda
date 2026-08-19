@{
    # Copie este arquivo para CONFIG.local.psd1 e preencha por tenant.
    # CONFIG.local.psd1 deve permanecer fora do GitHub público.

    Installer = @{
        ConfigVersion = '1.0'
        OutputFolder  = '.\output-local'
    }

    Tenant = @{
        # Ex.: contoso.onmicrosoft.com
        PrimaryDomain = 'SEU-TENANT.onmicrosoft.com'

        # Conta estável que será usada nas conexões do fluxo.
        # Ex.: automacao@contoso.onmicrosoft.com
        AdminUpn = 'CONTA-TECNICA@SEU-TENANT.onmicrosoft.com'
    }

    SharePoint = @{
        # Ex.: https://contoso.sharepoint.com/sites/ARQUIVODIGITAL
        SiteUrl = 'https://SEU-TENANT.sharepoint.com/sites/SEU-SITE'

        Lists = @{
            Rules = 'AUTOMAÇÃO - REGRAS DE GRUPOS'
            State = 'AUTOMAÇÃO - ESTADO DOS USUÁRIOS'
            Log   = 'AUTOMAÇÃO - LOG DE GRUPOS'
        }
    }

    Flow = @{
        DisplayName          = 'AUTO | Grupos por Cargo | Microsoft 365'
        RecurrenceMinutes    = 2
        ReconciliationHours  = 24
        AddOnly              = $true
    }

    # Somente nomes lógicos. IDs serão descobertos no tenant atual.
    Groups = @(
        @{ Name = 'ALUNOS' },
        @{ Name = 'EQUIPE DE APOIO' },
        @{ Name = 'PROFESSORES' },
        @{ Name = 'VISITANTE' },
        @{ Name = 'GRUPO DA SECRETARIA - ARQUIVO DIGITAL' }
    )

    # Cargo deve estar normalizado: trim + lowercase, acentos preservados.
    Rules = @(
        @{ Cargo = 'aluno';                   Action = 'ADICIONAR'; Group = 'ALUNOS' },
        @{ Cargo = 'equipe de apoio';         Action = 'ADICIONAR'; Group = 'EQUIPE DE APOIO' },
        @{ Cargo = 'professor';               Action = 'ADICIONAR'; Group = 'PROFESSORES' },
        @{ Cargo = 'visitante';               Action = 'ADICIONAR'; Group = 'VISITANTE' },
        @{ Cargo = 'diretor';                 Action = 'ADICIONAR'; Group = 'GRUPO DA SECRETARIA - ARQUIVO DIGITAL' },
        @{ Cargo = 'auxiliar de secretaria';  Action = 'ADICIONAR'; Group = 'GRUPO DA SECRETARIA - ARQUIVO DIGITAL' },
        @{ Cargo = 'secretaria';              Action = 'ADICIONAR'; Group = 'GRUPO DA SECRETARIA - ARQUIVO DIGITAL' },
        @{ Cargo = 'coordenador pedagógico';  Action = 'ADICIONAR'; Group = 'GRUPO DA SECRETARIA - ARQUIVO DIGITAL' },
        @{ Cargo = 'administrador global';    Action = 'IGNORAR';   Group = $null }
    )

    Security = @{
        RulesPermissionForTechnicalAccount = 'Leitura'
        StatePermissionForTechnicalAccount = 'Colaboração'
        LogPermissionForTechnicalAccount   = 'Colaboração'
        RemoveMembersGroup                  = $true
        RemoveVisitorsGroup                 = $true
    }
}
