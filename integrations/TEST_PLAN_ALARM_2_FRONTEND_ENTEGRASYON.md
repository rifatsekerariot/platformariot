# Test Planı 2 — Alarm Sayfası (Frontend) ve Entegrasyon

**Kapsam:** `/alarm` sayfası, Alarm listesi / Alarm kuralları sekmeleri, alarm widget’ta “Kuralları yönet” linki, alarm widget’ın aynı API ile çalışması.  
**Ortam:** Lokal Docker, PostgreSQL; Backend Alarm API (Faz 1) ve Frontend Alarm sayfası implemente edilmiş olmalı.

---

## 1. Hazırlık

### 1.1 Ortam

- `beaver-iot-docker` + `chirpstack-prebuilt-postgres.yaml` (veya projenin kullandığı Postgres’li compose).
- **Backend:** `POST /alarms/search`, `GET /alarms/export`, `POST /alarms/claim` 200 dönüyor (Test Planı 1 geçmiş olmalı).
- **Frontend:** `/alarm` route’u, Alarm listesi sekmesi, Alarm kuralları sekmesi (Faz 1’de placeholder), alarm widget’ta “Kuralları yönet” linki.
- Tarayıcı: `http://localhost:9080` (veya compose’taki port).

### 1.2 Veri

- En az **1 cihaz**; **t_alarm**’da o cihaz için **en az 2 alarm** (Test Planı 1’deki seed ile).  
- Giriş yapılmış kullanıcı; Alarm menüsüne erişim izni (PERMISSIONS.ALARM_MODULE veya geçici DEVICE_VIEW).

---

## 2. Menü ve Route

### 2.1 Ana panelde “Alarm” menüsü

- **Adım:** Sidebar’da “Alarm” (veya i18n’deki karşılığı) görünüyor mu?
- **Beklenti:** Evet; tıklanınca `/alarm`’a gidiyor.

### 2.2 `/alarm` sayfası

- **Adım:** `http://localhost:9080/alarm` (veya base + `/alarm`) aç.
- **Beklenti:** 200; sayfa yüklenir, 404 değil. Giriş yoksa login’e yönlendirme yapılabilir.

---

## 3. Sekmeler: Alarm listesi | Alarm kuralları

### 3.1 “Alarm listesi” sekmesi

- **Adım:** Varsayılan veya “Alarm listesi” sekmesine tıkla.
- **Beklenti:**
  - Tablo veya liste görünür (en az kolonlar: cihaz adı, alarm zamanı, içerik, durum, claim butonu).
  - Cihaz seçimi (MultiDeviceSelect veya benzeri), tarih aralığı, durum filtresi, arama alanı vb. plana uygunsa görünür.
  - Seed’lenen 2 alarm burada listelenir (cihaz seçiliyse veya “tümü” ise). Sadece 200 değil, **içerik** kontrol edilir.

### 3.2 Listede davranış

- **Filtre:** Cihaz seç → liste o cihaza göre güncellenir. Tarih aralığı daralt → uygun alarmlar kalır.
- **Claim:** Bir satırdaki “Claim” (veya eşdeğeri) tıkla. Beklenti: İstek 200; liste yenilenir veya satır “claimed” olarak işaretlenir. (Backend’de `device_id` ile toplu claim ise, o cihazın tüm aktifleri claimed olur.)
- **Export:** “Dışa aktar” / “Export” butonu. Beklenti: CSV indirilir; en az 2 alarm satırı (başlık + veri) içerir.

### 3.3 “Alarm kuralları” sekmesi (Faz 1)

- **Adım:** “Alarm kuralları” sekmesine tıkla.
- **Beklenti:** Placeholder: “Yakında” veya benzeri mesaj; veya basit “Kural ekle” + boş liste. Faz 2’de form ve CRUD testleri eklenir.

---

## 4. Alarm widget’ta “Kuralları yönet” linki

### 4.1 Dashboard’ta alarm widget

- **Adım:** Bir dashboard’a Alarm widget’ı ekle (cihaz seçerek). “Add widget” listesinde Alarm görünüyorsa ekle; `useFilterPlugins` ile filtrelenmişse, önce o filtreyi kaldırmanız veya doğrudan canvas’a ekleme yolu gerekebilir. (Mevcut davranışa göre ilerleyin.)
- **Beklenti:** Widget yüklenir; alarm listesi (veya boş durum) görünür.

