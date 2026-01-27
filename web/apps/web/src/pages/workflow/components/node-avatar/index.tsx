import React, { memo } from 'react';
import cls from 'classnames';
import './style.less';

interface Props {
    name: string;
    type?: WorkflowNodeType;
    icon?: React.ReactNode;
    iconBgColor?: string;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Node Avatar
 */
const NodeAvatar: React.FC<Props> = memo(
    ({ name, type, icon, iconBgColor = '#7E57C2', className, style }) => {
        const innerIcon = icon || (
            <span className="node-avatar-text">
                {(name || type || '').slice(0, 1).toUpperCase()}
            </span>
        );
        const innerStyles = {
            backgroundColor: iconBgColor,
            ...style,
        };

        return (
            <span className={cls('ms-workflow-node-avatar', className)} style={innerStyles}>
                {innerIcon}
            </span>
        );
    },
);

export default NodeAvatar;
