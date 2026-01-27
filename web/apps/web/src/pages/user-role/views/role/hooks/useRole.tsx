import { useState } from 'react';
import { useMemoizedFn, useRequest } from 'ahooks';

import { toast, ErrorIcon } from '@milesight/shared/src/components';
import { useI18n } from '@milesight/shared/src/hooks';
import { objectToCamelCase } from '@milesight/shared/src/utils/tools';

import useUserRoleStore from '@/pages/user-role/store';
import { useConfirm } from '@/components';
import {
    type RoleType,
    userAPI,
    getResponseData,
    awaitWrap,
    isRequestSuccess,
} from '@/services/http';

import { ROLE_MORE_OPERATION } from '../components';
import { MODAL_TYPE } from '../constants';

const SUPER_ADMIN_NAME = 'super_admin';

/**
 * Handle role add、rename、delete etc...
 */
export function useRole() {
    const { getIntlText } = useI18n();
    const { updateActiveRole, activeRole } = useUserRoleStore();

    const [roleData, setRoleData] = useState<ObjectToCamelCase<RoleType[]>>([]);
    const [searchKeyword, setSearchKeyword] = useState<string>();

    /**
     * edit modal status
     */
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [modalTitles, setModalTitles] = useState(getIntlText('user.label.add_role'));
    const [modalData, setModalData] = useState<string>('');
    const [modalType, setModalType] = useState<MODAL_TYPE>(MODAL_TYPE.ADD);
    const [loading, setLoading] = useState(true);
    const confirm = useConfirm();

    /**
     * get all roles list data
     */
    const { run: getRoleList } = useRequest(
        async (props?: { keyword?: string; isAdd?: boolean }) => {
            const { keyword, isAdd } = props || {};

            try {
                setLoading(true);
                setSearchKeyword(keyword);

                const [err, resp] = await awaitWrap(
                    userAPI.getAllRoles({
                        keyword,
                        page_number: 1,
                        page_size: 999,
                    }),
                );

                if (err || !isRequestSuccess(resp)) {
                    return;
                }

                const list = getResponseData(resp);
                const newList = objectToCamelCase(
                    (list?.content || []).filter(role => role.name !== SUPER_ADMIN_NAME),
                );
                setRoleData(newList);

                if (newList?.[0] && (!activeRole || isAdd)) {
                    updateActiveRole(newList[0]);
                }
            } finally {
                setLoading(false);
            }
        },
        {
            refreshDeps: [],
            debounceWait: 300,
        },
    );

    const handleAddRole = useMemoizedFn(
        async (name: string, callback: () => void): Promise<void> => {
            const [err, resp] = await awaitWrap(
                userAPI.addRole({
                    name,
                }),
            );

            if (err || !isRequestSuccess(resp)) {
                return;
            }

            getRoleList({
                isAdd: true,
            });
            callback?.();
            setAddModalVisible(false);
            toast.success(getIntlText('common.message.add_success'));
        },
    );

    const handleEditRole = useMemoizedFn(
        async (name: string, callback: () => void): Promise<void> => {
            if (!activeRole) return;

            const [err, resp] = await awaitWrap(
                userAPI.editRole({
                    role_id: activeRole.roleId,
                    name,
                }),
            );

            if (err || !isRequestSuccess(resp)) {
                return;
            }

            getRoleList();
            callback?.();
            setAddModalVisible(false);
            toast.success(getIntlText('common.message.operation_success'));
        },
    );

    const showAddModal = useMemoizedFn((type: MODAL_TYPE) => {
        setModalType(type);
        setModalTitles(
            type === MODAL_TYPE.ADD
                ? getIntlText('user.label.add_role')
                : getIntlText('user.label.rename_role'),
        );
        setModalData(type === MODAL_TYPE.EDIT ? activeRole?.name || '' : '');
        setAddModalVisible(true);
    });

    const handleSearch = useMemoizedFn((value: string) => {
        getRoleList({
            keyword: value,
        });
    });

    const handleRoleClick = useMemoizedFn((role: ObjectToCamelCase<RoleType>) => {
        updateActiveRole(role);
    });

    const handleRoleOperate = useMemoizedFn(async (operate: ROLE_MORE_OPERATION) => {
        if (operate === ROLE_MORE_OPERATION.RENAME) {
            showAddModal(MODAL_TYPE.EDIT);
            return;
        }

        /**
         * delete role
         */
        if (!activeRole) return;
        confirm({
            title: getIntlText('common.label.deletion'),
            description: getIntlText('user.role.delete_tip', {
                0: activeRole?.name || '',
            }),
            confirmButtonText: getIntlText('common.label.delete'),
            icon: <ErrorIcon sx={{ color: 'var(--orange-base)' }} />,
            onConfirm: async () => {
                if (!activeRole?.roleId) return;

                const [err, resp] = await awaitWrap(
                    userAPI.deleteRole({
                        role_id: activeRole.roleId,
                    }),
                );

                if (err || !isRequestSuccess(resp)) {
                    return;
                }

                updateActiveRole(undefined);
                getRoleList();
                toast.success(getIntlText('common.message.delete_success'));
            },
        });
    });

    return {
        roleData,
        activeRole,
        handleAddRole,
        handleSearch,
        handleRoleClick,
        handleRoleOperate,
        addModalVisible,
        setAddModalVisible,
        showAddModal,
        modalTitles,
        modalData,
        modalType,
        handleEditRole,
        loading,
        searchKeyword,
    };
}
