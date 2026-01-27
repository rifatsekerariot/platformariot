# Beaver IoT + Herhangi Bir ChirpStack – Bağlantı ve Çalıştırma Rehberi

Bu rehber, **Beaver IoT** ile **ChirpStack v4 HTTP Integration** kullanarak herhangi bir ChirpStack sunucusunu bağlamanızı ve projeyi ayağa kaldırmanızı adım adım anlatır.

---

## Özet

1. **Beaver IoT + ChirpStack entegrasyonu** Docker’da çalışır.
2. ChirpStack, **HTTP Integration** ile **webhook URL’ine** `POST` atar (`?event=up`, `?event=join` vb.).
3. **Token/şifre yok**; tenant için **`CHIRPSTACK_DEFAULT_TENANT_ID`** (veya isteğe bağlı `X-Tenant-Id` header) kullanılır.

---

## Bölüm 1: Projeyi Ayağa Kaldırma

### Gereksinimler

- **Docker Desktop** kurulu ve çalışıyor.
- **Git** ile `beaver` (integrations) ve `beaver-iot-docker` repoları mevcut.
- İsteğe bağlı: **Maven 3.8+** ve **JDK 17** (yoksa build Docker ile yapılır).

---

### Adım 1.1: ChirpStack integration JAR’ını derle ve kopyala

**Maven varsa:**

```powershell
cd c:\Projeler\beaver
mvn clean package -DskipTests -pl integrations/chirpstack-integration -am
```

**Maven yoksa (Docker ile):**

```powershell
cd c:\Projeler\beaver
docker run --rm -v "c:\Projeler\beaver:/workspace" -w /workspace maven:3.8-eclipse-temurin-17-alpine mvn clean package -DskipTests -pl integrations/chirpstack-integration -am
```

**JAR’ı Docker volume dizinine kopyala:**

```powershell
New-Item -ItemType Directory -Force -Path "c:\Projeler\beaver-iot-docker\examples\target\chirpstack\integrations" | Out-Null
Copy-Item "c:\Projeler\beaver\integrations\chirpstack-integration\target\chirpstack-integration-*.jar" "c:\Projeler\beaver-iot-docker\examples\target\chirpstack\integrations\" -Exclude "*original*"
```

**Veya tek komutla (prepare script):**

```powershell
cd c:\Projeler\beaver-iot-docker
.\scripts\prepare-chirpstack.ps1
```

---

### Adım 1.2: Beaver Docker image’ları (ilk seferde)

`milesight/beaver-iot:latest` henüz yoksa:

```powershell
cd c:\Projeler\beaver-iot-docker\build-docker
Copy-Item .env.example .env   # gerekirse .env içindeki repo/branch’leri düzenle
docker compose build --no-cache api
docker compose build --no-cache web
docker compose build --no-cache monolith
```

---

### Adım 1.3: ChirpStack compose ile Beaver’ı çalıştır

```powershell
cd c:\Projeler\beaver-iot-docker\examples
docker compose -f chirpstack.yaml up -d
```

**Widget entegrasyonu (Alarm / Map / Device List):** Bu üç widget “Add widget” listesinde görünsün ve **local** `beaver-iot-web` ile Docker çalışsın isterseniz, tek komutla hazırlık + build + compose için [`ENTEGRASYON_WIDGET_DOCKER.md`](./ENTEGRASYON_WIDGET_DOCKER.md) ve `.\scripts\run-with-local-web.ps1` kullanın.

**Veya** JAR + compose’u tek seferde:

```powershell
cd c:\Projeler\beaver-iot-docker
.\scripts\up-chirpstack.ps1
```

- HTTP: **9080** (veya `chirpstack.yaml`’daki port map’e göre 8080)
- MQTT: **1883**, WebSocket: **8083**

**Log kontrolü:**

```powershell
docker compose -f chirpstack.yaml logs -f monolith
```

`ChirpStack HTTP integration started (webhook: POST /public/integration/chirpstack/webhook)` satırını görene kadar bekleyin (yaklaşık 1–2 dakika).

---

### Adım 1.4: Beaver’da tenant ID’yi belirle

ChirpStack’ten gelen istekler **Beaver tenant**’ına bağlanır. Tenant ID şu yollardan biriyle bulunur:

1. **Beaver UI:** `http://localhost:9080` (veya kullandığınız port) → Giriş yap → **Organizasyon / Tenant** ayarlarından ID’yi kopyalayın (genelde UUID).
2. **Geliştirme ortamı:** Çoğu kurulumda `default` tenant vardır; önce `default` deneyebilirsiniz.

Bu ID’yi **Bölüm 2**’de ChirpStack’e bağlarken kullanacaksınız.

---

## Bölüm 2: ChirpStack’i Beaver’a Bağlama

