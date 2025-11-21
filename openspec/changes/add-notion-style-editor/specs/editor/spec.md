# Editor Capability

## ADDED Requirements

### Requirement: 斜杠命令快速插入
系统 SHALL 支持通过斜杠命令（`/`）快速插入各种块级内容。

#### Scenario: 触发斜杠命令菜单
- **WHEN** 用户在空行输入 `/`
- **THEN** 应显示命令菜单
- **AND** 菜单应包含所有可用命令（标题、列表、媒体、嵌入等）
- **AND** 菜单应定位在光标位置附近

#### Scenario: 搜索过滤命令
- **WHEN** 用户输入 `/code`
- **THEN** 菜单应仅显示包含"code"关键词的命令（如"代码块"）
- **AND** 搜索应不区分大小写
- **AND** 应支持拼音首字母搜索（如 `/dm` 匹配"代码"）

#### Scenario: 执行命令插入块
- **WHEN** 用户选择命令（键盘方向键或鼠标点击）
- **THEN** 应删除 `/` 字符和搜索文本
- **AND** 应在当前位置插入对应的块（如标题、代码块）
- **AND** 光标应移动到新插入块的编辑位置

#### Scenario: 取消斜杠命令
- **WHEN** 用户按 Esc 键或点击菜单外部
- **THEN** 菜单应关闭
- **AND** `/` 字符应保留在编辑器中

### Requirement: 拖拽排序
系统 SHALL 支持通过拖拽重新排列块级内容。

#### Scenario: 显示拖拽手柄
- **WHEN** 用户悬停在块级元素上（段落、标题、列表、代码块等）
- **THEN** 应在块左侧显示拖拽手柄（⋮⋮ 图标）
- **AND** 手柄位置应在块左侧 `-24px`
- **AND** 手柄应垂直居中对齐块内容

#### Scenario: 拖拽块并移动
- **WHEN** 用户拖拽手柄到新位置
- **THEN** 被拖拽的块应显示半透明状态
- **AND** 鼠标悬停位置应显示蓝色插入指示线
- **AND** 释放鼠标后，块应移动到指示线位置
- **AND** 文档结构应正确更新

#### Scenario: 拖拽不同类型的块
- **WHEN** 用户拖拽各种类型的块（标题、段落、列表、代码块、图片）
- **THEN** 所有块类型都应支持拖拽
- **AND** 拖拽后块的格式和内容应保持不变
- **AND** 嵌套结构（如列表项）应正确处理

### Requirement: 块级操作菜单
系统 SHALL 提供块级操作菜单，便于快速编辑和转换块。

#### Scenario: 打开块操作菜单
- **WHEN** 用户点击拖拽手柄
- **THEN** 应弹出操作菜单
- **AND** 菜单应包含：删除、复制、转换为、上移、下移等操作
- **AND** 菜单应定位在手柄附近

#### Scenario: 删除块
- **WHEN** 用户点击"删除"操作
- **THEN** 当前块应被删除
- **AND** 光标应移动到上一个或下一个块

#### Scenario: 复制块
- **WHEN** 用户点击"复制"操作
- **THEN** 当前块应被复制到剪贴板（或在下方插入副本）
- **AND** 应显示成功提示

#### Scenario: 转换块类型
- **WHEN** 用户点击"转换为" → "标题 1"
- **THEN** 当前段落应转换为一级标题
- **AND** 内容应保持不变
- **AND** 支持的转换：段落 ↔ 标题 ↔ 列表

#### Scenario: 上移/下移块
- **WHEN** 用户点击"上移"
- **THEN** 当前块应与上一个块交换位置
- **AND** 如果已是第一个块，操作应被禁用

### Requirement: YouTube 视频嵌入
系统 SHALL 支持嵌入 YouTube 视频播放器。

#### Scenario: 通过斜杠命令插入 YouTube
- **WHEN** 用户输入 `/youtube` 并选择命令
- **THEN** 应提示用户输入 YouTube URL
- **AND** 应解析 URL 并提取视频 ID
- **AND** 应插入 YouTube 播放器（iframe）

