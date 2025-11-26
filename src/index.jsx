import React, {createContext, useEffect, useState, useCallback, useRef} from 'react';
import {ConfigProvider, Spin, message} from "antd";
import 'antd/dist/antd.min';
import 'moment/locale/zh-cn';
import moment from "moment";
import './styles/tailwind.css';
import './index.less';
import 'tippy.js/dist/tippy.css';
import { createRoot } from "react-dom/client";
import Setting from "./pages/setting";
import JournalView from "./pages/journal/JournalView";
import TimelineView from "./pages/timeline/TimelineView";
import NoteEditorView from "./pages/editor/NoteEditorView";
import AIChatView from "./pages/ai/AIChatView";
import GraphView from "./pages/graph/GraphView";
import Sidebar from "./components/Sidebar";
import Welcome from "./pages/welcome/Welcome";
import buildThemeStyleFunc from "./utils/theme";
import {electronAPI} from "./utils/electronAPI";
import {logger} from "./utils/logger";
import ErrorBoundary from "./components/ErrorBoundary";
import SearchModal from "./components/SearchModal/SearchModal";
import {subscribeSaveStatus, SaveStatus} from "./utils/cwjsonFileOp";

/**
 * 设置中文时区
 */
moment.locale('zh-cn');

/**
 * 上下文
 */
export const Context = createContext(null);

