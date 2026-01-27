# SensorDecoders-main – Tüm Sensörler ve Telemetri Anahtarları

**Kaynak:** `SensorDecoders-main` (Milesight IoT payload decoder’lar).  
**Amaç:** ChirpStack → Beaver IoT webhook ile gelen `object` (decode edilmiş payload) içindeki **telemetri** anahtarlarını entity olarak eşleyebilmek.

---

## 1. Özet

- **111** adet decoder (`*-decoder.js`) taranmıştır.
- Decoder’lar `decoded.<key> = ...` ile çıktı üretir; ChirpStack payload codec bu çıktıyı uplink `object` olarak gönderir.
- Aşağıda **seri/model** bazında tüm `decoded.*` anahtarları listelenmiştir.  
- **Telemetri:** Genelde **sayısal** (temperature, humidity, co2, distance, people_in, vb.).  
- **Config/metadata:** `*_config`, `*_enable`, `*_version`, `sn`, `lorawan_class`, `report_interval`, `clear_history`, vb. Bunlar entity olarak saklanmaz; sadece raporlama için gösterilir.

---

## 2. Seri / Model Bazında Telemetri Anahtarları

### AM Series (Çevre / Hava Kalitesi)

| Model | Telemetri (sayısal / ölçülebilir) | Diğer (config, status, vb.) |
|-------|-----------------------------------|-----------------------------|
| **am102** | battery, humidity, temperature | clear_history, device_status, firmware_version, hardware_version, history, history_enable, ipso_version, lorawan_class, report_interval, reset_event, sn, temperature_alarm_config, time_sync_enable, time_zone, timestamp, tsl_version, ... |
| **am102l** | battery, humidity, temperature | (am102 ile benzer) |
| **am103** | battery, co2, humidity, temperature | co2_alarm_config, co2_calibration_settings, altitude_calibration_settings, ... |
| **am103l** | battery, co2, humidity, temperature | (am103 ile benzer) |
| **am104** | activity, battery, humidity, illumination, infrared, infrared_and_visible, temperature | sensor_enable, temperature_alarm_config, ... |
| **am107** | activity, battery, co2, humidity, illumination, infrared, infrared_and_visible, pressure, temperature, tvoc | co2_alarm_config, altitude_calibration_settings, ... |
| **am307** | battery, co2, humidity, light_level, pir, pressure, temperature, tvoc | buzzer_enable, buzzer_status, child_lock_settings, tvoc_unit, ... |
| **am307l** | battery, co2, humidity, light_level, pir, pressure, temperature, tvoc | (am307 ile benzer) |
| **am308** | battery, co2, humidity, light_level, pir, pm10, pm2_5, pressure, temperature, tvoc | pm2_5_collection_interval, ... |
| **am308l** | battery, co2, humidity, light_level, pir, pm10, pm2_5, pressure, temperature, tvoc | (am308 ile benzer) |
| **am319-hcho** | battery, co2, hcho, humidity, light_level, pir, pm10, pm2_5, pressure, temperature, tvoc | (am308 + hcho) |
| **am319-hcho-ir** | battery, co2, hcho, humidity, light_level, pir, pm10, pm2_5, pressure, temperature, tvoc | ... |
| **am319l-hcho-ir** | battery, co2, hcho, humidity, light_level, pir, pm10, pm2_5, pressure, temperature, tvoc | ... |
| **am319-o3** | battery, co2, humidity, light_level, o3, pir, pm10, pm2_5, pressure, temperature, tvoc | ... |
| **am319l-o3** | battery, co2, humidity, light_level, o3, pir, pm10, pm2_5, pressure, temperature, tvoc | ... |

### AT Series (Konum / Takip)

| Model | Telemetri | Diğer |
|-------|-----------|--------|
| **at101** | battery, latitude, longitude, motion_status, geofence_status, position, tamper_status, temperature, temperature_alarm | bluetooth_enable, gnss_positioning_timeout, motion_report_config, report_strategy, positioning_strategy, wifi, wifi_scan_result, ... |

