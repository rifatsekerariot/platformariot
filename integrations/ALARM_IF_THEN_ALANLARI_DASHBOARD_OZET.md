# Dashboard Altında Cihaz Bazlı / Toplu if-then Alarm Alanları — Kısa Özet

**Tarih:** 2026-01-27  
**Referans:** ALARM_MANTIGI_VE_MIMARI_ONERI_RAPORU.md

**Soru:** Dashboard altında, tanımlı cihazlar için **ayrı ayrı** veya **topluca** if-then alarmları üretebileceğimiz alanlar tasarlanabilir mi? Yolu nedir?

---

## 1. Kısa Cevap

**Evet, tasarlanabilir.** Hem cihaz bazlı hem toplu if-then alarm tanımı için uygun alanlar ve akışlar tanımlanabilir. Bunu yapmanın **üç pratik yolu** var; “Dashboard altında” konumu isteğe göre farklı şekillerde yorumlanabilir.

---

## 2. Mevcut Durum (Özet)

- **Workflow** (`/workflow`): If-then mantığı **burada**. Entity Listener (hangi entity değişince) + IF/ELSE (koşul) + Email/Webhook. Yapı **Dashboard’un altında değil**; ayrı menü, graf tabanlı editör.
- **Dashboard:** Drawing board + widget’lar (alarm listesi, grafik, vb.). Alarm **widget’ı** sadece listeyi gösterir; **kural tanımlama** alanı yok.
- **Rapor önerisi:** Workflow’a **“Raise Alarm”** node’u eklenmeli; böylece IF/ELSE sağlandığında hem bildirim hem **alarm tablosu/widget** için kayıt oluşur.

---

## 3. Yol 1: Workflow’u Kullanmak (Mevcut Yapı + Raise Alarm)

**Nerede:** **Workflow** sayfası (`/workflow`), **Dashboard’un altında değil**.

**Nasıl:**
- **Entity Listener** → dinlenecek **entity** seçilir (tek entity, pattern veya çoklu). Cihaz seçimi entity üzerinden (her entity bir cihaza ait).
- **IF/ELSE** → koşul: entity değeri `>`, `<`, `==`, `between` vb.
- **Raise Alarm** (yeni node) + isteğe bağlı **Email / Webhook**.

**Ayrı ayrı / topluca:**
- **Tek cihaz:** Entity Listener’da o cihazın entity’leri seçilir.
- **Topluca:** Entity Listener’da **key pattern** (örn. `*.device.*.temperature`) veya **çoklu entity**; IF/ELSE veya Code ile cihaz/entity ayrımı yapılabilir.

**Alanlar:** Graf (node bağlantıları) ve her node’un config paneli. Form tarzı “cihaz + entity + koşul + aksiyon” alanları **yok**; esnek ama daha teknik.

**Özet:** If-then alarm **tanımlanabilir**; arayüz **Workflow**’da, **Dashboard altında değil**. Raise Alarm node’u eklendikten sonra alarm listesi de beslenir.

---

## 4. Yol 2: Dashboard’a “Alarm Kuralları” Alanları Eklemek

**Nerede:** **Dashboard** bağlamında:
- **A)** Bir dashboard’un **içinde**: sekme / panel / “Alarm kuralları” widget’ı (örn. drawing-board üstünde veya yanında).
- **B)** **“Bu dashboard’taki cihazlar”** filtresiyle çalışan ayrı bir **“Alarm kuralları”** sayfası; menüde Dashboard’un altında veya yakınında.

**Tasarılabilecek alanlar (form tarzı):**

| Alan | Açıklama | Ayrı ayrı / topluca |
|------|----------|----------------------|
| **Cihaz(lar)** | Tekil seçim veya çoklu seçim / “Bu dashboard’taki tüm cihazlar” / “Tüm cihazlar” | Tek = ayrı ayrı; çoklu / “hepsi” = topluca |
| **Entity** | Cihaza göre değişen entity listesi; tek seçim. Topluca için: “Seçili cihazlarda ortak entity” (örn. `temperature`) veya cihaz başına ayrı entity (daha karmaşık) | Topluca: aynı entity adı/identifier’ı olanlar |
| **Koşul (if)** | `[Entity] [op] [değer]`: `>`, `<`, `>=`, `<=`, `==`, `!=`, `between`, `boş değil` vb. | Aynı koşul tüm seçili cihazlar için |
| **Aksiyon (then)** | “Alarm oluştur” (Raise Alarm) + isteğe bağlı “Email gönder”, “Webhook gönder” | |

**Arka planda iki seçenek:**
- **2a) Workflow üretimi:** Her kural (veya cihaz grupları) için otomatik **Workflow** (Entity Listener + IF/ELSE + Raise Alarm + Email/Webhook) oluşturulur. Kullanıcı basit form doldurur; karmaşıklık backend’de.
- **2b) Ayrı kural tablosu:** `alarm_rule` (cihaz, entity_key, koşul, aksiyon). Backend’de **kural motoru** (Workflow’dan bağımsız, event/entity değişimine abone) bu kuralları değerlendirir; sağlanırsa Raise Alarm + bildirim. Workflow’u kullanmaz; yeni bileşen gerekir.

