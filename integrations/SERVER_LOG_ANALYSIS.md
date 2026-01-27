# Sunucu Log Analizi

## Tarih
2026-01-26 15:32 UTC

## Sunucu Bilgileri
- **Hostname:** demorftskr
- **User:** root
- **Container ID:** 71e0ba18d60d
- **Image:** ghcr.io/rifatsekerariot/beaver-iot:latest
- **Image ID:** e0c682de1925
- **Container Durumu:** Up 10 minutes (15:22'de başlatılmış)

## Tespit Edilen Durumlar

### ✅ Çalışan Sistemler
1. **Container çalışıyor** - 10 dakika önce başlatılmış
2. **Dosya yapısı mevcut** - `/web/assets/js/` dizini var
3. **index.html mevcut** - Script tag'leri var
4. **Backend log'ları normal** - MQTT, scheduled tasks çalışıyor

### ⚠️ Kontrol Edilmesi Gerekenler

#### 1. JavaScript Dosya Hash'leri
**index.html'deki hash:** `index-DAH6QgYu.js`
**Gerçek dosya:** Kontrol edilmeli

**Olası Sorun:**
- Eski build'den kalan hash kullanılıyor olabilir
- Yeni build'deki hash farklı olabilir
- Browser cache sorunu olabilir

#### 2. Debug Log'ları
**Container log'larında:** Sadece backend log'ları var
**Frontend console log'ları:** Browser'da görünmeli (F12 > Console)

**Not:** Production build'de console.log'lar minify edilmiş olabilir veya kaldırılmış olabilir.

#### 3. Image Build Tarihi
**Image ID:** e0c682de1925
**Build tarihi:** Kontrol edilmeli

**Olası Sorun:**
- Eski image kullanılıyor olabilir
- Yeni build henüz pull edilmemiş olabilir

## Yapılması Gerekenler

### 1. Image'ı Güncelle
```bash
docker pull ghcr.io/rifatsekerariot/beaver-iot:latest
docker-compose down
docker-compose up -d
# veya
docker restart 71e0ba18d60d
```

### 2. JavaScript Dosyalarını Kontrol Et
```bash
# Hash'leri karşılaştır
docker exec 71e0ba18d60d ls -lht /web/assets/js/index-*.js
docker exec 71e0ba18d60d grep -o 'src="/assets/js/index-[^"]*"' /web/index.html
```

### 3. Browser Console'u Kontrol Et
- Tarayıcıda F12 açın
- Console sekmesine gidin
- `[ReportPage]` ile başlayan log'ları arayın
- Sayfayı hard refresh yapın (Ctrl+F5)

### 4. Debug Log'larını Kontrol Et
```bash
# Minify edilmiş dosyada pattern ara
docker exec 71e0ba18d60d find /web/assets/js -name "index-*.js" -exec grep -l "ReportPage" {} \;
```

## Sorun Tespiti

### Senaryo 1: Eski Image Kullanılıyor
**Belirtiler:**
- Image build tarihi eski
- JavaScript hash'leri eski
- Debug log'ları yok

**Çözüm:**
```bash
docker pull ghcr.io/rifatsekerariot/beaver-iot:latest
docker stop 71e0ba18d60d
docker rm 71e0ba18d60d
# docker-compose veya docker run ile yeniden başlat
```

### Senaryo 2: Browser Cache Sorunu
**Belirtiler:**
- Hash'ler eşleşiyor ama eski kod çalışıyor
- Console'da eski log'lar görünüyor

**Çözüm:**
- Hard refresh (Ctrl+F5)
- Browser cache'i temizle
- Incognito mode'da test et

### Senaryo 3: Production Build'de Debug Log'ları Yok
**Belirtiler:**
- Hash'ler güncel
- Ama console'da log'lar görünmüyor

**Açıklama:**
- Production build'de console.log'lar minify edilmiş olabilir
- Vite production build'de console.log'ları kaldırabilir
- Debug log'ları sadece development build'de görünür

**Çözüm:**
- Development build kullan (önerilmez production'da)
- Veya log'ları backend'e gönder (API çağrıları log'lanır)

## Öneriler

1. **Image'ı güncelleyin:**
   ```bash
   docker pull ghcr.io/rifatsekerariot/beaver-iot:latest
   ```

2. **Container'ı yeniden başlatın:**
   ```bash
   docker restart 71e0ba18d60d
   ```

3. **Browser'da hard refresh yapın:**
   - Ctrl+F5 veya Cmd+Shift+R

4. **Console log'larını kontrol edin:**
   - F12 > Console
   - `[ReportPage]` filter'ı kullanın

5. **Network tab'ını kontrol edin:**
   - F12 > Network
   - JavaScript dosyalarının yüklendiğini kontrol edin
   - 304 (Not Modified) yerine 200 (OK) olmalı

## Detaylı Kontrol Komutları

Detaylı kontrol için `check_server_detailed.sh` script'ini kullanın:
```bash
ssh ubuntu@188.132.211.171 'bash -s' < check_server_detailed.sh
```

## Sonuç

Container çalışıyor ve dosya yapısı mevcut. Ancak:
- Image'ın build tarihi kontrol edilmeli
- JavaScript hash'leri karşılaştırılmalı
- Browser console'da log'lar kontrol edilmeli
- Gerekirse image güncellenmeli ve container yeniden başlatılmalı