### CT Series (Akım / Sıcaklık)

| Model | Telemetri | Diğer |
|-------|-----------|--------|
| **ct101** | current, current_max, current_min, current_alarm, total_current, temperature, temperature_alarm | current_sensor_status, temperature_sensor_status, alarm_report_interval, clear_current_cumulative, ... |
| **ct103** | current, current_max, current_min, current_alarm, total_current, temperature, temperature_alarm | (ct101 ile benzer) |
| **ct105** | current, current_max, current_min, current_alarm, total_current, temperature, temperature_alarm | (ct101 ile benzer) |
| **ct303** | temperature, temperature_alarm | temperature_sensor_status, alarm_report_interval, ... |
| **ct305** | temperature, temperature_alarm | (ct303 ile benzer) |
| **ct310** | temperature, temperature_alarm | (ct303 ile benzer) |

### DS Series (Ekran / Buton)

| Model | Telemetri | Diğer |
|-------|-----------|--------|
| **ds3604** | battery, button_status, current_template_id | button_enable, button_visible, buzzer_enable, block_visible, beep, ... |

### EM Series (Sensör / Ölçüm)

| Model | Telemetri | Diğer |
|-------|-----------|--------|
| **em300-cl** | battery, liquid, liquid_alarm | alarm_config, calibration_result, capacitor_config, ... |
| **em300-di** | battery, counter, gpio, pulse, pulse_conv, temperature, water, water_conv, water_alarm | gpio_alarm, gpio_mode, water_flow_determination, ... |
| **em300-di-hall** | battery, counter, gpio, pulse, pulse_conv, water, water_conv, water_alarm | (em300-di ile benzer) |
| **em300-mcs** | battery, humidity, magnet_status, temperature | magnet_alarm_config, ... |
| **em300-mld** | battery, leakage_status | leakage_alarm_config, ... |
| **em300-sld** | battery, humidity, leakage_status, temperature | ... |
| **em300-th** | battery, humidity, temperature | ... |
| **em300-zld** | battery, humidity, leakage_status, temperature | ... |
| **em310-tilt** | angle_x, angle_y, angle_z, battery, initial_surface, threshold_x, threshold_y, threshold_z | angle_*_alarm_config, ... |
| **em310-udl** | battery, distance, position | distance_alarm_config, ... |
| **em320-th** | battery, humidity, temperature | ... |
| **em320-tilt** | angle_x, angle_y, angle_z, battery, initial_surface, threshold_x, threshold_y, threshold_z | ... |
| **em400-mud** | battery, distance, people_existing_height, temperature, temperature_alarm, install_height | distance_alarm, working_mode, ... |
| **em400-tld** | battery, distance, people_existing_height, temperature, temperature_alarm, install_height | (em400-mud ile benzer) |
| **em400-udl** | battery, distance, people_existing_height, temperature, temperature_alarm | install_height_enable, ... |
| **em410-rdl** | alarm_counts, battery, distance, event, radar_signal_rssi, signal_quality, temperature | distance_alarm_config, distance_mutation_alarm_config, distance_mode, ... |
| **em500-co2** | battery, co2, humidity, pressure, temperature, temperature_mutation, temperature_alarm | co2_alarm_config, temperature_mutation_alarm_config, ... |
| **em500-lgt** | battery, illumination | illuminance_alarm_config, illuminance_calibration_settings, ... |
| **em500-pp** | battery, pressure | pressure_alarm_config, ... |
| **em500-pt100** | battery, temperature, temperature_mutation, temperature_alarm | measuring_equipment, ... |
| **em500-smtc** | battery, electricity, moisture, temperature, temperature_mutation, temperature_alarm | electricity_error, moisture_error, temperature_error, sensor_*_enable, ... |
| **em500-swl** | battery, depth, depth_error | depth_alarm_config, measuring_equipment, ... |
| **em500-udl** | battery, distance, distance_mutation, distance_alarm | distance_alarm_config, ... |

