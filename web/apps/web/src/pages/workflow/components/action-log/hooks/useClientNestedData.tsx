import { useCallback, useMemo } from 'react';
import { cloneDeep } from 'lodash-es';
import { generateUUID, objectToCamelCase } from '@milesight/shared/src/utils/tools';
import type {
    ActionLogProps,
    WorkflowDataType,
    WorkflowNestDataType,
    WorkflowNestNode,
    WorkflowTraceType,
} from '../types';

export const useClientNestedData = ({ traceData, workflowData }: ActionLogProps) => {
    /** Generate trace Map */
    const traceMap = useMemo(() => {
        return (traceData || []).reduce(
            (acc, cur) => {
                const { nodeId } = objectToCamelCase(cur || {});
                acc[nodeId] = cur;
                return acc;
            },
            {} as Record<string, WorkflowTraceType>,
        );
    }, [traceData]);
    /** Add required attributes */
    const wrapperNode = useCallback(
        (node: WorkflowNode): WorkflowNestNode => {
            const nestNode = cloneDeep(node) as WorkflowNestNode;
            const { id, type, data } = nestNode || {};
            const { nodeName } = data || {};
            const traceStruct = objectToCamelCase(traceMap[id] || {});

            nestNode.attrs = {
                $$token: generateUUID(),
                name: nodeName || '',
                type: type!,
                ...(traceStruct || {}),
            };

            return nestNode;
        },
        [traceMap],
    );
    /** Wrap workflow data */
    const wrapperWorkflowData = useCallback(
        (workflowData: WorkflowDataType): WorkflowNestDataType => {
            const { nodes } = workflowData || {};
            const nestNodes = (nodes || []).map(node => wrapperNode(node));

            return {
                ...(workflowData || {}),
                nodes: nestNodes,
            };
        },
        [wrapperNode],
    );

    const run = useCallback(() => {
        const workflowNestData = wrapperWorkflowData(workflowData);
        return workflowNestData.nodes || [];
    }, [workflowData, wrapperWorkflowData]);
    return {
        run,
    };
};
