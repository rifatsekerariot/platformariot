# Beaver IoT + ChirpStack v4 – Çalıştırma Runbook’u

Bu dokümanda projeyi **Docker üzerinde çalışır hale getirmek** ve **ChirpStack webhook** testlerini yapmak için adımlar verilir.

---

## Gereksinimler

- **Docker Desktop** kurulu ve çalışıyor.
- **Git** ile `beaver` (beaver-iot-integrations) ve `beaver-iot-docker` klonlu.
- İsteğe bağlı: **Maven 3.8+** ve **JDK 17** (yoksa integrations build’i Docker ile yapılır).

---

## Adım 1: Docker’ı aç

Docker Desktop’ı başlat. `docker info` veya `docker run hello-world` ile kontrol et.

---

## Adım 2: Integrations (ChirpStack modülü) build

### 2a. Yerel Maven varsa

```powershell
cd c:\Projeler\beaver
mvn clean package -DskipTests -pl integrations/chirpstack-integration -am
```

### 2b. Maven yoksa (Docker ile)

```powershell
cd c:\Projeler\beaver
docker run --rm -v "c:\Projeler\beaver:/workspace" -w /workspace maven:3.8-eclipse-temurin-17-alpine mvn clean package -DskipTests -pl integrations/chirpstack-integration -am
```

Çıktıda `BUILD SUCCESS` olmalı. JAR:  
`integrations\chirpstack-integration\target\chirpstack-integration-*-shaded.jar` (veya `chirpstack-integration-*.jar`).

---

## Adım 3: Integrations JAR’ını Docker volume dizinine kopyala

```powershell
mkdir -p c:\Projeler\beaver-iot-docker\examples\target\chirpstack\integrations
Copy-Item "c:\Projeler\beaver\integrations\chirpstack-integration\target\chirpstack-integration-*.jar" "c:\Projeler\beaver-iot-docker\examples\target\chirpstack\integrations\" -Exclude "*original*"
```

`prepare-chirpstack.ps1` kullanıyorsan:

```powershell
cd c:\Projeler\beaver-iot-docker
.\scripts\prepare-chirpstack.ps1
```

---

## Adım 4: Beaver Docker build (API, Web, Monolith)

```powershell
cd c:\Projeler\beaver-iot-docker\build-docker
```

`.env` oluştur:

```env
DOCKER_BUILD_OPTION_LOAD=true
DOCKER_REGISTRY=milesight
PRODUCTION_TAG=latest
API_GIT_REPO_URL=https://github.com/Milesight-IoT/beaver-iot.git
API_GIT_BRANCH=origin/release
WEB_GIT_REPO_URL=https://github.com/Milesight-IoT/beaver-iot-web.git
WEB_GIT_BRANCH=origin/release
```

Build:

```powershell
docker compose build --no-cache api
docker compose build --no-cache web
docker compose build --no-cache monolith
```

Veya `build.sh` (Git Bash / WSL):

```bash
./build.sh --build-target=api,web,monolith
```

---

## Adım 5: ChirpStack örnek compose ile çalıştır

```powershell
cd c:\Projeler\beaver-iot-docker\examples
docker compose -f chirpstack.yaml up -d
```

Log takibi:

```powershell
docker compose -f chirpstack.yaml logs -f
```

Beaver tarafında “ChirpStack HTTP integration started” ve webhook log’larını görene kadar bekleyebilirsin.

---

## Adım 6: Webhook testleri

### Tenant olmadan → 400 beklenir

```powershell
Invoke-WebRequest -Uri "http://localhost:8080/public/integration/chirpstack/webhook?event=up" -Method POST -Body "{}" -ContentType "application/json" -UseBasicParsing
# 400 alınmalı
```

### Uplink (up) + X-Tenant-Id → 200 beklenir

```powershell
$headers = @{ "X-Tenant-Id" = "default" }
$body = Get-Content "c:\Projeler\beaver\integrations\chirpstack-integration\src\test\resources\chirpstack-up.json" -Raw
Invoke-WebRequest -Uri "http://localhost:8080/public/integration/chirpstack/webhook?event=up" -Method POST -Body $body -ContentType "application/json" -Headers $headers -UseBasicParsing
# 200 + "ok"
```

### Otomatik smoke test

```powershell
cd c:\Projeler\beaver-iot-docker\scripts
.\test-webhook.ps1 -BaseUrl "http://localhost:9080" -TenantId "default"
# 8080 kullanıyorsan: -BaseUrl "http://localhost:8080"
```

---

## Adım 7: Log inceleme

```powershell
docker compose -f chirpstack.yaml logs monolith
```

Aranacak ifadeler:

- `ChirpStack HTTP integration started`
- `ChirpStack webhook`, `ChirpStack uplink`, `ChirpStack join`
- `tenant not configured` (tenant yokken)
- `device not found` (cihaz yoksa)
- `ChirpStack webhook error` (hata varsa)

---

## Adım 8: Durdurma

```powershell
cd c:\Projeler\beaver-iot-docker\examples
docker compose -f chirpstack.yaml down
```

---

## Sık karşılaşılan durumlar

| Sorun | Olası neden | Çözüm |
|-------|-------------|--------|
| Build’de `context` bulunamıyor | beaver-iot-parent / context Maven’da yok | `API_GIT_BRANCH=origin/release` ile API’yi release’ten build et; context API ile uyumlu sürümden gelir. |
| 404 /public/... | Nginx’te `location /public` yok | Monolith kullanıyorsan var. Standalone’da `standalone-nginx.conf` içinde `location /public` olduğundan emin ol. |
| 400 tenant not configured | Tenant env/header yok | `CHIRPSTACK_DEFAULT_TENANT_ID` env veya `X-Tenant-Id` header ver. |
| Integrations yüklenmiyor | Volume boş veya yanlış path | `target/chirpstack/integrations/` içinde JAR’lar olmalı; compose’da bu dizin mount ediliyor olmalı. |

---

## Özet komut sırası

1. `docker` çalışıyor mu → kontrol et.  
2. `beaver`’da chirpstack-integration build → JAR üret.  
3. JAR’ı `examples/target/chirpstack/integrations/` altına kopyala.  
4. `build-docker` ile API + Web + Monolith image’larını build et.  
5. `examples`’da `docker compose -f chirpstack.yaml up -d`.  
6. `test-webhook.ps1` veya curl ile webhook’u dene.  
7. `docker compose logs` ile log’lara bak.

Bu adımlarla proje Docker üzerinde çalışır ve ChirpStack webhook test edilebilir hale gelir.
