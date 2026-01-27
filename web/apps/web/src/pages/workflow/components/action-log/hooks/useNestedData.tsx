import { useMemo } from 'react';
import { ActionLogProps } from '../types';
import { useClientNestedData } from './useClientNestedData';
import { useServerNestedData } from './useServerNestedData';

export const useNestedData = ({ workflowData, traceData, logType }: ActionLogProps) => {
    const { run: getClientNestedData } = useClientNestedData({ workflowData, traceData });
    const { run: getServerNestedData } = useServerNestedData({ workflowData, traceData });

    const roots = useMemo(() => {
        if (logType === 'validate') {
            return getClientNestedData();
        }
        return getServerNestedData();
    }, [getClientNestedData, getServerNestedData, logType]);

    return {
        roots,
    };
};
