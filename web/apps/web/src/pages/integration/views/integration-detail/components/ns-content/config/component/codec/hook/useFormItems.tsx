import { useMemo } from 'react';
import { type ControllerProps, type FieldValues } from 'react-hook-form';
import { TextField, TextFieldProps } from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';
import { checkStartWithHttpOrHttps } from '@milesight/shared/src/utils/validators';

export interface FormDataProps {
    codecRepo: string;
}

/**
 * Form data type
 */
type ExtendControllerProps<T extends FieldValues> = ControllerProps<T> & {
    /**
     * To Control whether the current component is rendered
     */
    shouldRender?: (data: Partial<T>) => boolean;
};

const useFormItems = () => {
    const { getIntlText } = useI18n();

    const formItems = useMemo(() => {
        const props: Partial<TextFieldProps> = {
            fullWidth: true,
            type: 'text',
            size: 'small',
            margin: 'dense',
            sx: { my: 1.5 },
        };
        const result: ExtendControllerProps<FormDataProps>[] = [];

        result.push({
            name: 'codecRepo',
            rules: {
                validate: {
                    checkStartWithHttpOrHttps: checkStartWithHttpOrHttps(),
                },
            },
            render({ field: { onChange, value }, fieldState: { error } }) {
                return (
                    <TextField
                        {...props}
                        label={getIntlText('setting.integration.label.codec_repo')}
                        error={!!error}
                        helperText={error ? error.message : null}
                        value={value}
                        onChange={onChange}
                    />
                );
            },
        });

        return result;
    }, [getIntlText]);

    return formItems;
};

export default useFormItems;
