# Lokal Docker test sistemi: alarm modülü dahil build + stack + doğrulama.
# Kullanım:
#   .\scripts\local-docker-test.ps1              # Tam: build + up + doğrulama
#   .\scripts\local-docker-test.ps1 -BuildOnly  # Sadece imajları build et
#   .\scripts\local-docker-test.ps1 -SkipBuild # Build atla, sadece stack up + doğrulama
#   .\scripts\local-docker-test.ps1 -Stop      # Stack'i durdur (down -v)
#
# Gereksinim: Docker Desktop çalışıyor, repo kökünde backend/, web/, build-docker/, examples/ mevcut.

param(
    [switch]$BuildOnly,
    [switch]$SkipBuild,
    [switch]$Stop,
    [switch]$NoCache = $false
)

$ErrorActionPreference = "Stop"
# Repo kökü: scripts/ bir üst = repo root
$Root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { Get-Location }
if (-not (Test-Path "$Root\backend") -or -not (Test-Path "$Root\build-docker")) {
    $Root = Get-Location
    while ($Root -and -not (Test-Path "$Root\backend")) { $Root = Split-Path -Parent $Root }
}
if (-not $Root -or -not (Test-Path "$Root\backend")) {
    Write-Host "HATA: Repo kökü (backend/, build-docker/) bulunamadi. Repo kökünden calistirin: .\scripts\local-docker-test.ps1" -ForegroundColor Red
    exit 1
}
Write-Host "Repo kökü: $Root" -ForegroundColor Gray

Set-Location $Root
$BD = "$Root\build-docker"
$Examples = "$Root\examples"

# --- Stop ---
if ($Stop) {
    Write-Host "`n=== Stack durduruluyor (examples) ===" -ForegroundColor Cyan
    Set-Location $Examples
    docker compose -f stack.yaml down -v 2>$null
    Write-Host "Stack durduruldu." -ForegroundColor Green
    exit 0
}

# --- Docker kontrol ---
$null = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "HATA: Docker erisilemiyor (docker ps basarisiz). Docker Desktop Engine'in 'running' oldugundan emin olun." -ForegroundColor Red
    exit 1
}
Write-Host "Docker: OK" -ForegroundColor Green

# --- Build ---
if (-not $SkipBuild) {
    Write-Host "`n=== 1. Web imaji (beaver-iot-web-local.dockerfile) ===" -ForegroundColor Cyan
    if (-not (Test-Path "web")) {
        Write-Host "HATA: web/ klasoru yok." -ForegroundColor Red
        exit 1
    }
    $webArgs = @(
        "build",
        "-f", "build-docker/beaver-iot-web-local.dockerfile",
        "-t", "milesight/beaver-iot-web:latest"
    )
    if ($NoCache) { $webArgs += "--no-cache" }
    $webArgs += "--network=host", "."
    & docker @webArgs
    if ($LASTEXITCODE -ne 0) { exit 1 }

    Write-Host "`n=== 2. .env (BASE_WEB_IMAGE lokal) ===" -ForegroundColor Cyan
    $envContent = @"
DOCKER_REPO=milesight
PRODUCTION_TAG=latest
BASE_WEB_IMAGE=milesight/beaver-iot-web:latest
BASE_API_IMAGE=milesight/beaver-iot-api:latest
"@
    Set-Content -Path "$BD\.env" -Value $envContent -Encoding UTF8

    Write-Host "`n=== 3. API + Monolith (alarm modulu -am ile dahil) ===" -ForegroundColor Cyan
    Set-Location $BD
    $composeArgs = @("compose", "build")
    if ($NoCache) { $composeArgs += "--no-cache" }
    $composeArgs += "api", "monolith"
    & docker @composeArgs
    if ($LASTEXITCODE -ne 0) { exit 1 }
    Set-Location $Root

    if ($BuildOnly) {
        Write-Host "`nBuild tamamlandi. Stack baslatmak icin: .\scripts\local-docker-test.ps1 -SkipBuild" -ForegroundColor Green
        exit 0
    }
}

# --- Stack up ---
Write-Host "`n=== 4. Stack baslatiliyor (PostgreSQL + Monolith) ===" -ForegroundColor Cyan
Set-Location $Examples
$env:BEAVER_IMAGE = "milesight/beaver-iot:latest"
docker compose -f stack.yaml up -d
if ($LASTEXITCODE -ne 0) { exit 1 }
Set-Location $Root

Write-Host "`nMonolith ve PostgreSQL ayaga kalkiyor (Java ~90s). Bekleniyor..." -ForegroundColor Yellow
$maxWait = 120
$interval = 5
$elapsed = 0
$ok = $false
while ($elapsed -lt $maxWait) {
    Start-Sleep -Seconds $interval
    $elapsed += $interval
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:9080/" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 302) {
            $ok = $true
            break
        }
    } catch {}
    Write-Host "  ${elapsed}s..."
}
if (-not $ok) {
    Write-Host "UYARI: 90s icinde 200/302 alinamadi. Log: examples -> docker compose -f stack.yaml logs monolith" -ForegroundColor Yellow
}

# --- Alarm doğrulama ---
Write-Host "`n=== 5. Alarm modulu doğrulama ===" -ForegroundColor Cyan
& "$Root\scripts\alarm-docker-checklist.ps1"

# --- Özet ---
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Lokal test stack calisiyor." -ForegroundColor Green
Write-Host "  URL:    http://localhost:9080" -ForegroundColor White
Write-Host "  Durdur: .\scripts\local-docker-test.ps1 -Stop" -ForegroundColor White
Write-Host "  Veya:   cd examples; docker compose -f stack.yaml down -v" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan
