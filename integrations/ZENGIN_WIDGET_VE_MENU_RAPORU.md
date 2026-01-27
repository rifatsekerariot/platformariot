# ThingsBoard Benzeri Zengin Widget Desteği ve Alarm/Menu Raporu

**Kapsam:** Overlay yok; mevcut kodu bozmadan. Görselleştirme zenginliği, ThingsBoard tarzı widget genişletmesi, alarm vb. için menü oluşturma — yalnızca rapor, kod yok.

**Kaynaklar:** beaver-iot-docs-main, beaver-iot-web (drawing-board, plugin, routes, layout), ThingsBoard widget docs.

---

## 1. Özet

| Konu | Sonuç |
|------|--------|
| **Zengin widget desteği** | **Evet.** Yeni plugin klasörleri ekleyerek ThingsBoard’a benzer widget’lar eklenebilir; mevcut plugin yapısı ve grid değişmeden kalır. |
| **Görselleştirme zenginliği** | **Evet.** Mevcut chart/widget’lara config genişletmesi (renk, eşik, legend, vb.) ve yeni görsel widget tipleri ile artırılabilir. |
| **Alarm vb. için menü** | **Mümkün.** Sidebar, route tabanlı; yeni sayfa + route eklenirse menüde yer alır. **Gerekli mi?** İhtiyaca göre; alarm şu an sadece dashboard widget’ı. |

---

## 2. ThingsBoard Benzeri Zengin Widget Desteği (Mevcut Kodu Bozmadan)

### 2.1 Nasıl eklenir?

- **Yeni widget = yeni plugin klasörü**  
  `apps/web/src/components/drawing-board/plugin/plugins/<yeni-ad>/`  
  - `control-panel/index.ts` (type, name, class, configProps, grid boyutları)  
  - `view/index.tsx` (dashboard’da render)  
  - İsteğe bağlı `configure/`, `icon.svg`

- **Mevcut yapıya dokunulmaz:**  
  - `plugins/index.ts` dosyası `import.meta.glob` ile `plugins/*/view/index.tsx` ve `configure/index.tsx` topluyor.  
  - Yeni klasör eklendiğinde otomatik algılanır; `plugins/index.ts` veya schema’da manuel kayıt **gerekmez**.  
  - Grid, render, control-panel mantığı aynen kalır.

### 2.2 ThingsBoard vs Beaver — Widget Karşılaştırması

| ThingsBoard (örnekler) | Beaver (mevcut) | Eklenebilir mi? |
|------------------------|-----------------|------------------|
| **Charts:** Time series (line, bar, state), latest (radar, polar, pie, doughnut, bars) | line, bar, area, horizon-bar, pie, radar, gauge, progress, icon-remaining | **Evet.** State chart, polar area, doughnut, “bars” (latest values) yeni plugin olarak. |
| **Gauges:** Analog, digital | gauge-chart (analog benzeri) | **Evet.** Digital gauge (büyük sayı, birim) ayrı plugin. |
| **Cards / Tables** | data-card, device-list | **Evet.** Entity tabanlı tablo, alarm tablosu, markdown/HTML kart. |
| **Alarm widgets** | alarm (cihaz bazlı liste) | **Evet.** Alarm sayacı, kompakt alarm kartı vb. ek plugin’ler. |
| **Control / RPC, Buttons** | trigger, switch | **Evet.** Buton grid’i, hızlı aksiyon widget’ı. |
| **Maps** | map | Var. Geliştirilebilir (rota, geçmiş). |
| **Count widgets** | — | **Evet.** Alarm sayısı, cihaz sayısı, entity sayısı. |
| **Status:** Battery, signal, progress | progress, icon-remaining | **Evet.** Sinyal gücü (RSSI), batarya odaklı küçük widget’lar. |
| **Date / Time window** | chart-time-select (grafik config’inde) | **Evet.** Dashboard seviyesi tarih aralığı widget’ı (isteğe bağlı). |
| **HTML / Markdown card** | text, image | **Evet.** Markdown/HTML card (entity’den veya statik). |
| **Navigation** | — | **Evet.** Dashboard’a link butonları, “home” yönlendirme. |

Bunların hepsi **grid içi** widget; overlay veya mimari değişiklik gerekmez.

### 2.3 Mevcut config bileşenleri (control-panel’de kullanılabilir)

Plugin `components` altında hazır olanlar:

- **EntitySelect**, **MultiEntitySelect** — entity seçimi  
- **MultiDeviceSelect** — cihaz seçimi (alarm, map, device-list vb.)  
- **ChartMetricsSelect**, **ChartTimeSelect** — grafik metrikleri, zaman aralığı  
- **ChartEntityPosition** — grafikte entity konumu  
- **IconSelect**, **IconColorSelect**, **AppearanceIcon**, **MultiAppearanceIcon**  
- **Input**, **Select**, **Switch**, **Upload**  
- **AlarmTimeSelect** — alarm varsayılan süresi  

