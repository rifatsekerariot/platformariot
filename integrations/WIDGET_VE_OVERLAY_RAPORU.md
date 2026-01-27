# Widget Geliştirme ve Overlay Özellikli Widget’lar Raporu

**Kaynaklar:** beaver-iot-docs-main (dashboard, frontend advance), beaver-iot-web (drawing-board, plugin yapısı), mevcut widget’lar.

**Amaç:** Var olan widget’lara nasıl farklı widget’lar eklenebileceği; overlay özellikli widget’ların eklenip eklenemeyeceği — yalnızca rapor, kod yok.

---

## 1. Mevcut Widget (Plugin) Yapısı

### 1.1 Klasör ve yapı

- **Konum:** `apps/web/src/components/drawing-board/plugin/plugins/`
- **Her plugin:** Kendi klasörü (`<plugin-adı>/`)
  - **control-panel/index.ts:** Tekil tip, isim, ikon, grid boyutları, config formu (configProps), isteğe bağlı view.
  - **view/index.tsx:** Dashboard’da görünen React bileşeni.
  - **configure/** (opsiyonel): Özel config formu; çoğu plugin sadece control-panel kullanır.
  - **icon:** `icon.svg` veya `icon.png`.

### 1.2 Plugin sınıfları (class)

Schema’da tanımlı `class` değerleri; “Add widget” ekranında **gruplama** için kullanılır:

| class        | Kullanım                           | Örnek widget’lar                          |
|--------------|------------------------------------|-------------------------------------------|
| `data_chart` | Grafik / istatistik görselleştirme | line-chart, bar-chart, pie-chart, gauge, progress, radar, area, horizon-bar, icon-remaining |
| `operate`    | Operasyonel (etkileşim, tetikleyici) | trigger, switch, device-list              |
| `data_card`  | Kart / bilgi gösterimi             | data-card, map, image, text               |
| `other`      | Diğer                              | Sınıf verilmeyenler buraya düşer          |

### 1.3 Mevcut widget tipleri

- **Grafik:** area-chart, bar-chart, line-chart, horizon-bar-chart, pie-chart, radar-chart, gauge-chart, progress, icon-remaining  
- **Kart / metin:** data-card, text, image  
- **Operasyonel:** trigger, switch, device-list  
- **Özel:** map (harita, cihaz konumları), alarm (alarm listesi)

### 1.4 Ortak özellikler

- **Grid yerleşimi:** Tüm widget’lar **react-grid-layout** ile grid hücrelerinde; sürükle-bırak, resize (min/max col/row).
- **fullscreenable:** Bazı plugin’lerde (map, line-chart, horizon-bar-chart, device-list) tanımlı; widget **tam ekran** moduna geçebiliyor. Bu, grid dışına çıkıp `position: fixed` ile tüm viewport’u kaplamak anlamında — yine **tek bir widget**ın büyütülmesi, “üstüne açılan overlay” değil.
- **Entity bağlantısı:** Config’te EntitySelect / MultiEntitySelect vb. ile entity seçilir; view tarafında entity değerleri okunur (ve gerekiyorsa yazılır).

---

## 2. Yeni / Farklı Widget’lar Nasıl Eklenir?

Docs ve mevcut yapıya göre adımlar **kavramsal** olarak şöyle:

1. **Yeni plugin klasörü:** `plugins/<yeni-ad>/` (örn. `chirpstack-stats`, `rssi-snr-card`).
2. **control-panel/index.ts:**
   - `type`: Benzersiz string (plugin ID).
   - `name`: UI’da görünen isim.
   - `class`: `data_chart` | `operate` | `data_card` | `other` — “Add widget” gruplaması.
   - `icon`, `defaultCol/Row`, `minCol/Row`, `maxCol/Row`.
   - `configProps`: Form alanları (entity seçimi, başlık, renk, vb.).
   - İsteğe bağlı `view` (declarative view config) veya sadece `view/index.tsx` ile tam özel React.
3. **view/index.tsx:** Dashboard’da render edilen bileşen; entity dinleme, API çağrıları burada.
4. **configure/** (opsiyonel): Sadece control-panel yeterli değilse, tamamen özel config formu.

Mevcut **plugin index** (`plugins/index.ts`) `import.meta.glob` ile `plugins/*/view/index.tsx` ve `configure/index.tsx` dosyalarını otomatik topluyor; yeni klasör eklenince **ek kayıt gerekmez**, sadece klasör yapısına uymak yeterli.

---

## 3. Eklenebilecek Farklı Widget Fikirleri

Aşağıdakiler, **mevcut grid + entity** modeliyle uyumlu, “farklı” widget örnekleri:

| Widget fikri            | class       | Kısa açıklama                                                                 |
|-------------------------|------------|-------------------------------------------------------------------------------|
| **ChirpStack özet kartı** | `data_card` | Seçilen ChirpStack cihazları için son uplink zamanı, RSSI/SNR ort., online sayısı. |
| **RSSI/SNR göstergesi** | `data_chart`| Tek cihaz için RSSI/SNR geçmişi (minik çizgi/bar); entity’den okunan değerler.   |
| **LoRa durum kartı**    | `data_card` | DevEui, fPort, frame sayısı vb. özet bilgi; ilgili entity’lere bağlı.          |
| **Uplink zaman çizelgesi** | `data_chart` | Son N uplink’in zamanı; entity event’leri veya property geçmişi kullanılabilir. |
| **Telemetri özeti**     | `data_card` | Temperature, humidity, co2 vb. için “son değer” özeti; mevcut property entity’leri. |
| **Alarm / eşik widget’ı** | `operate`  | Belirli entity eşiğe göre uyarı gösterimi; mevcut alarm plugin’ine benzer ama daha basit. |
| **Hızlı trigger**       | `operate`  | Tek tıkla service çağrısı; trigger’a benzer, ChirpStack / downlink odaklı.     |
| **Tablo (entity tabanlı)** | `data_card` | Seçilen entity’ler için basit tablo; device-list’e benzer, entity odaklı.   |

Bunların hepsi **grid içinde** normal widget olarak çalışır; entity seçimi, config formu ve view bileşeni mevcut plugin mimarisiyle uyumludur.

---

## 4. Overlay Özellikli Widget’lar

### 4.1 “Overlay” ile ne kastedilebilir?

- **A)** Grid’in **üzerinde**, sabit konumda (örn. köşede) duran, sayfayı bloke etmeden bilgi gösteren **floating** widget (ör. küçük bildirim paneli, minigram).
- **B)** Belirli bir widget’ın **üzerine** açılan katman (ör. chart’a tıklayınca detay popup).
- **C)** **Tam ekran** modu (mevcut `fullscreenable`): Widget’ın kendisi fullscreen olur.

Bu raporda **overlay**, çoğunlukla **(A)** anlamında: dashboard grid’inin **üzerinde**, ayrı bir katmanda çizilen, konumu grid hücrelerine bağlı olmayan widget’lar.

### 4.2 Mevcut durum

- Tüm widget’lar **react-grid-layout** ile **grid hücrelerine** bağlı. Overlay için ayrı bir “widget tipi” veya “render katmanı” **yok**.
- **fullscreen:** Sadece mevcut bir grid widget’ının `position: fixed` ile büyütülmesi; grid dışına taşan **yeni bir overlay katmanı** değil.
- **İç overlay’lar:** Sadece **widget içinde** (map’te device-popup, image’ta label overlay). Bunlar widget’ın kendi DOM’u; dashboard seviyesinde overlay sayılmıyor.
- **Tablo “overlay”:** `NoDataOverlay` / `NoResultsOverlay` yalnızca tablo bileşeninde boş veri durumu; dashboard widget modeli değil.

Özet: **Dashboard seviyesinde, grid dışı overlay widget’lar** şu an **tanımlı değil** ve **desteklenmiyor**.

### 4.3 Overlay widget’lar eklenebilir mi?

**Kavramsal olarak evet**, fakat **mimari değişiklik** gerekir. Mevcut docs ve kod buna **hazır** değil.

**Gerekebilecekler:**

1. **Yeni plugin sınıfı veya işaretleyici**  
   - Örn. `class: 'overlay'` veya `renderMode: 'overlay'`.  
   - Schema’daki `class` enum’una `overlay` eklenmeli (veya eşdeğer bir alan).

2. **Ayrı render yolu**  
   - Overlay plugin’ler **react-grid-layout**’a **eklenmemeli**.  
   - Ayrı bir **overlay katmanı** (ör. `position: fixed` container, `z-index` ile grid’in üstünde) tanımlanıp overlay plugin’ler orada render edilmeli.  
   - Gerekirse React **Portal** ile dashboard dışındaki bir DOM node’a çizim.

3. **Layout / konum modeli**  
   - Grid’de `col/row` yerine overlay’a özel alanlar:  
     - Konum: `top-left | top-right | bottom-left | bottom-right | center` vb.  
     - Offset (px veya %), genişlik/yükseklik,  
     - Varsayılan açık/kapalı, minimize edilebilir olma.

4. **Config ve state**  
   - Control-panel’de overlay’a özel alanlar (konum, boyut, “varsayılan açık” vb.).  
   - Dashboard layout’unda overlay plugin’lerin konumunu saklayacak **ayrı state** (grid `layouts`’tan bağımsız).

5. **Etkileşim**  
   - Overlay’ın kapatılması, küçültülmesi, sürüklenmesi (opsiyonel).  
   - Grid’deki “edit widget / resize” mantığı overlay için **uyarlanmalı** veya **yeniden** tasarlanmalı.

6. **Kaynak / dokümantasyon**  
   - `drawing-board` ve `plugin` dokümantasyonuna overlay widget tipinin nasıl ekleneceği, yeni config alanları ve render akışı eklenmeli.

**Risk / zorluklar:**

- Grid ve overlay’ın **aynı anda** düzenlenmesi (drag, resize) karmaşıklaşır.  
- Responsive ve mobil davranış overlay için **ayrıca** düşünülmeli.  
- Mevcut **Dashboard API** (widget CRUD, layout) overlay’ı kapsamıyorsa backend tarafında da **genişletme** gerekebilir.

### 4.4 Overlay’a yakın, mimari değişiklik gerektirmeyen seçenekler

- **Mevcut fullscreen:** Widget’ı tam ekran yapmak; “büyük tek widget” hissi. Overlay değil, ama ek alan kaplar.  
- **Widget içi popup / overlay:** Map’teki device-popup gibi, **belirli bir widget’ın içinde** overlay benzeri UI. Yeni overlay **widget** tipi açmadan, mevcut data_card / data_chart plugin’lerinde popup/drawer eklenebilir.  
- **Trigger + modal:** Trigger ile bir service çağrılır, cevap **Modal** ile gösterilir. Modal sayfa seviyesinde overlay olur ama “widget” olarak grid’de trigger vardır; tam anlamıyla overlay widget sayılmaz.

Bunlar, **overlay widget** mimarisi olmadan da kısmen “overlay benzeri” deneyim sunar.

---

## 5. Özet ve Öneriler

### 5.1 Farklı widget’lar

- **Evet, eklenebilir.**  
- Yapılacaklar: `plugins/<yeni-ad>/` altında **control-panel** + **view** (ve gerekirse configure); `class` ile uygun gruba almak.  
- ChirpStack / LoRa odaklı özet kartı, RSSI/SNR grafiği, telemetri özeti, alarm/trigger türevleri vb. **mevcut grid + entity** modeliyle uyumlu.

### 5.2 Overlay özellikli widget’lar

- **Şu anki mimaride yok;** grid dışı, floating overlay widget **desteklenmiyor**.  
- **Eklenebilir** ancak **yeni bir overlay katmanı**, **konum/boyut modeli** ve **config/state** genişletmesi gerekir; sadece “yeni plugin klasörü” yetmez.  
- Daha az maliyetli alternatifler: **fullscreen** kullanmak, **widget içi popup/overlay** (map örneği), **trigger + modal** gibi sayfa seviyesi bileşenler.

### 5.3 Dokümanlarla ilişki

- **beaver-iot-docs-main**, dashboard plugin yapısını, `control-panel` config’ini ve `class` / `configProps` / `view` kullanımını anlatıyor.  
- Yeni **grid widget’ları** bu docs’a uygun eklenebilir.  
- **Overlay widget** için ise hem frontend hem (gerekiyorsa) backend tarafında genişletme tasarlanıp, **ayrıca** dokümante edilmeli.

---

*Bu rapor, mevcut doküman ve koda dayalı analizdir; kod yazılmamıştır.*
