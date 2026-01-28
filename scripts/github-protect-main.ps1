# platformariot: main dalini koruma (force-push ve silme kapali, enforce admins).
# Kullanim: GH_TOKEN ortam degiskenini ayarla, sonra bu scripti calistir.
#   Token: https://github.com/settings/tokens -> Generate new token (classic)
#   Gerekli scope: repo (veya admin:repo / fine-grained "Administration" repo)
#
#   PowerShell: $env:GH_TOKEN = "ghp_xxx"; .\scripts\github-protect-main.ps1

$ErrorActionPreference = "Stop"
$owner = "rifatsekerariot"
$repo  = "platformariot"
$branch = "main"
$api = "https://api.github.com/repos/$owner/$repo/branches/$branch/protection"

$token = $env:GH_TOKEN
if (-not $token) {
    Write-Host "HATA: GH_TOKEN ortam degiskeni bos." -ForegroundColor Red
    Write-Host ""
    Write-Host "1. https://github.com/settings/tokens adresine git"
    Write-Host "2. 'Generate new token (classic)' -> repo (veya admin:repo) isaretle"
    Write-Host "3. PowerShell'de: `$env:GH_TOKEN = 'ghp_...'"
    Write-Host "4. Tekrar calistir: .\scripts\github-protect-main.ps1"
    exit 1
}

$body = @{
    required_status_checks = $null
    enforce_admins         = $true
    required_pull_request_reviews = $null
    restrictions           = $null
    allow_force_pushes     = $false
    allow_deletions        = $false
} | ConvertTo-Json

$headers = @{
    "Accept"        = "application/vnd.github+json"
    "Authorization" = "Bearer $token"
    "X-GitHub-Api-Version" = "2022-11-28"
    "Content-Type"  = "application/json"
}

Write-Host "main dal korumasi uygulanıyor ($owner/$repo)..." -ForegroundColor Cyan
try {
    $resp = Invoke-RestMethod -Uri $api -Method Put -Headers $headers -Body $body -TimeoutSec 30
    Write-Host "OK: main korumasi acildi. allow_force_pushes=false, allow_deletions=false, enforce_admins=true" -ForegroundColor Green
} catch {
    $status = $null; if ($_.Exception.Response) { $status = $_.Exception.Response.StatusCode.value__ }
    $msg = $null; if ($_.ErrorDetails) { $msg = $_.ErrorDetails.Message }
    Write-Host "API hatasi (HTTP $status): $msg" -ForegroundColor Red
    if ($status -eq 404) { Write-Host "Repo veya dal bulunamadi: $owner/$repo, branch=$branch" -ForegroundColor Yellow }
    if ($status -eq 403) { Write-Host "Token yetkisi yetersiz. 'repo' veya 'admin:repo' scope gerekli." -ForegroundColor Yellow }
    exit 1
}