Yeni widget’larda `configProps` içinde bunlar kullanılabilir; ek geliştirme çoğunlukla **view** ve **config şeması** ile sınırlı kalır.

### 2.4 Önerilen yeni widget grupları (öncelik sırasıyla)

1. **Görselleştirme:**  
   State chart, polar area, doughnut, digital gauge, “latest values” bars.

2. **Kart / tablo:**  
   Entity tablosu, alarm sayacı, alarm özet kartı, markdown/HTML kart.

3. **Kontrol / sayı:**  
   Buton grid’i, count widget’ları (alarm/cihaz/entity sayısı).

4. **Durum:**  
   RSSI/sinyal, batarya odaklı mini widget’lar.

5. **Yardımcı:**  
   Tarih aralığı seçici, dashboard navigasyon widget’ı.

Hepsi mevcut `class` (data_chart, operate, data_card, other) ve `configProps` yapısına uyumlu.

---

## 3. Görselleştirme Tarafında Daha Zengin Olması

### 3.1 Mevcut imkânlar

- **Grid:** react-grid-layout; sürükle-bırak, resize.  
- **fullscreenable:** Bazı widget’larda tam ekran.  
- **Config:** control-panel formları (configProps), visibility, entity/cihaz seçimi.  
- **View:** Tamamen özel React (view/index.tsx); chart kütüphanesi serbest.

### 3.2 Neler yapılabilir? (Mevcut kodu bozmadan)

| Alan | Ne yapılır? | Kodu bozar mı? |
|------|-------------|-----------------|
| **Yeni chart tipleri** | State, polar, doughnut, “bars” vb. yeni plugin. Farklı chart kütüphanesi kullanılabilir (ECharts, Chart.js, vb.). | Hayır. |
| **Mevcut chart’lara config** | Renk, eşik (threshold), legend, grid, eksen formatı, tooltip formatı vb. `configProps` ile ek alanlar. | Hayır; sadece ilgili plugin’e ek config. |
| **Tema / stil** | `themes` (default/dark) zaten view config’de var. Yeni widget’larda renk paleti, font seçimi eklenebilir. | Hayır. |
| **Gauge / progress çeşitleri** | Yarı daire gauge, geniş sayısal gösterge, “liquid level” benzeri doluluk çubukları. | Hayır; yeni plugin. |
| **Harita** | Mevcut map plugin’e rota, geçmiş, farklı marker stilleri. | Dikkatli genişletme; mevcut davranış korunursa kırılmaz. |

### 3.3 ThingsBoard’daki “advanced” ayarların karşılıkları

ThingsBoard chart’larda: stacking, grid renkleri, axis ayarları, ticks formatter, tooltip formatter, comparison (önceki dönem), custom legend.  

Beaver tarafında:

- **configProps** ile benzer alanlar eklenebilir (ör. ChartMetricsSelect, Input, Select, Switch).  
- **view** tarafında bu config’e göre chart kütüphanesi ayarlanır.  
- Bunlar **yeni veya mevcut plugin’lerde** config genişletmesi; çekirdek plugin altyapısını değiştirmez.

### 3.4 Kısa özet

- Görselleştirme zenginliği **yeni widget’lar** ve **mevcut widget’lara config eklenmesi** ile artırılabilir.  
- Overlay veya grid mimarisi değişmeden, sadece plugin sayısı ve config alanları artar.

---

## 4. Alarm ve Benzeri için Menü Oluşturma

### 4.1 Mevcut durum

- **Alarm:** Sadece **dashboard widget’ı**. Dashboard’a “Alarm” plugin’i eklenir; cihaz seçilir, alarm listesi o widget içinde gösterilir.  
- **Menü (sidebar):** **Route** tabanlı. `routes.tsx` içindeki her route’un `handle`: `title`, `icon`, `permissions`, `layout`, `hideInMenuBar`, `hideSidebar` vb. alanları var.  
- **BasicLayout:** Route listesinden “menüs” üretir; **Sidebar** bu menüleri kullanır.  
- **Backend:** `getUserAllMenus`, `getRoleAllMenus`, `associate-menu` ile **rol bazlı yetkilendirme** (hangi menü/fonksiyon görünsün) yönetilir. Menü **yapısı** route’dan, **görünürlük** yetkiden gelir.

### 4.2 Alarm (veya benzeri) için menü eklenebilir mi?

**Evet.** Örneğin:

1. **Yeni route:** `/alarm` (veya `/alarms`).  
2. **Yeni sayfa:** “Alarm listesi” — tüm cihazlar / seçili cihazlar, filtreler, tarih aralığı.  
3. **handle:** `title`, `icon`, `permissions` (örn. `PERMISSIONS.ALARM_MODULE` benzeri bir sabit, backend’de karşılığı varsa).  
4. Bu route, BasicLayout’un ürettiği menüye girer; izin varsa sidebar’da **“Alarm”** (veya verilen ad) görünür.

Aynı mantık **Logs**, **Events**, **Raporlar** vb. için de kullanılabilir: route + sayfa + permission.

### 4.3 Gerekli mi?

| Yaklaşım | Artı | Eksi |
|----------|------|------|
| **Sadece dashboard widget’ı (şu anki)** | Basit; alarm zaten dashboard’da. | Her dashboard için ayrı alarm widget’ı; merkezi “tüm alarmlar” ekranı yok. |
| **Ayrı Alarm menüsü + sayfa** | Tek yerden tüm alarmlar, filtreleme, önceliklendirme, (ileride) bildirim merkezi. | Yeni sayfa, belki yeni API; geliştirme ve bakım maliyeti. |

**Öneri:**  
- **Kısa vadede** zorunlu değil; mevcut alarm widget’ı birçok senaryo için yeterli.  
- **Uzun vadede** merkezi alarm yönetimi, operatör ekranı veya “alarm merkezi” isteniyorsa, **Alarm menü + sayfa** mantıklı. Menü altyapısı (route + permissions) buna uygun.

### 4.4 Menü tarafında yapılacaklar (Alarm sayfası açılırsa)

1. **Route:** `routes.tsx` içine `/alarm` (veya benzeri) eklemek.  
2. **Permission:** Yeni bir `PERMISSIONS.ALARM_MODULE` (veya mevcut bir modüle bağlama); backend `menus` / rol yetkisi ile eşleştirmek.  
3. **Sayfa:** Alarm listesi, filtreler, (opsiyonel) dashboard’daki alarm widget’ı ile aynı veya benzer veri kaynağını kullanacak şekilde tasarlamak.

Overlay veya mevcut widget/menu mimarisini değiştirmeye gerek yok.

---

## 5. Kısıtlar ve Dikkat Edilecekler

### 5.1 Widget tarafı

- **Schema `class` enum:** `data_chart` | `operate` | `data_card` | `other`. Yeni “sınıf” gerekirse schema güncellenir; mevcut plugin’ler etkilenmez.  
- **Backend Dashboard API:** Widget CRUD, layout kaydetme mevcut. Yeni widget `type` değerleri eklenince backend’in kabul etmesi gerekir; çoğu tasarımda `type` serbest string olduğu için sorun çıkmaz, ancak doğrulanmalı.  
- **Entity / cihaz verisi:** Yeni widget’lar mevcut EntitySelect, MultiDeviceSelect, entity/cihaz API’leri ile beslenir; ek entegrasyon gerekebilir.

### 5.2 Menü / sayfa tarafı

- **Alarm listesi sayfası** için alarm verisi nereden gelecek?  
  - Şu an alarm widget’ı cihaz/entity ve muhtemelen event/API ile çalışıyor.  
  - Merkezi alarm sayfası için bir **alarm/event API** (liste, filtre, sayfalama) gerekebilir. Backend’de varsa sadece frontend sayfası eklenir; yoksa API tasarımı yapılmalı.

### 5.3 ThingsBoard’da olup Beaver’da farklı olanlar

- **Widget Library sayfası:** ThingsBoard’da widget’lar ayrı bir “Widgets Library” sayfasında yönetiliyor; Beaver’da widget’lar doğrudan dashboard “Add widget” içinde plugin listesinden geliyor. Ayrı bir “widget kütüphanesi” sayfası **isteğe bağlı** genişletme; mevcut akışı bozmaz.  
- **Alarm kavramı:** ThingsBoard’da rule engine, alarm tipleri, severity vb. var. Beaver’da alarm daha çok **cihaz/entity odaklı** bir liste. “ThingsBoard benzeri” alarm deneyimi için rule engine / alarm modeli ayrıca değerlendirilir; bu rapor **sadece UI/menü/widget** ile sınırlı.

---

## 6. Özet Tablo

| Hedef | Yapılabilir mi? | Mevcut kodu bozar mı? | Not |
|-------|------------------|------------------------|-----|
| ThingsBoard benzeri zengin widget’lar | Evet | Hayır | Yeni plugin klasörleri; grid ve render aynı. |
| Görselleştirme zenginliği | Evet | Hayır | Yeni chart/widget tipleri + configProps genişletmesi. |
| Alarm (veya benzeri) için menü | Evet | Hayır | Yeni route + sayfa + permission. |
| Overlay widget | Bu rapor kapsamı dışı | — | İstenmedi. |

---

*Bu rapor, mevcut doküman ve koda dayalı analizdir; kod yazılmamıştır.*
