package com.milesight.beaveriot.alarm.repository;

import com.milesight.beaveriot.alarm.po.AlarmRulePO;
import com.milesight.beaveriot.data.jpa.repository.BaseJpaRepository;
import com.milesight.beaveriot.permission.aspect.Tenant;

@Tenant
public interface AlarmRuleRepository extends BaseJpaRepository<AlarmRulePO, Long> {
}
