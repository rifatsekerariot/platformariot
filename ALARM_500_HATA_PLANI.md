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

### 4.6 Static Kaynak (alarms/search) — Doğrulama Checklist'i

"No static resource alarms/search" hatası için aşağıdaki adımların projede uygulandığı doğrulanabilir:

| # | Kontrol | Konum | Durum |
|---|---------|--------|-------|
| 1 | **Controller mapping** — `@RestController` + `@RequestMapping("/alarms")` + `@PostMapping("/search")` | `backend/services/alarm/.../AlarmsController.java` | ✓ |
| 2 | **Static resource pattern** — `spring.mvc.static-path-pattern: /static/**`, `add-mappings: false` | `application-standard/src/main/resources/application.yml` | ✓ |
| 3 | **WebMvcConfigurer** — Sadece `/static/**` handler, `/**` yok | `backend/core/base/.../ResourceHandlerConfig.java` | ✓ |
| 4 | **Varsayılan ayar** — yml yüklenmese bile `static-path-pattern` ve `add-mappings` | `StandardApplication.setDefaultProperties(...)` | ✓ |
| 5 | **@EnableWebMvc yok** — Otomatik web config bozulmasın | `TraceWebMvcConfigurer` sadece `WebMvcConfigurer` implement eder | ✓ |
| 6 | **Güvenlik** — `/alarms/**` veya `/api/v1/**` permit/authenticated | OAuth2/security config — ignore list veya matcher ile kontrol edin | — |

**İsteğe bağlı debug loglama** (teşhis için, prod’da kapatın):

```yaml
# application.yml veya application-dev.yml
logging:
  level:
    org.springframework.web: DEBUG
    org.springframework.web.servlet.mvc: TRACE
```

Startup’ta `Mapped "{[/alarms/search],methods=[POST]}"` görünmeli; görünmüyorsa component-scan veya JAR içeriği kontrol edin.

---

### 4.7 Nginx Path Uyumu
`build-docker/nginx/templates/default.conf.template`:
```nginx
location /api/v1/ {
   proxy_pass http://${BEAVER_IOT_API_HOST}:${BEAVER_IOT_API_PORT}/;
   ...
}
```
`/` trailing slash: `/api/v1` kaldırılır, backend’e `/alarms/rules` gider. Controller `/alarms` map’lendiği için uyumlu.

---

## 5. Hâlâ Aynı Hatayı Alıyorsanız — Kritik Kontroller

Tüm kod değişiklikleri yapıldığı halde 500 devam ediyorsa aşağıdaki kontrolleri **sırayla** yapın.

### 5.1 Docker imajı güncel mi?

Değişiklikler kod tabanında var ama **çalışan container içindeki JAR eski** olabilir.

```bash
# 1. Container'daki JAR dosyasını kontrol edin
docker exec -it <container_name> ls -lh /application.jar

# 2. JAR içinde AlarmsController var mı?
docker exec -it <container_name> unzip -l /application.jar | grep AlarmsController

# 3. JAR içinde application.yml doğru mu? (static-path-pattern görünmeli)
docker exec -it <container_name> unzip -p /application.jar BOOT-INF/classes/application.yml | grep -A5 "spring.mvc"
```

**JAR içinde değişiklikler yoksa:** Yeni imaj build edip container'ı yenileyin:

```bash
cd backend
mvn clean package -pl application/application-standard -am -DskipTests

# Docker imajını yeniden build (build-docker veya CI/CD script'iniz)
cd ../build-docker
docker build -t your-app:latest .

# Container'ları yeniden başlatın
docker compose down
docker compose pull   # Registry kullanıyorsanız
docker compose up -d
```

### 5.2 Mappings kontrolü

```bash
# Actuator mappings — alarms map'li mi?
curl -s http://188.132.211.100:9080/actuator/mappings | grep -i "alarms"
```

- **Boş dönüyorsa:** Controller ApplicationContext'e yüklenmiyor **veya** eski imaj çalışıyor.
- **Görünüyorsa:** Mapping var; istek DispatcherServlet'e gelmiyorsa Nginx/proxy tarafını kontrol edin.

### 5.3 Startup loglarını inceleyin

```bash
docker logs <container_name> 2>&1 | grep -i "mapped.*alarms"
```

**Görmeniz gereken satırlar:**
```
Mapped "{[/alarms/search],methods=[POST]}" onto ...
Mapped "{[/api/v1/alarms/search],methods=[POST]}" onto ...
```

