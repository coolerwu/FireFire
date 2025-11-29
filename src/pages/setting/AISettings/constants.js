/**
 * AI 设置常量
 */

export const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
  { value: 'claude', label: 'Claude (Anthropic)', baseUrl: 'https://api.anthropic.com/v1' },
  { value: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
  { value: 'custom', label: '自定义 (OpenAI 兼容)', baseUrl: '' },
];

export const OPENAI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'custom', label: '自定义模型...' },
];

export const CLAUDE_MODELS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  { value: 'custom', label: '自定义模型...' },
];

export const DEEPSEEK_MODELS = [
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
  { value: 'custom', label: '自定义模型...' },
];

/**
 * 根据提供商获取模型列表
 */
export const getModelsForProvider = (provider) => {
  switch (provider) {
    case 'openai':
      return OPENAI_MODELS;
    case 'claude':
      return CLAUDE_MODELS;
    case 'deepseek':
      return DEEPSEEK_MODELS;
    case 'custom':
      return [
        ...OPENAI_MODELS.filter((m) => m.value !== 'custom'),
        ...CLAUDE_MODELS.filter((m) => m.value !== 'custom'),
        ...DEEPSEEK_MODELS.filter((m) => m.value !== 'custom'),
        { value: 'custom', label: '自定义模型...' },
      ];
    default:
      return OPENAI_MODELS;
  }
};

/**
 * 获取提供商的默认 Base URL
 */
export const getDefaultBaseUrl = (provider) => {
  const providerInfo = AI_PROVIDERS.find((p) => p.value === provider);
  return providerInfo?.baseUrl || '';
};

/**
 * 获取 API Key 帮助文本
 */
export const getApiKeyHelp = (provider) => {
  switch (provider) {
    case 'openai':
      return '获取 API Key: https://platform.openai.com/api-keys';
    case 'claude':
      return '获取 API Key: https://console.anthropic.com/settings/keys';
    case 'deepseek':
      return '获取 API Key: https://platform.deepseek.com/api_keys';
    default:
      return '请输入你的 API Key';
  }
};

/**
 * 获取 API Key placeholder
 */
export const getApiKeyPlaceholder = (provider) => {
  return provider === 'claude' ? 'sk-ant-...' : 'sk-...';
};
