# Beaver IoT – Proje İnceleme ve ChirpStack v4 HTTP Entegrasyonu Raporu

**Tarih:** 24 Ocak 2025  
**Proje:** Beaver IoT Integrations (`beaver`)

---

## 1. Proje Özeti

### 1.1 Genel Bilgi

| Özellik | Değer |
|--------|--------|
| **Proje** | Beaver IoT Integrations |
| **Sağlayıcı** | Milesight |
| **Repositori** | https://github.com/milesight-iot/beaver-iot-integrations |
| **Lisans** | MIT |
| **Teknoloji** | Java 17, Maven, Spring Boot |
| **Beaver IoT sürümü** | 1.3.0 |

Beaver IoT, üçüncü taraf servisler, cihazlar ve platformlarla etkileşim için **entegrasyonlar** kullanır. Entegrasyonlar cihaz bağlantısı, cihaz kontrolü ve özellik genişletmesi sağlar.

### 1.2 Proje Yapısı

```
beaver/
├── pom.xml                    # Ana POM (beaver-iot-integrations)
├── integrations/
│   ├── pom.xml                # Entegrasyonlar parent
│   ├── sample-integrations/   # Örnek (my-integration)
│   ├── ping/                  # Basit ping entegrasyonu
│   ├── msc-integration/       # Milesight Developer Platform (webhook)
│   ├── ollama-integration/    # Ollama API
│   ├── milesight-gateway/     # Milesight Gateway
│   ├── camthink-ai-inference/ # CamThink AI
│   └── mqtt-device/           # MQTT cihaz (topic → cihaz verisi)
```

### 1.3 Entegrasyon Bileşenleri

Her entegrasyonda tipik olarak:

- **`integration.yaml`**: Ad, açıklama, ikon, `entity-identifier-add-device` / `delete-device`
- **Bootstrap**: `IntegrationBootstrap` implementasyonu (`onPrepared`, `onStarted`, `onDestroy`, `onEnabled`)
- **Controller**: REST API (`@RestController`, `@RequestMapping("/{integration-id}")`)
- **Service**: İş mantığı, `DeviceServiceProvider`, `EntityValueServiceProvider` vb. kullanımı
- **Entity**: `@IntegrationEntities`, `@Entity` ile add/delete device ve diğer servisler

---

## 2. Mevcut Entegrasyon Desenleri

### 2.1 MQTT Device Entegrasyonu

- **Amaç:** MQTT topic’lerinden gelen veriyi cihaz verisi olarak işlemek.
- **Akış:** `MqttPubSubServiceProvider` ile `mqtt-device/#` subscribe → topic → device template eşlemesi → `DeviceTemplateParserProvider.input()` → cihaz kaydı / `entityValueServiceProvider.saveValuesAndPublishAsync` + `deviceStatusServiceProvider.online`.
- **Cihaz kimliği:** Topic’ten template çıkarılır; `device_id` template/JSON’dan gelir.

### 2.2 MSC Integration (Webhook)

- **Amaç:** Milesight Developer Platform webhook’larından cihaz verisi almak.
- **Endpoint:** `POST /public/integration/msc/webhook`
- **Özellikler:**
  - Header’lar: `x-msc-request-signature`, `x-msc-webhook-uuid`, `x-msc-request-timestamp`, `x-msc-request-nonce`
  - Body: `List<WebhookPayload>` (JSON)
  - İmza doğrulama, tenant context, `DEVICE_DATA` event’i → `handleDeviceData` → `MscDataSyncService.saveHistoryData` veya cihaz durumu güncelleme.

Bu yapı, **dış sistemden HTTP POST ile veri alan** bir entegrasyon için doğrudan referans oluşturuyor.

### 2.3 Diğerleri

- **Ollama:** Harici API client (Ollama), Bootstrap’ta `init`.
- **Milesight Gateway:** MQTT + REST; gateway ekleme, cihaz senkronizasyonu.
- **CamThink AI:** Model/cihaz arama, bind/unbind vb.

---

## 3. ChirpStack v4 HTTP Entegrasyonu

### 3.1 ChirpStack Tarafı

- **Protokol:** ChirpStack, HTTP Integration ile **POST** isteği gönderir.
- **URL:** Entegrasyon ayarında tanımlı event endpoint (veya virgülle ayrılmış birden fazla URL).
- **Event parametresi:** `event` query parametresi ile event tipi verilir.
- **Body:** JSON (Protobuf JSON eşlemesi) veya binary Protobuf.
- **Event tipleri:** `up`, `join`, `status`, `ack`, `txack`, `log`, `location`, `integration`.

Örnek event tipleri ve anlamları:

| Event | Açıklama |
|-------|----------|
| `up` | Uplink (cihazdan gelen veri) |
| `join` | Cihaz ağa join oldu |
| `status` | Batarya / margin bilgisi |
| `ack` | Confirm downlink ACK/NACK |
| `txack` | Downlink gateway’e iletildi |
| `log` | Log / hata |
| `location` | Konum çözümlemesi |
| `integration` | Özel entegrasyon (örn. Loracloud) |

