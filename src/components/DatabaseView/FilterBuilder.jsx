import React, { useState } from 'react';
import { Button, Select, Input, InputNumber, DatePicker, Popover, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

/**
 * FilterBuilder - 筛选条件构建器
 * 支持多条件筛选，不同属性类型有不同的操作符
 */
const FilterBuilder = ({ properties, filters, onChange }) => {
  const [open, setOpen] = useState(false);

  // 根据属性类型获取可用的操作符
  const getOperators = (type) => {
    const common = [
      { value: 'is_empty', label: '为空' },
      { value: 'is_not_empty', label: '不为空' },
    ];

    switch (type) {
      case 'text':
      case 'url':
        return [
          { value: 'equals', label: '等于' },
          { value: 'not_equals', label: '不等于' },
          { value: 'contains', label: '包含' },
          { value: 'not_contains', label: '不包含' },
          ...common,
        ];
      case 'number':
        return [
          { value: 'equals', label: '等于' },
          { value: 'not_equals', label: '不等于' },
          { value: 'greater_than', label: '大于' },
          { value: 'less_than', label: '小于' },
          { value: 'greater_or_equal', label: '大于等于' },
          { value: 'less_or_equal', label: '小于等于' },
          ...common,
        ];
      case 'select':
      case 'multi_select':
        return [
          { value: 'equals', label: '是' },
          { value: 'not_equals', label: '不是' },
          ...common,
        ];
      case 'date':
        return [
          { value: 'equals', label: '等于' },
          { value: 'not_equals', label: '不等于' },
          { value: 'greater_than', label: '晚于' },
          { value: 'less_than', label: '早于' },
          ...common,
        ];
      case 'checkbox':
        return [
          { value: 'equals', label: '是' },
        ];
      default:
        return common;
    }
  };

  // 添加筛选条件
  const handleAddFilter = () => {
    const firstProp = properties[0];
    if (!firstProp) return;

    const newFilter = {
      id: `filter_${Date.now()}`,
      propertyId: firstProp.id,
      operator: 'contains',
      value: '',
    };
    onChange([...filters, newFilter]);
  };

  // 更新筛选条件
  const handleUpdateFilter = (filterId, updates) => {
    onChange(filters.map(f =>
      f.id === filterId ? { ...f, ...updates } : f
    ));
  };

  // 删除筛选条件
  const handleDeleteFilter = (filterId) => {
    onChange(filters.filter(f => f.id !== filterId));
  };

  // 清空所有筛选
  const handleClearAll = () => {
    onChange([]);
  };

  // 渲染值输入组件
  const renderValueInput = (filter, property) => {
    if (['is_empty', 'is_not_empty'].includes(filter.operator)) {
      return null;
    }

    switch (property?.type) {
      case 'number':
        return (
          <InputNumber
            size="small"
            value={filter.value}
            onChange={(val) => handleUpdateFilter(filter.id, { value: val })}
            placeholder="输入数值"
            style={{ width: 100 }}
          />
        );
      case 'select':
        return (
          <Select
            size="small"
            value={filter.value}
            onChange={(val) => handleUpdateFilter(filter.id, { value: val })}
            placeholder="选择"
            style={{ width: 120 }}
            options={(property.options || []).map(opt => ({ value: opt, label: opt }))}
          />
        );
      case 'multi_select':
        return (
          <Select
            size="small"
            mode="multiple"
            value={filter.value || []}
            onChange={(val) => handleUpdateFilter(filter.id, { value: val })}
            placeholder="选择"
            style={{ width: 150 }}
            options={(property.options || []).map(opt => ({ value: opt, label: opt }))}
          />
        );
      case 'date':
        return (
          <DatePicker
            size="small"
            value={filter.value ? dayjs(filter.value) : null}
            onChange={(date) => handleUpdateFilter(filter.id, {
              value: date ? date.format('YYYY-MM-DD') : null
            })}
            style={{ width: 130 }}
          />
        );
      case 'checkbox':
        return (
          <Select
            size="small"
            value={filter.value}
            onChange={(val) => handleUpdateFilter(filter.id, { value: val })}
            style={{ width: 80 }}
            options={[
              { value: true, label: '是' },
              { value: false, label: '否' },
            ]}
          />
        );
      default:
        return (
          <Input
            size="small"
            value={filter.value || ''}
            onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value })}
            placeholder="输入值"
            style={{ width: 120 }}
          />
        );
    }
  };

  const content = (
    <div className="w-[400px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">筛选条件</span>
        {filters.length > 0 && (
          <Button size="small" type="link" danger onClick={handleClearAll}>
            清空
          </Button>
        )}
      </div>

      {filters.length === 0 ? (
        <div className="text-gray-400 text-sm py-4 text-center">
          暂无筛选条件
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filters.map((filter, index) => {
            const property = properties.find(p => p.id === filter.propertyId);
            const operators = getOperators(property?.type);

            return (
              <div key={filter.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                {index > 0 && (
                  <span className="text-xs text-gray-400 w-6">且</span>
                )}
                {index === 0 && <span className="w-6" />}

                <Select
                  size="small"
                  value={filter.propertyId}
                  onChange={(val) => {
                    const newProp = properties.find(p => p.id === val);
                    const newOperators = getOperators(newProp?.type);
                    handleUpdateFilter(filter.id, {
                      propertyId: val,
                      operator: newOperators[0]?.value || 'equals',
                      value: '',
                    });
                  }}
                  style={{ width: 100 }}
                  options={properties.map(p => ({ value: p.id, label: p.name }))}
                />

                <Select
                  size="small"
                  value={filter.operator}
                  onChange={(val) => handleUpdateFilter(filter.id, { operator: val })}
                  style={{ width: 100 }}
                  options={operators}
                />

                {renderValueInput(filter, property)}

                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteFilter(filter.id)}
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
        onClick={handleAddFilter}
        className="w-full mt-3"
      >
        添加筛选条件
      </Button>
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
        icon={<FilterOutlined />}
        type={filters.length > 0 ? 'primary' : 'text'}
      >
        筛选
        {filters.length > 0 && (
          <Tag className="ml-1" color="blue">{filters.length}</Tag>
        )}
      </Button>
    </Popover>
  );
};

export default FilterBuilder;
