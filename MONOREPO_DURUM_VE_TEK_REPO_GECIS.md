# Monorepo Durumu ve Tek Repo Geçişi

## Ne planlanmıştı?

Tüm repoları **tek bir monorepo**da toplamak: backend, web, integrations, build-docker, blueprint, scripts — hepsi **tek repo**, tek build, tek deploy.

---

## Mevcut durum

### ✅ platformariot = **Zaten monorepo**

| Klasör | İçerik |
|--------|--------|
| `backend/` | Beaver IoT API (alarm, t_alarm, PostgreSQL, vb.) |
| `web/` | Beaver IoT Web (alarm widget, ARIOT, PDF rapor, vb.) |
| `integrations/` | beaver-iot-integrations kopyası (ChirpStack, MQTT-Device, Milesight-Gateway, vb.) — JAR buradan build edilir |
| `blueprint/` | Cihaz/çözüm blueprint’leri |
| `build-docker/` | Dockerfile’lar, nginx, docker-compose |
| `scripts/` | deploy-zero-touch, ci-build-jar, build-prebuilt, verify-*, vb. |
| `examples/` | stack.yaml (PostgreSQL + monolith) |

- **CI/CD:** `main`’e push → tek workflow → `ghcr.io/rifatsekerariot/beaver-iot:latest`
- **Deploy:** Tek `curl` ile kurulum/güncelleme; başka repo clone edilmez.

README’de de yazıyor: *"Repo kendi icinde – disari veri almadan"* — build ve deploy tamamen bu repodan.

---

### ❌ Neden hâlâ ayrı repolarda çalışıyoruz?

| Repo | GitHub | Ne işe yarıyor? | Sorun |
|------|--------|------------------|--------|
| **platformariot** | rifatsekerariot/platformariot | Asıl monorepo: backend + web + integrations + blueprint + build-docker | Buraya yapılan her şey build/deploy’a yansıyor. **Ana çalışma repomuz olmalı.** |
| **beaver** (beaver-iot-integrations) | rifatsekerariot/beaver-iot-integrations | Sadece integrations (Milesight upstream’in fork’u) | Cursor workspace çoğu zaman **beaver** açık; orada yapılan değişiklikler **platformariot’a otomatik gitmiyor**. platformariot içindeki `integrations/` ayrı bir kopya. |
| (Eski) beaver-iot-main, beaver-iot-web, beaver-iot-docker | — | Bunlar **platformariot**’a taşınmış; backend≈main, web≈web, build-docker≈build-docker | Ayrı repolar artık kullanılmıyor. |

Yani: **Birleştirme platformariot tarafında yapıldı**, ama:

1. **beaver** (beaver-iot-integrations) ayrı repo olarak bırakıldı.
2. **Cursor workspace** sıklıkla **beaver** üzerinden açıldığı için, orada yapılan `NO_RESOURCE_ALARMS_SEARCH_FIX.md`, `scripts/run-alarm-api-tests.ps1` gibi değişiklikler **sadece beaver**’da; platformariot’un `integrations/` kopyasında yok.
3. **Build ve deploy** platformariot’tan yapıldığı için, beaver’daki bu tür değişiklikler **imaja ve canlıya yansımıyor**.

---

## Tek repoda çalışmak için yapılması gerekenler

### 1. **Çalışma repomuz: sadece platformariot**

- **Cursor / IDE:** Proje olarak `c:\Projeler\platformariot` açın.
- **Tüm geliştirme:** `backend/`, `web/`, `integrations/`, `blueprint/`, `build-docker/`, `scripts/` değişiklikleri **platformariot** içinde yapın.
- **Git:** Sadece `platformariot`’a commit + push. CI bu repoyu build eder.

### 2. **beaver (beaver-iot-integrations) rolü**

İki seçenek:

