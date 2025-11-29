/**
 * WebDAV 同步设置
 */
import React, { useState } from 'react';
import { Select, message, Progress } from 'antd';
import { CloudUploadOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { SettingSection, SettingRow } from '../BaseSettings/common';
import { electronAPI } from '../../../utils/electronAPI';
import { SYNC_MODES, formatLastSyncTime } from './constants';

const SyncSettings = ({
  syncMode,
  lastSyncTime,
  serverUrl,
  username,
  password,
  remotePath,
  onSyncModeChange,
  onSyncComplete,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const startSync = async (direction) => {
    if (!serverUrl || !username || !password) {
      message.warning('请先配置 WebDAV 连接信息');
      return;
    }

    setSyncing(true);
    setSyncProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setSyncProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      if (electronAPI.webdavSync) {
        const result = await electronAPI.webdavSync({
          direction,
          serverUrl,
          username,
          password,
          remotePath,
        });

        if (result.success) {
          const now = new Date().toISOString();
          onSyncComplete(now);
          message.success(`${direction === 'upload' ? '上传' : '下载'}同步完成！`);
        } else {
          message.error(`同步失败: ${result.error}`);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const now = new Date().toISOString();
        onSyncComplete(now);
        message.success(`${direction === 'upload' ? '上传' : '下载'}同步完成！（模拟）`);
      }

      clearInterval(progressInterval);
      setSyncProgress(100);
    } catch (err) {
      message.error(`同步失败: ${err.message}`);
    } finally {
      setTimeout(() => {
        setSyncing(false);
        setSyncProgress(0);
      }, 500);
    }
  };

  const isDisabled = !serverUrl || !username || !password;

  const buttonBaseClass = `
    flex-1 py-2.5 px-4 rounded-md
    text-sm font-medium
    flex items-center justify-center gap-2
    transition-colors duration-fast
  `;

  return (
    <SettingSection title="同步设置">
      {/* 同步模式 */}
      <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
        <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
          同步模式
        </div>
        <Select value={syncMode} onChange={onSyncModeChange} className="w-full" options={SYNC_MODES} />
      </div>

      {/* 上次同步时间 */}
      <SettingRow label="上次同步时间" description={formatLastSyncTime(lastSyncTime)}>
        {syncing && <span className="text-xs text-notion-accent-blue">同步中...</span>}
      </SettingRow>

      {/* 同步进度 */}
      {syncing && (
        <div className="py-3">
          <Progress percent={syncProgress} size="small" />
        </div>
      )}

      {/* 同步按钮 */}
      <div className="pt-4 flex gap-3">
        <button
          onClick={() => startSync('upload')}
          disabled={syncing || isDisabled}
          className={`
            ${buttonBaseClass}
            ${
              syncing || isDisabled
                ? 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
                : 'bg-notion-accent-green text-white hover:opacity-90'
            }
          `}
        >
          <CloudUploadOutlined />
          上传到云端
        </button>
        <button
          onClick={() => startSync('download')}
          disabled={syncing || isDisabled}
          className={`
            ${buttonBaseClass}
            ${
              syncing || isDisabled
                ? 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
                : 'bg-notion-accent-orange text-white hover:opacity-90'
            }
          `}
        >
          <CloudDownloadOutlined />
          从云端下载
        </button>
      </div>
    </SettingSection>
  );
};

export default SyncSettings;
