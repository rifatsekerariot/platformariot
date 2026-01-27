import { t } from '@milesight/shared/src/utils/tools';

import type { ControlPanelConfig } from '@/components/drawing-board/plugin/types';
import SignalQualityDialIcon from '../icon.svg';

export interface SignalQualityDialControlPanelConfig {
    rssi?: EntityOptionType;
    snr?: EntityOptionType;
    sf?: EntityOptionType;
    title?: string;
}

const signalQualityDialControlPanelConfig =
    (): ControlPanelConfig<SignalQualityDialControlPanelConfig> => {
        return {
            class: 'data_card',
            type: 'signalQualityDial',
            name: 'dashboard.plugin_name_signal_quality_dial',
            icon: SignalQualityDialIcon,
            defaultRow: 2,
            defaultCol: 2,
            minRow: 1,
            minCol: 1,
            maxRow: 4,
            maxCol: 4,
            configProps: [
                {
                    label: 'Signal Quality Dial Config',
                    controlSetItems: [
                        {
                            name: 'entitySelectRssi',
                            config: {
                                type: 'EntitySelect',
                                label: 'RSSI',
                                controllerProps: { name: 'rssi' },
                                componentProps: {
                                    entityType: ['PROPERTY'],
                                    entityValueType: ['LONG', 'DOUBLE'],
                                    entityAccessMod: ['R', 'RW'],
                                },
                            },
                        },
                        {
                            name: 'entitySelectSnr',
                            config: {
                                type: 'EntitySelect',
                                label: 'SNR',
                                controllerProps: { name: 'snr' },
                                componentProps: {
                                    entityType: ['PROPERTY'],
                                    entityValueType: ['LONG', 'DOUBLE'],
                                    entityAccessMod: ['R', 'RW'],
                                },
                            },
                        },
                        {
                            name: 'entitySelectSf',
                            config: {
                                type: 'EntitySelect',
                                label: 'SF',
                                controllerProps: { name: 'sf' },
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
                                    defaultValue: t('dashboard.plugin_name_signal_quality_dial'),
                                    rules: { maxLength: 35 },
                                },
                            },
                        },
                    ],
                },
            ],
        };
    };

export default signalQualityDialControlPanelConfig;
