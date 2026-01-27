# Alarm Faz 1 — GitHub Push ve CI/CD

## Yapılan değişiklikler

### 1. beaver-iot-main (Backend)
- `services/alarm/` — alarm-service: AlarmsController, AlarmService, AlarmRepository, AlarmPO, request/response
- `services/pom.xml` — alarm modülü
- `application/application-standard/pom.xml` — alarm-service dependency
- `application/.../db/postgres/changelog.yaml` — v1.4.0 include
- `application/.../db/postgres/sql/v1.4.0/alarm.sql` — t_alarm

**API:** `POST /alarms/search`, `GET /alarms/export`, `POST /alarms/claim`

### 2. beaver-iot-web (Frontend)
- `apps/web/src/routes/routes.tsx` — /alarm route
- `apps/web/src/constants.ts` — ALARM_MODULE, ALARM_VIEW, ALARM_CLAIM
- `apps/web/src/pages/alarm/` — index (Tabs), AlarmList, AlarmRules (placeholder)
- `apps/web/.../plugin/plugins/alarm/view/` — "Kuralları yönet" linki, style
- `packages/locales/` — alarm.json (en, cn), helper.ts (alarm modülü), global (common.label.all)
- `packages/locales/src/helper.ts` — alarm modülü appLocalModules’e eklendi

### 3. beaver (integrations)
- `scripts/run-alarm-api-tests.ps1` — device_id çözümü, t_alarm seed, claim’de device_id

---

## Push komutları

### beaver-iot-main
```powershell
cd c:\Projeler\beaver-iot-main
git add services/alarm application/application-standard/pom.xml application/application-standard/src/main/resources/db/postgres/changelog.yaml application/application-standard/src/main/resources/db/postgres/sql/v1.4.0/alarm.sql services/pom.xml
git commit -m "feat(alarm): Alarm Faz 1 - alarm-service, t_alarm, /alarms search, export, claim"
git push origin main
```

*(Not: beaver-iot-main ortamınızda .git yoksa, bu projeyi gerçek git clone içinde açıp aynı dosyaları oraya uygulayın.)*

### beaver-iot-web
```powershell
cd c:\Projeler\beaver-iot-web
git add apps/web/src/pages/alarm apps/web/src/routes/routes.tsx apps/web/src/constants.ts apps/web/src/components/drawing-board/plugin/plugins/alarm/view/index.tsx apps/web/src/components/drawing-board/plugin/plugins/alarm/view/style.less packages/locales/src/lang/en/alarm.json packages/locales/src/lang/cn/alarm.json packages/locales/src/helper.ts packages/locales/src/lang/en/global.json packages/locales/src/lang/cn/global.json
git commit -m "feat(alarm): Alarm Faz 1 - /alarm sayfası, AlarmList, AlarmRules placeholder, widget Kuralları yönet linki"
git push origin main
```

### beaver (isteğe bağlı — sadece test script)
```powershell
cd c:\Projeler\beaver
git add scripts/run-alarm-api-tests.ps1
git commit -m "chore(alarm): run-alarm-api-tests - device_id, t_alarm seed"
git push origin main
```

---

## CI/CD ve imaj

- **beaver-iot-docker** `BEAVER_IMAGE` veya build pipeline’ı, **beaver-iot-main** ve **beaver-iot-web** repolarından imaj üretiyorsa, bu iki repoya yapılan push’tan sonra ilgili workflow’u tetikleyin (örn. `build-push-prebuilt-postgres` veya eşdeğeri).
- `BEAVER_IMAGE` değerini yeni imaja göre güncelleyin veya CI’ın ürettiği `latest`/tag’i kullanın.
- Imaj hazır olduktan sonra:
  1. `docker compose -f chirpstack-prebuilt-postgres.yaml up -d` (BEAVER_IMAGE set)
  2. `.\scripts\run-alarm-api-tests.ps1` (beaver’dan veya BEAVER_EXAMPLES_DIR ile)
  3. TEST_PLAN_ALARM_1_BACKEND_API.md ve TEST_PLAN_ALARM_2_FRONTEND_ENTEGRASYON.md adımlarını uygulayın.

---

## Özet

| Repo            | Değişenler                                      |
|-----------------|--------------------------------------------------|
| beaver-iot-main | alarm-service, t_alarm, changelog, pom           |
| beaver-iot-web  | /alarm, AlarmList, AlarmRules, widget link, i18n |
| beaver          | scripts/run-alarm-api-tests.ps1                  |
