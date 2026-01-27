import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useRequest } from 'ahooks';
import useEntityStore from '../store';
import type { FilterParameters } from '../types';

export const useSearch = (props: FilterParameters) => {
    const { entityType, entityAccessMod, excludeChildren, entityValueType } = props;

    const [keyword, setKeyword] = useState('');
    const { getEntityList } = useEntityStore(
        useShallow(state => ({
            getEntityList: state.getEntityList,
        })),
    );

    const { data: searchEntityList, loading: searchLoading } = useRequest(
        async () => {
            if (!keyword) return [];

            return getEntityList({
                keyword,
                notScanKey: true,
                entityType,
                entityAccessMod,
                excludeChildren,
                entityValueType,
            });
        },
        { refreshDeps: [keyword], debounceWait: 300 },
    );
    /** search entity list by keyword */
    const onSearch = useCallback((keyword: string) => {
        setKeyword(keyword);
    }, []);

    return {
        keyword,
        searchEntityList,
        searchLoading,
        onSearch,
    };
};
