import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Spin, Modal, message } from 'antd';
import { ClockCircleOutlined, FileTextOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { noteService } from '@/services';
import { logger } from '@/utils/logger';
import { formatDateCN, getWeekday } from '@/utils/dateUtils';
import Markdown from '../file/markdown';
import { Context } from '../../index';

// 格式化显示日期（兼容 Date 对象）
const formatDisplayDate = (date) => `${formatDateCN(date)} ${getWeekday(date)}`;

const ARTICLES_PER_PAGE = 20;

/**
 * 时间线视图 - 左右分栏布局
 * 左侧：文章列表
 * 右侧：编辑器
 */
const TimelineView = () => {
  const { setting, refreshKey } = useContext(Context);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const timelineRef = useRef(null);
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);
  const refreshKeyRef = useRef(refreshKey);

  const loadArticles = useCallback(async (reset = false) => {
    if (loading) return;

    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;

      const newArticles = await noteService.getRecent(ARTICLES_PER_PAGE, currentOffset);

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

  // 监听 refreshKey 变化，刷新列表（跳过初始渲染）
  useEffect(() => {
    if (refreshKeyRef.current !== refreshKey) {
      refreshKeyRef.current = refreshKey;
      logger.debug('[TimelineView] refreshKey 变化，重新加载列表');
      loadArticles(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

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
    logger.debug('[TimelineView] 打开文章:', article.id, article.title, article.path);

    // article.path 可能是绝对路径或相对路径
    // 绝对路径如: "/Users/wulang/Desktop/personal/notebook/1764430902053.md"
    // 相对路径如: "notebook/1764430902053.md"
    const articlePath = article.path || '';

    // 从 path 中提取文件名（不含后缀）
    const lastSlashIndex = articlePath.lastIndexOf('/');
    const fullFileName = lastSlashIndex >= 0 ? articlePath.substring(lastSlashIndex + 1) : articlePath;
    const lastDotIndex = fullFileName.lastIndexOf('.');
    const fileNameFromPath = lastDotIndex > 0 ? fullFileName.substring(0, lastDotIndex) : (fullFileName || article.id);
    const actualSuffix = lastDotIndex > 0 ? fullFileName.substring(lastDotIndex) : (setting?.notebookSuffix || '.md');

    // 构建笔记对象
    // id 使用文件名作为标题（类似 Obsidian）
    // filename 只用文件名，readNotebookFile 会基于 notebook 目录解析路径
    const noteInfo = {
      id: fileNameFromPath,  // 使用文件名作为标题
      fileId: fileNameFromPath,  // 实际文件名（不含后缀），用于重命名操作
      filename: fileNameFromPath + actualSuffix,  // 只用文件名，如 "dassad.md"
      type: 'file',
      notebookPath: articlePath,
      attachmentPath: `attachment/${fileNameFromPath}`,
    };

    setSelectedArticle(noteInfo);
  };

  // 删除文章
  const handleDelete = (e, article) => {
    e.stopPropagation();

    // 从 path 提取文件名
    const articlePath = article.path || '';
    const lastSlash = articlePath.lastIndexOf('/');
    const fullFileName = lastSlash >= 0 ? articlePath.substring(lastSlash + 1) : articlePath;
    const lastDot = fullFileName.lastIndexOf('.');
    const displayName = lastDot > 0 ? fullFileName.substring(0, lastDot) : (fullFileName || article.id);

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除笔记「${displayName}」吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await noteService.delete(article.id);
          message.success('删除成功');

          // 从列表中移除
          setArticles(prev => prev.filter(a => a.id !== article.id));

          // 如果删除的是当前选中的文章，清除选中状态
          if (selectedArticle?.notebookPath === article.path) {
            setSelectedArticle(null);
          }
        } catch (error) {
          logger.error('[TimelineView] 删除笔记失败:', error);
          message.error('删除失败: ' + error.message);
        }
      },
    });
  };

  // 编辑按钮（直接打开）
  const handleEdit = (e, article) => {
    e.stopPropagation();
    openArticle(article);
  };

  return (
    <div className="h-full flex bg-notion-bg-primary dark:bg-notion-dark-bg-primary">
      {/* 左侧：文章列表 */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-notion-border dark:border-notion-dark-border">
        {/* 页面头部 */}
        <div className="flex-shrink-0 px-4 py-4 border-b border-notion-border dark:border-notion-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-notion-accent-purple/10 flex items-center justify-center">
              <ClockCircleOutlined className="text-lg text-notion-accent-purple" />
            </div>
            <div>
              <h1 className="text-base font-bold text-notion-text-primary dark:text-notion-dark-text-primary">
                时间线
              </h1>
              <p className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                {articles.length} 篇笔记
              </p>
            </div>
          </div>
        </div>

        {/* 时间线内容 */}
        <div className="flex-1 overflow-y-auto" ref={timelineRef}>
          <div className="px-2 py-2">
            {articles.map((article, index) => {
              const updateDate = new Date(article.updatedAt);
              const prevArticle = articles[index - 1];
              const prevDate = prevArticle ? new Date(prevArticle.updatedAt) : null;

              // 检查是否需要显示日期分隔
              const showDateDivider = !prevDate ||
                updateDate.toDateString() !== prevDate.toDateString();

              // 使用 path 比较选中状态，因为 selectedArticle.id 是文件名，article.id 是数据库 ID
              const isSelected = selectedArticle?.notebookPath === article.path;

              // 从 path 提取文件名作为显示标题（类似 Obsidian）
              const articlePath = article.path || '';
              const lastSlash = articlePath.lastIndexOf('/');
              const fullFileName = lastSlash >= 0 ? articlePath.substring(lastSlash + 1) : articlePath;
              const lastDot = fullFileName.lastIndexOf('.');
              const displayTitle = lastDot > 0 ? fullFileName.substring(0, lastDot) : (fullFileName || article.id);

              return (
                <React.Fragment key={article.id}>
                  {/* 日期分隔 */}
                  {showDateDivider && (
                    <div className="flex items-center gap-2 px-2 py-2 mt-2 first:mt-0">
                      <div className="text-xs font-semibold text-notion-text-secondary dark:text-notion-dark-text-secondary">
                        {formatDisplayDate(updateDate)}
                      </div>
                      <div className="flex-1 h-px bg-notion-border dark:bg-notion-dark-border" />
                    </div>
                  )}

                  {/* 文章卡片 */}
                  <div
                    onClick={() => openArticle(article)}
                    className={`
                      group p-3 mb-1 rounded-lg cursor-pointer
                      transition-all duration-fast
                      ${isSelected
                        ? 'bg-notion-bg-selected dark:bg-notion-dark-bg-selected border border-notion-accent-blue/30'
                        : 'hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`
                        flex-shrink-0 w-6 h-6 rounded flex items-center justify-center
                        ${isSelected
                          ? 'bg-notion-accent-blue/20'
                          : 'bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary group-hover:bg-notion-bg-selected dark:group-hover:bg-notion-dark-bg-selected'
                        }
                        transition-colors
                      `}>
                        <FileTextOutlined className={`text-xs ${isSelected ? 'text-notion-accent-blue' : 'text-notion-text-tertiary dark:text-notion-dark-text-tertiary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-medium truncate ${isSelected ? 'text-notion-accent-blue' : 'text-notion-text-primary dark:text-notion-dark-text-primary'}`}>
                          {displayTitle}
                        </h3>
                        <div className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary mt-0.5">
                          {updateDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleEdit(e, article)}
                          className="p-1 rounded hover:bg-notion-accent-blue/20 text-notion-text-tertiary hover:text-notion-accent-blue transition-colors"
                          title="编辑"
                        >
                          <EditOutlined className="text-xs" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, article)}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-notion-text-tertiary hover:text-red-500 transition-colors"
                          title="删除"
                        >
                          <DeleteOutlined className="text-xs" />
                        </button>
                      </div>
                    </div>

                    {/* 标签 */}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 ml-8">
                        {article.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-1.5 py-0.5 rounded text-xs bg-notion-accent-blue/10 text-notion-accent-blue"
                          >
                            #{tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="text-xs text-notion-text-tertiary">+{article.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}

            {/* 加载更多 */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                {loading && (
                  <div className="flex items-center gap-2 text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                    <Spin size="small" />
                    <span className="text-xs">加载中...</span>
                  </div>
                )}
              </div>
            )}

            {/* 到底了 */}
            {!hasMore && articles.length > 0 && (
              <div className="py-4 text-center">
                <span className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                  已加载全部
                </span>
              </div>
            )}

            {/* 空状态 */}
            {!loading && articles.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary flex items-center justify-center mb-3">
                  <ClockCircleOutlined className="text-2xl text-notion-text-tertiary dark:text-notion-dark-text-tertiary" />
                </div>
                <h3 className="text-sm font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-1">
                  还没有笔记
                </h3>
                <p className="text-xs text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                  点击「新建笔记」开始
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧：编辑器 */}
      <div className="flex-1 h-full overflow-hidden">
        {selectedArticle ? (
          <Markdown cwjson={selectedArticle} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-notion-bg-tertiary dark:bg-notion-dark-bg-tertiary flex items-center justify-center mb-4">
                <FileTextOutlined className="text-3xl text-notion-text-tertiary dark:text-notion-dark-text-tertiary" />
              </div>
              <h3 className="text-lg font-medium text-notion-text-primary dark:text-notion-dark-text-primary mb-2">
                选择一篇笔记
              </h3>
              <p className="text-sm text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
                从左侧列表选择笔记开始编辑
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;
