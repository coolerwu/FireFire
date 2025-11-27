import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Dropdown, Input, message } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  MoreOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import PropertyCell from './PropertyCell';
import FilterBuilder from './FilterBuilder';
import SortBuilder from './SortBuilder';
import PropertyEditor from './PropertyEditor';
import { electronAPI } from 'utils/electronAPI';

/**
 * TableView - 数据库表格视图组件
 * Notion 风格的表格数据库
 */
const TableView = ({ databaseId, onTitleChange }) => {
  const [database, setDatabase] = useState(null);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [columnWidths, setColumnWidths] = useState({});
  const [filters, setFilters] = useState([]);
  const [sorts, setSorts] = useState([]);
  const [editingProperty, setEditingProperty] = useState(null);
  const resizingRef = useRef(null);

  // 加载数据库和行
  const loadData = useCallback(async () => {
    if (!databaseId) return;

    try {
      setLoading(true);
      const db = await electronAPI.getDatabaseView(databaseId);
      if (db) {
        setDatabase(db);
        setTitle(db.title);
        // 初始化列宽
        const widths = {};
        db.propertiesConfig.forEach(prop => {
          widths[prop.id] = prop.width || 150;
        });
        setColumnWidths(widths);
        // 加载视图配置中的筛选排序
        const viewConfig = db.viewConfig?.views?.table || {};
        setFilters(viewConfig.filters || []);
        setSorts(viewConfig.sorts || []);
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

  // 应用筛选和排序
  useEffect(() => {
    let result = [...rows];

    // 应用筛选
    if (filters.length > 0) {
      result = result.filter(row => {
        return filters.every(filter => {
          const value = row.properties[filter.propertyId];
          const filterValue = filter.value;

          switch (filter.operator) {
            case 'equals':
              return value === filterValue;
            case 'not_equals':
              return value !== filterValue;
            case 'contains':
              return String(value || '').toLowerCase().includes(String(filterValue || '').toLowerCase());
            case 'not_contains':
              return !String(value || '').toLowerCase().includes(String(filterValue || '').toLowerCase());
            case 'is_empty':
              return value === null || value === undefined || value === '';
            case 'is_not_empty':
              return value !== null && value !== undefined && value !== '';
            case 'greater_than':
              return Number(value) > Number(filterValue);
            case 'less_than':
              return Number(value) < Number(filterValue);
            case 'greater_or_equal':
              return Number(value) >= Number(filterValue);
            case 'less_or_equal':
              return Number(value) <= Number(filterValue);
            default:
              return true;
          }
        });
      });
    }

    // 应用排序
    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts) {
          const aValue = a.properties[sort.propertyId];
          const bValue = b.properties[sort.propertyId];
          const direction = sort.direction === 'desc' ? -1 : 1;

          if (aValue === bValue) continue;
          if (aValue === null || aValue === undefined) return 1 * direction;
          if (bValue === null || bValue === undefined) return -1 * direction;

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return (aValue - bValue) * direction;
          }

          return String(aValue).localeCompare(String(bValue)) * direction;
        }
        return 0;
      });
    }

    setFilteredRows(result);
  }, [rows, filters, sorts]);

  // 保存筛选排序配置
  const saveViewConfig = useCallback(async (newFilters, newSorts) => {
    if (!database) return;

    const newViewConfig = {
      ...database.viewConfig,
      views: {
        ...database.viewConfig?.views,
        table: {
          filters: newFilters,
          sorts: newSorts,
        },
      },
    };

    await electronAPI.updateDatabaseView(databaseId, { viewConfig: newViewConfig });
    setDatabase({ ...database, viewConfig: newViewConfig });
  }, [database, databaseId]);

  // 处理筛选变化
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    saveViewConfig(newFilters, sorts);
  };

  // 处理排序变化
  const handleSortsChange = (newSorts) => {
    setSorts(newSorts);
    saveViewConfig(filters, newSorts);
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
  const handleAddRow = async () => {
    try {
      const newRow = await electronAPI.createDatabaseRow(databaseId, { title: '' });
      setRows([...rows, newRow]);
    } catch (err) {
      message.error('添加行失败');
    }
  };

  // 更新行属性
  const handleUpdateCell = async (rowId, propertyId, value) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    const newProperties = { ...row.properties, [propertyId]: value };

    // 乐观更新 UI
    setRows(rows.map(r =>
      r.id === rowId ? { ...r, properties: newProperties } : r
    ));

    try {
      await electronAPI.updateDatabaseRow(rowId, { properties: newProperties });
    } catch (err) {
      message.error('更新失败');
      loadData(); // 重新加载
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

  // 添加新列
  const handleAddColumn = async (type = 'text') => {
    const propId = `prop_${Date.now()}`;
    const newProp = {
      id: propId,
      name: '新属性',
      type,
      width: 150,
      options: type === 'select' || type === 'multi_select' ? ['选项1', '选项2', '选项3'] : undefined,
    };

    const newConfig = [...database.propertiesConfig, newProp];
    await electronAPI.updateDatabaseView(databaseId, { propertiesConfig: newConfig });
    setDatabase({ ...database, propertiesConfig: newConfig });
    setColumnWidths({ ...columnWidths, [propId]: 150 });
  };

  // 更新属性配置
  const handleUpdateProperty = async (updatedProp) => {
    const newConfig = database.propertiesConfig.map(p =>
      p.id === updatedProp.id ? updatedProp : p
    );
    await electronAPI.updateDatabaseView(databaseId, { propertiesConfig: newConfig });
    setDatabase({ ...database, propertiesConfig: newConfig });
  };

  // 删除列
  const handleDeleteColumn = async (propId) => {
    if (propId === 'title') {
      message.warning('名称列不能删除');
      return;
    }
    const newConfig = database.propertiesConfig.filter(p => p.id !== propId);
    await electronAPI.updateDatabaseView(databaseId, { propertiesConfig: newConfig });
    setDatabase({ ...database, propertiesConfig: newConfig });
    // 清理相关的筛选和排序
    setFilters(filters.filter(f => f.propertyId !== propId));
    setSorts(sorts.filter(s => s.propertyId !== propId));
  };

  // 列宽调整
  const handleResizeStart = (e, propId) => {
    e.preventDefault();
    resizingRef.current = {
      propId,
      startX: e.clientX,
      startWidth: columnWidths[propId] || 150,
    };

    const handleMouseMove = (moveEvent) => {
      if (!resizingRef.current) return;
      const diff = moveEvent.clientX - resizingRef.current.startX;
      const newWidth = Math.max(80, resizingRef.current.startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [resizingRef.current.propId]: newWidth }));
    };

    const handleMouseUp = async () => {
      if (resizingRef.current) {
        // 保存列宽到数据库
        const newConfig = database.propertiesConfig.map(p =>
          p.id === resizingRef.current.propId
            ? { ...p, width: columnWidths[resizingRef.current.propId] }
            : p
        );
        await electronAPI.updateDatabaseView(databaseId, { propertiesConfig: newConfig });
      }
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 属性类型选项
  const propertyTypes = [
    { key: 'text', label: '📝 文本' },
    { key: 'number', label: '🔢 数字' },
    { key: 'select', label: '📋 单选' },
    { key: 'multi_select', label: '📑 多选' },
    { key: 'date', label: '📅 日期' },
    { key: 'checkbox', label: '☑️ 复选框' },
    { key: 'url', label: '🔗 URL' },
  ];

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
    <div className="database-table-view w-full overflow-hidden">
      {/* 数据库标题 */}
      <div className="px-2 py-3 border-b border-notion-border dark:border-notion-dark-border">
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
            className="text-lg font-semibold cursor-text hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover px-1 py-0.5 rounded"
            onClick={() => setEditingTitle(true)}
          >
            {title || '无标题数据库'}
          </div>
        )}
      </div>

      {/* 工具栏 */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-notion-border dark:border-notion-dark-border">
        <FilterBuilder
          properties={database.propertiesConfig}
          filters={filters}
          onChange={handleFiltersChange}
        />
        <SortBuilder
          properties={database.propertiesConfig}
          sorts={sorts}
          onChange={handleSortsChange}
        />
        <div className="flex-1" />
        <span className="text-xs text-gray-400">
          {filteredRows.length} / {rows.length} 条
        </span>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* 表头 */}
          <thead>
            <tr className="bg-notion-bg-secondary dark:bg-notion-dark-bg-tertiary">
              {database.propertiesConfig.map((prop) => (
                <th
                  key={prop.id}
                  className="relative text-left text-sm font-medium text-notion-text-secondary dark:text-notion-dark-text-secondary border-b border-r border-notion-border dark:border-notion-dark-border"
                  style={{ width: columnWidths[prop.id] || 150, minWidth: 80 }}
                >
                  <div
                    className="px-2 py-2 flex items-center justify-between group cursor-pointer hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover"
                    onClick={() => setEditingProperty(prop)}
                  >
                    <span>{prop.name}</span>
                    <SettingOutlined className="text-xs text-gray-400 opacity-0 group-hover:opacity-100" />
                  </div>
                  {/* 调整列宽手柄 */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 z-10"
                    onMouseDown={(e) => handleResizeStart(e, prop.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              ))}
              {/* 添加列按钮 */}
              <th className="w-10 border-b border-notion-border dark:border-notion-dark-border">
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: propertyTypes.map(t => ({ key: t.key, label: t.label })),
                    onClick: ({ key }) => handleAddColumn(key),
                  }}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    className="w-full h-full opacity-50 hover:opacity-100"
                  />
                </Dropdown>
              </th>
            </tr>
          </thead>

          {/* 表体 */}
          <tbody>
            {filteredRows.map((row) => (
              <tr
                key={row.id}
                className="group hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover"
              >
                {database.propertiesConfig.map((prop) => (
                  <td
                    key={prop.id}
                    className="border-b border-r border-notion-border dark:border-notion-dark-border"
                    style={{ width: columnWidths[prop.id] || 150 }}
                  >
                    <PropertyCell
                      property={prop}
                      value={row.properties[prop.id]}
                      onChange={(value) => handleUpdateCell(row.id, prop.id, value)}
                    />
                  </td>
                ))}
                {/* 行操作 */}
                <td className="w-10 border-b border-notion-border dark:border-notion-dark-border">
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [
                        { key: 'delete', label: '删除', danger: true, icon: <DeleteOutlined /> },
                      ],
                      onClick: ({ key }) => {
                        if (key === 'delete') handleDeleteRow(row.id);
                      }
                    }}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<MoreOutlined />}
                      className="opacity-0 group-hover:opacity-100"
                    />
                  </Dropdown>
                </td>
              </tr>
            ))}

            {/* 空状态 */}
            {filteredRows.length === 0 && rows.length > 0 && (
              <tr>
                <td
                  colSpan={database.propertiesConfig.length + 1}
                  className="py-8 text-center text-gray-400"
                >
                  没有符合筛选条件的数据
                </td>
              </tr>
            )}

            {/* 添加行按钮 */}
            <tr>
              <td
                colSpan={database.propertiesConfig.length + 1}
                className="border-b border-notion-border dark:border-notion-dark-border"
              >
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={handleAddRow}
                  className="w-full text-left text-gray-400 hover:text-gray-600"
                >
                  新建
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 属性编辑弹窗 */}
      <PropertyEditor
        property={editingProperty}
        visible={!!editingProperty}
        onClose={() => setEditingProperty(null)}
        onSave={handleUpdateProperty}
        onDelete={handleDeleteColumn}
      />
    </div>
  );
};

export default TableView;
