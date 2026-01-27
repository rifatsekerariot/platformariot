import { t } from '@milesight/shared/src/utils/tools';

import type { ControlPanelConfig } from '@/components/drawing-board/plugin/types';
import WindRoseIcon from '../icon.svg';

export interface WindRoseControlPanelConfig {
    windDirection?: EntityOptionType;
    windSpeed?: EntityOptionType;
    title?: string;
}

const windRoseControlPanelConfig =
    (): ControlPanelConfig<WindRoseControlPanelConfig> => {
        return {
            class: 'data_card',
            type: 'windRose',
            name: 'dashboard.plugin_name_wind_rose',
            icon: WindRoseIcon,
            defaultRow: 2,
            defaultCol: 2,
            minRow: 1,
            minCol: 1,
            maxRow: 4,
            maxCol: 4,
            configProps: [
                {
                    label: 'Wind Rose Config',
                    controlSetItems: [
                        {
                            name: 'entitySelectWindDir',
                            config: {
                                type: 'EntitySelect',
                                label: 'Wind Direction',
                                controllerProps: { name: 'windDirection' },
                                componentProps: {
                                    entityType: ['PROPERTY'],
                                    entityValueType: ['LONG', 'DOUBLE'],
                                    entityAccessMod: ['R', 'RW'],
                                },
                            },
                        },
                        {
                            name: 'entitySelectWindSpeed',
                            config: {
                                type: 'EntitySelect',
                                label: 'Wind Speed',
                                controllerProps: { name: 'windSpeed' },
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
                                    defaultValue: t('dashboard.plugin_name_wind_rose'),
                                    rules: { maxLength: 35 },
                                },
                            },
                        },
                    ],
                },
            ],
        };
    };

export default windRoseControlPanelConfig;
