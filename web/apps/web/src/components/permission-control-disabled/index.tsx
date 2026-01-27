import React from 'react';

import { useI18n } from '@milesight/shared/src/hooks';

import { PERMISSIONS } from '@/constants';
import { useUserPermissions } from '@/hooks';
import Tooltip from '../tooltip';

import './style.less';

export interface PermissionControlDisabledProps {
    /**
     * The name of the permission
     */
    permissions: PERMISSIONS | PERMISSIONS[];
    children: React.ReactNode;
}

/**
 * Higher-order component permission control disabled the children
 */
const PermissionControlDisabled: React.FC<PermissionControlDisabledProps> = props => {
    const { permissions, children } = props || {};

    const { getIntlText } = useI18n();
    const { hasPermission } = useUserPermissions();

    /**
     * Return disabled tooltip if the user does not have the required permissions
     */
    if (!hasPermission(permissions)) {
        return (
            <Tooltip title={getIntlText('common.label.no_permissions')}>
                <div className="ms-permission-control">
                    <div className="ms-permission-control__disabled">{children}</div>
                </div>
            </Tooltip>
        );
    }

    return children;
};

export default PermissionControlDisabled;
