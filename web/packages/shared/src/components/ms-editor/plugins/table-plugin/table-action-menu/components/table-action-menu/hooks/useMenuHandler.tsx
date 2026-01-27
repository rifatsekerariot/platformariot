import { useCallback } from 'react';
import { useMemoizedFn } from 'ahooks';
import { $createParagraphNode, $getRoot, $getSelection, $isParagraphNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $deleteTableColumn__EXPERIMENTAL as $deleteTableColumn,
    $deleteTableRow__EXPERIMENTAL as $deleteTableRow,
    $getTableColumnIndexFromTableCellNode,
    $getTableNodeFromLexicalNodeOrThrow,
    $getTableRowIndexFromTableCellNode,
    $insertTableColumn__EXPERIMENTAL as $insertTableColumn,
    $insertTableRow__EXPERIMENTAL as $insertTableRow,
    $isTableCellNode,
    $isTableRowNode,
    $isTableSelection,
    $unmergeCell,
    getTableObserverFromTableElement,
    HTMLTableElementWithWithTableSelectionState,
    TableCellHeaderStates,
    TableCellNode,
    TableRowNode,
} from '@lexical/table';
import {
    computeSelectionCount,
    $selectLastDescendant,
    $cellContainsEmptyParagraph,
} from '../helper';
import type { MenuItemType } from '../types';

