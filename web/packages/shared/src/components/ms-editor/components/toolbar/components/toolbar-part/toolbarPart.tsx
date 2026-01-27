import React, { FC } from 'react';
import cls from 'classnames';
import type { ToolbarProps } from '../../../../types';
import './style.less';

const ToolbarPart: FC<ToolbarProps> = React.memo(props => {
    const { className, disabled, isActive, onClick, children, ...rest } = props;

    return (
        <div
            {...rest}
            className={cls(className, 'ms-toolbar__item', {
                'ms-toolbar__item--disabled': !!disabled,
                'ms-toolbar__item--active': !!isActive,
            })}
            onClick={onClick}
        >
            {children}
        </div>
    );
});
export default ToolbarPart;
