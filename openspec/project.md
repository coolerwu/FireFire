# Project Context

## Purpose
FireFire is a local knowledge-building note-taking application providing a WYSIWYG Markdown editor with rich text features. It enables users to organize notes in a folder structure with support for attachments, code blocks with syntax highlighting, and embedded media.

## Tech Stack
- **Frontend**: React 18 with Ant Design UI components
- **Editor**: Tiptap (ProseMirror-based WYSIWYG editor)
- **Desktop**: Electron (Node.js, supports Windows/Mac/Linux)
- **Styling**: Less with custom theming
- **Build**: webpack (customized via react-app-rewired)
- **Syntax Highlighting**: lowlight
- **Language**: JavaScript (JSX)

## Project Conventions

### Code Style
- Path aliases configured: `@`, `assets`, `components`, `pages`, `common`, `utils`
- Ant Design primary color: `#25b864`
- Less module naming pattern: Component-specific .less files alongside .jsx
- File naming: kebab-case for files, PascalCase for React components

### Architecture Patterns
- **Multi-process Electron architecture**:
  - Main process: Entry point (main.js), creates windows, manages IPC
  - Preload script (preload.js): Secure IPC bridge via contextBridge
  - Renderer process: React app with NO direct Node.js access
- **IPC Communication**: All file operations go through `window.electronAPI` exposed by preload
- **File Storage Model**:
  - Notes: `~/.firefire/notebook/**/*.cwjson` (Tiptap JSON format)
  - Attachments: `~/.firefire/attachment/**/*` (mirrors notebook structure)
  - Settings: `~/.firefire/setting.json`
- **Mock API Pattern**: `src/utils/electronAPI.js` provides mocks for browser-only dev mode
- **Context-based state**: Global state via React Context (refresh, settings, curDir, theme)

### Testing Strategy
- Standard React testing with `npm test`
- Manual testing via `npm run estart-dev` (Electron dev mode)

### Git Workflow
- Main branch: `master`
- Commit message style: Chinese, format `YYYYMMDD fix: description`
- Example: `20230409 fix: 支持字体居中、居左、居右，修复当前路径BUG、支持截图粘贴`

## Domain Context
- **Notebook files**: Custom `.cwjson` format (configurable suffix) containing Tiptap document JSON
- **Auto-save**: Debounced writes based on `autoSave` setting (seconds)
- **Theme system**: Supports system/light/dark modes via `nativeTheme.themeSource`
- **Image handling**: Paste/drop copies to attachment directory with UUID filenames, referenced via `file://` URLs
- **Custom nodes**: BiliBili video embeds, syntax-highlighted code blocks

## Important Constraints
- **Security**: `webSecurity: false` required for loading local file:// images
- **Path validation**: All file paths must be within notebook/attachment directories
- **Browser dev mode limitations**: File operations return mock data when running `npm start` without Electron
- **Backward compatibility**: Maintain `.cwjson` format for existing user data

## External Dependencies
- **Ant Design**: UI component library
- **Tiptap**: Core editor framework
- **lowlight**: Syntax highlighting for code blocks
- **electron-builder**: Packaging for macOS/Windows/Linux
- **react-app-rewired**: webpack customization without ejecting
