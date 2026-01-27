# PDF Export: Yetkilendirme, Rapor Arayüzü ve Firma İsmi – Uygulanabilirlik Raporu

**Talep:** PDF export yapılacak; **hangi kullanıcı olursa olsun** raporu alabilmeli; frontend’de rapor için arayüz (başlık yazma vb.); **firmalara satıldığında** her firma kendi firma ismini / benzer bilgileri raporlarda görebilmeli.  
**Kapsam:** Proje dosyaları ve **beaver-iot-docs-main** vb. kaynaklar incelenmiştir. **Sadece rapor;** kod yazılmamıştır.

**İlgili önceki rapor:** `SENSOR_TELEMETRY_PDF_RAPOR_GELISTIRME_RAPORU.md` (PDF rapor ihtiyacı, veri kaynakları, backend/frontend seçenekleri).

---

## 1. Taranan Kaynaklar

| Kaynak | İncelenenler |
|--------|--------------|
| **beaver-iot-web** | `constants.ts` (PERMISSIONS), `routes.tsx`, Entity Data export modal, entity sayfası export, `PermissionControlHidden`, `useUserPermissions`, setting `white-label`, `globalAPI` (getUserInfo: `tenant_id`), locales, manifest |
| **beaver-iot-docs-main** | `users-and-roles.md`, `entity.md`, `device.md`, `setting.md`, `personal-center.md`, `open-api/beaver.openapi.json` (entity/export, Authorization) |
| **beaver** | ChirpStack, `ChirpstackSensorModelMapping`, entity/device yapısı |

---

## 2. Mevcut Yetkilendirme ve Export

### 2.1 İzinler (PERMISSIONS)

- **Modül bazlı:** `DASHBOARD_MODULE`, `DEVICE_MODULE`, `ENTITY_MODULE`, `ENTITY_DATA_MODULE`, `WORKFLOW_MODULE`, `INTEGRATION_MODULE`, `TAG_MODULE`, `USER_ROLE`, `SETTING_MODULE`, `CREDENTIAL_MODULE`.
- **Alt izinler:** Örn. `DEVICE_VIEW`, `DEVICE_EDIT`, `ENTITY_DATA_VIEW`, `ENTITY_DATA_EDIT`. `ENTITY_DATA_EXPORT` **tanımlı değil** (yorum satırında).
- **Rotalar:** Menü/sayfa erişimi `permissions` ile kısıtlı; `authFree: false` varsayılan (giriş zorunlu).

### 2.2 Entity / CSV Export Kullanımı

- **Device → Entity Data:** Export butonu `PermissionControlHidden permissions={PERMISSIONS.DEVICE_VIEW}` ile sarılı. Sadece **DEVICE_VIEW** olan kullanıcılar görüyor ve kullanabiliyor.
- **Entity > Entity Data:** Export `PermissionControlHidden permissions={PERMISSIONS.ENTITY_DATA_VIEW}`. Checkbox / export **ENTITY_DATA_VIEW** veya **ENTITY_DATA_EDIT** ile kısıtlı.
- **OpenAPI:** `GET /entity/export` için `Authorization: Bearer {{access_token}}` tanımlı; API **kimlik doğrulama** bekliyor.

**Sonuç:** Bugün **her kullanıcı** export alamıyor; sadece **DEVICE_VIEW** veya **ENTITY_DATA_VIEW** (veya ilgili edit) yetkisi olanlar alabiliyor.

### 2.3 Kullanıcı / Rol / Kaynak (Docs)

- **users-and-roles.md:** Roller için **fonksiyon izinleri** (sayfa/aksiyon) ve **kaynak izinleri** (entegrasyon, cihaz, dashboard) tanımlanıyor.
- Entegrasyon eklenince, o entegrasyondaki cihazlar otomatik **cihaz izinleri**ne ekleniyor; **Entity > Entity Data**’da sadece bu cihazlara ait veriler listeleniyor.
- Yani **veri erişimi** rolün kaynak izinleriyle (cihaz/entegrasyon) sınırlı.

---

## 3. “Herkes Raporu Alabilsin” – Uygulanabilirlik

### 3.1 Hedef

**Hangi kullanıcı olursa olsun** (giriş yapmış her kullanıcı) raporu alabilsin.

### 3.2 Seçenekler

