import React, {useContext, useState, useEffect} from "react";
import {Input, Select, message, Switch, Progress} from "antd";
import {Context} from "../../index";
import {EyeInvisibleOutlined, EyeOutlined, CloudUploadOutlined, CloudDownloadOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined} from "@ant-design/icons";
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

const WEBDAV_PRESETS = [
    { value: 'custom', label: '自定义', url: '' },
    { value: 'jianguoyun', label: '坚果云', url: 'https://dav.jianguoyun.com/dav/' },
    { value: 'nextcloud', label: 'Nextcloud', url: '' },
    { value: 'owncloud', label: 'ownCloud', url: '' },
];

const SYNC_MODES = [
    { value: 'manual', label: '手动同步' },
    { value: 'auto', label: '自动同步（每 5 分钟）' },
    { value: 'realtime', label: '实时同步' },
];

const WebDAVSetting = () => {
    const {updateValueByKeyFunc, setting} = useContext(Context);

    const [enabled, setEnabled] = useState(setting?.webdav?.enabled ?? false);
    const [preset, setPreset] = useState(setting?.webdav?.preset || 'custom');
    const [serverUrl, setServerUrl] = useState(setting?.webdav?.serverUrl || '');
    const [username, setUsername] = useState(setting?.webdav?.username || '');
    const [password, setPassword] = useState(setting?.webdav?.password || '');
    const [remotePath, setRemotePath] = useState(setting?.webdav?.remotePath || '/firefire/');
    const [syncMode, setSyncMode] = useState(setting?.webdav?.syncMode || 'manual');
    const [showPassword, setShowPassword] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [lastSyncTime, setLastSyncTime] = useState(setting?.webdav?.lastSyncTime || null);

    useEffect(() => {
        if (setting?.webdav) {
            setEnabled(setting.webdav.enabled ?? false);
            setPreset(setting.webdav.preset || 'custom');
            setServerUrl(setting.webdav.serverUrl || '');
            setUsername(setting.webdav.username || '');
            setPassword(setting.webdav.password || '');
            setRemotePath(setting.webdav.remotePath || '/firefire/');
            setSyncMode(setting.webdav.syncMode || 'manual');
            setLastSyncTime(setting.webdav.lastSyncTime || null);
        }
    }, [setting]);

    const saveWebDAVConfig = (updates) => {
        const webdavConfig = {
            enabled,
            preset,
            serverUrl,
            username,
            password,
            remotePath,
            syncMode,
            lastSyncTime,
            ...updates,
        };
        updateValueByKeyFunc('webdav', webdavConfig);
    };

    const handlePresetChange = (value) => {
        setPreset(value);
        const presetInfo = WEBDAV_PRESETS.find(p => p.value === value);
        if (presetInfo && presetInfo.url) {
            setServerUrl(presetInfo.url);
            saveWebDAVConfig({ preset: value, serverUrl: presetInfo.url });
        } else {
            saveWebDAVConfig({ preset: value });
        }
        setTestResult(null);
    };

    const handleEnabledChange = (checked) => {
        setEnabled(checked);
        saveWebDAVConfig({ enabled: checked });
    };

    const handleInputChange = (field, value) => {
        switch (field) {
            case 'serverUrl':
                setServerUrl(value);
                break;
            case 'username':
                setUsername(value);
                break;
            case 'password':
                setPassword(value);
                break;
            case 'remotePath':
                setRemotePath(value);
                break;
        }
        setTestResult(null);
    };

    const handleInputBlur = (field, value) => {
        saveWebDAVConfig({ [field]: value });
    };

    const handleSyncModeChange = (value) => {
        setSyncMode(value);
        saveWebDAVConfig({ syncMode: value });
    };

    const testConnection = async () => {
        if (!serverUrl || !username || !password) {
            message.warning('请填写完整的 WebDAV 配置');
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            // WebDAV PROPFIND request to test connection
            const response = await fetch(serverUrl, {
                method: 'PROPFIND',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${username}:${password}`),
                    'Depth': '0',
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
            // CORS error is common for WebDAV in browser
            if (err.message.includes('CORS') || err.message.includes('NetworkError')) {
                message.warning('浏览器模式下无法直接测试 WebDAV，请在 Electron 应用中测试');
            } else {
                message.error(`连接失败: ${err.message}`);
            }
        } finally {
            setTesting(false);
        }
    };

    const startSync = async (direction) => {
        if (!serverUrl || !username || !password) {
            message.warning('请先配置 WebDAV 连接信息');
            return;
        }

        setSyncing(true);
        setSyncProgress(0);

        try {
            // Simulate sync progress
            const progressInterval = setInterval(() => {
                setSyncProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            // Call electron API for actual sync
            if (electronAPI.webdavSync) {
                const result = await electronAPI.webdavSync({
                    direction,
                    serverUrl,
                    username,
                    password,
                    remotePath,
                });

                if (result.success) {
                    const now = new Date().toISOString();
                    setLastSyncTime(now);
                    saveWebDAVConfig({ lastSyncTime: now });
                    message.success(`${direction === 'upload' ? '上传' : '下载'}同步完成！`);
                } else {
                    message.error(`同步失败: ${result.error}`);
                }
            } else {
                // Mock success for browser mode
                await new Promise(resolve => setTimeout(resolve, 2000));
                const now = new Date().toISOString();
                setLastSyncTime(now);
                saveWebDAVConfig({ lastSyncTime: now });
                message.success(`${direction === 'upload' ? '上传' : '下载'}同步完成！（模拟）`);
            }

            clearInterval(progressInterval);
            setSyncProgress(100);
        } catch (err) {
            message.error(`同步失败: ${err.message}`);
        } finally {
            setTimeout(() => {
                setSyncing(false);
                setSyncProgress(0);
            }, 500);
        }
    };

    const formatLastSyncTime = () => {
        if (!lastSyncTime) return '从未同步';
        const date = new Date(lastSyncTime);
        return date.toLocaleString('zh-CN');
    };

    return (
        <div className="space-y-8">
            {/* WebDAV 开关 */}
            <SettingSection title="WebDAV 同步">
                <SettingRow
                    label="启用 WebDAV 同步"
                    description="将笔记同步到 WebDAV 服务器"
                >
                    <Switch
                        checked={enabled}
                        onChange={handleEnabledChange}
                        className="bg-notion-text-tertiary"
                    />
                </SettingRow>
            </SettingSection>

            {enabled && (
                <>
                    {/* 服务器配置 */}
                    <SettingSection title="服务器配置">
                        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                            <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                服务商
                            </div>
                            <Select
                                value={preset}
                                onChange={handlePresetChange}
                                className="w-full"
                                options={WEBDAV_PRESETS}
                            />
                        </div>

                        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                            <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                服务器地址
                            </div>
                            <Input
                                value={serverUrl}
                                onChange={(e) => handleInputChange('serverUrl', e.target.value)}
                                onBlur={(e) => handleInputBlur('serverUrl', e.target.value)}
                                placeholder="https://dav.example.com/dav/"
                            />
                            {preset === 'jianguoyun' && (
                                <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
                                    坚果云 WebDAV 地址，末尾需要加上你的目录名
                                </div>
                            )}
                        </div>

                        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                            <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                用户名
                            </div>
                            <Input
                                value={username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                onBlur={(e) => handleInputBlur('username', e.target.value)}
                                placeholder="your@email.com"
                            />
                            {preset === 'jianguoyun' && (
                                <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
                                    坚果云账号邮箱
                                </div>
                            )}
                        </div>

                        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                            <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                密码 / 应用密码
                            </div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    onBlur={(e) => handleInputBlur('password', e.target.value)}
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
                            {preset === 'jianguoyun' && (
                                <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
                                    在坚果云「账户信息」→「安全选项」→「第三方应用管理」中创建应用密码
                                </div>
                            )}
                        </div>

                        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                            <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                远程路径
                            </div>
                            <Input
                                value={remotePath}
                                onChange={(e) => handleInputChange('remotePath', e.target.value)}
                                onBlur={(e) => handleInputBlur('remotePath', e.target.value)}
                                placeholder="/firefire/"
                            />
                            <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-1">
                                笔记在服务器上的存储路径
                            </div>
                        </div>

                        {/* 测试连接 */}
                        <div className="pt-4">
                            <button
                                onClick={testConnection}
                                disabled={testing || !serverUrl || !username || !password}
                                className={`
                                    w-full py-2.5 px-4 rounded-md
                                    text-sm font-medium
                                    flex items-center justify-center gap-2
                                    transition-colors duration-fast
                                    ${testing || !serverUrl || !username || !password
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

                    {/* 同步设置 */}
                    <SettingSection title="同步设置">
                        <div className="py-3 border-b border-notion-border/50 dark:border-notion-dark-border/50">
                            <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                                同步模式
                            </div>
                            <Select
                                value={syncMode}
                                onChange={handleSyncModeChange}
                                className="w-full"
                                options={SYNC_MODES}
                            />
                        </div>

                        <SettingRow
                            label="上次同步时间"
                            description={formatLastSyncTime()}
                        >
                            {syncing && (
                                <span className="text-xs text-notion-accent-blue">
                                    同步中...
                                </span>
                            )}
                        </SettingRow>

                        {syncing && (
                            <div className="py-3">
                                <Progress percent={syncProgress} size="small" />
                            </div>
                        )}

                        {/* 手动同步按钮 */}
                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={() => startSync('upload')}
                                disabled={syncing || !serverUrl || !username || !password}
                                className={`
                                    flex-1 py-2.5 px-4 rounded-md
                                    text-sm font-medium
                                    flex items-center justify-center gap-2
                                    transition-colors duration-fast
                                    ${syncing || !serverUrl || !username || !password
                                        ? 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
                                        : 'bg-notion-accent-green text-white hover:opacity-90'
                                    }
                                `}
                            >
                                <CloudUploadOutlined />
                                上传到云端
                            </button>
                            <button
                                onClick={() => startSync('download')}
                                disabled={syncing || !serverUrl || !username || !password}
                                className={`
                                    flex-1 py-2.5 px-4 rounded-md
                                    text-sm font-medium
                                    flex items-center justify-center gap-2
                                    transition-colors duration-fast
                                    ${syncing || !serverUrl || !username || !password
                                        ? 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
                                        : 'bg-notion-accent-orange text-white hover:opacity-90'
                                    }
                                `}
                            >
                                <CloudDownloadOutlined />
                                从云端下载
                            </button>
                        </div>
                    </SettingSection>

                    {/* 使用说明 */}
                    <SettingSection title="注意事项">
                        <div className="py-3 text-sm text-notion-text-secondary dark:text-notion-dark-text-secondary space-y-2">
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>首次同步建议先「上传到云端」备份本地数据</li>
                                <li>同步会覆盖较旧的文件，请谨慎操作</li>
                                <li>坚果云用户需要使用「应用密码」而非账号密码</li>
                                <li>建议定期手动备份重要笔记</li>
                            </ul>
                        </div>
                    </SettingSection>
                </>
            )}
        </div>
    );
};

export default WebDAVSetting;
