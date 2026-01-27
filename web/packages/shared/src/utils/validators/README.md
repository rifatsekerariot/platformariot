# User Guide

## Quick Start

The encapsulated validator integrates international language MESSAGE. Therefore, when introducing for the first time in each application, you need to mount an `intl` instance to use the loaded key:

```ts
import intl from 'react-intl-universal';
import { validators } from '@milesight/shared/src/utils';

// ...

validators.validatorIgniter(intl);
```

For example:

```tsx
import { Form, Input } from '@milesight/pc-web-ui';
import { validators } from '@milesight/shared/src/utils';

const { emailCheckers } = validators;

export const LoginForm = () => {
    return <Form name="login">
        <Form.Item
            name="email"
            label="Email"
            rules={emailCheckers()}
        >
            <Input />
        </Form.Item>
    </Form>
}
```

## Basic General validator

We've wrapped a generic assertion method based on [validator.js](https://github.com/validatorjs/validator.js):


| Assert | Description |
| --- | --- |
| `isEmpty(value: any, options?: validator.IsEmptyOptions)` | Check whether the value is empty |
| `isContains(value: string, seed: any)` | Check if the `value` contains `seed` |
| `isEqual(valueA, valueB)` | Check if the arguments is equal |
| `isCreditCard(value: string)` | Check if the string is a credit card number |
| `isDivisibleBy(value: number \| string, number: number)` | Check if the value is divisible by the number |
| `isDecimals(value: number \| string, options?: validator.IsDecimalOptions)` | Check if the parameter contains a decimal number |
| `isEmail(value: string, options?: validator.IsEmailOptions)` | Check if the string is an email |
| `isFQDN(value: string, options?: validator.IsFQDNOptions)` | Check if the string is a fully qualified domain name (e.g. domain.com). |
| `isMaxValue(value: number \| string, max: number)` | Check if the value is less than or equal to max |
| `isMinValue(value: number, min: number)` | Check if the value is greater than or equal to min |
| `isRangeValue(value: number, min: number, max: number)` | Check if the value is between min and max |
| `isGtValue(value: number, gt: number)` | Check if the value is greater than gt |
| `isLtValue(value: number, lt: number)` | Check if the value is less than lt |
| `isGLRange(value: number, gt: number, lt: number)` | Check if the value is greater than gt and less than lt |
| `isHexadecimal(value: string)` | Check if the string is a hexadecimal number |
| `isIP(value: string, version?: validator.IPVersion)` | Check if the string is an IP (version 4 or 6) |
| `isIPRange(value: string, version?: validator.IPVersion)` | Check if the string is an IP range (version 4 or 6) |
| `isInt(value: string \| number, options?: validator.IsIntOptions)` | Check if the string is an integer |
| `isJSON(value: string)` | Check if the string is valid JSON (note: uses JSON.parse) |
| `isMaxLength(value: string, max: number)` | Check if the string's length is less than or equal to `max` |
| `isMinLength(value: string, min: number)` | Check if the string's length is greater than or equal to `min` |
| `isRangeLength(value: string, min: number, max: number)` | Check if the string's length is between `min` and `max` |
| `isLowercase(value: string)` | Check if the string is lowercase |
| `isMACAddress(value: string, options?: validator.IsMACAddressOptions)` | Check if the string is a MAC address |
| `isMD5(value: string)` | Check if the string is a MD5 hash |
| `isMimeType(value: string)` | Check if the string is a valid MIME type |
| `isNumeric(value: string, options?: validator.IsNumericOptions)` | Check if the string contains only numbers (0-9) |
| `isURL(value: string, options?: validator.IsURLOptions)` | Check if the string is a URL |
| `isUppercase(value: string)` | Check if the string is uppercase |
| `isMatches(value: string, pattern: RegExp)` | Check if the string matches the pattern |
| `isMobilePhone(value: number \| string, locale?: 'any' \| validator.MobilePhoneLocale \| validator.MobilePhoneLocale[], options?: validator.IsMobilePhoneOptions & { loose: boolean; })` | Check if the string is a mobile phone number |
| `isPostalCode( value: number \| string, locale?: 'any' \| validator.PostalCodeLocale, options?: { loose: boolean })` | Check if the string is a valid postal code |
| `isPort(value: string)` | Check if the string is a valid port number |

### Example

```tsx
if (isURL('http://localhost:3000')) {
    console.log('Success !');
} else {
    console.log('Failed !');
}
```

## Basic General checker

Each checker corresponds to an I18N key, which can be used to internationalize the message:

