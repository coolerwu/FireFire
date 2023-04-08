import React, {createContext, useEffect, useState} from 'react';
import {ConfigProvider, Spin, Tabs} from "antd";
import 'antd/dist/antd.min';
import 'moment/locale/zh-cn';
import moment from "moment";
import './index.less';
import ReactDOM from "react-dom";
import {FileSearchOutlined, SettingOutlined} from "@ant-design/icons";
import File from "./pages/file/file";
import Setting from "./pages/setting";

moment.locale('zh-cn');

const {TabPane} = Tabs;

const commonStyle = {
    padding: 0,
}

export const Context = createContext(null);

const chooseBackgroundFunc = (themeSource) => {
    if (themeSource !== 'dark') {
        return {
            backgroundColor: 'white'
        }
    } else {
        return {
            backgroundColor: 'darkgray'
        }
    }
};

const chooseThemeFunc = (themeSource) => {
    if (themeSource !== 'dark') {
        return {
            token: {
                colorPrimary: '#00b96b',
                colorBgContainer: 'white',
                colorLink: '#b1cec0',
                colorLinkActive: '#00ff94',
                colorLinkHover: '#00b96b',
            },
        };
    } else {
        //暗黑模式
        return {
            token: {
                colorPrimary: '#7d806e',
                colorBgContainer: 'darkgray',
                colorLink: '#7d806e',
                colorLinkActive: '#d3ff00',
                colorLinkHover: '#c2cc8c',
            },
        };
    }
};


const App = () => {
    //加载loading
    const [load, setLoad] = useState(true);
    //当前激活的key
    const [activeKey, setActiveKey] = useState('2');
    //文件列表
    const [cwjsonList, setCwjsonList] = useState([]);
    //配置文件信息
    const [setting, setSetting] = useState(null);
    //当前路径
    const [curDir, setCurDir] = useState('.');
    //主题
    const [theme, setTheme] = useState(null);

    //项目初始化
    useEffect(() => {
        Promise.all([window.electronAPI.readSettingFile(), window.electronAPI.readNotebookFileList(curDir)]).then(res => {
            setSetting(res[0]);
            setCwjsonList(res[1]);

            const theme = {};
            theme.fontSizeLarge = '20px';
            theme.fontSizeMini = '10px';
            theme.fontLinkColor = '#365ad2';
            if (setting?.themeSource !== 'dark') {
                theme.fontColor = '#1f1f1f';
            } else {
                theme.fontColor = 'white';
            }
            setTheme(theme);

            setTimeout(() => {
                setLoad(false);
            }, 50);
        })
    }, [curDir, load, setting]);

    //切换tab事件
    const tabClick = (activeKey) => {
        setActiveKey(activeKey);
    }

    return (
        <div style={chooseBackgroundFunc(setting?.themeSource)}>
            <ConfigProvider theme={chooseThemeFunc(setting?.themeSource)}>
                <Context.Provider value={{setLoad, setActiveKey, setting, curDir, setCurDir, theme}}>
                    {load && <Spin style={{marginLeft: '50%', marginTop: '50%'}}/>}
                    {!load && (
                        <Tabs activeKey={activeKey} tabPosition={'left'} className={'slider'}
                              destroyInactiveTabPane={true} onTabClick={tabClick}>
                            <TabPane key={'2'} tab={<span><FileSearchOutlined/>文章列表</span>} style={commonStyle}>
                                <File cwjsonList={cwjsonList}/>
                            </TabPane>
                            <TabPane key={'100'} tab={<span><SettingOutlined/>设置</span>} style={commonStyle}>
                                <Setting/>
                            </TabPane>
                        </Tabs>
                    )}
                </Context.Provider>
            </ConfigProvider>
        </div>
    );
};

ReactDOM.render(<App/>, document.getElementById('root'));