**Uplink (`up`) örnek JSON (özü):**

```json
{
  "deduplicationId": "...",
  "time": "2022-07-18T09:34:15.775023242+00:00",
  "deviceInfo": {
    "tenantId": "...",
    "applicationId": "...",
    "deviceName": "Test device",
    "devEui": "0101010101010101",
    ...
  },
  "devAddr": "00189440",
  "fPort": 1,
  "data": "qg==",
  "rxInfo": [...],
  "txInfo": {...}
}
```

`integration.proto` ile tam şema tanımlı; Java tarafında `io.chirpstack.api.integration` paketi kullanılabilir.

---

## 4. ChirpStack v4 HTTP Entegrasyonu Eklenebilir mi?

### 4.1 Sonuç: **Evet, eklenebilir**

Gerekçeler:

1. **HTTP webhook deseni:** MSC entegrasyonu zaten `/public/integration/msc/webhook` ile HTTP POST alıyor. ChirpStack için benzer bir **public webhook** (örn. `/public/integration/chirpstack/webhook`) tanımlanabilir.
2. **Event tabanlı yapı:** ChirpStack `event` query parametresi ile tip veriyor; switch/case veya ayrı handler’larla `up`, `join`, `status` vb. ayrıştırılabilir.
3. **JSON desteği:** ChirpStack JSON formatı kullanılabildiği için, Protobuf zorunlu değil; Jackson ile DTO’lar yazılıp doğrudan parse edilebilir.
4. **Cihaz kimliği:** `deviceInfo.devEui` (ve istenirse `applicationId` / `deviceName`) Beaver cihaz identifier’ı ile eşlenebilir.
5. **Veri akışı:** Uplink `data` (base64) + `rxInfo` / `txInfo` vb. → Device Template / TSL mantığına uygun bir formata dönüştürülüp `EntityValueServiceProvider` veya MSC’deki gibi bir “history data” servisi ile saklanabilir.

### 4.2 Uyumluluk Özeti

| Konu | Beaver tarafı | ChirpStack tarafı | Uyum |
|------|----------------|-------------------|------|
| Veri girişi | HTTP POST webhook (MSC örneği) | HTTP POST + `?event=...` | ✅ |
| Format | JSON (MSC), özel DTO | JSON (Protobuf JSON) | ✅ |
| Cihaz ID | `identifier` + integration | `devEui` | ✅ Eşleme yapılabilir |
| Tenant | `TenantContext` | `deviceInfo.tenantId` / `applicationId` | ⚠️ Eşleme tasarlanmalı |
| Auth | MSC: header imza | ChirpStack: yok (opsiyonel) | ⚠️ Opsiyonel auth eklenmeli |

---

## 5. Önerilen Mimari

### 5.1 Yeni Modül: `chirpstack-integration`

- **Konum:** `integrations/chirpstack-integration/`
- **Modül:** `integrations/pom.xml` içine `<module>chirpstack-integration</module>` eklenir.

### 5.2 Bileşenler

| Bileşen | Açıklama |
|--------|----------|
| **`integration.yaml`** | `chirpstack-integration` için ad, açıklama, ikon, add/delete device entity identifier’ları |
| **`ChirpstackBootstrap`** | `IntegrationBootstrap`; gerekirse webhook enable/disable, config yükleme |
| **`ChirpstackWebhookController`** | `POST /public/integration/chirpstack/webhook?event=up|join|...` endpoint’i |
| **`ChirpstackWebhookService`** | Event’e göre branch, ChirpStack JSON parse, cihaz eşleme, veri kaydetme |
| **DTO’lar** | `UplinkEvent`, `JoinEvent`, `StatusEvent`, `DeviceInfo` vb. (ChirpStack JSON’a uygun) |
| **Entity** | Gerekirse connection/config (örn. webhook URL, API key) ve add/delete device |

### 5.3 Akış (Özet)

1. ChirpStack, HTTP Integration’da **event url** olarak `https://<beaver-host>/public/integration/chirpstack/webhook` (veya path’e `?event=...` eklenmiş hali) tanımlar.
2. Olay oluşunca ChirpStack, `event` query parametresi ile POST atar.
3. `ChirpstackWebhookController` isteği alır, `event`’e göre `ChirpstackWebhookService`’e yönlendirir.
4. Service:
   - JSON’u ChirpStack DTO’larına parse eder.
   - `deviceInfo.devEui` (ve varsa `applicationId`) ile tenant + cihaz eşlemesi yapar.
   - **`up`:** Uplink verisini (base64 `data`, `fPort`, `rxInfo` vb.) Beaver formatına çevirir; cihaz yoksa “add device” akışı veya template eşlemesi; sonra `EntityValueServiceProvider` veya MSC benzeri history servisi ile kayıt.
   - **`join`:** Cihaz join bilgisini loglar / gerekirse cihaz durumu günceller.
   - **`status`:** Batarya/margin → entity veya durum güncellemesi.
   - **`ack` / `txack` / `log` / `location`:** İhtiyaca göre loglama veya hafif metadata saklama.

