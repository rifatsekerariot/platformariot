# Smoke-test ChirpStack webhook. Run after stack is up (monolith/chirpstack compose).
# Usage: .\test-webhook.ps1 [-BaseUrl "http://localhost:8080"] [-TenantId "your-tenant-uuid"]

param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$TenantId = "default"
)

$ErrorActionPreference = "Stop"
$Webhook = "$BaseUrl/public/integration/chirpstack/webhook"
$UpJson = @'
{"deduplicationId":"3ac7e3c4-4401-4b8d-9386-a5c902f9202d","time":"2022-07-18T09:34:15.775023242Z","deviceInfo":{"tenantId":"52f14cd4-c6f1-4fbd-8f87-4025e1d49242","tenantName":"ChirpStack","applicationId":"17c82e96-be03-4f38-aef3-f83d48582d97","applicationName":"Test application","deviceProfileId":"14855bf7-d10d-4aee-b618-ebfcb64dc7ad","deviceProfileName":"Test device-profile","deviceName":"Test device","devEui":"0101010101010101"},"devAddr":"00189440","dr":1,"fPort":1,"data":"qg==","rxInfo":[{"gatewayId":"0016c001f153a14c","uplinkId":4217106255,"rssi":-36,"snr":10.5}]}
'@

Write-Host "1. Ping webhook (no tenant) -> expect 400"
try {
    $null = Invoke-WebRequest -Uri "${Webhook}?event=up" -Method POST -Body "{}" -ContentType "application/json" -UseBasicParsing
    Write-Host "   Unexpected success (expected 400)"
} catch {
    $code = 0
    try { $code = [int]$_.Exception.Response.StatusCode } catch { }
    if ($code -eq 400) { Write-Host "   Got 400 OK" } else { Write-Host "   Status: $code (expected 400)" }
}

Write-Host "2. POST uplink with X-Tenant-Id -> expect 200"
$headers = @{ "X-Tenant-Id" = $TenantId }
try {
    $r = Invoke-WebRequest -Uri "${Webhook}?event=up" -Method POST -Body $UpJson -ContentType "application/json" -Headers $headers -UseBasicParsing
    Write-Host "   Status: $($r.StatusCode) Body: $($r.Content)"
} catch {
    Write-Host "   Error: $($_.Exception.Message)"
    if ($_.Exception.Response) { $_.Exception.Response | Format-List -Force }
}

Write-Host "3. POST join with X-Tenant-Id -> expect 200"
$JoinJson = '{"deduplicationId":"c9dbe358-2578-4fb7-b295-66b44edc45a6","time":"2022-07-18T09:33:28Z","deviceInfo":{"devEui":"0101010101010101","deviceName":"Test device"},"devAddr":"00189440"}'
try {
    $r = Invoke-WebRequest -Uri "${Webhook}?event=join" -Method POST -Body $JoinJson -ContentType "application/json" -Headers $headers -UseBasicParsing
    Write-Host "   Status: $($r.StatusCode) Body: $($r.Content)"
} catch {
    Write-Host "   Error: $($_.Exception.Message)"
}

Write-Host "Done. Check Beaver container logs for ChirpStack webhook messages."
