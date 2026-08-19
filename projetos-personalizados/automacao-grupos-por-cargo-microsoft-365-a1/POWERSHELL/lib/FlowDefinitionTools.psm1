Set-StrictMode -Version Latest

function Get-FlowMaxActionDepth {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        $Actions,

        [int]$Depth = 1
    )

    if ($null -eq $Actions) {
        return 0
    }

    $max = 0

    foreach ($prop in $Actions.PSObject.Properties) {
        $action = $prop.Value
        if ($null -eq $action) { continue }

        if ($Depth -gt $max) {
            $max = $Depth
        }

        if ($action.PSObject.Properties['actions']) {
            $child = Get-FlowMaxActionDepth -Actions $action.actions -Depth ($Depth + 1)
            if ($child -gt $max) { $max = $child }
        }

        if ($action.PSObject.Properties['else'] -and $action.else) {
            if ($action.else.PSObject.Properties['actions']) {
                $child = Get-FlowMaxActionDepth -Actions $action.else.actions -Depth ($Depth + 1)
                if ($child -gt $max) { $max = $child }
            }
        }

        if ($action.PSObject.Properties['cases'] -and $action.cases) {
            foreach ($caseProp in $action.cases.PSObject.Properties) {
                $caseObject = $caseProp.Value
                if ($caseObject -and $caseObject.PSObject.Properties['actions']) {
                    $child = Get-FlowMaxActionDepth -Actions $caseObject.actions -Depth ($Depth + 1)
                    if ($child -gt $max) { $max = $child }
                }
            }
        }

        if ($action.PSObject.Properties['default'] -and $action.default) {
            if ($action.default.PSObject.Properties['actions']) {
                $child = Get-FlowMaxActionDepth -Actions $action.default.actions -Depth ($Depth + 1)
                if ($child -gt $max) { $max = $child }
            }
        }
    }

    return $max
}

function Get-FlowRunAfterIssues {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        $Actions,

        [string]$Path = 'definition.actions'
    )

    $issues = @()
    if ($null -eq $Actions) { return $issues }

    $sameLevelNames = @($Actions.PSObject.Properties.Name)

    foreach ($prop in $Actions.PSObject.Properties) {
        $actionName = $prop.Name
        $action = $prop.Value
        if ($null -eq $action) { continue }

        $actionPath = "$Path.$actionName"

        if ($action.PSObject.Properties['runAfter'] -and $action.runAfter) {
            foreach ($dependency in $action.runAfter.PSObject.Properties.Name) {
                if ($sameLevelNames -notcontains $dependency) {
                    $issues += [PSCustomObject]@{
                        Action     = $actionName
                        Path       = $actionPath
                        Dependency = $dependency
                        Problem    = 'runAfter aponta para ação que não pertence ao mesmo nível.'
                    }
                }
            }
        }

        if ($action.PSObject.Properties['actions']) {
            $issues += @(
                Get-FlowRunAfterIssues -Actions $action.actions -Path "$actionPath.actions"
            )
        }

        if ($action.PSObject.Properties['else'] -and $action.else -and $action.else.PSObject.Properties['actions']) {
            $issues += @(
                Get-FlowRunAfterIssues -Actions $action.else.actions -Path "$actionPath.else.actions"
            )
        }

        if ($action.PSObject.Properties['cases'] -and $action.cases) {
            foreach ($caseProp in $action.cases.PSObject.Properties) {
                $caseName = $caseProp.Name
                $caseObject = $caseProp.Value
                if ($caseObject -and $caseObject.PSObject.Properties['actions']) {
                    $issues += @(
                        Get-FlowRunAfterIssues -Actions $caseObject.actions -Path "$actionPath.cases.$caseName.actions"
                    )
                }
            }
        }

        if ($action.PSObject.Properties['default'] -and $action.default -and $action.default.PSObject.Properties['actions']) {
            $issues += @(
                Get-FlowRunAfterIssues -Actions $action.default.actions -Path "$actionPath.default.actions"
            )
        }
    }

    return @($issues)
}

function Test-FlowClientData {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ClientDataJson,

        [int]$MaximumDepth = 8
    )

    try {
        $clientData = $ClientDataJson | ConvertFrom-Json -Depth 100
    }
    catch {
        return [PSCustomObject]@{
            Valid          = $false
            JsonValid      = $false
            MaximumDepth   = $null
            DepthLimit     = $MaximumDepth
            RunAfterIssues = @()
            Errors         = @("JSON inválido: $($_.Exception.Message)")
        }
    }

    $definition = $clientData.properties.definition
    if ($null -eq $definition -or $null -eq $definition.actions) {
        return [PSCustomObject]@{
            Valid          = $false
            JsonValid      = $true
            MaximumDepth   = $null
            DepthLimit     = $MaximumDepth
            RunAfterIssues = @()
            Errors         = @('properties.definition.actions não encontrado.')
        }
    }

    $depth = Get-FlowMaxActionDepth -Actions $definition.actions -Depth 1
    $runAfterIssues = @(Get-FlowRunAfterIssues -Actions $definition.actions)
    $errors = @()

    if ($depth -gt $MaximumDepth) {
        $errors += "Profundidade $depth excede o limite $MaximumDepth."
    }

    if ($runAfterIssues.Count -gt 0) {
        $errors += "Foram encontradas $($runAfterIssues.Count) referência(s) runAfter fora do mesmo nível."
    }

    return [PSCustomObject]@{
        Valid          = ($errors.Count -eq 0)
        JsonValid      = $true
        MaximumDepth   = $depth
        DepthLimit     = $MaximumDepth
        RunAfterIssues = $runAfterIssues
        Errors         = $errors
    }
}

function Assert-FlowClientData {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ClientDataJson,

        [int]$MaximumDepth = 8
    )

    $result = Test-FlowClientData -ClientDataJson $ClientDataJson -MaximumDepth $MaximumDepth

    if (-not $result.Valid) {
        $message = @($result.Errors) -join ' '
        throw "Definição do fluxo inválida. $message"
    }

    return $result
}

function New-SharePointChoiceObject {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Value
    )

    return [ordered]@{
        Value = $Value
    }
}

Export-ModuleMember -Function @(
    'Get-FlowMaxActionDepth',
    'Get-FlowRunAfterIssues',
    'Test-FlowClientData',
    'Assert-FlowClientData',
    'New-SharePointChoiceObject'
)
