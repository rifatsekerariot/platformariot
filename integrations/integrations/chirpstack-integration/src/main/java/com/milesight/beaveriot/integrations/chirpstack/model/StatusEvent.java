package com.milesight.beaveriot.integrations.chirpstack.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * ChirpStack status event (event=status) – battery/margin.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class StatusEvent {

    @JsonProperty("deduplicationId")
    private String deduplicationId;

    @JsonProperty("time")
    private String time;

    @JsonProperty("deviceInfo")
    private DeviceInfo deviceInfo;

    @JsonProperty("margin")
    private Integer margin;

    @JsonProperty("batteryLevel")
    private Float batteryLevel;

    @JsonProperty("batteryLevelUnavailable")
    private Boolean batteryLevelUnavailable;

    @JsonProperty("externalPowerSource")
    private Boolean externalPowerSource;
}
