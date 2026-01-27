export interface TransferItem {
    key: ApiKey;
    title: string;
    description?: string;
    disabled?: boolean;
}

export interface TransferListProps {
    /**
     * callback function when the target value changes
     */
    onChange?: (targetKeys: ApiKey[]) => void;
    /**
     * callback function when the selected value changes
     */
    onSelectChange?: (selectedKeys: ApiKey[]) => void;
    /**
     * current selected value
     */
    selectedKeys?: ApiKey[];
    /**
     * the value of the right list
     */
    targetKeys?: ApiKey[];
    /**
     * data source
     */
    dataSource: TransferItem[];
}
