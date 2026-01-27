# Custom Widget Analizi ve Task Listesi

**Amaç:** Yazılım mimarisini bozmadan, Veri Odaklılık / Premium Estetik / Dinamik Uyarılar ilkelerine uygun **custom widget**lar eklemek. Önce analiz, ardından uygulama task’ları.

---

## 1. Mevcut Widget/Plugin Mimarisi Özeti

### 1.1 Plugin Yapısı

- **Konum:** `beaver-iot-web/apps/web/src/components/drawing-board/plugin/plugins/`
- **Her plugin:** `plugins/<kebab-ismi>/` altında:
  - `control-panel/index.ts` → `ControlPanelConfig` (type, name, icon, configProps, defaultRow/Col, min/max)
  - `view/index.tsx` → React view bileşeni
  - Opsiyonel: `configure/index.tsx` (gelişmiş config UI), `icon.svg`
- **Type:** `ControlPanelConfig.type` = camelCase folder adı (örn. `gauge-chart` → `gaugeChart`). Bu değer layout’ta saklanır, widget render’da kullanılır.

### 1.2 Yükleme ve Render Akışı

| Kaynak | Rol |
|--------|-----|
| `plugins/components.ts` | `import.meta.glob('./*/control-panel/index.ts')` ile plugin **folder** listesi; `useLoadPlugins` ile kullanılır |
| `useLoadPlugins` | `controlPanelsMap` (glob: `../plugin/plugins/*/control-panel/index.ts`) → store’a `pluginsControlPanel` yazar |
| `plugins/index.ts` | `view` ve `configure` için glob → `camelCase(folder) + View` / `+ Config` (örn. `gaugeChartView`, `gaugeChartConfig`) |
| `widget.tsx` | `plugins[\`${data.data.type}View\`]` ile View seçer; `config`, `configJson`, `widgetId`, `dashboardId` geçer |
| `config-plugin` | `plugins[type + 'Config']` / `plugins[type + 'View']` ile config/view kullanır |

**Sonuç:** Yeni bir `plugins/<yeni-widget>/` klasörü + `control-panel` + `view` ekleyip, `PluginType` union’ına type eklemek yeterli. `components.ts` ve glob’lar **otomatik** yeni plugin’i içerir.

### 1.3 Veri Akışı (Entity → Widget)

- **Control-panel:** `EntitySelect`, `ChartEntityPosition`, `MultiEntitySelect` vb. ile kullanıcı **entity** seçer. Entity: `entityKey` (telemetri anahtarı), `entityValueType`, `entityType`, `entityAccessMod`.
- **Config:** Seçilen entity(ler) ve diğer alanlar (title, time, metrics, vb.) formdan `config` olarak saklanır.
- **View:** `config.entity` / `config.entityPosition` vb. kullanır. Veri:
  - `entityAPI.getEntityStatus`, `entityAPI.getAggregateHistory` (useRequest)
  - `useActivityEntity` → `addEntityListener` ile **gerçek zamanlı** güncellemeler

**Veri odaklılık:** Her telemetri anahtarı (entity key) doğrudan bir widget **parametresi** (config alanı) ile eşleşir. Mevcut mimari bunu destekliyor.

### 1.4 Alarm / Status Kullanımı

- **Sabitler:** `@alarm.@alarm_status`, `@alarm.@alarm_content` (constants).
- **Map / Alarm:** `useEntityStatus` ile `entitiesStatus` üzerinden `getCommonEntity(key, device)` → alarm durumu, içerik.
- **Genel kural (hedef):** `X_alarm` veya `X_status` benzeri entity key’leri widget’larda **görsel vurgu** (parlama, renk değişimi) tetiklemeli.

### 1.5 Stil

- Widget’lar kendi `style.less` / `style.module.less` kullanıyor (örn. `ms-gauge-chart`, `map-plugin-view`).
- Ortak zemin: `--main-background`, `drawing-board__widget`, `plugin-view`. Mevcut proje yapısı korunur; **glassmorphism kullanılmaz**.

---

## 2. Mimari İlkeler ile Uyum

| İlke | Mevcut durum | Custom widget’larda yapılacak |
|------|----------------|--------------------------------|
| **Veri odaklılık** | Entity → config → view; entityKey = telemetri | Yeni widget’lar aynı EntitySelect / multi-entity yapısını kullanacak; telemetri key’i widget parametresi olarak kalacak |
| **Stil** | `--main-background`, mevcut widget stilleri | Yeni widget’lar **mevcut proje yapısı** ile uyumlu (data-card, gauge vb. gibi); glassmorphism kullanılmaz |
| **Dinamik uyarılar (X_alarm / X_status)** | Sadece map/alarm için `@alarm.*` | **Convention:** entity key `*_alarm` veya `*_status` ile bitenler “alarm/status” kabul edilecek; **paylaşılan hook** `useAlarmEmphasis` ile vurgu sınıfı/değer sağlanacak |

---

## 3. Telemetri–Widget Matrisi ve Mevcut Eşleşmeler

