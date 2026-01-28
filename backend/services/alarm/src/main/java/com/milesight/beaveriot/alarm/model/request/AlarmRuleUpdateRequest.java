package com.milesight.beaveriot.alarm.model.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AlarmRuleUpdateRequest {

    @NotBlank
    private String name;

    @NotNull
    @JsonProperty("device_ids")
    private List<Long> deviceIds = new ArrayList<>();

    @NotBlank
    @JsonProperty("entity_key")
    private String entityKey;

    @NotBlank
    @JsonProperty("condition_op")
    private String conditionOp;

    @JsonProperty("condition_value")
    private String conditionValue;

    @NotNull
    @JsonProperty("action_raise_alarm")
    private Boolean actionRaiseAlarm = true;

    @NotNull
    @JsonProperty("action_notify_email")
    private Boolean actionNotifyEmail = false;

    @NotNull
    @JsonProperty("action_notify_webhook")
    private Boolean actionNotifyWebhook = false;

    @NotNull
    private Boolean enabled = true;
}
