# Dashboard PDF Report – Sunucu Fix Özeti

**Tarih:** 2026-01-26

## Yapılan İşlemler

### 1. Sunucuya SSH ile Bağlantı
- **Host:** `188.132.211.171`
- **Kullanıcı:** `ubuntu`
- **Araç:** `plink` (PuTTY) + `-hostkey` ile batch mod

### 2. Container Log ve Erişim Kontrolü
- `beaver-iot` container logları alındı.
- Nginx access log’da `/report` sayfası ve `POST /api/v1/dashboard/search` istekleri **200** dönüyor.
- `GET /api/v1/dashboard/undefined` veya 500 hatası **access log’da görülmedi** (PDF üretim denemesi yapılmamış olabilir).

### 3. Image ve Container Güncellemesi
- **Image:** `ghcr.io/rifatsekerariot/beaver-iot:latest` zaten güncel (up to date).
- Mevcut container **durdurulup silindi:** `c0c0ba3e0901`
- **Yeni container** aynı portlarla başlatıldı: `513e22b261a3`
  - `9080:80`, `1883:1883`, `8083:8083`

### 4. Doğrulama
- `http://127.0.0.1:9080/report` → **200**
- `http://127.0.0.1:9080/` → **200**
- Container ayakta ve sağlıklı.

## Test Adımları

1. Tarayıcıda **http://188.132.211.171:9080** adresine gidin.
2. Giriş yapın.
3. **Report** sayfasına gidin: **http://188.132.211.171:9080/report**
4. **Dashboard** seçin, **tarih aralığı** girin, **Generate PDF**’e tıklayın.

## Bilinen Durumlar (Dokümanlara Göre)

- **Dashboard ID undefined:** Frontend’de validation ile engellendi (validation fix’leri image’da mevcut).
- **Backend "GET is not supported":** `GET /api/v1/dashboard/:id` için backend bazen POST bekliyor olabilir; bu **beaver-iot backend core** tarafında çözülmeli (bu repo dışında).

## Tekrar Fix Gerekirse

```powershell
.\scripts\fix_dashboard_pdf_report.ps1
```

Veya SSH ile:

```bash
sudo docker stop $(sudo docker ps -q --filter name=beaver-iot)
sudo docker rm $(sudo docker ps -aq --filter name=beaver-iot)
sudo docker run -d --name beaver-iot -p 9080:80 -p 1883:1883 -p 8083:8083 ghcr.io/rifatsekerariot/beaver-iot:latest
```

## Sonuç

- Sunucuya plink ile bağlanıldı.
- Container yeniden başlatıldı, report sayfası erişilebilir.
- Image güncel; frontend validation fix’leri deploy’da.
- PDF hatası sürerse: tarayıcı F12 → Network/Console log’ları kontrol edin ve backend’de `GET /api/v1/dashboard/:id` desteği doğrulanmalı.
