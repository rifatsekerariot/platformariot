import { useState, useMemo, useLayoutEffect } from 'react';
import { useReactFlow, useViewport } from '@xyflow/react';
import { Menu, MenuItem, type MenuProps } from '@mui/material';
import { useDebounceFn } from 'ahooks';
import { useI18n } from '@milesight/shared/src/hooks';
import { nodeCategoryConfigs, type NodeConfigItemType } from '@/pages/workflow/config';
import { NodeAvatar } from '@/pages/workflow/components';
import useFlowStore from '../../store';
import useInteractions, { type AddNodeClosestPayloadParam } from '../../hooks/useInteractions';
import './style.less';

interface Props extends MenuProps, AddNodeClosestPayloadParam {
    /**
     * Menu Item click callback
     */
    onItemClick?: (nodeType: WorkflowNodeType) => void;
}

/**
 * Node Menu
 */
const NodeMenu = ({
    prevNodeId,
    prevNodeSourceHandle,
    nextNodeId,
    nextNodeTargetHandle,
    open,
    onItemClick,
    onClose,
    ...menuProps
}: Props) => {
    const { getIntlText } = useI18n();
    const { getNodes, screenToFlowPosition } = useReactFlow<WorkflowNode, WorkflowEdge>();

    // ---------- Generate Menu options ----------
    const nodeConfigs = useFlowStore(state => state.nodeConfigs);
    const showOutputNode = useMemo(() => {
        const nodes = getNodes();
        const hasTriggerNode = nodes.some(node => node.type === 'trigger');
        const hasOutputNode = nodes.some(node => node.type === 'output');

        return hasTriggerNode && !hasOutputNode;
        // Recalculate when open state change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, getNodes]);
    const menuOptions = useMemo(() => {
        const result: Partial<
            Record<
                WorkflowNodeCategoryType,
                (NodeConfigItemType & {
                    nodeName: string;
                    categoryName: string;
                })[]
            >
        > = {};

        Object.values(nodeConfigs).forEach(item => {
            const { category, labelIntlKey, label } = item;
            const cateConfig = nodeCategoryConfigs[category];

            if (!category || category === 'entry') return;
            if (item.type === 'output' && !showOutputNode) return;

            result[category] = result[category] || [];
            result[category].push({
                ...item,
                nodeName: labelIntlKey ? getIntlText(labelIntlKey) : label || '',
                categoryName: cateConfig?.labelIntlKey
                    ? getIntlText(cateConfig.labelIntlKey)
                    : category,
            });
        });

        return result;
    }, [nodeConfigs, showOutputNode, getIntlText]);

    // ---------- Menu Open ----------
    const { zoom } = useViewport();
    const [innerOpen, setInnerOpen] = useState(false);
    const handleInnerClose: MenuProps['onClose'] = (e, reason) => {
        setInnerOpen(false);
        onClose?.(e, reason);
        // @ts-ignore
        e.stopPropagation?.();
    };

    // Sync open state from parent component
    useLayoutEffect(() => setInnerOpen(!!open), [open]);

    // ---------- Menu Item Click ----------
    const { addNode } = useInteractions();
    const { run: handleClick } = useDebounceFn(
        (e: React.MouseEvent<HTMLLIElement, MouseEvent>, type: WorkflowNodeType) => {
            let position: { x: number; y: number } | undefined;
            if (!prevNodeId && !nextNodeId) {
                position = screenToFlowPosition({ x: e.clientX - 20, y: e.clientY - 20 });
            }

            addNode(
                { nodeType: type, position },
                { prevNodeId, prevNodeSourceHandle, nextNodeId, nextNodeTargetHandle },
            );
            onItemClick?.(type);
            handleInnerClose({}, 'backdropClick');
        },
        {
            wait: 300,
        },
    );

    return (
        <Menu
            className="ms-workflow-node-menu"
            anchorOrigin={{
                vertical: 'center',
                horizontal: 16 * zoom + 8,
            }}
            transformOrigin={{
                vertical: 'center',
                horizontal: 'left',
            }}
            slotProps={{
                paper: { elevation: 0 },
            }}
            {...menuProps}
            open={innerOpen}
            onClose={handleInnerClose}
        >
            {Object.entries(menuOptions).map(([category, menus]) => {
                const categoryName = menus[0]?.categoryName;
                const children = [
                    <MenuItem disabled key={category}>
                        {categoryName}
                    </MenuItem>,
                ];

                children.push(
                    ...menus.map(menu => (
                        <MenuItem
                            key={menu.type}
                            onClick={e => {
                                e.stopPropagation();
                                handleClick(e, menu.type);
                            }}
                        >
                            <NodeAvatar
                                name={menu.nodeName}
                                type={menu.type}
                                icon={menu.icon}
                                iconBgColor={menu.iconBgColor}
                            />
                            <span className="title">{menu.nodeName}</span>
                        </MenuItem>
                    )),
                );

                return children;
            })}
        </Menu>
    );
};

export default NodeMenu;