Bu satırlar **yoksa** Controller yüklenmiyor (JAR'da yok veya component-scan dışında).

### 5.4 __ping endpoint'i çalışıyor mu?

```bash
# DebugController aktif mi? (debug.ping.enabled=true gerekir)
curl http://188.132.211.100:9080/__ping
```

- **"ok" dönüyorsa:** DispatcherServlet çalışıyor; `/alarms/search` için handler eşleşmesi veya sıra sorunu olabilir.
- **"ok" dönmüyorsa / No static resource:** DispatcherServlet veya routing sorunu; `debug.ping.enabled=true` ile tekrar deneyin.

### 5.5 Alarm servisi JAR'da mı? (lokal fat JAR)

```bash
cd backend/application/application-standard/target
jar tf application-standard-*.jar | grep "com/milesight/beaveriot/alarm"
```

`AlarmsController`, `AlarmService` vb. sınıflar görünmeli. Görünmüyorsa `alarm-service` modülü fat JAR'a dahil edilmemiştir.

### 5.6 Component scan kontrolü

`StandardApplication.java` **@ComponentScan tanımlı değil** — varsayılan olarak `com.milesight.beaveriot` ve alt paketleri taranır. Alarm controller `com.milesight.beaveriot.alarm.controller` altında olduğu için **ekstra scan gerekmez**.

Eğer ileride özel paket kullanırsanız:

```java
@SpringBootApplication
@ComponentScan(basePackages = {
    "com.milesight.beaveriot",
    "com.milesight.beaveriot.alarm"
})
public class StandardApplication { ... }
```

### 5.7 Maven build kontrolü

```bash
cd backend
mvn clean package -pl application/application-standard -am -X 2>&1 | grep -i "alarm"
```

"Building alarm-service" veya alarm modülüne ait satırlar görünmeli. Görünmüyorsa `application-standard/pom.xml` içinde `alarm-service` dependency'sini kontrol edin.

### 5.8 TRACE log ile teşhis (son çare)

`application.yml` veya `application-dev.yml` dosyasına ekleyin (prod'da kapatın):

```yaml
logging:
  level:
    org.springframework.web: TRACE
    org.springframework.web.servlet: TRACE
    org.springframework.web.servlet.mvc: TRACE
    org.springframework.web.servlet.resource: TRACE

debug:
  ping:
    enabled: true
```

Sonra istek atıp logları inceleyin:

```bash
docker logs -f <container_name> 2>&1 | grep -E "DispatcherServlet|ResourceHttpRequestHandler|alarms/search"
```

**Logda arayın:**

| Durum | Anlam |
|-------|--------|
| `DispatcherServlet: POST "/alarms/search"` | İstek Spring'e geliyor — handler eşleşmesi veya sıra sorunu |
| `ResourceHttpRequestHandler` | Hâlâ static kaynak olarak işleniyor — static-path-pattern / ResourceHandlerConfig kontrolü |
| Hiçbir log yok | İstek Spring'e hiç gelmiyor — Nginx/proxy veya context-path sorunu |

### 5.9 Kritik Kontroller — Çalıştırma Raporu (Örnek)

Aşağıdaki sonuçlar checklist'e göre **tek seferlik** çalıştırılmıştır. Ortamınızda Maven/Docker erişimi varsa aynı adımları tekrarlayın.

| Kontrol | Sonuç | Not |
|---------|--------|-----|
| **5.6 Component scan** | ✅ Geçti | `StandardApplication` içinde `@ComponentScan` yok; varsayılan paket `com.milesight.beaveriot` ve alt paketleri (alarm dahil) taranıyor. |
| **5.7 Maven build** | ⚠️ Çalıştırılamadı | Bu ortamda `mvn` PATH'te yok. Lokal ortamda: `mvn clean package -pl application/application-standard -am -DskipTests` çalıştırın. |
| **5.5 Fat JAR içeriği** | ⚠️ Atlandı | `target/` yok (build yapılmadı). Build sonrası: `jar tf application-standard-*.jar \| grep com/milesight/beaveriot/alarm` ile doğrulayın. |
| **pom.xml alarm-service** | ✅ Var | `application-standard/pom.xml` içinde `alarm-service` dependency tanımlı. |
| **5.2 Actuator mappings** | ⚠️ 500 | `GET http://188.132.211.100:9080/actuator/mappings` sunucu 500 döndü. Auth veya sunucu hatası olabilir; canlı ortamda tekrar deneyin. |
| **5.4 __ping** | ⚠️ 401 | `GET http://188.132.211.100:9080/__ping` → 401 Unauthorized. Endpoint erişime kapalı veya auth gerekiyor. |
| **5.1 / 5.3 Docker** | ⚠️ Çalıştırılamadı | Bu ortamda Docker daemon yok/çalışmıyor. Container varsa: `docker exec ... unzip -l /application.jar \| grep AlarmsController`, `docker logs ... \| grep mapped.*alarms` çalıştırın. |

**Yapılacaklar (manuel):**

1. Maven kurulu bir ortamda `mvn clean package -pl application/application-standard -am -DskipTests` çalıştırıp build alın.
2. Build sonrası `jar tf application-standard-*.jar | grep com/milesight/beaveriot/alarm` ile AlarmsController vb. sınıfların JAR'da olduğunu doğrulayın.
3. Docker imajını yeniden build edip deploy edin; container loglarında `Mapped "{[/alarms/search]` satırlarını kontrol edin.
4. Canlı sunucuda actuator/mappings ve __ping için auth/ayar kontrolü yapın (gerekirse `debug.ping.enabled=true` ve actuator exposure).

### 5.10 Lokal Docker test sonuçları (örnek çalıştırma)

Lokal Docker üzerinde `scripts\alarm-docker-checklist.ps1` çalıştırıldı. Container: **beaver-iot**, port: **9080** (nginx).

| Kontrol | Sonuç | Açıklama |
|---------|--------|----------|
| **5.1 JAR** | `/application.jar` mevcut (368 MB) | Dosya var. |
| **5.1 AlarmsController** | **JAR'da YOK** | `jar tf /application.jar \| grep alarm` boş; imaj **alarm modülü olmadan** build edilmiş. |
| **5.3 Startup log** | **Mapped ... alarms YOK** | Controller yüklenmemiş (JAR'da olmadığı için beklenen durum). |
| **5.2 Actuator mappings** | **alarms mapping YOK** | Aynı neden. |
| **5.4 __ping** | SPA HTML döndü | Nginx `/__ping` → backend; backend yanıtlamıyorsa nginx fallback ile SPA dönebiliyor. |

**Sonuç:** Çalışan **beaver-iot** imajı alarm servisini içermiyor. Alarm 500’ü gidermek için:

1. **Backend’i alarm ile build edin:**  
   `mvn clean package -pl application/application-standard -am -DskipTests`
2. **Docker imajını yeniden build edin** (build-docker’da `beaver-iot-api-local.dockerfile` ile API, ardından monolith).  
   `-am` ile alarm modülü dahil edilmiş olmalı.
3. **Container’ı yeniden başlatın:**  
   `docker compose down` → `docker compose up -d` (build-docker dizininde).
4. **Tekrar kontrol:**  
   `.\scripts\alarm-docker-checklist.ps1` — JAR’da alarm, startup’ta `Mapped ... alarms` ve actuator’da alarms görünmeli.

### GitHub CI: Alarm modülü ile build (2026-02-01)

- **Workflow** (`.github/workflows/build-push-prebuilt.yaml`):
  - **Verify API image contains alarm module:** Build sonrası API imajında `jar tf /application.jar | grep alarm-service|alarm/` ile alarm modülü aranıyor; yoksa CI fail.
  - **PostgreSQL stack smoke test + alarm verification:** Stack ayağa kalktıktan sonra `/actuator/mappings` içinde alarms mapping ve `POST /api/v1/alarms/search` (401/403 beklenir) kontrol ediliyor; mapping yoksa CI fail.
- **Dockerfile** (`build-docker/beaver-iot-api-local.dockerfile`): `-am` ile alarm-service dahil build yorumu eklendi.
- **Tetikleme:** `backend/**` path'inde push (alarm dahil) veya `workflow_dispatch` ile build tetiklenir; imaj GHCR'a push edilir.

---

## 6. Hızlı Checklist

- [ ] `application-standard` build başarılı
- [ ] `AlarmsControllerIntegrationTest` geçiyor
- [ ] Startup log'da alarm mapping'leri var
- [ ] `run-alarm-api-tests.ps1 -QuickCheck` → 401
- [ ] Monolith Docker imajı yeniden build edildi
- [ ] Deploy sonrası alarm sayfası 500 vermiyor
- [ ] `GET /actuator/mappings` → alarms/search map'li
- [ ] (Opsiyonel) `debug.ping.enabled=true` ile `GET /__ping` → "ok"

---

## 7. Kritik Teşhis Kontrolü (2026-01-31)

### 7.1 Aktif profile
- **Stack env:** `SPRING_OPTS=--spring.profiles.active=dev`
- **Sonuç:** Profile `dev`. `application-dev.yml` yok → sadece `application.yml` yüklenir. Config (add-mappings, static-path-pattern) burada, yükleniyor.

### 7.2 /actuator/mappings
- **Önce:** Sadece `health,metrics,prometheus,info` — mappings yok.
- **Yapılan:** `mappings` eklendi. Nginx `location /actuator/` ile proxy eklendi.
- **Kontrol:** `GET http://host:9080/actuator/mappings` → JSON'da `/alarms/search`, `/api/v1/alarms/search` arayın.

### 7.3 @EnableWebMvc
- **Grep sonucu:** Hiçbir yerde `@EnableWebMvc` yok (sadece TraceWebMvcConfigurer yorumunda).
- **Sonuç:** Spring Boot auto-config aktif.

### 7.4 WebMvcConfigurer çakışması
- **ResourceHandlerConfig:** Sadece `/static/**` ekliyor.
- **TraceWebMvcConfigurer:** Trace interceptor, resource handler yok.
- **ContextWebMvcConfigurer:** Locale interceptor, resource handler yok.
- **Sonuç:** Hiçbiri `/**` resource handler eklemiyor.

### 7.5 Controller JAR'da mı?
- **pom.xml:** `alarm-service` dependency var.
- **Build:** `-am -pl application/application-standard` ile alarm modülü dahil.
- **Sonuç:** AlarmsController fat JAR'da olmalı. Startup log'da mapping satırları beklenir.

### 7.6 Çifte path strip (Vite + Nginx)
- **Vite proxy:** Sadece dev modda (`npm run dev`). `rewrite` ile `/api/v1` kaldırır.
- **Production:** Vite yok; frontend aynı origin'e `POST /api/v1/alarms/search` atar. Nginx strip eder.
- **Sonuç:** Prod'da çifte strip yok.

### 7.7 DebugController /__ping (teşhis)
- **Eklenen:** `DebugController` — `GET /__ping` → "ok". `debug.ping.enabled=true` iken aktif.
- **Nginx:** `location = /__ping` proxy eklendi.
- **Kullanım:** `debug.ping.enabled=true` env ile ayağa kaldır, `GET /__ping` dene. "No static resource" verirse routing/DispatcherServlet sorunu var.

### 7.8 Özet (olasılık sırasıyla)
1. ~~Yanlış profile~~ — dev kullanılıyor, application.yml yükleniyor.
2. Controller JAR'da — pom doğru; startup log ile doğrulanmalı.
3. ~~WebMvcConfigurer/@EnableWebMvc override~~ — yok.
4. ~~Çifte strip~~ — prod'da yok.
5. **Deploy edilen imaj eski** — en olası: yeni config/handler değişiklikleri imajda yok.
6. **Handler sıralaması** — ResourceHttpRequestHandler hâlâ önce çalışıyor olabilir (deploy sonrası kontrol).

### 7.9 Senaryo analizi (/actuator/mappings tek hakem)

| Senaryo | mappings'te /alarms/search | Sonuç |
|---------|----------------------------|-------|
| **A** | YOK | Controller ApplicationContext'te yok → %70 eski Docker imajı |
| **B** | VAR, ama istek No static resource | İstek DispatcherServlet'e gelmiyor → Nginx/gateway sorunu |
| **C** | VAR, /__ping çalışıyor, /alarms/search çalışmıyor | Mapping çatışması |

### 7.10 Kod tabanı kontrolleri (yapıldı)

- **@Controller + /alarms:** Sadece AlarmsController (@RestController). View controller çatışması yok.
- **SpringApplication.run:** Tek main — `StandardApplication`; monolith `java -jar /application.jar` ile çalışıyor.
- **DispatcherServlet:** Spring Boot varsayılanı `'/'`; `server.servlet.context-path` yok (sadece websocket'te).
- **Nginx location:** `/api/v1/alarms/search` → `location /api/v1/` (en uzun prefix) → backend `/alarms/search`.

### 7.11 TRACE log (kanıt için)

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

## 8. Ek Notlar

- **Frontend API path:** `API_PREFIX` = `/api/v1`; istekler `/api/v1/alarms/search`, `/api/v1/alarms/rules` vb.
- **Vite dev proxy:** `rewrite: path => path.replace(/^\/api\/v1/, '')` → backend’e `/alarms/...` gider.
- **Production:** Nginx aynı strip mantığı ile `/alarms/...` iletir.
- **Alternatif:** `server.servlet.context-path=/api/v1` kullanılırsa nginx **strip etmemeli**; `proxy_pass .../api/v1/` ile path korunmalı.

---

## 9. İlgili Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `NO_RESOURCE_ALARMS_SEARCH_FIX.md` | Önceki teşhis dokümanı |
| `integrations/ALARM_TEST_ISLEM_RAPORU.md` | Test prosedürü |
| `integrations/scripts/run-alarm-api-tests.ps1` | API test script |
| `scripts/verify-alarm-postgres.ps1` | DB + API hızlı doğrulama |
