package com.milesight.beaveriot.alarm.po;

import jakarta.persistence.*;
import lombok.Data;
import lombok.experimental.FieldNameConstants;

@Data
@Entity
@FieldNameConstants
@Table(name = "t_alarm_rule")
public class AlarmRulePO {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 255)
    private String tenantId;

    @Column(name = "name", nullable = false, length = 512)
    private String name;

    @Column(name = "device_ids", nullable = false, columnDefinition = "TEXT")
    private String deviceIds;

    @Column(name = "entity_key", nullable = false, length = 512)
    private String entityKey;

    @Column(name = "condition_op", nullable = false, length = 64)
    private String conditionOp;

    @Column(name = "condition_value", length = 512)
    private String conditionValue;

    @Column(name = "action_raise_alarm", nullable = false)
    private Boolean actionRaiseAlarm = true;

    @Column(name = "action_notify_email", nullable = false)
    private Boolean actionNotifyEmail = false;

    @Column(name = "action_notify_webhook", nullable = false)
    private Boolean actionNotifyWebhook = false;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    @Column(name = "created_at")
    private Long createdAt;

    @Column(name = "updated_at")
    private Long updatedAt;
}
