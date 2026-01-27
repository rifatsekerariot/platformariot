import { forwardRef } from 'react';

import { type GridSlotProps } from '@mui/x-data-grid';
import { Checkbox } from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';

import { Tooltip } from '@/components';

import styles from '../../style.module.less';

const ToolTipCheckbox = forwardRef<HTMLButtonElement, GridSlotProps['baseCheckbox']>(
    (props, ref) => {
        const { getIntlText } = useI18n();
        const { disabled } = props;

        return (
            <Tooltip title={disabled ? getIntlText('user.role.device_can_not_remove_tip') : ''}>
                <div className={styles['flex-layout']}>
                    <Checkbox ref={ref} {...props} />
                </div>
            </Tooltip>
        );
    },
);

export default ToolTipCheckbox;
