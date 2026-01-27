# Test Planı 1 — Alarm Backend API

**Kapsam:** `POST /alarms/search`, `GET /alarms/export`, `POST /alarms/claim`  
**Ortam:** Lokal Docker, PostgreSQL (ör. `chirpstack-prebuilt-postgres.yaml`)  
**Ön koşul:** ALARM_SAYFA_KOD_PLANI_VE_MIMARI.md Faz 1 backend implemente edilmiş ve imaj build edilmiş olmalı.

---

## 1. Hazırlık

### 1.1 Ortam

- Docker, Docker Compose.
- `beaver-iot-docker/examples/chirpstack-prebuilt-postgres.yaml` ile stack ayağa kalkıyor; `BEAVER_IMAGE` implementasyonu içeren imajı göstermeli (lokal build veya CI’dan gelen imaj).
- Port: **9080** (ör. `http://localhost:9080`).

### 1.2 En az bir cihaz

- Alarm kayıtları `device_id` ile ilişkili. **En az bir cihaz** olmalı.
- **Yöntem A:** Mevcut entegrasyon (ChirpStack, MQTT, my-integration vb.) üzerinden UI’dan cihaz ekle; `device_id`’yi not et.
- **Yöntem B:** Cihaz yoksa: Entegrasyon ekle → Cihaz ekle → `device_id` al. (Örn. `GET /api/v1/device/search` veya Device sayfasından.)

### 1.3 Tenant ve auth

- Kayıtlı kullanıcı ile giriş; `Bearer <token>` alınacak. Tüm isteklerde `Authorization: Bearer <token>` kullan.
- Varsayılan tenant (örn. `default`); `TenantContext` backend’de çözümlenir.

---

## 2. Sahte alarm verisi (seed)

### 2.1 `device_id`’yi öğrenme

- UI: Cihaz listesinden bir cihazın ID’si (URL veya detay).
- Veya: `POST /api/v1/device/search` → `{ "page_number": 1, "page_size": 1 }` → `content[0].id` = `DEVICE_ID`.

### 2.2 `t_alarm`’a insert (PostgreSQL)

- `t_alarm` ve `t_device` aynı `tenant_id`’ye sahip olmalı. `t_device`’daki bir satırın `tenant_id`’si örn. `default` veya `1` (migrasyona göre). Alarm’da aynı değer kullanılacak.
- `tenant_id` için: `t_dashboard` veya `t_device`’dan bir örnek:  
  `SELECT DISTINCT tenant_id FROM t_device LIMIT 1;` → `TENANT_ID`.

Aşağıdaki SQL’i `DEVICE_ID`, `TENANT_ID` ve isteğe bağlı `ALARM_TIME` (ms) ile doldurup **postgres container**’da çalıştır:

```sql
-- DEVICE_ID, TENANT_ID, ALARM_TIME (ms, opsiyonel) değiştir
INSERT INTO t_alarm (tenant_id, device_id, alarm_time, alarm_content, alarm_status, latitude, longitude, address, source, created_at)
VALUES
  ('TENANT_ID', DEVICE_ID, COALESCE(ALARM_TIME, (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT - 3600000), 'Test alarm 1 - yüksek sıcaklık', true, 41.0082, 28.9784, 'Test Adres 1', 'MANUAL', (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT),
  ('TENANT_ID', DEVICE_ID, COALESCE(ALARM_TIME, (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT - 7200000), 'Test alarm 2 - düşük pil', true, 41.0082, 28.9784, 'Test Adres 1', 'MANUAL', (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT);
```

**Örnek (device_id=1, tenant=default):**

```sql
INSERT INTO t_alarm (tenant_id, device_id, alarm_time, alarm_content, alarm_status, latitude, longitude, address, source, created_at)
VALUES
  ('default', 1, (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT - 3600000, 'Test alarm 1 - yüksek sıcaklık', true, 41.0082, 28.9784, 'Test Adres 1', 'MANUAL', (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT),
  ('default', 1, (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT - 7200000, 'Test alarm 2 - düşük pil', true, 41.0082, 28.9784, 'Test Adres 1', 'MANUAL', (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT);
```

**Çalıştırma (compose’un postgres servis adı `postgresql`):**

```bash
docker exec -i beaver-iot-postgresql psql -U postgres -d postgres -c "
INSERT INTO t_alarm (tenant_id, device_id, alarm_time, alarm_content, alarm_status, latitude, longitude, address, source, created_at)
VALUES
  ('default', 1, (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT - 3600000, 'Test alarm 1', true, 41.01, 28.98, 'Adres 1', 'MANUAL', (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT),
  ('default', 1, (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT - 7200000, 'Test alarm 2', true, 41.01, 28.98, 'Adres 1', 'MANUAL', (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT);
"
```

- `device_id=1` yoksa, önce `t_device`’dan geçerli bir `id` seçip ona göre insert yap.

---

## 3. Token alımı

```bash
# 1) Register (ilk kurulumda)
curl -s -X POST "http://localhost:9080/api/v1/user/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testalarm","password":"Test123!","confirmPassword":"Test123!"}'

# 2) Login
TOKEN=$(curl -s -X POST "http://localhost:9080/api/v1/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testalarm&password=Test123!&grant_type=password" \
  | jq -r '.data.access_token')
echo "TOKEN=$TOKEN"
```

---

