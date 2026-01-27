import { useMemo } from 'react';

const ALARM_SUFFIXES = ['_alarm', '_status'] as const;
const EMPHASIS_CLASS = 'widget--alarm';

function isAlarmKey(key: string | undefined): boolean {
    if (!key || typeof key !== 'string') return false;
    const k = key.toLowerCase();
    return ALARM_SUFFIXES.some(s => k.endsWith(s));
}

function isTruthyValue(val: unknown): boolean {
    if (val === true) return true;
    if (typeof val === 'number' && val > 0) return true;
    if (typeof val === 'string' && val.trim().length > 0) return true;
    return false;
}

export interface AlarmEmphasisResult {
    isAlarm: boolean;
    emphasisClass: string | undefined;
}

/** Pure: single entity. */
export function checkAlarmEmphasis(
    entity: EntityOptionType | null | undefined,
    entityStatus?: { value?: unknown } | null,
): AlarmEmphasisResult {
    const key = entity?.rawData?.entityKey;
    if (!isAlarmKey(key)) {
        return { isAlarm: false, emphasisClass: undefined };
    }
    const val = entityStatus?.value;
    const isAlarm = isTruthyValue(val);
    return {
        isAlarm,
        emphasisClass: isAlarm ? EMPHASIS_CLASS : undefined,
    };
}

/** Pure: multi-entity. Any entity with *_alarm/*_status + truthy value → alarm. */
export function checkAlarmEmphasisMulti(
    entities: (EntityOptionType | null | undefined)[],
    statusMap: Record<string, { value?: unknown } | null | undefined>,
): AlarmEmphasisResult {
    for (const entity of entities) {
        if (!entity?.value) continue;
        const status = statusMap[String(entity.value)];
        const r = checkAlarmEmphasis(entity, status ?? null);
        if (r.isAlarm) return r;
    }
    return { isAlarm: false, emphasisClass: undefined };
}

export interface UseAlarmEmphasisOptions {
    entity?: EntityOptionType | null;
    entityStatus?: { value?: unknown } | null;
}

/**
 * Convention: entity key ends with _alarm or _status, and status value is truthy → alarm.
 * Returns { isAlarm, emphasisClass } for widget root className (e.g. glow, color change).
 */
export function useAlarmEmphasis(options: UseAlarmEmphasisOptions) {
    const { entity, entityStatus } = options;

    return useMemo(
        () => checkAlarmEmphasis(entity ?? null, entityStatus ?? null),
        [entity?.rawData?.entityKey, entity?.value, entityStatus?.value],
    );
}
