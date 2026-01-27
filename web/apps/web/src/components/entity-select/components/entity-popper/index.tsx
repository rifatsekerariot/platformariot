import React from 'react';
import cls from 'classnames';
import { Popper, PopperProps } from '@mui/material';
import type { EntitySelectInnerProps } from '../../types';
import './style.less';

type IProps = PopperProps &
    Pick<EntitySelectInnerProps, 'dropdownMatchSelectWidth' | 'dropdownPlacement'>;

export default React.memo(
    ({
        className,
        style,
        dropdownPlacement = 'bottom-start',
        dropdownMatchSelectWidth,
        ...props
    }: IProps) => {
        const newStyle = dropdownMatchSelectWidth
            ? { ...style, width: dropdownMatchSelectWidth }
            : style;

        return (
            <Popper
                {...props}
                placement={dropdownPlacement}
                className={cls('ms-entity-select-popper', className)}
                style={newStyle}
            />
        );
    },
);
