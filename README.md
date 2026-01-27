# platformariot

Tek repo altında birleşik **Beaver IoT** platformu: backend, web, integrations ve Docker build.

## Yapı

| Klasör        | Açıklama |
|---------------|----------|
| `backend/`    | Beaver IoT API (Java/Spring, Alarm, t_alarm, PostgreSQL) |
| `web/`        | Beaver IoT Web (React, ARIOT, PDF rapor, widget’lar) |
| `integrations/` | ChirpStack v4 HTTP integration (JAR) ve diğer entegrasyonlar |
| `build-docker/` | Dockerfile’lar, docker-compose, nginx, entrypoint |
| `examples/`   | Örnek compose (ChirpStack, PostgreSQL, monolith, standalone) |
| `scripts/`    | CI build, JAR, prebuilt, tag-push, vb. |

## Gereksinimler

- Docker, Docker Compose
- Maven 3.8+ (JAR yerel build için)
- Node 20, pnpm (web yerel build için)

## Hızlı başlangıç

1. ChirpStack JAR’ı derleyin:
   ```bash
   sh scripts/ci-build-jar.sh
   ```

2. `build-docker/.env` oluşturun (`build-docker/.env.example` örnek).

3. Görüntüleri derleyin (repo kökünden):
   ```bash
   cd build-docker
   docker compose build
   ```

4. Örnek compose ile çalıştırın:
   ```bash
   cd examples
   docker compose -f chirpstack-prebuilt-postgres.yaml up -d
   ```

## CI

`main`’e push’ta `.github/workflows/build-push-prebuilt.yaml` web, api ve monolith’i derleyip `ghcr.io/rifatsekerariot/beaver-iot` ve `ghcr.io/rifatsekerariot/beaver-iot-web`’e push eder.

## Lisans

Bileşenlere ait lisanslar ilgili alt projelerde yer alır.
