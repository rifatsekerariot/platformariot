package com.milesight.beaveriot.integrations.chirpstack.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * ChirpStack join event (event=join).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class JoinEvent {

    @JsonProperty("deduplicationId")
    private String deduplicationId;

    @JsonProperty("time")
    private String time;

    @JsonProperty("deviceInfo")
    private DeviceInfo deviceInfo;

    @JsonProperty("devAddr")
    private String devAddr;
}
