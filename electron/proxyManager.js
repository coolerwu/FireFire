/**
 * 代理管理模块
 * 支持 HTTP/HTTPS/SOCKS5 代理
 * 使用 Electron net 模块自动应用 session 代理设置
 */
const { ipcMain, session, net } = require('electron');

let proxyConfig = {
    enabled: false,
    type: 'http',  // 'http', 'https', 'socks5'
    host: '',
    port: '',
    username: '',
    password: '',
};

/**
 * 获取代理配置
 */
const getProxyConfig = () => proxyConfig;

/**
 * 设置代理配置
 */
const setProxyConfig = (config) => {
    proxyConfig = { ...proxyConfig, ...config };
    applyProxyToSession();
};

/**
 * 获取代理 URL
 */
const getProxyUrl = () => {
    if (!proxyConfig.enabled || !proxyConfig.host || !proxyConfig.port) {
        return null;
    }

    const auth = proxyConfig.username && proxyConfig.password
        ? `${encodeURIComponent(proxyConfig.username)}:${encodeURIComponent(proxyConfig.password)}@`
        : '';

    const protocol = proxyConfig.type === 'socks5' ? 'socks5' : 'http';
    return `${protocol}://${auth}${proxyConfig.host}:${proxyConfig.port}`;
};

/**
 * 应用代理到 Electron session（用于自动更新和 net 模块请求）
 */
const applyProxyToSession = async () => {
    try {
        if (proxyConfig.enabled && proxyConfig.host && proxyConfig.port) {
            const proxyRules = `${proxyConfig.type}://${proxyConfig.host}:${proxyConfig.port}`;
            await session.defaultSession.setProxy({
                proxyRules,
                proxyBypassRules: '<local>'
            });
            console.log('[ProxyManager] 代理已启用:', proxyRules);
        } else {
            await session.defaultSession.setProxy({ proxyRules: '' });
            console.log('[ProxyManager] 代理已禁用');
        }
    } catch (error) {
        console.error('[ProxyManager] 设置代理失败:', error);
    }
};

/**
 * 使用 Electron net 模块发送请求（自动使用 session 代理）
 */
const fetchWithProxy = (url, options = {}) => {
    return new Promise((resolve, reject) => {
        const request = net.request({
            method: options.method || 'GET',
            url: url,
        });

        // 设置请求头
        if (options.headers) {
            for (const [key, value] of Object.entries(options.headers)) {
                request.setHeader(key, value);
            }
        }

        // 设置超时
        const timeout = options.timeout || 30000;
        const timeoutId = setTimeout(() => {
            request.abort();
            reject(new Error('Request timeout'));
        }, timeout);

        let responseData = '';

        request.on('response', (response) => {
            response.on('data', (chunk) => {
                responseData += chunk.toString();
            });

            response.on('end', () => {
                clearTimeout(timeoutId);
                resolve({
                    ok: response.statusCode >= 200 && response.statusCode < 300,
                    status: response.statusCode,
                    statusText: response.statusMessage,
                    headers: response.headers,
                    text: async () => responseData,
                    json: async () => JSON.parse(responseData),
                });
            });

            response.on('error', (error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });

        request.on('error', (error) => {
            clearTimeout(timeoutId);
            reject(error);
        });

        // 写入请求体
        if (options.body) {
            request.write(options.body);
        }

        request.end();
    });
};

/**
 * 调用 AI API（支持流式响应）
 */
const callAIAPI = async (config, messages, stream = false) => {
    const { provider, apiKey, model, baseUrl } = config;

    let url, headers, body;

    if (provider === 'claude') {
        // Claude API
        const actualBaseUrl = baseUrl || 'https://api.anthropic.com/v1';
        url = `${actualBaseUrl}/messages`;

        const systemMessage = messages.find(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');

        headers = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        };

        body = JSON.stringify({
            model,
            max_tokens: 2000,
            system: systemMessage?.content || '',
            messages: userMessages.map(m => ({
                role: m.role,
                content: m.content,
            })),
            stream,
        });
    } else {
        // OpenAI 兼容 API
        const actualBaseUrl = baseUrl || 'https://api.openai.com/v1';
        url = `${actualBaseUrl}/chat/completions`;

        headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        };

        body = JSON.stringify({
            model,
            messages,
            stream,
            max_tokens: 2000,
        });
    }

    const response = await fetchWithProxy(url, {
        method: 'POST',
        headers,
        body,
        timeout: 60000,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    if (provider === 'claude') {
        return data.content[0].text;
    } else {
        return data.choices[0].message.content;
    }
};

/**
 * 测试代理连接
 */
const testProxyConnection = async (testConfig) => {
    const originalConfig = { ...proxyConfig };

    try {
        // 临时应用测试配置
        proxyConfig = { ...proxyConfig, ...testConfig };

        // 尝试连接 httpbin.org 测试
        const response = await fetchWithProxy('https://httpbin.org/ip', {
            method: 'GET',
            timeout: 10000,
        });

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                message: '代理连接成功',
                ip: data.origin
            };
        } else {
            return {
                success: false,
                message: `连接失败: HTTP ${response.status}`
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `连接失败: ${error.message}`
        };
    } finally {
        // 恢复原配置
        proxyConfig = originalConfig;
    }
};

/**
 * 初始化 IPC 处理器
 */
const init = () => {
    // 获取代理配置
    ipcMain.handle('get-proxy-config', () => {
        return proxyConfig;
    });

    // 设置代理配置
    ipcMain.handle('set-proxy-config', (event, config) => {
        setProxyConfig(config);
        return { success: true };
    });

    // 测试代理连接
    ipcMain.handle('test-proxy-connection', async (event, testConfig) => {
        return await testProxyConnection(testConfig);
    });

    // 调用 AI API（通过主进程）
    ipcMain.handle('call-ai-api', async (event, config, messages) => {
        try {
            const result = await callAIAPI(config, messages);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    console.log('[ProxyManager] 代理管理器已初始化');
};

/**
 * 从设置加载代理配置
 */
const loadFromSettings = (settings) => {
    if (settings?.proxy) {
        setProxyConfig(settings.proxy);
    }
};

module.exports = {
    init,
    getProxyConfig,
    setProxyConfig,
    getProxyUrl,
    loadFromSettings,
    fetchWithProxy,
    callAIAPI,
    testProxyConnection,
};
