import { useMemo } from 'react';
import { useI18n } from '@milesight/shared/src/hooks';
import { type ColumnType } from '@/components';
import { type UserAPISchema } from '@/services/http';

export type TableRowDataType = ObjectToCamelCase<
    UserAPISchema['getRoleUndistributedDashboards']['response']['content'][0]
>;

const useColumns = <T extends TableRowDataType>() => {
    const { getIntlText } = useI18n();

    const columns: ColumnType<T>[] = useMemo(() => {
        return [
            {
                field: 'dashboardName',
                headerName: getIntlText('dashboard.dashboard_name'),
                flex: 1,
                minWidth: 150,
                ellipsis: true,
            },
            {
                field: 'userNickname',
                headerName: getIntlText('common.label.creator'),
                flex: 1,
                align: 'center',
                headerAlign: 'center',
                minWidth: 150,
                ellipsis: true,
            },
        ];
    }, [getIntlText]);

    return columns;
};

export default useColumns;
