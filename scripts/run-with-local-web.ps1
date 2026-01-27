# Full stack: ChirpStack JARs + local web (widget fix) + Docker build + compose up.
# Prereqs: Docker, beaver + beaver-iot-web + beaver-iot-docker under same workspace (e.g. c:\Projeler).
# Usage: .\scripts\run-with-local-web.ps1 [-Workspace "C:\Projeler"] [-SkipComposeUp]

param(
    [string] $Workspace = "",
    [switch] $SkipComposeUp
)

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
$DockerRoot = Split-Path $ScriptDir -Parent
$WorkspaceRoot = if ($Workspace -and (Test-Path $Workspace)) { $Workspace } else { Split-Path $DockerRoot -Parent }

Write-Host "[run-with-local-web] Workspace: $WorkspaceRoot" -ForegroundColor Cyan

# 1. Prepare ChirpStack (JARs)
Write-Host "[run-with-local-web] 1. Preparing ChirpStack (build + copy JARs)..." -ForegroundColor Yellow
& (Join-Path $ScriptDir "prepare-chirpstack.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 2. Build web from local beaver-iot-web
Write-Host "[run-with-local-web] 2. Building web image from local beaver-iot-web..." -ForegroundColor Yellow
& (Join-Path $ScriptDir "build-web-local.ps1") -Workspace $WorkspaceRoot
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 3. Build api + monolith (use local web image)
Write-Host "[run-with-local-web] 3. Building api + monolith (BASE_WEB_IMAGE=local)..." -ForegroundColor Yellow
$env:BASE_WEB_IMAGE = "milesight/beaver-iot-web:latest"
$BuildDir = Join-Path $DockerRoot "build-docker"
Push-Location $BuildDir
try {
    & docker compose build api monolith
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}

if ($SkipComposeUp) {
    Write-Host "[run-with-local-web] SkipComposeUp: not starting stack." -ForegroundColor Cyan
    exit 0
}

# 4. Compose up (ChirpStack) – use locally built monolith
Write-Host "[run-with-local-web] 4. Starting ChirpStack compose..." -ForegroundColor Yellow
if (-not $env:CHIRPSTACK_DEFAULT_TENANT_ID) { $env:CHIRPSTACK_DEFAULT_TENANT_ID = "default" }
$env:BEAVER_IMAGE = "milesight/beaver-iot:latest"
$ExamplesDir = Join-Path $DockerRoot "examples"
Push-Location $ExamplesDir
try {
    & docker compose -f chirpstack.yaml up -d
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "[run-with-local-web] Done. Beaver IoT (Alarm/Map/DeviceList widgets) is running." -ForegroundColor Green
Write-Host "  UI:     http://localhost:9080" -ForegroundColor White
Write-Host "  Logs:   docker compose -f chirpstack.yaml logs -f" -ForegroundColor White
Write-Host "  Stop:   docker compose -f chirpstack.yaml down" -ForegroundColor White
