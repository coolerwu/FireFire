import React, {useContext, useState} from "react";
import {Menu, message} from "antd";
// import './index.less';
import {Context} from "../../index";
import {AppstoreOutlined} from "@ant-design/icons";
import BaseSetting from "./base.jsx";
import {electronAPI} from "../../utils/electronAPI";

const menuItemList = [
    {
        label: '基本设置',
        key: 'base',
        icon: <AppstoreOutlined/>,
    },
    // {
    //     label: (
    //         <a href="https://ant.design" target="_blank" rel="noopener noreferrer">
    //             Navigation Four - Link
    //         </a>
    //     ),
    //     key: 'alipay',
    // },
];

const Setting = () => {
    //上下文
    const {refresh, setting} = useContext(Context);

    //持久化setting配置
    const updateValueByKeyFunc = (key, value) => {
        if (!key || !value) {
            message.error('配置的参数有误');
            return;
        }
        setting[key] = value;
        electronAPI.writeSettingFile(setting).then(() => {
            refresh();
        }).catch(() => {
            message.error('配置更新失败');
        });
    };

    //菜单活跃指针
    const [menuSelectedKey, setMenuSelectedKey] = useState('base');

    return (
        <Context.Provider value={{updateValueByKeyFunc, setting}}>
            <Menu mode="horizontal" onClick={e => setMenuSelectedKey(e.key)} selectedKeys={[menuSelectedKey]}
                  items={menuItemList}/>
            {menuSelectedKey === 'base' && <BaseSetting/>}
        </Context.Provider>
    );
};

export default Setting;