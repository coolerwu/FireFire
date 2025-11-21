# Change: 重构 UI 为极简主义风格

## Why
当前界面存在以下问题：
1. **配色不协调**：紫色渐变主题过于花哨，与笔记应用的专业性不符
2. **布局不合理**：侧边栏过窄（80px）、空间利用率低
3. **过度设计**：过多渐变、动画、阴影、玻璃态效果，视觉负担重
4. **性能问题**：大量 CSS 动画和 backdrop-filter 导致界面卡顿

用户期望的是类似 Notion、Bear 的**极简主义**风格：简洁、留白多、专注内容、性能流畅。

## What Changes
- **配色方案**：移除紫色渐变，采用中性色系（灰白黑）+ 单一强调色（绿色 #25b864）
- **布局优化**：
  - 增加侧边栏宽度到合理尺寸
  - 优化文件列表和编辑器区域比例
  - 增加内容留白，减少视觉干扰
- **减少装饰**：
  - 移除背景渐变动画、玻璃态效果
  - 简化按钮样式，去除悬停动画和阴影
  - 统一圆角为 4px-8px（而非 12px-20px）
- **性能优化**：
  - 移除所有 `backdrop-filter`（高性能开销）
  - 减少过渡动画数量和复杂度
  - 简化滚动条样式

## Impact
- Affected specs: `ui-design` (新建)
- Affected code:
  - `src/index.less` (全局样式)
  - `src/pages/file/markdown.less` (编辑器样式)
  - `src/pages/file/fileList.less` (文件列表样式)
  - `src/pages/file/menuBar.less` (工具栏样式)
  - 其他组件样式文件
- Coordination: 应与 `add-notion-style-editor` 变更协调
  - 为新增的拖拽手柄、斜杠菜单、块操作菜单提供极简风格样式
  - 确保嵌入内容（YouTube、PDF、网页预览）符合极简设计
- Breaking: **视觉变更**（用户需要适应新风格）
- Risk: 低（仅 CSS 更改，不影响功能）
