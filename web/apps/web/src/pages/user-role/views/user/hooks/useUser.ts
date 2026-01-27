import { useState, useMemo } from 'react';
import { useMemoizedFn } from 'ahooks';

import { useI18n } from '@milesight/shared/src/hooks';
import { toast } from '@milesight/shared/src/components';

import { userAPI, awaitWrap, isRequestSuccess, type UserType } from '@/services/http';

import type { OperateUserProps, OperateModalType } from '../components/operate-user-modal';

/**
 * user operate hooks
 */
const useUser = (getAllUsers?: () => void) => {
    const { getIntlText } = useI18n();

    // ---------- operate user ------------------------
    const [userModalVisible, setUserModalVisible] = useState(false);
    const [operateModalType, setOperateModalType] = useState<OperateModalType>('add');
    const [modalTitle, setModalTitle] = useState('');
    const [editUserInfo, setEditUserInfo] = useState<ObjectToCamelCase<UserType>>();

    /**
     * edit mode user info modal data
     */
    const editModalData = useMemo(() => {
        return operateModalType === 'edit'
            ? {
                  nickname: editUserInfo?.nickname,
                  email: editUserInfo?.email,
              }
            : undefined;
    }, [operateModalType, editUserInfo]);

    const showUserModal = useMemoizedFn((type: OperateModalType) => {
        /**
         * refresh modal title
         */
        if (type === 'edit') {
            setModalTitle(getIntlText('user.label.edit_user_modal_title'));
        } else if (type === 'resetPassword') {
            setModalTitle(getIntlText('user.label.reset_password'));
        } else {
            setModalTitle(getIntlText('user.label.add_new_user_modal_title'));
        }

        setOperateModalType(type);
        setUserModalVisible(true);
    });

    const handleModalCancel = useMemoizedFn(() => {
        setUserModalVisible(false);
    });

    const handleAddUser = useMemoizedFn(async (params: OperateUserProps, callback: () => void) => {
        const { nickname, email, password } = params || {};
        if (!nickname || !email || !password) return;

        const [err, resp] = await awaitWrap(
            userAPI.addUser({
                nickname,
                email,
                password,
            }),
        );

        if (err || !isRequestSuccess(resp)) {
            return;
        }

        getAllUsers?.();
        callback?.();
        setUserModalVisible(false);
        toast.success(getIntlText('common.message.add_success'));
    });

    const handleEditUser = useMemoizedFn(async (params: OperateUserProps, callback: () => void) => {
        const { nickname, email } = params || {};
        const { userId } = editUserInfo || {};
        if (!nickname || !email || !userId) return;

        const [err, resp] = await awaitWrap(
            userAPI.editUserInfo({
                user_id: userId,
                nickname,
                email,
            }),
        );

        if (err || !isRequestSuccess(resp)) {
            return;
        }

        getAllUsers?.();
        callback?.();
        setUserModalVisible(false);
        toast.success(getIntlText('common.message.operation_success'));
    });

    const handleResetUserPassword = useMemoizedFn(
        async (params: OperateUserProps, callback: () => void) => {
            const { password } = params || {};
            const { userId } = editUserInfo || {};
            if (!password || !userId) return;

            const [err, resp] = await awaitWrap(
                userAPI.resetUserPassword({
                    user_id: userId,
                    password,
                }),
            );

            if (err || !isRequestSuccess(resp)) {
                return;
            }

            callback?.();
            setUserModalVisible(false);
            toast.success(getIntlText('common.message.operation_success'));
        },
    );

    const handleUserFormSubmit = useMemoizedFn(
        async (params: OperateUserProps, callback: () => void) => {
            if (operateModalType === 'edit') {
                await handleEditUser(params, callback);
                return;
            }

            if (operateModalType === 'resetPassword') {
                await handleResetUserPassword(params, callback);
                return;
            }

            await handleAddUser(params, callback);
        },
    );

    return {
        operateModalType,
        userModalVisible,
        showUserModal,
        handleModalCancel,
        handleUserFormSubmit,
        modalTitle,
        editUserInfo,
        setEditUserInfo,
        editModalData,
    };
};

export default useUser;
