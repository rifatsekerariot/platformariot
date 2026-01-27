# Dashboard Seçim Sorunu Debug Raporu

## Tarih
2026-01-26

## Sorun
Dashboard seçim sorunu tekrar ortaya çıktı. Kullanıcı dashboard seçemiyor, "Please select a dashboard." hatası alıyor.

## Yapılan Değişiklikler

### 1. onChange Handler Sadeleştirildi
- `setValue` kaldırıldı (çift update sorun yaratıyor olabilir)
- Dashboard listesinden orijinal ID bulunup kullanılıyor
- Daha detaylı console log'lar eklendi

### 2. displayEmpty Prop Eklendi
- Material-UI Select'e `displayEmpty` prop'u eklendi
- Bu, boş değerlerin daha iyi handle edilmesini sağlar

### 3. Value Prop İyileştirildi
- Value prop daha güvenilir hale getirildi
- `undefined` kontrolü eklendi

## Test Adımları

### 1. Console Log'ları Kontrol Et
Tarayıcı console'unu açın (F12) ve şu log'ları kontrol edin:

1. **Dashboard listesi yüklendiğinde:**
   ```
   [Dashboard Select] onChange triggered - selectedValue: <value> dashboardList length: <number>
   ```

2. **Dashboard seçildiğinde:**
   ```
   [Dashboard Select] Found dashboard - dId: <id> dIdString: <string> selectedValue: <value>
   [Dashboard Select] Setting field value to original ID: <id> Type: <type>
   [Dashboard Select] After onChange - getValues: <value> watch: <value> field.value: <value>
   ```

3. **Dashboard bulunamadığında:**
   ```
   [Dashboard Select] Dashboard not found for value: <value> Available dashboards: [...]
   ```

### 2. Form State Kontrolü
Console'da şu komutları çalıştırın:
```javascript
// Form state'i kontrol et
const form = document.querySelector('form');
console.log('Form:', form);

// Select element'ini kontrol et
const select = document.querySelector('[id*="dashboard-select"]');
console.log('Select element:', select);
console.log('Select value:', select?.value);
```

### 3. Dashboard Listesi Kontrolü
Console'da şu komutları çalıştırın:
```javascript
// React DevTools kullanarak component state'ini kontrol et
// veya
console.log('Dashboard list from API should be visible in network tab');
```

## Olası Sorunlar ve Çözümler

### Sorun 1: Dashboard Listesi Boş
**Belirtiler:**
- Dropdown açılıyor ama içi boş
- Console'da "dashboardList length: 0"

**Çözüm:**
- API çağrısını kontrol et
- `fetchDashboards` fonksiyonunun çalıştığından emin ol
- Network tab'ında API response'u kontrol et

### Sorun 2: onChange Tetiklenmiyor
**Belirtiler:**
- Dashboard seçildiğinde console log'u görünmüyor
- Form state güncellenmiyor

**Çözüm:**
- Select component'inin doğru render edildiğinden emin ol
- `disabled` prop'unun `false` olduğundan emin ol
- Material-UI Select'in event handler'ının doğru bağlandığından emin ol

### Sorun 3: Dashboard Bulunamıyor
**Belirtiler:**
- Console'da "Dashboard not found for value" hatası
- Available dashboards listesi görünüyor ama eşleşme yok

**Çözüm:**
- Dashboard ID'lerinin tipini kontrol et (number vs string)
- String karşılaştırmasını kontrol et
- Dashboard listesindeki ID format'ını kontrol et

### Sorun 4: Form State Güncellenmiyor
**Belirtiler:**
- onChange tetikleniyor ama form state güncellenmiyor
- `getValues` ve `watch` farklı değerler döndürüyor

**Çözüm:**
- `field.onChange`'in doğru çağrıldığından emin ol
- Form state'inin güncellenmesi için biraz bekle
- React DevTools ile component state'ini kontrol et

## Sonraki Adımlar

1. **Console log'larını incele** - Hangi adımda sorun olduğunu bul
2. **Network tab'ını kontrol et** - API çağrılarının başarılı olduğundan emin ol
3. **React DevTools kullan** - Component state'ini kontrol et
4. **Material-UI Select dokümantasyonunu kontrol et** - Doğru kullanımı doğrula

## Notlar

- Console log'lar debug amaçlıdır ve production'da kaldırılabilir
- `displayEmpty` prop'u Material-UI Select'in boş değerleri daha iyi handle etmesini sağlar
- Dashboard ID'sinin orijinal tipini kullanmak (number veya string) form state'inin doğru çalışması için önemlidir
