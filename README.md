# FireFire

[English](#english) | [中文](#中文)

---

## English

### Overview

FireFire is a local-first knowledge management and note-taking application built with Electron. It features a modern WYSIWYG editor powered by Tiptap, with a minimalist design philosophy.

**Platforms**: Windows, macOS, Linux

### Key Features

#### 📝 Modern Editor
- **Slash Commands** - Type `/` to insert content blocks (headings, lists, code blocks, embeds)
- **Drag & Drop** - Visually reorder content blocks
- **Block Menu** - Delete, duplicate, move, or convert blocks
- **Rich Text Editing** - Colors, highlights, underlines, alignment
- **Syntax Highlighting** - Powered by lowlight

#### 🔗 Knowledge Management
- **Tags System** - Use `#tag` to organize notes
  - Auto-extraction and indexing
  - Filter by tags
  - Chinese and English support
- **Internal Links** - Use `[[note name]]` to link notes
  - Auto-completion
  - Link validation
  - Backlinks support
- **Daily Journal** - Logseq-style daily notes with infinite scroll
- **Timeline View** - Browse all notes by edit time

#### 📁 File Management
- Nested folder structure
- **Global Search** - Press `Cmd/Ctrl+K` to search all notes
- Quick note creation
- Auto-save (customizable interval)

#### 🎨 User Interface
- **Minimalist Design** - Clean, distraction-free interface
- **Dark Mode** - Automatic or manual theme switching
- **Custom Themes** - Customize colors to your preference
- **Smooth Animations** - Optimized performance

#### 🔄 Auto-Update
- Automatic update detection (can be disabled)
- Download and install with one click
- Update notifications

#### 🤖 AI Assistant
- **Multiple Providers** - OpenAI, Claude, DeepSeek support
- **Text Polish** - Improve writing quality
- **Translation** - Chinese/English translation
- **Continue Writing** - AI-powered content generation
- **Summarize** - Generate summaries
- **Explain** - Explain selected content

#### ☁️ WebDAV Sync
- **Jianguoyun** - Built-in support for Jianguoyun (坚果云)
- **Nextcloud/ownCloud** - Support for self-hosted solutions
- **Manual/Auto Sync** - Choose your sync mode
- **Upload/Download** - Bidirectional sync

### Planned Features

- [ ] Import/Export Markdown and HTML
- [ ] Graph view for tags and links

### Installation

Download the latest release for your platform:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` package
- **Linux**: `.deb` package

[Download from GitHub Releases](https://github.com/coolerwu/FireFire/releases)

### Development

```bash
# Install dependencies
npm install

# Start React dev server
npm start

# Start Electron in dev mode
npm run estart-dev

# Build for production
npm run build
npm run estart

# Package for distribution
npm run package-mac     # macOS
npm run package-win     # Windows
npm run package-linux   # Linux
```

### Tech Stack

- **Frontend**: React 17, Ant Design 5
- **Editor**: Tiptap 2 (ProseMirror)
- **Desktop**: Electron 20
- **Database**: SQLite (better-sqlite3) with FTS5
- **Styling**: Tailwind CSS, Less

### License

MIT

### Contributing

Issues and pull requests are welcome!

---

## 中文

### 简介

FireFire 是一款本地优先的知识管理和笔记应用，基于 Electron 构建。它采用 Tiptap 编辑器，提供现代化的所见即所得体验，遵循极简主义设计理念。

**支持平台**: Windows、macOS、Linux

### 核心功能

#### 📝 现代化编辑器
- **斜杠命令** - 输入 `/` 快速插入内容块（标题、列表、代码、嵌入内容）
- **拖拽排序** - 可视化拖拽调整内容块顺序
- **块级菜单** - 删除、复制、移动、转换内容块
- **富文本编辑** - 颜色、高亮、下划线、对齐
- **语法高亮** - 基于 lowlight 的代码高亮

#### 🔗 知识管理
- **标签系统** - 使用 `#标签` 组织笔记
  - 自动提取和索引
  - 标签筛选
  - 支持中英文
- **内部链接** - 使用 `[[笔记名称]]` 连接笔记
  - 自动补全
  - 链接验证
  - 反向链接支持
- **每日日记** - Logseq 风格的日记视图，支持无限滚动
- **时间线视图** - 按编辑时间浏览所有文章

#### 📁 文件管理
- 支持文件夹嵌套
- **全局搜索** - 按 `Cmd/Ctrl+K` 搜索所有笔记
- 快速创建笔记
- 自动保存（可自定义间隔）

#### 🎨 用户界面
- **极简设计** - 清爽、专注的界面
- **暗黑模式** - 自动或手动切换主题
- **自定义主题** - 个性化配色方案
- **流畅动画** - 优化的性能表现

#### 🔄 自动更新
- 自动检测更新（可关闭）
- 一键下载安装
- 更新通知

#### 🤖 AI 助手
- **多服务商支持** - OpenAI、Claude、DeepSeek
- **文字润色** - 改善文字表达
- **翻译** - 中英文互译
- **续写** - AI 辅助内容生成
- **总结** - 生成摘要
- **解释** - 解释选中内容

#### ☁️ WebDAV 同步
- **坚果云** - 内置坚果云支持
- **Nextcloud/ownCloud** - 支持自建服务
- **手动/自动同步** - 灵活选择同步模式
- **上传/下载** - 双向同步

### 计划功能

- [ ] 导入/导出 Markdown 和 HTML
- [ ] 标签和链接的关系图谱

### 安装

下载适合你平台的最新版本：
- **Windows**: `.exe` 安装包
- **macOS**: `.dmg` 安装包
- **Linux**: `.deb` 安装包

[从 GitHub Releases 下载](https://github.com/coolerwu/FireFire/releases)

### 开发

```bash
# 安装依赖
npm install

# 启动 React 开发服务器
npm start

# 启动 Electron 开发模式
npm run estart-dev

# 生产环境构建
npm run build
npm run estart

# 打包分发
npm run package-mac     # macOS
npm run package-win     # Windows
npm run package-linux   # Linux
```

### 技术栈

- **前端**: React 17, Ant Design 5
- **编辑器**: Tiptap 2 (ProseMirror)
- **桌面**: Electron 20
- **数据库**: SQLite (better-sqlite3) with FTS5
- **样式**: Tailwind CSS, Less

### 协议

MIT

### 贡献

欢迎提交 Issue 和 Pull Request！

---

## Changelog

| Date | Changes |
|------|---------|
| 2025-11-26 | **v0.6.22** - Added AI assistant (OpenAI/Claude/DeepSeek); Added WebDAV sync (Jianguoyun/Nextcloud); New icon setup |
| 2025-11-26 | **v0.6.21** - Added global search modal (Cmd/Ctrl+K); Improved journal styling (Logseq-style); Fixed workspace switching issue |
| 2025-11-26 | **v0.6.20** - Fixed directory structure: journals folder now correctly located inside notebook/; Removed "所有笔记" sidebar entry; Added delete button in timeline view; New note opens in standalone editor; Added factory reset in settings |
| 2025-11-26 | **v0.6.19** - "所有笔记" now shows all notes (not just journals); New notes use millisecond timestamp as filename; Notes auto-registered to database on creation |
| 2025-11-26 | **v0.6.18** - Added editable title in note editor (click to rename file); Fixed journal path issue in timeline |
| 2025-11-26 | **v0.6.17** - Fixed "New Note" button: now creates note with timestamp filename and auto-opens editor |
| 2025-11-26 | **v0.6.16** - Fixed infinite loop bug in JournalView and Timeline components; Fixed component remounting issue |
| 2025-11-26 | **v0.6.15** - Fixed journal title always using date format instead of content; Fixed duplicate tiptap extension warnings |
| 2025-11-26 | **v0.6.14** - Fixed sidebar "New Note" button, unified journal and note editors (added slash commands, tags, internal links to journal) |
| 2025-11-26 | **v0.6.13** - Fixed workspace init: ensure all subdirectories exist on every startup |
| 2025-11-26 | **v0.6.12** - Fixed workspace init: always ensure all required subdirectories exist |
| 2025-11-26 | **v0.6.11** - Fixed workspace selection: allow non-empty directories as workspace |
| 2025-11-26 | **v0.6.10** - Fixed native module crash: downgraded better-sqlite3 to v9.6.0 (compatible with Electron 25), added asarUnpack config |
| 2025-11-25 | **v0.6.9** - Force remove canvas before electron-rebuild |
| 2025-11-25 | **v0.6.8** - Removed canvas from optionalDependencies |
| 2025-11-25 | **v0.6.7** - Fixed electron-rebuild ignore flag (--ignore="canvas") |
| 2025-11-25 | **v0.6.6** - Skip canvas in electron-rebuild (-o canvas) |
| 2025-11-25 | **v0.6.5** - Fixed npm 9+ compatibility (--omit=optional) |
| 2025-11-25 | **v0.6.4** - Fixed native module crash by upgrading CI to Node.js 18.x |
| 2025-11-25 | **v0.6.3** - Updated CI to use macos-15-intel (macos-13 deprecated) |
| 2025-11-25 | **v0.6.2** - Fixed macOS build for both Intel and Apple Silicon |
| 2025-11-25 | **v0.6.0** - Notion-style UI refactor with Tailwind CSS |
| 2025-11-25 | Added welcome page for first-time setup |
| 2025-11-25 | Fixed slash commands and internal links conflict |
| 2025-11-25 | Optimized tag sidebar, link suggestions, slash menu styles |
| 2025-11-21 | Added daily journal feature (Logseq-style) |
| 2025-11-21 | Added timeline view for browsing notes by edit time |
| 2025-11-21 | Added SQLite database with FTS5 full-text search |
| 2025-11-21 | Implemented quick note creation |
| 2025-11-21 | Implemented internal links system (Wiki-style) |
| 2025-11-21 | Implemented tags system |
| 2025-11-21 | Fixed sidebar layout issues |
| 2025-11-21 | Added auto-update feature |
| 2025-11-21 | Implemented embeds and all Notion-style features |
| 2025-11-21 | Implemented drag & drop and block menu |
| 2025-11-21 | Implemented slash commands (Notion-style) |
| 2025-11-21 | Redesigned UI with minimalist style |
| 2025-11-21 | Upgraded GitHub Actions to v4 |
| 2023-04-09 | Added text alignment and screenshot paste |
| 2023-04-08 | Added save location, dark mode, auto-save |
| 2023-03-27 | Added folder support |
| 2022-08-25 | Optimized package size for Windows and macOS |
| 2022-08-23 | Added dark mode |
| 2022-08-22 | Added Linux support |
| 2022-08-22 | Added font colors |
| 2022-08-22 | Added link navigation |
| 2022-08-20 | Added file search |
| 2022-08-19 | Added BiliBili video embeds |
| 2022-08-18 | Added syntax highlighting |
| 2022-08-18 | Added image drag & drop |
| 2022-08-16 | Added image paste |
| 2022-08-16 | Added file deletion and renaming |
| 2022-08-16 | Initial release for Windows and macOS |
