/**
 * 数据导入导出区块
 */
import React, { useState } from 'react';
import { message } from 'antd';
import { ImportOutlined, ExportOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { electronAPI } from '@/utils/electronAPI';
import { SettingSection, SettingRow } from './common';

const ImportExportSection = () => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // 导入 Markdown 文件
  const handleImportMarkdown = async () => {
    setImporting(true);
    try {
      const result = await electronAPI.importMarkdown({ multiple: true });
      if (result.canceled) {
        // 用户取消
      } else if (result.success) {
        message.success(`成功导入 ${result.imported.length} 个文件`);
      } else {
        message.error(`导入失败: ${result.error}`);
      }
    } catch (err) {
      message.error(`导入失败: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // 导入文件夹
  const handleImportFolder = async () => {
    setImporting(true);
    try {
      const result = await electronAPI.importFolder();
      if (result.canceled) {
        // 用户取消
      } else if (result.success) {
        message.success(`成功导入 ${result.total} 个文件`);
      } else {
        message.error(`导入失败: ${result.error}`);
      }
    } catch (err) {
      message.error(`导入失败: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // 导出所有笔记
  const handleExportAll = async (format) => {
    setExporting(true);
    try {
      const result = await electronAPI.exportAll(format);
      if (result.canceled) {
        // 用户取消
      } else if (result.success) {
        message.success(`成功导出 ${result.total} 个文件到 ${result.directory}`);
      } else {
        message.error(`导出失败: ${result.error}`);
      }
    } catch (err) {
      message.error(`导出失败: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const buttonClass = (disabled) => `
    px-3 py-1.5 rounded-md text-xs font-medium
    transition-colors duration-fast
    ${
      disabled
        ? 'bg-notion-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
        : 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-primary dark:text-notion-dark-text-primary hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover'
    }
  `;

  return (
    <SettingSection title="数据导入导出">
      <SettingRow label="导入 Markdown" description="从 Markdown 文件导入笔记">
        <div className="flex items-center gap-2">
          <button onClick={handleImportMarkdown} disabled={importing} className={buttonClass(importing)}>
            <span className="flex items-center gap-1">
              <ImportOutlined /> 选择文件
            </span>
          </button>
          <button onClick={handleImportFolder} disabled={importing} className={buttonClass(importing)}>
            <span className="flex items-center gap-1">
              <FolderOpenOutlined /> 选择文件夹
            </span>
          </button>
        </div>
      </SettingRow>

      <SettingRow label="导出所有笔记" description="将所有笔记导出为 Markdown 或 HTML 格式">
        <div className="flex items-center gap-2">
          <button onClick={() => handleExportAll('markdown')} disabled={exporting} className={buttonClass(exporting)}>
            <span className="flex items-center gap-1">
              <ExportOutlined /> Markdown
            </span>
          </button>
          <button onClick={() => handleExportAll('html')} disabled={exporting} className={buttonClass(exporting)}>
            <span className="flex items-center gap-1">
              <ExportOutlined /> HTML
            </span>
          </button>
        </div>
      </SettingRow>
    </SettingSection>
  );
};

export default ImportExportSection;
