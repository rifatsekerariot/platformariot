# Lokal Docker test sistemi

Alarm modülü dahil build + PostgreSQL + monolith stack + alarm doğrulama.

## Gereksinim

- Docker Desktop çalışıyor
- Repo kökünde: `backend/`, `web/`, `build-docker/`, `examples/`

## Tek komut (tam test)

```powershell
cd c:\Projeler\platformariot
.\scripts\local-docker-test.ps1
```

Yapılanlar:

1. Web imajı build (beaver-iot-web-local.dockerfile)
2. build-docker/.env oluşturulur (BASE_WEB_IMAGE lokal)
3. API + Monolith build (alarm modülü `-am` ile dahil)
4. examples/stack.yaml ile PostgreSQL + Monolith ayağa kalkar
5. ~90s beklenir, sonra alarm-docker-checklist.ps1 çalışır

## Parametreler

| Parametre    | Açıklama |
|-------------|----------|
| (yok)       | Tam: build + up + doğrulama |
| `-BuildOnly`| Sadece imajları build et, stack başlatma |
| `-SkipBuild`| Build atla, sadece stack up + doğrulama (imajlar hazır varsayılır) |
| `-Stop`     | Stack'i durdur: `docker compose -f stack.yaml down -v` |
| `-NoCache`  | Build sırasında `--no-cache` kullan |

## Örnekler

```powershell
# İlk kez: tam build + çalıştır
.\scripts\local-docker-test.ps1

# Sadece imajları build et (sonra manuel up)
.\scripts\local-docker-test.ps1 -BuildOnly

# İmajlar hazır, sadece stack başlat + doğrula
.\scripts\local-docker-test.ps1 -SkipBuild

# Stack'i durdur
.\scripts\local-docker-test.ps1 -Stop
```

## Adresler

- Uygulama: http://localhost:9080
- Actuator mappings: http://localhost:9080/actuator/mappings (alarms mapping kontrolü)
- Alarm checklist: `.\scripts\alarm-docker-checklist.ps1` (stack çalışırken)

## Durdurma

```powershell
.\scripts\local-docker-test.ps1 -Stop
# veya
cd examples
docker compose -f stack.yaml down -v
```
