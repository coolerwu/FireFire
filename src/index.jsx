import React, {createContext, useEffect, useState} from 'react';
import {ConfigProvider, Spin, Tabs} from "antd";
import 'antd/dist/antd.min.css';
import 'moment/locale/zh-cn';
import moment from "moment";
import 'antd/dist/antd.variable.min.css';
import './index.less';
import ReactDOM from "react-dom";
import {FileAddOutlined, FileSearchOutlined} from "@ant-design/icons";
import File from "./pages/file/file";
import CreateFile from "./pages/file/createFile";

moment.locale('zh-cn');

ConfigProvider.config({
    theme: {
        primaryColor: '#25b864',
    },
})

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

    //项目初始化
    useEffect(() => {
        window.electronAPI.readNotebookFileList().then(res => {
            setCwjsonList(res);
            setTimeout(() => {
                setLoad(false);
            }, 500);
        })
    }, [load]);

    //切换tab事件
    const tabClick = (activeKey) => {
        setActiveKey(activeKey);
    }

    return (
        <>
            <Context.Provider value={{setLoad, setActiveKey}}>
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
                    </Tabs>
                )}
            </Context.Provider>
        </>
    );
};

ReactDOM.render(<App/>, document.getElementById('root'));
