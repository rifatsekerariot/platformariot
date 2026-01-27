import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { type TableCellNode } from '@lexical/table';
import { TableActionMenu } from './components';
import { useMenuRoot, useTableCell } from './hooks';
import type { actionMenuTablePlugin, EditorPlugin } from '../../../types';
import './index.less';

export const TableCellActionMenuContainer = ({
    anchorElem,
    plugin,
}: {
    anchorElem: HTMLElement;
    plugin?: actionMenuTablePlugin;
}) => {
    const menuRootRef = useRef<HTMLDivElement | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [tableCellNode, setTableMenuCellNode] = useState<TableCellNode | null>(null);

    useTableCell({ menuRootRef, setTableMenuCellNode });
    useMenuRoot({ anchorElem, menuRootRef, setIsMenuOpen });

    return (
        <>
            <div ref={menuRootRef} className="ms-editor-table__operation-root" />
            {tableCellNode && (
                <TableActionMenu
                    anchorEl={menuRootRef.current}
                    open={isMenuOpen}
                    tableCellNode={tableCellNode}
                    plugin={plugin}
                />
            )}
        </>
    );
};

export default React.memo(
    ({
        anchorElem = document.body,
        plugins,
    }: {
        anchorElem?: HTMLElement;
        plugins?: EditorPlugin['table'];
    }) => {
        const isEditable = useLexicalEditable();
        const actionPlugin = plugins?.find(
            plugin => plugin.name === 'table-action-menu',
        ) as actionMenuTablePlugin;
        const { load = true } = actionPlugin || {};

        return createPortal(
            isEditable && load ? (
                <TableCellActionMenuContainer anchorElem={anchorElem} plugin={actionPlugin} />
            ) : null,
            anchorElem,
        );
    },
);
