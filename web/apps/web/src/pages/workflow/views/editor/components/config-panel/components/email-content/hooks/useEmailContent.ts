import { useState, useRef, useEffect } from 'react';
import { useMemoizedFn } from 'ahooks';
import { isEqual } from 'lodash-es';

import { type EditorHandlers } from '@milesight/shared/src/components';

export function useEmailContent(
    content: string,
    setContent: (v: React.SetStateAction<string>) => void,
) {
    const [modalVisible, setModalVisible] = useState(false);
    const editorRef = useRef<EditorHandlers>(null);
    const changeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /**
     * small windows editor content stored
     */
    const smallEditorContentRef = useRef<string>('');

    const showModal = useMemoizedFn(async () => {
        setModalVisible(true);
    });

    const hiddenModal = useMemoizedFn(() => setModalVisible(false));

    useEffect(() => {
        if (isEqual(content, smallEditorContentRef.current)) {
            return;
        }

        smallEditorContentRef.current = content;
        editorRef.current?.setEditorHtmlContent(content);
    }, [content]);

    const handleSmallEditorChange = useMemoizedFn(() => {
        if (changeTimeoutRef.current) {
            clearTimeout(changeTimeoutRef.current);
            changeTimeoutRef.current = null;
        }

        changeTimeoutRef.current = setTimeout(async () => {
            const richTextContent = await editorRef.current?.getEditorHtml();
            const newContent = richTextContent || '';
            if (isEqual(smallEditorContentRef.current, newContent)) return;

            smallEditorContentRef.current = newContent;
            setContent(newContent);
        }, 150);
    });

    return {
        modalVisible,
        showModal,
        hiddenModal,
        editorRef,
        handleSmallEditorChange,
    };
}
