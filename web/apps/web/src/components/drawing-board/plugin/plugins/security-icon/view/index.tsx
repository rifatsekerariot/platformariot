import { useMemo } from 'react';
import cls from 'classnames';

import { useTheme } from '@milesight/shared/src/hooks';
import * as Icons from '@milesight/shared/src/components/icons';
import { Tooltip } from '@/components';
import {
    useActivityEntity,
    useGridLayout,
    useContainerRect,
    useAlarmEmphasis,
} from '@/components/drawing-board/plugin/hooks';
import { useSource } from './hooks';
import type { BoardPluginProps } from '@/components/drawing-board/plugin/types';
import './style.less';

interface ViewConfig {
    entity?: EntityOptionType;
    title?: string;
}

interface Props {
    widgetId: ApiKey;
    dashboardId: ApiKey;
    config: ViewConfig;
    configJson: BoardPluginProps;
}

const View = (props: Props) => {
    const { config, configJson, widgetId, dashboardId } = props;
    const { title, entity } = config || {};
    const { isPreview, pos } = configJson || {};

    const { matchTablet } = useTheme();
    const { getLatestEntityDetail } = useActivityEntity();
    const { wGrid = 2, hGrid = 1 } = useGridLayout(isPreview ? { w: 2, h: 1 } : pos);
    const { containerRef } = useContainerRect();

    const latestEntity = useMemo(() => {
        if (!entity) return undefined;
        return getLatestEntityDetail(entity) as EntityOptionType | undefined;
    }, [entity, getLatestEntityDetail]);

    const { entityStatus } = useSource({
        entity: latestEntity,
        widgetId,
        dashboardId,
    });

    const { emphasisClass } = useAlarmEmphasis({
        entity: latestEntity,
        entityStatus: entityStatus ?? null,
    });

    const label = useMemo(() => {
        const raw = latestEntity?.rawData;
        if (!raw) return '—';
        const { entityValueAttribute } = raw;
        const { enum: enumStruct, unit } = entityValueAttribute || {};
        const v = entityStatus?.value;
        const str = v?.toString() ?? '—';
        if (enumStruct && str in enumStruct) {
            return String(enumStruct[str as keyof typeof enumStruct]);
        }
        return unit ? `${str} ${unit}` : str;
    }, [latestEntity, entityStatus]);

    const Icon = Icons.LockIcon as React.ComponentType<{ sx?: object }>;

    return (
        <div
            ref={containerRef}
            className={cls('ms-security-icon', {
                'ms-security-icon--preview': isPreview,
                [emphasisClass ?? '']: !!emphasisClass,
            })}
        >
            <div className="ms-security-icon__card">
                <div
                    className={cls('ms-security-icon__header', {
                        'mb-1': matchTablet,
                        'mb-2': !matchTablet,
                    })}
                >
                    <Tooltip className="ms-security-icon__title" autoEllipsis title={title} />
                </div>
                <div className="ms-security-icon__body">
                    <Icon sx={{ fontSize: hGrid > 1 ? 32 : 24, color: 'var(--gray-5)' }} />
                    <Tooltip className="ms-security-icon__label" autoEllipsis title={label} />
                </div>
            </div>
        </div>
    );
};

export default View;
