# ChirpStack Event–Telemetry Uygulama Planı

**Amaç:** ChirpStack webhook event türlerine göre (uplink, status, join vb.) gelen verileri parse edip ilgili entity'lere kaydetmek; widget’lar bu entity'leri kullanabilsin.

---

## 1. Mevcut Durum

| Event | Parse | Entity’e kayıt | Widget kullanımı |
|-------|------|----------------|------------------|
| **up** (uplink) | ✅ `object` + `rxInfo` | ✅ `ChirpstackTelemetryMapping` ile (`temperature`, `humidity`, `rssi`, `snr`, …) | ✅ Tüm custom widget’lar |
| **status** | ✅ `StatusEvent` | ❌ Sadece log | ❌ Battery / margin widget’ta yok |
| **join** | ✅ `JoinEvent` | ❌ Sadece log | ❌ Telemetri yok |
| **location** | ❌ Log only | ❌ | ❌ Map için lat/lng kullanılmıyor |
| **ack**, **txack**, **log**, **integration** | Log only | ❌ | — |

- **Uplink:** `object` (decode payload) + `rxInfo` (RSSI, SNR) → `mapSensorPayloadToEntityValues` + rxInfo değerleri → `entityValueServiceProvider.saveValuesAndPublishAsync`.
- **Status:** `batteryLevel`, `margin`, `batteryLevelUnavailable`, `externalPowerSource` mevcut; sadece log atılıyor, entity’e yazılmıyor.
- **Join:** `devEui`, `devAddr`; sensor telemetrisi yok.

---

## 2. Yapılacaklar

### 2.1 Telemetry mapping

- **`ChirpstackTelemetryMapping`:** `margin` ekle (`entityId=margin`, `unit=dB`, aliases: `margin`).
- Mevcut `battery` zaten var; status’taki `batteryLevel` → `battery` entity.

### 2.2 Status event → entity

- **`handleStatus`** içinde:
  1. `StatusEvent` parse (mevcut).
  2. `deviceInfo.devEui` ile `findByIdentifier(devEui, INTEGRATION_ID)` cihaz bul.
  3. `deviceStatusServiceProvider.online(device)` (uplink ile uyumlu).
  4. `Map<String, Object> toSave`:
     - `batteryLevel != null` ve `!Boolean.TRUE.equals(batteryLevelUnavailable)` → `toSave.put("battery", batteryLevel.doubleValue())`.
     - `margin != null` → `toSave.put("margin", margin.doubleValue())`.
  5. `toSave` boş değilse, uplink ile aynı formatta `deviceKey.entityId` ile `saveValuesAndPublishAsync` çağır.

### 2.3 Join event

- Telemetri yok; log-only kalacak. İleride `last_join_time` vb. eklenebilir.

### 2.4 Location event (opsiyonel, sonraki adım)

- `event=location` için payload parse + `latitude` / `longitude` → ilgili entity’lere yazılabilir (map widget). Bu plan dışında; ayrı task.

---

## 3. Test

- **Unit:** `ChirpstackWebhookService` için status senaryosu: mock device + `EntityValueServiceProvider`, `handleStatus` çağır, `saveValuesAndPublishAsync`’in doğru `deviceKey.battery` / `deviceKey.margin` ile çağrıldığını doğrula.
- **Integration:** `POST .../webhook?event=status` + örnek JSON; tenant + device mevcutken entity değerlerinin güncellendiğini kontrol et.
- **Widget:** Cihazda Battery / Signal Quality (margin) widget’ı aç; ChirpStack’ten status event’leri gelince değerlerin güncellendiğini doğrula.

---

## 4. Dosya Değişiklikleri

- `ChirpstackTelemetryMapping.java`: `margin` spec ekleme.
- `ChirpstackWebhookService.java`: `handleStatus` genişletme (device lookup, toSave, save).
- `chirpstack-status.json`: Test için örnek status payload.
- İsteğe bağlı: `ChirpstackWebhookService` unit testi.
- `TEST_PLAN_CHIRPSTACK.md`: Status telemetry maddesi ekleme.

---

## 5. Sonuç

- **Uplink:** Mevcut (object + rxInfo) → widget’lar kullanıyor.
- **Status:** Battery + margin → entity’e yazılacak; widget’lar battery/margin kullanabilecek.
- **Join:** Değişiklik yok.
- **Event type:** Zaten `event` query param ile ayrışıyor; status için ek parse + persist eklenecek.
