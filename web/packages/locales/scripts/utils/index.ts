/* eslint-disable no-console */
import fse from 'fs-extra';
import { AxiosResponse, AxiosError } from 'axios';
import { logger } from './logger';

/**
 * @description Generate file
 * @param fileName filename
 * @param data Text content
 */
export const createFile = (fileName: string, data: string | NodeJS.ArrayBufferView) => {
    try {
        fse.ensureFileSync(fileName);
        fse.writeFileSync(fileName, data);
    } catch (error: any) {
        logger.error(error.toString(), 'File creation failure');
    }
};

/**
 * Returns the complement of A about B
 */
export function getIncrementBetweenTwo(part: ObjType, whole: ObjType) {
    const res: ObjType = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const key in whole) {
        if (!part[key]) {
            res[key] = whole[key];
        }
    }
    return res;
}

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
): T['data'] | undefined => {
    const { responseType } = resp?.config || {};

    if (responseType === 'blob') {
        return resp?.data;
    }

    return resp?.data;
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

/**
 * Returns an object that contains `promise` and` Resolve`, and `Reject`, which is
 * suitable for reducing nested coding levels
 * @docs https://github.com/tc39/proposal-promise-with-resolvers
 */
export const withPromiseResolvers = <T>() => {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;

    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve: resolve!, reject: reject! };
};

/**
 * Delay execution
 * @param ms - Delay time (millisecond)
 * @returns return PromiseLike
 */
export const delay = (ms: number): PromiseLike<void> & { cancel: () => void } => {
    const { resolve, promise } = withPromiseResolvers<void>();
    const timer = setTimeout(resolve, ms);

    return {
        then: promise.then.bind(promise),
        cancel: () => {
            timer && clearTimeout(timer);
        },
    };
};

/**
 * Parse template strings
 */
export const parseTemplate = (
    template: string,
    data: Record<string, string>,
    regx: RegExp = /{{(\w+)}}/g,
) => {
    return template.replace(regx, (_, key) => data[key] || '');
};

export { logger };
export * from './loadBinCommands';
export * from './sort';
