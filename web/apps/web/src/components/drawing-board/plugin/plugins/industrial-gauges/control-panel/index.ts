import { t } from '@milesight/shared/src/utils/tools';

import type { ControlPanelConfig } from '@/components/drawing-board/plugin/types';
import IndustrialGaugesIcon from '../icon.svg';

export interface IndustrialGaugesControlPanelConfig {
    adc?: EntityOptionType;
    adv?: EntityOptionType;
    modbus?: EntityOptionType;
    title?: string;
}

const industrialGaugesControlPanelConfig =
    (): ControlPanelConfig<IndustrialGaugesControlPanelConfig> => {
        return {
            class: 'data_card',
            type: 'industrialGauges',
            name: 'dashboard.plugin_name_industrial_gauges',
            icon: IndustrialGaugesIcon,
            defaultRow: 2,
            defaultCol: 2,
            minRow: 1,
            minCol: 1,
            maxRow: 4,
            maxCol: 4,
            configProps: [
                {
                    label: 'Industrial Gauges Config',
                    controlSetItems: [
                        {
                            name: 'entitySelectAdc',
                            config: {
                                type: 'EntitySelect',
                                label: 'ADC (4–20 mA / 0–10 V)',
                                controllerProps: { name: 'adc' },
                                componentProps: {
                                    entityType: ['PROPERTY'],
                                    entityValueType: ['LONG', 'DOUBLE'],
                                    entityAccessMod: ['R', 'RW'],
                                },
                            },
                        },
                        {
                            name: 'entitySelectAdv',
                            config: {
                                type: 'EntitySelect',
                                label: 'ADV',
                                controllerProps: { name: 'adv' },
                                componentProps: {
                                    entityType: ['PROPERTY'],
                                    entityValueType: ['LONG', 'DOUBLE'],
                                    entityAccessMod: ['R', 'RW'],
                                },
                            },
                        },
                        {
                            name: 'entitySelectModbus',
                            config: {
                                type: 'EntitySelect',
                                label: 'Modbus Register',
                                controllerProps: { name: 'modbus' },
                                componentProps: {
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
                                    defaultValue: t('dashboard.plugin_name_industrial_gauges'),
                                    rules: { maxLength: 35 },
                                },
                            },
                        },
                    ],
                },
            ],
        };
    };

export default industrialGaugesControlPanelConfig;
