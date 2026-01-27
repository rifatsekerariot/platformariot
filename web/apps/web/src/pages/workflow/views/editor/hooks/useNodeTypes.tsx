import React, { useMemo } from 'react';
import { Position, type NodeProps } from '@xyflow/react';
import { useI18n } from '@milesight/shared/src/hooks';
import useFlowStore from '../store';
import { Handle, IfElseNode, NodeContainer } from '../components';

/**
 * Get Node Types
 */
const useNodeTypes = () => {
    const { getIntlText } = useI18n();
    const nodeConfigs = useFlowStore(state => state.nodeConfigs);

    const nodeTypes = useMemo(() => {
        const entryNodeConfigs = Object.values(nodeConfigs).filter(
            config => config.category === 'entry',
        );
        const result = (Object.keys(nodeConfigs) as WorkflowNodeType[]).reduce(
            (acc, type) => {
                const config = { ...nodeConfigs[type] };
                const generateHandle = (type: WorkflowNodeType, props: NodeProps<WorkflowNode>) => {
                    if (entryNodeConfigs.find(item => item.type === type)) {
                        return [
                            <Handle type="source" position={Position.Right} nodeProps={props} />,
                        ];
                    }

                    if (type === 'output') {
                        return [
                            <Handle type="target" position={Position.Left} nodeProps={props} />,
                        ];
                    }
                };

                acc[type] = props => (
                    <NodeContainer
                        {...config}
                        title={
                            config.labelIntlKey
                                ? getIntlText(config.labelIntlKey)
                                : config.label || ''
                        }
                        handles={generateHandle(type, props)}
                        nodeProps={props}
                    />
                );

                if (type === 'ifelse') acc[type] = IfElseNode;
                return acc;
            },
            {} as Record<WorkflowNodeType, React.FC<any>>,
        );

        return result;
    }, [nodeConfigs, getIntlText]);

    return nodeTypes;
};

export default useNodeTypes;
