package com.milesight.beaveriot.integrations.chirpstack.config;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Maps SensorDecoders model IDs to entity IDs (telemetry) produced by that model.
 * Used when adding a device with a selected sensor model: only these entities are created.
 * Entity IDs must exist in {@link ChirpstackTelemetryMapping#ALL}.
 */
public final class ChirpstackSensorModelMapping {

    private ChirpstackSensorModelMapping() {
    }

    /** Key: sensor model ID (e.g. am102, em500-udl). Value: list of entity IDs. */
    private static final Map<String, List<String>> MODEL_TO_ENTITY_IDS = Map.ofEntries(
            mapEntry("am102", "battery", "humidity", "temperature"),
            mapEntry("am102l", "battery", "humidity", "temperature"),
            mapEntry("am103", "battery", "co2", "humidity", "temperature"),
            mapEntry("am103l", "battery", "co2", "humidity", "temperature"),
            mapEntry("am104", "activity", "battery", "humidity", "illumination", "infrared", "infrared_and_visible", "temperature"),
            mapEntry("am107", "activity", "battery", "co2", "humidity", "illumination", "infrared", "infrared_and_visible", "pressure", "temperature", "tvoc"),
            mapEntry("am307", "battery", "co2", "humidity", "light_level", "pressure", "temperature", "tvoc"),
            mapEntry("am307l", "battery", "co2", "humidity", "light_level", "pressure", "temperature", "tvoc"),
            mapEntry("am308", "battery", "co2", "humidity", "light_level", "pm25", "pm10", "pressure", "temperature", "tvoc"),
            mapEntry("am308l", "battery", "co2", "humidity", "light_level", "pm25", "pm10", "pressure", "temperature", "tvoc"),
            mapEntry("am319-hcho", "battery", "co2", "hcho", "humidity", "light_level", "pm25", "pm10", "pressure", "temperature", "tvoc"),
            mapEntry("am319-hcho-ir", "battery", "co2", "hcho", "humidity", "light_level", "pm25", "pm10", "pressure", "temperature", "tvoc"),
            mapEntry("am319l-hcho-ir", "battery", "co2", "hcho", "humidity", "light_level", "pm25", "pm10", "pressure", "temperature", "tvoc"),
            mapEntry("am319-o3", "battery", "co2", "humidity", "light_level", "o3", "pm25", "pm10", "pressure", "temperature", "tvoc"),
            mapEntry("am319l-o3", "battery", "co2", "humidity", "light_level", "o3", "pm25", "pm10", "pressure", "temperature", "tvoc"),
            mapEntry("at101", "battery", "latitude", "longitude", "temperature"),
            mapEntry("ct101", "current", "current_max", "current_min", "total_current", "temperature"),
            mapEntry("ct103", "current", "current_max", "current_min", "total_current", "temperature"),
            mapEntry("ct105", "current", "current_max", "current_min", "total_current", "temperature"),
            mapEntry("ct303", "temperature"),
            mapEntry("ct305", "temperature"),
            mapEntry("ct310", "temperature"),
            mapEntry("em300-th", "battery", "humidity", "temperature"),
            mapEntry("em300-di", "battery", "counter", "humidity", "pulse", "pulse_conv", "temperature", "water", "water_conv"),
            mapEntry("em300-di-hall", "battery", "counter", "pulse", "pulse_conv", "water", "water_conv"),
            mapEntry("em300-mcs", "battery", "humidity", "temperature"),
            mapEntry("em300-mld", "battery", "liquid"),
            mapEntry("em300-sld", "battery", "humidity", "liquid", "temperature"),
            mapEntry("em300-zld", "battery", "humidity", "liquid", "temperature"),
            mapEntry("em310-tilt", "angle_x", "angle_y", "angle_z", "battery"),
            mapEntry("em310-udl", "battery", "distance"),
            mapEntry("em320-th", "battery", "humidity", "temperature"),
            mapEntry("em320-tilt", "angle_x", "angle_y", "angle_z", "battery"),
            mapEntry("em400-mud", "battery", "distance", "people_existing_height", "temperature"),
            mapEntry("em400-tld", "battery", "distance", "people_existing_height", "temperature"),
            mapEntry("em400-udl", "battery", "distance", "people_existing_height", "temperature"),
            mapEntry("em500-co2", "battery", "co2", "humidity", "pressure", "temperature", "temperature_mutation"),
            mapEntry("em500-lgt", "battery", "illumination"),
            mapEntry("em500-pp", "battery", "pressure"),
            mapEntry("em500-pt100", "battery", "temperature", "temperature_mutation"),
            mapEntry("em500-udl", "battery", "distance", "distance_mutation"),
            mapEntry("em500-swl", "battery", "depth"),
            mapEntry("ft101", "latitude", "longitude", "rssi", "snr"),
            mapEntry("gs301", "battery", "humidity", "temperature"),
            mapEntry("gs524n", "battery", "concentration", "temperature"),
            mapEntry("ts101", "battery", "temperature"),
            mapEntry("ts201", "battery", "temperature"),
            mapEntry("ts201-v2", "battery", "humidity", "temperature"),
            mapEntry("ts301", "battery", "temperature"),
            mapEntry("ts302", "battery", "temperature_chn1", "temperature_chn2"),
            mapEntry("uc11-n1", "adc_1", "adc_2", "battery", "gpio_counter_1", "gpio_counter_2"),
            mapEntry("uc11-t1", "battery", "humidity", "temperature"),
            mapEntry("vs121", "people_count_all", "people_in", "people_out", "people_count_max", "people_total_in", "people_total_out",
                    "dwell_time_avg", "dwell_time_max", "line_in", "line_out",
                    "region_1_count", "region_2_count", "region_3_count", "region_4_count", "region_5_count", "region_6_count",
                    "region_7_count", "region_8_count", "region_9_count", "region_10_count", "region_11_count", "region_12_count",
                    "region_13_count", "region_14_count", "region_15_count", "region_16_count"),
            mapEntry("vs132", "total_counter_in", "total_counter_out", "periodic_counter_in", "periodic_counter_out"),
            mapEntry("vs321", "battery", "humidity", "people_total_counts", "temperature"),
            mapEntry("vs330", "battery", "distance", "occupancy"),
            mapEntry("vs350", "battery", "temperature"),
            mapEntry("vs351", "battery", "temperature"),
            mapEntry("vs370", "battery", "illumination", "occupancy"),
            mapEntry("ws201", "battery", "depth", "distance"),
            mapEntry("ws202", "battery"),
            mapEntry("ws203", "battery", "humidity", "occupancy", "temperature"),
            mapEntry("ws301", "battery"),
            mapEntry("wt101", "battery", "target_temperature", "temperature", "valve_opening"),
            mapEntry("wt201", "humidity", "target_temperature", "temperature"),
            mapEntry("wt201-v2", "humidity", "target_temperature", "target_temperature_2", "temperature"),
            mapEntry("wts506", "battery", "humidity", "pressure", "rainfall_total", "rainfall_counter", "temperature", "wind_direction", "wind_speed")
    );

    private static Map.Entry<String, List<String>> mapEntry(String model, String... entityIds) {
        return Map.entry(model, List.of(entityIds));
    }

    /**
     * Returns the list of entity IDs for the given sensor model, or empty list if unknown.
     */
    public static List<String> getEntityIdsForModel(String sensorModel) {
        if (sensorModel == null || sensorModel.isBlank()) {
            return Collections.emptyList();
        }
        return MODEL_TO_ENTITY_IDS.getOrDefault(sensorModel.trim().toLowerCase(), Collections.emptyList());
    }

    /**
     * Returns true if the given sensor model is known and has entity mapping.
     */
    public static boolean hasModel(String sensorModel) {
        return sensorModel != null && !sensorModel.isBlank()
                && MODEL_TO_ENTITY_IDS.containsKey(sensorModel.trim().toLowerCase());
    }

    /**
     * Returns all supported sensor model IDs (for UI dropdown etc.).
     */
    public static List<String> getAllModelIds() {
        return MODEL_TO_ENTITY_IDS.keySet().stream().sorted().toList();
    }
}
