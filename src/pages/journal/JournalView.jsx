import React, { useState, useEffect, useRef, useContext } from 'react';
import { DatePicker, Spin } from 'antd';
import { UpOutlined, PlusOutlined } from '@ant-design/icons';
import JournalEntry from './JournalEntry';
import { formatDate } from './dateUtils';
import { electronAPI } from '../../utils/electronAPI';
import { logger } from '../../utils/logger';
import { Context } from '../../index';

const JOURNALS_PER_PAGE = 10;

/**
 * 日记视图组件 - Notion 风格无限滚动时间轴
 */
const JournalView = () => {
  const { refreshKey } = useContext(Context);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const timelineRef = useRef(null);
  const loadMoreRef = useRef(null);
  const refreshKeyRef = useRef(refreshKey);

  // 使用单一 ref 对象管理所有可变状态，避免闭包问题
  const stateRef = useRef({
    loading: false,
    hasMore: true,
    offset: 0,
    initialized: false
  });

  // 加载日记的函数 - 不使用 useCallback，直接定义
  const loadJournals = async (reset = false) => {
    const state = stateRef.current;

    // 防止并发加载
    if (state.loading) {
      return;
    }

    try {
      state.loading = true;
      setLoading(true);

      const currentOffset = reset ? 0 : state.offset;
      logger.debug(`[JournalView] 加载日记: reset=${reset}, offset=${currentOffset}`);

      const newJournals = await electronAPI.getJournals(JOURNALS_PER_PAGE, currentOffset);

      if (reset) {
        setJournals(newJournals);
        state.offset = newJournals.length;
      } else {
        setJournals(prev => [...prev, ...newJournals]);
        state.offset = currentOffset + newJournals.length;
      }

      const more = newJournals.length === JOURNALS_PER_PAGE;
      state.hasMore = more;
      setHasMore(more);

      logger.debug(`[JournalView] 加载完成: count=${newJournals.length}, hasMore=${more}`);
    } catch (error) {
      logger.error('[JournalView] 加载日记列表失败:', error);
    } finally {
      state.loading = false;
      setLoading(false);
    }
  };

  // 初始加载 - 只执行一次
  useEffect(() => {
    const state = stateRef.current;
    if (!state.initialized) {
      state.initialized = true;
      loadJournals(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听 refreshKey 变化，刷新列表（跳过初始渲染）
  useEffect(() => {
    if (refreshKeyRef.current !== refreshKey) {
      refreshKeyRef.current = refreshKey;
      logger.debug('[JournalView] refreshKey 变化，重新加载列表');
      // 重置状态
      stateRef.current.offset = 0;
      stateRef.current.hasMore = true;
      loadJournals(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // IntersectionObserver 用于无限滚动 - 只设置一次
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const state = stateRef.current;

        // 只有当元素可见、还有更多内容、且不在加载中时才加载
        if (entry.isIntersecting && state.hasMore && !state.loading) {
          loadJournals(false);
        }
      },
      {
        root: timelineRef.current,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // 重置状态
    stateRef.current.offset = 0;
    stateRef.current.hasMore = true;
    await loadJournals(true);

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

  // 处理日记删除
  const handleJournalDelete = (journalId) => {
    setJournals(prev => prev.filter(j => j.id !== journalId));
    logger.debug('[JournalView] 日记已删除:', journalId);
  };

  const handleCreateToday = async () => {
    await electronAPI.createJournal();
    // 重置状态
    stateRef.current.offset = 0;
    stateRef.current.hasMore = true;
    await loadJournals(true);
  };

  return (
    <div className="h-full flex flex-col bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
      {/* 日记时间线 */}
      <div className="flex-1 overflow-y-auto" ref={timelineRef}>
        {/* 顶部工具栏 - 浮动在右上角 */}
        <div className="sticky top-0 z-10 flex items-center justify-end gap-2 px-6 py-3">
          <button
            onClick={goToToday}
            className="
              flex items-center gap-1.5 px-2.5 py-1 rounded-md
              text-xs font-medium
              text-notion-text-tertiary dark:text-notion-dark-text-tertiary
              hover:text-notion-text-primary dark:hover:text-notion-dark-text-primary
              hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
              transition-colors duration-fast
              bg-notion-bg-primary/80 dark:bg-notion-dark-bg-primary/80
              backdrop-blur-sm
            "
          >
            <UpOutlined className="text-[10px]" />
            今天
          </button>
          <DatePicker
            onChange={jumpToDate}
            placeholder="跳转"
            allowClear
            format="YYYY-MM-DD"
            size="small"
            className="w-28"
          />
        </div>

        <div className="max-w-2xl mx-auto px-6 pb-16">
          {journals.map((journal) => (
            <div
              key={journal.id}
              data-journal-id={journal.id}
            >
              <JournalEntry
                journal={journal}
                onUpdate={handleJournalUpdate}
                onDelete={handleJournalDelete}
              />
            </div>
          ))}

          {/* 加载更多触发器 */}
          <div
            ref={loadMoreRef}
            className="py-6 flex justify-center"
            style={{ display: hasMore ? 'flex' : 'none' }}
          >
            {loading && (
              <div className="flex items-center gap-2 text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                <Spin size="small" />
                <span className="text-xs">加载中...</span>
              </div>
            )}
          </div>

          {/* 到底了 - 简洁提示 */}
          {!hasMore && journals.length > 0 && (
            <div className="py-6 text-center">
              <span className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                - 已加载全部 -
              </span>
            </div>
          )}

          {/* 空状态 - 简洁风格 */}
          {!loading && journals.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center">
              <p className="text-sm text-notion-text-tertiary dark:text-notion-dark-text-tertiary mb-4">
                还没有日记
              </p>
              <button
                onClick={handleCreateToday}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md
                  text-sm font-medium
                  text-notion-text-secondary dark:text-notion-dark-text-secondary
                  hover:text-notion-text-primary dark:hover:text-notion-dark-text-primary
                  hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover
                  transition-colors duration-fast
                "
              >
                <PlusOutlined className="text-xs" />
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
