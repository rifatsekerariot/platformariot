# Sensör / Sensör Grubu Telemetri Verilerini PDF Rapor Olarak Alma – Geliştirme Raporu

**Talep:** İstediğimiz bir sensör veya sensör gruplarının telemetri verilerini anlamlı bir şekilde PDF olarak alabileceğimiz bir geliştirme yapılabilir mi?  
**Kapsam:** Tüm proje klasörleri + program docs klasörleri taranmıştır. **Sadece rapor;** kod yazılmamıştır.

---

## 1. Taranan Klasörler

| Klasör | İçerik |
|--------|--------|
| **beaver** | ChirpStack entegrasyonu, `ChirpstackTelemetryMapping`, `ChirpstackSensorModelMapping`, entity/device servisleri, mevcut `.md` raporları |
| **beaver-iot-web** | Entity API (`entity.ts`), Entity Data sayfası, Export modal (CSV), dashboard/widget yapısı, device detay, tag/device group kullanımı |
| **beaver-iot-docs-main** | User guide (entity, device, dashboard), dev-guides (backend, frontend, API), OpenAPI (`beaver.openapi.json`) |
| **beaver-iot-docker** | Docker/CI yapılandırması, örnek compose |
| **SensorDecoders-main** | Milesight sensör decoder’ları; seri/model yapısı (am-series, em-series, vs-series, ws-series, wt-series, wts-series, …) |

**Docs alt yapısı (beaver-iot-docs-main):**

- `docs/user-guides/user-guide/`: `entity.md`, `device.md`, `dashboard.md`, `integration.md`, …
- `docs/dev-guides/`: `key-dev-concept.md`, `backend/`, `frontend/`, `deployment/`
- `open-api/beaver.openapi.json`: REST API tanımları (`/entity/export`, `/entity/history/search`, `/entity/history/aggregate`, …)

---

## 2. Mevcut Veri ve Dışa Aktarma Yapısı

### 2.1 Entity ve Telemetri

- **Entity:** Cihaza bağlı veri taşıyıcı (property/event/service). Telemetri genelde **property** tipinde; değerler `entity_value` olarak saklanır.
- **Entity key formatı:** `{integration}.device.{deviceId}.{entityId}` (örn. `chirpstack-integration.device.xxx.temperature`).
- **Veri erişimi:**
  - **Anlık değer:** `GET /api/v1/entity/:id/status` → `getEntityStatus`
  - **Zaman serisi:** `POST /api/v1/entity/history/search` → `entity_id`, `start_timestamp`, `end_timestamp`, sayfalama
  - **Agregasyon:** `POST /api/v1/entity/history/aggregate` → `entity_id`, zaman aralığı, `aggregate_type`: `LAST` | `MIN` | `MAX` | `AVG` | `SUM`

### 2.2 Mevcut Export (CSV)

- **Endpoint:** `GET /api/v1/entity/export`
- **Parametreler:** `ids` (entity id listesi), `start_timestamp`, `end_timestamp`, `time_zone`
- **Çıktı:** CSV dosyası (blob). Dosya adı örneği: `EntityData_YYYY_MM_DD_xxxxxx.csv`
- **UI:** **Device → Entity Data** sekmesinde entity’ler listelenir, kullanıcı seçim yapar → **Export** → tarih aralığı seçilir → CSV indirilir.
- **Dokümantasyon:** `entity.md` içinde “导出实体数据” (entity verisi dışa aktarma) CSV olarak anlatılmıştır.

**Özet:** Şu an yalnızca **CSV** export var; **PDF export yok**.

---

## 3. Sensör ve Sensör Grubu Kavramları

### 3.1 Sensör Modeli (Tek Sensör)

- **ChirpstackSensorModelMapping:** `am102`, `em500-udl`, `vs121`, `wts506`, … gibi model id’leri → ürettikleri **entity id** listesi ile eşlenir.
- Cihaz eklerken **Sensör modeli** (opsiyonel) seçilebiliyor; bu modele ait entity’ler oluşturulur, `device.additional["sensorModel"]` içinde saklanır.
- **Tek sensör** = belirli bir **cihaz** (tek model) veya **model id** (örn. tüm AM102 cihazları).

