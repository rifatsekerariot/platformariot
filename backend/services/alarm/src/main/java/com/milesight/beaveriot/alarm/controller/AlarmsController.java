package com.milesight.beaveriot.alarm.controller;

import com.milesight.beaveriot.alarm.model.request.AlarmClaimRequest;
import com.milesight.beaveriot.alarm.model.request.AlarmExportRequest;
import com.milesight.beaveriot.alarm.model.request.AlarmRuleBatchDeleteRequest;
import com.milesight.beaveriot.alarm.model.request.AlarmRuleCreateRequest;
import com.milesight.beaveriot.alarm.model.request.AlarmSearchRequest;
import com.milesight.beaveriot.alarm.model.request.AlarmRuleUpdateRequest;
import com.milesight.beaveriot.alarm.model.response.AlarmDetailResponse;
import com.milesight.beaveriot.alarm.model.response.AlarmRuleResponse;
import com.milesight.beaveriot.alarm.service.AlarmRuleService;
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
@RequestMapping(value = { "/alarms", "/api/v1/alarms" })
@RequiredArgsConstructor
public class AlarmsController {

    private final AlarmService alarmService;
    private final AlarmRuleService alarmRuleService;

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

    // ---------- Alarm rules (if-then) ----------

    @OperationPermission(codes = OperationPermissionCode.DEVICE_VIEW)
    @GetMapping("/rules")
    public ResponseBody<Page<AlarmRuleResponse>> listRules(
            @RequestParam(name = "page_number", defaultValue = "1") int pageNumber,
            @RequestParam(name = "page_size", defaultValue = "100") int pageSize) {
        return ResponseBuilder.success(alarmRuleService.list(pageNumber, pageSize));
    }

    @OperationPermission(codes = OperationPermissionCode.DEVICE_VIEW)
    @GetMapping("/rules/{id}")
    public ResponseBody<AlarmRuleResponse> getRule(@PathVariable Long id) {
        return ResponseBuilder.success(alarmRuleService.get(id));
    }

    @OperationPermission(codes = OperationPermissionCode.DEVICE_VIEW)
    @PostMapping("/rules")
    public ResponseBody<AlarmRuleResponse> createRule(@RequestBody @Valid AlarmRuleCreateRequest request) {
        return ResponseBuilder.success(alarmRuleService.create(request));
    }

    @OperationPermission(codes = OperationPermissionCode.DEVICE_VIEW)
    @PutMapping("/rules/{id}")
    public ResponseBody<AlarmRuleResponse> updateRule(
            @PathVariable Long id,
            @RequestBody @Valid AlarmRuleUpdateRequest request) {
        return ResponseBuilder.success(alarmRuleService.update(id, request));
    }

    @OperationPermission(codes = OperationPermissionCode.DEVICE_VIEW)
    @DeleteMapping("/rules/{id}")
    public ResponseBody<Void> deleteRule(@PathVariable Long id) {
        alarmRuleService.delete(id);
        return ResponseBuilder.success();
    }

    @OperationPermission(codes = OperationPermissionCode.DEVICE_VIEW)
    @PostMapping("/rules/batch-delete")
    public ResponseBody<Void> batchDeleteRules(@RequestBody @Valid AlarmRuleBatchDeleteRequest request) {
        alarmRuleService.batchDelete(request.getIds() != null ? request.getIds() : List.of());
        return ResponseBuilder.success();
    }
}
