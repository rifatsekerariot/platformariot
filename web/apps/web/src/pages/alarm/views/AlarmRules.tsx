import React from 'react';
import { Typography, Box } from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';

const AlarmRules: React.FC = () => {
    const { getIntlText } = useI18n();
    return (
        <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">
                {getIntlText('alarm.placeholder_rules') || 'Alarm kuralları (if-then) yakında eklenecek.'}
            </Typography>
        </Box>
    );
};

export default AlarmRules;
