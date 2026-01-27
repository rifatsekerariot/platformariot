package com.milesight.beaveriot.integrations.chirpstack.service;

import com.milesight.beaveriot.context.api.DeviceServiceProvider;
import com.milesight.beaveriot.context.integration.enums.AccessMod;
import com.milesight.beaveriot.context.integration.enums.EntityValueType;
import com.milesight.beaveriot.context.integration.model.AttributeBuilder;
import com.milesight.beaveriot.context.integration.model.Device;
import com.milesight.beaveriot.context.integration.model.DeviceBuilder;
import com.milesight.beaveriot.context.integration.model.Entity;
import com.milesight.beaveriot.context.integration.model.EntityBuilder;
import com.milesight.beaveriot.context.integration.model.event.ExchangeEvent;
import com.milesight.beaveriot.integrations.chirpstack.config.ChirpstackSensorModelMapping;
import com.milesight.beaveriot.integrations.chirpstack.config.ChirpstackTelemetryMapping;
import com.milesight.beaveriot.integrations.chirpstack.constant.ChirpstackConstants;
import com.milesight.beaveriot.integrations.chirpstack.entity.ChirpstackIntegrationEntities;
import com.milesight.beaveriot.eventbus.annotations.EventSubscribe;
import com.milesight.beaveriot.eventbus.api.Event;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Handles add/delete device from Beaver UI (Device → Add → ChirpStack HTTP).
 * Add: creates a device with identifier = devEui so webhook can find it via
 * findByIdentifier(devEui, INTEGRATION_ID).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChirpstackDeviceService {

    private final DeviceServiceProvider deviceServiceProvider;

    @EventSubscribe(payloadKeyExpression = ChirpstackConstants.INTEGRATION_ID + ".integration.add_device.*", eventType = ExchangeEvent.EventType.CALL_SERVICE)
    public void onAddDevice(Event<ChirpstackIntegrationEntities.AddDevice> event) {
        ChirpstackIntegrationEntities.AddDevice addDevice = event.getPayload();
        String deviceName = addDevice.getAddDeviceName();
        String devEui = addDevice.getDevEui();
        if (!StringUtils.hasText(devEui)) {
            log.warn("ChirpStack add_device: devEui is required");
            throw new IllegalArgumentException("External Device ID (DevEUI) is required");
        }
        devEui = devEui.trim();
        String sensorModel = StringUtils.hasText(addDevice.getSensorModel()) ? addDevice.getSensorModel().trim() : null;
        Set<String> allowedEntityIds = null;
        if (sensorModel != null && ChirpstackSensorModelMapping.hasModel(sensorModel)) {
            allowedEntityIds = ChirpstackSensorModelMapping.getEntityIdsForModel(sensorModel).stream().collect(Collectors.toSet());
        }
        List<Entity> entities = new ArrayList<>();
        for (ChirpstackTelemetryMapping.Spec spec : ChirpstackTelemetryMapping.ALL) {
            if (allowedEntityIds != null && !allowedEntityIds.contains(spec.getEntityId())) {
                continue;
            }
            Entity e = new EntityBuilder(ChirpstackConstants.INTEGRATION_ID)
                    .identifier(spec.getEntityId())
                    .property(spec.getDisplayName(), AccessMod.R)
                    .valueType(EntityValueType.DOUBLE)
                    .attributes(new AttributeBuilder().unit(spec.getUnit()).build())
                    .build();
            entities.add(e);
        }
        DeviceBuilder builder = new DeviceBuilder(ChirpstackConstants.INTEGRATION_ID)
                .name(deviceName != null ? deviceName : devEui)
                .identifier(devEui)
                .entities(entities);
        if (sensorModel != null && allowedEntityIds != null) {
            builder = builder.additional(Map.of(ChirpstackConstants.DEVICE_ADDITIONAL_SENSOR_MODEL, sensorModel));
        }
        Device device = builder.build();
        deviceServiceProvider.save(device);
        log.info("ChirpStack add_device: created device name={} devEui={} sensorModel={}", device.getName(), devEui, sensorModel);
    }

    @EventSubscribe(payloadKeyExpression = ChirpstackConstants.INTEGRATION_ID + ".integration.delete_device", eventType = ExchangeEvent.EventType.CALL_SERVICE)
    public void onDeleteDevice(Event<ChirpstackIntegrationEntities.DeleteDevice> event) {
        Device device = event.getPayload().getDeletedDevice();
        if (device != null) {
            deviceServiceProvider.deleteById(device.getId());
            log.info("ChirpStack delete_device: deleted device id={} identifier={}", device.getId(), device.getIdentifier());
        }
    }
}