interface IProps {
    tableCellNode: TableCellNode;
    updateTableCellNode: React.Dispatch<React.SetStateAction<TableCellNode>>;
}
export const useMenuHandler = ({ tableCellNode, updateTableCellNode }: IProps) => {
    const [editor] = useLexicalComposerContext();

    // Clearing the highlighting of a form selection
    const clearTableSelection = useCallback(() => {
        editor.update(() => {
            //  Checks if the tableCellNode is attached to the DOM.
            if (tableCellNode.isAttached()) {
                // Get the table node.
                const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
                // Getting Form Elements
                const tableElement = editor.getElementByKey(
                    tableNode.getKey(),
                ) as HTMLTableElementWithWithTableSelectionState;

                if (!tableElement) {
                    throw new Error('Expected to find tableElement in DOM');
                }

                // Getting form selections from form elements
                const tableSelection = getTableObserverFromTableElement(tableElement);
                if (tableSelection !== null) {
                    //  Clears the table selection from highlighting if it exists.
                    tableSelection.clearHighlight();
                }

                // Mark table nodes as dirty and need to be re-rendered
                tableNode.markDirty();
                //  Update the latest status of table cell nodes
                updateTableCellNode(tableCellNode.getLatest());
            }

            //  Getting the Root Node
            const rootNode = $getRoot();
            // Select the start position of the root node
            rootNode.selectStart();
        });
    }, [editor, tableCellNode]);

    /** Merge Cells */
    const mergeTableCellsAtSelection = () => {
        editor.update(() => {
            // Get the current selection
            const selection = $getSelection();
            //  Check if the current selection is a table selection
            if (!$isTableSelection(selection)) return;

            // Calculate the number of columns and rows selected:
            const { columns, rows } = computeSelectionCount(selection);
            // Get the selected node
            const nodes = selection.getNodes();

            // Iterate over all nodes in the selection area
            let firstCell: null | TableCellNode = null;
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                // Checks if the node is a table cell node.
                if ($isTableCellNode(node)) {
                    // If firstCell is empty, the current node is set to the first cell node:
                    if (firstCell === null) {
                        // Sets the column span and row span of the cell.
                        node.setColSpan(columns).setRowSpan(rows);
                        firstCell = node;
                        // Checks if the cell contains empty paragraphs.
                        const isEmpty = $cellContainsEmptyParagraph(node);
                        let firstChild;
                        // If the cell is empty and the first child node is a paragraph node, the paragraph node is removed.
                        // eslint-disable-next-line no-cond-assign
                        if (isEmpty && $isParagraphNode((firstChild = node.getFirstChild()))) {
                            firstChild.remove();
                        }
                    } else if ($isTableCellNode(firstCell)) {
                        //  Checks if the current cell contains an empty paragraph.
                        const isEmpty = $cellContainsEmptyParagraph(node);
                        // If the current cell is not empty, append its children to the first cell.
                        if (!isEmpty) {
                            firstCell.append(...node.getChildren());
                        }
                        // Remove the current cell node.
                        node.remove();
                    }
                }
            }
            // If firstCell is not empty
            if (firstCell !== null) {
                // If the first cell has no children, a new paragraph node is created and added to the first cell.
                if (firstCell.getChildrenSize() === 0) {
                    firstCell.append($createParagraphNode());
                }
                // Select the last child node of the first cell.
                $selectLastDescendant(firstCell);
            }
        });
    };
    /** Unmerge Cells */
    const unMergeTableCellsAtSelection = () => {
        editor.update(() => {
            $unmergeCell();
        });
    };

    /** insertion line */
    const insertTableRowAtSelection = useCallback(
        (shouldInsertAfter: boolean, count?: number) => {
            const insertCount = count ?? 1;

            editor.update(() => {
                new Array(insertCount).fill(0).forEach(() => {
                    $insertTableRow(shouldInsertAfter);
                });
            });
        },
        [editor],
    );
    /** Insert column */
    const insertTableColumnAtSelection = useCallback(
        (shouldInsertAfter: boolean, count?: number) => {
            const insertCount = count ?? 1;

            editor.update(() => {
                new Array(insertCount).fill(0).forEach(() => {
                    $insertTableColumn(shouldInsertAfter);
                });
            });
        },
        [editor],
    );
    /** Delete rows */
    const deleteTableRowAtSelection = useCallback(() => {
        editor.update(() => {
            $deleteTableRow();
        });
    }, [editor]);
    /** Delete column */
    const deleteTableColumnAtSelection = useCallback(() => {
        editor.update(() => {
            $deleteTableColumn();
        });
    }, [editor]);
    /** Delete Form */
    const deleteTableAtSelection = useCallback(() => {
        editor.update(() => {
            const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
            tableNode.remove();

            clearTableSelection();
        });
    }, [editor, tableCellNode, clearTableSelection]);

    /** Add/remove line titles */
    const toggleTableRowIsHeader = useCallback(() => {
        editor.update(() => {
            const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
            const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
            const tableRows = tableNode.getChildren();

            if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
                throw new Error('Expected table cell to be inside of table row.');
            }

            const tableRow = tableRows[tableRowIndex];
            if (!$isTableRowNode(tableRow)) {
                throw new Error('Expected table row');
            }

            tableRow.getChildren().forEach(tableCell => {
                if (!$isTableCellNode(tableCell)) {
                    throw new Error('Expected table cell');
                }

                // Add/remove line titles
                tableCell.toggleHeaderStyle(TableCellHeaderStates.ROW);
            });

            clearTableSelection();
        });
    }, [editor, tableCellNode, clearTableSelection]);
    /** Adding/Removing Column Headers */
    const toggleTableColumnIsHeader = useCallback(() => {
        editor.update(() => {
            const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
            const tableColumnIndex = $getTableColumnIndexFromTableCellNode(tableCellNode);
            const tableRows = tableNode.getChildren<TableRowNode>();
            const maxRowsLength = Math.max(...tableRows.map(row => row.getChildren().length));

            if (tableColumnIndex >= maxRowsLength || tableColumnIndex < 0) {
                throw new Error('Expected table cell to be inside of table row.');
            }

            for (let r = 0; r < tableRows.length; r++) {
                const tableRow = tableRows[r];

                if (!$isTableRowNode(tableRow)) {
                    throw new Error('Expected table row');
                }

                const tableCells = tableRow.getChildren();
                if (tableColumnIndex >= tableCells.length) {
                    continue;
                }

                const tableCell = tableCells[tableColumnIndex];

                if (!$isTableCellNode(tableCell)) {
                    throw new Error('Expected table cell');
                }

                /** Adding/Removing Column Headers */
                tableCell.toggleHeaderStyle(TableCellHeaderStates.COLUMN);
            }

            clearTableSelection();
        });
    }, [editor, tableCellNode, clearTableSelection]);

    /** Table Operations */
    const handleMenuChange = useMemoizedFn((item: MenuItemType) => {
        const { key } = item;

        switch (key) {
            case 'insertAbove':
                insertTableRowAtSelection(false);
                break;
            case 'insertBelow':
                insertTableRowAtSelection(true);
                break;
            case 'insertLeft':
                insertTableColumnAtSelection(false);
                break;
            case 'insertRight':
                insertTableColumnAtSelection(true);
                break;
            case 'deleteRow':
                deleteTableRowAtSelection();
                break;
            case 'deleteColumn':
                deleteTableColumnAtSelection();
                break;
            case 'deleteTable':
                deleteTableAtSelection();
                break;
            case 'toggleRowHeader':
                toggleTableRowIsHeader();
                break;
            case 'toggleColumnHeader':
                toggleTableColumnIsHeader();
                break;
            case 'mergeCells':
                mergeTableCellsAtSelection();
                break;
            case 'unMergeCells':
                unMergeTableCellsAtSelection();
                break;
            default:
                break;
        }
    });

    return {
        handleMenuChange,
    };
};
