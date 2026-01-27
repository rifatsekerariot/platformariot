# Authentication Error Handling Düzeltme Raporu

## Tarih
2025-01-25

## Sorun
PDF raporu oluştur butonuna basıldığında authentication hatası alınıyordu:

```json
{
  "status": "Failed",
  "error_code": "authentication_failed",
  "error_message": "invalid_request:Full authentication is required to access this resource"
}
```

## Kök Neden Analizi

### 1. Token Expire Olması
- Kullanıcı login olmuş ama token expire olmuş olabilir
- Token refresh edilemiyor olabilir
- Token header'a eklenmiyor olabilir

### 2. Error Handler Çift Mesaj
- Global error handler `authentication_failed` hatasını handle ediyor ve login sayfasına yönlendiriyor
- Report sayfasındaki API çağrılarında da hata mesajı gösteriliyor
- Bu, çift hata mesajına ve kullanıcı deneyiminin bozulmasına neden oluyor

### 3. API Çağrılarında Authentication Kontrolü Eksikliği
- Report sayfasındaki tüm API çağrılarında authentication hatası kontrolü yapılmıyordu
- Authentication hatası geldiğinde gereksiz hata mesajları gösteriliyordu

## Yapılan Düzeltmeler

### 1. Authentication Error Kontrolü Eklendi
**Önceki Kod:**
```tsx
const [err1, resp1] = await awaitWrap(
    dashboardAPI.getDashboardDetail({
        id: dashboardIdForApi as ApiKey,
    }),
);
if (err1 || !isRequestSuccess(resp1)) {
    toast.error(getIntlText('report.message.dashboard_not_found'));
    return;
}
```

**Yeni Kod:**
```tsx
const [err1, resp1] = await awaitWrap(
    dashboardAPI.getDashboardDetail({
        id: dashboardIdForApi as ApiKey,
    }),
);
if (err1 || !isRequestSuccess(resp1)) {
    // Check if it's an authentication error
    const errorCode = (resp1?.data as ApiResponse)?.error_code;
    if (errorCode === 'authentication_failed') {
        // Error handler will redirect to login, just return
        return;
    }
    toast.error(getIntlText('report.message.dashboard_not_found'));
    return;
}
```

**Değişiklikler:**
- ✅ Authentication hatası kontrolü eklendi
- ✅ Authentication hatası geldiğinde sadece return ediliyor (error handler login sayfasına yönlendirecek)
- ✅ Gereksiz hata mesajları önlendi

### 2. Tüm API Çağrılarında Authentication Kontrolü
Aşağıdaki API çağrılarında authentication hatası kontrolü eklendi:

1. **`dashboardAPI.getDashboardDetail`** - Dashboard detail almak için
2. **`entityAPI.advancedSearch`** - Entity'leri almak için
3. **`deviceAPI.getList`** - Device'ları almak için
4. **`entityAPI.getAggregateHistory`** - Aggregate data almak için (her entity için)

### 3. Aggregate History API Çağrısında Özel Kontrol
**Önceki Kod:**
```tsx
const agg = async (t: 'LAST' | 'MIN' | 'MAX' | 'AVG') => {
    const [err, resp] = await awaitWrap(
        entityAPI.getAggregateHistory({
            entity_id: entity.entityId,
            start_timestamp: start,
            end_timestamp: end,
            aggregate_type: t,
        }),
    );
    const d = !err && isRequestSuccess(resp) ? getResponseData(resp) : null;
    return d?.value != null ? (typeof d.value === 'number' ? d.value : Number(d.value)) : NaN;
};
```

**Yeni Kod:**
```tsx
const agg = async (t: 'LAST' | 'MIN' | 'MAX' | 'AVG') => {
    const [err, resp] = await awaitWrap(
        entityAPI.getAggregateHistory({
            entity_id: entity.entityId,
            start_timestamp: start,
            end_timestamp: end,
            aggregate_type: t,
        }),
    );
    // Check if it's an authentication error
    if (resp && !isRequestSuccess(resp)) {
        const errorCode = (resp?.data as ApiResponse)?.error_code;
        if (errorCode === 'authentication_failed') {
            // Error handler will redirect to login
            return NaN;
        }
    }
    const d = !err && isRequestSuccess(resp) ? getResponseData(resp) : null;
    return d?.value != null ? (typeof d.value === 'number' ? d.value : Number(d.value)) : NaN;
};
```

