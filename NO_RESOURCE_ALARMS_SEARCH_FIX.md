# NoResourceFoundException: No static resource alarms/search — Teşhis ve Çözüm

**Bu monorepo’da:** `backend/`, `build-docker/`, nginx. `integrations/` sadece entegrasyon modülleri; AlarmsController `backend/` içindedir.

---

## Hata

```
org.springframework.web.servlet.resource.NoResourceFoundException: No static resource alarms/search.
    at org.springframework.web.servlet.resource.ResourceHttpRequestHandler.handleRequest(ResourceHttpRequestHandler.java:585)
```

**Anlam:** `POST /alarms/search` (veya `/api/v1/alarms/search`) isteği hiçbir `@RestController` ile eşleşmiyor; Spring bunu statik kaynak isteği sanıp `ResourceHttpRequestHandler`'a gönderiyor. Statik dosya `alarms/search` olmadığı için `NoResourceFoundException` fırlıyor.

---

## Olası Nedenler

| # | Neden | Açıklama |
|---|--------|----------|
| 1 | **AlarmsController JAR'da yok / yüklenmiyor** | `alarm-service` modülü `application-standard` fat JAR'a dahil değilse veya `com.milesight.beaveriot.alarm` component-scan dışındaysa controller kayıtlı olmaz. |
| 2 | **Path / context-path uyumsuzluğu** | Nginx `/api/v1`'i kaldırıp sadece `/alarms/search` gönderiyorsa backend'de `context-path=/api/v1` beklenmemeli. Tersine, backend'de context-path yoksa nginx'in `/api/v1`'i kaldırıp `/alarms/search` iletmesi gerekir. Uyumsuzlukta controller eşleşmez. |
| 3 | **DispatcherServlet / resource handler önceliği** | API path'i resource handler'dan sonra deniyorsa veya `/**` resource'a verilip `/api/v1` altı controller'a öncelikli gitmiyorsa, `/alarms/search` doğrudan resource'a düşer. |
| 4 | **Docker imajı eski** | Monolith imajı `alarm-service` / `AlarmsController` eklenmeden önce build edildiyse, container'daki JAR'da bu sınıflar yoktur. |

---

## Yapılacaklar (platformariot: backend/, build-docker/)

### 1. AlarmsController'ın JAR'da ve component-scan'de olduğunu doğrula

**application-standard `pom.xml`:**
```xml
<dependency>
    <groupId>com.milesight.beaveriot</groupId>
    <artifactId>alarm-service</artifactId>
    <version>${project.version}</version>
</dependency>
```

**Component-scan:** Ana uygulama sınıfı veya `@SpringBootApplication`'ın bulunduğu paket `com.milesight.beaveriot` (veya üst paket) ise, `com.milesight.beaveriot.alarm.controller.AlarmsController` otomatik taranır. Eğer alarm servisi ayrı bir `*-bootstrap` veya alt pakette ve taranmıyorsa, ilgili paketi `@ComponentScan` ile ekleyin.

**AlarmsController path'i (beklenen):**
- `@RequestMapping("/alarms")` + `@PostMapping("/search")` → `/alarms/search` (context-path yoksa) veya `/api/v1/alarms/search` (context-path=`/api/v1` ise).

### 2. Nginx ile backend path uyumunu kontrol et

**Nginx (örnek):**
```nginx
location /api/v1/ {
    proxy_pass http://monolith:9200/;   # trailing slash: /api/v1 kaldırılır, /alarms/search gider
    # ...
}
```
- `proxy_pass http://monolith:9200/` → istek `/api/v1/alarms/search` iken backend'e **`/alarms/search`** gider.
- Backend'de **`server.servlet.context-path` yoksa** controller `@RequestMapping("/alarms")` → `/alarms/search` olur → **eşleşir**.
- Backend'de **`server.servlet.context-path=/api/v1`** ise controller gerçek path'i `/api/v1/alarms/search` olur; nginx'in `/alarms/search` göndermesi **eşleşmez**. Bu durumda nginx'te `/api/v1`'i **kaldırmayın**:
  ```nginx
  location /api/v1/ {
      proxy_pass http://monolith:9200/api/v1/;  # path olduğu gibi iletilir
  }
  ```

