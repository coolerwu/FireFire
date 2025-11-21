# Notion 风格编辑器增强设计文档

## Context
FireFire 当前使用 Tiptap 编辑器，具备基础的富文本编辑能力（标题、列表、代码块、图片、B站视频）。为了提升竞争力，需要添加 Notion 风格的现代编辑功能。

## Goals / Non-Goals

### Goals
- 实现斜杠命令（`/`）快速插入块
- 实现拖拽排序（Drag & Drop）重组内容
- 实现块级操作菜单（删除、复制、转换）
- 实现嵌入式内容（YouTube、PDF、网页预览）
- 保持与现有功能的兼容性（图片粘贴、自动保存、B站视频）
- 保持 Tiptap 架构，不重写编辑器

### Non-Goals
- 不实现数据库/表格视图（Notion 的 Database 功能）
- 不实现多人协作编辑
- 不实现 AI 辅助写作
- 不替换 Tiptap 为其他编辑器框架

## Decisions

### 1. 斜杠命令实现方案
**决定**：使用 Tiptap 的 `Suggestion` API 自定义实现

**技术选型**：
| 方案 | 优点 | 缺点 | 决定 |
|------|------|------|------|
| 使用 `tiptap-extension-slash-command` | 现成的扩展，快速集成 | 可能不符合我们的 UI 风格 | ❌ |
| 基于 `@tiptap/suggestion` 自定义 | 完全控制 UI 和逻辑 | 需要更多开发工作 | ✅ |
| 使用 Novel.sh 的实现 | 开源参考，功能完善 | 依赖复杂，需要大量修改 | ❌ |

**实现细节**：
```javascript
// src/common/extensions/slashCommand.js
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
        items: ({ query }) => {
          return [
            { title: '标题 1', command: ({ editor, range }) => { /* ... */ } },
            { title: '代码块', command: ({ editor, range }) => { /* ... */ } },
            // ...更多命令
          ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
        },
        render: () => {
          // 返回自定义 React 组件
          return {
            onStart: (props) => { /* 显示菜单 */ },
            onUpdate: (props) => { /* 更新菜单 */ },
            onExit: (props) => { /* 隐藏菜单 */ },
          }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, ...this.options.suggestion })]
  },
})
```

**命令列表设计**：
```javascript
const commands = [
  // 文本
  { icon: '📝', title: '段落', keywords: ['p', 'paragraph'], command: ... },
  { icon: '#', title: '标题 1', keywords: ['h1', 'heading'], command: ... },
  { icon: '##', title: '标题 2', keywords: ['h2'], command: ... },
  { icon: '💬', title: '引用', keywords: ['quote', 'blockquote'], command: ... },

  // 列表
  { icon: '•', title: '无序列表', keywords: ['ul', 'list', 'bullet'], command: ... },
  { icon: '1.', title: '有序列表', keywords: ['ol', 'numbered'], command: ... },
  { icon: '☑', title: '待办列表', keywords: ['todo', 'checkbox', 'task'], command: ... },

  // 媒体
  { icon: '🖼️', title: '图片', keywords: ['image', 'img'], command: ... },
  { icon: '</>', title: '代码块', keywords: ['code', 'codeblock'], command: ... },

  // 嵌入
  { icon: '🎬', title: 'B站视频', keywords: ['bilibili', 'video'], command: ... },
  { icon: '▶️', title: 'YouTube', keywords: ['youtube', 'yt'], command: ... },
  { icon: '📄', title: 'PDF', keywords: ['pdf', 'document'], command: ... },
  { icon: '🔗', title: '网页预览', keywords: ['web', 'link', 'embed'], command: ... },

  // 其他
  { icon: '—', title: '分隔线', keywords: ['hr', 'divider'], command: ... },
  { icon: '📊', title: '表格', keywords: ['table'], command: ... },
]
```

### 2. 拖拽排序实现方案
**决定**：使用 ProseMirror 的拖拽 API + 自定义手柄

