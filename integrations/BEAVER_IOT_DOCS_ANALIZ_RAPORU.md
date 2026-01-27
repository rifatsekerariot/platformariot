# beaver-iot-docs-main Analiz Raporu

**Tarih:** 2025-01-24  
**Kaynak:** `c:\Projeler\beaver-iot-docs-main` (Milesight Beaver IoT resmî dokümantasyonu)

---

## 1. Genel Bakış

`beaver-iot-docs-main`, **Beaver IoT** platformunun resmî dokümantasyon deposudur. [Docusaurus](https://docusaurus.io/) ile derlenen statik bir docs sitesi; canlı sürümü: [https://www.milesight.com/beaver-iot/](https://www.milesight.com/beaver-iot/).

- **Dil:** Çince (zh) ana dil; `i18n/en` altında İngilizce çeviriler.
- **Teknoloji:** Docusaurus 3.5, React 18, TypeScript, OpenAPI dokümantasyon eklentisi.
- **Çalıştırma:** `yarn` → `yarn start` (geliştirme), `yarn build` (statik build).

---

## 2. Klasör ve İçerik Yapısı

| Klasör | Açıklama |
|--------|----------|
| `docs/` | Ana dokümantasyon (user-guides, dev-guides). |
| `i18n/` | Çoklu dil; `en`, `zh` vb. `docs` yapısının kopyası. |
| `open-api/` | REST API OpenAPI spec ve ilgili dosyalar. |
| `src/` | Docusaurus özel bileşenler, sabitler, ana sayfa. |
| `static/` | Görseller (`/img/`), statik dosyalar. |
| `sidebars.ts` | `userGuideSidebar`, `devGuideSidebar` (otomatik üretim). |

---

## 3. Kullanıcı Kılavuzu (User Guides)

### 3.1 Giriş ve Kavramlar

- **Ürün tanıtımı (`introduction/index`):** Beaver IoT; cihaz yönetimi, veri toplama, dashboard, üçüncü taraf entegrasyon, Docker ile kurulum.
- **Temel kavramlar (`concepts`):**
  - **集成 (Integrasyon):** Üçüncü taraf servis/cihaz/platform ile etkileşim; örn. hava durumu, webhook, API.
  - **设备 (Cihaz):** Fiziksel veya mantıksal cihaz; bir integrasyona ait.
  - **实体 (Entity):** Veri taşıyıcı; üç tip:
    - **属性 (Property):** Durum/parametre; okuma‑yazma, geçmiş.
    - **事件 (Event):** Olay; geçmişte saklanır.
    - **服务 (Service):** İşlem (örn. cihaz ekleme/silme, benchmark).

### 3.2 Kurulum ve Kullanım

- **Kurulum (`installation`):** Docker 20.10+, `80` ve `1883` portları.  
  `docker run -d --name beaver-iot -v $(pwd):/root -p 80:80 -p 1883:1883 milesight/beaver-iot`  
  Yaklaşık 2 dakika sonra `http://[IP]` ile kayıt/giriş.
- **Hızlı başlangıç (`getting-started`):** Milesight geliştirme platformu + Webhook + cihaz senkronizasyonu + dashboard örneği.
- **Kullanıcı kılavuzu (`user-guide`):** Dashboard, cihaz, entity, integration, kişisel merkez, ayarlar, etiketler, kullanıcı/rol, iş akışı.

### 3.3 Yayımlanmış Entegrasyonlar (`published-integrations`)

Dokümante edilen entegrasyonlar:

| Entegrasyon | Açıklama |
|-------------|----------|
| **Milesight Development Platform** | Geliştirme platformu, Webhook, cihaz senkronu. |
| **MQTT Device Integrated** | MQTT cihazları; JSON template, topic, entity mapping. |
| **Milesight Gateway Embedded** | Gateway gömülü senaryolar. |
| **CamThink AI Inference** | AI çıkarım servisi. |

**Not:** **ChirpStack** resmî dokümanda yok. ChirpStack v4 HTTP entegrasyonu bizim projede `chirpstack-integration` ve `CHIRPSTACK_*` dokümanlarıyla ele alınıyor.

---

## 4. Geliştirici Kılavuzu (Dev Guides)

### 4.1 Backend – Temel Kavramlar

- **`key-dev-concept`:**
  - **identifier:** Nesne ID; namespace’e göre benzersiz (integration global, device integrasyon bazlı, entity device/integration bazlı). Karakterler: `A-Za-z0-9_@#$\-/[]:`.
  - **key (entity):**
    - Integration entity: `{integration-id}.integration.{entity-id}[.{sub-entity}]`
    - Device entity: `{integration-id}.device.{device-id}.{entity-id}[.{sub-entity}]`

### 4.2 Backend – Entegrasyon Geliştirme

- **Hızlı başlangıç (`build-integration`):**
  - Gereksinimler: Java 17, Maven, Git; `beaver-iot-integrations` ve isteğe bağlı `beaver-iot`.
  - `integration.yaml`, `IntegrationBootstrap`, `@IntegrationEntities`, `@DeviceTemplateEntities`, `@EventSubscribe`, HTTP controller.
  - Örnek: Ping tabanlı cihaz ekleme/silme, benchmark servisi, rapor event’i.
- **Entegrasyon yapısı (`integration-introduce`):** `integration.yaml` parametreleri (id, name, entity-identifier-add-device, entity-identifier-delete-device, icon-url vb.), `context` provided scope, `maven-shade-plugin` ile JAR.
- **Entity tanımı (`entity-definition`):** Annotation ile entity ve device template tanımlama.
- **Eventbus (`eventbus`):** `@EventSubscribe`, payload key, `CALL_SERVICE` / `REPORT_EVENT` vb.
- **REST API (`rest-api/`):** Çok sayıda `.api.mdx` ile endpoint dokümantasyonu (cihaz, entity, dashboard, kullanıcı, vb.).

### 4.3 Deployment

- **Docker Compose (`docker-compose`):**
  - **Monolith:** `milesight/beaver-iot:latest`, `80`, `1883`, `8083`; H2 veya Postgres.
  - **Ayrık:** nginx + `milesight/beaver-iot-web` + `milesight/beaver-iot-api`; isteğe bağlı Postgres.
- **Konteyner yapılandırması (`container-configuration`):**  
  API: `DB_TYPE`, `SPRING_DATASOURCE_*`, `MQTT_*`, `REDIS_*`, `/root/beaver-iot/integrations/`, `/root/beaver-iot/logs/`.  
  Web: `BEAVER_IOT_API_HOST`, `BEAVER_IOT_API_PORT`, `BEAVER_IOT_WEBSOCKET_PORT`.
- **Entegrasyon ekleme (`add-integration`):**  
  `beaver-iot/integrations/` altına `.jar` koyup `docker restart beaver-iot` ile yükleme.

### 4.4 Frontend

- **Giriş, dizin yapısı, quick-start:** React/TypeScript, bileşenler, tema.
- **Gelişmiş:** Mimari, dashboard, entegrasyon UI, yetkiler.

---

## 5. Proje Sabitleri (`src/consts.ts`)

- **Proje adı:** Beaver IoT.
- **Repolar:** `Milesight-IoT/beaver-iot`, `beaver-iot-integrations`, `beaver-iot-web`.
- **Örnek entegrasyon:** `beaver-iot/beaver-iot-integrations` içinde `sample-integrations/my-integration`.

---

## 6. Bizim Projeyle İlişkisi

| Konu | Resmî docs | Bizim proje (beaver + beaver-iot-docker) |
|------|-------------|------------------------------------------|
| **Kurulum** | Tek `docker run` monolith, 80/1883 | `chirpstack.yaml` ile monolith, Nginx, 9080; `loader.path` ile ChirpStack JAR mount. |
| **Entegrasyon ekleme** | `beaver-iot/integrations/` + restart | `prepare-chirpstack` ile JAR build + `examples/` integration dizinine kopyalama. |
| **ChirpStack** | Yok | `chirpstack-integration`, webhook, telemetri, `CHIRPSTACK_BAGLANTI_VE_CALISTIRMA.md`, `TEST_PLAN_CHIRPSTACK.md`, zero-touch deploy. |
| **Entity / key** | `identifier`, `key` formatı | ChirpStack’te `chirpstack-integration.device.{devEui}.temperature` vb. aynı key yapısına uyumlu. |
| **Cihaz ekleme** | `AddDeviceAware`, `add_device` | `ChirpstackIntegrationEntities.AddDevice` (devEui), `ChirpstackDeviceService` ile UI’dan cihaz ekleme. |

Resmî dokümantasyon, genel mimari ve entegrasyon geliştirme için referans; ChirpStack özelinde kullanım ve test adımları bizim dokümanlarla tamamlanıyor.

---

## 7. Özet ve Öneriler

### Özet

- **beaver-iot-docs-main:** Beaver IoT’nin resmî, Docusaurus tabanlı dokümantasyonu; kullanıcı ve geliştirici kılavuzları, deployment, REST API ve yayımlanmış entegrasyonları kapsıyor.
- **Kavramlar (integration, device, entity, identifier, key)** ve **entegrasyon geliştirme akışı** bizim ChirpStack entegrasyonu ile uyumlu.
- **ChirpStack** resmî “published integrations” listesinde yok; bizim `chirpstack-integration` ve ilgili dokümanlar bu açığı kapatıyor.

### Öneriler

1. **ChirpStack’i resmî docs’a eklemek (isteğe bağlı):**  
   `published-integrations` altında `chirpstack-http-v4.md` benzeri bir sayfa açılabilir; `beaver-iot-docs-main` fork’unda yapılıp Milesight’a PR gidebilir.

2. **Mevcut proje dokümanlarında referans:**  
   `CHIRPSTACK_BAGLANTI_VE_CALISTIRMA.md` veya `README.md` içinde “Detaylı platform kavramları ve entegrasyon geliştirme için [Beaver IoT Docs](https://www.milesight.com/beaver-iot/)” gibi kısa bir bağlantı eklenebilir.

3. **Kurulum ve deployment:**  
   Resmî kurulum (tek container, 80/1883) ile bizim ChirpStack’li docker-compose (9080, Nginx, integration JAR) farklı senaryolar olarak dokümante edilmeye devam edilebilir; bu rapor ve mevcut `RUNBOOK_*` / `ZERO_TOUCH_*` dokümanları bu ayrımı netleştiriyor.

---

*Bu rapor `beaver-iot-docs-main` klasöründeki dosyaların incelenmesiyle üretilmiştir.*
