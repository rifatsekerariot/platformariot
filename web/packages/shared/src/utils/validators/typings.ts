export type Message = string;
export type ValidateResult = Message | Message[] | boolean | undefined;
export type Validate<TFieldValue = any, TFormValues = Record<string, any>> = (
    value: TFieldValue,
    formValues?: TFormValues,
) => ValidateResult | Promise<ValidateResult>;

type RuleType = {
    /** error message */
    message?: string;
};

export type TValidator<T = void> =
    T extends Record<string, any>
        ? (rule: T & RuleType) => Validate
        : (rule?: RuleType) => Validate;
