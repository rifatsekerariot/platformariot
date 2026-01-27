/**
 * Parses header field into key-value pair
 * @param s - The string to parse, expected format "Key: Value"
 * @returns Tuple containing [key, value]. Value part is automatically trimmed
 *          and defaults to empty string when missing
 */
function parseField(s: string): [string, string] {
    const result = s.split(/:(.+)/).map(element => element.trim());
    return [result[0], result[1] || ''];
}

/**
 * Parses key-value pairs using equal sign delimiter
 * @param s - The string to parse, expected format "Key=Value"
 * @returns Tuple containing [key, value]. Preserves original spacing
 *          and defaults to empty string when value is missing
 */
function parseFieldWithEqual(s: string): [string, string] {
    const result = s.split(/=(['"]?)([^\s'"]+)\1/);
    return [result[0], result[2] || ''];
}

// Define the callback type for parseField
type ParseCallback = (s: string) => [string, string];

/**
 * Universal string parser with configurable callback
 * @param s - Raw string to be parsed
 * @param pareCallBack - Parser function that splits string into key-value tuple
 *                       (default: colon-separated parser)
 * @returns Object containing single key-value pair from parsed result
 */
function pareString(s: string, pareCallBack: ParseCallback = parseField): Record<string, string> {
    const result: Record<string, string> = {};
    const field = pareCallBack(s);
    result[field[0]] = field[1];
    return result;
}

/**
 * Parses URL encoded parameter string into key-value pairs
 * @param s - The query string to parse (format: "key1=val1&key2=val2")
 * @returns Object with decoded parameters, returns null for empty input.
 *          Preserves original spacing and handles empty values
 */
function parseParamsField(s: string): Record<string, string> | null {
    if (s === '') return null;

    const object: Record<string, string> = {};
    const allParamsArr = s.split(/&/);

    allParamsArr.forEach(element => {
        const field = element.split(/=/);
        object[field[0]] = field[1] || '';
    });

    return object;
}

export const convertor = {
    /**
     * Parses HTTP headers from single or multiple lines
     * @param data - Header string(s) to process (e.g. "Content-Type: application/json" or array of headers)
     * @returns Combined header object. Array items are merged in sequence
     *          using colon-separated parsing with automatic value trimming
     */
    header: (data: string | string[]): Record<string, string> => {
        let output: Record<string, string> = {};

        if (typeof data === 'string') {
            output = pareString(data);
        } else {
            data.forEach(element => {
                output = {
                    ...output,
                    ...pareString(element, parseField),
                };
            });
        }

        return output;
    },
    /**
     * Parses request body with multiple fallback strategies
     * @param data - Input data (JSON string, URL-encoded string, or array of key=value pairs)
     * @returns Parsed object. Prioritizes JSON > URL params > raw string for single input,
     *          merges array elements using equal-sign parsing when given array input
     */
    body: (data: string | string[]): Record<string, string> | unknown => {
        if (typeof data !== 'object') {
            try {
                return JSON.parse(data);
            } catch {
                try {
                    return parseParamsField(data);
                } catch {
                    return data;
                }
            }
        } else {
            let output: Record<string, string> = {};
            try {
                data.forEach(element => {
                    output = {
                        ...output,
                        ...pareString(element, parseFieldWithEqual),
                    };
                });
            } catch {
                output = data as any;
            }
            return output;
        }
    },
    parseParamsField,
};

export interface ReverseConvertorOptions {
    command: string;
    data: any;
    contentType?: string;
}

export const reverseConvertor = {
    /**
     * Converts header object to CLI-formatted arguments array
     * @param data - Header key-value pairs (e.g. { 'Content-Type': 'application/json' })
     * @param command - CLI option prefix (e.g. '-H' for headers)
     * @returns Array of formatted CLI arguments like ['-H Key: Value']
     */
    header: ({ data, command }: Omit<ReverseConvertorOptions, 'contentType'>): string[] => {
        const output: string[] = [];
        Object.entries(data).forEach(([key, value]) => {
            output.push(`${command} ${key}: ${value}`);
        });
        return output;
    },
    /**
     * Converts request body to CLI-formatted arguments array
     * @param data - Request payload (object or primitive value)
     * @param command - CLI option prefix (e.g. '-d' for data)
     * @param contentType - MIME type for payload processing
     * @returns Array of formatted CLI arguments
     */
    body: ({ data, command, contentType }: ReverseConvertorOptions): string[] => {
        const output: string[] = [];

        switch (contentType) {
            case 'multipart/form-data':
            case 'application/x-www-form-urlencoded': {
                if (typeof data !== 'object') {
                    output.push(`${command} ${data}`);
                } else {
                    try {
                        Object.entries(data).forEach(([key, value]) => {
                            output.push(`${command} ${key}=${value}`);
                        });
                    } catch {
                        output.push(`${command} ${data}`);
                    }
                }
                break;
            }
            default: {
                if (typeof data !== 'object') {
                    output.push(`${command} ${data}`);
                } else {
                    try {
                        output.push(`${command} ${JSON.stringify(data, null, 4)}`);
                    } catch {
                        output.push(`${command} ${data}`);
                    }
                }
                break;
            }
        }

        return output;
    },
};
