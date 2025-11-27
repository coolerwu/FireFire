import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchOutlined, FileTextOutlined, CalendarOutlined } from '@ant-design/icons';
import { electronAPI } from '../../utils/electronAPI';
import { logger } from '../../utils/logger';

/**
 * 全局搜索模态框 - Notion/Raycast 风格
 */
const SearchModal = ({ visible, onClose, onSelectNote }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // 搜索函数
  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await electronAPI.searchNotes(searchQuery);
      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      logger.error('[SearchModal] 搜索失败:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  // 打开时聚焦输入框
  useEffect(() => {
    if (visible) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [visible]);

  // 选择笔记
  const handleSelect = useCallback((note) => {
    onSelectNote(note);
    onClose();
  }, [onSelectNote, onClose]);

  // 键盘导航
  const handleKeyDown = useCallback((e) => {
    if (!visible) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  }, [visible, results, selectedIndex, onClose, handleSelect]);

  // 滚动选中项到可见区域
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, results.length]);

  // 判断是否是日记
  const isJournal = (path) => path && path.startsWith('journals/');

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* 搜索框容器 */}
      <div
        className="
          relative w-full max-w-xl mx-4
          bg-white dark:bg-notion-dark-bg-primary
          rounded-xl shadow-2xl
          border border-notion-border dark:border-notion-dark-border
          overflow-hidden
        "
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* 搜索输入框 */}
        <div className="flex items-center px-4 py-3 border-b border-notion-border dark:border-notion-dark-border">
          <SearchOutlined className="text-notion-text-tertiary dark:text-notion-dark-text-tertiary mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索笔记..."
            className="
              flex-1 bg-transparent outline-none
              text-notion-text-primary dark:text-notion-dark-text-primary
              placeholder-notion-text-tertiary dark:placeholder-notion-dark-text-tertiary
              text-base
            "
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="
                text-notion-text-tertiary dark:text-notion-dark-text-tertiary
                hover:text-notion-text-primary dark:hover:text-notion-dark-text-primary
                text-sm px-2
              "
            >
              清除
            </button>
          )}
        </div>

        {/* 搜索结果列表 */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto"
        >
          {loading && (
            <div className="px-4 py-8 text-center text-notion-text-tertiary dark:text-notion-dark-text-tertiary text-sm">
              搜索中...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-notion-text-tertiary dark:text-notion-dark-text-tertiary text-sm">
              未找到相关笔记
            </div>
          )}

          {!loading && results.map((note, index) => (
            <div
              key={note.id}
              onClick={() => handleSelect(note)}
              className={`
                flex items-center gap-3 px-4 py-3 cursor-pointer
                transition-colors duration-fast
                ${index === selectedIndex
                  ? 'bg-notion-bg-selected dark:bg-notion-dark-bg-selected'
                  : 'hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover'
                }
              `}
            >
              {isJournal(note.path) ? (
                <CalendarOutlined className="text-notion-text-tertiary dark:text-notion-dark-text-tertiary flex-shrink-0" />
              ) : (
                <FileTextOutlined className="text-notion-text-tertiary dark:text-notion-dark-text-tertiary flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary truncate">
                  {note.title || '无标题'}
                </div>
                <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary truncate">
                  {note.path}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2 border-t border-notion-border dark:border-notion-dark-border bg-notion-bg-secondary dark:bg-notion-dark-bg-secondary">
          <div className="flex items-center gap-4 text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
            <span>
              <kbd className="px-1.5 py-0.5 bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary rounded text-[10px]">↑↓</kbd>
              {' '}导航
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary rounded text-[10px]">Enter</kbd>
              {' '}打开
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary rounded text-[10px]">Esc</kbd>
              {' '}关闭
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
