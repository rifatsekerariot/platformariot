import { client, attachAPI, API_PREFIX } from './client';

export interface UserType {
    email: string;
    nickname: string;
    user_id: ApiKey;
    created_at: number;
    roles: {
        role_id: ApiKey;
        role_name: string;
    }[];
}

export interface RoleType {
    /**
     * The id of the role
     */
    role_id: ApiKey;
    /**
     * The name of the role
     */
    name: string;
    /**
     * The description of the role
     */
    description?: string;
    /**
     * How many users the role has
     */
    user_role_count?: number;
    /**
     * How many integration the role has
     */
    role_integration_count?: number;
}

export interface UserMenuType {
    menu_id: ApiKey;
    code: string;
    name: string;
    type: 'MENU' | 'FUNCTION';
    parent_id: ApiKey;
    children: UserMenuType[];
}

export interface RoleUserType {
    role_id: ApiKey;
    user_id: ApiKey;
    user_nickname: string;
    user_email: string;
}

export interface RoleUndistributedUserType {
    email: string;
    nickname: string;
    user_id: ApiKey;
}

export interface RoleIntegrationType {
    integration_id: ApiKey;
    integration_name: string;
    device_num?: number;
    entity_num?: number;
}

export interface RoleResourceType {
    id: ApiKey;
    type: 'ENTITY' | 'DEVICE' | 'INTEGRATION' | 'DASHBOARD' | 'WORKFLOW';
}

export interface RoleDeviceType {
    device_id: ApiKey;
    device_name: string;
    created_at: number;
    integration_id: ApiKey;
    /** the source of device */
    integration_name: string;
    user_id: ApiKey;
    user_email: string;
    /** the add user */
    user_nickname: string;
    /**
     * Whether or not the equipment for the integration display is assigned
     */
    role_integration?: boolean;
}

export interface RoleDashboardType {
    dashboard_id: ApiKey;
    dashboard_name: string;
    created_at: number;
    user_id: ApiKey;
    user_email: string;
    /** the add user */
    user_nickname: string;
}

export interface UserAPISchema extends APISchema {
    addUser: {
        request: {
            email: string;
            nickname: string;
            password: string;
        };
        response: void;
    };
    getAllUsers: {
        request: SearchRequestType & {
            keyword?: string;
        };
        response: SearchResponseType<UserType[]>;
    };
    resetUserPassword: {
        request: {
            user_id: ApiKey;
            password: string;
        };
        response: void;
    };
    editUserInfo: {
        request: {
            user_id: ApiKey;
            nickname: string;
            email: string;
        };
        response: void;
    };
    deleteUsers: {
        request: {
            user_id_list: ApiKey[];
        };
        response: void;
    };
    addRole: {
        request: {
            name: string;
            description?: string;
        };
        response: {
            role_id: ApiKey;
        };
    };
    editRole: {
        request: {
            role_id: ApiKey;
            name: string;
            description?: string;
        };
        response: void;
    };
    deleteRole: {
        request: {
            role_id: ApiKey;
        };
        response: void;
    };
    getAllRoles: {
        request: SearchRequestType & {
            keyword?: string;
        };
        response: SearchResponseType<RoleType[]>;
    };
    /**
     * Get all users under the  role
     */
    getRoleAllUsers: {
        request: SearchRequestType & {
            role_id: ApiKey;
            keyword: string;
        };
        response: SearchResponseType<RoleUserType[]>;
    };
    /**
     * Get undistributed users under the  role
     */
    getRoleUndistributedUsers: {
        request: SearchRequestType & {
            role_id: ApiKey;
            keyword: string;
        };
        response: SearchResponseType<RoleUndistributedUserType[]>;
    };
    /**
     * distributed users under the role
     */
    distributeUsersToRole: {
        request: {
            role_id: ApiKey;
            user_ids: ApiKey[];
        };
        response: void;
    };
    /**
     * Remove users from the role
     */
    removeUsersFromRole: {
        request: {
            role_id: ApiKey;
            user_ids: ApiKey[];
        };
        response: void;
    };
    getUserAllMenus: {
        request: void;
        response: UserMenuType[];
    };
    distributeMenusToRole: {
        request: {
            role_id: ApiKey;
            menu_ids: ApiKey[];
        };
        response: void;
    };
    getRoleAllMenus: {
        request: {
            role_id: ApiKey;
        };
        response: UserMenuType[];
    };
    getRoleAllIntegrations: {
        request: SearchRequestType & {
            role_id: ApiKey;
            keyword: string;
        };
        response: SearchResponseType<RoleIntegrationType[]>;
    };
    removeResourceFromRole: {
        request: {
            role_id: ApiKey;
            resources: RoleResourceType[];
        };
        response: void;
    };
    getRoleUndistributedIntegrations: {
        request: SearchRequestType & {
            role_id: ApiKey;
            keyword: string;
        };
        response: SearchResponseType<RoleIntegrationType[]>;
    };
    distributeResourcesToRole: {
        request: {
            role_id: ApiKey;
            resources: RoleResourceType[];
        };
        response: void;
    };
    getRoleAllDevices: {
        request: SearchRequestType & {
            role_id: ApiKey;
            keyword: string;
        };
        response: SearchResponseType<RoleDeviceType[]>;
    };
    getRoleUndistributedDevices: {
        request: SearchRequestType & {
            role_id: ApiKey;
            keyword: string;
        };
        response: SearchResponseType<RoleDeviceType[]>;
    };
    getRoleAllDashboards: {
        request: SearchRequestType & {
            role_id: ApiKey;
            keyword: string;
        };
        response: SearchResponseType<RoleDashboardType[]>;
    };
    getRoleUndistributedDashboards: {
        request: SearchRequestType & {
            role_id: ApiKey;
            keyword: string;
        };
        response: SearchResponseType<RoleDashboardType[]>;
    };
    getUserHasResourcePermission: {
        request: {
            user_id: ApiKey;
            resource_id: ApiKey;
            resource_type: RoleResourceType['type'];
        };
        response: {
            has_permission: boolean;
        };
    };
}

