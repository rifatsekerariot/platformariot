package com.milesight.beaveriot.alarm.model.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlarmRuleResponse {

    private Long id;

    private String name;

    @JsonProperty("device_ids")
    private List<Long> deviceIds;

    @JsonProperty("device_names")
    private List<String> deviceNames;

    @JsonProperty("entity_key")
    private String entityKey;

    @JsonProperty("condition_op")
    private String conditionOp;

    @JsonProperty("condition_value")
    private String conditionValue;

    @JsonProperty("action_raise_alarm")
    private Boolean actionRaiseAlarm;

    @JsonProperty("action_notify_email")
    private Boolean actionNotifyEmail;

    @JsonProperty("action_notify_webhook")
    private Boolean actionNotifyWebhook;

    private Boolean enabled;
}
