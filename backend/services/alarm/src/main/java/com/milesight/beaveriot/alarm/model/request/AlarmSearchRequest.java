package com.milesight.beaveriot.alarm.model.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AlarmSearchRequest {

    @JsonProperty("page_number")
    private Integer pageNumber = 1;
    @JsonProperty("page_size")
    private Integer pageSize = 10;

    private String keyword;
    @JsonProperty("device_ids")
    private List<Long> deviceIds = new ArrayList<>();
    @JsonProperty("start_timestamp")
    private Long startTimestamp;
    @JsonProperty("end_timestamp")
    private Long endTimestamp;
    @JsonProperty("alarm_status")
    private List<Boolean> alarmStatus = new ArrayList<>();
    private String timezone;
}
