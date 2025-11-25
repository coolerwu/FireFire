import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Spin } from 'antd';
import { ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { electronAPI } from '../../utils/electronAPI';
import { logger } from '../../utils/logger';
import { formatDisplayDate, getRelativeDate } from '../journal/dateUtils';

const ARTICLES_PER_PAGE = 20;

/**
 * 时间线视图 - Notion 风格按编辑时间倒序展示
 */
const TimelineView = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const timelineRef = useRef(null);
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  const loadArticles = useCallback(async (reset = false) => {
    if (loading) return;

    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;

      const newArticles = await electronAPI.getRecentNotes(ARTICLES_PER_PAGE, currentOffset);

      if (reset) {
        setArticles(newArticles);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
      }

      setHasMore(newArticles.length === ARTICLES_PER_PAGE);
      setOffset(currentOffset + newArticles.length);
    } catch (error) {
      logger.error('[TimelineView] 加载文章列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, offset]);

  useEffect(() => {
    loadArticles(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const options = {
      root: timelineRef.current,
      rootMargin: '100px',
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        loadArticles(false);
      }
    }, options);

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadArticles]);

  const openArticle = (article) => {
    logger.debug('[TimelineView] 打开文章:', article.id);
  };

  return (
    <div className="h-full flex flex-col bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
      {/* 页面头部 */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-notion-border dark:border-notion-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-notion-accent-purple/10 flex items-center justify-center">
              <ClockCircleOutlined className="text-xl text-notion-accent-purple" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-notion-text-primary dark:text-notion-dark-text-primary">
                时间线
              </h1>
              <p className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                按时间浏览所有笔记
              </p>
            </div>
          </div>

          <div className="text-sm text-notion-text-secondary dark:text-notion-dark-text-secondary">
            共 {articles.length} 篇文章
          </div>
        </div>
      </div>

      {/* 时间线内容 */}
      <div className="flex-1 overflow-y-auto" ref={timelineRef}>
        <div className="max-w-3xl mx-auto px-8 py-6">
          {articles.map((article, index) => {
            const updateDate = new Date(article.updatedAt);
            const prevArticle = articles[index - 1];
            const prevDate = prevArticle ? new Date(prevArticle.updatedAt) : null;

            // 检查是否需要显示日期分隔
            const showDateDivider = !prevDate ||
              updateDate.toDateString() !== prevDate.toDateString();

            return (
              <React.Fragment key={article.id}>
                {/* 日期分隔 */}
                {showDateDivider && (
                  <div className="flex items-center gap-4 mb-4 mt-6 first:mt-0">
                    <div className="text-sm font-semibold text-notion-text-primary dark:text-notion-dark-text-primary">
                      {formatDisplayDate(updateDate)}
                    </div>
                    <div className="flex-1 h-px bg-notion-border dark:bg-notion-dark-border" />
                    <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                      {getRelativeDate(article.updatedAt.split('T')[0])}
                    </div>
                  </div>
                )}

                {/* 文章卡片 */}
                <div
                  onClick={() => openArticle(article)}
                  className="
                    group p-4 mb-2 rounded-lg cursor-pointer
                    border border-transparent
                    hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                    hover:border-notion-border dark:hover:border-notion-dark-border
                    transition-all duration-fast
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-md bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary flex items-center justify-center group-hover:bg-notion-bg-selected dark:group-hover:bg-notion-dark-bg-selected transition-colors">
                      <FileTextOutlined className="text-notion-text-tertiary dark:text-notion-dark-text-tertiary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary truncate">
                        {article.title}
                      </h3>
                      {article.path && (
                        <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-0.5 truncate">
                          {article.path}
                        </div>
                      )}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {article.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="
                                px-2 py-0.5 rounded text-xs
                                bg-notion-accent-blue/10 text-notion-accent-blue
                              "
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                      {updateDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* 加载更多 */}
          {hasMore && (
            <div ref={loadMoreRef} className="py-8 flex justify-center">
              {loading && (
                <div className="flex items-center gap-3 text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                  <Spin size="small" />
                  <span className="text-sm">加载更多文章...</span>
                </div>
              )}
            </div>
          )}

          {/* 到底了 */}
          {!hasMore && articles.length > 0 && (
            <div className="py-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary">
                <span className="text-sm text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                  已加载全部 {articles.length} 篇文章
                </span>
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!loading && articles.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary flex items-center justify-center mb-4">
                <ClockCircleOutlined className="text-3xl text-notion-text-tertiary dark:text-notion-dark-text-tertiary" />
              </div>
              <h3 className="text-lg font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                还没有文章
              </h3>
              <p className="text-sm text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                创建第一篇笔记开始记录
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
