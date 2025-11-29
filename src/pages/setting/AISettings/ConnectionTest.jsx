/**
 * AI 连接测试和保存按钮
 */
import React, { useState } from 'react';
import { message } from 'antd';
import { RobotOutlined, CheckCircleOutlined, CloseCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { getDefaultBaseUrl } from './constants';

const ConnectionTest = ({
  provider,
  apiKey,
  model,
  customModel,
  baseUrl,
  hasChanges,
  onSave,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const getActualModel = () => {
    return model === 'custom' ? customModel : model;
  };

  const testConnection = async () => {
    if (!apiKey) {
      message.warning('请先输入 API Key');
      return;
    }

    const actualModel = getActualModel();
    if (!actualModel) {
      message.warning('请选择或输入模型名称');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const actualBaseUrl = baseUrl || getDefaultBaseUrl(provider);
      let response;

      if (provider === 'claude') {
        response = await fetch(`${actualBaseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: actualModel,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        });
      } else {
        response = await fetch(`${actualBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: actualModel,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        });
      }

      if (response.ok) {
        setTestResult('success');
        message.success('连接成功！AI 服务可用');
      } else {
        const error = await response.json();
        setTestResult('error');
        message.error(`连接失败: ${error.error?.message || '未知错误'}`);
      }
    } catch (err) {
      setTestResult('error');
      message.error(`连接失败: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  const buttonBaseClass = `
    flex-1 py-2.5 px-4 rounded-md
    text-sm font-medium
    flex items-center justify-center gap-2
    transition-colors duration-fast
  `;

  return (
    <div className="pt-4 flex gap-3">
      <button
        onClick={testConnection}
        disabled={testing || !apiKey}
        className={`
          ${buttonBaseClass}
          ${
            testing || !apiKey
              ? 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
              : 'bg-notion-bg-secondary dark:bg-notion-dark-bg-secondary text-notion-text-primary dark:text-notion-dark-text-primary hover:bg-notion-bg-tertiary dark:hover:bg-notion-dark-bg-tertiary border border-notion-border dark:border-notion-dark-border'
          }
        `}
      >
        <RobotOutlined className={testing ? 'animate-pulse' : ''} />
        {testing ? '测试中...' : '测试连接'}
        {testResult === 'success' && <CheckCircleOutlined className="text-green-500" />}
        {testResult === 'error' && <CloseCircleOutlined className="text-red-500" />}
      </button>
      <button
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className={`
          ${buttonBaseClass}
          ${
            !hasChanges || saving
              ? 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
              : 'bg-notion-accent-blue text-white hover:opacity-90'
          }
        `}
      >
        <SaveOutlined />
        {saving ? '保存中...' : hasChanges ? '保存配置' : '已保存'}
      </button>
    </div>
  );
};

export default ConnectionTest;
