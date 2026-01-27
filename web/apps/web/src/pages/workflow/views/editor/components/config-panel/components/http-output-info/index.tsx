import React from 'react';
import './style.less';

type OptionItem = {
    name: string;
    type?: string;
    placeholder: string;
    copyable?: boolean;
};

export interface Props {
    title?: string;

    options?: OptionItem[];
}

/**
 * Render HTTP output info
 */
const HttpOutputInfo: React.FC<Props> = ({ title, options }) => {
    return (
        <div className="ms-node-form-group">
            <div className="ms-node-form-group-header">
                {title && <div className="ms-node-form-group-title">{title}</div>}
            </div>
            <div className="ms-node-form-group-item">
                <div className="ms-http-output-info">
                    {options?.map(option => (
                        <div className="ms-http-output-info-item" key={option.name}>
                            <div className="ms-http-output-info-item-title">
                                <span className="label">{option.name}</span>
                                {!!option.type && <span className="type">{option.type}</span>}
                            </div>
                            <div className="ms-http-output-info-item-body">
                                <span className="placeholder">{option.placeholder}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HttpOutputInfo;
