import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiOrigin } from '@milesight/shared/src/config';
import {
    createRequestClient,
    attachAPI,
    awaitWrap,
    getResponseData,
    isRequestSuccess,
    pLimit,
} from '@milesight/shared/src/utils/request';
import { getCurrentComponentLang } from '@milesight/shared/src/services/i18n';
import oauthHandler, { refreshAccessToken } from './oauth-handler';
import errorHandler from './error-handler';

/**
 * Configuring the service request header (You can configure the non-dynamic request header in headers)
 */
const headersHandler = async (config: AxiosRequestConfig) => {
    config.headers = config.headers || {};
    config.headers['Accept-Language'] = getCurrentComponentLang();

    return config;
};

/**
 * Interface request address configuration
 */
const apiOriginHandler = async (config: AxiosRequestConfig) => {
    const { baseURL } = config;
    // If the interface has already replaced the URL, no further processing is required
    if (baseURL?.startsWith('http')) return config;

    if (apiOrigin) {
        config.baseURL = apiOrigin;
    }

    return config;
};

/**
 * Judge the response whether Blob
 */
const isBlobResponse = (response?: AxiosResponse) => {
    if (!response || !response?.data) return false;

    const isBlob = response.data instanceof Blob;
    if (!isBlob || (response.data as Blob)?.type !== 'application/json') return false;

    return true;
};

/**
 * Handle Response Blob error data
 */
const handleResponseBlob = (props: { resp?: AxiosResponse; data: Blob; error: AxiosError }) => {
    const { resp, data, error } = props || {};

    const defaultHandle = () => {
        // @ts-ignore
        errorHandler(resp?.data?.error_code || error.code, resp || error);
    };

    if (!data?.text) {
        defaultHandle?.();
        return;
    }

    data.text()
        .then(data => {
            try {
                if (typeof data !== 'string') {
                    defaultHandle?.();
                    return;
                }

                const responseData: ApiResponse = JSON.parse(data);

                // @ts-ignore
                errorHandler(responseData?.error_code || error.code, resp || error);
            } catch {
                defaultHandle?.();
            }
        })
        .catch(() => {
            defaultHandle?.();
        });
};

const client = createRequestClient({
    baseURL: '/',
    configHandlers: [headersHandler, apiOriginHandler, oauthHandler],
    onResponse(resp) {
        // Error handling
        errorHandler(resp.data.error_code, resp);
        return resp;
    },
    onResponseError(error) {
        const resp = error.response;

        if (isBlobResponse(resp)) {
            handleResponseBlob({
                data: resp?.data as Blob,
                resp,
                error,
            });
        } else {
            // @ts-ignore
            errorHandler(resp?.data?.error_code || error.code, resp || error);
        }

        return error;
    },
});

// 401 retry: refresh token then retry once. Avoids "Full authentication is required" when token just expired.
client.interceptors.response.use(
    r => r,
    async (err: AxiosError) => {
        const resp = err.response;
        const cfg = err.config as (AxiosRequestConfig & { _retried401?: boolean }) | undefined;
        const code = (resp?.data as ApiResponse)?.error_code;
        const isAuthFailed = resp?.status === 401 && code === 'authentication_failed';
        const isOauth = !!cfg?.url?.includes?.('oauth2/token');

        if (isAuthFailed && !isOauth && cfg && !cfg._retried401) {
            cfg._retried401 = true;
            const result = await refreshAccessToken();
            if (result.ok) {
                return client.request(cfg);
            }
        }
        throw err;
    },
);

const unauthClient = createRequestClient({
    baseURL: '/',
    configHandlers: [headersHandler, apiOriginHandler],
    onResponse(resp) {
        // Error handling
        errorHandler(resp.data.error_code, resp);
        return resp;
    },
    onResponseError(error) {
        const resp = error.response;
        // @ts-ignore
        errorHandler(resp?.data?.error_code || error.code, resp || error);
        return error;
    },
});

export * from './constant';
export { client, unauthClient, attachAPI, awaitWrap, getResponseData, isRequestSuccess, pLimit };
