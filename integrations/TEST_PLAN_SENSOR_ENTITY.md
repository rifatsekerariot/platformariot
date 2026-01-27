# Test planı: Sensör–Entity (Sensor model → Entity Data)

## 1. Amaç

- Cihaz eklerken **Sensör modeli** seçildiğinde sadece o modelin entity’leri oluşsun.
- Webhook’tan gelen veriler **yalnızca** bu entity’lere yazılsın.
- Sensör modeli **seçilmezse** mevcut davranış kalsın (tüm entity’ler).

## 2. Ön koşullar

- Beaver + ChirpStack stack ayakta (`chirpstack.yaml` veya prebuilt).
- Tarayıcıda `http://localhost:9080` (veya 8080), giriş yapılmış.

## 3. Test senaryoları

### 3.1 Sensör modeli seçmeden cihaz ekleme (mevcut davranış)

1. **Device** → **+ Add** → **ChirpStack HTTP** → **Confirm**.
2. **Device Name:** `Test-All`; **External Device ID (DevEUI):** `0101010101010101`. **Sensör modeli** boş bırak.
3. **Confirm**.
4. **Beklenen:** Cihaz oluşur. Entity Data’da **tüm** telemetri entity’leri görünür (temperature, humidity, co2, battery, …).

### 3.2 Sensör modeli ile cihaz ekleme (AM102)

1. **Device** → **+ Add** → **ChirpStack HTTP** → **Confirm**.
2. **Device Name:** `AM102-01`; **DevEUI:** `0202020202020202`; **Sensör modeli:** `am102`.
3. **Confirm**.
4. **Beklenen:** Cihaz oluşur. Entity Data’da **sadece** `battery`, `humidity`, `temperature` entity’leri görünür.

### 3.3 Uplink → Entity güncellemesi (AM102)

1. 3.2’de eklenen cihaz (`0202020202020202`) için uplink gönder:
   - `object`: `{"temperature": 22.5, "humidity": 60, "battery": 85}`.
2. **Beklenen:** Entity Data’da temperature, humidity, battery güncellenir.
3. Aynı cihaz için `object` içinde `distance` ekle (`{"temperature": 22.5, "humidity": 60, "battery": 85, "distance": 100}`).
4. **Beklenen:** `distance` **kaydedilmez** (AM102’de distance entity’si yok); temperature, humidity, battery güncellenir.

### 3.4 Sensör modeli EM500-UDL

1. **Device** → **+ Add** → **ChirpStack HTTP**.
2. **Device Name:** `UDL-01`; **DevEUI:** `0303030303030303`; **Sensör modeli:** `em500-udl`.
3. **Confirm**.
4. **Beklenen:** Sadece `battery`, `distance`, `distance_mutation` entity’leri oluşur.
5. Uplink: `object` = `{"battery": 90, "distance": 150}`.
6. **Beklenen:** Entity Data’da battery ve distance güncellenir.

### 3.5 Status (battery, margin)

1. 3.2’deki AM102 cihazı için **Status** event gönder (`chirpstack-status.json`, `deviceInfo.devEui` = `0202020202020202`).
2. **Beklenen:** `battery` ve `margin` entity’leri güncellenir (AM102’de margin yok; mapping’de margin var, ama AM102 entity listesinde yok).  
   **Not:** Status’ta her zaman `battery` ve `margin` gönderiliyor. AM102 entity setinde `margin` yok; filtre sonrası sadece `battery` kalır. Bu beklenen davranış.

### 3.6 Webhook filtreleme (cihazda olmayan entity)

1. AM102 cihazı (`0202020202020202`) için uplink: `object` = `{"temperature": 20, "distance": 999}`.
2. **Beklenen:** Sadece `temperature` kaydedilir; `distance` atılır (AM102’de distance entity’si yok).

## 4. Kısa kontrol listesi

| Adım | Beklenen |
|------|----------|
| Cihaz ekle, sensör modeli **boş** | Tüm entity’ler oluşur |
| Cihaz ekle, sensör modeli **am102** | Sadece battery, humidity, temperature |
| Uplink (am102 cihazı) | Sadece bu entity’ler güncellenir |
| Uplink’te “extra” key (örn. distance) | Kaydedilmez |
| Status (battery, margin) | Sadece cihazda tanımlı entity’ler güncellenir |

## 5. Curl örnekleri

```powershell
# Uplink (am102 – object)
$body = @'
{"deduplicationId":"x","time":"2025-01-01T00:00:00Z","deviceInfo":{"devEui":"0202020202020202","deviceName":"AM102-01"},"fPort":1,"object":{"temperature":22.5,"humidity":60,"battery":85}}
'@
Invoke-RestMethod -Uri "http://localhost:9080/public/integration/chirpstack/webhook?event=up" -Method Post -ContentType "application/json" -Body $body -Headers @{"X-Tenant-Id"="default"}

# Status
Invoke-RestMethod -Uri "http://localhost:9080/public/integration/chirpstack/webhook?event=status" -Method Post -ContentType "application/json" -InFile "integrations/chirpstack-integration/src/test/resources/chirpstack-status.json" -Headers @{"X-Tenant-Id"="default"}
```

(ChirpStack örnek JSON’larda `deviceInfo.devEui` ilgili cihazla eşleşmeli.)
