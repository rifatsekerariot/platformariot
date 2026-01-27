#!/bin/bash
# Hash eşleşmeme sorununu düzelt
# Kullanım: ssh ubuntu@188.132.211.171 'bash -s' < fix_server_hash_mismatch.sh

CONTAINER_ID="71e0ba18d60d"
IMAGE_NAME="ghcr.io/rifatsekerariot/beaver-iot:latest"

echo "=========================================="
echo "HASH EŞLEŞMEME SORUNU DÜZELTME"
echo "=========================================="
echo ""

# 1. Mevcut durumu kontrol et
echo "=== 1. MEVCUT DURUM ==="
echo "Container ID: $CONTAINER_ID"
echo "Image: $IMAGE_NAME"
echo ""

# 2. Image'ı güncelle
echo "=== 2. IMAGE GÜNCELLEME ==="
docker pull $IMAGE_NAME
echo ""

# 3. Container'ı durdur
echo "=== 3. CONTAINER DURDURMA ==="
docker stop $CONTAINER_ID
echo ""

# 4. Container'ı sil
echo "=== 4. CONTAINER SİLME ==="
docker rm $CONTAINER_ID
echo ""

# 5. Yeni container başlat (docker-compose varsa)
echo "=== 5. YENİ CONTAINER BAŞLATMA ==="
if [ -f docker-compose.yml ] || [ -f docker-compose.yaml ]; then
    echo "docker-compose kullanılıyor..."
    docker-compose up -d
else
    echo "docker-compose bulunamadı, manuel başlatma gerekli"
    echo "Komut:"
    echo "docker run -d --name beaver-iot -p 9080:80 -p 1883:1883 -p 8083:8083 $IMAGE_NAME"
fi
echo ""

# 6. Yeni container ID'yi bul
echo "=== 6. YENİ CONTAINER KONTROLÜ ==="
NEW_CONTAINER_ID=$(docker ps | grep beaver-iot | awk '{print $1}' | head -1)
if [ -n "$NEW_CONTAINER_ID" ]; then
    echo "Yeni Container ID: $NEW_CONTAINER_ID"
    echo ""
    
    # 7. Hash'leri kontrol et
    echo "=== 7. HASH KONTROLÜ ==="
    sleep 5  # Container'ın tamamen başlaması için bekle
    HTML_HASH=$(docker exec $NEW_CONTAINER_ID grep -o 'src="/assets/js/index-[^"]*"' /web/index.html 2>/dev/null | sed 's/.*index-\([^"]*\)\.js.*/\1/' | head -1)
    REAL_FILE=$(docker exec $NEW_CONTAINER_ID ls /web/assets/js/index-*.js 2>/dev/null | head -1)
    
    if [ -n "$REAL_FILE" ]; then
        REAL_HASH=$(echo "$REAL_FILE" | sed 's/.*index-\([^"]*\)\.js.*/\1/')
        echo "HTML'deki hash: $HTML_HASH"
        echo "Gerçek hash: $REAL_HASH"
        
        if [ "$HTML_HASH" = "$REAL_HASH" ]; then
            echo "✅ Hash'ler eşleşiyor!"
        else
            echo "❌ Hash'ler hala eşleşmiyor!"
            echo "index.html dosyasını kontrol edin:"
            docker exec $NEW_CONTAINER_ID grep -o 'src="/assets/js/index-[^"]*"' /web/index.html
        fi
    else
        echo "❌ index.js dosyası bulunamadı!"
    fi
else
    echo "❌ Yeni container bulunamadı!"
fi
echo ""

echo "=========================================="
echo "DÜZELTME TAMAMLANDI"
echo "=========================================="
