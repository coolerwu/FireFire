/**
 * AI 服务提供商配置
 */
import React, { useState } from 'react';
import { Input, Select } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { SettingSection } from '../BaseSettings/common';
import {
  AI_PROVIDERS,
  getModelsForProvider,
  getDefaultBaseUrl,
  getApiKeyHelp,
  getApiKeyPlaceholder,
} from './constants';

const ProviderConfig = ({
  provider,
  apiKey,
  model,
  customModel,
  baseUrl,
  onProviderChange,
  onApiKeyChange,
  onModelChange,
  onCustomModelChange,
  onBaseUrlChange,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);

  const handleProviderChange = (value) => {
    onProviderChange(value);
    // 切换提供商时重置 Base URL
    const providerInfo = AI_PROVIDERS.find((p) => p.value === value);
    if (providerInfo) {
      onBaseUrlChange({ target: { value: value === 'custom' ? '' : providerInfo.baseUrl } });
    }
    // 切换到默认模型
    const models = getModelsForProvider(value);
    onModelChange(models[0].value);
  };

  return (
    <SettingSection title="API 配置">
      {/* 服务提供商 */}
      <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
        <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
          服务提供商
        </div>
        <Select value={provider} onChange={handleProviderChange} className="w-full" options={AI_PROVIDERS} />
      </div>

      {/* API Key */}
      <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
        <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
          API Key
        </div>
        <div className="relative">
          <Input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={onApiKeyChange}
            placeholder={getApiKeyPlaceholder(provider)}
            className="pr-10"
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-notion-text-tertiary hover:text-notion-text-primary"
          >
            {showApiKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          </button>
        </div>
        <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
          {getApiKeyHelp(provider)}
        </div>
      </div>

      {/* 模型选择 */}
      <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
        <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
          模型
        </div>
        <Select value={model} onChange={onModelChange} className="w-full" options={getModelsForProvider(provider)} />
      </div>

      {/* 自定义模型名称 */}
      {model === 'custom' && (
        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
          <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
            自定义模型名称
          </div>
          <Input
            value={customModel}
            onChange={onCustomModelChange}
            placeholder="例如: gpt-4o-2024-11-20, claude-3-5-sonnet-latest"
          />
          <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
            输入完整的模型 ID，可从 API 文档中获取
          </div>
        </div>
      )}

      {/* Base URL（仅自定义或 OpenAI） */}
      {(provider === 'custom' || provider === 'openai') && (
        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
          <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
            API Base URL
          </div>
          <Input
            value={baseUrl}
            onChange={onBaseUrlChange}
            placeholder={getDefaultBaseUrl(provider) || 'https://api.example.com/v1'}
          />
          <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
            留空使用默认地址，或输入代理/自定义服务地址
          </div>
        </div>
      )}
    </SettingSection>
  );
};

export default ProviderConfig;
