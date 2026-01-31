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
- **Not:** 188.132.211.100 gibi deploy edilen sunucuda 500 devam ediyorsa, **yeni Docker imajının deploy edilmesi gerekir**. CI/CD tamamlandıktan sonra `docker compose pull` ve `docker compose up -d` ile güncelleme yapın.

### 3.6 static-path-pattern + ResourceHandlerConfig + setDefaultProperties (2026-01-31)
- **Sorun:** Spring Boot 3.2+ ile `add-mappings: false` resource handler'ı tam devre dışı bırakmıyor; `/alarms/search` statik kaynak sanılıp "No static resource" 500 veriyor.
- **Çözüm:** (1) `spring.mvc.static-path-pattern: /static/**` + `add-mappings: false`. (2) `ResourceHandlerConfig` — sadece `/static/**` handler ekleyen WebMvcConfigurer. (3) `StandardApplication.setDefaultProperties` — `spring.web.resources.add-mappings=false`, `spring.mvc.static-path-pattern=/static/**` varsayılan olarak ayarlandı (yml yüklenmese bile geçerli).

### 3.7 Savunmacı Hata Yönetimi (2026-01-31)
- **AlarmService, AlarmRuleService:** `TenantContext.getTenantId()` yerine `tryGetTenantId()` kullanıldı; tenant yoksa 403 döner (500 değil).
- **AlarmRuleService:** `IllegalArgumentException` yerine `ServiceException` (DATA_NO_FOUND, PARAMETER_VALIDATION_FAILED) kullanıldı.
- **DefaultExceptionHandler:** `IllegalArgumentException` "TenantContext" içeriyorsa 403 döner.

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

### 4.5 Teşhis: Actuator mappings ve /__ping
```bash
# Yeni imaj deploy edildikten sonra:

# 1. Mappings kontrolü (alarms/search map'li mi?)
curl -s http://188.132.211.100:9080/actuator/mappings | grep -E "alarms/search|alarms/rules"

# 2. Debug ping (DispatcherServlet çalışıyor mu? debug.ping.enabled=true gerekir)
curl http://188.132.211.100:9080/__ping
# "ok" dönerse routing çalışıyor. "No static resource" → DispatcherServlet/routing sorunu.
```

### 4.6 Nginx Path Uyumu
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
- [ ] `GET /actuator/mappings` → alarms/search map'li
- [ ] (Opsiyonel) `debug.ping.enabled=true` ile `GET /__ping` → "ok"

---

## 6. Kritik Teşhis Kontrolü (2026-01-31)

### 6.1 Aktif profile
- **Stack env:** `SPRING_OPTS=--spring.profiles.active=dev`
- **Sonuç:** Profile `dev`. `application-dev.yml` yok → sadece `application.yml` yüklenir. Config (add-mappings, static-path-pattern) burada, yükleniyor.

### 6.2 /actuator/mappings
- **Önce:** Sadece `health,metrics,prometheus,info` — mappings yok.
- **Yapılan:** `mappings` eklendi. Nginx `location /actuator/` ile proxy eklendi.
- **Kontrol:** `GET http://host:9080/actuator/mappings` → JSON'da `/alarms/search`, `/api/v1/alarms/search` arayın.

### 6.3 @EnableWebMvc
- **Grep sonucu:** Hiçbir yerde `@EnableWebMvc` yok (sadece TraceWebMvcConfigurer yorumunda).
- **Sonuç:** Spring Boot auto-config aktif.

### 6.4 WebMvcConfigurer çakışması
- **ResourceHandlerConfig:** Sadece `/static/**` ekliyor.
- **TraceWebMvcConfigurer:** Trace interceptor, resource handler yok.
- **ContextWebMvcConfigurer:** Locale interceptor, resource handler yok.
- **Sonuç:** Hiçbiri `/**` resource handler eklemiyor.

### 6.5 Controller JAR'da mı?
- **pom.xml:** `alarm-service` dependency var.
- **Build:** `-am -pl application/application-standard` ile alarm modülü dahil.
- **Sonuç:** AlarmsController fat JAR'da olmalı. Startup log'da mapping satırları beklenir.

