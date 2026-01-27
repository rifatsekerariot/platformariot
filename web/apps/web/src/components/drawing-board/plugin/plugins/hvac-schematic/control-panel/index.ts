import { t } from '@milesight/shared/src/utils/tools';

import type { ControlPanelConfig } from '@/components/drawing-board/plugin/types';
import HvacSchematicIcon from '../icon.svg';

export interface HvacSchematicControlPanelConfig {
    fanStatus?: EntityOptionType;
    valveStatus?: EntityOptionType;
    title?: string;
}

const hvacSchematicControlPanelConfig =
    (): ControlPanelConfig<HvacSchematicControlPanelConfig> => {
        return {
            class: 'data_card',
            type: 'hvacSchematic',
            name: 'dashboard.plugin_name_hvac_schematic',
            icon: HvacSchematicIcon,
            defaultRow: 2,
            defaultCol: 2,
            minRow: 1,
            minCol: 1,
            maxRow: 4,
            maxCol: 4,
            configProps: [
                {
                    label: 'HVAC Schematic Config',
                    controlSetItems: [
                        {
                            name: 'entitySelectFan',
                            config: {
                                type: 'EntitySelect',
                                label: 'Fan Status',
                                controllerProps: { name: 'fanStatus' },
                                componentProps: {
                                    entityType: ['PROPERTY'],
                                    entityValueType: ['STRING', 'LONG', 'DOUBLE', 'BOOLEAN'],
                                    entityAccessMod: ['R', 'RW'],
                                },
                            },
                        },
                        {
                            name: 'entitySelectValve',
                            config: {
                                type: 'EntitySelect',
                                label: 'Valve Status',
                                controllerProps: { name: 'valveStatus' },
                                componentProps: {
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
                                    defaultValue: t('dashboard.plugin_name_hvac_schematic'),
                                    rules: { maxLength: 35 },
                                },
                            },
                        },
                    ],
                },
            ],
        };
    };

export default hvacSchematicControlPanelConfig;
