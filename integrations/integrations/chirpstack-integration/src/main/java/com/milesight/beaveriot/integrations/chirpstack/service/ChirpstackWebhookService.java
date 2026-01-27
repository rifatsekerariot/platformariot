package com.milesight.beaveriot.integrations.chirpstack.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.milesight.beaveriot.context.api.DeviceServiceProvider;
import com.milesight.beaveriot.context.api.DeviceStatusServiceProvider;
import com.milesight.beaveriot.context.api.EntityValueServiceProvider;
import com.milesight.beaveriot.context.integration.model.Device;
import com.milesight.beaveriot.context.integration.model.ExchangePayload;
import com.milesight.beaveriot.integrations.chirpstack.config.ChirpstackSensorModelMapping;
import com.milesight.beaveriot.integrations.chirpstack.config.ChirpstackTelemetryMapping;
import com.milesight.beaveriot.integrations.chirpstack.constant.ChirpstackConstants;
import com.milesight.beaveriot.integrations.chirpstack.model.JoinEvent;
import com.milesight.beaveriot.integrations.chirpstack.model.StatusEvent;
import com.milesight.beaveriot.integrations.chirpstack.model.UplinkEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Handles ChirpStack HTTP integration events. No token or password validation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChirpstackWebhookService {

    private final ObjectMapper objectMapper;
    private final DeviceServiceProvider deviceServiceProvider;
    private final DeviceStatusServiceProvider deviceStatusServiceProvider;
    private final EntityValueServiceProvider entityValueServiceProvider;

    public void handle(String event, JsonNode body) {
        if (event == null || event.isBlank()) {
            log.warn("ChirpStack webhook: missing event");
            return;
        }
        switch (event.toLowerCase()) {
            case "up" -> handleUplink(body);
            case "join" -> handleJoin(body);
            case "status" -> handleStatus(body);
            case "ack", "txack", "log", "location", "integration" -> log.debug("ChirpStack webhook: event={} (logged only)", event);
            default -> log.debug("ChirpStack webhook: unknown event={}", event);
        }
    }

    private void handleUplink(JsonNode body) {
        UplinkEvent evt;
        try {
            evt = objectMapper.treeToValue(body, UplinkEvent.class);
        } catch (Exception e) {
            log.error("ChirpStack webhook: failed to parse uplink event", e);
            return;
        }
        if (evt == null || evt.getDeviceInfo() == null) {
            log.warn("ChirpStack webhook: uplink missing deviceInfo");
            return;
        }
        String devEui = evt.getDeviceInfo().getDevEui();
        if (devEui == null || devEui.isBlank()) {
            log.warn("ChirpStack webhook: uplink missing devEui");
            return;
        }
        var device = deviceServiceProvider.findByIdentifier(devEui, ChirpstackConstants.INTEGRATION_ID);
        if (device == null) {
            log.debug("ChirpStack webhook: device not found for devEui={}, skip", devEui);
            return;
        }
        deviceStatusServiceProvider.online(device);
        int fPort = evt.getFPort() != null ? evt.getFPort() : 0;
        Integer rssi = null;
        Double snr = null;
        if (evt.getRxInfo() != null && !evt.getRxInfo().isEmpty()) {
            var rx = evt.getRxInfo().get(0);
            rssi = rx.getRssi();
            snr = rx.getSnr();
        }
        log.debug("ChirpStack uplink: devEui={}, fPort={}, rssi={}, snr={}", devEui, fPort, rssi, snr);

        // Collect all entity values to save (from decoded payload + rxInfo)
        Map<String, Object> toSave = new HashMap<>();
        
        // Parse decoded payload (sensor data)
        JsonNode decoded = evt.getObject();
        if (decoded == null && evt.getData() != null && !evt.getData().isBlank()) {
            decoded = tryDecodeDataAsJson(evt.getData());
        }
        if (decoded != null && decoded.isObject()) {
            Map<String, Object> sensorValues = mapSensorPayloadToEntityValues(decoded);
            toSave.putAll(sensorValues);
        }
        
        // Add RSSI and SNR from rxInfo (if available)
        if (rssi != null) {
            toSave.put("rssi", rssi.doubleValue());
        }
        if (snr != null) {
            toSave.put("snr", snr);
        }
        
        // Save all entity values
        if (!toSave.isEmpty()) {
            String deviceKey = device.getKey();
            Map<String, Object> payload = new HashMap<>();
            for (Map.Entry<String, Object> e : toSave.entrySet()) {
                payload.put(deviceKey + "." + e.getKey(), e.getValue());
            }
            entityValueServiceProvider.saveValuesAndPublishAsync(ExchangePayload.create(payload));
            log.debug("ChirpStack uplink: saved entity values devEui={} keys={}", devEui, toSave.keySet());
        }
    }

    private JsonNode tryDecodeDataAsJson(String base64) {
        try {
            byte[] bytes = Base64.getDecoder().decode(base64.trim());
            if (bytes == null || bytes.length == 0) return null;
            String json = new String(bytes, StandardCharsets.UTF_8);
            return objectMapper.readTree(json);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Map decoded payload keys to entity identifiers and numeric values.
     * Uses {@link ChirpstackTelemetryMapping#ALL}; supports many telemetry types
     * (temperature, humidity, co2, pressure, battery, pm25, pm10, luminosity, etc.)
     * and multiple key aliases per type. Case-insensitive key matching.
     * Handles flat numbers or {"value": number} nested objects.
     */
    private Map<String, Object> mapSensorPayloadToEntityValues(JsonNode obj) {
        Map<String, Object> out = new HashMap<>();
        if (obj == null || !obj.isObject()) return out;
        for (ChirpstackTelemetryMapping.Spec spec : ChirpstackTelemetryMapping.ALL) {
            Double v = extractNumberCaseInsensitive(obj, spec.getPayloadKeyAliases());
            if (v != null) out.put(spec.getEntityId(), v);
        }
        return out;
    }

    private Double extractNumberCaseInsensitive(JsonNode obj, List<String> aliases) {
        Iterator<String> it = obj.fieldNames();
        while (it.hasNext()) {
            String key = it.next();
            String keyLower = key.toLowerCase();
            for (String a : aliases) {
                if (a != null && keyLower.equals(a.toLowerCase())) {
                    Double v = extractNumberFromNode(obj.get(key));
                    if (v != null) return v;
                    break;
                }
            }
        }
        return null;
    }

    private Double extractNumberFromNode(JsonNode n) {
        if (n == null) return null;
        if (n.isNumber()) return n.asDouble();
        if (n.isObject() && n.has("value")) {
            JsonNode v = n.get("value");
            if (v != null && v.isNumber()) return v.asDouble();
        }
        return null;
    }

    /**
     * When device has sensorModel in additional, retain only entity keys allowed for that model.
     * Modifies toSave in place by removing disallowed keys.
     */
    private void filterToSaveBySensorModel(Device device, Map<String, Object> toSave) {
        if (device.getAdditional() == null) return;
        Object sm = device.getAdditional().get(ChirpstackConstants.DEVICE_ADDITIONAL_SENSOR_MODEL);
        if (!(sm instanceof String) || ((String) sm).isBlank()) return;
        String sensorModel = ((String) sm).trim();
        if (!ChirpstackSensorModelMapping.hasModel(sensorModel)) return;
        Set<String> allowed = ChirpstackSensorModelMapping.getEntityIdsForModel(sensorModel).stream().collect(Collectors.toSet());
        toSave.keySet().retainAll(allowed);
    }

    private void handleJoin(JsonNode body) {
        JoinEvent evt;
        try {
            evt = objectMapper.treeToValue(body, JoinEvent.class);
        } catch (Exception e) {
            log.error("ChirpStack webhook: failed to parse join event", e);
            return;
        }
        if (evt != null && evt.getDeviceInfo() != null) {
            log.info("ChirpStack join: devEui={}, devAddr={}", evt.getDeviceInfo().getDevEui(), evt.getDevAddr());
        }
    }

    private void handleStatus(JsonNode body) {
        StatusEvent evt;
        try {
            evt = objectMapper.treeToValue(body, StatusEvent.class);
        } catch (Exception e) {
            log.error("ChirpStack webhook: failed to parse status event", e);
            return;
        }
        if (evt == null || evt.getDeviceInfo() == null) {
            log.warn("ChirpStack webhook: status missing deviceInfo");
            return;
        }
        String devEui = evt.getDeviceInfo().getDevEui();
        if (devEui == null || devEui.isBlank()) {
            log.warn("ChirpStack webhook: status missing devEui");
            return;
        }
        var device = deviceServiceProvider.findByIdentifier(devEui, ChirpstackConstants.INTEGRATION_ID);
        if (device == null) {
            log.debug("ChirpStack webhook: device not found for status devEui={}, skip", devEui);
            return;
        }
        deviceStatusServiceProvider.online(device);

        Map<String, Object> toSave = new HashMap<>();
        if (evt.getBatteryLevel() != null && !Boolean.TRUE.equals(evt.getBatteryLevelUnavailable())) {
            toSave.put("battery", evt.getBatteryLevel().doubleValue());
        }
        if (evt.getMargin() != null) {
            toSave.put("margin", evt.getMargin().doubleValue());
        }

        filterToSaveBySensorModel(device, toSave);

        if (!toSave.isEmpty()) {
            String deviceKey = device.getKey();
            Map<String, Object> payload = new HashMap<>();
            for (Map.Entry<String, Object> e : toSave.entrySet()) {
                payload.put(deviceKey + "." + e.getKey(), e.getValue());
            }
            entityValueServiceProvider.saveValuesAndPublishAsync(ExchangePayload.create(payload));
            log.debug("ChirpStack status: saved entity values devEui={} keys={}", devEui, toSave.keySet());
        } else {
            log.debug("ChirpStack status: devEui={}, margin={}, batteryLevel={} (no values to save)",
                    devEui, evt.getMargin(), evt.getBatteryLevel());
        }
    }
}
