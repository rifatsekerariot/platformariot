# Alarm Sayfası 500 Hataları — Teşhis ve Çözüm Planı

**Tarih:** 2026-01-28  
**Hedef:** Alarm sayfasındaki 500 / "No static resource" hatalarını gidermek, backend'i çalışır hale getirmek.

---

## 1. Mevcut Backend Karşılığı (Yazıldı ✓)

Alarm sayfası için backend **tam** karşılık mevcut:

| Bileşen | Durum | Açıklama |
|---------|-------|----------|
| **AlarmsController** | ✓ | `/alarms` ve `/api/v1/alarms` path'leri |
| **Alarm list** | ✓ | `POST /alarms/search`, `GET /alarms/export`, `POST /alarms/claim` |
| **Alarm rules** | ✓ | `GET/POST /alarms/rules`, `GET/PUT/DELETE /alarms/rules/{id}`, `POST /alarms/rules/batch-delete` |
| **t_alarm** tablosu | ✓ | Liquibase `alarm.sql` |
| **t_alarm_rule** tablosu | ✓ | Liquibase `alarm_rule.sql` |
| **AlarmService, AlarmRuleService** | ✓ | Device facade ile entegre |
| **application-standard pom** | ✓ | `alarm-service` dependency |
| **services pom** | ✓ | `alarm` modülü |

---

## 2. 500 Hata Nedeni (Teşhis)

**Hata:** `"error_code": "server_error", "error_message": "No static resource alarms/rules"`

**Anlam:** İstek `AlarmsController` ile eşleşmiyor; Spring onu statik kaynak isteği sanıp `ResourceHttpRequestHandler`'a gönderiyor. Kaynak bulunamayınca `NoResourceFoundException` fırlıyor ve 500 dönüyor.

**Olası nedenler:**
1. Static resource mapping hâlâ aktif (`add-mappings` false olmamış veya farklı property)
2. Controller mapping’e ulaşmadan önce path/proxy uyumsuzluğu
3. Deploy edilen imaj eski (yeni config/handler değişiklikleri yok)

---

## 3. Yapılan Düzeltmeler

### 3.1 application.yml
- `spring.mvc.throw-exception-if-no-handler-found: true`
- `spring.resources.add-mappings: false`
- `spring.web.resources.add-mappings: false`

### 3.2 DefaultExceptionHandler
- `NoHandlerFoundException` ve `NoResourceFoundException` için 404 handler
- `Exception` / `Throwable` / `getErrorResponse` içinde cause zincirinde bu türleri bulup 404 döndürme

### 3.3 AlarmsController
- `@RequestMapping(value = { "/alarms", "/api/v1/alarms" })` — Hem strip’li hem prefix’li path desteği

### 3.4 Integration Test
- `AlarmsControllerIntegrationTest` — Endpoint’lerin 404/500 vermemesini doğrular (401/403 beklenir)

### 3.5 @EnableWebMvc Kaldırıldı (2026-01-31 — Kök Neden)
- **Sorun:** `TraceWebMvcConfigurer` sınıfında `@EnableWebMvc` kullanımı Spring Boot'un web auto-configuration'ını devre dışı bırakıyordu. Bu da `ResourceHttpRequestHandler` sıralamasını bozup API isteklerini statik kaynak olarak işlenmeye zorluyordu → 500 "No static resource alarms/rules".
- **Çözüm:** `@EnableWebMvc` kaldırıldı. Sadece `WebMvcConfigurer` (interceptor için) yeterli; Spring Boot otomatik yapılandırması korunuyor.

---

## 4. Yapılacaklar (Sırayla)

### 4.1 Backend Derleme ve Test
```bash
cd backend
mvn clean package -pl application/application-standard -am -DskipTests
mvn test -pl application/application-standard -Dtest=AlarmsControllerIntegrationTest
```

### 4.2 Startup Log Kontrolü
Uygulama ayağa kalkarken şu satırlar görünmeli:
```
Mapped "{[/alarms/search],methods=[POST]}" onto ... AlarmsController.search
Mapped "{[/alarms/rules],methods=[GET]}" onto ... AlarmsController.listRules
Mapped "{[/api/v1/alarms/search],methods=[POST]}" ...
Mapped "{[/api/v1/alarms/rules],methods=[GET]}" ...
```

Bu satırlar yoksa: alarm-service JAR’da değil veya component-scan dışında.

### 4.3 Alarm API Test Script
```powershell
# Hızlı kontrol (auth yok -> 401 beklenir)
cd c:\Projeler\platformariot
.\integrations\scripts\run-alarm-api-tests.ps1 -QuickCheck
```

401 alıyorsan endpoint çalışıyordur. 404/500 ise routing/config sorunu var.

### 4.4 Docker İmajı Yeniden Build
CI/CD veya lokal build ile monolith imajı **yeniden** oluşturulmalı:
```bash
# build-prebuilt.sh veya build.sh
# Sonrasında deploy
```

### 4.5 Nginx Path Uyumu
`build-docker/nginx/templates/default.conf.template`:
```nginx
location /api/v1/ {
   proxy_pass http://${BEAVER_IOT_API_HOST}:${BEAVER_IOT_API_PORT}/;
   ...
}
```
`/` trailing slash: `/api/v1` kaldırılır, backend’e `/alarms/rules` gider. Controller `/alarms` map’lendiği için uyumlu.

---

## 5. Hızlı Checklist

- [ ] `application-standard` build başarılı
- [ ] `AlarmsControllerIntegrationTest` geçiyor
- [ ] Startup log’da alarm mapping’leri var
- [ ] `run-alarm-api-tests.ps1 -QuickCheck` → 401
- [ ] Monolith Docker imajı yeniden build edildi
- [ ] Deploy sonrası alarm sayfası 500 vermiyor

---

## 6. Ek Notlar

- **Frontend API path:** `API_PREFIX` = `/api/v1`; istekler `/api/v1/alarms/search`, `/api/v1/alarms/rules` vb.
- **Vite dev proxy:** `rewrite: path => path.replace(/^\/api\/v1/, '')` → backend’e `/alarms/...` gider.
- **Production:** Nginx aynı strip mantığı ile `/alarms/...` iletir.
- **Alternatif:** `server.servlet.context-path=/api/v1` kullanılırsa nginx **strip etmemeli**; `proxy_pass .../api/v1/` ile path korunmalı.

---

## 7. İlgili Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `NO_RESOURCE_ALARMS_SEARCH_FIX.md` | Önceki teşhis dokümanı |
| `integrations/ALARM_TEST_ISLEM_RAPORU.md` | Test prosedürü |
| `integrations/scripts/run-alarm-api-tests.ps1` | API test script |
| `scripts/verify-alarm-postgres.ps1` | DB + API hızlı doğrulama |
