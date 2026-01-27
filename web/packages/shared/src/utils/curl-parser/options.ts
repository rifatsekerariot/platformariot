import { convertor, reverseConvertor, type ReverseConvertorOptions } from './convertor';

export interface Option {
    /**
     * The curl command option name
     */
    name: string;
    /**
     * The curl command option alias, such as `-b` or `--cookie`, the first item is
     * long alias, and if there is a second item, it is short alias.
     */
    alias: string[];
    /**
     * Implicit that another field is required when this field is used, such as
     * `--data-urlencode` means `Content-Type: application/x-www-form-urlencoded` is
     * required.
     */
    implicitFields?: Record<string, any>;
    /**
     * The curl command option description
     */
    description?: string;
    /**
     * The convertor function for the option, which converts the option value to a specific type.
     */
    convertor?: ((data: string | string[]) => any) | null;

    /**
     * The convertor that converts the data to command line arguments.
     */
    reverseConvertor?: ((data: ReverseConvertorOptions) => string[]) | null;
}

const options: Option[] = [
    {
        name: 'cookie',
        alias: ['cookie', 'b'],
        description:
            '<name=data> Supply cookie with request. If no =, then specifies the cookie file to use (see -c).',
        convertor: null,
    },
    {
        name: 'cookie-jar',
        alias: ['cookie-jar', 'c'],
        description: '<file name> File to save response cookies to.',
        convertor: null,
    },
    {
        name: 'data',
        // alias: ['d', 'data', 'data-raw', 'data-urlencode', 'data-binary'],
        alias: ['data-raw', 'd', 'data', 'data-binary'],
        description: '<data> Send specified data in POST request. Details provided below.',
        convertor: convertor.body,
        reverseConvertor: reverseConvertor.body,
    },
    {
        name: 'data',
        alias: ['data-urlencode'],
        implicitFields: {
            header: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        },
        description:
            'Similar to the other -d, --data options with the exception that this performs URL-encoding',
        convertor: convertor.body,
        reverseConvertor: reverseConvertor.body,
    },
    {
        name: 'data',
        alias: ['form', 'F'],
        implicitFields: {
            header: {
                'Content-Type': 'multipart/form-data',
            },
        },
        description: '<name=content> Submit form data.',
        convertor: convertor.body,
        reverseConvertor: reverseConvertor.body,
    },
    {
        name: 'fail',
        alias: ['fail', 'f'],
        description: "Fail silently (don't output HTML error form if returned).",
        convertor: null,
    },
    {
        name: 'header',
        alias: ['header', 'H'],
        description: '<header> Headers to supply with request.',
        convertor: convertor.header,
        reverseConvertor: reverseConvertor.header,
    },
    {
        name: 'include',
        alias: ['include', 'i'],
        description: 'Include HTTP headers in the output.',
        convertor: null,
    },
    {
        name: 'head',
        alias: ['head', 'I'],
        description: 'Fetch headers only.',
        convertor: null,
    },
    {
        name: 'insecure',
        alias: ['insecure', 'k'],
        description: 'Allow insecure connections to succeed.',
        convertor: null,
    },
    {
        name: 'location',
        alias: ['location', 'L'],
        description: 'Follow redirects.',
        convertor: null,
    },
    {
        name: 'output',
        alias: ['output', 'o'],
        description:
            '<file> Write output to . Can use --create-dirs in conjunction with this to create any directories specified in the -o path.',
        convertor: null,
    },
    {
        name: 'remote-name',
        alias: ['remote-name', 'O'],
        description:
            'Write output to file named like the remote file (only writes to current directory).',
        convertor: null,
    },
    {
        name: 'silent',
        alias: ['silent', 's'],
        description: 'Silent (quiet) mode. Use with -S to force it to show errors.',
        convertor: null,
    },
    {
        name: 'verbose',
        alias: ['verbose', 'v'],
        description: 'Provide more information (useful for debugging).',
        convertor: null,
    },
    {
        name: 'write-out',
        alias: ['write-out', 'w'],
        description:
            '<format> Make curl display information on stdout after a completed transfer. See man page for more details on available variables.',
        convertor: null,
    },
    {
        name: 'method',
        alias: ['request', 'X'],
        description: 'The request method to use.',
        convertor: null,
    },
    {
        name: 'user-agent',
        alias: ['user-agent', 'A'],
        description: 'Specify the User-Agent send to the HTTP server.',
        convertor: null,
    },
    {
        name: 'referer',
        alias: ['referer', 'e'],
        description: 'Sends the "Referrer Page" information to the HTTP server.',
        convertor: null,
    },
    {
        name: 'user',
        alias: ['user', 'u'],
        description: 'Sends the "Authorization Token" header to the HTTP server.',
        convertor: null,
    },
];

export default options;
