import { useEffect, useRef } from 'react';
import { useMemoizedFn } from 'ahooks';

import { $getNearestNodeFromDOMNode, NodeKey } from 'lexical';
import {
    $insertTableColumn__EXPERIMENTAL as $insertTableColumn,
    $insertTableRow__EXPERIMENTAL as $insertTableRow,
    TableNode,
} from '@lexical/table';
import { mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

interface IProps {
    setShouldListenMouseMove: React.Dispatch<React.SetStateAction<boolean>>;
    setShownRow: React.Dispatch<React.SetStateAction<boolean>>;
    setShownColumn: React.Dispatch<React.SetStateAction<boolean>>;
    tableDOMNodeRef: React.MutableRefObject<HTMLElement | null>;
}
export const useAction = ({
    setShouldListenMouseMove,
    setShownRow,
    setShownColumn,
    tableDOMNodeRef,
}: IProps) => {
    const [editor] = useLexicalComposerContext();
    const codeSetRef = useRef<Set<NodeKey>>(new Set());

    useEffect(() => {
        return mergeRegister(
            // Used to register a listener to listen for changes to nodes of type table node
            editor.registerMutationListener(
                TableNode,
                mutations => {
                    // Read the context state of the editor
                    editor.getEditorState().read(() => {
                        // Record the increase or decrease of a table, `shouldListenMouseMove` maintains the ability to determine if there is still a table in the rich text.
                        for (const [key, type] of mutations) {
                            switch (type) {
                                case 'created':
                                    codeSetRef.current.add(key);
                                    setShouldListenMouseMove(codeSetRef.current.size > 0);
                                    break;

                                case 'destroyed':
                                    codeSetRef.current.delete(key);
                                    setShouldListenMouseMove(codeSetRef.current.size > 0);
                                    break;

                                default:
                                    break;
                            }
                        }
                    });
                },
                // { skipInitialization: false },
            ),
        );
    }, [editor]);

    /** Operator buttons */
    const insertAction = useMemoizedFn((insertRow: boolean) => {
        editor.update(() => {
            if (tableDOMNodeRef.current) {
                const maybeTableNode = $getNearestNodeFromDOMNode(tableDOMNodeRef.current);
                maybeTableNode?.selectEnd();

                if (insertRow) {
                    // Add Row
                    $insertTableRow();
                    setShownRow(false);
                } else {
                    // Add Row
                    $insertTableColumn();
                    setShownColumn(false);
                }
            }
        });
    });

    return {
        insertAction,
    };
};
