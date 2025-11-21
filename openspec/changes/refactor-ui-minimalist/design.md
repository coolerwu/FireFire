# 极简主义 UI 重构设计文档

## Context
当前 UI 采用了大量紫色渐变、玻璃态效果、复杂动画，导致界面花哨、性能问题。用户反馈希望采用极简主义风格，参考 Notion、Bear 等应用。

## Goals / Non-Goals

### Goals
- 实现类似 Notion/Bear 的极简主义视觉风格
- 优化性能，消除卡顿（移除高开销 CSS 效果）
- 提升可读性和专注度（减少视觉干扰）
- 保持品牌色 #25b864（绿色）作为唯一强调色

### Non-Goals
- 不改变功能逻辑（仅 CSS 更改）
- 不重构 React 组件结构（除非必要）
- 不移除暗黑模式支持

## Decisions

### 1. 配色方案
**决定**：采用中性色系 + 单一强调色

```less
// 新设计 token
:root {
  // 中性色（灰度）
  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #e5e5e5;
  --gray-300: #d4d4d4;
  --gray-400: #a3a3a3;
  --gray-500: #737373;
  --gray-600: #525252;
  --gray-700: #404040;
  --gray-800: #262626;
  --gray-900: #171717;

  // 强调色（保留品牌色）
  --primary: #25b864;
  --primary-hover: #1fa354;
  --primary-light: #e6f7ef;

  // 功能色（简化）
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;

  // 语义色
  --bg: #ffffff;
  --fg: #171717;
  --border: #e5e5e5;
  --muted: #737373;
}
```

**替代方案**：
- 保留紫色渐变：❌ 不符合极简主义
- 使用蓝色作为强调色：❌ 绿色是现有品牌色

### 2. 移除高开销效果
**决定**：移除以下 CSS 特性

| 特性 | 问题 | 替代方案 |
|------|------|---------|
| `backdrop-filter: blur()` | GPU 开销高，卡顿 | 使用纯色背景 |
| 渐变动画 `@keyframes gradientShift` | 持续重绘 | 静态背景色 |
| 多重阴影 `box-shadow` | 渲染开销 | 简化为单层阴影或边框 |
| `transform: scale()` 悬停效果 | 触发重排 | 仅改变颜色 |

### 3. 布局优化
**决定**：调整间距和比例

```less
// 旧值 → 新值
--sidebar-width: 80px → 64px (更窄，符合极简)
--doc-width: 860px → 720px (更窄，更好的阅读体验)
--padding: 3rem → 2rem (减少留白)
--border-radius: 12px-20px → 4px-8px (更方正)
```

### 4. 动画简化
**决定**：仅保留必要动画

保留：
- Modal 淡入淡出（用户反馈重要）
- 页面切换过渡（体验流畅）

移除：
- 背景渐变动画（无实际价值）
- 按钮悬停缩放（过度设计）
- 侧边栏悬停变色（干扰）

## Risks / Trade-offs

### 风险 1：用户不适应新风格
- **影响**：现有用户可能觉得界面变"无聊"
- **缓解**：
  - 保留品牌色 #25b864，保持一致性
  - 提供旧版主题选项（未来可选）
  - 在 Release Notes 中说明改动原因

### 风险 2：暗黑模式适配
- **影响**：新配色需要适配暗黑模式
- **缓解**：
  - 使用 CSS 变量，便于主题切换
  - 测试暗黑模式所有场景

### Trade-off：设计感 vs 性能
- **选择**：优先性能和可读性，牺牲部分视觉冲击力
- **理由**：笔记应用的核心是内容，而非炫酷效果

## Migration Plan

### 阶段 1：CSS 变量定义
1. 在 `src/index.less` 顶部定义新设计 token
2. 不破坏现有样式

### 阶段 2：逐个文件替换
1. `src/index.less` (全局)
2. `src/pages/file/markdown.less` (编辑器)
3. `src/pages/file/fileList.less` (文件列表)
4. 其他组件样式

### 阶段 3：测试与调优
1. 测试所有平台视觉效果
2. 测试暗黑模式
3. 性能测试（滚动、切换流畅度）

### Rollback 计划
- 如果性能没有改善，保留现有样式
- 使用 Git 回滚到之前的 commit

## Coordination with Editor Enhancements

本次 UI 重构将与 `add-notion-style-editor` 变更协调进行。需要为新增的编辑器功能提供极简风格的样式设计：

### 拖拽手柄样式
```less
.drag-handle {
  position: absolute;
  left: -24px;
  width: 18px;
  height: 18px;
  color: #a3a3a3; // 中性灰
  cursor: grab;
  opacity: 0;
  transition: opacity 0.15s;

  &:hover {
    color: #525252;
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
  }
}
```

### 斜杠命令菜单样式
```less
.slash-menu {
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); // 简化阴影
  padding: 4px;

  .slash-menu-item {
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    color: #171717;

    &:hover, &.selected {
      background: #f5f5f5;
    }
  }
}
```

### 嵌入内容样式
```less
.youtube-wrapper, .pdf-wrapper, .link-preview-card {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  margin: 1rem 0;
  background: white;
}
```

## Open Questions
- ❓ 是否需要提供主题切换选项（极简 vs 原版）？
- ❓ 暗黑模式配色是否需要重新定义？
- ❓ 是否应该先完成编辑器增强，再应用 UI 样式？（建议：并行开发，定期同步）
