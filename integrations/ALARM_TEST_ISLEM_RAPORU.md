# Alarm Test İşlem Raporu

**Tarih:** 2026-01-27  
**Kapsam:** Test Plan 1 (Backend API), Test Plan 2 (Frontend) — otomatik/manuel kontroller ve kod doğrulaması.

---

## 1. Yapılan İşlemler

### 1.1 Test script: `-QuickCheck` modu

`scripts/run-alarm-api-tests.ps1` içine **-QuickCheck** parametresi eklendi. Giriş yapmadan:

- `POST /api/v1/alarms/search` (auth yok) → **401** (endpoint mevcut)
- `GET /alarm` → **200** (SPA route)
- `GET /` → **200**

**Çalıştırma:**
```powershell
.\scripts\run-alarm-api-tests.ps1 -QuickCheck
```

**Sonuç:** Üç kontrol de PASS.

---

### 1.2 Backend API (Test Plan 1) — Tam akış

Tam akış için **geçerli kullanıcı** ile giriş gerekir. `testalarm@test.local` / `Test123!` sistemde yok; login: `"username not found"`.

**Yapılacaklar:**
1. `http://localhost:9080/auth/register` ile kullanıcı oluştur (email, nickname, password)
2. `$env:USER_EMAIL='...'; $env:USER_PASSWORD='...'`
3. `.\scripts\run-alarm-api-tests.ps1` (parametresiz)

Bu koşulla script: register/login → device search → `t_alarm` seed → `POST /alarms/search` → `GET /alarms/export` → `POST /alarms/claim` → search ile claimed doğrulaması yapar.

---

### 1.3 Frontend (Test Plan 2) — Kod ve HTTP doğrulaması

Tarayıcı MCP kullanılamadığı için **kod incelemesi** ve **HTTP istekleri** ile doğrulandı.

| Kontrol | Sonuç | Not |
|---------|-------|-----|
| `GET /` | 200 | SPA ana sayfa |
| `GET /alarm` | 200 | Route çözülüyor, client-side |
| **Route /alarm** | Var | `routes.tsx`: `path: '/alarm'`, lazy `@/pages/alarm`, handle: `alarm.title`, `PERMISSIONS.DEVICE_MODULE` |
| **Alarm sayfası** | Var | `pages/alarm/index.tsx`: Tabs "Alarm listesi" \| "Alarm kuralları", `AlarmList`, `AlarmRules` |
| **AlarmRules** | Placeholder | `alarm.placeholder_rules` / "Alarm kuralları (if-then) yakında eklenecek." |
| **Widget "Kuralları yönet"** | Var | `plugins/alarm/view/index.tsx`: `<Link to="/alarm">` + `getIntlText('alarm.manage_rules') \|\| 'Kuralları yönet'`; `!isPreview && !context?.isEdit` iken gösteriliyor |
| **deviceAPI** | Uyumlu | `getDeviceAlarms` → `POST /alarms/search`, export → `GET /alarms/export`, `claimDeviceAlarm` → `POST /alarms/claim` |
| **i18n** | Var | `alarm.title`, `tab_list`, `tab_rules`, `placeholder_rules`, `manage_rules` (en, cn) |

---

## 2. Özet

| # | Adım | Durum |
|---|------|-------|
| 1 | `-QuickCheck`: POST /alarms/search → 401 | PASS |
| 2 | `-QuickCheck`: GET /alarm, / → 200 | PASS |
| 3 | Tam Backend (search/export/claim) | Kullanıcı girişi gerekli |
| 4 | Route /alarm, AlarmList, AlarmRules, widget linki | Kodda mevcut |
| 5 | Tarayıcı ile giriş → Alarm menüsü, liste, claim, export | Manuel (MCP yok) |

---

## 3. Kullanım

- **Hızlı doğrulama (CI/otomatik):**  
  `.\scripts\run-alarm-api-tests.ps1 -QuickCheck`

- **Tam Backend testi:**  
  Kayıt/giriş yapıldıktan sonra `$env:USER_EMAIL` ve `$env:USER_PASSWORD` ile  
  `.\scripts\run-alarm-api-tests.ps1`

- **Frontend manuel:**  
  Giriş → Alarm menüsü → /alarm → Liste (filtre, claim, export) ve Kurallar sekmesi (placeholder); dashboard’ta alarm widget → "Kuralları yönet" → /alarm.

---

## 4. Referanslar

- `TEST_PLAN_ALARM_1_BACKEND_API.md`
- `TEST_PLAN_ALARM_2_FRONTEND_ENTEGRASYON.md`
- `scripts/run-alarm-api-tests.ps1`
