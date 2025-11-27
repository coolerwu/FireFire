import React, { useEffect, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Button, message, Spin } from 'antd';
import { DeleteOutlined, DragOutlined } from '@ant-design/icons';
import { DatabaseView } from 'components/DatabaseView';
import { electronAPI } from 'utils/electronAPI';

/**
 * DatabaseNodeComponent - 数据库节点渲染组件
 * 用于在编辑器中渲染数据库视图
 */
const DatabaseNodeComponent = ({ node, updateAttributes, deleteNode, selected }) => {
  const [loading, setLoading] = useState(false);
  const { databaseId, title } = node.attrs;

  // 如果没有 databaseId，创建新数据库
  useEffect(() => {
    const initDatabase = async () => {
      if (!databaseId) {
        setLoading(true);
        try {
          const newDb = await electronAPI.createDatabaseView('无标题数据库');
          updateAttributes({
            databaseId: newDb.id,
            title: newDb.title
          });
        } catch (err) {
          console.error('创建数据库失败:', err);
          message.error('创建数据库失败');
        } finally {
          setLoading(false);
        }
      }
    };
    initDatabase();
  }, [databaseId, updateAttributes]);

  const handleDelete = async () => {
    if (databaseId) {
      try {
        await electronAPI.deleteDatabaseView(databaseId);
      } catch (err) {
        console.error('删除数据库失败:', err);
      }
    }
    deleteNode();
  };

  if (loading || !databaseId) {
    return (
      <NodeViewWrapper className="database-node">
        <div className="flex items-center justify-center p-8 bg-notion-bg-secondary dark:bg-notion-dark-bg-secondary rounded-lg">
          <Spin tip="创建数据库中..." />
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="database-node">
      <div className={`relative group ${selected ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
        {/* 操作按钮 */}
        <div className="absolute -left-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
          <Button
            type="text"
            size="small"
            icon={<DragOutlined />}
            className="cursor-grab"
            data-drag-handle
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          />
        </div>

        {/* 数据库视图 */}
        <DatabaseView
          databaseId={databaseId}
          node={node}
          updateAttributes={updateAttributes}
        />
      </div>
    </NodeViewWrapper>
  );
};

export default DatabaseNodeComponent;
