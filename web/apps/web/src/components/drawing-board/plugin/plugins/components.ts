import { isFileName } from '@milesight/shared/src/utils/tools';

/**
 * Plugin names to load (must match control-panel folders).
 * Uses same source as useLoadPlugins controlPanelsMap.
 */
const folderNames = (() => {
    const getFolderName = (modules: ModuleType) => {
        const bucket: string[] = [];
        for (const path of Object.keys(modules)) {
            const m = path.match(/\/([^/]+)\/control-panel\/index\.ts$/);
            const folder = m?.[1];
            if (!folder || bucket.includes(folder) || isFileName(folder)) continue;
            bucket.push(folder);
        }
        return bucket.sort();
    };

    const modules = import.meta.glob('./*/control-panel/index.ts');
    return getFolderName(modules);
})();

export default folderNames;