### FT Series (Konum)

| Model | Telemetri | Diğer |
|-------|-----------|--------|
| **ft101** | latitude, longitude, rssi, sf, snr, tx_power | device_status, firmware_version, ... |

### GS Series (Gaz / Hava Kalitesi)

| Model | Telemetri | Diğer |
|-------|-----------|--------|
| **gs101** | alarm, gas_status, life_remain, relay_output_status, valve_status | buzzer_enable, led_indicator_enable, ... |
| **gs301** | battery, h2s, humidity, nh3, temperature | h2s_sensor_status, nh3_sensor_status, ... |
| **gs524n** | battery, concentration, temperature | event, protocol, type, version |
| **gs601** | battery, humidity, occupancy_status, pm1_0, pm2_5, pm10, temperature, tvoc, vaping_index | tamper_status, tamper_status_alarm, tvoc_raw_data_1..11, pm_sensor_working_time, ... |

### TS Series (Sıcaklık)

| Model | Telemetri | Diğer |
|-------|-----------|--------|
| **ts101** | battery, temperature, temperature_alarm, temperature_mutation | ... |
| **ts201** | battery, temperature, temperature_mutation | humidity_calibration_settings, ... |
| **ts201-v2** | battery, humidity, temperature, temperature_mutation | ... |
| **ts301** | battery, magnet, magnet_throttle, temperature, temperature_alarm, temperature_mutation | ... |
| **ts302** | battery, magnet_chn1, magnet_chn2, magnet_throttle, temperature_chn1, temperature_chn2, temperature_chn1_mutation, temperature_chn2_mutation | temperature_chn*_alarm, ... |

### UC Series (Modbus / GPIO / Basınç / Vana)

| Model | Telemetri | Diğer |
|-------|-----------|--------|
| **uc11-n1** | adc_1, adc_1_avg, adc_1_max, adc_1_min, adc_2, adc_2_avg, adc_2_max, adc_2_min, battery, gpio_1, gpio_2, gpio_counter | ... |
| **uc11-t1** | battery, humidity, temperature | ... |
| **uc11xx** | adc_1..2, adc_*_avg/max/min, gpio_counter_1..2, gpio_input_1..2, gpio_output_1..2 | ... |
| **uc521** | battery, valve_1, valve_2, valve_1_pulse, valve_2_pulse, valve_1_result, valve_2_result | pressure, pressure_calibration_settings, ... |
| **uc511** | battery, gpio_1, gpio_2, pressure, valve_1, valve_2, valve_*_pulse, valve_*_result | ... |
| **uc512** | battery, gpio_1, gpio_2, pressure, valve_1, valve_2, valve_*_pulse, valve_*_result | ... |

### VS Series (İnsan Sayacı / Akış)

| Model | Telemetri | Diğer |
|-------|-----------|--------|
| **vs121** | a_to_a..d_to_d, dwell_time_avg, dwell_time_max, line_in, line_out, people_count_all, people_in, people_out, people_count_max, people_total_in, people_total_out, region_1_count..region_16_count, region_count | detect_region_config, periodic_report_scheme, ... |
| **vs132** | total_counter_in, total_counter_out, periodic_counter_in, periodic_counter_out | ... |
| **vs133** | region_1_count..region_4_count, region_*_child_count | ... |
| **vs135** | region_1_count..region_4_count, region_*_child_count | ... |
| **vs321** | battery, humidity, humidity_alarm, people_total_counts, temperature, temperature_alarm | illuminance_status, detection_status, ... |
| **vs330** | battery, distance, human_exist_height, occupancy | calibration_status, ... |
| **vs340** | battery, occupancy | thermopile_negative_threshold, vacancy_reporting_interval, ... |
| **vs341** | battery, occupancy | (vs340 ile benzer) |
| **vs350** | battery, period_in, period_out, temperature, temperature_alarm, total_in, total_out | total_count_alarm, period_count_alarm, ... |
| **vs351** | battery, period_in, period_out, temperature, temperature_alarm, total_in, total_out | power_status, ... |
| **vs360** | battery_main, battery_node, period_in, period_out, total_in, total_out | counting_mode, ... |
| **vs370** | battery, illuminance, occupancy | pir_*, radar_sensitivity, ... |
| **vs373** | region_1_occupancy..region_4_occupancy, region_*_out_of_bed_time, respiratory_rate, respiratory_status | detection_status, fall_detection_settings, ... |

