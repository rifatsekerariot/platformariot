# SSH Bağlantı Rehberi ve Otomatik Düzeltme

## Hızlı Başlangıç

### Yöntem 1: Cursor Remote SSH (Önerilen)

1. **Cursor'da Command Palette açın:**
   - `Ctrl+Shift+P`

2. **"Remote-SSH: Connect to Host" yazın ve seçin**

3. **Host bilgilerini girin:**
   - `ubuntu@188.132.211.171`
   - Şifre: `Adana4455*`

4. **Terminal açın:**
   - `Ctrl+`` (backtick) veya `View > Terminal`

5. **Script'i çalıştırın:**
   ```bash
   bash fix_hash_mismatch_commands.sh
   ```

### Yöntem 2: Manuel Komutlar

Cursor'da SSH bağlantısı yaptıktan sonra, terminal'de şu komutları çalıştırın:

```bash
# 1. Container'ı durdur
docker stop 71e0ba18d60d

# 2. Container'ı sil
docker rm 71e0ba18d60d

# 3. Image'ı güncelle
docker pull ghcr.io/rifatsekerariot/beaver-iot:latest

# 4. Yeni container başlat
docker run -d \
  --name beaver-iot \
  -p 9080:80 \
  -p 1883:1883 \
  -p 8083:8083 \
  ghcr.io/rifatsekerariot/beaver-iot:latest

# 5. Hash'leri kontrol et
sleep 5
NEW_CONTAINER_ID=$(docker ps | grep beaver-iot | awk '{print $1}' | head -1)
echo "New Container ID: $NEW_CONTAINER_ID"

HTML_HASH=$(docker exec $NEW_CONTAINER_ID grep -o 'src="/assets/js/index-[^"]*"' /web/index.html | sed 's/.*index-\([^"]*\)\.js.*/\1/' | head -1)
REAL_FILE=$(docker exec $NEW_CONTAINER_ID ls /web/assets/js/index-*.js | head -1)
REAL_HASH=$(echo "$REAL_FILE" | sed 's/.*index-\([^"]*\)\.js.*/\1/')

echo "HTML hash: $HTML_HASH"
echo "Real hash: $REAL_HASH"

if [ "$HTML_HASH" = "$REAL_HASH" ]; then
    echo "✅ Hash'ler eşleşiyor!"
else
    echo "❌ Hash'ler eşleşmiyor!"
fi
```

## SSH Config Dosyası

SSH config dosyası oluşturuldu: `~/.ssh/config`

İçerik:
```
Host beaver-server
    HostName 188.132.211.171
    User ubuntu
    StrictHostKeyChecking no
```

## Sorun Giderme

### SSH Bağlantısı Yapılamıyorsa

1. **Firewall kontrolü:**
   ```bash
   # Sunucuda kontrol edin
   sudo ufw status
   ```

2. **SSH servisi kontrolü:**
   ```bash
   # Sunucuda kontrol edin
   sudo systemctl status ssh
   ```

3. **Port kontrolü:**
   ```bash
   # Yerel makinede test edin
   telnet 188.132.211.171 22
   ```

### Komutlar Çalışmıyorsa

1. **Docker kontrolü:**
   ```bash
   docker ps
   docker version
   ```

2. **Permissions sorunu:**
   ```bash
   # Gerekirse sudo kullanın
   sudo docker ps
   ```

3. **Container bulunamıyorsa:**
   ```bash
   # Tüm container'ları listeleyin
   docker ps -a
   ```

## Sonraki Adımlar

1. ✅ SSH bağlantısı yapıldı
2. ✅ Container durduruldu ve silindi
3. ✅ Image güncellendi
4. ✅ Yeni container başlatıldı
5. ✅ Hash'ler kontrol edildi
6. ⏳ Browser'da test edilmeli

## Test

1. **Browser'da sayfayı açın:**
   - `http://188.132.211.171:9080`

2. **F12 > Network sekmesine gidin**

3. **Hard refresh yapın:**
   - `Ctrl+F5` (Windows/Linux)
   - `Cmd+Shift+R` (Mac)

4. **index-*.js dosyasının 200 (OK) döndüğünü kontrol edin**

5. **Console'u kontrol edin:**
   - F12 > Console
   - `[ReportPage]` filter'ı kullanın
