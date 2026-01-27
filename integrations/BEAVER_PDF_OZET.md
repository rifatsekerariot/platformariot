# Beaver IoT PDF Özeti – Installation & Docker Compose

Bu dosya, **Installation _ Beaver IoT.pdf** ve **Docker Compose _ Beaver IoT.pdf** içeriklerinin kısa özeti ve ChirpStack projemizle uyumudur.

---

## 1. Installation _ Beaver IoT.pdf

### Kurulum adımları

1. **Docker** 20.10+ kurulu olmalı.
2. **80** ve **1883** portları boş olmalı.
3. Çalışma dizinine gidip şu komutu çalıştır:

   **Linux/Mac:**
   ```bash
   docker run -d --name beaver-iot -v $(pwd):/root -p 80:80 -p 1883:1883 milesight/beaver-iot
   ```

   **Windows (PowerShell):**
   ```powershell
   docker run -d --name beaver-iot -v "${PWD}:/root" -p 80:80 -p 1883:1883 milesight/beaver-iot
   ```

4. Tarayıcıdan `http://[Sunucu-IP]` ile kayıt ol, giriş yap.
5. Log: `docker logs -f beaver-iot`

### Upgrade

```bash
docker stop beaver-iot
docker rm beaver-iot
docker pull milesight/beaver-iot
# Sonra tekrar docker run (aynı working directory ve volume)
```

### Önemli noktalar

- **Volume:** `$(pwd)` → `/root`. Integrations için `/root/beaver-iot/integrations` kullanılıyorsa, host'ta **çalışma dizininde `beaver-iot/integrations/`** olmalı.
- **Portlar:** Sadece **80** (HTTP) ve **1883** (MQTT). Websocket **8083** yok.

---

## 2. Docker Compose _ Beaver IoT.pdf

### Monolithic deployment

- **Image:** `milesight/beaver-iot:latest`
- **Volume:** `./beaver-iot/` → `/root/beaver-iot/`
- **Portlar:** 80, 8083 (websocket), 1883 (MQTT)
- **DB:** H2 (env ile)

### Ayrı frontend/backend (nginx + web + api)

- **API volume:** `./beaver-iot/integrations/` → `/root/beaver-iot/integrations/`, `./beaver-iot/logs/` → `/root/beaver-iot/logs/`
- **Postgres** isteğe bağlı; env ile konfigüre edilir.

---

## 3. Bizim ChirpStack kurulumu ile uyum

| Konu | PDF | Bizim proje |
|------|-----|-------------|
| **Image** | `milesight/beaver-iot:latest` | Aynı (`chirpstack.yaml`) |
| **Volume** | `./beaver-iot/` veya `./beaver-iot/integrations/` | `./target/chirpstack/` → `/root/beaver-iot/`; içinde `integrations/` |
| **Integrations path** | `/root/beaver-iot/integrations/` | Aynı (`target/chirpstack/integrations/` → oraya gidiyor) |
| **Port HTTP** | 80 | 8080:80 (host 8080); meşgulse 9080:80 |
| **Port 1883** | 1883 | 1883 |
| **Port 8083** | 8083 (compose) | 8083 |

ChirpStack entegrasyonu için JAR'lar **`examples/target/chirpstack/integrations/`** içinde; compose ile `/root/beaver-iot/integrations/` olarak yüklenecek.

---

## 4. Test sonuçları (PDF bilgisiyle)

Aşağıdaki testler **Installation** ve **Docker Compose** PDF’lerine uygun (port 80→9080, 1883; volume `target/chirpstack`→`/root/beaver-iot`) çalıştırıldı:

| Test | Beklenen | Sonuç |
|------|----------|--------|
| POST webhook, tenant yok | 400 | Geçti |
| POST uplink + `X-Tenant-Id: default` | 200, `ok` | Geçti |
| POST join + `X-Tenant-Id: default` | 200, `ok` | Geçti |

```powershell
cd c:\Projeler\beaver-iot-docker\scripts
.\test-webhook.ps1 -BaseUrl "http://localhost:9080" -TenantId "default"
```

Log: `ChirpStack HTTP integration started`, `ChirpStack webhook: tenant not configured`, `ChirpStack join: devEui=...`.

---

## 5. Hızlı "Installation" tarzı çalıştırma (ChirpStack ile)

Installation PDF'deki gibi tek `docker run` kullanmak istersen:

1. `beaver-iot/integrations/` dizinini oluştur, ChirpStack JAR'ını oraya koy.
2. O dizinin parent'ında (yani `beaver-iot`'un bulunduğu yerde) çalıştır:

   ```powershell
   docker run -d --name beaver-iot -v "${PWD}:/root" -p 80:80 -p 1883:1883 milesight/beaver-iot
   ```

Böylece `/root/beaver-iot/integrations/` container içinde kullanılabilir.  
ChirpStack webhook için **80** portu üzerinden `http://<host>/public/integration/chirpstack/webhook` kullanılır.

---

*Kaynak: `Installation _ Beaver IoT.pdf`, `Docker Compose _ Beaver IoT.pdf`*
