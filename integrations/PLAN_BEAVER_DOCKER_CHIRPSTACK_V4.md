# Beaver IoT Docker + ChirpStack v4 Entegrasyonu – Yeniden Tasarım Planı

**Amaç:** Beaver IoT’yi **Docker** ile çalıştırmak ve **ChirpStack v4 HTTP Integration** ile LoRaWAN uplink/event’leri almak. Token veya şifre yok.

**Tarih:** 24 Ocak 2025

---

## 1. Repo ve Bileşen Özeti

| Repo | Rol | URL (rifatsekerariot fork) |
|------|-----|----------------------------|
| **beaver-iot-integrations** | Entegrasyon JAR’ları (MQTT, MSC, **ChirpStack**, …) | https://github.com/rifatsekerariot/beaver-iot-integrations |
| **beaver-iot** | Backend API (Spring Boot) | https://github.com/Milesight-IoT/beaver-iot (veya fork) |
| **beaver-iot-web** | Frontend (React/TS, pnpm) | https://github.com/rifatsekerariot/beaver-iot-web |
| **beaver-iot-docker** | Docker build + compose örnekleri | https://github.com/rifatsekerariot/beaver-iot-docker |
| **beaver-iot-blueprint** | Cihaz / çözüm blueprint’leri | https://github.com/rifatsekerariot/beaver-iot-blueprint |

- **Docker build:** API ve Web, ilgili Git repo’lardan build edilir. **Integrations** image içine gömülmez; **runtime’da** `loader.path` ile yüklenir.
- **Integrations dizini:** `$HOME/beaver-iot/integrations` (container’da genelde `/root/beaver-iot/integrations`). Bu dizin **volume** ile doldurulur.

---

## 2. Docker Mimarisi (Özet)

### 2.1 API image (`beaver-iot-api`)

- **Dockerfile:** `build-docker/beaver-iot-api.dockerfile`
- **Kaynak:** `API_GIT_REPO_URL` + `API_GIT_BRANCH` → `beaver-iot` clone, `mvn package` → `application-standard-exec.jar`
- **Çalıştırma:**  
  `java -Dloader.path=${HOME}/beaver-iot/integrations … -jar /application.jar`
- Integration JAR’ları `loader.path` dizininden okunur (rekürsif JAR taranır).

### 2.2 Monolith image (`beaver-iot`)

- API + Web + Nginx tek container.
- Nginx: `/` → web, `/api/v1/` → API, `/public` → API, `/${MQTT_BROKER_WS_PATH}` → MQTT WS.
- **`/public`** → API’ye proxy edilir. ChirpStack webhook **`/public/integration/chirpstack/webhook`** bu sayede erişilebilir.

### 2.3 Örnek deployment’lar

| Örnek | Dosya | Integrations volume | `/public` |
|-------|-------|---------------------|-----------|
| **Monolith** | `examples/monolith.yaml` | `./target/monolith/` → `/root/beaver-iot/` (içinde `integrations/` olmalı) | Var (monolith nginx template) |
| **Standalone** | `examples/standalone.yaml` | `./target/standalone/integrations/` → `/root/beaver-iot/integrations/` | Var (`standalone-nginx.conf`’a `location /public` eklendi) |
| **Quick-start** | `examples/quick-start.yaml` | Monolith ile aynı | Var |

---

## 3. ChirpStack v4 HTTP Integration (Özet)

- ChirpStack, HTTP Integration ile **POST** atar.
- **URL:** Konfigüre edilen event endpoint (örn. `http://<beaver-host>/public/integration/chirpstack/webhook`).
- **Query:** `event=up|join|status|ack|txack|log|location|integration`
- **Body:** JSON (Protobuf JSON eşlemesi).
- **Token / şifre:** Kullanılmıyor.

Beaver tarafında **chirpstack-integration** modülü (mevcut `beaver` projesinde):

- **Endpoint:** `POST /public/integration/chirpstack/webhook?event=...`
- **Tenant:** `X-Tenant-Id` header veya `CHIRPSTACK_DEFAULT_TENANT_ID` env. İkisi de yoksa 400.
- **`up`:** `devEui` ile cihaz bulunur → `deviceStatusServiceProvider.online(device)` + log. Diğer event’ler şimdilik log.

