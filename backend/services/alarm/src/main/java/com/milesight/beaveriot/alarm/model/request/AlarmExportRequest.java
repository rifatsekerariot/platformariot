package com.milesight.beaveriot.alarm.model.request;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AlarmExportRequest {

    private String keyword;
    private List<Long> deviceIds = new ArrayList<>();
    private Long startTimestamp;
    private Long endTimestamp;
    private List<Boolean> alarmStatus = new ArrayList<>();
    private String timezone;
}