ChirpStack v4 **HTTP Integration**, yapılandırdığınız **Event endpoint URL**’e `POST` isteği atar. Bu URL, Beaver’daki ChirpStack webhook’u olacak.

---

### Adım 2.1: Webhook URL’ini hazırla

Format:

```
http://<BEAVER_HOST>:<PORT>/public/integration/chirpstack/webhook
```

| Ortam | Örnek |
|--------|--------|
| Beaver ve ChirpStack aynı makinede | `http://localhost:9080/public/integration/chirpstack/webhook` |
| Beaver farklı sunucuda | `http://192.168.1.100:9080/public/integration/chirpstack/webhook` |
| Domain / reverse proxy | `https://beaver.example.com/public/integration/chirpstack/webhook` |

`<PORT>`: `chirpstack.yaml`’da **9080** (veya 8080) ile eşlenen port.

---

### Adım 2.2: ChirpStack’te HTTP Integration ekle

1. ChirpStack web arayüzüne girin.
2. **Tenant** → **Application** → uygulamanızı seçin.
3. **Integrations** sekmesine gidin.
4. **HTTP** için **+** ile yeni entegrasyon ekleyin.
5. **Event endpoint URL(s)** alanına **webhook URL**’ini yazın:
   - Örnek: `http://192.168.1.100:9080/public/integration/chirpstack/webhook`
6. **Payload encoding:** **JSON** seçin (Beaver JSON kabul eder).
7. Kaydedin.

ChirpStack, `?event=up`, `?event=join`, `?event=status` vb. ile bu URL’e `POST` atar. **Ek header (ör. `X-Tenant-Id`) göndermez**; bu yüzden Beaver tarafında **varsayılan tenant** kullanılır.

---

### Adım 2.3: Beaver’da varsayılan tenant’ı ayarla

`chirpstack.yaml` içinde **`CHIRPSTACK_DEFAULT_TENANT_ID`** environment değişkenini, **Adım 1.4**’te bulduğunuz tenant ID ile doldurun:

```yaml
environment:
  # ...
  - "CHIRPSTACK_DEFAULT_TENANT_ID=<BEAVER_TENANT_ID>"
```

Örnek:

