import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import cls from 'classnames';
import { isEqual, isNil, cloneDeep, merge } from 'lodash-es';
import { useDynamicList, useControllableValue } from 'ahooks';
import {
    ToggleButtonGroup,
    ToggleButton,
    Button,
    IconButton,
    Chip,
    Select,
    MenuItem,
    TextField,
    Tooltip,
} from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';
import {
    AddIcon,
    DeleteOutlineIcon,
    InputIcon,
    CodeIcon,
    SyncIcon,
    KeyboardArrowDownIcon,
} from '@milesight/shared/src/components';
import { genUuid } from '../../../../helper';
import { logicOperatorMap, conditionOperatorMap } from '../../../../constants';
import useWorkflow from '../../../../hooks/useWorkflow';
import ParamSelect from '../param-select';
import ParamInputSelect from '../param-input-select';
import CodeEditor, { DEFAULT_LANGUAGE, type CodeEditorData } from '../code-editor';
import './style.less';

export type ConditionsInputValueType = NonNullable<IfElseNodeDataType['parameters']>['choice'];

type ConditionBlockValueType = ConditionsInputValueType['when'][number];

type ConditionValueType = ConditionBlockValueType['conditions'][number];

export type ConditionsInputProps = {
    value?: ConditionsInputValueType;
    defaultValue?: ConditionsInputValueType;
    onChange?: (value: ConditionsInputValueType) => void;
};

type RefParamDetailType = Record<
    ApiKey,
    {
        key: ApiKey;
        type?: EntityValueDataType;
        enums?: Record<string, any>;
        options?: React.ReactNode[];
    }
>;

const genConditionValue = (): ConditionValueType => {
    return { id: genUuid('subcondition') };
};

const genConditionBlockValue = (): ConditionBlockValueType => {
    return {
        id: genUuid('condition'),
        logicOperator: 'AND',
        expressionType: 'condition',
        conditions: [genConditionValue()],
    };
};

// const DEFAULT_CONDITION_BLOCK_VALUE = genConditionBlockValue();

const MAX_CONDITIONS_NUMBER = 5;
const MAX_CONDITION_BLOCKS_NUMBER = 5;

/**
 * Conditions Input Component
 *
 * Note: use in IfelseNode
 */
