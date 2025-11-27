import React, { useState } from 'react';
import { Button, Select, Popover, Tag } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  MenuOutlined,
} from '@ant-design/icons';

/**
 * SortBuilder - 排序条件构建器
 * 支持多列排序，可拖拽调整优先级
 */
const SortBuilder = ({ properties, sorts, onChange }) => {
  const [open, setOpen] = useState(false);

  // 添加排序条件
  const handleAddSort = () => {
    // 找到第一个未使用的属性
    const usedPropertyIds = sorts.map(s => s.propertyId);
    const availableProp = properties.find(p => !usedPropertyIds.includes(p.id));

    if (!availableProp) {
      return; // 所有属性都已用于排序
    }

    const newSort = {
      id: `sort_${Date.now()}`,
      propertyId: availableProp.id,
      direction: 'asc',
    };
    onChange([...sorts, newSort]);
  };

  // 更新排序条件
  const handleUpdateSort = (sortId, updates) => {
    onChange(sorts.map(s =>
      s.id === sortId ? { ...s, ...updates } : s
    ));
  };

  // 删除排序条件
  const handleDeleteSort = (sortId) => {
    onChange(sorts.filter(s => s.id !== sortId));
  };

  // 清空所有排序
  const handleClearAll = () => {
    onChange([]);
  };

  // 移动排序项（调整优先级）
  const handleMoveSort = (index, direction) => {
    const newSorts = [...sorts];
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= sorts.length) return;

    [newSorts[index], newSorts[newIndex]] = [newSorts[newIndex], newSorts[index]];
    onChange(newSorts);
  };

  // 获取可用属性（排除已选择的）
  const getAvailableProperties = (currentSortId) => {
    const usedPropertyIds = sorts
      .filter(s => s.id !== currentSortId)
      .map(s => s.propertyId);

    return properties.filter(p => !usedPropertyIds.includes(p.id));
  };

  const content = (
    <div className="w-[350px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">排序规则</span>
        {sorts.length > 0 && (
          <Button size="small" type="link" danger onClick={handleClearAll}>
            清空
          </Button>
        )}
      </div>

      {sorts.length === 0 ? (
        <div className="text-gray-400 text-sm py-4 text-center">
          暂无排序规则
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {sorts.map((sort, index) => {
            const property = properties.find(p => p.id === sort.propertyId);
            const availableProps = getAvailableProperties(sort.id);

            return (
              <div
                key={sort.id}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded group"
              >
                {/* 拖动手柄和优先级显示 */}
                <div className="flex items-center gap-1 text-gray-400">
                  <MenuOutlined className="cursor-move" />
                  <span className="text-xs w-4">{index + 1}</span>
                </div>

                {/* 上下移动按钮 */}
                <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="text"
                    size="small"
                    disabled={index === 0}
                    onClick={() => handleMoveSort(index, -1)}
                    className="!h-3 !p-0 text-xs"
                  >
                    ▲
                  </Button>
                  <Button
                    type="text"
                    size="small"
                    disabled={index === sorts.length - 1}
                    onClick={() => handleMoveSort(index, 1)}
                    className="!h-3 !p-0 text-xs"
                  >
                    ▼
                  </Button>
                </div>

                {/* 属性选择 */}
                <Select
                  size="small"
                  value={sort.propertyId}
                  onChange={(val) => handleUpdateSort(sort.id, { propertyId: val })}
                  style={{ width: 120 }}
                  options={[
                    // 当前选择的属性
                    ...(property ? [{ value: property.id, label: property.name }] : []),
                    // 其他可用属性
                    ...availableProps
                      .filter(p => p.id !== sort.propertyId)
                      .map(p => ({ value: p.id, label: p.name }))
                  ]}
                />

                {/* 排序方向 */}
                <Select
                  size="small"
                  value={sort.direction}
                  onChange={(val) => handleUpdateSort(sort.id, { direction: val })}
                  style={{ width: 100 }}
                  options={[
                    {
                      value: 'asc',
                      label: (
                        <span className="flex items-center gap-1">
                          <SortAscendingOutlined /> 升序
                        </span>
                      ),
                    },
                    {
                      value: 'desc',
                      label: (
                        <span className="flex items-center gap-1">
                          <SortDescendingOutlined /> 降序
                        </span>
                      ),
                    },
                  ]}
                />

                {/* 删除按钮 */}
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteSort(sort.id)}
                />
              </div>
            );
          })}
        </div>
      )}

      <Button
        type="dashed"
        size="small"
        icon={<PlusOutlined />}
        onClick={handleAddSort}
        className="w-full mt-3"
        disabled={sorts.length >= properties.length}
      >
        添加排序规则
      </Button>

      {sorts.length > 1 && (
        <div className="text-xs text-gray-400 mt-2 text-center">
          提示：拖动或使用箭头调整排序优先级
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomLeft"
      open={open}
      onOpenChange={setOpen}
    >
      <Button
        size="small"
        icon={<SortAscendingOutlined />}
        type={sorts.length > 0 ? 'primary' : 'text'}
      >
        排序
        {sorts.length > 0 && (
          <Tag className="ml-1" color="blue">{sorts.length}</Tag>
        )}
      </Button>
    </Popover>
  );
};

export default SortBuilder;
