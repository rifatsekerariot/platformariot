# Test planı: Alarm / Map / Device List widget’ları

## Sorun özeti
- **Lokalde** (run-with-local-web / local image): Alarm, Map, Device List “Add widget” listesinde görünüyordu.
- **Sunucuda** (zero-touch, prebuilt veya --build-images): Bu üç widget görünmüyordu.

## Kök neden
- **`plugin/plugins/components.ts`**: Plugin listesi `../plugins/**` glob’u ile üretiliyordu; `getFolderName` her path’in **ikinci** segmentini alıyordu (`plugins`). Bu yüzden sadece `plugins` tekrarlanıyor, `alarm` / `map` / `device-list` hiç eklenmiyordu.
- **`useLoadPlugins`**: Sadece `allPluginsName` içindeki plugin’leri yüklüyor. Bu liste yanlış olduğu için Alarm / Map / Device List hiç yüklenmiyordu.
- **`useFilterPlugins`**: Daha önce düzeltilmişti (filtre kaldırıldı). Asıl eksik, yükleme aşamasındaydı.

## Yapılan düzeltme
- **`components.ts`**: Glob `./*/control-panel/index.ts` olacak şekilde güncellendi. Plugin adı `.../([^/]+)/control-panel/index.ts` regex ile çıkarılıyor. Böylece `alarm`, `map`, `device-list` vb. doğru şekilde listeleniyor ve `useLoadPlugins` bunları yüklüyor.

## Test adımları

### 1. Lokal build (Windows)
```powershell
cd c:\Projeler\beaver-iot-docker\scripts
.\run-with-local-web.ps1 -SkipComposeUp
# Ardından examples’ta compose up; UI http://localhost:9080
```
- Dashboard → Add widget: **Alarm**, **Map**, **Device List** listede görünmeli.
- Widget eklenip kaydedilebilmeli.

### 2. Prebuilt image (sunucu)
- Zero-touch **varsayılan** (prebuilt):  
  `curl -sSL .../deploy-zero-touch.sh | sudo sh -s -- --tenant-id "default"`
- Önce “Build and push prebuilt image” workflow’ı çalıştırılmış olmalı (Actions → workflow_dispatch veya main push).
- UI → Dashboard → Add widget: **Alarm**, **Map**, **Device List** görünmeli.

### 3. --build-images (sunucu)
- `curl -sSL .../deploy-zero-touch.sh | sudo sh -s -- --tenant-id "default" --build-images`
- Build tamamlandıktan sonra UI’da aynı üç widget listede olmalı.

### 4. Hızlı kontrol (lokalde)
- `beaver-iot-web` içinde `pnpm run build` (apps/web) hatasız tamamlanmalı.
- Tarayıcıda Dashboard → Add widget açılıp widget grid’inde Alarm / Map / Device List var mı bakılmalı.

## Beklenen sonuç
- “Add widget” grid’inde **Area, Bar, Card, Gauge, Horizon Bar, …** ile birlikte **Alarm**, **Map**, **Device List** de görünür.
- **Radar** (radarChart) plugin-list filtresiyle saklı kalır; diğerleri gösterilir.

## İlgili dosyalar
- `beaver-iot-web/apps/web/.../plugin/plugins/components.ts` (düzeltme)
- `beaver-iot-web/.../hooks/useLoadPlugins.ts` (components’tan beslenir)
- `beaver-iot-web/.../hooks/useFilterPlugins.tsx` (filtre yok)
- `beaver-iot-web/.../plugin-list/index.tsx` (yalnızca radarChart filtrelenir)
