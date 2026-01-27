import { t } from '@milesight/shared/src/utils/tools';

import type { ControlPanelConfig } from '@/components/drawing-board/plugin/types';
import CounterCardIcon from '../icon.svg';

export interface CounterCardControlPanelConfig {
    entity?: EntityOptionType;
    title?: string;
}

const counterCardControlPanelConfig =
    (): ControlPanelConfig<CounterCardControlPanelConfig> => {
        return {
            class: 'data_card',
            type: 'counterCard',
            name: 'dashboard.plugin_name_counter_card',
            icon: CounterCardIcon,
            defaultRow: 1,
            defaultCol: 2,
            minRow: 1,
            minCol: 1,
            maxRow: 2,
            maxCol: 4,
            configProps: [
                {
                    label: 'Counter Card Config',
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
                                    entityValueType: ['LONG', 'DOUBLE'],
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
                                    defaultValue: t('dashboard.plugin_name_counter_card'),
                                    rules: { maxLength: 35 },
                                },
                            },
                        },
                    ],
                },
            ],
        };
    };

export default counterCardControlPanelConfig;
