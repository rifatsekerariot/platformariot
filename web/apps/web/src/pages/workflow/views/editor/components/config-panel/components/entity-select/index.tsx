import React, { useCallback, useMemo } from 'react';
import { useControllableValue } from 'ahooks';
import { useI18n } from '@milesight/shared/src/hooks';
import { KeyboardArrowDownIcon } from '@milesight/shared/src/components';
import {
    EntitySelect as EntitySelectComponent,
    type EntitySelectProps as EntitySelectComponentProps,
} from '@/components';
import { type EntityAPISchema } from '@/services/http';
import './style.less';

export type EntitySelectValueType = ApiKey;

export type EntitySelectOptionType = {
    /** Entity Name */
    label: string;
    /** Entity ID */
    value: ApiKey;
    /** Entity Value Type */
    valueType?: string;
    /** Custom Description */
    description?: string;
    rawData?: Omit<
        EntityAPISchema['getList']['response']['content'][number],
        'entity_value_attribute'
    > & {
        entity_value_attribute: string;
    };
};

type WorkflowEntitySelectProps = EntitySelectComponentProps<EntitySelectValueType, false, false>;

export type EntityFilterParams = {
    /** Search Keyword */
    keyword?: string;
    /** Entity Type */
    type?: EntityType | EntityType[];
    /** Entity Value Type */
    valueType?: EntityValueDataType | EntityValueDataType[];
    /** Entity Access Mode */
    accessMode?: EntityAccessMode | EntityAccessMode[];
    /** Exclude Children */
    excludeChildren?: boolean;
};

export interface EntitySelectProps
    extends Omit<EntitySelectComponentProps<EntitySelectValueType, false, false>, 'onChange'> {
    /**
     * API Filter Model
     */
    filterModel?: Omit<EntityFilterParams, 'keyword'>;

    value?: EntitySelectValueType;

    defaultValue?: EntitySelectValueType;

    onChange?: (value: EntitySelectValueType) => void;
}

/**
 * Entity Select Component
 *
 * Note: This is a basic component, use in EntityListeningNode, ServiceNode, EntitySelectNode
 */
const EntitySelect: React.FC<EntitySelectProps> = ({
    filterModel,
    fieldName = 'entityKey',
    ...props
}) => {
    const { getIntlText } = useI18n();
    const [value, setValue] = useControllableValue<EntitySelectValueType | undefined>(props);

    const handleChange = useCallback<Required<WorkflowEntitySelectProps>['onChange']>(
        option => {
            setValue(option?.value);
        },
        [setValue],
    );

    const filterModelValue = useMemo(() => {
        const { type, valueType, accessMode, excludeChildren } = filterModel || {};

        const filterType = type && (Array.isArray(type) ? type : [type]);
        const filterValueType = valueType && (Array.isArray(valueType) ? valueType : [valueType]);
        const filterAccessMode =
            accessMode && (Array.isArray(accessMode) ? accessMode : [accessMode]);

        return {
            entityType: filterType,
            entityValueType: filterValueType,
            entityAccessMod: filterAccessMode,
            excludeChildren,
        };
    }, [filterModel]);

    return (
        <EntitySelectComponent
            label={getIntlText('common.label.entity')}
            {...props}
            {...filterModelValue}
            className="ms-entity-select"
            popupIcon={<KeyboardArrowDownIcon />}
            value={value}
            onChange={handleChange}
            fieldName={fieldName}
        />
    );
};

export default React.memo(EntitySelect);