### 3.2 Sensör Grubu

- **SensorDecoders serileri:** `am-series`, `em-series`, `vs-series`, `ws-series`, `wt-series`, `wts-series`, `ct-series`, `at-series`, … Her seri altında modeller (örn. `am102`, `am103`, `em500-udl`).
- **Sensör grubu** örnekleri:
  1. **Seri bazlı:** Örn. “AM Series” → `am102`, `am103`, `am104`, … tüm modeller.
  2. **Model listesi:** Kullanıcının seçtiği modeller (örn. `am102`, `em500-udl`, `vs121`).
  3. **Cihaz grubu:** Beaver **device group**; bir gruba ait cihazların entity’leri.
  4. **Etiket (tag):** Entity’lere tag atanabiliyor; tag’e göre filtreleyip o entity’lerin telemetrisini raporlamak.

Bu yapı, “istenen sensör veya sensör grupları”nı **cihaz / model / seri / grup / tag** bazında tanımlamaya uygundur.

---

## 4. PDF Rapor İhtiyacı ve Yapılabilirlik

### 4.1 İhtiyaç

- Seçilen **sensör(ler)** veya **sensör grubu** için:
  - Belirli bir **zaman aralığı**ndaki telemetri verileri
  - **Anlamlı** bir özet: min/max/ortalama, son değer, gerekirse kısa zaman serisi özeti veya basit grafik
- Çıktının **PDF** olarak indirilebilmesi.

### 4.2 Yapılabilirlik

**Evet, yapılabilir.** Gerekli veriler ve API’ler mevcut:

| Veri | Kaynak |
|------|--------|
| Entity listesi | `POST /entity/advanced-search` (device, entity type, tag, vb. ile filtrelenebilir) |
| Zaman serisi | `POST /entity/history/search` |
| Agregasyon (min/max/avg/son) | `POST /entity/history/aggregate` |
| Cihaz / sensör modeli | Device detail, `additional.sensorModel` (ChirpStack cihazları) |
| Cihaz grubu / tag | Device search, entity tags API’leri |

Mevcut **CSV export** benzeri bir akışla, aynı verileri kullanıp **PDF** üretmek mimari olarak mümkündür.

---

## 5. Önerilen Geliştirme Seçenekleri

### 5.1 Backend’de PDF Üretimi (Önerilen)

- **Yeni endpoint:** Örn. `GET /api/v1/report/telemetry-pdf` veya `POST /api/v1/report/telemetry-pdf`
- **Parametreler:**  
  - Filtre: sensör model(ler), sensör grubu (seri/model listesi), cihaz grubu, cihaz id’leri, entity tag’i.  
  - Zaman: `start_timestamp`, `end_timestamp`, `timezone`.  
  - Opsiyonel: agregasyon türü, sayfa başına entity sayısı, dil.
- **Akış:**  
  1. Filtreye göre ilgili cihaz/entity’leri belirle (advanced-search, device search, ChirpstackSensorModelMapping vb.).  
  2. Bu entity’ler için history/aggregate çağrıları yap.  
  3. Java tarafında **iText**, **OpenPDF** veya **Apache PDFBox** ile PDF oluştur.  
  4. PDF’i **blob** olarak döndür; frontend indirir.
- **Avantajlar:** Büyük veri setlerinde güvenli, tutarlı format, mevcut CSV export’a benzer kullanım.

### 5.2 Frontend’de PDF Üretimi

- **Araçlar:** `jspdf`, `jspdf-autotable`, isteğe bağlı `html2canvas` (grafik için).
- **Akış:**  
  1. Kullanıcı sensör/grup + tarih aralığı seçer.  
  2. Frontend `entity/history/search` ve/veya `aggregate` çağırır.  
  3. Gelen JSON’u tablo/grafik olarak render edip PDF’e aktarır.
- **Değerlendirme:** Küçük seçimler için uygundur; çok entity / uzun tarih aralığında bellek ve performans riski vardır. Özellikle “tüm sensör grubu” raporları için backend çözümü daha uygun olur.

### 5.3 Hibrit (CSV → PDF)

