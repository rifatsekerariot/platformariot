package com.milesight.beaveriot.alarm.model.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AlarmClaimRequest {

    @NotNull
    @JsonProperty("device_id")
    private Long deviceId;
}