const App = () => {
    //配置文件信息
    const [setting, setSetting] = useState(null);
    //当前路径
    const [curDir, setCurDir] = useState('.');
    //主题
    const [theme, setTheme] = useState(null);
    //侧边栏折叠状态
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    //首次启动检测
    const [isFirstTime, setIsFirstTime] = useState(false);
    const [checkingFirstTime, setCheckingFirstTime] = useState(true);

    //项目刷新
    const [loading, setLoading] = useState(true);
    const requestIdRef = useRef(0); // 用于处理竞态条件
    // 全局刷新版本号 - 当文件更新时递增，其他组件监听此变化来刷新列表
    const [refreshKey, setRefreshKey] = useState(0);
    const triggerRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    // 订阅保存状态变化，保存成功后触发刷新
    useEffect(() => {
        const unsubscribe = subscribeSaveStatus((status, filename) => {
            if (status === SaveStatus.SAVED) {
                logger.debug('[App] 文件保存成功，触发列表刷新:', filename);
                triggerRefresh();
            }
        });
        return () => unsubscribe();
    }, [triggerRefresh]);

    // 检测首次启动
    useEffect(() => {
        const checkFirstTimeSetup = async () => {
            try {
                const isFirstTimeResult = await electronAPI.isFirstTimeSetup();
                setIsFirstTime(isFirstTimeResult);
            } catch (error) {
                logger.error('[App] 检测首次启动失败:', error);
                setIsFirstTime(false);
            } finally {
                setCheckingFirstTime(false);
            }
        };
        checkFirstTimeSetup();
    }, []);

    // 欢迎页面完成回调
    const handleWelcomeComplete = useCallback(() => {
        setIsFirstTime(false);
        loadData();
    }, []);

    // 数据加载函数（只加载设置）
    const loadData = useCallback(() => {
        const currentRequestId = ++requestIdRef.current;
        setLoading(true);

        electronAPI.readSettingFile()
            .then(res => {
                // 检查是否是最新的请求（防止竞态条件）
                if (currentRequestId !== requestIdRef.current) {
                    return;
                }

                // 配置
                setSetting(res);
                setTheme(buildThemeStyleFunc(res));
            })
            .catch(err => {
                logger.error('[App] 加载数据失败:', err);
                message.error('加载数据失败，请检查配置');
            })
            .finally(() => {
                // 检查是否是最新的请求
                if (currentRequestId === requestIdRef.current) {
                    setLoading(false);
                }
            });
    }, []);

    const refresh = useCallback((values) => {
        if (values?.curDir) {
            setCurDir(values.curDir);
        } else {
            // 触发重新加载
            loadData();
        }
    }, [loadData]);

    // 初始加载和 curDir 变化时加载
    useEffect(() => {
        loadData();
    }, [loadData]);

    //切换tab事件 - 默认显示日记
    const [activeKey, setActiveKey] = useState('journal');
    // 用于传递新建的笔记（独立编辑器）
    const [editingNote, setEditingNote] = useState(null);
    // 搜索模态框状态
    const [searchModalVisible, setSearchModalVisible] = useState(false);

    const handleNavigate = (key) => {
        // 切换到其他视图时清除编辑中的笔记
        setEditingNote(null);
        setActiveKey(key);
    };

    // 打开搜索模态框
    const handleOpenSearch = useCallback(() => {
        setSearchModalVisible(true);
    }, []);

    // 从搜索结果中打开笔记
    const handleSelectNote = useCallback(async (note) => {
        try {
            // 判断是否是日记
            const isJournal = note.path && note.path.startsWith('journals/');

            if (isJournal) {
                // 跳转到日记页面
                setActiveKey('journal');
                // 滚动到对应日记（通过日期定位）
                setTimeout(() => {
                    const journalId = note.id;
                    const targetElement = document.querySelector(`[data-journal-id="${journalId}"]`);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            } else {
                // 打开普通笔记编辑器
                const settingInfo = await electronAPI.readSettingFile();
                const suffix = settingInfo.notebookSuffix || '.md';

                const noteInfo = {
                    id: note.id,
                    filename: note.id + suffix,
                    type: 'file',
                    notebookPath: note.path,
                    attachmentPath: `${settingInfo.attachmentPath}/${note.id}`,
                };

                setEditingNote(noteInfo);
                setActiveKey('editor');
            }
        } catch (error) {
            logger.error('打开笔记失败:', error);
        }
    }, []);

    // 监听键盘快捷键 Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchModalVisible(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleToggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    // 新建笔记 - 使用毫秒时间戳作为文件名，打开独立编辑器
    const handleCreateNote = useCallback(async () => {
        try {
            // 文件名格式：纯毫秒时间戳
            const fileName = String(Date.now());

            // 创建文件并写入空文档（这样会注册到数据库）
            const emptyDoc = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] });
            await electronAPI.writeNotebookFile(fileName, emptyDoc);

            // 获取设置中的路径信息
            const settingInfo = await electronAPI.readSettingFile();
            const notebookPath = settingInfo.notebookPath;
            const suffix = settingInfo.notebookSuffix || '.md';

            // 构建笔记对象
            const noteInfo = {
                id: fileName,
                filename: fileName + suffix,
                type: 'file',
                notebookPath: `${notebookPath}/${fileName}${suffix}`,
                attachmentPath: `${settingInfo.attachmentPath}/${fileName}`,
            };

            logger.info(`创建快速笔记: ${fileName}`);

            // 打开独立编辑器
            setEditingNote(noteInfo);
            setActiveKey('editor');
        } catch (error) {
            logger.error('创建快速笔记失败:', error);
            message.error('创建笔记失败');
        }
    }, []);

    // 根据主题设置暗色模式类
    useEffect(() => {
        if (setting?.themeSource === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (setting?.themeSource === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            // system - 跟随系统
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [setting?.themeSource]);

    // 首次启动检测中
    if (checkingFirstTime) {
        return (
            <div className="flex items-center justify-center h-screen bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
                <Spin size="large" />
            </div>
        );
    }

    // 首次启动显示欢迎页面
    if (isFirstTime) {
        return (
            <ErrorBoundary>
                <Welcome onComplete={handleWelcomeComplete} />
            </ErrorBoundary>
        );
    }

    // 等待主题加载完成
    if (!theme) {
        return (
            <ErrorBoundary>
                <div className="flex items-center justify-center h-screen bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
                    <Spin size="large" />
                </div>
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <div className="app-container flex h-screen overflow-hidden bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
                <ConfigProvider theme={{token: theme.token}}>
                    <Context.Provider value={{refresh, setActiveKey, setting, curDir, setCurDir, theme, loadData, refreshKey, triggerRefresh, setEditingNote}}>
                        {/* 侧边栏 */}
                        <Sidebar
                            activeKey={activeKey}
                            onNavigate={handleNavigate}
                            collapsed={sidebarCollapsed}
                            onToggleCollapse={handleToggleSidebar}
                            onCreateNote={handleCreateNote}
                            onSearch={handleOpenSearch}
                        />

                        {/* 主内容区 */}
                        <main className="flex-1 h-screen overflow-hidden bg-notion-bg-primary dark:bg-notion-dark-bg-primary relative">
                            {/* 加载遮罩层 - 只在加载时显示，不卸载子组件 */}
                            {loading && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-notion-bg-primary/80 dark:bg-notion-dark-bg-primary/80">
                                    <Spin size="large" />
                                </div>
                            )}

                            <ErrorBoundary>
                                <div className={`h-full ${activeKey === 'journal' ? 'block' : 'hidden'}`}>
                                    <JournalView/>
                                </div>
                                <div className={`h-full ${activeKey === 'timeline' ? 'block' : 'hidden'}`}>
                                    <TimelineView/>
                                </div>
                                <div className={`h-full ${activeKey === 'ai-chat' ? 'block' : 'hidden'}`}>
                                    <AIChatView/>
                                </div>
                                <div className={`h-full ${activeKey === 'graph' ? 'block' : 'hidden'}`}>
                                    <GraphView/>
                                </div>
                                <div className={`h-full ${activeKey === 'editor' ? 'block' : 'hidden'}`}>
                                    {editingNote && (
                                        <NoteEditorView
                                            note={editingNote}
                                            onBack={() => {
                                                setEditingNote(null);
                                                setActiveKey('timeline');
                                            }}
                                        />
                                    )}
                                </div>
                                <div className={`h-full ${activeKey === 'setting' ? 'block' : 'hidden'}`}>
                                    <Setting/>
                                </div>
                            </ErrorBoundary>
                        </main>
                    </Context.Provider>
                </ConfigProvider>

                {/* 搜索模态框 */}
                <SearchModal
                    visible={searchModalVisible}
                    onClose={() => setSearchModalVisible(false)}
                    onSelectNote={handleSelectNote}
                />
            </div>
        </ErrorBoundary>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App/>);
