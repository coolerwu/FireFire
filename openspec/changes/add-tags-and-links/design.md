# 标签和链接系统设计文档

## Context
FireFire 当前以文件夹为主的组织方式不符合现代知识管理理念。需要实现标签和内部链接系统，让用户"打开就能记笔记"。

## Goals / Non-Goals

### Goals
- 实现 `#标签` 语法支持
- 实现 `[[内部链接]]` 语法支持
- 快速笔记入口（无需选择文件夹）
- 标签和链接的索引管理
- 反向链接显示
- UI 重构（标签优先）

### Non-Goals
- 不实现完整的图数据库（仅内存索引）
- 不实现 3D 图谱可视化（仅 2D）
- 不实现标签层级关系（仅扁平标签）
- 不废弃文件夹（保持兼容）

## Decisions

### 1. 标签语法设计

**决定**：使用 `#标签名` 语法（类似 Twitter/Notion）

**原因**：
- ✅ 用户熟悉度高
- ✅ 输入简单
- ✅ 可视化识别度高
- ⚠️ 需要与 Markdown 标题 `#` 区分

**实现**：
```javascript
// Tiptap 扩展
export const TagExtension = Node.create({
  name: 'tag',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      tag: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-tag]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        'data-tag': HTMLAttributes.tag,
        'class': 'tag-node',
      },
      `#${HTMLAttributes.tag}`,
    ]
  },

  addInputRules() {
    return [
      // 匹配 #标签名（中文、英文、数字）
      nodeInputRule({
        find: /#([a-zA-Z0-9\u4e00-\u9fa5]+)(?=\s|$)/,
        type: this.type,
        getAttributes: match => ({
          tag: match[1],
        }),
      }),
    ]
  },
})
```

**样式**：
```less
.tag-node {
  display: inline-block;
  padding: 2px 8px;
  margin: 0 4px;
  background: #f0f9ff;
  color: #0369a1;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #0369a1;
    color: white;
  }
}
```

### 2. 内部链接语法设计

**决定**：使用 `[[笔记名称]]` 语法（类似 Obsidian/Roam）

**链接类型**：
```javascript
// 1. 基础链接
[[我的笔记]]

// 2. 带别名链接（可选，后期实现）
[[文件ID|显示名称]]

// 3. 带标题锚点（可选，后期实现）
[[笔记名称#标题]]
```

**实现**：
```javascript
export const InternalLinkExtension = Node.create({
  name: 'internalLink',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      target: {
        default: null, // 目标笔记的 ID 或文件名
      },
      label: {
        default: null, // 显示文本（默认等于 target）
      },
      exists: {
        default: true, // 目标笔记是否存在
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-internal-link]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { target, label, exists } = HTMLAttributes
    return [
      'a',
      {
        'data-internal-link': target,
        'class': `internal-link ${exists ? 'exists' : 'not-exists'}`,
        'href': '#', // 阻止默认跳转
      },
      label || target,
    ]
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /\[\[([^\]]+)\]\]/,
        type: this.type,
        getAttributes: match => ({
          target: match[1],
          label: match[1],
        }),
      }),
    ]
  },
})
```

**样式**：
```less
.internal-link {
  color: var(--primary, #25b864);
  text-decoration: none;
  border-bottom: 1px dashed var(--primary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--primary-hover);
    border-bottom-style: solid;
  }

  &.not-exists {
    color: #dc2626;
    border-bottom-color: #dc2626;
    border-bottom-style: dotted;
  }
}
```

### 3. 数据存储设计

#### 3.1 文件元数据扩展

在 `.cwjson` 文件中添加元数据：
```json
{
  "type": "doc",
  "content": [...],
  "meta": {
    "id": "uuid-v4",
    "title": "笔记标题",
    "createdAt": "2025-11-21T10:00:00Z",
    "updatedAt": "2025-11-21T15:30:00Z",
    "tags": ["工作", "项目A", "会议"],
    "outgoingLinks": ["笔记B", "笔记C"],
    "backlinks": [] // 由系统自动计算，不存储
  }
}
```

#### 3.2 全局索引文件

创建 `~/.firefire/index.json`：
```json
{
  "tags": {
    "工作": {
      "count": 15,
      "notes": ["note-id-1", "note-id-2", ...]
    },
    "项目A": {
      "count": 8,
      "notes": ["note-id-1", "note-id-3", ...]
    }
  },
  "links": {
    "note-id-1": {
      "title": "会议记录",
      "outgoing": ["note-id-2", "note-id-3"],
      "incoming": ["note-id-4"]
    }
  },
  "notes": {
    "note-id-1": {
      "title": "会议记录",
      "path": "/path/to/file.cwjson",
      "tags": ["工作", "会议"],
      "updatedAt": "2025-11-21T15:30:00Z"
    }
  }
}
```

#### 3.3 索引更新策略

```javascript
// electron/indexManager.js
class IndexManager {
  constructor() {
    this.index = this.loadIndex()
  }

