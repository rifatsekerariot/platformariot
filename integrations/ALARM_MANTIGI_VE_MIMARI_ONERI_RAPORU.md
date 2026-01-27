# Alarm Mantığı ve Mimari Öneri Raporu

**Tarih:** 2026-01-27  
**Kaynaklar:** beaver-iot-docs-main (concepts, eventbus, entity-definition, workflow, build-integration, rest-api), beaver-iot-main, beaver-iot-web alarm widget / API beklentileri

**Kapsam:** Nasıl bir alarm mantığı kurulmalı — sadece rapor, kod yok.

---

## 1. beaver-iot-docs-main’den Özet: Alarm ile İlgili Dev Notları

### 1.1 Kavramlar (concepts.md)

| Entity tipi | Açıklama | Örnek |
|-------------|----------|--------|
| **Event** | "The notification that **requires action or attention**" — aksiyon veya dikkat gerektiren bildirim | **Button triggers, Temperature alerts** |
| | Mevcut değer: okuma/yazma yok. **Geçmiş: Sorgulama ✅, Ekleme ✅** | |

Yani dokümana göre **alarm/uyarı** doğal olarak **Event** tipi entity ile temsil ediliyor.

---

### 1.2 Eventbus (eventbus.md)

- **ExchangeEvent.EventType**:
  - `CALL_SERVICE` — servis çağrısı  
  - `UPDATE_PROPERTY` — property güncelleme  
  - **`REPORT_EVENT`** — **olay/event raporlama**

- **Event akışı:** Veri doğrulama → (sadece Property için) güncel değer kaydı → **geçmiş değer kaydı** → `@EventSubscribe` ile abone edilen metotların tetiklenmesi.

- **`@EventSubscribe`:** `payloadKeyExpression` (key / wildcard) ve `eventType` (örn. `REPORT_EVENT`) ile event’lere abone olunur. Örnek:
  - `eventType = ExchangeEvent.EventType.REPORT_EVENT`
  - `payloadKeyExpression = "my-integration.integration.detect_report.*"` (build-integration’daki report event örneği)

Özet: **REPORT_EVENT**, cihaz/entegrasyondan gelen **olay/uyarı (alarm benzeri)** bildirimleri için dokümante edilmiş mekanizma.

---

### 1.3 Entity tanımı (entity-definition.md)

- **Event entity:** `.event("event_entity")` veya `EntityType.EVENT`.
- **Değer kaydı:** `saveValues` / `publishSync` (veya `publishAsync`) ile Exchange yayımlanır; **Event için sadece geçmişe** yazılır (mevcut değer yok).
- **build-integration örneği:** `DetectReport` için `saveValues` + `publishSync` → `REPORT_EVENT` tetiklenir; başka bir servis `@EventSubscribe(..., REPORT_EVENT)` ile dinleyip “do something” (örn. log, rapor, **alarm kaydı**) yapabilir.

Bu, **alarm benzeri event’lerin** entegrasyon/cihaz tarafından Event entity + REPORT_EVENT ile gönderilmesi ve backend’de işlenmesiyle uyumlu.

---

### 1.4 Workflow (workflow.md)

- **Kullanım:** "threshold **alarms** and schedule switches" — eşik bazlı alarmlar ve zamanlama.
- **Entity Listener:** "Trigger the workflow when any entity data changes. **Example: threshold alarm.**"
- **Mevcut aksiyon node’ları:** Entity Assigner, Entity Selection, Service Invocation, Code.
- **Mevcut external node’lar:** Email, Webhook, HTTP Request, Output.

Önemli nokta: Workflow bugün sadece **tepki veriyor** (email, webhook, HTTP). **Alarm listesi / alarm widget’ı için kalıcı bir “alarm kaydı” yazan node yok.** Yani “threshold alarm” = Entity Listener + IF/ELSE + Email/Webhook → **bildirim** var, **alarm tablosu/API’ye yazılan kayıt** yok.

---

### 1.5 REST API (rest-api) ve OpenAPI

- **entity/history/search**, **entity/history/aggregate**, **entity/export** — Entity (Property/Event) geçmişi için var.
- **Alarm’a özel** bir endpoint (alarms/search, alarms/export, alarms/claim) **dokümanda yok.**

Sonuç: Alarm için **ayrı bir API ve veri katmanı** tasarlanmalı; docs’ta hazır şablon yok.

---

## 2. Mevcut Frontend / API Beklentileri (Özet)

- **POST /api/v1/alarms/search** — sayfalı arama (cihaz, tarih, alarm_status, keyword).
- **GET /api/v1/alarms/export** — CSV/Blob export.
- **POST /api/v1/alarms/claim** — `device_id` ile (cihaz bazlı) claim.
- **DeviceAlarmDetail:** id, alarm_status, alarm_time, alarm_content, latitude, longitude, address, device_id, device_name.

Yani: **cihaz merkezli**, **claimed/unclaimed** state’i olan, **konum ve içerik** alanları olan bir alarm modeli bekleniyor. Bu, sadece entity history (entity_id, timestamp, value) ile tam karşılanmıyor; **alarm’a özel bir katman** gerekli.

