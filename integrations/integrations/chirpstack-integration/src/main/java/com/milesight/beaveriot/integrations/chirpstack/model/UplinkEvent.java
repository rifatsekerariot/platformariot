package com.milesight.beaveriot.integrations.chirpstack.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

import java.util.List;

/**
 * ChirpStack uplink event (event=up) – JSON mapping.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UplinkEvent {

    @JsonProperty("deduplicationId")
    private String deduplicationId;

    @JsonProperty("time")
    private String time;

    @JsonProperty("deviceInfo")
    private DeviceInfo deviceInfo;

    @JsonProperty("devAddr")
    private String devAddr;

    @JsonProperty("dr")
    private Integer dr;

    @JsonProperty("fPort")
    private Integer fPort;

    @JsonProperty("data")
    private String data; // base64

    /**
     * Decoded payload when ChirpStack payload codec is used (e.g. {"temperature": 23.5, "humidity": 65}).
     * Optional; if absent, sensor values are not updated.
     */
    @JsonProperty("object")
    private JsonNode object;

    @JsonProperty("rxInfo")
    private List<UplinkRxInfo> rxInfo;

    @JsonProperty("txInfo")
    private Object txInfo; // optional, structure varies
}