const ConditionsInput: React.FC<ConditionsInputProps> = props => {
    const { getIntlText, getIntlHtml } = useI18n();
    const [data, setData] = useControllableValue<ConditionsInputValueType>(props);
    // const otherwiseId = useRef<string>('');
    const {
        list: blockList,
        remove: removeBlock,
        getKey: getBlockKey,
        insert: insertBlock,
        replace: replaceBlock,
        resetList: resetBlockList,
    } = useDynamicList<ConditionBlockValueType>([genConditionBlockValue()]);

    // console.log({ blockList });
    const handleExpTypeChange = (block: ConditionBlockValueType, blockIndex: number) => {
        const { expressionType } = block;
        const newExpType = expressionType === 'condition' ? 'mvel' : 'condition';

        replaceBlock(blockIndex, {
            ...block,
            expressionType: newExpType,
            conditions: [genConditionValue()],
        });
    };

    const handleLogicOperatorChange = (block: ConditionBlockValueType, blockIndex: number) => {
        let { logicOperator } = block;

        logicOperator = logicOperator === 'AND' ? 'OR' : 'AND';
        replaceBlock(blockIndex, { ...block, logicOperator });
    };

    const removeCondition = (index: number, block: ConditionBlockValueType, blockIndex: number) => {
        const conditions = cloneDeep(block.conditions || []);

        conditions.splice(index, 1);
        replaceBlock(blockIndex, { ...block, conditions });
    };

    const insertCondition = (
        index: number,
        condition: ConditionValueType,
        block: ConditionBlockValueType,
        blockIndex: number,
    ) => {
        const conditions = cloneDeep(block.conditions || []);

        conditions.splice(index, 0, condition);
        replaceBlock(blockIndex, { ...block, conditions });
    };

    const replaceCondition = (
        index: number,
        condition: Partial<ConditionValueType>,
        block: ConditionBlockValueType,
        blockIndex: number,
    ) => {
        const conditions = cloneDeep(block.conditions || []);

        conditions.splice(index, 1, merge(conditions[index], condition));
        replaceBlock(blockIndex, { ...block, conditions });
    };

    const checkEmptyOperator = (expressionValue: ConditionValueType['expressionValue']) => {
        const emptyOperators: WorkflowFilterOperator[] = ['IS_EMPTY', 'IS_NOT_EMPTY'];

        return (
            typeof expressionValue !== 'string' &&
            emptyOperators.includes(expressionValue?.operator as WorkflowFilterOperator)
        );
    };

    useLayoutEffect(() => {
        // if (!data?.when?.length) return;
        if (isEqual(data?.when, blockList)) return;
        resetBlockList(data?.when || [genConditionBlockValue()]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, resetBlockList]);

    useEffect(() => {
        setData(d => {
            const otherwiseId = `${d?.otherwise?.id || ''}` || genUuid('condition');
            const result = {
                when: blockList,
                otherwise: {
                    id: otherwiseId,
                },
            };
            return result;
        });
    }, [blockList, setData]);

    // ---------- Render the value options ----------
    const { getReferenceParamDetail } = useWorkflow();
    const refParamDetails = useMemo(() => {
        const result = blockList.reduce((acc, block) => {
            const { expressionType, conditions } = block;

            if (expressionType !== 'condition') return acc;
            conditions.forEach(({ id, expressionValue }) => {
                if (typeof expressionValue === 'string') return;
                const detail = getReferenceParamDetail(expressionValue?.key);

                if (!detail) return;
                acc[id] = {
                    key: detail.valueKey,
                    type: detail.valueType,
                    enums: detail.enums?.reduce(
                        (acc, { key, label }) => {
                            acc[key] = label;
                            return acc;
                        },
                        {} as Record<string, any>,
                    ),
                    // options: detail.enums?.map(({ key, label }) => (
                    //     <MenuItem key={key} value={key}>
                    //         {label}
                    //     </MenuItem>
                    // )),
                };
            });

            return acc;
        }, {} as RefParamDetailType);

        return result;
    }, [blockList, getReferenceParamDetail]);

    return (
        <div className="ms-conditions-input">
            {blockList.map((block, blockIndex) => {
                const { conditions, logicOperator, expressionType } = block;
                const isMultipleConditions = conditions?.length > 1;
                const tipKeyword =
                    logicOperator === 'OR'
                        ? getIntlText(logicOperatorMap.AND?.labelIntlKey || '')
                        : getIntlText(logicOperatorMap.OR?.labelIntlKey || '');

                return (
                    <div
                        className="ms-conditions-input-item"
                        key={getBlockKey(blockIndex) || blockIndex}
                    >
                        <div className="ms-conditions-input-item-topbar">
                            <div className="name">
                                {blockIndex === 0
                                    ? getIntlText('workflow.label.logic_keyword_if')
                                    : getIntlText('workflow.label.logic_keyword_elseif')}
                            </div>
                            <div className="btns">
                                <ToggleButtonGroup
                                    size="small"
                                    value={expressionType === 'condition' ? 'condition' : 'other'}
                                    onChange={() => handleExpTypeChange(block, blockIndex)}
                                >
                                    <ToggleButton disableRipple value="condition">
                                        <InputIcon />
                                    </ToggleButton>
                                    <ToggleButton disableRipple value="other">
                                        <CodeIcon />
                                    </ToggleButton>
                                </ToggleButtonGroup>
                                {blockList.length > 1 && (
                                    <IconButton onClick={() => removeBlock(blockIndex)}>
                                        <DeleteOutlineIcon />
                                    </IconButton>
                                )}
                            </div>
                        </div>
                        {expressionType && expressionType !== 'condition' ? (
                            <div className="ms-conditions-input-item-mvel">
                                <CodeEditor
                                    variableSelectable
                                    value={{
                                        language: (expressionType ||
                                            DEFAULT_LANGUAGE) as CodeEditorData['language'],
                                        expression: conditions[0]?.expressionValue as string,
                                    }}
                                    onChange={value => {
                                        const condition = conditions[0] || genConditionValue();
                                        replaceBlock(blockIndex, {
                                            ...block,
                                            expressionType: value.language,
                                            conditions: [
                                                {
                                                    ...condition,
                                                    expressionValue: value.expression,
                                                },
                                            ],
                                        });
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    autoComplete="off"
                                    placeholder="Condition Description"
                                    value={conditions[0]?.expressionDescription || ''}
                                    onChange={e =>
                                        replaceCondition(
                                            0,
                                            {
                                                expressionDescription: e.target.value,
                                            },
                                            block,
                                            blockIndex,
                                        )
                                    }
                                />
                            </div>
                        ) : (
                            <div
                                className={cls('ms-conditions-input-item-conditions', {
                                    'multiple-conditions': isMultipleConditions,
                                })}
                            >
                                {isMultipleConditions && (
                                    <div className="logic-operator">
                                        <Tooltip
                                            enterDelay={300}
                                            enterNextDelay={300}
                                            title={getIntlHtml(
                                                'workflow.editor.form_logic_operator_switch_tip',
                                                { 1: tipKeyword },
                                            )}
                                        >
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                label={
                                                    <>
                                                        {getIntlText(
                                                            logicOperatorMap[logicOperator]
                                                                ?.labelIntlKey || '',
                                                        )}
                                                        <SyncIcon />
                                                    </>
                                                }
                                                onClick={() =>
                                                    handleLogicOperatorChange(block, blockIndex)
                                                }
                                            />
                                        </Tooltip>
                                    </div>
                                )}
                                {conditions.map((condition, index) => {
                                    const { expressionValue } = condition;
                                    const detail = refParamDetails[condition.id];

                                    if (typeof expressionValue === 'string') return null;
                                    return (
                                        <div className="field-item" key={condition.id}>
                                            <div
                                                className={cls('input-wrapper', {
                                                    'hidden-value-input':
                                                        checkEmptyOperator(expressionValue),
                                                })}
                                            >
                                                <div className="select">
                                                    <ParamSelect
                                                        label=""
                                                        value={`${expressionValue?.key || ''}`}
                                                        onChange={e =>
                                                            replaceCondition(
                                                                index,
                                                                {
                                                                    expressionValue: {
                                                                        key: e.target.value,
                                                                        value: '',
                                                                    },
                                                                },
                                                                block,
                                                                blockIndex,
                                                            )
                                                        }
                                                    />
                                                    <Select
                                                        defaultValue=""
                                                        placeholder="Condition"
                                                        labelId="param-select-label"
                                                        IconComponent={KeyboardArrowDownIcon}
                                                        MenuProps={{
                                                            className: 'ms-param-select-menu',
                                                        }}
                                                        value={expressionValue?.operator || ''}
                                                        onChange={e => {
                                                            const expVal: ConditionValueType['expressionValue'] =
                                                                {
                                                                    operator: e.target
                                                                        .value as WorkflowFilterOperator,
                                                                    value: expressionValue?.value,
                                                                };

                                                            if (checkEmptyOperator(expVal)) {
                                                                expVal.value = '';
                                                            }
                                                            replaceCondition(
                                                                index,
                                                                {
                                                                    expressionValue: expVal,
                                                                },
                                                                block,
                                                                blockIndex,
                                                            );
                                                        }}
                                                    >
                                                        {Object.entries(conditionOperatorMap).map(
                                                            ([key, oprt]) => (
                                                                <MenuItem key={key} value={key}>
                                                                    {getIntlText(oprt.labelIntlKey)}
                                                                </MenuItem>
                                                            ),
                                                        )}
                                                    </Select>
                                                </div>
                                                <ParamInputSelect
                                                    label=""
                                                    enums={detail?.enums}
                                                    valueType={detail?.type}
                                                    filter={data => {
                                                        return (
                                                            data.valueKey !== expressionValue?.key
                                                        );
                                                    }}
                                                    value={expressionValue?.value}
                                                    onChange={val => {
                                                        const value: string | boolean = !isNil(val)
                                                            ? val
                                                            : '';

                                                        replaceCondition(
                                                            index,
                                                            {
                                                                expressionValue: { value },
                                                            },
                                                            block,
                                                            blockIndex,
                                                        );
                                                    }}
                                                />
                                            </div>
                                            {isMultipleConditions && (
                                                <IconButton
                                                    onClick={() =>
                                                        removeCondition(index, block, blockIndex)
                                                    }
                                                >
                                                    <DeleteOutlineIcon />
                                                </IconButton>
                                            )}
                                        </div>
                                    );
                                })}
                                <Button
                                    size="small"
                                    variant="outlined"
                                    className="ms-conditions-input-add-btn"
                                    startIcon={<AddIcon />}
                                    disabled={conditions.length >= MAX_CONDITIONS_NUMBER}
                                    onClick={() =>
                                        insertCondition(
                                            conditions.length,
                                            genConditionValue(),
                                            block,
                                            blockIndex,
                                        )
                                    }
                                >
                                    {getIntlText('workflow.editor.form_button_add_condition')}
                                </Button>
                            </div>
                        )}
                    </div>
                );
            })}
            <Button
                fullWidth
                variant="outlined"
                className="ms-conditions-input-add-btn"
                startIcon={<AddIcon />}
                disabled={blockList.length >= MAX_CONDITION_BLOCKS_NUMBER}
                onClick={() => insertBlock(blockList.length, genConditionBlockValue())}
            >
                {getIntlText('workflow.label.logic_keyword_elseif')}
            </Button>
        </div>
    );
};

export default React.memo(ConditionsInput);
