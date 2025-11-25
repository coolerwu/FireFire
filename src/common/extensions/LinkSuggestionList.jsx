import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FileTextOutlined, LinkOutlined } from '@ant-design/icons';

/**
 * LinkSuggestionList - 内部链接自动补全列表
 * 当用户输入 [[ 时显示笔记建议列表
 * Notion 风格设计
 */
const LinkSuggestionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 重置选中索引当项目改变时
  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  // 选择项目
  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      props.command({
        target: item.id,
        label: item.title,
        exists: true,
      });
    }
  };

  // 键盘导航
  const onKeyDown = ({ event }) => {
    if (event.key === 'ArrowUp') {
      setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
      return true;
    }

    if (event.key === 'ArrowDown') {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
      return true;
    }

    if (event.key === 'Enter') {
      selectItem(selectedIndex);
      return true;
    }

    return false;
  };

  // 暴露给父组件
  useImperativeHandle(ref, () => ({
    onKeyDown,
  }));

  if (props.items.length === 0) {
    return (
      <div className="
        bg-notion-bg-primary dark:bg-notion-dark-bg-secondary
        rounded-lg shadow-lg
        border border-notion-border dark:border-notion-dark-border
        p-4 min-w-[280px] max-w-[400px]
      ">
        <div className="flex flex-col items-center gap-2 text-notion-text-tertiary dark:text-notion-dark-text-tertiary">
          <LinkOutlined className="text-xl opacity-50" />
          <span className="text-sm">没有找到匹配的笔记</span>
        </div>
      </div>
    );
  }

  return (
    <div className="
      bg-notion-bg-primary dark:bg-notion-dark-bg-secondary
      rounded-lg shadow-lg
      border border-notion-border dark:border-notion-dark-border
      max-h-80 overflow-y-auto
      p-1 min-w-[280px] max-w-[400px]
      scrollbar-thin scrollbar-track-transparent scrollbar-thumb-notion-border dark:scrollbar-thumb-notion-dark-border
    ">
      {props.items.map((item, index) => (
        <div
          key={item.id}
          className={`
            flex items-start gap-2.5 p-2.5 rounded-md cursor-pointer
            transition-colors duration-fast
            ${index === selectedIndex
              ? 'bg-notion-accent-blue/10 border-l-2 border-l-notion-accent-blue pl-2'
              : 'hover:bg-notion-bg-hover dark:hover:bg-notion-dark-bg-hover border-l-2 border-l-transparent'
            }
          `}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <FileTextOutlined className={`
            text-base mt-0.5 flex-shrink-0
            ${index === selectedIndex
              ? 'text-notion-accent-blue'
              : 'text-notion-text-tertiary dark:text-notion-dark-text-tertiary'
            }
          `} />
          <div className="flex-1 min-w-0">
            <div className={`
              text-sm font-medium truncate
              ${index === selectedIndex
                ? 'text-notion-accent-blue'
                : 'text-notion-text-primary dark:text-notion-dark-text-primary'
              }
            `}>
              {item.title}
            </div>
            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {item.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="
                      text-[10px] px-1.5 py-0.5 rounded
                      bg-notion-accent-blue/10 text-notion-accent-blue
                    "
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

LinkSuggestionList.displayName = 'LinkSuggestionList';

export default LinkSuggestionList;
