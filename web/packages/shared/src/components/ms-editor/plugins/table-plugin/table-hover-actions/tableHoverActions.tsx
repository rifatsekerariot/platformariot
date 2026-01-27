import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import cls from 'classnames';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useAction, useShowBtn } from './hooks';
import {
    TABLE_ADD_BUTTON_CLASS,
    TABLE_ADD_COLUMNS_CLASS,
    TABLE_ADD_CONTAINER_CLASS,
    TABLE_ADD_ICON_CLASS,
    TABLE_ADD_ROWS_CLASS,
} from '../constants';
import type { EditorPlugin, HoverActionTablePlugin } from '../../../types';
import { AddIcon } from '../../../../icons';

interface IProps {
    anchorElem: HTMLElement;
    isEditable: boolean;
    plugin?: HoverActionTablePlugin;
}
const TableHoverActionsContainer = ({ anchorElem, isEditable, plugin }: IProps) => {
    const { load = true, config } = plugin || {};
    const { row: addRow = true, column: addColumn = true } = config || {};

    const tableDOMNodeRef = useRef<HTMLElement | null>(null);
    const [shouldListenMouseMove, setShouldListenMouseMove] = useState<boolean>(false);
    const [isShownRow, setShownRow] = useState<boolean>(false);
    const [isShownColumn, setShownColumn] = useState<boolean>(false);

    const { position } = useShowBtn({
        anchorElem,
        isEditable,
        shouldListenMouseMove,
        setShownRow,
        setShownColumn,
        tableDOMNodeRef,
    });
    const { insertAction } = useAction({
        setShownRow,
        setShownColumn,
        setShouldListenMouseMove,
        tableDOMNodeRef,
    });

    return isEditable && load ? (
        <>
            {isShownRow && addRow && (
                <div
                    style={{ ...position }}
                    className={cls(TABLE_ADD_CONTAINER_CLASS, TABLE_ADD_ROWS_CLASS)}
                >
                    <div className={TABLE_ADD_BUTTON_CLASS} onClick={() => insertAction(true)}>
                        <AddIcon className={TABLE_ADD_ICON_CLASS} />
                    </div>
                </div>
            )}
            {isShownColumn && addColumn && (
                <div
                    style={{ ...position }}
                    className={cls(TABLE_ADD_CONTAINER_CLASS, TABLE_ADD_COLUMNS_CLASS)}
                >
                    <div className={TABLE_ADD_BUTTON_CLASS} onClick={() => insertAction(false)}>
                        <AddIcon className={TABLE_ADD_ICON_CLASS} />
                    </div>
                </div>
            )}
        </>
    ) : null;
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
            plugin => plugin.name === 'table-hover-action',
        ) as HoverActionTablePlugin;

        return createPortal(
            <TableHoverActionsContainer
                anchorElem={anchorElem}
                isEditable={isEditable}
                plugin={actionPlugin}
            />,
            anchorElem,
        );
    },
);