  // 加载索引
  loadIndex() {
    const indexPath = path.join(getRootPath(), 'index.json')
    if (fs.existsSync(indexPath)) {
      return JSON.parse(fs.readFileSync(indexPath, 'utf8'))
    }
    return { tags: {}, links: {}, notes: {} }
  }

  // 保存索引
  saveIndex() {
    const indexPath = path.join(getRootPath(), 'index.json')
    fs.writeFileSync(indexPath, JSON.stringify(this.index, null, 2))
  }

  // 更新笔记索引
  updateNoteIndex(noteId, noteData) {
    const { title, path, tags, outgoingLinks } = noteData

    // 更新笔记信息
    this.index.notes[noteId] = {
      title,
      path,
      tags,
      updatedAt: new Date().toISOString(),
    }

    // 更新标签索引
    this.updateTagsIndex(noteId, tags)

    // 更新链接索引
    this.updateLinksIndex(noteId, outgoingLinks)

    this.saveIndex()
  }

  // 更新标签索引
  updateTagsIndex(noteId, tags) {
    // 移除旧标签
    Object.keys(this.index.tags).forEach(tag => {
      const idx = this.index.tags[tag].notes.indexOf(noteId)
      if (idx !== -1) {
        this.index.tags[tag].notes.splice(idx, 1)
        this.index.tags[tag].count--
      }
    })

    // 添加新标签
    tags.forEach(tag => {
      if (!this.index.tags[tag]) {
        this.index.tags[tag] = { count: 0, notes: [] }
      }
      if (!this.index.tags[tag].notes.includes(noteId)) {
        this.index.tags[tag].notes.push(noteId)
        this.index.tags[tag].count++
      }
    })
  }

  // 更新链接索引
  updateLinksIndex(noteId, outgoingLinks) {
    if (!this.index.links[noteId]) {
      this.index.links[noteId] = { outgoing: [], incoming: [] }
    }

    // 更新 outgoing 链接
    this.index.links[noteId].outgoing = outgoingLinks

    // 更新 incoming 链接（反向链接）
    outgoingLinks.forEach(targetId => {
      if (!this.index.links[targetId]) {
        this.index.links[targetId] = { outgoing: [], incoming: [] }
      }
      if (!this.index.links[targetId].incoming.includes(noteId)) {
        this.index.links[targetId].incoming.push(noteId)
      }
    })
  }

  // 获取标签下的笔记
  getNotesByTag(tag) {
    return this.index.tags[tag]?.notes || []
  }

  // 获取反向链接
  getBacklinks(noteId) {
    return this.index.links[noteId]?.incoming || []
  }

  // 搜索笔记
  searchNotes(query) {
    const results = []
    Object.entries(this.index.notes).forEach(([id, note]) => {
      if (note.title.toLowerCase().includes(query.toLowerCase())) {
        results.push({ id, ...note })
      }
    })
    return results
  }
}

module.exports = new IndexManager()
```

### 4. UI 设计

#### 4.1 快速笔记入口

**方案 A：顶部快速笔记按钮**
```jsx
// src/pages/file/file.jsx
<div className="quick-actions">
  <Button
    type="primary"
    icon={<PlusOutlined />}
    size="large"
    onClick={createQuickNote}
  >
    快速笔记
  </Button>
  <Input.Search
    placeholder="搜索笔记、标签..."
    onSearch={handleSearch}
    size="large"
  />
</div>
```

**方案 B：默认进入快速笔记模式**
```jsx
// 应用启动时自动创建一个临时笔记
useEffect(() => {
  if (cwjsonList.length === 0 || !selectedFile) {
    createQuickNote()
  }
}, [])

