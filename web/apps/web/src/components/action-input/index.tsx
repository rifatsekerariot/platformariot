import React, { memo } from 'react';
import { InputAdornment, TextField, type TextFieldProps } from '@mui/material';
import cls from 'classnames';
import { useI18n } from '@milesight/shared/src/hooks';
import './style.less';

type ActionInputProps = TextFieldProps & {
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
};

/**
 * TextField component with custom start and end adornments.
 */
const ActionInput: React.FC<ActionInputProps> = memo(
    ({ startAdornment, endAdornment, className, size, slotProps, ...props }) => {
        const { getIntlText } = useI18n();

        return (
            <TextField
                fullWidth
                placeholder={getIntlText('common.placeholder.input')}
                {...props}
                size={size}
                variant="outlined"
                className={cls('ms-action-input', className)}
                slotProps={{
                    ...slotProps,
                    input: {
                        ...slotProps?.input,
                        size,
                        startAdornment: !startAdornment ? null : (
                            <InputAdornment position="start">{startAdornment}</InputAdornment>
                        ),
                        endAdornment: !endAdornment ? null : (
                            <InputAdornment position="end">{endAdornment}</InputAdornment>
                        ),
                    },
                }}
            />
        );
    },
);

export default ActionInput;
