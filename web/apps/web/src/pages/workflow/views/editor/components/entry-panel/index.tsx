import { memo, useState } from 'react';
import { Panel, useNodes, useReactFlow } from '@xyflow/react';
import cls from 'classnames';
import { useSize } from 'ahooks';
import { Button, CircularProgress } from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';
import { Tooltip, Empty } from '@/components';
import useFlowStore from '../../store';
import { DEFAULT_NODE_HEIGHT } from '../../constants';
import useInteractions from '../../hooks/useInteractions';
import './style.less';

interface Props {
    /** Is Editing */
    isEditing?: boolean;
    /** Is Data Loading */
    loading?: boolean;
}

// The height of the page topbar
const DEFAULT_TOPBAR_HEIGHT = 57;

const EntryModal: React.FC<Props> = ({ isEditing, loading }) => {
    const { getIntlText } = useI18n();

    const nodes = useNodes();
    const nodeConfigs = useFlowStore(state => state.nodeConfigs);
    const entryNodeConfigs = Object.values(nodeConfigs).filter(node => node.category === 'entry');

    const { height: bodyHeight = 600 } = useSize(document.querySelector('body')) || {};
    const { setViewport, screenToFlowPosition } = useReactFlow<WorkflowNode, WorkflowEdge>();
    const { addNode } = useInteractions();
    const [selectedNodeType, setSelectedNodeType] = useState<WorkflowNodeType>();

    const handleCreate = () => {
        if (!selectedNodeType) return;
        const screenY =
            (bodyHeight - DEFAULT_TOPBAR_HEIGHT) / 2 +
            DEFAULT_TOPBAR_HEIGHT -
            DEFAULT_NODE_HEIGHT / 2;
        const viewportPosition = screenToFlowPosition({ x: 80, y: screenY });
        addNode({ nodeType: selectedNodeType, position: { x: 0, y: 0 } });
        setTimeout(() => setViewport({ zoom: 1.2, ...viewportPosition }));
    };

    return nodes.length ? null : (
        <Panel position="top-center" className="ms-workflow-panel-entry-root">
            {loading ? (
                <CircularProgress />
            ) : isEditing ? (
                <Empty />
            ) : (
                <div className="ms-workflow-panel-entry">
                    <div className="ms-workflow-panel-entry-header">
                        <div className="title">
                            {getIntlText('workflow.modal.entry_node_create_title')}
                        </div>
                    </div>
                    <div className="ms-workflow-panel-entry-body">
                        <div className="ms-workflow-entry-nodes">
                            {entryNodeConfigs.map(config => (
                                <div
                                    className={cls('ms-node-item', {
                                        selected: config.type === selectedNodeType,
                                    })}
                                    key={config.type}
                                    onClick={() => setSelectedNodeType(config.type)}
                                >
                                    <div
                                        className="ms-node-item-icon"
                                        style={{ backgroundColor: config.iconBgColor }}
                                    >
                                        {config.icon}
                                    </div>
                                    <div className="ms-node-item-info">
                                        <div className="ms-node-item-name">
                                            {config.labelIntlKey
                                                ? getIntlText(config.labelIntlKey)
                                                : config.label}
                                        </div>
                                        <Tooltip
                                            className="ms-node-item-desc"
                                            autoEllipsis
                                            title={
                                                config.descIntlKey
                                                    ? getIntlText(config.descIntlKey)
                                                    : ''
                                            }
                                        />
                                        {/* <div className="ms-node-item-desc">
                                            {config.descIntlKey
                                                ? getIntlText(config.descIntlKey)
                                                : ''}
                                        </div> */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="ms-workflow-panel-entry-footer">
                        <Button
                            fullWidth
                            variant="contained"
                            disabled={!selectedNodeType}
                            onClick={handleCreate}
                        >
                            {getIntlText('common.label.create')}
                        </Button>
                    </div>
                </div>
            )}
        </Panel>
    );
};

export default memo(EntryModal);
