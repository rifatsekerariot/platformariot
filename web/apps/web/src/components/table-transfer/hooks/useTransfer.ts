import { useState, useMemo, useEffect, useRef } from 'react';
import { useMemoizedFn } from 'ahooks';
import { isNil } from 'lodash-es';

import { type GridValidRowModel } from '@mui/x-data-grid';

export interface UseTransferProps<T> {
    rows?: readonly T[];
    getRowId?: (row: T) => ApiKey;
    onChange: (values: T[]) => void;
}

/**
 * transfer data hooks
 */
const useTransfer = <T extends GridValidRowModel>(props?: UseTransferProps<T>) => {
    const { rows = [], getRowId, onChange } = props || {};

    const [checked, setChecked] = useState<T[]>([]);
    const [left, setLeft] = useState<readonly T[]>(rows);
    const [leftCheckedIds, setLeftCheckedIds] = useState<readonly ApiKey[]>([]);
    const [right, setRight] = useState<readonly T[]>([]);
    const [rightCheckedIds, setRightCheckedIds] = useState<readonly ApiKey[]>([]);

    /**
     * Getting the data in the a array that does not exist in the b array
     */
    const notExisted = useMemoizedFn((a: readonly T[], b: readonly T[]) => {
        return a.filter(item => {
            if (getRowId) {
                return !b.some(target => getRowId(item) === getRowId(target));
            }

            if (!isNil(item?.id)) {
                return !b.some(target => item.id === target.id);
            }

            return true;
        });
    });

    /**
     * Union the data in the a array that does not exist in the b array
     */
    const union = useMemoizedFn((a: readonly T[], b: readonly T[]) => {
        return [...a, ...notExisted(b, a)];
    });

    /**
     * Getting data that is common to both arrays
     */
    const intersection = useMemoizedFn((a: readonly T[], b: readonly T[]) => {
        return a.filter(item => {
            if (getRowId) {
                return b.some(target => getRowId(item) === getRowId(target));
            }

            if (!isNil(item?.id)) {
                return b.some(target => item.id === target.id);
            }

            return false;
        });
    });

    const latestRight = useRef(right);
    useEffect(() => {
        latestRight.current = right;
    }, [right]);

    const latestGetRowId = useRef(getRowId);
    useEffect(() => {
        latestGetRowId.current = getRowId;
    }, [getRowId]);

    const latestIntersection = useRef(intersection);
    useEffect(() => {
        latestIntersection.current = intersection;
    }, [intersection]);

    /**
     * update left data
     */
    useEffect(() => {
        const newLeft = rows || [];
        setLeft(newLeft);

        /**
         * update left table checked ids
         */
        const intersectionRows = latestIntersection.current(newLeft, latestRight.current);
        setLeftCheckedIds(
            intersectionRows
                .map(r => {
                    if (latestGetRowId?.current) {
                        return latestGetRowId.current(r);
                    }

                    if (!isNil(r?.id)) {
                        return r.id;
                    }

                    return null;
                })
                .filter(Boolean),
        );
    }, [rows]);

    /**
     * Getting left intersection
     */
    const leftChecked = useMemo(() => {
        if (getRowId) {
            return left.filter(item => leftCheckedIds.includes(getRowId(item)));
        }

        return left.filter(item => leftCheckedIds.includes(item.id));
    }, [leftCheckedIds, left, getRowId]);

    /**
     * Getting right intersection
     */
    const rightChecked = useMemo(() => {
        if (getRowId) {
            return right.filter(item => rightCheckedIds.includes(getRowId(item)));
        }

        return right.filter(item => rightCheckedIds.includes(item.id));
    }, [rightCheckedIds, right, getRowId]);

    /**
     * Move the selected data to the right
     */
    const handleCheckedRight = useMemoizedFn(() => {
        const newRight = union(right, leftChecked);

        setRight(newRight);

        onChange?.(newRight);
    });

    /**
     * Move the selected data to the left
     */
    const handleCheckedLeft = useMemoizedFn(() => {
        setLeftCheckedIds(prev => {
            const newIds = [...prev];

            return newIds.filter(id => !rightCheckedIds?.includes(id));
        });

        const newRight = notExisted(right, rightChecked);
        setRight(newRight);
        setRightCheckedIds([]);

        onChange?.(newRight);
    });

    /**
     * is disabled move right button
     */
    const notMovedLeftChecked = useMemo(() => {
        return notExisted(leftChecked, right);
    }, [leftChecked, right, notExisted]);

    return {
        left,
        right,
        checked,
        leftChecked,
        rightChecked,
        setChecked,
        leftCheckedIds,
        setLeftCheckedIds,
        rightCheckedIds,
        setRightCheckedIds,
        handleCheckedRight,
        handleCheckedLeft,
        notMovedLeftChecked,
    };
};

export default useTransfer;
