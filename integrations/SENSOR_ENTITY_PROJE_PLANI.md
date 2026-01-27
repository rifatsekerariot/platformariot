# Sensör–Entity Proje Planı

**Amaç:** Hangi sensörü eklersen, o sensöre ait telemetri entity’leri oluşsun; Entity Data’da sadece o sensörün verileri görünsün. Mimari köklü değişmeden, mevcut ChirpStack/Beaver akışı korunacak.

---

## 1. Mevcut Akış (Özet)

- **Cihaz ekleme:** Device → Add → ChirpStack HTTP → form: Device Name + DevEUI. `ChirpstackDeviceService.onAddDevice` tüm `ChirpstackTelemetryMapping.ALL` spec’lerinden entity oluşturur, cihazı kaydeder.
- **Webhook:** Uplink/status geldiğinde `mapSensorPayloadToEntityValues` ile payload anahtarlarını ALL üzerinden eşler, `deviceKey.entityId` olarak kaydeder.
- **Entity Data:** Cihazın tüm entity’leri listelenir; gelen telemetri anahtarlarına karşılık gelenler güncellenir.

**Sorun:** Her cihaz için **tüm** telemetri entity’leri oluşturuluyor; hangi sensör olursa olsun aynı liste. Kullanıcı “hangi sensörü eklediysem o sensöre göre entity data gelsin” istiyor.

---

## 2. Hedef

- Cihaz eklerken **isteğe bağlı “Sensör modeli”** seçilebilsin (örn. AM102, EM500-UDL, VS121).
- Seçilen modele göre **sadece o sensörün telemetri entity’leri** oluşturulsun.
- Webhook’ta gelen veriler **yalnızca bu entity’lere** yazılsın.
- Sensör seçilmezse **mevcut davranış** kalsın (tüm entity’ler).

---

## 3. Mimari Kısıtlar

- Mevcut **ChirpStack webhook**, **entity value save**, **Device/Entity** modeli değişmeyecek.
- **ChirpstackTelemetryMapping** telemetri katalogu olarak kalacak; buna **SensorDecoders** tabanlı yeni spec’ler eklenecek.
- **ChirpstackDeviceService** ve **ChirpstackWebhookService** davranışı genişletilecek, **contract’lar** bozulmayacak.

---

## 4. Yapılacaklar

### 4.1 ChirpstackTelemetryMapping genişletme

- **SensorDecoders** raporundaki **sayısal telemetri** anahtarları için `Spec` ekle (entityId, displayName, unit, aliases).
- Örnekler: `activity`, `illumination`, `infrared`, `infrared_and_visible`, `light_level`, `latitude`, `longitude`, `distance`, `distance_mutation`, `current`, `current_max`, `current_min`, `total_current`, `tvoc`, `hcho`, `o3`, `pm1_0`, `water`, `water_conv`, `pulse`, `pulse_conv`, `valve_opening`, `people_count_all`, `people_in`, `people_out`, `region_1_count`…`region_16_count`, `dwell_time_avg`, `dwell_time_max`, `line_in`, `line_out`, `wind_speed`, `wind_direction`, `rainfall_total`, `rainfall_counter`, `angle_x`, `angle_y`, `angle_z`, `gpio`, `gpio_counter_1`, `gpio_counter_2`, `adc_1`, `adc_2`, `pressure`, `target_temperature`, vb.
- **ALL** listesi büyüyecek; mevcut spec’ler aynen kalacak.

### 4.2 ChirpstackSensorModelMapping (yeni)

- **Config sınıfı:** `Map<String, List<String>>` → sensör model ID → o modele ait **entityId** listesi.
- Model ID’leri **SensorDecoders** klasör yapısıyla uyumlu (örn. `am102`, `em500-udl`, `vs121`, `wts506`).
- Her model için **sadece telemetri** anahtarları (config/metadata hariç) ve **ChirpstackTelemetryMapping’de tanımlı** olanlar kullanılacak.
- `sensor-keys-per-model.txt` / `SENSOR_DECODERS_TELEMETRY_RAPORU.md` referans alınacak.

### 4.3 Add Device: sensorModel alanı

