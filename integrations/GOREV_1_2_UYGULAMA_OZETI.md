# Görev 1 & 2 Uygulama Özeti

## Görev 1: Sunucuda widget’ların gelmemesi – neden ve düzeltme

**Neden:** `--build-images` ile sunucuda build alınırken `WEB_GIT_BRANCH` compose’a **güvenilir şekilde geçmiyordu**. Compose’taki varsayılan `origin/develop` kullanılıyordu; widget düzeltmesi **main**’de. Ayrıca web Dockerfile’da `CI=true` yoktu; pnpm TTY uyarısı bazı ortamlarda sorun çıkarabiliyordu.

**Yapılanlar:**
- **build-docker/.env:** `--build-images` sırasında script `build-docker/.env` oluşturuyor (`API_GIT_*`, `WEB_GIT_*`). Compose bu dosyayı okuyor; böylece **WEB_GIT_BRANCH=origin/main** her zaman uygulanıyor.
- **beaver-iot-web.dockerfile:** Web build aşamasına `ENV CI=true` eklendi (pnpm için).

## Görev 2: Uzun build süreleri olmaması – hazır image + tek script

**Yapılanlar:**
- **Varsayılan = hazır image:** Artık sunucuda build yok. Script `ghcr.io/rifatsekerariot/beaver-iot:latest` image’ını pull ediyor (Alarm/Map/DeviceList widget’lı).
- **chirpstack.yaml:** `image: ${BEAVER_IMAGE:-ghcr.io/rifatsekerariot/beaver-iot:latest}` kullanılıyor.
- **deploy-zero-touch.sh:**  
  - Varsayılan: `BEAVER_IMAGE=ghcr.io/...` → pull + JAR + compose.  
  - `--build-images`: Build alınır, ardından `BEAVER_IMAGE=milesight/beaver-iot:latest` → compose.
- **GitHub Actions:** `build-push-prebuilt.yaml` workflow’u eklendi. `main`’e push (veya manuel) ile api/web/monolith build edilip `ghcr.io/rifatsekerariot/beaver-iot:latest`’e push ediliyor.

**Tek komut (varsayılan, hızlı):**
```bash
curl -sSL https://raw.githubusercontent.com/rifatsekerariot/beaver-iot-docker/main/scripts/deploy-zero-touch.sh | sudo sh -s -- --tenant-id "default"
```

**İlk kullanım:** "Build and push prebuilt image" workflow’ı en az bir kez çalıştırılmalı (Actions → workflow_dispatch veya ilgili değişikliklerle `main`’e push).

---

*Özet: Görev 1 için widget nedeni (.env + CI) giderildi; Görev 2 için hazır image + tek script ile sunucuda build olmadan, tek komutla ayağa kalkma sağlandı.*
