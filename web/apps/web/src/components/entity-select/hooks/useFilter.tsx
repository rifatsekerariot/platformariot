import { useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useRequest } from 'ahooks';
import { isEqual } from 'lodash-es';
import useEntityStore, { type EntityFilterParams } from '../store';
import type { FilterParameters } from '../types';

export const useFilter = (props: FilterParameters & { hasFilterParams: boolean }) => {
    const { entityType, entityAccessMod, excludeChildren, entityValueType, hasFilterParams } =
        props;
    const { getEntityList } = useEntityStore(
        useShallow(state => ({ getEntityList: state.getEntityList })),
    );
    const cacheEntityFetchRef = useRef<{
        params: EntityFilterParams | null;
        fetch: Promise<EntityData[]> | null;
    }>({
        params: null,
        fetch: null,
    });

    /** Update cache */
    const updateCacheEntityFetch = (params: EntityFilterParams, fetch: Promise<EntityData[]>) => {
        cacheEntityFetchRef.current = {
            params,
            fetch,
        };
    };
    /** get cache */
    const getCacheEntityFetch = (params: EntityFilterParams) => {
        const cache = cacheEntityFetchRef.current;

        if (isEqual(cache.params, params)) return cache.fetch;
        return null;
    };

    const { data: filterEntityList, loading: filterLoading } = useRequest(
        async () => {
            if (!hasFilterParams) return;

            const params: EntityFilterParams = {
                entityType,
                entityAccessMod,
                excludeChildren,
                entityValueType,
            };

            const cache = getCacheEntityFetch(params);
            if (cache) return cache;

            const fetch = getEntityList(params);
            updateCacheEntityFetch(params, fetch);
            return fetch;
        },
        {
            refreshDeps: [entityType, entityAccessMod, excludeChildren, entityValueType],
            debounceWait: 300,
        },
    );

    return {
        filterEntityList: useMemo(() => filterEntityList || [], [filterEntityList]),
        filterLoading,
    };
};
