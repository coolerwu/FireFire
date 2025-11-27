import React, { useState, useEffect } from 'react';
import { Segmented, message } from 'antd';
import {
  TableOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import TableView from './TableView';
import { electronAPI } from 'utils/electronAPI';

/**
 * DatabaseView - 数据库视图主组件
 * 支持表格、看板、日历等多种视图切换
 */
const DatabaseView = ({ databaseId, node, updateAttributes }) => {
  const [currentView, setCurrentView] = useState('table');
  const [database, setDatabase] = useState(null);

  useEffect(() => {
    const loadDatabase = async () => {
      if (!databaseId) return;
      try {
        const db = await electronAPI.getDatabaseView(databaseId);
        if (db) {
          setDatabase(db);
          setCurrentView(db.viewConfig?.currentView || 'table');
        }
      } catch (err) {
        console.error('加载数据库失败:', err);
      }
    };
    loadDatabase();
  }, [databaseId]);

  const handleViewChange = async (view) => {
    setCurrentView(view);
    if (database) {
      const newViewConfig = { ...database.viewConfig, currentView: view };
      await electronAPI.updateDatabaseView(databaseId, { viewConfig: newViewConfig });
    }
  };

  const handleTitleChange = (newTitle) => {
    // 更新节点属性
    if (updateAttributes) {
      updateAttributes({ title: newTitle });
    }
  };

  const viewOptions = [
    { value: 'table', icon: <TableOutlined />, label: '表格' },
    { value: 'board', icon: <AppstoreOutlined />, label: '看板', disabled: true },
    { value: 'list', icon: <UnorderedListOutlined />, label: '列表', disabled: true },
    { value: 'calendar', icon: <CalendarOutlined />, label: '日历', disabled: true },
  ];

  return (
    <div className="database-view-container my-4 border border-notion-border dark:border-notion-dark-border rounded-lg overflow-hidden bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
      {/* 视图切换 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-notion-border dark:border-notion-dark-border bg-notion-bg-secondary dark:bg-notion-dark-bg-secondary">
        <Segmented
          size="small"
          options={viewOptions.map(opt => ({
            value: opt.value,
            label: (
              <span className="flex items-center gap-1">
                {opt.icon}
                <span className="hidden sm:inline">{opt.label}</span>
              </span>
            ),
            disabled: opt.disabled,
          }))}
          value={currentView}
          onChange={handleViewChange}
        />
      </div>

      {/* 视图内容 */}
      <div className="database-view-content">
        {currentView === 'table' && (
          <TableView databaseId={databaseId} onTitleChange={handleTitleChange} />
        )}
        {currentView === 'board' && (
          <div className="p-8 text-center text-gray-400">
            看板视图开发中...
          </div>
        )}
        {currentView === 'list' && (
          <div className="p-8 text-center text-gray-400">
            列表视图开发中...
          </div>
        )}
        {currentView === 'calendar' && (
          <div className="p-8 text-center text-gray-400">
            日历视图开发中...
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseView;
