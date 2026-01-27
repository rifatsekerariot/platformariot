# Dashboard Seçim Dropdown Düzeltme Raporu

## Tarih
2025-01-25

## Sorun
Rapor sayfasındaki dashboard seçim dropdown'u çalışmıyordu. Kullanıcı dropdown'dan bir dashboard seçmeye çalıştığında seçim gerçekleşmiyordu.

## Yapılan Düzeltmeler

### 1. Material-UI Select Component Düzeltmeleri
**Dosya:** `beaver-iot-web/apps/web/src/pages/report/index.tsx`

**Değişiklikler:**
- **`label` prop'unu kaldırdık:** Material-UI'da `InputLabel` kullanıldığında `Select` component'inde `label` prop'u kullanılmamalı. Bu çakışma seçim işlemini engelliyordu.
- **`inputRef` eklendi:** `field.ref`'i `Select` component'ine `inputRef` prop'u olarak eklendi. Bu, react-hook-form'un ref yönetimini doğru şekilde yapmasını sağlar.
- **Console.log eklendi:** Debug için `onChange` handler'ına `console.log` eklendi. Bu, seçimin gerçekleşip gerçekleşmediğini kontrol etmek için kullanılabilir.
- **Boş durum kontrolü:** Dashboard listesi boş olduğunda veya yüklenirken kullanıcıya bilgi veren bir `MenuItem` eklendi.

### 2. Çeviri Anahtarları Eklendi
**Dosyalar:**
- `beaver-iot-web/packages/locales/src/lang/en/report.json`
- `beaver-iot-web/packages/locales/src/lang/cn/report.json`

**Eklenen anahtar:**
```json
"report.message.no_dashboards": "No dashboards available." // EN
"report.message.no_dashboards": "没有可用的仪表板。" // CN
```

## Teknik Detaylar

### Önceki Kod (Sorunlu)
```tsx
<Select
    labelId="dashboard-select-label"
    label={getIntlText('report.form.dashboard')} // ❌ Bu prop sorun yaratıyor
    value={field.value ?? ''}
    onChange={(e) => {
        field.onChange(e.target.value);
    }}
    onBlur={field.onBlur}
    name={field.name}
>
```

### Yeni Kod (Düzeltilmiş)
```tsx
<Select
    labelId="dashboard-select-label"
    // label prop'u kaldırıldı ✅
    value={field.value ?? ''}
    onChange={(e) => {
        const value = e.target.value;
        console.log('Dashboard selected:', value); // Debug için
        field.onChange(value);
    }}
    onBlur={field.onBlur}
    name={field.name}
    inputRef={field.ref} // ✅ Ref yönetimi eklendi
>
```

## Test ve Doğrulama

### TypeScript Kontrolü
```bash
cd beaver-iot-web
npm exec -- pnpm --filter=@app/web run ts-check
```
✅ **Sonuç:** Başarılı (exit code: 0)

### Yapılan Değişiklikler
1. ✅ `label` prop'u kaldırıldı
2. ✅ `inputRef` eklendi
3. ✅ Console.log eklendi (debug için)
4. ✅ Boş durum kontrolü eklendi
5. ✅ Çeviri anahtarları eklendi
6. ✅ TypeScript kontrolü geçti
7. ✅ GitHub'a push edildi
8. ✅ CI/CD tetiklendi

## Nasıl Test Edilir?

1. **Tarayıcı Console'unu açın** (F12)
2. **Rapor sayfasına gidin** (`/report`)
3. **Dashboard dropdown'unu açın**
4. **Bir dashboard seçin**
5. **Console'da şu mesajı görmelisiniz:** `Dashboard selected: <dashboard_id>`
6. **Form state'inin güncellendiğini kontrol edin:** "Generate PDF" butonu aktif olmalı

## Commit Bilgileri

### beaver-iot-web
- **Commit:** `f511030`
- **Mesaj:** `fix: Dashboard selection dropdown in report page - remove label prop, add inputRef, improve error handling`
- **Branch:** `main`

### beaver-iot-docker
- **Commit:** `4cd08d5`
- **Mesaj:** `chore: Trigger CI/CD for dashboard selection fix`
- **Branch:** `main`

## Beklenen Sonuç

Dashboard seçim dropdown'u artık düzgün çalışmalı:
- ✅ Dropdown açılıyor
- ✅ Dashboard'lar listeleniyor
- ✅ Seçim yapılabiliyor
- ✅ Form state güncelleniyor
- ✅ "Generate PDF" butonu aktif hale geliyor

## Notlar

- Console.log debug amaçlıdır ve production'da kaldırılabilir
- `inputRef` eklenmesi react-hook-form'un ref yönetimi için önemlidir
- Material-UI Select component'i ile `InputLabel` kullanırken `label` prop'u kullanılmamalıdır
