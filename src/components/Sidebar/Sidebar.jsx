import React from 'react';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    FolderOutlined,
    SettingOutlined,
    PlusOutlined,
    SearchOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined
} from '@ant-design/icons';
import { Tooltip } from 'antd';

const NavItem = ({ icon, label, isActive, onClick, collapsed }) => {
    const content = (
        <div
            onClick={onClick}
            className={`
                flex items-center gap-3 px-3 py-2 mx-2 rounded-md cursor-pointer
                transition-all duration-fast
                ${isActive
                    ? 'bg-notion-bg-selected text-notion-text-primary font-medium'
                    : 'text-notion-text-secondary hover:bg-notion-bg-hover hover:text-notion-text-primary'
                }
                dark:${isActive
                    ? 'bg-notion-dark-bg-selected text-notion-dark-text-primary'
                    : 'text-notion-dark-text-secondary hover:bg-notion-dark-bg-hover hover:text-notion-dark-text-primary'
                }
            `}
        >
            <span className="text-lg flex-shrink-0">{icon}</span>
            {!collapsed && <span className="text-sm truncate">{label}</span>}
        </div>
    );

    if (collapsed) {
        return (
            <Tooltip title={label} placement="right">
                {content}
            </Tooltip>
        );
    }

    return content;
};

const Sidebar = ({ activeKey, onNavigate, collapsed, onToggleCollapse }) => {
    const navItems = [
        { key: 'journal', label: '日记', icon: <CalendarOutlined /> },
        { key: 'timeline', label: '时间线', icon: <ClockCircleOutlined /> },
        { key: 'folder', label: '所有笔记', icon: <FolderOutlined /> },
    ];

    return (
        <div
            className={`
                h-screen flex flex-col
                bg-notion-bg-secondary border-r border-notion-border
                dark:bg-notion-dark-bg-secondary dark:border-notion-dark-border
                transition-all duration-slow
                ${collapsed ? 'w-16' : 'w-60'}
            `}
        >
            {/* 顶部区域：工作空间 */}
            <div className="flex-shrink-0 px-3 pt-3 pb-2">
                <div
                    className={`
                        flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer
                        hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                        transition-colors duration-fast
                    `}
                >
                    {/* Logo/Icon */}
                    <div className="w-6 h-6 rounded bg-notion-accent-green flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">F</span>
                    </div>
                    {!collapsed && (
                        <span className="text-sm font-semibold text-notion-text-primary dark:text-notion-dark-text-primary truncate">
                            FireFire
                        </span>
                    )}
                </div>
            </div>

            {/* 快速操作 */}
            {!collapsed && (
                <div className="flex-shrink-0 px-3 pb-2">
                    <div
                        className="
                            flex items-center gap-2 px-3 py-1.5 rounded-md
                            bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary
                            text-notion-text-tertiary dark:text-notion-dark-text-tertiary
                            text-sm cursor-pointer
                            hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                            transition-colors duration-fast
                        "
                    >
                        <SearchOutlined className="text-xs" />
                        <span>搜索</span>
                        <span className="ml-auto text-xs opacity-60">⌘K</span>
                    </div>
                </div>
            )}

            {/* 导航菜单 */}
            <nav className="flex-shrink-0 py-2">
                {navItems.map(item => (
                    <NavItem
                        key={item.key}
                        icon={item.icon}
                        label={item.label}
                        isActive={activeKey === item.key}
                        onClick={() => onNavigate(item.key)}
                        collapsed={collapsed}
                    />
                ))}
            </nav>

            {/* 分隔线 */}
            <div className="mx-4 my-2 h-px bg-notion-border dark:bg-notion-dark-border" />

            {/* 新建按钮 */}
            {!collapsed && (
                <div className="flex-shrink-0 px-3 pb-2">
                    <div
                        className="
                            flex items-center gap-2 px-3 py-1.5 rounded-md
                            text-notion-text-secondary dark:text-notion-dark-text-secondary
                            text-sm cursor-pointer
                            hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                            transition-colors duration-fast
                        "
                    >
                        <PlusOutlined className="text-xs" />
                        <span>新建笔记</span>
                    </div>
                </div>
            )}

            {/* 弹性空间 */}
            <div className="flex-1" />

            {/* 底部：设置 */}
            <div className="flex-shrink-0 py-2 border-t border-notion-border dark:border-notion-dark-border">
                <NavItem
                    icon={<SettingOutlined />}
                    label="设置"
                    isActive={activeKey === 'setting'}
                    onClick={() => onNavigate('setting')}
                    collapsed={collapsed}
                />
            </div>

            {/* 折叠按钮 */}
            <div className="flex-shrink-0 px-3 pb-3">
                <div
                    onClick={onToggleCollapse}
                    className="
                        flex items-center justify-center p-2 rounded-md cursor-pointer
                        text-notion-text-tertiary dark:text-notion-dark-text-tertiary
                        hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                        hover:text-notion-text-primary dark:hover:text-notion-dark-text-primary
                        transition-colors duration-fast
                    "
                >
                    {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