---

## 4. Yapılacaklar (Sıralı)

### 4.1 Git ve repo ayarları

- [ ] **beaver** (integrations): `origin` → `https://github.com/rifatsekerariot/beaver-iot-integrations.git`
- [ ] **beaver-iot-docker:** `origin` → fork (rifatsekerariot). Build arg’larda **API/WEB** için fork URL’leri kullan.
- [ ] İstenirse **beaver-iot**, **beaver-iot-web**, **beaver-iot-blueprint** fork’ları da build/deploy’da kullanılacak şekilde ayarlanır.

### 4.2 ChirpStack integration modülü (beaver / integrations)

- [x] `chirpstack-integration` modülü eklendi (pom, `integration.yaml`, Bootstrap, Controller, Service, DTO’lar, logo).
- [ ] Eksik varsa düzelt (ör. `@RequestHeader` import’u, `TenantContext` kullanımı).  
- [ ] `mvn clean package -pl integrations/chirpstack-integration` ile JAR üret. Shade JAR’ın `integrations/chirpstack-integration/target/` altında oluştuğunu doğrula.

### 4.3 Integration JAR’larını Docker volume’a koyma

Hedef: API’nin `loader.path` dizininde ChirpStack JAR’ı (ve gerekirse diğer entegrasyonlar) olsun.

**Monolith / quick-start:**

- Host’ta `./target/monolith/integrations/` oluştur.
- `chirpstack-integration` (ve kullanılacak diğer entegrasyonlar) için üretilen JAR’ları buraya kopyala.
- `examples/monolith.yaml` / `quick-start` zaten `./target/monolith/` → `/root/beaver-iot/` mount ediyor. Böylece container’da `/root/beaver-iot/integrations/` dolacak.

**Standalone:**

- `./target/standalone/integrations/` kullanılıyor. Aynı JAR’ları buraya kopyala.

Örnek (proje kökü `beaver` için):

```bash
# beaver (integrations) projesinde
mvn clean package -DskipTests -pl integrations/chirpstack-integration -am

# Monolith için
mkdir -p ../beaver-iot-docker/target/monolith/integrations
cp integrations/chirpstack-integration/target/chirpstack-integration-*.jar \
   ../beaver-iot-docker/target/monolith/integrations/
```

### 4.4 Standalone Nginx’te `/public` eklenmesi

- **Sorun:** `examples/standalone-nginx.conf` içinde `location /public` yok. ChirpStack webhook erişemez.
- **Yapıldı:** `beaver-iot-docker/examples/standalone-nginx.conf` içine `location /public` eklendi (API’ye proxy). ChirpStack webhook standalone deploy’da da çalışır.
- [x] Bu değişiklik `beaver-iot-docker` içinde yapıldı.

### 4.5 Docker build konfigürasyonu (rifatsekerariot fork’ları)

`build-docker/.env` (veya build script env’leri):

- `API_GIT_REPO_URL` → `https://github.com/rifatsekerariot/beaver-iot.git` (veya kullanılan fork)
- `API_GIT_BRANCH` → `origin/main` / `origin/release` (tercihe göre)
- `WEB_GIT_REPO_URL` → `https://github.com/rifatsekerariot/beaver-iot-web.git`
- `WEB_GIT_BRANCH` → uygun branch

Böylece Docker image’lar fork’lardan üretilir.

### 4.6 ChirpStack’i Docker ile çalıştırma

- ChirpStack v4 resmi image’ları veya `chirpstack/chirpstack` compose örnekleri kullanılır.
- **HTTP Integration** ayarlarında:
  - **Event endpoint URL:**  
    - Monolith: `http://<beaver-monolith-service>:80/public/integration/chirpstack/webhook`  
    - Standalone: Nginx’e göre `http://<nginx-service>:80/public/integration/chirpstack/webhook`  
  - **Encoding:** JSON  
- Aynı Docker ağında ise `beaver` container adı / service adı ile erişim kullanılır.

