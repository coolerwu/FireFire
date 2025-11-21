import React, {useEffect, useState} from "react";
import {Button, Card, Divider, message, Modal, Space, Typography} from "antd";
import {FolderOpenOutlined, SyncOutlined, FolderOutlined} from "@ant-design/icons";
import {electronAPI} from "../../utils/electronAPI";
import './base.less';

const {Text, Paragraph} = Typography;

const WorkspaceSetting = () => {
    const [workspacePath, setWorkspacePath] = useState('');
    const [loading, setLoading] = useState(true);

    // 加载当前工作空间路径
    useEffect(() => {
        loadWorkspacePath();
    }, []);

    const loadWorkspacePath = async () => {
        setLoading(true);
        try {
            const path = await electronAPI.getCurrentWorkspace();
            setWorkspacePath(path || '未设置');
        } catch (error) {
            console.error('获取工作空间路径失败:', error);
            message.error('获取工作空间路径失败');
        } finally {
            setLoading(false);
        }
    };

    // 更改工作空间
    const handleChangeWorkspace = async () => {
        try {
            const result = await electronAPI.changeWorkspace();

            if (result.success) {
                // 显示重启对话框
                Modal.confirm({
                    title: '工作空间已更改',
                    icon: <SyncOutlined style={{color: '#25b864'}}/>,
                    content: (
                        <div>
                            <p>新工作空间: {result.path}</p>
                            <p style={{marginTop: '10px', color: '#666'}}>
                                需要重启应用以加载新工作空间
                            </p>
                        </div>
                    ),
                    okText: '立即重启',
                    cancelText: '稍后',
                    onOk: async () => {
                        await electronAPI.restartApp();
                    },
                });
            } else if (result.canceled) {
                // 用户取消选择，不显示任何消息
            } else {
                message.error(result.error || '更改工作空间失败');
            }
        } catch (error) {
            console.error('更改工作空间失败:', error);
            message.error('更改工作空间失败');
        }
    };

    // 在文件管理器中打开
    const handleOpenInFileManager = async () => {
        try {
            const result = await electronAPI.openWorkspaceFolder();
            if (!result.success) {
                message.error(result.error || '打开文件夹失败');
            }
        } catch (error) {
            console.error('打开文件夹失败:', error);
            message.error('打开文件夹失败');
        }
    };

    return (
        <div className={'index'}>
            <Divider orientation={'left'} plain className={'gutter'}>工作空间</Divider>

            <Card size="small" style={{marginTop: '16px', maxWidth: '600px'}} loading={loading}>
                <Space direction="vertical" style={{width: '100%'}} size="middle">
                    <div>
                        <Text type="secondary">当前工作空间路径:</Text>
                        <Paragraph
                            copyable
                            style={{
                                marginTop: '8px',
                                padding: '8px 12px',
                                background: '#f5f5f5',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '13px',
                                wordBreak: 'break-all'
                            }}
                        >
                            {workspacePath}
                        </Paragraph>
                    </div>

                    <div style={{marginTop: '8px'}}>
                        <Text type="secondary" style={{display: 'block', marginBottom: '8px'}}>
                            工作空间包含所有笔记、附件和配置文件
                        </Text>
                    </div>

                    <Space direction="horizontal" style={{width: '100%'}} size="middle">
                        <Button
                            type="primary"
                            icon={<FolderOutlined />}
                            onClick={handleChangeWorkspace}
                        >
                            更改工作空间
                        </Button>

                        <Button
                            icon={<FolderOpenOutlined />}
                            onClick={handleOpenInFileManager}
                        >
                            在文件管理器中打开
                        </Button>
                    </Space>

                    <div style={{marginTop: '16px', padding: '12px', background: '#fff7e6', borderRadius: '4px', border: '1px solid #ffd591'}}>
                        <Text style={{fontSize: '12px', color: '#ad6800'}}>
                            <strong>注意：</strong>更改工作空间需要重启应用。确保已保存所有正在编辑的内容。
                        </Text>
                    </div>
                </Space>
            </Card>
        </div>
    );
};

export default WorkspaceSetting;
