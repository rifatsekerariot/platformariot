import { useCallback, useMemo } from 'react';
import { cloneDeep, isNil } from 'lodash-es';
import { generateUUID, objectToCamelCase } from '@milesight/shared/src/utils/tools';
import type {
    AccordionLog,
    ActionLogProps,
    WorkflowDataType,
    WorkflowNestNode,
    WorkflowTraceType,
} from '../types';

function safeJsonParse(str: string) {
    try {
        const result = JSON.parse(str);
        return JSON.stringify(result, null, 2);
    } catch (e) {
        return str;
    }
}
export const useServerNestedData = ({ traceData, workflowData }: ActionLogProps) => {
    /** get unique id */
    const getUniqueId = useCallback((trace: AccordionLog) => {
        const { messageId, nodeId } = trace || {};

        return `${messageId}-${nodeId}`;
    }, []);

    /** Generate workflow Map */
    const workflowMap = useMemo(() => {
        const { nodes } = workflowData || {};

        return (nodes || []).reduce(
            (acc, cur) => {
                const { id } = cur || {};
                acc[id] = cur;
                return acc;
            },
            {} as Record<string, WorkflowDataType['nodes'][number]>,
        );
    }, [workflowData]);

    /** Add required attributes */
    const wrapperNode = useCallback(
        (trace: WorkflowTraceType): WorkflowNestNode => {
            const { node_id: nodeId } = trace || {};
            const node = workflowMap[nodeId];
            if (!node) return node;

            const nestNode = cloneDeep(node) as WorkflowNestNode;
            const { type, data } = nestNode || {};
            const { nodeName } = data || {};
            const { input, output, ...traceStruct } = objectToCamelCase(trace || {});

            nestNode.attrs = {
                $$token: generateUUID(),
                name: nodeName || '',
                type: type!,
                input: !isNil(input) ? safeJsonParse(input!) : void 0,
                output: !isNil(output) ? safeJsonParse(output!) : void 0,
                ...(traceStruct || {}),
            };

            return nestNode;
        },
        [workflowMap],
    );
    const workflowNestData = useMemo(() => traceData.map(wrapperNode), [traceData, wrapperNode]);

    /** Generate workflow Map */
    const workflowNestMap = useMemo(() => {
        return (workflowNestData || []).reduce(
            (acc, cur) => {
                const { attrs } = cur || {};
                const uniqueId = getUniqueId(attrs);
                acc[uniqueId] = cur;
                return acc;
            },
            {} as Record<string, WorkflowNestNode>,
        );
    }, [getUniqueId, workflowNestData]);

    /** Convert flat data to tree */
    const dataToTree = useCallback((): WorkflowNestNode[] => {
        const root: WorkflowNestNode[] = [];
        (workflowNestData || []).forEach(node => {
            const { attrs } = node || {};
            const { parentTraceId } = attrs || {};

            if (!parentTraceId) {
                root.push(node);
                return;
            }

            const parentNode = workflowNestMap[parentTraceId];
            if (parentNode) {
                parentNode.children = [...(parentNode.children || []), node];
            }
        });

        return root;
    }, [workflowNestData, workflowNestMap]);

    const run = useCallback(() => {
        return dataToTree();
    }, [dataToTree]);
    return {
        run,
    };
};
