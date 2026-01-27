import { useEffect } from 'react';
import { TableCellNode } from '@lexical/table';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

interface IProps {
    tableCellNode: TableCellNode;
    updateTableCellNode: React.Dispatch<React.SetStateAction<TableCellNode>>;
}
export const useMutation = ({ tableCellNode, updateTableCellNode }: IProps) => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // Listening for changes to nodes of type `TableCellNode`
        return editor.registerMutationListener(
            TableCellNode,
            nodeMutations => {
                // Check if the node is updated
                const nodeUpdated = nodeMutations.get(tableCellNode.getKey()) === 'updated';
                if (!nodeUpdated) return;

                // Get the latest tableCellNode
                editor.getEditorState().read(() => {
                    updateTableCellNode(tableCellNode.getLatest());
                });
            },
            // { skipInitialization: true },
        );
    }, [editor, tableCellNode]);
};
