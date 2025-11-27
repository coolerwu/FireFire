import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Card, Input, Empty, Spin, message, Tabs, Tooltip, Popconfirm } from 'antd';
import { FileAddOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { electronAPI } from '../utils/electronAPI';

/**
 * 模板选择器组件
 * 在新建笔记时选择模板
 */
const TemplateSelector = ({ visible, onClose, onSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // 加载模板列表
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await electronAPI.getAllTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.error('加载模板失败:', err);
      message.error('加载模板失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadTemplates();
    }
  }, [visible, loadTemplates]);

  // 选择模板
  const handleSelect = async (template) => {
    try {
      const content = await electronAPI.applyTemplate(template.id, {});
      if (onSelect) {
        onSelect(content, template.name);
      }
      onClose();
    } catch (err) {
      console.error('应用模板失败:', err);
      message.error('应用模板失败');
    }
  };

  // 删除用户模板
  const handleDelete = async (template, e) => {
    e.stopPropagation();
    try {
      await electronAPI.deleteTemplate(template.id);
      message.success('模板已删除');
      loadTemplates();
    } catch (err) {
      console.error('删除模板失败:', err);
      message.error('删除模板失败');
    }
  };

  // 过滤模板
  const filteredTemplates = templates.filter((t) => {
    const matchSearch = !searchText ||
      t.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchText.toLowerCase()));

    if (activeTab === 'all') return matchSearch;
    if (activeTab === 'builtin') return matchSearch && t.isBuiltin;
    if (activeTab === 'user') return matchSearch && !t.isBuiltin;
    return matchSearch;
  });

  // 按类型分组
  const builtinTemplates = filteredTemplates.filter((t) => t.isBuiltin);
  const userTemplates = filteredTemplates.filter((t) => !t.isBuiltin);

  const renderTemplateCard = (template) => (
    <Card
      key={template.id}
      className="template-card cursor-pointer hover:shadow-md hover:border-green-400 transition-all"
      size="small"
      onClick={() => handleSelect(template)}
      styles={{ body: { padding: '12px' } }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{template.icon || '📄'}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{template.name}</div>
          <div className="text-xs text-gray-500 truncate mt-1">
            {template.description || '无描述'}
          </div>
        </div>
        {!template.isBuiltin && (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Popconfirm
              title="确定删除此模板吗？"
              onConfirm={(e) => handleDelete(template, e)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除">
                <DeleteOutlined className="text-gray-400 hover:text-red-500 cursor-pointer" />
              </Tooltip>
            </Popconfirm>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FileAddOutlined />
          <span>选择模板</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      className="template-selector-modal"
    >
      {/* 搜索框 */}
      <Input
        placeholder="搜索模板..."
        prefix={<SearchOutlined className="text-gray-400" />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="mb-4"
        allowClear
      />

      {/* 标签页 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'all', label: `全部 (${templates.length})` },
          { key: 'builtin', label: `内置 (${templates.filter((t) => t.isBuiltin).length})` },
          { key: 'user', label: `自定义 (${templates.filter((t) => !t.isBuiltin).length})` },
        ]}
        size="small"
        className="mb-4"
      />

      {/* 模板列表 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spin tip="加载中..." />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Empty
          description={searchText ? '未找到匹配的模板' : '暂无模板'}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div className="template-grid max-h-96 overflow-auto">
          {activeTab === 'all' && (
            <>
              {builtinTemplates.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2 font-medium">内置模板</div>
                  <div className="grid grid-cols-2 gap-3">
                    {builtinTemplates.map(renderTemplateCard)}
                  </div>
                </div>
              )}
              {userTemplates.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2 font-medium">自定义模板</div>
                  <div className="grid grid-cols-2 gap-3">
                    {userTemplates.map(renderTemplateCard)}
                  </div>
                </div>
              )}
            </>
          )}
          {activeTab !== 'all' && (
            <div className="grid grid-cols-2 gap-3">
              {filteredTemplates.map(renderTemplateCard)}
            </div>
          )}
        </div>
      )}

      {/* 提示 */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span>💡</span>
          <span>点击模板即可创建笔记，在笔记菜单中可将当前笔记保存为模板</span>
        </div>
      </div>
    </Modal>
  );
};

export default TemplateSelector;
