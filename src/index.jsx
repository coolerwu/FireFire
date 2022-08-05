import React, {useEffect, useState} from 'react';
import {ConfigProvider, Spin, Tabs} from "antd";
import 'antd/dist/antd.min.css';
import 'moment/locale/zh-cn';
import moment from "moment";
import 'antd/dist/antd.variable.min.css';
import './index.less';
import MdList from "./pages/mdList";
import TagList from "./pages/tagList/tagList";
import Setting from "./pages/setting/setting";
import ReactDOM from "react-dom";
import {setFileList, SUCCESS} from "./common/global";

moment.locale('zh-cn');

ConfigProvider.config({
    theme: {
        primaryColor: '#25b864',
    },
})

const {TabPane} = Tabs;

const menuTabList = ['新建', '列表', '标签', '设置']

const App = () => {
    const [load, setLoad] = useState(true);
    const [needLoad, setNeedLoad] = useState(true);
    const [activeKey, setActiveKey] = useState('列表');
    const [chooseFile, setChooseFile] = useState(null);

    useEffect(() => {
        window.electronAPI.opFile(1).then(res => {
            if (res && res instanceof Array) {
                setFileList(res);
            }
            setLoad(false);
        })
    }, [needLoad]);

    const jumpFunc = (file) => {
    }

    const needLoadFunc = (filename) => {
        setChooseFile(filename);
        setLoad(true);
        setNeedLoad(!needLoad);
        setActiveKey('列表');
    }

    const tabClickFunc = key => {
        if (key === '新建') {
            const now = moment.now();
            const file = {
                name: `新建文件${now}`,
                value: `新建文件${now}.json`,
            };
            setLoad(true);
            window.electronAPI.opFile(6, file.value).then(res => {
                if (SUCCESS === res) {
                    needLoadFunc(file.name);
                }
            })
            return
        }

        setActiveKey(key);
    }

    return (
        <>
            {load && <Spin/>}
            {!load && <Tabs activeKey={activeKey} tabPosition={'left'} className={'slider'}
                            destroyInactiveTabPane={true} onTabClick={tabClickFunc}>
                {menuTabList.map(i => {
                    switch (i) {
                        case '新建':
                            return (
                                <TabPane tab={`${i}`} key={i}>
                                </TabPane>
                            );
                        case '列表':
                        default:
                            return (
                                <TabPane tab={`${i}`} key={i}>
                                    <MdList jumpFunc={jumpFunc} needLoad={needLoadFunc} chooseFile={chooseFile}/>
                                </TabPane>
                            );
                        case '标签':
                            return (
                                <TabPane tab={`${i}`} key={i}>
                                    <TagList jumpFunc={jumpFunc}/>
                                </TabPane>
                            );
                        case '设置':
                            return (
                                <TabPane tab={`${i}`} key={i}>
                                    <Setting jumpFunc={jumpFunc}/>
                                </TabPane>
                            );
                    }
                })}
            </Tabs>}
        </>
    );
};

ReactDOM.render(<App/>, document.getElementById('root'));
