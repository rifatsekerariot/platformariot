# Cursor Remote SSH Kurulumu ve Kullanımı

## Adımlar

### 1. Cursor'da SSH Bağlantısı Yapın

1. **Cursor'da Command Palette'i açın:**
   - `Ctrl+Shift+P` (Windows/Linux) veya `Cmd+Shift+P` (Mac)

2. **"Remote-SSH: Connect to Host" komutunu seçin**

3. **SSH bağlantısını yapılandırın:**
   - Host: `188.132.211.171`
   - User: `ubuntu`
   - Şifre: `Adana4455*`

4. **Veya SSH config dosyası ekleyin:**
   ```
   Host beaver-server
       HostName 188.132.211.171
       User ubuntu
   ```

### 2. Bağlantıyı Test Edin

Cursor'da terminal açın (`Ctrl+`` veya `View > Terminal`) ve şunu çalıştırın:
```bash
hostname
whoami
docker ps
```

### 3. Script'i Çalıştırın

Cursor'da terminal açıkken, script'i çalıştırın:

```bash
# Script'i sunucuya kopyalayın (eğer yoksa)
# Veya doğrudan içeriğini yapıştırıp çalıştırın

bash fix_hash_mismatch_commands.sh
```

### 4. Veya Komutları Tek Tek Çalıştırın

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
NEW_CONTAINER_ID=$(docker ps | grep beaver-iot | awk '{print $1}' | head -1)
HTML_HASH=$(docker exec $NEW_CONTAINER_ID grep -o 'src="/assets/js/index-[^"]*"' /web/index.html | sed 's/.*index-\([^"]*\)\.js.*/\1/')
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

## Alternatif: Script'i Doğrudan Çalıştırma

Eğer script'i sunucuya kopyalamak istemiyorsanız, içeriğini doğrudan terminal'e yapıştırıp çalıştırabilirsiniz:

1. `fix_hash_mismatch_commands.sh` dosyasını açın
2. Tüm içeriği kopyalayın
3. Cursor terminal'ine yapıştırın
4. Enter'a basın

## Sorun Giderme

### SSH Bağlantısı Yapılamıyorsa
- Firewall ayarlarını kontrol edin
- SSH servisinin çalıştığından emin olun: `sudo systemctl status ssh`

### Komutlar Çalışmıyorsa
- Docker'ın çalıştığından emin olun: `docker ps`
- Permissions sorunları için: `sudo` kullanmayı deneyin

### Hash'ler Hala Eşleşmiyorsa
- Image'ın güncel olduğundan emin olun: `docker images`
- Container'ı tamamen silip yeniden başlatın
- Browser cache'ini temizleyin
