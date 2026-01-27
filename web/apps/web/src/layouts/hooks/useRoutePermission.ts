import { useEffect, useMemo, useRef, useState } from 'react';
import { useMatches } from 'react-router';
import { useLocation, useNavigate } from 'react-router-dom';
import { isEmpty, get } from 'lodash-es';

import { useUserPermissions } from '@/hooks';

/**
 * Router Permissions Controller
 */
const useRoutePermission = (userInfoLoading: boolean | null) => {
    const routeMatches = useMatches();
    const location = useLocation();
    const navigate = useNavigate();
    const { hasPermission } = useUserPermissions();

    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const [pathPermission, setPathPermission] = useState<Record<string, boolean>>();

    /**
     * Determine whether the user has permission to access the current page.
     * No permission to jump directly to 403
     */
    useEffect(() => {
        if (userInfoLoading !== false) {
            return;
        }

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }

        timerRef.current = setTimeout(() => {
            setPathPermission({
                [location.pathname]: true,
            });

            /**
             * To query permissions
             */
            const getPermission = () => {
                const route = routeMatches.find(r => r.pathname === location.pathname);
                const { permissions } = (route?.handle || {}) as Record<string, any>;
                if (isEmpty(permissions)) {
                    return;
                }

                if (permissions && !hasPermission(permissions)) {
                    setPathPermission({
                        [location.pathname]: false,
                    });

                    navigate('/403', { replace: true });
                }
            };

            getPermission();
        }, 150);

        /**
         * Clean up the timer when the component unmounts.
         */
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = undefined;
            }
        };
    }, [navigate, routeMatches, location, hasPermission, userInfoLoading]);

    const hasPathPermission = useMemo(() => {
        const pathname = location?.pathname || '';
        return Boolean(get(pathPermission || {}, pathname));
    }, [pathPermission, location]);

    return {
        /** whether current location path has permission to access */
        hasPathPermission,
    };
};

export default useRoutePermission;
