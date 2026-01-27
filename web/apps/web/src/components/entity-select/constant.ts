import type { TabType } from './types';

export const TabOptions: { label: string; value: TabType }[] = [
    {
        label: 'common.label.entity',
        value: 'entity',
    },
    {
        label: 'common.label.by_device',
        value: 'device',
    },
];

export const DEFAULT_DEVICE_LABEL_KEY = 'common.label.no_device_entity';