| Validator | Description | Params |
| --- | --- | --- |
| `checkRequired` | valid.input.required: 'Please configure this item.', | - |
| `checkMinValue` | valid.input.min_value: 'The input value cannot be smaller than {0}.', | min: number |
| `checkMaxValue` | valid.input.max_value: 'The input value cannot be greater than {0}.', | max: number |
| `checkRangeValue` | valid.input.range_value: 'The value you enter should be greater than or equal to {0} and less than or equal to {1}.', | min: number <br /> max: number 最大值 |
| `checkValue` | valid.input.value: 'Input value: {0} only.', | enum: any[] |
| `checkMinLength` | valid.input.min_length: 'The length of the value you enter should be more than or equal to {0}.', | min: number |
| `checkMaxLength` | valid.input.max_length: 'The input cannot be greater than {0} characters.', | max: number |
| `checkRangeLength` | valid.input.range_length: 'The length of the value you enter should be greater than or equal to {0} and less than or equal to {1}.', | min: number <br /> max: number |
| `checkLength` | valid.input.length: 'Allowed input length: {0}.', | enum: any[] |
| `checkIPAddressV4` | valid.input.ip_address: 'Please enter your IP address in the following format: XXX.XXX.XXX.XXX. XXX should be 1-255.', | - |
| `checkIPAddressV6` | valid.input.ipv6_address: 'Please enter your IP address in this format: XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX (XXXX is 0000-FFFF).', | - |
| `checkMaskAddress` | valid.input.netmask: 'Please enter your subnet mask in the following format: XXX.XXX.XXX.XXX.', | - |
| `checkMACAddress` | valid.input.mac: 'Please enter your MAC address.', | - |
| `checkMobilePhone` | valid.input.phone: 'Please enter a valid phone number. It must be 1 to 31 characters long.', | - |
| `checkPostalCode` | valid.input.postal_code: 'Please enter your postal number in the required format: numbers, letters, spaces, and special characters such as (). -+*#. The length of the input should be less than 32 digits.', | - |
| `checkNumber` | valid.input.number: 'Please enter a number.', | - |
| `checkNumberNoZero` | valid.input.number_no_zero: 'Please enter a number greater than 0.', | - |
| `checkHexNumber` | valid.input.hex_number: 'Input numbers only.', | - |
| `checkPort` | valid.input.port: 'Please enter a valid port number.', | - |
| `checkEmail` | valid.input.email: 'Please enter a valid email address.', | - |
| `checkDecimals` | valid.input.decimals: 'Please enter the correct decimal number.', | - |
| `checkLetters` | valid.input.letters: 'Letters only (upper and lower case)', | - |
| `checkLettersAndNum` | valid.input.letters_and_num: 'Letters and numbers only (upper and lower case)', | - |
| `checkAtLeastOneLowercaseLetter` | valid.input.at_least_1_lowercase_letter: 'Require at least one lowercase letter.' | - |
| `checkAtLeastOneUppercaseLetter` | valid.input.at_least_1_uppercase_letter: 'Require at least one uppercase letter.', | - |
| `checkAtLeastOneNum` | valid.input.at_least_1_num: 'Require at least one digit.', | - |
| `checkHasWhitespace` | valid.input.not_include_whitespace: 'No spaces are allowed.', | - |
| `checkStartWithNormalChar` | valid.input.start_with_normal_char: 'Required Format: the input must start with lower case letters (a-z), upper case letters (A-Z), numbers (0-9), or underscores (_).', | - |

> Attention: If you need to override the default message, all checker support passing in the message through the rule to override the default message.

### Example

Base usage:

```tsx
<Form.Item name="email" validateFirst rules={[
    {
        required: true,
        validator: checkRequired,
    }
]}>
```

Custom message:

```tsx
<Form.Item
    name="email"
    validateFirst
    rules={[
        {
            required: true,
            validator: checkRequired,
            message: 'Please enter a valid email address.'
        },
        {
            validator: checkEmail,
            message: 'Sorry, your email address is incorrect.'
        },
    ]}
>
    ...
</Form.Item>
```

Custom param values:

```tsx
<Form.Item
    name="userName"
    validateFirst
    rules={[
        {
            min: 10,
            max: 20,
            validator: checkRangeLength,
        },
    ]}
>
    ...
</Form.Item>
```

## Composed Checker

1. **`commentsChecker()`**: Remark/Comments checker
   - Min 1, Max 1024
   - Any characters

2. **`streetAddressChecker()`**: Street/Address
   - Min 1, Max 255
   - Any characters

3. **`cityChecker()`**: City/State/province
   - Min 1, Max 127
   - Any characters

4. **`emailCheckers()`**: Generate a set of email validation rules
   - Start with a-zA-Z0-9_
   - Must be composed of the English letters, numbers, and characters (`_-+.`)
   - Behind the `.`, `-` or before `@` must be followed by a-zA-Z0-9_
   - Must conform to email format XXX@XXX.XX

5. **`mobilePhoneChecker()`**: Mobile Number/Phone Number/Fax
   - Min 1, Max 31
   - Allow input numbers, letters, spaces, and characters: ().-+*#

6. **`postalCodeChecker()`**: Zip/Postal Code
   - Min 1, Max 31
   - Allow input numbers, letters, spaces, and characters: ().-+*#

7. **`normalNameChecker()`**: Name Checker
   - Min 1, Max 63
   - Allow any characters that are not spaces

8. **`firstNameChecker()`**: First Name
   - Min 1, Max 63
   - Allow any characters

9.  **`lastNameChecker()`**: Last Name
    - Min 1, Max 63
    - Allow any characters

10. **`companyNameChecker()`**: Company Name
    - The same as normalNameChecker

11. **`SNChecker()`**: SN (The General Specification for Yeastar Products)

12. **`moneyChecker()`**: Money Checker
   - Up to 10 digits before the decimal point and up to 2 digits after the decimal point

### Example

Basic usage:

```tsx
<Form.Item rules={[commentsChecker()]}>...</Form.Item>
```

Compose with other custom rules:

```tsx
<Form.Item
    rules={[
        {
            required: true,
            validator: checkRequired,
        },
        ...moneyChecker(),
    ]}
>
    ...
</Form.Item>
```

## Others

| Function | Description |
| --- | --- |
| `EErrorMessages` | Enum, General check rule and i18n key mapping |
| `getErrorMessage = (localeKey: EErrorMessages \| string, values?: Record<string, any>): ReactElement \| 'error'` | Get the internationalized error message |

Basic usage:

```tsx
<Form.Item rules={[
    {
        required: true,
        message: getErrorMessage(EErrorMessages.required)
    }
]}>
```

Custom param values:

```tsx
<Form.Item rules={[
    {
        min: 10,
        max: 20,
        validator: checkRangeLength,
        message: getErrorMessage(ErrorMessages.rangeLength, {
            0: 10,
            1: 20
        })
    }
]}>
```
