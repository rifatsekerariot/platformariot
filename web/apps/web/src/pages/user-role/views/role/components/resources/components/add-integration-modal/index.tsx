import React, { useState, useMemo, useEffect } from 'react';
import { useMemoizedFn, useRequest } from 'ahooks';
import { isEmpty } from 'lodash-es';

import { Alert } from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';
import { Modal, type ModalProps, toast, LoadingWrapper } from '@milesight/shared/src/components';
import { objectToCamelCase } from '@milesight/shared/src/utils/tools';

import { userAPI, awaitWrap, getResponseData, isRequestSuccess } from '@/services/http';
import useUserRoleStore from '@/pages/user-role/store';
import { Transfer, type TransferItem } from '@/components';

import styles from './style.module.less';

/**
 * add member modal
 */
const AddIntegrationModal: React.FC<ModalProps> = props => {
    const { visible, onOk, ...restProps } = props;

    const { activeRole } = useUserRoleStore();
    const { getIntlText } = useI18n();

    const [chosenInteractions, setChosenInteractions] = useState<ApiKey[]>([]);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 999 });

    const { data: undistributedIntegrations, loading } = useRequest(
        async () => {
            if (!activeRole || !visible) return;

            const { page, pageSize } = paginationModel;
            const [error, resp] = await awaitWrap(
                userAPI.getRoleUndistributedIntegrations({
                    keyword: '',
                    role_id: activeRole.roleId,
                    page_size: pageSize,
                    page_number: page + 1,
                }),
            );
            const respData = getResponseData(resp);

            if (error || !respData || !isRequestSuccess(resp)) return;

            return objectToCamelCase(respData);
        },
        {
            debounceWait: 300,
            refreshDeps: [activeRole, visible],
        },
    );

    /**
     *  initial data
     */
    useEffect(() => {
        if (!visible) {
            setChosenInteractions([]);
            setPaginationModel({ page: 0, pageSize: 10 });
        }
    }, [visible]);

    /**
     * transfer data source
     */
    const selectableIntegrations = useMemo((): TransferItem[] => {
        return (undistributedIntegrations?.content || []).map(i => ({
            key: i.integrationId,
            title: i.integrationName,
        }));
    }, [undistributedIntegrations]);

    const handleOk = useMemoizedFn(async () => {
        if (!Array.isArray(chosenInteractions) || isEmpty(chosenInteractions)) {
            toast.info(getIntlText('common.placeholder.select'));
            return;
        }

        /**
         * distribute Users To the Role
         */
        if (!activeRole) return;
        const [err, resp] = await awaitWrap(
            userAPI.distributeResourcesToRole({
                role_id: activeRole.roleId,
                resources: chosenInteractions.map(id => ({
                    id,
                    type: 'INTEGRATION',
                })),
            }),
        );

        if (err || !isRequestSuccess(resp)) {
            return;
        }

        onOk?.();
        toast.success(getIntlText('common.message.add_success'));
    });

    const renderModal = () => {
        if (visible) {
            return (
                <Modal
                    width="900px"
                    visible={visible}
                    title={getIntlText('user.role.integration_permission_modal_title')}
                    sx={{
                        '& .MuiDialogContent-root': {
                            display: 'flex',
                        },
                    }}
                    onOk={handleOk}
                    {...restProps}
                >
                    <div className={styles['add-integration-modal__body']}>
                        <div className={styles.alert}>
                            <Alert severity="info">
                                {getIntlText('user.role.integration_permission_add_tip')}
                            </Alert>
                        </div>
                        <LoadingWrapper loading={loading}>
                            <Transfer
                                dataSource={selectableIntegrations}
                                onChange={setChosenInteractions}
                            />
                        </LoadingWrapper>
                    </div>
                </Modal>
            );
        }

        return null;
    };

    return renderModal();
};

export default AddIntegrationModal;
