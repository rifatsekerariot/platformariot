# Hash Eşleşmeme Sorunu Düzeltme

## Tarih
2026-01-26

## Tespit Edilen Sorun

### Kritik Sorun: Hash Eşleşmiyor
- **index.html'deki hash:** `index-DAH6QgYu.js`
- **Gerçek dosya:** `index-h1hueMHm.js` (veya başka hash)
- **Sonuç:** Browser eski hash'i arıyor, dosya bulunamıyor → 404 hatası

### Diğer Bulgular
- Debug log'ları yok (production build'de minify edilmiş)
- Image güncel (2026-01-26 15:14 UTC)
- Container çalışıyor ama yanlış hash kullanıyor

## Sorunun Nedeni

1. **Build sırasında hash'ler değişmiş** ama `index.html` güncellenmemiş
2. **Farklı build'ler karışmış** (eski index.html + yeni JS dosyaları)
3. **Cache sorunu** (build cache'den eski dosyalar kullanılmış)

## Çözüm

### Yöntem 1: Container'ı Yeniden Başlat (Hızlı)
```bash
ssh ubuntu@188.132.211.171

# Container'ı durdur ve sil
docker stop 71e0ba18d60d
docker rm 71e0ba18d60d

# Image'ı güncelle
docker pull ghcr.io/rifatsekerariot/beaver-iot:latest

# Yeni container başlat (docker-compose varsa)
docker-compose up -d

# Veya manuel başlat
docker run -d --name beaver-iot \
  -p 9080:80 \
  -p 1883:1883 \
  -p 8083:8083 \
  ghcr.io/rifatsekerariot/beaver-iot:latest
```

### Yöntem 2: Otomatik Script (Önerilen)
```bash
# Script'i sunucuya kopyala
scp fix_server_hash_mismatch.sh ubuntu@188.132.211.171:~/

# SSH ile bağlan ve çalıştır
ssh ubuntu@188.132.211.171
bash fix_server_hash_mismatch.sh
```

### Yöntem 3: Manuel Hash Kontrolü
```bash
# Container içindeki hash'leri kontrol et
docker exec <CONTAINER_ID> ls /web/assets/js/index-*.js

# index.html'deki hash'i kontrol et
docker exec <CONTAINER_ID> grep -o 'src="/assets/js/index-[^"]*"' /web/index.html

# Eşleşmiyorsa index.html'i düzelt (önerilmez, build'i yeniden yapmak daha iyi)
```

## Doğrulama

### 1. Hash'leri Kontrol Et
```bash
# Yeni container ID'yi bul
NEW_CONTAINER_ID=$(docker ps | grep beaver-iot | awk '{print $1}' | head -1)

# Hash'leri karşılaştır
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

### 2. Browser'da Kontrol Et
1. Tarayıcıda sayfayı açın
2. F12 > Network sekmesine gidin
3. Sayfayı yenileyin (Ctrl+F5)
4. `index-*.js` dosyasının 200 (OK) döndüğünü kontrol edin
5. 404 hatası varsa hash hala eşleşmiyor demektir

### 3. Console'u Kontrol Et
1. F12 > Console sekmesine gidin
2. Hata mesajlarını kontrol edin
3. `Failed to load resource` hatası varsa hash sorunu devam ediyor demektir

## Önleme

### CI/CD'de
1. **Build cache'i temizle:**
   ```yaml
   docker build --no-cache ...
   ```

2. **Hash'leri doğrula:**
   ```bash
   # Build sonrası hash kontrolü
   HTML_HASH=$(grep -o 'src="/assets/js/index-[^"]*"' dist/index.html | sed 's/.*index-\([^"]*\)\.js.*/\1/')
   REAL_FILE=$(ls dist/assets/js/index-*.js | head -1)
   REAL_HASH=$(echo "$REAL_FILE" | sed 's/.*index-\([^"]*\)\.js.*/\1/')
   
   if [ "$HTML_HASH" != "$REAL_HASH" ]; then
       echo "ERROR: Hash mismatch!"
       exit 1
   fi
   ```

3. **Build verification script'i ekle:**
   ```bash
   # verify-build.sh
   # Hash'leri kontrol et
   # Dosya yapısını kontrol et
   # index.html'i kontrol et
   ```

## Notlar

- Hash eşleşmeme sorunu genellikle build cache sorunlarından kaynaklanır
- Production build'de hash'ler her build'de değişir (content-based hashing)
- Browser cache'i de sorun yaratabilir (hard refresh gerekebilir)
- Container'ı yeniden başlatmak genellikle sorunu çözer

## Sonuç

Hash eşleşmeme sorunu container'ı yeniden başlatarak çözülebilir. Eğer sorun devam ederse:
1. CI/CD build'ini kontrol edin
2. Build cache'ini temizleyin
3. Build verification script'i ekleyin
