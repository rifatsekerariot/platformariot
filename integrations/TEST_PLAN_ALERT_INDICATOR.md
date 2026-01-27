# Alert Indicator Widget – Test Planı

## 1. Yapılanlar

- **Faz 0:** `useAlarmEmphasis` hook (`plugin/hooks/useAlarmEmphasis.ts`). Stil: mevcut proje yapısı (data-card benzeri, `var(--main-background)`); glassmorphism kullanılmıyor.
- **Alert Indicator plugin:** `plugins/alert-indicator/` (control-panel, view, useSource, style, icon).
- **PluginType,** i18n (en/cn), **useResponsiveLayout** güncellendi.
- **Build:** `pnpm --filter=@app/web run build` **başarılı**.

## 2. Manuel Test Adımları

### 2.1 Widget listesinde görünürlük

1. `beaver-iot-web` root’ta `pnpm run start` veya `pnpm --filter=@app/web run dev` ile uygulamayı başlat.
2. Dashboard’a git → **Add widget** aç.
3. **Alert Indicator** (EN: "Alert Indicator", CN: "告警指示") listede görünmeli.
4. Seçip panele ekle → config modal açılmalı (Entity, Title).

### 2.2 Konfigürasyon

1. **Entity:** Bir PROPERTY entity seç (örn. vaping_index, veya `*_alarm` / `*_status` ile biten bir key).
2. **Title:** Örn. "Vaping Alert" yaz, kaydet.
3. Widget panoda görünmeli; seçilen entity’nin **son değeri** (value) görüntülenmeli.

### 2.3 Alarm vurgusu (X_alarm / X_status)

1. Entity key’i `*_alarm` veya `*_status` ile biten bir property seç (örn. `vaping_index_status`).
2. Bu entity’nin **değeri truthy** olduğunda (true, >0, non-empty string):
   - Kartta **kırmızımsı border + glow** ve **alert-pulse** animasyonu olmalı.
3. Değer falsy (0, false, boş) olduğunda vurgu **kalkmalı**.

### 2.4 Responsive

1. Küçük ekranda (md altı) widget **min 2 birim genişlik** kullanmalı (useResponsiveLayout `alertIndicator` branch).

## 3. Hızlı kontroller

- **Add widget** listesinde "Alert Indicator" var mı?
- Entity seçip kaydedince widget’ta değer görünüyor mu?
- `*_alarm` / `*_status` entity + truthy değer → vurgu (glow, pulse) var mı?
- Build ve lint hatasız mı? (`pnpm --filter=@app/web run build`, lint)

## 4. Başarı kriterleri

- [ ] Alert Indicator "Add widget" listesinde.
- [ ] Entity + title config kaydediliyor, widget değer gösteriyor.
- [ ] Alarm vurgusu (`*_alarm` / `*_status` + truthy) çalışıyor.
- [ ] Build + lint temiz.

Bu adımlar geçtikten sonra aynı mimari ile diğer custom widget’lar (Air Quality Card, Status Badge, vb.) eklenebilir.
