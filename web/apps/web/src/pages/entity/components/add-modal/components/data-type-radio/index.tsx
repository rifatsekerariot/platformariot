import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useControllableValue } from 'ahooks';
import { useI18n } from '@milesight/shared/src/hooks';

export interface Props {
    labels?: string[];
    disabled?: boolean;
    value?: 'value' | 'enums';
    onChange?: (value: Props['value']) => void;
}

const DataTypeRadio: React.FC<Props> = ({ labels, disabled, ...props }) => {
    const { getIntlText } = useI18n();
    const [value, setValue] = useControllableValue<Props['value']>(props);

    const label1 = labels?.[0] || getIntlText('entity.label.set_value');
    const label2 = labels?.[1] || getIntlText('entity.label.set_enumeration_items');

    return (
        <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            className="ms-toggle-button-group ms-workflow-mode-buttons"
            disabled={disabled}
            value={value}
            onChange={(_, value) => setValue(value)}
            sx={{ my: 1.5 }}
        >
            <ToggleButton value="value" aria-label={label1}>
                {label1}
            </ToggleButton>
            <ToggleButton value="enums" aria-label={label2}>
                {label2}
            </ToggleButton>
        </ToggleButtonGroup>
    );
};

export default DataTypeRadio;
