/* eslint-disable no-bitwise */
import { useEffect, useMemo, useState } from 'react';
import { $getSelection } from 'lexical';
import { $isTableSelection, TableCellHeaderStates, type TableCellNode } from '@lexical/table';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { computeSelectionCount, isTableSelectionRectangular, $canUnmerge } from '../helper';
import type { ItemType } from '../types';
import type { actionMenuTablePlugin } from '../../../../../../types';

interface IProps {
    tableCellNode: TableCellNode;
    plugin?: actionMenuTablePlugin;
}
export const useMenuItems = ({ tableCellNode, plugin }: IProps) => {
    const { config } = plugin || {};
    const [editor] = useLexicalComposerContext();
    const [canMergeCells, setCanMergeCells] = useState(false);
    const [canUnMergeCell, setCanUnMergeCell] = useState(false);

    // Judging merged/unmerged cells
    useEffect(() => {
        editor.getEditorState().read(() => {
            // Get the current selection
            const selection = $getSelection();

            // Checks if the current selection is a table selection.
            if ($isTableSelection(selection)) {
                // Calculates the number of rows and columns currently selected.
                const currentSelectionCounts = computeSelectionCount(selection);
                // Setting the status of whether cells can be merged
                setCanMergeCells(
                    isTableSelectionRectangular(selection) &&
                        (currentSelectionCounts.columns > 1 || currentSelectionCounts.rows > 1),
                );
            }
            // Unmerge cell logic
            setCanUnMergeCell($canUnmerge());
        });
    }, [editor]);

    return useMemo<ItemType[]>(() => {
        let menus: ItemType[] = [
            {
                key: 'insertAbove',
                text: 'insert_rows_above',
            },
            {
                key: 'insertBelow',
                text: 'insert_rows_below',
            },
            {
                type: 'divider',
            },
            {
                key: 'insertLeft',
                text: 'insert_left_column',
            },
            {
                key: 'insertRight',
                text: 'insert_right_column',
            },
            {
                type: 'divider',
            },
            {
                key: 'deleteRow',
                text: 'delete_rows',
            },
            {
                key: 'deleteColumn',
                text: 'delete_columns',
            },
            {
                key: 'deleteTable',
                text: 'delete_table',
            },
            {
                type: 'divider',
            },
            {
                key: 'toggleRowHeader',
                text:
                    (tableCellNode.__headerState & TableCellHeaderStates.ROW) ===
                    TableCellHeaderStates.ROW
                        ? 'remove_column_header'
                        : 'add_row_header',
            },
            {
                key: 'toggleColumnHeader',
                text:
                    (tableCellNode.__headerState & TableCellHeaderStates.COLUMN) ===
                    TableCellHeaderStates.COLUMN
                        ? 'remove_column_header'
                        : 'add_column_header',
            },
        ];

        if (canMergeCells) {
            // Merge Cells
            menus = [
                {
                    key: 'mergeCells',
                    text: 'merge_cells',
                },
                {
                    type: 'divider',
                },
                ...menus,
            ];
        }
        if (canUnMergeCell) {
            // Splitting cells
            menus = [
                {
                    key: 'unMergeCells',
                    text: 'unmerge_cells',
                },
                {
                    type: 'divider',
                },
                ...menus,
            ];
        }

        let currentType = '';
        return menus.filter(menu => {
            // Controls whether menu items are displayed
            if ('key' in menu) {
                const { key } = menu;
                const flag = config?.menus?.[key] ?? true;
                flag && (currentType = 'menu');
                return flag;
            }

            // Controls whether horizontal lines are displayed
            if ('type' in menu) {
                if (currentType === 'divider') return false;

                const { isDivider } = config || {};
                const flag = isDivider ?? true;
                flag && (currentType = 'divider');
                return flag;
            }
            return true;
        });
    }, [canMergeCells, canUnMergeCell, tableCellNode, config]);
};
