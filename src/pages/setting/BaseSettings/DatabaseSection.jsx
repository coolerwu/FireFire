/**
 * 数据库维护区块
 */
import React, { useState } from 'react';
import { message, Modal } from 'antd';
import { SyncOutlined, DatabaseOutlined, ToolOutlined } from '@ant-design/icons';
import { electronAPI } from '@/utils/electronAPI';
import { SettingSection, SettingRow } from './common';

const DatabaseSection = () => {
  const [dbStatus, setDbStatus] = useState(null); // null, 'checking', 'ok', 'error'
  const [repairing, setRepairing] = useState(false);
  const [rebuildingFts, setRebuildingFts] = useState(false);

  // 检查数据库完整性
  const handleCheckDbIntegrity = async () => {
    setDbStatus('checking');
    try {
      const result = await electronAPI.checkDbIntegrity();
      setDbStatus(result.ok ? 'ok' : 'error');
      if (result.ok) {
        message.success('数据库完整性检查通过');
      } else {
        message.error(`数据库有问题: ${result.error}`);
      }
    } catch (err) {
      setDbStatus('error');
      message.error(`检查失败: ${err.message}`);
    }
  };

  // 修复数据库
  const handleRepairDb = async () => {
    Modal.confirm({
      title: '修复数据库',
      content: '此操作会尝试修复损坏的数据库，过程中会自动备份原数据库。确定要继续吗？',
      okText: '开始修复',
      cancelText: '取消',
      onOk: async () => {
        setRepairing(true);
        try {
          const result = await electronAPI.repairDatabase();
          if (result.ok) {
            message.success(result.message);
            setDbStatus('ok');
          } else {
            message.error(result.message);
          }
        } catch (err) {
          message.error(`修复失败: ${err.message}`);
        } finally {
          setRepairing(false);
        }
      },
    });
  };

  // 重建搜索索引
  const handleRebuildFts = async () => {
    setRebuildingFts(true);
    try {
      const result = await electronAPI.rebuildFtsIndex();
      if (result.ok) {
        message.success('搜索索引重建完成');
      } else {
        message.error(`重建失败: ${result.error}`);
      }
    } catch (err) {
      message.error(`重建失败: ${err.message}`);
    } finally {
      setRebuildingFts(false);
    }
  };

  return (
    <SettingSection title="数据库维护">
      <SettingRow label="数据库状态" description="检查数据库完整性">
        <div className="flex items-center gap-2">
          {dbStatus === 'ok' && <span className="text-xs text-notion-accent-green">正常</span>}
          {dbStatus === 'error' && <span className="text-xs text-red-500">有问题</span>}
          <button
            onClick={handleCheckDbIntegrity}
            disabled={dbStatus === 'checking'}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium
              transition-colors duration-fast
              ${
                dbStatus === 'checking'
                  ? 'bg-notion-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
                  : 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-primary dark:text-notion-dark-text-primary hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover'
              }
            `}
          >
            {dbStatus === 'checking' ? (
              <span className="flex items-center gap-1">
                <SyncOutlined spin /> 检查中
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <DatabaseOutlined /> 检查
              </span>
            )}
          </button>
        </div>
      </SettingRow>

      <SettingRow label="重建搜索索引" description="如果搜索功能异常，可以尝试重建索引">
        <button
          onClick={handleRebuildFts}
          disabled={rebuildingFts}
          className={`
            px-3 py-1.5 rounded-md text-xs font-medium
            transition-colors duration-fast
            ${
              rebuildingFts
                ? 'bg-notion-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
                : 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-primary dark:text-notion-dark-text-primary hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover'
            }
          `}
        >
          {rebuildingFts ? (
            <span className="flex items-center gap-1">
              <SyncOutlined spin /> 重建中
            </span>
          ) : (
            '重建索引'
          )}
        </button>
      </SettingRow>

      <SettingRow label="修复数据库" description="如果数据库损坏，可以尝试自动修复">
        <button
          onClick={handleRepairDb}
          disabled={repairing}
          className={`
            px-3 py-1.5 rounded-md text-xs font-medium
            transition-colors duration-fast
            ${
              repairing
                ? 'bg-notion-bg-tertiary text-notion-text-tertiary cursor-not-allowed'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
            }
          `}
        >
          {repairing ? (
            <span className="flex items-center gap-1">
              <SyncOutlined spin /> 修复中
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <ToolOutlined /> 修复数据库
            </span>
          )}
        </button>
      </SettingRow>
    </SettingSection>
  );
};

export default DatabaseSection;
