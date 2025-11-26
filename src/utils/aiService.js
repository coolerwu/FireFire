/**
 * AI 服务模块
 * 支持 OpenAI、Claude、DeepSeek 等 AI 服务
 */

// AI 操作类型
export const AI_ACTIONS = {
    POLISH: 'polish',      // 润色
    TRANSLATE: 'translate', // 翻译
    CONTINUE: 'continue',   // 续写
    SUMMARIZE: 'summarize', // 总结
    EXPLAIN: 'explain',     // 解释
    CUSTOM: 'custom',       // 自定义
};

// AI 操作提示词
const ACTION_PROMPTS = {
    [AI_ACTIONS.POLISH]: {
        system: '你是一个专业的文字润色助手。请润色用户提供的文本，使其更加通顺、优美、专业，但保持原意不变。直接输出润色后的文本，不要添加任何解释。',
        userPrefix: '请润色以下文本：\n\n',
    },
    [AI_ACTIONS.TRANSLATE]: {
        system: '你是一个专业的翻译助手。如果输入是中文，翻译成英文；如果输入是英文或其他语言，翻译成中文。直接输出翻译结果，不要添加任何解释。',
        userPrefix: '请翻译以下文本：\n\n',
    },
    [AI_ACTIONS.CONTINUE]: {
        system: '你是一个创意写作助手。请根据用户提供的文本，自然地续写内容。保持原文的风格和语气，续写约100-200字。直接输出续写的内容，不要添加任何解释。',
        userPrefix: '请续写以下文本：\n\n',
    },
    [AI_ACTIONS.SUMMARIZE]: {
        system: '你是一个专业的文本摘要助手。请为用户提供的文本生成简洁的摘要，突出关键信息。直接输出摘要内容，不要添加任何解释。',
        userPrefix: '请总结以下文本：\n\n',
    },
    [AI_ACTIONS.EXPLAIN]: {
        system: '你是一个知识渊博的解释助手。请用简单易懂的语言解释用户提供的内容，可以举例说明。',
        userPrefix: '请解释以下内容：\n\n',
    },
};

/**
 * 获取 AI 配置
 */
export const getAIConfig = () => {
    try {
        const stored = localStorage.getItem('firefire-settings');
        if (stored) {
            const settings = JSON.parse(stored);
            if (settings.ai) {
                // 处理自定义模型
                const config = { ...settings.ai };
                if (config.model === 'custom' && config.customModel) {
                    config.model = config.customModel;
                }
                return config;
            }
            return null;
        }
    } catch (e) {
        console.error('Failed to get AI config:', e);
    }
    return null;
};

/**
 * 检查 AI 是否已配置并启用
 */
export const isAIEnabled = () => {
    const config = getAIConfig();
    return config?.enabled && config?.apiKey;
};

/**
 * 调用 OpenAI 兼容 API
 */
const callOpenAIAPI = async (config, messages, onStream) => {
    const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
            model: config.model,
            messages,
            stream: !!onStream,
            max_tokens: 2000,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    if (onStream) {
        return handleStreamResponse(response, onStream);
    } else {
        const data = await response.json();
        return data.choices[0].message.content;
    }
};

/**
 * 调用 Claude API
 */
const callClaudeAPI = async (config, messages, onStream) => {
    const baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';

    // Convert OpenAI format to Claude format
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model: config.model,
            max_tokens: 2000,
            system: systemMessage?.content || '',
            messages: userMessages.map(m => ({
                role: m.role,
                content: m.content,
            })),
            stream: !!onStream,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    if (onStream) {
        return handleClaudeStreamResponse(response, onStream);
    } else {
        const data = await response.json();
        return data.content[0].text;
    }
};

/**
 * 处理 OpenAI 流式响应
 */
const handleStreamResponse = async (response, onStream) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content || '';
                    if (content) {
                        fullContent += content;
                        onStream(content, fullContent);
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }
    }

    return fullContent;
};

/**
 * 处理 Claude 流式响应
 */
const handleClaudeStreamResponse = async (response, onStream) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));
                    if (data.type === 'content_block_delta' && data.delta?.text) {
                        const content = data.delta.text;
                        fullContent += content;
                        onStream(content, fullContent);
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }
    }

    return fullContent;
};

/**
 * 执行 AI 操作
 * @param {string} action - AI 操作类型
 * @param {string} text - 输入文本
 * @param {object} options - 选项
 * @param {function} options.onStream - 流式输出回调 (chunk, fullText) => void
 * @param {string} options.customPrompt - 自定义提示词（仅 CUSTOM 操作）
 * @returns {Promise<string>} AI 响应文本
 */
export const executeAI = async (action, text, options = {}) => {
    const config = getAIConfig();

    if (!config?.enabled || !config?.apiKey) {
        throw new Error('AI 功能未启用或未配置 API Key');
    }

    const { onStream, customPrompt } = options;

    // 构建消息
    let systemPrompt, userPrefix;
    if (action === AI_ACTIONS.CUSTOM && customPrompt) {
        systemPrompt = customPrompt;
        userPrefix = '';
    } else {
        const actionConfig = ACTION_PROMPTS[action];
        if (!actionConfig) {
            throw new Error(`未知的 AI 操作: ${action}`);
        }
        systemPrompt = actionConfig.system;
        userPrefix = actionConfig.userPrefix;
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrefix + text },
    ];

    // 根据 provider 调用不同 API
    if (config.provider === 'claude') {
        return callClaudeAPI(config, messages, onStream);
    } else {
        return callOpenAIAPI(config, messages, onStream);
    }
};

/**
 * 获取 AI 操作的显示名称
 */
export const getActionDisplayName = (action) => {
    const names = {
        [AI_ACTIONS.POLISH]: '润色',
        [AI_ACTIONS.TRANSLATE]: '翻译',
        [AI_ACTIONS.CONTINUE]: '续写',
        [AI_ACTIONS.SUMMARIZE]: '总结',
        [AI_ACTIONS.EXPLAIN]: '解释',
        [AI_ACTIONS.CUSTOM]: '自定义',
    };
    return names[action] || action;
};

/**
 * 获取所有可用的 AI 操作
 */
export const getAvailableActions = () => {
    return [
        { key: AI_ACTIONS.POLISH, name: '润色', icon: 'EditOutlined', description: '改善文字表达' },
        { key: AI_ACTIONS.TRANSLATE, name: '翻译', icon: 'TranslationOutlined', description: '中英文互译' },
        { key: AI_ACTIONS.CONTINUE, name: '续写', icon: 'FormOutlined', description: '继续生成内容' },
        { key: AI_ACTIONS.SUMMARIZE, name: '总结', icon: 'FileTextOutlined', description: '生成摘要' },
        { key: AI_ACTIONS.EXPLAIN, name: '解释', icon: 'QuestionCircleOutlined', description: '解释选中内容' },
    ];
};
