import { t } from '@milesight/shared/src/utils/tools';

import type { ControlPanelConfig } from '@/components/drawing-board/plugin/types';
import AlertIndicatorIcon from '../icon.svg';

export interface AlertIndicatorControlPanelConfig {
    entity?: EntityOptionType;
    title?: string;
}

const alertIndicatorControlPanelConfig =
    (): ControlPanelConfig<AlertIndicatorControlPanelConfig> => {
        return {
            class: 'data_card',
            type: 'alertIndicator',
            name: 'dashboard.plugin_name_alert_indicator',
            icon: AlertIndicatorIcon,
            defaultRow: 1,
            defaultCol: 2,
            minRow: 1,
            minCol: 1,
            maxRow: 2,
            maxCol: 4,
            configProps: [
                {
                    label: 'Alert Indicator Config',
                    controlSetItems: [
                        {
                            name: 'entitySelect',
                            config: {
                                type: 'EntitySelect',
                                label: t('common.label.entity'),
                                controllerProps: {
                                    name: 'entity',
                                    rules: { required: true },
                                },
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
                                    defaultValue: t('dashboard.plugin_name_alert_indicator'),
                                    rules: { maxLength: 35 },
                                },
                            },
                        },
                    ],
                },
            ],
        };
    };

export default alertIndicatorControlPanelConfig;
