# Custom Widget'lar – Özet ve Lokal Docker Test

## 1. Eklenen Widget'lar

| Widget | Type | Entity(ler) | Alarm vurgusu |
|--------|------|-------------|----------------|
| **Alert Indicator** | `alertIndicator` | 1 (EntitySelect) | ✓ useAlarmEmphasis |
| **Air Quality Card** | `airQualityCard` | 4: CO2, TVOC, PM2.5, PM10 | ✓ checkAlarmEmphasisMulti |
| **Status Badge** | `statusBadge` | 1 | ✓ useAlarmEmphasis |
| **Counter Card** | `counterCard` | 1 | ✓ useAlarmEmphasis |
| **Security Icon** | `securityIcon` | 1 (LockIcon) | ✓ useAlarmEmphasis |
| **Thermostat Dial** | `thermostatDial` | 1 | — |
| **Rainfall Histogram** | `rainfallHistogram` | 1 | — |
| **Signal Quality Dial** | `signalQualityDial` | 3: RSSI, SNR, SF | — |
| **HVAC Schematic** | `hvacSchematic` | 2: Fan, Valve | — |
| **Wind Rose** | `windRose` | 2: Direction, Speed | — |
| **Industrial Gauges** | `industrialGauges` | 3: ADC, ADV, Modbus | — |
| **Network Table** | `networkTable` | 1 | — |

Stil: **mevcut proje yapısı** (`--main-background`), glassmorphism yok.

## 2. Lokal Docker Build ve Test

**Ön koşul:** `c:\Projeler` altında `beaver`, `beaver-iot-web`, `beaver-iot-docker` (ve gerekirse `beaver-iot-integrations`) klasörleri olmalı.

### 2.1 Tek script ile build + compose

```powershell
cd c:\Projeler\beaver-iot-docker
.\scripts\run-with-local-web.ps1
```

Bu script:

1. ChirpStack JAR'larını hazırlar (integrations build + kopyala)
2. **Yerel** `beaver-iot-web` ile web imajını build eder (yeni widget'lar dahil)
3. API + monolith imajlarını build eder (yerel web kullanılır)
4. `chirpstack.yaml` ile compose up yapar

### 2.2 Sadece build (compose up yok)

```powershell
.\scripts\run-with-local-web.ps1 -SkipComposeUp
```

### 2.3 UI ve loglar

- **UI:** http://localhost:9080  
- **Loglar:** `docker compose -f examples/chirpstack.yaml logs -f`  
- **Durdur:** `docker compose -f examples/chirpstack.yaml down`

## 3. Widget Kontrolü

1. Tarayıcıda http://localhost:9080 → giriş yap → Dashboard.
2. **Add widget** aç → listede yeni widget'lar görünmeli:
   - Alert Indicator, Air Quality Card, Status Badge, Counter Card, Security Icon,
   - Thermostat Dial, Rainfall Histogram, Signal Quality Dial, HVAC Schematic,
   - Wind Rose, Network Table, Industrial Gauges.
3. Herhangi birini seç → entity/title konfigüre et → kaydet.
4. Panelde widget'ın render olduğunu ve (entity bağlıysa) değerin geldiğini kontrol et.

## 4. Build / Lint

- **Web build:** `cd beaver-iot-web && npm exec -- pnpm --filter=@app/web run build`  
- **Lint:** İlgili plugin klasörleri için lint temiz.

Tüm yeni widget'lar **PluginType**, **useResponsiveLayout** ve **i18n** (en/cn) ile entegre; **components.ts** glob ile otomatik yüklenir.
