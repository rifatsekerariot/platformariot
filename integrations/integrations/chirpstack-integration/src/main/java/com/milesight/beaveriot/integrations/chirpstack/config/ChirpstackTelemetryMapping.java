package com.milesight.beaveriot.integrations.chirpstack.config;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * Defines supported telemetry types and their payload key aliases.
 * Includes SensorDecoders-derived telemetries; device entities and
 * uplink mapping are derived from this list.
 */
public final class ChirpstackTelemetryMapping {

    private ChirpstackTelemetryMapping() {
    }

    @Getter
    @AllArgsConstructor
    public static class Spec {
        private final String entityId;
        private final String displayName;
        private final String unit;
        private final List<String> payloadKeyAliases;

        public static Spec of(String entityId, String displayName, String unit, String... aliases) {
            return new Spec(entityId, displayName, unit, List.of(aliases));
        }
    }

    /** All supported telemetry specs. Order defines entity creation order. */
    public static final List<Spec> ALL = List.of(
            Spec.of("temperature", "Temperature", "\u00b0C", "temperature", "temp", "tmp"),
            Spec.of("humidity", "Humidity", "%", "humidity", "hum", "rh"),
            Spec.of("co2", "CO2", "ppm", "co2", "carbonDioxide", "carbon_dioxide"),
            Spec.of("pressure", "Pressure", "hPa", "pressure", "barometricPressure", "barometric_pressure", "press"),
            Spec.of("battery", "Battery", "%", "battery", "batteryLevel", "battery_level", "bat", "batt"),
            Spec.of("pm25", "PM2.5", "\u00b5g/m\u00b3", "pm25", "pm2_5", "pm2.5"),
            Spec.of("pm10", "PM10", "\u00b5g/m\u00b3", "pm10"),
            Spec.of("pm1_0", "PM1.0", "\u00b5g/m\u00b3", "pm1_0", "pm1.0"),
            Spec.of("luminosity", "Luminosity", "lux", "luminosity", "light", "lux", "illuminance", "illumination"),
            Spec.of("voltage", "Voltage", "V", "voltage", "volt", "v"),
            Spec.of("rssi", "RSSI", "dBm", "rssi"),
            Spec.of("snr", "SNR", "dB", "snr"),
            Spec.of("margin", "Margin", "dB", "margin"),
            Spec.of("activity", "Activity", "", "activity"),
            Spec.of("illumination", "Illumination", "lux", "illumination", "illuminance"),
            Spec.of("infrared", "Infrared", "", "infrared"),
            Spec.of("infrared_and_visible", "Infrared and visible", "", "infrared_and_visible"),
            Spec.of("light_level", "Light level", "", "light_level"),
            Spec.of("latitude", "Latitude", "", "latitude", "lat"),
            Spec.of("longitude", "Longitude", "", "longitude", "lng", "lon"),
            Spec.of("distance", "Distance", "mm", "distance"),
            Spec.of("distance_mutation", "Distance mutation", "mm", "distance_mutation"),
            Spec.of("current", "Current", "A", "current"),
            Spec.of("current_max", "Current max", "A", "current_max"),
            Spec.of("current_min", "Current min", "A", "current_min"),
            Spec.of("total_current", "Total current", "A", "total_current"),
            Spec.of("tvoc", "TVOC", "ppb", "tvoc"),
            Spec.of("hcho", "HCHO", "mg/m\u00b3", "hcho"),
            Spec.of("o3", "O3", "ppm", "o3"),
            Spec.of("water", "Water", "m\u00b3", "water"),
            Spec.of("water_conv", "Water conversion", "", "water_conv"),
            Spec.of("pulse", "Pulse", "", "pulse"),
            Spec.of("pulse_conv", "Pulse conversion", "", "pulse_conv"),
            Spec.of("valve_opening", "Valve opening", "%", "valve_opening"),
            Spec.of("target_temperature", "Target temperature", "\u00b0C", "target_temperature"),
            Spec.of("people_count_all", "People count all", "", "people_count_all"),
            Spec.of("people_in", "People in", "", "people_in"),
            Spec.of("people_out", "People out", "", "people_out"),
            Spec.of("people_count_max", "People count max", "", "people_count_max"),
            Spec.of("people_total_in", "People total in", "", "people_total_in"),
            Spec.of("people_total_out", "People total out", "", "people_total_out"),
            Spec.of("people_total_counts", "People total counts", "", "people_total_counts"),
            Spec.of("dwell_time_avg", "Dwell time avg", "s", "dwell_time_avg"),
            Spec.of("dwell_time_max", "Dwell time max", "s", "dwell_time_max"),
            Spec.of("line_in", "Line in", "", "line_in"),
            Spec.of("line_out", "Line out", "", "line_out"),
            Spec.of("wind_speed", "Wind speed", "m/s", "wind_speed"),
            Spec.of("wind_direction", "Wind direction", "\u00b0", "wind_direction"),
            Spec.of("rainfall_total", "Rainfall total", "mm", "rainfall_total"),
            Spec.of("rainfall_counter", "Rainfall counter", "", "rainfall_counter"),
            Spec.of("angle_x", "Angle X", "\u00b0", "angle_x"),
            Spec.of("angle_y", "Angle Y", "\u00b0", "angle_y"),
            Spec.of("angle_z", "Angle Z", "\u00b0", "angle_z"),
            Spec.of("gpio", "GPIO", "", "gpio"),
            Spec.of("gpio_counter_1", "GPIO counter 1", "", "gpio_counter_1"),
            Spec.of("gpio_counter_2", "GPIO counter 2", "", "gpio_counter_2"),
            Spec.of("adc_1", "ADC 1", "", "adc_1"),
            Spec.of("adc_2", "ADC 2", "", "adc_2"),
            Spec.of("magnet", "Magnet", "", "magnet"),
            Spec.of("liquid", "Liquid", "", "liquid"),
            Spec.of("depth", "Depth", "mm", "depth"),
            Spec.of("occupancy", "Occupancy", "", "occupancy"),
            Spec.of("people_existing_height", "People existing height", "mm", "people_existing_height"),
            Spec.of("counter", "Counter", "", "counter"),
            Spec.of("total_counter_in", "Total counter in", "", "total_counter_in"),
            Spec.of("total_counter_out", "Total counter out", "", "total_counter_out"),
            Spec.of("periodic_counter_in", "Periodic counter in", "", "periodic_counter_in"),
            Spec.of("periodic_counter_out", "Periodic counter out", "", "periodic_counter_out"),
            Spec.of("temperature_mutation", "Temperature mutation", "\u00b0C", "temperature_mutation"),
            Spec.of("region_1_count", "Region 1 count", "", "region_1_count"),
            Spec.of("region_2_count", "Region 2 count", "", "region_2_count"),
            Spec.of("region_3_count", "Region 3 count", "", "region_3_count"),
            Spec.of("region_4_count", "Region 4 count", "", "region_4_count"),
            Spec.of("region_5_count", "Region 5 count", "", "region_5_count"),
            Spec.of("region_6_count", "Region 6 count", "", "region_6_count"),
            Spec.of("region_7_count", "Region 7 count", "", "region_7_count"),
            Spec.of("region_8_count", "Region 8 count", "", "region_8_count"),
            Spec.of("region_9_count", "Region 9 count", "", "region_9_count"),
            Spec.of("region_10_count", "Region 10 count", "", "region_10_count"),
            Spec.of("region_11_count", "Region 11 count", "", "region_11_count"),
            Spec.of("region_12_count", "Region 12 count", "", "region_12_count"),
            Spec.of("region_13_count", "Region 13 count", "", "region_13_count"),
            Spec.of("region_14_count", "Region 14 count", "", "region_14_count"),
            Spec.of("region_15_count", "Region 15 count", "", "region_15_count"),
            Spec.of("region_16_count", "Region 16 count", "", "region_16_count")
    );
}