- **ChirpstackIntegrationEntities.AddDevice** içinde **isteğe bağlı** alan:
  - `sensorModel` (String): seçilen sensör modeli (örn. `am102`, `em500-udl`).
- UI formunda **isteğe bağlı** “Sensör modeli” alanı (dropdown veya serbest metin) eklenecek. Dropdown için enum/statik liste kullanılabilir.

### 4.4 ChirpstackDeviceService güncellemesi

- `onAddDevice` içinde:
  - `addDevice.getSensorModel()` okunacak.
  - **SensorModel var ve mapping’de bulunuyorsa:** Sadece o modelin entity ID’leri için `ChirpstackTelemetryMapping`’den spec’ler alınacak, yalnızca bu entity’lerle cihaz oluşturulacak.
  - **Yoksa:** Mevcut mantık (ALL üzerinden tüm entity’ler) kullanılacak.
- Oluşturulan **Device** için `additional` içinde `sensorModel` saklanacak (ör. `"sensorModel": "am102"`), webhook tarafında filtreleme için kullanılacak.

### 4.5 ChirpstackWebhookService güncellemesi

- **Uplink** ve **status** işlerinde:
  - Payload → `toSave` eşlemesi **aynı** kalacak (mevcut `mapSensorPayloadToEntityValues` + rxInfo/status).
  - Cihaz bulunduktan sonra **`device.getAdditional()`** içinden `sensorModel` okunacak.
  - **sensorModel varsa:** `ChirpstackSensorModelMapping` ile bu modele ait entity ID listesi alınacak; **`toSave` yalnızca bu entity ID’leriyle sınırlandırılacak** (diğer anahtarlar atılacak).
  - **sensorModel yoksa:** Filtreleme yapılmayacak (mevcut davranış).

### 4.6 UI (Add Device formu)

- ChirpStack “Add Device” formuna **isteğe bağlı** “Sensör modeli” alanı eklenecek.
- Seçenekler: `ChirpstackSensorModelMapping` key’leri veya sabit bir liste (am102, am103, …, em500-udl, vs121, wts506, vb.). Enum/options backend veya frontend’den sağlanabilir; mimariye uygun şekilde seçilecek.

---

## 5. Dosya Değişiklikleri

| Dosya | Değişiklik |
|-------|------------|
| `ChirpstackTelemetryMapping.java` | SensorDecoders telemetrileri için yeni `Spec` eklemeleri. |
| `ChirpstackSensorModelMapping.java` | **Yeni** – model → entityId listesi. |
| `ChirpstackIntegrationEntities.java` | `AddDevice` içinde `sensorModel` alanı. |
| `ChirpstackDeviceService.java` | Sensor modele göre entity subset, `additional` ile `sensorModel` saklama. |
| `ChirpstackWebhookService.java` | `sensorModel`’e göre `toSave` filtreleme. |
| Add Device form (frontend) | İsteğe bağlı “Sensör modeli” alanı (gerekirse). |

---

## 6. Test

- **Cihaz ekleme:** Sensör seçmeden ekleme → tüm entity’ler oluşmalı (mevcut davranış).
- **Cihaz ekleme:** Örn. AM102 seçerek ekleme → sadece AM102 telemetri entity’leri oluşmalı.
- **Webhook:** AM102 cihazına uplink (temperature, humidity, battery) → sadece bu entity’ler güncellenmeli.
- **Webhook:** Aynı cihaza “distance” içeren payload → distance entity’si olmadığı için **kaydedilmemeli** (filtreleme).
- **Entity Data:** İlgili cihazda sadece seçilen sensörün entity’leri ve gelen veriler görünmeli.

---

## 7. Geriye Dönük Uyumluluk

- **sensorModel** isteğe bağlı; verilmezse davranış bugünküyle aynı.
- Mevcut cihazlarda `additional` içinde `sensorModel` yok → webhook filtre uygulamaz, mevcut kayıt mantığı devam eder.

Bu plan uygulandıktan sonra, hangi sensör eklenirse sadece o sensöre ait entity’ler oluşturulacak ve Entity Data’da yalnızca o sensörün verileri görünecek; mimari köklü değişmeyecek.
