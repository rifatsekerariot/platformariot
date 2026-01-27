# Alarm Backend API Test Script (Test Plan 1)
# Prereq: Docker, Postgres stack (chirpstack-prebuilt-postgres), BEAVER_IMAGE with alarm-service + t_alarm.
# Usage: .\scripts\run-alarm-api-tests.ps1  or .\scripts\run-alarm-api-tests.ps1 -QuickCheck
#   -QuickCheck: only 401 on /alarms/search and 200 on /alarm, / (no login). Set $env:BEAVER_EXAMPLES_DIR for compose path.

param([switch]$QuickCheck)

$ErrorActionPreference = "Stop"
$Base = "http://localhost:9080"
$Api = "$Base/api/v1"

if ($QuickCheck) {
    Write-Host "QuickCheck: /alarms/search (no auth) -> 401, GET /alarm and / -> 200"
    $fail = 0
    try {
        $r = Invoke-WebRequest -Uri "$Api/alarms/search" -Method Post -ContentType "application/json" -Body "{}" -UseBasicParsing -ErrorAction Stop
        if ($r.StatusCode -ne 401) { Write-Host "FAIL: POST /alarms/search expected 401, got $($r.StatusCode)"; $fail++ }
        else { Write-Host "PASS: POST /alarms/search -> 401" }
    } catch {
        $code = $null; if ($_.Exception.Response) { $code = $_.Exception.Response.StatusCode.value__ }
        if ($code -eq 401) { Write-Host "PASS: POST /alarms/search -> 401" }
        else { Write-Host "FAIL: POST /alarms/search -> $code or $($_.Exception.Message)"; $fail++ }
    }
    foreach ($u in @("/alarm", "/")) {
        try {
            $r = Invoke-WebRequest -Uri "$Base$u" -UseBasicParsing -ErrorAction Stop
            if ($r.StatusCode -eq 200) { Write-Host "PASS: GET $u -> 200" }
            else { Write-Host "FAIL: GET $u -> $($r.StatusCode)"; $fail++ }
        } catch { Write-Host "FAIL: GET $u -> $($_.Exception.Message)"; $fail++ }
    }
    if ($fail -gt 0) { exit 1 }
    Write-Host "QuickCheck done."
    exit 0
}

# 1) Ensure compose is up
$ExamplesDir = if ($env:BEAVER_EXAMPLES_DIR) { $env:BEAVER_EXAMPLES_DIR } else { "c:\Projeler\beaver-iot-docker\examples" }
$ComposeFile = "chirpstack-prebuilt-postgres.yaml"
if (-not (Test-Path "$ExamplesDir\$ComposeFile")) {
    Write-Host "Compose not found: $ExamplesDir\$ComposeFile"
    exit 1
}
Push-Location $ExamplesDir
$prevErr = $ErrorActionPreference; $ErrorActionPreference = "Continue"
docker compose -f $ComposeFile up -d 2>&1 | Out-Null
$ErrorActionPreference = $prevErr
Pop-Location
Write-Host "Waiting 15s for monolith (stack may already be up)..."
Start-Sleep -Seconds 15

# 2) Register + Login (backend: email/nickname/password; OAuth2: client_id, client_secret)
$clientId = if ($env:OAUTH_CLIENT_ID) { $env:OAUTH_CLIENT_ID } else { "iab" }
$clientSecret = if ($env:OAUTH_CLIENT_SECRET) { $env:OAUTH_CLIENT_SECRET } else { "milesight*iab" }
$userEmail = if ($env:USER_EMAIL) { $env:USER_EMAIL } else { "testalarm@test.local" }
$userPassword = if ($env:USER_PASSWORD) { $env:USER_PASSWORD } else { "Test123!" }
$regBody = "{`"email`":`"$userEmail`",`"nickname`":`"testalarm`",`"password`":`"$userPassword`"}"
$loginBody = "grant_type=password&username=$([uri]::EscapeDataString($userEmail))&password=$([uri]::EscapeDataString($userPassword))&client_id=$clientId&client_secret=$clientSecret"
try {
    Invoke-RestMethod -Uri "$Api/user/register" -Method Post -ContentType "application/json" -Body $regBody 2>$null
    Write-Host "Register: $userEmail created or already exists."
} catch { }
try {
    $r = Invoke-RestMethod -Uri "$Api/oauth2/token" -Method Post -ContentType "application/x-www-form-urlencoded" -Body $loginBody
    $token = $r.data.access_token
    Write-Host "Token obtained."
} catch {
    Write-Host "Login failed: $($_.ErrorDetails.Message)"
    Write-Host "To run full test: 1) Create user at http://localhost:9080/auth/register (email, nickname, password). 2) Set env: `$env:USER_EMAIL='your@email'; `$env:USER_PASSWORD='yourpass'; then re-run."
    Write-Host "Quick check: /alarms/search without auth -> 401 (endpoint exists)."
    exit 1
}