```yaml
- "CHIRPSTACK_DEFAULT_TENANT_ID=default"
# veya UUID:
- "CHIRPSTACK_DEFAULT_TENANT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

Değişiklikten sonra container’ı yeniden başlatın:

```powershell
cd c:\Projeler\beaver-iot-docker\examples
docker compose -f chirpstack.yaml up -d
```

Bundan sonra ChirpStack’ten gelen tüm webhook istekleri bu tenant’a işlenir.

---

### Adım 2.4: Webhook’tan gelen cihazları Beaver’da ekleme

Webhook’a **join** / **uplink** gönderen cihazların Beaver’da görünmesi için **önce cihazı eklemeniz** gerekir:

1. **Beaver UI** → **Device** → **+ Add**.
2. **Integration** olarak **ChirpStack HTTP** seçin → **Confirm**.
3. Açılan formda:
   - **Device Name:** İstediğiniz ad (örn. `LoRa-01`).
   - **External Device ID (DevEUI):** ChirpStack’teki cihazın **DevEUI**’si (16 hex karakter, örn. `0101010101010101`). Webhook payload’ındaki `deviceInfo.devEui` ile **birebir aynı** olmalı.
4. **Confirm** ile kaydedin.

Bu cihaz kaydedildikten sonra ChirpStack **uplink** gönderdiğinde webhook cihazı bulur ve **online** işaretler. DevEUI eşleşmezse webhook cihazı atlar (`device not found` log’da görülür).

**Telemetri (Entity Data):** Yeni eklenen ChirpStack cihazları için çok sayıda property tanımlıdır: **Temperature**, **Humidity**, **CO2**, **Pressure**, **Battery**, **PM2.5**, **PM10**, **Luminosity**, **Voltage**, **RSSI**, **SNR**. (Eski cihazlarda yoktur; gerekirse silip yeniden ekleyin.) Değerlerin **Device → Entity Data → PROPERTY**'de görünmesi için uplink'ta decode edilmiş veri gerekir: ChirpStack **payload codec** çıktısı `object` (örn. `{"temperature": 23.5, "humidity": 65, "co2": 412}`) veya `data` = bu JSON'un base64'ü. Desteklenen anahtarlar ve eş anlamlılar: `temperature`/`temp`, `humidity`/`hum`/`rh`, `co2`/`carbonDioxide`, `pressure`/`barometricPressure`/`press`, `battery`/`batteryLevel`/`bat`, `pm25`/`pm2.5`, `pm10`, `luminosity`/`light`/`lux`/`illuminance`, `voltage`/`volt`, `rssi`, `snr`. Anahtar eşlemesi büyük/küçük harf duyarsızdır.

**Not:** Önce cihazı Beaver'da ekleyin, sonra ChirpStack'te join/uplink gelsin. Otomatik cihaz oluşturma şu an yok.

**Integration → ChirpStack HTTP “No Data”:** Bu entegrasyonda bağlantı ayarı yok (yalnızca webhook); Settings/Service sekmesinde “No Data” normaldir. Cihaz ekleme **Device** menüsünden yapılır.

---

## Bölüm 3: Bağlantıyı Doğrulama

### 3.1 Webhook test script’i (PowerShell)

Beaver çalışırken:

```powershell
cd c:\Projeler\beaver-iot-docker\scripts
.\test-webhook.ps1 -BaseUrl "http://localhost:9080" -TenantId "default"
```

- Tenant yok → **400**
- Uplink/join + `X-Tenant-Id` → **200** + `ok`

Port 8080 kullanıyorsanız: `-BaseUrl "http://localhost:8080"`

### 3.2 ChirpStack’ten gerçek veri

1. ChirpStack’te **HTTP Integration** kaydedilmiş ve **Event endpoint URL** doğru.
2. Cihaz **join** veya **uplink** gönderdiğinde ChirpStack webhook’a `POST` atar.
3. Beaver log’larında örneğin şunları görürsünüz:
   - `ChirpStack join: devEui=..., devAddr=...`
   - `ChirpStack uplink` vb.

**Log örneği:**

```powershell
docker logs beaver-iot 2>&1 | Select-String -Pattern "ChirpStack"
```

---

## Bölüm 4: Zero touch (Linux sunucuda tek komut)

**Linux sunucuda** Docker + Git dışında hiçbir şey kurmadan, **tek script** ile Beaver + ChirpStack’i ayağa kaldırmak için:

```bash
curl -sSL https://raw.githubusercontent.com/rifatsekerariot/beaver-iot-docker/main/scripts/deploy-zero-touch.sh | sudo sh -s -- --tenant-id "default"
```

Script: Docker (yoksa) kurar, Git (yoksa) kurar, repoları klonlar, ChirpStack JAR’ı build eder, `chirpstack.yaml` ile compose’u başlatır. Tenant ID `--tenant-id` ile verilir. **Sadece Linux** desteklenir.

**Detaylı adımlar ve cloud-init / VM örnekleri:**  
[beaver-iot-docker](https://github.com/rifatsekerariot/beaver-iot-docker) → **[ZERO_TOUCH_DEPLOY.md](https://github.com/rifatsekerariot/beaver-iot-docker/blob/main/ZERO_TOUCH_DEPLOY.md)**.

---

## Özet Tablo

| Adım | Ne yapılır? |
|------|--------------|
| 1 | ChirpStack integration JAR build + `target/chirpstack/integrations/` altına kopyala |
| 2 | Gerekirse `build-docker` ile API/Web/Monolith image’larını build et |
| 3 | `examples`’da `docker compose -f chirpstack.yaml up -d` |
| 4 | Beaver UI’dan tenant ID’yi al; `chirpstack.yaml`’da `CHIRPSTACK_DEFAULT_TENANT_ID` olarak set et |
| 5 | ChirpStack’te HTTP Integration → Event endpoint URL = `http://<beaver-host>:9080/public/integration/chirpstack/webhook` |
| 6 | `test-webhook.ps1` ile test et; ChirpStack cihazlarıyla uplink/join dene |

---

## Sık Karşılaşılanlar

| Sorun | Olası neden | Çözüm |
|--------|--------------|--------|
| **400 – tenant not configured** | Tenant ID yok | `CHIRPSTACK_DEFAULT_TENANT_ID` env’i set edin veya testte `X-Tenant-Id` header gönderin. |
| **404 / webhook bulunamıyor** | Port veya path yanlış | URL’in `.../public/integration/chirpstack/webhook` olduğundan ve port’un 9080/8080’e denk geldiğinden emin olun. |
| **ChirpStack’ten veri gelmiyor** | Integration / firewall | ChirpStack’te Event endpoint URL doğru mu? Beaver makinesine ChirpStack’in erişebildiği (firewall, ağ) kontrol edin. |
| **8080 kullanımda** | Başka uygulama | `chirpstack.yaml`’da HTTP port’u **9080:80** yapın; webhook URL’de de 9080 kullanın. |

---

## Kısa Komut Özeti

```powershell
# Build + kopyala
cd c:\Projeler\beaver-iot-docker
.\scripts\prepare-chirpstack.ps1

# Ayağa kaldır
.\scripts\up-chirpstack.ps1

# Test
.\scripts\test-webhook.ps1 -BaseUrl "http://localhost:9080" -TenantId "default"

# Log
docker logs beaver-iot -f
```

Bu adımlarla projeyi ayağa kaldırıp **herhangi bir ChirpStack v4** sunucusunu Beaver’a bağlayabilirsiniz.
