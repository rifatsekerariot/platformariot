# Use Table Transfer Base Example

```javascript
import React from 'react';
import { useMemoizedFn, useRequest } from 'ahooks';

import { TableTransfer } from '@/components';
import { type TableRowDataType } from './hooks';
import { userAPI, awaitWrap, getResponseData, isRequestSuccess } from '@/services/http';

const TableTransferExample: React.FC = () => {
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
     * right table selected items filter method
     */
    const handleSelectedFilter = useMemoizedFn((keyword, row: TableRowDataType) => {
        return (
            row.nickname?.toLowerCase()?.includes(keyword) ||
            row.email?.toLowerCase()?.includes(keyword)
        );
    });

    return (
        <TableTransfer<TableRowDataType>
            onChange={setChosenMember}
            selectedFilter={handleSelectedFilter}
            sortField="createdAt"
            tableProps={{
                loading,
                rows: undistributedMembers?.content,
                rowCount: undistributedMembers?.total || 0,
                columns,
                getRowId: row => row.userId,
                paginationModel,
                onPaginationModelChange: setPaginationModel,
                onSearch: setKeyword,
                onRefreshButtonClick: getUndistributedMembers,
            }}
        />
    )
}

export default TableTransferExample;

```