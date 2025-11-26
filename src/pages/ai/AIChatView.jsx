import React, { useState, useEffect, useRef, useContext } from 'react';
import { Input, Select, message, Spin } from 'antd';
import {
    SendOutlined,
    RobotOutlined,
    UserOutlined,
    DeleteOutlined,
    SettingOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { Context } from '../../index';
import { electronAPI } from '../../utils/electronAPI';
import { getAIConfig, isAIEnabled } from '../../utils/aiService';

const { TextArea } = Input;

// 消息组件
const ChatMessage = ({ message, isUser }) => (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`
            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
            ${isUser
                ? 'bg-notion-accent-blue text-white'
                : 'bg-notion-accent-green text-white'
            }
        `}>
            {isUser ? <UserOutlined /> : <RobotOutlined />}
        </div>
        <div className={`
            max-w-[80%] px-4 py-2.5 rounded-lg
            ${isUser
                ? 'bg-notion-accent-blue text-white'
                : 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-primary dark:text-notion-dark-text-primary'
            }
        `}>
            <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
        </div>
    </div>
);

// 投喂天数选项
const FEED_DAYS_OPTIONS = [
    { value: 0, label: '不投喂文章' },
    { value: 1, label: '最近 1 天' },
    { value: 3, label: '最近 3 天' },
    { value: 7, label: '最近 7 天' },
    { value: 14, label: '最近 14 天' },
    { value: 30, label: '最近 30 天' },
];