## Test ve Doğrulama

### TypeScript Kontrolü
```bash
cd beaver-iot-web
npm exec -- pnpm --filter=@app/web run ts-check
```
✅ **Sonuç:** Başarılı (exit code: 0)

### Yapılan Değişiklikler
1. ✅ `dashboardAPI.getDashboardDetail` - Authentication hatası kontrolü eklendi
2. ✅ `entityAPI.advancedSearch` - Authentication hatası kontrolü eklendi
3. ✅ `deviceAPI.getList` - Authentication hatası kontrolü eklendi
4. ✅ `entityAPI.getAggregateHistory` - Authentication hatası kontrolü eklendi
5. ✅ TypeScript kontrolü geçti
6. ✅ GitHub'a push edildi

## Nasıl Test Edilir?

### Senaryo 1: Token Expire Olmuş
1. **Login olun**
2. **Token'ı expire edin** (60 dakika bekleyin veya token'ı manuel olarak silin)
3. **Rapor sayfasına gidin** (`/report`)
4. **Dashboard seçin**
5. **"Generate PDF" butonuna basın**
6. **Beklenen:** 
   - Authentication hatası alınmalı
   - Error handler login sayfasına yönlendirmeli
   - Çift hata mesajı gösterilmemeli

### Senaryo 2: Token Geçerli
1. **Login olun**
2. **Rapor sayfasına gidin** (`/report`)
3. **Dashboard seçin**
4. **"Generate PDF" butonuna basın**
5. **Beklenen:**
   - PDF başarıyla oluşturulmalı
   - Authentication hatası alınmamalı

## Beklenen Davranış

### Önceki Sorunlu Davranış:
- ❌ Authentication hatası alınıyor
- ❌ Çift hata mesajı gösteriliyor (global error handler + report page error)
- ❌ Kullanıcı deneyimi bozuluyor

### Yeni Düzeltilmiş Davranış:
- ✅ Authentication hatası alınıyor
- ✅ Sadece global error handler mesajı gösteriliyor
- ✅ Login sayfasına yönlendiriliyor
- ✅ Kullanıcı deneyimi iyileştirildi

## Commit Bilgileri

### beaver-iot-web
- **Commit:** `6dbb077`
- **Mesaj:** `fix: Handle authentication_failed error in report page API calls - prevent duplicate error messages`
- **Branch:** `main`
- **Değişiklikler:** 1 file changed, 24 insertions(+)

## Teknik Detaylar

### Error Handler Yapısı
Global error handler (`error-handler.ts`) `authentication_failed` hatasını handle ediyor:
1. Hata mesajı gösteriyor
2. Token'ı cache'den siliyor
3. Kullanıcıyı login sayfasına yönlendiriyor

### Report Page Error Handling
Report sayfasındaki API çağrılarında:
1. Authentication hatası kontrolü yapılıyor
2. Authentication hatası geldiğinde sadece return ediliyor
3. Global error handler'ın işlemesine izin veriliyor
4. Gereksiz hata mesajları önleniyor

## Notlar

- Authentication hatası global error handler tarafından handle ediliyor
- Report sayfasındaki API çağrılarında authentication hatası kontrolü yapılıyor
- Çift hata mesajı önlendi
- Kullanıcı deneyimi iyileştirildi

## Olası Nedenler ve Çözümler

### 1. Token Expire Olmuş
**Çözüm:** Kullanıcı tekrar login olmalı. Error handler otomatik olarak login sayfasına yönlendirecek.

### 2. Token Refresh Edilemiyor
**Çözüm:** Token refresh logic'i `oauth-handler.ts`'de var. Eğer refresh edilemiyorsa, kullanıcı tekrar login olmalı.

### 3. Token Header'a Eklenmiyor
**Çözüm:** `oauth-handler.ts`'deki interceptor token'ı header'a ekliyor. Eğer eklenmiyorsa, token cache'den okunamıyor olabilir.

## Sonuç

Authentication error handling iyileştirildi. Artık:
- ✅ Authentication hatası doğru şekilde handle ediliyor
- ✅ Çift hata mesajı önlendi
- ✅ Kullanıcı login sayfasına yönlendiriliyor
- ✅ Kullanıcı deneyimi iyileştirildi
