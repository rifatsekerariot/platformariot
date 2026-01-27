import { useMemoizedFn } from 'ahooks';
import {
    SerializedEditorState,
    $getSelection,
    $getRoot,
    $insertNodes,
    $setSelection,
} from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import type { EditorHandlers, IEditorProps } from '../types';

type IProps = Pick<IEditorProps, 'onEditableChange'>;
export const useTransmit = ({ onEditableChange }: IProps) => {
    const [editor] = useLexicalComposerContext();

    /** Get Rich Text editor instance */
    const getEditor = () => {
        return new Proxy(editor, {
            get: (target, prop) => {
                if (prop === 'setEditable') return onEditableChange;
                return Reflect.get(target, prop);
            },
        });
    };
    /** Get rich text html structure */
    const getEditorHtml = () => {
        return new Promise<string>(resolve => {
            editor.getEditorState().read(() => {
                const htmlString = $generateHtmlFromNodes(editor, null);
                resolve(htmlString);
            });
        });
    };
    /** Setting Rich Text Content */
    const setEditorContent = (content: string | SerializedEditorState) => {
        editor.setEditorState(editor.parseEditorState(content));
    };

    /**
     * insert to text to current selection
     */
    const insertTextContent = (text: string) => {
        editor.update(() => {
            if (!editor.isEditable()) return;

            const selection = $getSelection();

            if (selection === null) return;

            selection.insertText(text);
        });
    };

    /**
     * HTML -> Lexical
     */
    const setEditorHtmlContent = (htmlString: string, isFocus?: boolean) => {
        editor.update(() => {
            const root = $getRoot();

            /**
             * if the html string is empty then it will be cleared.
             */
            if (!htmlString) {
                /**
                 * Select the root
                 */
                root.select();

                /** clear all */
                root.clear();

                /**
                 * Remove focus from the editor
                 */
                if (!isFocus) $setSelection(null);
                return;
            }

            /**
             *  In the browser you can use the native DOMParser API to parse the HTML string.
             */
            const parser = new DOMParser();
            const dom = parser.parseFromString(htmlString, 'text/html');
            if (!dom) return;

            /**
             *  Once you have the DOM instance it's easy to generate LexicalNodes.
             */
            const nodes = $generateNodesFromDOM(editor, dom);
            if (!nodes) return;

            /**
             * Select the root
             */
            root.select();

            /** clear all */
            root.clear();

            /**
             * Insert them at a selection
             */
            $insertNodes(nodes);

            /**
             * Remove focus from the editor
             */
            if (!isFocus) $setSelection(null);
        });
    };

    return useMemoizedFn(
        (): EditorHandlers => ({
            getEditor,
            getEditorHtml,
            setEditorContent,
            insertTextContent,
            setEditorHtmlContent,
        }),
    );
};
