# ChirpStack v4 HTTP Integration – Test Planı

## 1. Ön koşullar

- **Maven 3.8+** ve **JDK 17** (veya Docker ile Maven build)
- **Docker Desktop** çalışır durumda
- **Beaver** (integrations) ve **beaver-iot-docker** repoları hazır

## 2. Birim / Modül Testleri

### 2.1 ChirpStack integration build

```powershell
cd c:\Projeler\beaver
# Yerel Maven:
mvn clean package -DskipTests -pl integrations/chirpstack-integration -am

# veya Docker ile:
docker run --rm -v "c:\Projeler\beaver:/workspace" -w /workspace maven:3.8-eclipse-temurin-17-alpine mvn clean package -DskipTests -pl integrations/chirpstack-integration -am
```

**Beklenen:** `integrations/chirpstack-integration/target/chirpstack-integration-*-shaded.jar` (veya benzeri) oluşur.

### 2.2 Test payload'ları

- `integrations/chirpstack-integration/src/test/resources/chirpstack-up.json`  
  ChirpStack `up` (uplink) örnek JSON.
- `chirpstack-join.json`  
  ChirpStack `join` örnek JSON.

## 3. Docker Ortamı Testleri

### 3.1 Docker build (API + Web + Monolith)

```powershell
cd c:\Projeler\beaver-iot-docker\build-docker
# .env oluştur (README'deki gibi)
docker compose build --no-cache api web monolith
```

**Beklenen:** `milesight/beaver-iot-api`, `milesight/beaver-iot-web`, `milesight/beaver-iot` (veya `monolith`) image'ları build edilir.

### 3.2 Integrations volume hazırlığı

```powershell
cd c:\Projeler\beaver-iot-docker
.\scripts\prepare-chirpstack.ps1
```

**Beklenen:** `examples/target/chirpstack/integrations/` altında `chirpstack-integration-*.jar` bulunur.

### 3.3 ChirpStack compose ile çalıştırma

```powershell
cd c:\Projeler\beaver-iot-docker\examples
# CHIRPSTACK_DEFAULT_TENANT_ID boş bırakılabilir; X-Tenant-Id ile test edilecek.
docker compose -f chirpstack.yaml up -d
docker compose -f chirpstack.yaml logs -f monolith
```

