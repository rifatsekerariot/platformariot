# Prepare ChirpStack deployment: build integrations, copy JARs to docker target.

$ErrorActionPreference = "Stop"
$DockerRoot = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path "$DockerRoot\build-docker")) { $DockerRoot = Split-Path $DockerRoot -Parent }
$Examples = Join-Path $DockerRoot "examples"
$Target = Join-Path $Examples "target\chirpstack\integrations"
$Beaver = Split-Path $DockerRoot -Parent | Join-Path -ChildPath "beaver"

if (-not (Test-Path $Beaver)) {
    Write-Warning "Beaver repo not found at $Beaver. Clone beaver-iot-integrations beside beaver-iot-docker."
    exit 1
}

# Build integrations
$BuildScript = Join-Path $Beaver "scripts\build-integrations.ps1"
if (Test-Path $BuildScript) {
    & $BuildScript
} else {
    Push-Location $Beaver
    if (Get-Command mvn -ErrorAction SilentlyContinue) {
        mvn clean package -DskipTests -pl integrations/chirpstack-integration -am
    } else {
        docker run --rm -v "${Beaver}:/workspace" -w /workspace maven:3.8-eclipse-temurin-17-alpine mvn clean package -DskipTests -pl integrations/chirpstack-integration -am
    }
    Pop-Location
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Copy JAR
New-Item -ItemType Directory -Force -Path $Target | Out-Null
$Jars = Get-ChildItem -Path (Join-Path $Beaver "integrations\chirpstack-integration\target") -Filter "*.jar" | Where-Object { $_.Name -notmatch "original" }
if (-not $Jars) { Write-Error "No JAR found."; exit 1 }
foreach ($j in $Jars) { Copy-Item $j.FullName -Destination $Target -Force; Write-Host "Copied $($j.Name) -> $Target" }

Write-Host "Done. Run: cd examples && docker compose -f chirpstack.yaml up -d"
