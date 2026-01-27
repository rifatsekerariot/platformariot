# Build beaver-iot-integrations (incl. chirpstack-integration) via Maven.
# Uses local Maven if available, otherwise Docker.

$ErrorActionPreference = "Stop"
$BeaverRoot = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path "$BeaverRoot\pom.xml")) { $BeaverRoot = Split-Path $BeaverRoot -Parent }
Set-Location $BeaverRoot

$MavenImg = "maven:3.8-eclipse-temurin-17-alpine"
$Mvn = $null
if (Get-Command mvn -ErrorAction SilentlyContinue) { $Mvn = "mvn" }

if ($Mvn) {
    Write-Host "Using local Maven."
    & mvn clean package -DskipTests -pl integrations/chirpstack-integration -am
} else {
    Write-Host "Maven not found. Using Docker: $MavenImg"
    $Dir = (Get-Location).Path
    docker run --rm -v "${Dir}:/workspace" -w /workspace $MavenImg mvn clean package -DskipTests -pl integrations/chirpstack-integration -am
}

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$Jar = Get-Item -Path "integrations\chirpstack-integration\target\chirpstack-integration-*-shaded.jar" -ErrorAction SilentlyContinue
if (-not $Jar) { $Jar = Get-Item -Path "integrations\chirpstack-integration\target\chirpstack-integration-*.jar" -ErrorAction SilentlyContinue }
if (-not $Jar) { Write-Error "ChirpStack integration JAR not found."; exit 1 }
Write-Host "Built: $($Jar.FullName)"
