import React, { useEffect, useMemo, useState } from 'react';
import cls from 'classnames';
import { cloneDeep, merge } from 'lodash-es';
import { useRequest } from 'ahooks';
import {
    Backdrop,
    Slide,
    IconButton,
    Button,
    Divider,
    Alert,
    CircularProgress,
    TextField,
} from '@mui/material';
import { useReactFlow } from '@xyflow/react';
import { useI18n } from '@milesight/shared/src/hooks';
import {
    CloseIcon,
    PlayArrowIcon,
    CheckCircleIcon,
    ErrorIcon,
    toast,
} from '@milesight/shared/src/components';
import { CodeEditor, Tooltip } from '@/components';
import { workflowAPI, awaitWrap, getResponseData, isRequestSuccess } from '@/services/http';
import useFlowStore from '../../../../store';
import useTest from '../../../../hooks/useTest';
import EmailContent from '../email-content';
import './style.less';

export interface TestDrawerProps {
    node?: WorkflowNode;
    open: boolean;
    onClose: () => void;
}

const statusDefaultMsgKey: Record<
    WorkflowNodeStatus,
    {
        icon: React.ReactNode;
        intlKey: string;
    }
> = {
    ERROR: {
        icon: <ErrorIcon />,
        intlKey: 'common.label.error',
    },
    SUCCESS: {
        icon: <CheckCircleIcon />,
        intlKey: 'common.label.success',
    },
};

const safeJSONStringify = (value?: string, space: number = 2) => {
    if (!value) return '';
    let result = '';
    try {
        result = JSON.stringify(JSON.parse(value), null, space);
    } catch (e) {
        result = value;
    }

    return result;
};

const TestDrawer: React.FC<TestDrawerProps> = ({ node, open, onClose }) => {
    const { getIntlText } = useI18n();
    const { getNode } = useReactFlow<WorkflowNode, WorkflowEdge>();

    // ---------- Basic Node Info ----------
    const nodeId = node?.id;
    const nodeConfigs = useFlowStore(state => state.nodeConfigs);
    const nodeConfig = useMemo(() => {
        if (!node) return;
        return nodeConfigs[node.type as WorkflowNodeType];
    }, [node, nodeConfigs]);
    const title = useMemo(() => {
        let tit = node?.data.nodeName;
        if (!tit) {
            tit = nodeConfig?.labelIntlKey ? getIntlText(nodeConfig.labelIntlKey) : '';
        }

        return getIntlText('workflow.editor.config_panel_test_title', { 1: tit });
    }, [node, nodeConfig, getIntlText]);

    // ---------- Generate Demo Data ----------
    const { genNodeTestData } = useTest();
    const [inputData, setInputData] = useState('');
    const nodeTestData = useMemo(() => {
        if (!open || !nodeId) return;
        const node = getNode(nodeId);

        if (!node) return;
        return genNodeTestData(node);
    }, [open, nodeId, getNode, genNodeTestData]);

    // ---------- Run Test ----------
    const {
        loading,
        data: testResult,
        run: testSingleNode,
    } = useRequest(
        async (value?: string) => {
            if (!open || !nodeId) return;
            let input: Record<string, any> = {};
            // Get the latest node data
            const node = cloneDeep(getNode(nodeId))!;

            node.data.parameters = node.data.parameters || {};
            if (node.type === 'email') {
                node.data.parameters.content = value;
            } else {
                try {
                    input = !value ? undefined : JSON.parse(value || '{}');
                } catch (e) {
                    toast.error({ content: getIntlText('common.message.json_format_error') });
                    return;
                }

                node.data.parameters = node.data.parameters || {};
                node.data.parameters = merge(node.data.parameters, input);
            }

            // console.log({ input, node });
            const [error, resp] = await awaitWrap(
                workflowAPI.testSingleNode({ input, node_config: JSON.stringify(node) }),
            );

            if (error || !isRequestSuccess(resp)) return;
            return getResponseData(resp);
        },
        {
            manual: true,
            debounceWait: 300,
            refreshDeps: [open, nodeId],
        },
    );

    useEffect(() => {
        if (!open) return;
        if (nodeTestData) {
            setInputData(nodeTestData.value);
            return;
        }

        testSingleNode();
    }, [open, nodeTestData, testSingleNode]);

    // Clear Data when panel closed
    useEffect(() => {
        if (open) return;
        setInputData('');
        testSingleNode();
    }, [open, testSingleNode]);

    return (
        <div className={cls('ms-config-panel-test-drawer-root', { open, loading })}>
            <Backdrop open={open} onClick={onClose}>
                <Slide direction="up" in={open}>
                    <div className="ms-config-panel-test-drawer" onClick={e => e.stopPropagation()}>
                        <div className="ms-config-panel-test-drawer-header">
                            <div className="ms-config-panel-test-drawer-title">
                                <Tooltip autoEllipsis title={title} />
                            </div>
                            <IconButton onClick={onClose}>
                                <CloseIcon />
                            </IconButton>
                        </div>
                        <div className="ms-config-panel-test-drawer-body">
                            {!!nodeTestData?.value && (
                                <div className="input-content-area">
                                    {nodeTestData.type === 'string' ? (
                                        node?.type === 'email' ? (
                                            <EmailContent
                                                upstreamNodeSelectable={false}
                                                value={inputData}
                                                onChange={setInputData}
                                            />
                                        ) : (
                                            <TextField
                                                multiline
                                                fullWidth
                                                rows={8}
                                                value={inputData}
                                                onChange={e => setInputData(e.target.value)}
                                                disabled={loading}
                                                placeholder={getIntlText('common.label.input')}
                                            />
                                        )
                                    ) : (
                                        <CodeEditor
                                            editorLang="json"
                                            title={getIntlText('common.label.input')}
                                            value={inputData}
                                            onChange={setInputData}
                                        />
                                    )}
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        className="ms-config-panel-test-drawer-btn"
                                        disabled={loading}
                                        startIcon={<PlayArrowIcon />}
                                        onClick={() => testSingleNode(inputData)}
                                    >
                                        {getIntlText('common.label.run')}
                                    </Button>
                                </div>
                            )}
                            {!!testResult && (
                                <>
                                    {!!nodeTestData?.value && <Divider />}
                                    <div className="output-content-area">
                                        <Alert
                                            severity={
                                                testResult.status === 'SUCCESS'
                                                    ? 'success'
                                                    : 'error'
                                            }
                                            icon={statusDefaultMsgKey[testResult.status]?.icon}
                                        >
                                            {testResult.error_message ||
                                                getIntlText(
                                                    statusDefaultMsgKey[testResult.status]
                                                        ?.intlKey || '',
                                                )}
                                        </Alert>
                                        {testResult.output && (
                                            <CodeEditor
                                                readOnly
                                                editable={false}
                                                editorLang="json"
                                                title={getIntlText('common.label.output')}
                                                value={safeJSONStringify(testResult.output)}
                                            />
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        {loading && <CircularProgress />}
                    </div>
                </Slide>
            </Backdrop>
        </div>
    );
};

export default React.memo(TestDrawer);
