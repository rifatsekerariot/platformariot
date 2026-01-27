# PDF Telemetri Raporu – Proje ve Kod Planı

## 1. Amaç

- **PDF export:** Seçilen entity’ler için telemetri özeti (min/max/avg/son) PDF olarak indirilebilsin.
- **Herkes erişebilsin:** Rapor sayfası **izin gerektirmesin** (giriş yeterli); menüde herkese görünsün.
- **Rapor arayüzü:** Başlık, tarih aralığı, entity seçimi, firma adı (opsiyonel) alanları.
- **Firma ismi:** Formda opsiyonel “Firma adı” override; ileride tenant/global config eklenebilir.

## 2. Kapsam

- **Frontend only:** Mevcut API’ler (`entity/advanced-search`, `entity/history/aggregate`) kullanılır; backend’de yeni endpoint yok.
- **PDF:** `jspdf` + `jspdf-autotable` ile tarayıcıda üretilip indirilir.

## 3. Adımlar

| # | Adım | Dosya / Değişiklik |
|---|------|---------------------|
| 1 | jsPDF bağımlılıkları | `apps/web/package.json`: `jspdf`, `jspdf-autotable` |
| 2 | Menü: izinsiz rotalar | `BasicLayout`: `isEmpty(permissions) \|\| hasPermission(permissions)` |
| 3 | Rota + sayfa | `routes.tsx`: `/report`, no `permissions`; lazy `pages/report` |
| 4 | Report sayfası | `pages/report/index.tsx`: form + entity tablosu + Generate PDF |
| 5 | PDF üretimi | `pages/report/utils/pdfReport.ts`: aggregate → tablo → jsPDF → blob |
| 6 | Lokalizasyon | `locales`: `report.title`, `report.form.*`, `report.message.*` |
| 7 | Test | Dev server, login, Report, entity seç, tarih, başlık, PDF indir |
| 8 | Push + CI/CD | beaver-iot-web → GitHub; beaver-iot-docker workflow |

## 4. Form Alanları

- **Rapor başlığı** (opsiyonel): Metin; PDF üstünde kullanılır.
- **Tarih aralığı** (zorunlu): `DateRangePicker`; aggregate için `start_timestamp` / `end_timestamp`.
- **Entity seçimi:** `advancedSearch` (ENTITY_TYPE=PROPERTY) ile liste, tablo + checkbox; kullanıcı seçer.
- **Firma adı** (opsiyonel): Metin; PDF’te “Firma” satırında.

## 5. PDF İçeriği

1. **Üst:** Rapor başlığı (veya varsayılan “Telemetri Raporu”), firma adı (varsa), tarih aralığı.
2. **Tablo:** Entity adı | Birim | Son | Min | Max | Ortalama — her seçili entity için `getAggregateHistory` (LAST, MIN, MAX, AVG) çağrılır.
3. **Alt:** Oluşturulma tarihi, “ARIOT”.

## 6. Yetkilendirme

- Rota **`permissions`** tanımlı değil; `useRoutePermission` `isEmpty(permissions)` ile 403’e düşmez.
- Menü: `BasicLayout` menü filtresinde `isEmpty(route.handle?.permissions)` ise **her zaman göster**; aksi halde `hasPermission` kontrolü.

## 7. Test

1. `pnpm dev` → login → **Report** menüsü görünür, sayfa açılır.
2. Entity listesi yüklenir; en az bir entity seçilir.
3. Tarih aralığı seçilir; isteğe bağlı başlık ve firma adı yazılır.
4. **Generate PDF** → PDF indirilir; üstte başlık/firma/tarih, tabloda entity’ler, altta ARIOT.

## 8. CI/CD

- Değişiklikler **beaver-iot-web**’e push edilir.
- **beaver-iot-docker** CI, web’i clone edip imaj build eder; gerekirse workflow tetiklenir.

---

## 9. Uygulama Özeti (Yapılanlar)

| Adım | Durum | Dosya / Değişiklik |
|------|--------|---------------------|
| 1 | ✅ | `apps/web/package.json`: `jspdf`, `jspdf-autotable` eklendi |
| 2 | ✅ | `layouts/BasicLayout.tsx`: menü filtresi `isEmpty(permissions) \|\| hasPermission(permissions)` |
| 3 | ✅ | `routes/routes.tsx`: `/report` rotası (izin yok), `ListAltIcon`, lazy `pages/report` |
| 4 | ✅ | `pages/report/index.tsx`: form (başlık, firma, tarih aralığı), entity tablosu, Generate PDF |
| 5 | ✅ | `pages/report/utils/pdfReport.ts`: `buildTelemetryPdf` (jsPDF + autotable), blob → `linkDownload` |
| 6 | ✅ | `packages/locales`: `report` modülü `helper.ts` appLocalModules'a eklendi; `en/report.json`, `cn/report.json` |
| 7 | ✅ | `pnpm build` ve `ts-check` geçti |
| 8 | 🔲 | GitHub push + CI/CD tetikleme |

**Özet:** Rapor sayfası `/report`; giriş yapan herkes menüde görür, entity seçip tarih aralığı + opsiyonel başlık/firma ile PDF indirebilir. Veri `entity/advanced-search` ve `entity/history/aggregate` API'lerinden alınır.
