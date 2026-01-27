import { t } from '@milesight/shared/src/utils/tools';

import type { ControlPanelConfig } from '@/components/drawing-board/plugin/types';
import AirQualityCardIcon from '../icon.svg';

export interface AirQualityCardControlPanelConfig {
    co2?: EntityOptionType;
    tvoc?: EntityOptionType;
    pm25?: EntityOptionType;
    pm10?: EntityOptionType;
    title?: string;
}

const airQualityCardControlPanelConfig =
    (): ControlPanelConfig<AirQualityCardControlPanelConfig> => {
        return {
            class: 'data_card',
            type: 'airQualityCard',
            name: 'dashboard.plugin_name_air_quality_card',
            icon: AirQualityCardIcon,
            defaultRow: 2,
            defaultCol: 2,
            minRow: 1,
            minCol: 1,
            maxRow: 4,
            maxCol: 4,
            configProps: [
                {
                    label: 'Air Quality Card Config',
                    controlSetItems: [
                        {
                            name: 'entitySelectCo2',
                            config: {
                                type: 'EntitySelect',
                                label: 'CO2',
                                controllerProps: { name: 'co2' },
                                componentProps: {
                                    entityType: ['PROPERTY'],
                                    entityValueType: ['LONG', 'DOUBLE'],
                                    entityAccessMod: ['R', 'RW'],
                                },
                            },
                        },
                        {
                            name: 'entitySelectTvoc',
                            config: {
                                type: 'EntitySelect',
                                label: 'TVOC',
                                controllerProps: { name: 'tvoc' },
                                componentProps: {
                                    entityType: ['PROPERTY'],
                                    entityValueType: ['LONG', 'DOUBLE'],
                                    entityAccessMod: ['R', 'RW'],
                                },
                            },
                        },
                        {
                            name: 'entitySelectPm25',
                            config: {
                                type: 'EntitySelect',
                                label: 'PM2.5',
                                controllerProps: { name: 'pm25' },
                                componentProps: {
                                    entityType: ['PROPERTY'],
                                    entityValueType: ['LONG', 'DOUBLE'],
                                    entityAccessMod: ['R', 'RW'],
                                },
                            },
                        },
                        {
                            name: 'entitySelectPm10',
                            config: {
                                type: 'EntitySelect',
                                label: 'PM10',
                                controllerProps: { name: 'pm10' },
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
                                    defaultValue: t('dashboard.plugin_name_air_quality_card'),
                                    rules: { maxLength: 35 },
                                },
                            },
                        },
                    ],
                },
            ],
        };
    };

export default airQualityCardControlPanelConfig;
