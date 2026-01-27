# Dashboard Bazlı PDF Telemetri Raporu – Analiz ve Uygulanabilirlik Raporu

## 1. Mevcut Durum Analizi

### 1.1. Mevcut PDF Rapor Yapısı
- **Sayfa:** `/report` (izin gerektirmiyor, herkese açık)
- **Mevcut Akış:** Entity seçimi → Tarih aralığı → PDF oluşturma
- **Veri Kaynağı:** `entityAPI.advancedSearch` (tüm entity'ler) + `entityAPI.getAggregateHistory` (LAST/MIN/MAX/AVG)
- **PDF İçeriği:** Entity adı | Birim | Son | Min | Max | Ortalama

### 1.2. Dashboard Yapısı (API Analizi)

#### Dashboard API (`dashboard.ts`)
- **`getDashboards`**: Dashboard listesi alır (`POST /dashboard/search`)
- **`getDashboardDetail`**: Dashboard detayı alır (`GET /dashboard/:id`)
- **`getDrawingBoardDetail`**: Drawing board detayı alır (`GET /canvas/:canvas_id`)

#### Dashboard Veri Yapısı
```typescript
interface DashboardDetail {
    dashboard_id: ApiKey;
    name: string;
    widgets: WidgetDetail[];
    home: boolean;
    created_at: string;
    entities?: EntityData[];      // Dashboard'da kullanılan entity'ler
    entity_ids?: ApiKey[];        // Entity ID listesi
    user_id: ApiKey;
}

interface DrawingBoardDetail {
    id: ApiKey;
    name: string;
    attach_type: AttachType;      // 'DASHBOARD' | 'DEVICE'
    attach_id: ApiKey;
    widgets: WidgetDetail[];
    entity_ids?: ApiKey[];         // Drawing board'da kullanılan entity'ler
    entities?: EntityData[];       // Entity detayları
    device_ids?: ApiKey[];         // ⭐ Dashboard'a eklenen device ID'leri
}
```

**Önemli Bulgu:** `updateDrawingBoard` API'sinde `device_ids` parametresi var. Bu, dashboard'a eklenen device'ların backend'de saklandığını gösteriyor. Ancak `getDrawingBoardDetail` response'unda `device_ids` alanı **yok** (sadece `entity_ids` ve `entities` var).

### 1.3. Device Yapısı (API Analizi)

#### Device API (`device.ts`)
- **`getList`**: Device listesi alır (`POST /device/search`)
- **`getDetail`**: Device detayı alır (`GET /device/:id`)
  - Response'da `name`, `id`, `key`, `entities` (device'a ait entity'ler) var

#### Device Veri Yapısı
```typescript
interface DeviceDetail {
    id: ApiKey;
    key: ApiKey;
    name: string;                  // ⭐ Device ismi (rapor için gerekli)
    identifier: ApiKey;
    integration: ApiKey;
    integration_name: string;
    entities: {                    // Device'a ait entity'ler
        id: ApiKey;
        key: ApiKey;
        name: string;
        type: EntityType;
        value_attribute: Partial<EntityValueAttributeType>;
        value_type: EntityValueDataType;
    }[];
}
```

### 1.4. Entity-Device İlişkisi

- **Widget → Entity:** Her widget bir `entity` kullanır (widget config'inde `entity` alanı)
- **Dashboard → Entity:** Dashboard'da `entity_ids` listesi var (widget'lardan toplanmış)
- **Entity → Device:** Entity'ler bir device'a aittir (`entity.device_id` veya `entityAPI.advancedSearch` ile `device_id` filtresi)

**Sorun:** Dashboard'dan direkt `device_ids` alınamıyor. Ancak:
1. Dashboard'daki `entity_ids`'den device'ları bulabiliriz (`entityAPI.advancedSearch` ile `entity_id` filtresi + `device_id` alanı)
2. Veya widget'ları parse edip her widget'ın `entity`'sinden device'ları toplayabiliriz

## 2. İstenen Özellik

### 2.1. Kullanıcı İsteği
- **Dashboard seçimi:** Kullanıcı bir dashboard seçer
- **Device bazlı rapor:** Dashboard'a eklenmiş device'ların telemetri verileri
- **Device ismi ile gösterim:** Her device'ın telemetri verileri, device'a verilen isimle birlikte raporda görünmeli

### 2.2. Örnek Senaryo
- Dashboard: "Fabrika 1 Dashboard"
- Dashboard'a eklenmiş device'lar: 4 adet
  - Device 1: "Sıcaklık Sensörü A"
  - Device 2: "Nem Sensörü B"
  - Device 3: "Basınç Sensörü C"
  - Device 4: "CO2 Sensörü D"
- Rapor: Her device için telemetri verileri (entity'ler), device ismiyle birlikte

## 3. Uygulanabilirlik Analizi

### 3.1. ✅ Uygulanabilir

#### 3.1.1. Dashboard Listesi Alma
- **API:** `dashboardAPI.getDashboards({ name: '' })`
- **Durum:** Mevcut, çalışıyor
- **Kullanım:** Dropdown/Select ile dashboard seçimi

#### 3.1.2. Dashboard'daki Entity'leri Alma
- **API:** `dashboardAPI.getDrawingBoardDetail({ canvas_id })` → `entity_ids` veya `entities`
- **Durum:** Mevcut, çalışıyor
- **Alternatif:** `dashboardAPI.getDashboardDetail({ id })` → `entity_ids`

#### 3.1.3. Entity'den Device Bulma
- **Yöntem 1:** `entityAPI.advancedSearch` ile `entity_id` filtresi → `device_id` alanı
- **Yöntem 2:** `entityAPI.advancedSearch` ile `entity_id` listesi → her entity için `device_id` toplama
- **Durum:** Entity API'de `device_id` alanı var (entity search response'unda)

#### 3.1.4. Device İsimlerini Alma
- **API:** `deviceAPI.getList({ id_list: [device_id1, device_id2, ...] })` → her device için `name`
- **Alternatif:** `deviceAPI.getDetail({ id })` (her device için ayrı çağrı, daha yavaş)
- **Durum:** Mevcut, çalışıyor

#### 3.1.5. Device-Entity Gruplama
- **Mantık:** Entity'leri `device_id`'ye göre grupla → her device için entity listesi
- **Durum:** Frontend'de yapılabilir (JavaScript `reduce` veya `Map`)

#### 3.1.6. PDF'de Device İsmi Gösterme
- **Mevcut PDF yapısı:** `PdfReportRow` → `entityName`, `unit`, `last`, `min`, `max`, `avg`
- **Değişiklik:** `PdfReportRow`'a `deviceName` ekle veya `entityName` formatını `"Device Name - Entity Name"` yap
- **Durum:** `pdfReport.ts`'de kolayca değiştirilebilir

### 3.2. ⚠️ Dikkat Edilmesi Gerekenler

#### 3.2.1. Dashboard → Device Mapping
- **Sorun:** Dashboard'dan direkt `device_ids` alınamıyor
- **Çözüm:** 
  1. Dashboard'daki `entity_ids`'i al
  2. Her entity için `device_id`'yi bul (`entityAPI.advancedSearch` ile)
  3. Unique `device_id`'leri topla
  4. Device isimlerini al (`deviceAPI.getList`)

#### 3.2.2. Entity-Device Çoklu İlişki
- **Senaryo:** Bir device'ın birden fazla entity'si olabilir
- **Çözüm:** Entity'leri `device_id`'ye göre grupla, her device için entity listesi oluştur

#### 3.2.3. Widget → Entity Mapping (Alternatif)
- **Alternatif Yöntem:** Widget'ları parse et, her widget'ın `config.entity`'sini al
- **Avantaj:** Widget config'inden direkt entity bilgisi
- **Dezavantaj:** Widget yapısını parse etmek gerekir, daha karmaşık

#### 3.2.4. Performans
- **Çoklu API çağrıları:** Dashboard → Entity → Device → Aggregate
- **Optimizasyon:** 
  - `entityAPI.advancedSearch` ile tüm entity'leri tek seferde al (device_id dahil)
  - `deviceAPI.getList` ile tüm device'ları tek seferde al (id_list ile)
  - Aggregate çağrıları paralel yapılabilir (`Promise.all`)

### 3.3. ❌ Uygulanamaz / Zor Olanlar

- **Yok:** Tüm adımlar uygulanabilir görünüyor.

## 4. Önerilen Uygulama Yaklaşımı

### 4.1. Veri Akışı

```
1. Kullanıcı dashboard seçer
   ↓
2. dashboardAPI.getDashboardDetail({ id: dashboardId })
   → entity_ids[] al
   ↓
3. entityAPI.advancedSearch({ entity_filter: { ID: { operator: 'ANY_EQUALS', values: entity_ids } } })
   → Her entity için device_id topla
   → Unique device_id'leri bul
   ↓
4. deviceAPI.getList({ id_list: [device_id1, device_id2, ...] })
   → Device isimlerini al (Map<device_id, device_name>)
   ↓
5. Entity'leri device_id'ye göre grupla
   → Map<device_id, { deviceName, entities[] }>
   ↓
6. Her device için, her entity için aggregate çağrısı
   → entityAPI.getAggregateHistory({ entity_id, start_timestamp, end_timestamp, aggregate_type })
   ↓
7. PDF oluştur: Device Name → Entity Name | Unit | Last | Min | Max | Avg
```

### 4.2. UI Değişiklikleri

#### 4.2.1. Form Alanları
- **Mevcut:** Rapor başlığı, Firma adı, Tarih aralığı, Entity seçimi (tablo)
- **Yeni:** 
  - **Dashboard seçimi** (dropdown/select) - zorunlu
  - Entity seçimi kaldırılabilir veya "Tüm entity'ler" seçeneği eklenebilir

#### 4.2.2. Entity Tablosu
- **Seçenek 1:** Entity seçimini kaldır, dashboard'daki tüm entity'leri otomatik al
- **Seçenek 2:** Entity seçimini koru, ancak sadece seçilen dashboard'daki entity'leri göster
- **Öneri:** Seçenek 1 (daha basit, kullanıcı dostu)

### 4.3. PDF Yapısı Değişiklikleri

#### 4.3.1. Mevcut PDF Yapısı
```
Rapor Başlığı
Firma Adı (opsiyonel)
Tarih Aralığı

| Entity Name | Unit | Last | Min | Max | Avg |
|-------------|------|------|-----|-----|-----|
| Temperature | °C   | 25.3 | 20  | 30  | 24.5|
| Humidity    | %    | 60   | 50  | 70  | 58  |
```

#### 4.3.2. Yeni PDF Yapısı (Device Bazlı)
```
Rapor Başlığı
Firma Adı (opsiyonel)
Tarih Aralığı
Dashboard: [Dashboard Name]

--- Device 1: Sıcaklık Sensörü A ---
| Entity Name | Unit | Last | Min | Max | Avg |
|-------------|------|------|-----|-----|-----|
| Temperature | °C   | 25.3 | 20  | 30  | 24.5|
| Humidity    | %    | 60   | 50  | 70  | 58  |

--- Device 2: Nem Sensörü B ---
| Entity Name | Unit | Last | Min | Max | Avg |
|-------------|------|------|-----|-----|-----|
| Humidity    | %    | 65   | 55  | 75  | 62  |
```

**Alternatif:** Tek tablo, device ismi sütunu ile:
```
| Device Name      | Entity Name | Unit | Last | Min | Max | Avg |
|------------------|-------------|------|------|-----|-----|-----|
| Sıcaklık Sensörü A | Temperature | °C   | 25.3 | 20  | 30  | 24.5|
| Sıcaklık Sensörü A | Humidity    | %    | 60   | 50  | 70  | 58  |
| Nem Sensörü B      | Humidity    | %    | 65   | 55  | 75  | 62  |
```

**Öneri:** Device bazlı bölümler (ilk yapı) daha okunabilir.

### 4.4. Kod Değişiklikleri

#### 4.4.1. `pages/report/index.tsx`
- Dashboard dropdown ekle
- Entity tablosunu kaldır veya dashboard'a göre filtrele
- `onGenerate` handler'ı güncelle:
  1. Dashboard seç
  2. Dashboard'dan entity'leri al
  3. Entity'lerden device'ları bul
  4. Device isimlerini al
  5. Device-entity gruplama
  6. Aggregate verileri topla
  7. PDF oluştur (device bazlı)

#### 4.4.2. `pages/report/utils/pdfReport.ts`
- `PdfReportRow` interface'ine `deviceName?: string` ekle (veya ayrı `PdfReportSection` interface)
- `buildTelemetryPdf` fonksiyonunu güncelle:
  - Device bazlı bölümler oluştur
  - Her device için ayrı tablo veya tek tablo (device sütunu ile)

#### 4.4.3. Lokalizasyon (`report.json`)
- `report.form.dashboard`: "Dashboard"
- `report.form.select_dashboard`: "Select Dashboard"
- `report.pdf.dashboard`: "Dashboard:"
- `report.pdf.device_section`: "Device: {deviceName}"

## 5. Test Senaryoları

### 5.1. Temel Senaryo
1. Dashboard seç (4 device içeren)
2. Tarih aralığı seç
3. PDF oluştur
4. **Beklenen:** 4 device için telemetri verileri, device isimleriyle

### 5.2. Edge Case'ler
- **Boş dashboard:** Entity yok → "No data" mesajı
- **Device ismi yok:** Device silinmiş → Device ID göster veya atla
- **Entity device_id yok:** Entity device'a bağlı değil → "Unknown Device" göster
- **Çoklu entity:** Bir device'ın 10+ entity'si → Tüm entity'ler raporda

### 5.3. Performans Testi
- **Büyük dashboard:** 20+ device, 100+ entity → Aggregate çağrıları paralel, timeout kontrolü
- **Uzun tarih aralığı:** 1 yıl → Aggregate API performansı

## 6. Sonuç ve Öneriler

### 6.1. ✅ Uygulanabilirlik
**Evet, uygulanabilir.** Tüm gerekli API'ler mevcut ve veri akışı net.

### 6.2. ⚠️ Dikkat Edilmesi Gerekenler
1. **Dashboard → Device mapping:** Entity'ler üzerinden yapılmalı (device_ids direkt yok)
2. **Performans:** Çoklu API çağrıları optimize edilmeli (paralel, batch)
3. **UI:** Dashboard seçimi zorunlu, entity seçimi kaldırılabilir veya otomatik

### 6.3. 📋 Uygulama Adımları
1. Dashboard dropdown ekle (form)
2. Dashboard seçildiğinde entity'leri al
3. Entity'lerden device'ları bul ve isimlerini al
4. Device-entity gruplama
5. PDF yapısını device bazlı güncelle
6. Test et (küçük → büyük dashboard)

### 6.4. 🎯 Önerilen PDF Yapısı
**Device bazlı bölümler** (her device için ayrı tablo) daha okunabilir ve kullanıcı dostu.

---

**Rapor Tarihi:** 2025-01-25  
**Durum:** Analiz tamamlandı, uygulanabilir ✅
