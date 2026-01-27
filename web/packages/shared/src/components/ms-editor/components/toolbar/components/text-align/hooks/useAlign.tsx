import { useEffect, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    FORMAT_ELEMENT_COMMAND,
    SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { hasAlignFormat } from '../helper';

type FontAlign = 'left' | 'center' | 'right';
type FontAlignState = `is${Capitalize<FontAlign>}`;

export const useAlign = () => {
    const [editor] = useLexicalComposerContext();
    const [textAlignState, setTextAlignState] = useState<Record<FontAlignState, boolean>>({
        isLeft: false,
        isCenter: false,
        isRight: false,
    });

    /** left justification */
    const insertElementLeft = useMemoizedFn(() => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
    });
    /** centre-aligned */
    const insertElementCenter = useMemoizedFn(() => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
    });
    /** right-aligned */
    const insertElementRight = useMemoizedFn(() => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
    });
    /** Trigger corresponding text changes */
    const onDispatch = useMemoizedFn((type: FontAlign) => {
        const strategy: Record<FontAlign, () => void> = {
            left: insertElementLeft,
            center: insertElementCenter,
            right: insertElementRight,
        };

        const fn = strategy[type];
        return fn && fn();
    });
    /** selected at the time of selection */
    const onClick = useMemoizedFn((type: FontAlign) => {
        onDispatch(type);
    });

    /** Updating the display of the toolbar */
    const $updateToolbar = useMemoizedFn(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            setTextAlignState({
                isLeft: false,
                isCenter: false,
                isRight: false,
            });
            return;
        }

        const nodes = selection.getNodes();
        const [node] = nodes || [];
        if (!node) return;

        setTextAlignState({
            isLeft: hasAlignFormat(node, 'left'),
            isCenter: hasAlignFormat(node, 'center'),
            isRight: hasAlignFormat(node, 'right'),
        });
    });
    useEffect(() => {
        return mergeRegister(
            /** When content changes */
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    $updateToolbar();
                });
            }),
            /** Listen for selected text and update the toolbar when it changes. */
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    $updateToolbar();
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL,
            ),
        );
    }, [editor, $updateToolbar]);

    return {
        /** position state */
        textAlignState,
        onClick,
    };
};
