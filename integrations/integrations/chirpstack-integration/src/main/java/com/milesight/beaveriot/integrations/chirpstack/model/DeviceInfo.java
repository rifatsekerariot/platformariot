package com.milesight.beaveriot.integrations.chirpstack.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

/**
 * ChirpStack deviceInfo – matches integration events JSON.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeviceInfo {

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("tenantName")
    private String tenantName;

    @JsonProperty("applicationId")
    private String applicationId;

    @JsonProperty("applicationName")
    private String applicationName;

    @JsonProperty("deviceProfileId")
    private String deviceProfileId;

    @JsonProperty("deviceProfileName")
    private String deviceProfileName;

    @JsonProperty("deviceName")
    private String deviceName;

    @JsonProperty("devEui")
    private String devEui;

    @JsonProperty("tags")
    private Map<String, String> tags;
}