### 4.7 Beaver container env (tenant)

- ChirpStack webhook tenant’ı: `X-Tenant-Id` header veya `CHIRPSTACK_DEFAULT_TENANT_ID` env.
- Monolith/Standalone compose’ta API (veya monolith) service’i için örnek:

```yaml
environment:
  - "CHIRPSTACK_DEFAULT_TENANT_ID=<beaver-tenant-id>"
```

- [ ] Beaver’da tenant oluşturulduktan sonra bu ID alınır ve env’e yazılır.

### 4.8 (İsteğe bağlı) Ortak compose: Beaver + ChirpStack

- [x] `beaver-iot-docker/examples/chirpstack.yaml` oluşturuldu:
  - Beaver monolith + `./target/chirpstack/` → `/root/beaver-iot/` (içinde `integrations/`).
  - `CHIRPSTACK_DEFAULT_TENANT_ID` env örneği.
  - ChirpStack ayrı çalıştırılır; HTTP Integration event URL’i `http://<host>:8080/public/integration/chirpstack/webhook` olarak ayarlanır.
- [ ] ChirpStack v4 stack’i aynı compose’a eklemek isteğe bağlı (ayrı compose da kullanılabilir).

### 4.9 (İsteğe bağlı) Blueprint / Web

- **Blueprint:** LoRaWAN / ChirpStack cihazları için özel device model blueprint’i eklenebilir (`beaver-iot-blueprint`).
- **Web:** Entegrasyon listesi API’den gelir; ChirpStack entegrasyonu JAR’da `integration.yaml` ile tanımlı. Ek frontend değişikliği zorunlu değil.

---

## 5. Test Akışı (Kısa)

1. `beaver` içinde `chirpstack-integration` build → JAR’ı `target/monolith/integrations/` (veya standalone’daki integrations) içine kopyala.
2. Docker build: `build-docker/build.sh` (veya `docker compose build`) ile API + Web (+ monolith).
3. `examples/monolith.yaml` (veya standalone + güncel nginx) ile çalıştır. Volume’da `integrations/` dolu olsun.
4. Beaver’da ChirpStack entegrasyonunu enable et, tenant oluştur, `CHIRPSTACK_DEFAULT_TENANT_ID` veya `X-Tenant-Id` ayarla.
5. ChirpStack’te HTTP Integration’ı yapılandır → event endpoint = Beaver webhook URL.
6. ChirpStack’ten test uplink gönder → Beaver log’larında webhook + uplink işlendiğini kontrol et.

---

## 6. Özet

| Adım | Nerede | Durum |
|------|--------|--------|
| ChirpStack integration modülü | `beaver` / integrations | Yapıldı |
| Webhook hata yakalama (controller) | `beaver` | Yapıldı |
| Test payload’ları (up/join JSON) | `chirpstack-integration` test resources | Yapıldı |
| Integration JAR’ını volume’a koyma | Host `target/.../integrations/` | Script: `prepare-chirpstack.ps1` |
| Standalone nginx’e `location /public` | `beaver-iot-docker` | Yapıldı |
| Örnek `chirpstack.yaml` | `beaver-iot-docker/examples` | Yapıldı |
| Build script’leri | `beaver/scripts`, `beaver-iot-docker/scripts` | Yapıldı |
| Test planı + runbook | `TEST_PLAN_CHIRPSTACK.md`, `RUNBOOK_CHIRPSTACK_DOCKER.md` | Yapıldı |
| Webhook smoke test | `test-webhook.ps1` | Yapıldı |
| Docker build fork URL’leri | `beaver-iot-docker` .env / build | `.env.example` eklendi |
| ChirpStack HTTP Integration config | ChirpStack UI | Elle |
| Tenant env | Compose env | Elle |

Bu plan, **Beaver IoT Docker** ortamında **ChirpStack v4 HTTP Integration**’ın çalışması için gereken değişiklik ve adımları kapsar. Önce 4.2–4.5 ve 4.7 uygulanıp test edilir; ardından istenirse 4.6, 4.8 ve 4.9 genişletilir.
