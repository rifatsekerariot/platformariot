import { AxiosRequestConfig, AxiosResponse, AxiosError, CreateAxiosDefaults } from 'axios';

// Get config signature
type GetConfigSignature<Obj extends Record<string, any>> = {
    [Key in keyof Obj]: Obj[Key];
};

// Request options type
export type RequestOptions = {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE' | 'PATCH';
    headers?: AxiosRequestConfig['headers'];
    baseURL?: string;
};

// Request path type
export type RequestPath = `${Uppercase<RequestOptions['method']>} ${string}`;

export type RequestFunctionOptions = AxiosRequestConfig & {
    /**
     * Whether to ignore global error handling, and specify the error code to ignore
     *
     * Note: The tool library does not implement the corresponding error handling, and the
     * business should handle it according to the relevant error handler
     */
    $ignoreError?:
        | boolean
        | string[]
        | {
              codes: string[];
              handler: (code: string, resp?: AxiosResponse<unknown, any>) => void;
          }[];
    /**
     * Whether to allow parallel duplicate requests
     *
     * Note: The tool library does not implement the corresponding error handling, and the business
     * should handle it according to the relevant config handler
     */
    $allowRepeat?: boolean;
    [key: string]: any;
};
// Request function type
export type RequestFunction<P = Record<string, any> | void, R = any> = (
    params: P,
    // ...args: any[]
    options?: RequestFunctionOptions,
) => Promise<R>;

export type APIConfig<P = Record<string, any> | void, R = any> =
    | RequestPath
    | RequestOptions
    | RequestFunction<P, R>;

// export type HeaderHandler = (config?: AxiosRequestConfig) => Promise<AxiosRequestHeaders>;
export type ConfigHandler = (config: AxiosRequestConfig) => Promise<AxiosRequestConfig>;
export type ErrorHandler = (error: AxiosError) => void;
export type ResponseHandler<T = AxiosResponse> = (resp: T) => T;

// Tip: The type has been extracted to global
// export type APISchema = Record<string, {
//     request: Record<string, any> | void;
//     response: Record<string, any> | any;
// }>;

export type AttachAPIOptions<T extends APISchema> = {
    apis: {
        [K in keyof GetConfigSignature<T>]: APIConfig<
            GetConfigSignature<T>[K]['request'],
            AxiosResponse<ApiResponse<GetConfigSignature<T>[K]['response']>>
        >;
    };

    /** Response callback */
    onResponse?: ResponseHandler<AxiosResponse<ApiResponse>>;

    /** Error callback */
    onError?: ErrorHandler;
};

export type CreateRequestConfig = {
    /** Request config handlers */
    // headerHandlers?: Array<HeaderHandler>;
    configHandlers?: Array<ConfigHandler>;

    /** The callback of config handler error */
    onConfigError?: ErrorHandler;

    /** Response callback */
    onResponse?: ResponseHandler<AxiosResponse<ApiResponse>>;

    /** Response error callback */
    onResponseError?: ErrorHandler;
} & CreateAxiosDefaults;

// Create type constraints of the request client
export type CreateRequestClient<T extends APISchema> = {
    [K in keyof GetConfigSignature<T>]: RequestFunction<
        GetConfigSignature<T>[K]['request'],
        AxiosResponse<ApiResponse<GetConfigSignature<T>[K]['response']>>
    >;
};
