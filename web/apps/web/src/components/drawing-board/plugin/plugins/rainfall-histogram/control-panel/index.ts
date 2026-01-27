import { t } from '@milesight/shared/src/utils/tools';

import type { ControlPanelConfig } from '@/components/drawing-board/plugin/types';
import RainfallHistogramIcon from '../icon.svg';

export interface RainfallHistogramControlPanelConfig {
    entity?: EntityOptionType;
    title?: string;
}

const rainfallHistogramControlPanelConfig =
    (): ControlPanelConfig<RainfallHistogramControlPanelConfig> => {
        return {
            class: 'data_card',
            type: 'rainfallHistogram',
            name: 'dashboard.plugin_name_rainfall_histogram',
            icon: RainfallHistogramIcon,
            defaultRow: 1,
            defaultCol: 2,
            minRow: 1,
            minCol: 1,
            maxRow: 2,
            maxCol: 4,
            configProps: [
                {
                    label: 'Rainfall Histogram Config',
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
                                    defaultValue: t('dashboard.plugin_name_rainfall_histogram'),
                                    rules: { maxLength: 35 },
                                },
                            },
                        },
                    ],
                },
            ],
        };
    };

export default rainfallHistogramControlPanelConfig;
