import { useEffect, useMemo } from 'react';
import { useControllableValue } from 'ahooks';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { hasEditable, hasReadOnly } from '../helper';
import type { IEditorProps } from '../types';

export const useEditable = (props: IEditorProps) => {
    const { mode } = props;
    const [editor] = useLexicalComposerContext();
    const [isEditable, setIsEditable] = useControllableValue<boolean>(props, {
        defaultValue: false,
        defaultValuePropName: 'defaultEditable',
        valuePropName: 'isEditable',
        trigger: 'onEditableChange',
    });

    useEffect(() => {
        editor.setEditable(!!isEditable);
    }, [editor, isEditable]);

    return useMemo(() => {
        // Read-write by default
        if (!mode) return [isEditable, setIsEditable] as const;

        // Rich text editable with write permission
        if (!hasEditable(mode)) return [false, () => void 0] as const;

        // Rich text read-only when read-only permission is available
        if (!hasReadOnly(mode)) return [true, () => void 0] as const;

        return [isEditable, setIsEditable] as const;
    }, [isEditable, mode, setIsEditable]);
};
