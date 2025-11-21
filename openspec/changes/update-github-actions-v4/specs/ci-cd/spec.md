# CI/CD Capability

## ADDED Requirements

### Requirement: GitHub Actions 构建支持
系统 SHALL 使用 GitHub Actions 在三个平台（Linux、Windows、macOS）上自动构建发布包。

#### Scenario: 多平台构建成功
- **WHEN** 代码推送到 master 分支
- **THEN** 应触发三个并行构建任务（build-linux、build-win、build-mac）
- **AND** 每个任务应成功生成对应平台的安装包

#### Scenario: 产物上传和下载
- **WHEN** 各平台构建完成
- **THEN** 应使用 `actions/upload-artifact@v4` 上传构建产物
- **AND** release 任务应使用 `actions/download-artifact@v4` 下载所有产物
- **AND** 产物命名应包含版本号（从 package.json 读取）

### Requirement: Actions 版本兼容性
系统 SHALL 使用非废弃版本的 GitHub Actions。

#### Scenario: 使用支持的 Actions 版本
- **WHEN** workflow 执行
- **THEN** 应使用 `actions/upload-artifact@v4` 或更高版本
- **AND** 应使用 `actions/download-artifact@v4` 或更高版本
- **AND** 不应出现废弃警告或错误

### Requirement: 自动发布创建
系统 SHALL 在所有平台构建成功后自动创建 GitHub Release。

#### Scenario: Release 创建成功
- **WHEN** 所有平台构建完成
- **THEN** 应创建新的 GitHub Release（tag: v{version}）
- **AND** 应上传所有平台的安装包到 Release
- **AND** Release 应包含 .dmg（macOS）、.exe（Windows）、.deb（Linux）文件
