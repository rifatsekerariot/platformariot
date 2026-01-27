import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { type RoleType } from '@/services/http';

interface UserRoleStore {
    /** current selected role */
    activeRole?: ObjectToCamelCase<RoleType>;
    /** update current selected role data */
    updateActiveRole: (role?: ObjectToCamelCase<RoleType>) => void;
}

/**
 * user role store global data
 */
const useUserRoleStore = create(
    immer<UserRoleStore>(set => ({
        updateActiveRole(role) {
            set(state => {
                state.activeRole = role;
            });
        },
    })),
);

export default useUserRoleStore;
