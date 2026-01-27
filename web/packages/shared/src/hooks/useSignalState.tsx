import type { Dispatch, SetStateAction } from 'react';
import { useRef, useCallback } from 'react';

type GetStateAction<S> = () => S;
export function useSignalState<S>(
    initialState: S | (() => S),
): [GetStateAction<S>, Dispatch<SetStateAction<S>>];

export function useSignalState<S = undefined>(): [
    GetStateAction<S | undefined>,
    Dispatch<SetStateAction<S | undefined>>,
];

export function useSignalState<S>(initialState?: S) {
    const stateRef = useRef(initialState);

    const setState = useCallback((value: S) => {
        stateRef.current = value;
    }, []);

    const getState = useCallback(() => stateRef.current, []);

    return [getState, setState];
}

export default useSignalState;
