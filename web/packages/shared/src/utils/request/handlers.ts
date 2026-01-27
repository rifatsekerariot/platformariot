/* eslint-disable camelcase */
/**
 * General request processing middleware
 */
import type { AxiosRequestConfig } from 'axios';
import cancelRequest, { cacheRequestCancelToken } from './cancel-request';

/**
 * Language header handler
 *
 * Note: This middleware depends on the i18N service. If a circular dependence occurs, the
 * middleware should be migrated to the respective platform for each platform
 */
// export const languageHandler = async (config: AxiosRequestConfig) => {
//     config.headers = config.headers || {};
//     config.headers['Accept-Language'] = getCurrentMomentLang();

//     return config;
// };

/**
 * Duplicate request handler
 *
 * If you want to support duplicate requests, you can pass headers: `{'x-allow-repeat': true}`
 */
export const cancelConfigHandler = async (config: AxiosRequestConfig) => {
    cancelRequest(config);
    // @ts-ignore
    if (config.$allowRepeat) {
        // @ts-ignore
        delete config.$allowRepeat;
        cacheRequestCancelToken(config);
    }

    return config;
};
