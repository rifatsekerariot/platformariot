import React, { useState } from 'react';
import { useMemoizedFn } from 'ahooks';

import { TextField, type TextFieldProps, InputAdornment, IconButton } from '@mui/material';
import { VisibilityIcon, VisibilityOffIcon } from '@milesight/shared/src/components';

/**
 * Password Input Components
 */
const PasswordInput: React.FC<TextFieldProps> = props => {
    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = useMemoizedFn(() => setShowPassword(show => !show));

    const handleMouseDownPassword = useMemoizedFn((event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    });

    const handleMouseUpPassword = useMemoizedFn((event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    });

    return (
        <TextField
            {...props}
            type={showPassword ? 'text' : 'password'}
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                onMouseUp={handleMouseUpPassword}
                                edge="end"
                            >
                                {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
};

export default PasswordInput;