## 4. Test adımları

### 4.1 `POST /alarms/search` — 200 ve içerik

- **Amaç:** Sahte 2 alarm dönmeli; sadece 200 değil, `content` ve `total` kontrolü.

```bash
# genel arama (son 7 gün)
START=$(($(date +%s) * 1000 - 7 * 24 * 3600 * 1000))
END=$(($(date +%s) * 1000 + 86400000))
curl -s -X POST "http://localhost:9080/api/v1/alarms/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"page_number\":1,\"page_size\":10,\"start_timestamp\":$START,\"end_timestamp\":$END}" | jq .
```

**Beklenti:**

- HTTP 200.
- `data.content`: en az 2 eleman (seed’de 2 eklediysek).
- `data.total` >= 2.
- Her eleman: `id`, `device_id`, `device_name`, `alarm_time`, `alarm_content`, `alarm_status` (boolean), `latitude`, `longitude`, `address` alanları mevcut.

**Cihaza özel:**

```bash
# device_ids ile (DEVICE_ID’yi gerçek id ile değiştir)
curl -s -X POST "http://localhost:9080/api/v1/alarms/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"page_number\":1,\"page_size\":10,\"device_ids\":[DEVICE_ID],\"start_timestamp\":$START,\"end_timestamp\":$END}" | jq .
```

- `content` yalnızca o `device_id`’ye ait alarmları içermeli.

---

### 4.2 `GET /alarms/export` — 200 ve CSV (Blob)

```bash
curl -s -o /tmp/alarms_export.csv -w "%{http_code}" \
  "http://localhost:9080/api/v1/alarms/export?start_timestamp=$START&end_timestamp=$END" \
  -H "Authorization: Bearer $TOKEN"
```

**Beklenti:**

- HTTP 200.
- Dosya boş değil; `Content-Type` ile uyumlu (örn. `text/csv` veya `application/octet-stream`). İçerikte en az 2 satır veri (başlık + 2 alarm) veya format dokümantasyonuna uygun yapı.

```bash
head -5 /tmp/alarms_export.csv
```

---

### 4.3 `POST /alarms/claim` — 200, ardından search’te claimed

- **Amaç:** İlgili cihazın aktif alarmları claimed olur; sonraki search’te `alarm_status: false`.

```bash
# DEVICE_ID’yi gerçek id ile değiştir
curl -s -X POST "http://localhost:9080/api/v1/alarms/claim" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"device_id":1}'
```

**Beklenti:** HTTP 200; body şeması projeye göre (ör. `{ "status": "Success" }` veya boş `data`).

```bash
# Tekrar search; alarm_status false olmalı (veya total 0, eğer claimed’ler filtreleniyorsa)
curl -s -X POST "http://localhost:9080/api/v1/alarms/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"page_number\":1,\"page_size\":10,\"device_ids\":[1],\"start_timestamp\":$START,\"end_timestamp\":$END,\"alarm_status\":[false]}" | jq '.data.content, .data.total'
```

- `alarm_status: [false]` ile arama: en az 2 kayıt; her birinde `alarm_status == false`.

---

### 4.4 İsteğe bağlı: `alarm_status` filtreleri

- `alarm_status: [true]` → yalnızca aktif (claim öncesi 2, claim sonrası 0).
- `alarm_status: [false]` → yalnızca claimed (claim sonrası 2).

---

## 5. Hata senaryoları (kısa)

- **401:** Token yok/geçersiz → 401 beklenir.
- **404:** `/alarms/search` 404 → backend’de `/alarms` eşlemesi ve uygulama ayağa kalkışı kontrol edilir.
- **500:** Örn. `t_alarm` yok (migration eksik) → Liquibase ve `alarm.sql` çalıştığı doğrulanır.
- **Boş `content` / `total: 0`:** Seed çalışmamış veya `tenant_id`/`device_id` uyuşmaz; SQL ve `tenant_id` kontrolü.

---

## 6. Özet kontrol listesi

| # | Adım | Beklenti |
|---|------|----------|
| 1 | Seed: `t_alarm`’a 2 satır (gerçek `device_id`, `tenant_id`) | INSERT hatasız |
| 2 | `POST /alarms/search` (genel + device_ids) | 200, `content.length` >= 2, `total` >= 2, alanlar mevcut |
| 3 | `GET /alarms/export` | 200, CSV’de veri |
| 4 | `POST /alarms/claim` | 200 |
| 5 | `POST /alarms/search` + `alarm_status: [false]` | 200, claimed kayıtlar döner |

---

## 7. Lokal Docker ile hızlı akış

1. `beaver-iot-docker` içinde:  
   - `examples` altında `BEAVER_IMAGE=...` ile `chirpstack-prebuilt-postgres.yaml` kullan.  
   - İmaj: Faz 1 backend’i içeren lokal build veya sizin GHCR imajınız.
2. `docker compose up -d` → ~90 saniye bekle.
3. Tarayıcıdan kayıt/giriş → cihaz ekle (veya mevcut cihazı not et).
4. `t_device`’dan `id` ve `tenant_id` al; yukarıdaki SQL ile `t_alarm` seed’le.
5. Yukarıdaki curl adımlarını sırayla çalıştır; beklentileri not et.

Bu testler, sadece 200 değil, sahte alarm ve cihaz verisiyle **içerik ve davranışı** doğrular.
