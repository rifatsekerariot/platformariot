import { useEffect, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_CRITICAL,
    SELECTION_CHANGE_COMMAND,
    $createParagraphNode,
    $isRootOrShadowRoot,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, type HeadingTagType, $isHeadingNode } from '@lexical/rich-text';
import { mergeRegister, $findMatchingParent } from '@lexical/utils';
import { DEFAULT_BLOCK_TYPE, BLOCK_TYPE } from '../constant';

export const useBlockFormat = () => {
    const [editor] = useLexicalComposerContext();
    const [blockType, setBlockType] = useState<BLOCK_TYPE>(DEFAULT_BLOCK_TYPE);

    /** block type menu on change */
    const onChange = useMemoizedFn((value: BLOCK_TYPE) => {
        updateBlockTypeInSelection(value);
    });

    /** update editor status */
    const updateBlockTypeInSelection = useMemoizedFn((newBlockType: BLOCK_TYPE) => {
        editor.update(() => {
            if (!editor.isEditable()) return;

            const selection = $getSelection();

            if (selection === null) return;

            if (newBlockType === BLOCK_TYPE.PARAGRAPH) {
                if (!$isRangeSelection(selection)) return;

                $setBlocksType(selection, () => $createParagraphNode());
            } else {
                if (blockType === newBlockType) return;

                /**
                 * create heading node (h1, h2, h3)
                 */
                $setBlocksType(selection, () => $createHeadingNode(newBlockType as HeadingTagType));
            }

            /** manual to focus the editor */
            setTimeout(() => {
                editor.focus();
            }, 150);
        });
    });

    const $updateToolbar = useMemoizedFn(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            setBlockType(DEFAULT_BLOCK_TYPE);
            return;
        }

        /**
         * get the tag name of the parent element
         */
        const anchorNode = selection.anchor.getNode();
        let element =
            anchorNode.getKey() === 'root'
                ? anchorNode
                : $findMatchingParent(anchorNode, e => {
                      const parent = e.getParent();
                      return parent !== null && $isRootOrShadowRoot(parent);
                  });
        if (element === null) {
            element = anchorNode.getTopLevelElementOrThrow();
        }

        const currentBlockType = (
            $isHeadingNode(element) ? element.getTag() : element.getType()
        ) as BLOCK_TYPE;

        if (Object.values(BLOCK_TYPE).includes(currentBlockType)) {
            setBlockType(currentBlockType || DEFAULT_BLOCK_TYPE);
        }
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
        blockType,
        onChange,
    };
};
