import React, { useMemo } from 'react';
import { useRequest } from 'ahooks';
import { isNil } from 'lodash-es';
import { useNavigate } from 'react-router-dom';

import { objectToCamelCase } from '@milesight/shared/src/utils/tools';
import { LoadingWrapper } from '@milesight/shared/src/components';

import {
    type RoleResourceType,
    userAPI,
    getResponseData,
    isRequestSuccess,
    awaitWrap,
} from '@/services/http';
import { useUserStore } from '@/stores';

import './style.less';

export interface PermissionControlResourceProps {
    resourceId?: ApiKey;
    /** the type of the resource */
    resourceType?: RoleResourceType['type'];
    /**
     * resource permissions loading completed callbacks
     */
    onPermissionsLoaded?: (permissions: boolean) => void;
    children: React.ReactNode;
}

/**
 * Higher-order component permission control resource the children
 */
const PermissionControlResource: React.FC<PermissionControlResourceProps> = props => {
    const { resourceId, resourceType, onPermissionsLoaded, children } = props || {};

    const { userInfo } = useUserStore();
    const navigate = useNavigate();

    /**
     * request current resource whether has permissions
     */
    const { loading, data: hasPermission } = useRequest(
        async () => {
            if (!userInfo || !resourceId || !resourceType) return;

            const [err, resp] = await awaitWrap(
                userAPI.getUserHasResourcePermission({
                    user_id: userInfo.user_id,
                    resource_id: resourceId,
                    resource_type: resourceType,
                }),
            );

            if (err || !isRequestSuccess(resp)) return;

            const data = getResponseData(resp);
            if (isNil(data)) return;

            const { hasPermission } = objectToCamelCase(data) || {};
            onPermissionsLoaded?.(hasPermission);

            /**
             * if no permission, then navigate to 403 page
             */
            if (!hasPermission) {
                navigate('/403', { replace: true });
            }

            return hasPermission;
        },
        {
            refreshDeps: [resourceId, resourceType, userInfo],
        },
    );

    const isLoading = useMemo(() => {
        return loading || !hasPermission;
    }, [loading, hasPermission]);

    /**
     * render resource
     */
    return isLoading ? (
        <LoadingWrapper
            wrapperClassName="ms-permission-control-resource__loading"
            loading={isLoading}
        >
            <div className="ms-permission-control-resource" />
        </LoadingWrapper>
    ) : (
        children
    );
};

export default PermissionControlResource;
