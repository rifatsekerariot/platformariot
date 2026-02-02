import { useLayoutEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { useNavigate } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { CircularProgress } from '@mui/material';
import { iotLocalStorage, REGISTERED_KEY } from '@milesight/shared/src/utils/storage';
import { GradientBgContainer } from '@/components';
import { globalAPI, awaitWrap, isRequestSuccess, getResponseData } from '@/services/http';
import './style.less';

export default () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [registered, setRegistered] = useState<boolean>();

    useRequest(
        async () => {
            setLoading(true);

            const [error, resp] = await awaitWrap(globalAPI.getUserStatus());

            setLoading(false);

            if (!error && isRequestSuccess(resp)) {
                const isInit = !!getResponseData(resp)?.init;
                setRegistered(isInit);
                iotLocalStorage.setItem(REGISTERED_KEY, isInit);
                return;
            }

            const data = getResponseData(resp) ?? getResponseData(error?.response);
            const isInit = !!data?.init;
            setRegistered(isInit);
            iotLocalStorage.setItem(REGISTERED_KEY, isInit);
        },
        {
            debounceWait: 300,
        },
    );

    useLayoutEffect(() => {
        if (registered === undefined) return;
        if (registered) {
            navigate('/auth/login', { replace: true });
            return;
        }
        navigate('/auth/register', { replace: true });
    }, [registered, navigate]);

    return (
        <div className="ms-view ms-view-auth">
            {loading ? (
                <CircularProgress
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginTop: '-20px',
                        marginLeft: '-20px',
                    }}
                />
            ) : (
                <Outlet />
            )}
            <GradientBgContainer />
        </div>
    );
};
