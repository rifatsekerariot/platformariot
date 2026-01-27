# Hazır Build ile Zero-Touch – Ne Yapılması Gerektiği Raporu

Bu rapor, **her seferinde build etmek yerine hazır (pre-built) Docker image’ları kullanarak** zero-touch dağıtımını sadeleştirmek için **neyin yapılması gerektiğini** özetler. Kod yazılmaz; sadece plan ve seçenekler anlatılır.

---

## 1. Neden Şu An Karışık?

- **`--build-images` ile:** Sunucuda api + web + monolith kaynaktan build ediliyor. Git clone, Maven, pnpm, Docker build; 15–25 dakika, ağ/disk/bellek bağımlı. `API_GIT_REPO_URL` vb. env’ler eksik kalırsa veya branch/repo uyumsuzsa hata çıkıyor.
- **`--build-images` olmadan:** `milesight/beaver-iot:latest` pull ediliyor. Bu image’da sizin widget (Alarm/Map/DeviceList) düzeltmeniz yok; ChirpStack JAR volume ile takılıyor, bu kısım çalışıyor ama arayüz eski.

Yani ya “her seferinde uzun ve kırılgan build” ya da “hızlı ama widget’sız hazır image” ikilemi var.

---

## 2. “Hazır Build” ile Kast Edilen

Sunucuda **hiç image build etmeden**, önceden sizin için build edilip bir registry’ye push edilmiş image’ları **pull + compose** ile çalıştırmak. Zero-touch yine tek komut; ancak build adımı olmaz, sadece:

- Gerekirse JAR build + kopyalama (integrations repo),
- `docker compose pull` (veya `up` ile pull),
- `compose up`.

Süre kısalır, build ortamı (Maven, Node, vb.) sunucuda gerekmez; env / repo / branch kaynaklı hatalar büyük ölçüde ortadan kalkar.

---

## 3. Hazır Build İçin Yapılması Gerekenler

### 3.1 Image’ların Üretilmesi ve Yayınlanması

- **Kim build edecek?** Siz (lokal) veya CI (GitHub Actions vb.). Tercihen CI: `main` veya belirli tag’lere push’ta otomatik build.
- **Ne build edilecek?** En azından `beaver-iot` monolith (içinde api + web). İsterseniz ayrı ayrı api / web de tutulabilir; şu anki compose yapısına uyum önemli.
- **Web tarafı:** Widget düzeltmesi (Alarm/Map/DeviceList) mutlaka bu image’a girmeli. Yani build sırasında `rifatsekerariot/beaver-iot-web` (veya ilgili fork) kullanılmalı.
- **Nereye push?** Docker Hub (`rifatsekerariot/...`) veya GitHub Container Registry (`ghcr.io/rifatsekerariot/...`). Her ikisi de public veya private olabilir; private ise zero-touch’ta login gerekir.
- **Tag’ler:** `latest`, `chirpstack-v1`, `20250124` gibi sabit tag’ler. Böylece “hazır build” her zaman aynı tag’i çeker; kullanıcı karışmaz.

### 3.2 ChirpStack JAR’ın Yeri

- **Seçenek A (mevcut mantık):** JAR, image dışında; zero-touch yine integrations’dan build edip `target/chirpstack/integrations` altına koyar, volume ile monolith’e bağlar. Hazır image’da sadece “widget’lı web + standart api” olur; JAR deploy anında üretilir. Esnek; JAR güncellemesi için image yeniden üretmek gerekmez.
- **Seçenek B:** JAR, image’ın içine gömülür. “ChirpStack’li hazır image” tek paket olur; deploy’da JAR build yok. Daha basit kurulum, ancak JAR veya entegrasyon güncellemesi için image’ı yeniden build edip yayınlamak gerekir.

Hazır build’i **hemen** basitleştirmek için A yeterli; B, tam “tek image” deneyimi isterseniz düşünülebilir.

### 3.3 Zero-Touch Script’in Güncellenmesi

- **Yeni mod:** Örn. `--use-prebuilt` veya `--image-tag chirpstack-v1`. Bu modda script **build aşamasını atlar**; sadece JAR (Seçenek A ise) + compose işini yapar.
- **Compose tarafı:** `chirpstack.yaml` (veya kullanılan compose) image isimlerini env’den alacak şekilde ayarlanır. Örn. `BEAVER_IMAGE=ghcr.io/rifatsekerariot/beaver-iot:chirpstack-v1`. Script bu env’i set edip `compose up` çalıştırır.
- **Net sonuç:** “Hazır build” modunda ne `API_GIT_REPO_URL` ne web repo ne Docker build; sadece pull + JAR (opsiyonel) + compose.

### 3.4 CI/CD ile Otomasyon

- **Ne zaman build?** Örn. `main`’e push, veya `v*` tag’i atıldığında.
- **Akış:** Repo’ları (integrations, web, docker) kullanarak api/web/monolith build → registry’ye push. Zero-touch tarafı bu image’ları kullanır.
- **Avantaj:** Her “hazır build” aynı ortamda, tekrarlanabilir şekilde üretilir; “benim makinede çalışıyordu” farkı azalır.

### 3.5 Dokümantasyon ve Kullanım

- Hangi tag’in “hazır ChirpStack + widget” olduğu (örn. `chirpstack-v1` / `latest`) açıkça yazılmalı.
- Zero-touch’ta örnek komut:  
  `curl -sSL ... | sudo sh -s -- --tenant-id default --use-prebuilt`  
  (veya `--image-tag chirpstack-v1` gibi net bir örnek.)
- Registry private ise: `docker login`’in nerede ve nasıl yapılacağı (script öncesi veya script içi) kısa bir “Hazır build kullanımı” bölümünde anlatılmalı.

---

## 4. Özet: Adım Adım Yapılacaklar

| Sıra | Yapılacak | Açıklama |
|------|------------|----------|
| 1 | Image’ları build et | Widget’lı web + (opsiyonel) ChirpStack JAR; lokal veya CI. |
| 2 | Registry’ye push et | Docker Hub veya ghcr.io; sabit tag (örn. `chirpstack-v1`). |
| 3 | Zero-touch’a “hazır build” modu ekle | `--use-prebuilt` vb.; build atlanır, compose’da bu image kullanılır. |
| 4 | Compose’u env ile yönlendir | Image adı/tag’i env’den gelsin; script set eder. |
| 5 | (Opsiyonel) CI ile otomatik build | Her release/tag’de image’ları üretip push et. |
| 6 | Dokümante et | Hangi tag, nasıl kullanılır, gerekirse `docker login`. |

---

## 5. Sonuç

- **Evet, “hazır build” ile her seferinde bu kadar karışık olmak zorunda değil.** Build’i siz veya CI bir kez yapıp image’ları yayınlarsınız; sunucuda yalnızca pull + JAR (gerekirse) + compose çalışır.
- **Yapılması gerekenler:** (1) Bu image’ları üretmek ve registry’de tutmak, (2) zero-touch’ta “hazır build” modunu ekleyip compose’u buna göre kullanmak, (3) istenirse CI ile bunu otomatikleştirmek, (4) kullanımı kısa ve net dokümante etmek.

Bu adımlar tamamlandığında, kullanıcı tarafı **tek komut + hazır image** ile sade bir zero-touch’a kavuşur; build karmaşası sunucuya hiç taşınmaz.