### WS Series (Kapı/Pencere / Anahtar / Güç)

| Model | Telemetri | Diğer |
|-------|-----------|--------|
| **ws101** | battery, button_event | ... |
| **ws136** | battery | ... |
| **ws156** | battery | ... |
| **ws201** | battery, depth, distance, remaining, remaining_alarm_config | ... |
| **ws202** | battery, daylight, pir | light_alarm_config, ... |
| **ws203** | battery, humidity, occupancy, temperature, temperature_alarm | ... |
| **ws301** | battery, magnet_status, tamper_status | ... |
| **ws302** | battery | frequency_weighting_type, time_weighting_type, ... |
| **ws303** | battery, leakage_status | ... |
| **ws501** | switch_1, switch_1_change | ... |
| **ws501-cn** | switch_1, switch_1_change, frame_count | ... |
| **ws501-eu** | active_power, current, power_consumption, power_factor, voltage, switch_1, switch_1_change | ... |
| **ws501-us** | active_power, current, power_consumption, power_factor, voltage, switch_1, switch_1_change | ... |
| **ws502** | switch_1, switch_2, switch_*_change | ... |
| **ws502-cn** | switch_1, switch_2, switch_*_change, frame_count | ... |
| **ws502-eu** | active_power, current, power_consumption, power_factor, voltage, switch_1, switch_2 | ... |
| **ws503** | switch_1..3, switch_*_change | ... |
| **ws503-cn** | switch_1..3, switch_*_change, frame_count | ... |
| **ws513** | active_power, current, power_consumption, power_factor, socket_status, temperature, temperature_mutation, voltage | ... |
| **ws515** | active_power, current, power_consumption, power_factor, socket_status, temperature, temperature_mutation, voltage | ... |
| **ws523** | active_power, current, power_consumption, power_factor, socket_status, voltage | ... |
| **ws525** | active_power, current, power_consumption, power_factor, socket_status, voltage | ... |
| **ws558** | active_power, power_consumption, power_factor, total_current, voltage | ... |

### WT Series (Termostat / Vana)

| Model | Telemetri | Diğer |
|-------|-----------|--------|
| **wt101** | battery, effective_stroke, motor_position, motor_stroke, target_temperature, temperature, valve_opening, tamper_status, window_detection | ... |
| **wt201** | humidity, target_temperature, temperature, fan_status, fan_speed, outside_temperature, wires, wires_relay | ... |
| **wt201-v2** | humidity, target_temperature, target_temperature_2, target_temperature_dual, temperature, outside_temperature, fan_status, ... | ... |
| **wt301** | temperature, target_temperature, server_temperature, fan_speed | ... |
| **wt302** | temperature, target_temperature, server_temperature, fan_speed | ... |
| **wt303** | humidity, target_temperature, target_humidity_range, temperature, relay_status, valve_status | ... |
| **wt304** | humidity, target_temperature, target_humidity_range, temperature, relay_status, valve_status | ... |

### WTS Series (Hava İstasyonu)

| Model | Telemetri | Diğer |
|-------|-----------|--------|
| **wts506** | battery, humidity, pressure, rainfall_total, rainfall_counter, temperature, wind_direction, wind_speed | rainfall_alarm, wind_speed_alarm, pressure_alarm, temperature_alarm, ... |