| Seçenek | Açıklama |
|---------|----------|
| **A) Sadece upstream takibi** | Milesight’tan gelen güncellemeleri almak istiyorsanız: `platformariot/integrations` içeriğini periyodik olarak `milesight-iot/beaver-iot-integrations` veya sizin `rifatsekerariot/beaver-iot-integrations` fork’unuzdan **manuel/cherry-pick** ile güncelleyin. **Günlük geliştirme platformariot’ta.** |
| **B) beaver’ı bırakmak** | Upstream’e ihtiyaç yoksa: `rifatsekerariot/beaver-iot-integrations`’ı archive’layın veya yalnızca referans için bırakın. Tüm entegrasyon geliştirmesi **platformariot/integrations** üzerinden. |

### 3. **beaver’daki değişiklikleri platformariot’a taşıma**

Beaver’da yapılıp platformariot’ta **olmayan veya eski** olanlar el ile taşınmalı. Örnekler:

- `NO_RESOURCE_ALARMS_SEARCH_FIX.md` → `platformariot/`. **Yapıldı:** `platformariot/NO_RESOURCE_ALARMS_SEARCH_FIX.md`
- `scripts/run-alarm-api-tests.ps1` (NoResourceFoundException notu) → `platformariot/integrations/scripts/run-alarm-api-tests.ps1` ile birleştirilmiş/güncel hali platformariot’ta olmalı.
- İsteğe bağlı: Diğer `.md` raporlar (ALARM_*, DASHBOARD_*, TEST_PLAN_*, vb.) sadece dokümantasyon ise `platformariot/integrations/` veya `platformariot/docs/` altına kopyalanabilir; zorunlu değil.

Bunları taşıdıktan sonra **asıl geliştirme platformariot’ta** yapılacak; beaver’daki aynı dosyalar artık “master” değil.

### 4. **Remote’lar (isteğe bağlı)**

- **beaver** projesinde `platform` remote’u zaten ekli: `https://github.com/rifatsekerariot/platformariot.git`  
  → Sadece karşılaştırma veya patch taşımak için kullanılabilir.
- **platformariot** tek ana repo olduğu için, ekstra “beaver” remote’una gerek yok; gerekirse `integrations` güncellemesi için beaver’ı geçici remote ekleyip sadece `integrations` ağacını çekebilirsiniz.

---

## Kısa özet

| Soru | Cevap |
|------|--------|
| Monorepo yapıldı mı? | **Evet.** platformariot zaten backend + web + integrations + blueprint + build-docker ile tek repo. |
| Neden ayrı repolarda çalışıyoruz? | **beaver** (beaver-iot-integrations) ayrı bırakıldı ve Cursor/IDE çoğunlukla **beaver** üzerinden açıldı; değişiklikler orada kaldı, platformariot’taki `integrations/` kopyası güncel değil. |
| Bundan sonra nerede çalışalım? | **Sadece platformariot.** Tüm commit/push ve CI bu repoya. |
| beaver’ı ne yapalım? | Upstream takip gerekmiyorsa **archive** veya sadece referans; gerekirse sadece `integrations` için **manuel senkron** kaynağı. |
| Eksik değişiklikler? | `NO_RESOURCE_ALARMS_SEARCH_FIX.md`, `run-alarm-api-tests.ps1` ve ihtiyaç duyulan diğer script/doc’lar **platformariot**’a taşınmalı. |

---

## Sonraki adımlar (önerilen sıra)

**Uygulanabilir adımlar:** [PLATFORMARIOT_GECIS_ADIMLARI.md](PLATFORMARIOT_GECIS_ADIMLARI.md)

1. **platformariot**’u Cursor’da **ana workspace** yapın.
2. **beaver’daki** `NO_RESOURCE_ALARMS_SEARCH_FIX.md` ve güncel `run-alarm-api-tests.ps1` notunu **platformariot**’a kopyalayın/birleştirin.
3. Gerekli tekrarları önlemek için **beaver**’da yeni geliştirme yapmamaya başlayın; sadece platformariot.
4. İleride Milesight’tan `beaver-iot-integrations` güncellemesi alınacaksa: `platformariot/integrations` için bir **sync notu** veya kısa script (hangi commit’ten ne alınacağı) yazılabilir.

Bu adımlarla **tek monorepo (platformariot)** üzerinden çalışmış olursunuz; farklı farklı repolarda çalışma ihtiyacı kalkar.
