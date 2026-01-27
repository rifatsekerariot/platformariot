# pull-and-up.ps1
# Git pull + docker compose pull + docker compose up -d (veri kaybi yok; volume'lar korunur).
# Compose dosyasini COMPOSE_FILE ile verebilirsin; yoksa asagidaki sirayla aranir.

$ErrorActionPreference = "Stop"

# --- 1) beaver-iot-docker kokunu bul
$Root = $env:BEAVER_DOCKER_ROOT
if (-not $Root) {
    # Script beaver-iot-docker/scripts/ icindeyse: ust dizin = repo koku
    $Root = Split-Path $PSScriptRoot -Parent
    if (-not (Test-Path (Join-Path $Root "build-docker")) -and -not (Test-Path (Join-Path $Root "examples"))) {
        $cur = $Root
        while ($cur) {
            if (Test-Path (Join-Path $cur "examples\monolith.yaml")) { $Root = $cur; break }
            $par = Split-Path $cur -Parent
            if ($par -eq $cur) { break }
            $cur = $par
        }
    }
}
if (-not $Root -or -not (Test-Path $Root)) {
    Write-Host "HATA: beaver-iot-docker koku bulunamadi. BEAVER_DOCKER_ROOT ile ayarla veya scripti beaver-iot-docker/scripts icinde calistir." -ForegroundColor Red
    exit 1
}

# --- 2) Compose dosyasi
$Compose = $env:COMPOSE_FILE
if (-not $Compose) {
    $candidates = @(
        (Join-Path $Root "examples\chirpstack-prebuilt.yaml"),
        (Join-Path $Root "examples\monolith.yaml"),
        (Join-Path $Root "build-docker\docker-compose.yaml")
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $Compose = $c; break }
    }
}
if (-not $Compose -or -not (Test-Path $Compose)) {
    Write-Host "HATA: Compose dosyasi bulunamadi. COMPOSE_FILE ile tam yolu ver. Aranan: examples\chirpstack-prebuilt.yaml, examples\monolith.yaml, build-docker\docker-compose.yaml" -ForegroundColor Red
    exit 1
}

Write-Host "[pull-and-up] Root: $Root" -ForegroundColor Cyan
Write-Host "[pull-and-up] Compose: $Compose" -ForegroundColor Cyan

Set-Location $Root

# --- 3) git pull
Write-Host "[pull-and-up] git pull..." -ForegroundColor Yellow
git pull

# --- 4) docker compose pull + up -d
Write-Host "[pull-and-up] docker compose pull..." -ForegroundColor Yellow
docker compose -f "$Compose" pull

Write-Host "[pull-and-up] docker compose up -d..." -ForegroundColor Yellow
docker compose -f "$Compose" up -d

Write-Host "[pull-and-up] Bitti. (docker compose down -v KULLANMA; volume siler, veri kaybi olur.)" -ForegroundColor Green
