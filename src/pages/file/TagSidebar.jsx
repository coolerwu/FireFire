import React, { useEffect, useState } from 'react';
import { Tag, Empty, Spin, Space, Typography } from 'antd';
import { TagsOutlined, ReloadOutlined } from '@ant-design/icons';
import { electronAPI } from '../../utils/electronAPI';
import './TagSidebar.less';

const { Title, Text } = Typography;

/**
 * TagSidebar - 标签侧边栏组件
 * 显示所有标签列表，点击标签可以筛选相关笔记
 */
const TagSidebar = ({ onTagClick, selectedTag }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // 加载所有标签
  const loadTags = async () => {
    setLoading(true);
    try {
      const tagList = await electronAPI.getAllTags();
      setTags(tagList);
    } catch (error) {
      console.error('[TagSidebar] 加载标签失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化时加载标签
  useEffect(() => {
    loadTags();
  }, []);

  // 刷新索引
  const handleRebuildIndex = async () => {
    setLoading(true);
    try {
      await electronAPI.rebuildIndex();
      await loadTags();
    } catch (error) {
      console.error('[TagSidebar] 重建索引失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="tag-sidebar-loading">
        <Spin tip="加载标签中..." />
      </div>
    );
  }

  return (
    <div className="tag-sidebar">
      <div className="tag-sidebar-header">
        <Space>
          <TagsOutlined />
          <Title level={5} style={{ margin: 0 }}>标签</Title>
        </Space>
        <ReloadOutlined
          className="tag-sidebar-refresh"
          onClick={handleRebuildIndex}
          title="重建索引"
        />
      </div>

      <div className="tag-sidebar-content">
        {tags.length === 0 ? (
          <Empty
            description="暂无标签"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="tag-list">
            <div
              className={`tag-item ${!selectedTag ? 'active' : ''}`}
              onClick={() => onTagClick(null)}
            >
              <Text>全部笔记</Text>
              <span className="tag-count">
                {tags.reduce((sum, tag) => sum + tag.count, 0)}
              </span>
            </div>

            {tags.map(tag => (
              <div
                key={tag.name}
                className={`tag-item ${selectedTag === tag.name ? 'active' : ''}`}
                onClick={() => onTagClick(tag.name)}
              >
                <Tag color="blue">#{tag.name}</Tag>
                <span className="tag-count">{tag.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagSidebar;