### 4.2 “Kuralları yönet” linki

- **Adım:** Widget içinde “Kuralları yönet” (veya i18n’deki karşılığı) linki var mı? Varsa tıkla.
- **Beklenti:** `/alarm` veya `/alarm?tab=rules`’a gider. Alarm sayfası açılır; Kurallar sekmesine otomatik geçiş plana dahilse, o da kontrol edilir.

---

## 5. Alarm widget’ın API ile çalışması

- **Amaç:** Alarm widget, `deviceAPI.getDeviceAlarms`, `exportDeviceAlarms`, `claimDeviceAlarm` ile çalışıyor; aynı backend’i kullanıyor. Alarm sayfası ile uyum.

### 5.1 Widget’ta liste

- Widget’ta cihaz seçili; tarih aralığı uygun.
- **Beklenti:** Seed’lenen 2 alarm (veya o cihaza ait diğerleri) listede görünür. Sayfa ile aynı veri kaynağı ( `/alarms/search` ).

### 5.2 Widget’ta claim

- **Adım:** Widget’ta bir alarm için “Claim” tıkla.
- **Beklenti:** İstek 200; widget listesi güncellenir (claimed işareti veya listeden düşme, tasarıma göre).

### 5.3 Widget’ta export

- **Adım:** Widget’taki “Export” / dışa aktar.
- **Beklenti:** CSV indirilir; içerik `GET /alarms/export` ile uyumlu.

---

## 6. Hata ve kenar durumları

### 6.1 Backend erişilemez veya 404

- **Senaryo:** Alarm API henüz yok veya 404.
- **Beklenti:** Liste boş veya uygun hata mesajı; sayfa çökmez. (Örn. “Veriler yüklenemedi” veya ağ hatası gösterimi.)

### 6.2 Boş liste

- **Senaryo:** Filtreye uyan alarm yok.
- **Beklenti:** “Kayıt bulunamadı” veya boş tablo; normal akış.

### 6.3 Yetki

- **Senaryo:** Kullanıcıda `ALARM_MODULE` / `DEVICE_VIEW` yok.
- **Beklenti:** Menüde Alarm görünmez veya `/alarm` 403; projenin yetki modeline uygun.

---

## 7. Özet kontrol listesi

| # | Adım | Beklenti |
|---|------|----------|
| 1 | Sidebar’da “Alarm” menüsü | Görünür, tıklanınca `/alarm` |
| 2 | `/alarm` sayfası | 200, yüklenir |
| 3 | “Alarm listesi” sekmesi | Tablo, filtreler, en az 2 alarm (seed ile) |
| 4 | Listede claim | 200, liste güncellenir |
| 5 | Listede export | CSV indirilir, veri var |
| 6 | “Alarm kuralları” sekmesi | Placeholder / “Yakında” (Faz 1) |
| 7 | Alarm widget’ta “Kuralları yönet” | Link var, tıklanınca `/alarm` (veya `?tab=rules`) |
| 8 | Alarm widget liste / claim / export | Aynı API ile çalışır; sayfa ile uyumlu |

---

## 8. Lokal Docker ile hızlı akış

1. Backend (Faz 1) + Frontend (Faz 1) implemente edilmiş imaj ile Postgres stack’i çalıştır.
2. Kayıt / giriş; gerekirse rol ve Alarm izni ver.
3. En az 1 cihaz ekle; Test Planı 1’deki gibi `t_alarm`’a 2 satır seed’le.
4. **Menü:** Alarm’a tıkla → `/alarm` açılsın.
5. **Liste:** Cihaz seç (veya tümü); 2 alarm görünsün. Claim → güncelleme. Export → CSV.
6. **Kurallar sekmesi:** Placeholder görünsün.
7. **Dashboard:** Alarm widget ekle; “Kuralları yönet” ile `/alarm`’a gidilsin; widget’ta liste, claim, export çalışsın.

Bu plan, sadece 200 değil, **sahte alarm ve cihaz verisiyle** sayfa ve widget davranışını doğrular.
