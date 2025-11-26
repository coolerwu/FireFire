# Project Context

## Purpose
FireFire is a local-first knowledge management and note-taking application. It provides a modern WYSIWYG Markdown editor (Tiptap-based) with features inspired by Notion and Logseq: daily journals, internal linking, tags, timeline view, and AI assistance.

## Tech Stack

### Frontend
- **Framework**: React 17 with Ant Design 5 UI components
- **Editor**: Tiptap 2 (ProseMirror-based WYSIWYG editor)
- **Styling**: Tailwind CSS + Less with custom theming
- **Build**: webpack (customized via react-app-rewired)

### Backend (Electron Main Process)
- **Desktop**: Electron 25 (Node.js, supports Windows/Mac/Linux)
- **Database**: SQLite (better-sqlite3 v9.6.0) with FTS5 full-text search
- **Syntax Highlighting**: lowlight

### External Services
- **AI Providers**: OpenAI, Claude (Anthropic), DeepSeek - configurable
- **Cloud Sync**: WebDAV (Jianguoyun, Nextcloud, ownCloud)

### Language
- JavaScript (JSX) - No TypeScript

## Project Conventions

### Code Style
- Path aliases: `@`, `assets`, `components`, `pages`, `common`, `utils`
- Primary color: `#25b864` (green)
- Notion-inspired color palette in Tailwind config
- File naming: kebab-case for files, PascalCase for React components
- Chinese comments preferred

### Architecture Patterns

#### Electron Multi-Process
```
main.js (Main Process)
  ├── electron/index.js      # IPC handler initialization
  ├── electron/dbManager.js  # SQLite database operations
  ├── electron/notebookFile.js  # File CRUD operations
  ├── electron/journalManager.js  # Daily journal logic
  └── electron/webdavSync.js  # Cloud sync

preload.js (Preload Script)
  └── Exposes window.electronAPI via contextBridge

src/ (Renderer Process - React)
  ├── index.jsx              # App entry, Context provider
  ├── pages/                 # View components
  ├── components/            # Shared components
  └── utils/electronAPI.js   # API wrapper with browser mocks
```

#### IPC Communication
- All file/database operations go through `window.electronAPI`
- Defined in `preload.js`, mocked in `src/utils/electronAPI.js` for browser dev

#### File Storage Model
```
~/.firefire/
  ├── setting.json           # App configuration
  ├── firefire.db            # SQLite database
  ├── firefire.db-wal        # WAL journal
  └── [workspace]/           # User's workspace folder
      ├── notebook/
      │   ├── journals/      # Daily journals (YYYY-MM-DD.md)
      │   └── *.md           # Regular notes
      └── attachment/        # Images and files
```

### File Formats
- **Notes**: `.md` files containing Tiptap JSON (not raw Markdown)
- **Journals**: Stored in `notebooks/journals/YYYY-MM-DD.md`
- **Config**: `setting.json` with notebookPath, attachmentPath, AI config, etc.

### State Management
- React Context for global state: `refresh`, `setting`, `curDir`, `theme`, `refreshKey`
- localStorage for AI config sync (temporary - will migrate to setting.json)

## Key Features

### Core
- Daily Journal (Logseq-style infinite scroll)
- Timeline View (all notes by edit time)
- Global Search (Cmd/Ctrl+K)
- Tags (`#tag` syntax, auto-indexed)
- Internal Links (`[[note name]]` syntax)
- Slash Commands (`/` menu)
- Block drag-and-drop

### AI Assistant
- Text operations: Polish, Translate, Continue, Summarize, Explain
- AI Chat with note context feeding (1-30 days)
- Configurable providers and models

### Sync
- WebDAV upload/download
- Manual or scheduled sync

## Development Commands

```bash
# React development (browser mode with mocks)
npm start

# Electron development
npm run estart-dev    # Loads localhost:3000
npm run estart        # Loads production build

# Build and package
npm run build         # Build React
npm run package-mac   # macOS dmg
npm run package-win   # Windows exe
npm run package-linux # Linux deb
```

## Important Constraints

### Security
- `webSecurity: false` for loading local file:// images
- Path validation: all paths must be within workspace
- API keys stored in localStorage (consider secure storage)

### Performance
- SQLite FTS5 for full-text search
- Lazy loading for journal entries
- Debounced auto-save

### Compatibility
- Must maintain Tiptap JSON format in .md files
- Database schema migrations not yet implemented

## External Dependencies

| Package | Purpose | Notes |
|---------|---------|-------|
| antd | UI components | v5 with custom theme |
| @tiptap/* | Editor framework | v2.x |
| better-sqlite3 | SQLite binding | v9.6.0 (Electron 25 compatible) |
| tailwindcss | Utility CSS | Notion-inspired colors |
| lowlight | Syntax highlighting | For code blocks |
| electron-builder | Packaging | macOS/Windows/Linux |
| electron-updater | Auto-update | Requires latest-mac.yml in releases |

## Git Workflow

- Main branch: `master`
- Version format: `0.6.x`
- Commit style: English, descriptive
- CI/CD: GitHub Actions builds for all platforms
- Release: Automatic on push to master
