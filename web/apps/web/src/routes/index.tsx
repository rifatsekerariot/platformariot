import RootLayout from '@/layouts';
import DynamicRedirect from '@/components/dynamic-redirect';
import routes from './routes';
import ErrorBoundary from './error-boundary';

export default [
    {
        path: '/',
        element: <RootLayout />,
        children: [
            {
                path: '/',
                element: <DynamicRedirect />,
            },
            ...routes,
        ],
        ErrorBoundary,
    },
];
