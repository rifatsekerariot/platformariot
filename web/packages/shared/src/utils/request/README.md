# General request tool library

## Introduction

In the previous development, because the business type are different, each project requires their respective packaging request instances. Internal logic is usually coupled with the business, which cannot be effectively shared and reused. At the same time, there are a large number of template codes in the encapsulated API Service, with lack of type constraints and lack of specifications. This tool library aims to solve the problems mentioned above, making the API in the project simple and easy to read, the management is more orderly, the type is complete, and the call is smoother and smooth.

## Quick Start

Create instance:

```ts
// client.ts
import { createRequestClient } from '@iot/shared/src/utils/request';

/** Header handler */
const headerHandler = async () => {
    // ...
}

/** Auto jump handler */
const autoJumpHandler = async () => {
    // ...
}

/** Interface timeout tracking and reporting handler */
const trackerHandler = async () => {
    // ...
}

const client = createRequestClient({
    // Request base url
    baseURL: 'https://xxx.host.com',
    // Static request headers
    headers: {
        'x-headers': 'xxx',
    },
    configHandlers: [
        headerHandler,
        autoJumpHandler,
    ],
    onResponse(resp) {
        // Todo: Global general response processing logic
        return resp;
    },
    onResponseError(error) {
        // Todo: Global general error processing logic
        return error;
    },
});

export default client;
```

Create API：

```ts
// services/http/user.ts
import { attachAPI } from '@iot/shared/src/utils/request';
import client from 'client.ts';

// APISchema has been defined in @iot/shared/types/common.d.ts
interface UserAPISchema extends APISchema {
    /** Get user based on id */
    getUser: {
        request: {
            id: number;
        };
        response: {
            avatar: string;
            id: number;
            name: string;
        };
    };

    /** Get the login user info */
    getLoginUser: {
        request: void;
        response: {
            id: number;
            name: string;
            avatar: string;
        }
    };

    /** Create user */
    createUser: {
        request: {
            avatar: string;
            name: string;
            enterpriseId: number;
        };
        response: {
            avatar: string;
            id: number;
            name: string;
        };
    },

    /** Download */
    download: {
        request: {
            id: number;
        };
        response: any;
    },
}

export default attachAPI<UserAPISchema>(client, {
    // The interface error and response are processed to the service layer, and the business can be defined by itself
    onError(error) {
        // Todo: The General request error processing logic
        return error;
    },

    onResponse(resp) {
        // Todo: The General request response processing logic
        return resp;
    },

    // Support 3 configuration methods, which can be flexibly selected
    apis: {
        // Config with string
        getUser: 'GET api/user/:id',
        getLoginUser: 'GET api/user/current',

        // Config with object
        createUser: {
            method: 'POST',
            path: 'api/user/:enterpriseId',
            // Specific request headers
            headers: { 'x-abc': 'xxx' },
        },

        // Config with function
        download: async (params) => {
            const resp = await client.request({
                url: 'http://xxx.yeastar.com',
                method: 'GET',
                params,
                headers: {
                    enterpriseId: 'xxx'
                },
                responseType: 'blob',
            });
            let result = resp.data.data;
            // ...
            return result;
        },
    }
});
```

Use the api service:

```ts
import userAPI from '@/services/http/user.ts';

userAPI.getUser({ id: 123 }).then(resp => {
    console.log(resp.data.data);
});
```
