import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FileTextOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import './LinkSuggestionList.less';

/**
 * LinkSuggestionList - 内部链接自动补全列表
 *
 * 当用户输入 [[ 时显示笔记建议列表
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
      <div className="link-suggestion-list">
        <div className="suggestion-empty">
          没有找到匹配的笔记
        </div>
      </div>
    );
  }

  return (
    <div className="link-suggestion-list">
      {props.items.map((item, index) => (
        <div
          key={item.id}
          className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <FileTextOutlined className="suggestion-icon" />
          <div className="suggestion-content">
            <div className="suggestion-title">{item.title}</div>
            {item.tags && item.tags.length > 0 && (
              <div className="suggestion-tags">
                {item.tags.slice(0, 3).map(tag => (
                  <Tag key={tag} size="small" color="blue">
                    #{tag}
                  </Tag>
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