---

## 3. Tüm Benzersiz Telemetri Anahtarları (Sayısal / Ölçülebilir)

Aşağıdakiler **entity** olarak kullanılabilecek anahtarlardır. Mevcut `ChirpstackTelemetryMapping` ile eşleştirilip genişletilebilir:

```
activity, adc_1, adc_1_avg, adc_1_max, adc_1_min, adc_2, adc_2_avg, adc_2_max, adc_2_min,
angle_x, angle_y, angle_z,
battery, battery_main, battery_node,
concentration, co2, counter, current, current_max, current_min, current_alarm, total_current,
depth, depth_error, distance, distance_mutation,
dwell_time_avg, dwell_time_max,
electricity, effective_stroke,
gpio, gpio_1, gpio_2, gpio_counter, gpio_counter_1, gpio_counter_2,
h2s, hcho, human_exist_height, humidity,
illuminance, illumination, infrared, infrared_and_visible, initial_surface,
latitude, light_level, liquid, longitude,
magnet, magnet_chn1, magnet_chn2, magnet_throttle, moisture, motor_position, motor_stroke,
nh3, o3, occupancy, people_count_all, people_count_max, people_in, people_out,
people_total_in, people_total_out, people_existing_height, people_total_counts,
period_in, period_out, pir, pm1_0, pm2_5, pm10, position, power_consumption, power_factor,
pressure, pulse, pulse_conv,
rainfall_total, rainfall_counter, region_1_count..region_16_count, region_count,
region_1_occupancy..region_4_occupancy, region_*_child_count, region_*_out_of_bed_time,
remaining, respiratory_rate, respiratory_status, rssi, sf, signal_quality, snr,
target_temperature, target_temperature_2, temperature, temperature_chn1, temperature_chn2,
temperature_mutation, temperature_chn1_mutation, temperature_chn2_mutation,
threshold_x, threshold_y, threshold_z, total_in, total_out, total_counter_in, total_counter_out,
tvoc, tx_power,
valve_opening, valve_1, valve_2, valve_1_pulse, valve_2_pulse, valve_1_result, valve_2_result,
vaping_index, voltage,
water, water_conv, wind_direction, wind_speed,
a_to_a..d_to_d, line_in, line_out,
active_power, remaining, daylight,
alarm, gas_status, life_remain, relay_output_status, relay_status, valve_status,
leakage_status, socket_status, switch_1, switch_2, switch_3, switch_*_change,
fan_speed, server_temperature, outside_temperature,
frame_count, detect, detection_status, install_height, radar_signal_rssi, event
```

---

## 4. ChirpstackTelemetryMapping ile Eşleme

- **Mevcut:** temperature, humidity, co2, pressure, battery, pm25, pm10, luminosity, voltage, rssi, snr, margin.
- **Eklenecek (SensorDecoders):** Yukarıdaki listeden **sayısal** olan tüm telemetri anahtarları `ChirpstackTelemetryMapping.ALL` içine `Spec.of(entityId, displayName, unit, ...aliases)` ile eklenmeli.
- **Aliases:** Decoder çıktısındaki isimler (örn. `pm2_5`, `light_level`, `people_count_all`) alias olarak verilmeli; büyük/küçük harf duyarsız eşleme zaten yapılıyor.

Bu rapor, **uygulama planı** ve **test planı** ile birlikte `ChirpstackTelemetryMapping` ve webhook tarafındaki güncellemelerde referans alınabilir.

---

## 5. Kaynak Dosyalar

- **SensorDecoders-main:** `SensorDecoders-main/**/*-decoder.js` (111 decoder).
- **Çıkarılan veri:** `sensor-telemetry-raw.txt` (decoder dosyası → `decoded.<key>` satırları), `sensor-keys-per-model.txt` (model → tab-separated keys). Bu dosyalar `beaver` workspace içinde üretilmiştir.
