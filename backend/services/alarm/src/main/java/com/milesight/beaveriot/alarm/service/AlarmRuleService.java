package com.milesight.beaveriot.alarm.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.milesight.beaveriot.alarm.model.request.AlarmRuleCreateRequest;
import com.milesight.beaveriot.alarm.model.request.AlarmRuleUpdateRequest;
import com.milesight.beaveriot.alarm.model.response.AlarmRuleResponse;
import com.milesight.beaveriot.alarm.po.AlarmRulePO;
import com.milesight.beaveriot.alarm.repository.AlarmRuleRepository;
import com.milesight.beaveriot.base.enums.ErrorCode;
import com.milesight.beaveriot.base.exception.ServiceException;
import com.milesight.beaveriot.context.security.TenantContext;
import com.milesight.beaveriot.device.dto.DeviceNameDTO;
import com.milesight.beaveriot.device.facade.IDeviceFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AlarmRuleService {

    private static final TypeReference<List<Long>> LONG_LIST = new TypeReference<>() {};

    private final AlarmRuleRepository alarmRuleRepository;
    private final IDeviceFacade deviceFacade;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Page<AlarmRuleResponse> list(int pageNumber, int pageSize) {
        Pageable pageable = PageRequest.of(
                Math.max(0, pageNumber - 1),
                Math.min(500, Math.max(1, pageSize)),
                Sort.by(Sort.Direction.DESC, AlarmRulePO.Fields.createdAt)
        );
        Page<AlarmRulePO> page = alarmRuleRepository.findAll(pageable);
        List<Long> allDeviceIds = page.getContent().stream()
                .flatMap(po -> parseDeviceIds(po.getDeviceIds()).stream())
                .distinct()
                .toList();
        Map<Long, String> nameMap = resolveDeviceNames(allDeviceIds);
        return page.map(po -> toResponse(po, nameMap));
    }

    public AlarmRuleResponse get(Long id) {
        AlarmRulePO po = alarmRuleRepository.findById(id)
                .orElseThrow(() -> ServiceException.with(ErrorCode.DATA_NO_FOUND).detailMessage("Alarm rule not found: " + id).build());
        List<Long> deviceIds = parseDeviceIds(po.getDeviceIds());
        Map<Long, String> nameMap = resolveDeviceNames(deviceIds);
        return toResponse(po, nameMap);
    }

    @Transactional
    public AlarmRuleResponse create(AlarmRuleCreateRequest req) {
        String tenantId = TenantContext.tryGetTenantId().orElse(null);
        if (tenantId == null || tenantId.isBlank()) {
            throw ServiceException.with(ErrorCode.FORBIDDEN_PERMISSION).detailMessage("Tenant context required").build();
        }
        long now = System.currentTimeMillis();
        AlarmRulePO po = new AlarmRulePO();
        po.setTenantId(tenantId);
        po.setName(req.getName().trim());
        po.setDeviceIds(serializeDeviceIds(req.getDeviceIds()));
        po.setEntityKey(req.getEntityKey().trim());
        po.setConditionOp(req.getConditionOp());
        po.setConditionValue(req.getConditionValue() != null ? req.getConditionValue().trim() : null);
        po.setActionRaiseAlarm(req.getActionRaiseAlarm() != null ? req.getActionRaiseAlarm() : true);
        po.setActionNotifyEmail(Boolean.TRUE.equals(req.getActionNotifyEmail()));
        po.setActionNotifyWebhook(Boolean.TRUE.equals(req.getActionNotifyWebhook()));
        po.setEnabled(req.getEnabled() != null ? req.getEnabled() : true);
        po.setCreatedAt(now);
        po.setUpdatedAt(now);
        po = alarmRuleRepository.save(po);
        return get(po.getId());
    }

    @Transactional
    public AlarmRuleResponse update(Long id, AlarmRuleUpdateRequest req) {
        AlarmRulePO po = alarmRuleRepository.findById(id)
                .orElseThrow(() -> ServiceException.with(ErrorCode.DATA_NO_FOUND).detailMessage("Alarm rule not found: " + id).build());
        long now = System.currentTimeMillis();
        po.setName(req.getName().trim());
        po.setDeviceIds(serializeDeviceIds(req.getDeviceIds()));
        po.setEntityKey(req.getEntityKey().trim());
        po.setConditionOp(req.getConditionOp());
        po.setConditionValue(req.getConditionValue() != null ? req.getConditionValue().trim() : null);
        po.setActionRaiseAlarm(req.getActionRaiseAlarm() != null ? req.getActionRaiseAlarm() : true);
        po.setActionNotifyEmail(Boolean.TRUE.equals(req.getActionNotifyEmail()));
        po.setActionNotifyWebhook(Boolean.TRUE.equals(req.getActionNotifyWebhook()));
        po.setEnabled(req.getEnabled() != null ? req.getEnabled() : true);
        po.setUpdatedAt(now);
        alarmRuleRepository.save(po);
        return get(id);
    }

    @Transactional
    public void delete(Long id) {
        if (!alarmRuleRepository.existsById(id)) {
            throw ServiceException.with(ErrorCode.DATA_NO_FOUND).detailMessage("Alarm rule not found: " + id).build();
        }
        alarmRuleRepository.deleteById(id);
    }

    @Transactional
    public void batchDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return;
        ids.forEach(id -> {
            if (alarmRuleRepository.existsById(id)) {
                alarmRuleRepository.deleteById(id);
            }
        });
    }

    private List<Long> parseDeviceIds(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            List<Long> list = objectMapper.readValue(json, LONG_LIST);
            return list != null ? list : List.of();
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse device_ids json: {}", json, e);
            return List.of();
        }
    }

    private String serializeDeviceIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(ids);
        } catch (JsonProcessingException e) {
            throw ServiceException.with(ErrorCode.PARAMETER_VALIDATION_FAILED).detailMessage("Invalid device_ids").build();
        }
    }

    private Map<Long, String> resolveDeviceNames(List<Long> deviceIds) {
        if (deviceIds == null || deviceIds.isEmpty()) return Map.of();
        List<DeviceNameDTO> dtos = deviceFacade.getDeviceNameByIds(deviceIds);
        return dtos.stream().collect(Collectors.toMap(DeviceNameDTO::getId, d -> d.getName() != null ? d.getName() : String.valueOf(d.getId())));
    }

    private AlarmRuleResponse toResponse(AlarmRulePO po, Map<Long, String> nameMap) {
        List<Long> deviceIds = parseDeviceIds(po.getDeviceIds());
        List<String> deviceNames = deviceIds.stream()
                .map(id -> nameMap.getOrDefault(id, String.valueOf(id)))
                .toList();
        return AlarmRuleResponse.builder()
                .id(po.getId())
                .name(po.getName())
                .deviceIds(deviceIds)
                .deviceNames(deviceNames)
                .entityKey(po.getEntityKey())
                .conditionOp(po.getConditionOp())
                .conditionValue(po.getConditionValue())
                .actionRaiseAlarm(po.getActionRaiseAlarm())
                .actionNotifyEmail(po.getActionNotifyEmail())
                .actionNotifyWebhook(po.getActionNotifyWebhook())
                .enabled(po.getEnabled())
                .build();
    }
}
