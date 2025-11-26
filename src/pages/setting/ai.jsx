import React, {useContext, useState, useEffect} from "react";
import {Input, Select, message, Switch} from "antd";
import {Context} from "../../index";
import {EyeInvisibleOutlined, EyeOutlined, RobotOutlined, CheckCircleOutlined, CloseCircleOutlined, SaveOutlined} from "@ant-design/icons";

const SettingSection = ({ title, children }) => (
    <div className="mb-8">
        <h3 className="text-sm font-semibold text-notion-text-secondary dark:text-notion-dark-text-secondary uppercase tracking-wide mb-4">
            {title}
        </h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const SettingRow = ({ label, description, children }) => (
    <div className="flex items-start justify-between py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50 last:border-0">
        <div className="flex-1 mr-4">
            <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary">
                {label}
            </div>
            {description && (
                <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-0.5">
                    {description}
                </div>
            )}
        </div>
        <div className="flex-shrink-0">
            {children}
        </div>
    </div>
);

const AI_PROVIDERS = [
    { value: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
    { value: 'claude', label: 'Claude (Anthropic)', baseUrl: 'https://api.anthropic.com/v1' },
    { value: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
    { value: 'custom', label: '自定义 (OpenAI 兼容)', baseUrl: '' },
];

const OPENAI_MODELS = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'custom', label: '自定义模型...' },
];

const CLAUDE_MODELS = [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'custom', label: '自定义模型...' },
];

const DEEPSEEK_MODELS = [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
    { value: 'custom', label: '自定义模型...' },
];

