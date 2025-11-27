import React, { useState, useRef, useEffect } from 'react';
import { Input, InputNumber, Select, DatePicker, Checkbox, Tag } from 'antd';
import dayjs from 'dayjs';

/**
 * PropertyCell - 数据库单元格渲染组件
 * 根据属性类型渲染不同的编辑器
 */
const PropertyCell = ({ property, value, onChange, readonly = false }) => {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus?.();
    }
  }, [editing]);

  const handleSave = () => {
    setEditing(false);
    if (tempValue !== value) {
      onChange(tempValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && property.type !== 'text') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setTempValue(value);
      setEditing(false);
    }
  };

  // 文本类型
  if (property.type === 'text') {
    if (editing && !readonly) {
      return (
        <Input
          ref={inputRef}
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full border-none shadow-none bg-transparent"
          size="small"
        />
      );
    }
    return (
      <div
        className="px-2 py-1 min-h-[28px] cursor-text truncate"
        onClick={() => !readonly && setEditing(true)}
      >
        {value || <span className="text-gray-400">空</span>}
      </div>
    );
  }

  // 数字类型
  if (property.type === 'number') {
    if (editing && !readonly) {
      return (
        <InputNumber
          ref={inputRef}
          value={tempValue}
          onChange={setTempValue}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full"
          size="small"
        />
      );
    }
    return (
      <div
        className="px-2 py-1 min-h-[28px] cursor-text"
        onClick={() => !readonly && setEditing(true)}
      >
        {value !== undefined && value !== null ? value : <span className="text-gray-400">空</span>}
      </div>
    );
  }

  // 单选类型
  if (property.type === 'select') {
    const options = property.options || [];
    const colors = ['blue', 'green', 'orange', 'red', 'purple', 'cyan', 'magenta'];

    if (editing && !readonly) {
      return (
        <Select
          ref={inputRef}
          value={tempValue}
          onChange={(val) => {
            setTempValue(val);
            onChange(val);
            setEditing(false);
          }}
          onBlur={() => setEditing(false)}
          className="w-full"
          size="small"
          open={true}
          autoFocus
          allowClear
          options={options.map((opt, idx) => ({
            value: opt,
            label: <Tag color={colors[idx % colors.length]}>{opt}</Tag>
          }))}
          dropdownRender={(menu) => (
            <div>
              {menu}
            </div>
          )}
        />
      );
    }
    return (
      <div
        className="px-2 py-1 min-h-[28px] cursor-pointer"
        onClick={() => !readonly && setEditing(true)}
      >
        {value ? (
          <Tag color={colors[options.indexOf(value) % colors.length]}>{value}</Tag>
        ) : (
          <span className="text-gray-400">选择...</span>
        )}
      </div>
    );
  }

  // 多选类型
  if (property.type === 'multi_select') {
    const options = property.options || [];
    const colors = ['blue', 'green', 'orange', 'red', 'purple', 'cyan', 'magenta'];
    const currentValues = Array.isArray(value) ? value : [];

    if (editing && !readonly) {
      return (
        <Select
          ref={inputRef}
          mode="multiple"
          value={currentValues}
          onChange={(val) => {
            setTempValue(val);
            onChange(val);
          }}
          onBlur={() => setEditing(false)}
          className="w-full"
          size="small"
          open={true}
          autoFocus
          options={options.map((opt, idx) => ({
            value: opt,
            label: <Tag color={colors[idx % colors.length]}>{opt}</Tag>
          }))}
        />
      );
    }
    return (
      <div
        className="px-2 py-1 min-h-[28px] cursor-pointer flex flex-wrap gap-1"
        onClick={() => !readonly && setEditing(true)}
      >
        {currentValues.length > 0 ? (
          currentValues.map((v, idx) => (
            <Tag key={v} color={colors[options.indexOf(v) % colors.length]}>{v}</Tag>
          ))
        ) : (
          <span className="text-gray-400">选择...</span>
        )}
      </div>
    );
  }

  // 日期类型
  if (property.type === 'date') {
    if (editing && !readonly) {
      return (
        <DatePicker
          ref={inputRef}
          value={tempValue ? dayjs(tempValue) : null}
          onChange={(date) => {
            const dateStr = date ? date.format('YYYY-MM-DD') : null;
            setTempValue(dateStr);
            onChange(dateStr);
            setEditing(false);
          }}
          onBlur={() => setEditing(false)}
          className="w-full"
          size="small"
          open={true}
          autoFocus
        />
      );
    }
    return (
      <div
        className="px-2 py-1 min-h-[28px] cursor-pointer"
        onClick={() => !readonly && setEditing(true)}
      >
        {value ? dayjs(value).format('YYYY-MM-DD') : <span className="text-gray-400">选择日期...</span>}
      </div>
    );
  }

  // 复选框类型
  if (property.type === 'checkbox') {
    return (
      <div className="px-2 py-1 min-h-[28px] flex items-center">
        <Checkbox
          checked={!!value}
          onChange={(e) => !readonly && onChange(e.target.checked)}
          disabled={readonly}
        />
      </div>
    );
  }

  // URL 类型
  if (property.type === 'url') {
    if (editing && !readonly) {
      return (
        <Input
          ref={inputRef}
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full"
          size="small"
          placeholder="https://..."
        />
      );
    }
    return (
      <div
        className="px-2 py-1 min-h-[28px] cursor-text truncate"
        onClick={() => !readonly && setEditing(true)}
      >
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {value}
          </a>
        ) : (
          <span className="text-gray-400">添加链接...</span>
        )}
      </div>
    );
  }

  // 默认：文本显示
  return (
    <div className="px-2 py-1 min-h-[28px]">
      {value?.toString() || ''}
    </div>
  );
};

export default PropertyCell;
