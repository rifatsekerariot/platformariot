import { t } from '@milesight/shared/src/utils/tools';

import type { ControlPanelConfig } from '@/components/drawing-board/plugin/types';
import StatusBadgeIcon from '../icon.svg';

export interface StatusBadgeControlPanelConfig {
    entity?: EntityOptionType;
    title?: string;
}

const statusBadgeControlPanelConfig =
    (): ControlPanelConfig<StatusBadgeControlPanelConfig> => {
        return {
            class: 'data_card',
            type: 'statusBadge',
            name: 'dashboard.plugin_name_status_badge',
            icon: StatusBadgeIcon,
            defaultRow: 1,
            defaultCol: 2,
            minRow: 1,
            minCol: 1,
            maxRow: 2,
            maxCol: 4,
            configProps: [
                {
                    label: 'Status Badge Config',
                    controlSetItems: [
                        {
                            name: 'entitySelect',
                            config: {
                                type: 'EntitySelect',
                                label: t('common.label.entity'),
                                controllerProps: { name: 'entity', rules: { required: true } },
                                componentProps: {
                                    required: true,
                                    entityType: ['PROPERTY'],
                                    entityValueType: ['STRING', 'LONG', 'DOUBLE', 'BOOLEAN'],
                                    entityAccessMod: ['R', 'RW'],
                                },
                            },
                        },
                        {
                            name: 'input',
                            config: {
                                type: 'Input',
                                label: t('common.label.title'),
                                controllerProps: {
                                    name: 'title',
                                    defaultValue: t('dashboard.plugin_name_status_badge'),
                                    rules: { maxLength: 35 },
                                },
                            },
                        },
                    ],
                },
            ],
        };
    };

export default statusBadgeControlPanelConfig;
