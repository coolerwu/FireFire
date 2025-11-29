/**
 * 外观设置区块
 */
import React, { useContext, useEffect, useState } from 'react';
import { SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons';
import { Context } from '../../../index';
import { SettingSection, ThemeButton } from './common';

const AppearanceSection = () => {
  const { updateValueByKeyFunc, setting } = useContext(Context);
  const [themeSource, setThemeSource] = useState('system');

  useEffect(() => {
    if (setting?.themeSource) {
      setThemeSource(setting.themeSource);
    }
  }, [setting]);

  const changeThemeSource = (value) => {
    setThemeSource(value);
    updateValueByKeyFunc('themeSource', value);
  };

  return (
    <SettingSection title="外观">
      <div className="py-3">
        <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-3">
          主题模式
        </div>
        <div className="grid grid-cols-3 gap-3">
          <ThemeButton
            value="light"
            current={themeSource}
            icon={<SunOutlined />}
            label="明亮"
            onClick={changeThemeSource}
          />
          <ThemeButton
            value="dark"
            current={themeSource}
            icon={<MoonOutlined />}
            label="暗黑"
            onClick={changeThemeSource}
          />
          <ThemeButton
            value="system"
            current={themeSource}
            icon={<DesktopOutlined />}
            label="跟随系统"
            onClick={changeThemeSource}
          />
        </div>
      </div>
    </SettingSection>
  );
};

export default AppearanceSection;