const createQuickNote = () => {
  const noteId = uuid()
  const fileName = `Quick-${Date.now()}.cwjson`
  const notePath = path.join(settingquote.notebookPath, 'Quick Notes', fileName)

  // 创建空笔记
  createNotebookFile(notePath)
  setSelectedFile(notePath)
}
```

#### 4.2 侧边栏重构

```jsx
// 新的侧边栏结构
<Sider width={280}>
  {/* 快速操作 */}
  <div className="quick-actions">
    <Button type="primary" block icon={<PlusOutlined />}>
      新建笔记
    </Button>
  </div>

  {/* 导航菜单 */}
  <Menu mode="inline" selectedKeys={[viewMode]}>
    <Menu.Item key="all" icon={<FileTextOutlined />}>
      全部笔记 ({totalNotes})
    </Menu.Item>

    <Menu.SubMenu key="tags" icon={<TagsOutlined />} title="标签">
      {tags.map(tag => (
        <Menu.Item key={`tag-${tag.name}`}>
          <Tag color="blue">{tag.name}</Tag>
          <span className="count">({tag.count})</span>
        </Menu.Item>
      ))}
    </Menu.SubMenu>

    <Menu.SubMenu
      key="folders"
      icon={<FolderOutlined />}
      title="文件夹"
      defaultClosed
    >
      {/* 现有文件夹树 */}
    </Menu.SubMenu>
  </Menu>
</Sider>
```

#### 4.3 反向链接面板

```jsx
// src/components/BackLinks.jsx
const BackLinks = ({ noteId }) => {
  const [backlinks, setBacklinks] = useState([])

  useEffect(() => {
    // 获取反向链接
    electronAPI.getBacklinks(noteId).then(setBacklinks)
  }, [noteId])

  if (backlinks.length === 0) {
    return (
      <Card title="反向链接" size="small">
        <Empty description="暂无笔记链接到此" />
      </Card>
    )
  }

  return (
    <Card title="反向链接" size="small">
      <List
        dataSource={backlinks}
        renderItem={link => (
          <List.Item
            onClick={() => openNote(link.id)}
            style={{ cursor: 'pointer' }}
          >
            <List.Item.Meta
              avatar={<LinkOutlined />}
              title={link.title}
              description={link.excerpt} // 链接上下文摘录
            />
          </List.Item>
        )}
      />
    </Card>
  )
}
```

### 5. 自动补全设计

#### 5.1 链接自动补全

```javascript
// 使用 Tiptap Suggestion API
export const linkSuggestion = {
  char: '[[',

  items: async ({ query }) => {
    // 搜索笔记
    const notes = await electronAPI.searchNotes(query)
    return notes.slice(0, 10)
  },

  render: () => {
    let component
    let popup

    return {
      onStart: (props) => {
        component = new ReactRenderer(LinkSuggestionList, {
          props,
          editor: props.editor,
        })

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

```jsx
// LinkSuggestionList.jsx
const LinkSuggestionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index) => {
    const item = props.items[index]
    if (item) {
      props.command({
        target: item.id,
        label: item.title,
        exists: true,
      })
    }
  }

  return (
    <div className="link-suggestion-list">
      {props.items.map((item, index) => (
        <div
          key={item.id}
          className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => selectItem(index)}
        >
          <FileTextOutlined />
          <div>
            <div className="title">{item.title}</div>
            {item.tags.length > 0 && (
              <div className="tags">
                {item.tags.map(tag => (
                  <Tag size="small" key={tag}>#{tag}</Tag>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
})
```

## Migration Strategy

### 阶段 1：核心功能（不影响现有使用）
1. 实现标签和链接扩展
2. 建立索引系统
3. 现有笔记正常使用，新笔记支持标签和链接

### 阶段 2：UI 优化（渐进增强）
1. 添加快速笔记按钮
2. 侧边栏添加标签视图
3. 文件夹视图默认折叠

### 阶段 3：默认行为改变（可配置）
1. 启动时默认进入"全部笔记"视图而非文件夹
2. 新笔记默认保存到 `Quick Notes/`
3. 用户可以在设置中切换回文件夹模式

## Open Questions
- ❓ 是否实现标签层级（如 `#项目/子项目`）？
- ❓ 是否实现图谱可视化（需要 d3.js）？
- ❓ 如何处理大量笔记的性能问题（1000+ 笔记）？
- ❓ 是否支持标签别名和合并？
