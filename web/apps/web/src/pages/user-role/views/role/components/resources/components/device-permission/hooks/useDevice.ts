import { useState } from 'react';
import { useMemoizedFn } from 'ahooks';

/**
 * device operate hooks
 */
const useDevice = (getRoleDevices?: () => void) => {
    // ---------- add new device ------------------------
    const [addModalVisible, setAddModalVisible] = useState(false);

    const showAddModal = useMemoizedFn(() => {
        setAddModalVisible(true);
    });

    const handleModalCancel = useMemoizedFn(() => {
        setAddModalVisible(false);
    });

    const handleModalOk = useMemoizedFn(() => {
        getRoleDevices?.();
        setAddModalVisible(false);
    });

    return {
        addModalVisible,
        showAddModal,
        handleModalCancel,
        handleModalOk,
    };
};

export default useDevice;