**Beklenen:** Container ayağa kalkar, logda `ChirpStack HTTP integration started` ve benzeri mesajlar görülür.  
Port **8080** (veya 8080 meşgulse **9080**, `chirpstack.yaml` port map'e göre) üzerinden erişim.

## 4. Webhook Entegrasyon Testleri

### 4.1 Tenant yok → 400

```powershell
curl -s -o NUL -w "%{http_code}" -X POST "http://localhost:8080/public/integration/chirpstack/webhook?event=up" -H "Content-Type: application/json" -d "{}"
# Beklenen: 400
```

### 4.2 Uplink (event=up) + X-Tenant-Id → 200

```powershell
curl -s -w "\nHTTP %{http_code}" -X POST "http://localhost:8080/public/integration/chirpstack/webhook?event=up" `
  -H "Content-Type: application/json" `
  -H "X-Tenant-Id: default" `
  -d "@c:\Projeler\beaver\integrations\chirpstack-integration\src\test\resources\chirpstack-up.json"
```

**Beklenen:** HTTP 200, body `ok`. Cihaz yoksa logda "device not found" benzeri mesaj; varsa `online` ve uplink log'u.

### 4.3 Join (event=join) + X-Tenant-Id → 200

```powershell
curl -s -w "\nHTTP %{http_code}" -X POST "http://localhost:8080/public/integration/chirpstack/webhook?event=join" `
  -H "Content-Type: application/json" `
  -H "X-Tenant-Id: default" `
  -d "@c:\Projeler\beaver\integrations\chirpstack-integration\src\test\resources\chirpstack-join.json"
```

**Beklenen:** HTTP 200, body `ok`. Logda "ChirpStack join: devEui=..." görülür.

### 4.4 Status (event=status) + X-Tenant-Id → 200, battery/margin entity güncellemesi

ChirpStack `event=status` ile `batteryLevel` ve `margin` gönderir. Bu veriler parse edilip ilgili cihazın **battery** ve **margin** entity'lerine yazılır; widget'lar (örn. Battery, Signal Quality) bu entity'leri kullanabilir.

```powershell
curl -s -w "\nHTTP %{http_code}" -X POST "http://localhost:9080/public/integration/chirpstack/webhook?event=status" `
  -H "Content-Type: application/json" `
  -H "X-Tenant-Id: default" `
  -d "@c:\Projeler\beaver\integrations\chirpstack-integration\src\test\resources\chirpstack-status.json"
```

**Beklenen:** HTTP 200, body `ok`. Cihaz yoksa logda "device not found"; varsa logda "ChirpStack status: saved entity values devEui=... keys=[battery, margin]". UI → Device → ilgili cihaz → Entity Data'da **Battery** (örn. 88.3) ve **Margin** (örn. 10) güncellenir.

### 4.5 Otomatik smoke test

```powershell
cd c:\Projeler\beaver-iot-docker\scripts
.\test-webhook.ps1 -BaseUrl "http://localhost:9080" -TenantId "default"
# 8080 kullanıyorsan: -BaseUrl "http://localhost:8080"
```

## 5. Cihaz ekleme (UI)

**Amaç:** Device → Add → ChirpStack HTTP ile form görünmeli, DevEUI girilip Confirm'da 200 dönmeli, cihaz oluşmalı.

### 5.1 Ön koşul

- `chirpstack.yaml` ile stack ayakta; `CHIRPSTACK_DEFAULT_TENANT_ID` veya login tenant'ı belli.
- Tarayıcıda `http://localhost:9080` (veya 8080) → Beaver UI'a giriş yapılmış.

### 5.2 Adımlar

1. **Device** → **+ Add**.
2. **Integration** dropdown'dan **ChirpStack HTTP** seç → **Confirm**.
3. **Beklenen:** İkinci modal/form açılır: **Device Name** + **External Device ID (DevEUI)**.
4. Device Name: örn. `LoRa-01`; DevEUI: örn. `0101010101010101` (16 hex) → **Confirm**.
5. **Beklenen:** HTTP 200, `api/v1/device` 400 dönmez; cihaz listede görünür.
6. (Opsiyonel) Aynı DevEUI ile webhook `event=up` gönder → cihaz **online** olmalı.

### 5.3 Sorun giderme

- **Form açılmıyor / 400:** Handler `CALL_SERVICE` ile dinliyor mu kontrol et; JAR yeniden build + container restart.
- **Integration → ChirpStack HTTP "No Data":** Bağlantı ayarı yok; cihaz ekleme Device menüsünden yapılır.

### 5.4 Sıcaklık / nem (Entity Data)

Cihaz eklendikten sonra **Temperature** ve **Humidity** Entity Data’da görünür. Değerler, uplink payload’ında `object` (veya `data` base64 JSON) ile gelmelidir.

1. Cihazı **5.2** ile ekleyin (DevEUI = `0101010101010101` veya test cihazınız).
2. Uplink’i `object` ile gönderin:

```powershell
curl -s -w "\nHTTP %{http_code}" -X POST "http://localhost:9080/public/integration/chirpstack/webhook?event=up" `
  -H "Content-Type: application/json" `
  -H "X-Tenant-Id: default" `
  -d "@c:\Projeler\beaver\integrations\chirpstack-integration\src\test\resources\chirpstack-up-with-object.json"
```

3. **Beklenen:** HTTP 200. Beaver UI → **Device** → ilgili cihaz → **Entity Data** → **PROPERTY**: **Temperature**, **Humidity** ve son değerler (örn. 23.5 °C, 65 %) görünür.

**ChirpStack tarafı:** Payload codec çıktısı `object` olarak gelmeli (örn. `{"temperature": 23.5, "humidity": 65}`). Alternatif: `data` alanı, bu JSON’un base64’ü olabilir.

### 5.5 Çoklu telemetri

Desteklenen tipler: **Temperature**, **Humidity**, **CO2**, **Pressure**, **Battery**, **PM2.5**, **PM10**, **Luminosity**, **Voltage**, **RSSI**, **SNR**, **Margin**. Her biri için birden fazla payload anahtarı ve büyük/küçük harf duyarsız eşleme. Test: `chirpstack-up-multi-telemetry.json` ile aynı curl komutunu çalıştırın (`-d "@...chirpstack-up-multi-telemetry.json"`).

### 5.6 Status event → Battery / Margin (widget telemetrisi)

- **Uplink (`event=up`):** `object` + `rxInfo` → temperature, humidity, rssi, snr vb. entity'lere yazılır.
- **Status (`event=status`):** `batteryLevel` → **battery**, `margin` → **margin** entity'lerine yazılır. `batteryLevelUnavailable: true` ise battery kaydedilmez.

Cihaz ekledikten sonra status event gönderin (`chirpstack-status.json`). Dashboard'da **Battery** veya **Signal Quality** (margin) widget'ı ekleyip ilgili entity'yi seçin; ChirpStack'ten status geldikçe değerler güncellenir.

## 6. Log Kontrolü

- **Beaver API / monolith log'ları:**  
  `ChirpStack webhook`, `ChirpStack uplink`, `ChirpStack join`, `ChirpStack add_device: created device`, `device not found`, `tenant not configured` vb. mesajlar.
- **Hata:**  
  `ChirpStack webhook error`, stack trace varsa controller/service tarafında incelenmeli.

## 7. Kısa Kontrol Listesi

| Adım | Beklenen |
|------|----------|
| Maven build (chirpstack-integration) | JAR oluşur |
| Docker build (api, web, monolith) | Image'lar oluşur |
| prepare-chirpstack | JAR examples target'a kopyalanır |
| chirpstack.yaml up | Container ayakta, 9080 (veya 8080) açık |
| POST webhook, tenant yok | 400 |
| POST webhook, X-Tenant-Id + up/join/status | 200, log'da ilgili mesajlar |
| Device → Add → ChirpStack HTTP | Form (Device Name, DevEUI) açılır |
| Form doldurup Confirm | 200, cihaz oluşur; api/v1/device 400 dönmez |
| Uplink + object (temp/hum) | 200; Entity Data’da Temperature, Humidity güncellenir |
| Status + battery/margin | 200; Entity Data'da Battery, Margin güncellenir; widget'larda kullanılabilir |
