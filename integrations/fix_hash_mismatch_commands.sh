#!/bin/bash
# Hash eşleşmeme sorununu düzelt - Tüm komutlar
# Bu script'i Cursor Remote SSH üzerinden çalıştırın

set -e

CONTAINER_ID="71e0ba18d60d"
IMAGE_NAME="ghcr.io/rifatsekerariot/beaver-iot:latest"

echo "=========================================="
echo "HASH EŞLEŞMEME SORUNU DÜZELTME"
echo "=========================================="
echo ""

# 1. Mevcut durumu kontrol et
echo "=== 1. MEVCUT DURUM ==="
echo "Container ID: $CONTAINER_ID"
docker ps -a | grep $CONTAINER_ID || echo "Container bulunamadı"
echo ""

# 2. Image'ı güncelle
echo "=== 2. IMAGE GÜNCELLEME ==="
docker pull $IMAGE_NAME
echo "Image güncellendi: $(docker images $IMAGE_NAME --format '{{.ID}}' | head -1)"
echo ""

# 3. Container'ı durdur
echo "=== 3. CONTAINER DURDURMA ==="
if docker ps | grep -q $CONTAINER_ID; then
    docker stop $CONTAINER_ID
    echo "Container durduruldu"
else
    echo "Container zaten durmuş"
fi
echo ""

# 4. Container'ı sil
echo "=== 4. CONTAINER SİLME ==="
if docker ps -a | grep -q $CONTAINER_ID; then
    docker rm $CONTAINER_ID
    echo "Container silindi"
else
    echo "Container zaten silinmiş"
fi
echo ""

# 5. Yeni container başlat
echo "=== 5. YENİ CONTAINER BAŞLATMA ==="
# Önce docker-compose kontrolü
if [ -f docker-compose.yml ] || [ -f docker-compose.yaml ]; then
    echo "docker-compose kullanılıyor..."
    docker-compose up -d
else
    echo "docker-compose bulunamadı, manuel başlatılıyor..."
    docker run -d \
        --name beaver-iot \
        -p 9080:80 \
        -p 1883:1883 \
        -p 8083:8083 \
        $IMAGE_NAME
    echo "Container başlatıldı"
fi
echo ""

# 6. Yeni container ID'yi bul ve kontrol et
echo "=== 6. YENİ CONTAINER KONTROLÜ ==="
sleep 5  # Container'ın tamamen başlaması için bekle
NEW_CONTAINER_ID=$(docker ps | grep beaver-iot | awk '{print $1}' | head -1)

if [ -z "$NEW_CONTAINER_ID" ]; then
    echo "❌ Yeni container bulunamadı!"
    exit 1
fi

echo "Yeni Container ID: $NEW_CONTAINER_ID"
echo "Container durumu:"
docker ps | grep $NEW_CONTAINER_ID
echo ""

# 7. Hash'leri kontrol et
echo "=== 7. HASH KONTROLÜ ==="
HTML_HASH=$(docker exec $NEW_CONTAINER_ID grep -o 'src="/assets/js/index-[^"]*"' /web/index.html 2>/dev/null | sed 's/.*index-\([^"]*\)\.js.*/\1/' | head -1)
REAL_FILE=$(docker exec $NEW_CONTAINER_ID ls /web/assets/js/index-*.js 2>/dev/null | head -1)

if [ -z "$REAL_FILE" ]; then
    echo "❌ index.js dosyası bulunamadı!"
    exit 1
fi

REAL_HASH=$(echo "$REAL_FILE" | sed 's/.*index-\([^"]*\)\.js.*/\1/')

echo "HTML'deki hash: $HTML_HASH"
echo "Gerçek hash: $REAL_HASH"
echo ""

if [ "$HTML_HASH" = "$REAL_HASH" ]; then
    echo "✅ Hash'ler eşleşiyor! Sorun çözüldü."
else
    echo "❌ Hash'ler hala eşleşmiyor!"
    echo ""
    echo "index.html içeriği:"
    docker exec $NEW_CONTAINER_ID grep -o 'src="/assets/js/index-[^"]*"' /web/index.html
    echo ""
    echo "Mevcut index.js dosyaları:"
    docker exec $NEW_CONTAINER_ID ls /web/assets/js/index-*.js | head -5
    exit 1
fi
echo ""

# 8. Container log'larını kontrol et
echo "=== 8. CONTAINER LOG KONTROLÜ ==="
echo "Son 10 satır log:"
docker logs --tail 10 $NEW_CONTAINER_ID
echo ""

echo "=========================================="
echo "✅ DÜZELTME TAMAMLANDI"
echo "=========================================="
echo ""
echo "Container ID: $NEW_CONTAINER_ID"
echo "Hash'ler eşleşiyor: ✅"
echo ""
echo "Test için:"
echo "1. Browser'da http://188.132.211.171:9080 adresini açın"
echo "2. F12 > Network sekmesine gidin"
echo "3. Hard refresh yapın (Ctrl+F5)"
echo "4. index-*.js dosyasının 200 (OK) döndüğünü kontrol edin"
