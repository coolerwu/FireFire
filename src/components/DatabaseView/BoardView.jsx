import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Dropdown, Input, Select, message, Empty } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  MoreOutlined,
  SettingOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropertyCell from './PropertyCell';
import { electronAPI } from 'utils/electronAPI';

/**
 * BoardCard - 看板卡片组件
 */
const BoardCard = ({ row, properties, titleProperty, onUpdate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 获取要显示的属性（排除分组属性和标题属性）
  const displayProps = properties.filter(p => p.id !== 'title').slice(0, 3);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white dark:bg-notion-dark-bg-secondary
        border border-notion-border dark:border-notion-dark-border
        rounded-lg shadow-sm
        p-3 mb-2 cursor-grab
        hover:shadow-md transition-shadow
        ${isDragging ? 'shadow-lg' : ''}
      `}
    >
      {/* 卡片标题 */}
      <div className="font-medium text-sm mb-2 text-notion-text-primary dark:text-notion-dark-text-primary">
        {row.properties[titleProperty?.id || 'title'] || '无标题'}
      </div>

      {/* 卡片属性预览 */}
      <div className="space-y-1">
        {displayProps.map(prop => (
          <div key={prop.id} className="flex items-center text-xs text-gray-500">
            <span className="mr-2 truncate" style={{ maxWidth: '60px' }}>{prop.name}:</span>
            <span className="truncate flex-1">
              <PropertyCell
                property={prop}
                value={row.properties[prop.id]}
                onChange={(value) => onUpdate(row.id, prop.id, value)}
                compact
              />
            </span>
          </div>
        ))}
      </div>

      {/* 更多操作 */}
      <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'delete', label: '删除', danger: true, icon: <DeleteOutlined /> },
            ],
            onClick: ({ key }) => {
              if (key === 'delete') onDelete(row.id);
            }
          }}
        >
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>
    </div>
  );
};

/**
 * BoardColumn - 看板列组件
 */
const BoardColumn = ({
  columnId,
  columnValue,
  rows,
  properties,
  titleProperty,
  groupProperty,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
  color,
}) => {
  const cardIds = rows.map(r => r.id);

  return (
    <div className="flex-shrink-0 w-72 bg-notion-bg-secondary dark:bg-notion-dark-bg-tertiary rounded-lg flex flex-col max-h-full">
      {/* 列头 */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-notion-border dark:border-notion-dark-border">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color || '#e0e0e0' }}
          />
          <span className="font-medium text-sm text-notion-text-primary dark:text-notion-dark-text-primary">
            {columnValue || '未分组'}
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
            {rows.length}
          </span>
        </div>
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => onAddRow(columnValue)}
          className="opacity-60 hover:opacity-100"
        />
      </div>

      {/* 卡片列表 */}
      <div className="flex-1 overflow-y-auto p-2 min-h-[100px]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {rows.map(row => (
            <BoardCard
              key={row.id}
              row={row}
              properties={properties}
              titleProperty={titleProperty}
              onUpdate={onUpdateRow}
              onDelete={onDeleteRow}
            />
          ))}
        </SortableContext>

        {/* 空状态 */}
        {rows.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            拖拽卡片到这里
          </div>
        )}
      </div>

      {/* 添加卡片按钮 */}
      <div className="p-2 border-t border-notion-border dark:border-notion-dark-border">
        <Button
          type="text"
          icon={<PlusOutlined />}
          onClick={() => onAddRow(columnValue)}
          className="w-full text-left text-gray-400 hover:text-gray-600"
          size="small"
        >
          新建
        </Button>
      </div>
    </div>
  );
};

/**
 * BoardView - 看板视图主组件
 */
const BoardView = ({ databaseId, onTitleChange }) => {
  const [database, setDatabase] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [groupBy, setGroupBy] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 加载数据
  const loadData = useCallback(async () => {
    if (!databaseId) return;

    try {
      setLoading(true);
      const db = await electronAPI.getDatabaseView(databaseId);
      if (db) {
        setDatabase(db);
        setTitle(db.title);
        // 加载看板视图配置
        const boardConfig = db.viewConfig?.views?.board || {};
        setGroupBy(boardConfig.groupBy || null);
      }

      const dbRows = await electronAPI.getDatabaseRows(databaseId);
      setRows(dbRows || []);
    } catch (err) {
      console.error('加载数据库失败:', err);
      message.error('加载数据库失败');
    } finally {
      setLoading(false);
    }
  }, [databaseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 获取可用于分组的属性（单选类型）
  const groupableProperties = useMemo(() => {
    if (!database) return [];
    return database.propertiesConfig.filter(
      p => p.type === 'select' || p.type === 'multi_select'
    );
  }, [database]);

  // 获取分组属性
  const groupProperty = useMemo(() => {
    if (!database || !groupBy) return null;
    return database.propertiesConfig.find(p => p.id === groupBy);
  }, [database, groupBy]);

  // 获取标题属性
  const titleProperty = useMemo(() => {
    if (!database) return null;
    return database.propertiesConfig.find(p => p.id === 'title');
  }, [database]);

  // 按分组字段分组数据
  const groupedRows = useMemo(() => {
    if (!groupProperty) {
      // 没有分组字段时，显示"全部"列
      return { '全部': rows };
    }

    const groups = {};
    const options = groupProperty.options || [];

    // 初始化所有选项的分组
    options.forEach(opt => {
      groups[opt] = [];
    });
    // 添加未分组
    groups['未分组'] = [];

    // 分配行到各组
    rows.forEach(row => {
      const value = row.properties[groupProperty.id];
      if (value && groups[value] !== undefined) {
        groups[value].push(row);
      } else {
        groups['未分组'].push(row);
      }
    });

    return groups;
  }, [rows, groupProperty]);

  // 获取分组颜色
  const getGroupColor = (groupValue) => {
    const colors = [
      '#f87171', '#fb923c', '#fbbf24', '#a3e635',
      '#34d399', '#22d3ee', '#60a5fa', '#a78bfa',
      '#f472b6', '#9ca3af',
    ];
    if (!groupProperty?.options) return colors[9];
    const index = groupProperty.options.indexOf(groupValue);
    return index >= 0 ? colors[index % colors.length] : colors[9];
  };

  // 保存分组配置
  const handleGroupByChange = async (propId) => {
    setGroupBy(propId);
    if (database) {
      const newViewConfig = {
        ...database.viewConfig,
        views: {
          ...database.viewConfig?.views,
          board: {
            ...database.viewConfig?.views?.board,
            groupBy: propId,
          },
        },
      };
      await electronAPI.updateDatabaseView(databaseId, { viewConfig: newViewConfig });
      setDatabase({ ...database, viewConfig: newViewConfig });
    }
  };

  // 保存数据库标题
  const handleTitleSave = async () => {
    setEditingTitle(false);
    if (title !== database?.title) {
      await electronAPI.updateDatabaseView(databaseId, { title });
      onTitleChange?.(title);
    }
  };

  // 添加新行
  const handleAddRow = async (groupValue) => {
    try {
      const initialProps = {};
      if (groupProperty && groupValue && groupValue !== '未分组' && groupValue !== '全部') {
        initialProps[groupProperty.id] = groupValue;
      }
      const newRow = await electronAPI.createDatabaseRow(databaseId, initialProps);
      setRows([...rows, newRow]);
    } catch (err) {
      message.error('添加失败');
    }
  };

  // 更新行
  const handleUpdateRow = async (rowId, propertyId, value) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    const newProperties = { ...row.properties, [propertyId]: value };
    setRows(rows.map(r =>
      r.id === rowId ? { ...r, properties: newProperties } : r
    ));

    try {
      await electronAPI.updateDatabaseRow(rowId, { properties: newProperties });
    } catch (err) {
      message.error('更新失败');
      loadData();
    }
  };

  // 删除行
  const handleDeleteRow = async (rowId) => {
    setRows(rows.filter(r => r.id !== rowId));
    try {
      await electronAPI.deleteDatabaseRow(rowId);
    } catch (err) {
      message.error('删除失败');
      loadData();
    }
  };

  // 处理拖拽开始
  const handleDragStart = (event) => {
    const { active } = event;
    const card = rows.find(r => r.id === active.id);
    setActiveCard(card);
  };

  // 处理拖拽结束
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || !groupProperty) return;

    const activeRow = rows.find(r => r.id === active.id);
    if (!activeRow) return;

    // 找出目标列（通过找出 over 的 row 属于哪个组）
    let targetGroup = null;
    for (const [groupValue, groupRows] of Object.entries(groupedRows)) {
      if (groupRows.some(r => r.id === over.id)) {
        targetGroup = groupValue;
        break;
      }
    }

    // 如果拖到同一个组，可能只是排序
    const currentGroup = activeRow.properties[groupProperty.id] || '未分组';
    if (targetGroup && targetGroup !== currentGroup && targetGroup !== '全部') {
      // 更新分组
      const newValue = targetGroup === '未分组' ? null : targetGroup;
      await handleUpdateRow(active.id, groupProperty.id, newValue);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  if (!database) {
    return (
      <div className="p-4 text-center text-gray-500">
        数据库不存在
      </div>
    );
  }

  return (
    <div className="database-board-view w-full overflow-hidden flex flex-col h-full">
      {/* 数据库标题 */}
      <div className="px-3 py-3 border-b border-notion-border dark:border-notion-dark-border">
        {editingTitle ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onPressEnter={handleTitleSave}
            autoFocus
            className="text-lg font-semibold border-none shadow-none bg-transparent"
          />
        ) : (
          <div
            className="text-lg font-semibold cursor-text hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover px-1 py-0.5 rounded inline-block"
            onClick={() => setEditingTitle(true)}
          >
            {title || '无标题数据库'}
          </div>
        )}
      </div>

      {/* 工具栏 */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-notion-border dark:border-notion-dark-border">
        <div className="flex items-center gap-2">
          <AppstoreOutlined className="text-gray-400" />
          <span className="text-sm text-gray-500">分组:</span>
          <Select
            value={groupBy}
            onChange={handleGroupByChange}
            placeholder="选择分组字段"
            size="small"
            style={{ width: 140 }}
            allowClear
            options={groupableProperties.map(p => ({
              value: p.id,
              label: p.name,
            }))}
          />
        </div>
        <div className="flex-1" />
        <span className="text-xs text-gray-400">
          {rows.length} 条
        </span>
      </div>

      {/* 没有可分组字段的提示 */}
      {groupableProperties.length === 0 && (
        <div className="p-8 text-center">
          <Empty
            description={
              <span className="text-gray-400">
                需要添加"单选"或"多选"类型的属性才能使用看板视图
              </span>
            }
          />
        </div>
      )}

      {/* 看板内容 */}
      {(groupableProperties.length > 0 || rows.length > 0) && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 h-full">
              {Object.entries(groupedRows).map(([groupValue, groupRows]) => (
                <BoardColumn
                  key={groupValue}
                  columnId={groupValue}
                  columnValue={groupValue}
                  rows={groupRows}
                  properties={database.propertiesConfig}
                  titleProperty={titleProperty}
                  groupProperty={groupProperty}
                  onAddRow={handleAddRow}
                  onUpdateRow={handleUpdateRow}
                  onDeleteRow={handleDeleteRow}
                  color={getGroupColor(groupValue)}
                />
              ))}
            </div>

            {/* 拖拽预览 */}
            <DragOverlay>
              {activeCard && (
                <div className="bg-white dark:bg-notion-dark-bg-secondary border border-blue-500 rounded-lg shadow-xl p-3 w-72 opacity-90">
                  <div className="font-medium text-sm">
                    {activeCard.properties[titleProperty?.id || 'title'] || '无标题'}
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  );
};

export default BoardView;
