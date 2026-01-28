package com.milesight.beaveriot.alarm.model.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AlarmRuleBatchDeleteRequest {

    @NotNull
    private List<Long> ids = new ArrayList<>();
}
