import React, { useState, useEffect, useRef, useContext } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Dropdown, message, Modal } from 'antd';
import { ExpandOutlined, MoreOutlined, DeleteOutlined, LinkOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { formatDisplayDate, getRelativeDate } from './dateUtils';
import { electronAPI } from '../../utils/electronAPI';
import { logger } from '../../utils/logger';
import { Context } from '../../index';
import journalExtensions from './journalExtensions';
import './journalEntry.less';

/**
 * 单个日记条目组件
 */
const JournalEntry = ({ journal, onUpdate, onDelete }) => {
  const { setActiveKey, setEditingNote, setting } = useContext(Context);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const saveTimeoutRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);
  const journalIdRef = useRef(journal.id);
  const isDirtyRef = useRef(false);

  // 自动保存间隔（毫秒）- 类似 Obsidian 每 2 秒保存一次
  const AUTO_SAVE_INTERVAL = 2000;

  // 保存函数
  const saveContent = async () => {
    if (!editor || editor.isDestroyed || !isDirtyRef.current) return;

    try {
      const json = editor.getJSON();
      const journalPath = `journals/${journalIdRef.current}`;
      await electronAPI.writeNotebookFile(journalPath, JSON.stringify(json));
      if (onUpdate) {
        onUpdate(journalIdRef.current, json);
      }
      isDirtyRef.current = false;
      logger.debug('[JournalEntry] 已保存:', journalPath);
    } catch (error) {
      logger.error('[JournalEntry] 保存失败:', error);
    }
  };

  const editor = useEditor({
    extensions: journalExtensions,
    editorProps: {
      attributes: {
        class: 'journal-editor-content',
      },
    },
    onUpdate: ({ editor }) => {
      isDirtyRef.current = true;

      // 防抖保存 (2秒后保存)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveContent();
      }, 2000);
    },
    onBlur: ({ editor }) => {
      // 失去焦点时立即保存
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveContent();
    },
  });

  // 加载日记内容
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const rawContent = await electronAPI.readNotebookFile(`journals/${journal.id}`);
        const contentObj = rawContent ? JSON.parse(rawContent) : null;

        if (editor && contentObj) {
          editor.commands.setContent(contentObj);
        }
      } catch (error) {
        logger.error('[JournalEntry] 加载日记失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (editor) {
      loadContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journal.id]);

  // 更新 journalIdRef 当 journal.id 改变时
  useEffect(() => {
    journalIdRef.current = journal.id;
  }, [journal.id]);


  // 打开日记编辑器
  const handleOpenJournal = () => {
    const suffix = setting?.notebookSuffix || '.md';
    const noteInfo = {
      id: `journals/${journal.id}`,
      filename: `${journal.id}${suffix}`,
      type: 'journal',
      notebookPath: `journals/${journal.id}${suffix}`,
      attachmentPath: `attachment/journals/${journal.id}`,
      isJournal: true,
      journalDate: journal.journalDate,
      title: journal.title,
    };
    setEditingNote(noteInfo);
    setActiveKey('editor');
  };

  // 复制链接
  const handleCopyLink = () => {
    const link = `firefire://journal/${journal.id}`;
    navigator.clipboard.writeText(link).then(() => {
      message.success('已复制链接');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 删除日记
  const handleDelete = () => {
    Modal.confirm({
      title: '删除日记',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除 ${formatDisplayDate(new Date(journal.journalDate))} 的日记吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await electronAPI.deleteJournal(journal.id);
          if (result) {
            message.success('已删除日记');
            if (onDelete) {
              onDelete(journal.id);
            }
          } else {
            message.error('删除失败');
          }
        } catch (error) {
          logger.error('[JournalEntry] 删除日记失败:', error);
          message.error('删除失败');
        }
      },
    });
  };


  // 下拉菜单项
  const menuItems = [
    {
      key: 'open',
      icon: <ExpandOutlined />,
      label: '打开',
      onClick: handleOpenJournal,
    },
    {
      key: 'copy-link',
      icon: <LinkOutlined />,
      label: '复制链接',
      onClick: handleCopyLink,
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: handleDelete,
    },
  ];

  // 定期自动保存（类似 Obsidian）
  useEffect(() => {
    if (!editor) return;

    // 启动定期自动保存
    autoSaveIntervalRef.current = setInterval(() => {
      saveContent();
    }, AUTO_SAVE_INTERVAL);

    return () => {
      // 清除定期保存定时器
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // 清理定时器和保存内容（组件卸载时）
  useEffect(() => {
    return () => {
      // 清除防抖定时器
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // 清除定期保存定时器
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }

      // 立即同步保存当前内容（组件卸载时）
      if (editor && !editor.isDestroyed && isDirtyRef.current) {
        try {
          const json = editor.getJSON();
          const journalPath = `journals/${journalIdRef.current}`;
          // 使用同步方式保存，确保在组件卸载前完成
          electronAPI.writeNotebookFile(journalPath, JSON.stringify(json));
          logger.debug('[JournalEntry] 卸载时已保存:', journalPath);
        } catch (error) {
          logger.error('[JournalEntry] 卸载时保存失败:', error);
        }
      }
    };
  }, [editor]);

  const displayDate = formatDisplayDate(new Date(journal.journalDate));
  const relativeDate = getRelativeDate(journal.journalDate);

  if (loading) {
    return (
      <div className="journal-entry loading">
        <div className="journal-date-label">
          <h2>{displayDate}</h2>
          <span className="relative-date">{relativeDate}</span>
        </div>
        <div className="journal-editor-container">
          <div className="loading-placeholder">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="journal-entry"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="journal-date-label">
        <h2 onClick={handleOpenJournal}>{displayDate}</h2>
        <span className="relative-date">{relativeDate}</span>

        {/* 操作按钮组 - 悬停显示 */}
        <div className={`journal-actions ${isHovered ? 'visible' : ''}`}>
          <button
            className="action-btn"
            onClick={handleOpenJournal}
            title="打开"
          >
            <ExpandOutlined />
          </button>
          <button
            className="action-btn danger"
            onClick={handleDelete}
            title="删除"
          >
            <DeleteOutlined />
          </button>
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
          >
            <button className="action-btn" title="更多">
              <MoreOutlined />
            </button>
          </Dropdown>
        </div>
      </div>
      <div className="journal-editor-container">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default JournalEntry;