| Seçenek | Açıklama | Uygulanabilirlik |
|--------|----------|-------------------|
| **A) Yeni “rapor” izni, tüm rollere ver** | Örn. `REPORT_VIEW` / `REPORT_EXPORT` eklenir; **varsayılan** olarak tüm rollere atanır. Rapor menüsü ve PDF indirme bu izne bağlanır. | ✅ Uygulanabilir. Mevcut rol/izin yapısına uyumlu. |
| **B) Rapor sayfası/API izinsiz** | Rapor rotası `permissions` gerektirmez; PDF endpoint’i sadece **giriş** (Bearer) kontrolü yapar, ek fonksiyon izni istemez. | ✅ Uygulanabilir. “Herkes” = tüm giriş yapmış kullanıcılar. |
| **C) Veri kısıtı korunur** | Rapor içeriği, kullanıcının **kaynak izinleri**ne (erişebildiği cihaz/entegrasyon) göre filtrelenir. Sadece erişebildiği entity’ler rapora girer. | ✅ Uygulanabilir ve **önerilir**. Güvenlik korunur. |

### 3.3 Öneri

- **Erişim:** (A) veya (B) ile **giriş yapmış her kullanıcı** rapor arayüzünü açabilsin ve PDF istediğinde **fonksiyon izni** engeli olmasın.
- **İçerik:** (C) ile rapor, yalnızca kullanıcının **cihaz/entity erişimine** uygun verileri içersin (mevcut entity/device filtre mantığı ile uyumlu).

Bu sayede “herkes raporu alır” hedefine ulaşılır, veri sızıntısı olmaz.

---

## 4. Frontend Rapor Arayüzü – Uygulanabilirlik

### 4.1 Hedef

Rapor için **ayrı bir arayüz**: başlık yazma, tarih aralığı, sensör/grup filtreleri vb.

### 4.2 Mevcut Yapıya Uyum

- **Export modal (Entity Data):** Tarih aralığı (`DateRangePicker`), entity seçimi, tek “Export” aksiyonu. Benzer bileşenler rapor formunda da kullanılabilir.
- **Rotalar:** Yeni bir **Rapor** sayfası (örn. `/report` veya `/report/telemetry-pdf`) eklenebilir; `routes.tsx` ve menü tanımları güncellenir.
- **İzin:** Yukarıdaki “herkes alabilsin” seçimine göre bu sayfa ya **izinsiz** (sadece giriş) ya da **REPORT_VIEW** gibi herkese verilen izinle korunur.

### 4.3 Önerilen Form Alanları

| Alan | Açıklama | Uygulanabilirlik |
|------|----------|-------------------|
| **Rapor başlığı** | Kullanıcının yazdığı başlık (örn. “Ocak 2025 Telemetri Özeti”). PDF kapak/üst kısımda kullanılır. | ✅ Formda metin alanı; PDF’e parametre olarak gider. |
| **Tarih aralığı** | Veri için başlangıç / bitiş. Mevcut `DateRangePicker` ile uyumlu. | ✅ Zaten CSV export’ta kullanılıyor. |
| **Sensör / model / grup** | Cihaz, sensör modeli, cihaz grubu veya tag filtresi. | ✅ `ChirpstackSensorModelMapping`, device group, tag API’leri mevcut. |
| **Firma / organizasyon adı** | Raporlarda gösterilecek firma ismi (aşağıda detay). | ✅ Formda opsiyonel alan veya global/tenant ayarından doldurulabilir. |

**Sonuç:** Frontend’de rapor için **ayrı bir sayfa + form** (başlık, tarih, filtre, firma adı vb.) eklenmesi **uygulanabilir**; mevcut UI bileşenleri ve API’lerle uyumludur.

---

## 5. Firma İsmi / White-Label – Uygulanabilirlik

### 5.1 Hedef

**Firmalara satıldığında** her firma kendi **firma ismini** (ve benzeri bilgileri) raporlarda görebilsin.

### 5.2 Mevcut Durum

- **Setting > “White-label”:** `setting/components/white-label` klasörü **SMTP / e-posta credential** ayarlarına aittir; firma adı veya logo ile ilgili **bir yapı yok**.
- **Setting docs (setting.md):** “企业设置” (kurumsal ayarlar): SMTP, credential, cihaz blueprint kaynağı. **Firma/organizasyon adı** tanımlı değil.
- **getUserInfo:** `tenant_id` döner; **tenant’a ait firma adı** veya `company_name` gibi alan **yok**.
- **Uygulama başlığı:** `common.document.title`, manifest `name` / `short_name` = “ARIOT”. Bunlar **global**; kiracıya özel değil.

**Sonuç:** Bugün **firma ismi / organizasyon adı** için hazır bir config veya API **yok**. Eklenmesi gerekir.

### 5.3 Uygulanabilir Çözümler

