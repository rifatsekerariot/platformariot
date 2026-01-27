/**
 * Common request tools
 */
import type { AxiosResponse, AxiosError } from 'axios';
import iotStorage, { TOKEN_CACHE_KEY } from '../storage';

/**
 * Check if the API request is successful
 */
export const isRequestSuccess = (resp?: AxiosResponse<ApiResponse>) => {
    const data = resp?.data;
    const { responseType } = resp?.config || {};

    if (responseType === 'blob') {
        return !!data && resp?.status === 200;
    }

    return !!data && !data.error_code && data.status === 'Success';
};

/**
 * Get the data of the API response
 */
export const getResponseData = <T extends AxiosResponse<ApiResponse>>(
    resp?: T,
): T['data']['data'] | undefined => {
    const { responseType } = resp?.config || {};

    if (responseType === 'blob') {
        return resp?.data;
    }

    return resp?.data.data;
};

/**
 * The async wrapper for request (Inspired by await-to-js: https://github.com/scopsy/await-to-js)
 * @param {Promise} promise Promise
 * @param errorExt Additional Information you can pass to the err object
 * @returns {Promise} promise
 */
export const awaitWrap = <T, U = AxiosError>(
    promise: Promise<T>,
    errorExt?: object,
): Promise<[U, undefined] | [null, T]> => {
    return promise
        .then<[null, T]>((data: T) => [null, data])
        .catch<[U, undefined]>((err: U) => {
            if (errorExt) {
                const parsedError = { ...err, ...errorExt };
                return [parsedError, undefined];
            }

            return [err, undefined];
        });
};

export type TokenDataType = {
    /** Access Token */
    access_token: string;
    /** Refresh Token */
    refresh_token: string;
    /**
     * Expiration time, in milliseconds
     *
     * Note: This value is the expiration time of the front-end, only for determining
     * when to refresh the token.
     */
    expires_in: number;
};

/**
 * Get interface Authorization Token
 */
export const getAuthorizationToken = () => {
    const token = iotStorage.getItem<TokenDataType>(TOKEN_CACHE_KEY);
    return token?.access_token ? `Bearer ${token?.access_token}` : '';
};
