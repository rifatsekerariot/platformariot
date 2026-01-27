import { t } from '@milesight/shared/src/utils/tools';

import type { ControlPanelConfig } from '@/components/drawing-board/plugin/types';
import NetworkTableIcon from '../icon.svg';

export interface NetworkTableControlPanelConfig {
    entity?: EntityOptionType;
    title?: string;
}

const networkTableControlPanelConfig =
    (): ControlPanelConfig<NetworkTableControlPanelConfig> => {
        return {
            class: 'data_card',
            type: 'networkTable',
            name: 'dashboard.plugin_name_network_table',
            icon: NetworkTableIcon,
            defaultRow: 2,
            defaultCol: 2,
            minRow: 1,
            minCol: 1,
            maxRow: 4,
            maxCol: 4,
            configProps: [
                {
                    label: 'Network Table Config',
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
                                    defaultValue: t('dashboard.plugin_name_network_table'),
                                    rules: { maxLength: 35 },
                                },
                            },
                        },
                    ],
                },
            ],
        };
    };

export default networkTableControlPanelConfig;
