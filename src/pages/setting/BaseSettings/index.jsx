/**
 * 基础设置页面
 *
 * 整合所有基础设置区块
 */
import React from 'react';
import AppearanceSection from './AppearanceSection';
import UpdateSection from './UpdateSection';
import DatabaseSection from './DatabaseSection';
import ImportExportSection from './ImportExportSection';

const BaseSetting = () => {
  return (
    <div className="space-y-8">
      <AppearanceSection />
      <UpdateSection />
      <DatabaseSection />
      <ImportExportSection />
    </div>
  );
};

export default BaseSetting;

// 导出子组件供外部使用
export { AppearanceSection, UpdateSection, DatabaseSection, ImportExportSection };
export { SettingSection, SettingRow, ThemeButton } from './common';
