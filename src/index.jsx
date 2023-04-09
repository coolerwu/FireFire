import React, {createContext, useEffect, useState} from 'react';
import {ConfigProvider, Menu, Spin} from "antd";
import 'antd/dist/antd.min';
import 'moment/locale/zh-cn';
import moment from "moment";
import './index.less';
import ReactDOM from "react-dom";
import {FileSearchOutlined, SettingOutlined} from "@ant-design/icons";
import File from "./pages/file/file";
import Setting from "./pages/setting";
import buildThemeStyleFunc from "./utils/theme";

/**
 * 设置中文时区
 */
moment.locale('zh-cn');

/**
 * 上下文
 */
export const Context = createContext(null);

/**
 * 菜单
 */
const menuItemList = [
    {
        label: '文章',
        key: 'file',
        icon: <FileSearchOutlined/>,
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
        Promise.all([window.electronAPI.readSettingFile(), window.electronAPI.readNotebookFileList(curDir)]).then(res => {
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

    //切换tab事件
    const [activeKey, setActiveKey] = useState('file');
    const changeActiveKeyEvent = (value) => {
        setActiveKey(value.key);
    }

    return (
        <Spin spinning={loading} style={{marginLeft: 'auto', marginTop: '50vh'}}>
            {!loading && <div style={{backgroundColor: theme.backgroundColor}}>
                <ConfigProvider theme={{token: theme.token}}>
                    <Context.Provider value={{refresh, setActiveKey, setting, curDir, setCurDir, theme}}>
                        <div style={{display: 'flex'}}>
                            <Menu
                                onClick={changeActiveKeyEvent}
                                defaultSelectedKeys={[activeKey]}
                                mode="inline"
                                style={{
                                    width: '110px', height: '100vh', backgroundColor: theme.backgroundColor,
                                    borderRadius: '10px 10px 10px 0px', zIndex: '100',
                                    boxShadow: `2px 2px 2px 1px ${theme.boxShadowColor}`
                                }}
                                items={menuItemList}
                            />
                            <div style={{width: 'calc(100vw - 110px)', height: '100vh'}}>
                                {!loading && activeKey === 'file' && <File cwjsonList={cwjsonList}/>}
                                {!loading && activeKey === 'setting' && <Setting/>}
                            </div>
                        </div>
                    </Context.Provider>
                </ConfigProvider>
            </div>}
        </Spin>
    );
};

ReactDOM.render(<App/>, document.getElementById('root'));
