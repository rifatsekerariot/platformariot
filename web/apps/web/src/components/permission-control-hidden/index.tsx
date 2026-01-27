import React from 'react';

import { PERMISSIONS } from '@/constants';
import { useUserPermissions } from '@/hooks';

export interface PermissionControlHiddenProps {
    /**
     * The name of the permission
     */
    permissions: PERMISSIONS | PERMISSIONS[];
    children: React.ReactNode;
}

/**
 * Higher-order component permission control hidden the children
 */
const PermissionControlHidden: React.FC<PermissionControlHiddenProps> = props => {
    const { permissions, children } = props || {};

    const { hasPermission } = useUserPermissions();

    /**
     * Return null if the user does not have the required permissions
     */
    if (!hasPermission(permissions)) {
        return null;
    }

    return children;
};

export default PermissionControlHidden;