- Mevcut **entity export** CSV’yi oluşturmaya devam eder.
- Ayrı bir **hafif servis** (örn. script, lambda) CSV’yi okuyup PDF’e dönüştürür; veya frontend CSV + ek metadata’yı alıp kısıtlı bir PDF oluşturur.
- **Değerlendirme:** İki aşamalı olduğu ve CSV formatına bağımlılık yarattığı için, doğrudan “telemetri → PDF” backend çözümü genelde daha temiz olur.

---

## 6. “Anlamlı” PDF İçeriği Önerileri

Raporun anlamlı olması için aşağıdaki yapı önerilir:

1. **Kapak / Üst alan**
   - Başlık (örn. “Sensör Telemetri Raporu”)
   - Seçilen sensör/grup açıklaması (model adları, seri, cihaz grubu vb.)
   - Rapor zaman aralığı (başlangıç–bitiş, timezone)
   - Oluşturulma tarihi, isteğe bağlı ARIOT/Beaver logosu

2. **Özet**
   - Toplam cihaz sayısı, toplam entity sayısı
   - Zaman aralığı özeti

3. **Tablo(lar)**
   - Entity bazlı: **entity key / görünen ad**, **birim**, **son değer**, **min**, **max**, **ortalama** (aggregate’den).
   - İsteğe bağlı: **cihaz adı**, **sensör modeli** sütunları.
   - Sayfalama: çok entity varsa birden fazla sayfa.

4. **İsteğe bağlı**
   - Kritik entity’ler için kısa **zaman serisi** özeti (ör. son N nokta) veya basit **çizgi grafik** (backend’de grafik kütüphanesi veya frontend’de grafik → görsel → PDF).
   - Alarm/uyarı geçmişi varsa, kısa bir “olay özeti” bölümü.

5. **Alt bilgi**
   - “ARIOT” / “Beaver IoT” notu, sayfa numarası, oluşturulma zamanı.

---

## 7. Kısıtlar ve Notlar

1. **Mevcut export:** Sadece CSV. PDF eklemek **yeni** bir geliştirmedir; mevcut CSV akışı bozulmadan eklenebilir.
2. **Backend modülü:** Entity export/entity history API’leri **beaver** ana uygulamasında (integrations dışında) yer alıyor olabilir. Bu repo içinde sadece `chirpstack-integration` görünüyor; PDF endpoint’inin ekleneceği **ana API modülü** ayrıca tespit edilmelidir.
3. **Performans:** Çok sayıda entity ve geniş tarih aralığında history/aggregate çağrıları ağır olabilir. Sayfalama, zaman aralığı sınırı veya örnekleme (ör. saatlik ortalama) düşünülmeli.
4. **Dil:** Rapor başlıkları ve etiketler için mevcut i18n (locale) yapısı kullanılabilir.
5. **İzinler:** Entity/device okuma izinleri ile uyumlu olmalı; PDF endpoint’i de aynı yetki kontrollerine tabi tutulmalıdır.

---

## 8. Sonuç

- **Taranan kaynaklar:** `beaver`, `beaver-iot-web`, `beaver-iot-docs-main`, `beaver-iot-docker`, `SensorDecoders-main` ve ilgili docs klasörleri.
- **Mevcut durum:** Telemetri verileri entity history ve aggregate API’leri ile erişilebilir; dışa aktarma şu an yalnızca **CSV**.
- **Sensör / sensör grubu:** Model (`ChirpstackSensorModelMapping`), seri (SensorDecoders), cihaz grubu ve tag ile tanımlanabilir.
- **PDF rapor:** **Yapılabilir.** Önerilen yol, **backend’de** filtre (sensör/model/grup/tarih) → entity/history/aggregate → PDF üretimi → blob döndürme; frontend’de “Rapor / PDF İndir” benzeri bir UI ile kullanıcıya sunmaktır.
- **Anlamlı içerik:** Kapak, özet, entity bazlı tablolar (son/min/max/ortalama), isteğe bağlı grafik veya olay özeti, alt bilgi ile tutarlı ve okunabilir bir PDF raporu elde edilebilir.

Bu rapor, geliştirme kararı ve tasarım için referans olarak kullanılabilir; **kod yazılmamıştır.**
