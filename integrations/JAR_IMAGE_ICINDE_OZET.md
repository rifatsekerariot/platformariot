# JAR Artık Image İçinde – Özet

## Ne değişti?
- **Varsayılan zero-touch:** Sunucuda **JAR build yok**. ChirpStack JAR, prebuilt image içine gömülü (`ghcr.io/rifatsekerariot/beaver-iot:latest`).
- **Tek script, hızlı kurulum:** Yalnızca `beaver-iot-docker` klonlanır, image pull edilir, `chirpstack-prebuilt.yaml` ile compose up. Integrations repo klonlanmaz, Maven çalışmaz.

## Tek komut (varsayılan)
```bash
curl -sSL https://raw.githubusercontent.com/rifatsekerariot/beaver-iot-docker/main/scripts/deploy-zero-touch.sh | sudo sh -s -- --tenant-id "default"
```

## --build-images (eskisi gibi)
- Integrations klonlanır, JAR build edilir, api/web/monolith sunucuda build edilir.
- `chirpstack.yaml` (volume’lu) kullanılır. 15–25 dk sürebilir.

## Teknik detaylar
- **CI (build-push-prebuilt):** Integrations klonlanır, JAR build, `build-docker/integrations/` içine kopyalanır. Monolith Dockerfile `COPY integrations/ /root/beaver-iot/integrations/` ile JAR’ı image’a ekler. Image GHCR’a push edilir.
- **chirpstack-prebuilt.yaml:** Volume yok; JAR image’tan gelir.
- **chirpstack.yaml:** Volume ile `./target/chirpstack/` mount; `--build-images` için kullanılır.

## İlgili repolar
- **beaver-iot-docker:** `build-docker/integrations/`, `beaver-iot.dockerfile`, `chirpstack-prebuilt.yaml`, `deploy-zero-touch.sh`, CI workflow.
