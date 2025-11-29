/**
 * 软件更新区块
 */
import React, { useContext, useEffect, useState } from 'react';
import { message, Modal, Switch } from 'antd';
import { CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { Context } from '../../../index';
import { electronAPI } from '@/utils/electronAPI';
import { SettingSection, SettingRow } from './common';
import DOMPurify from 'dompurify';

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
};

const UpdateSection = () => {
  const { updateValueByKeyFunc, setting } = useContext(Context);

  const [currentVersion, setCurrentVersion] = useState('');
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(setting?.autoUpdate !== false);

  useEffect(() => {
    electronAPI.getAppVersion().then(setCurrentVersion);

    const removeListener = electronAPI.onUpdateStatus((status) => {
      const { event, data } = status;

      switch (event) {
        case 'checking-for-update':
          setChecking(true);
          message.info('正在检查更新...');
          break;

        case 'update-available':
          setChecking(false);
          Modal.confirm({
            title: '发现新版本',
            icon: <CheckCircleOutlined style={{ color: '#0f7b6c' }} />,
            content: (
              <div>
                <p>当前版本: v{currentVersion}</p>
                <p>最新版本: v{data.version}</p>
                {data.releaseNotes && (
                  <div className="mt-3 max-h-48 overflow-auto text-sm">
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.releaseNotes, DOMPURIFY_CONFIG) }} />
                  </div>
                )}
              </div>
            ),
            okText: '立即更新',
            cancelText: '稍后提醒',
            onOk: () => {
              electronAPI.downloadUpdate();
              setDownloading(true);
            },
          });
          break;

        case 'update-not-available':
          setChecking(false);
          message.success('已是最新版本');
          break;

        case 'download-progress':
          setDownloadProgress(Math.round(data.percent));
          break;

        case 'update-downloaded':
          setDownloading(false);
          setDownloadProgress(0);
          Modal.confirm({
            title: '更新已下载',
            icon: <CheckCircleOutlined style={{ color: '#0f7b6c' }} />,
            content: '更新已下载完成，是否立即重启安装？',
            okText: '立即重启',
            cancelText: '稍后安装',
            onOk: () => {
              electronAPI.quitAndInstall();
            },
          });
          break;

        case 'update-error':
          setChecking(false);
          setDownloading(false);
          message.error(`更新失败: ${data.message}`);
          break;

        default:
          break;
      }
    });

    return removeListener;
  }, [currentVersion]);

  const handleCheckUpdate = () => {
    electronAPI.checkForUpdates();
  };

  const handleAutoUpdateChange = (checked) => {
    setAutoUpdateEnabled(checked);
    updateValueByKeyFunc('autoUpdate', checked);
  };

  return (
    <SettingSection title="软件更新">
      <SettingRow label="当前版本" description="FireFire 笔记应用">
        <span className="text-sm font-mono text-notion-text-primary dark:text-notion-dark-text-primary">
          v{currentVersion}
        </span>
      </SettingRow>

      <SettingRow label="自动检查更新" description="启动时自动检查新版本">
        <Switch
          checked={autoUpdateEnabled}
          onChange={handleAutoUpdateChange}
          className="bg-notion-text-tertiary"
        />
      </SettingRow>

      {downloading && (
        <div className="py-3">
          <div className="text-xs text-notion-text-secondary dark:text-notion-dark-text-secondary mb-2">
            下载进度: {downloadProgress}%
          </div>
          <div className="w-full h-2 bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-notion-accent-green transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="pt-2">
        <button
          onClick={handleCheckUpdate}
          disabled={checking || downloading}
          className={`
            w-full py-2.5 px-4 rounded-md
            text-sm font-medium
            transition-colors duration-fast
            ${
              checking || downloading
                ? 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
                : 'bg-notion-accent-blue text-white hover:opacity-90'
            }
          `}
        >
          {checking ? (
            <span className="flex items-center justify-center gap-2">
              <SyncOutlined spin /> 检查中...
            </span>
          ) : downloading ? (
            '下载中...'
          ) : (
            '检查更新'
          )}
        </button>
      </div>
    </SettingSection>
  );
};

export default UpdateSection;
