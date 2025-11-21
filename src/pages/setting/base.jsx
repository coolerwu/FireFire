import React, {Button, Divider, Input, message, Popover, Space, Radio, Switch, Modal, Progress, Card} from "antd";
import './base.less';
import {useContext, useEffect, useRef, useState} from "react";
import {Context} from "../../index";
import {IssuesCloseOutlined, CheckCircleOutlined, SyncOutlined} from "@ant-design/icons";
import {electronAPI} from "../../utils/electronAPI";

/**
 * 校验文件读写权限
 */
async function verifyPermission(fileOrDirectory) {
    const options = {mode: 'readwrite'};
    if ((await fileOrDirectory.queryPermission(options)) === 'granted') {
        return true;
    }
    if ((await fileOrDirectory.requestPermission(options)) === 'granted') {
        return true;
    }
    return false;
}

/**
 * 输入文件保存路径方式选择
 */
const isSelfWrite = (type) => type === '手动输入';

const BaseSetting = () => {
    //上下文
    const {updateValueByKeyFunc, setting} = useContext(Context);
    useEffect(() => {
        if (setting?.themeSource) {
            setThemeSource(setting.themeSource);
        }
    }, [setting]);

    //选择笔记保存路径
    const [notebookPathTypeBtn, setNotebookPathTypeBtn] = useState('手动输入');
    const changeNotebookPathTypeEvent = () => {
        setNotebookPathTypeBtn(isSelfWrite(notebookPathTypeBtn) ? '选择文件夹' : '手动输入')
    }
    const notebookPathInput = useRef(null);
    const confirmNotebookSavePathEvent = async () => {
        if (!isSelfWrite(notebookPathTypeBtn)) {
            const directory = await window.showDirectoryPicker();
            if (!directory) {
                return;
            }

            const permission = await verifyPermission(directory);
            if (!permission) {
                message.error('已选择的文件夹无法访问（权限不足）');
                return;
            }

            const file = await directory.getFileHandle('demo.cwjson', {create: true});
            if (notebookPathInput?.current?.input) {
                notebookPathInput.current.input.value = directory.resolve(file)
            }
        }

        //保存路径
        if (notebookPathInput?.current?.input) {
            updateValueByKeyFunc('notebookPath', notebookPathInput.current.input.value);
        }
    };

    //选择附件保存路径
    const [attachmentPathTypeBtn, setAttachmentPathTypeBtn] = useState('手动输入');
    const changeAttachmentPathTypeEvent = () => {
        setAttachmentPathTypeBtn(isSelfWrite(attachmentPathTypeBtn) ? '选择文件夹' : '手动输入')
    }
    const attachmentPathInput = useRef(null);
    const confirmAttachmentSavePathEvent = async () => {
        if (!isSelfWrite(attachmentPathTypeBtn)) {
            const directory = await window.showDirectoryPicker();
            if (!directory) {
                return;
            }

            const permission = await verifyPermission(directory);
            if (!permission) {
                message.error('已选择的文件夹无法访问（权限不足）');
                return;
            }

            const file = await directory.getFileHandle('demo.cwjson', {create: true});
            if (attachmentPathInput?.current?.input) {
                attachmentPathInput.current.input.value = directory.resolve(file)
            }
        }

        //保存路径
        if (attachmentPathInput?.current?.input) {
            updateValueByKeyFunc('attachmentPath', attachmentPathInput.current.input.value);
        }
    };

    //主题模式
    const [themeSource, setThemeSource] = useState('system');
    const changeThemeSourceEvent = (e) => {
        if (e?.target?.value) {
            updateValueByKeyFunc('themeSource', e.target.value);
        }
    }

    //自动更新
    const [currentVersion, setCurrentVersion] = useState('');
    const [checking, setChecking] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(setting?.autoUpdate !== false);

    useEffect(() => {
        // 获取当前版本
        electronAPI.getAppVersion().then(setCurrentVersion);

        // 监听更新状态
        const removeListener = electronAPI.onUpdateStatus((status) => {
            const { event, data } = status;

            switch (event) {
                case 'checking-for-update':
                    setChecking(true);
                    message.info('正在检查更新...');
                    break;

                case 'update-available':
                    setChecking(false);
                    Modal.confirm({
                        title: '发现新版本',
                        icon: <CheckCircleOutlined style={{ color: '#25b864' }} />,
                        content: (
                            <div>
                                <p>当前版本: v{currentVersion}</p>
                                <p>最新版本: v{data.version}</p>
                                {data.releaseNotes && (
                                    <div style={{ marginTop: '10px', maxHeight: '200px', overflow: 'auto' }}>
                                        <div dangerouslySetInnerHTML={{ __html: data.releaseNotes }} />
                                    </div>
                                )}
                            </div>
                        ),
                        okText: '立即更新',
                        cancelText: '稍后提醒',
                        onOk: () => {
                            electronAPI.downloadUpdate();
                            setDownloading(true);
                        },
                    });
                    break;

                case 'update-not-available':
                    setChecking(false);
                    message.success('已是最新版本');
                    break;

                case 'download-progress':
                    setDownloadProgress(Math.round(data.percent));
                    break;

                case 'update-downloaded':
                    setDownloading(false);
                    setDownloadProgress(0);
                    Modal.confirm({
                        title: '更新已下载',
                        icon: <CheckCircleOutlined style={{ color: '#25b864' }} />,
                        content: '更新已下载完成，是否立即重启安装？',
                        okText: '立即重启',
                        cancelText: '稍后安装',
                        onOk: () => {
                            electronAPI.quitAndInstall();
                        },
                    });
                    break;

                case 'update-error':
                    setChecking(false);
                    setDownloading(false);
                    message.error(`更新失败: ${data.message}`);
                    break;

                default:
                    break;
            }
        });

        return removeListener;
    }, [currentVersion]);

    const handleCheckUpdate = () => {
        electronAPI.checkForUpdates();
    };

    const handleAutoUpdateChange = (checked) => {
        setAutoUpdateEnabled(checked);
        updateValueByKeyFunc('autoUpdate', checked);
    };

    return (
        <div className={'index'}>
            <Divider orientation={'left'} plain className={'gutter'}>笔记保存路径</Divider>
            <Space.Compact className={'filePathInput'}>
                <Button type="primary" onClick={changeNotebookPathTypeEvent}>{notebookPathTypeBtn}</Button>
                <Input ref={notebookPathInput} placeholder={isSelfWrite(notebookPathTypeBtn) ? '请输入绝对路径' : ''}
                       defaultValue={setting.notebookPath}/>
                <Button type="primary"
                        onClick={confirmNotebookSavePathEvent}>{isSelfWrite(notebookPathTypeBtn) ? '保存' : '选择'}</Button>
            </Space.Compact>
            {isSelfWrite(notebookPathTypeBtn) && <Popover content={'请输入绝对路径'} className={'filePathInputTips'}>
                <IssuesCloseOutlined/>
            </Popover>}

            <Divider orientation={'left'} plain className={'gutter'}>附件保存路径</Divider>
            <Space.Compact className={'filePathInput'}>
                <Button type="primary" onClick={changeAttachmentPathTypeEvent}>{attachmentPathTypeBtn}</Button>
                <Input ref={attachmentPathInput} placeholder={isSelfWrite(attachmentPathTypeBtn) ? '请输入绝对路径' : ''}
                       defaultValue={setting.attachmentPath}/>
                <Button type="primary"
                        onClick={confirmAttachmentSavePathEvent}>{isSelfWrite(attachmentPathTypeBtn) ? '保存' : '选择'}</Button>
            </Space.Compact>
            {isSelfWrite(attachmentPathTypeBtn) && <Popover content={'请输入绝对路径'} className={'filePathInputTips'}>
                <IssuesCloseOutlined/>
            </Popover>}

            <Divider orientation={'left'} plain className={'gutter'}>主题模式</Divider>
            <Radio.Group value={themeSource} onChange={changeThemeSourceEvent}>
                <Radio.Button value="light">明亮模式</Radio.Button>
                <Radio.Button value="dark">暗黑模式</Radio.Button>
                <Radio.Button value="system">跟随系统</Radio.Button>
            </Radio.Group>

            <Divider orientation={'left'} plain className={'gutter'}>软件更新</Divider>
            <Card size="small" style={{ marginTop: '16px', maxWidth: '600px' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>当前版本:</span>
                        <span style={{ fontWeight: 600 }}>v{currentVersion}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>自动检查更新:</span>
                        <Switch
                            checked={autoUpdateEnabled}
                            onChange={handleAutoUpdateChange}
                            checkedChildren="开启"
                            unCheckedChildren="关闭"
                        />
                    </div>

                    {downloading && (
                        <div>
                            <div style={{ marginBottom: '8px' }}>下载进度:</div>
                            <Progress percent={downloadProgress} status="active" />
                        </div>
                    )}

                    <Button
                        type="primary"
                        icon={checking ? <SyncOutlined spin /> : <CheckCircleOutlined />}
                        onClick={handleCheckUpdate}
                        loading={checking}
                        disabled={downloading}
                        block
                    >
                        {checking ? '检查中...' : downloading ? '下载中...' : '检查更新'}
                    </Button>
                </Space>
            </Card>
        </div>
    );
};

export default BaseSetting;