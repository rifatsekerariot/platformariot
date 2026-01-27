import { useEffect, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { $getSelectionStyleValueForProperty, $patchStyleText } from '@lexical/selection';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { DEFAULT_FONT_SIZE } from '../constant';

export const useFontSize = () => {
    const [editor] = useLexicalComposerContext();
    const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);

    /** font size menu on change */
    const onChange = useMemoizedFn((value: React.Key) => {
        updateFontSizeInSelection(`${value}px`);
    });

    /** update editor status */
    const updateFontSizeInSelection = useMemoizedFn((newFontSize: string) => {
        editor.update(() => {
            if (!editor.isEditable()) return;

            const selection = $getSelection();

            if (selection === null) return;

            $patchStyleText(selection, {
                'font-size': newFontSize,
            });

            /** manual to focus the editor */
            setTimeout(() => {
                editor.focus();
            }, 150);
        });
    });

    const $updateToolbar = useMemoizedFn(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            setFontSize(DEFAULT_FONT_SIZE);
            return;
        }

        const currentFontSize = $getSelectionStyleValueForProperty(
            selection,
            'font-size',
            `${DEFAULT_FONT_SIZE}px`,
        );

        const numFontSize = Number(currentFontSize.slice(0, -2));
        const newFontSize = Number.isNaN(numFontSize) ? DEFAULT_FONT_SIZE : numFontSize;

        setFontSize(currentFontSize ? newFontSize : DEFAULT_FONT_SIZE);
    });

    useEffect(() => {
        /** listener change */
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
        fontSize,
        onChange,
    };
};
