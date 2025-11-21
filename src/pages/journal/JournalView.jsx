import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, DatePicker, Spin } from 'antd';
import { CalendarOutlined, UpOutlined } from '@ant-design/icons';
import JournalEntry from './JournalEntry';
import { formatDate } from './dateUtils';
import { electronAPI } from '../../utils/electronAPI';
import './journalView.less';

const JOURNALS_PER_PAGE = 10;

/**
 * 日记视图组件 - 无限滚动时间轴
 */
const JournalView = () => {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const timelineRef = useRef(null);
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  // 加载日记列表
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
      console.error('[JournalView] 加载日记列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, offset]);

  // 初始加载
  useEffect(() => {
    loadJournals(true);
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

  // 跳转到今天
  const goToToday = () => {
    if (timelineRef.current) {
      timelineRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // 不重新加载，避免覆盖正在编辑的内容
  };

  // 跳转到指定日期
  const jumpToDate = async (date) => {
    if (!date) return;

    const targetDate = formatDate(date.toDate());

    // 检查日记是否存在
    const exists = await electronAPI.journalExists(targetDate);

    if (!exists) {
      // 创建该日期的日记
      await electronAPI.createJournal(targetDate);
    }

    // 重新加载日记列表
    loadJournals(true);

    // 滚动到目标日记
    setTimeout(() => {
      const targetElement = document.querySelector(`[data-journal-id="${targetDate}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  };

  // 更新日记内容
  const handleJournalUpdate = (journalId, newContent) => {
    console.log('[JournalView] 日记已更新:', journalId);
  };

  return (
    <div className="journal-view">
      <div className="journal-header">
        <div className="journal-title">
          <CalendarOutlined style={{ fontSize: '24px', marginRight: '12px' }} />
          <h1>日记</h1>
        </div>
        <div className="journal-nav">
          <Button
            type="primary"
            icon={<UpOutlined />}
            onClick={goToToday}
            style={{ marginRight: '12px' }}
          >
            今天
          </Button>
          <DatePicker
            onChange={jumpToDate}
            placeholder="跳转到日期"
            allowClear
            format="YYYY-MM-DD"
          />
        </div>
      </div>

      <div className="journal-timeline" ref={timelineRef}>
        {journals.map((journal) => (
          <div
            key={journal.id}
            data-journal-id={journal.id}
            className="journal-wrapper"
          >
            <JournalEntry
              journal={journal}
              onUpdate={handleJournalUpdate}
            />
          </div>
        ))}

        {/* 加载更多触发器 */}
        {hasMore && (
          <div ref={loadMoreRef} className="load-more-trigger">
            {loading && (
              <div className="loading-indicator">
                <Spin tip="加载更多日记..." />
              </div>
            )}
          </div>
        )}

        {/* 没有更多日记 */}
        {!hasMore && journals.length > 0 && (
          <div className="no-more">
            <p>已经到底了，共 {journals.length} 篇日记</p>
          </div>
        )}

        {/* 空状态 */}
        {!loading && journals.length === 0 && (
          <div className="empty-state">
            <CalendarOutlined style={{ fontSize: '64px', color: '#ccc' }} />
            <p>还没有日记</p>
            <Button type="primary" onClick={() => electronAPI.createJournal()}>
              创建今日日记
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalView;
