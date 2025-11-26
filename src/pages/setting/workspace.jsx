import React, {useEffect, useState} from "react";
import {message, Modal} from "antd";
import {FolderOpenOutlined, SyncOutlined, FolderOutlined, ExclamationCircleOutlined, WarningOutlined} from "@ant-design/icons";
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

    const handleFactoryReset = () => {
        Modal.confirm({
            title: '恢复出厂设置',
            icon: <WarningOutlined style={{color: '#ff4d4f'}}/>,
            content: (
                <div>
                    <p className="text-red-500 font-semibold">此操作将：</p>
                    <ul className="mt-2 ml-4 list-disc text-sm text-notion-text-secondary">
                        <li>清除工作空间配置</li>
                        <li>重置应用设置</li>
                        <li>重新显示欢迎页面</li>
                    </ul>
                    <p className="mt-3 text-xs text-notion-text-tertiary">
                        注意：您的笔记文件不会被删除，只是需要重新选择工作空间。
                    </p>
                </div>
            ),
            okText: '确认重置',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                try {
                    const result = await electronAPI.factoryReset();
                    if (!result.success) {
                        message.error(result.error || '恢复出厂设置失败');
                    }
                } catch (error) {
                    logger.error('恢复出厂设置失败:', error);
                    message.error('恢复出厂设置失败');
                }
            },
        });
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

            {/* 恢复出厂设置 */}
            <div className="p-5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <WarningOutlined className="text-lg text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                            恢复出厂设置
                        </h3>
                        <p className="mt-1 text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                            清除所有配置，重新开始。您的笔记文件不会被删除。
                        </p>
                        <button
                            onClick={handleFactoryReset}
                            className="
                                mt-4 flex items-center gap-2 px-4 py-2 rounded-md
                                bg-red-500 text-white
                                text-sm font-medium
                                hover:bg-red-600
                                transition-colors duration-fast
                            "
                        >
                            <WarningOutlined />
                            恢复出厂设置
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceSetting;
