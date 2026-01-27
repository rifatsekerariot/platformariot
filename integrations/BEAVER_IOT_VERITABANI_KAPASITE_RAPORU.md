# Beaver IoT Veritabanı Kapasite Analizi Raporu

**Tarih:** 2025-01-25  
**Kapsam:** Veritabanı türleri, kapasite limitleri, veri saklama yapısı, pratik öneriler

---

## 1. Desteklenen Veritabanı Türleri

Beaver IoT iki veritabanı türünü destekler:

### 1.1. H2 Database (Varsayılan)
- **Tip:** Embedded, file-based SQL database
- **Konfigürasyon:** `DB_TYPE=h2`
- **Varsayılan Path:** `~/beaver-iot/h2/beaver` (container'da `/root/beaver-iot/h2/beaver`)
- **Kullanım:** Geliştirme, küçük/orta ölçekli deployment'lar
- **Örnek:**
  ```yaml
  SPRING_DATASOURCE_URL=jdbc:h2:file:~/beaver-iot/h2/beaver;AUTO_SERVER=TRUE
  SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.h2.Driver
  ```

### 1.2. PostgreSQL (Production)
- **Tip:** Enterprise-grade relational database
- **Konfigürasyon:** `DB_TYPE=postgres`
- **Kullanım:** Production, büyük ölçekli deployment'lar, yüksek kullanılabilirlik
- **Örnek:**
  ```yaml
  SPRING_DATASOURCE_URL=jdbc:postgresql://beaver-iot-postgresql:5432/postgres
  SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
  ```

---

## 2. H2 Database Kapasite Limitleri

### 2.1. Teorik Limitler
- **Maksimum Tablo Boyutu:** 2^64 satır (yaklaşık 18.4 kentilyon kayıt)
- **Pratik Limit:** Teorik limit çok yüksek, ancak pratik kullanımda sınırlamalar var

### 2.2. Pratik Limitler ve Sorunlar
- **Önerilen Maksimum Boyut:** ~10-50 GB (güvenli aralık)
- **Bilinen Sorunlar:**
  - **143 GB+ veritabanlarında:** Stabilite sorunları, veritabanı bozulması ("Missing lob entry" hataları)
  - **Çok büyük veritabanlarında:** JVM garbage collection duraklamaları
  - **Multi-threading:** H2, büyük ölçekli multi-threaded erişimde sınırlı
- **Kullanım Senaryosu:** Küçük/orta ölçekli deployment'lar, geliştirme/test ortamları

### 2.3. H2 Avantajları
- ✅ Kolay kurulum (ekstra servis gerekmez)
- ✅ Düşük kaynak kullanımı
- ✅ Dosya tabanlı (backup/restore kolay)
- ✅ Hızlı başlangıç

### 2.4. H2 Dezavantajları
- ❌ Büyük veritabanlarında stabilite sorunları
- ❌ Production-grade özellikler sınırlı
- ❌ Yüksek eşzamanlı erişimde performans düşüşü
- ❌ Veri saklama politikası (retention) yok (manuel yönetim gerekir)

---

## 3. PostgreSQL Kapasite Limitleri

### 3.1. Teorik Limitler
- **Maksimum Tablo Boyutu:** 32 TB (PostgreSQL 13+)
- **Maksimum Veritabanı Boyutu:** Sınırsız (disk alanına bağlı)
- **Maksimum Satır Sayısı:** Pratik olarak sınırsız (disk ve performans sınırlarına bağlı)

### 3.2. Pratik Limitler
- **Önerilen Maksimum Tablo Boyutu:** 1-10 TB (performans için)
- **Büyük Ölçekli Deployment:** 100+ GB - TB seviyesinde veritabanları desteklenir
- **Eşzamanlı Erişim:** Yüksek eşzamanlı kullanıcı/bağlantı desteği
- **Production-Ready:** Enterprise-grade özellikler (backup, replication, partitioning)

### 3.3. PostgreSQL Avantajları
- ✅ Büyük ölçekli deployment'lar için uygun
- ✅ Yüksek performans ve stabilite
- ✅ Gelişmiş özellikler (partitioning, indexing, full-text search)
- ✅ Production-grade (backup, replication, HA)
- ✅ Veri saklama politikaları (retention) uygulanabilir

### 3.4. PostgreSQL Dezavantajları
- ❌ Ayrı servis gerektirir (ekstra container/kaynak)
- ❌ Kurulum ve yönetim daha karmaşık
- ❌ Daha fazla kaynak kullanımı (RAM, CPU)

---

## 4. Beaver IoT Veri Saklama Yapısı

### 4.1. Veri Türleri

#### 4.1.1. Entity Values (Telemetri Verileri)
- **Tür:** Property-type entity'ler için zaman serisi verileri
- **Saklama:** 
  - **Latest Values:** En son değerler (güncel durum)
  - **History Records:** Zaman serisi verileri (timestamp ile)
- **API:** 
  - `POST /api/v1/entity/history/search` - Zaman serisi arama
  - `POST /api/v1/entity/history/aggregate` - Agregasyon (LAST/MIN/MAX/AVG/SUM)
- **Veri Yapısı:** `entity_key`, `value`, `timestamp`

#### 4.1.2. Devices (Cihazlar)
- **Tür:** Cihaz metadata (isim, identifier, integration, entities)
- **Saklama:** Relational tablolar
- **Boyut:** Küçük (her cihaz ~KB seviyesinde)

#### 4.1.3. Dashboards (Paneller)
- **Tür:** Dashboard yapılandırmaları, widget'lar
- **Saklama:** JSON/relational
- **Boyut:** Küçük-orta (her dashboard ~KB-MB seviyesinde)

#### 4.1.4. Users, Roles, Permissions
- **Tür:** Kullanıcı yönetimi verileri
- **Saklama:** Relational tablolar
- **Boyut:** Çok küçük (yüzlerce kullanıcı için ~MB seviyesinde)

### 4.2. Veri Büyüme Hızı

#### Senaryo: ChirpStack Integration (LoRaWAN Sensörler)
- **Cihaz Sayısı:** 100 cihaz
- **Entity Sayısı:** Cihaz başına ortalama 5 entity (temperature, humidity, battery, rssi, snr)
- **Toplam Entity:** 500 entity
- **Veri Gönderim Sıklığı:** Her cihaz 15 dakikada bir (günde 96 uplink)
- **Günlük Veri Noktası:** 100 cihaz × 5 entity × 96 uplink = **48,000 veri noktası/gün**
- **Aylık Veri Noktası:** ~1.44 milyon veri noktası
- **Yıllık Veri Noktası:** ~17.5 milyon veri noktası

**Tahmini Veri Boyutu (Entity History):**
- Her veri noktası: ~50-100 byte (entity_key, value, timestamp, metadata)
- Günlük: 48,000 × 75 byte ≈ **3.6 MB/gün**
- Aylık: ~108 MB/ay
- Yıllık: ~1.3 GB/yıl

**Not:** Bu tahmin, veritabanı overhead (indexes, metadata) dahil değil. Gerçek boyut 2-3x daha fazla olabilir.

---

## 5. Veri Saklama Politikası (Retention)

### 5.1. Mevcut Durum
- **Beaver IoT'de otomatik retention yok:** Veriler süresiz saklanır
- **Manuel temizleme:** Kullanıcı tarafından manuel silme veya export sonrası temizleme
- **API:** `POST /api/v1/entity/export` (CSV export) mevcut, ancak otomatik silme yok

### 5.2. Önerilen Retention Stratejileri

#### 5.2.1. H2 için
- **Kısa süreli saklama:** 30-90 gün (küçük deployment'lar)
- **Manuel temizleme:** Düzenli aralıklarla eski verileri silme script'i
- **Backup:** Düzenli backup alınmalı (dosya tabanlı)

#### 5.2.2. PostgreSQL için
- **Uzun süreli saklama:** 1-5 yıl (production deployment'lar)
- **Partitioning:** Zaman bazlı tablo partitioning (performans için)
- **Otomatik temizleme:** Cron job veya scheduled task ile eski verileri silme
- **Archive:** Eski verileri archive tablosuna taşıma veya cold storage'a aktarma

---

## 6. Kapasite Tahminleri

### 6.1. H2 Database Senaryoları

| Senaryo | Cihaz | Entity/Cihaz | Uplink/Gün | Veri Noktası/Gün | Tahmini Boyut/Yıl | Önerilen DB |
|---------|-------|--------------|------------|------------------|-------------------|-------------|
| **Küçük** | 10 | 3 | 96 | 2,880 | ~100 MB | ✅ H2 |
| **Orta** | 50 | 5 | 96 | 24,000 | ~800 MB | ✅ H2 |
| **Büyük** | 100 | 5 | 96 | 48,000 | ~1.6 GB | ⚠️ H2 (sınırda) |
| **Çok Büyük** | 500 | 5 | 96 | 240,000 | ~8 GB | ❌ PostgreSQL |
| **Enterprise** | 1000+ | 5+ | 96+ | 500,000+ | 15+ GB | ❌ PostgreSQL |

**Not:** Tahminler, veritabanı overhead (indexes, metadata) dahil değil. Gerçek boyut 2-3x daha fazla olabilir.

### 6.2. PostgreSQL Senaryoları

| Senaryo | Cihaz | Entity/Cihaz | Uplink/Gün | Veri Noktası/Gün | Tahmini Boyut/Yıl | Önerilen DB |
|---------|-------|--------------|------------|------------------|-------------------|-------------|
| **Orta** | 100 | 5 | 96 | 48,000 | ~1.6 GB | ✅ PostgreSQL |
| **Büyük** | 500 | 5 | 96 | 240,000 | ~8 GB | ✅ PostgreSQL |
| **Çok Büyük** | 1000 | 5 | 96 | 480,000 | ~16 GB | ✅ PostgreSQL |
| **Enterprise** | 5000+ | 5+ | 96+ | 2,400,000+ | 80+ GB | ✅ PostgreSQL |

**Not:** PostgreSQL, büyük ölçekli deployment'lar için önerilir. Partitioning ve indexing ile performans optimize edilebilir.

---

## 7. Pratik Öneriler

### 7.1. H2 Kullanımı İçin
- ✅ **Küçük deployment'lar:** < 50 cihaz, < 1 GB/yıl veri
- ✅ **Geliştirme/test ortamları**
- ⚠️ **Düzenli backup:** Dosya tabanlı backup (günlük/haftalık)
- ⚠️ **Veri temizleme:** 30-90 gün sonra eski verileri silme
- ⚠️ **Monitoring:** Veritabanı boyutunu düzenli kontrol etme

### 7.2. PostgreSQL Kullanımı İçin
- ✅ **Production deployment'lar:** > 50 cihaz, > 1 GB/yıl veri
- ✅ **Yüksek kullanılabilirlik gereksinimleri**
- ✅ **Büyük ölçekli deployment'lar:** 100+ cihaz
- ✅ **Partitioning:** Zaman bazlı tablo partitioning (performans)
- ✅ **Retention policy:** Otomatik veri temizleme (1-5 yıl)
- ✅ **Backup/Replication:** Düzenli backup ve replication

### 7.3. Veri Yönetimi Stratejileri

#### 7.3.1. Veri Temizleme
- **Kısa süreli veriler:** Son 30-90 gün (dashboard, real-time monitoring)
- **Uzun süreli veriler:** 1-5 yıl (raporlama, analiz)
- **Archive:** Eski verileri archive tablosuna taşıma veya cold storage

#### 7.3.2. Performans Optimizasyonu
- **Indexing:** Timestamp ve entity_key üzerinde index
- **Partitioning:** Zaman bazlı tablo partitioning (PostgreSQL)
- **Aggregation:** Düzenli aralıklarla aggregate verileri (saatlik/günlük özetler)

#### 7.3.3. Monitoring
- **Veritabanı boyutu:** Düzenli kontrol (günlük/haftalık)
- **Disk kullanımı:** Disk alanı monitoring
- **Performans:** Query performansı monitoring

---

## 8. Sonuç ve Öneriler

### 8.1. H2 Database
- **Kullanım:** Küçük/orta ölçekli deployment'lar (< 100 cihaz, < 2 GB/yıl)
- **Limit:** Pratik olarak ~10-50 GB (güvenli aralık)
- **Öneri:** Büyük ölçekli deployment'lar için PostgreSQL'e geçiş yapılmalı

### 8.2. PostgreSQL
- **Kullanım:** Production, büyük ölçekli deployment'lar (100+ cihaz, 2+ GB/yıl)
- **Limit:** Pratik olarak sınırsız (disk alanına bağlı)
- **Öneri:** Enterprise deployment'lar için PostgreSQL kullanılmalı

### 8.3. Genel Öneriler
1. **Küçük deployment'lar:** H2 yeterli (kolay kurulum, düşük kaynak)
2. **Büyük deployment'lar:** PostgreSQL önerilir (stabilite, performans, ölçeklenebilirlik)
3. **Veri saklama:** Retention policy uygulanmalı (otomatik veya manuel)
4. **Backup:** Düzenli backup alınmalı (H2: dosya, PostgreSQL: pg_dump)
5. **Monitoring:** Veritabanı boyutu ve performans düzenli kontrol edilmeli

---

## 9. Kaynaklar

- **H2 Database:** https://h2database.com/
- **PostgreSQL:** https://www.postgresql.org/
- **Beaver IoT Docs:** https://www.milesight.com/beaver-iot/docs/
- **Docker Compose Örnekleri:** `beaver-iot-docker/examples/`

---

**Rapor Tarihi:** 2025-01-25  
**Durum:** Analiz tamamlandı ✅
