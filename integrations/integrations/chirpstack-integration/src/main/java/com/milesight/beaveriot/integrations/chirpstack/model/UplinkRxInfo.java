package com.milesight.beaveriot.integrations.chirpstack.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * ChirpStack uplink rxInfo element.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UplinkRxInfo {

    @JsonProperty("gatewayId")
    private String gatewayId;

    @JsonProperty("uplinkId")
    private Long uplinkId;

    @JsonProperty("rssi")
    private Integer rssi;

    @JsonProperty("snr")
    private Double snr;

    @JsonProperty("context")
    private String context;
}
