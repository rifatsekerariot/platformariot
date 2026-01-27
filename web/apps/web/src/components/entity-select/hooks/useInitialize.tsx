import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useMemoizedFn } from 'ahooks';
import useEntityStore from '../store';

export const useInitialize = ({ hasFilterParams }: { hasFilterParams: boolean }) => {
    const { initEntityList, status } = useEntityStore(
        useShallow(state => ({
            status: state.status,
            initEntityList: state.initEntityList,
        })),
    );

    const init = useMemoizedFn(() => {
        initEntityList();
    });
    useEffect(() => {
        if (hasFilterParams) return;
        if (status !== 'ready') return;

        init();
    }, [init, initEntityList, status, hasFilterParams]);
};
