import React, {useEffect, useState} from "react";
import {message, Modal} from "antd";
import {FolderOpenOutlined, SyncOutlined, FolderOutlined, ExclamationCircleOutlined} from "@ant-design/icons";
import {electronAPI} from "../../utils/electronAPI";
import {logger} from "../../utils/logger";

const WorkspaceSetting = () => {
    const [workspacePath, setWorkspacePath] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWorkspacePath();
    }, []);

    const loadWorkspacePath = async () => {
        setLoading(true);
        try {
            const path = await electronAPI.getCurrentWorkspace();
            setWorkspacePath(path || '未设置');
        } catch (error) {
            logger.error('获取工作空间路径失败:', error);
            message.error('获取工作空间路径失败');
        } finally {
            setLoading(false);
        }
    };

    const handleChangeWorkspace = async () => {
        try {
            const result = await electronAPI.changeWorkspace();

            if (result.success) {
                Modal.confirm({
                    title: '工作空间已更改',
                    icon: <SyncOutlined style={{color: '#0f7b6c'}}/>,
                    content: (
                        <div>
                            <p>新工作空间: {result.path}</p>
                            <p className="mt-2 text-notion-text-tertiary">
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
                // 用户取消
            } else {
                message.error(result.error || '更改工作空间失败');
            }
        } catch (error) {
            logger.error('更改工作空间失败:', error);
            message.error('更改工作空间失败');
        }
    };

    const handleOpenInFileManager = async () => {
        try {
            const result = await electronAPI.openWorkspaceFolder();
            if (!result.success) {
                message.error(result.error || '打开文件夹失败');
            }
        } catch (error) {
            logger.error('打开文件夹失败:', error);
            message.error('打开文件夹失败');
        }
    };

    return (
        <div className="space-y-6">
            {/* 当前工作空间 */}
            <div className="p-5 rounded-lg border border-notion-border dark:border-notion-dark-border bg-notion-bg-secondary dark:bg-notion-dark-bg-secondary">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-notion-accent-blue/10 flex items-center justify-center">
                        <FolderOutlined className="text-lg text-notion-accent-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-notion-text-primary dark:text-notion-dark-text-primary">
                            当前工作空间
                        </h3>
                        {loading ? (
                            <div className="mt-2 h-8 bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary rounded animate-pulse" />
                        ) : (
                            <div className="mt-2 px-3 py-2 rounded-md bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary">
                                <code className="text-xs text-notion-text-secondary dark:text-notion-dark-text-secondary break-all">
                                    {workspacePath}
                                </code>
                            </div>
                        )}
                        <p className="mt-2 text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                            工作空间包含所有笔记、附件和配置文件
                        </p>
                    </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3 mt-5 pt-5 border-t border-notion-border/50 dark:border-notion-dark-border/50">
                    <button
                        onClick={handleChangeWorkspace}
                        className="
                            flex items-center gap-2 px-4 py-2 rounded-md
                            bg-notion-accent-blue text-white
                            text-sm font-medium
                            hover:opacity-90
                            transition-opacity duration-fast
                        "
                    >
                        <FolderOutlined />
                        更改工作空间
                    </button>
                    <button
                        onClick={handleOpenInFileManager}
                        className="
                            flex items-center gap-2 px-4 py-2 rounded-md
                            border border-notion-border dark:border-notion-dark-border
                            text-notion-text-primary dark:text-notion-dark-text-primary
                            text-sm font-medium
                            hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                            transition-colors duration-fast
                        "
                    >
                        <FolderOpenOutlined />
                        在文件管理器中打开
                    </button>
                </div>
            </div>

            {/* 注意事项 */}
            <div className="flex gap-3 p-4 rounded-lg bg-notion-accent-yellow/10 border border-notion-accent-yellow/30">
                <ExclamationCircleOutlined className="flex-shrink-0 text-notion-accent-yellow mt-0.5" />
                <div className="text-xs text-notion-text-secondary dark:text-notion-dark-text-secondary">
                    <strong className="text-notion-text-primary dark:text-notion-dark-text-primary">注意：</strong>
                    更改工作空间需要重启应用。确保已保存所有正在编辑的内容。
                </div>
            </div>
        </div>
    );
};

export default WorkspaceSetting;