**技术选型**：
| 方案 | 优点 | 缺点 | 决定 |
|------|------|------|------|
| `@tiptap/extension-drag-handle` | 官方扩展，稳定 | 样式和行为难以定制 | ❌ |
| 自定义 NodeView + drag API | 完全控制，符合设计 | 开发复杂度高 | ✅ |
| `react-dnd` 或 `dnd-kit` | 成熟的拖拽库 | 与 ProseMirror 集成复杂 | ❌ |

**实现细节**：
```javascript
// src/common/extensions/dragHandle.js
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'

export const DragHandle = Extension.create({
  name: 'dragHandle',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('dragHandle'),
        props: {
          handleDOMEvents: {
            dragstart: (view, event) => {
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
              // 存储拖拽的节点位置
            },
            drop: (view, event) => {
              // 计算插入位置并执行移动
              const from = ...
              const to = ...
              view.dispatch(view.state.tr.delete(from, to).insert(targetPos, node))
            },
          },
        },
      }),
    ]
  },
})
```

**UI 设计**：
- 拖拽手柄位置：块左侧 `-24px`，悬停时显示
- 手柄样式：`⋮⋮` 图标，`#a3a3a3` 颜色
- 拖拽时：原块半透明，目标位置显示蓝色指示线

### 3. 块级操作菜单
**决定**：点击拖拽手柄弹出 Dropdown 菜单

**实现细节**：
```javascript
// 使用 Ant Design 的 Dropdown 组件
const BlockMenu = ({ editor, pos }) => {
  const items = [
    { key: 'delete', label: '删除', icon: <DeleteOutlined />, onClick: () => deleteBlock(pos) },
    { key: 'duplicate', label: '复制', icon: <CopyOutlined />, onClick: () => duplicateBlock(pos) },
    { type: 'divider' },
    { key: 'turnInto', label: '转换为', children: [
      { key: 'paragraph', label: '段落' },
      { key: 'heading1', label: '标题 1' },
      // ...
    ]},
  ]

  return <Dropdown menu={{ items }} trigger={['click']}>...</Dropdown>
}
```

### 4. 嵌入式内容实现

#### 4.1 YouTube 嵌入
**决定**：使用 iframe 嵌入播放器

```javascript
// src/common/extensions/youtubeEmbed.js
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const YouTubeEmbed = Node.create({
  name: 'youtube',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      videoId: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-youtube-video]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-youtube-video': HTMLAttributes.videoId }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeComponent)
  },
})

// YouTubeComponent.jsx
const YouTubeComponent = ({ node }) => {
  const { videoId } = node.attrs
  return (
    <div className="youtube-wrapper">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
```

**URL 解析**：
```javascript
// 支持多种 YouTube URL 格式
function extractYouTubeId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtu\.be\/([^?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}
```

#### 4.2 PDF 嵌入
**决定**：使用 `react-pdf` 库

```bash
npm install react-pdf pdfjs-dist
```

```javascript
// src/common/extensions/pdfEmbed.js
import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const PDFEmbed = Node.create({
  name: 'pdf',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null }, // file:// 路径
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(PDFComponent)
  },
})

// PDFComponent.jsx
import { Document, Page, pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

const PDFComponent = ({ node }) => {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)

  return (
    <div className="pdf-wrapper">
      <Document file={node.attrs.src} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
        <Page pageNumber={pageNumber} />
      </Document>
      <div className="pdf-controls">
        <button onClick={() => setPageNumber(p => Math.max(1, p - 1))}>上一页</button>
        <span>{pageNumber} / {numPages}</span>
        <button onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}>下一页</button>
      </div>
    </div>
  )
}
```

**PDF 文件处理**：
- 通过文件选择器上传 PDF
- 复制到 `~/.firefire/attachment/` 目录（类似图片处理）
- 使用 `file://` URL 引用

#### 4.3 网页预览（Link Preview）
**决定**：使用卡片预览 + 第三方服务（Microlink）

**问题**：直接抓取 URL meta 信息会遇到 CORS 限制

**方案对比**：
| 方案 | 优点 | 缺点 | 决定 |
|------|------|------|------|
| 前端直接抓取 | 无需后端 | CORS 限制，无法抓取 | ❌ |
| 后端代理服务 | 可控，无 CORS | 需要添加后端服务（复杂） | ❌ |
| 第三方服务（Microlink） | 简单，免费额度充足 | 依赖外部服务 | ✅ |
| 简化实现（仅 iframe） | 极简，无需 API | 部分网站禁止 iframe | 备选 |

