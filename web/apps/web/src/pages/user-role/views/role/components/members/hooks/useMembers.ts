import { useState } from 'react';
import { useMemoizedFn } from 'ahooks';

/**
 * members operate hooks
 */
const useMembers = (getUserMembers?: () => void) => {
    // ---------- add new members ------------------------
    const [addModalVisible, setAddModalVisible] = useState(false);

    const showAddModal = useMemoizedFn(() => {
        setAddModalVisible(true);
    });

    const handleModalCancel = useMemoizedFn(() => {
        setAddModalVisible(false);
    });

    const handleModalOk = useMemoizedFn(() => {
        getUserMembers?.();
        setAddModalVisible(false);
    });

    return {
        addModalVisible,
        showAddModal,
        handleModalCancel,
        handleModalOk,
    };
};

export default useMembers;
