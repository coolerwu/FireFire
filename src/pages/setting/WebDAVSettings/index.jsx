/**
 * WebDAV 设置页面
 *
 * 整合所有 WebDAV 设置区块
 */
import React, { useContext, useState, useEffect } from 'react';
import { Switch } from 'antd';
import { Context } from '../../../index';
import { SettingSection, SettingRow } from '../BaseSettings/common';
import { getPresetUrl } from './constants';
import ServerConfig from './ServerConfig';
import SyncSettings from './SyncSettings';
import WebDAVNotes from './WebDAVNotes';

const WebDAVSetting = () => {
  const { updateValueByKeyFunc, setting } = useContext(Context);

  const [enabled, setEnabled] = useState(setting?.webdav?.enabled ?? false);
  const [preset, setPreset] = useState(setting?.webdav?.preset || 'custom');
  const [serverUrl, setServerUrl] = useState(setting?.webdav?.serverUrl || '');
  const [username, setUsername] = useState(setting?.webdav?.username || '');
  const [password, setPassword] = useState(setting?.webdav?.password || '');
  const [remotePath, setRemotePath] = useState(setting?.webdav?.remotePath || '/firefire/');
  const [syncMode, setSyncMode] = useState(setting?.webdav?.syncMode || 'manual');
  const [lastSyncTime, setLastSyncTime] = useState(setting?.webdav?.lastSyncTime || null);

  // 从设置中加载初始值
  useEffect(() => {
    if (setting?.webdav) {
      setEnabled(setting.webdav.enabled ?? false);
      setPreset(setting.webdav.preset || 'custom');
      setServerUrl(setting.webdav.serverUrl || '');
      setUsername(setting.webdav.username || '');
      setPassword(setting.webdav.password || '');
      setRemotePath(setting.webdav.remotePath || '/firefire/');
      setSyncMode(setting.webdav.syncMode || 'manual');
      setLastSyncTime(setting.webdav.lastSyncTime || null);
    }
  }, [setting]);

  // 保存配置
  const saveWebDAVConfig = (updates) => {
    const webdavConfig = {
      enabled,
      preset,
      serverUrl,
      username,
      password,
      remotePath,
      syncMode,
      lastSyncTime,
      ...updates,
    };
    updateValueByKeyFunc('webdav', webdavConfig);
  };

  const handleEnabledChange = (checked) => {
    setEnabled(checked);
    saveWebDAVConfig({ enabled: checked });
  };

  const handlePresetChange = (value) => {
    setPreset(value);
    const url = getPresetUrl(value);
    if (url) {
      setServerUrl(url);
      saveWebDAVConfig({ preset: value, serverUrl: url });
    } else {
      saveWebDAVConfig({ preset: value });
    }
  };

  const handleInputChange = (field, value) => {
    switch (field) {
      case 'serverUrl':
        setServerUrl(value);
        break;
      case 'username':
        setUsername(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'remotePath':
        setRemotePath(value);
        break;
      default:
        break;
    }
  };

  const handleInputBlur = (field, value) => {
    saveWebDAVConfig({ [field]: value });
  };

  const handleSyncModeChange = (value) => {
    setSyncMode(value);
    saveWebDAVConfig({ syncMode: value });
  };

  const handleSyncComplete = (syncTime) => {
    setLastSyncTime(syncTime);
    saveWebDAVConfig({ lastSyncTime: syncTime });
  };

  return (
    <div className="space-y-8">
      {/* WebDAV 开关 */}
      <SettingSection title="WebDAV 同步">
        <SettingRow label="启用 WebDAV 同步" description="将笔记同步到 WebDAV 服务器">
          <Switch checked={enabled} onChange={handleEnabledChange} className="bg-notion-text-tertiary" />
        </SettingRow>
      </SettingSection>

      {enabled && (
        <>
          {/* 服务器配置 */}
          <ServerConfig
            preset={preset}
            serverUrl={serverUrl}
            username={username}
            password={password}
            remotePath={remotePath}
            onPresetChange={handlePresetChange}
            onInputChange={handleInputChange}
            onInputBlur={handleInputBlur}
          />

          {/* 同步设置 */}
          <SyncSettings
            syncMode={syncMode}
            lastSyncTime={lastSyncTime}
            serverUrl={serverUrl}
            username={username}
            password={password}
            remotePath={remotePath}
            onSyncModeChange={handleSyncModeChange}
            onSyncComplete={handleSyncComplete}
          />

          {/* 使用说明 */}
          <WebDAVNotes />
        </>
      )}
    </div>
  );
};

export default WebDAVSetting;

// 导出子组件
export { ServerConfig, SyncSettings, WebDAVNotes };
export * from './constants';
