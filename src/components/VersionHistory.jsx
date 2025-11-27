import React, { useState, useEffect, useCallback } from 'react';
import { Drawer, List, Button, Modal, message, Spin, Empty, Tooltip, Popconfirm } from 'antd';
import { HistoryOutlined, EyeOutlined, RollbackOutlined, DeleteOutlined } from '@ant-design/icons';
import { electronAPI } from '../utils/electronAPI';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

/**
 * 版本历史面板组件
 * 显示笔记的历史版本，支持预览和恢复
 */
const VersionHistory = ({ noteId, visible, onClose, onRestore, editor }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);

  // 加载版本列表
  const loadVersions = useCallback(async () => {
    if (!noteId) return;

    setLoading(true);
    try {
      const data = await electronAPI.getVersions(noteId, 50, 0);
      setVersions(data || []);
    } catch (err) {
      console.error('加载版本历史失败:', err);
      message.error('加载版本历史失败');
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    if (visible && noteId) {
      loadVersions();
    }
  }, [visible, noteId, loadVersions]);

  // 预览版本
  const handlePreview = async (version) => {
    try {
      const data = await electronAPI.getVersion(version.id);
      if (data) {
        setPreviewVersion(version);
        setPreviewContent(data.content);
        setPreviewVisible(true);
      }
    } catch (err) {
      console.error('获取版本内容失败:', err);
      message.error('获取版本内容失败');
    }
  };

  // 恢复版本
  const handleRestore = async (version) => {
    try {
      const data = await electronAPI.getVersion(version.id);
      if (data && onRestore) {
        // 先保存当前版本
        if (editor) {
          const currentContent = JSON.stringify(editor.getJSON());
          await electronAPI.saveVersion(noteId, currentContent, true);
        }
        // 恢复选中的版本
        onRestore(data.content);
        message.success('已恢复到选中版本');
        onClose();
      }
    } catch (err) {
      console.error('恢复版本失败:', err);
      message.error('恢复版本失败');
    }
  };

  // 删除版本
  const handleDelete = async (version) => {
    try {
      await electronAPI.deleteVersion(version.id);
      message.success('版本已删除');
      loadVersions();
    } catch (err) {
      console.error('删除版本失败:', err);
      message.error('删除版本失败');
    }
  };

  // 格式化时间
  const formatTime = (isoString) => {
    const date = dayjs(isoString);
    const now = dayjs();
    if (now.diff(date, 'hour') < 24) {
      return date.fromNow();
    }
    return date.format('MM-DD HH:mm');
  };

  return (
    <>
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <HistoryOutlined />
            <span>版本历史</span>
            {versions.length > 0 && (
              <span className="text-xs text-gray-400">({versions.length})</span>
            )}
          </div>
        }
        placement="right"
        width={360}
        open={visible}
        onClose={onClose}
        className="version-history-drawer"
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <Spin tip="加载中..." />
          </div>
        ) : versions.length === 0 ? (
          <Empty
            description="暂无历史版本"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={versions}
            renderItem={(version) => (
              <List.Item
                className="version-item hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
                actions={[
                  <Tooltip title="预览" key="preview">
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handlePreview(version)}
                    />
                  </Tooltip>,
                  <Tooltip title="恢复到此版本" key="restore">
                    <Popconfirm
                      title="确定恢复到此版本吗？"
                      description="当前内容将自动保存为新版本"
                      onConfirm={() => handleRestore(version)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<RollbackOutlined />}
                      />
                    </Popconfirm>
                  </Tooltip>,
                  <Tooltip title="删除" key="delete">
                    <Popconfirm
                      title="确定删除此版本吗？"
                      onConfirm={() => handleDelete(version)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  </Tooltip>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <span className="text-sm font-medium">
                      {formatTime(version.createdAt)}
                    </span>
                  }
                  description={
                    <span className="text-xs text-gray-500 truncate block">
                      {version.summary}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>

      {/* 版本预览弹窗 */}
      <Modal
        title={`版本预览 - ${previewVersion ? formatTime(previewVersion.createdAt) : ''}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button
            key="restore"
            type="primary"
            onClick={() => {
              setPreviewVisible(false);
              handleRestore(previewVersion);
            }}
          >
            恢复此版本
          </Button>,
        ]}
      >
        <div
          className="version-preview-content p-4 bg-gray-50 dark:bg-gray-900 rounded-lg max-h-96 overflow-auto"
          style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}
        >
          {previewContent}
        </div>
      </Modal>
    </>
  );
};

export default VersionHistory;
