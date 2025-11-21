## 目标

* 让编辑体验更接近 Typora：内容聚焦、舒适排版、统一主题、细腻交互。

* 保持现有功能与数据结构不变，仅优化样式与少量 UI 行为。

## 范围

* 样式：`src/pages/file/markdown.less`、`src/common/extensions/codeBlockComponent.less`

* 工具条：`src/pages/file/menuBar.jsx`、`src/pages/file/bubble.jsx`

* 配置：`src/common/extensions/index.js`（颜色/链接/光标等细节参数）

## 计划（Plan）

* 文档布局与排版

  * 设置居中版心（`max-width` 760–840px）、左右留白，提升可读性。

  * 统一字体栈：正文无衬线、代码等宽，标题略大一号，增加行高与段落间距。

  * 通过 CSS 变量承载色彩与间距，映射到当前 `theme.token`，明暗主题一致。

* 标题与段落

  * 定义 `h1–h6` 尺度与上下间距，避免过重边框/背景；给锚点与选择态更柔和的提示色。

  * 段落 `margin-block` 与首行缩进不启用，符合 Typora 风格；列表与任务列表增加组间距与复选框样式。

* 引用与分割线

  * 引用左侧细边+浅背景，文字颜色稍降；分割线采用细线+弱色。

* 代码块与行内代码

  * 代码块采用浅色背景、圆角、内边距；`lowlight` 主题配色与暗色模式适配。

  * 行内代码微底色与细描边，不抢占视觉；字体使用 `SFMono/Menlo/Consolas`。

  * 在自定义 NodeView 顶部右上角恢复语言选择器（现有 UI注释），仅在 hover 时显现。

* 表格

  * 表头加粗、底色微弱；单元格统一内边距、斑马纹奇偶行；边框色统一。

* 图片与说明

  * 图片默认居中、最大宽度 100%、圆角与投影轻量；支持 `figcaption` 小号说明文字。

* 链接与颜色系统

  * 链接默认不下划线，hover 显示下划线；颜色来自主题变量，暗色模式自动切换。

* 工具条（顶部与气泡）

  * 统一 icon 尺度、内外边距与背景/边框色；减少彩色按钮，使用主题主色强调。

  * 气泡菜单圆角与阴影弱化，间距更紧凑；颜色选择器用固定色板。

* 光标与选区

  * `Dropcursor` 颜色与粗细统一；选区高亮透明度下调，图片选中边框更柔和。

## 评审（Review）

* 现状问题

  * 编辑区占满宽度、字体/行高偏紧、块间距不均、可读性弱。

  * 标题与正文层级不清，代码块配色与主题不一致；气泡菜单样式跳脱。

  * 图片/表格缺少友好默认样式与说明；链接与选区显得突兀。

* 依赖约束

  * 保持 TipTap 扩展集不变（`StarterKit/Highlight/Image/TaskList/Link/...`）。

  * 与 `antd` 的 `theme.token` 协调色彩；不改动 Electron 文件读写逻辑。

## 行动（Action）

* `src/pages/file/markdown.less`

  * 新增版心与排版变量：`--doc-width/--fg/--bg/--muted/--border/--accent/--radius/--space`。

  * 重写 `.ProseMirror` 的排版（字体、行高、段落/列表/引用/分割线/表格/图片/链接/选区）。

  * 统一代码块与行内代码样式，适配暗色主题；优化任务列表复选框。

* `src/common/extensions/codeBlockComponent.less`

  * 代码块容器样式（圆角、阴影、内边距）；恢复语言选择器位置与显隐规则。

* `src/pages/file/bubble.jsx`、`src/pages/file/menuBar.jsx`

  * 收敛配色与阴影，统一尺寸与间距；颜色选择器采用固定色板，减少随意色值。

* `src/common/extensions/index.js`

  * `Link` 统一 `openOnClick/autolink` 配置；`Dropcursor` 颜色来自主题变量；`TextAlign` 限制到标题与图片。

## 验证

* 准备包含多种元素的示例文档（标题/列表/任务/代码/表格/图片/引用/链接）。

* 明暗主题下逐项核对对齐 Typora 观感；截屏对比；检查持久化与历史回退无回归。

## 交付

* 提交样式与微调逻辑改动，保持无破坏性；提供截图与对比说明。

请确认以上方案，确认后我将按 Action 列表逐项落地并验证。
