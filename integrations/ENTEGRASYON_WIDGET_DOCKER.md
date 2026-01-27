# Alarm / Map / Device List Widget Entegrasyonu ve Docker ile Çalıştırma

Bu doküman, **Alarm**, **Map** ve **Device List** widget’larının arayüzde görünür hale getirilmesi ile **ana projeyi (Beaver IoT + ChirpStack)** Docker üzerinden çalışır teslim almanızı açıklar.

---

## 1. Yapılan Değişiklikler

### 1.1 beaver-iot-web (frontend)

- **Dosya:** `apps/web/src/components/drawing-board/hooks/useFilterPlugins.tsx`
- **Değişiklik:** Bu üç widget tipi artık "Add widget" listesinden **filtrelenmiyor**. Dashboard ve Device Canvas’ta hepsi görünür.
- **Sonuç:** Dashboard veya cihaz detayı → Edit → **+ Add widget** ile **Alarm**, **Map**, **Device List** eklenebilir.

### 1.2 beaver-iot-docker

- **Local web build:** `build-docker/beaver-iot-web-local.dockerfile` — mevcut `beaver-iot-web` klasöründen image üretir (git clone yok).
- **Scriptler:**
  - `scripts/build-web-local.ps1` — local web image’ı build eder (`milesight/beaver-iot-web:latest`).
  - `scripts/run-with-local-web.ps1` — ChirpStack JAR hazırlığı + local web build + api/monolith build + compose up.
- **Ortam:** `dockerignore-for-local-web` ile build context daraltılır; `build-web-local` çalışırken workspace root’a `.dockerignore` kopyalanır.
- **Windows:** `docker-entrypoint.sh` ve `nginx/envsubst-on-templates.sh` **LF** satır sonu; CRLF ise container içinde "not found" hatası oluşur.

---

## 2. Ana Projeyi Çalıştırma (Docker)

**Gereksinimler:** Docker Desktop, `beaver`, `beaver-iot-web`, `beaver-iot-docker` aynı workspace altında (örn. `c:\Projeler`).

### 2.1 Tek komutla tam akış

```powershell
cd c:\Projeler\beaver-iot-docker\scripts
.\run-with-local-web.ps1
```

Bu script sırayla:

1. ChirpStack entegrasyon JAR’larını build edip `examples/target/chirpstack/integrations/` içine kopyalar.
2. Local `beaver-iot-web` ile `milesight/beaver-iot-web:latest` image’ını build eder.
3. `build-docker` içinde `docker compose build api monolith` çalıştırır (`BASE_WEB_IMAGE` local web olacak şekilde).
4. `examples` içinde `docker compose -f chirpstack.yaml up -d` ile stack’i ayağa kaldırır.

### 2.2 Adım adım (isteğe bağlı)

```powershell
# 1. ChirpStack JAR’ları
.\prepare-chirpstack.ps1

# 2. Local web image
.\build-web-local.ps1

# 3. API + Monolith build (local web kullanılacak)
$env:BASE_WEB_IMAGE = "milesight/beaver-iot-web:latest"
cd ..\build-docker
docker compose build api monolith

# 4. Stack’i başlat
cd ..\examples
$env:CHIRPSTACK_DEFAULT_TENANT_ID = "default"
docker compose -f chirpstack.yaml up -d
```

### 2.3 Erişim

- **UI:** http://localhost:9080  
- **Loglar:** `docker compose -f chirpstack.yaml logs -f`  
- **Durdurma:** `docker compose -f chirpstack.yaml down`

---

## 3. Widget’ları Doğrulama

1. http://localhost:9080 adresine gidin, giriş yapın.
2. **Dashboard** veya bir **cihaz detayı** → **Device Canvas** sayfasına gidin.
3. **Edit** → **+ Add widget** (veya plugin grid’i) açın.
4. Listede **Alarm**, **Map**, **Device List** widget’larının göründüğünü kontrol edin.
5. İstediğinizi seçip kaydedin; dashboard/canvas’ta çalıştığını doğrulayın.

---

## 4. Repo İlişkisi

| Repo / Klasör       | İlgili değişiklikler |
|---------------------|----------------------|
| **beaver-iot-integrations** (beaver) | ChirpStack JAR, bu doküman. |
| **beaver-iot-web**  | `useFilterPlugins` — Alarm/Map/Device List filtreden çıkarıldı. |
| **beaver-iot-docker** | Local web Dockerfile, `build-web-local.ps1`, `run-with-local-web.ps1`, `dockerignore-for-local-web`, CRLF→LF ve `chmod` düzenlemeleri. |

---

## 5. Notlar

- **Local web:** `build-web-local` ve `run-with-local-web`, `beaver-iot-web` klasörünü **local** kullanır; değişiklikleriniz doğrudan image’a yansır. Git push gerekmez.
- **Git ile web build:** Milesight veya fork’tan clone ile build etmek isterseniz `build-docker/.env` içinde `WEB_GIT_REPO_URL` / `WEB_GIT_BRANCH` ayarlayıp standart `build.sh` veya `docker compose build` kullanın. Widget değişiklikleri için fork’ta `useFilterPlugins` güncellemesi gerekir.
- **Windows + shell script:** `docker-entrypoint.sh`, `envsubst-on-templates.sh` ve nginx config’lerinde **LF** kullanın. CRLF ise container’da "no such file or directory" / "not found" alırsınız.

---

*Bu entegrasyon, Alarm/Map/Device List widget’larının arayüzde kullanılabilmesi ve projenin Docker ile çalışır teslim edilmesi amacıyla hazırlanmıştır.*