/**
 * User API
 */
export default attachAPI<UserAPISchema>(client, {
    apis: {
        addUser: `POST ${API_PREFIX}/user/members`,
        getAllUsers: `POST ${API_PREFIX}/user/members/search`,
        resetUserPassword: `PUT ${API_PREFIX}/user/members/:user_id/change-password`,
        editUserInfo: `PUT ${API_PREFIX}/user/members/:user_id`,
        deleteUsers: `POST ${API_PREFIX}/user/batch-delete`,
        addRole: `POST ${API_PREFIX}/user/roles`,
        editRole: `PUT ${API_PREFIX}/user/roles/:role_id`,
        deleteRole: `DELETE ${API_PREFIX}/user/roles/:role_id`,
        getAllRoles: `POST ${API_PREFIX}/user/roles/search`,
        getRoleAllUsers: `POST ${API_PREFIX}/user/roles/:role_id/members`,
        getRoleUndistributedUsers: `POST ${API_PREFIX}/user/roles/:role_id/undistributed-users`,
        distributeUsersToRole: `POST ${API_PREFIX}/user/roles/:role_id/associate-user`,
        removeUsersFromRole: `POST ${API_PREFIX}/user/roles/:role_id/disassociate-user`,
        getUserAllMenus: `GET ${API_PREFIX}/user/menus`,
        distributeMenusToRole: `POST ${API_PREFIX}/user/roles/:role_id/associate-menu`,
        getRoleAllMenus: `GET ${API_PREFIX}/user/roles/:role_id/menus`,
        getRoleAllIntegrations: `POST ${API_PREFIX}/user/roles/:role_id/integrations`,
        removeResourceFromRole: `POST ${API_PREFIX}/user/roles/:role_id/disassociate-resource`,
        getRoleUndistributedIntegrations: `POST ${API_PREFIX}/user/roles/:role_id/undistributed-integrations`,
        distributeResourcesToRole: `POST ${API_PREFIX}/user/roles/:role_id/associate-resource`,
        getRoleAllDevices: `POST ${API_PREFIX}/user/roles/:role_id/devices`,
        getRoleUndistributedDevices: `POST ${API_PREFIX}/user/roles/:role_id/undistributed-devices`,
        getRoleAllDashboards: `POST ${API_PREFIX}/user/roles/:role_id/dashboards`,
        getRoleUndistributedDashboards: `POST ${API_PREFIX}/user/roles/:role_id/undistributed-dashboards`,
        getUserHasResourcePermission: `POST ${API_PREFIX}/user/members/:user_id/permission`,
    },
});
