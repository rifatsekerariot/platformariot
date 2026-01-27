import React from 'react';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { Menu, MenuItem } from '@mui/material';

import { ToolbarPart } from '../toolbar-part';
import { FontSizeOptions } from './constant';
import { useFontSize } from './hooks';
import { ExpandMoreIcon, CheckIcon } from '../../../../../icons';
import './style.less';

interface IProps {
    disabled: boolean;
}
export default React.memo(({ disabled }: IProps) => {
    const { fontSize, onChange } = useFontSize();

    return (
        <PopupState variant="popover" popupId="font-size-menu">
            {state => (
                <div className="ms-toolbar__font-size">
                    <ToolbarPart
                        {...bindTrigger(state)}
                        disabled={disabled}
                        className="ms-toolbar__size-dropdown"
                    >
                        <span>{`${fontSize}px`}</span>
                        <ExpandMoreIcon />
                    </ToolbarPart>
                    <Menu
                        {...bindMenu(state)}
                        className="toolbar-size__menu"
                        slotProps={{
                            paper: {
                                style: {
                                    maxHeight: 16 + 36 * 8,
                                },
                            },
                        }}
                    >
                        {FontSizeOptions.map(item => {
                            return (
                                <MenuItem
                                    disabled={disabled}
                                    key={item.value}
                                    selected={fontSize === item.value}
                                    onClick={() => {
                                        onChange(item.value);
                                        state.close();
                                    }}
                                >
                                    <div className="ms-toolbar__size-item">
                                        <span>{item.label}</span>
                                        {item.value === fontSize && <CheckIcon color="primary" />}
                                    </div>
                                </MenuItem>
                            );
                        })}
                    </Menu>
                </div>
            )}
        </PopupState>
    );
});
