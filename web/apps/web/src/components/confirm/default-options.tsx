import { merge } from 'lodash-es';
import { ErrorIcon, CancelIcon, InfoIcon, CheckCircleIcon } from '@milesight/shared/src/components';
import { GlobalOptions, ConfirmOptions, FinalOptions } from './types';

export const defaultGlobalOptions: GlobalOptions = {
    disabledBackdropClose: true,
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    dialogProps: {
        disableEscapeKeyDown: true,
    },
    dialogContentProps: {
        sx: { width: 400 },
    },
    dialogActionsProps: {
        sx: {
            padding: 3,
            pt: 1,
        },
    },
    confirmButtonProps: {
        color: 'primary',
        variant: 'contained',
        sx: {
            textTransform: 'none',
        },
    },
    cancelButtonProps: {
        autoFocus: true,
        color: 'primary',
        variant: 'outlined',
        sx: {
            textTransform: 'none',
            mr: 0.5,
            '&:last-child': {
                mr: 0,
            },
        },
    },
};

export const defaultIconMap: Record<NonNullable<ConfirmOptions['type']>, React.ReactNode> = {
    success: <CheckCircleIcon />,
    error: <CancelIcon />,
    warning: <ErrorIcon />,
    info: <InfoIcon />,
};

export const handleOverrideOptions = (
    globalOptions?: GlobalOptions,
    confirmOptions?: ConfirmOptions,
): FinalOptions => merge({}, defaultGlobalOptions, globalOptions, confirmOptions);