### 5.4 Tenant Çözümlemesi

MSC webhook’ta `TenantContext` kullanılıyor; fakat public endpoint’te tenant’ın nereden geldiği (path, header, API key) net değil. ChirpStack için öneriler:

- **A) Application-based:** `deviceInfo.applicationId` → Beaver tenant (veya integration instance) ile konfigürasyondan eşleme.
- **B) API key / shared secret:** Webhook URL’de token veya header’da özel bir anahtar; config’de tenant ile eşlenir.
- **C) Tek tenant:** Tüm ChirpStack verisi tek tenant’ta toplanır.

Tercih, Beaver’ın mevcut çok-tenant modeline göre netleştirilmeli.

### 5.5 Opsiyonel: Downlink

ChirpStack’te downlink, **Application Server API** (REST) ile kuyruğa alınır. Örneğin:

```
POST /api/devices/{devEui}/queue
Authorization: Bearer <API TOKEN>
Body: { "deviceQueueItem": { "confirmed": false, "data": "AQID", "fPort": 10 } }
```

İhtiyaç olursa, Beaver’dan “cihaza komut gönder” akışı için ayrı bir **ChirpstackDownlinkService** veya benzeri servis yazılıp, ChirpStack API’yi çağıracak şekilde tasarlanabilir. Bu, ilk aşamada zorunlu değildir; önce uplink/webhook odağı yeterlidir.

---

## 6. Bağımlılıklar ve Teknik Notlar

### 6.1 Bağımlılıklar

- **`beaver-iot` context** (ve gerekirse scheduler): `provided`, mevcut entegrasyonlar gibi.
- **ChirpStack Java API:** İstenirse `io.chirpstack:chirpstack-api` veya sadece `integration.proto`’dan üretilen sınıflar; **veya** yalnızca Jackson ile kendi DTO’larınız (daha hafif).
- **Maven:** Java 17, mevcut parent POM ile uyumlu.

### 6.2 Güvenlik

- Public webhook için **opsiyonel doğrulama** (ör. shared secret, Bearer token) eklenmeli.
- ChirpStack varsayılan olarak böyle bir auth göndermez; header’da custom bir key beklenip config’den kontrol edilebilir.

### 6.3 Device Template / Payload Formatı

- ChirpStack uplink `data` alanı **base64** binary.
- Bu veri, Device Template’deki TSL (property/event) yapısına uyacak şekilde **codec** veya basit bir dönüşüm katmanı ile işlenebilir.
- Örn. fPort’a göre farklı “sensor” grupları, raw payload’ı JSON property’lere map etme vb.

---

## 7. Yapılacaklar Özeti

1. **`integrations/chirpstack-integration`** modülünü oluştur; `pom.xml`, `integration.yaml`, paket yapısı.
2. **ChirpStack event DTO’ları** (Uplink, Join, Status, DeviceInfo, vb.) tanımla veya ChirpStack API’den al.
3. **`ChirpstackWebhookController`** ile `POST /public/integration/chirpstack/webhook?event=...` ekle.
4. **`ChirpstackWebhookService`** ile event dispatch, parse, cihaz eşleme ve veri kaydetme akışını uygula.
5. **Tenant çözümlemesi** için strateji seç (applicationId / API key / tek tenant) ve config entity’leri gerekirse ekle.
6. **Add/delete device** entity’leri ve event handler’ları (MQTT/MSC örneklerine benzer) ekle.
7. **(İsteğe bağlı)** Downlink için ChirpStack REST API client ve servis tasarla.
8. **(İsteğe bağlı)** Webhook auth (shared secret / token) ekle.

---

## 8. Sonuç

- **Proje:** Beaver IoT, entegrasyon odaklı, modüler ve HTTP webhook (MSC) ile uyumlu bir yapıya sahip.
- **ChirpStack v4 HTTP Integration:** Event tabanlı POST, JSON body ve `devEui` odaklı cihaz modeli Beaver’ın cihaz/entity modeli ile uyumlu.
- **Değerlendirme:** ChirpStack v4 HTTP entegrasyonu bu projeye **eklenebilir**. MSC webhook ve MQTT-device desenleri referans alınarak `chirpstack-integration` modülü tasarlanabilir; önce uplink (`up`) ve temel event’ler, ardından tenant stratejisi ve isteğe bağlı downlink ile genişletilebilir.

---

*Rapor, mevcut koda ve ChirpStack v4 dokümantasyonuna dayanmaktadır.*
