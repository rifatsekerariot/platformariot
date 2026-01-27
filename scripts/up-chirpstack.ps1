# One-shot: ensure integrations JAR + target dir, then run chirpstack compose.
# Prereqs: Docker running, Beaver monolith image built (build-docker).

$ErrorActionPreference = "Stop"
$DockerRoot = Split-Path $PSScriptRoot -Parent
$Examples = Join-Path $DockerRoot "examples"
$Target = Join-Path $Examples "target\chirpstack\integrations"
$Beaver = Join-Path (Split-Path $DockerRoot -Parent) "beaver"

Write-Host "Checking integrations JAR..."
$JarDir = Join-Path $Beaver "integrations\chirpstack-integration\target"
$Jars = @(Get-ChildItem -Path $JarDir -Filter "*.jar" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notmatch "original" })
if (-not $Jars.Count) {
    Write-Host "JAR not found. Running prepare-chirpstack..."
    & (Join-Path $PSScriptRoot "prepare-chirpstack.ps1")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    New-Item -ItemType Directory -Force -Path $Target | Out-Null
    foreach ($j in $Jars) { Copy-Item $j.FullName -Destination $Target -Force; Write-Host "Copied $($j.Name)" }
}

$Compose = Join-Path $Examples "chirpstack.yaml"
Write-Host "Starting chirpstack compose..."
Set-Location $Examples
docker compose -f chirpstack.yaml up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Run: docker compose -f chirpstack.yaml logs -f"
Write-Host "Test: .\scripts\test-webhook.ps1 -BaseUrl http://localhost:9080 -TenantId default"
