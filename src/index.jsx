import React, {createContext, useEffect, useState} from 'react';
import {ConfigProvider, Menu, Spin} from "antd";
import 'antd/dist/antd.min';
import 'moment/locale/zh-cn';
import moment from "moment";
import './index.less';
import 'tippy.js/dist/tippy.css';
import ReactDOM from "react-dom";
import {SettingOutlined, CalendarOutlined, ClockCircleOutlined, FolderOutlined} from "@ant-design/icons";
import File from "./pages/file/file";
import Setting from "./pages/setting";
import JournalView from "./pages/journal/JournalView";
import TimelineView from "./pages/timeline/TimelineView";
import buildThemeStyleFunc from "./utils/theme";
import {electronAPI} from "./utils/electronAPI";

/**
 * 设置中文时区
 */
moment.locale('zh-cn');

/**
 * 上下文
 */
export const Context = createContext(null);

/**
 * 菜单 - 按新顺序：日记、时间线、文件夹、设置
 */
const menuItemList = [
    {
        label: '日记',
        key: 'journal',
        icon: <CalendarOutlined/>,
    },
    {
        label: '时间线',
        key: 'timeline',
        icon: <ClockCircleOutlined/>,
    },
    {
        label: '文件夹',
        key: 'folder',
        icon: <FolderOutlined/>,
    },
    {
        label: '设置',
        key: 'setting',
        icon: <SettingOutlined/>,
    },
]

const App = () => {
    //文件列表
    const [cwjsonList, setCwjsonList] = useState([]);
    //配置文件信息
    const [setting, setSetting] = useState(null);
    //当前路径
    const [curDir, setCurDir] = useState('.');
    //主题
    const [theme, setTheme] = useState(null);

    //项目刷新
    const [loading, setLoading] = useState(true);
    const refresh = (values) => {
        if (values?.curDir) {
            setCurDir(values.curDir);
        }

        //加载时机
        setTimeout(() => {
            setLoading(true);
        }, 50);
    }
    useEffect(() => {
        Promise.all([electronAPI.readSettingFile(), electronAPI.readNotebookFileList(curDir)]).then(res => {
            //配置
            setSetting(res[0]);
            setTheme(buildThemeStyleFunc(res[0]));

            //文章
            setCwjsonList(res[1]);

            //加载时机
            setTimeout(() => {
                setLoading(false);
            }, 50);
        })
    }, [curDir, loading]);

    //切换tab事件 - 默认显示日记
    const [activeKey, setActiveKey] = useState('journal');
    const changeActiveKeyEvent = (value) => {
        setActiveKey(value.key);
    }

    return (
        <Spin spinning={loading} size="large" style={{marginLeft: '50vw', marginTop: '50vh'}}>
            {!loading && <div className="app-container">
                <ConfigProvider theme={{token: theme.token}}>
                    <Context.Provider value={{refresh, setActiveKey, setting, curDir, setCurDir, theme}}>
                        <div className="sidebar">
                            <Menu
                                onClick={changeActiveKeyEvent}
                                defaultSelectedKeys={[activeKey]}
                                mode="inline"
                                style={{
                                    width: 'var(--sidebar-width, 80px)',
                                    height: '100vh',
                                    background: 'transparent',
                                    border: 'none',
                                    paddingTop: '20px'
                                }}
                                items={menuItemList}
                            />
                        </div>
                        <div className="main-content">
                            {!loading && (
                                <>
                                    <div style={{ display: activeKey === 'journal' ? 'block' : 'none', height: '100%' }}>
                                        <JournalView/>
                                    </div>
                                    <div style={{ display: activeKey === 'timeline' ? 'block' : 'none', height: '100%' }}>
                                        <TimelineView/>
                                    </div>
                                    <div style={{ display: activeKey === 'folder' ? 'block' : 'none', height: '100%' }}>
                                        <File cwjsonList={cwjsonList}/>
                                    </div>
                                    <div style={{ display: activeKey === 'setting' ? 'block' : 'none', height: '100%' }}>
                                        <Setting/>
                                    </div>
                                </>
                            )}
                        </div>
                    </Context.Provider>
                </ConfigProvider>
            </div>}
        </Spin>
    );
};

ReactDOM.render(<App/>, document.getElementById('root'));
