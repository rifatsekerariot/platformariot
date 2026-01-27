package com.milesight.beaveriot.alarm.repository;

import com.milesight.beaveriot.data.jpa.repository.BaseJpaRepository;
import com.milesight.beaveriot.alarm.po.AlarmPO;
import com.milesight.beaveriot.permission.aspect.Tenant;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Tenant
public interface AlarmRepository extends BaseJpaRepository<AlarmPO, Long> {

    @Modifying
    @Query("UPDATE AlarmPO a SET a.alarmStatus = false WHERE a.tenantId = :tenantId AND a.deviceId = :deviceId AND a.alarmStatus = true")
    void claimByDeviceId(@Param("tenantId") String tenantId, @Param("deviceId") Long deviceId);
}
