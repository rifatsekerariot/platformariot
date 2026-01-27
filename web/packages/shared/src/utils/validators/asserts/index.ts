/* eslint-disable no-useless-escape */
import { isEqual as _isEqual } from 'lodash-es';
import validator from 'validator';

/**
 * Check whether the value is empty
 */
export function isEmpty(value: any, options?: validator.IsEmptyOptions): boolean {
    if (typeof value === 'string') {
        return validator.isEmpty(value, options);
    }
    return value === null || value === undefined || value.length === 0;
}

/**
 * Check if the `value` contains `seed`
 */
export function isContains(value: string, seed: any): boolean {
    return validator.contains(value, seed);
}

/**
 * Check if the arguments is equal
 * The bottom layer quotes lodash's isEqual
 */
export function isEqual(valueA: any, valueB: any): boolean {
    return _isEqual(valueA, valueB);
}

/**
 * Check if the string is a credit card number
 */
export function isCreditCard(value: string): boolean {
    return validator.isCreditCard(value);
}

/**
 * Check if the value is divisible by the number
 */
export function isDivisibleBy(value: number | string, number: number): boolean {
    return validator.isDivisibleBy(`${value}`, number);
}

/**
 * Check if the parameter contains a decimal number
 */
export function isDecimals(value: number | string, options?: validator.IsDecimalOptions): boolean {
    return validator.isDecimal(`${value}`, {
        force_decimal: true,
        ...(options || {}),
    });
}

/**
 * Check if the string is an email
 */
export function isEmail(value: string, options?: validator.IsEmailOptions): boolean {
    return validator.isEmail(value, options);
}

/**
 * Check if the string is a fully qualified domain name (e.g. domain.com).
 */
export function isFQDN(value: string, options?: validator.IsFQDNOptions): boolean {
    return validator.isFQDN(value, options);
}

/**
 * Check if the string is a float
 *
 * Note: This function is not allow exposed to the public. To determine if it is a
 * decimal, use `isDecimals`
 */
function isFloat(value: number | string, options?: validator.IsFloatOptions): boolean {
    return validator.isFloat(`${value}`, options);
}

/**
 * Check if the value is less than or equal to max
 */
export function isMaxValue(value: number | string, max: number): boolean {
    return isFloat(value, {
        max,
    });
}

/**
 * Check if the value is greater than or equal to min
 */
export function isMinValue(value: number, min: number): boolean {
    return isFloat(value, {
        min,
    });
}

/**
 * Check if the value is between min and max
 */
export function isRangeValue(value: number, min: number, max: number): boolean {
    return isFloat(value, {
        min,
        max,
    });
}

/**
 * Check if the value is greater than gt
 */
export function isGtValue(value: number, gt: number): boolean {
    return isFloat(value, {
        gt,
    });
}

/**
 * Check if the value is less than lt
 */
export function isLtValue(value: number, lt: number): boolean {
    return isFloat(value, {
        lt,
    });
}

/**
 * Check if the value is greater than gt and less than lt
 */
export function isGLRange(value: number, gt: number, lt: number): boolean {
    return isFloat(value, {
        gt,
        lt,
    });
}

/**
 * Check if the string is a hexadecimal number
 */
export function isHexadecimal(value: string): boolean {
    return validator.isHexadecimal(value);
}

/**
 * Check if the string is an IP (version 4 or 6)
 */
export function isIP(value: string, version?: validator.IPVersion): boolean {
    return validator.isIP(value, version);
}

/**
 * Check if the string is an IP range (version 4 or 6)
 */
export function isIPRange(value: string, version?: validator.IPVersion): boolean {
    return validator.isIPRange(value, version);
}

/**
 * Check if the string is an integer
 */
export function isInt(value: string | number, options?: validator.IsIntOptions): boolean {
    return validator.isInt(`${value}`, options);
}

/**
 * Check if the string is valid JSON (note: uses JSON.parse)
 */
export function isJSON(value: string): boolean {
    return validator.isJSON(value);
}

/**
 * Check if the string's length is less than or equal to `max`
 */
export function isMaxLength(value: string, max: number): boolean {
    return validator.isLength(value, {
        max,
    });
}

/**
 * Check if the string's length is greater than or equal to `min`
 */
export function isMinLength(value: string, min: number): boolean {
    return validator.isLength(value, {
        min,
    });
}

/**
 * Check if the string's length is between `min` and `max`
 * @param value The string to check
 * @param min Maximum length
 * @param max Minimum length
 */
export function isRangeLength(value: string, min: number, max: number): boolean {
    return validator.isLength(value, {
        min,
        max,
    });
}

/**
 * Check if the string is lowercase
 */
export function isLowercase(value: string): boolean {
    return validator.isLowercase(value);
}

/**
 * Check if the string is a MAC address
 */
export function isMACAddress(value: string, options?: validator.IsMACAddressOptions): boolean {
    return validator.isMACAddress(value, options);
}

/**
 * Check if the string is a MD5 hash
 */
export function isMD5(value: string): boolean {
    return validator.isMD5(value);
}

/**
 * Check if the string is a valid MIME type
 */
export function isMimeType(value: string): boolean {
    return validator.isMimeType(value);
}

/**
 * Check if the string contains only numbers (0-9)
 */
export function isNumeric(value: string, options?: validator.IsNumericOptions): boolean {
    return validator.isNumeric(value, options);
}

/**
 * Check if the string is a URL
 */
export function isURL(value: string, options?: validator.IsURLOptions): boolean {
    return validator.isURL(value, options);
}

/**
 * Check if the string is uppercase
 */
export function isUppercase(value: string): boolean {
    return validator.isUppercase(value);
}

/**
 * Check if the string matches the pattern
 */
export function isMatches(value: string, pattern: RegExp): boolean {
    return validator.matches(value, pattern);
}

/**
 * Check if the string is a mobile phone number
 */
export function isMobilePhone(
    value: number | string,
    locale?: 'any' | validator.MobilePhoneLocale | validator.MobilePhoneLocale[],
    options?: validator.IsMobilePhoneOptions & {
        loose: boolean;
    },
): boolean {
    const { loose = true, ...otherOptions } = options || {};
    if (loose) {
        return /^[a-zA-Z0-9\(\)\.\-+\*#]{1,31}$/.test(`${value}`);
    }

    return validator.isMobilePhone(`${value}`, locale || 'any', otherOptions);
}

/**
 * Check if the string is a valid postal code
 */
export function isPostalCode(
    value: number | string,
    locale?: 'any' | validator.PostalCodeLocale,
    options?: { loose: boolean },
): boolean {
    const { loose = true } = options || {};

    if (loose) {
        return /^[a-zA-Z0-9\(\)\.\-+\*#\s]{1,31}$/.test(`${value}`);
    }

    return validator.isPostalCode(`${value}`, locale || 'any');
}

/**
 * Check if the string is a valid port number
 */
export function isPort(value: string): boolean {
    return validator.isPort(value);
}

/**
 * Check if the string contains Chinese characters
 */
export function isChinaString(value: string): boolean {
    const patrn = /[\u4E00-\u9FFF]+/g;
    return patrn.test(`${value}`);
}

/**
 * Check if the string contains only ASCII characters
 */
export function isAscii(value: string): boolean {
    return validator.isAscii(value);
}

/**
 * Check if the string contains only letters (a-zA-Z).
 */
export function isAlpha(value: string): boolean {
    return validator.isAlpha(value);
}
