<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FireFire is a local knowledge-building note-taking application built with Electron and React. It supports Windows, Mac, and Linux platforms, providing a WYSIWYG Markdown editor with rich text features.

## Development Commands

### React Development
```bash
npm start                 # Start React dev server on http://localhost:3000
npm run build            # Build React app to ./build directory
npm test                 # Run tests
```

**Important**: When running `npm start` (browser-only mode), the app uses mock Electron APIs defined in `src/utils/electronAPI.js`. This allows UI development without Electron. All file operations will log warnings and return mock data.

### Electron Development
```bash
npm run estart           # Start Electron with production build
npm run estart-dev       # Start Electron in dev mode (loads localhost:3000)
npm run all              # Build React and start Electron
```

### Packaging
```bash
npm run package-mac      # Build macOS dmg installer (output to ./target)
npm run package-win      # Build Windows nsis installer
npm run package-linux    # Build Linux deb package
```

## Architecture

### Process Architecture

**Main Process (main.js)**
- Entry point for Electron application
- Creates BrowserWindow with preload script
- Dev mode: loads `http://localhost:3000`
- Production: loads `./build/index.html`
- Initializes IPC handlers via `electron/index.js`

**Preload Script (preload.js)**
- Exposes `window.electronAPI` to renderer using contextBridge
- All file operations go through this secure IPC bridge
- Prevents direct Node.js access from renderer for security

**Renderer Process (src/)**
- React application with custom webpack config via `react-app-rewired`
- Uses Ant Design UI components with custom Less theme
- Built with Tiptap editor (ProseMirror-based)

### Electron Module Organization

Located in `electron/` directory:

- **env.js**: Defines config path (`~/.firefire`)
- **rootFile.js**: Creates config directory
- **settingFile.js**: Manages `~/.firefire/setting.json` with:
  - `notebookPath`: Where `.cwjson` files are stored
  - `attachmentPath`: Where images/attachments are stored
  - `notebookSuffix`: File extension (default `.cwjson`)
  - `themeSource`: Theme setting (system/light/dark)
  - `autoSave`: Auto-save interval in seconds
- **notebookFile.js**: Handles all notebook file operations (CRUD, attachment copying)
- **index.js**: Orchestrates initialization of all IPC handlers

### React Application Structure

**Entry Point (src/index.jsx)**
- Creates Context for global state (refresh, settings, curDir, theme)
- Main component with two tabs: File (文章) and Setting (设置)
- Loads settings and file list on mount/refresh

**File Editor (src/pages/file/)**
- `file.jsx`: Main container with file list and markdown editor
- `fileList.jsx`: Directory/file tree navigation
- `markdown.jsx`: Tiptap editor wrapper with auto-save
- `menuBar.jsx`: Editor toolbar with formatting controls
- `bubble.jsx`: Floating bubble menu for text selection

**Tiptap Editor Configuration (src/common/extensions/)**
- `index.js`: Exports all configured Tiptap extensions
- `codeBlockComponent.jsx`: Custom code block renderer with syntax highlighting (lowlight)
- `biliBiliNode.js`: Custom node for embedding BiliBili videos

**Key Features**
- Files stored as JSON (Tiptap document format) with `.cwjson` extension
- Auto-save functionality triggers on editor update
- Image paste/drop: Copies to attachment directory and uses `file://` URLs
- Theme system: Dynamically applies CSS variables based on settings
- Directory navigation: Supports nested folders within notebook path

### File Storage Model

- **Notebook files**: `~/.firefire/notebook/**/*.cwjson` (JSON format, Tiptap document structure)
- **Attachments**: `~/.firefire/attachment/**/*` (mirrors notebook directory structure)
- When pasting images, they're copied to corresponding attachment path with UUID filenames

### Webpack Customization

`config-overrides.js` configures:
- Ant Design Less loader with custom primary color (#25b864)
- Path aliases: `@`, `assets`, `components`, `pages`, `common`, `utils`
- Babel plugin for Ant Design tree-shaking

## Important Implementation Details

### IPC Communication Pattern
All file operations MUST go through the `electronAPI` imported from `src/utils/electronAPI.js`. This module:
- In Electron: Uses `window.electronAPI` methods defined in preload.js
- In Browser: Uses mock implementations that return dummy data and log warnings
- Never attempt direct file system access from React components

### File Path Handling
- Electron side uses absolute paths with `path.join()`
- React side uses relative paths from notebook root
- Suffix (`.cwjson`) is automatically appended in Electron handlers

### Theme System
Theme configuration in `src/utils/theme.js` generates Ant Design tokens and custom CSS variables. Dark mode is controlled by Electron's `nativeTheme.themeSource`.

### Auto-save Mechanism
Editor updates trigger `persist()` function in `src/utils/cwjsonFileOp.js`, which debounces writes based on `autoSave` setting.

### Security Considerations
- `webSecurity: false` is enabled for loading local file:// images
- `nodeIntegration: true` with preload script limits renderer access
- All file paths are validated to be within notebook/attachment directories
- 中文回复
- 每一次变动都需要更新readme
- 只在 git push 到远程时才更新版本号（package.json、Welcome.jsx、README changelog）