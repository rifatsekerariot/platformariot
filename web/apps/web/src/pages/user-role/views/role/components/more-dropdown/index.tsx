import React, { useState, useMemo } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon } from '@mui/material';

import { MoreVertIcon, EditIcon, DeleteOutlineIcon } from '@milesight/shared/src/components';
import { useI18n } from '@milesight/shared/src/hooks';

export enum ROLE_MORE_OPERATION {
    RENAME = 'rename',
    DELETE = 'delete',
}

export interface MoreDropdownProps {
    isActive: boolean;
    onOperation?: (operation: ROLE_MORE_OPERATION) => void;
}

/**
 * More Dropdown component
 */
const MoreDropdown: React.FC<MoreDropdownProps> = props => {
    const { isActive, onOperation } = props;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const { getIntlText } = useI18n();
    const open = useMemo(() => Boolean(anchorEl), [anchorEl]);

    const options: {
        label: string;
        value: ROLE_MORE_OPERATION;
        icon: React.ReactNode;
    }[] = useMemo(() => {
        return [
            {
                label: getIntlText('common.label.rename'),
                value: ROLE_MORE_OPERATION.RENAME,
                icon: (
                    <ListItemIcon>
                        <EditIcon />
                    </ListItemIcon>
                ),
            },
            {
                label: getIntlText('common.label.delete'),
                value: ROLE_MORE_OPERATION.DELETE,
                icon: (
                    <ListItemIcon>
                        <DeleteOutlineIcon />
                    </ListItemIcon>
                ),
            },
        ];
    }, [getIntlText]);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = (operate: ROLE_MORE_OPERATION) => {
        handleClose();

        /**
         * Trigger the corresponding event here
         */
        onOperation?.(operate);
    };

    return (
        <div className="more-dropdown__wrapper">
            <IconButton
                id="more-button"
                color={isActive ? 'primary' : 'default'}
                onClick={handleClick}
                sx={{ padding: '4px' }}
            >
                <MoreVertIcon />
            </IconButton>
            <Menu id="dropdown-menu" anchorEl={anchorEl} open={open} onClose={handleClose}>
                {options.map(option => (
                    <MenuItem key={option.value} onClick={() => handleMenuItemClick(option.value)}>
                        {option.icon}
                        {option.label}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
};

export default MoreDropdown;
