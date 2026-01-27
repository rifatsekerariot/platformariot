import { apiOrigin } from '@milesight/shared/src/config';
import { genApiUrl } from '@milesight/shared/src/utils/tools';
import { useUserStore } from '@/stores';
import { API_PREFIX } from '@/services/http';

/**
 * Get webhook url
 */
export default () => {
    const { userInfo } = useUserStore();
    const { tenant_id: tenantId } = userInfo || {};

    return genApiUrl(
        apiOrigin,
        `${API_PREFIX}/public/integration/msc/webhook`,
        !tenantId ? {} : { tenantId },
    );
};
