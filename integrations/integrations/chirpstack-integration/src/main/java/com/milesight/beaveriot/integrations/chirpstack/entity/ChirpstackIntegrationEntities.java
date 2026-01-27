package com.milesight.beaveriot.integrations.chirpstack.entity;

import com.milesight.beaveriot.context.integration.context.AddDeviceAware;
import com.milesight.beaveriot.context.integration.context.DeleteDeviceAware;
import com.milesight.beaveriot.context.integration.entity.annotation.Attribute;
import com.milesight.beaveriot.context.integration.entity.annotation.Entities;
import com.milesight.beaveriot.context.integration.entity.annotation.Entity;
import com.milesight.beaveriot.context.integration.entity.annotation.IntegrationEntities;
import com.milesight.beaveriot.context.integration.enums.EntityType;
import com.milesight.beaveriot.context.integration.model.ExchangePayload;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * ChirpStack HTTP integration entities. add_device defines the form for adding
 * devices in Beaver UI (Device → Add → ChirpStack HTTP). devEui must match
 * the LoRaWAN DevEUI sent by ChirpStack webhook (e.g. 0101010101010101).
 */
@Data
@EqualsAndHashCode(callSuper = true)
@IntegrationEntities
public class ChirpstackIntegrationEntities extends ExchangePayload {

    @Entity(type = EntityType.SERVICE, name = "Add Device", identifier = "add_device")
    private AddDevice addDevice;

    @Entity(type = EntityType.SERVICE, name = "Delete Device", identifier = "delete_device")
    private DeleteDevice deleteDevice;

    @Data
    @EqualsAndHashCode(callSuper = true)
    @Entities
    public static class AddDevice extends ExchangePayload implements AddDeviceAware {
        /** LoRaWAN DevEUI (16 hex chars). Must match ChirpStack webhook payload. */
        @Entity(name = "External Device ID (DevEUI)", identifier = "dev_eui", attributes = @Attribute(maxLength = 32))
        private String devEui;

        /** Optional sensor model (e.g. am102, em500-udl, vs121). When set, only that model's telemetry entities are created. */
        @Entity(name = "Sensor model", identifier = "sensor_model", attributes = @Attribute(optional = true, maxLength = 64))
        private String sensorModel;
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    @Entities
    public static class DeleteDevice extends ExchangePayload implements DeleteDeviceAware {
    }
}
