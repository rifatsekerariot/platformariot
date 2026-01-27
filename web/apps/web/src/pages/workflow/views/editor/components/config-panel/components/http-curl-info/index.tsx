import React, { useState, useEffect } from 'react';
import { apiOrigin } from '@milesight/shared/src/config';
import { API_PREFIX } from '@/services/http';
import DataEditor from '../data-editor';
import { HTTP_URL_PATH_PATTERN } from '../../../../constants';

interface Props {
    title?: string;
    data?: HttpinNodeDataType['parameters'];
    credential?: {
        username?: string;
        password?: string;
    };
    urlGenerator?: (data: Props['data'], credential: Props['credential']) => string;
}

const CURL_COMMAND_LINE_BREAK = ' \\\n';

/**
 * Generate cURL command for HTTP request and display it in a DataEditor component.
 */
const HttpCurlInfo: React.FC<Props> = ({ title, data, credential, urlGenerator }) => {
    const [command, setCommand] = useState('');

    useEffect(() => {
        const { method, url } = data || {};
        let finalUrl = '';

        if (urlGenerator) {
            finalUrl = urlGenerator(data, credential);
        } else {
            finalUrl = [API_PREFIX, 'workflow-http-in', credential?.username || '', url]
                .join('/')
                .replace(/\/+/g, '/');
            finalUrl = `${apiOrigin}${finalUrl}`;
        }

        if (!method || !HTTP_URL_PATH_PATTERN.test(url || '')) {
            setCommand('');
            return;
        }
        const command = [`curl -X ${method} '${finalUrl}'`];
        const { username, password } = credential || {};

        command.push(...["-H ' '", "-d ' '"]);
        if (username && password) {
            command.push(`-u '${username}:${password}'`);
        }

        setCommand(command.join(CURL_COMMAND_LINE_BREAK));
    }, [data, credential, urlGenerator]);

    return (
        <div className="ms-http-curl-info">
            <DataEditor
                readonly
                title={title || 'cURL'}
                lang="text"
                extendable={false}
                variableSelectable={false}
                value={command}
            />
        </div>
    );
};

export default HttpCurlInfo;