| Seçenek | Açıklama | Uygulanabilirlik |
|--------|----------|-------------------|
| **1) Tenant / global config** | Backend’de tenant veya global ayar olarak **“Company name”** (firma/organizasyon adı) saklanır. Örn. Setting’e “Firma adı” alanı eklenir; OK’dan sonra API ile kaydedilir. | ✅ Uygulanabilir. Yeni config alanı + API + opsiyonel Setting UI. |
| **2) Rapor formunda override** | Rapor sayfasında “Rapor başlığı / Firma adı” gibi **opsiyonel** alan. Kullanıcı her rapor için geçici override girebilir. | ✅ Uygulanabilir. Sadece form + PDF’e parametre. |
| **3) Hibrit** | Varsayılan: tenant/global **firma adı**. İsteğe bağlı: Rapor formunda **o rapor için** farklı başlık/firma override. | ✅ Uygulanabilir ve **esnek**. Hem kurumsal varsayılan hem kullanıcı özelleştirmesi. |

### 5.4 Öneri

- **Uzun vadede:** Tenant/global **“Company name”** (firma adı) config’i eklenmeli; Setting’te yönetilebilmeli.
- **Rapor tarafında:**  
  - Varsayılan: Bu config’ten gelen firma adı PDF’te kullanılır.  
  - Opsiyonel: Rapor formunda “Firma adı / Rapor başlığı” ile **o rapora özel** override.
- Böylece **firmalara satış** senaryosunda her müşteri kendi kurumsal adını raporlarda görebilir; gerekirse rapor bazında özelleştirme de yapılabilir.

---

## 6. Özet Tablo

| Konu | Mevcut durum | Uygulanabilir mi? | Not |
|------|--------------|--------------------|-----|
| **Herkes raporu alabilsin** | Export DEVICE_VIEW / ENTITY_DATA_VIEW ile kısıtlı | ✅ Evet | Yeni rapor izni (veya izinsiz rota) + veri kaynak izinlerine göre filtrelenir. |
| **Rapor arayüzü (başlık vb.)** | Sadece Entity Data export modal (tarih + export) | ✅ Evet | Yeni Report sayfası + form (başlık, tarih, filtre, firma override). |
| **Firma ismi / white-label** | Yok (white-label = SMTP) | ✅ Evet | Tenant/global “Company name” config + rapor formu override’ı eklenmeli. |
| **PDF çıktı** | Yok (sadece CSV) | ✅ Evet | Önceki rapora göre backend PDF endpoint veya frontend PDF üretimi. |

---

## 7. Kısıtlar ve Dikkat Edilecekler

1. **Backend modülü:** Entity export ve yetki kontrolleri büyük olasılıkla **beaver ana uygulamasında** (integrations dışında). Rapor API’si ve “Company name” config’i de orada tanımlanmalı; proje yapısı buna göre irdelenmeli.
2. **Tenant / company config:** `tenant_id` var; **tenant bazlı** “company name” eklenmesi firmalara satış senaryosuyla uyumludur. Çok kiracı yoksa global tek config de yeterli olabilir.
3. **İzin varsayılanları:** “Herkes raporu alabilsin” için ya **yeni izin** tüm rollere varsayılan atanmalı ya da rapor **hiç fonksiyon iznine** bağlı olmamalı. Mevcut rol/yeni rol davranışı docs ile uyumlu tutulmalı.
4. **Veri kapsamı:** Rapor, **kullanıcının erişebildiği** cihaz/entity’lerle sınırlı kalmalı; **resource permissions** bypass edilmemeli.

---

## 8. Sonuç

- **Yetkilendirme:** “Hangi kullanıcı olursa olsun raporu alabilsin” hedefi, yeni **rapor izni** (ve tüm rollere verilmesi) veya **izinsiz rapor sayfası/API** ile **uygulanabilir**. Rapor verisi, mevcut **kaynak izinleri**yle sınırlı tutularak güvenlik korunabilir.
- **Frontend arayüz:** Rapor için **ayrı sayfa + form** (başlık, tarih aralığı, sensör/grup filtreleri, opsiyonel firma/başlık override) **uygulanabilir**; mevcut bileşenler ve API’ler kullanılabilir.
- **Firma ismi:** Bugün **yok**; **tenant/global “Company name”** config’i ve **rapor formunda override** seçeneği eklenerek **uygulanabilir**. Böylece firmalara satışta her müşteri kendi firma adını raporlarda kullanabilir.

Bu rapor, proje dosyaları ve **beaver-iot-docs-main** dokümanlarına dayanmaktadır; **yalnızca değerlendirme ve uygulanabilirlik** içerir, **kod yazılmamıştır**.
