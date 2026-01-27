import minimistParser from 'minimist';
import { merge as mergeObject } from 'lodash-es';
import options from './options';
import { convertor } from './convertor';

/**
 * Parses command-line string into tokenized arguments
 * @param s Raw CLI string (supports escaped newlines and quoted strings)
 * @returns Processed argument array with normalized spacing and quotes removed
 */
function matchArgv(s: string): string[] {
    return s
        .replace(/\\\n/g, ' ')
        .match(/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|[^\s]+/g)!
        .map((token: string): string => {
            if (
                (token.startsWith(`'`) && token.endsWith(`'`)) ||
                (token.startsWith(`"`) && token.endsWith(`"`))
            ) {
                return token.substring(1, token.length - 1);
            }
            return token;
        });
}

export interface Result {
    url?: string;
    header?: Record<string, string>;
    data?: any;
    params?: Record<string, string> | null;
    method?: HttpMethodType | Lowercase<HttpMethodType> | (string & {});
    [key: string]: any;
}

/**
 * Converts cURL command to structured request parameters
 * @param data cURL command string or tokenized arguments array
 * @returns Object containing parsed request components (method, URL, headers, etc)
 */
export function curl2Json(data: string | string[]): Result {
    if (typeof data === 'string' || data instanceof String) {
        data = matchArgv(data as string);
    }

    const argv = minimistParser(data);
    const result: Result | null = {};

    // console.log('000', { argv });
    if (argv._[1]) {
        result.url = argv._[1].replace(/'/g, '');
    }

    const extraFields: Record<string, any> = {};

    options.forEach(({ name, alias, implicitFields, convertor }) => {
        const value = alias.map(key => argv[key]).filter(val => val)[0];

        if (!value) return;
        Object.assign(extraFields, implicitFields);

        if (convertor) {
            result[name] = convertor(value);
        } else {
            result[name] = value;
        }
    });
    mergeObject(result, extraFields);

    if (result.url) {
        const url = new URL(result.url);
        result.url = url.origin + url.pathname;
        const params = new URLSearchParams(url.search);
        if (Array.from(params).length) {
            result.params = convertor.parseParamsField(params.toString());
        }
    }

    if (!result.method) {
        // When the `data` parameter exists, the default request method is `POST`,
        // otherwise it is `GET`
        result.method = result.data ? 'POST' : 'GET';
    }

    return result;
}

/**
 * Converts structured request parameters to CURL command
 * @param options Request parameters object containing method, URL, headers, etc
 * @returns Formatted CURL command string
 */
export function json2Curl(options: Result): string {
    const escapeQuotes = (str: string) => str.replace(/'/g, "'\\''");
    const { method = 'GET', url, header, data, params } = options;

    // Process query parameters
    const query = params ? `?${new URLSearchParams(params)}` : '';
    const fullUrl = `${url}${query}`;

    const command = [`curl -X ${method.toUpperCase()} '${fullUrl}'`];

    // Add request header
    if (header) {
        Object.entries(header).forEach(([key, value]) => {
            command.push(`-H '${key}: ${value}'`);
        });
    }

    // Process request body
    if (data) {
        const contentType = header?.['Content-Type'];
        let payload = '';

        if (contentType?.includes('json')) {
            payload = escapeQuotes(JSON.stringify(data, null, 2));
        } else if (contentType?.includes('x-www-form-urlencoded')) {
            payload = new URLSearchParams(data).toString();
        } else {
            payload = escapeQuotes(JSON.stringify(data));
        }

        command.push(`-d '${payload}'`);
    }

    return command.join(' \\\n');
}
