import { useMemo } from 'react';
import { TextNode, ParagraphNode } from 'lexical';
import { HeadingNode } from '@lexical/rich-text';
import { type InitialConfigType } from '@lexical/react/LexicalComposer';

import { TableNodes, ExtendedTextNode } from '../nodes';
import { NAMESPACE } from '../constant';
import { EditorTheme } from '../themes';
import { exportMap } from '../helper';

import type { IEditorProps } from '../types';

/**
 * editor global configuration
 */
export const useEditConfigure = (props: IEditorProps) => {
    const { enableTable = false } = props || {};

    return useMemo((): InitialConfigType => {
        return {
            namespace: NAMESPACE,
            nodes: [
                ...(enableTable ? TableNodes : []),
                HeadingNode,
                ParagraphNode,
                ExtendedTextNode,
                {
                    replace: TextNode,
                    with: (node: TextNode) => new ExtendedTextNode(node.__text),
                    withKlass: ExtendedTextNode,
                },
            ],
            onError(error: Error) {
                throw error;
            },
            theme: EditorTheme,
            html: {
                export: exportMap,
            },
        };
    }, [enableTable]);
};
