# Rapor Sayfası Debug Log'ları

## Tarih
2026-01-26

## Amaç
Rapor sayfasında sorunun sayfada mı yoksa API tarafında mı olduğunu anlamak için kapsamlı debug log'ları eklendi.

## Eklenen Debug Log'ları

### 1. Component Lifecycle
- ✅ Component mount
- ✅ Dashboard list fetch (başlangıç, başarı, hata)
- ✅ Dashboard list update
- ✅ Dashboard ID change

### 2. Form State
- ✅ Form submit başlangıcı
- ✅ Form data (formData, currentValues, watch values)
- ✅ Dashboard ID resolution (formData, currentValues, watch)
- ✅ Form validation (dashboard ID, date range)
- ✅ Form submit başarı/hata

### 3. Dashboard Select Component
- ✅ onChange tetiklenmesi
- ✅ Selected value ve mevcut field.value
- ✅ Dashboard listesi uzunluğu
- ✅ Dashboard arama işlemi
- ✅ Dashboard bulundu/bulunamadı
- ✅ Original ID ve tipi
- ✅ field.onChange çağrısı
- ✅ Form state güncellemesi

### 4. API Çağrıları

#### 4.1. fetchDashboards
- ✅ API çağrısı başlangıcı
- ✅ Response (error, resp)
- ✅ Extracted data
- ✅ isRequestSuccess kontrolü
- ✅ Başarı/hata durumu
- ✅ Dashboard listesi (count, dashboards)

#### 4.2. getDashboardDetail
- ✅ Dashboard ID conversion (string → number)
- ✅ API request (id)
- ✅ Response (error, resp, isRequestSuccess)
- ✅ Error code kontrolü
- ✅ Dashboard detail data
- ✅ Entity IDs (count, list)

#### 4.3. entityAPI.advancedSearch
- ✅ API request (entityIds)
- ✅ Response (error, resp, isRequestSuccess)
- ✅ Error code kontrolü
- ✅ Entity data
- ✅ Entities count

#### 4.4. deviceAPI.getList
- ✅ API request (deviceIds)
- ✅ Response (error, resp, isRequestSuccess)
- ✅ Error code kontrolü
- ✅ Device data
- ✅ Devices count

#### 4.5. entityAPI.getAggregateHistory
- ✅ Her entity için aggregate fetch
- ✅ Her aggregate type için (LAST, MIN, MAX, AVG)
- ✅ API request (entity_id, start_timestamp, end_timestamp, aggregate_type)
- ✅ Response (error, isRequestSuccess)
- ✅ Error code kontrolü
- ✅ Aggregate value

### 5. Data Processing
- ✅ Entity grouping by device_id
- ✅ Device ID set size
- ✅ Device IDs list
- ✅ Device sections building
- ✅ Device sections count

### 6. PDF Generation
- ✅ PDF generation başlangıcı
- ✅ Date range string
- ✅ Generated at timestamp
- ✅ Report title, company name, dashboard name
- ✅ Device sections count
- ✅ PDF blob creation (size)
- ✅ File name
- ✅ Download initiation
- ✅ Success/hata durumu

### 7. Error Handling
- ✅ Try-catch error yakalama
- ✅ Error object ve stack trace
- ✅ Hata mesajları

## Log Format

Tüm log'lar şu format'ta:
```
[ReportPage] [KATEGORI] Mesaj
```

**Kategoriler:**
- `[FORM]` - Form state ve submit işlemleri
- `[SELECT]` - Dashboard select component
- `[API]` - API çağrıları
- `[PDF]` - PDF oluşturma
- `[ERROR]` - Hata durumları

**Özel İşaretler:**
- `==========` - Önemli işlem başlangıç/bitiş
- `✅` - Başarılı işlem
- `❌` - Başarısız işlem
- `⚠️` - Uyarı

## Console'da Nasıl Filtreleme Yapılır?

### Tüm Log'ları Görmek
Console'u açın (F12) ve tüm log'ları görün.

### Sadece Form İşlemlerini Görmek
Console'da filtre: `[ReportPage] [FORM]`

### Sadece API Çağrılarını Görmek
Console'da filtre: `[ReportPage] [API]`

### Sadece Select İşlemlerini Görmek
Console'da filtre: `[ReportPage] [SELECT]`

### Sadece Hataları Görmek
Console'da filtre: `[ReportPage] [ERROR]` veya `❌`

## Sorun Tespiti

