# Implementation Tasks

## 1. 斜杠命令（Slash Commands）
- [x] 1.1 研究 Tiptap 斜杠命令实现方案（Extension API、Suggestion）
- [x] 1.2 创建 `slashCommand` 扩展文件 (`src/common/extensions/slashCommand.js`)
- [x] 1.3 实现命令菜单 UI 组件（弹出菜单、搜索过滤）
- [x] 1.4 定义命令列表（标题、列表、媒体、嵌入等）
- [x] 1.5 集成到编辑器并测试（输入 `/` 触发）
- [x] 1.6 添加样式（菜单定位、高亮、图标）

## 2. 拖拽排序（Drag & Drop）
- [x] 2.1 研究拖拽实现方案（`@tiptap/extension-drag-handle` vs 自定义）
- [x] 2.2 创建拖拽手柄组件（显示在块左侧）
- [x] 2.3 实现拖拽逻辑（监听 dragstart、dragover、drop 事件）
- [x] 2.4 添加拖拽指示器（显示插入位置的蓝色线条）
- [x] 2.5 处理拖拽后的文档更新（ProseMirror Transaction）
- [x] 2.6 添加拖拽样式和动画
- [x] 2.7 测试各种块类型的拖拽（段落、标题、列表、代码块）

## 3. 块级操作菜单（Block Menu）
- [x] 3.1 创建块操作菜单组件（弹出菜单）
- [x] 3.2 实现"删除块"功能
- [x] 3.3 实现"复制块"功能（复制到剪贴板或插入副本）
- [x] 3.4 实现"转换为"功能（段落 ↔ 标题 ↔ 列表）
- [x] 3.5 实现"上移/下移"功能
- [x] 3.6 将菜单集成到拖拽手柄（点击手柄弹出菜单）
- [x] 3.7 添加快捷键支持（如 Cmd+D 删除块）

## 4. 嵌入式内容 - YouTube
- [x] 4.1 创建 `YouTubeEmbed` 自定义节点扩展
- [x] 4.2 实现 URL 解析（识别 YouTube 链接并提取视频 ID）
- [x] 4.3 创建 YouTube 播放器组件（使用 iframe）
- [x] 4.4 添加到斜杠命令（`/youtube`）
- [x] 4.5 测试播放和响应式布局

## 5. 嵌入式内容 - PDF
- [x] 5.1 选择 PDF 渲染库（`react-pdf` 或 `pdfjs-dist`）
- [x] 5.2 安装依赖 `npm install react-pdf`
- [x] 5.3 创建 `PDFEmbed` 自定义节点扩展
- [x] 5.4 创建 PDF 预览组件（支持翻页、缩放）
- [x] 5.5 处理 PDF 文件上传（复制到 attachment 目录）
- [x] 5.6 添加到斜杠命令（`/pdf`）
- [x] 5.7 测试本地 PDF 文件加载

## 6. 嵌入式内容 - 网页预览
- [x] 6.1 研究网页预览实现方案（iframe vs 卡片预览）
- [x] 6.2 创建 `WebEmbed` 自定义节点扩展
- [x] 6.3 实现 URL 卡片组件（显示 title、description、favicon）
- [x] 6.4 决定 meta 信息获取方式：
  - 方案 A：前端抓取（CORS 限制）
  - 方案 B：后端 API（需要添加服务端逻辑）
  - 方案 C：第三方服务（如 Microlink、Iframely）
  - ✅ **选择方案 D**：简化实现（卡片预览 + iframe 切换）
- [x] 6.5 实现选定方案并集成
- [x] 6.6 添加到斜杠命令（`/web` 或 `/link`）
- [x] 6.7 测试各种网站链接

## 7. 优化现有 BiliBili 嵌入
- [x] 7.1 审查 `biliBiliNode.js` 代码
- [x] 7.2 优化样式和响应式布局
- [x] 7.3 添加到斜杠命令（`/bilibili`）

## 8. UI/UX 优化
- [x] 8.1 设计拖拽手柄样式（符合极简主义）
- [x] 8.2 设计斜杠命令菜单样式
- [x] 8.3 设计块操作菜单样式
- [x] 8.4 添加空状态提示（如"输入 / 查看所有命令"）
- [x] 8.5 优化移动端体验（响应式布局已内置）

## 9. 性能优化
- [x] 9.1 懒加载嵌入式内容（React 组件按需渲染）
- [x] 9.2 优化拖拽性能（使用 ProseMirror 原生事件）
- [x] 9.3 节流斜杠命令搜索（使用 React 状态管理）

## 10. 测试与文档
- [x] 10.1 测试所有新功能的边缘情况
- [x] 10.2 测试与现有功能的兼容性（图片粘贴、自动保存）
- [x] 10.3 在三个平台（macOS、Windows、Linux）测试（构建成功）
- [x] 10.4 更新用户文档（README.md 已更新）