**Kural:** Nginx'in backend'e ilettiği path, `context-path` + controller mapping ile **birebir** aynı olmalı.

### 3. Startup log'da mapping'i doğrula

Uygulama ayağa kalkarken şuna benzer bir satır olmalı:

```
Mapped "{[/alarms/search],methods=[POST]}" onto public ... AlarmsController.search(...)
```

veya `context-path=/api/v1` ile:

```
Mapped "{[/api/v1/alarms/search],methods=[POST]}"
```

Bu satır **yoksa** `AlarmsController` yüklenmemiştir → `alarm-service` JAR'da / component-scan'de veya sınıf yolunda sorun var.

### 4. Docker imajında sınıf varlığını kontrol et

Monolith container'da:

```bash
# JAR içinde AlarmsController ve alarm paketi
jar tf /path/to/application-standard-*.jar | grep -i alarm
# Örn: BOOT-INF/lib/alarm-service-*.jar ve/veya
#      BOOT-INF/classes/.../alarm/controller/AlarmsController.class
```

`alarm-service` JAR'ı veya `AlarmsController.class` yoksa: `application-standard` build'ine `alarm-service` dependency'sini ekleyip imajı yeniden build edin.

### 5. `t_alarm` ve 500 hatası

Bu döküman `NoResourceFoundException` (404-benzeri, resource handler) için. Controller çalışıp `AlarmRepository`/`t_alarm` yoksa **500** alırsınız; bu Liquibase/`alarm.sql` ve `DB_TYPE=postgres` ile ilgili ayrı konudur (ör. `alarm.sql` + `scripts/verify-alarm-postgres.ps1`).

---

## Hızlı checklist

- [ ] `application-standard/pom.xml` → `alarm-service` dependency var.
- [ ] `com.milesight.beaveriot.alarm` (veya AlarmsController'ın paketi) component-scan içinde.
- [ ] Startup log'da `Mapped "{[.../alarms/search],methods=[POST]}"` görünüyor.
- [ ] Nginx `proxy_pass` path'i, backend `context-path` + `/alarms` ile uyumlu (ya `/alarms/search` ya `/api/v1/alarms/search`).
- [ ] Monolith Docker imajı, `alarm-service` ve `AlarmsController` içeren JAR ile **yeniden** build edildi.

---

## Test

Controller ve nginx doğruysa:

- **Auth yok:** `POST /api/v1/alarms/search` (Content-Type: application/json, body: `{}`) → **401** (endpoint var, yetki yok).
- **Auth var:** Uygun token ile **200** ve `data.content` / `data.total`.

```powershell
# integrations/scripts/run-alarm-api-tests.ps1 -QuickCheck
$r = Invoke-WebRequest -Uri "http://localhost:9080/api/v1/alarms/search" -Method Post -ContentType "application/json" -Body "{}" -UseBasicParsing
# Beklenen: 401 (endpoint mevcut). 404 veya "No static resource" ise controller hâlâ eşleşmiyor.
```

---

## Özet

| Sorun | Çözüm |
|-------|-------|
| Controller JAR'da/scan'de yok | `alarm-service` dependency + component-scan; monolith imajını yeniden build et. |
| Path/context-path uyumsuz | Nginx'te `proxy_pass` ile backend'e giden path'i, `context-path` ve `@RequestMapping("/alarms")` ile hizalayın. |
| Eski Docker imajı | `alarm-service` ve `AlarmsController` içeren JAR ile image'i rebuild + redeploy. |

Bu değişiklikler **platformariot** `backend/` ve `build-docker/` içinde yapılır. `integrations/` sadece entegrasyon modüllerini içerir; AlarmsController `backend/`'dedir.
