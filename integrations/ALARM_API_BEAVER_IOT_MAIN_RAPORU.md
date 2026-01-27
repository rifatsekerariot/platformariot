# Alarm API'leri — beaver-iot-main Analiz Raporu

**Tarih:** 2026-01-27  
**Kapsam:** `beaver-iot-main` (backend core) + frontend API beklentileri

---

## 1. Özet

| Soru | Cevap |
|------|--------|
| **Alarm API'leri beaver-iot-main'de var mı?** | **Hayır.** |
| **Frontend alarm API kullanıyor mu?** | **Evet.** 3 endpoint bekliyor. |
| **Durum** | **EKSİK** — Backend'de `/alarms/*` endpoint'leri tanımlı değil; frontend 404 veya benzeri hata alır. |

---

## 2. beaver-iot-main İçinde Alarm ile İlgili Olanlar

### 2.1 REST API — Yok

- **`/alarms/search`**, **`/alarms/export`**, **`/alarms/claim`** → Hiçbir controller'da **tanımlı değil**.
- **DeviceController** (`/device`): create, search, update, batch-delete, getDetail, moveToGroup, getCanvas, setLocation, getLocation, clearLocation. **Alarm endpoint'i yok.**
- **EntityController** (`/entity`): history, aggregate, status, export, service/call vb. **Alarm’e özel bir şey yok.**
- Servis listesi: authentication, blueprint, canvas, credentials, dashboard, **device**, device-template, entity, entity-template, integration, mqtt, permission, resource-manager, user, workflow. **Alarm/alarms adında bir servis yok.**

### 2.2 Veritabanı — Alarm tablosu yok

- `application-standard/src/main/resources/db/` altındaki tüm SQL changelog’larda (H2, Postgres) **"alarm"** geçmiyor.
- `entity`, `entity_history`, `device`, `workflow` vb. tablolar var; **alarm tablosu yok.**

### 2.3 Sadece İsim Benzeri / Örnek Kullanımlar

| Dosya | İçerik |
|-------|--------|
| `DelayedQueueServiceProvider.java` | Javadoc örneği: `"alarm-cleanup"` kuyruk adı. Gerçek alarm API’si değil. |
| `SimpleAlarmComponent.java` | **Test** altında, kural motoru örnek bileşeni (`application-standard/src/test`). REST alarm API’si değil. |
| `_demo.yaml_`, `config-schema/*.json` | `simpleAlarmComponent` rule config örnekleri. |

Bunlar **alarm REST API’si** veya **alarm veri modeli** değil.

---

## 3. Frontend’in Beklediği Alarm API’leri

**Kaynak:** `beaver-iot-web/apps/web/src/services/http/device.ts`

| Frontend API | HTTP | Backend path (API_PREFIX=/api/v1) | Amaç |
|--------------|------|-----------------------------------|------|
| `getDeviceAlarms` | POST | `/api/v1/alarms/search` | Alarm listesi, sayfalama |
| `exportDeviceAlarms` | GET | `/api/v1/alarms/export` | Alarm export (Blob) |
| `claimDeviceAlarm` | POST | `/api/v1/alarms/claim` | Alarm sahiplenme (device_id) |

**İstek / response tipleri (frontend):**

- **Search:** `AlarmSearchCondition` + `SearchRequestType` → `SearchResponseType<DeviceAlarmDetail[]>`
  - `AlarmSearchCondition`: `keyword`, `device_ids`, `start_timestamp`, `end_timestamp`, `alarm_status?`, `timezone?`
- **Export:** `AlarmSearchCondition` → `Blob`
- **Claim:** `{ device_id }` → `void`

**DeviceAlarmDetail:**  
`id`, `alarm_status`, `alarm_time`, `alarm_content`, `latitude`, `longitude`, `address?`, `device_id`, `device_name`

**Kullanan yerler:**  
`plugins/alarm` → `useDeviceData`, `useMobileData`, `useAlarmClaim`, export (search-slot).

---

## 4. Eksikler

1. **`/alarms` resource’u**
   - `POST /alarms/search`
   - `GET /alarms/export`
   - `POST /alarms/claim`  
   Bu path’ler **beaver-iot-main’de yok.**

2. **Alarm veri modeli ve tablosu**
   - `DeviceAlarmDetail`’e uygun entity/tablo
   - Gerekirse `alarm_status`, `alarm_time`, `alarm_content`, konum, `device_id` ilişkisi

3. **Alarm servisi**
   - Arama, export, claim iş kuralları
   - İsteğe bağlı: entity/cihaz event’leriyle alarm üretimi

4. **Yetkilendirme**
   - Bu endpoint’ler için `OperationPermission` veya eşdeğer tanım (şu an endpoint olmadığı için yok).

---

## 5. beaver-iot-main Proje Yapısı (İlgili Kısım)

```
beaver-iot-main/
├── application/application-standard/   # Uygulama + db changelog (alarm yok)
├── core/                               # eventbus, context, rule-engine
├── extension-components/
└── services/
    ├── device/device-service/.../DeviceController.java   # alarm endpoint yok
    ├── entity/entity-service/.../EntityController.java   # alarm yok
    ├── dashboard/, user/, workflow/, mqtt/, ...
    └── (alarms veya alarm adında servis yok)
```

---

## 6. Sonuç ve Öneriler

### Sonuç

- **beaver-iot-main’de alarm REST API’leri yok ve alarm tablosu tanımlı değil.**
- Frontend alarm widget’ı `getDeviceAlarms`, `exportDeviceAlarms`, `claimDeviceAlarm` ile `/api/v1/alarms/*` çağırıyor; backend tarafında bu path’ler olmadığı için **çalışmaz (404 vb.).**

### Öneriler

1. **Alarm API’lerini beaver-iot-main’e eklemek**
   - `AlarmsController` (veya benzeri) ile:
     - `POST /alarms/search`
     - `GET /alarms/export`
     - `POST /alarms/claim`
   - Frontend’deki path ve `API_PREFIX` ile uyumlu (`/api/v1` öneki deploy’a göre nginx/gateway’de olabilir; controller `@RequestMapping("/alarms")` yeterli).

2. **Veri modeli ve DB**
   - `DeviceAlarmDetail` ve `AlarmSearchCondition`’a uygun entity/DTO
   - Yeni migration ile alarm tablosu
   - Device ilişkisi ve gerekli indeksler

3. **İş kuralları**
   - Alarm kaynağı: entity event / cihaz event’leri, manuel giriş veya entegrasyon. Hangi senaryo desteklenecekse servis katmanında netleştirilmeli.

4. **Alarm widget’ın "Add widget"ta görünmesi**
   - `useFilterPlugins` ile `alarm`’ın filtreden çıkarılması (önceki ALARM_WIDGET_DURUM_RAPORU.md ile uyumlu).  
   - Bu sadece UI; **backend’de endpoint yoksa widget yine çalışmaz.**

---

*Bu rapor `beaver-iot-main` ve `beaver-iot-web` klasörlerinin analizine dayanmaktadır.*
