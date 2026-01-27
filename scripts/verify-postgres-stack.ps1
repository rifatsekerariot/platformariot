# Verify PostgreSQL stack (chirpstack-prebuilt-postgres) after deploy-zero-touch.ps1 -Postgres
# Usage: .\verify-postgres-stack.ps1 [-WaitSeconds 90] [-BaseUrl "http://localhost:9080"]
#
# Checks: postgresql + monolith containers running, HTTP 200/302 on BaseUrl (frontend/backend).

param(
    [int]$WaitSeconds = 90,
    [string]$BaseUrl = "http://localhost:9080"
)

$ErrorActionPreference = "Stop"
$start = Get-Date

Write-Host "[verify] Checking PostgreSQL stack (beaver-iot-postgresql, beaver-iot)..."

# 1. Containers
$pg = docker ps --filter "name=beaver-iot-postgresql" --format "{{.Names}}" 2>$null
$mo = docker ps --filter "name=beaver-iot" --format "{{.Names}}" 2>$null
if (-not $pg) { Write-Error "[verify] Container beaver-iot-postgresql not running. Run: deploy-zero-touch.ps1 -Postgres" }
if (-not $mo) { Write-Error "[verify] Container beaver-iot not running. Run: deploy-zero-touch.ps1 -Postgres" }
Write-Host "[verify] Containers: beaver-iot-postgresql, beaver-iot OK"

# 2. HTTP (frontend/backend) with retries
$ok = $false
for ($i = 0; $i -lt $WaitSeconds; $i += 5) {
    try {
        $r = Invoke-WebRequest -Uri $BaseUrl -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($r.StatusCode -eq 200) { $ok = $true; break }
    } catch {
        $code = $null
        if ($_.Exception.Response) { try { $code = [int]$_.Exception.Response.StatusCode } catch {} }
        if ($code -in 200, 301, 302) { $ok = $true; break }
    }
    Write-Host "[verify] Waiting for $BaseUrl ... $i s"
    Start-Sleep -Seconds 5
}
if (-not $ok) { Write-Error "[verify] $BaseUrl did not return 200/302 after ${WaitSeconds}s. Check: docker logs -f beaver-iot" }
Write-Host "[verify] HTTP GET $BaseUrl -> 200 OK"

$el = [math]::Round(((Get-Date) - $start).TotalSeconds, 1)
Write-Host ""
Write-Host "[verify] All checks passed in ${el}s. Frontend, backend and PostgreSQL are running."
