#!/bin/bash
# Server log kontrol script'i
# Kullanım: ssh ubuntu@188.132.211.171 'bash -s' < check_server_logs.sh

echo "=========================================="
echo "SERVER LOG KONTROLÜ BAŞLADI"
echo "=========================================="
echo ""

# 1. Sistem bilgileri
echo "=== 1. SİSTEM BİLGİLERİ ==="
hostname
whoami
date
echo ""

# 2. Docker container'ları kontrol et
echo "=== 2. DOCKER CONTAINER'LAR ==="
docker ps -a
echo ""

# 3. Beaver IoT container log'ları
echo "=== 3. BEAVER IOT CONTAINER LOG'LARI (Son 50 satır) ==="
if docker ps | grep -q beaver-iot; then
    CONTAINER_NAME=$(docker ps | grep beaver-iot | awk '{print $1}' | head -1)
    echo "Container: $CONTAINER_NAME"
    docker logs --tail 50 "$CONTAINER_NAME" 2>&1
else
    echo "Beaver IoT container bulunamadı!"
    docker ps | grep -i beaver || echo "Hiç beaver container'ı yok"
fi
echo ""

# 4. Nginx log'ları
echo "=== 4. NGINX LOG'LARI ==="
if [ -f /var/log/nginx/error.log ]; then
    echo "--- Error Log (Son 30 satır) ---"
    tail -30 /var/log/nginx/error.log
fi
if [ -f /var/log/nginx/access.log ]; then
    echo "--- Access Log (Son 30 satır) ---"
    tail -30 /var/log/nginx/access.log
fi
echo ""

# 5. Docker compose log'ları
echo "=== 5. DOCKER COMPOSE LOG'LARI ==="
if [ -f docker-compose.yml ] || [ -f docker-compose.yaml ]; then
    docker-compose logs --tail 50 2>&1 || echo "docker-compose komutu çalışmadı"
fi
echo ""

# 6. Yayınlanan dosyalar kontrolü
echo "=== 6. YAYINLANAN DOSYALAR KONTROLÜ ==="
echo "--- /web dizini (eğer varsa) ---"
if [ -d /web ]; then
    ls -la /web/ | head -20
    echo ""
    echo "--- /web/assets dizini ---"
    if [ -d /web/assets ]; then
        ls -la /web/assets/ | head -20
        echo ""
        echo "--- /web/assets/js dosyaları (son 10) ---"
        ls -lt /web/assets/js/ 2>/dev/null | head -10 || echo "assets/js dizini bulunamadı"
    else
        echo "assets dizini bulunamadı!"
    fi
    echo ""
    echo "--- index.html içeriği (ilk 50 satır) ---"
    head -50 /web/index.html 2>/dev/null || echo "index.html bulunamadı"
fi
echo ""

# 7. Container içindeki dosyalar
echo "=== 7. CONTAINER İÇİNDEKİ DOSYALAR ==="
if docker ps | grep -q beaver-iot; then
    CONTAINER_NAME=$(docker ps | grep beaver-iot | awk '{print $1}' | head -1)
    echo "Container: $CONTAINER_NAME"
    echo "--- /web dizini ---"
    docker exec "$CONTAINER_NAME" ls -la /web/ 2>&1 | head -20
    echo ""
    echo "--- /web/assets dizini ---"
    docker exec "$CONTAINER_NAME" ls -la /web/assets/ 2>&1 | head -20 || echo "assets dizini bulunamadı"
    echo ""
    echo "--- /web/assets/js dosyaları (son 10) ---"
    docker exec "$CONTAINER_NAME" ls -lt /web/assets/js/ 2>&1 | head -10 || echo "assets/js dizini bulunamadı"
    echo ""
    echo "--- index.html içeriği (ilk 50 satır) ---"
    docker exec "$CONTAINER_NAME" head -50 /web/index.html 2>&1 || echo "index.html bulunamadı"
fi
echo ""

# 8. Son değişiklikler
echo "=== 8. SON DEĞİŞİKLİKLER (Son 24 saat) ==="
if [ -d /web ]; then
    find /web -type f -mtime -1 -ls 2>/dev/null | head -20 || echo "Son 24 saatte değişiklik yok"
fi
echo ""

# 9. Disk kullanımı
echo "=== 9. DİSK KULLANIMI ==="
df -h
echo ""

# 10. Docker image'ları
echo "=== 10. DOCKER IMAGE'LARI ==="
docker images | grep -E "beaver|milesight" || echo "Beaver/Milesight image'ları bulunamadı"
echo ""

echo "=========================================="
echo "LOG KONTROLÜ TAMAMLANDI"
echo "=========================================="
