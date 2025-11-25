import React, {useContext, useState} from "react";
import {message} from "antd";
import {Context} from "../../index";
import {SettingOutlined, FolderOutlined} from "@ant-design/icons";
import BaseSetting from "./base.jsx";
import WorkspaceSetting from "./workspace.jsx";
import {electronAPI} from "../../utils/electronAPI";

const menuItems = [
    {
        label: '基本设置',
        key: 'base',
        icon: <SettingOutlined />,
    },
    {
        label: '工作空间',
        key: 'workspace',
        icon: <FolderOutlined />,
    },
];

const Setting = () => {
    const {refresh, setting} = useContext(Context);

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

    const [menuSelectedKey, setMenuSelectedKey] = useState('base');

    return (
        <Context.Provider value={{updateValueByKeyFunc, setting}}>
            <div className="h-full flex flex-col bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
                {/* 页面标题 */}
                <div className="flex-shrink-0 px-8 py-6 border-b border-notion-border dark:border-notion-dark-border">
                    <h1 className="text-2xl font-bold text-notion-text-primary dark:text-notion-dark-text-primary">
                        设置
                    </h1>
                </div>

                {/* 标签导航 */}
                <div className="flex-shrink-0 px-8 border-b border-notion-border dark:border-notion-dark-border">
                    <div className="flex gap-1">
                        {menuItems.map(item => (
                            <button
                                key={item.key}
                                onClick={() => setMenuSelectedKey(item.key)}
                                className={`
                                    flex items-center gap-2 px-4 py-3
                                    text-sm font-medium
                                    border-b-2 -mb-px
                                    transition-colors duration-fast
                                    ${menuSelectedKey === item.key
                                        ? 'border-notion-accent-blue text-notion-accent-blue'
                                        : 'border-transparent text-notion-text-secondary dark:text-notion-dark-text-secondary hover:text-notion-text-primary dark:hover:text-notion-dark-text-primary'
                                    }
                                `}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-2xl mx-auto px-8 py-6">
                        {menuSelectedKey === 'base' && <BaseSetting />}
                        {menuSelectedKey === 'workspace' && <WorkspaceSetting />}
                    </div>
                </div>
            </div>
        </Context.Provider>
    );
};

export default Setting;
