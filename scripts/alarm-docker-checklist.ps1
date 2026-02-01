# Alarm 500 — Kritik kontroller (lokal Docker)
# Kullanım: .\scripts\alarm-docker-checklist.ps1
# Gereksinim: Docker Desktop çalışıyor olmalı; monolith veya api container ayağa kalkmış olmalı.

$ErrorActionPreference = "Continue"

Write-Host "`n=== Alarm Docker Checklist (5.1 - 5.4) ===" -ForegroundColor Cyan

# 1) Container bul (monolith veya beaver-iot-api)
$containers = docker ps --format "{{.Names}}" 2>$null
if (-not $containers) {
    Write-Host "HATA: Docker daemon calisiyor degil veya container yok. 'docker ps' calistirin." -ForegroundColor Red
    exit 1
}

$apiContainer = $null
foreach ($c in $containers) {
    $img = docker inspect --format "{{.Config.Image}}" $c 2>$null
    if ($img -match "beaver-iot|monolith") {
        $apiContainer = $c
        break
    }
    if ($c -match "monolith|api") {
        $apiContainer = $c
        break
    }
}

if (-not $apiContainer) {
    Write-Host "UYARI: beaver-iot/monolith container bulunamadi. Tum container'lar:" -ForegroundColor Yellow
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
    Write-Host "Container adini parametre ile verin: .\alarm-docker-checklist.ps1 -ContainerName <ad>" -ForegroundColor Yellow
    $apiContainer = $containers[0]
    Write-Host "Ilk container kullaniliyor: $apiContainer" -ForegroundColor Yellow
}

Write-Host "`nContainer: $apiContainer" -ForegroundColor White

# 2) Port: 9080 (nginx) veya 9200 (direkt API)
$port9080 = (docker port $apiContainer 2>$null | Select-String "9080|80")
$port9200 = (docker port $apiContainer 2>$null | Select-String "9200")
$baseUrl = $null
if ($port9080) {
    $m = [regex]::Match($port9080.ToString(), "(\d+)->")
    if ($m.Success) { $baseUrl = "http://localhost:$($m.Groups[1].Value)" }
}
if (-not $baseUrl -and $port9200) {
    $m = [regex]::Match($port9200.ToString(), "(\d+)->")
    if ($m.Success) { $baseUrl = "http://localhost:$($m.Groups[1].Value)" }
}
if (-not $baseUrl) {
    $baseUrl = "http://localhost:9080"
    Write-Host "Port bilgisi alinamadi; varsayilan 9080 kullaniliyor." -ForegroundColor Yellow
}

Write-Host "Base URL: $baseUrl`n" -ForegroundColor White

# --- 5.1 Docker imaji / JAR ---
Write-Host "--- 5.1 JAR ve icerik ---" -ForegroundColor Cyan
$jarCheck = docker exec $apiContainer ls -lh /application.jar 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  /application.jar: $jarCheck" -ForegroundColor Green
} else {
    Write-Host "  /application.jar bulunamadi (monolith icinde API ayri process olabilir)." -ForegroundColor Yellow
    $jarCheck = docker exec $apiContainer sh -c "ls -lh /application.jar 2>/dev/null || true"
    Write-Host "  $jarCheck"
}

# AlarmsController / alarm paketi JAR icinde mi?
$jarList = docker exec $apiContainer sh -c "jar tf /application.jar | grep -E 'alarm|AlarmsController'" 2>$null
if ($jarList -and ($jarList | Select-String "alarm")) {
    Write-Host "  Alarm paketi JAR icinde: EVET" -ForegroundColor Green
} else {
    Write-Host "  Alarm paketi JAR icinde: BULUNAMADI (imaj alarm modulu olmadan build edilmis; yeniden build gerekir)" -ForegroundColor Red
}

# application.yml spring.mvc
$ymlCheck = docker exec $apiContainer sh -c "cd /tmp && rm -rf BOOT-INF 2>/dev/null; jar xf /application.jar BOOT-INF/classes/application.yml 2>/dev/null && grep -A5 'spring.mvc' BOOT-INF/classes/application.yml 2>/dev/null || echo 'okunamadi'" 2>$null
if ($ymlCheck -match "static-path-pattern|static-path") {
    Write-Host "  application.yml spring.mvc (static-path-pattern): MEVCUT" -ForegroundColor Green
    Write-Host "  $($ymlCheck | Select-Object -First 3)"
} else {
    Write-Host "  application.yml spring.mvc: $ymlCheck" -ForegroundColor Yellow
}

# --- 5.3 Startup loglari ---
Write-Host "`n--- 5.3 Startup log (mapped.*alarms) ---" -ForegroundColor Cyan
$mapped = docker logs $apiContainer 2>&1 | Select-String -Pattern "mapped.*alarms" -AllMatches
if ($mapped) {
    Write-Host "  Bulundu:" -ForegroundColor Green
    $mapped | ForEach-Object { Write-Host "    $_" }
} else {
    Write-Host "  'Mapped ... alarms' satiri YOK - Controller yuklenmemis olabilir." -ForegroundColor Red
}

# --- 5.2 Actuator mappings ---
Write-Host "`n--- 5.2 Actuator mappings (alarms) ---" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/actuator/mappings" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $content = $r.Content
    if ($content -match "alarms/search|alarms/rules") {
        Write-Host "  alarms mapping MEVCUT" -ForegroundColor Green
        $content | Select-String -Pattern "/alarms/[a-z]+" -AllMatches | ForEach-Object { $_.Matches.Value } | Select-Object -Unique | ForEach-Object { Write-Host "    $_" }
    } else {
        Write-Host "  alarms mapping BULUNAMADI (JSON icinde alarms yok)" -ForegroundColor Red
    }
} catch {
    Write-Host "  Hata: $($_.Exception.Message)" -ForegroundColor Red
}

# --- 5.4 __ping ---
Write-Host "`n--- 5.4 __ping ---" -ForegroundColor Cyan
try {
    $ping = Invoke-WebRequest -Uri "$baseUrl/__ping" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($ping.Content -and $ping.Content.Trim() -eq "ok") {
        Write-Host "  __ping: ok" -ForegroundColor Green
    } elseif ($ping.Content -match "<!DOCTYPE|</html>") {
        Write-Host "  __ping: SPA HTML dondu (nginx fallback; backend __ping yanitlamadi veya 404)" -ForegroundColor Yellow
    } else {
        Write-Host "  __ping yanit: $($ping.Content.Substring(0, [Math]::Min(80, $ping.Content.Length)))... (status: $($ping.StatusCode))" -ForegroundColor Yellow
    }
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401) {
        Write-Host "  __ping: 401 Unauthorized (endpoint auth gerektiriyor veya kapali)" -ForegroundColor Yellow
    } else {
        Write-Host "  __ping hata: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# --- Ozet ---
Write-Host "`n=== Ozet ===" -ForegroundColor Cyan
Write-Host "Container: $apiContainer | URL: $baseUrl"
Write-Host "5.1 JAR icinde AlarmsController ve static-path-pattern yukarida kontrol edildi."
Write-Host "5.2 Mappings ve 5.4 __ping yukarida test edildi."
Write-Host ""
