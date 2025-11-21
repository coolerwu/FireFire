# Change: 添加 Notion 风格的编辑器功能

## Why
当前的 Tiptap 编辑器功能基础，缺少现代笔记应用的标志性功能。用户期望像 Notion 一样的编辑体验：
1. **斜杠命令**：快速插入各种块（标题、列表、代码块等）
2. **拖拽排序**：直观地重新组织内容结构
3. **块级操作菜单**：便捷的复制、删除、转换操作
4. **嵌入式内容**：支持 YouTube、PDF、网页预览等富媒体

这些功能将大幅提升编辑效率和用户体验，使 FireFire 更具竞争力。

## What Changes
基于现有 Tiptap 编辑器进行增强：

### 1. 斜杠命令（Slash Commands）
- 输入 `/` 触发命令菜单
- 支持搜索过滤（如 `/code` 快速找到代码块）
- 内置命令：
  - 文本块：标题（H1-H6）、段落、引用
  - 列表：无序列表、有序列表、待办列表
  - 媒体：图片、代码块、B站视频
  - 嵌入：YouTube、PDF、网页预览（新增）
  - 布局：分隔线、表格

### 2. 拖拽排序（Drag & Drop）
- 每个块左侧显示拖拽手柄（⋮⋮）
- 支持拖拽块级元素到任意位置
- 拖拽时显示插入位置指示器
- 使用 Tiptap 的 `@tiptap/extension-drag-handle` 或自定义实现

### 3. 块级操作菜单（Block Menu）
- 点击块左侧手柄弹出菜单
- 操作包括：
  - 删除块
  - 复制块
  - 转换为（标题、列表、段落等）
  - 移动（上移/下移）

### 4. 嵌入式内容（Embeds）
- **YouTube**：支持 YouTube 链接自动转为播放器
- **PDF**：支持上传或链接 PDF，内嵌预览
- **网页预览**：支持 URL 自动生成卡片预览（title、description、favicon）
- **现有 BiliBili**：保留并优化现有的 B站嵌入功能

## Impact
- Affected specs: `editor` (新建)
- Affected code:
  - `src/common/extensions/` (新增扩展)
  - `src/pages/file/markdown.jsx` (集成新功能)
  - `package.json` (新增依赖)
- Breaking: 无（向后兼容，新功能为增强）
- Risk: 中等
  - 需要新增多个 Tiptap 扩展
  - 嵌入式内容需要处理外部资源加载
  - 拖拽功能需要仔细处理性能

## Dependencies
新增 npm 包（预估）：
- `@tiptap/extension-slash-command` 或自定义实现
- `@tiptap/extension-drag-handle` 或 `prosemirror-dropcursor`
- PDF 预览：`react-pdf` 或 `pdfjs-dist`
- 网页预览：可能需要后端 API（抓取 meta 信息）或使用第三方服务
