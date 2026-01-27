import { useState } from 'react';
import { useMemoizedFn } from 'ahooks';

/**
 * dashboard operate hooks
 */
const useDashboard = (getRoleDashboard?: () => void) => {
    // ---------- add new dashboard ------------------------
    const [addModalVisible, setAddModalVisible] = useState(false);

    const showAddModal = useMemoizedFn(() => {
        setAddModalVisible(true);
    });

    const handleModalCancel = useMemoizedFn(() => {
        setAddModalVisible(false);
    });

    const handleModalOk = useMemoizedFn(() => {
        getRoleDashboard?.();
        setAddModalVisible(false);
    });

    return {
        addModalVisible,
        showAddModal,
        handleModalCancel,
        handleModalOk,
    };
};

export default useDashboard;
