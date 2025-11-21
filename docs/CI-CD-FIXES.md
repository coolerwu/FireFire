# CI/CD 构建修复说明

## 问题描述

在 Windows CI/CD 环境中构建时遇到以下错误：

1. **better-sqlite3** - 无法找到预编译的二进制文件，尝试从源码编译失败
2. **canvas** - 缺少 GTK 依赖，从源码编译失败（实际上项目不需要 canvas）

## 解决方案

### 1. 更新 GitHub Actions Workflow (`.github/workflows/build.yml`)

**Windows 构建步骤改进：**

```yaml
- name: Setup Python for node-gyp
  uses: actions/setup-python@v4
  with:
    python-version: '3.11'

- name: Install Windows Build Tools
  run: |
    npm install --global windows-build-tools --vs2015
  continue-on-error: true

- name: Install dependencies with prebuild
  run: |
    npm install --prefer-offline --no-audit
  env:
    npm_config_build_from_source: false
```

**说明：**
- 添加 Python 3.11 支持（node-gyp 需要）
- 尝试安装 Windows 构建工具（但允许失败继续）
- 使用 `npm_config_build_from_source: false` 强制使用预编译二进制文件

### 2. 创建智能 Postinstall 脚本 (`scripts/postinstall.js`)

新的 postinstall 脚本能够：
- 检测操作系统平台
- 在 Windows 上优先尝试使用预编译的二进制文件
- 只在必要时才从源码编译
- 提供友好的错误信息和手动修复命令

**使用方法：**
```bash
# 自动运行（在 npm install 后）
npm install

# 手动重新构建原生模块
npm run rebuild-native
```

### 3. 配置 `.npmrc` 优先使用预编译二进制

添加以下配置：
```
# Prefer prebuilt binaries over building from source
build_from_source=false

# better-sqlite3 settings
better_sqlite3_binary_host=https://github.com/WiseLibs/better-sqlite3/releases/download/
```

### 4. 添加 `prebuild-install` 依赖

在 `package.json` 中添加：
```json
"dependencies": {
  "prebuild-install": "^7.1.2"
}
```

这个工具能够自动下载和安装预编译的二进制文件。

## 新增命令

### `npm run rebuild-native`

手动重新编译原生模块（当自动安装失败时使用）：

```bash
npm run rebuild-native
```

## 测试验证

### 本地测试

**Mac/Linux:**
```bash
rm -rf node_modules
npm install
npm run estart-dev
```

**Windows:**
```powershell
Remove-Item -Recurse -Force node_modules
npm install
npm run estart-dev
```

### CI/CD 测试

提交代码后，检查 GitHub Actions 中的以下任务：
- `build-win` - Windows 构建应该成功
- `build-mac` - macOS 构建应该成功
- `build-linux` - Linux 构建应该成功

## 常见问题

### Q: 为什么 Canvas 会被尝试编译？

A: 即使项目不直接依赖 canvas，某些传递依赖可能包含它。通过配置 `build_from_source=false` 和改进的 postinstall 脚本，我们避免了不必要的编译。

### Q: Windows 上 better-sqlite3 仍然编译失败怎么办？

A: 运行以下命令手动使用预编译版本：
```bash
cd node_modules/better-sqlite3
npx prebuild-install --runtime electron --target 20.3.12
```

### Q: 如何查看详细的构建日志？

A: 在 GitHub Actions 页面点击失败的任务，查看详细日志。本地可以使用：
```bash
DEBUG=electron-builder npm install
```

## 技术细节

### better-sqlite3 预编译二进制文件

better-sqlite3 为以下平台提供预编译版本：
- Windows (x64)
- macOS (x64, arm64)
- Linux (x64, arm64)

对于 Electron，需要针对 Electron 的 ABI 版本编译。我们的项目使用 Electron 20.3.12。

### electron-rebuild

`electron-rebuild` 工具会：
1. 查找所有原生模块
2. 使用 Electron 的 headers 重新编译
3. 替换 Node.js 版本的编译结果

只需重新编译 better-sqlite3，使用 `-w` 参数：
```bash
electron-rebuild -f -w better-sqlite3
```

## 参考资料

- [better-sqlite3 安装文档](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/troubleshooting.md)
- [electron-rebuild 文档](https://github.com/electron/rebuild)
- [GitHub Actions 与 Windows 构建工具](https://github.com/nodejs/node-gyp#on-windows)
