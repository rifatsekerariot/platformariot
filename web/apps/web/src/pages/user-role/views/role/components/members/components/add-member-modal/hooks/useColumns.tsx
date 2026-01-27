import { useMemo } from 'react';
import { useI18n } from '@milesight/shared/src/hooks';
import { type ColumnType } from '@/components';
import { type UserAPISchema } from '@/services/http';

export type TableRowDataType = ObjectToCamelCase<
    UserAPISchema['getRoleUndistributedUsers']['response']['content'][0]
>;

const useColumns = <T extends TableRowDataType>() => {
    const { getIntlText } = useI18n();

    const columns: ColumnType<T>[] = useMemo(() => {
        return [
            {
                field: 'nickname',
                headerName: getIntlText('user.label.user_name_table_title'),
                flex: 1,
                minWidth: 150,
                ellipsis: true,
            },
            {
                field: 'email',
                headerName: getIntlText('common.label.email'),
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
