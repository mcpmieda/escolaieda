Set-StrictMode -Version Latest

function Connect-DataverseFlowContext {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$TenantId,

        [Parameter(Mandatory)]
        [string]$DataverseUrl
    )

    Import-Module Az.Accounts -Force

    Connect-AzAccount `
        -Tenant $TenantId `
        -UseDeviceAuthentication `
        -SkipContextPopulation |
        Out-Null

    $secureToken = (
        Get-AzAccessToken `
            -ResourceUrl $DataverseUrl `
            -AsSecureString
    ).Token

    $token = [System.Net.NetworkCredential]::new('', $secureToken).Password

    $baseUri = $DataverseUrl.TrimEnd('/') + '/api/data/v9.2/'

    return [PSCustomObject]@{
        BaseUri = $baseUri
        Headers = @{
            Authorization      = "Bearer $token"
            Accept             = 'application/json'
            'OData-MaxVersion' = '4.0'
            'OData-Version'    = '4.0'
        }
        WriteHeaders = @{
            Authorization      = "Bearer $token"
            Accept             = 'application/json'
            'OData-MaxVersion' = '4.0'
            'OData-Version'    = '4.0'
            'If-Match'         = '*'
        }
    }
}

function Get-DataverseModernFlow {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        $Context,

        [Parameter(Mandatory)]
        [Guid]$WorkflowId
    )

    $uri = $Context.BaseUri +
        "workflows($WorkflowId)?`$select=workflowid,name,category,statecode,statuscode,clientdata,modifiedon"

    return Invoke-RestMethod `
        -Uri $uri `
        -Headers $Context.Headers `
        -Method Get `
        -TimeoutSec 60
}

function Set-DataverseModernFlowState {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        $Context,

        [Parameter(Mandatory)]
        [Guid]$WorkflowId,

        [Parameter(Mandatory)]
        [ValidateSet('Active','Inactive')]
        [string]$State
    )

    if ($State -eq 'Active') {
        $stateCode = 1
        $statusCode = 2
    }
    else {
        $stateCode = 0
        $statusCode = 1
    }

    $body = @{
        statecode  = $stateCode
        statuscode = $statusCode
    } | ConvertTo-Json -Compress

    Invoke-RestMethod `
        -Uri ($Context.BaseUri + "workflows($WorkflowId)") `
        -Headers $Context.WriteHeaders `
        -Method Patch `
        -ContentType 'application/json; charset=utf-8' `
        -Body $body `
        -TimeoutSec 60
}

function Set-DataverseModernFlowClientData {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        $Context,

        [Parameter(Mandatory)]
        [Guid]$WorkflowId,

        [Parameter(Mandatory)]
        [string]$ClientData
    )

    $body = @{
        clientdata = $ClientData
    } | ConvertTo-Json -Compress

    Invoke-RestMethod `
        -Uri ($Context.BaseUri + "workflows($WorkflowId)") `
        -Headers $Context.WriteHeaders `
        -Method Patch `
        -ContentType 'application/json; charset=utf-8' `
        -Body $body `
        -TimeoutSec 60
}

function Export-DataverseModernFlowClientData {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        $Context,

        [Parameter(Mandatory)]
        [Guid]$WorkflowId,

        [Parameter(Mandatory)]
        [string]$OutputPath
    )

    $flow = Get-DataverseModernFlow -Context $Context -WorkflowId $WorkflowId

    if ([int]$flow.category -ne 5) {
        throw "Workflow $WorkflowId não é category=5 (Modern Flow)."
    }

    if ([string]::IsNullOrWhiteSpace([string]$flow.clientdata)) {
        throw 'clientdata vazio.'
    }

    $folder = Split-Path -Parent $OutputPath
    if (-not [string]::IsNullOrWhiteSpace($folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }

    $flow.clientdata | Set-Content -Path $OutputPath -Encoding UTF8

    return [PSCustomObject]@{
        Name       = $flow.name
        WorkflowId = $flow.workflowid
        StateCode  = $flow.statecode
        StatusCode = $flow.statuscode
        Category   = $flow.category
        ModifiedOn = $flow.modifiedon
        OutputPath = $OutputPath
    }
}

Export-ModuleMember -Function @(
    'Connect-DataverseFlowContext',
    'Get-DataverseModernFlow',
    'Set-DataverseModernFlowState',
    'Set-DataverseModernFlowClientData',
    'Export-DataverseModernFlowClientData'
)
