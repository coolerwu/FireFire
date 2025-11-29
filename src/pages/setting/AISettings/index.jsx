/**
 * AI 设置页面
 *
 * 整合所有 AI 设置区块
 */
import React, { useContext, useState, useEffect } from 'react';
import { Switch, message } from 'antd';
import { Context } from '../../../index';
import { SettingSection, SettingRow } from '../BaseSettings/common';
import { getDefaultBaseUrl, OPENAI_MODELS, CLAUDE_MODELS, DEEPSEEK_MODELS } from './constants';
import ProviderConfig from './ProviderConfig';
import ConnectionTest from './ConnectionTest';
import UsageGuide from './UsageGuide';

const AISetting = () => {
  const { updateValueByKeyFunc, setting } = useContext(Context);

  const [aiEnabled, setAiEnabled] = useState(setting?.ai?.enabled ?? false);
  const [provider, setProvider] = useState(setting?.ai?.provider || 'openai');
  const [apiKey, setApiKey] = useState(setting?.ai?.apiKey || '');
  const [model, setModel] = useState(setting?.ai?.model || 'gpt-4o-mini');
  const [customModel, setCustomModel] = useState(setting?.ai?.customModel || '');
  const [baseUrl, setBaseUrl] = useState(setting?.ai?.baseUrl || '');
  const [hasChanges, setHasChanges] = useState(false);

  // 从设置中加载初始值，并同步到 localStorage
  useEffect(() => {
    if (setting?.ai) {
      setAiEnabled(setting.ai.enabled ?? false);
      setProvider(setting.ai.provider || 'openai');
      setApiKey(setting.ai.apiKey || '');
      setModel(setting.ai.model || 'gpt-4o-mini');
      setCustomModel(setting.ai.customModel || '');
      setBaseUrl(setting.ai.baseUrl || '');
      setHasChanges(false);

      // 同步到 localStorage（确保 aiService.js 能读取到配置）
      try {
        const stored = localStorage.getItem('firefire-settings');
        const localSettings = stored ? JSON.parse(stored) : {};
        localSettings.ai = setting.ai;
        localStorage.setItem('firefire-settings', JSON.stringify(localSettings));
      } catch (e) {
        console.error('Failed to sync AI config to localStorage:', e);
      }
    }
  }, [setting]);

  // 保存配置
  const saveConfig = () => {
    const aiConfig = {
      enabled: aiEnabled,
      provider,
      apiKey,
      model,
      customModel,
      baseUrl: baseUrl || getDefaultBaseUrl(provider),
    };

    // 同时保存到 localStorage（供 aiService.js 使用）
    try {
      const stored = localStorage.getItem('firefire-settings');
      const localSettings = stored ? JSON.parse(stored) : {};
      localSettings.ai = aiConfig;
      localStorage.setItem('firefire-settings', JSON.stringify(localSettings));
    } catch (e) {
      console.error('Failed to save AI config to localStorage:', e);
    }

    // 保存到配置文件
    updateValueByKeyFunc('ai', aiConfig);
    setHasChanges(false);
    message.success('AI 配置已保存');
  };

  const handleProviderChange = (value) => {
    setProvider(value);
    setHasChanges(true);
  };

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    setHasChanges(true);
  };

  const handleModelChange = (value) => {
    setModel(value);
    setHasChanges(true);
  };

  const handleCustomModelChange = (e) => {
    setCustomModel(e.target.value);
    setHasChanges(true);
  };

  const handleBaseUrlChange = (e) => {
    setBaseUrl(e.target.value);
    setHasChanges(true);
  };

  const handleEnabledChange = (checked) => {
    setAiEnabled(checked);
    setHasChanges(true);
  };

  return (
    <div className="space-y-8">
      {/* AI 助手开关 */}
      <SettingSection title="AI 助手">
        <SettingRow label="启用 AI 助手" description="在编辑器中使用 AI 辅助写作功能">
          <Switch checked={aiEnabled} onChange={handleEnabledChange} className="bg-notion-text-tertiary" />
        </SettingRow>
      </SettingSection>

      {aiEnabled && (
        <>
          {/* API 配置 */}
          <ProviderConfig
            provider={provider}
            apiKey={apiKey}
            model={model}
            customModel={customModel}
            baseUrl={baseUrl}
            onProviderChange={handleProviderChange}
            onApiKeyChange={handleApiKeyChange}
            onModelChange={handleModelChange}
            onCustomModelChange={handleCustomModelChange}
            onBaseUrlChange={handleBaseUrlChange}
          />

          {/* 测试和保存按钮 */}
          <ConnectionTest
            provider={provider}
            apiKey={apiKey}
            model={model}
            customModel={customModel}
            baseUrl={baseUrl}
            hasChanges={hasChanges}
            onSave={saveConfig}
          />

          {/* 使用说明 */}
          <UsageGuide />
        </>
      )}
    </div>
  );
};

export default AISetting;

// 导出子组件
export { ProviderConfig, ConnectionTest, UsageGuide };
export * from './constants';
