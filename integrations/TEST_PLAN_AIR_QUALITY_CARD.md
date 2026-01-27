# Air Quality Card Widget – Test Planı

## 1. Yapılanlar

- **`checkAlarmEmphasisMulti`** (`useAlarmEmphasis.ts`): Çoklu entity için alarm vurgusu; herhangi biri `*_alarm` / `*_status` + truthy → emphasis.
- **Air Quality Card** (`plugins/air-quality-card/`):
  - **control-panel:** CO2, TVOC, PM2.5, PM10 (4 EntitySelect), Title. Hepsi opsiyonel.
  - **view:** 4 satır (sadece seçilen entity’ler); `useSource` (multi-entity status), `checkAlarmEmphasisMulti`, `--main-background` stili.
  - **useSource:** `getEntityStatus` x N, `addEntityListener` (entity ids), `statusMap` döner.
- **PluginType,** i18n (en/cn), **useResponsiveLayout** güncellendi.
- **Build:** `pnpm --filter=@app/web run build` **başarılı**.

## 2. Manuel Test Adımları

### 2.1 Widget listesinde görünürlük

1. `pnpm --filter=@app/web run dev` ile uygulamayı başlat.
2. Dashboard → **Add widget**.
3. **Air Quality Card** (EN: "Air Quality Card", CN: "空气质量卡片") listede olmalı.
4. Seçip panele ekle → config modal (CO2, TVOC, PM2.5, PM10, Title).

### 2.2 Konfigürasyon

1. **CO2 / TVOC / PM2.5 / PM10:** İstediğin kadarını PROPERTY entity seç (en az biri).
2. **Title:** Örn. "Air Quality" yaz, kaydet.
3. Widget’ta sadece **seçilen** metrikler satır olarak görünmeli (label + value).

### 2.3 Değer ve güncelleme

1. Seçilen entity’lerin **son değeri** (unit varsa unit ile) gösterilmeli.
2. Gerçek zamanlı güncelleme (MQTT / activity) ile değerler değişmeli.

### 2.4 Alarm vurgusu

1. Entity key’i `*_alarm` veya `*_status` ile biten biri seçili olsun (örn. `iaq_status`).
2. Değer truthy (true, >0, non-empty string) iken kartta **kırmızı border + glow + pulse** olmalı.
3. Falsy olunca vurgu kalkmalı.

### 2.5 Boş durum

1. Hiç entity seçmeden sadece title ile kaydet.
2. Widget’ta "—" (empty) görünmeli.

### 2.6 Responsive

1. Küçük ekranda min 2 birim genişlik (useResponsiveLayout `airQualityCard`).

## 3. Hızlı kontroller

- Add widget’ta "Air Quality Card" var mı?
- CO2/TVOC/PM2.5/PM10’dan birkaçı seçilince ilgili satırlar görünüyor mu?
- `*_alarm` / `*_status` entity + truthy → vurgu (glow, pulse) var mı?
- Build + lint temiz mi?

## 4. Başarı kriterleri

- [ ] Air Quality Card "Add widget" listesinde.
- [ ] CO2/TVOC/PM2.5/PM10 (opsiyonel) + title kaydediliyor, seçilenler gösteriliyor.
- [ ] Alarm vurgusu (checkAlarmEmphasisMulti) çalışıyor.
- [ ] Build + lint temiz.

Bu adımlar geçtikten sonra **Status Badge** (T2.1) veya **Signal Quality Dial** (T2.2) ile devam edilebilir.
