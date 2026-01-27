# ChirpStack RSSI ve SNR Verileri – Düzeltme Özeti

## Sorun

ChirpStack webhook'larından gelen **RSSI** ve **SNR** verileri parse ediliyordu ancak **entity olarak kaydedilmiyordu**.

- RSSI ve SNR `rxInfo` array'inden parse ediliyordu (satır 76-82)
- Ancak sadece log'a yazılıyordu, entity olarak kaydedilmiyordu
- Kullanıcı cihazlarda RSSI ve SNR değerlerini göremiyordu

## Çözüm

`ChirpstackWebhookService.handleUplink()` metodunda RSSI ve SNR değerlerini **entity olarak kaydetme** eklendi.

### Yapılan Değişiklikler

**Dosya:** `integrations/chirpstack-integration/src/main/java/com/milesight/beaveriot/integrations/chirpstack/service/ChirpstackWebhookService.java`

**Önceki Kod:**
```java
// RSSI ve SNR parse ediliyor ama sadece log'a yazılıyor
Integer rssi = null;
Double snr = null;
if (evt.getRxInfo() != null && !evt.getRxInfo().isEmpty()) {
    var rx = evt.getRxInfo().get(0);
    rssi = rx.getRssi();
    snr = rx.getSnr();
}
log.debug("ChirpStack uplink: devEui={}, fPort={}, rssi={}, snr={}", devEui, fPort, rssi, snr);

// Sadece decoded payload'dan gelen değerler kaydediliyor
JsonNode decoded = evt.getObject();
// ... decoded payload işleme ...
```

**Yeni Kod:**
```java
// RSSI ve SNR parse ediliyor
Integer rssi = null;
Double snr = null;
if (evt.getRxInfo() != null && !evt.getRxInfo().isEmpty()) {
    var rx = evt.getRxInfo().get(0);
    rssi = rx.getRssi();
    snr = rx.getSnr();
}
log.debug("ChirpStack uplink: devEui={}, fPort={}, rssi={}, snr={}", devEui, fPort, rssi, snr);

// Tüm entity değerlerini topla (decoded payload + rxInfo)
Map<String, Object> toSave = new HashMap<>();

// Decoded payload'dan sensor verileri
JsonNode decoded = evt.getObject();
// ... decoded payload işleme ...
toSave.putAll(sensorValues);

// rxInfo'dan RSSI ve SNR ekle
if (rssi != null) {
    toSave.put("rssi", rssi.doubleValue());
}
if (snr != null) {
    toSave.put("snr", snr);
}

// Tüm entity değerlerini kaydet
entityValueServiceProvider.saveValuesAndPublishAsync(ExchangePayload.create(payload));
```

## ChirpStack Payload Yapısı

ChirpStack webhook payload'ında RSSI ve SNR `rxInfo` array'inde gelir:

```json
{
  "deviceInfo": {
    "devEui": "0101010101010101"
  },
  "rxInfo": [
    {
      "gatewayId": "0016c001f153a14c",
      "uplinkId": 4217106255,
      "rssi": -36,
      "snr": 10.5
    }
  ],
  "object": {
    "temperature": 25.5,
    "humidity": 60.0
  }
}
```

## Entity Tanımları

`ChirpstackTelemetryMapping`'de RSSI ve SNR entity'leri zaten tanımlı:

```java
Spec.of("rssi", "RSSI", "dBm", "rssi"),
Spec.of("snr", "SNR", "dB", "snr")
```

Bu entity'ler cihaz eklenirken otomatik oluşturuluyor (`ChirpstackDeviceService.onAddDevice()`).

## Sonuç

- ✅ RSSI ve SNR değerleri `rxInfo` array'inden parse ediliyor
- ✅ Entity olarak kaydediliyor (`rssi` ve `snr` entity ID'leri ile)
- ✅ Kullanıcı cihazlarda RSSI ve SNR değerlerini görebilecek
- ✅ Decoded payload'dan gelen sensor verileriyle birlikte kaydediliyor

## Test

1. **ChirpStack'ten webhook gönder:**
   ```bash
   curl -X POST "http://localhost:9080/public/integration/chirpstack/webhook?event=uplink" \
     -H "Content-Type: application/json" \
     -d '{
       "deviceInfo": {"devEui": "0101010101010101"},
       "rxInfo": [{"gatewayId": "0016c001f153a14c", "rssi": -36, "snr": 10.5}],
       "object": {"temperature": 25.5}
     }'
   ```

2. **Beaver IoT Web UI'da kontrol et:**
   - Devices → Cihazı seç → Entities
   - `rssi` entity'sinde **-36** değeri görünmeli
   - `snr` entity'sinde **10.5** değeri görünmeli

3. **Widget'larda kullan:**
   - Signal Quality Dial widget'ı RSSI, SNR, SF değerlerini gösterebilir
   - Entity seçiminde `rssi` ve `snr` entity'leri görünmeli

## Notlar

- RSSI ve SNR değerleri her uplink'te güncellenir
- `rxInfo` array'inin ilk elemanı kullanılır (genellikle en güçlü sinyal)
- RSSI: dBm birimi (örnek: -36 dBm)
- SNR: dB birimi (örnek: 10.5 dB)

Değişiklikler compile edildi ve test için hazır.
