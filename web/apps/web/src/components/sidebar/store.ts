import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DrawerProps } from '@mui/material';
import { iotLocalStorage, SIDEBAR_COLLAPSE_KEY } from '@milesight/shared/src/utils/storage';

interface SidebarStore {
    /**
     * Sidebar variant
     */
    variant: DrawerProps['variant'];

    /**
     * Whether the sidebar is open
     */
    open: boolean;

    /**
     * Whether the sidebar is shrink
     */
    shrink: boolean;

    /**
     * Update sidebar open status
     *
     * @param open Whether the sidebar is open
     */
    setOpen: (open: boolean) => void;

    /**
     * Update sidebar shrink
     * @param shrink Sidebar shrink
     */
    setShrink: (shrink: boolean) => void;

    /**
     * Update sidebar variant
     *
     * @param variant Sidebar variant
     */
    setVariant: (variant: SidebarStore['variant']) => void;
}

const useSidebarStore = create(
    immer<SidebarStore>(set => ({
        variant: 'permanent',
        open: false,
        shrink: iotLocalStorage.getItem(SIDEBAR_COLLAPSE_KEY) ?? true,
        setOpen: open => set({ open }),
        setShrink: shrink => set({ shrink }),
        setVariant: variant => set({ variant }),
    })),
);

export default useSidebarStore;
