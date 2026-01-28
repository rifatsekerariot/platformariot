# platformariot

**PostgreSQL + Alarm + widget geliştirmeleri.** Tek repo, tek build, tek compose, tek `curl` ile ayağa kalkan yapı.

---

## Tek komut – kurulum ve güncelleme (Linux)

**İlk kurulum ve her güncelleme için aynı komut.** Farklı bir komut yok.

```bash
curl -sSL https://raw.githubusercontent.com/rifatsekerariot/platformariot/main/scripts/deploy-zero-touch.sh | sudo sh -s --
```

- Docker yoksa kurar, `platformariot`'u clone eder, `examples/stack.yaml` ile **PostgreSQL + monolith** ayağa kaldırır.
- **Güncelleme:** Geliştirme yapıp `main`'e push ettiğinizde CI imajı GHCR'a atar. Sunucuda **aynı curl'ü** tekrar çalıştırın: en son imaj çekilir, konteynerler yenilenir.
- **Veri:** `beaver-postgres-data` (PostgreSQL) ve `beaver-monolith-logs` volume'lerde tutulur; script `down -v` kullanmaz → **güncellemede veri kaybı olmaz.**
- **UI:** `http://<sunucu-ip>:9080`
- Opsiyonel: `--workspace /opt/platformariot` `--skip-docker-install` `--postgres-password xxx` `--tenant-id xxx`

---

## Yapı (sadeleştirilmiş)

| Klasör | Açıklama |
|--------|----------|
| `backend/` | Beaver IoT API (Alarm, t_alarm, PostgreSQL migration) |
| `web/` | Beaver IoT Web (Alarm widget, ARIOT, PDF rapor, diğer widget’lar) |
| `integrations/` | ChirpStack JAR (monolith imajına gömülü; webhook isteğe bağlı) |
| `blueprint/` | Cihaz/çözüm blueprint'leri (Milesight clone yok; zip imaja gömülü) |
| `build-docker/` | Dockerfile’lar, `docker-compose`, nginx |
| `examples/stack.yaml` | **Tek compose:** PostgreSQL + monolith |
| `scripts/` | `deploy-zero-touch.sh` (curl), `ci-build-jar`, `build-prebuilt`, `create-build-env`, `tag-push-ghcr`, `verify-*` |

---

## Geliştirme ve build

1. **JAR (ChirpStack):** `sh scripts/ci-build-jar.sh`
2. **.env:** `build-docker/.env` (`.env.example` örnek)
3. **Build:** `cd build-docker && docker compose build`
4. **Çalıştır:** `cd examples && docker compose -f stack.yaml up -d`

---

## CI/CD

- **Tek workflow:** `.github/workflows/build-push-prebuilt.yaml`
- **Yapılan iş:** JAR → web + api + monolith build → PostgreSQL smoke test → `ghcr.io/rifatsekerariot/beaver-iot:latest` push
- **Tetikleyen:** `main`’e push (backend, web, integrations, blueprint, build-docker, scripts, examples)

---

## Geliştirme ve güncelleme

- Tüm geliştirmeler bu repo üzerinden. `main`'e push → Build workflow → `ghcr.io/rifatsekerariot/beaver-iot:latest` güncellenir.
- Sunucuda güncellemek için **sadece aynı curl'ü** tekrar çalıştırın; ek komut yok. Veriler volume'de kalır.
- Alarm / widget / rapor: `backend/`, `web/`. ChirpStack: `integrations/`. Blueprint: `blueprint/`. Compose: `examples/stack.yaml`.

---

## Repo kendi icinde – disari veri almadan

**Bu repoda olan (fork / clone yok; build ve deploy buradan):**

- `backend/`, `web/`, `integrations/`, `blueprint/` – tum kaynak kod
- `build-docker/` – Dockerfile'lar yerel `backend/`, `web/`, `blueprint/` kullanir; **git clone yok**
- `scripts/` – `deploy-zero-touch.sh` yalnizca **platformariot** reponu clone eder; beaver-iot-docker / beaver-iot-web / beaver-iot-integrations clone edilmez
- `examples/stack.yaml` – Imaj: `ghcr.io/rifatsekerariot/beaver-iot:latest` (bu repo CI’inin push ettigi)
- Blueprint: `blueprint/` repoda; derlemede zip’lenip imaja gomulur; **Milesight beaver-iot-blueprint** clone edilmez

**Build zamaninda disari (kabul edilebilir):** Maven Central, npm registry, Docker Hub base imajlari (maven, node, postgres, alpine, amazoncorretto).

**Kurulum (ilk curl):** get.docker.com, git paketi (yoksa); sonrasi sadece bu repo + GHCR imaji.
