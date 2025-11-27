import React, {useContext, useState, useEffect} from "react";
import {Input, Select, Switch, message, InputNumber} from "antd";
import {Context} from "../../index";
import {GlobalOutlined, CheckCircleOutlined, CloseCircleOutlined, SaveOutlined, EyeInvisibleOutlined, EyeOutlined} from "@ant-design/icons";
import {electronAPI} from "../../utils/electronAPI";

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

const PROXY_TYPES = [
    { value: 'http', label: 'HTTP' },
    { value: 'https', label: 'HTTPS' },
    { value: 'socks5', label: 'SOCKS5' },
];

const ProxySetting = () => {
    const {updateValueByKeyFunc, setting} = useContext(Context);

    const [proxyEnabled, setProxyEnabled] = useState(setting?.proxy?.enabled ?? false);
    const [proxyType, setProxyType] = useState(setting?.proxy?.type || 'http');
    const [proxyHost, setProxyHost] = useState(setting?.proxy?.host || '');
    const [proxyPort, setProxyPort] = useState(setting?.proxy?.port || '');
    const [proxyUsername, setProxyUsername] = useState(setting?.proxy?.username || '');
    const [proxyPassword, setProxyPassword] = useState(setting?.proxy?.password || '');
    const [showPassword, setShowPassword] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    // 从设置中加载初始值，并同步到 localStorage
    useEffect(() => {
        if (setting?.proxy) {
            setProxyEnabled(setting.proxy.enabled ?? false);
            setProxyType(setting.proxy.type || 'http');
            setProxyHost(setting.proxy.host || '');
            setProxyPort(setting.proxy.port || '');
            setProxyUsername(setting.proxy.username || '');
            setProxyPassword(setting.proxy.password || '');
            setHasChanges(false);

            // 同步到 localStorage（确保 aiService.js 能读取到配置）
            try {
                const stored = localStorage.getItem('firefire-settings');
                const localSettings = stored ? JSON.parse(stored) : {};
                localSettings.proxy = setting.proxy;
                localStorage.setItem('firefire-settings', JSON.stringify(localSettings));
            } catch (e) {
                console.error('Failed to sync proxy config to localStorage:', e);
            }
        }
    }, [setting]);

    // 保存配置
    const saveConfig = async () => {
        setSaving(true);
        const proxyConfig = {
            enabled: proxyEnabled,
            type: proxyType,
            host: proxyHost,
            port: proxyPort,
            username: proxyUsername,
            password: proxyPassword,
        };

        try {
            // 保存到设置文件
            updateValueByKeyFunc('proxy', proxyConfig);

            // 同步到 localStorage（供 aiService.js 读取代理状态）
            try {
                const stored = localStorage.getItem('firefire-settings');
                const localSettings = stored ? JSON.parse(stored) : {};
                localSettings.proxy = proxyConfig;
                localStorage.setItem('firefire-settings', JSON.stringify(localSettings));
            } catch (e) {
                console.error('Failed to sync proxy config to localStorage:', e);
            }

            // 同时通知主进程更新代理设置
            await electronAPI.setProxyConfig(proxyConfig);

            setHasChanges(false);
            message.success('代理配置已保存');
        } catch (error) {
            message.error('保存代理配置失败: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEnabledChange = (checked) => {
        setProxyEnabled(checked);
        setHasChanges(true);
        setTestResult(null);
    };

    const handleTypeChange = (value) => {
        setProxyType(value);
        setHasChanges(true);
        setTestResult(null);
    };

    const handleHostChange = (e) => {
        setProxyHost(e.target.value);
        setHasChanges(true);
        setTestResult(null);
    };

    const handlePortChange = (value) => {
        setProxyPort(value ? String(value) : '');
        setHasChanges(true);
        setTestResult(null);
    };

    const handleUsernameChange = (e) => {
        setProxyUsername(e.target.value);
        setHasChanges(true);
        setTestResult(null);
    };

    const handlePasswordChange = (e) => {
        setProxyPassword(e.target.value);
        setHasChanges(true);
        setTestResult(null);
    };

    const testConnection = async () => {
        if (!proxyHost || !proxyPort) {
            message.warning('请先输入代理服务器地址和端口');
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const testConfig = {
                enabled: true,
                type: proxyType,
                host: proxyHost,
                port: proxyPort,
                username: proxyUsername,
                password: proxyPassword,
            };

            const result = await electronAPI.testProxyConnection(testConfig);

            if (result.success) {
                setTestResult('success');
                message.success(`代理连接成功！IP: ${result.ip}`);
            } else {
                setTestResult('error');
                message.error(result.message || '代理连接失败');
            }
        } catch (err) {
            setTestResult('error');
            message.error(`测试失败: ${err.message}`);
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* 代理开关 */}
            <SettingSection title="网络代理">
                <SettingRow
                    label="启用代理"
                    description="通过代理服务器访问网络（用于 AI 服务、自动更新等）"
                >
                    <Switch
                        checked={proxyEnabled}
                        onChange={handleEnabledChange}
                        className="bg-notion-text-tertiary"
                    />
                </SettingRow>
            </SettingSection>

            {proxyEnabled && (
                <>
                    {/* 代理配置 */}
                    <SettingSection title="代理服务器">
                        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                            <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                代理类型
                            </div>
                            <Select
                                value={proxyType}
                                onChange={handleTypeChange}
                                className="w-full"
                                options={PROXY_TYPES}
                            />
                        </div>

                        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                            <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                服务器地址
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={proxyHost}
                                    onChange={handleHostChange}
                                    placeholder="127.0.0.1 或 proxy.example.com"
                                    className="flex-1"
                                />
                                <InputNumber
                                    value={proxyPort ? parseInt(proxyPort) : null}
                                    onChange={handlePortChange}
                                    placeholder="端口"
                                    min={1}
                                    max={65535}
                                    className="w-28"
                                />
                            </div>
                            <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
                                常用端口：HTTP/HTTPS: 7890, 8080 | SOCKS5: 1080, 7891
                            </div>
                        </div>

                        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                            <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                认证信息（可选）
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={proxyUsername}
                                    onChange={handleUsernameChange}
                                    placeholder="用户名"
                                    className="flex-1"
                                />
                                <div className="relative flex-1">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={proxyPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="密码"
                                        className="pr-10"
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-notion-text-tertiary hover:text-notion-text-primary"
                                    >
                                        {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
                                如果代理服务器需要认证，请填写用户名和密码
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={testConnection}
                                disabled={testing || !proxyHost || !proxyPort}
                                className={`
                                    flex-1 py-2.5 px-4 rounded-md
                                    text-sm font-medium
                                    flex items-center justify-center gap-2
                                    transition-colors duration-fast
                                    ${testing || !proxyHost || !proxyPort
                                        ? 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
                                        : 'bg-notion-bg-secondary dark:bg-notion-dark-bg-secondary text-notion-text-primary dark:text-notion-dark-text-primary hover:bg-notion-bg-tertiary dark:hover:bg-notion-dark-bg-tertiary border border-notion-border dark:border-notion-dark-border'
                                    }
                                `}
                            >
                                <GlobalOutlined className={testing ? 'animate-pulse' : ''} />
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
                            <p>代理设置将应用于以下功能：</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li><strong>AI 服务</strong> - OpenAI、Claude、DeepSeek 等 API 调用</li>
                                <li><strong>自动更新</strong> - 检查和下载应用更新</li>
                            </ul>
                            <p className="mt-3 text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                                提示：如果你使用 Clash、V2Ray 等代理工具，通常使用 HTTP 类型，端口为 7890
                            </p>
                        </div>
                    </SettingSection>
                </>
            )}
        </div>
    );
};

export default ProxySetting;
