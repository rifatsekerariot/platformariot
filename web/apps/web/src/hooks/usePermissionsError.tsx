import { useMemoizedFn } from 'ahooks';
import { useNavigate } from 'react-router-dom';
import { type AxiosError } from 'axios';

import { objectToCamelCase } from '@milesight/shared/src/utils/tools';

const NO_PERMISSIONS_CODE = 'forbidden_permission';

/**
 * Handling API user permissions errors
 */
const usePermissionsError = () => {
    const navigate = useNavigate();

    const handlePermissionsError = useMemoizedFn(async (error: AxiosError<unknown, any> | null) => {
        if (!error) return;

        const { response } = error || {};
        const { data, status } = response || {};
        const newData = objectToCamelCase((data || {}) as ApiResponse<any>);

        if (newData?.errorCode === NO_PERMISSIONS_CODE && status === 403) {
            navigate('/403', { replace: true });
        }
    });

    return {
        /**
         * If no permissions, then navigate to the 403 page
         */
        handlePermissionsError,
    };
};

export default usePermissionsError;