const AISetting = () => {
    const {updateValueByKeyFunc, setting} = useContext(Context);

    const [aiEnabled, setAiEnabled] = useState(setting?.ai?.enabled ?? false);
    const [provider, setProvider] = useState(setting?.ai?.provider || 'openai');
    const [apiKey, setApiKey] = useState(setting?.ai?.apiKey || '');
    const [model, setModel] = useState(setting?.ai?.model || 'gpt-4o-mini');
    const [customModel, setCustomModel] = useState(setting?.ai?.customModel || '');
    const [baseUrl, setBaseUrl] = useState(setting?.ai?.baseUrl || '');
    const [showApiKey, setShowApiKey] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);

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

    // 获取实际使用的模型名称
    const getActualModel = () => {
        return model === 'custom' ? customModel : model;
    };

    const getModelsForProvider = () => {
        switch (provider) {
            case 'openai':
                return OPENAI_MODELS;
            case 'claude':
                return CLAUDE_MODELS;
            case 'deepseek':
                return DEEPSEEK_MODELS;
            case 'custom':
                const allModels = [
                    ...OPENAI_MODELS.filter(m => m.value !== 'custom'),
                    ...CLAUDE_MODELS.filter(m => m.value !== 'custom'),
                    ...DEEPSEEK_MODELS.filter(m => m.value !== 'custom'),
                    { value: 'custom', label: '自定义模型...' },
                ];
                return allModels;
            default:
                return OPENAI_MODELS;
        }
    };

    const getDefaultBaseUrl = () => {
        const providerInfo = AI_PROVIDERS.find(p => p.value === provider);
        return providerInfo?.baseUrl || '';
    };

    // 保存配置
    const saveConfig = () => {
        setSaving(true);
        const aiConfig = {
            enabled: aiEnabled,
            provider,
            apiKey,
            model,
            customModel,
            baseUrl: baseUrl || getDefaultBaseUrl(),
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
        setSaving(false);
        message.success('AI 配置已保存');
    };

    const handleProviderChange = (value) => {
        setProvider(value);
        const providerInfo = AI_PROVIDERS.find(p => p.value === value);
        if (providerInfo) {
            setBaseUrl(value === 'custom' ? '' : providerInfo.baseUrl);
        }
        const models = value === 'openai' ? OPENAI_MODELS
            : value === 'claude' ? CLAUDE_MODELS
            : value === 'deepseek' ? DEEPSEEK_MODELS
            : OPENAI_MODELS;
        setModel(models[0].value);
        setTestResult(null);
        setHasChanges(true);
    };

    const handleApiKeyChange = (e) => {
        setApiKey(e.target.value);
        setTestResult(null);
        setHasChanges(true);
    };

    const handleModelChange = (value) => {
        setModel(value);
        setHasChanges(true);
    };

    const handleCustomModelChange = (e) => {
        setCustomModel(e.target.value);
        setTestResult(null);
        setHasChanges(true);
    };

    const handleBaseUrlChange = (e) => {
        setBaseUrl(e.target.value);
        setTestResult(null);
        setHasChanges(true);
    };

    const handleEnabledChange = (checked) => {
        setAiEnabled(checked);
        setHasChanges(true);
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
            const actualBaseUrl = baseUrl || getDefaultBaseUrl();
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
                        'Authorization': `Bearer ${apiKey}`,
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

    return (
        <div className="space-y-8">
            {/* AI 助手开关 */}
            <SettingSection title="AI 助手">
                <SettingRow
                    label="启用 AI 助手"
                    description="在编辑器中使用 AI 辅助写作功能"
                >
                    <Switch
                        checked={aiEnabled}
                        onChange={handleEnabledChange}
                        className="bg-notion-text-tertiary"
                    />
                </SettingRow>
            </SettingSection>

            {aiEnabled && (
                <>
                    {/* API 配置 */}
                    <SettingSection title="API 配置">
                        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                            <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                服务提供商
                            </div>
                            <Select
                                value={provider}
                                onChange={handleProviderChange}
                                className="w-full"
                                options={AI_PROVIDERS}
                            />
                        </div>

                        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                            <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                API Key
                            </div>
                            <div className="relative">
                                <Input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={handleApiKeyChange}
                                    placeholder={provider === 'claude' ? 'sk-ant-...' : 'sk-...'}
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
                                {provider === 'openai' && '获取 API Key: https://platform.openai.com/api-keys'}
                                {provider === 'claude' && '获取 API Key: https://console.anthropic.com/settings/keys'}
                                {provider === 'deepseek' && '获取 API Key: https://platform.deepseek.com/api_keys'}
                                {provider === 'custom' && '请输入你的 API Key'}
                            </div>
                        </div>

                        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                            <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                模型
                            </div>
                            <Select
                                value={model}
                                onChange={handleModelChange}
                                className="w-full"
                                options={getModelsForProvider()}
                            />
                        </div>

                        {model === 'custom' && (
                            <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                                <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                    自定义模型名称
                                </div>
                                <Input
                                    value={customModel}
                                    onChange={handleCustomModelChange}
                                    placeholder="例如: gpt-4o-2024-11-20, claude-3-5-sonnet-latest"
                                />
                                <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
                                    输入完整的模型 ID，可从 API 文档中获取
                                </div>
                            </div>
                        )}

                        {(provider === 'custom' || provider === 'openai') && (
                            <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                                <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                    API Base URL
                                </div>
                                <Input
                                    value={baseUrl}
                                    onChange={handleBaseUrlChange}
                                    placeholder={getDefaultBaseUrl() || 'https://api.example.com/v1'}
                                />
                                <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
                                    留空使用默认地址，或输入代理/自定义服务地址
                                </div>
                            </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={testConnection}
                                disabled={testing || !apiKey}
                                className={`
                                    flex-1 py-2.5 px-4 rounded-md
                                    text-sm font-medium
                                    flex items-center justify-center gap-2
                                    transition-colors duration-fast
                                    ${testing || !apiKey
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
                                onClick={saveConfig}
                                disabled={!hasChanges || saving}
                                className={`
                                    flex-1 py-2.5 px-4 rounded-md
                                    text-sm font-medium
                                    flex items-center justify-center gap-2
                                    transition-colors duration-fast
                                    ${!hasChanges || saving
                                        ? 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
                                        : 'bg-notion-accent-blue text-white hover:opacity-90'
                                    }
                                `}
                            >
                                <SaveOutlined />
                                {saving ? '保存中...' : hasChanges ? '保存配置' : '已保存'}
                            </button>
                        </div>
                    </SettingSection>

                    {/* 使用说明 */}
                    <SettingSection title="使用说明">
                        <div className="py-3 text-sm text-notion-text-secondary dark:text-notion-dark-text-secondary space-y-2">
                            <p>在编辑器中选中文本后，可以使用以下 AI 功能：</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li><strong>润色</strong> - 改善文字表达</li>
                                <li><strong>翻译</strong> - 中英文互译</li>
                                <li><strong>续写</strong> - 继续生成内容</li>
                                <li><strong>总结</strong> - 生成摘要</li>
                                <li><strong>解释</strong> - 解释选中内容</li>
                            </ul>
                            <p className="mt-3 text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                                提示：点击侧边栏的「AI 对话」可以与 AI 聊天，还能让 AI 了解你最近的笔记内容
                            </p>
                        </div>
                    </SettingSection>
                </>
            )}
        </div>
    );
};

export default AISetting;
