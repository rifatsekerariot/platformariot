import { useEffect, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    FORMAT_TEXT_COMMAND,
    SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

type FontFormat = 'bold' | 'italic' | 'underline' | 'strikethrough';
type FontFormatState = `is${Capitalize<FontFormat>}`;
export const useFormat = () => {
    const [editor] = useLexicalComposerContext();
    const [textFormatState, setTextFormatState] = useState<Record<FontFormatState, boolean>>({
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrikethrough: false,
    });

    const insertBold = useMemoizedFn(() => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
    });
    const insertItalic = useMemoizedFn(() => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
    });
    const insertUnderline = useMemoizedFn(() => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
    });
    const insertStrikethrough = useMemoizedFn(() => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
    });
    /** Trigger corresponding text changes */
    const onDispatch = useMemoizedFn((type: FontFormat) => {
        const strategy: Record<FontFormat, () => void> = {
            bold: insertBold,
            italic: insertItalic,
            underline: insertUnderline,
            strikethrough: insertStrikethrough,
        };

        const fn = strategy[type];
        return fn && fn();
    });
    /** selected at the time of selection */
    const onClick = useMemoizedFn((type: FontFormat) => {
        onDispatch(type);
    });

    /** Updating the display of the toolbar */
    const $updateToolbar = useMemoizedFn(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            setTextFormatState({
                isBold: false,
                isItalic: false,
                isUnderline: false,
                isStrikethrough: false,
            });
            return;
        }

        setTextFormatState({
            isBold: selection.hasFormat('bold'),
            isItalic: selection.hasFormat('italic'),
            isUnderline: selection.hasFormat('underline'),
            isStrikethrough: selection.hasFormat('strikethrough'),
        });
    });
    useEffect(() => {
        /** listener register */
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    $updateToolbar();
                });
            }),
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
        /** font state */
        textFormatState,
        onClick,
    };
};