$h = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

# 3) Get first device_id for seed and claim
$deviceId = 1
try {
    $dr = Invoke-RestMethod -Uri "$Api/device/search" -Method Post -Headers $h -Body '{"page_number":1,"page_size":1}'
    if ($dr.data.content -and $dr.data.content.Count -ge 1) {
        $deviceId = $dr.data.content[0].id
        Write-Host "Using device_id=$deviceId"
    }
} catch { Write-Host "device/search failed, using device_id=1" }

# 4) Seed t_alarm (requires t_alarm and a valid device in same tenant)
$tenantId = "default"
$sql = "INSERT INTO t_alarm (tenant_id, device_id, alarm_time, alarm_content, alarm_status, latitude, longitude, address, source, created_at) VALUES ('$tenantId', $deviceId, (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT - 3600000, 'Test alarm 1 - yuksek sicaklik', true, 41.01, 28.98, 'Adres 1', 'MANUAL', (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT), ('$tenantId', $deviceId, (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT - 7200000, 'Test alarm 2 - dusuk pil', true, 41.01, 28.98, 'Adres 1', 'MANUAL', (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT);"
try {
    docker exec beaver-iot-postgresql psql -U postgres -d postgres -c $sql 2>$null
    Write-Host "Seed: 2 rows inserted into t_alarm."
} catch {
    Write-Host "Seed failed (t_alarm or device may not exist). Continue anyway."
}

# 5) Time range
$now = [long](([DateTimeOffset]::Now).ToUnixTimeMilliseconds())
$start = $now - (7 * 24 * 3600 * 1000)
$end = $now + (24 * 3600 * 1000)

# 6) POST /alarms/search
$searchBody = @{ page_number=1; page_size=10; start_timestamp=$start; end_timestamp=$end } | ConvertTo-Json
try {
    $sr = Invoke-RestMethod -Uri "$Api/alarms/search" -Method Post -Headers $h -Body $searchBody
    $cnt = if ($sr.data.content) { $sr.data.content.Count } else { 0 }
    $total = if ($sr.data.total) { $sr.data.total } else { 0 }
    Write-Host "POST /alarms/search -> 200, content count=$cnt, total=$total"
    if ($cnt -ge 1) { Write-Host "  First: $($sr.data.content[0].alarm_content)" }
} catch {
    Write-Host "POST /alarms/search -> $($_.Exception.Response.StatusCode.value__) or error: $($_.Exception.Message)"
}

# 7) GET /alarms/export
try {
    $q = "start_timestamp=$start&end_timestamp=$end"
    $export = Invoke-WebRequest -Uri "$Api/alarms/export?$q" -Method Get -Headers @{ "Authorization" = "Bearer $token" } -OutFile "$env:TEMP\alarms_export.csv" -PassThru
    Write-Host "GET /alarms/export -> $($export.StatusCode), size=$($export.RawContentLength)"
    if (Test-Path "$env:TEMP\alarms_export.csv") { Get-Content "$env:TEMP\alarms_export.csv" -TotalCount 5 }
} catch {
    Write-Host "GET /alarms/export -> $($_.Exception.Response.StatusCode.value__) or error"
}

# 8) POST /alarms/claim
$claimBody = "{`"device_id`":$deviceId}"
try {
    Invoke-RestMethod -Uri "$Api/alarms/claim" -Method Post -Headers $h -Body $claimBody | Out-Null
    Write-Host "POST /alarms/claim -> 200"
} catch {
    Write-Host "POST /alarms/claim -> $($_.Exception.Response.StatusCode.value__) or error"
}

Write-Host "Done. See TEST_PLAN_ALARM_1_BACKEND_API.md for full expectations."
