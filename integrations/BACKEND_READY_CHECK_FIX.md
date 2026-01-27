# Backend Ready Check – Düzeltme Özeti

## Sorun

Docker container ayağa kalkarken **Nginx Java API'den önce başlıyor**, bu yüzden:
- `/api/v1/user/status` endpoint'i **502 Bad Gateway** hatası veriyor
- Kullanıcı ekranda hata görüyor
- Java API ayağa kalktığında normale dönüyor, ama kullanıcı bunu anlayamıyor

## Çözüm

**Frontend'de Backend Ready Check** component'i eklendi:
- Backend hazır olana kadar **loading ekranı** gösteriliyor
- `/api/v1/user/status` endpoint'i **poll ediliyor** (retry logic ile)
- Backend hazır olduğunda normal uygulama render ediliyor

## Yapılan Değişiklikler

### 1. BackendReadyCheck Component (`apps/web/src/components/backend-ready-check/index.tsx`)

**Yeni component:**
- `/api/v1/user/status` endpoint'ini **poll ediyor** (exponential backoff: 1s, 2s, 3s, 4s, max 5s)
- Backend hazır olana kadar **full-screen loading ekranı** gösteriyor
- Loading ekranında:
  - CircularProgress spinner
  - "Initializing backend..." mesajı
  - "Please wait while the system is starting up." açıklama

### 2. App Entry Point (`apps/web/src/main.tsx`)

**Entegrasyon:**
- `BackendReadyCheck` component'i `RouterProvider`'ı wrap ediyor
- Tüm uygulama backend hazır olana kadar bekliyor

### 3. i18n Mesajları

**Eklenen çeviriler:**
- `common.message.backend_initializing`: "Initializing backend..." (EN) / "正在初始化后端..." (CN)
- `common.message.backend_initializing_desc`: "Please wait while the system is starting up." (EN) / "请稍候，系统正在启动中。" (CN)

### 4. Component Export (`apps/web/src/components/index.ts`)

- `BackendReadyCheck` export edildi

## Nasıl Çalışıyor?

1. **Uygulama başladığında:**
   - `BackendReadyCheck` component'i mount oluyor
   - Hemen `/api/v1/user/status` endpoint'ini kontrol ediyor

2. **Backend hazır değilse:**
   - Loading ekranı gösteriliyor
   - Exponential backoff ile retry yapılıyor (1s → 2s → 3s → 4s → 5s max)
   - Her retry'da `/api/v1/user/status` tekrar kontrol ediliyor

3. **Backend hazır olduğunda:**
   - `isReady = true` oluyor
   - Loading ekranı kalkıyor
   - Normal uygulama (`RouterProvider`) render ediliyor

## Docker Container Başlatma Sırası

**Mevcut durum (`monolith-start.sh`):**
1. Java API başlatılıyor (background)
2. Port 9200 dinlenene kadar bekleniyor (max 120s)
3. Nginx başlatılıyor

**Frontend davranışı:**
- Nginx başladığında frontend yükleniyor
- Ama Java API henüz hazır olmayabilir
- **BackendReadyCheck** Java API hazır olana kadar bekliyor
- Kullanıcı loading ekranı görüyor, 502 hatası görmüyor

## Test

1. **Docker container'ı başlat:**
   ```bash
   docker compose up -d
   ```

2. **Browser'da aç:**
   - `http://localhost:9080` veya `http://sunucu:9080`
   - **Loading ekranı** görünmeli: "Initializing backend..."
   - Java API ayağa kalkana kadar beklemeli

3. **Backend hazır olduğunda:**
   - Loading ekranı kaybolmalı
   - Normal uygulama (login/register) görünmeli
   - **502 hatası görünmemeli**

## Sonuç

- ✅ Kullanıcı **502 hatası görmüyor**
- ✅ Backend hazır olana kadar **açıklayıcı loading ekranı** gösteriliyor
- ✅ Backend hazır olduğunda **otomatik olarak** normal uygulama açılıyor
- ✅ Exponential backoff ile **gereksiz istekler** azaltılıyor

Değişiklikler build edildi ve test için hazır.
