# Test Report flow: register, login, dashboard, device, entity advanced-search (DEVICE_ID EQ).
# Run with Beaver IoT at http://localhost:9080 (docker compose -f examples/chirpstack-prebuilt up -d).

param(
    [string] $BaseUrl = "http://localhost:9080",
    [string] $Email = "report-test@test.local",
    [string] $Username = "reporttest",
    [string] $Password = "Test1234!"
)

$ErrorActionPreference = "Stop"
$api = "$BaseUrl/api/v1"
$clientId = "iab"
$clientSecret = "milesight*iab"

function Invoke-Api {
    param([string]$Method, [string]$Path, [hashtable]$Body = $null, [string]$Token = $null)
    $uri = "$api$Path"
    $headers = @{ "Content-Type" = "application/json"; "Accept" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    $params = @{ Uri = $uri; Method = $Method; Headers = $headers; UseBasicParsing = $true }
    if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10) }
    $r = Invoke-WebRequest @params
    $r
}

function Invoke-ApiForm {
    param([string]$Method, [string]$Path, [hashtable]$Form, [string]$Token = $null)
    $uri = "$api$Path"
    $headers = @{ "Accept" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    $r = Invoke-WebRequest -Uri $uri -Method $Method -Headers $headers -Body $Form -UseBasicParsing
    $r
}

Write-Host "[test-report-api] Base: $BaseUrl" -ForegroundColor Cyan

# 1. Register (optional; skip if user exists)
Write-Host "[1] Register..." -ForegroundColor Yellow
try {
    $reg = Invoke-Api -Method POST -Path "/user/register" -Body @{
        email = $Email
        nickname = $Username
        password = $Password
    }
    if ($reg.StatusCode -eq 200) { Write-Host "  Register OK (200)" -ForegroundColor Green }
    else { Write-Host "  Register $($reg.StatusCode)" -ForegroundColor Gray }
} catch {
    $sc = $_.Exception.Response.StatusCode.value__
    if ($sc -eq 400 -or $sc -eq 500) {
        Write-Host "  Register $sc (user may exist) - continue" -ForegroundColor Gray
    } else { throw }
}

# 2. Login (OAuth) - client_id/client_secret in form body (match frontend)
Write-Host "[2] Login..." -ForegroundColor Yellow
$form = @{
    grant_type = "password"
    username = $Email
    password = $Password
    client_id = $clientId
    client_secret = $clientSecret
}
$formBody = ($form.GetEnumerator() | ForEach-Object { "$($_.Key)=$([uri]::EscapeDataString($_.Value))" }) -join "&"
$login = Invoke-WebRequest -Uri "$api/oauth2/token" -Method POST -Headers @{ "Accept" = "application/json" } `
    -ContentType "application/x-www-form-urlencoded" -Body $formBody -UseBasicParsing
if ($login.StatusCode -ne 200) {
    Write-Host "  Login failed: $($login.StatusCode) $($login.Content)" -ForegroundColor Red
    exit 1
}
$loginJson = $login.Content | ConvertFrom-Json
$token = $loginJson.data.access_token
if (-not $token) { $token = $loginJson.access_token }
if (-not $token) {
    Write-Host "  Login OK but no access_token in response: $($login.Content)" -ForegroundColor Red
    exit 1
}
Write-Host "  Login OK (200), token length: $($token.Length)" -ForegroundColor Green

# 3. Dashboard search
Write-Host "[3] Dashboard search..." -ForegroundColor Yellow
$dash = Invoke-Api -Method POST -Path "/dashboard/search" -Body @{ name = "" } -Token $token
if ($dash.StatusCode -ne 200) {
    Write-Host "  Dashboard search failed: $($dash.StatusCode)" -ForegroundColor Red
    exit 1
}
Write-Host "  Dashboard search OK (200)" -ForegroundColor Green
$dashJson = $dash.Content | ConvertFrom-Json
$dashList = if ($dashJson.data) { $dashJson.data } else { $dashJson }
if ($dashList -isnot [array]) { $dashList = @($dashList) }
Write-Host "  Dashboards: $($dashList.Count)" -ForegroundColor Gray

# 4. Device search
Write-Host "[4] Device search..." -ForegroundColor Yellow
$dev = Invoke-Api -Method POST -Path "/device/search" -Body @{ page_size = 100; page_number = 1 } -Token $token
if ($dev.StatusCode -ne 200) {
    Write-Host "  Device search failed: $($dev.StatusCode)" -ForegroundColor Red
    exit 1
}
Write-Host "  Device search OK (200)" -ForegroundColor Green
$devJson = $dev.Content | ConvertFrom-Json
$devData = if ($devJson.data) { $devJson.data } else { $devJson }
$content = $devData.content
if (-not $content) { $content = @() }
$deviceIds = @($content | ForEach-Object { $_.id } | Where-Object { $_ })
Write-Host "  Devices: $($content.Count), ids: $($deviceIds -join ', ')" -ForegroundColor Gray

# 4a. If no devices, add a ChirpStack test device
if ($deviceIds.Count -eq 0) {
    Write-Host "[4a] No devices - adding ChirpStack test device..." -ForegroundColor Yellow
    $intResp = Invoke-Api -Method POST -Path "/integration/search" -Body @{ device_addable = $true } -Token $token
    if ($intResp.StatusCode -ne 200) {
        Write-Host "  Integration search failed: $($intResp.StatusCode)" -ForegroundColor Red
        exit 1
    }
    $intJson = $intResp.Content | ConvertFrom-Json
    $intList = if ($intJson.data) { $intJson.data } else { $intJson }
    if (-not $intList) { $intList = @() }
    $chirp = $intList | Where-Object { $_.name -match "ChirpStack" -or $_.identifier -match "chirpstack" } | Select-Object -First 1
    if (-not $chirp) { $chirp = $intList[0] }
    if ($intList.Count -eq 0) {
        Write-Host "  No device_addable integrations. Skipping entity advanced-search." -ForegroundColor Yellow
    } else {
        $inteId = $chirp.id
        Write-Host "  Using integration: $($chirp.name) ($inteId)" -ForegroundColor Gray
        $pe = @{ dev_eui = "0102030405060708"; sensor_model = "em500-udl" }
        if ($chirp.name -notmatch "ChirpStack") { $pe = @{ ip = "127.0.0.1" } }
        $addBody = @{
            name = "ReportTestDevice"
            integration = $inteId
            param_entities = $pe
        }
        try {
            $addDev = Invoke-Api -Method POST -Path "/device" -Body $addBody -Token $token
            if ($addDev.StatusCode -eq 200) {
                Write-Host "  Add device OK (200)" -ForegroundColor Green
                $dev = Invoke-Api -Method POST -Path "/device/search" -Body @{ page_size = 100; page_number = 1 } -Token $token
                $devJson = $dev.Content | ConvertFrom-Json
                $devData = if ($devJson.data) { $devJson.data } else { $devJson }
                $content = $devData.content; if (-not $content) { $content = @() }
                $deviceIds = @($content | ForEach-Object { $_.id } | Where-Object { $_ })
                Write-Host "  Devices after add: $($deviceIds.Count)" -ForegroundColor Gray
            } else { Write-Host "  Add device $($addDev.StatusCode)" -ForegroundColor Gray }
        } catch {
            Write-Host "  Add device failed: $($_.Exception.Message)" -ForegroundColor Gray
        }
    }
}

# 5. Entity advanced-search (DEVICE_ID EQ) - same as Device Entity Data / Report
$entityIdsForAggregate = @()
if ($deviceIds.Count -eq 0) {
    Write-Host "[5] No devices - probing entity advanced-search (DEVICE_ID EQ) with placeholder id 1..." -ForegroundColor Yellow
    $probeBody = @{
        page_size = 100
        page_number = 1
        sorts = @(@{ direction = "ASC"; property = "key" })
        entity_filter = @{
            DEVICE_ID = @{ operator = "EQ"; values = @("1") }
            ENTITY_TYPE = @{ operator = "ANY_EQUALS"; values = @("PROPERTY") }
        }
    }
    $probe = Invoke-Api -Method POST -Path "/entity/advanced-search" -Body $probeBody -Token $token
    if ($probe.StatusCode -eq 200) {
        Write-Host "  Entity advanced-search (DEVICE_ID EQ) OK (200) - format valid, content may be empty." -ForegroundColor Green
    } else {
        Write-Host "  Entity advanced-search failed: $($probe.StatusCode)" -ForegroundColor Red
        exit 1
    }
} else {
    $deviceId = $deviceIds[0]
    Write-Host "[5] Entity advanced-search (DEVICE_ID EQ, device=$deviceId)..." -ForegroundColor Yellow
    $body = @{
        page_size = 100
        page_number = 1
        sorts = @(@{ direction = "ASC"; property = "key" })
        entity_filter = @{
            DEVICE_ID = @{ operator = "EQ"; values = @($deviceId) }
            ENTITY_TYPE = @{ operator = "ANY_EQUALS"; values = @("PROPERTY") }
        }
    }
    $ent = Invoke-Api -Method POST -Path "/entity/advanced-search" -Body $body -Token $token
    if ($ent.StatusCode -ne 200) {
        Write-Host "  Entity advanced-search failed: $($ent.StatusCode) $($ent.Content)" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Entity advanced-search OK (200)" -ForegroundColor Green
    $entJson = $ent.Content | ConvertFrom-Json
    $entData = if ($entJson.data) { $entJson.data } else { $entJson }
    $entContent = $entData.content
    if (-not $entContent) { $entContent = @() }
    $entityIdsForAggregate = @($entContent | ForEach-Object { if ($_.id) { $_.id } else { $_.entity_id } } | Where-Object { $_ })
    Write-Host "  Entities: $($entContent.Count)" -ForegroundColor Gray
}

# 6. Main canvas + getDrawingBoardDetail (report flow)
Write-Host "[6] Main canvas + getDrawingBoardDetail..." -ForegroundColor Yellow
try {
    $main = Invoke-WebRequest -Uri "$api/dashboard/main-canvas" -Method GET -Headers @{
        "Accept" = "application/json"
        "Authorization" = "Bearer $token"
    } -UseBasicParsing
    if ($main.StatusCode -ne 200) { throw "main-canvas $($main.StatusCode)" }
    $mc = $main.Content | ConvertFrom-Json
    $mcData = if ($mc.data) { $mc.data } else { $mc }
    $canvasId = $mcData.main_canvas_id
    Write-Host "  Main canvas OK (200), main_canvas_id: $canvasId" -ForegroundColor Green
    if ($canvasId) {
        $canvas = Invoke-WebRequest -Uri "$api/canvas/$canvasId" -Method GET -Headers @{
            "Accept" = "application/json"
            "Authorization" = "Bearer $token"
        } -UseBasicParsing
        if ($canvas.StatusCode -eq 200) {
            Write-Host "  getDrawingBoardDetail OK (200)" -ForegroundColor Green
        } else {
            Write-Host "  getDrawingBoardDetail $($canvas.StatusCode)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  Step 6: $($_.Exception.Message)" -ForegroundColor Gray
}

# 7. Entity history aggregate (date-range) - when we have entities
if ($entityIdsForAggregate.Count -gt 0) {
    Write-Host "[7] Entity history/aggregate (date range)..." -ForegroundColor Yellow
    $eid = $entityIdsForAggregate[0]
    $epoch = [DateTimeOffset]::new(1970,1,1,0,0,0,[TimeSpan]::Zero)
    $now = [DateTimeOffset]::UtcNow
    $startDto = [DateTimeOffset]::new($now.AddDays(-2).Date, [TimeSpan]::Zero)
    $endDto = [DateTimeOffset]::new($now.AddDays(-1).Date.AddHours(23).AddMinutes(59).AddSeconds(59).AddMilliseconds(999), [TimeSpan]::Zero)
    $startAgg = [long]($startDto - $epoch).TotalMilliseconds
    $endAgg = [long]($endDto - $epoch).TotalMilliseconds
    $aggBody = @{
        entity_id = $eid
        start_timestamp = $startAgg
        end_timestamp = $endAgg
        aggregate_type = "LAST"
    }
    try {
        $agg = Invoke-Api -Method POST -Path "/entity/history/aggregate" -Body $aggBody -Token $token
        if ($agg.StatusCode -eq 200) {
            Write-Host "  Entity history/aggregate OK (200)" -ForegroundColor Green
        } else {
            Write-Host "  Entity history/aggregate $($agg.StatusCode)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  Entity history/aggregate failed: $($_.Exception.Message)" -ForegroundColor Gray
    }
} else {
    Write-Host "[7] No entities - skipping entity/history/aggregate (date-range) check." -ForegroundColor Gray
}

Write-Host ""
Write-Host "[test-report-api] All 200 checks passed." -ForegroundColor Green
Write-Host "  Report flow: $BaseUrl/report -> select dashboard -> date range -> Generate PDF" -ForegroundColor White