**Özet:** **Evet, Dashboard (veya Dashboard’la ilişkili) bir yerde**, cihaz/entity/koşul/aksiyon için **form alanları** tasarlanabilir. Ayrı ayrı = tek cihaz; topluca = çoklu cihaz veya “dashboard’taki cihazlar”. Arka planda ya Workflow üretilir ya da ayrı kural motoru kullanılır.

---

## 5. Yol 3: Cihaz Detay / Device Sayfası

**Nerede:** **Cihaz detay** sayfası (veya Device Canvas) içinde **“Bu cihaz için alarm kuralı”** bölümü.

**Alanlar:** Cihaz sabit (o sayfadaki cihaz); **Entity** (o cihazın entity’leri), **Koşul (if)**, **Aksiyon (then)**. Sadece **cihaz bazlı**; topluca için “Bu kuralı şu cihazlara kopyala” veya “Aynı kuralı N cihaza uygula” gibi bir adım eklenebilir.

**Özet:** **Ayrı ayrı** if-then için uygun. **Topluca** için ek akış (kopyala / “uygula”) gerekir.

---

## 6. Karşılaştırma ve Öneri

| Yol | Konum | Ayrı ayrı | Topluca | Ek geliştirme |
|-----|--------|-----------|---------|----------------|
| **1) Workflow** | Workflow sayfası | ✅ Entity seçimi ile | ✅ Pattern / çoklu entity | Raise Alarm node |
| **2) Dashboard’a alanlar** | Dashboard içi veya “Dashboard cihazları” ile ilişkili sayfa | ✅ Cihaz tekil seçim | ✅ Çoklu / “hepsi” seçim | Form + Workflow üretimi **veya** kural tablosu + kural motoru |
| **3) Cihaz detay** | Cihaz sayfası | ✅ Doğal | ⚠️ “Kopyala / uygula” ile | Form + arka plan (Workflow veya kural) |

**Öneri (rapora göre):**
- **Hızlı ve raporla uyumlu:** **Yol 1.** Workflow’da Entity Listener + IF/ELSE + **Raise Alarm**. Topluca: entity pattern veya çoklu entity. Arayüz Dashboard altında olmaz; **Workflow**’da kalır.
- **Dashboard’ta form hissi:** **Yol 2.** Dashboard’a (veya Dashboard’la ilişkili) **“Alarm kuralları”** alanları: cihaz (tek/çoklu), entity, koşul, aksiyon. Arka planda **Workflow üretimi** (2a) mevcut Workflow + Raise Alarm ile uyumlu; **ayrı kural motoru** (2b) daha serbest ama yeni backend işi.

---

## 7. “Dashboard Altında” İfadesi

- **Dar yorum:** Sadece **Dashboard sayfasının** bir bölümü (sekme, panel, widget) → **Yol 2A** veya **2B** ile “Alarm kuralları” alanları eklenebilir; isteğe göre “sadece bu dashboard’taki cihazlar” filtresi.
- **Geniş yorum:** “Dashboard’la ilişkili / aynı bağlamda” → Workflow’da tanımlanan kuralların **dashboard’taki cihazlarla** ilişkilendirilmesi (ör. Entity Listener’da “bu dashboard’taki cihazların entity’leri” seçeneği) de bir çözüm; bu durumda ifade “Dashboard bağlamında” olur, alanlar yine Workflow’da.

---

## 8. Kısa Özet

- **Evet,** dashboard (veya dashboard bağlamında) tanımlı cihazlar için **ayrı ayrı** veya **topluca** if-then alarm üretebileceğimiz **alanlar tasarlanabilir.**
- **Yol 1:** Workflow’da Entity Listener + IF/ELSE + Raise Alarm. Konum: **Workflow**; ayrı/toplu: entity/pattern ile.
- **Yol 2:** **Dashboard’a (veya Dashboard’la ilişkili)** “Alarm kuralları” formu: **cihaz** (tek/çoklu), **entity**, **koşul (if)**, **aksiyon (then)**. Arka plan: otomatik Workflow **veya** ayrı kural tablosu + kural motoru.
- **Yol 3:** Cihaz detayda “Bu cihaz için kural”; topluca için “kopyala/uygula” eklenir.

Raporun önerdiği **Raise Alarm** ve **Workflow** merkezli model, **Yol 1**’i doğrudan destekler; **Yol 2** ile kullanıcı Dashboard’ta form doldurur, sistem bunu Workflow’a (veya kural motoruna) çevirir.

---

*Kod yazılmamıştır; yalnızca alan tasarımı ve yollar özetlenmiştir.*