| Kategori | Telemetri | Önerilen widget | Mevcut eşleşen |
|----------|-----------|------------------|----------------|
| **A. Çevre / Gaz** | temperature, humidity | Gauge / Line Chart | gaugeChart, lineChart |
| | co2, tvoc, pm2_5, pm10 | Air Quality Card | — (yeni) |
| | vaping_index | Alert Indicator | — (yeni) |
| | illumination, pressure | Area Chart | areaChart |
| **B. Takip / Sinyal** | latitude, longitude | Real-time Map | map |
| | motion_status, geofence | Status Badge | — (yeni) |
| | rssi, snr, sf | Signal Quality Dial | — (yeni) |
| | wifi_scan_result | Network Table | — (yeni) |
| **C. Enerji / Endüstriyel** | current_chnX, voltage | Digital Meter | gaugeChart / dataCard (özelleştirilebilir) |
| | current_chnX_total | Bar Chart | barChart, horizonBarChart |
| | adc_X, adv_X, modbus_chn_X | Industrial Gauges | — (yeni) |
| | gpio_counter_X | Counter Card | — (yeni) |
| **D. Kontrol / Akıllı bina** | socket_status, binary_input | Interactive Toggle | switch |
| | target_temperature | Thermostat Dial | — (yeni) |
| | fan_status, valve_status | HVAC Schematic | — (yeni) |
| | magnet_status | Security Icon | — (yeni) |
| **E. Meteoroloji** | wind_direction, wind_speed | Wind Rose | — (yeni) |
| | rainfall_total | Rainfall Histogram | — (yeni) |

**Strateji:** Önce **yeni** widget tipi gerektirenler (Air Quality Card, Alert Indicator, Status Badge, Signal Quality Dial, Network Table, Industrial Gauges, Counter Card, Thermostat, HVAC Schematic, Security Icon, Wind Rose, Rainfall Histogram) için plugin tasarla; mevcut Gauge/Line/Area/Bar/Switch/Map aynen kullanılmaya devam eder.

---

## 4. Mimariyi Bozmadan Custom Widget Ekleme Adımları

1. **`plugins/<yeni-widget>/`** oluştur (kebab-case).
2. **`control-panel/index.ts`:**  
   - `ControlPanelConfig` döndür; `type` = camelCase folder (örn. `airQualityCard`).  
   - `configProps` içinde `EntitySelect` / `ChartEntityPosition` / `MultiEntitySelect` ile entity(ler) bağla.  
   - `class`: `data_chart` | `data_card` | `operate` | `other` (mevcut `COMPONENT_CLASS`).
3. **`view/index.tsx`:**  
   - `config`, `configJson`, `widgetId`, `dashboardId` prop’larıyla React view.  
   - Veri için mevcut `entityAPI` + `useActivityEntity` veya türetilmiş `useSource` kullan.
4. **`PluginType`** (`plugin/types.ts`): Yeni type’ı union’a ekle.
5. **`icon.svg`** (veya mevcut ikon yapısı): Add-widget listesi için.
6. **`useFilterPlugins`:** Gerekirse yeni widget’ı dashboard/cihaz panosu için filtreye dahil et (varsayılan: tümü gösteriliyor).
7. **`useResponsiveLayout`:** Sadece özel boyut gerekiyorsa `plugin.type` için branch ekle; yoksa default yeterli.

**Önemli:**  
- `components.ts` ve `useLoadPlugins` glob’ları **yeni folder’ı otomatik** alır; ek kod yazmaya gerek yok.  
- **Configure** sadece gelişmiş config UI gerekiyorsa eklenir (line-chart, data-card, image örneği).

---

## 5. Dinamik Uyarılar (X_alarm / X_status) – Ortak Altyapı

Stil: **mevcut proje yapısı** korunur; glassmorphism **kullanılmaz**. Widget’lar data-card, gauge vb. gibi `--main-background` ve mevcut stillerle uyumludur.

### 5.1 Dinamik Uyarılar

- **Convention:** Entity `entityKey`’i `_alarm` veya `_status` ile bitiyorsa “uyarı/status” say.  
- **Hook:** `useAlarmEmphasis(entity, entityStatus)` veya `useAlarmEmphasis(entities, entitiesStatus)`  
  - İlgili entity(ler) için alarm/status var mı bakar.  
  - Döner: `{ isAlarm: boolean, emphasisClass?: string }`.  
- **View:** `emphasisClass` varsa root’a CSS sınıfı ekle (örn. parlama, kenarlık rengi). Mevcut alarm/map mantığına **benzer**, ama widget-agnostik ve convention-based.

---

## 6. Task Listesi (Uygulama Aşaması)

Aşağıdaki task’lar **mimariyi bozmadan** uygulanacak. Sıra önerilir; bağımlılıklar belirtilmiştir.

### Faz 0: Ortak Altyapı

