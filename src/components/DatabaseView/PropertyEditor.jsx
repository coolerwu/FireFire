import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, Space, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, HolderOutlined } from '@ant-design/icons';

/**
 * PropertyEditor - 属性配置弹窗
 * 用于编辑列名、类型、选项等
 */
const PropertyEditor = ({ property, visible, onClose, onSave, onDelete }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState('');

  // 属性类型选项
  const propertyTypes = [
    { value: 'text', label: '📝 文本', description: '单行文本' },
    { value: 'number', label: '🔢 数字', description: '数值类型' },
    { value: 'select', label: '📋 单选', description: '从选项中选择一个' },
    { value: 'multi_select', label: '📑 多选', description: '从选项中选择多个' },
    { value: 'date', label: '📅 日期', description: '日期选择' },
    { value: 'checkbox', label: '☑️ 复选框', description: '是/否' },
    { value: 'url', label: '🔗 URL', description: '网页链接' },
  ];

  useEffect(() => {
    if (property) {
      setName(property.name || '');
      setType(property.type || 'text');
      setOptions(property.options || []);
    }
  }, [property]);

  const handleSave = () => {
    if (!name.trim()) {
      message.warning('请输入属性名称');
      return;
    }

    const updates = {
      ...property,
      name: name.trim(),
      type,
    };

    // 只有选择类型才保存选项
    if (type === 'select' || type === 'multi_select') {
      updates.options = options;
    } else {
      delete updates.options;
    }

    onSave(updates);
    onClose();
  };

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    if (options.includes(newOption.trim())) {
      message.warning('选项已存在');
      return;
    }
    setOptions([...options, newOption.trim()]);
    setNewOption('');
  };

  const handleDeleteOption = (opt) => {
    setOptions(options.filter(o => o !== opt));
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    // 切换到非选择类型时清空选项
    if (newType !== 'select' && newType !== 'multi_select') {
      setOptions([]);
    }
    // 切换到选择类型时初始化默认选项
    if ((newType === 'select' || newType === 'multi_select') && options.length === 0) {
      setOptions(['选项1', '选项2', '选项3']);
    }
  };

  const isSelectType = type === 'select' || type === 'multi_select';
  const isTitleProperty = property?.id === 'title';

  return (
    <Modal
      title="编辑属性"
      open={visible}
      onCancel={onClose}
      footer={[
        !isTitleProperty && (
          <Popconfirm
            key="delete"
            title="确定要删除这个属性吗？"
            description="删除后，所有行的该属性值都会丢失"
            onConfirm={() => {
              onDelete(property.id);
              onClose();
            }}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger>
              删除属性
            </Button>
          </Popconfirm>
        ),
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          保存
        </Button>,
      ].filter(Boolean)}
      width={480}
    >
      <div className="space-y-4 py-2">
        {/* 属性名称 */}
        <div>
          <label className="block text-sm font-medium mb-1">属性名称</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入属性名称"
            disabled={isTitleProperty}
          />
          {isTitleProperty && (
            <div className="text-xs text-gray-400 mt-1">
              名称列不能修改
            </div>
          )}
        </div>

        {/* 属性类型 */}
        <div>
          <label className="block text-sm font-medium mb-1">属性类型</label>
          <Select
            value={type}
            onChange={handleTypeChange}
            className="w-full"
            disabled={isTitleProperty}
            options={propertyTypes.map(t => ({
              value: t.value,
              label: (
                <div className="flex items-center justify-between">
                  <span>{t.label}</span>
                  <span className="text-xs text-gray-400">{t.description}</span>
                </div>
              ),
            }))}
          />
          {isTitleProperty && (
            <div className="text-xs text-gray-400 mt-1">
              名称列类型不能修改
            </div>
          )}
        </div>

        {/* 选项管理（仅选择类型显示） */}
        {isSelectType && (
          <div>
            <label className="block text-sm font-medium mb-2">选项列表</label>
            <div className="space-y-2 mb-3 max-h-[200px] overflow-y-auto">
              {options.map((opt, index) => (
                <div
                  key={opt}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded group"
                >
                  <HolderOutlined className="text-gray-400 cursor-move" />
                  <Tag color={['blue', 'green', 'orange', 'red', 'purple', 'cyan', 'magenta'][index % 7]}>
                    {opt}
                  </Tag>
                  <div className="flex-1" />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteOption(opt)}
                    className="opacity-0 group-hover:opacity-100"
                  />
                </div>
              ))}
            </div>
            <Space.Compact className="w-full">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="输入新选项"
                onPressEnter={handleAddOption}
              />
              <Button
                icon={<PlusOutlined />}
                onClick={handleAddOption}
              >
                添加
              </Button>
            </Space.Compact>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PropertyEditor;
