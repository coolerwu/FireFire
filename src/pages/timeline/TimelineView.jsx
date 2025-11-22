import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Spin, Empty } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { electronAPI } from '../../utils/electronAPI';
import { logger } from '../../utils/logger';
import { formatDisplayDate, getRelativeDate } from '../journal/dateUtils';
import './timelineView.less';

const ARTICLES_PER_PAGE = 20;

/**
 * 时间线视图 - 按编辑时间倒序展示所有文章（无限滚动）
 */
const TimelineView = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const timelineRef = useRef(null);
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  // 加载文章列表
  const loadArticles = useCallback(async (reset = false) => {
    if (loading) return;

    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;

      // 从数据库获取文章列表，按更新时间倒序
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

  // 初始加载
  useEffect(() => {
    loadArticles(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 设置 IntersectionObserver 实现无限滚动
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

  // 打开文章
  const openArticle = (article) => {
    // TODO: 实现打开文章的逻辑
    logger.debug('[TimelineView] 打开文章:', article.id);
  };

  return (
    <div className="timeline-view">
      <div className="timeline-header">
        <div className="timeline-title">
          <ClockCircleOutlined style={{ fontSize: '24px', marginRight: '12px' }} />
          <h1>时间线</h1>
        </div>
        <div className="timeline-stats">
          共 {articles.length} 篇文章
        </div>
      </div>

      <div className="timeline-content" ref={timelineRef}>
        {articles.map((article) => {
          const updateDate = new Date(article.updatedAt);
          return (
            <div
              key={article.id}
              className="timeline-item"
              onClick={() => openArticle(article)}
            >
              <div className="timeline-item-date">
                <span className="date-display">{formatDisplayDate(updateDate)}</span>
                <span className="date-relative">{getRelativeDate(article.updatedAt.split('T')[0])}</span>
              </div>
              <div className="timeline-item-content">
                <h3 className="article-title">{article.title}</h3>
                {article.path && (
                  <div className="article-path">{article.path}</div>
                )}
                {article.tags && article.tags.length > 0 && (
                  <div className="article-tags">
                    {article.tags.map((tag, index) => (
                      <span key={index} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 加载更多触发器 */}
        {hasMore && (
          <div ref={loadMoreRef} className="load-more-trigger">
            {loading && (
              <div className="loading-indicator">
                <Spin tip="加载更多文章..." />
              </div>
            )}
          </div>
        )}

        {/* 没有更多文章 */}
        {!hasMore && articles.length > 0 && (
          <div className="no-more">
            <p>已加载全部 {articles.length} 篇文章</p>
          </div>
        )}

        {/* 空状态 */}
        {!loading && articles.length === 0 && (
          <div className="empty-state">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="还没有文章"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;
