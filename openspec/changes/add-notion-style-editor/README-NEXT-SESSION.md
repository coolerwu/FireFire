# 下次会话实施指南：斜杠命令功能

## 📋 当前状态

### ✅ 已完成
- ✅ UI 极简重构完成（样式已就绪）
- ✅ 斜杠命令菜单样式已预留在 `src/pages/file/markdown.less`:
  - `.slash-menu` - 菜单容器样式
  - `.slash-menu-item` - 菜单项样式
- ✅ 设计文档和任务列表已创建

### 🚧 待实施
阶段 1：斜杠命令（6 个任务）

## 🎯 实施步骤

### 步骤 1：安装依赖（5 分钟）

```bash
# 安装 Tiptap suggestion 扩展
npm install @tiptap/suggestion

# 验证安装
npm list @tiptap/suggestion
```

### 步骤 2：创建斜杠命令扩展（30 分钟）

创建 `src/common/extensions/slashCommand.js`：

```javascript
import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
```

### 步骤 3：创建命令菜单组件（45 分钟）

创建 `src/common/extensions/SlashMenuComponent.jsx`：

```jsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'

const SlashMenuComponent = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands = [
    {
      icon: '#',
      title: '标题 1',
      description: '大号标题',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      },
    },
    {
      icon: '##',
      title: '标题 2',
      description: '中号标题',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      },
    },
    {
      icon: '📝',
      title: '段落',
      description: '普通文本',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('paragraph').run()
      },
    },
    {
      icon: '•',
      title: '无序列表',
      description: '创建无序列表',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      icon: '1.',
      title: '有序列表',
      description: '创建有序列表',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      icon: '</>',
      title: '代码块',
      description: '插入代码块',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setCodeBlock().run()
      },
    },
    {
      icon: '—',
      title: '分隔线',
      description: '插入水平分隔线',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    },
  ]

  const filteredCommands = commands.filter((item) =>
    item.title.toLowerCase().includes(props.query.toLowerCase())
  )

  const selectItem = (index) => {
    const item = filteredCommands[index]
    if (item) {
      props.command(item)
    }
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + filteredCommands.length - 1) % filteredCommands.length)
        return true
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % filteredCommands.length)
        return true
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }

      return false
    },
  }))

  useEffect(() => {
    setSelectedIndex(0)
  }, [props.query])

  if (filteredCommands.length === 0) {
    return null
  }

  return (
    <div className="slash-menu">
      {filteredCommands.map((item, index) => (
        <button
          key={index}
          className={`slash-menu-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => selectItem(index)}
        >
          <span className="icon">{item.icon}</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div className="title">{item.title}</div>
            {item.description && <div className="description">{item.description}</div>}
          </div>
        </button>
      ))}
    </div>
  )
})

export default SlashMenuComponent
```

### 步骤 4：配置 Suggestion 渲染（30 分钟）

创建 `src/common/extensions/slashCommandConfig.js`：

```javascript
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import SlashMenuComponent from './SlashMenuComponent'

export default {
  items: ({ query }) => {
    // 这里的命令列表会被 SlashMenuComponent 内部的列表替代
    return []
  },

  render: () => {
    let component
    let popup

    return {
      onStart: (props) => {
        component = new ReactRenderer(SlashMenuComponent, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },

      onUpdate(props) {
        component.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          popup[0].hide()
          return true
        }

        return component.ref?.onKeyDown(props)
      },

      onExit() {
        popup[0].destroy()
        component.destroy()
      },
    }
  },
}
```

### 步骤 5：集成到编辑器（15 分钟）

更新 `src/common/extensions/slashCommand.js`：

```javascript
import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import slashCommandConfig from './slashCommandConfig'

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
        ...slashCommandConfig,
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
```

更新 `src/common/extensions/index.js`，添加：

```javascript
import { SlashCommand } from './slashCommand'

const plugins = [
  // ... 现有扩展
  SlashCommand,
]
```

### 步骤 6：测试（20 分钟）

1. 启动开发服务器：`npm run estart-dev`
2. 打开编辑器，输入 `/`
3. 验证命令菜单出现
4. 测试键盘导航（上下箭头、Enter）
5. 测试搜索过滤（输入 `/code` 只显示代码块）
6. 测试各个命令是否正常工作

## 📚 参考资源

- **Tiptap Suggestion 文档**: https://tiptap.dev/api/utilities/suggestion
- **设计文档**: `openspec/changes/add-notion-style-editor/design.md`
- **完整任务列表**: `openspec/changes/add-notion-style-editor/tasks.md`
- **样式定义**: `src/pages/file/markdown.less` (`.slash-menu` 部分)

## ⚠️ 注意事项

1. **tippy.js 依赖**：需要确认 `tippy.js` 是否已安装，如果没有：
   ```bash
   npm install tippy.js
   ```

2. **样式已就绪**：斜杠菜单样式已在 UI 重构时添加，无需额外编写 CSS

3. **渐进增强**：先实现基础命令，后续可添加更多命令（图片、B站视频等）

4. **测试重点**：
   - 输入 `/` 触发菜单
   - 键盘导航流畅
   - 命令执行正确
   - 菜单位置正确
   - 与现有功能兼容（自动保存、图片粘贴等）

## 🎉 完成标志

当以下任务全部完成时，阶段 1 即完成：
- [x] 1.1 安装依赖并研究 API
- [x] 1.2 创建斜杠命令扩展
- [x] 1.3 实现命令菜单 UI 组件
- [x] 1.4 定义命令列表
- [x] 1.5 集成到编辑器并测试
- [x] 1.6 应用样式

完成后更新 `tasks.md`，将任务 1.1-1.6 标记为 `[x]`，并提交更改。
