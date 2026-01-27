import { t } from '@milesight/shared/src/utils/tools';

import type { ControlPanelConfig } from '@/components/drawing-board/plugin/types';
import ThermostatDialIcon from '../icon.svg';

export interface ThermostatDialControlPanelConfig {
    entity?: EntityOptionType;
    title?: string;
}

const thermostatDialControlPanelConfig =
    (): ControlPanelConfig<ThermostatDialControlPanelConfig> => {
        return {
            class: 'data_card',
            type: 'thermostatDial',
            name: 'dashboard.plugin_name_thermostat_dial',
            icon: ThermostatDialIcon,
            defaultRow: 1,
            defaultCol: 2,
            minRow: 1,
            minCol: 1,
            maxRow: 2,
            maxCol: 4,
            configProps: [
                {
                    label: 'Thermostat Dial Config',
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
                                    defaultValue: t('dashboard.plugin_name_thermostat_dial'),
                                    rules: { maxLength: 35 },
                                },
                            },
                        },
                    ],
                },
            ],
        };
    };

export default thermostatDialControlPanelConfig;
