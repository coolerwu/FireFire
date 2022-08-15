import React, {useEffect, useState} from 'react';
import {ConfigProvider, Spin, Tabs} from "antd";
import 'antd/dist/antd.min.css';
import 'moment/locale/zh-cn';
import moment from "moment";
import 'antd/dist/antd.variable.min.css';
import './index.less';
import ReactDOM from "react-dom";
import File from "./pages/file";
import {FileSearchOutlined} from "@ant-design/icons";

moment.locale('zh-cn');

ConfigProvider.config({
    theme: {
        primaryColor: '#25b864',
    },
})

const {TabPane} = Tabs;

const App = () => {
    //key
    let key = moment.now();
    //加载loading
    const [load, setLoad] = useState(true);
    //当前激活的key
    const [activeKey, setActiveKey] = useState('1');
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
    }, [key]);

    const tabClickFunc = (activeKey) => {
        setActiveKey(activeKey);
    }

    return (
        <>
            {load && <Spin style={{marginLeft: '50%', marginTop: '50%'}}/>}
            {!load && (
                <Tabs activeKey={activeKey} tabPosition={'left'} className={'slider'}
                      destroyInactiveTabPane={true} onTabClick={tabClickFunc}>
                    <TabPane key={'1'} tab={<span><FileSearchOutlined/>文件列表</span>}>
                        <File cwjsonList={cwjsonList}/>
                    </TabPane>
                </Tabs>
            )}
        </>
    );
};

ReactDOM.render(<App/>, document.getElementById('root'));
