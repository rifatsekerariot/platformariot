# Alarm/Map/Device List – Remote Build Fix Özeti

## Sorun

Lokal Docker build’de (run-with-local-web) Alarm/Map/Device List widget’ları görünüyordu; sunucuda prebuilt image veya `--build-images` ile build sonrası **görünmüyordu**.

## Kök neden

**Docker Compose build sırası:** `depends_on` yalnızca **container start** sırasını kontrol eder, **build** sırasını **değil**.  
`docker compose build api web monolith` çalıştırıldığında Compose **paralel** build yapıyordu. **Monolith** `FROM milesight/beaver-iot-web:latest` kullanıyor. Web henüz build edilmeden monolith build başlarsa, Docker **Docker Hub**’daki **upstream** `milesight/beaver-iot-web:latest` imajını çekiyordu. O imajda **rifatsekerariot** fork’undaki widget düzeltmeleri (components.ts, useFilterPlugins) **yok**. Sonuç: sunucuda widget’lar görünmüyordu.

## Yapılan düzeltmeler

1. **Workflow (`build-push-prebuilt.yaml`)**
   - Build **sıralı** yapılıyor: `api` → `web` → `monolith`.
   - Web kesinlikle monolith’tan **önce** build edilip `milesight/beaver-iot-web:latest` olarak tag’leniyor; monolith bu **yerel** web imajını kullanıyor.
   - Build adımına **WEB_GIT_REPO_URL** ve **WEB_GIT_BRANCH** env’leri açıkça eklendi (rifatsekerariot/beaver-iot-web, origin/main).
   - Build sonrası **Verify web image** adımı: `/web/index.html` ve `/web/assets` varlığı kontrol ediliyor.

2. **deploy-zero-touch.sh (`--build-images`)**
   - Aynı sıra kullanılıyor: önce `api`, sonra `web`, sonra `monolith`.  
   - Sunucuda `--build-images` ile build ederken de **bizim** web imajı kullanılıyor.

3. **ZERO_TOUCH_DEPLOY.md**
   - “Alarm/Map/Device List widget’ları yok” troubleshooting satırı, “CI’da web monolith’tan önce build edilmedi” olası nedenini içerecek şekilde güncellendi.

## Doğrulama

- **GitHub:** `rifatsekerariot/beaver-iot-web` **main**’de `components.ts` ve `useFilterPlugins` düzeltmeleri mevcut (önceden doğrulandı).
- **Lokal:** `run-with-local-web` yerel `beaver-iot-web` klasöründen build alıyor; widget’lar çalışıyor.
- **CI:** Artık önce web build ediliyor, monolith bu web’i base alıyor; prebuilt imaj widget’lı olmalı.

## Sonraki adımlar

1. Workflow’u tetikleyin (Actions → Build and push prebuilt image → Run workflow) veya `main`’e push ile tetiklenmesini bekleyin.
2. Workflow tamamlandıktan sonra sunucuda zero-touch’u tekrar çalıştırın (pull + up).
3. UI’da Dashboard → Add widget → **Alarm List**, **Map**, **Device List** görünür olmalı.
