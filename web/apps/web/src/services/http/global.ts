import { client, unauthClient, attachAPI, API_PREFIX } from './client';
import { type UserType, type UserMenuType } from './user';

export interface GlobalAPISchema extends APISchema {
    /** Log in */
    oauthLogin: {
        request: {
            /** username */
            username: string;
            /** cipher */
            password: string;
            /** Authorization type */
            grant_type: 'password';
            /** Client ID  */
            client_id: string;
            /** Client Secret  */
            client_secret: string;
        };
        // TODO: To be added
        response: {
            /** Authentication Token */
            access_token: string;
            /** Refresh Token */
            refresh_token: string;
            /** Expiration time, unit s */
            // expires_in: number;
        };
    };

    /** Refresh Token */
    // oauthRefresh: {
    //     request: {
    //         refresh_token: string;
    //         grant_type: 'refresh_token';
    //     };
    //     response: GlobalAPISchema['oauthLogin']['response'];
    // };

    /** User registration */
    oauthRegister: {
        request: {
            email: string;
            nickname: string;
            password: string;
        };
        // TODO: To be added
        response: GlobalAPISchema['oauthLogin']['response'];
    };

    /** Get user registration status */
    getUserStatus: {
        request: void;
        response: {
            init: boolean;
        };
    };

    /** Get user information */
    getUserInfo: {
        request: void;
        response: {
            user_id: ApiKey;
            email: string;
            nickname: string;
            is_super_admin: boolean;
            roles: UserType['roles'];
            created_at: number;
            menus: UserMenuType[];
            tenant_id: ApiKey;
        };
    };

    /** Get upload configuration */
    getUploadConfig: {
        request: {
            name?: string;
            file_name: string;
            description?: string;
            temp_resource_live_minutes?: number;
        };
        response: {
            key: string;
            upload_url: string;
            resource_url: string;
        };
    };

    /** Upload file */
    fileUpload: {
        request: {
            url: string;
            file: File;
            mimeType: string;
        };
        response: unknown;
    };
}

/**
 * Global API services (including registration, login, users, etc.)
 */
export default attachAPI<GlobalAPISchema>(client, {
    apis: {
        async oauthLogin(
            params: GlobalAPISchema['oauthLogin']['request'],
            options?: { [k: string]: unknown },
        ) {
            const body = new URLSearchParams(
                Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v != null && v !== ''),
                ) as Record<string, string>,
            ).toString();
            return client.request({
                method: 'POST',
                url: `${API_PREFIX}/oauth2/token`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: body,
                ...options,
            });
        },
        async oauthRegister(params: GlobalAPISchema['oauthRegister']['request'], options?: { [k: string]: unknown }) {
            return unauthClient.request({
                method: 'POST',
                url: `${API_PREFIX}/user/register`,
                headers: { 'Content-Type': 'application/json', 'TENANT-ID': 'default' },
                data: params,
                ...options,
            });
        },
        async getUserStatus(_params?: void, options?: { [k: string]: unknown }) {
            return unauthClient.request({
                method: 'GET',
                url: `${API_PREFIX}/user/status`,
                headers: { 'TENANT-ID': 'default' },
                ...options,
            });
        },
        getUserInfo: `GET ${API_PREFIX}/user`,
        getUploadConfig: `POST ${API_PREFIX}/resource/upload-config`,
        async fileUpload(params, options) {
            const { url, file, mimeType } = params;
            const apiUrl = url.startsWith('http')
                ? url
                : `${API_PREFIX}${url.startsWith('/') ? '' : '/'}${url}`;

            return unauthClient.request({
                method: 'PUT',
                url: apiUrl,
                headers: {
                    'Content-Type': mimeType,
                },
                data: file,
                ...options,
            });
        },
    },
});
