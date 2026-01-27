# Server Log Kontrolü Rehberi

## Sunucu Bilgileri
- **IP:** 188.132.211.171
- **Kullanıcı:** ubuntu
- **Şifre:** Adana4455*

## SSH Bağlantısı

### Windows PowerShell'den:
```powershell
ssh ubuntu@188.132.211.171
# Şifre: Adana4455*
```

### Veya script ile:
```powershell
# check_server_logs.sh dosyasını sunucuya kopyalayın ve çalıştırın
scp check_server_logs.sh ubuntu@188.132.211.171:~/
ssh ubuntu@188.132.211.171 'bash check_server_logs.sh'
```

## Kontrol Edilecekler

### 1. Docker Container'ları
```bash
docker ps -a
```

### 2. Beaver IoT Container Log'ları
```bash
# Container ID'yi bulun
CONTAINER_ID=$(docker ps | grep beaver-iot | awk '{print $1}' | head -1)

# Son 100 satır log
docker logs --tail 100 $CONTAINER_ID

# Canlı log takibi
docker logs -f $CONTAINER_ID
```

### 3. Console Log'ları (Browser)
- Tarayıcıda F12 açın
- Console sekmesine gidin
- `[ReportPage]` ile başlayan log'ları arayın
- Hata mesajlarını kontrol edin

### 4. Container İçindeki Dosyalar
```bash
# /web dizini
docker exec $CONTAINER_ID ls -la /web/

# /web/assets dizini
docker exec $CONTAINER_ID ls -la /web/assets/

# JavaScript dosyaları
docker exec $CONTAINER_ID ls -lt /web/assets/js/ | head -20

# index.html
docker exec $CONTAINER_ID head -50 /web/index.html
```

### 5. Nginx Log'ları
```bash
# Error log
sudo tail -50 /var/log/nginx/error.log

# Access log
sudo tail -50 /var/log/nginx/access.log
```

### 6. Son Değişiklikler
```bash
# Container içinde son 24 saatte değişen dosyalar
docker exec $CONTAINER_ID find /web -type f -mtime -1 -ls
```

### 7. Debug Log'ları Kontrolü
```bash
# Console log'larını container log'larında ara
docker logs $CONTAINER_ID | grep -i "\[ReportPage\]"

# Form submit log'ları
docker logs $CONTAINER_ID | grep -i "\[FORM\]"

# API çağrı log'ları
docker logs $CONTAINER_ID | grep -i "\[API\]"

# Select component log'ları
docker logs $CONTAINER_ID | grep -i "\[SELECT\]"

# Hata log'ları
docker logs $CONTAINER_ID | grep -i "\[ERROR\]"
```

## Sorun Tespiti

### Sorun: Değişiklikler Yansımıyor
1. **Container'ın yeniden başlatıldığından emin olun:**
   ```bash
   docker restart $CONTAINER_ID
   ```

2. **Image'ın güncel olduğundan emin olun:**
   ```bash
   docker images | grep beaver-iot
   docker pull ghcr.io/rifatsekerariot/beaver-iot:latest
   ```

3. **Container'ın doğru image'ı kullandığını kontrol edin:**
   ```bash
   docker inspect $CONTAINER_ID | grep Image
   ```

### Sorun: Console Log'ları Görünmüyor
1. **Browser console'unu açın (F12)**
2. **Console sekmesine gidin**
3. **Filter:** `[ReportPage]`
4. **Sayfayı yenileyin (Ctrl+F5)**

### Sorun: API Çağrıları Başarısız
1. **Network sekmesini kontrol edin (F12 > Network)**
2. **API çağrılarını kontrol edin**
3. **Response'ları inceleyin**
4. **Container log'larında API hatalarını arayın:**
   ```bash
   docker logs $CONTAINER_ID | grep -i "api\|error\|failed"
   ```

## Hızlı Kontrol Komutları

```bash
# Tüm log'ları bir kerede görmek için
docker logs $CONTAINER_ID 2>&1 | tail -200

# Sadece hataları görmek için
docker logs $CONTAINER_ID 2>&1 | grep -i error

# Son 10 dakikadaki log'lar
docker logs $CONTAINER_ID --since 10m

# Belirli bir tarihten sonraki log'lar
docker logs $CONTAINER_ID --since 2026-01-26T00:00:00
```

## Dosya Yapısı Kontrolü

```bash
# Container içindeki tüm dosyaları listelemek
docker exec $CONTAINER_ID find /web -type f | head -50

# JavaScript dosyalarını kontrol etmek
docker exec $CONTAINER_ID find /web/assets/js -name "*.js" | head -20

# index.html'i kontrol etmek
docker exec $CONTAINER_ID cat /web/index.html | grep -i "script\|assets"
```

## Notlar

- Container log'ları sadece stdout/stderr çıktılarını gösterir
- Browser console log'ları sadece tarayıcıda görünür
- Nginx log'ları sunucu tarafındaki istekleri gösterir
- Debug log'ları production build'de kaldırılmış olabilir (minify edilmiş kod)