| ID | Task | Açıklama | Bağımlılık |
|----|------|----------|------------|
| T0.1 | `useAlarmEmphasis` hook | `*_alarm` / `*_status` convention + entity status → `{ isAlarm, emphasisClass }` | — |
| T0.2 | Sabitler (opsiyonel) | `*_alarm` / `*_status` için constants tanımla; hook buradan okusun | T0.1 |

### Faz 1: Çevresel / Gaz (A)

| ID | Task | Açıklama | Bağımlılık |
|----|------|----------|------------|
| T1.1 | **Air Quality Card** | co2, tvoc, pm2_5, pm10 (MultiEntitySelect); IAQ indeksi; alarm vurgusu | T0.1 |
| T1.2 | **Alert Indicator** | vaping_index (EntitySelect); tek değer, alarm vurgusu; okul/tuvalet güvenliği | T0.1 |

### Faz 2: Takip / Sinyal (B)

| ID | Task | Açıklama | Bağımlılık |
|----|------|----------|------------|
| T2.1 | **Status Badge** | motion_status, geofence (EntitySelect); moving/stop, geofence ihlali | T0.1 |
| T2.2 | **Signal Quality Dial** | rssi, snr, sf (multi-entity veya tek); dial görünümü | — |
| T2.3 | **Network Table** | wifi_scan_result (EntitySelect); BSSID + sinyal listesi tablo | — |

### Faz 3: Enerji / Endüstriyel (C)

| ID | Task | Açıklama | Bağımlılık |
|----|------|----------|------------|
| T3.1 | **Industrial Gauges** | adc_X, adv_X, modbus_chn_X (multi-entity); 4–20 mA / 0–10 V / Modbus | — |
| T3.2 | **Counter Card** | gpio_counter_X (EntitySelect); sayı vurgulu kart | T0.1 |

### Faz 4: Kontrol / Akıllı Bina (D)

| ID | Task | Açıklama | Bağımlılık |
|----|------|----------|------------|
| T4.1 | **Thermostat Dial** | target_temperature (EntitySelect); hedef sıcaklık, RW entity gerekirse | — |
| T4.2 | **HVAC Schematic** | fan_status, valve_status (multi-entity); şematik gösterim | — |
| T4.3 | **Security Icon** | magnet_status (EntitySelect); kapı/pencere açık-kapalı ikon | T0.1 |

### Faz 5: Meteoroloji (E)

| ID | Task | Açıklama | Bağımlılık |
|----|------|----------|------------|
| T5.1 | **Wind Rose** | wind_direction, wind_speed (multi-entity); rüzgar pusulası | — |
| T5.2 | **Rainfall Histogram** | rainfall_total (EntitySelect); saatlik/günlük yağış | — |

### Faz 6: Entegrasyon ve Dokümantasyon

| ID | Task | Açıklama | Bağımlılık |
|----|------|----------|------------|
| T6.1 | **PluginType** güncellemesi | Her yeni widget için `types.ts` içinde `PluginType` union’a ekle | T1.1–T5.2 |
| T6.2 | **useResponsiveLayout** | Gerekli widget’lar için `plugin.type` özel layout (min/max, vb.) | T1.1–T5.2 |
| T6.3 | **useFilterPlugins** | Dashboard/cihaz panosunda gösterim kuralları (gerekirse) | T1.1–T5.2 |
| T6.4 | **i18n** | Yeni plugin `name` ve etiketler için çeviriler | T1.1–T5.2 |
| T6.5 | **Telemetri–widget matrisi dokümanı** | Hangi telemetri → hangi widget, entity key örnekleri | — |

---

## 7. Kısa Uygulama Kontrol Listesi (Widget Başına)

- [ ] `plugins/<kebab-widget>/` + `control-panel/index.ts` + `view/index.tsx`
- [ ] `type` camelCase, `PluginType`’a ekli
- [ ] Entity(ler) `EntitySelect` / `MultiEntitySelect` / `ChartEntityPosition` ile bağlı
- [ ] View: `entityAPI` + `useActivityEntity` (veya `useSource`) kullanıyor
- [ ] İsteğe bağlı: `useAlarmEmphasis` → `emphasisClass` ile vurgu
- [ ] `icon.svg` (veya mevcut ikon yapısı) var
- [ ] `useResponsiveLayout` / `useFilterPlugins` gerekiyorsa güncellendi

---

## 8. Özet

- Mevcut **plugin** mimarisi (folder, control-panel, view, type, glob’lar) **korunacak**; custom widget’lar aynı kalıba uyacak.
- **Veri odaklılık:** Telemetri key’leri entity üzerinden widget config’e bağlanmaya devam edecek.
- **X_alarm / X_status** vurgusu için **ortak** altyapı (`useAlarmEmphasis` hook) kullanılacak; yeni widget’lar bunu kullanacak. Stil **mevcut proje yapısı** korunur; glassmorphism kullanılmaz.
- Task’lar **Faz 0 → Faz 1–5 → Faz 6** sırasıyla uygulanabilir; her yeni widget mimariyi bozmadan eklenir.

Bu doküman uygulama aşamasında referans alınacak; task’lar ilerledikçe işaretlenebilir veya alt task’lara bölünebilir.
