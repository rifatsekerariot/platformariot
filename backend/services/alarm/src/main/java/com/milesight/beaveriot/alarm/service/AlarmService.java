package com.milesight.beaveriot.alarm.service;

import com.milesight.beaveriot.alarm.model.request.AlarmExportRequest;
import com.milesight.beaveriot.alarm.model.request.AlarmSearchRequest;
import com.milesight.beaveriot.alarm.model.response.AlarmDetailResponse;
import com.milesight.beaveriot.alarm.po.AlarmPO;
import com.milesight.beaveriot.alarm.repository.AlarmRepository;
import com.milesight.beaveriot.context.security.TenantContext;
import com.milesight.beaveriot.device.dto.DeviceNameDTO;
import com.milesight.beaveriot.device.facade.IDeviceFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AlarmService {

    private final AlarmRepository alarmRepository;
    private final IDeviceFacade deviceFacade;

    public Page<AlarmDetailResponse> search(AlarmSearchRequest request) {
        Specification<AlarmPO> spec = buildSpecification(
                request.getDeviceIds(),
                request.getStartTimestamp(),
                request.getEndTimestamp(),
                request.getAlarmStatus(),
                request.getKeyword()
        );

        int pageNumber = request.getPageNumber() == null ? 1 : Math.max(1, request.getPageNumber());
        int pageSize = request.getPageSize() == null ? 10 : Math.min(100, Math.max(1, request.getPageSize()));
        Sort sort = Sort.by(Sort.Direction.DESC, AlarmPO.Fields.alarmTime);
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize, sort);

        Page<AlarmPO> page = alarmRepository.findAll(spec, pageable);
        Map<Long, String> deviceNameMap = resolveDeviceNames(
                page.getContent().stream().map(AlarmPO::getDeviceId).distinct().toList()
        );
        return page.map(po -> toResponse(po, deviceNameMap.getOrDefault(po.getDeviceId(), "")));
    }

    public void export(AlarmExportRequest request, HttpServletResponse response) throws IOException {
        Specification<AlarmPO> spec = buildSpecification(
                request.getDeviceIds(),
                request.getStartTimestamp(),
                request.getEndTimestamp(),
                request.getAlarmStatus(),
                request.getKeyword()
        );
        Sort sort = Sort.by(Sort.Direction.DESC, AlarmPO.Fields.alarmTime);
        List<AlarmPO> list = alarmRepository.findAll(spec, sort);

        Map<Long, String> deviceNameMap = resolveDeviceNames(
                list.stream().map(AlarmPO::getDeviceId).distinct().toList()
        );

        String filename = "Alarms_" + ZonedDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME) + ".csv";
        response.setHeader("Content-Type", "text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(response.getOutputStream(), StandardCharsets.UTF_8))) {
            writer.println("id,alarm_status,alarm_time,alarm_content,latitude,longitude,address,device_id,device_name");
            for (AlarmPO po : list) {
                String name = deviceNameMap.getOrDefault(po.getDeviceId(), "");
                String content = escapeCsv(po.getAlarmContent());
                String addr = escapeCsv(po.getAddress());
                writer.printf("%d,%s,%d,\"%s\",%s,%s,\"%s\",%d,\"%s\"%n",
                        po.getId(),
                        po.getAlarmStatus(),
                        po.getAlarmTime(),
                        content,
                        po.getLatitude() != null ? po.getLatitude() : "",
                        po.getLongitude() != null ? po.getLongitude() : "",
                        addr,
                        po.getDeviceId(),
                        escapeCsv(name));
            }
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void claim(Long deviceId) {
        alarmRepository.claimByDeviceId(TenantContext.getTenantId(), deviceId);
    }

    private Specification<AlarmPO> buildSpecification(List<Long> deviceIds, Long startTimestamp, Long endTimestamp,
                                                      List<Boolean> alarmStatus, String keyword) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            String tenantId = TenantContext.getTenantId();
            if (StringUtils.hasText(tenantId)) {
                preds.add(cb.equal(root.get(AlarmPO.Fields.tenantId), tenantId));
            }
            if (!CollectionUtils.isEmpty(deviceIds)) {
                preds.add(root.get(AlarmPO.Fields.deviceId).in(deviceIds));
            }
            if (startTimestamp != null) {
                preds.add(cb.greaterThanOrEqualTo(root.get(AlarmPO.Fields.alarmTime), startTimestamp));
            }
            if (endTimestamp != null) {
                preds.add(cb.lessThanOrEqualTo(root.get(AlarmPO.Fields.alarmTime), endTimestamp));
            }
            if (!CollectionUtils.isEmpty(alarmStatus)) {
                preds.add(root.get(AlarmPO.Fields.alarmStatus).in(alarmStatus));
            }
            if (StringUtils.hasText(keyword)) {
                preds.add(cb.like(cb.lower(root.get(AlarmPO.Fields.alarmContent)), "%" + keyword.toLowerCase() + "%"));
            }
            return cb.and(preds.toArray(new Predicate[0]));
        };
    }

    private Map<Long, String> resolveDeviceNames(List<Long> deviceIds) {
        if (CollectionUtils.isEmpty(deviceIds)) {
            return Map.of();
        }
        List<DeviceNameDTO> names = deviceFacade.getDeviceNameByIds(deviceIds);
        return names.stream().filter(d -> d.getId() != null && d.getName() != null)
                .collect(Collectors.toMap(DeviceNameDTO::getId, DeviceNameDTO::getName, (a, b) -> a));
    }

    private static AlarmDetailResponse toResponse(AlarmPO po, String deviceName) {
        return AlarmDetailResponse.builder()
                .id(po.getId())
                .alarmStatus(po.getAlarmStatus())
                .alarmTime(po.getAlarmTime())
                .alarmContent(po.getAlarmContent())
                .latitude(po.getLatitude())
                .longitude(po.getLongitude())
                .address(po.getAddress())
                .deviceId(po.getDeviceId())
                .deviceName(deviceName != null ? deviceName : "")
                .build();
    }

    private static String escapeCsv(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }
}