const AIChatView = () => {
    const { setting, setActiveKey } = useContext(Context);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [feedDays, setFeedDays] = useState(7);
    const [feedContext, setFeedContext] = useState('');
    const [loadingContext, setLoadingContext] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // 在组件加载时同步配置到 localStorage
    useEffect(() => {
        if (setting?.ai) {
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

    // 滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 加载最近文章作为上下文
    const loadRecentNotes = async (days) => {
        if (days === 0) {
            setFeedContext('');
            return;
        }

        setLoadingContext(true);
        try {
            // 获取最近的笔记
            const notes = await electronAPI.getRecentNotes(100, 0);

            // 筛选指定天数内的笔记
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const recentNotes = notes.filter(note => {
                const noteDate = new Date(note.updatedAt);
                return noteDate >= cutoffDate;
            });

            // 读取笔记内容
            let contextText = '';
            for (const note of recentNotes.slice(0, 20)) { // 最多读取 20 篇
                try {
                    // note.path 是完整路径，需要提取相对路径
                    // readNotebookFile 只需要相对路径（不含 notebookPath 前缀）
                    const relativePath = note.path.includes('/')
                        ? note.path.split('/').pop().replace(/\.(md|cwjson)$/, '')
                        : note.id;
                    const content = await electronAPI.readNotebookFile(relativePath);
                    if (content) {
                        // 解析 JSON 内容获取纯文本
                        let text = '';
                        try {
                            const doc = JSON.parse(content);
                            text = extractTextFromDoc(doc);
                        } catch {
                            text = content;
                        }

                        if (text.trim()) {
                            const title = note.title || note.id;
                            contextText += `\n\n--- ${title} ---\n${text.slice(0, 2000)}`; // 每篇限制 2000 字
                        }
                    }
                } catch (err) {
                    console.error('读取笔记失败:', note.path, err);
                }
            }

            setFeedContext(contextText);
            if (contextText) {
                message.success(`已加载 ${recentNotes.length} 篇笔记作为上下文`);
            } else {
                message.info('没有找到最近的笔记');
            }
        } catch (err) {
            console.error('加载笔记失败:', err);
            message.error('加载笔记失败');
        } finally {
            setLoadingContext(false);
        }
    };

    // 从 Tiptap 文档中提取纯文本
    const extractTextFromDoc = (doc) => {
        if (!doc || !doc.content) return '';

        const extractText = (node) => {
            if (!node) return '';
            if (node.text) return node.text;
            if (node.content) {
                return node.content.map(extractText).join('\n');
            }
            return '';
        };

        return extractText(doc);
    };

    // 处理投喂天数变化
    const handleFeedDaysChange = (days) => {
        setFeedDays(days);
        loadRecentNotes(days);
    };

    // 发送消息
    const handleSend = async () => {
        if (!inputValue.trim() || loading) return;

        const config = getAIConfig();
        if (!config?.enabled || !config?.apiKey) {
            message.warning('请先在设置中配置 AI');
            return;
        }

        const userMessage = { role: 'user', content: inputValue.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setLoading(true);

        try {
            // 构建系统提示词
            let systemPrompt = '你是一个智能助手，帮助用户整理和分析笔记内容，回答问题。请用中文回复。';

            if (feedContext) {
                systemPrompt += `\n\n以下是用户最近的笔记内容，你可以参考这些内容来回答问题：\n${feedContext}`;
            }

            // 构建消息历史
            const historyMessages = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content,
            }));

            const allMessages = [
                { role: 'system', content: systemPrompt },
                ...historyMessages,
                { role: 'user', content: userMessage.content },
            ];

            // 调用 API
            const baseUrl = config.baseUrl || (config.provider === 'claude'
                ? 'https://api.anthropic.com/v1'
                : 'https://api.openai.com/v1');

            let response;
            if (config.provider === 'claude') {
                response = await fetch(`${baseUrl}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': config.apiKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true',
                    },
                    body: JSON.stringify({
                        model: config.model,
                        max_tokens: 4096,
                        system: systemPrompt,
                        messages: [...historyMessages, { role: 'user', content: userMessage.content }],
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || '请求失败');
                }

                const data = await response.json();
                const assistantMessage = {
                    role: 'assistant',
                    content: data.content[0].text,
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                // OpenAI 兼容 API
                response = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: config.model,
                        max_tokens: 4096,
                        messages: allMessages,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || '请求失败');
                }

                const data = await response.json();
                const assistantMessage = {
                    role: 'assistant',
                    content: data.choices[0].message.content,
                };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (err) {
            message.error(`发送失败: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 清空对话
    const handleClear = () => {
        setMessages([]);
    };

    // 处理按键
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // 检查 AI 是否配置
    const aiConfigured = setting?.ai?.enabled && setting?.ai?.apiKey;

    if (!aiConfigured) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
                <RobotOutlined className="text-6xl text-notion-text-tertiary dark:text-notion-dark-text-tertiary mb-4" />
                <h2 className="text-xl font-semibold text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                    AI 助手未配置
                </h2>
                <p className="text-notion-text-secondary dark:text-notion-dark-text-secondary text-center mb-6">
                    请先在设置中配置 AI 服务的 API Key
                </p>
                <button
                    onClick={() => setActiveKey('setting')}
                    className="
                        flex items-center gap-2 px-4 py-2 rounded-md
                        bg-notion-accent-blue text-white
                        hover:opacity-90 transition-opacity
                    "
                >
                    <SettingOutlined />
                    前往设置
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
            {/* 顶部栏 */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-notion-border dark:border-notion-dark-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <RobotOutlined className="text-2xl text-notion-accent-green" />
                        <div>
                            <h1 className="text-lg font-semibold text-notion-text-primary dark:text-notion-dark-text-primary">
                                AI 对话
                            </h1>
                            <p className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                                {feedContext ? '已加载笔记上下文' : '未加载笔记'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* 投喂天数选择 */}
                        <div className="flex items-center gap-2">
                            <FileTextOutlined className="text-notion-text-tertiary" />
                            <Select
                                value={feedDays}
                                onChange={handleFeedDaysChange}
                                options={FEED_DAYS_OPTIONS}
                                className="w-36"
                                size="small"
                                loading={loadingContext}
                            />
                        </div>
                        {/* 清空按钮 */}
                        <button
                            onClick={handleClear}
                            disabled={messages.length === 0}
                            className={`
                                p-2 rounded-md transition-colors
                                ${messages.length === 0
                                    ? 'text-notion-text-tertiary cursor-not-allowed'
                                    : 'text-notion-text-secondary hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover hover:text-red-500'
                                }
                            `}
                            title="清空对话"
                        >
                            <DeleteOutlined />
                        </button>
                    </div>
                </div>
            </div>

            {/* 消息区域 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <RobotOutlined className="text-5xl text-notion-text-tertiary dark:text-notion-dark-text-tertiary mb-4" />
                        <p className="text-notion-text-secondary dark:text-notion-dark-text-secondary mb-2">
                            开始与 AI 对话
                        </p>
                        <p className="text-sm text-notion-text-tertiary dark:text-notion-dark-text-tertiary max-w-md">
                            你可以选择投喂最近的笔记，让 AI 了解你的内容，然后提问或讨论
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {messages.map((msg, index) => (
                            <ChatMessage
                                key={index}
                                message={msg}
                                isUser={msg.role === 'user'}
                            />
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-notion-accent-green text-white flex items-center justify-center">
                                    <RobotOutlined />
                                </div>
                                <div className="px-4 py-2.5 rounded-lg bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary">
                                    <Spin size="small" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* 输入区域 */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-notion-border dark:border-notion-dark-border">
                <div className="max-w-3xl mx-auto">
                    <div className="flex gap-3">
                        <TextArea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入消息... (Shift+Enter 换行)"
                            autoSize={{ minRows: 1, maxRows: 5 }}
                            className="flex-1"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || loading}
                            className={`
                                px-4 py-2 rounded-md flex items-center gap-2
                                transition-colors
                                ${!inputValue.trim() || loading
                                    ? 'bg-notion-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
                                    : 'bg-notion-accent-blue text-white hover:opacity-90'
                                }
                            `}
                        >
                            <SendOutlined />
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                        {feedContext
                            ? `已加载笔记上下文 (${Math.round(feedContext.length / 1000)}k 字符)`
                            : '未投喂文章，AI 不了解你的笔记内容'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AIChatView;