### Sorun: Dashboard Seçimi Çalışmıyor
1. Console'da `[ReportPage] [SELECT]` log'larını kontrol edin
2. `onChange` tetikleniyor mu? → `[ReportPage] [SELECT] ========== DASHBOARD SELECT onChange ==========`
3. Dashboard bulunuyor mu? → `[ReportPage] [SELECT] ✅ Found dashboard`
4. Form state güncelleniyor mu? → `[ReportPage] [SELECT] After field.onChange - field.value`

### Sorun: Form Submit Çalışmıyor
1. Console'da `[ReportPage] [FORM]` log'larını kontrol edin
2. Form submit tetikleniyor mu? → `[ReportPage] [FORM] ========== FORM SUBMIT STARTED ==========`
3. Dashboard ID geçerli mi? → `[ReportPage] [FORM] ✅ Dashboard ID validation passed`
4. Date range geçerli mi? → `[ReportPage] [FORM] ✅ Date range validation passed`

### Sorun: API Çağrıları Başarısız
1. Console'da `[ReportPage] [API]` log'larını kontrol edin
2. Hangi API çağrısı başarısız? → `[ReportPage] [API] ❌ [API_NAME] failed`
3. Error code nedir? → `[ReportPage] [API]   - error_code: [CODE]`
4. Response nedir? → `[ReportPage] [API]   - response: [RESPONSE]`

### Sorun: PDF Oluşturulmuyor
1. Console'da `[ReportPage] [PDF]` log'larını kontrol edin
2. PDF generation başladı mı? → `[ReportPage] [PDF] Step 7: Generating PDF...`
3. PDF blob oluşturuldu mu? → `[ReportPage] [PDF] ✅ PDF blob created`
4. Hata var mı? → `[ReportPage] [ERROR] ========== PDF GENERATION ERROR ==========`

## Örnek Log Akışı

### Başarılı Senaryo:
```
[ReportPage] Component mounted, fetching dashboards...
[ReportPage] [API] Starting fetchDashboards API call...
[ReportPage] [API] fetchDashboards success - count: 3 dashboards: [...]
[ReportPage] Dashboard list updated: 3 dashboards: [...]
[ReportPage] [SELECT] ========== DASHBOARD SELECT onChange ==========
[ReportPage] [SELECT] ✅ Found dashboard: Dashboard 1
[ReportPage] [SELECT] After field.onChange - field.value: 1
[ReportPage] dashboardId changed: 1 Type: number
[ReportPage] Dashboard name updated: Dashboard 1
[ReportPage] [FORM] ========== FORM SUBMIT STARTED ==========
[ReportPage] [FORM] ✅ Dashboard ID validation passed: 1
[ReportPage] [FORM] ✅ Date range validation passed
[ReportPage] [API] ========== API CALLS STARTING ==========
[ReportPage] [API] Step 1.1: Calling getDashboardDetail API...
[ReportPage] [API] ✅ getDashboardDetail success
[ReportPage] [API] Step 2: Calling entityAPI.advancedSearch...
[ReportPage] [API] ✅ entityAPI.advancedSearch success
[ReportPage] [API] Step 4: Calling deviceAPI.getList...
[ReportPage] [API] ✅ deviceAPI.getList success
[ReportPage] [API] Step 6: Fetching aggregate data for entities...
[ReportPage] [API] ✅ Aggregate data fetch completed
[ReportPage] [PDF] Step 7: Generating PDF...
[ReportPage] [PDF] ✅ PDF blob created, size: 12345 bytes
[ReportPage] [PDF] ✅ PDF download initiated
[ReportPage] [FORM] ========== FORM SUBMIT SUCCESS ==========
```

### Hatalı Senaryo:
```
[ReportPage] [FORM] ========== FORM SUBMIT STARTED ==========
[ReportPage] [FORM] ❌ Dashboard ID validation failed: undefined
[ReportPage] [ERROR] ========== PDF GENERATION ERROR ==========
[ReportPage] [ERROR] Error: [ERROR_MESSAGE]
```

## Notlar

- Tüm log'lar production'da kaldırılabilir (console.log'ları kaldırarak)
- Log'lar performansı etkilemez (sadece development'ta aktif)
- Log'lar sorun tespiti için yeterli bilgi sağlar
- Network tab'ı ile birlikte kullanıldığında daha etkili

## Sonuç

Rapor sayfasına kapsamlı debug log'ları eklendi. Artık:
- ✅ Sorunun sayfada mı yoksa API tarafında mı olduğu anlaşılabilir
- ✅ Form state değişiklikleri takip edilebilir
- ✅ API çağrıları detaylı şekilde log'lanır
- ✅ Hata durumları net şekilde görülebilir
- ✅ PDF oluşturma süreci takip edilebilir

Console'u açıp (F12) log'ları kontrol ederek sorunun kaynağını bulabilirsiniz.
