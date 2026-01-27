import { useMemo } from 'react';
import cls from 'classnames';

import { useTheme, useTime } from '@milesight/shared/src/hooks';
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

    const { getTimeFormat } = useTime();
    const { matchTablet } = useTheme();
    const { getLatestEntityDetail } = useActivityEntity();
    const { wGrid = 2, hGrid = 1 } = useGridLayout(isPreview ? { w: 2, h: 1 } : pos);
    const { containerRef, showIconWidth } = useContainerRect();

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

    const displayValue = useMemo(() => {
        const raw = latestEntity?.rawData;
        if (!raw) return '-';
        const { entityValueAttribute } = raw;
        const { enum: enumStruct, unit } = entityValueAttribute || {};
        const v = entityStatus?.value;
        const str = v?.toString() ?? '-';
        if (enumStruct && str in enumStruct) {
            return String(enumStruct[str as keyof typeof enumStruct]);
        }
        return unit ? `${str} ${unit}` : str;
    }, [latestEntity, entityStatus]);

    const timestamp = useMemo(() => {
        const ts = entityStatus?.timestamp;
        return ts ? getTimeFormat(Number(ts)) : '';
    }, [entityStatus?.timestamp, getTimeFormat]);

    return (
        <div
            ref={containerRef}
            className={cls('ms-alert-indicator', {
                'ms-alert-indicator--preview': isPreview,
                [emphasisClass ?? '']: !!emphasisClass,
            })}
        >
            <div className="ms-alert-indicator__card">
                <div
                    className={cls('ms-alert-indicator__header', {
                        'mb-1': matchTablet,
                        'mb-2': !matchTablet,
                    })}
                >
                    <Tooltip className="ms-alert-indicator__title" autoEllipsis title={title} />
                </div>
                <div
                    className={cls('ms-alert-indicator__body', {
                        'ms-alert-indicator__body--center': hGrid <= 1,
                    })}
                >
                    <div
                        className={cls('ms-alert-indicator__value', {
                            'text-lg': wGrid > 1 && hGrid > 1,
                        })}
                    >
                        <Tooltip autoEllipsis title={displayValue} />
                    </div>
                </div>
                {hGrid > 1 && timestamp && (
                    <div className="ms-alert-indicator__footer">
                        <Tooltip autoEllipsis title={timestamp} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default View;
