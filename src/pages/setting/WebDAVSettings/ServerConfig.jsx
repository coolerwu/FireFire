/**
 * WebDAV 服务器配置
 */
import React, { useState } from 'react';
import { Input, Select, message } from 'antd';
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { SettingSection } from '../BaseSettings/common';
import { WEBDAV_PRESETS, getPresetUrl } from './constants';

const ServerConfig = ({
  preset,
  serverUrl,
  username,
  password,
  remotePath,
  onPresetChange,
  onInputChange,
  onInputBlur,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handlePresetChange = (value) => {
    onPresetChange(value);
    const url = getPresetUrl(value);
    if (url) {
      onInputChange('serverUrl', url);
    }
    setTestResult(null);
  };

  const testConnection = async () => {
    if (!serverUrl || !username || !password) {
      message.warning('请填写完整的 WebDAV 配置');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(serverUrl, {
        method: 'PROPFIND',
        headers: {
          Authorization: 'Basic ' + btoa(`${username}:${password}`),
          Depth: '0',
          'Content-Type': 'application/xml',
        },
      });

      if (response.ok || response.status === 207) {
        setTestResult('success');
        message.success('连接成功！WebDAV 服务可用');
      } else if (response.status === 401) {
        setTestResult('error');
        message.error('认证失败，请检查用户名和密码');
      } else {
        setTestResult('error');
        message.error(`连接失败: HTTP ${response.status}`);
      }
    } catch (err) {
      setTestResult('error');
      if (err.message.includes('CORS') || err.message.includes('NetworkError')) {
        message.warning('浏览器模式下无法直接测试 WebDAV，请在 Electron 应用中测试');
      } else {
        message.error(`连接失败: ${err.message}`);
      }
    } finally {
      setTesting(false);
    }
  };

  const isJianguoyun = preset === 'jianguoyun';

  return (
    <SettingSection title="服务器配置">
      {/* 服务商 */}
      <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
        <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
          服务商
        </div>
        <Select value={preset} onChange={handlePresetChange} className="w-full" options={WEBDAV_PRESETS} />
      </div>

      {/* 服务器地址 */}
      <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
        <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
          服务器地址
        </div>
        <Input
          value={serverUrl}
          onChange={(e) => onInputChange('serverUrl', e.target.value)}
          onBlur={(e) => onInputBlur('serverUrl', e.target.value)}
          placeholder="https://dav.example.com/dav/"
        />
        {isJianguoyun && (
          <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
            坚果云 WebDAV 地址，末尾需要加上你的目录名
          </div>
        )}
      </div>

      {/* 用户名 */}
      <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
        <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
          用户名
        </div>
        <Input
          value={username}
          onChange={(e) => onInputChange('username', e.target.value)}
          onBlur={(e) => onInputBlur('username', e.target.value)}
          placeholder="your@email.com"
        />
        {isJianguoyun && (
          <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">坚果云账号邮箱</div>
        )}
      </div>

      {/* 密码 */}
      <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
        <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
          密码 / 应用密码
        </div>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onInputChange('password', e.target.value)}
            onBlur={(e) => onInputBlur('password', e.target.value)}
            placeholder="应用专用密码"
            className="pr-10"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-notion-text-tertiary hover:text-notion-text-primary"
          >
            {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          </button>
        </div>
        {isJianguoyun && (
          <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
            在坚果云「账户信息」→「安全选项」→「第三方应用管理」中创建应用密码
          </div>
        )}
      </div>

      {/* 远程路径 */}
      <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
        <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
          远程路径
        </div>
        <Input
          value={remotePath}
          onChange={(e) => onInputChange('remotePath', e.target.value)}
          onBlur={(e) => onInputBlur('remotePath', e.target.value)}
          placeholder="/firefire/"
        />
        <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
          笔记在服务器上的存储路径
        </div>
      </div>

      {/* 测试连接按钮 */}
      <div className="pt-4">
        <button
          onClick={testConnection}
          disabled={testing || !serverUrl || !username || !password}
          className={`
            w-full py-2.5 px-4 rounded-md
            text-sm font-medium
            flex items-center justify-center gap-2
            transition-colors duration-fast
            ${
              testing || !serverUrl || !username || !password
                ? 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
                : 'bg-notion-accent-blue text-white hover:opacity-90'
            }
          `}
        >
          <SyncOutlined className={testing ? 'animate-spin' : ''} />
          {testing ? '测试中...' : '测试连接'}
          {testResult === 'success' && <CheckCircleOutlined className="text-green-400" />}
          {testResult === 'error' && <CloseCircleOutlined className="text-red-400" />}
        </button>
      </div>
    </SettingSection>
  );
};

export default ServerConfig;
