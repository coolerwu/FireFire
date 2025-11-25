import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DatePicker, Spin } from 'antd';
import { CalendarOutlined, UpOutlined, PlusOutlined } from '@ant-design/icons';
import JournalEntry from './JournalEntry';
import { formatDate } from './dateUtils';
import { electronAPI } from '../../utils/electronAPI';
import { logger } from '../../utils/logger';

const JOURNALS_PER_PAGE = 10;

/**
 * 日记视图组件 - Notion 风格无限滚动时间轴
 */
const JournalView = () => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const timelineRef = useRef(null);
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  const loadJournals = useCallback(async (reset = false) => {
    if (loading) return;

    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;

      const newJournals = await electronAPI.getJournals(JOURNALS_PER_PAGE, currentOffset);

      if (reset) {
        setJournals(newJournals);
      } else {
        setJournals(prev => [...prev, ...newJournals]);
      }

      setHasMore(newJournals.length === JOURNALS_PER_PAGE);
      setOffset(currentOffset + newJournals.length);
    } catch (error) {
      logger.error('[JournalView] 加载日记列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, offset]);

  useEffect(() => {
    loadJournals(true);
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
        loadJournals(false);
      }
    }, options);

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadJournals]);

  const goToToday = () => {
    if (timelineRef.current) {
      timelineRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const jumpToDate = async (date) => {
    if (!date) return;

    const targetDate = formatDate(date.toDate());
    const exists = await electronAPI.journalExists(targetDate);

    if (!exists) {
      await electronAPI.createJournal(targetDate);
    }

    loadJournals(true);

    setTimeout(() => {
      const targetElement = document.querySelector(`[data-journal-id="${targetDate}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  };

  const handleJournalUpdate = (journalId, newContent) => {
    logger.debug('[JournalView] 日记已更新:', journalId);
  };

  const handleCreateToday = async () => {
    await electronAPI.createJournal();
    loadJournals(true);
  };

  return (
    <div className="h-full flex flex-col bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
      {/* 页面头部 */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-notion-border dark:border-notion-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-notion-accent-orange/10 flex items-center justify-center">
              <CalendarOutlined className="text-xl text-notion-accent-orange" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-notion-text-primary dark:text-notion-dark-text-primary">
                日记
              </h1>
              <p className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                记录每一天的想法
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={goToToday}
              className="
                flex items-center gap-2 px-3 py-1.5 rounded-md
                text-sm font-medium
                text-notion-text-secondary dark:text-notion-dark-text-secondary
                hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                transition-colors duration-fast
              "
            >
              <UpOutlined className="text-xs" />
              返回今天
            </button>
            <DatePicker
              onChange={jumpToDate}
              placeholder="跳转日期"
              allowClear
              format="YYYY-MM-DD"
              className="w-36"
            />
          </div>
        </div>
      </div>

      {/* 日记时间线 */}
      <div className="flex-1 overflow-y-auto" ref={timelineRef}>
        <div className="max-w-3xl mx-auto px-8 py-6">
          {journals.map((journal) => (
            <div
              key={journal.id}
              data-journal-id={journal.id}
              className="mb-6"
            >
              <JournalEntry
                journal={journal}
                onUpdate={handleJournalUpdate}
              />
            </div>
          ))}

          {/* 加载更多 */}
          {hasMore && (
            <div ref={loadMoreRef} className="py-8 flex justify-center">
              {loading && (
                <div className="flex items-center gap-3 text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                  <Spin size="small" />
                  <span className="text-sm">加载更多日记...</span>
                </div>
              )}
            </div>
          )}

          {/* 到底了 */}
          {!hasMore && journals.length > 0 && (
            <div className="py-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary">
                <span className="text-sm text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                  已加载全部 {journals.length} 篇日记
                </span>
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!loading && journals.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary flex items-center justify-center mb-4">
                <CalendarOutlined className="text-3xl text-notion-text-tertiary dark:text-notion-dark-text-tertiary" />
              </div>
              <h3 className="text-lg font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                还没有日记
              </h3>
              <p className="text-sm text-notion-text-tertiary dark:text-notion-dark-text-tertiary mb-6">
                开始记录你的第一篇日记吧
              </p>
              <button
                onClick={handleCreateToday}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-md
                  bg-notion-accent-blue text-white
                  text-sm font-medium
                  hover:opacity-90
                  transition-opacity duration-fast
                "
              >
                <PlusOutlined />
                创建今日日记
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalView;
