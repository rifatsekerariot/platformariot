import React from 'react';
import cls from 'classnames';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { Menu, MenuItem } from '@mui/material';

import { ToolbarPart } from '../toolbar-part';
import { useFontColor } from './hooks';
import { FontColorOptions } from './constant';
import { ExpandMoreIcon, FormatColorTextIcon } from '../../../../../icons';
import './style.less';

interface IProps {
    disabled: boolean;
}
export default React.memo(({ disabled }: IProps) => {
    const { fontColor, onChange } = useFontColor();

    return (
        <PopupState variant="popover" popupId="font-size-menu">
            {state => (
                <div className="ms-toolbar__font-color">
                    <ToolbarPart
                        {...bindTrigger(state)}
                        disabled={disabled}
                        className="ms-toolbar__color-dropdown"
                    >
                        <div className="color-dropdown__icon">
                            <FormatColorTextIcon
                                sx={{ color: fontColor }}
                                className="ms-toolbar__icon"
                            />
                        </div>
                        <ExpandMoreIcon className="ms-toolbar__arrow" />
                    </ToolbarPart>
                    <Menu {...bindMenu(state)} className="toolbar-color__menu">
                        <MenuItem className="toolbar-color__menu-item">
                            <div className="color-menu__options">
                                {FontColorOptions.map(item => {
                                    return (
                                        <div
                                            className={cls('color-menu__block', {
                                                'color-menu__block--active':
                                                    item.value === fontColor,
                                            })}
                                            key={item.key}
                                            onClick={() => {
                                                onChange(item.value);
                                                state.close();
                                            }}
                                        >
                                            <FormatColorTextIcon sx={{ color: item.value }} />
                                        </div>
                                    );
                                })}
                            </div>
                        </MenuItem>
                    </Menu>
                </div>
            )}
        </PopupState>
    );
});
