# ARIOT Logo Güncellemesi

## Yapılan Değişiklikler

Tüm logo dosyaları "ARIOT" yazısı ile güncellendi.

### Güncellenen Dosyalar

1. **`packages/shared/src/components/logo/assets/logo-light.svg`**
   - Light theme için ana logo (162x40px)
   - "ARIOT" yazısı, koyu gri (#3C3C3C)

2. **`packages/shared/src/components/logo/assets/logo-dark.svg`**
   - Dark theme için ana logo (162x40px)
   - "ARIOT" yazısı, beyaz (#FFFFFF)

3. **`packages/shared/src/components/logo/assets/logo-light-mini.svg`**
   - Light theme için mini logo (40x40px)
   - Mor arka plan (#7B4EFA) üzerinde beyaz "A" harfi

4. **`packages/shared/src/components/logo/assets/logo-dark-mini.svg`**
   - Dark theme için mini logo (40x40px)
   - Açık mor arka plan (#A384FC) üzerinde beyaz "A" harfi

5. **`apps/web/public/icons/logo.svg`**
   - Favicon için logo (168x168px)
   - Mor arka plan (#7B4EFA) üzerinde beyaz "ARIOT" yazısı

6. **`apps/web/src/assets/logo.svg`**
   - Genel logo (200x60px)
   - Mor renk (#7B4EFA) "ARIOT" yazısı

7. **`apps/web/public/manifest.json`**
   - App name: "ARIOT"
   - Short name: "ARIOT"

### Logo Tasarım Özellikleri

- **Font:** Segoe UI, Roboto, Helvetica Neue, Arial (sans-serif)
- **Font Weight:** 700 (bold)
- **Letter Spacing:** 2-4px (logo boyutuna göre)
- **Renkler:**
  - Light theme: #3C3C3C (koyu gri)
  - Dark theme: #FFFFFF (beyaz)
  - Mini logos: #7B4EFA (mor) / #A384FC (açık mor) arka plan
  - Favicon: #7B4EFA (mor) arka plan

### Notlar

- PNG favicon dosyaları (`favicon.png`, `icons/logo-*.png`) SVG'den manuel olarak oluşturulmalı
- Tüm logo dosyaları SVG formatında, responsive ve scalable
- Logo boyutları mevcut layout'a uygun şekilde ayarlandı

## Test

1. **Build:**
   ```bash
   cd beaver-iot-web
   npm exec -- pnpm --filter=@app/web run build
   ```

2. **Browser'da kontrol:**
   - Web UI'da logo görünmeli (sidebar, header)
   - Favicon browser tab'ında görünmeli
   - Dark/Light theme değişiminde logo renkleri değişmeli

3. **Manifest:**
   - PWA install edildiğinde "ARIOT" adı görünmeli

Değişiklikler build edildi ve test için hazır.