---

## 3. Önerilen Alarm Mantığı — Nasıl Bir Yapı Kurulmalı?

### 3.1 Alarm veri katmanı (depolama)

- **Ayrı bir alarm tablosu** (veya eşdeğer persistans) önerilir; entity history’yi doğrudan “alarm API” gibi kullanmak yeterli olmaz:

  - **alarm_status (claimed/unclaimed):** Entity modelinde yok; alarm’a özel.
  - **device_id, device_name, address:** Entity’den/cihazdan türetilebilir ama listeleme/claim/export için sabit bir alarm şeması daha net.
  - **alarm_content, alarm_time:** Event’in `value`’sunda tutulabilir ama alarm listesi için normalize edilmiş alanlar daha uygun.

- **Önerilen alanlar (fikri):**  
  `id`, `device_id`, `alarm_time`, `alarm_content`, `alarm_status` (aktif/claimed), `latitude`, `longitude`, `address`, `entity_key` (kaynak entity, opsiyonel), `source` (REPORT_EVENT | WORKFLOW | …), `tenant_id`, `created_at`.  
  (Detaylı şema implementasyon aşamasında netleştirilir.)

- **Claim:** `alarm_status`’u “claimed” yapmak. Frontend şu an `device_id` ile claim istiyor; anlam olarak “o cihazın (aktif) alarmlarını toplu claimed yap” uygun. İleride `alarm_id` ile tekil claim de eklenebilir.

---

### 3.2 Alarm kaynakları — Kayıtlar nereden gelsin?

Docs’taki Event, REPORT_EVENT ve Workflow modeliyle uyumlu üç kaynak önerilir:

| Kaynak | Açıklama | Docs uyumu |
|--------|----------|------------|
| **A) REPORT_EVENT (Event entity)** | Cihaz/entegrasyon, **Event** tipi entity ile `REPORT_EVENT` gönderir (ör. identifier’da `alarm`, `alert` geçen entity’ler). Backend’de `@EventSubscribe(payloadKeyExpression="...", eventType=REPORT_EVENT)` ile dinleyen bir servis, payload + device + device location’ı kullanarak **alarm tablosuna satır ekler**. | ✅ concepts (Event = alerts), eventbus (REPORT_EVENT), build-integration (report event + listener) |
| **B) Workflow “Raise Alarm” node’u (yeni)** | **Entity Listener** → **IF/ELSE** (eşik) → **Raise Alarm** (+ isteğe bağlı Email/Webhook). “Raise Alarm” aksiyon node’u, AlarmService.create(device_id, content, …) benzeri bir servis çağrısı yapar; böylece hem mevcut bildirim (email, webhook) hem de **alarm listesi / widget** için kayıt oluşur. | ✅ workflow (threshold alarm örneği); bugün sadece “reaksiyon” var, “kayıt” yok — bu node ile eklenir |
| **C) Property convention (isteğe bağlı)** | `*_alarm` / `*_status` gibi Property entity’lerde değer “truthy” (1, true, boş olmayan string vb.) olduğunda alarm üretmek. `@EventSubscribe(payloadKeyExpression="*.*.device.*.*_alarm", eventType=UPDATE_PROPERTY)` (veya benzeri) ile dinleyip, key pattern + değer kuralına uyuyorsa alarm satırı açmak. | ⚠️ Daha “sihirli”; net naming convention ve dokümantasyon gerekir |

Öncelik: **A** ve **B** docs ve mevcut mimariyle doğrudan uyumlu. **C** opsiyonel genişleme.

---

### 3.3 Convention: Hangi Event/Property “alarm” sayılır?

- **Event (REPORT_EVENT):**  
  - Entity `identifier` veya `key`’inde `alarm`, `alert` (veya yapılandırılabilir bir liste) geçenler **alarm sayılabilir**.  
  - Veya sadece belirli entity key’leri/tipleri yapılandırmada listelenir.

- **Property (C kullanılırsa):**  
  - `*_alarm`, `*_status` gibi bir convention dokümante edilir; sadece bu pattern’e uyanlar + truthy değer → alarm.

- **Workflow “Raise Alarm”:**  
  - Kullanıcı açıkça “alarm kaydı oluştur” dediği için ek convention gerekmez.

---

### 3.4 Workflow’un yeri

- **Mevcut:** Entity Listener → IF/ELSE → Email / Webhook = **sadece reaksiyon (bildirim)**. Alarm listesi beslenmiyor.
- **Öneri:**  
  - **“Raise Alarm” (veya “Alarm” / “Create Alarm”) aksiyon node’u** eklenmeli.  
  - Akış örneği: **Entity Listener** → **IF/ELSE** (eşik, vb.) → **Raise Alarm** + (opsiyonel) **Email / Webhook**.  
  - Böylece docs’taki “threshold alarm” hem **bildirimi** hem **alarm listesi / widget’ı** besler.

---

### 3.5 Entity Event tipinin kullanımı

