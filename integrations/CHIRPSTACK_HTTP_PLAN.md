# ChirpStack v4 HTTP Integration – Uygulama Planı (Token/Şifre Yok)

> **Güncel plan:** Docker + tüm repolar için **[PLAN_BEAVER_DOCKER_CHIRPSTACK_V4.md](./PLAN_BEAVER_DOCKER_CHIRPSTACK_V4.md)** kullanın. Bu dosya sadece entegrasyon modülü ve webhook detaylarına odaklanır.

**Hedef:** ChirpStack v4 HTTP Integration ile Beaver’a uplink/event almak. **Token veya şifre kullanılmaz.**

---

## 1. Git / Repo Ayarları

- [x] `git init`
- [x] `origin` → `https://github.com/rifatsekerariot/beaver-iot-integrations.git`
- [x] `main` branch
- İsteğe bağlı: `upstream` → Milesight orijinal repo (güncellemeler için)

---

## 2. ChirpStack Entegrasyonu – Kapsam

| Özellik | Durum |
|--------|--------|
| Token / şifre / imza doğrulama | **Yok** |
| Public webhook endpoint | **Var** |
| Event: `up` (uplink) | **Desteklenir** |
| Event: `join`, `status`, `ack`, `txack`, `log`, `location` | **Loglanır / ileride genişletilir** |
| Tenant çözümlemesi | **X-Tenant-Id** header (opsiyonel) veya **env** `CHIRPSTACK_DEFAULT_TENANT_ID` |

---

## 3. Modül Yapısı

```
integrations/chirpstack-integration/
├── pom.xml
├── src/main/
│   ├── java/.../chirpstack/
│   │   ├── ChirpstackIntegrationBootstrap.java
│   │   ├── constant/ChirpstackConstants.java
│   │   ├── controller/ChirpstackWebhookController.java  (public, no auth)
│   │   ├── model/DeviceInfo.java, UplinkEvent.java, JoinEvent.java, ...
│   │   └── service/ChirpstackWebhookService.java
│   └── resources/
│       ├── integration.yaml
│       └── static/public/chirpstack-logo.svg
```

---

## 4. Endpoint ve Akış

- **URL:** `POST /public/integration/chirpstack/webhook`
- **Query:** `event=up|join|status|ack|txack|log|location|integration`
- **Body:** JSON (ChirpStack Protobuf JSON eşlemesi)
- **Header (opsiyonel):** `X-Tenant-Id` → tenant çözümlemesi (gizli değil, sadece tenant seçimi)
- **Auth:** Yok.

Akış:

1. Controller isteği alır → `event` query’den okunur.
2. Tenant: `X-Tenant-Id` varsa kullan; yoksa `CHIRPSTACK_DEFAULT_TENANT_ID` env. İkisi de yoksa 400.
3. Service: `event`’e göre body parse edilir (DTO’lar).
4. **`up`:** `devEui` ile cihaz aranır; bulunursa uplink verisi (data, fPort, rssi, snr, …) kaydedilir.
5. Diğer event’ler: loglama (ileride gerekirse genişletilir).

---

## 5. Yapılacaklar Özeti

1. [x] Git init, origin = rifatsekerariot fork
2. [ ] `integrations/pom.xml` → `chirpstack-integration` modülü ekle
3. [ ] `chirpstack-integration` pom, `integration.yaml`, logo
4. [ ] DTO’lar: `DeviceInfo`, `UplinkEvent`, `JoinEvent`, `StatusEvent` (ChirpStack JSON’a uygun)
5. [ ] `ChirpstackWebhookController`: POST webhook, no auth
6. [ ] `ChirpstackWebhookService`: event dispatch, tenant çözümleme, uplink işleme
7. [ ] `ChirpstackIntegrationBootstrap`: minimal (onStarted / onDestroy)
8. [ ] Cihaz bulunamazsa log + skip (add-device akışı ileride eklenebilir)

---

## 6. ChirpStack Tarafı Ayarları

ChirpStack HTTP Integration’da:

- **Event endpoint URL:** `https://<beaver-host>/public/integration/chirpstack/webhook`
- **Encoding:** JSON
- **Token / header:** Kullanılmayacak.

Event URL’lerde `?event=...` eklenmez; ChirpStack kendi query parametresi ile gönderir. Dokümana göre `event` query’de gelir.

---

*Plan tarihi: 24 Ocak 2025*
