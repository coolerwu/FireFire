import React, {createContext, useEffect, useState} from 'react';
import {Spin, Tabs} from "antd";
import 'antd/dist/antd.min.css';
import 'moment/locale/zh-cn';
import moment from "moment";
import 'antd/dist/antd.variable.min.css';
import './index.less';
import ReactDOM from "react-dom";
import {FileAddOutlined, FileSearchOutlined, SettingOutlined} from "@ant-design/icons";
import File from "./pages/file/file";
import CreateFile from "./pages/file/createFile";
import Setting from "./pages/setting";

moment.locale('zh-cn');

const {TabPane} = Tabs;

const commonStyle = {
    padding: 0,
}

export const Context = createContext(null);

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
    // const [theme, setTheme] = useState(null);

    //项目初始化
    useEffect(() => {
        Promise.all([window.electronAPI.readSettingFile(), window.electronAPI.readNotebookFileList(curDir)]).then(res => {
            setSetting(res[0]);
            setCwjsonList(res[1]);

            // const theme = {};
            // if (themeSource === 'dark') {
            //     theme.backgroundColor = '#1f1f1f';
            //     theme.primaryColor = 'white';
            // } else {
            //     theme.backgroundColor = 'white';
            //     theme.primaryColor = '#25b864';
            // }
            // setTheme(theme);
            //
            // ConfigProvider.config({
            //     theme: {
            //         primaryColor: theme.primaryColor,
            //     },
            // });

            setTimeout(() => {
                setLoad(false);
            }, 500);
        })
    }, [curDir, load]);

    //切换tab事件
    const tabClick = (activeKey) => {
        setActiveKey(activeKey);
    }

    return (
        <>
            <Context.Provider value={{setLoad, setActiveKey, setting, curDir, setCurDir}}>
                {load && <Spin style={{marginLeft: '50%', marginTop: '50%'}}/>}
                {!load && (
                    <Tabs activeKey={activeKey} tabPosition={'left'} className={'slider'}
                          destroyInactiveTabPane={true} onTabClick={tabClick}>
                        <TabPane key={'1'} tab={<span><FileAddOutlined/>创建文章</span>} style={commonStyle}>
                            <CreateFile/>
                        </TabPane>
                        <TabPane key={'2'} tab={<span><FileSearchOutlined/>文章列表</span>} style={commonStyle}>
                            <File cwjsonList={cwjsonList}/>
                        </TabPane>
                        <TabPane key={'100'} tab={<span><SettingOutlined/>设置</span>} style={commonStyle}>
                            <Setting/>
                        </TabPane>
                    </Tabs>
                )}
            </Context.Provider>
        </>
    );
};

ReactDOM.render(<App/>, document.getElementById('root'));
