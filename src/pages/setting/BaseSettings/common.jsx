/**
 * 设置页面共享组件
 */
import React from 'react';
import { SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons';

/**
 * 设置区块容器
 */
export const SettingSection = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-sm font-semibold text-notion-text-secondary dark:text-notion-dark-text-secondary uppercase tracking-wide mb-4">
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

/**
 * 设置行
 */
export const SettingRow = ({ label, description, children }) => (
  <div className="flex items-start justify-between py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50 last:border-0">
    <div className="flex-1 mr-4">
      <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary">
        {label}
      </div>
      {description && (
        <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-0.5">
          {description}
        </div>
      )}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

/**
 * 主题按钮
 */
export const ThemeButton = ({ value, current, icon, label, onClick }) => (
  <button
    onClick={() => onClick(value)}
    className={`
      flex flex-col items-center gap-2 p-4 rounded-lg border-2
      transition-all duration-fast
      ${
        current === value
          ? 'border-notion-accent-blue bg-notion-accent-blue/5'
          : 'border-notion-border dark:border-notion-dark-border hover:border-notion-text-tertiary dark:hover:border-notion-dark-text-tertiary'
      }
    `}
  >
    <span
      className={`text-2xl ${current === value ? 'text-notion-accent-blue' : 'text-notion-text-secondary dark:text-notion-dark-text-secondary'}`}
    >
      {icon}
    </span>
    <span
      className={`text-xs font-medium ${current === value ? 'text-notion-accent-blue' : 'text-notion-text-secondary dark:text-notion-dark-text-secondary'}`}
    >
      {label}
    </span>
  </button>
);

/**
 * 主题图标映射
 */
export const ThemeIcons = {
  light: <SunOutlined />,
  dark: <MoonOutlined />,
  system: <DesktopOutlined />,
};
