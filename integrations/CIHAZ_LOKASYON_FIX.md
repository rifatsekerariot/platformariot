# Cihaz Lokasyon Kaydetme – Düzeltme Özeti

## Sorunlar

1. **Geolocation hatası (HTTP):** `Geolocation error: 1 Only secure origins are allowed`
   - HTTP üzerinde `navigator.geolocation` çalışmıyor (sadece HTTPS veya localhost).
   - Kullanıcıya anlaşılır mesaj gösterilmiyordu.

2. **500 Internal Server Error:** `/api/v1/device/{id}/location` endpoint'inde hata
   - Form'dan gelen `latitude`/`longitude` **string** olarak geliyordu.
   - Backend **number** bekliyordu → 500 hatası.

## Yapılan Düzeltmeler

### 1. Geolocation HTTP Hatası (`packages/shared/src/utils/tools/browser.ts`)

- HTTP üzerinde geolocation çalışmadığında **anlaşılır hata mesajı** eklendi:
  - `"Geolocation requires HTTPS or localhost. Please select location on the map or enter coordinates manually."`

### 2. Location Input Modal (`apps/web/src/pages/device/components/location-input/modal.tsx`)

- **Geolocation başarısız olursa:**
  - HTTP üzerinde çalışmadığını belirten **daha açıklayıcı toast mesajı**.
  - Haritayı **varsayılan merkeze** (Istanbul: 41.0082, 28.9784) getiriyor → kullanıcı haritaya tıklayarak seçebilir.

- **API çağrısı öncesi:**
  - `latitude`/`longitude` **string ise number'a çevriliyor** (`parseFloat`).
  - Backend'e doğru format gönderiliyor.

### 3. Location Detail Component (`apps/web/src/pages/device/views/detail/components/location/index.tsx`)

- Aynı düzeltme: API çağrısı öncesi `latitude`/`longitude` number'a çevriliyor.

## Harita Sağlayıcısı

**Zaten OpenStreetMap kullanılıyor** (`MapType = 'openStreet'`). Google Maps değil; Leaflet + OpenStreetMap tile'ları. Ücretsiz ve HTTP üzerinde çalışıyor.

## Test

1. **HTTP üzerinde (örn. `http://sunucu:9080`):**
   - Cihaz ekle → Lokasyon → Geolocation hatası beklenir.
   - Toast: "Failed to get location information (HTTP not supported. Click on map or enter coordinates manually.)"
   - Harita Istanbul merkezinde açılır.
   - Haritaya tıklayarak veya koordinat girerek lokasyon seçilebilir.
   - Kaydet → **500 hatası olmamalı** (latitude/longitude number olarak gönderiliyor).

2. **HTTPS veya localhost üzerinde:**
   - Geolocation çalışır, otomatik konum alınır.

## Sonuç

- Geolocation HTTP hatası **daha iyi handle ediliyor** (açıklayıcı mesaj + varsayılan merkez).
- **500 hatası düzeltildi** (string → number dönüşümü).
- OpenStreetMap zaten kullanılıyor (ücretsiz, HTTP uyumlu).

Değişiklikler build edildi ve test için hazır.