#### Scenario: 支持多种 YouTube URL 格式
- **WHEN** 用户输入以下任意格式的 URL：
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`
- **THEN** 应正确提取视频 ID
- **AND** 应显示嵌入播放器

#### Scenario: YouTube 播放器交互
- **WHEN** 用户点击播放器
- **THEN** 视频应正常播放
- **AND** 播放器应支持全屏、音量控制等标准功能
- **AND** 播放器应响应式适配编辑器宽度

### Requirement: PDF 文档嵌入
系统 SHALL 支持嵌入和预览 PDF 文档。

#### Scenario: 上传并插入 PDF
- **WHEN** 用户输入 `/pdf` 并选择命令
- **THEN** 应打开文件选择器
- **AND** 用户选择 PDF 文件后，应复制到 `~/.firefire/attachment/` 目录
- **AND** 应在编辑器中插入 PDF 预览组件

#### Scenario: PDF 预览功能
- **WHEN** 用户查看嵌入的 PDF
- **THEN** 应显示 PDF 的第一页
- **AND** 应提供翻页控件（上一页/下一页）
- **AND** 应显示当前页码和总页数（如 "1 / 5"）

#### Scenario: PDF 性能优化
- **WHEN** 文档包含多个 PDF 嵌入
- **THEN** 应仅渲染可视区域的 PDF（懒加载）
- **AND** 每个 PDF 应仅加载当前显示的页面
- **AND** 大型 PDF 加载时应显示加载指示器

### Requirement: 网页链接预览
系统 SHALL 支持网页链接的卡片预览。

#### Scenario: 插入网页预览
- **WHEN** 用户输入 `/web` 或 `/link` 并选择命令
- **THEN** 应提示用户输入网页 URL
- **AND** 应获取网页的 meta 信息（标题、描述、图片、favicon）
- **AND** 应显示为卡片预览（包含缩略图、标题、描述）

#### Scenario: 网页预览卡片内容
- **WHEN** 用户查看网页预览卡片
- **THEN** 应显示网页标题
- **AND** 应显示网页描述（如果有）
- **AND** 应显示网页缩略图（如果有）
- **AND** 应显示网站域名
- **AND** 点击卡片应在新标签页打开链接

#### Scenario: 网页预览失败处理
- **WHEN** 无法获取网页 meta 信息（网络错误、CORS 限制）
- **THEN** 应显示降级 UI（纯文本链接或简化卡片）
- **AND** 应显示错误提示（如"无法加载预览"）
- **AND** 链接应仍然可点击

### Requirement: BiliBili 视频嵌入优化
系统 SHALL 优化现有的 BiliBili 视频嵌入功能。

#### Scenario: 通过斜杠命令插入 BiliBili
- **WHEN** 用户输入 `/bilibili` 并选择命令
- **THEN** 应提示用户输入 BiliBili 视频链接
- **AND** 应解析链接并插入播放器
- **AND** 播放器样式应符合极简主义设计

#### Scenario: BiliBili 播放器响应式
- **WHEN** 用户调整窗口大小
- **THEN** BiliBili 播放器应自动调整尺寸
- **AND** 宽高比应保持为 16:9
- **AND** 在窄屏幕上应正确显示

### Requirement: 编辑器性能优化
系统 SHALL 确保新增功能不影响编辑器性能。

#### Scenario: 拖拽流畅性
- **WHEN** 用户拖拽块
- **THEN** 拖拽过程应流畅无卡顿（≥ 60fps）
- **AND** 不应触发不必要的重渲染
- **AND** 大型文档（>100 块）中拖拽应同样流畅

#### Scenario: 嵌入内容懒加载
- **WHEN** 文档包含多个嵌入内容（YouTube、PDF、网页预览）
- **THEN** 应仅渲染可视区域的嵌入内容
- **AND** 滚动时应动态加载/卸载嵌入内容
- **AND** 首次加载时间应 < 2 秒

#### Scenario: 斜杠命令搜索性能
- **WHEN** 用户在斜杠命令菜单中输入搜索
- **THEN** 搜索结果应实时更新（无延迟感）
- **AND** 搜索应使用节流（debounce）优化
- **AND** 命令列表过滤应 < 50ms

### Requirement: 向后兼容性
系统 SHALL 保持与现有功能的兼容性。

#### Scenario: 现有文档兼容
- **WHEN** 用户打开现有的 `.cwjson` 文档
- **THEN** 所有现有内容应正常显示（标题、列表、图片、代码块、B站视频）
- **AND** 不应出现格式错误或数据丢失
- **AND** 自动保存功能应正常工作

#### Scenario: 图片粘贴功能保留
- **WHEN** 用户粘贴图片
- **THEN** 图片应复制到 `~/.firefire/attachment/` 目录
- **AND** 应使用 `file://` URL 引用
- **AND** 与拖拽功能不应冲突

#### Scenario: 现有扩展功能保留
- **WHEN** 用户使用现有功能（字符数统计、高亮、文本对齐、颜色、下划线、任务列表）
- **THEN** 所有现有扩展应正常工作
- **AND** 与新增功能不应冲突
