import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';
import { globalAPI, awaitWrap, isRequestSuccess } from '@/services/http';

interface BackendReadyCheckProps {
    children: React.ReactNode;
}

/**
 * BackendReadyCheck Component
 * 
 * Polls /api/v1/user/status until backend is ready, then renders children.
 * Shows loading screen with message while waiting.
 */
const MAX_RETRIES = 10; // En fazla 10 deneme, sonra uygulama yine de açılsın

const BackendReadyCheck: React.FC<BackendReadyCheckProps> = ({ children }) => {
    const { getIntlText } = useI18n();
    const [isReady, setIsReady] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let mounted = true;
        let timeoutId: NodeJS.Timeout;
        let currentRetry = 0;

        const checkBackend = async () => {
            const [error, resp] = await awaitWrap(globalAPI.getUserStatus());

            if (!mounted) return;

            if (!error && isRequestSuccess(resp)) {
                setIsReady(true);
                return;
            }

            const status = resp?.status ?? error?.response?.status;
            if (status === 401 || status === 403) {
                setIsReady(true);
                return;
            }

            currentRetry++;
            setRetryCount(currentRetry);

            if (currentRetry >= MAX_RETRIES) {
                setIsReady(true);
                return;
            }

            const delay = Math.min(1000 + currentRetry * 500, 3000);
            timeoutId = setTimeout(checkBackend, delay);
        };

        checkBackend();

        return () => {
            mounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    if (isReady) {
        return <>{children}</>;
    }

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--body-background)',
                zIndex: 9999,
            }}
        >
            <CircularProgress size={48} sx={{ mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
                {getIntlText('common.message.backend_initializing') || 'Initializing backend...'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {getIntlText('common.message.backend_initializing_desc') || 'Please wait while the system is starting up.'}
            </Typography>
        </Box>
    );
};

export default BackendReadyCheck;