**实现（Microlink 方案）**：
```javascript
// 使用 Microlink API
async function fetchLinkPreview(url) {
  const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
  const data = await response.json()
  return {
    title: data.data.title,
    description: data.data.description,
    image: data.data.image?.url,
    logo: data.data.logo?.url,
    url: data.data.url,
  }
}

// src/common/extensions/webEmbed.js
const WebEmbedComponent = ({ node }) => {
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    fetchLinkPreview(node.attrs.url).then(setPreview)
  }, [node.attrs.url])

  if (!preview) return <div>加载中...</div>

  return (
    <a href={preview.url} className="link-preview-card" target="_blank">
      {preview.image && <img src={preview.image} alt={preview.title} />}
      <div className="link-preview-content">
        <h4>{preview.title}</h4>
        <p>{preview.description}</p>
        <span className="link-preview-url">{new URL(preview.url).hostname}</span>
      </div>
    </a>
  )
}
```

**备选方案（仅 iframe）**：
如果不想依赖外部服务，可以简化为仅支持 iframe 嵌入：
```javascript
<iframe src={url} sandbox="allow-scripts allow-same-origin" />
```

### 5. 样式设计（符合极简主义）

**拖拽手柄**：
```less
.drag-handle {
  position: absolute;
  left: -24px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.2s;
  color: #a3a3a3;

  &:hover { opacity: 1; color: #525252; }
}

.ProseMirror > *:hover .drag-handle {
  opacity: 0.6;
}
```

**斜杠命令菜单**：
```less
.slash-menu {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 4px;
  max-height: 320px;
  overflow-y: auto;

  .slash-menu-item {
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover, &.selected {
      background: #f5f5f5;
    }

    .icon { font-size: 18px; }
    .title { font-size: 14px; color: #171717; }
  }
}
```

## Risks / Trade-offs

### 风险 1：复杂度增加
- **影响**：新增多个扩展和组件，代码复杂度上升
- **缓解**：
  - 每个功能独立开发和测试
  - 充分使用 Tiptap 的扩展机制（解耦）
  - 详细的代码注释和文档

### 风险 2：性能问题
- **影响**：嵌入式内容（特别是 PDF）可能导致性能下降
- **缓解**：
  - 懒加载：仅渲染可视区域的嵌入内容
  - PDF 分页加载，避免一次性加载整个文档
  - 使用 React.memo 优化组件渲染

### 风险 3：外部依赖
- **影响**：依赖 Microlink 等第三方服务
- **缓解**：
  - 提供降级方案（无法获取预览时显示纯链接）
  - 本地缓存预览数据
  - 考虑未来自建后端服务

### Trade-off：功能完整性 vs 开发时间
- **选择**：先实现核心功能（斜杠命令、拖拽），嵌入内容分阶段实现
- **理由**：斜杠命令和拖拽是最高优先级，嵌入内容可以逐步添加

## Migration Plan

### 阶段 1：斜杠命令（1-2 周）
1. 实现基础斜杠命令扩展
2. 添加命令菜单 UI
3. 支持基础命令（标题、列表、代码块）
4. 测试和优化

### 阶段 2：拖拽排序（1-2 周）
1. 实现拖拽手柄
2. 实现拖拽逻辑
3. 添加块操作菜单
4. 测试各种块类型

### 阶段 3：嵌入内容（2-3 周）
1. YouTube 嵌入（简单）
2. 网页预览（中等）
3. PDF 嵌入（复杂）
4. 优化现有 BiliBili 嵌入

### Rollback 计划
- 每个功能作为独立扩展，可以单独禁用
- 如果某个功能有问题，可以暂时从扩展列表中移除

## Open Questions
- ❓ 网页预览是否使用第三方服务（Microlink）还是简化为 iframe？
- ❓ PDF 预览是否需要支持缩放、下载等高级功能？
- ❓ 是否需要支持更多嵌入类型（如 Figma、CodePen）？
- ❓ 拖拽排序是否需要支持跨级拖拽（如列表项拖出列表）？
