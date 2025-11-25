import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { TagsOutlined, ReloadOutlined } from '@ant-design/icons';
import { electronAPI } from '../../utils/electronAPI';
import { logger } from '../../utils/logger';

/**
 * TagSidebar - 标签侧边栏组件
 * 显示所有标签列表，点击标签可以筛选相关笔记
 * Notion 风格设计
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
      logger.error('[TagSidebar] 加载标签失败:', error);
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
      logger.error('[TagSidebar] 重建索引失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
        <div className="flex flex-col items-center gap-2 text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
          <Spin />
          <span className="text-xs">加载标签中...</span>
        </div>
      </div>
    );
  }

  const totalCount = tags.reduce((sum, tag) => sum + tag.count, 0);

  return (
    <div className="h-full flex flex-col bg-notion-bg-primary dark:bg-notion-dark-bg-primary border-r border-notion-border dark:border-notion-dark-border">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-notion-border dark:border-notion-dark-border">
        <div className="flex items-center gap-2 text-notion-text-primary dark:text-notion-dark-text-primary">
          <TagsOutlined className="text-notion-accent-blue" />
          <span className="text-sm font-semibold">标签</span>
        </div>
        <button
          onClick={handleRebuildIndex}
          className="
            p-1.5 rounded-md
            text-notion-text-tertiary dark:text-notion-dark-text-tertiary
            hover:text-notion-text-primary dark:hover:text-notion-dark-text-primary
            hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
            transition-colors duration-fast
          "
          title="重建索引"
        >
          <ReloadOutlined />
        </button>
      </div>

      {/* 标签列表 */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-notion-border dark:scrollbar-thumb-notion-dark-border">
        {tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
            <TagsOutlined className="text-3xl mb-2 opacity-30" />
            <span className="text-sm">暂无标签</span>
          </div>
        ) : (
          <div className="space-y-1">
            {/* 全部笔记 */}
            <button
              onClick={() => onTagClick(null)}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-md
                text-sm text-left
                transition-colors duration-fast
                ${!selectedTag
                  ? 'bg-notion-accent-blue/10 text-notion-accent-blue font-medium'
                  : 'text-notion-text-secondary dark:text-notion-dark-text-secondary hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover'
                }
              `}
            >
              <span>全部笔记</span>
              <span className={`
                text-xs px-2 py-0.5 rounded-full
                ${!selectedTag
                  ? 'bg-notion-accent-blue/20 text-notion-accent-blue'
                  : 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-tertiary dark:text-notion-dark-text-tertiary'
                }
              `}>
                {totalCount}
              </span>
            </button>

            {/* 分隔线 */}
            <div className="my-2 border-t border-notion-border/50 dark:border-notion-dark-border/50" />

            {/* 标签列表 */}
            {tags.map(tag => (
              <button
                key={tag.name}
                onClick={() => onTagClick(tag.name)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-md
                  text-sm text-left
                  transition-colors duration-fast
                  ${selectedTag === tag.name
                    ? 'bg-notion-accent-blue/10 text-notion-accent-blue font-medium'
                    : 'text-notion-text-secondary dark:text-notion-dark-text-secondary hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover'
                  }
                `}
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-notion-accent-blue">#</span>
                  {tag.name}
                </span>
                <span className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${selectedTag === tag.name
                    ? 'bg-notion-accent-blue/20 text-notion-accent-blue'
                    : 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary text-notion-text-tertiary dark:text-notion-dark-text-tertiary'
                  }
                `}>
                  {tag.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagSidebar;
