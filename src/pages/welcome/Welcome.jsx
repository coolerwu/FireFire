import React, { useState } from 'react';
import { FolderOpenOutlined, RocketOutlined, BookOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { electronAPI } from '../../utils/electronAPI';
import { logger } from '../../utils/logger';

/**
 * 欢迎页面 - 首次启动时显示
 * Notion 风格的工作空间选择界面
 */
const Welcome = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedPath, setSelectedPath] = useState('');

  // 选择工作空间文件夹
  const handleSelectFolder = async () => {
    try {
      setLoading(true);
      const result = await electronAPI.changeWorkspace();

      if (result.success) {
        setSelectedPath(result.path);
        setStep(2);
      } else if (!result.canceled) {
        logger.error('选择文件夹失败:', result.error);
      }
    } catch (error) {
      logger.error('选择文件夹失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 使用默认位置
  const handleUseDefault = async () => {
    try {
      setLoading(true);
      const path = await electronAPI.getCurrentWorkspace();
      setSelectedPath(path);
      setStep(2);
    } catch (error) {
      logger.error('获取默认路径失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 完成设置
  const handleComplete = async () => {
    try {
      await electronAPI.completeFirstTimeSetup();
      onComplete?.();
    } catch (error) {
      logger.error('完成首次设置失败:', error);
      onComplete?.();
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-notion-bg-primary to-notion-bg-secondary dark:from-notion-dark-bg-primary dark:to-notion-dark-bg-secondary">
      <div className="w-full max-w-lg p-8">
        {/* Logo 和标题 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-notion-accent-green mb-4">
            <span className="text-3xl font-bold text-white">F</span>
          </div>
          <h1 className="text-3xl font-bold text-notion-text-primary dark:text-notion-dark-text-primary">
            欢迎使用 FireFire
          </h1>
          <p className="mt-2 text-notion-text-secondary dark:text-notion-dark-text-secondary">
            本地优先的知识管理笔记应用
          </p>
        </div>

        {/* 步骤 1：选择工作空间 */}
        {step === 1 && (
          <div className="space-y-6">
            {/* 功能介绍 */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-notion-accent-blue/10 flex items-center justify-center">
                  <BookOutlined className="text-notion-accent-blue" />
                </div>
                <div className="text-xs text-notion-text-secondary dark:text-notion-dark-text-secondary">
                  Markdown 编辑
                </div>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-notion-accent-orange/10 flex items-center justify-center">
                  <FolderOpenOutlined className="text-notion-accent-orange" />
                </div>
                <div className="text-xs text-notion-text-secondary dark:text-notion-dark-text-secondary">
                  本地存储
                </div>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-notion-accent-purple/10 flex items-center justify-center">
                  <RocketOutlined className="text-notion-accent-purple" />
                </div>
                <div className="text-xs text-notion-text-secondary dark:text-notion-dark-text-secondary">
                  快速笔记
                </div>
              </div>
            </div>

            {/* 选择工作空间 */}
            <div className="p-6 rounded-xl border border-notion-border dark:border-notion-dark-border bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
              <h3 className="text-sm font-semibold text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                选择工作空间
              </h3>
              <p className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mb-4">
                所有笔记和附件将保存在此文件夹中
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleSelectFolder}
                  disabled={loading}
                  className="
                    w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                    bg-notion-accent-blue text-white
                    text-sm font-medium
                    hover:opacity-90 disabled:opacity-50
                    transition-opacity duration-fast
                  "
                >
                  <FolderOpenOutlined />
                  选择文件夹
                </button>

                <button
                  onClick={handleUseDefault}
                  disabled={loading}
                  className="
                    w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                    border border-notion-border dark:border-notion-dark-border
                    text-notion-text-secondary dark:text-notion-dark-text-secondary
                    text-sm font-medium
                    hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                    disabled:opacity-50
                    transition-colors duration-fast
                  "
                >
                  使用默认位置
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 步骤 2：完成 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-notion-accent-green/30 bg-notion-accent-green/5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-notion-accent-green/20 flex items-center justify-center">
                  <CheckCircleOutlined className="text-xl text-notion-accent-green" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-notion-text-primary dark:text-notion-dark-text-primary mb-1">
                    工作空间已设置
                  </h3>
                  <p className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary break-all">
                    {selectedPath}
                  </p>
                </div>
              </div>
            </div>

            {/* 快速开始提示 */}
            <div className="p-4 rounded-lg bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary">
              <h4 className="text-xs font-semibold text-notion-text-secondary dark:text-notion-dark-text-secondary mb-3">
                快速开始
              </h4>
              <ul className="space-y-2 text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-notion-bg-selected dark:bg-notion-dark-bg-selected flex items-center justify-center text-notion-text-secondary">1</span>
                  使用「快速笔记」创建新笔记
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-notion-bg-selected dark:bg-notion-dark-bg-selected flex items-center justify-center text-notion-text-secondary">2</span>
                  输入 <code className="px-1 py-0.5 bg-notion-bg-selected dark:bg-notion-dark-bg-selected rounded">/</code> 查看所有命令
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-notion-bg-selected dark:bg-notion-dark-bg-selected flex items-center justify-center text-notion-text-secondary">3</span>
                  使用 <code className="px-1 py-0.5 bg-notion-bg-selected dark:bg-notion-dark-bg-selected rounded">[[</code> 创建内部链接
                </li>
              </ul>
            </div>

            <button
              onClick={handleComplete}
              className="
                w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                bg-notion-accent-green text-white
                text-sm font-medium
                hover:opacity-90
                transition-opacity duration-fast
              "
            >
              <RocketOutlined />
              开始使用
            </button>
          </div>
        )}

        {/* 底部信息 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
            FireFire v0.6.31 · 本地优先 · 隐私安全
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
