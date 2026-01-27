package com.milesight.beaveriot.alarm.po;

import jakarta.persistence.*;
import lombok.Data;
import lombok.experimental.FieldNameConstants;

@Data
@Entity
@FieldNameConstants
@Table(name = "t_alarm")
public class AlarmPO {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 255)
    private String tenantId;

    @Column(name = "device_id", nullable = false)
    private Long deviceId;

    @Column(name = "alarm_time", nullable = false)
    private Long alarmTime;

    @Column(name = "alarm_content", length = 1024)
    private String alarmContent;

    @Column(name = "alarm_status", nullable = false)
    private Boolean alarmStatus = true;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "address", length = 512)
    private String address;

    @Column(name = "entity_key", length = 512)
    private String entityKey;

    @Column(name = "source", length = 64)
    private String source;

    @Column(name = "created_at")
    private Long createdAt;
}
