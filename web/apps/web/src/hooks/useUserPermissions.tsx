import { useMemo } from 'react';
import { useMemoizedFn } from 'ahooks';
import { isEmpty } from 'lodash-es';

import { useUserStore } from '@/stores';
import { PERMISSIONS } from '@/constants';
import { type UserMenuType } from '@/services/http';

/**
 * Global User Permissions Controller hooks
 */
const useUserPermissions = () => {
    const { userInfo } = useUserStore();

    const userPermissions = useMemo((): PERMISSIONS[] => {
        const { menus } = userInfo || {};

        if (!Array.isArray(menus) || isEmpty(menus)) {
            return [];
        }

        /**
         * Recursive traversal to get permission codes
         */
        const getCodes = (m: UserMenuType[]): PERMISSIONS[] => {
            const codes: PERMISSIONS[] = [];

            (m || []).forEach(item => {
                if (Array.isArray(item?.children) && !isEmpty(item.children)) {
                    codes.push(...getCodes(item.children));
                }

                codes.push(item.code as PERMISSIONS);
            });

            return codes;
        };

        return getCodes(menus);
    }, [userInfo]);

    const hasPermission = useMemoizedFn((p: PERMISSIONS[] | PERMISSIONS) => {
        /**
         * Super Admin has all permissions
         */
        if (userInfo?.is_super_admin) {
            return true;
        }

        /**
         * As long as it contains one of the access permissions
         * it can be accessed
         */
        if (Array.isArray(p)) {
            return p.some(item => userPermissions.includes(item));
        }

        /**
         * Determine if you have the specified permission
         */
        return userPermissions.includes(p);
    });

    return {
        hasPermission,
    };
};

export default useUserPermissions;
