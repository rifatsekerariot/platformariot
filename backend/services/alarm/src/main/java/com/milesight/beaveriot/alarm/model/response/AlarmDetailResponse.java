package com.milesight.beaveriot.alarm.model.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlarmDetailResponse {

    private Long id;
    @JsonProperty("alarm_status")
    private Boolean alarmStatus;
    @JsonProperty("alarm_time")
    private Long alarmTime;
    @JsonProperty("alarm_content")
    private String alarmContent;
    private Double latitude;
    private Double longitude;
    private String address;
    @JsonProperty("device_id")
    private Long deviceId;
    @JsonProperty("device_name")
    private String deviceName;
}
