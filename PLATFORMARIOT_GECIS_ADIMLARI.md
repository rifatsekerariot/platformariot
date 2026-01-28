# platformariot’a Geçiş Adımları

**Bundan sonra tüm geliştirme `platformariot` üzerinden.** Bu dokümanda yapılacak adımlar sırayla yazılı.

---

## 1. Cursor / IDE workspace

- **File → Open Folder →** `c:\Projeler\platformariot`
- Eski `beaver` projesini kapatın veya ayrı pencerede tutun (sadece referans için).

---

## 2. Günlük geliştirme

| Ne | Nerede |
|----|--------|
| Backend, Alarm, API | `backend/` |
| Web, Alarm widget, PDF rapor | `web/` |
| ChirpStack, MQTT-Device, entegrasyonlar | `integrations/` |
| Cihaz/çözüm blueprint | `blueprint/` |
| Dockerfile, nginx, compose | `build-docker/` |
| Deploy, JAR build, verify script’leri | `scripts/` |

Tüm değişiklikler **platformariot** içinde; commit ve push da bu repoya.

---

## 3. Build ve çalıştırma

```bash
# JAR (ChirpStack vb.)
sh scripts/ci-build-jar.sh

# .env
cp build-docker/.env.example build-docker/.env
# build-docker/.env içini düzenleyin

# Docker build
cd build-docker && docker compose build

# Çalıştır (PostgreSQL + monolith)
cd examples && docker compose -f stack.yaml up -d
```

- **UI:** `http://localhost:9080` (veya sunucu IP)

---

## 4. Deploy (sunucu)

**Tek komut (ilk kurulum + güncelleme):**

```bash
curl -sSL https://raw.githubusercontent.com/rifatsekerariot/platformariot/main/scripts/deploy-zero-touch.sh | sudo sh -s --
```

Opsiyonel: `--workspace /opt/platformariot` `--skip-docker-install` `--postgres-password xxx` `--tenant-id xxx`

---

## 5. Git ve CI/CD

- **Branch:** `main` (veya feature branch → PR → `main`)
- **Push:** `origin` = `rifatsekerariot/platformariot`
- **CI:** `main`’e push → `.github/workflows/build-push-prebuilt.yaml` → `ghcr.io/rifatsekerariot/beaver-iot:latest`

---

## 6. beaver (beaver-iot-integrations) ve eski repolar

| Repo | Yapılacak |
|------|-----------|
| **beaver** | Günlük geliştirme yok. İsterseniz GitHub’da **Archive** veya sadece referans bırakın. Milesight upstream takip edilecekse: `platformariot/integrations`’ı periyodik manuel/cherry-pick ile güncelleyin. |
| **beaver-iot-main, beaver-iot-web, beaver-iot-docker, beaver-iot-blueprint** | İçerik platformariot’a taşındı. Yerel klasörleri silebilir veya GitHub’da archive’layabilirsiniz. |

---

## 7. Kısa kontrol listesi

- [ ] Cursor workspace = `c:\Projeler\platformariot`
- [ ] Yeni commit/push sadece `platformariot`’a
- [ ] Build: `scripts/ci-build-jar.sh`, `build-docker/`, `examples/stack.yaml`
- [ ] Deploy: `scripts/deploy-zero-touch.sh` (curl ile)
- [ ] beaver’da yeni geliştirme yapmıyorum
- [ ] (İsteğe bağlı) beaver’ı GitHub’da archive’ladım

---

## 8. Yardımcı dokümanlar (platformariot içinde)

| Dosya | İçerik |
|-------|--------|
| `README.md` | Genel kullanım, tek curl deploy, yapı |
| `MONOREPO_DURUM_VE_TEK_REPO_GECIS.md` | Neden platformariot, beaver ile fark |
| `NO_RESOURCE_ALARMS_SEARCH_FIX.md` | `/alarms/search` 404/500 teşhis |
| `integrations/scripts/run-alarm-api-tests.ps1` | Alarm API testleri |
| `scripts/verify-alarm-postgres.ps1` | `t_alarm` + endpoint kontrolü |

---

**Özet:** Workspace’i `platformariot` yap, tüm işi orada yap, sadece oraya push et. Eksik yok; bu adımlarla devam edebilirsiniz.
