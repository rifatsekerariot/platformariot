import React, { useState, useEffect } from 'react';
import { useMemoizedFn, useRequest } from 'ahooks';
import { isEmpty } from 'lodash-es';

import { useI18n } from '@milesight/shared/src/hooks';
import { Modal, type ModalProps, toast } from '@milesight/shared/src/components';
import { objectToCamelCase } from '@milesight/shared/src/utils/tools';

import { userAPI, awaitWrap, getResponseData, isRequestSuccess } from '@/services/http';
import useUserRoleStore from '@/pages/user-role/store';
import { TableTransfer } from '@/components';
import { type TableRowDataType, useColumns } from './hooks';

/**
 * add member modal
 */
const AddMemberModal: React.FC<ModalProps> = props => {
    const { visible, onOk, ...restProps } = props;

    const { activeRole } = useUserRoleStore();
    const { getIntlText } = useI18n();
    const columns = useColumns();

    const [keyword, setKeyword] = useState<string>('');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [chosenMember, setChosenMember] = useState<TableRowDataType[]>([]);

    const {
        run: getUndistributedMembers,
        data: undistributedMembers,
        loading,
    } = useRequest(
        async () => {
            if (!activeRole || !visible) return;

            const { page, pageSize } = paginationModel;
            const [error, resp] = await awaitWrap(
                userAPI.getRoleUndistributedUsers({
                    keyword,
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
            refreshDeps: [keyword, paginationModel, activeRole, visible],
        },
    );

    /**
     *  initial data
     */
    useEffect(() => {
        if (!visible) {
            setKeyword('');
            setChosenMember([]);
            setPaginationModel({ page: 0, pageSize: 10 });
        }
    }, [visible]);

    const handleOk = useMemoizedFn(async () => {
        if (!Array.isArray(chosenMember) || isEmpty(chosenMember)) {
            toast.info(getIntlText('common.placeholder.select'));
            return;
        }

        /**
         * distribute Users To the Role
         */
        if (!activeRole) return;
        const [err, resp] = await awaitWrap(
            userAPI.distributeUsersToRole({
                role_id: activeRole.roleId,
                user_ids: chosenMember.map(item => item.userId),
            }),
        );

        if (err || !isRequestSuccess(resp)) {
            return;
        }

        onOk?.();
        toast.success(getIntlText('common.message.add_success'));
    });

    /**
     * right table selected items filter method
     */
    const handleSelectedFilter = useMemoizedFn((keyword, row: TableRowDataType) => {
        const newKeyword = (keyword || '')?.toLowerCase();

        return (
            row.nickname?.toLowerCase()?.includes(newKeyword) ||
            row.email?.toLowerCase()?.includes(newKeyword)
        );
    });

    /** left table search */
    const handleSearch = useMemoizedFn((value: string) => {
        setKeyword(value);
        setPaginationModel(model => ({ ...model, page: 0 }));
    });

    const renderModal = () => {
        if (visible) {
            return (
                <Modal
                    width="1200px"
                    visible={visible}
                    title={getIntlText('user.role.add_user_member_modal_title')}
                    sx={{
                        '& .MuiDialogContent-root': {
                            display: 'flex',
                        },
                    }}
                    onOk={handleOk}
                    {...restProps}
                >
                    <TableTransfer<TableRowDataType>
                        onChange={setChosenMember}
                        selectedFilter={handleSelectedFilter}
                        tableProps={{
                            loading,
                            rows: undistributedMembers?.content,
                            rowCount: undistributedMembers?.total || 0,
                            columns,
                            getRowId: row => row.userId,
                            paginationModel,
                            onPaginationModelChange: setPaginationModel,
                            onSearch: handleSearch,
                            onRefreshButtonClick: getUndistributedMembers,
                        }}
                    />
                </Modal>
            );
        }

        return null;
    };

    return renderModal();
};

export default AddMemberModal;
