# Lokal vs sunucu (GHCR) Docker imaj farkı – Alarm/Map widget yok

## Karşılaştırma özeti

| | **Lokal** (`milesight/beaver-iot:latest`) | **Sunucu** (`ghcr.io/rifatsekerariot/beaver-iot:latest`) |
|--|--|--|
| **Alarm-*.js** | ✅ Var (`Alarm-yP28KY9z.js`) | ❌ **YOK** |
| **Map-*.js** | ✅ Var (`Map-tdPfu7n2.js`) | ❌ **YOK** |
| **Table-*.js** (Device List) | ✅ Var | ✅ Var (farklı hash) |
| **index entry** | `index-CZ3KgV1J.js` | `index-C3gFEWn8.js` |
| **/web tarihi** | Jan 24 16:57 | **Oct 29 03:46** |
| **JS dosya sayısı** | 187 | 152 |

## Kök neden

Sunucudaki imaj (`ghcr.io/rifatsekerariot/beaver-iot:latest`) **farklı bir frontend build** içeriyor:

- **Alarm** ve **Map** widget chunk’ları **yok**.
- **index** entry ve **/web** timestamp’leri **Ekim 29** – daha eski build.
- Lokal imaj **Ocak 24** build; widget fix’leri (components.ts, useFilterPlugins) bu build’de.

Yani **GHCR’daki imaj**, widget’lı (bizim) frontend build’inden **üretilmemiş**. Büyük olasılıkla:

1. **Web katmanı cache (en olası):** GHCR imajı **bugün** (24 Ocak) oluşturulmuş ama **/web** içeriği **29 Ekim** tarihli. Monolith, **milesight/beaver-iot-web:latest**’i base alıyor. Web build **--no-cache** olmadan çalışınca **eski** web katmanı (Ekim, widget’sız) **cache**’ten kullanılmış; yeni web build **imaja girmemiş**. CI’a **--no-cache** web build sonradan eklendi – bu değişiklik push edilmeden önceki koşular hâlâ cache’li build yapıyordu.
2. **Eski CI akışı:** Son **başarılı** push, **restructure + clone + local dockerfile + verify-web-source** eklenmeden **önce** yapıldıysa, web **beaver-iot-web.dockerfile** (clone) veya **upstream** kaynaktan üretilmiş olabilir; o build’de Alarm/Map yok.
3. **Sunucu eski imajı çekiyor:** Zero-touch **ghcr.io/rifatsekerariot/beaver-iot:latest** kullanıyor. Son **başarılı** workflow push’u **yeni** (widget’lı) imajı üretmediyse, sunucu **eski** imajı çalıştırıyor.

## Neden Alarm/Map görünmüyor?

Frontend build’de **Alarm** ve **Map** için ayrı chunk’lar (**Alarm-*.js**, **Map-*.js**) üretiliyor. Bunlar **yoksa**:

- “Add widget” listesinde Alarm/Map **çıkmaz** veya
- Eklenince **yüklenemez** / boş kalır.

GHCR imajında bu chunk’lar **olmadığı** için sunucuda Alarm/Map widget’ları **görünmüyor**.

## Yapılacaklar

1. **CI’ı güncel akışla çalıştır:**  
   “Build and push prebuilt” workflow’u **restructure + ci-clone-web + verify-web-source + beaver-iot-web-local.dockerfile + --no-cache** ile **başarılı** bitsin.  
   Böylece web **kesinlikle** **rifatsekerariot/beaver-iot-web** (main) + widget fix’lerinden build edilir.

2. **Verify adımlarının geçmesini sağla:**  
   - **Verify web source:** Clone bizim repo, components.ts + useFilterPlugins fix’leri mevcut.  
   - **Verify web image:** `Alarm-*.js` ve `Map-*.js` chunk’ları web imajında var.  
   Bu ikisi de **pass** etmeden imaj **push edilmemeli**.

3. **GHCR’a yeni imaj push edildikten sonra sunucuda güncelle:**  
   Zero-touch veya manuel:
   ```bash
   docker compose pull
   docker compose -f chirpstack-prebuilt.yaml up -d
   ```
   Sunucunun **yeni** GHCR imajını çektiğinden emin ol.

4. **İmajın doğru olduğunu kontrol et:**  
   Sunucuda (veya GHCR imajını çekip yerelde):
   ```bash
   docker run --rm --entrypoint sh ghcr.io/rifatsekerariot/beaver-iot:latest -c "ls /web/assets/js | grep -E '^Alarm-|^Map-'"
   ```
   **Alarm-*.js** ve **Map-*.js** çıktığında frontend build doğrudur.

## Özet

- **Lokal imaj:** Bizim frontend build’i (Alarm/Map var) → widget’lar görünüyor.  
- **Sunucu imajı (şu anki GHCR):** Eski/farklı frontend (Alarm/Map yok) → widget’lar görünmüyor.  
- **Çözüm:** CI’ı güncel, verify’lı akışla **başarılı** çalıştırıp **yeni** imajı GHCR’a push et, sonra sunucuyu bu imaja güncelle.
