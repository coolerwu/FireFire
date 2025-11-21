import React, { useState, useRef } from 'react';
import { Dropdown } from 'antd';
import {
  DeleteOutlined,
  CopyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

const DragHandleComponent = ({ editor, getPos }) => {
  const [isVisible, setIsVisible] = useState(false);
  const dragHandleRef = useRef(null);

  const handleDragStart = (event) => {
    const pos = getPos();
    const node = editor.state.doc.nodeAt(pos);

    if (!node) return;

    // Store the position and node data
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', ''); // Required for Firefox
    event.dataTransfer.setData('application/x-tiptap-drag', JSON.stringify({
      pos,
      nodeType: node.type.name,
    }));

    // Add dragging class to the element
    const element = event.target.closest('.drag-handle-wrapper');
    if (element) {
      element.classList.add('is-dragging');
    }
  };

  const handleDragEnd = (event) => {
    const element = event.target.closest('.drag-handle-wrapper');
    if (element) {
      element.classList.remove('is-dragging');
    }
  };

  const deleteBlock = () => {
    const pos = getPos();
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;

    const tr = editor.state.tr.delete(pos, pos + node.nodeSize);
    editor.view.dispatch(tr);
  };

  const duplicateBlock = () => {
    const pos = getPos();
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;

    const tr = editor.state.tr.insert(pos + node.nodeSize, node);
    editor.view.dispatch(tr);
  };

  const moveUp = () => {
    const pos = getPos();
    const node = editor.state.doc.nodeAt(pos);
    if (!node || pos === 0) return;

    // Find the previous node
    const $pos = editor.state.doc.resolve(pos);
    const prevNode = $pos.nodeBefore;

    if (!prevNode) return;

    const tr = editor.state.tr;
    const from = pos;
    const to = pos + node.nodeSize;
    const insertPos = pos - prevNode.nodeSize;

    // Delete current node and insert before previous
    tr.delete(from, to);
    tr.insert(insertPos, node);

    editor.view.dispatch(tr);
  };

  const moveDown = () => {
    const pos = getPos();
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;

    const after = pos + node.nodeSize;
    const $after = editor.state.doc.resolve(after);
    const nextNode = $after.nodeAfter;

    if (!nextNode) return;

    const tr = editor.state.tr;
    const from = pos;
    const to = pos + node.nodeSize;
    const insertPos = after + nextNode.nodeSize;

    // Delete current node and insert after next
    tr.delete(from, to);
    tr.insert(insertPos - node.nodeSize, node);

    editor.view.dispatch(tr);
  };

  const turnInto = (type, attrs = {}) => {
    const pos = getPos();
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;

    editor
      .chain()
      .setTextSelection({ from: pos, to: pos + node.nodeSize })
      .setNode(type, attrs)
      .run();
  };

  const menuItems = [
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      onClick: deleteBlock,
    },
    {
      key: 'duplicate',
      label: '复制',
      icon: <CopyOutlined />,
      onClick: duplicateBlock,
    },
    {
      type: 'divider',
    },
    {
      key: 'moveUp',
      label: '上移',
      icon: <ArrowUpOutlined />,
      onClick: moveUp,
    },
    {
      key: 'moveDown',
      label: '下移',
      icon: <ArrowDownOutlined />,
      onClick: moveDown,
    },
    {
      type: 'divider',
    },
    {
      key: 'turnInto',
      label: '转换为',
      children: [
        {
          key: 'paragraph',
          label: '段落',
          onClick: () => turnInto('paragraph'),
        },
        {
          key: 'heading1',
          label: '标题 1',
          onClick: () => turnInto('heading', { level: 1 }),
        },
        {
          key: 'heading2',
          label: '标题 2',
          onClick: () => turnInto('heading', { level: 2 }),
        },
        {
          key: 'heading3',
          label: '标题 3',
          onClick: () => turnInto('heading', { level: 3 }),
        },
        {
          key: 'bulletList',
          label: '无序列表',
          onClick: () => {
            const pos = getPos();
            editor
              .chain()
              .setTextSelection({ from: pos, to: pos + 1 })
              .toggleBulletList()
              .run();
          },
        },
        {
          key: 'orderedList',
          label: '有序列表',
          onClick: () => {
            const pos = getPos();
            editor
              .chain()
              .setTextSelection({ from: pos, to: pos + 1 })
              .toggleOrderedList()
              .run();
          },
        },
      ],
    },
  ];

  return (
    <div
      className="drag-handle-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomLeft"
      >
        <div
          ref={dragHandleRef}
          className={`drag-handle ${isVisible ? 'visible' : ''}`}
          draggable="true"
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          contentEditable={false}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <circle cx="6" cy="5" r="1.5" />
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="6" cy="9" r="1.5" />
            <circle cx="12" cy="9" r="1.5" />
            <circle cx="6" cy="13" r="1.5" />
            <circle cx="12" cy="13" r="1.5" />
          </svg>
        </div>
      </Dropdown>
    </div>
  );
};

export default DragHandleComponent;
