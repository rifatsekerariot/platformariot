# Build Beaver IoT Web image from *local* beaver-iot-web (e.g. with Alarm/Map/DeviceList widget fix).
# Requires: Docker, beaver-iot-web and beaver-iot-docker as siblings under a common workspace.
# Usage: .\scripts\build-web-local.ps1 [-Workspace "C:\Projeler"]

param(
    [string] $Workspace = ""
)

$ErrorActionPreference = "Stop"
$DockerRoot = Split-Path $PSScriptRoot -Parent
$WorkspaceRoot = if ($Workspace -and (Test-Path $Workspace)) { $Workspace } else { Split-Path $DockerRoot -Parent }

$WebDir = Join-Path $WorkspaceRoot "beaver-iot-web"
$Dockerfile = Join-Path $DockerRoot "build-docker\beaver-iot-web-local.dockerfile"

if (-not (Test-Path $WebDir)) {
    Write-Error "beaver-iot-web not found at $WebDir. Use -Workspace to set workspace root (parent of beaver-iot-web and beaver-iot-docker)."
}
if (-not (Test-Path $Dockerfile)) {
    Write-Error "Dockerfile not found: $Dockerfile"
}

$DockerignoreSrc = Join-Path $DockerRoot "dockerignore-for-local-web"
$DockerignoreDst = Join-Path $WorkspaceRoot ".dockerignore"
if (Test-Path $DockerignoreSrc) {
    Copy-Item $DockerignoreSrc -Destination $DockerignoreDst -Force
    Write-Host "[build-web-local] Using $DockerignoreDst to limit context."
}

Write-Host "[build-web-local] Building milesight/beaver-iot-web:latest from $WebDir"
Write-Host "[build-web-local] Context: $WorkspaceRoot"
& docker build -f $Dockerfile -t "milesight/beaver-iot-web:latest" $WorkspaceRoot
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "[build-web-local] Done. Use this image for monolith build (BASE_WEB_IMAGE=milesight/beaver-iot-web:latest)."
