# Dashboard Seçim Sorunu – Kök Neden ve Düzeltme

**Tarih:** 2026-01-26

## Sorun
Report sayfasında **dashboard seçilemiyor**; dropdown boş veya seçim algılanmıyor, "Please select a dashboard." hatası çıkıyordu.

## Kök Neden
Report sayfası dashboard listesini alırken API yanıtına **`objectToCamelCase`** uyguluyordu. Bu dönüşüm `dashboard_id` → `dashboardId` yapıyordu, fakat kod **`dashboard_id`** (snake_case) kullanmaya devam ediyordu. Sonuç:

- `(d as any).dashboard_id` → **`undefined`** (camelCase sonrası alan yok)
- `MenuItem` value = `String(undefined)` = `"undefined"`
- Listede eşleşme olmadığı için dropdown düzgün dolmuyor / seçim çalışmıyordu

## Yapılan Düzeltmeler

### 1. `apps/web/src/pages/report/index.tsx`

**Dashboard listesi fetch:**
- `objectToCamelCase` kaldırıldı.
- Ham API yanıtı (snake_case) kullanılıyor; hem dizi hem `{ data: [...] }` destekleniyor:
  ```ts
  const list = (Array.isArray(data) ? data : (data as any)?.data ?? data) as DashboardListProps[];
  return list;
  ```

**Dashboard referansları:**
- `(d as any).dashboard_id` → `d.dashboard_id`
- `(dashboard as any).dashboard_id` → `dashboard.dashboard_id`
- `(foundDashboard as any).dashboard_id` → `foundDashboard.dashboard_id`
- `MenuItem` map içinde `dashboardId` değişkeni `id` olarak yeniden adlandırıldı (shadowing önlendi).

## Test
1. Report sayfasına git: `http://<sunucu>:9080/report`
2. Dashboard dropdown’ının dolu olduğunu kontrol et.
3. Bir dashboard seç.
4. Tarih aralığı gir, "Generate PDF" ile rapor oluştur.

## Deploy
Düzeltmeler **beaver-iot-web** içinde. Sunucuya yansıması için:

1. **beaver-iot-web** build alınır (CI/CD veya lokal).
2. **beaver-iot-docker** ile yeni image build edilir, deploy edilir.
3. Veya mevcut image’ı güncelleyip container’ı yeniden başlatın (frontend build zaten image’da ise).

## Sonuç
- Dashboard listesi doğru parse ediliyor.
- Dropdown dashboard’larla doluyor, seçim kaydediliyor.
- "Please select a dashboard." hatası bu kök nedenle ortadan kalkmış olmalı.

---

## Ek: GET /dashboard/:id 500 → getDrawingBoardDetail (2026-01-26)

**Sorun:** `GET /api/v1/dashboard/1` 500. Backend GET /dashboard/:id desteklemiyor.

**Çözüm:** getDashboardDetail yerine getDrawingBoardDetail(main_canvas_id). GET /canvas/:id 200 dönüyor. entity_ids canvas response'tan alınıyor; PDF akışı aynı.