- Docs: Event = “Temperature alerts” gibi aksiyon gerektiren bildirimler.
- **Entegrasyon/cihaz tarafı:**  
  - Uyarı/alarm için **Event** entity’leri tanımlanır (örn. `temperature_alert`, `door_alarm`).  
  - Değer/içerik uygun formatta (örn. `alarm_content`, severity, timestamp) `saveValues` + `publishSync` ile **REPORT_EVENT** olarak gönderilir.
- **Backend:**  
  - `@EventSubscribe(REPORT_EVENT)` ile dinleyen servis, bu event’leri alarm convention’a göre filtreleyip alarm tablosuna yazar; device, location (device’tan) bilgisi eklenir.

---

### 3.6 Claim semantiği

- Frontend: `claimDeviceAlarm({ device_id })`.
- **Öneri (v1):** Bu cihaza ait ve `alarm_status = aktif` olan tüm alarmları **claimed** yap. Basit ve mevcut API ile uyumlu.
- **İleride:** `alarm_id` (veya id listesi) ile tekil/toplu claim eklenebilir; o zaman `claim` isteği genişletilir.

---

### 3.7 REST API

- **POST /alarms/search** — sayfalı arama; `device_ids`, `start_timestamp`, `end_timestamp`, `alarm_status`, `keyword`, `timezone` (frontend `AlarmSearchCondition` + `SearchRequestType` ile uyumlu).
- **GET /alarms/export** — `AlarmSearchCondition` parametreleri; CSV/Blob.
- **POST /alarms/claim** — body’de `device_id` (ve ileride `alarm_id`/liste).

Bu, mevcut frontend tanımları ve ALARM_API_BEAVER_IOT_MAIN_RAPORU ile uyumludur.

---

### 3.8 Konum (latitude, longitude, address)

- Cihaz bazlı konum için **device location** API’si mevcut (`/device/{id}/location`).  
- Alarm kaydı oluşturulurken (REPORT_EVENT veya Workflow’tan):  
  - Önce **device’ın o anki konumu** kullanılır.  
  - Event payload’ında özel konum alanları varsa (örn. sensör konumu), isteğe bağlı override edilebilir; bu, ileride genişletme olarak bırakılabilir.

---

## 4. Docs’ta Eksik / Eklenebilecek Dev Notları

- **Alarm mimarisi:** concepts (Event), eventbus (REPORT_EVENT), entity-definition (Event, report event), workflow (Entity Listener, threshold) dağınık; **“Alarm mimarisi”** başlıklı tek bir dev notu:
  - Alarm = Event entity + REPORT_EVENT ve/veya Workflow “Raise Alarm” + ayrı alarm store/API.
  - Convention (hangi key’ler/tipler alarm), claim anlamı, kaynaklar (A, B, C).
- **REST API:** `/alarms/search`, `/alarms/export`, `/alarms/claim` için kısa spec (params, body, response) eklenmeli.
- **Workflow:** “Raise Alarm” (veya eşdeğer) aksiyon node’unun davranışı, input/output, örnek akış (Entity Listener + IF + Raise Alarm + Email) dokümante edilmeli.
- **build-integration / integration-introduce:** “Alarm/uyarı event’i raporlama” örneği: Event entity + `publishSync` (REPORT_EVENT) ve backend’de `@EventSubscribe` ile alarm kaydına dönüştürme adımları.

---

## 5. Kısa Özet — Nasıl Bir Alarm Mantığı?

| Konu | Öneri |
|------|--------|
| **Depolama** | Entity history’ye ek olarak **ayrı alarm tablosu** (alarm_status, device, content, time, location, source, tenant). |
| **Kaynak 1** | **REPORT_EVENT:** Event entity ile gelen uyarılar; `@EventSubscribe(REPORT_EVENT)` + key/type convention → alarm satırı. |
| **Kaynak 2** | **Workflow “Raise Alarm” node’u:** Entity Listener + IF/ELSE (eşik) + Raise Alarm (+ Email/Webhook); hem bildirim hem alarm listesi. |
| **Kaynak 3 (opsiyonel)** | **Property convention:** `*_alarm` / `*_status` + truthy + `UPDATE_PROPERTY` → alarm. |
| **Claim** | `alarm_status` ve `device_id` ile; önce cihaz bazlı toplu claim, isteğe bağlı ileride alarm_id. |
| **Konum** | Cihaz location API’sinden; gerekirse payload’dan override. |
| **REST** | POST /alarms/search, GET /alarms/export, POST /alarms/claim — frontend ile uyumlu. |
| **Docs** | Event, REPORT_EVENT, Workflow mevcut; alarm mimarisi, convention, API ve “Raise Alarm” node’u için ayrı dev notları eklenmeli. |

Bu yapı, beaver-iot-docs-main’deki kavramlar, eventbus, entity ve workflow notlarıyla uyumlu bir **alarm mantığı** sunar; implementasyon aşamasında alan adları, claim detayı ve C seçeneği netleştirilebilir.

---

*Bu rapor yalnızca analiz ve öneri içerir; kod üretilmemektedir.*
