import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';
import { Breadcrumbs } from '@/components';
import AlarmList from './views/AlarmList';
import AlarmRules from './views/AlarmRules';

import './style.less';

type TabValue = 'list' | 'rules';

const AlarmPage: React.FC = () => {
    const { getIntlText } = useI18n();
    const [tab, setTab] = useState<TabValue>('list');

    return (
        <Box className="alarm-page">
            <Breadcrumbs />
            <Tabs value={tab} onChange={(_, v: TabValue) => setTab(v)} sx={{ mb: 2 }}>
                <Tab label={getIntlText('alarm.tab_list') || 'Alarm listesi'} value="list" />
                <Tab label={getIntlText('alarm.tab_rules') || 'Alarm kuralları'} value="rules" />
            </Tabs>
            {tab === 'list' && <AlarmList />}
            {tab === 'rules' && <AlarmRules />}
        </Box>
    );
};

export default AlarmPage;
