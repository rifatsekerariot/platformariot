# Alarm service'i rifatsekerariot/beaver-iot fork'una ekler.
# Kullanim: .\push-alarm-to-beaver-iot-fork.ps1
#   -BeaverIotMain "c:\Projeler\beaver-iot-main"
#   -ForkPath "c:\Projeler\beaver-iot"   # clone edilecek/mevcut fork; yoksa $env:TEMP\beaver-iot-fork
# Push: script commit yapar; "git push origin main" sizin calistirmaniz gerekir (ForkPath icinde).

param(
    [string]$BeaverIotMain = "c:\Projeler\beaver-iot-main",
    [string]$ForkPath = ""
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $BeaverIotMain)) { Write-Error "BeaverIotMain yok: $BeaverIotMain"; exit 1 }

if (-not $ForkPath) { $ForkPath = Join-Path $env:TEMP "beaver-iot-fork" }
$ForkRepo = "https://github.com/rifatsekerariot/beaver-iot.git"

if (-not (Test-Path $ForkPath)) {
    Write-Host "Clone: $ForkRepo -> $ForkPath"
    git clone --depth 1 -b main $ForkRepo $ForkPath
} else {
    Write-Host "Mevcut fork: $ForkPath (git pull)"
    Push-Location $ForkPath; git pull origin main 2>$null; Pop-Location
}

# 1) services/alarm
$dstAlarm = Join-Path $ForkPath "services\alarm"
if (Test-Path $dstAlarm) { Remove-Item $dstAlarm -Recurse -Force }
Copy-Item -Path (Join-Path $BeaverIotMain "services\alarm") -Destination (Join-Path $ForkPath "services\alarm") -Recurse
Write-Host "Kopyalandi: services/alarm"

# 2) services/pom.xml: <module>alarm</module> ekle
$spom = Join-Path $ForkPath "services\pom.xml"
$spomXml = Get-Content $spom -Raw
if ($spomXml -notmatch "<module>alarm</module>") {
    $spomXml = $spomXml -replace "(\s*)<module>canvas</module>", "`$1<module>canvas</module>`n`$1<module>alarm</module>"
    Set-Content $spom -Value $spomXml -NoNewline
    Write-Host "Guncellendi: services/pom.xml <module>alarm</module>"
}

# 3) application-standard pom: alarm-service dependency
$apom = Join-Path $ForkPath "application\application-standard\pom.xml"
$apomXml = Get-Content $apom -Raw
if ($apomXml -notmatch "alarm-service") {
    $block = @"
        <dependency>
            <groupId>com.milesight.beaveriot</groupId>
            <artifactId>alarm-service</artifactId>
            <version>`${project.version}</version>
        </dependency>

        "@
    $apomXml = $apomXml -replace "(<artifactId>canvas-service</artifactId>[\s\S]*?</dependency>)\s*(<dependency>[\s\S]*?<artifactId>authentication-service</artifactId>)", "`$1`n$block`$2"
    Set-Content $apom -Value $apomXml -NoNewline
    Write-Host "Guncellendi: application-standard/pom.xml alarm-service"
}

# 4) db/postgres/sql/v1.4.0/alarm.sql
$v140 = Join-Path $ForkPath "application\application-standard\src\main\resources\db\postgres\sql\v1.4.0"
if (-not (Test-Path $v140)) { New-Item -ItemType Directory -Path $v140 -Force | Out-Null }
Copy-Item (Join-Path $BeaverIotMain "application\application-standard\src\main\resources\db\postgres\sql\v1.4.0\alarm.sql") $v140 -Force
Write-Host "Kopyalandi: db/postgres/sql/v1.4.0/alarm.sql"

# 5) changelog.yaml: v1.4.0 includeAll
$changelog = Join-Path $ForkPath "application\application-standard\src\main\resources\db\postgres\changelog.yaml"
$cl = Get-Content $changelog -Raw
if ($cl -notmatch "sql/v1.4.0") {
    $add = "`n  - includeAll:`n      path: sql/v1.4.0`n      relativeToChangelogFile: true"
    $cl = $cl -replace "(path: sql/v1\.3\.1[\s\S]*?relativeToChangelogFile: true)", "`$1$add"
    Set-Content $changelog -Value $cl -NoNewline
    Write-Host "Guncellendi: changelog.yaml v1.4.0"
}

# 6) git add, commit
Push-Location $ForkPath
git add services/alarm services/pom.xml "application/application-standard/pom.xml" "application/application-standard/src/main/resources/db/postgres/sql/v1.4.0/alarm.sql" "application/application-standard/src/main/resources/db/postgres/changelog.yaml" 2>$null
git add -A
$st = git status --short
if ($st) {
    git commit -m "feat(alarm): alarm-service, t_alarm, /alarms search export claim, PostgreSQL v1.4.0"
    Write-Host "Commit yapildi. Simdi: cd $ForkPath && git push origin main"
} else {
    Write-Host "Degisiklik yok veya zaten commit edilmis."
}
Pop-Location
Write-Host "Bitti. Fork: $ForkPath"
