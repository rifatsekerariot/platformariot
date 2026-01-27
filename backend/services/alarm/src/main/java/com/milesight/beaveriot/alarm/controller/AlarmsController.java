package com.milesight.beaveriot.alarm.controller;

import com.milesight.beaveriot.alarm.model.request.AlarmClaimRequest;
import com.milesight.beaveriot.alarm.model.request.AlarmExportRequest;
import com.milesight.beaveriot.alarm.model.request.AlarmSearchRequest;
import com.milesight.beaveriot.alarm.model.response.AlarmDetailResponse;
import com.milesight.beaveriot.alarm.service.AlarmService;
import com.milesight.beaveriot.base.response.ResponseBody;
import com.milesight.beaveriot.base.response.ResponseBuilder;
import com.milesight.beaveriot.permission.aspect.OperationPermission;
import com.milesight.beaveriot.permission.enums.OperationPermissionCode;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/alarms")
@RequiredArgsConstructor
public class AlarmsController {

    private final AlarmService alarmService;

    @OperationPermission(codes = OperationPermissionCode.DEVICE_VIEW)
    @PostMapping("/search")
    public ResponseBody<Page<AlarmDetailResponse>> search(
            @RequestBody @Valid AlarmSearchRequest request) {
        return ResponseBuilder.success(alarmService.search(request));
    }

    @OperationPermission(codes = OperationPermissionCode.DEVICE_VIEW)
    @GetMapping("/export")
    public void export(
            @RequestParam(name = "start_timestamp", required = false) Long startTimestamp,
            @RequestParam(name = "end_timestamp", required = false) Long endTimestamp,
            @RequestParam(name = "device_ids", required = false) List<Long> deviceIds,
            @RequestParam(name = "alarm_status", required = false) List<Boolean> alarmStatus,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String timezone,
            HttpServletResponse response) throws IOException {
        AlarmExportRequest req = new AlarmExportRequest();
        req.setStartTimestamp(startTimestamp);
        req.setEndTimestamp(endTimestamp);
        req.setDeviceIds(deviceIds != null ? deviceIds : List.of());
        req.setAlarmStatus(alarmStatus != null ? alarmStatus : List.of());
        req.setKeyword(keyword);
        req.setTimezone(timezone);
        alarmService.export(req, response);
    }

    @OperationPermission(codes = OperationPermissionCode.DEVICE_VIEW)
    @PostMapping("/claim")
    public ResponseBody<Void> claim(@RequestBody @Valid AlarmClaimRequest request) {
        alarmService.claim(request.getDeviceId());
        return ResponseBuilder.success();
    }
}