### 6.6 Çifte path strip (Vite + Nginx)
- **Vite proxy:** Sadece dev modda (`npm run dev`). `rewrite` ile `/api/v1` kaldırır.
- **Production:** Vite yok; frontend aynı origin'e `POST /api/v1/alarms/search` atar. Nginx strip eder.
- **Sonuç:** Prod'da çifte strip yok.

### 6.7 DebugController /__ping (teşhis)
- **Eklenen:** `DebugController` — `GET /__ping` → "ok". `debug.ping.enabled=true` iken aktif.
- **Nginx:** `location = /__ping` proxy eklendi.
- **Kullanım:** `debug.ping.enabled=true` env ile ayağa kaldır, `GET /__ping` dene. "No static resource" verirse routing/DispatcherServlet sorunu var.

### 6.8 Özet (olasılık sırasıyla)
1. ~~Yanlış profile~~ — dev kullanılıyor, application.yml yükleniyor.
2. Controller JAR'da — pom doğru; startup log ile doğrulanmalı.
3. ~~WebMvcConfigurer/@EnableWebMvc override~~ — yok.
4. ~~Çifte strip~~ — prod'da yok.
5. **Deploy edilen imaj eski** — en olası: yeni config/handler değişiklikleri imajda yok.
6. **Handler sıralaması** — ResourceHttpRequestHandler hâlâ önce çalışıyor olabilir (deploy sonrası kontrol).

### 6.9 Senaryo analizi (/actuator/mappings tek hakem)

| Senaryo | mappings'te /alarms/search | Sonuç |
|---------|----------------------------|-------|
| **A** | YOK | Controller ApplicationContext'te yok → %70 eski Docker imajı |
| **B** | VAR, ama istek No static resource | İstek DispatcherServlet'e gelmiyor → Nginx/gateway sorunu |
| **C** | VAR, /__ping çalışıyor, /alarms/search çalışmıyor | Mapping çatışması |

### 6.10 Kod tabanı kontrolleri (yapıldı)

- **@Controller + /alarms:** Sadece AlarmsController (@RestController). View controller çatışması yok.
- **SpringApplication.run:** Tek main — `StandardApplication`; monolith `java -jar /application.jar` ile çalışıyor.
- **DispatcherServlet:** Spring Boot varsayılanı `'/'`; `server.servlet.context-path` yok (sadece websocket'te).
- **Nginx location:** `/api/v1/alarms/search` → `location /api/v1/` (en uzun prefix) → backend `/alarms/search`.

### 6.11 TRACE log (kanıt için)

Request Spring MVC'ye giriyor mu?
```yaml
# application.yml veya SPRING_OPTS ile geçici
logging:
  level:
    org.springframework.web.servlet.DispatcherServlet: TRACE
    org.springframework.web.servlet.resource: TRACE
```
`/alarms/search` isteği sonrası: DispatcherServlet log yoksa → request Spring'e hiç gelmiyor (nginx/servlet).

---

## 7. Ek Notlar

- **Frontend API path:** `API_PREFIX` = `/api/v1`; istekler `/api/v1/alarms/search`, `/api/v1/alarms/rules` vb.
- **Vite dev proxy:** `rewrite: path => path.replace(/^\/api\/v1/, '')` → backend’e `/alarms/...` gider.
- **Production:** Nginx aynı strip mantığı ile `/alarms/...` iletir.
- **Alternatif:** `server.servlet.context-path=/api/v1` kullanılırsa nginx **strip etmemeli**; `proxy_pass .../api/v1/` ile path korunmalı.

---

## 8. İlgili Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `NO_RESOURCE_ALARMS_SEARCH_FIX.md` | Önceki teşhis dokümanı |
| `integrations/ALARM_TEST_ISLEM_RAPORU.md` | Test prosedürü |
| `integrations/scripts/run-alarm-api-tests.ps1` | API test script |
| `scripts/verify-alarm-postgres.ps1` | DB + API hızlı doğrulama |
