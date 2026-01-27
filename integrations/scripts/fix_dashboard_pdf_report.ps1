# Dashboard PDF Report fix - Pull latest image and restart container via SSH
# Kullanim: .\scripts\fix_dashboard_pdf_report.ps1
$server = "188.132.211.171"
$user = "ubuntu"
$password = "Adana4455*"
$hostkey = "SHA256:bMWeYqH5x4CAN2vbpaAVcbTQuEmfMSJyEgAlwUgI9GM"
$image = "ghcr.io/rifatsekerariot/beaver-iot:latest"

Write-Host "=== Dashboard PDF Report Fix ===" -ForegroundColor Cyan
Write-Host "Sunucuya baglaniyor..." -ForegroundColor Yellow

$cmd = "sudo docker pull $image; CID=`$(sudo docker ps --filter name=beaver-iot -q 2>/dev/null | head -1); [ -n \"`$CID\" ] && sudo docker stop `$CID && sudo docker rm `$CID || true; sudo docker run -d --name beaver-iot -p 9080:80 -p 1883:1883 -p 8083:8083 $image; sleep 6; sudo docker ps --filter name=beaver-iot"
plink -ssh "${user}@${server}" -pw $password -batch -hostkey $hostkey $cmd
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nTest: http://${server}:9080/report" -ForegroundColor Green
Write-Host "Dashboard sec, tarih araligi sec, Generate PDF tikla." -ForegroundColor Gray
