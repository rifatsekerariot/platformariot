#!/bin/bash
# Detaylı sunucu kontrol script'i
# Kullanım: ssh ubuntu@188.132.211.171 'bash -s' < check_server_detailed.sh

CONTAINER_ID="71e0ba18d60d"

echo "=========================================="
echo "DETAYLI SERVER KONTROLÜ"
echo "=========================================="
echo ""

# 1. Image bilgileri
echo "=== 1. DOCKER IMAGE BİLGİLERİ ==="
docker images ghcr.io/rifatsekerariot/beaver-iot:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}\t{{.Size}}"
echo ""
docker inspect ghcr.io/rifatsekerariot/beaver-iot:latest | grep -E "Created|Id|RepoDigests" | head -10
echo ""

# 2. Container bilgileri
echo "=== 2. CONTAINER BİLGİLERİ ==="
docker inspect $CONTAINER_ID | grep -E "Image|Created|StartedAt|Status" | head -10
echo ""

# 3. JavaScript dosyalarını kontrol et
echo "=== 3. JAVASCRIPT DOSYALARI DETAYLI ==="
echo "--- Tüm JS dosyaları (tarih ve boyut) ---"
docker exec $CONTAINER_ID ls -lht /web/assets/js/ | head -30
echo ""

echo "--- index.js dosyasını ara ---"
docker exec $CONTAINER_ID find /web/assets/js -name "index-*.js" -ls
echo ""

echo "--- index.js içeriğinde debug log'ları ara (ilk 100 satır) ---"
INDEX_FILE=$(docker exec $CONTAINER_ID find /web/assets/js -name "index-*.js" | head -1)
if [ -n "$INDEX_FILE" ]; then
    echo "Dosya: $INDEX_FILE"
    docker exec $CONTAINER_ID head -100 "$INDEX_FILE" | grep -i "\[ReportPage\]" | head -10 || echo "Debug log'ları bulunamadı (minify edilmiş olabilir)"
    echo ""
    echo "--- Dosya boyutu ve satır sayısı ---"
    docker exec $CONTAINER_ID wc -l "$INDEX_FILE"
    docker exec $CONTAINER_ID ls -lh "$INDEX_FILE"
else
    echo "index.js dosyası bulunamadı!"
fi
echo ""

# 4. index.html'deki script hash'lerini kontrol et
echo "=== 4. INDEX.HTML SCRIPT HASH'LERİ ==="
docker exec $CONTAINER_ID grep -o 'src="/assets/js/[^"]*"' /web/index.html
docker exec $CONTAINER_ID grep -o 'href="/assets/js/[^"]*"' /web/index.html
echo ""

# 5. Gerçek dosyalarla karşılaştır
echo "=== 5. DOSYA KARŞILAŞTIRMA ==="
echo "index.html'deki hash:"
HTML_HASH=$(docker exec $CONTAINER_ID grep -o 'src="/assets/js/index-[^"]*"' /web/index.html | sed 's/.*index-\([^"]*\)\.js.*/\1/')
echo "HTML'deki hash: $HTML_HASH"
echo ""
echo "Gerçek dosya:"
REAL_FILE=$(docker exec $CONTAINER_ID ls /web/assets/js/index-*.js 2>/dev/null | head -1)
if [ -n "$REAL_FILE" ]; then
    REAL_HASH=$(echo "$REAL_FILE" | sed 's/.*index-\([^"]*\)\.js.*/\1/')
    echo "Gerçek hash: $REAL_HASH"
    if [ "$HTML_HASH" = "$REAL_HASH" ]; then
        echo "✅ Hash'ler eşleşiyor"
    else
        echo "❌ Hash'ler eşleşmiyor!"
    fi
else
    echo "❌ index.js dosyası bulunamadı!"
fi
echo ""

# 6. Debug log'larını minify edilmiş dosyada ara
echo "=== 6. DEBUG LOG'LARI KONTROLÜ (Minify edilmiş) ==="
if [ -n "$INDEX_FILE" ]; then
    echo "ReportPage string'ini ara:"
    docker exec $CONTAINER_ID grep -o "ReportPage" "$INDEX_FILE" | wc -l
    echo "FORM string'ini ara:"
    docker exec $CONTAINER_ID grep -o "FORM" "$INDEX_FILE" | wc -l
    echo "API string'ini ara:"
    docker exec $CONTAINER_ID grep -o "API" "$INDEX_FILE" | wc -l
    echo "SELECT string'ini ara:"
    docker exec $CONTAINER_ID grep -o "SELECT" "$INDEX_FILE" | wc -l
    echo ""
    echo "--- Debug log pattern'lerini ara ---"
    docker exec $CONTAINER_ID grep -o "\[ReportPage\]" "$INDEX_FILE" | head -5 || echo "Pattern bulunamadı"
fi
echo ""

# 7. Container'ın environment variables
echo "=== 7. ENVIRONMENT VARIABLES ==="
docker exec $CONTAINER_ID env | grep -E "BEAVER|API|NODE|NPM" | sort
echo ""

# 8. Son build bilgileri
echo "=== 8. BUILD BİLGİLERİ ==="
echo "Image oluşturulma tarihi:"
docker inspect ghcr.io/rifatsekerariot/beaver-iot:latest | grep Created
echo ""
echo "Container oluşturulma tarihi:"
docker inspect $CONTAINER_ID | grep Created
echo ""

# 9. Network ve port kontrolü
echo "=== 9. NETWORK VE PORT KONTROLÜ ==="
docker port $CONTAINER_ID
echo ""

# 10. Process'ler
echo "=== 10. CONTAINER İÇİNDEKİ PROCESS'LER ==="
docker exec $CONTAINER_ID ps aux | head -10
echo ""

echo "=========================================="
echo "KONTROL TAMAMLANDI"
echo "=========================================="
