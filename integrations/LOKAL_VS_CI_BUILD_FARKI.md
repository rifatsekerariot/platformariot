# Lokal vs CI Docker Build Farkı

## Lokal (run-with-local-web)

1. **prepare-chirpstack** → JAR → `examples/target/chirpstack/integrations/` (build-docker/integrations **değil**).
2. **build-web-local** → `beaver-iot-web-local.dockerfile`, context = **workspace root**, **COPY beaver-iot-web/** (yerel klasör). → `milesight/beaver-iot-web:latest`.
3. **docker compose build api monolith** (web **yok**). `BASE_WEB_IMAGE=milesight/beaver-iot-web:latest` → monolith **bizim** web imajını kullanır.
4. **compose up** `examples/chirpstack.yaml`. **BEAVER_IMAGE set edilmiyor** → varsayılan `ghcr.io/...` kullanılıyor. **Lokal monolith değil, prebuilt çalışıyor.**

**Sorun:** run-with-local-web lokal monolith yerine **prebuilt** imajı çalıştırıyor.

**JAR:** chirpstack.yaml **volume** `./target/chirpstack/:/root/beaver-iot/` kullanıyor. JAR volume’dan geliyor. Lokal monolith build’de **build-docker/integrations**’a JAR kopyalanmıyor (prepare-chirpstack sadece examples’a yazıyor).

## CI (build-push-prebuilt)

1. **ci-build-jar** → JAR → `build-docker/integrations/` (imaja gömülü).
2. **create-build-env** → .env (WEB_GIT_*=rifatsekerariot, origin/main).
3. **build-prebuilt** → `docker compose build api web monolith`. Web = **beaver-iot-web.dockerfile** → **git clone** ile. Monolith = o web’i BASE_WEB_IMAGE alır.
4. Tag, push monolith.

**Fark:** CI web **clone** ile; lokal **COPY** ile (yerel beaver-iot-web).

## Yapılan düzeltmeler

1. **run-with-local-web:** Compose up öncesi `BEAVER_IMAGE=milesight/beaver-iot:latest` set edildi → **lokal** monolith kullanılıyor.
2. **CI:** Web **lokal gibi** COPY ile üretiliyor:
   - **ci-clone-web.sh:** `beaver-iot-web` → `build-docker/beaver-iot-web` (main).
   - **beaver-iot-web-ci.dockerfile:** COPY `beaver-iot-web/`, pnpm build (git-in-container yok).
   - **build-prebuilt.sh:** Önce `docker build -f beaver-iot-web-ci.dockerfile` → web image; sonra `compose build api monolith` (web yok).
3. Workflow’a **Clone beaver-iot-web** adımı eklendi (Create .env ile Build arasında).
