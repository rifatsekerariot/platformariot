<#
.SYNOPSIS
    Applies branch protection (main) to rifatsekerariot Beaver repos via GitHub API.
.DESCRIPTION
    Requires GITHUB_TOKEN (env) or -Token. Token needs "Administration" write on each repo.
    Repos: beaver-iot-integrations, beaver-iot-docker.
.EXAMPLE
    $env:GITHUB_TOKEN = "ghp_..."; .\apply-github-protection.ps1
#>
param(
    [string] $Token = $env:GITHUB_TOKEN,
    [string] $Owner = "rifatsekerariot",
    [string[]] $Repos = @("beaver-iot-integrations", "beaver-iot-docker")
)

$ErrorActionPreference = "Stop"

if (-not $Token -or $Token -eq "") {
    Write-Host "HATA: GITHUB_TOKEN gerekli." -ForegroundColor Red
    Write-Host "  GitHub > Settings > Developer settings > Personal access tokens"
    Write-Host "  Fine-grained token: bu repolarda 'Administration' = Read and write."
    Write-Host "  Sonra: `$env:GITHUB_TOKEN = '...'; .\apply-github-protection.ps1'" -ForegroundColor Yellow
    exit 1
}

$headers = @{
    "Accept"               = "application/vnd.github+json"
    "Authorization"        = "Bearer $Token"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$body = @{
    required_status_checks        = $null
    enforce_admins                = $false
    required_pull_request_reviews = @{ required_approving_review_count = 0 }
    restrictions                  = $null
    required_linear_history       = $false
    allow_force_pushes            = $false
    allow_deletions               = $false
} | ConvertTo-Json -Depth 4

$base = "https://api.github.com/repos/$Owner"

foreach ($repo in $Repos) {
    $url = "$base/$repo/branches/main/protection"
    try {
        Invoke-RestMethod -Uri $url -Method Put -Headers $headers -Body $body -ContentType "application/json"
        Write-Host "OK: $repo - main branch protection uygulandi." -ForegroundColor Green
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $msg = $_.ErrorDetails.Message
        Write-Host "HATA: $repo - HTTP $status - $msg" -ForegroundColor Red
        throw
    }
}

Write-Host ""
Write-Host "Branch protection tamam. Dependabot: Repo Settings - Code security and analysis - Dependabot alerts Enable." -ForegroundColor Cyan
