import React, {createContext, useEffect, useState, useCallback, useRef} from 'react';
import {ConfigProvider, Spin, message} from "antd";
import 'antd/dist/antd.min';
import 'moment/locale/zh-cn';
import moment from "moment";
import './styles/tailwind.css';
import './index.less';
import 'tippy.js/dist/tippy.css';
import { createRoot } from "react-dom/client";
import File from "./pages/file/file";
import Setting from "./pages/setting";
import JournalView from "./pages/journal/JournalView";
import TimelineView from "./pages/timeline/TimelineView";
import Sidebar from "./components/Sidebar";
import Welcome from "./pages/welcome/Welcome";
import buildThemeStyleFunc from "./utils/theme";
import {electronAPI} from "./utils/electronAPI";
import {logger} from "./utils/logger";
import ErrorBoundary from "./components/ErrorBoundary";

/**
 * 设置中文时区
 */
moment.locale('zh-cn');

/**
 * 上下文
 */
export const Context = createContext(null);

const App = () => {
    //文件列表
    const [cwjsonList, setCwjsonList] = useState([]);
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

    // 数据加载函数（提前声明）
    const loadData = useCallback(() => {
        const currentRequestId = ++requestIdRef.current;
        setLoading(true);

        Promise.all([
            electronAPI.readSettingFile(),
            electronAPI.readNotebookFileList(curDir)
        ])
            .then(res => {
                // 检查是否是最新的请求（防止竞态条件）
                if (currentRequestId !== requestIdRef.current) {
                    return;
                }

                // 配置
                setSetting(res[0]);
                setTheme(buildThemeStyleFunc(res[0]));

                // 文章
                setCwjsonList(res[1] || []);
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
    }, [curDir]);

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
    const handleNavigate = (key) => {
        setActiveKey(key);
    };

    const handleToggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

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

    return (
        <ErrorBoundary>
            {loading ? (
                <div className="flex items-center justify-center h-screen bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
                    <Spin size="large" />
                </div>
            ) : (
                theme && (
                    <div className="app-container flex h-screen overflow-hidden bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
                        <ConfigProvider theme={{token: theme.token}}>
                            <Context.Provider value={{refresh, setActiveKey, setting, curDir, setCurDir, theme, loadData}}>
                                {/* 侧边栏 */}
                                <Sidebar
                                    activeKey={activeKey}
                                    onNavigate={handleNavigate}
                                    collapsed={sidebarCollapsed}
                                    onToggleCollapse={handleToggleSidebar}
                                />

                                {/* 主内容区 */}
                                <main className="flex-1 h-screen overflow-hidden bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
                                    <ErrorBoundary>
                                        <div className={`h-full ${activeKey === 'journal' ? 'block' : 'hidden'}`}>
                                            <JournalView/>
                                        </div>
                                        <div className={`h-full ${activeKey === 'timeline' ? 'block' : 'hidden'}`}>
                                            <TimelineView/>
                                        </div>
                                        <div className={`h-full ${activeKey === 'folder' ? 'block' : 'hidden'}`}>
                                            <File cwjsonList={cwjsonList}/>
                                        </div>
                                        <div className={`h-full ${activeKey === 'setting' ? 'block' : 'hidden'}`}>
                                            <Setting/>
                                        </div>
                                    </ErrorBoundary>
                                </main>
                            </Context.Provider>
                        </ConfigProvider>
                    </div>
                )
            )}
        </ErrorBoundary>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App/>);
