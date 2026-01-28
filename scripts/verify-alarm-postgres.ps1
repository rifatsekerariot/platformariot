# Alarm 500 diagnostik: Veritabani (DB_TYPE, t_alarm) ve /alarms/search kontrolu.
# Kullanim: stack (examples/stack.yaml) ayaktayken: .\scripts\verify-alarm-postgres.ps1
# Opsiyonel: -Base "http://localhost:9080" -PostgresContainer beaver-iot-postgresql -MonolithContainer beaver-iot

param(
    [string]$Base = "http://localhost:9080",
    [string]$PostgresContainer = "beaver-iot-postgresql",
    [string]$MonolithContainer = "beaver-iot"
)

$Api = "$Base/api/v1"
Write-Host "=== Alarm 500 diagnostic (alarms/search) ===" -ForegroundColor Cyan
Write-Host ""

# 1) Hangi veritabani kullaniliyor? (Monolith container env)
Write-Host "1) DB_TYPE ve SPRING_DATASOURCE (monolith container: $MonolithContainer):" -ForegroundColor Yellow
try {
    $envOut = docker exec $MonolithContainer env 2>$null
    $dbType = ($envOut | Select-String "DB_TYPE=") -replace "DB_TYPE=",""
    $dsUrl  = ($envOut | Select-String "SPRING_DATASOURCE_URL=") -replace "SPRING_DATASOURCE_URL=",""
    if ($dbType) { Write-Host "   DB_TYPE= $dbType" } else { Write-Host "   DB_TYPE= (ayarlanmamis; varsayilan H2 - t_alarm YOK, 500 olur)" -ForegroundColor Red }
    if ($dsUrl)  { Write-Host "   SPRING_DATASOURCE_URL= $($dsUrl.Substring(0, [Math]::Min(60, $dsUrl.Length)))..." } else { Write-Host "   SPRING_DATASOURCE_URL= (ayarlanmamis)" -ForegroundColor Red }
    if (-not $dbType -or $dbType -eq "h2") {
        Write-Host "   UYARI: PostgreSQL kullanmak icin DB_TYPE=postgres ve SPRING_DATASOURCE_* gerekli. H2'de t_alarm yok." -ForegroundColor Red
    }
} catch {
    Write-Host "   Container env alinamadi: $($_.Exception.Message). Monolith ayakta mi?" -ForegroundColor Red
}
Write-Host ""

# 2) t_alarm tablosu PostgreSQL'de var mi?
Write-Host "2) t_alarm tablosu (PostgreSQL container: $PostgresContainer):" -ForegroundColor Yellow
try {
    $r = docker exec $PostgresContainer psql -U postgres -d postgres -t -c "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='t_alarm';" 2>$null
    if ($r -and ($r.Trim() -eq "1")) {
        $cnt = docker exec $PostgresContainer psql -U postgres -d postgres -t -c "SELECT count(*) FROM t_alarm;" 2>$null
        Write-Host "   t_alarm MEVCUT. Satir sayisi: $($cnt.Trim())" -ForegroundColor Green
    } else {
        Write-Host "   t_alarm BULUNAMADI. Liquibase v1.4.0 (alarm.sql) calismamis veya DB_TYPE!=postgres." -ForegroundColor Red
        Write-Host "   Cozum: DB_TYPE=postgres ile monolith'i yeniden baslatin; ilk acilista Liquibase t_alarm'i olusturur." -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Postgres kontrol edilemedi: $($_.Exception.Message). Container ayakta mi?" -ForegroundColor Red
}
Write-Host ""

# 3) POST /alarms/search - auth yok (401 beklenir; 500 ise backend/veritabani hatasi)
Write-Host "3) POST $Api/alarms/search (auth yok):" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$Api/alarms/search" -Method Post -ContentType "application/json" -Body "{}" -UseBasicParsing -ErrorAction Stop
    Write-Host "   HTTP $($resp.StatusCode) (401 beklenir; 200 ise auth devre disi)" -ForegroundColor $(if ($resp.StatusCode -eq 401) { "Green" } else { "Yellow" })
} catch {
    $code = $null; if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    if ($code -eq 401) { Write-Host "   HTTP 401 - Endpoint var, auth gerekli (normal)" -ForegroundColor Green }
    elseif ($code -eq 500) {
        Write-Host "   HTTP 500 - Sunucu hatasi." -ForegroundColor Red
        Write-Host "   Olası nedenler: t_alarm yok (H2/eksik migration), 'tenantId is not provided' (TenantContext), veya baska exception. Monolith log: docker logs $MonolithContainer 2>&1 | tail -100" -ForegroundColor Yellow
    }
    else { Write-Host "   HTTP $code - $($_.Exception.Message)" -ForegroundColor Red }
}
Write-Host ""

# 4) Ozet
Write-Host "=== Ozet ===" -ForegroundColor Cyan
Write-Host "- PostgreSQL kullanimi: DB_TYPE=postgres + SPRING_DATASOURCE_* (orn. examples/stack.yaml)."
Write-Host "- t_alarm: db/postgres/sql/v1.4.0/alarm.sql, Liquibase ile ilk acilista olusur."
Write-Host "- 500 'tenantId is not provided': giris yapilmis olmali; JWT tenant icermeli."
Write-Host "- Monolith log: docker logs $MonolithContainer 2>&1 | Select-Object -Last 80"
